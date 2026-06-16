export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth?mode=login";
    return res;
  }

  return res;
}
