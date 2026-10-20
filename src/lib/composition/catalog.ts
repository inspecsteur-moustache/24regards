import magazinesJson from '../content/magazines.json';
import articlesJson from '../content/articles.json';
import authorsJson from '../content/authors.json';
import siteJson from '../content/site.json';
import creditsJson from '../content/credits.json';
import type { Article, Credit, Magazine, Redacteur, SiteConfig } from '../domain/models';
import { validateContent } from '../domain/validation';
import {
  createArticleCatalog,
  createAuthorCatalog,
  createMagazineCatalog,
} from '../infrastructure/catalog/json-catalog';
const magazines = magazinesJson as readonly Magazine[];
const articles = articlesJson as readonly Article[];
const authors = authorsJson as readonly Redacteur[];
export const site: SiteConfig = siteJson;
export const credits = creditsJson as readonly Credit[];
validateContent(magazines, articles, authors, site);
export const magazineCatalog = createMagazineCatalog(magazines);
export const articleCatalog = createArticleCatalog(articles);
export const authorCatalog = createAuthorCatalog(authors);
