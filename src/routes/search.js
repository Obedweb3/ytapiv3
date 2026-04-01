import { json, ytGet, getQuery } from "../lib.js";

export async function handleSearch(request, env) {
  const { q, pageToken, maxResults = "12", type = "video", order = "relevance", videoDuration } = getQuery(request);
  if (!q) return json({ error: "Missing ?q=  Example: /api/search?q=lofi+music" }, 400);

  const params = { part: "snippet", q, maxResults, type, order };
  if (pageToken)     params.pageToken     = pageToken;
  if (videoDuration) params.videoDuration = videoDuration;

  try {
    const data = await ytGet("search", params, env);
    return json({
      nextPageToken: data.nextPageToken || null,
      prevPageToken: data.prevPageToken || null,
      totalResults:  data.pageInfo?.totalResults,
      results: (data.items || []).map(i => ({
        videoId:     i.id?.videoId || i.id?.playlistId || i.id?.channelId,
        type:        i.id?.kind?.replace("youtube#", ""),
        title:       i.snippet.title,
        channel:     i.snippet.channelTitle,
        channelId:   i.snippet.channelId,
        published:   i.snippet.publishedAt,
        description: i.snippet.description,
        thumbnail:   i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.default?.url,
      })),
    });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
