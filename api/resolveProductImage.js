export const config = { runtime: 'nodejs' };

import { cors } from './_cors.js';

export default async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ ok:false, error:'Missing url' });

    const r = await fetch(pageUrl, { headers:{ 'User-Agent':'Mozilla/5.0' } });
    if (!r.ok) return res.status(502).json({ ok:false, error:`Fetch ${r.status}` });
    const html = await r.text();

    let imageUrl =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/"image"\s*:\s*"([^"]+\.(?:png|jpe?g|webp)(?:\?[^"]*)?)"/i)?.[1];

    if (!imageUrl) {
      const m = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:png|jpe?g|webp)(?:\?[^"']*)?)["'][^>]*>/gi)];
      imageUrl = m[0]?.[1] || null;
    }
    if (!imageUrl) return res.status(404).json({ ok:false, error:'Image not found on page' });

    try { imageUrl = new URL(imageUrl).toString(); }
    catch { imageUrl = new URL(imageUrl, new URL(pageUrl).origin).toString(); }

    res.status(200).json({ ok:true, imageUrl });
  } catch (e) {
    console.error('resolver error', e);
    res.status(500).json({ ok:false, error:'Resolver error' });
  }
}
