import axios from "axios";

export type ApiErrorKind = "http" | "network" | "timeout" | "unexpected";

export interface ApiClientErrorOptions {
  status?: number;
  kind: ApiErrorKind;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  cause?: unknown;
}

export class ApiClientError extends Error {
  public readonly status?: number;
  public readonly kind: ApiErrorKind;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ApiClientError";
    this.status = options.status;
    this.kind = options.kind;
    this.isNetworkError = options.isNetworkError ?? options.kind === "network";
    this.isTimeout = options.isTimeout ?? options.kind === "timeout";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractBackendErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }

  if (typeof data.error === "string" && data.error.trim().length > 0) {
    return data.error.trim();
  }

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message.trim();
  }

  return null;
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage = "Ocurrió un error inesperado.",
): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiClientError(
        "La solicitud tardó demasiado tiempo. Intenta nuevamente.",
        {
          kind: "timeout",
          isTimeout: true,
          cause: error,
        },
      );
    }

    if (error.response) {
      const backendMessage = extractBackendErrorMessage(error.response.data);
      return new ApiClientError(backendMessage ?? fallbackMessage, {
        status: error.response.status,
        kind: "http",
        cause: error,
      });
    }

    return new ApiClientError(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
      {
        kind: "network",
        isNetworkError: true,
        cause: error,
      },
    );
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return new ApiClientError(error.message.trim(), {
      kind: "unexpected",
      cause: error,
    });
  }

  return new ApiClientError(fallbackMessage, {
    kind: "unexpected",
    cause: error,
  });
}

