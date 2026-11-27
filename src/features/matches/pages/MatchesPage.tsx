import type { ReactElement } from "react";
import MatchCard from "../components/MatchCard";
import MatchesEmptyState from "../components/MatchesEmptyState";
import { useMatches } from "../hooks/useMatches";

export default function MatchesPage(): ReactElement {
  const { status, matches, error, refreshError, isRefreshing, refreshMatches } =
    useMatches();

  const countLabel =
    matches.length === 1 ? "1 coincidencia" : `${matches.length} coincidencias`;

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C2321]">
            Tus matches
          </h1>
          <p className="mt-1 text-sm text-[#74716A]">
            Personas con las que tienes interés mutuo para compartir habitación.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {status === "ready" && (
            <span className="rounded-full border border-[#E7E2D6] bg-white px-3 py-1 text-xs font-medium text-[#74716A]">
              {countLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              void refreshMatches();
            }}
            disabled={isRefreshing || status === "loading"}
            aria-busy={isRefreshing}
            className="rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1C2321] transition hover:border-[#C17A4D] hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Error no destructivo al refrescar cuando ya hay matches cargados */}
      {refreshError && status === "ready" && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
        >
          <span>{refreshError}</span>
          <button
            type="button"
            onClick={() => {
              void refreshMatches();
            }}
            disabled={isRefreshing}
            className="self-start sm:self-auto font-semibold underline underline-offset-2 hover:text-[#1C2321] focus:outline-none"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: cargando */}
      {status === "loading" && (
        <section
          role="status"
          aria-label="Cargando tus matches"
          className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 sm:p-10 text-center shadow-sm"
        >
          <p className="text-sm font-medium text-[#1C2321]">
            Cargando tus coincidencias...
          </p>
          <p className="mt-1.5 text-xs text-[#74716A]">
            Consultando tus matches recíprocos en Roomie-Match.
          </p>
        </section>
      )}

      {/* Estado: error de carga inicial */}
      {status === "error" && (
        <section
          role="alert"
          className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#C17A4D]/15 text-[#C17A4D] text-base font-semibold">
            !
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#1C2321]">
            No pudimos cargar tus matches
          </h2>
          <p className="mt-2 text-sm text-[#74716A] leading-relaxed">
            {error ?? "Ocurrió un error al consultar tus coincidencias."}
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshMatches();
            }}
            disabled={isRefreshing}
            className="mt-6 rounded-lg bg-[#C17A4D] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60"
          >
            {isRefreshing ? "Reintentando..." : "Reintentar"}
          </button>
        </section>
      )}

      {/* Estado: vacío */}
      {status === "empty" && (
        <MatchesEmptyState
          onRefresh={() => {
            void refreshMatches();
          }}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Estado: coincidencias disponibles */}
      {status === "ready" && (
        <section
          aria-label="Lista de coincidencias"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {matches.map((match) => (
            <MatchCard key={match.matchId} match={match} />
          ))}
        </section>
      )}
    </div>
  );
}

