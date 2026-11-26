export interface LifestyleProfile {
  id: string;
  userId: string;
  minBudget: number;
  maxBudget: number;
  preferredZones: string[];
  hasPets: boolean;
  toleratesPets: boolean;
  isSmoker: boolean;
  toleratesSmokers: boolean;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLifestyleProfileRequest {
  minBudget: number;
  maxBudget: number;
  preferredZones: string[];
  hasPets: boolean;
  toleratesPets: boolean;
  isSmoker: boolean;
  toleratesSmokers: boolean;
  bio?: string;
}

export interface UpdateLifestyleProfileRequest {
  minBudget?: number;
  maxBudget?: number;
  preferredZones?: string[];
  hasPets?: boolean;
  toleratesPets?: boolean;
  isSmoker?: boolean;
  toleratesSmokers?: boolean;
  bio?: string | null;
}

export type ProfileStatus = "idle" | "loading" | "ready" | "missing" | "error";

export interface ProfileNavigationState {
  avatarWarning?: string;
}

