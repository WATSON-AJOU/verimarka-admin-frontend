import { useEffect, useState } from "react";
import { fetchAdminJson } from "../lib/api";

export function useAdminResource<T>(path: string | null, options?: { refreshMs?: number }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    const fetchData = (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      setError("");

      void fetchAdminJson<T>(path)
        .then((payload) => {
          if (!cancelled) setData(payload);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
        })
        .finally(() => {
          if (!cancelled && showLoading) setLoading(false);
        });
    };

    fetchData(true);
    const intervalId = options?.refreshMs
      ? window.setInterval(() => fetchData(false), options.refreshMs)
      : null;

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [options?.refreshMs, path]);

  return { data, loading, error, setData };
}
