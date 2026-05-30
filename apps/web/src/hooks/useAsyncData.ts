import { useEffect, useState } from "react";

type AsyncDataState<T> =
  | { status: "loading"; data?: T }
  | { status: "ready"; data: T }
  | { status: "error"; error: string; data?: T };

export function useAsyncData<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: React.DependencyList
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AsyncDataState<T>>({ status: "loading" });

  useEffect(() => {
    const abortController = new AbortController();

    setState({ status: "loading" });

    load(abortController.signal)
      .then((data) => {
        setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown request error";
        setState({ status: "error", error: message });
      });

    return () => {
      abortController.abort();
    };
  }, [...dependencies, reloadToken]);

  return {
    state,
    reload() {
      setReloadToken((current) => current + 1);
    }
  };
}
