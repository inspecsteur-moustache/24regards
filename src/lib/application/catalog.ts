import type { ArticleCatalog, AuthorCatalog, MagazineCatalog } from '../domain/ports';
export function magazineSelection(catalog: MagazineCatalog, id?: string) {
  const magazines = [...catalog.list()].sort((a, b) => b.number - a.number);
  return { magazines, selected: (id && catalog.get(id)) || magazines[0] };
}
export function articleSelection(catalog: ArticleCatalog, authors: AuthorCatalog, slug?: string) {
  const articles = [...catalog.list()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const selected = slug ? catalog.get(slug) : articles[0];
  return {
    articles,
    selected,
    author: selected?.authorSlug ? authors.get(selected.authorSlug) : undefined,
  };
}
export function authorSelection(
  authors: AuthorCatalog,
  articles: ArticleCatalog,
  magazines: MagazineCatalog,
  slug = 'mathieu-giroux',
) {
  const selected = authors.get(slug);
  const texts = selected ? [...selected.texts] : [];
  for (const article of articles.list())
    if (
      article.authorSlug === slug &&
      !texts.some((t) => t.kind === 'article' && t.target === article.slug)
    )
      texts.unshift({ title: article.title, kind: 'article', target: article.slug });
  return {
    authors: authors.list(),
    selected,
    texts: texts.map((text) => ({
      ...text,
      href: text.kind === 'article' ? `/articles/${text.target}/` : `/?numero=${text.target}`,
      date:
        text.kind === 'article'
          ? articles.get(text.target)?.publishedAt
          : magazines.get(text.target)?.publicationMonth,
    })),
  };
}
