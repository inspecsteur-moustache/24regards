import { error } from '@sveltejs/kit';
import { articleCatalog, authorCatalog, magazineCatalog } from '#lib/composition/catalog.ts';
const redirects = new Map([
  ...articleCatalog.list().map((article) => [article.slug, `/articles/${article.slug}/`] as const),
  ...authorCatalog.list().map((author) => [author.slug, `/redaction/${author.slug}/`] as const),
  ...magazineCatalog
    .list()
    .map(
      (magazine) => [magazine.legacyPath.replaceAll('/', ''), `/?numero=${magazine.id}`] as const,
    ),
]);
export function entries() {
  return [...redirects.keys()].map((legacy) => ({ legacy }));
}
export function load({ params }: { params: { legacy: string } }) {
  const target = redirects.get(params.legacy);
  if (!target) error(404, 'Page introuvable');
  return { target };
}
