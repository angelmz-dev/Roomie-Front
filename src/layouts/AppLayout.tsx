import type { ReactElement } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export default function AppLayout(): ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#FBF9F5] text-[#1C2321]">
      <header className="w-full bg-[#1F2A2E] text-[#FBF9F5] border-b border-[#E7E2D6]/15">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#C17A4D]" />
            <span className="text-base font-semibold tracking-tight">
              Roomie-Match
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline text-sm text-[#FBF9F5]/80">
                {user.fullName}
              </span>
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

      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
}

