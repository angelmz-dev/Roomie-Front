import type { ReactElement } from "react";
import { Link } from "react-router-dom";

interface ChatEmptyStateProps {
  hasMatches: boolean;
}

export default function ChatEmptyState({
  hasMatches,
}: ChatEmptyStateProps): ReactElement {
  return (
    <section className="flex h-full flex-col items-center justify-center bg-[#FBF9F5] p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2A2E]/8 text-[#1F2A2E] text-sm font-semibold">
        RM
      </div>

      <h2 className="mt-4 text-lg font-semibold text-[#1C2321]">
        {hasMatches
          ? "Selecciona una conversación"
          : "Aún no tienes conversaciones disponibles"}
      </h2>

      <p className="mt-2 max-w-sm text-sm text-[#74716A] leading-relaxed">
        {hasMatches
          ? "Elige uno de tus matches en la bandeja lateral para leer el historial y conversar en tiempo real."
          : "Cuando tengas un match recíproco en Discovery, podrás iniciar una conversación privada aquí."}
      </p>

      {!hasMatches && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/discovery"
            className="rounded-lg bg-[#C17A4D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
          >
            Explorar candidatos
          </Link>
          <Link
            to="/app/matches"
            className="rounded-lg border border-[#E7E2D6] bg-white px-5 py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5]"
          >
            Ver matches
          </Link>
        </div>
      )}
    </section>
  );
}

