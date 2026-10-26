// Shared request guards for the public form endpoints.
// Files in /api that start with "_" are not exposed as routes on Vercel.

const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

// Best-effort per-IP limit. Each serverless instance keeps its own counter,
// so this slows down scripted spam rather than guaranteeing a hard cap.
function rateLimited(req, limit) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  const ip = fwd.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}

// Only accept posts that come from our own site (or local preview).
function fromOurSite(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  if (!origin) return true; // some privacy tools strip both headers; other checks still apply
  try {
    const host = new URL(origin).hostname;
    return (
      host === "goprofinish.com" ||
      host.endsWith(".goprofinish.com") ||
      host.endsWith(".vercel.app") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

module.exports = { rateLimited, fromOurSite };
