// api/_cors.js
export function cors(res, reqOrigin) {
  // Разрешённые домены (добавьте при необходимости)
  const ALLOW = [
    'https://barulins.art',
    'https://www.barulins.art',
    'https://barulins.shop',
    'https://www.barulins.shop',
    'https://tilda.ws',
  ];
  const origin = reqOrigin && ALLOW.includes(reqOrigin) ? reqOrigin : 'https://barulins.art';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
