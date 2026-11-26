import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import AuthPage from "../features/auth/pages/AuthPage";
import DiscoveryPage from "../features/discovery/pages/DiscoveryPage";
import OnboardingPage from "../features/profile/pages/OnboardingPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import AppLayout from "../layouts/AppLayout";
import OnboardingRoute from "./OnboardingRoute";
import ProfileRequiredRoute from "./ProfileRequiredRoute";
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

  return <Navigate to={isAuthenticated ? "/app/discovery" : "/auth"} replace />;
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
            <Route element={<OnboardingRoute />}>
              <Route path="onboarding" element={<OnboardingPage />} />
            </Route>

            <Route element={<ProfileRequiredRoute />}>
              <Route index element={<Navigate to="/app/discovery" replace />} />
              <Route path="discovery" element={<DiscoveryPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
