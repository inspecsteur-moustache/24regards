import { describe, expect, it, vi } from 'vitest';
import { createRasterWindow } from '../../src/lib/application/raster-window';
import { observeBookShadow } from '../../src/lib/application/book-shadow';
import type {
  BookSnapshot,
  FlipProgress,
  PdfRasterizer,
  RasterPage,
} from '../../src/lib/domain/ports';
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
describe('Fenêtre de rendu PDF', () => {
  it('écarte un résultat arrivé après la destruction', async () => {
    let complete: (page: RasterPage) => void = () => {};
    const dispose = vi.fn();
    const receive = vi.fn();
    const renderer: PdfRasterizer = {
      open: async () => 1,
      dimensions: async () => ({ width: 595, height: 842 }),
      destroy: async () => {},
      render: () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    };
    const windowed = createRasterWindow(renderer, receive, vi.fn());
    windowed.select({ pageIndex: 0, pageCount: 1, orientation: 'single' }, 300);
    windowed.destroy();
    complete({ url: 'blob:late', width: 595, height: 842, dispose });
    await settle();
    expect(receive).not.toHaveBeenCalled();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it('limite le travail à deux rendus et six images, et libère le cache', async () => {
    let active = 0;
    let maximum = 0;
    const dispose = vi.fn();
    const renderer: PdfRasterizer = {
      open: async () => 32,
      dimensions: async () => ({ width: 595, height: 842 }),
      destroy: async () => {},
      async render(_index, _width, signal) {
        active++;
        maximum = Math.max(maximum, active);
        await settle();
        active--;
        if (signal.aborted) throw new Error('annulé');
        return { url: 'blob:test', width: 595, height: 842, dispose };
      },
    };
    const received = new Map<number, RasterPage>();
    const windowed = createRasterWindow(
      renderer,
      (index, page) => {
        if (page) received.set(index, page);
        else received.delete(index);
      },
      (error) => {
        throw error;
      },
    );
    windowed.select({ pageIndex: 8, pageCount: 32, orientation: 'spread' }, 450);
    await settle();
    await settle();
    await settle();
    await settle();
    expect(maximum).toBeLessThanOrEqual(2);
    expect(received.size).toBeLessThanOrEqual(6);
    expect(received.has(8)).toBe(true);
    windowed.select({ pageIndex: 24, pageCount: 32, orientation: 'spread' }, 450);
    await settle();
    await settle();
    await settle();
    await settle();
    expect([...received.keys()].every((index) => index >= 22)).toBe(true);
    windowed.destroy();
    windowed.destroy();
    expect(dispose).toHaveBeenCalled();
  });
});
describe('Ombre portée', () => {
  it('suit un mouvement annulé et la disposition à une page', () => {
    let snapshot: BookSnapshot = { pageIndex: 0, pageCount: 24, orientation: 'spread' };
    let change: (snapshot: BookSnapshot) => void = () => {};
    let progress: (event: FlipProgress) => void = () => {};
    const cast = vi.fn();
    const stopPage = vi.fn();
    const stopProgress = vi.fn();
    const stop = observeBookShadow(
      {
        snapshot: () => snapshot,
        next: async () => {},
        previous: async () => {},
        goTo: () => {},
        subscribe(listener) {
          change = listener;
          listener(snapshot);
          return stopPage;
        },
      },
      {
        subscribeProgress(listener) {
          progress = listener;
          return stopProgress;
        },
      },
      cast,
    );
    expect(cast).toHaveBeenLastCalledWith(0, 1);
    progress({ from: 0, to: 1, progress: 1 });
    expect(cast).toHaveBeenLastCalledWith(1, 1);
    progress({ from: 0, to: 1, progress: 0 });
    expect(cast).toHaveBeenLastCalledWith(0, 1);
    snapshot = { ...snapshot, orientation: 'single' };
    change(snapshot);
    progress({ from: 0, to: 1, progress: 0.5 });
    expect(cast).toHaveBeenLastCalledWith(1, 1);
    stop();
    expect(stopPage).toHaveBeenCalledOnce();
    expect(stopProgress).toHaveBeenCalledOnce();
  });
});
