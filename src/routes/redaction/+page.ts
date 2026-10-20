import { authorSelection } from '#lib/application/catalog.ts';
import { articleCatalog, authorCatalog, magazineCatalog } from '#lib/composition/catalog.ts';
export function load() {
  const selection = authorSelection(authorCatalog, articleCatalog, magazineCatalog);
  return { ...selection, selected: selection.selected! };
}
