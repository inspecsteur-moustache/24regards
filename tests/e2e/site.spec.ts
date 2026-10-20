import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const articles = JSON.parse(readFileSync('src/lib/content/articles.json', 'utf8')) as {
  slug: string;
  contentHtml: string;
}[];

async function expectHomeCentered(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const viewportCenter = document.documentElement.clientWidth / 2;
        const about = document.querySelector('.about')!.getBoundingClientRect();
        const pages = Array.from(document.querySelectorAll<HTMLImageElement>('.pdf-page img'))
          .filter((image) => image.checkVisibility())
          .map((image) => image.getBoundingClientRect());
        const pdfCenter =
          (Math.min(...pages.map((box) => box.left)) + Math.max(...pages.map((box) => box.right))) /
          2;
        return Math.max(
          Math.abs(about.left + about.width / 2 - viewportCenter),
          Math.abs(pdfCenter - viewportCenter),
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
      }),
    )
    .toBeLessThanOrEqual(1);
}

for (const width of [320, 768, 1440]) {
  test(`magazine lisible et interface sans débordement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto('/');
    await expect(page.getByLabel('Choisir un magazine')).toHaveValue('11');
    await expect(
      page.locator('.pdf-page[data-rendered="true"]:not([data-opf-clone])').first(),
    ).toBeAttached({ timeout: 45_000 });
    await expectHomeCentered(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    const ratio = await page
      .locator('.pdf-page[data-rendered="true"] img:visible')
      .first()
      .evaluate((image) => {
        const img = image as HTMLImageElement;
        return {
          source: img.naturalWidth / img.naturalHeight,
          box: img.clientWidth / img.clientHeight,
          fit: getComputedStyle(img).objectFit,
        };
      });
    expect(ratio.fit).toBe('contain');
    expect(ratio.source).toBeCloseTo(595.276 / 841.89, 2);
    expect(ratio.box).toBeCloseTo(ratio.source, 2);
    if (width === 320) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await expect(
        page.getByRole('navigation').getByRole('link', { name: 'Rédaction' }),
      ).toBeVisible();
    }
    await page
      .locator('.magazine-reader')
      .screenshot({ path: `test-results/magazine-${width}.png` });
    if (width === 1440) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: 'test-results/accueil-clair.png', fullPage: true });
      await page.getByRole('button', { name: 'Activer le mode sombre' }).click();
      await expect(
        page.locator('.pdf-page[data-rendered="true"] img:visible').first(),
      ).toBeVisible();
      await page
        .locator('.pdf-page[data-rendered="true"] img:visible')
        .first()
        .evaluate((image) => (image as HTMLImageElement).decode());
      await page.screenshot({ path: 'test-results/accueil-sombre.png', fullPage: true });
    }
    expect(failures).toEqual([]);
  });
}

test.describe('Lecteur PDF sur téléphone en paysage', () => {
  test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  test('pages entières, proportions et centrage après rotation', async ({ page }) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(
      page.locator('.pdf-page[data-page="1"][data-rendered="true"] img:visible').first(),
    ).toBeVisible({ timeout: 45_000 });

    const expectLandscapeFits = async () => {
      await expect
        .poll(() =>
          page.evaluate(() => {
            const pages = Array.from(document.querySelectorAll<HTMLImageElement>('.pdf-page img'))
              .filter((image) => image.checkVisibility())
              .map((image) => image.getBoundingClientRect());
            const height = Math.max(...pages.map((box) => box.height));
            const viewportHeight = window.visualViewport?.height ?? innerHeight;
            return Math.max(height - viewportHeight * 0.9, height - innerWidth * 0.95);
          }),
        )
        .toBeLessThanOrEqual(1);
      await expectHomeCentered(page);
      const image = page.locator('.pdf-page[data-rendered="true"] img:visible').first();
      const ratio = await image.evaluate((element) => {
        const img = element as HTMLImageElement;
        return {
          source: img.naturalWidth / img.naturalHeight,
          box: img.clientWidth / img.clientHeight,
        };
      });
      expect(ratio.box).toBeCloseTo(ratio.source, 2);
    };

    await page.setViewportSize({ width: 844, height: 390 });
    await expectLandscapeFits();
    await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
    await expect(page.locator('.reader-controls strong')).toHaveText('2');
    await expect(
      page.locator('.pdf-page[data-page="2"][data-rendered="true"] img:visible').first(),
    ).toBeVisible({ timeout: 45_000 });
    for (const viewport of [
      { width: 932, height: 430 },
      { width: 667, height: 375 },
      { width: 568, height: 280 },
    ]) {
      await page.setViewportSize(viewport);
      await expectLandscapeFits();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expectHomeCentered(page);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Math.abs(
            document.querySelector('.pdf-book')!.getBoundingClientRect().width -
              document.querySelector('.book-table')!.getBoundingClientRect().width,
          ),
        ),
      )
      .toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 844, height: 390 });
    await expectLandscapeFits();
    await page.getByLabel('Choisir un magazine').selectOption('9');
    await expect(
      page.locator('.pdf-page[data-page="1"][data-rendered="true"] img:visible').first(),
    ).toBeVisible({ timeout: 45_000 });
    await expectLandscapeFits();
    expect(failures).toEqual([]);
  });
});

test('centrage du PDF : geste interrompu, ouverture, fermeture, dernière page et redimensionnement', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto('/');
  const cover = page.locator('.pdf-page[data-page="1"][data-rendered="true"] img:visible').first();
  await expect(cover).toBeVisible({ timeout: 45_000 });
  await expectHomeCentered(page);
  await page.locator('.book-table').scrollIntoViewIfNeeded();
  const stageTransform = () =>
    page.locator('.book-stage').evaluate((element) => getComputedStyle(element).transform);
  const closedTransform = await stageTransform();
  const bounds = (await cover.boundingBox())!;
  const edge = bounds.x + bounds.width - 3;
  const middle = bounds.y + bounds.height / 2;
  await page.mouse.move(edge, middle);
  await page.mouse.down();
  await page.mouse.move(edge - bounds.width * 0.12, middle, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect.poll(stageTransform).toBe(closedTransform);
  await expect(page.locator('.reader-controls strong')).toHaveText('1');
  await expectHomeCentered(page);

  await cover.click({ position: { x: bounds.width - 3, y: bounds.height / 2 } });
  await page.mouse.move(0, 0);
  await expect(page.locator('.reader-controls strong')).toHaveText('2');
  await expectHomeCentered(page);
  await page.getByRole('button', { name: 'Page précédente', exact: true }).click();
  await expect(page.locator('.reader-controls strong')).toHaveText('1');
  await expectHomeCentered(page);

  const jump = page.getByLabel('Aller à la page');
  const lastPage = (await jump.getAttribute('max'))!;
  await jump.fill(lastPage);
  await jump.press('Tab');
  await expect(page.locator('.reader-controls strong')).toHaveText(lastPage);
  await expect(
    page.locator(`.pdf-page[data-page="${lastPage}"][data-rendered="true"] img:visible`).first(),
  ).toBeVisible({ timeout: 45_000 });
  await expectHomeCentered(page);
  await jump.fill('1');
  await jump.press('Tab');
  await expect(page.locator('.reader-controls strong')).toHaveText('1');
  await expect(cover).toBeVisible({ timeout: 45_000 });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectHomeCentered(page);
  }
});

test('magazine compatible sans les méthodes Map récentes, dans la page et le worker', async ({
  page,
}) => {
  const removeRecentMapMethods = `
    for (const prototype of [Map.prototype, WeakMap.prototype]) {
      Reflect.deleteProperty(prototype, 'getOrInsertComputed');
      Reflect.deleteProperty(prototype, 'getOrInsert');
    }
  `;
  await page.addInitScript(removeRecentMapMethods);
  let workerLoaded = false;
  await page.route('**/pdf.worker*.mjs', async (route) => {
    const response = await route.fetch();
    workerLoaded = true;
    await route.fulfill({ response, body: `${removeRecentMapMethods}\n${await response.text()}` });
  });
  await page.goto('/');
  await expect(
    page.locator('.pdf-page[data-rendered="true"] img:visible, .reader-error').first(),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.locator('.pdf-page[data-rendered="true"] img:visible').first()).toBeVisible();
  expect(workerLoaded).toBe(true);
  await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
  await expect(page.locator('.reader-controls strong')).toHaveText('2');
  await expect(
    page.locator('.pdf-page[data-page="2"][data-rendered="true"] img:visible').first(),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('alert')).not.toBeVisible();
});

test('magazines : navigation, ombres, changement et téléchargement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Page suivante', exact: true })).toBeEnabled({
    timeout: 45_000,
  });
  await expect(page.locator('.cast-shadow')).toHaveCSS('left', '510px');
  await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
  await expect(page.locator('.reader-controls strong')).toHaveText('2');
  await expect
    .poll(() =>
      page
        .locator('.cast-shadow')
        .evaluate((element) => parseFloat(getComputedStyle(element).left)),
    )
    .toBeLessThan(1);
  await page.getByLabel('Choisir un magazine').selectOption('10');
  await page.getByLabel('Choisir un magazine').selectOption('9');
  await expect(page).toHaveURL(/numero=9/);
  await expect(page.locator('.reader-controls')).toContainText('/ 24', { timeout: 45_000 });
  const download = page.getByRole('link', { name: 'Télécharger le PDF' });
  await expect(download).toHaveAttribute('href', '/pdfs/24-regards-n9-juin-2025.pdf');
  const response = await page.request.get('/pdfs/24-regards-n9-juin-2025.pdf');
  expect(response.ok()).toBe(true);
  expect((await response.body()).length).toBe(
    readFileSync('PDFs/24-regards-n9-juin-2025.pdf').length,
  );
  expect(
    await page.locator('.pdf-page[data-rendered="true"]:not([data-opf-clone])').count(),
  ).toBeLessThanOrEqual(6);
});

test('erreur du lecteur : accès au PDF et nouvelle tentative', async ({ page }) => {
  await page.route('**/pdfs/*.pdf', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('ne peut pas être chargé', {
    timeout: 45_000,
  });
  await expect(page.getByRole('link', { name: 'Ouvrir dans un nouvel onglet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await page.unroute('**/pdfs/*.pdf');
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.locator('.pdf-page[data-rendered="true"]').first()).toBeAttached({
    timeout: 45_000,
  });
});

test('thème, infolettre et page Participer', async ({ page }) => {
  await page.goto('/participer/');
  await expect(
    page.getByText('Lister ici les détails et les attentes d’une participation.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Activer le mode sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'S’inscrire à l’infolettre' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Inscriptions bientôt disponibles');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('carnet : texte complet, grille, redimensionnement et lecture continue', async ({ page }) => {
  const article = articles.find((article) => article.slug === 'critique-super-happy-forever')!;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/articles/${article.slug}/`);
  await expect(page.locator('.notebook:not(.concealed)')).toBeVisible({ timeout: 45_000 });
  const expectedText = await page.evaluate((html) => {
    const source = document.createElement('div');
    source.innerHTML = html;
    return Array.from(source.children)
      .map((child) => child.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, article.contentHtml);
  const pageText = async () =>
    page.locator('.notebook-page:not([data-opf-clone]) .notebook-content').evaluateAll((elements) =>
      elements
        .map((element) =>
          Array.from(element.children)
            .map((child) => child.textContent)
            .join(' '),
        )
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  expect(await pageText()).toBe(expectedText);
  expect(await page.locator('.notebook-page:not([data-opf-clone]) img').count()).toBe(5);
  const metrics = await page
    .locator('.notebook-page .notebook-content')
    .first()
    .evaluate((element) => ({
      line: getComputedStyle(element).lineHeight,
      grid: getComputedStyle(element).backgroundSize,
      font: parseFloat(getComputedStyle(element).fontSize),
      overflow: element.scrollHeight > element.clientHeight + 1,
    }));
  expect(metrics.grid).toContain(metrics.line);
  expect(metrics.font).toBeGreaterThanOrEqual(16);
  expect(metrics.overflow).toBe(false);
  await page.getByRole('button', { name: 'Page suivante', exact: true }).click();
  await expect(page.locator('.reader-controls strong')).toHaveText('2');
  await page.locator('.notebook').screenshot({ path: 'test-results/notebook-desktop.png' });
  await page.setViewportSize({ width: 320, height: 850 });
  await expect(page.locator('.notebook-frame')).toHaveAttribute('aria-busy', 'false');
  await expect
    .poll(async () =>
      page.locator('.notebook-book').evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeLessThan(300);
  expect(await pageText()).toBe(expectedText);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Agrandir le texte' }).click();
  await expect(page.locator('.notebook-frame')).toHaveAttribute('aria-busy', 'false');
  expect(await pageText()).toBe(expectedText);
  await page.getByRole('button', { name: 'Lecture continue', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Article en lecture continue' })).toBeVisible();
});

test('articles et rédaction : sélections partageables et historique', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto('/articles/');
  await page.getByLabel('Choisir un texte').selectOption('critique-him');
  await expect(page).toHaveURL(/articles\/critique-him\/$/);
  await expect(page.locator('.selected-article>h2')).toHaveText('Perdu dans son audace – Him');
  await page.getByLabel('Choisir un texte').selectOption('critique-weapons');
  await page.goBack();
  await expect(page.locator('.selected-article>h2')).toHaveText('Perdu dans son audace – Him');
  await page.goto('/redaction/');
  await expect(page.locator('.author-profile>h2')).toHaveText('Mathieu Giroux');
  await page.setViewportSize({ width: 320, height: 850 });
  await page.getByLabel('La rédaction', { exact: true }).selectOption('billy-b');
  await expect(page.locator('.author-profile>h2')).toHaveText('Billy B.');
  await expect(page.locator('.favorites li')).toHaveCount(10);
  await expect(page.locator('.texts a').first()).toHaveAttribute('href', '/?numero=10');
});

test('anciennes adresses, crédits et HTML sans JavaScript', async ({ page, browser }) => {
  await page.goto('/critique-him/');
  await expect(page).toHaveURL(/\/articles\/critique-him\/$/);
  await page.goto('/billy-b/');
  await expect(page).toHaveURL(/\/redaction\/billy-b\/$/);
  await page.goto('/n11-octobre-2025/');
  await expect(page).toHaveURL(/numero=11/);
  await page.goto('/citations/');
  await expect(page.getByText('Victor Juca', { exact: true })).toBeVisible();
  await expect(page.locator('#licences')).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4173/articles/critique-eddington/');
  await expect(staticPage.getByRole('article')).toBeVisible();
  await expect(staticPage.getByText('Écrit par Mathieu Giroux', { exact: true })).toBeVisible();
  await context.close();
});
