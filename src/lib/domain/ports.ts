import type { Article, Magazine, Redacteur } from './models';
export interface MagazineCatalog {
  list(): readonly Magazine[];
  get(id: string): Magazine | undefined;
}
export interface ArticleCatalog {
  list(): readonly Article[];
  get(slug: string): Article | undefined;
}
export interface AuthorCatalog {
  list(): readonly Redacteur[];
  get(slug: string): Redacteur | undefined;
}
export interface PageDimensions {
  readonly width: number;
  readonly height: number;
}
export interface RasterPage extends PageDimensions {
  readonly url: string;
  dispose(): void;
}
export interface PdfRasterizer {
  open(url: string, signal: AbortSignal): Promise<number>;
  dimensions(pageIndex: number): Promise<PageDimensions>;
  render(pageIndex: number, width: number, signal: AbortSignal): Promise<RasterPage>;
  destroy(): Promise<void>;
}
export interface PaginatedPage {
  readonly html: string;
  readonly offset: number;
}
export interface PaginationOptions extends PageDimensions {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly signal: AbortSignal;
}
export interface ArticlePaginator {
  paginate(html: string, options: PaginationOptions): Promise<readonly PaginatedPage[]>;
}
export interface BookSnapshot {
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly orientation: 'single' | 'spread';
}
export interface PageNavigator {
  snapshot(): BookSnapshot;
  next(): Promise<void>;
  previous(): Promise<void>;
  goTo(index: number): void;
  subscribe(listener: (snapshot: BookSnapshot) => void): () => void;
}
export interface FlipProgress {
  readonly from: number;
  readonly to: number;
  readonly progress: number;
}
export interface FlipProgressSource {
  subscribeProgress(listener: (event: FlipProgress) => void): () => void;
}
export type Theme = 'light' | 'dark';
export interface ThemePreferenceStore {
  read(): Theme | undefined;
  write(theme: Theme): void;
}
