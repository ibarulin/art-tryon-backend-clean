// api/proxy.js
// Прокси до прямого URL картинки для обхода CORS

import { cors } from './_cors';

export default async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });

    // Тянем ресурс как браузер
    const upstream = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      }
    });

    if (!upstream.ok) {
      return res
        .status(502)
        .json({ ok: false, error: `Upstream failed: ${upstream.status} ${upstream.statusText}` });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    // Небольшой кэш на 5 минут
    res.setHeader('Cache-Control', 'public, max-age=300');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  } catch (e) {
    console.error('proxy error', e);
    res.status(500).json({ ok: false, error: 'Proxy error' });
  }
}
