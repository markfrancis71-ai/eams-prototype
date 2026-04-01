import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "";

// Always rewrite to static .json paths.
// Works on Netlify (static files) and locally if build:netlify was run.
function isStaticMode(): boolean {
  return true;
}

// Rewrite URL for static file structure:
//   /api/search?q=&kind=system → /api/search.json
//   /api/graph/lineage/x?direction=up → /api/graph/lineage/x/up.json
//   /api/viewpoints/x/resolve?system=y → /api/viewpoints/x/resolve/y.json
//   /api/anything → /api/anything.json
function rewriteForStatic(url: string): string {
  const [path, qs] = url.split("?");
  const params = new URLSearchParams(qs || "");

  if (path.includes("/graph/lineage/") && params.has("direction")) {
    return `${path}/${params.get("direction")}.json`;
  }
  if (path.endsWith("/resolve") && params.has("system")) {
    return `${path}/${params.get("system")}.json`;
  }
  if (path === "/api/search") {
    return "/api/search.json";
  }
  if (path === "/api/graph/traverse" && params.has("from")) {
    return `/api/graph/traverse/${params.get("from")}.json`;
  }
  return `${path}.json`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isStatic = isStaticMode();

  if (isStatic && method === "GET") {
    const staticUrl = rewriteForStatic(url);
    const res = await fetch(`${API_BASE}${staticUrl}`);
    await throwIfResNotOk(res);
    return res;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/").replace(/\/\/+/g, "/");
    const isStatic = isStaticMode();
    const finalUrl = isStatic ? rewriteForStatic(path) : path;
    const res = await fetch(`${API_BASE}${finalUrl}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});