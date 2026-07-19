"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (t: T | null) => void;
}

export function useFetch<T>(
  path: string | null,
  deps: unknown[] = []
): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const depsKey = JSON.stringify(deps);

  const load = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(path);
      if (alive.current) setData(res);
    } catch (e) {
      if (alive.current) {
        setError(e instanceof ApiRequestError ? e.body.error : "加载失败");
        setData(null);
      }
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load, depsKey]);

  return { data, loading, error, reload: load, setData };
}
