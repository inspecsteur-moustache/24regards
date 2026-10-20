import { error } from '@sveltejs/kit';
import { articleSelection } from '#lib/application/catalog.ts';
import { articleCatalog, authorCatalog } from '#lib/composition/catalog.ts';
export function entries() {
  return articleCatalog.list().map((article) => ({ slug: article.slug }));
}
export function load({ params }: { params: { slug: string } }) {
  const selection = articleSelection(articleCatalog, authorCatalog, params.slug);
  if (!selection.selected) error(404, 'Article introuvable');
  return { ...selection, selected: selection.selected };
}
