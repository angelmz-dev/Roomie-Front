export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
] as const;

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const SUGGESTED_ZONES = [
  "Centro Histórico",
  "Juriquilla",
  "Álamos",
  "El Refugio",
  "Zibatá",
  "Milenio III",
  "Jurica",
  "Cimatario",
  "Carretas",
  "Jardines de la Hacienda",
  "Corregidora",
  "Lomas del Marqués",
] as const;

export const DEFAULT_LIFESTYLE_HABITS = {
  hasPets: false,
  toleratesPets: true,
  isSmoker: false,
  toleratesSmokers: false,
} as const;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function getZoneComparisonKey(zone: string): string {
  return collapseSpaces(zone).toLocaleLowerCase("es-MX");
}

function getZoneCanonicalLookupKey(zone: string): string {
  return stripAccents(collapseSpaces(zone)).toLocaleLowerCase("es-MX");
}

const CANONICAL_ZONE_MAP: ReadonlyMap<string, string> = new Map(
  SUGGESTED_ZONES.map((zone) => [getZoneCanonicalLookupKey(zone), zone]),
);

/**
 * Trims extra whitespace, resolves canonical names for known Querétaro zones
 * regardless of casing/accents, and preserves user-entered casing for custom zones.
 */
export function normalizeZoneName(rawZone: string): string {
  const cleaned = collapseSpaces(rawZone);
  if (cleaned.length === 0) {
    return "";
  }

  const canonical = CANONICAL_ZONE_MAP.get(getZoneCanonicalLookupKey(cleaned));
  return canonical ?? cleaned;
}

export function normalizeZoneList(zones: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawZone of zones) {
    const normalized = normalizeZoneName(rawZone);
    if (normalized.length === 0) {
      continue;
    }

    const key = getZoneComparisonKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

export function addZoneToList(
  zones: readonly string[],
  rawZone: string,
): { zones: string[]; added: boolean; error: string | null } {
  const normalized = normalizeZoneName(rawZone);
  if (normalized.length === 0) {
    return {
      zones: [...zones],
      added: false,
      error: "Escribe el nombre de una zona antes de agregarla.",
    };
  }

  const newKey = getZoneComparisonKey(normalized);
  const alreadyExists = zones.some(
    (existing) => getZoneComparisonKey(existing) === newKey,
  );

  if (alreadyExists) {
    return {
      zones: [...zones],
      added: false,
      error: `La zona "${normalized}" ya está agregada.`,
    };
  }

  return {
    zones: [...zones, normalized],
    added: true,
    error: null,
  };
}

export function parseBudgetInput(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export interface BudgetZonesValidationResult {
  isValid: boolean;
  minBudget: number | null;
  maxBudget: number | null;
  preferredZones: string[];
  error: string | null;
}

export function validateBudgetAndZones(
  minBudgetRaw: string,
  maxBudgetRaw: string,
  zones: readonly string[],
): BudgetZonesValidationResult {
  const minBudget = parseBudgetInput(minBudgetRaw);
  const maxBudget = parseBudgetInput(maxBudgetRaw);
  const normalizedZones = normalizeZoneList(zones);

  if (minBudget === null) {
    return {
      isValid: false,
      minBudget,
      maxBudget,
      preferredZones: normalizedZones,
      error: "Ingresa un presupuesto mínimo numérico válido.",
    };
  }

  if (maxBudget === null) {
    return {
      isValid: false,
      minBudget,
      maxBudget,
      preferredZones: normalizedZones,
      error: "Ingresa un presupuesto máximo numérico válido.",
    };
  }

  if (minBudget < 0 || maxBudget <= 0) {
    return {
      isValid: false,
      minBudget,
      maxBudget,
      preferredZones: normalizedZones,
      error:
        "El presupuesto mínimo debe ser mayor o igual a 0 y el máximo debe ser mayor a 0.",
    };
  }

  if (minBudget > maxBudget) {
    return {
      isValid: false,
      minBudget,
      maxBudget,
      preferredZones: normalizedZones,
      error: "El presupuesto mínimo no puede ser mayor al máximo.",
    };
  }

  if (normalizedZones.length === 0) {
    return {
      isValid: false,
      minBudget,
      maxBudget,
      preferredZones: normalizedZones,
      error: "Selecciona o agrega al menos una zona de interés.",
    };
  }

  return {
    isValid: true,
    minBudget,
    maxBudget,
    preferredZones: normalizedZones,
    error: null,
  };
}

export function validateAvatarFile(file: File): string | null {
  const isAllowedType = (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(
    file.type,
  );
  if (!isAllowedType) {
    return "Formato de imagen no válido. Solo se permiten archivos JPEG, PNG o WebP.";
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "La imagen supera el límite máximo permitido de 5 MB.";
  }

  return null;
}

export function formatCurrencyMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

