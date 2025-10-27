// /api/resolveProductImage.js
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // OPTIONS handled

  try {
    const { shop = 'barulins.shop', handle } = req.query;
    if (!handle) return res.status(400).json({ ok:false, error:'Missing handle' });

    // ВРЕМЕННО: заглушка. Возвращаем 501, чтобы было понятно, что нужен API‑токен Shopify.
    return res.status(501).json({
      ok: false,
      error: 'Not implemented: connect Shopify Storefront API to resolve product images by handle'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
}
