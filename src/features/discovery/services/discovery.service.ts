import { apiClient } from "../../../lib/axios";
import { normalizeApiError } from "../../../lib/api-error";
import type { ApiSuccessResponse } from "../../../types/api.types";
import type {
  CreateInteractionRequest,
  CreateInteractionResponseData,
  DiscoveryFeedQueryParams,
  DiscoveryFeedResponse,
} from "../types/discovery.types";

export const DEFAULT_DISCOVERY_LIMIT = 10;

export async function getDiscoveryFeed(
  params?: DiscoveryFeedQueryParams,
): Promise<DiscoveryFeedResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_DISCOVERY_LIMIT;

  try {
    const { data } = await apiClient.get<DiscoveryFeedResponse>(
      "/discovery/feed",
      {
        params: { page, limit },
      },
    );
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(
      error,
      "No se pudo cargar el feed de candidatos compatibles.",
    );
  }
}

export async function createInteraction(
  payload: CreateInteractionRequest,
): Promise<ApiSuccessResponse<CreateInteractionResponseData>> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<CreateInteractionResponseData>
    >("/interactions", payload);
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo registrar tu interacción.");
  }
}

