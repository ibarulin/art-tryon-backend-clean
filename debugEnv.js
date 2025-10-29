export default function handler(req, res) {
  res.status(200).json({
    SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || null,
    HAS_TOKEN: !!process.env.SHOPIFY_STOREFRONT_TOKEN,
    TOKEN_PREFIX: process.env.SHOPIFY_STOREFRONT_TOKEN
      ? process.env.SHOPIFY_STOREFRONT_TOKEN.slice(0, 6)
      : null,
  });
}
