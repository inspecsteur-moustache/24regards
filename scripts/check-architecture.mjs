import { readdir, readFile } from 'node:fs/promises';
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (/\.(ts|svelte)$/.test(path)) result.push(path);
  }
  return result;
}
const errors = [];
for (const layer of ['domain', 'application'])
  for (const file of await files(`src/lib/${layer}`)) {
    const content = await readFile(file, 'utf8');
    if (
      /from\s+['"][^'"]*(?:infrastructure|composition|components|svelte|pdfjs|openpageflip|node:)/.test(
        content,
      ) ||
      /\b(?:document|window|localStorage)\./.test(content)
    )
      errors.push(file);
  }
for (const file of await files('src/lib/components')) {
  const content = await readFile(file, 'utf8');
  if (/from\s+['"][^'"]*(?:infrastructure|content\/|pdfjs-dist|@openpageflip)/.test(content))
    errors.push(file);
}
if (errors.length) throw new Error(`Dépendances interdites : ${errors.join(', ')}`);
console.log('Dépendances des couches SOLID vérifiées.');
