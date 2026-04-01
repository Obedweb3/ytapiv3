import { json, extractId, getQuery } from "../lib.js";

// Try multiple Innertube clients in order until one returns valid stream URLs
const CLIENTS = [
  {
    name: "IOS",
    body: {
      context: {
        client: {
          clientName:    "IOS",
          clientVersion: "19.09.3",
          deviceModel:   "iPhone16,2",
          userAgent:     "com.google.ios.youtube/19.09.3 (iPhone16,2; U; CPU iOS 17_5 like Mac OS X)",
          hl: "en",
          gl: "US",
        },
      },
      playbackContext: { contentPlaybackContext: { signatureTimestamp: 19950 } },
    },
    headers: {
      "Content-Type":              "application/json",
      "User-Agent":                "com.google.ios.youtube/19.09.3 (iPhone16,2; U; CPU iOS 17_5 like Mac OS X)",
      "X-YouTube-Client-Name":    "5",
      "X-YouTube-Client-Version": "19.09.3",
    },
  },
  {
    name: "ANDROID",
    body: {
      context: {
        client: {
          clientName:       "ANDROID",
          clientVersion:    "19.09.37",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
        },
      },
      playbackContext: { contentPlaybackContext: { signatureTimestamp: 19950 } },
    },
    headers: {
      "Content-Type":              "application/json",
      "User-Agent":                "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
      "X-YouTube-Client-Name":    "3",
      "X-YouTube-Client-Version": "19.09.37",
    },
  },
  {
    name: "WEB_EMBEDDED",
    body: {
      context: {
        client: {
          clientName:    "WEB_EMBEDDED_PLAYER",
          clientVersion: "2.20231219.01.00",
          hl: "en",
          gl: "US",
        },
        thirdParty: { embedUrl: "https://www.youtube.com/" },
      },
      playbackContext: { contentPlaybackContext: { signatureTimestamp: 19950 } },
    },
    headers: {
      "Content-Type": "application/json",
      "Origin":       "https://www.youtube.com",
      "Referer":      "https://www.youtube.com/",
    },
  },
];

async function getPlayer(videoId) {
  const url = "https://www.youtube.com/youtubei/v1/player";
  let lastError = null;

  for (const client of CLIENTS) {
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: client.headers,
        body:    JSON.stringify({ ...client.body, videoId }),
      });

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const formats = [
        ...(data.streamingData?.formats         || []),
        ...(data.streamingData?.adaptiveFormats || []),
      ].filter(f => f.url);

      if (formats.length > 0) {
        console.log(`Client ${client.name} succeeded with ${formats.length} formats`);
        return { data, formats, client: client.name };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`All Innertube clients failed. Last error: ${lastError?.message}`);
}

export async function handleDownload(request, _env) {
  const { url, type = "mp4", quality } = getQuery(request);
  if (!url) return json({ error: "Missing ?url=  Add &type=mp4|mp3 and optionally &quality=720" }, 400);

  const videoId = extractId(url);
  if (!videoId) return json({ error: "Invalid YouTube URL or video ID" }, 400);

  try {
    const { data, formats, client } = await getPlayer(videoId);

    if (type === "mp3") {
      const audios = formats
        .filter(f => f.mimeType?.startsWith("audio"))
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      if (!audios.length) return json({ error: "No audio formats found" }, 404);

      const best = audios[0];
      return json({
        videoId,
        title:      data.videoDetails?.title,
        type:       "audio",
        clientUsed: client,
        mime:       best.mimeType,
        bitrate:    best.bitrate,
        url:        best.url,
        note:       "M4A stream — use ffmpeg to convert to mp3 if needed",
        allOptions: audios.map(a => ({ itag: a.itag, mime: a.mimeType, bitrate: a.bitrate })),
      });
    }

    // MP4
    const mp4s = formats
      .filter(f => f.mimeType?.includes("video/mp4"))
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    if (!mp4s.length) return json({ error: "No MP4 formats found" }, 404);

    const chosen = quality
      ? (mp4s.find(f => String(f.height) === String(quality)) || mp4s[0])
      : mp4s[0];

    return json({
      videoId,
      title:      data.videoDetails?.title,
      type:       "video",
      clientUsed: client,
      quality:    chosen.qualityLabel || `${chosen.height}p`,
      mime:       chosen.mimeType,
      width:      chosen.width,
      height:     chosen.height,
      url:        chosen.url,
      allOptions: mp4s.map(v => ({
        itag:    v.itag,
        quality: v.qualityLabel || `${v.height}p`,
        mime:    v.mimeType,
        width:   v.width,
        height:  v.height,
      })),
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
