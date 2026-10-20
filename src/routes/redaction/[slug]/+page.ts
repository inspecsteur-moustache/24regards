import { error } from '@sveltejs/kit';
import { authorSelection } from '#lib/application/catalog.ts';
import { articleCatalog, authorCatalog, magazineCatalog } from '#lib/composition/catalog.ts';
export function entries() {
  return authorCatalog.list().map((author) => ({ slug: author.slug }));
}
export function load({ params }: { params: { slug: string } }) {
  const selection = authorSelection(authorCatalog, articleCatalog, magazineCatalog, params.slug);
  if (!selection.selected) error(404, 'Fiche introuvable');
  return { ...selection, selected: selection.selected };
}
