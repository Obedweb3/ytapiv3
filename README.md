# 🎬 YT API — Cloudflare Worker

YouTube API ported from Vercel Serverless → Cloudflare Workers.  
Uses **ES Modules**, native `fetch` (no axios), and a single-file router.

---

## 📁 Project Structure

```
yt-api-worker/
├── wrangler.toml          ← CF Worker config
├── package.json
└── src/
    ├── worker.js          ← Entry point + URL router
    ├── lib.js             ← Shared helpers (json, ytGet, extractId, getQuery)
    └── routes/
        ├── health.js      ← GET /api/health
        ├── search.js      ← GET /api/search
        ├── info.js        ← GET /api/info
        ├── download.js    ← GET /api/download
        ├── channel.js     ← GET /api/channel
        ├── playlist.js    ← GET /api/playlist
        └── index.js       ← GET /  (docs page)
```

---

## 🚀 Deploy

### 1. Install Wrangler

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Add your YouTube API key as a secret

```bash
npx wrangler secret put YOUTUBE_API_KEY
# paste your key when prompted
```

> Get a key at https://console.developers.google.com — enable **YouTube Data API v3**

### 4. Deploy

```bash
npm run deploy
```

Your API is live at:  
`https://yt-api.<your-subdomain>.workers.dev`

---

## 🔧 Local Development

```bash
npm run dev
```

The worker runs at `http://localhost:8787`.  
Set the key locally in a `.dev.vars` file (gitignored):

```
YOUTUBE_API_KEY=your_key_here
```

---

## 📡 Endpoints

| Route | Query params | Source |
|---|---|---|
| `GET /api/health` | — | — |
| `GET /api/search` | `?q=` `&type=` `&order=` `&maxResults=` `&videoDuration=` `&pageToken=` | YouTube Data API v3 |
| `GET /api/info` | `?url=` (video ID or full URL) | YouTube Data API v3 |
| `GET /api/download` | `?url=` `&type=mp4\|mp3` `&quality=1080\|720\|480\|360` | Innertube (free, no key) |
| `GET /api/channel` | `?id=` `&videos=true` `&maxResults=` `&pageToken=` | YouTube Data API v3 |
| `GET /api/playlist` | `?id=` `&maxResults=` `&pageToken=` | YouTube Data API v3 |

---

## ⚙️ Key Differences vs Vercel Version

| | Vercel | Cloudflare Worker |
|---|---|---|
| Module system | CommonJS (`require`) | ES Modules (`import`) |
| HTTP client | axios | native `fetch` |
| Routing | File-based (`api/*.js`) | Manual router in `worker.js` |
| Config | `vercel.json` | `wrangler.toml` |
| Secrets | Vercel env vars | `wrangler secret put` |
| Timeout | 10–60s | 30s CPU time (generous wall time) |

---

## ⚠️ Notes

- `/api/download` stream URLs **expire** in ~6 hours — always fetch fresh.
- 1080p+ video has **no audio** — merge with ffmpeg if needed.
- The `YOUTUBE_API_KEY` is only needed for metadata routes (search, info, channel, playlist). The download route uses Innertube for free.
