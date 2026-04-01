import { handleSearch }   from "./routes/search.js";
import { handleInfo }     from "./routes/info.js";
import { handleDownload } from "./routes/download.js";
import { handleChannel }  from "./routes/channel.js";
import { handlePlaylist } from "./routes/playlist.js";
import { handleHealth }   from "./routes/health.js";
import { handleIndex }    from "./routes/index.js";
import { cors, json, notFound } from "./lib.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Route matching
    try {
      if (path === "/api/health")   return withCors(await handleHealth(request, env));
      if (path === "/api/search")   return withCors(await handleSearch(request, env));
      if (path === "/api/info")     return withCors(await handleInfo(request, env));
      if (path === "/api/download") return withCors(await handleDownload(request, env));
      if (path === "/api/channel")  return withCors(await handleChannel(request, env));
      if (path === "/api/playlist") return withCors(await handlePlaylist(request, env));
      if (path === "/" || path === "/index.html") return handleIndex();
      return withCors(notFound());
    } catch (err) {
      return withCors(json({ error: err.message }, 500));
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function withCors(response) {
  const res = new Response(response.body, response);
  Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
