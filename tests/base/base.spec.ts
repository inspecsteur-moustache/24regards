import { test, expect } from '@playwright/test';
test('pages, médias, worker et navigation sous /24regards', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/24regards/');
  await expect(page.locator('.pdf-page[data-rendered="true"] img:visible').first()).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole('link', { name: 'Télécharger le PDF' })).toHaveAttribute(
    'href',
    '/24regards/pdfs/24-regards-n11-septembre-2025.pdf',
  );
  await expect(page.getByRole('link', { name: '24 Regards — accueil' })).toHaveAttribute(
    'href',
    '/24regards/',
  );
  await page.goto('/24regards/articles/critique-him/');
  await expect(page.locator('.notebook:not(.concealed)')).toBeVisible();
  expect(await page.locator('.notebook-page img').first().getAttribute('src')).toMatch(
    /^\/24regards\/media\//,
  );
  await page.goto('/24regards/redaction/');
  await expect(page.locator('.author-profile>h2')).toHaveText('Mathieu Giroux');
  await page.goto('/24regards/critique-him/');
  await expect(page).toHaveURL(/\/24regards\/articles\/critique-him\/$/);
  expect(failures).toEqual([]);
});
