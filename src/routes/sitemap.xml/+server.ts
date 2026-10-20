import { articleCatalog, authorCatalog, site } from '#lib/composition/catalog.ts';
export const prerender = true;
export function GET() {
  const paths = [
    '/',
    '/articles/',
    '/redaction/',
    '/participer/',
    '/citations/',
    ...articleCatalog.list().map((article) => `/articles/${article.slug}/`),
    ...authorCatalog.list().map((author) => `/redaction/${author.slug}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${site.siteUrl}${path}</loc></url>`).join('')}</urlset>`,
    { headers: { 'content-type': 'application/xml' } },
  );
}
