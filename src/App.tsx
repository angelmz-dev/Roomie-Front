import type { ReactElement } from "react";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import AppRouter from "./routes/AppRouter";

export default function App(): ReactElement {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
