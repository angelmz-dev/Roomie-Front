import type { ReactElement } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useProfile } from "../features/profile/hooks/useProfile";

export default function AppLayout(): ReactElement {
  const { user, logout } = useAuth();
  const { profile, status } = useProfile();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/auth", { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 ${
      isActive
        ? "bg-[#C17A4D] text-white"
        : "text-[#FBF9F5]/80 hover:text-[#FBF9F5] hover:bg-[#FBF9F5]/10"
    }`;

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#FBF9F5] text-[#1C2321]">
      <header className="w-full bg-[#1F2A2E] text-[#FBF9F5] border-b border-[#E7E2D6]/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#C17A4D]" />
              <span className="text-base font-semibold tracking-tight">
                Roomie-Match
              </span>
            </div>

            {status === "ready" && (
              <nav
                aria-label="Navegación principal"
                className="flex items-center gap-1.5"
              >
                <NavLink to="/app" end className={navLinkClass}>
                  Inicio
                </NavLink>
                <NavLink to="/app/profile" className={navLinkClass}>
                  Mi perfil
                </NavLink>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5">
                {profile?.avatarUrl && (
                  <img
                    src={profile.avatarUrl}
                    alt={user.fullName}
                    className="h-7 w-7 rounded-full object-cover border border-[#FBF9F5]/25"
                  />
                )}
                <span className="text-sm text-[#FBF9F5]/85">
                  {user.fullName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-[#FBF9F5]/25 px-3.5 py-1.5 text-xs font-medium text-[#FBF9F5] transition hover:border-[#C17A4D] hover:bg-[#C17A4D] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
