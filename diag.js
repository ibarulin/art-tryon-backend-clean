// api/diag.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ ok: false, error: 'Missing url' });
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
        'Accept': 'text/html,*/*;q=0.8',
        'Referer': url,
      },
      redirect: 'follow',
    });
    const text = await r.text();
    return res.status(200).json({
      ok: true,
      status: r.status,
      finalUrl: r.url,
      len: text.length,
      sample: text.slice(0, 2000),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
