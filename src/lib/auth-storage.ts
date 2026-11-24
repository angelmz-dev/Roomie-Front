import type { AuthUser } from "../features/auth/types/auth.types";

const AUTH_SESSION_STORAGE_KEY = "roomie_match_auth_session";

export interface AuthSession {
  token: string;
  user: AuthUser;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.fullName)
  );
}

function decodeBase64Url(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(paddingLength);
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Decodes the JWT payload locally to read its `exp` claim (in milliseconds).
 * NOTE: Client-side decoding inspects structure and expiration only; it does NOT
 * verify the cryptographic signature, which is always enforced by the backend.
 */
export function getJwtExpirationMs(token: string): number | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  const payloadSegment = segments[1];
  if (!payloadSegment || payloadSegment.trim().length === 0) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (decodedPayload === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(decodedPayload);
    if (!isRecord(parsed) || typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }

    return parsed.exp * 1000;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, nowMs: number = Date.now()): boolean {
  const expirationMs = getJwtExpirationMs(token);
  if (expirationMs === null) {
    return true;
  }

  return expirationMs <= nowMs;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage access errors to avoid crashing the application
  }
}

export function saveSession(session: AuthSession): void {
  if (!isNonEmptyString(session.token) || !isValidAuthUser(session.user)) {
    return;
  }

  try {
    const payload: AuthSession = {
      token: session.token,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
      },
    };
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage access/quota errors so runtime flow continues safely
  }
}

export function getStoredSession(): AuthSession | null {
  let rawSession: string | null;

  try {
    rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }

  if (rawSession === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawSession);
    if (
      !isRecord(parsed) ||
      !isNonEmptyString(parsed.token) ||
      !isValidAuthUser(parsed.user)
    ) {
      clearSession();
      return null;
    }

    if (isJwtExpired(parsed.token)) {
      clearSession();
      return null;
    }

    return {
      token: parsed.token,
      user: {
        id: parsed.user.id,
        email: parsed.user.email,
        fullName: parsed.user.fullName,
      },
    };
  } catch {
    clearSession();
    return null;
  }
}

export function getStoredToken(): string | null {
  const session = getStoredSession();
  return session ? session.token : null;
}
