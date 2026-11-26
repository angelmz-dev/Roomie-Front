import type { ApiSuccessResponse } from "../../../types/api.types";

export interface DiscoveryCandidate {
  id: string;
  userId: string;
  fullName: string;
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

export interface DiscoveryFeedMeta {
  page: number;
  limit: number;
  returned: number;
}

export interface DiscoveryFeedResponse
  extends ApiSuccessResponse<DiscoveryCandidate[]> {
  meta: DiscoveryFeedMeta;
}

export interface DiscoveryFeedQueryParams {
  page?: number;
  limit?: number;
}

export type InteractionType = "LIKE" | "DISLIKE";

export interface CreateInteractionRequest {
  toUserId: string;
  type: InteractionType;
}

export interface InteractionRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: InteractionType;
  createdAt: string;
}

export interface MatchRecord {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface CreateInteractionResponseData {
  interaction: InteractionRecord;
  isMatch: boolean;
  match?: MatchRecord;
}

export interface MatchEvent {
  match: MatchRecord;
  candidate: DiscoveryCandidate;
}

export type DiscoveryFeedStatus = "loading" | "ready" | "empty" | "error";

