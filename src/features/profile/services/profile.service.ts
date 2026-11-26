import { apiClient } from "../../../lib/axios";
import { normalizeApiError } from "../../../lib/api-error";
import type { ApiSuccessResponse } from "../../../types/api.types";
import type {
  CreateLifestyleProfileRequest,
  LifestyleProfile,
  UpdateLifestyleProfileRequest,
} from "../types/profile.types";

export async function getMyProfile(): Promise<
  ApiSuccessResponse<LifestyleProfile>
> {
  try {
    const { data } =
      await apiClient.get<ApiSuccessResponse<LifestyleProfile>>("/profiles/me");
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo consultar tu perfil.");
  }
}

export async function createProfile(
  payload: CreateLifestyleProfileRequest,
): Promise<ApiSuccessResponse<LifestyleProfile>> {
  try {
    const { data } = await apiClient.post<ApiSuccessResponse<LifestyleProfile>>(
      "/profiles",
      payload,
    );
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo crear tu perfil.");
  }
}

export async function updateMyProfile(
  payload: UpdateLifestyleProfileRequest,
): Promise<ApiSuccessResponse<LifestyleProfile>> {
  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<LifestyleProfile>
    >("/profiles/me", payload);
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo actualizar tu perfil.");
  }
}

export async function uploadProfileAvatar(
  file: File,
): Promise<ApiSuccessResponse<LifestyleProfile>> {
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const { data } = await apiClient.patch<
      ApiSuccessResponse<LifestyleProfile>
    >("/profiles/me/avatar", formData);
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(
      error,
      "No se pudo subir la fotografía de perfil.",
    );
  }
}

