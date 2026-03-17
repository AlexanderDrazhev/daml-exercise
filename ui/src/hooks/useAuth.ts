import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const credentials = useAuthStore((authState) => authState.credentials);
  const login = useAuthStore((authState) => authState.login);
  const logout = useAuthStore((authState) => authState.logout);
  const syncCredentialsFromStored = useAuthStore(
    (authState) => authState.syncCredentialsFromStored,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const persist = useAuthStore.persist;
    if (persist.hasHydrated()) {
      syncCredentialsFromStored();
      setIsReady(true);
      return;
    }
    const unsubscribe = persist.onFinishHydration(() => {
      syncCredentialsFromStored();
      setIsReady(true);
    });
    return unsubscribe;
  }, [syncCredentialsFromStored]);

  return { credentials, login, logout, isReady };
}
