import { createBook, type BookOptions } from '@openpageflip/core';
import type { BookSnapshot, FlipProgressSource, PageNavigator } from '../../domain/ports';
export function createPageTurner(
  container: HTMLElement,
  pages: readonly HTMLElement[],
  options: Omit<BookOptions, 'pages'>,
) {
  const book = createBook(container, { ...options, pages });
  let destroyed = false;
  const snapshot = (): BookSnapshot => ({
    pageIndex: book.page,
    pageCount: book.pageCount,
    orientation: book.orientation === 'portrait' ? 'single' : 'spread',
  });
  const navigation: PageNavigator = {
    snapshot,
    async next() {
      if (destroyed) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) book.turnNext();
      else await book.flipNext();
    },
    async previous() {
      if (destroyed) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) book.turnPrev();
      else await book.flipPrev();
    },
    goTo(index) {
      if (!destroyed && Number.isInteger(index))
        book.turnTo(Math.max(0, Math.min(book.pageCount - 1, index)));
    },
    subscribe(listener) {
      const emit = () => listener(snapshot());
      const unsubscribes = (['init', 'flip', 'changeOrientation', 'update'] as const).map((event) =>
        book.on(event, emit),
      );
      emit();
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    },
  };
  const progress: FlipProgressSource = {
    subscribeProgress: (listener) => book.on('flipProgress', listener),
  };
  return {
    navigation,
    progress,
    refresh() {
      if (!destroyed) book.redraw();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      book.destroy();
    },
  };
}
