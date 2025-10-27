// /api/resolveProductImage.js
export default async function handler(req, res) {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ ok: false, error: 'Missing url' });

    let u;
    try { u = new URL(pageUrl); } catch { return res.status(400).json({ ok: false, error: 'Invalid url' }); }

    // Разрешаем только ваши домены магазина
    const allowed = ['barulins.shop', 'www.barulins.shop', 'barulins.art', 'www.barulins.art'];
    if (!allowed.includes(u.hostname)) {
      return res.status(400).json({ ok: false, error: 'Domain not allowed' });
    }

    const r = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'TryOnResolver/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'Upstream ' + r.status });
    const html = await r.text();

    // 1) og:image
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (og && og[1]) {
      return res.json({ ok: true, image: absolutize(og[1], u) });
    }

    // 2) JSON-LD (Shopify часто кладет изображения сюда)
    const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of ldBlocks) {
      try {
        const data = JSON.parse(m[1].trim());
        const imgs = extractImagesFromJsonLd(data);
        if (imgs.length) return res.json({ ok: true, image: absolutize(imgs[0], u) });
      } catch {}
    }

    // 3) Fallback: первая <img ...> с расширением
    const img = html.match(/<img[^>]+(data-src|src)=["']([^"']+\.(?:jpe?g|png|webp))["']/i);
    if (img && img[2]) {
      return res.json({ ok: true, image: absolutize(img[2], u) });
    }

    return res.status(404).json({ ok: false, error: 'Image not found' });

  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Resolver error' });
  }

  function absolutize(src, base) {
    if (!src) return src;
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('/')) return base.origin + src;
    return src;
  }
  function extractImagesFromJsonLd(data) {
    const out = [];
    const walk = (d) => {
      if (!d) return;
      if (typeof d === 'string' && /\.(png|jpe?g|webp)(\?|$)/i.test(d)) out.push(d);
      else if (Array.isArray(d)) d.forEach(walk);
      else if (typeof d === 'object') Object.values(d).forEach(walk);
    };
    walk(data);
    return out;
  }
}
