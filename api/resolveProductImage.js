// /api/resolveProductImage.js
export default async function handler(req, res) {
  try {
    const { handle } = req.query;
    if (!handle) {
      return res.status(400).json({ ok: false, error: 'Missing ?handle' });
    }

    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'barulins.shop';
    const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (!STOREFRONT_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Missing SHOPIFY_STOREFRONT_TOKEN' });
    }

    const gql = `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          featuredImage {
            url
          }
          images(first: 1) {
            edges {
              node { url }
            }
          }
        }
      }
    `;

    const resp = await fetch(`https://${SHOPIFY_DOMAIN}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: gql, variables: { handle } }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ ok: false, error: `Shopify error ${resp.status}`, detail: text });
    }

    const data = await resp.json();
    const p = data?.data?.productByHandle;
    if (!p) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    const featured = p.featuredImage?.url;
    const first = p.images?.edges?.[0]?.node?.url;
    const image = featured || first || null;

    if (!image) {
      return res.status(404).json({ ok: false, error: 'No image on product' });
    }

    return res.status(200).json({ ok: true, image, title: p.title });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Server error' });
  }
}
