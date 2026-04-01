import { json, ytGet, extractId, getQuery } from "../lib.js";

export async function handleInfo(request, env) {
  const { url } = getQuery(request);
  if (!url) return json({ error: "Missing ?url=  Example: /api/info?url=dQw4w9WgXcQ" }, 400);

  const videoId = extractId(url);
  if (!videoId) return json({ error: "Invalid YouTube URL or video ID" }, 400);

  try {
    const data = await ytGet("videos", {
      part: "snippet,contentDetails,statistics,status",
      id: videoId,
    }, env);

    if (!data.items?.length) return json({ error: "Video not found" }, 404);
    const v = data.items[0];

    return json({
      videoId,
      title:         v.snippet.title,
      description:   v.snippet.description,
      channel:       v.snippet.channelTitle,
      channelId:     v.snippet.channelId,
      published:     v.snippet.publishedAt,
      tags:          v.snippet.tags || [],
      duration:      v.contentDetails.duration,    // ISO 8601 e.g. PT4M13S
      definition:    v.contentDetails.definition,  // hd or sd
      caption:       v.contentDetails.caption,
      views:         v.statistics.viewCount,
      likes:         v.statistics.likeCount,
      comments:      v.statistics.commentCount,
      thumbnail:     v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url,
      embeddable:    v.status.embeddable,
      privacyStatus: v.status.privacyStatus,
    });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
