// api/resolveProductImage.js
export const config = { runtime: 'nodejs' };

import { cors } from './_cors.js';

function absolutize(possibleUrl, base) {
  try {
    return new URL(possibleUrl).toString();
  } catch {
    return new URL(possibleUrl, new URL(base)).toString();
  }
}

function forceHttps(u) {
  try {
    const url = new URL(u);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.toString();
  } catch {
    return u;
  }
}

export default async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ ok: false, error: 'Missing url' });

    const r = await fetch(pageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': pageUrl,
      },
    });

    if (!r.ok) return res.status(502).json({ ok: false, error: `Fetch ${r.status}` });

    const finalUrl = r.url || pageUrl;
    const html = await r.text();

    let imageUrl = null;

    // 1) og:image
    imageUrl =
      imageUrl ||
      html.match(
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
      )?.[1];

    // 2) twitter:image
    imageUrl =
      imageUrl ||
      html.match(
        /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i
      )?.[1];

    // 3) JSON-LD blocks
    if (!imageUrl) {
      const ldBlocks = [
        ...html.matchAll(
          /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ),
      ];
      for (const m of ldBlocks) {
        try {
          const json = JSON.parse(m[1].trim());
          const candidates = [];
          const pushImage = (v) => {
            if (!v) return;
            if (typeof v === 'string') candidates.push(v);
            else if (Array.isArray(v)) v.forEach(pushImage);
            else if (typeof v === 'object') {
              if (v.url) candidates.push(v.url);
              if (v.image) pushImage(v.image);
            }
          };
          if (Array.isArray(json)) json.forEach((obj) => pushImage(obj?.image));
          else {
            pushImage(json?.image);
            if (json?.itemListElement) pushImage(json.itemListElement);
          }
          imageUrl = candidates.find((u) => /\.(png|jpe?g|webp)(\?|$)/i.test(u));
          if (imageUrl) break;
        } catch {
          // ignore JSON parse errors
        }
      }
    }

    // 4) fallback: первая подходящая <img src="...">
    if (!imageUrl) {
      const imgs = [
        ...html.matchAll(
          /<img[^>]+src=["']([^"']+\.(?:png|jpe?g|webp)(?:\?[^"']*)?)["'][^>]*>/gi
        ),
      ]
        .map((m) => m[1])
        .filter((u) => !/sprite|icon|logo|avatar|placeholder/i.test(u));
      imageUrl = imgs[0] || null;
    }

    if (!imageUrl) {
      return res
        .status(404)
        .json({ ok: false, error: 'Image not found on page' });
    }

    imageUrl = absolutize(imageUrl, finalUrl);
    imageUrl = forceHttps(imageUrl); // принудительный HTTPS

    return res.status(200).json({ ok: true, imageUrl });
  } catch (e) {
    console.error('resolver error', e);
    return res.status(500).json({ ok: false, error: 'Resolver error' });
  }
}
