import { articleSelection } from '#lib/application/catalog.ts';
import { articleCatalog, authorCatalog } from '#lib/composition/catalog.ts';
export function load() {
  return articleSelection(articleCatalog, authorCatalog);
}
