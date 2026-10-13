/* Add "Full link" and "Status" columns to the Build sheet of the client's
 * workbook, on the same row as the item they belong to.
 *
 *   node tools/add-live-links.cjs [--origin https://...] [--out file.xlsx]
 *
 * Rebuilt from "Portabox-SEO-Build-Sheet (original).xlsx" each time rather
 * than edited in place, so re-running never stacks the columns up and the
 * client's file is never the thing being mutated.
 *
 * Writing the archive by hand rather than shelling out: there is no zip
 * binary here, and PowerShell's Compress-Archive stores backslash path
 * separators, which an xlsx reader rejects — the file looks fine on disk and
 * will not open.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PRISTINE = path.join(ROOT, 'Portabox-SEO-Build-Sheet (original).xlsx');
const CURRENT = path.join(ROOT, 'Portabox-SEO-Build-Sheet.xlsx');
const SRC = fs.existsSync(PRISTINE) ? PRISTINE : CURRENT;

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const ORIGIN = arg('origin', 'https://portabox-website.vercel.app').replace(/\/+$/, '');
const OUT = path.resolve(arg('out', CURRENT));

/* ---- which pages exist ---- */
const SITE = path.join(ROOT, 'site');
const built = new Set();
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name === 'index.html') {
      built.add('/' + path.relative(SITE, p).split(path.sep).join('/').replace(/index\.html$/, ''));
    }
  }
})(SITE);

/* ---- unpack ---- */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-'));
execFileSync('unzip', ['-o', '-q', SRC, '-d', dir]);

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#10;/g, '\n').replace(/&amp;/g, '&');
const encode = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shared = (() => {
  const p = path.join(dir, 'xl', 'sharedStrings.xml');
  if (!fs.existsSync(p)) return [];
  return [...fs.readFileSync(p, 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
})();

const sheetPath = path.join(dir, 'xl', 'worksheets', 'sheet2.xml');
let xml = fs.readFileSync(sheetPath, 'utf8');

/* Find which column holds the URL, by reading the header row. */
const colIndex = (ref) => {
  let n = 0;
  for (const ch of ref.replace(/[0-9]/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const cellText = (attrs, inner) => {
  if (/t="s"/.test(attrs)) {
    const i = (inner.match(/<v>(\d+)<\/v>/) || [])[1];
    return i !== undefined ? shared[Number(i)] : '';
  }
  if (/t="inlineStr"/.test(attrs)) {
    return decode([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
  }
  return decode((inner.match(/<v>([\s\S]*?)<\/v>/) || [, ''])[1]);
};

const headerRow = xml.match(/<row r="1"[^>]*>([\s\S]*?)<\/row>/);
let urlCol = -1, lastCol = -1;
for (const cm of headerRow[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
  const i = colIndex(cm[1]);
  lastCol = Math.max(lastCol, i);
  if (cellText(cm[2], cm[3] || '').trim() === 'New URL') urlCol = i;
}
if (urlCol < 0) throw new Error('could not find the "New URL" column');

const letter = (i) => { let s = ''; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };
const LINK_COL = lastCol + 1;
const STATUS_COL = lastCol + 2;

/* ---- add the two cells to every row ---- */
let live = 0, planned = 0, notPage = 0;

xml = xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, (whole, rNum, rAttrs, body) => {
  const n = Number(rNum);

  if (n === 1) {
    /* Match the header row's own style so the new headings do not stand out. */
    const style = (body.match(/<c r="[A-Z]+1"\s+s="(\d+)"/) || [, ''])[1];
    const s = style ? ` s="${style}"` : '';
    return `<row r="1"${rAttrs}>${body}` +
      `<c r="${letter(LINK_COL)}1"${s} t="inlineStr"><is><t>Full link</t></is></c>` +
      `<c r="${letter(STATUS_COL)}1"${s} t="inlineStr"><is><t>Status</t></is></c>` +
      `</row>`;
  }

  let url = '';
  for (const cm of body.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    if (colIndex(cm[1]) === urlCol) { url = cellText(cm[2], cm[3] || '').trim(); break; }
  }
  if (!url) return whole;                       // spacer rows keep their shape

  let link = '', status;
  if (url.startsWith('/')) {
    link = ORIGIN + url;
    if (built.has(url)) { status = 'Live'; live++; } else { status = 'Not built yet'; planned++; }
  } else if (/^(robots\.txt|sitemap\.xml)$/.test(url)) {
    link = ORIGIN + '/' + url;
    if (fs.existsSync(path.join(SITE, url))) { status = 'Live'; live++; } else { status = 'Not built yet'; planned++; }
  } else {
    /* The Google Business Profiles and the schema layer are not pages. */
    status = 'Not a page';
    notPage++;
  }

  return `<row r="${rNum}"${rAttrs}>${body}` +
    (link ? `<c r="${letter(LINK_COL)}${rNum}" t="inlineStr"><is><t>${encode(link)}</t></is></c>` : '') +
    `<c r="${letter(STATUS_COL)}${rNum}" t="inlineStr"><is><t>${status}</t></is></c>` +
    `</row>`;
});

/* Give the two new columns a sensible width; the sheet already declares
   14–26 at a default, so those entries are replaced rather than appended. */
xml = xml.replace(/<col customWidth="1" min="14" max="26" width="[^"]*"\/>/,
  `<col customWidth="1" min="${LINK_COL + 1}" max="${LINK_COL + 1}" width="62.0"/>` +
  `<col customWidth="1" min="${STATUS_COL + 1}" max="${STATUS_COL + 1}" width="14.0"/>` +
  `<col customWidth="1" min="${STATUS_COL + 2}" max="26" width="8.71"/>`);

/* The declared dimension has to cover the new columns or some readers clip. */
xml = xml.replace(/<dimension ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/,
  (m, a, b, c, d) => `<dimension ref="${a}${b}:${letter(STATUS_COL)}${d}"/>`);

fs.writeFileSync(sheetPath, xml);

/* ---- repack ---- */
const CRC = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t; })();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; };

const files = [];
(function collect(d, prefix) {
  for (const f of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const p = path.join(d, f.name);
    const name = prefix ? prefix + '/' + f.name : f.name;    // forward slashes, always
    if (f.isDirectory()) collect(p, name); else files.push({ name, data: fs.readFileSync(p) });
  }
})(dir, '');

const locals = [], central = [];
let offset = 0;
for (const f of files) {
  const nameBuf = Buffer.from(f.name, 'utf8');
  const deflated = zlib.deflateRawSync(f.data, { level: 9 });
  const useDeflate = deflated.length < f.data.length;
  const body = useDeflate ? deflated : f.data;
  const method = useDeflate ? 8 : 0;
  const crc = crc32(f.data);

  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(method, 8);
  lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(f.data.length, 22);
  lh.writeUInt16LE(nameBuf.length, 26);
  locals.push(lh, nameBuf, body);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
  ch.writeUInt16LE(method, 10); ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(f.data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
  central.push(ch, nameBuf);

  offset += lh.length + nameBuf.length + body.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);

const archive = Buffer.concat([Buffer.concat(locals), centralBuf, end]);
if (archive.length < 2048) {
  fs.rmSync(dir, { recursive: true, force: true });
  throw new Error('the archive came out too small; nothing was written');
}

/* Only now is anything on disk touched. Excel holds a lock on a workbook it
   has open, so writing beside it beats failing with the work already done. */
let written = OUT;
try {
  fs.writeFileSync(OUT, archive);
} catch (e) {
  if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
  written = OUT.replace(/\.xlsx$/, ' (updated).xlsx');
  fs.writeFileSync(written, archive);
  console.log(
    `${path.basename(OUT)} is open in Excel and locked, so this went to\n` +
    `${path.basename(written)} instead. Close the workbook and re-run to\n` +
    `write it in place, or just use the new file.\n`
  );
}
fs.rmSync(dir, { recursive: true, force: true });
const OUT_WRITTEN = written;

console.log(
  `Build sheet: added "${letter(LINK_COL)} Full link" and "${letter(STATUS_COL)} Status"\n` +
  `  ${live} live, ${planned} not built yet, ${notPage} not a page\n` +
  `  origin ${ORIGIN}  ->  ${path.basename(OUT_WRITTEN)}`
);
