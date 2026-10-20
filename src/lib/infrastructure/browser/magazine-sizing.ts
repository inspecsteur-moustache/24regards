import type { PageDimensions } from '../../domain/ports';

export function observeMagazineSize(
  table: HTMLElement,
  stage: HTMLElement,
  dimensions: PageDimensions,
  limits: { minWidth: number; maxWidth: number },
): () => void {
  const mobileLandscape = matchMedia('(orientation: landscape) and (pointer: coarse)');
  const ratio = dimensions.width / dimensions.height;
  const viewport = window.visualViewport;

  const resize = () => {
    const availableWidth = table.clientWidth;
    // A pinch zoom must still let the reader enlarge the PDF.
    const visibleHeight = viewport?.scale === 1 ? viewport.height : window.innerHeight;
    const maxHeight = mobileLandscape.matches
      ? Math.min(window.innerWidth * 0.95, visibleHeight * 0.9)
      : Infinity;
    let across = availableWidth < limits.minWidth * 2 ? 1 : 2;
    const pageWidth = Math.min(limits.maxWidth, availableWidth / across, maxHeight * ratio);
    if (across === 2 && pageWidth < limits.minWidth) across = 1;
    stage.style.width = `${pageWidth * across}px`;
    stage.style.height = `${pageWidth / ratio}px`;
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(table);
  window.addEventListener('resize', resize);
  viewport?.addEventListener('resize', resize);
  mobileLandscape.addEventListener('change', resize);

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', resize);
    viewport?.removeEventListener('resize', resize);
    mobileLandscape.removeEventListener('change', resize);
    stage.style.removeProperty('width');
    stage.style.removeProperty('height');
  };
}
