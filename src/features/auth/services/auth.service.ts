import { apiClient } from "../../../lib/axios";
import { normalizeApiError } from "../../../lib/api-error";
import type { ApiSuccessResponse } from "../../../types/api.types";
import type {
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
} from "../types/auth.types";

export async function login(
  payload: LoginRequest,
): Promise<ApiSuccessResponse<LoginResponseData>> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<LoginResponseData>
    >("/users/login", payload);
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo iniciar sesión.");
  }
}

export async function register(
  payload: RegisterRequest,
): Promise<ApiSuccessResponse<RegisterResponseData>> {
  try {
    const { data } = await apiClient.post<
      ApiSuccessResponse<RegisterResponseData>
    >("/users/register", payload);
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(error, "No se pudo completar el registro.");
  }
}

