const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function toApiUrl(input: string) {
  if (!input.startsWith("/api")) return input;
  if (!API_BASE) return input;
  return `${API_BASE}${input}`;
}

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const TOKEN_KEY = "eventflow/token";
  const raw = window.localStorage.getItem(TOKEN_KEY);
  const token = raw || null;

  const forceAuthLogout = () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("auth:logout"));

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.replace("/login");
    }
  };

  const requestUrl = typeof input === "string" ? toApiUrl(input) : input;
  const headers = new Headers(init && init.headers ? init.headers : undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(requestUrl, {
    ...(init || {}),
    headers,
    credentials: init?.credentials ?? "include",
  });
  if (res.status !== 401) return res;

  // try refresh
  const refreshRes = await fetch(toApiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!refreshRes.ok) {
    forceAuthLogout();
    return res;
  }

  const body = await refreshRes.json().catch(() => null);
  if (body && body.token) {
    try {
      window.localStorage.setItem(TOKEN_KEY, body.token);
    } catch (e) {}
    // retry original request with new token
    const headers2 = new Headers(
      init && init.headers ? init.headers : undefined,
    );
    headers2.set("Authorization", `Bearer ${body.token}`);
    return fetch(requestUrl, {
      ...(init || {}),
      headers: headers2,
      credentials: init?.credentials ?? "include",
    });
  }

  forceAuthLogout();
  return res;
}

export default apiFetch;
