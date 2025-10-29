// app/api/resolveProductImage/route.js
export const runtime = 'nodejs'; // или 'edge' при желании

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let handle = searchParams.get('handle');

    if (!handle) {
      const productUrl = searchParams.get('url');
      if (productUrl) {
        try {
          const u = new URL(productUrl);
          const parts = u.pathname.split('/').filter(Boolean);
          const i = parts.indexOf('products');
          if (i >= 0 && parts[i + 1]) handle = parts[i + 1];
        } catch {}
      }
    }
    if (!handle) {
      return Response.json({ ok: false, error: 'Missing ?handle or ?url with /products/<handle>' }, { status: 400 });
    }

    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'barulins-shop.myshopify.com';
    const API_VERSION = '2023-10';
    const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (!STOREFRONT_TOKEN) {
      return Response.json({ ok: false, error: 'Missing SHOPIFY_STOREFRONT_TOKEN env' }, { status: 500 });
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
      return new Response(JSON.stringify({ ok: false, error: `Shopify HTTP ${resp.status}`, detail: text }), { status: resp.status });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return new Response(JSON.stringify({ ok: false, error: 'Bad JSON from Shopify', detail: text?.slice(0,500) }), { status: 502 }); }

    const p = data?.data?.productByHandle;
    if (!p) return Response.json({ ok: false, error: 'Product not found' }, { status: 404 });

    const candidates = [
      p?.featuredImage?.url,
      ...(p?.images?.edges || []).map(e => e?.node?.url).filter(Boolean)
    ].filter(Boolean);
    const image = candidates[0] || null;
    if (!image) return Response.json({ ok: false, error: 'No image on product' }, { status: 404 });

    return Response.json({ ok: true, image, title: p.title, handle });
  } catch (e) {
    const msg = e?.name === 'AbortError' ? 'Upstream timeout' : (e?.message || 'Server error');
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
