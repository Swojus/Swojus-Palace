export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const TOKEN_KEY = "eventflow/token";
  const raw = window.localStorage.getItem(TOKEN_KEY);
  const token = raw || null;

  const headers = new Headers(init && init.headers ? init.headers : undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, {
    ...(init || {}),
    headers,
    credentials: init?.credentials ?? "include",
  });
  if (res.status !== 401) return res;

  // try refresh
  const refreshRes = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  if (!refreshRes.ok) {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent("auth:logout"));
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
    return fetch(input, {
      ...(init || {}),
      headers: headers2,
      credentials: init?.credentials ?? "include",
    });
  }

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
  window.dispatchEvent(new CustomEvent("auth:logout"));
  return res;
}

export default apiFetch;
