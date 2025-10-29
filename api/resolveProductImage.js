// api/resolveProductImage.js
export default async function handler(req, res) {
  try {
    // 1) handle можно передать прямо или дать URL товара ?url=https://.../products/<handle>
    let { handle } = req.query;
    if (!handle && req.query.url) {
      try {
        const u = new URL(req.query.url);
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.indexOf('products');
        if (i >= 0 && parts[i + 1]) handle = parts[i + 1];
      } catch {}
    }
    if (!handle) {
      return res.status(400).json({ ok: false, error: 'Missing ?handle or ?url with /products/<handle>' });
    }

    // 2) Конфиг — берем из env, как вы настроили в Vercel
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'barulins-shop.myshopify.com';
    const API_VERSION = '2023-10';
    const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (!STOREFRONT_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Missing SHOPIFY_STOREFRONT_TOKEN env' });
    }

    const url = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
    const query = `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          title
          featuredImage { url }
          images(first: 10) { edges { node { url } } }
        }
      }
    `;

    // 3) Таймаут на всякий случай
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        'User-Agent': 'art-tryon-backend/1.0'
      },
      body: JSON.stringify({ query, variables: { handle } }),
      signal: controller.signal
    }).finally(() => clearTimeout(to));

    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: `Shopify HTTP ${resp.status}`, detail: text });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ ok: false, error: 'Bad JSON from Shopify', detail: text?.slice(0,500) }); }

    const p = data?.data?.productByHandle;
    if (!p) return res.status(404).json({ ok: false, error: 'Product not found' });

    const candidates = [
      p?.featuredImage?.url,
      ...(p?.images?.edges || []).map(e => e?.node?.url).filter(Boolean)
    ].filter(Boolean);

    const image = candidates[0] || null;
    if (!image) return res.status(404).json({ ok: false, error: 'No image on product' });

    return res.status(200).json({ ok: true, image, title: p.title, handle });
  } catch (e) {
    const msg = e?.name === 'AbortError' ? 'Upstream timeout' : (e?.message || 'Server error');
    return res.status(500).json({ ok: false, error: msg });
  }
}
