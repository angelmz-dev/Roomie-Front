import type { ReactElement } from "react";
import { Link } from "react-router-dom";

interface DiscoveryEmptyStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function DiscoveryEmptyState({
  onRefresh,
  isRefreshing,
}: DiscoveryEmptyStateProps): ReactElement {
  return (
    <section
      aria-label="Sin candidatos disponibles"
      className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 sm:p-10 text-center shadow-sm"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2A2E]/8 text-[#1F2A2E] text-sm font-semibold">
        RM
      </div>

      <h2 className="mt-4 text-xl font-semibold text-[#1C2321]">
        No hay más candidatos por ahora
      </h2>
      <p className="mt-2 max-w-md mx-auto text-sm text-[#74716A] leading-relaxed">
        Ya revisaste a los roomies compatibles disponibles con tus zonas y
        presupuesto actuales. Puedes actualizar el feed o ampliar tus
        preferencias en tu perfil.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
          className="w-full sm:w-auto rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Actualizando..." : "Actualizar feed"}
        </button>

        <Link
          to="/app/profile"
          className="w-full sm:w-auto rounded-lg border border-[#E7E2D6] bg-white px-6 py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30"
        >
          Ajustar mi perfil
        </Link>
      </div>
    </section>
  );
}

