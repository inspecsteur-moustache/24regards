export interface Magazine {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly publicationMonth: string;
  readonly pdfFile: string;
  readonly legacyPath: string;
}
export interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly authorSlug?: string;
  readonly sourceUrl: string;
  readonly contentHtml: string;
}
export interface TextReference {
  readonly title: string;
  readonly kind: 'article' | 'magazine';
  readonly target: string;
}
export interface Redacteur {
  readonly slug: string;
  readonly name: string;
  readonly role: string;
  readonly favorites: readonly string[];
  readonly texts: readonly TextReference[];
}
export interface SiteConfig {
  readonly siteUrl: string;
  readonly contactName: string;
  readonly email: string;
  readonly blueskyUrl: string;
  readonly instagramUrl: string;
  readonly newsletter: {
    readonly actionUrl: string;
    readonly emailFieldName: string;
    readonly hiddenFields: Readonly<Record<string, string>>;
  };
}
export interface Credit {
  readonly label: string;
  readonly sourceUrl: string;
  readonly credit?: string;
  readonly localPath?: string;
}
export class ReaderError extends Error {
  constructor(
    message: string,
    readonly code: 'load' | 'render' | 'cancelled' | 'pagination',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ReaderError';
  }
}
