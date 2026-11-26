import type { ReactElement } from "react";

interface ProfileErrorStateProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function ProfileErrorState({
  message,
  onRetry,
  isRetrying = false,
}: ProfileErrorStateProps): ReactElement {
  return (
    <section
      role="alert"
      className="w-full max-w-md rounded-2xl border border-[#E7E2D6] bg-white p-8 shadow-sm text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C17A4D]/15 text-[#C17A4D] text-lg font-semibold">
        !
      </div>
      <h1 className="mt-4 text-lg font-semibold text-[#1C2321]">
        No pudimos verificar tu perfil
      </h1>
      <p className="mt-2 text-sm text-[#74716A] leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-6 w-full rounded-lg bg-[#C17A4D] py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isRetrying ? "Reintentando..." : "Reintentar"}
      </button>
    </section>
  );
}

