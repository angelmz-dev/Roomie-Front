import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import AuthPage from "../features/auth/pages/AuthPage";
import PrivateHomePage from "../features/auth/pages/PrivateHomePage";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

function RootRedirect(): ReactElement {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FBF9F5] text-sm text-[#74716A]">
        Verificando sesión...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/app" : "/auth"} replace />;
}

export default function AppRouter(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<PrivateHomePage />} />
          </Route>
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

