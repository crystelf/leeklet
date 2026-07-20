import type { ApiError, ApiResult } from "./types";

const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7345";
const INTERNAL_BASE = process.env.API_INTERNAL || PUBLIC_BASE;

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;
  constructor(status: number, body: ApiError) {
    super(body.error || `请求失败 (${status})`);
    this.status = status;
    this.body = body;
  }
}

function base(forServer: boolean) {
  // 浏览器端走 /api/* 同源代理（next.config rewrites → 后端），避免 CORS
  if (!forServer && typeof window !== "undefined") return "";
  return forServer ? INTERNAL_BASE : PUBLIC_BASE;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** 透传 server 端收到的 cookie（仅 server 用） */
  cookie?: string;
  query?: Record<string, string | number | boolean | undefined>;
  server?: boolean;
  /** fetch 选项透传 */
  cache?: RequestCache;
  revalidate?: number;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
  server = false
) {
  const root = base(server);
  // 浏览器端：/api/users/me → 同源代理
  // 服务端：http://localhost:7345/users/me
  const url = new URL(root ? path : `/api${path}`, root || "http://localhost");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  // 浏览器端返回 pathname+search，服务端返回完整 url
  return root ? url.toString() : `${url.pathname}${url.search}`;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, cookie, query, server, cache, revalidate } = opts;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const init: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers,
    cache,
    next: revalidate ? { revalidate } : undefined,
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (!server) init.credentials = "include";

  const res = await fetch(buildUrl(path, query, server), init);
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { ok: false, error: "服务端返回了非 JSON 内容" };
    }
  }
  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      (json as ApiError) || { ok: false, error: `HTTP ${res.status}` }
    );
  }
  return json as T;
}

/** 浏览器端调用，自动携带 cookie */
export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    apiFetch<T>(path, { query }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/** 服务端调用，需透传 cookie */
export const serverApi = {
  get: <T>(
    path: string,
    opts: { query?: RequestOptions["query"]; cookie?: string; revalidate?: number } = {}
  ) =>
    apiFetch<T>(path, {
      query: opts.query,
      cookie: opts.cookie,
      server: true,
      revalidate: opts.revalidate,
    }),
  post: <T>(path: string, body?: unknown, cookie?: string) =>
    apiFetch<T>(path, { method: "POST", body, cookie, server: true }),
};

export type { ApiResult };
