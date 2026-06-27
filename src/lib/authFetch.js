export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = "/auth";
    return res;
  }

  return res;
}
