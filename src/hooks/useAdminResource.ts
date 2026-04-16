import { useEffect, useState } from "react";
import { fetchAdminJson } from "../lib/api";

export function useAdminResource<T>(path: string | null) {
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

    setLoading(true);
    setError("");

    void fetchAdminJson<T>(path)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, error, setData };
}
