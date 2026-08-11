// Vercel serverless function - proxies Instagram Graph API so the access
// token never ships to the browser. Requires INSTAGRAM_ACCESS_TOKEN as a
// server-side env var (NOT prefixed with VITE_).

const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache = { data: null, fetchedAt: 0 };

export default async function handler(req, res) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    res.status(500).json({ error: "INSTAGRAM_ACCESS_TOKEN is not configured on the server" });
    return;
  }

  const isFresh = cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) {
    res.status(200).json(cache.data);
    return;
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&access_token=${token}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Instagram API responded with ${response.status}`);
    }

    const body = await response.json();
    const photos = (body.data || []).filter((item) => item.media_type !== "VIDEO");

    cache = { data: photos, fetchedAt: Date.now() };
    res.status(200).json(photos);
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch Instagram feed", detail: error.message });
  }
}
