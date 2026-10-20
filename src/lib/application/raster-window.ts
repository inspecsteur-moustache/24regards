import type { BookSnapshot, PdfRasterizer, RasterPage } from '../domain/ports';
export function createRasterWindow(
  renderer: PdfRasterizer,
  onPage: (index: number, page: RasterPage | undefined) => void,
  onError: (error: unknown) => void,
) {
  const cache = new Map<number, RasterPage>();
  const active = new Map<number, AbortController>();
  let wanted: number[] = [];
  let width = 0;
  let destroyed = false;
  const pump = () => {
    if (destroyed) return;
    for (const index of wanted) {
      if (active.size >= 2) break;
      if (cache.has(index) || active.has(index)) continue;
      const controller = new AbortController();
      const renderWidth = width;
      active.set(index, controller);
      void renderer
        .render(index, renderWidth, controller.signal)
        .then((page) => {
          if (
            destroyed ||
            controller.signal.aborted ||
            width !== renderWidth ||
            !wanted.includes(index)
          ) {
            page.dispose();
            return;
          }
          cache.set(index, page);
          onPage(index, page);
        })
        .catch((error) => {
          if (!controller.signal.aborted && !destroyed) {
            wanted = wanted.filter((value) => value !== index);
            onError(error);
          }
        })
        .finally(() => {
          active.delete(index);
          pump();
        });
    }
  };
  return {
    select(snapshot: BookSnapshot, requestedWidth: number) {
      if (destroyed) return;
      const nextWidth = Math.ceil(Math.max(180, requestedWidth) / 32) * 32;
      if (nextWidth !== width) {
        width = nextWidth;
        active.forEach((controller) => controller.abort());
        cache.forEach((page, index) => {
          page.dispose();
          onPage(index, undefined);
        });
        cache.clear();
      }
      const visible =
        snapshot.orientation === 'spread' &&
        snapshot.pageIndex > 0 &&
        snapshot.pageIndex < snapshot.pageCount - 1
          ? [snapshot.pageIndex, snapshot.pageIndex + 1]
          : [snapshot.pageIndex];
      const lastVisible = visible[visible.length - 1];
      wanted = [
        ...new Set([
          ...visible,
          lastVisible + 1,
          lastVisible + 2,
          snapshot.pageIndex - 1,
          snapshot.pageIndex - 2,
        ]),
      ]
        .filter((index) => index >= 0 && index < snapshot.pageCount)
        .slice(0, 6);
      active.forEach((controller, index) => {
        if (!wanted.includes(index)) controller.abort();
      });
      cache.forEach((page, index) => {
        if (!wanted.includes(index)) {
          page.dispose();
          cache.delete(index);
          onPage(index, undefined);
        }
      });
      pump();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      active.forEach((controller) => controller.abort());
      cache.forEach((page) => page.dispose());
      cache.clear();
    },
  };
}
