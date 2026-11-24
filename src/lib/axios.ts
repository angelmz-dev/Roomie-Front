import axios from "axios";

const REQUEST_TIMEOUT_MS = 10_000;

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

const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
});

