import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  clearSession,
  getJwtExpirationMs,
  getStoredSession,
  saveSession,
  type AuthSession,
} from "../../../lib/auth-storage";
import { registerUnauthorizedHandler } from "../../../lib/axios";
import { login as loginRequest } from "../services/auth.service";
import type { LoginRequest } from "../types/auth.types";
import { AuthContext, type AuthContextValue } from "./AuthContext";

const MAX_TIMEOUT_MS = 2_147_483_647;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );
  const isInitializing = false;

  const logout = useCallback((): void => {
    clearSession();
    setSession(null);
  }, []);

  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    const response = await loginRequest(payload);
    const nextSession: AuthSession = {
      token: response.data.token,
      user: response.data.user,
    };

    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  // Synchronize React auth state when Axios detects a 401 on the active token
  useEffect(() => {
    const unregister = registerUnauthorizedHandler((rejectedToken: string) => {
      setSession((currentSession) =>
        currentSession?.token === rejectedToken ? null : currentSession,
      );
    });

    return unregister;
  }, []);

  // Automatically close the session when the active JWT reaches its `exp` claim.
  // Note: Local decoding is only a UX convenience; cryptographic validation occurs on the backend.
  useEffect(() => {
    const activeToken = session?.token;
    if (!activeToken) {
      return;
    }

    let timeoutId: number | undefined;

    const scheduleExpirationCheck = (): void => {
      const expirationMs = getJwtExpirationMs(activeToken);
      if (expirationMs === null) {
        clearSession();
        setSession((currentSession) =>
          currentSession?.token === activeToken ? null : currentSession,
        );
        return;
      }

      const remainingMs = expirationMs - Date.now();
      if (remainingMs <= 0) {
        clearSession();
        setSession((currentSession) =>
          currentSession?.token === activeToken ? null : currentSession,
        );
        return;
      }

      const delayMs = Math.min(remainingMs, MAX_TIMEOUT_MS);
      timeoutId = window.setTimeout(scheduleExpirationCheck, delayMs);
    };

    scheduleExpirationCheck();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isInitializing,
      login,
      logout,
    }),
    [session, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

