import { readFile, access, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateContent } from '../src/lib/domain/validation.ts';
const read = (name) => readFile(resolve(`src/lib/content/${name}.json`), 'utf8').then(JSON.parse);
const [magazines, articles, authors, site] = await Promise.all(
  ['magazines', 'articles', 'authors', 'site'].map(read),
);
validateContent(magazines, articles, authors, site);
for (const magazine of magazines) await access(resolve(`static${magazine.pdfFile}`));
for (const article of articles) {
  for (const match of article.contentHtml.matchAll(/(?:src|href)="(\/media\/[^\"]+)"/g)) {
    if (match[1].includes('..')) throw new Error('Chemin média interdit');
    await access(resolve(`static${match[1]}`));
  }
  if (/vote-mois-dhorreur/i.test(article.contentHtml)) throw new Error('Lien de vote obsolète');
}
await access('static/media/titre-magazine.png');
await access('static/media/favicon.png');
let bytes = 0;
for (const magazine of magazines) bytes += (await stat(resolve(`static${magazine.pdfFile}`))).size;
console.log(
  `${magazines.length} magazines, ${articles.length} articles et ${authors.length} rédacteurs validés (${Math.round(bytes / 1024 / 1024)} Mo de PDF).`,
);
