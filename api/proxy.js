export const config = { runtime: 'nodejs' };

import { Buffer } from 'node:buffer';
import { cors } from './_cors.js';

export default async function handler(req, res) {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ ok:false, error:'Missing url' });

    const upstream = await fetch(url, { headers: { 'User-Agent':'Mozilla/5.0' } });
    if (!upstream.ok) {
      return res.status(502).json({ ok:false, error:`Upstream ${upstream.status}` });
    }

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=300');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  } catch (e) {
    console.error('proxy error', e);
    res.status(500).json({ ok:false, error:'Proxy error' });
  }
}
