import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "../../profile/hooks/useProfile";
import { formatCurrencyMxn } from "../../profile/utils/profile-validation";
import { useAuth } from "../hooks/useAuth";

export default function PrivateHomePage(): ReactElement {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <section className="w-full max-w-xl rounded-2xl border border-[#E7E2D6] bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`Avatar de ${user?.fullName ?? "Usuario"}`}
              className="h-11 w-11 rounded-full object-cover border border-[#E7E2D6]"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-[#1F2A2E] text-[#FBF9F5] flex items-center justify-center text-sm font-semibold">
              {(user?.fullName ?? "RM").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-base font-semibold tracking-tight text-[#1C2321]">
              Roomie-Match
            </span>
            <p className="text-xs text-[#74716A]">Área privada provisional</p>
          </div>
        </div>
        <span className="rounded-full bg-[#1F2A2E] px-3 py-1 text-xs font-medium text-[#FBF9F5]">
          Perfil listo
        </span>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold text-[#1C2321]">
          Hola, {user?.fullName ?? "Usuario"}
        </h1>
        <p className="mt-2 text-sm text-[#74716A] leading-relaxed">
          Tu perfil de convivencia ya está configurado. En los próximos sprints
          se habilitarán aquí Discovery Feed, Matches y Chat.
        </p>
      </div>

      {profile && (
        <dl className="mt-6 rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#74716A]">Presupuesto</dt>
            <dd className="font-medium text-[#1C2321]">
              {formatCurrencyMxn(profile.minBudget)} –{" "}
              {formatCurrencyMxn(profile.maxBudget)} / mes
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <dt className="text-[#74716A] shrink-0">Zonas</dt>
            <dd className="flex flex-wrap sm:justify-end gap-1.5">
              {profile.preferredZones.map((zone) => (
                <span
                  key={zone}
                  className="rounded-full bg-white border border-[#E7E2D6] px-2.5 py-0.5 text-xs font-medium text-[#1C2321]"
                >
                  {zone}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          to="/app/profile"
          className="flex-1 text-center rounded-lg bg-[#C17A4D] py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2"
        >
          Ver y editar mi perfil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="sm:w-auto px-5 rounded-lg border border-[#E7E2D6] bg-white py-2.5 text-sm font-medium text-[#1C2321] transition hover:border-[#1C2321]/25 hover:bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/30"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
