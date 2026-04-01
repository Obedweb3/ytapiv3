import { json, ytGet, getQuery } from "../lib.js";

export async function handlePlaylist(request, env) {
  const { id, pageToken, maxResults = "20" } = getQuery(request);
  if (!id) return json({ error: "Missing ?id=  Example: /api/playlist?id=PLxxxxxxx" }, 400);

  try {
    const pl = await ytGet("playlists", { part: "snippet,contentDetails", id }, env);
    if (!pl.items?.length) return json({ error: "Playlist not found" }, 404);
    const p = pl.items[0];

    const itemsParams = {
      part:       "snippet,contentDetails",
      playlistId: id,
      maxResults:  Number(maxResults),
    };
    if (pageToken) itemsParams.pageToken = pageToken;

    const items = await ytGet("playlistItems", itemsParams, env);

    return json({
      playlistId:    id,
      title:         p.snippet?.title        || "",
      description:   p.snippet?.description  || "",
      channel:       p.snippet?.channelTitle || "",
      channelId:     p.snippet?.channelId    || "",
      videoCount:    p.contentDetails?.itemCount || 0,
      thumbnail:     p.snippet?.thumbnails?.high?.url || p.snippet?.thumbnails?.default?.url || null,
      nextPageToken: items.nextPageToken || null,
      prevPageToken: items.prevPageToken || null,
      videos: (items.items || []).map(i => ({
        videoId:   i.contentDetails?.videoId || null,
        title:     i.snippet?.title          || "",
        position:  i.snippet?.position       ?? null,
        published: i.contentDetails?.videoPublishedAt || null,
        thumbnail: i.snippet?.thumbnails?.high?.url || i.snippet?.thumbnails?.default?.url || null,
        channel:   i.snippet?.videoOwnerChannelTitle || "",
      })),
    });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
