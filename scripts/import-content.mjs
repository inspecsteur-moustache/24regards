/**
 * One-time editorial import from the public WordPress.com API.
 * Run explicitly with `node scripts/import-content.mjs`; ordinary builds stay offline.
 * No credentials, package dependencies, or changes to the supplied PDFs are needed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDirectory = resolve(root, 'src/lib/content');
const mediaDirectory = resolve(root, 'static/media');
const api = 'https://public-api.wordpress.com/rest/v1.1/sites/le24regards.ca';
const articleSlugs = [
  'critique-lagent-secret',
  'critique-him',
  'mois-dhorreur-2025',
  'critique-eddington',
  'critique-weapons',
  'critique-super-happy-forever',
];
const authorSlugs = ['billy-b', 'ja', 'mathieu-giroux', 'tarek-ammi'];
const magazineSources = [
  {
    id: '11',
    number: 11,
    title: 'N°11 — Octobre 2025',
    publicationMonth: '2025-10',
    pdfFile: '/pdfs/24-regards-n11-septembre-2025.pdf',
    legacyPath: '/n11-octobre-2025/',
  },
  {
    id: '10',
    number: 10,
    title: 'N°10 — Juillet 2025',
    publicationMonth: '2025-07',
    pdfFile: '/pdfs/24-regards-n10-juillet-2025.pdf',
    legacyPath: '/n10-juillet-2025/',
  },
  {
    id: '9',
    number: 9,
    title: 'N°9 — Juin 2025',
    publicationMonth: '2025-06',
    pdfFile: '/pdfs/24-regards-n9-juin-2025.pdf',
    legacyPath: '/n9-mai-2025/',
  },
];
const allowedOrigins = new Set([
  'https://public-api.wordpress.com',
  'https://le24regards.ca',
  'https://le24regards.wordpress.com',
  'https://le24regards.files.wordpress.com',
]);
const allowedTags = new Set([
  'p',
  'h2',
  'h3',
  'em',
  'strong',
  'a',
  'figure',
  'img',
  'figcaption',
  'ul',
  'ol',
  'li',
  'sup',
  'sub',
  'br',
  'blockquote',
]);
const voidTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr']);
const entities = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  copy: '©',
};
const decode = (value = '') =>
  value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key[0] === '#') {
      const point =
        key[1]?.toLowerCase() === 'x'
          ? Number.parseInt(key.slice(2), 16)
          : Number.parseInt(key.slice(1), 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    return entities[key.toLowerCase()] ?? entity;
  });
const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const plainText = (value) =>
  decode(value.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

function get(url, redirects = 0) {
  const parsed = new URL(url);
  if (!allowedOrigins.has(parsed.origin))
    throw new Error(`Unexpected import origin: ${parsed.origin}`);
  if (redirects > 5) throw new Error(`Too many redirects for ${url}`);
  return new Promise((accept, reject) => {
    const req = request(
      parsed,
      { headers: { 'User-Agent': '24Regards-ContentMigration/1.0' } },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          accept(get(new URL(response.headers.location, parsed).href, redirects + 1));
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => accept(Buffer.concat(chunks)));
        response.on('error', reject);
      },
    );
    req.setTimeout(45000, () => req.destroy(new Error(`Timed out downloading ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

async function download(url, target) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const bytes = await get(url);
      if (!bytes.length) throw new Error(`Empty asset: ${url}`);
      await writeFile(target, bytes);
      return bytes;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

/** Read intrinsic dimensions without adding an image-processing dependency. */
function imageDimensions(bytes) {
  if (bytes.subarray(1, 4).toString() === 'PNG')
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if ([0xd8, 0xd9, 0x01].includes(marker) || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(offset);
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      ) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      }
      if (length < 2) break;
      offset += length;
    }
  }
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') {
    const type = bytes.subarray(12, 16).toString();
    if (type === 'VP8X')
      return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
    if (type === 'VP8 ')
      return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (type === 'VP8L') {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
  }
  throw new Error('Unsupported display image format or missing dimensions');
}

/** Minimal HTML tree parser for WordPress's rendered, well-formed editorial markup. */
function parseHtml(html) {
  const rootNode = { tag: '', attrs: {}, children: [] };
  const stack = [rootNode];
  for (const token of html.match(/<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g) ?? []) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (!token.startsWith('<')) {
      stack.at(-1).children.push(token);
      continue;
    }
    const end = token.match(/^<\/([\w-]+)/);
    if (end) {
      const index = stack.findLastIndex
        ? stack.findLastIndex((node) => node.tag === end[1].toLowerCase())
        : stack.map((node) => node.tag).lastIndexOf(end[1].toLowerCase());
      if (index > 0) stack.length = index;
      continue;
    }
    const start = token.match(/^<([\w-]+)/);
    if (!start) continue;
    const node = { tag: start[1].toLowerCase(), attrs: {}, children: [] };
    const attributeText = token.slice(start[0].length, token.endsWith('/>') ? -2 : -1);
    for (const attribute of attributeText.matchAll(
      /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    )) {
      node.attrs[attribute[1].toLowerCase()] = decode(
        attribute[2] ?? attribute[3] ?? attribute[4] ?? '',
      );
    }
    stack.at(-1).children.push(node);
    if (!voidTags.has(node.tag) && !token.endsWith('/>')) stack.push(node);
  }
  return rootNode;
}

function descendants(node, tag) {
  const found = [];
  for (const child of node.children) {
    if (typeof child === 'string') continue;
    if (child.tag === tag) found.push(child);
    found.push(...descendants(child, tag));
  }
  return found;
}
function textOf(node) {
  return node.children.map((child) => (typeof child === 'string' ? child : textOf(child))).join('');
}

function localHref(raw) {
  try {
    const url = new URL(raw, 'https://le24regards.ca');
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return '';
    if (url.hostname === 'le24regards.ca' || url.hostname === 'le24regards.wordpress.com') {
      const slug = url.pathname.replace(/^\/|\/$/g, '');
      if (articleSlugs.includes(slug)) return `/articles/${slug}/`;
      if (authorSlugs.includes(slug)) return `/redaction/${slug}/`;
      const magazine = magazineSources.find((issue) => issue.legacyPath === url.pathname);
      if (magazine) return `/?numero=${magazine.id}`;
    }
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.href;
  } catch {
    return '';
  }
}

function imageAlt(attrs, articleTitle) {
  const original = plainText(attrs.alt ?? '');
  if (original) return original;
  const caption = plainText(attrs['data-image-caption'] ?? '');
  if (caption) return caption;
  const title = plainText(decode(attrs['data-image-title'] ?? ''));
  const filename = basename(new URL(attrs['data-orig-file'] ?? attrs.src).pathname);
  const descriptions = {
    'le-24-regards-mois-dhorreur-2025.png':
      'Programmation du Mois d’horreur 2025 : 31 films pour les 31 jours d’octobre',
    'him-cri.jpg': 'Him : scène du cri',
    'him-gladiateur.jpg': 'Him : scène du gladiateur',
    'him-cowboy.jpg': 'Him : scène du cowboy',
    'weapons-rencontre.png': 'Weapons : scène de rencontre',
    'weapons-brolin.png': 'Josh Brolin dans Weapons',
    'weapons-madigan.jpg': 'Amy Madigan dans Weapons',
    'superhappyforever-plage.webp': 'Super Happy Forever : la plage',
    'superhappyforever-sano-triste.jpeg': 'Super Happy Forever : Sano triste',
    'superhappyforever-depressif.jpg': 'Super Happy Forever : Sano',
    'superhappyforever-bateau.jpg': 'Super Happy Forever : le bateau',
    'superhappyforever-atami.png': 'Super Happy Forever : Atami',
  };
  const still = filename.match(/^thesecretagent_still_(\d+)/);
  return (
    descriptions[filename] ??
    (still
      ? `L’Agent secret : photogramme ${Number(still[1])}`
      : title || `Illustration de « ${articleTitle} »`)
  );
}

const credits = [];
const media = new Map();
const displayImages = new Map();
let removedVoteCalls = 0;

async function renderEditorial(node, context) {
  if (typeof node === 'string') return node;
  if (['script', 'style', 'iframe', 'object', 'embed', 'form'].includes(node.tag)) return '';
  if (
    node.tag === 'p' &&
    descendants(node, 'a').some((link) => /\/vote-mois-dhorreur-2025\//.test(link.attrs.href ?? ''))
  ) {
    removedVoteCalls++;
    return '';
  }
  if (node.tag === 'img') {
    const remote = new URL(node.attrs['data-orig-file'] ?? node.attrs.src);
    remote.protocol = 'https:';
    remote.search = '';
    const filename = decodeURIComponent(basename(remote.pathname));
    if (!/^[\w.-]+$/.test(filename)) throw new Error(`Unexpected media filename: ${filename}`);
    const localPath = `/media/${filename}`;
    if (media.has(filename) && media.get(filename) !== remote.href)
      throw new Error(`Media filename collision: ${filename}`);
    if (!media.has(filename)) {
      await download(remote.href, resolve(mediaDirectory, filename));
      media.set(filename, remote.href);
    }
    const attachment = context.post.attachments?.[node.attrs['data-attachment-id']];
    let metadata = {};
    try {
      metadata = JSON.parse(node.attrs['data-image-meta'] ?? '{}');
    } catch {
      /* Metadata is optional, editorial text is preserved. */
    }
    const credit = [
      ...new Set(
        [
          attachment?.exif?.credit,
          attachment?.exif?.copyright,
          metadata.credit,
          metadata.copyright,
        ].filter(Boolean),
      ),
    ].join(' — ');
    const description = imageAlt(node.attrs, context.title);
    credits.push({
      label: description,
      sourceUrl: remote.href,
      ...(credit ? { credit } : {}),
      localPath,
    });
    const dimensions = (node.attrs['data-orig-size'] ?? '').split(',').map(Number);
    const width = attachment?.width || dimensions[0];
    const height = attachment?.height || dimensions[1];
    if (!(width > 0 && height > 0))
      throw new Error(`Missing original image dimensions: ${filename}`);
    const displayWidth = Math.min(1200, width);
    const displayName = `display-${filename}`;
    const displayPath = `/media/${displayName}`;
    if (!displayImages.has(displayName)) {
      const resized = new URL(remote);
      resized.searchParams.set('w', String(displayWidth));
      const bytes = await download(resized.href, resolve(mediaDirectory, displayName));
      const size = imageDimensions(bytes);
      // WordPress's resizer can round either dimension down by one pixel.
      if (
        Math.abs(size.width - displayWidth) > 1 ||
        Math.abs(size.height - (height * size.width) / width) > 1
      ) {
        throw new Error(`Unexpected display image ratio: ${filename}`);
      }
      displayImages.set(displayName, size);
    }
    const display = displayImages.get(displayName);
    return `<a href="${escapeAttribute(localPath)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttribute(`Ouvrir l’image en pleine définition : ${description}`)}"><img src="${escapeAttribute(displayPath)}" alt="${escapeAttribute(description)}" width="${display.width}" height="${display.height}" loading="lazy" decoding="async"></a>`;
  }
  const children = (
    await Promise.all(node.children.map((child) => renderEditorial(child, context)))
  ).join('');
  if (!allowedTags.has(node.tag)) return children;
  if (node.tag === 'br') return '<br>';
  if (node.tag === 'a') {
    const href = localHref(node.attrs.href ?? '');
    return href ? `<a href="${escapeAttribute(href)}">${children}</a>` : children;
  }
  return `<${node.tag}>${children}</${node.tag}>`;
}

function importAuthor(post, articles) {
  const tree = parseHtml(post.content);
  const lists = descendants(tree, 'ul');
  const favorites = (lists[0] ? descendants(lists[0], 'li') : []).map((item) =>
    plainText(textOf(item)),
  );
  const texts = [];
  for (const item of lists[1] ? descendants(lists[1], 'li') : []) {
    const link = descendants(item, 'a')[0];
    if (!link) continue;
    const path = new URL(link.attrs.href, 'https://le24regards.ca').pathname;
    const magazine = magazineSources.find((issue) => issue.legacyPath === path);
    const article = articles.find(
      (entry) => `/articles/${entry.slug}/` === localHref(link.attrs.href),
    );
    if (!magazine && !article)
      throw new Error(`Unknown text reference on ${post.slug}: ${link.attrs.href}`);
    texts.push({
      title: plainText(textOf(item)),
      kind: magazine ? 'magazine' : 'article',
      target: magazine?.id ?? article.slug,
    });
  }
  for (const article of articles.filter((entry) => entry.authorSlug === post.slug)) {
    if (!texts.some((text) => text.kind === 'article' && text.target === article.slug)) {
      texts.push({ title: article.title, kind: 'article', target: article.slug });
    }
  }
  return {
    slug: post.slug,
    name: plainText(post.title),
    role: plainText(textOf(descendants(tree, 'h2')[0])),
    favorites,
    texts,
  };
}

async function writeJson(filename, value) {
  await writeFile(
    resolve(contentDirectory, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

await mkdir(contentDirectory, { recursive: true });
await mkdir(mediaDirectory, { recursive: true });
const response = JSON.parse((await get(`${api}/posts/?number=100&type=any`)).toString('utf8'));
const posts = new Map(response.posts.map((post) => [post.slug, post]));
for (const slug of [...articleSlugs, ...authorSlugs])
  if (!posts.has(slug)) throw new Error(`Missing source: ${slug}`);

const articles = [];
for (const slug of articleSlugs) {
  const post = posts.get(slug);
  const title = plainText(post.title);
  const contentHtml = (await renderEditorial(parseHtml(post.content), { post, title }))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  articles.push({
    id: String(post.ID),
    slug,
    title,
    publishedAt: new Date(post.date).toISOString(),
    ...(slug !== 'mois-dhorreur-2025' ? { authorSlug: 'mathieu-giroux' } : {}),
    sourceUrl: post.URL.replace(/^http:/, 'https:'),
    contentHtml,
  });
  credits.push({
    label: title,
    sourceUrl: post.URL.replace(/^http:/, 'https:'),
    ...(slug !== 'mois-dhorreur-2025' ? { credit: 'Texte : Mathieu Giroux' } : {}),
  });
}
if (media.size !== 16) throw new Error(`Expected 16 original article images, found ${media.size}`);
if (removedVoteCalls !== 1)
  throw new Error(`Expected one voting paragraph, removed ${removedVoteCalls}`);
const authors = authorSlugs.map((slug) => importAuthor(posts.get(slug), articles));

const identity = [
  {
    sourceUrl: 'https://le24regards.wordpress.com/wp-content/uploads/2025/06/titre-magazine.png',
    localPath: '/media/titre-magazine.png',
    label: 'Identité visuelle — titre 24 Regards',
    credit: '24 Regards',
  },
  {
    sourceUrl:
      'https://le24regards.wordpress.com/wp-content/uploads/2024/12/cropped-24toiles_monogramme_sticker_v2.png',
    localPath: '/media/favicon.png',
    label: 'Identité visuelle — monogramme 24 Regards',
    credit: '24 Regards',
  },
];
await Promise.all(
  identity.map((asset) =>
    download(asset.sourceUrl, resolve(root, 'static', asset.localPath.slice(1))),
  ),
);
credits.push(...identity);
for (const magazine of magazineSources) {
  credits.push({
    label: magazine.title,
    sourceUrl: `https://le24regards.ca${magazine.legacyPath}`,
    localPath: magazine.pdfFile,
    credit: '24 Regards et les personnes créditées dans le numéro',
  });
}
for (const author of authors)
  credits.push({
    label: `Rédaction — ${author.name}`,
    sourceUrl: `https://le24regards.ca/${author.slug}/`,
  });

const site = {
  siteUrl: 'https://le24regards.ca',
  contactName: '24 Regards',
  email: 'le24regards@gmail.com',
  blueskyUrl: 'https://bsky.app/profile/le24regards.bsky.social',
  instagramUrl: '',
  newsletter: { actionUrl: '', emailFieldName: 'email', hiddenFields: {} },
};
// Preserve the site's local integration configuration on later editorial imports.
try {
  const current = JSON.parse(await readFile(resolve(contentDirectory, 'site.json'), 'utf8'));
  site.instagramUrl = current.instagramUrl ?? '';
  site.newsletter = current.newsletter ?? site.newsletter;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await writeJson('articles.json', articles);
await writeJson('authors.json', authors);
await writeJson('magazines.json', magazineSources);
await writeJson('site.json', site);
await writeJson('credits.json', credits);
console.log(
  `Imported ${articles.length} articles, ${authors.length} authors, ${magazineSources.length} magazines, ${media.size} article images and ${identity.length} identity assets.`,
);
const displayBytes = (
  await Promise.all(
    [...displayImages.keys()].map((filename) => readFile(resolve(mediaDirectory, filename))),
  )
).reduce((sum, bytes) => sum + bytes.length, 0);
console.log(
  `Downloaded ${displayImages.size} display variants (maximum width 1200px), ${displayBytes} bytes total. Full-definition originals remain linked from every image.`,
);
console.log(
  'Removed the single voting call; preserved article text, signatures, formatting and available credits.',
);
