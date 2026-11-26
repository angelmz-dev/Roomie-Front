import { createContext } from "react";
import type { LifestyleProfile, ProfileStatus } from "../types/profile.types";

export interface ProfileContextValue {
  profile: LifestyleProfile | null;
  status: ProfileStatus;
  error: string | null;
  refetchProfile: () => Promise<void>;
  syncProfile: (nextProfile: LifestyleProfile) => boolean;
}

export const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

