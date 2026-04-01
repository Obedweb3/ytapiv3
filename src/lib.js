// ─── JSON response helper ────────────────────────────────────────────────────
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── 404 helper ──────────────────────────────────────────────────────────────
export function notFound() {
  return json({ error: "Not found" }, 404);
}

// ─── YouTube video ID extractor ──────────────────────────────────────────────
export function extractId(input) {
  if (!input) return null;
  const patterns = [
    /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── YouTube Data API v3 ─────────────────────────────────────────────────────
export async function ytGet(path, params = {}, env) {
  const key = env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY secret not set. Add it with: wrangler secret put YOUTUBE_API_KEY");

  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  Object.entries({ ...params, key }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || res.statusText;
    const error = new Error(`YouTube API error: ${msg}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// ─── Parse query params from a Request ──────────────────────────────────────
export function getQuery(request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

// ─── CORS util (kept for reference, applied in worker.js) ───────────────────
export function cors() {}
