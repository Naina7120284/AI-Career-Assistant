export function apiBaseUrl(): string {
  // Prefer env so deployment works; fall back to local backend.
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001").replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${p}`;
}

export function wsBaseUrl(): string {
  const base = apiBaseUrl();
  return base.startsWith("https://") ? base.replace("https://", "wss://") : base.replace("http://", "ws://");
}
