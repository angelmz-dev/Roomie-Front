import type { ReactElement } from "react";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import { ProfileProvider } from "./features/profile/context/ProfileProvider";
import AppRouter from "./routes/AppRouter";

export default function App(): ReactElement {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppRouter />
      </ProfileProvider>
    </AuthProvider>
  );
}
