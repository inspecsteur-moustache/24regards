import { site } from './catalog';
export function canonical(path: string): string {
  return `${site.siteUrl.replace(/\/$/, '')}${path}`;
}
