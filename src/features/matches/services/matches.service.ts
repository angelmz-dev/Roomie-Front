import { apiClient } from "../../../lib/axios";
import { normalizeApiError } from "../../../lib/api-error";
import type { ApiSuccessResponse } from "../../../types/api.types";
import type { MatchItem } from "../types/matches.types";

export async function getMyMatches(): Promise<ApiSuccessResponse<MatchItem[]>> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<MatchItem[]>>(
      "/interactions/matches/me",
    );
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(
      error,
      "No se pudieron cargar tus coincidencias. Intenta nuevamente.",
    );
  }
}

