import { magazineSelection } from '#lib/application/catalog.ts';
import { magazineCatalog } from '#lib/composition/catalog.ts';
export function load() {
  return magazineSelection(magazineCatalog);
}
