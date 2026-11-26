import { useSyncExternalStore } from "react";

function assinar(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** O aparelho está conectado? Atualiza sozinho quando a conexão cai ou volta. */
export function useOnline() {
  return useSyncExternalStore(assinar, () => navigator.onLine, () => true);
}
