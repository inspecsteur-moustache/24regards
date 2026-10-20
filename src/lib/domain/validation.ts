import type { Article, Magazine, Redacteur, SiteConfig } from './models';
export function validateContent(
  magazines: readonly Magazine[],
  articles: readonly Article[],
  authors: readonly Redacteur[],
  site: SiteConfig,
): void {
  const unique = (values: readonly string[], name: string) => {
    if (values.some((v) => !v) || new Set(values).size !== values.length)
      throw new Error(`${name} : identifiants manquants ou dupliqués`);
  };
  unique(
    magazines.map((m) => m.id),
    'Magazines',
  );
  unique(
    articles.map((a) => a.id),
    'Articles',
  );
  unique(
    articles.map((a) => a.slug),
    'Slugs',
  );
  unique(
    authors.map((a) => a.slug),
    'Rédacteurs',
  );
  const authorSlugs = new Set(authors.map((a) => a.slug));
  for (const magazine of magazines)
    if (
      typeof magazine.title !== 'string' ||
      !magazine.title ||
      !Number.isInteger(magazine.number) ||
      typeof magazine.pdfFile !== 'string' ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(magazine.publicationMonth) ||
      !magazine.pdfFile.startsWith('/pdfs/') ||
      magazine.pdfFile.includes('..')
    )
      throw new Error(`Magazine invalide : ${magazine.id}`);
  for (const article of articles) {
    if (
      typeof article.title !== 'string' ||
      !article.title ||
      typeof article.contentHtml !== 'string' ||
      !article.contentHtml ||
      !/^[a-z0-9-]+$/.test(article.slug) ||
      !Number.isFinite(Date.parse(article.publishedAt))
    )
      throw new Error(`Article invalide : ${article.slug}`);
    if (article.authorSlug && !authorSlugs.has(article.authorSlug))
      throw new Error(`Rédacteur inconnu : ${article.authorSlug}`);
    if (/<(?:script|iframe|form)\b|\son\w+\s*=|(?:javascript|data):/i.test(article.contentHtml))
      throw new Error(`HTML interdit : ${article.slug}`);
  }
  for (const author of authors) {
    if (
      typeof author.name !== 'string' ||
      !author.name ||
      typeof author.role !== 'string' ||
      !author.role ||
      !Array.isArray(author.favorites) ||
      !author.favorites.every((favorite) => typeof favorite === 'string') ||
      !Array.isArray(author.texts)
    )
      throw new Error(`Fiche invalide : ${author.slug}`);
    for (const text of author.texts)
      if (
        typeof text.title !== 'string' ||
        !text.title ||
        !['article', 'magazine'].includes(text.kind) ||
        !(text.kind === 'article'
          ? articles.some((a) => a.slug === text.target)
          : magazines.some((m) => m.id === text.target))
      )
        throw new Error(`Texte inconnu pour ${author.name} : ${text.target}`);
  }
  if (!site.email.includes('@') || !site.siteUrl.startsWith('https://'))
    throw new Error('Configuration du site invalide');
  if (site.newsletter.actionUrl && !site.newsletter.actionUrl.startsWith('https://'))
    throw new Error('Le formulaire doit utiliser HTTPS');
}
