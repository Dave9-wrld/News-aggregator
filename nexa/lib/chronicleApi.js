const TOKEN_KEY = "global_chronicle_token";

export const getToken = () => typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function chronicleApi(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = { ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  const response = await fetch(`/api/backend/${path.replace(/^\/+|\/+$/g, "")}`, { ...options, headers });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || "Request failed");
  return data;
}
