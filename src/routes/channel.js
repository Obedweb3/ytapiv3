import { json, ytGet, getQuery } from "../lib.js";

export async function handleChannel(request, env) {
  const { id, videos, pageToken, maxResults = "12" } = getQuery(request);
  if (!id) return json({ error: "Missing ?id=  Example: /api/channel?id=UCxxxxxxx" }, 400);

  try {
    const ch = await ytGet("channels", {
      part: "snippet,statistics,brandingSettings",
      id,
    }, env);

    if (!ch.items?.length) return json({ error: "Channel not found" }, 404);
    const c = ch.items[0];

    const result = {
      channelId:   c.id,
      name:        c.snippet.title,
      description: c.snippet.description,
      handle:      c.snippet.customUrl || "",
      country:     c.snippet.country   || "",
      subscribers: c.statistics.subscriberCount,
      views:       c.statistics.viewCount,
      videoCount:  c.statistics.videoCount,
      thumbnail:   c.snippet.thumbnails?.high?.url,
      banner:      c.brandingSettings?.image?.bannerExternalUrl || "",
    };

    if (videos === "true") {
      const vids = await ytGet("search", {
        part:       "snippet",
        channelId:  id,
        type:       "video",
        order:      "date",
        maxResults,
        pageToken:  pageToken || undefined,
      }, env);

      result.videos = (vids.items || []).map(i => ({
        videoId:   i.id.videoId,
        title:     i.snippet.title,
        published: i.snippet.publishedAt,
        thumbnail: i.snippet.thumbnails?.high?.url,
      }));
      result.nextPageToken = vids.nextPageToken || null;
    }

    return json(result);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
