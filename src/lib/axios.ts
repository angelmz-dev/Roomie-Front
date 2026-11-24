import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { clearSession, getStoredToken } from "./auth-storage";

const REQUEST_TIMEOUT_MS = 10_000;
const PUBLIC_AUTH_ENDPOINTS = ["/users/login", "/users/register"] as const;

type UnauthorizedHandler = (rejectedToken: string) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler,
): () => void {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

function resolveApiBaseUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new Error(
      "La variable de entorno VITE_API_URL no está definida. Configúrala en .env.local.",
    );
  }

  const trimmedUrl = rawUrl.trim();

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Protocolo no soportado");
    }
  } catch {
    throw new Error(
      "La variable de entorno VITE_API_URL no contiene una URL HTTP/HTTPS válida.",
    );
  }

  return trimmedUrl;
}

function extractNormalizedPath(url?: string): string {
  if (!url) {
    return "";
  }

  const withoutQuery = url.split("?")[0]?.split("#")[0] ?? "";

  try {
    const parsed = new URL(withoutQuery);
    return parsed.pathname.replace(/\/+$/, "");
  } catch {
    const withLeadingSlash = withoutQuery.startsWith("/")
      ? withoutQuery
      : `/${withoutQuery}`;
    return withLeadingSlash.replace(/\/+$/, "");
  }
}

function isPublicAuthRequest(url?: string): boolean {
  const path = extractNormalizedPath(url);
  return PUBLIC_AUTH_ENDPOINTS.some(
    (endpoint) => path === endpoint || path.endsWith(endpoint),
  );
}

function extractBearerToken(headers: unknown): string | null {
  let rawAuthHeader: unknown = null;

  if (headers instanceof AxiosHeaders) {
    rawAuthHeader = headers.get("Authorization");
  } else if (typeof headers === "object" && headers !== null) {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === "authorization") {
        rawAuthHeader = value;
        break;
      }
    }
  }

  if (typeof rawAuthHeader !== "string") {
    return null;
  }

  const trimmed = rawAuthHeader.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
}

const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (isPublicAuthRequest(config.url)) {
      return config;
    }

    const token = getStoredToken();
    if (token) {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isPublicAuthRequest(error.config?.url)
    ) {
      const requestToken = extractBearerToken(error.config?.headers);
      const currentToken = getStoredToken();

      // Invalidate only if the 401 belongs to the currently active session token
      if (requestToken !== null && currentToken === requestToken) {
        clearSession();
        unauthorizedHandler?.(requestToken);
      }
    }

    return Promise.reject(error);
  },
);
