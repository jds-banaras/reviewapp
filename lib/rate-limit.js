// Best-effort per-IP limit. On serverless each warm instance keeps its own map,
// which is enough to stop casual abuse of the AI endpoint.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export function allow(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
