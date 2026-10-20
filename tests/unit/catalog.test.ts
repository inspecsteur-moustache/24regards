import { describe, expect, it } from 'vitest';
import magazines from '../../src/lib/content/magazines.json';
import articles from '../../src/lib/content/articles.json';
import authors from '../../src/lib/content/authors.json';
import site from '../../src/lib/content/site.json';
import { validateContent } from '../../src/lib/domain/validation';
import type { Article, Redacteur } from '../../src/lib/domain/models';
import {
  createArticleCatalog,
  createAuthorCatalog,
  createMagazineCatalog,
} from '../../src/lib/infrastructure/catalog/json-catalog';
import {
  articleSelection,
  authorSelection,
  magazineSelection,
} from '../../src/lib/application/catalog';
const articleCatalog = createArticleCatalog(articles);
const authorCatalog = createAuthorCatalog(authors as Redacteur[]);
const magazineCatalog = createMagazineCatalog(magazines);
describe('Contrat du catalogue', () => {
  const memoryArticles = {
    list: () => articles,
    get: (slug: string) => articles.find((article) => article.slug === slug),
  };
  for (const [name, catalog] of [
    ['JSON', articleCatalog],
    ['mémoire', memoryArticles],
  ] as const) {
    it(`${name} : sélection stable et absence explicite`, () => {
      expect(catalog.list()).toHaveLength(6);
      expect(catalog.get(articles[0].slug)).toEqual(articles[0]);
      expect(catalog.get('inconnu')).toBeUndefined();
    });
  }
  it('sélectionne les publications les plus récentes', () => {
    expect(magazineSelection(magazineCatalog).selected.id).toBe('11');
    expect(articleSelection(articleCatalog, authorCatalog).selected?.slug).toBe(
      'critique-lagent-secret',
    );
  });
  it('conserve la sélection explicite et les erreurs de recherche', () => {
    expect(magazineSelection(magazineCatalog, '9').selected.number).toBe(9);
    expect(articleSelection(articleCatalog, authorCatalog, 'inconnu').selected).toBeUndefined();
  });
  it('réunit les textes sans doublon et conserve les références aux numéros', () => {
    const selected = authorSelection(authorCatalog, articleCatalog, magazineCatalog);
    expect(selected.selected?.name).toBe('Mathieu Giroux');
    expect(selected.texts.some((text) => text.href.includes('critique-eddington'))).toBe(true);
    expect(
      new Set(selected.texts.map((text) => `${text.kind}:${text.target}:${text.title}`)).size,
    ).toBe(selected.texts.length);
    expect(
      authorSelection(authorCatalog, articleCatalog, magazineCatalog, 'billy-b').texts[0].href,
    ).toBe('/?numero=10');
  });
});
describe('Validation éditoriale', () => {
  it('valide tous les contenus importés', () => {
    expect(() => validateContent(magazines, articles, authors as Redacteur[], site)).not.toThrow();
    expect(authors.every((author) => author.favorites.length === 10)).toBe(true);
    expect(articles.map((a) => a.contentHtml).join('')).not.toMatch(/vote-mois-dhorreur/);
  });
  it('rejette les doublons et les auteurs absents', () => {
    expect(() =>
      validateContent([...magazines, magazines[0]], articles, authors as Redacteur[], site),
    ).toThrow();
    const broken: Article[] = [{ ...articles[0], authorSlug: 'absent' }];
    expect(() => validateContent(magazines, broken, authors as Redacteur[], site)).toThrow(
      'Rédacteur inconnu',
    );
  });
  it('rejette le HTML actif et les chemins ambigus', () => {
    expect(() =>
      validateContent(
        magazines,
        [{ ...articles[0], contentHtml: '<script>alert(1)</script>' }],
        authors as Redacteur[],
        site,
      ),
    ).toThrow('HTML interdit');
    expect(() =>
      validateContent(
        [{ ...magazines[0], pdfFile: '/pdfs/../secret' }],
        articles,
        authors as Redacteur[],
        site,
      ),
    ).toThrow();
  });
});
