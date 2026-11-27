export interface MatchedUserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  preferredZones: string[];
  bio: string | null;
}

export interface MatchItem {
  matchId: string;
  createdAt: string;
  matchedUser: MatchedUserSummary;
}

export type MatchesStatus = "loading" | "ready" | "empty" | "error";

