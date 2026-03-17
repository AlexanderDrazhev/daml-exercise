import React from "react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/features/auth/LoginScreen";
import { LedgerLayout } from "./components/layout/LedgerLayout";
import { LoadingScreen } from "./components/layout/LoadingScreen";

function App() {
  const { credentials, login, logout, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingScreen message="Loading..." />
      </div>
    );
  }

  if (credentials) {
    return <LedgerLayout credentials={credentials} onLogout={logout} />;
  }

  return <LoginScreen onLogin={login} />;
}

export default App;
