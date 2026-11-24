export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  data?: never;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

