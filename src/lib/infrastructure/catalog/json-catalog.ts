import type { Article, Magazine, Redacteur } from '../../domain/models';
import type { ArticleCatalog, AuthorCatalog, MagazineCatalog } from '../../domain/ports';
export function createMagazineCatalog(items: readonly Magazine[]): MagazineCatalog {
  const values = Object.freeze([...items]);
  return { list: () => values, get: (id) => values.find((item) => item.id === id) };
}
export function createArticleCatalog(items: readonly Article[]): ArticleCatalog {
  const values = Object.freeze([...items]);
  return { list: () => values, get: (slug) => values.find((item) => item.slug === slug) };
}
export function createAuthorCatalog(items: readonly Redacteur[]): AuthorCatalog {
  const values = Object.freeze([...items]);
  return { list: () => values, get: (slug) => values.find((item) => item.slug === slug) };
}
