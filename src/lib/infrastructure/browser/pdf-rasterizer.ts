// Keep the reader and its worker on the compatibility build: both use recent Map methods.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { ReaderError } from '../../domain/models';
import type { PdfRasterizer } from '../../domain/ports';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export function createPdfRasterizer(assetBase: string): PdfRasterizer {
  let task: ReturnType<typeof pdfjs.getDocument> | undefined;
  let document: pdfjs.PDFDocumentProxy | undefined;
  let destroyed = false;
  const renders = new Set<pdfjs.RenderTask>();
  const liveUrls = new Set<string>();
  const assertActive = (signal?: AbortSignal) => {
    if (destroyed || signal?.aborted) throw new ReaderError('Lecture annulée.', 'cancelled');
  };
  return {
    async open(url, signal) {
      assertActive(signal);
      task = pdfjs.getDocument({
        url,
        cMapUrl: `${assetBase}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${assetBase}/standard_fonts/`,
        wasmUrl: `${assetBase}/wasm/`,
        iccUrl: `${assetBase}/iccs/`,
      });
      const cancel = () => {
        void task?.destroy();
      };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        document = await task.promise;
        assertActive(signal);
        return document.numPages;
      } catch (cause) {
        if (signal.aborted || destroyed) throw new ReaderError('Lecture annulée.', 'cancelled');
        throw new ReaderError(
          'Le magazine ne peut pas être chargé. Vous pouvez toujours ouvrir le PDF.',
          'load',
          { cause },
        );
      } finally {
        signal.removeEventListener('abort', cancel);
      }
    },
    async dimensions(index) {
      assertActive();
      if (!document) throw new ReaderError('Le document n’est pas ouvert.', 'load');
      const page = await document.getPage(index + 1);
      const viewport = page.getViewport({ scale: 1 });
      return { width: viewport.width, height: viewport.height };
    },
    async render(index, width, signal) {
      assertActive(signal);
      if (!document) throw new ReaderError('Le document n’est pas ouvert.', 'load');
      const page = await document.getPage(index + 1);
      assertActive(signal);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: (Math.min(window.devicePixelRatio || 1, 2) * width) / original.width,
      });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new ReaderError('Le rendu est indisponible.', 'render');
      const render = page.render({ canvasContext: context, canvas, viewport });
      renders.add(render);
      const cancel = () => render.cancel();
      signal.addEventListener('abort', cancel, { once: true });
      try {
        await render.promise;
        assertActive(signal);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) =>
              value ? resolve(value) : reject(new ReaderError('Image indisponible.', 'render')),
            'image/webp',
            0.94,
          ),
        );
        assertActive(signal);
        const url = URL.createObjectURL(blob);
        liveUrls.add(url);
        return {
          url,
          width: original.width,
          height: original.height,
          dispose() {
            if (liveUrls.delete(url)) URL.revokeObjectURL(url);
          },
        };
      } catch (cause) {
        if (signal.aborted || destroyed) throw new ReaderError('Lecture annulée.', 'cancelled');
        throw new ReaderError('Cette page ne peut pas être affichée.', 'render', { cause });
      } finally {
        signal.removeEventListener('abort', cancel);
        renders.delete(render);
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      renders.forEach((render) => render.cancel());
      liveUrls.forEach((url) => URL.revokeObjectURL(url));
      liveUrls.clear();
      await task?.destroy();
      document = undefined;
    },
  };
}
