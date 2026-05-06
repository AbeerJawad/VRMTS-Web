const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");
export const API_ADMIN_BASE_URL = `${API_BASE_URL}/admin`;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${normalizedPath}`;
}
