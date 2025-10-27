// /api/resolveProductImage.js
export default async function handler(req, res) {
  try {
    const { handle } = req.query;
    if (!handle) {
      return res.status(400).json({ ok: false, error: 'Missing ?handle' });
    }

    // Настройки
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'barulins-shop.myshopify.com';
    const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
    const API_VERSION = '2024-10';

    if (!STOREFRONT_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Missing SHOPIFY_STOREFRONT_TOKEN' });
    }

    const url = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

    const query = `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          title
          featuredImage { url }
          images(first: 4) { edges { node { url } } }
        }
      }
    `;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables: { handle } }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: `Shopify error ${resp.status}`, detail: text });
    }

    const data = JSON.parse(text);
    const p = data?.data?.productByHandle;
    if (!p) return res.status(404).json({ ok: false, error: 'Product not found' });

    const image =
      p.featuredImage?.url ||
      p.images?.edges?.[0]?.node?.url ||
      p.images?.edges?.[1]?.node?.url ||
      null;

    if (!image) return res.status(404).json({ ok: false, error: 'No image on product' });

    return res.status(200).json({ ok: true, image, title: p.title });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Server error' });
  }
}
