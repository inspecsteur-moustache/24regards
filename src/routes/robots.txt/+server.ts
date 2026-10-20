import { site } from '#lib/composition/catalog.ts';
export const prerender = true;
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`, {
    headers: { 'content-type': 'text/plain' },
  });
}
