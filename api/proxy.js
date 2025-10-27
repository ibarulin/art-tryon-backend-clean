// /api/proxy.js
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // OPTIONS handled

  try {
    const { src } = req.query;
    if (!src || !/^https?:\/\//i.test(src)) return res.status(400).send('Bad src');

    const url = new URL(src);
    // Белый список хостов — безопасно
    const whitelist = new Set([
      'cdn.shopify.com',
      'barulins.shop','www.barulins.shop',
      'barulins.art','www.barulins.art'
    ]);
    if (!whitelist.has(url.hostname)) {
      return res.status(403).send('Forbidden host');
    }

    const upstream = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!upstream.ok) return res.status(upstream.status).send('Upstream error');

    const ctype = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', ctype);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Proxy error');
  }
}
