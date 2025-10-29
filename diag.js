// /api/diag.js
export default async function handler(req, res) {
  const SHOPIFY_DOMAIN = 'barulins-shop.myshopify.com'; // фиксированно
  const API_VERSION = '2024-10';
  const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || null;

  const result = {
    env: {
      hasToken: !!TOKEN,
      tokenPrefix: TOKEN ? TOKEN.slice(0, 7) : null,
    },
    shopify: null,
    error: null,
  };

  if (!TOKEN) {
    return res.status(200).json({ ...result, error: 'NO_TOKEN_IN_ENV' });
  }

  try {
    const url = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
    const query = `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          title
          featuredImage { url }
        }
      }
    `;
    const body = JSON.stringify({
      query,
      variables: { handle: 'sa-bouquet-of-peonies-1' },
    });

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body,
    });

    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    result.shopify = { status: r.status, body: data || text };
    return res.status(200).json(result);
  } catch (e) {
    result.error = e?.message || String(e);
    return res.status(200).json(result);
  }
}
