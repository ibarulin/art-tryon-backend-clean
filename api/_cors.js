// /api/_cors.js
export function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://barulins.art', 'https://www.barulins.art'];
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return true; // preflight обработан
  }
  return false;
}
