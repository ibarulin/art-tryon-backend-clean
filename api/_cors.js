// api/_cors.js
// Единая настройка CORS для всех эндпоинтов

export function cors(res, reqOrigin) {
  // Белый список доменов, с которых разрешены запросы к вашему backend
  const ALLOW = [
    'https://barulins.art',
    'https://www.barulins.art',
    'https://barulins.shop',
    'https://www.barulins.shop',
    'https://tilda.ws' // если иногда открываете превью Tilda
  ];

  // Если Origin из запроса в списке — вернем его, иначе по умолчанию основной домен
  const origin = reqOrigin && ALLOW.includes(reqOrigin) ? reqOrigin : 'https://barulins.art';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
