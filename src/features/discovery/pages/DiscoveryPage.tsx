import type { ReactElement } from "react";
import CandidateCard from "../components/CandidateCard";
import DiscoveryEmptyState from "../components/DiscoveryEmptyState";
import MatchModal from "../components/MatchModal";
import { useDiscovery } from "../hooks/useDiscovery";

export default function DiscoveryPage(): ReactElement {
  const {
    status,
    currentCandidate,
    loadedCount,
    feedError,
    isRefreshing,
    isSubmittingInteraction,
    pendingAction,
    interactionError,
    interactionNotice,
    matchEvent,
    interact,
    refreshFeed,
    dismissMatchModal,
  } = useDiscovery();

  return (
    <div className="w-full max-w-2xl space-y-5">
      {/* Encabezado del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C2321]">
            Descubrir roomies
          </h1>
          <p className="mt-1 text-sm text-[#74716A]">
            Perfiles compatibles según tus zonas y presupuesto en Querétaro.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {status === "ready" && loadedCount > 0 && (
            <span className="rounded-full border border-[#E7E2D6] bg-white px-3 py-1 text-xs font-medium text-[#74716A]">
              {loadedCount} en cola
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              void refreshFeed();
            }}
            disabled={isRefreshing || isSubmittingInteraction || status === "loading"}
            className="rounded-lg border border-[#E7E2D6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1C2321] transition hover:border-[#C17A4D] hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Avisos de interacción */}
      {interactionNotice && (
        <div
          role="status"
          className="rounded-xl border border-[#1F2A2E]/20 bg-[#1F2A2E]/5 px-4 py-3 text-xs text-[#1F2A2E]"
        >
          {interactionNotice}
        </div>
      )}

      {interactionError && (
        <div
          role="alert"
          className="rounded-xl border border-[#C17A4D]/40 bg-[#C17A4D]/10 px-4 py-3 text-xs text-[#8C4D27]"
        >
          {interactionError}
        </div>
      )}

      {/* Estado: cargando */}
      {status === "loading" && (
        <section
          role="status"
          aria-label="Cargando candidatos compatibles"
          className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 sm:p-10 text-center shadow-sm"
        >
          <p className="text-sm font-medium text-[#1C2321]">
            Buscando roomies compatibles...
          </p>
          <p className="mt-1.5 text-xs text-[#74716A]">
            Consultando perfiles disponibles para tus preferencias.
          </p>
        </section>
      )}

      {/* Estado: error de carga */}
      {status === "error" && (
        <section
          role="alert"
          className="w-full rounded-2xl border border-[#E7E2D6] bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#C17A4D]/15 text-[#C17A4D] text-base font-semibold">
            !
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#1C2321]">
            No pudimos cargar el feed
          </h2>
          <p className="mt-2 text-sm text-[#74716A] leading-relaxed">
            {feedError ?? "Ocurrió un error al consultar los candidatos."}
          </p>
          <button
            type="button"
            onClick={() => {
              void refreshFeed();
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
        <DiscoveryEmptyState
          onRefresh={() => {
            void refreshFeed();
          }}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Estado: candidato activo */}
      {status === "ready" && currentCandidate && (
        <CandidateCard
          candidate={currentCandidate}
          isSubmitting={isSubmittingInteraction}
          pendingAction={pendingAction}
          isBlocked={matchEvent !== null}
          onInteract={(type) => {
            void interact(type);
          }}
        />
      )}

      {/* Modal de Match recíproco real */}
      {matchEvent && (
        <MatchModal matchEvent={matchEvent} onContinue={dismissMatchModal} />
      )}
    </div>
  );
}

