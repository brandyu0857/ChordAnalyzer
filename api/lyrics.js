// Proxies lyrics search to LRCLIB (lrclib.net) so the browser doesn't depend
// on LRCLIB's CORS policy, and caches results at the edge.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!q) {
    return res.status(400).json({ error: 'Missing q' });
  }
  try {
    const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'ChordAnalyzer (chord sheet editor lyrics lookup)' },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `LRCLIB error ${response.status}` });
    }
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.json(Array.isArray(data) ? data.slice(0, 20) : []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lyrics lookup failed';
    return res.status(502).json({ error: message });
  }
}
