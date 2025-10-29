// api/resolveProductImage.js
// Принимает ссылку на страницу товара/коллекции и возвращает главный URL картинки

import { cors } from './_cors';

export default async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ ok: false, error: 'Missing url' });

    // Забираем HTML страницы
    const html = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      }
    }).then(r => r.text());

    // Пробуем разные варианты, где магазины обычно кладут главную картинку
    let imageUrl = null;

    // 1) og:image
    imageUrl = imageUrl || html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];

    // 2) twitter:image
    imageUrl = imageUrl || html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];

    // 3) JSON-LD "image": "..."
    imageUrl =
      imageUrl ||
      html.match(/"image"\s*:\s*"([^"]+\.(?:png|jpe?g|webp)(?:\?[^"]*)?)"/i)?.[1];

    // 4) Любая <img ... src="...jpg|png|webp"> — берём первую крупную
    if (!imageUrl) {
      const candidates = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:png|jpe?g|webp)(?:\?[^"']*)?)["'][^>]*>/gi)]
        .map(m => m[1]);
      imageUrl = candidates?.[0] || null;
    }

    if (!imageUrl) {
      return res.status(404).json({ ok: false, error: 'Image not found on page' });
    }

    // Приведём к абсолютному URL, если вдруг относительный
    try {
      const u = new URL(imageUrl);
      imageUrl = u.toString();
    } catch {
      // относительный путь
      const base = new URL(pageUrl);
      imageUrl = new URL(imageUrl, base.origin).toString();
    }

    return res.status(200).json({ ok: true, imageUrl });
  } catch (e) {
    console.error('resolver error', e);
    return res.status(500).json({ ok: false, error: 'Resolver error' });
  }
}
