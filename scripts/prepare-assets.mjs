import { mkdir, readdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve('PDFs');
const destination = resolve('static/pdfs');
await mkdir(destination, { recursive: true });
for (const file of await readdir(source)) {
  if (file.endsWith('.pdf')) await copyFile(resolve(source, file), resolve(destination, file));
}
console.log('PDF originaux préparés pour le site statique.');
for (const directory of ['cmaps', 'iccs', 'standard_fonts', 'wasm']) {
  await cp(
    resolve(`node_modules/pdfjs-dist/${directory}`),
    resolve(`static/vendor/pdfjs/${directory}`),
    { recursive: true },
  );
}
const notices = [];
for (const [name, license] of [
  ['svelte', 'LICENSE.md'],
  ['@sveltejs/kit', 'LICENSE'],
  ['@openpageflip/core', 'LICENSE'],
  ['pdfjs-dist', 'LICENSE'],
]) {
  const root = resolve('node_modules', name);
  const metadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  notices.push(
    `${name} ${metadata.version}\n${'='.repeat(64)}\n${await readFile(resolve(root, license), 'utf8')}`,
  );
}
await writeFile(resolve('static/THIRD_PARTY_NOTICES.txt'), notices.join('\n\n'), 'utf8');
