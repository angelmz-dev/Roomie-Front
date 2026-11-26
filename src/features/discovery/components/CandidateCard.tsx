import type { ReactElement } from "react";
import { formatCurrencyMxn } from "../../profile/utils/profile-validation";
import type {
  DiscoveryCandidate,
  InteractionType,
} from "../types/discovery.types";

interface CandidateCardProps {
  candidate: DiscoveryCandidate;
  isSubmitting: boolean;
  pendingAction: InteractionType | null;
  isBlocked: boolean;
  onInteract: (type: InteractionType) => void;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function CandidateCard({
  candidate,
  isSubmitting,
  pendingAction,
  isBlocked,
  onInteract,
}: CandidateCardProps): ReactElement {
  const actionsDisabled = isSubmitting || isBlocked;

  const habits = [
    { label: "Tiene mascotas", value: candidate.hasPets },
    { label: "Acepta mascotas", value: candidate.toleratesPets },
    { label: "Fumador", value: candidate.isSmoker },
    { label: "Acepta fumadores", value: candidate.toleratesSmokers },
  ] as const;

  return (
    <article
      aria-label={`Perfil de ${candidate.fullName}`}
      className="w-full overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white shadow-sm"
    >
      {/* Cabecera visual del candidato */}
      <div className="bg-[#1F2A2E] px-6 py-6 sm:px-8 sm:py-7 text-[#FBF9F5]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[#FBF9F5]/20 bg-[#C17A4D]/25 flex items-center justify-center">
            {candidate.avatarUrl ? (
              <img
                src={candidate.avatarUrl}
                alt={`Fotografía de ${candidate.fullName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold tracking-wide text-[#FBF9F5]">
                {getInitials(candidate.fullName)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#FBF9F5] truncate">
              {candidate.fullName}
            </h2>
            <p className="mt-2 inline-flex items-center rounded-full bg-[#FBF9F5]/12 px-3 py-1 text-xs font-medium text-[#FBF9F5]">
              {formatCurrencyMxn(candidate.minBudget)} –{" "}
              {formatCurrencyMxn(candidate.maxBudget)} / mes
            </p>
          </div>
        </div>
      </div>

      {/* Información de convivencia */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Biografía */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74716A]">
            Sobre este roomie
          </h3>
          <p className="mt-2 text-sm text-[#1C2321] leading-relaxed">
            {candidate.bio && candidate.bio.trim().length > 0
              ? candidate.bio.trim()
              : "Este usuario aún no ha agregado una biografía."}
          </p>
        </div>

        {/* Zonas de interés */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74716A]">
            Zonas de interés
          </h3>
          <ul
            aria-label="Zonas de interés del candidato"
            className="mt-2.5 flex flex-wrap gap-2"
          >
            {candidate.preferredZones.map((zone) => (
              <li
                key={zone}
                className="rounded-full border border-[#E7E2D6] bg-[#FBF9F5] px-3 py-1 text-xs font-medium text-[#1C2321]"
              >
                {zone}
              </li>
            ))}
          </ul>
        </div>

        {/* Hábitos de convivencia */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74716A]">
            Hábitos y preferencias
          </h3>
          <dl className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {habits.map((habit) => (
              <div
                key={habit.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] px-4 py-3 text-xs"
              >
                <dt className="text-[#74716A]">{habit.label}</dt>
                <dd
                  className={`rounded-full px-2.5 py-0.5 font-semibold ${
                    habit.value
                      ? "bg-[#1F2A2E] text-[#FBF9F5]"
                      : "bg-white border border-[#E7E2D6] text-[#74716A]"
                  }`}
                >
                  {habit.value ? "Sí" : "No"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Acciones de interacción */}
        <div className="pt-4 border-t border-[#E7E2D6] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onInteract("DISLIKE")}
            disabled={actionsDisabled}
            aria-busy={isSubmitting && pendingAction === "DISLIKE"}
            className="w-full rounded-xl border border-[#E7E2D6] bg-white py-3 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/30 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && pendingAction === "DISLIKE"
              ? "Descartando..."
              : "Descartar"}
          </button>

          <button
            type="button"
            onClick={() => onInteract("LIKE")}
            disabled={actionsDisabled}
            aria-busy={isSubmitting && pendingAction === "LIKE"}
            className="w-full rounded-xl bg-[#C17A4D] py-3 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && pendingAction === "LIKE"
              ? "Enviando..."
              : "Me interesa"}
          </button>
        </div>
      </div>
    </article>
  );
}

