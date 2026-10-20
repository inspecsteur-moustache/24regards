import { createPdfRasterizer as createRasterizer } from '../infrastructure/browser/pdf-rasterizer';
import { base } from './paths';
export function createPdfRasterizer() {
  return createRasterizer(`${base}/vendor/pdfjs`);
}
export { createPageTurner } from '../infrastructure/browser/openpageflip';
export { observeMagazineSize } from '../infrastructure/browser/magazine-sizing';
