import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const articles = JSON.parse(readFileSync('src/lib/content/articles.json', 'utf8')) as {
  slug: string;
  contentHtml: string;
}[];
for (const width of [320, 1440]) {
  test(`les six articles restent complets dans le carnet à ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const article of articles) {
      await page.goto(`/articles/${article.slug}/`);
      await expect(page.locator('.notebook:not(.concealed)')).toBeVisible({ timeout: 30_000 });
      const expectedText = await page.evaluate((html) => {
        const source = document.createElement('div');
        source.innerHTML = html;
        return Array.from(source.children)
          .map((child) => child.textContent)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }, article.contentHtml);
      const actualText = await page
        .locator('.notebook-page:not([data-opf-clone]) .notebook-content')
        .evaluateAll((pages) =>
          pages
            .map((page) =>
              Array.from(page.children)
                .map((child) => child.textContent)
                .join(' '),
            )
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        );
      expect(actualText, article.slug).toBe(expectedText);
      expect(await page.locator('.notebook-page:not([data-opf-clone]) img').count()).toBe(
        (article.contentHtml.match(/<img\b/g) || []).length,
      );
      const overflowing = await page
        .locator('.notebook-page:not([data-opf-clone]) .notebook-content')
        .evaluateAll(
          (pages) =>
            pages.filter((page) => {
              const copy = page.cloneNode(true) as HTMLElement;
              const reference =
                pages.find((value) => value.getBoundingClientRect().width > 0) ?? page;
              const box = reference.getBoundingClientRect();
              Object.assign(copy.style, {
                position: 'absolute',
                left: '-100000px',
                display: 'flow-root',
                width: `${box.width}px`,
              });
              copy.style.setProperty('--notebook-line', getComputedStyle(page).lineHeight);
              copy.style.setProperty('--font-size', getComputedStyle(page).fontSize);
              document.body.append(copy);
              const overflow = copy.scrollHeight > copy.clientHeight + 1;
              copy.remove();
              return overflow;
            }).length,
        );
      expect(overflowing, article.slug).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    }
  });
}
