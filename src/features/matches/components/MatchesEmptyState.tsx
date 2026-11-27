import type { ReactElement } from "react";
import { Link } from "react-router-dom";

interface MatchesEmptyStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function MatchesEmptyState({
  onRefresh,
  isRefreshing,
}: MatchesEmptyStateProps): ReactElement {
  return (
    <section
      aria-label="Sin matches todavía"
      className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 sm:p-10 text-center shadow-sm"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2A2E]/8 text-[#1F2A2E] text-sm font-semibold">
        RM
      </div>

      <h2 className="mt-4 text-xl font-semibold text-[#1C2321]">
        Aún no tienes matches
      </h2>
      <p className="mt-2 max-w-md mx-auto text-sm text-[#74716A] leading-relaxed">
        Cuando tú y otro roomie se den &ldquo;Me interesa&rdquo; mutuamente, sus
        coincidencias aparecerán aquí.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/app/discovery"
          className="w-full sm:w-auto rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
        >
          Explorar candidatos
        </Link>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
          className="w-full sm:w-auto rounded-lg border border-[#E7E2D6] bg-white px-6 py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </section>
  );
}

