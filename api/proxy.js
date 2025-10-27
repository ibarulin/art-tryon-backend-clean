// /api/proxy.js
export default async function handler(req, res) {
  try {
    const src = req.query.src;
    if (!src) return res.status(400).send('Missing src');

    let u;
    try { u = new URL(src); } catch { return res.status(400).send('Invalid URL'); }

    // Разрешённые источники
    const allowedHosts = [
      'cdn.shopify.com',
      'barulins.shop',
      'www.barulins.shop',
      'barulins.art',
      'www.barulins.art',
    ];
    if (!allowedHosts.includes(u.hostname)) {
      return res.status(400).send('Host not allowed');
    }

    const upstream = await fetch(src, {
      headers: {
        'User-Agent': 'TryOnProxy/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5',
        'Referer': 'https://barulins.shop/',
      },
    });

    if (!upstream.ok) {
      return res.status(502).send('Upstream error: ' + upstream.status);
    }

    const ct = upstream.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//i.test(ct)) {
      return res.status(400).send('Upstream is not an image');
    }

    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send('Proxy error');
  }
}
