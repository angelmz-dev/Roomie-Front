import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  SUGGESTED_ZONES,
  addZoneToList,
  getZoneComparisonKey,
} from "../utils/profile-validation";

interface BudgetZonesFieldsProps {
  minBudget: string;
  maxBudget: string;
  preferredZones: string[];
  onMinBudgetChange: (value: string) => void;
  onMaxBudgetChange: (value: string) => void;
  onPreferredZonesChange: (zones: string[]) => void;
  disabled?: boolean;
}

export default function BudgetZonesFields({
  minBudget,
  maxBudget,
  preferredZones,
  onMinBudgetChange,
  onMaxBudgetChange,
  onPreferredZonesChange,
  disabled = false,
}: BudgetZonesFieldsProps): ReactElement {
  const [customZone, setCustomZone] = useState<string>("");
  const [zoneFeedback, setZoneFeedback] = useState<string | null>(null);

  const selectedKeys = new Set(preferredZones.map(getZoneComparisonKey));

  const handleToggleSuggestedZone = (zone: string): void => {
    if (disabled) return;
    setZoneFeedback(null);

    const key = getZoneComparisonKey(zone);
    if (selectedKeys.has(key)) {
      onPreferredZonesChange(
        preferredZones.filter((item) => getZoneComparisonKey(item) !== key),
      );
      return;
    }

    onPreferredZonesChange([...preferredZones, zone]);
  };

  const handleAddCustomZone = (): void => {
    if (disabled) return;

    const result = addZoneToList(preferredZones, customZone);
    if (!result.added) {
      setZoneFeedback(result.error);
      return;
    }

    onPreferredZonesChange(result.zones);
    setCustomZone("");
    setZoneFeedback(null);
  };

  const handleCustomZoneKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomZone();
    }
  };

  const handleRemoveZone = (zoneToRemove: string): void => {
    if (disabled) return;
    const key = getZoneComparisonKey(zoneToRemove);
    onPreferredZonesChange(
      preferredZones.filter((item) => getZoneComparisonKey(item) !== key),
    );
    setZoneFeedback(null);
  };

  const handleNumericChange =
    (setter: (value: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(e.target.value);
    };

  return (
    <div className="space-y-6">
      {/* Presupuesto */}
      <div>
        <h3 className="text-sm font-medium text-[#1C2321]">
          Presupuesto mensual (MXN)
        </h3>
        <p className="mt-0.5 text-xs text-[#74716A]">
          Define el rango mensual que estás dispuesto a pagar por habitación.
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="minBudget"
              className="block text-xs font-medium text-[#1C2321] mb-1.5"
            >
              Presupuesto mínimo
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#74716A]">
                $
              </span>
              <input
                id="minBudget"
                name="minBudget"
                type="number"
                inputMode="decimal"
                min={0}
                step="100"
                value={minBudget}
                onChange={handleNumericChange(onMinBudgetChange)}
                placeholder="3500"
                disabled={disabled}
                required
                className="w-full rounded-lg border border-[#E7E2D6] bg-white pl-8 pr-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="maxBudget"
              className="block text-xs font-medium text-[#1C2321] mb-1.5"
            >
              Presupuesto máximo
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#74716A]">
                $
              </span>
              <input
                id="maxBudget"
                name="maxBudget"
                type="number"
                inputMode="decimal"
                min={1}
                step="100"
                value={maxBudget}
                onChange={handleNumericChange(onMaxBudgetChange)}
                placeholder="6500"
                disabled={disabled}
                required
                className="w-full rounded-lg border border-[#E7E2D6] bg-white pl-8 pr-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zonas de interés */}
      <div>
        <h3 className="text-sm font-medium text-[#1C2321]">
          Zonas de interés en Querétaro
        </h3>
        <p className="mt-0.5 text-xs text-[#74716A]">
          Elige zonas sugeridas o agrega cualquier colonia personalizada.
        </p>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Zonas sugeridas de Querétaro"
        >
          {SUGGESTED_ZONES.map((zone) => {
            const isSelected = selectedKeys.has(getZoneComparisonKey(zone));
            return (
              <button
                key={zone}
                type="button"
                onClick={() => handleToggleSuggestedZone(zone)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/35 disabled:opacity-60 ${
                  isSelected
                    ? "bg-[#1F2A2E] text-[#FBF9F5] border border-[#1F2A2E]"
                    : "bg-white text-[#1C2321] border border-[#E7E2D6] hover:border-[#C17A4D]"
                }`}
              >
                {zone}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label
            htmlFor="customZone"
            className="block text-xs font-medium text-[#1C2321] mb-1.5"
          >
            Agregar otra zona
          </label>
          <div className="flex gap-2">
            <input
              id="customZone"
              name="customZone"
              type="text"
              value={customZone}
              onChange={(e) => {
                setCustomZone(e.target.value);
                if (zoneFeedback) setZoneFeedback(null);
              }}
              onKeyDown={handleCustomZoneKeyDown}
              placeholder="Ej. Tejeda, Altozano, Mirador..."
              disabled={disabled}
              className="flex-1 rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-2 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleAddCustomZone}
              disabled={disabled}
              className="rounded-lg border border-[#E7E2D6] bg-white px-4 py-2 text-xs font-medium text-[#1C2321] transition hover:border-[#C17A4D] hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60"
            >
              Agregar
            </button>
          </div>
          {zoneFeedback && (
            <p role="alert" className="mt-1.5 text-xs text-[#8C4D27]">
              {zoneFeedback}
            </p>
          )}
        </div>

        {preferredZones.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-3.5">
            <p className="text-xs font-medium text-[#74716A] mb-2">
              Zonas seleccionadas ({preferredZones.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {preferredZones.map((zone) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C17A4D]/15 px-3 py-1 text-xs font-medium text-[#8C4D27]"
                >
                  {zone}
                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zone)}
                    disabled={disabled}
                    aria-label={`Quitar zona ${zone}`}
                    className="ml-0.5 rounded-full px-1 text-[#8C4D27] hover:bg-[#C17A4D]/25 focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 disabled:opacity-60"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

