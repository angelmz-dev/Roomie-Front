import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateHomePage(): ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <section className="w-full max-w-lg rounded-2xl border border-[#E7E2D6] bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C17A4D]" />
          <span className="text-base font-semibold tracking-tight text-[#1C2321]">
            Roomie-Match
          </span>
        </div>
        <span className="rounded-full bg-[#1F2A2E] px-3 py-1 text-xs font-medium text-[#FBF9F5]">
          Sesión activa
        </span>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold text-[#1C2321]">
          Hola, {user?.fullName ?? "Usuario"}
        </h1>
        <p className="mt-2 text-sm text-[#74716A] leading-relaxed">
          Tu sesión en Roomie-Match se ha iniciado correctamente. Esta es el
          área privada provisional mientras se habilitan los módulos de perfil,
          descubrimiento, matches y chat en los siguientes sprints.
        </p>
      </div>

      {user && (
        <dl className="mt-6 rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#74716A]">Nombre</dt>
            <dd className="font-medium text-[#1C2321]">{user.fullName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#74716A]">Correo</dt>
            <dd className="font-medium text-[#1C2321]">{user.email}</dd>
          </div>
        </dl>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg bg-[#C17A4D] py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}

