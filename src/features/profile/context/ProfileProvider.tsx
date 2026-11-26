import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ApiClientError } from "../../../lib/api-error";
import { useAuth } from "../../auth/hooks/useAuth";
import { getMyProfile } from "../services/profile.service";
import type { LifestyleProfile, ProfileStatus } from "../types/profile.types";
import { ProfileContext, type ProfileContextValue } from "./ProfileContext";

interface ProfileProviderProps {
  children: ReactNode;
}

interface InternalProfileState {
  ownerUserId: string | null;
  status: ProfileStatus;
  profile: LifestyleProfile | null;
  error: string | null;
}

const INITIAL_STATE: InternalProfileState = {
  ownerUserId: null,
  status: "idle",
  profile: null,
  error: null,
};

export function ProfileProvider({
  children,
}: ProfileProviderProps): ReactElement {
  const { isAuthenticated, user } = useAuth();
  const activeUserId = isAuthenticated && user ? user.id : null;

  const [state, setState] = useState<InternalProfileState>(INITIAL_STATE);

  const activeUserIdRef = useRef<string | null>(activeUserId);
  const versionRef = useRef<number>(0);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const executeProfileQuery = useCallback(
    async (
      targetUserId: string,
      requestVersion: number,
      isCancelledCheck?: () => boolean,
    ): Promise<void> => {
      try {
        const response = await getMyProfile();

        if (
          isCancelledCheck?.() ||
          activeUserIdRef.current !== targetUserId ||
          versionRef.current !== requestVersion ||
          response.data.userId !== targetUserId
        ) {
          return;
        }

        setState({
          ownerUserId: targetUserId,
          status: "ready",
          profile: response.data,
          error: null,
        });
      } catch (err: unknown) {
        if (
          isCancelledCheck?.() ||
          activeUserIdRef.current !== targetUserId ||
          versionRef.current !== requestVersion
        ) {
          return;
        }

        if (err instanceof ApiClientError && err.kind === "http") {
          if (err.status === 404) {
            setState({
              ownerUserId: targetUserId,
              status: "missing",
              profile: null,
              error: null,
            });
            return;
          }

          if (err.status === 401) {
            // Axios response interceptor handles active session invalidation
            return;
          }
        }

        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "No se pudo cargar tu perfil. Intenta nuevamente.";

        setState({
          ownerUserId: targetUserId,
          status: "error",
          profile: null,
          error: errorMessage,
        });
      }
    },
    [],
  );

  useEffect(() => {
    activeUserIdRef.current = activeUserId;

    if (!activeUserId) {
      // Invalidate any in-flight request belonging to a previous session
      versionRef.current += 1;
      return;
    }

    let isCancelled = false;
    const requestVersion = ++versionRef.current;
    void executeProfileQuery(activeUserId, requestVersion, () => isCancelled);

    return () => {
      isCancelled = true;
      versionRef.current += 1;
    };
  }, [activeUserId, executeProfileQuery]);

  const refetchProfile = useCallback(async (): Promise<void> => {
    const targetUserId = activeUserIdRef.current;
    if (!targetUserId) {
      return;
    }

    const requestVersion = ++versionRef.current;
    setState((prev) => ({
      ownerUserId: targetUserId,
      status: "loading",
      profile: prev.ownerUserId === targetUserId ? prev.profile : null,
      error: null,
    }));

    await executeProfileQuery(targetUserId, requestVersion);
  }, [executeProfileQuery]);

  const syncProfile = useCallback((nextProfile: LifestyleProfile): boolean => {
    const currentUserId = activeUserIdRef.current;
    if (!currentUserId || nextProfile.userId !== currentUserId) {
      return false;
    }

    // Bump version so any older in-flight GET cannot overwrite this mutation
    versionRef.current += 1;

    setState({
      ownerUserId: currentUserId,
      status: "ready",
      profile: nextProfile,
      error: null,
    });
    return true;
  }, []);

  // Derive effective state synchronously so account switches or logout never
  // expose stale profile data for even a single render frame.
  const effectiveState = useMemo<
    Pick<ProfileContextValue, "profile" | "status" | "error">
  >(() => {
    if (!activeUserId) {
      return {
        profile: null,
        status: "idle",
        error: null,
      };
    }

    if (state.ownerUserId !== activeUserId) {
      return {
        profile: null,
        status: "loading",
        error: null,
      };
    }

    return {
      profile: state.profile,
      status: state.status,
      error: state.error,
    };
  }, [activeUserId, state]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: effectiveState.profile,
      status: effectiveState.status,
      error: effectiveState.error,
      refetchProfile,
      syncProfile,
    }),
    [effectiveState, refetchProfile, syncProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
