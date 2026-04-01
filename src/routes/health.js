import { json } from "../lib.js";

export function handleHealth(_request, _env) {
  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
    endpoints: {
      search:   "/api/search?q=lofi+music",
      info:     "/api/info?url=dQw4w9WgXcQ",
      download: "/api/download?url=dQw4w9WgXcQ&type=mp4",
      channel:  "/api/channel?id=UCxxxxxxx",
      playlist: "/api/playlist?id=PLxxxxxxx",
    },
    powered_by: {
      metadata:  "YouTube Data API v3 (Google)",
      downloads: "YouTube Innertube (free, no key)",
    },
  });
}
