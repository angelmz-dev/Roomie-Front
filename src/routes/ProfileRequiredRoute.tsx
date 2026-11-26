import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";
import ProfileErrorState from "../features/profile/components/ProfileErrorState";
import { useProfile } from "../features/profile/hooks/useProfile";

export default function ProfileRequiredRoute(): ReactElement {
  const { status, error, refetchProfile } = useProfile();

  if (status === "idle" || status === "loading") {
    return (
      <div
        role="status"
        className="w-full max-w-md rounded-2xl border border-[#E7E2D6] bg-white p-8 text-center text-sm text-[#74716A] shadow-sm"
      >
        Cargando tu perfil...
      </div>
    );
  }

  if (status === "error") {
    return (
      <ProfileErrorState
        message={
          error ??
          "No se pudo verificar el estado de tu perfil. Intenta nuevamente."
        }
        onRetry={() => {
          void refetchProfile();
        }}
      />
    );
  }

  if (status === "missing") {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <Outlet />;
}

