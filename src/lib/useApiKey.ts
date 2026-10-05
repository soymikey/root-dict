import { useEffect, useState } from "react";
import { API_KEY_CHANGED_EVENT, hasApiKey } from "./apiKey";

export function useApiKey() {
  const [keyReady, setKeyReady] = useState(() => hasApiKey());

  useEffect(() => {
    function sync() {
      setKeyReady(hasApiKey());
    }

    window.addEventListener(API_KEY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(API_KEY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return keyReady;
}
