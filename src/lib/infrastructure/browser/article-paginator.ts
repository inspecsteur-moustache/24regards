import { ReaderError } from '../../domain/models';
import type { ArticlePaginator, PaginatedPage } from '../../domain/ports';

function textPoint(element: Element, offset: number): [Node, number] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) return [node, remaining];
    remaining -= length;
    node = walker.nextNode();
  }
  return [element, element.childNodes.length];
}
function fragment(element: HTMLElement, start: number, end: number): HTMLElement {
  const result = element.cloneNode(false) as HTMLElement;
  const range = document.createRange();
  const from = textPoint(element, start);
  const to = textPoint(element, end);
  range.setStart(...from);
  range.setEnd(...to);
  result.append(range.cloneContents());
  return result;
}
export function createArticlePaginator(): ArticlePaginator {
  return {
    async paginate(html, options) {
      const check = () => {
        if (options.signal.aborted) throw new ReaderError('Pagination annulée.', 'cancelled');
      };
      check();
      const source = document.createElement('div');
      source.innerHTML = html;
      const measure = document.createElement('div');
      measure.className = 'notebook-content';
      Object.assign(measure.style, {
        position: 'absolute',
        left: '-100000px',
        top: '0',
        visibility: 'hidden',
        width: `${options.width}px`,
        fontSize: `${options.fontSize}px`,
        lineHeight: `${options.lineHeight}px`,
      });
      measure.style.setProperty('--notebook-line', `${options.lineHeight}px`);
      measure.setAttribute('aria-hidden', 'true');
      document.body.append(measure);
      try {
        await document.fonts.ready;
        check();
        const images = Array.from(source.querySelectorAll('img'));
        await Promise.all(
          images.map((img) => {
            img.loading = 'eager';
            return img.decode().catch(() => undefined);
          }),
        );
        check();
        for (const figure of source.querySelectorAll<HTMLElement>('figure')) {
          const image = figure.querySelector('img');
          if (!image) continue;
          const width = image.naturalWidth || Number(image.getAttribute('width')) || options.width;
          const height = image.naturalHeight || Number(image.getAttribute('height')) || width;
          const captionLines = figure.querySelector('figcaption') ? 2 : 0;
          const imageHeight = Math.min(
            (options.width * height) / width,
            options.height - options.lineHeight * (captionLines + 2),
          );
          image.style.height = `${imageHeight}px`;
          image.style.width = '100%';
          image.style.objectFit = 'contain';
          figure.style.height = `${Math.ceil(imageHeight / options.lineHeight) * options.lineHeight + captionLines * options.lineHeight}px`;
        }
        const pages: PaginatedPage[] = [];
        let offset = 0;
        let pageOffset = 0;
        const fits = (node: HTMLElement) => {
          measure.append(node);
          const fits = measure.getBoundingClientRect().height <= options.height + 0.5;
          node.remove();
          return fits;
        };
        const flush = () => {
          if (measure.childNodes.length) {
            pages.push({ html: measure.innerHTML, offset: pageOffset });
            measure.replaceChildren();
            pageOffset = offset;
          }
        };
        for (const original of Array.from(source.children) as HTMLElement[]) {
          check();
          const length = original.textContent?.length ?? 0;
          if (fits(original)) {
            measure.append(original);
            offset += length;
            continue;
          }
          flush();
          if (fits(original)) {
            measure.append(original);
            offset += length;
            continue;
          }
          if (!length || original.tagName === 'FIGURE') {
            measure.append(original);
            offset += length;
            flush();
            continue;
          }
          const text = original.textContent ?? '';
          const boundaries = [...text.matchAll(/\S+\s*/g)].map(
            (match) => (match.index ?? 0) + match[0].length,
          );
          if (boundaries.at(-1) !== length) boundaries.push(length);
          let start = 0;
          while (start < length) {
            check();
            const candidates = boundaries.filter((end) => end > start);
            let low = 0;
            let high = candidates.length - 1;
            let best = -1;
            while (low <= high) {
              const mid = (low + high) >> 1;
              if (fits(fragment(original, start, candidates[mid]))) {
                best = mid;
                low = mid + 1;
              } else high = mid - 1;
            }
            if (best < 0)
              throw new ReaderError(
                'Le texte ne tient pas dans le carnet. La lecture continue reste disponible.',
                'pagination',
              );
            const end = candidates[best];
            measure.append(fragment(original, start, end));
            offset += end - start;
            start = end;
            if (start < length) flush();
          }
        }
        flush();
        return pages.length ? pages : [{ html: '<p>Aucun texte à afficher.</p>', offset: 0 }];
      } finally {
        measure.remove();
      }
    },
  };
}
