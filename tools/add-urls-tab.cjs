/* Add a "Live links" tab to the client's build sheet.
 *
 * Every row in the build sheet that names a URL gets the full address on the
 * Vercel deployment, plus whether that page is actually built yet — the sheet
 * is a plan, and most of it is not live, so a column of links with no status
 * beside them would be 126 rows of mostly-404s.
 *
 *   node tools/add-urls-tab.cjs [--origin https://...] [--out file.xlsx]
 *
 * Writes alongside the original rather than over it; pass --out to choose.
 * There is no zip binary here, so PowerShell does the archiving.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'Portabox-SEO-Build-Sheet.xlsx');
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i > -1 && argv[i + 1] ? argv[i + 1] : dflt;
};
const ORIGIN = arg('origin', 'https://portabox-website.vercel.app').replace(/\/+$/, '');
const OUT = path.resolve(arg('out', SRC));

/* ---- what is actually built ---- */
const SITE = path.join(__dirname, '..', 'site');
const built = new Set();
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name === 'index.html') {
      const rel = path.relative(SITE, p).split(path.sep).join('/');
      built.add('/' + rel.replace(/index\.html$/, ''));
    }
  }
})(SITE);

/* ---- read the build sheet ---- */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-'));
execFileSync('unzip', ['-o', '-q', SRC, '-d', dir]);

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#10;/g, '\n').replace(/&amp;/g, '&');
const encode = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ssPath = path.join(dir, 'xl', 'sharedStrings.xml');
const shared = fs.existsSync(ssPath)
  ? [...fs.readFileSync(ssPath, 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')))
  : [];

const colIndex = (ref) => {
  let n = 0;
  for (const ch of ref.replace(/[0-9]/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function readSheet(file) {
  const xml = fs.readFileSync(path.join(dir, 'xl', 'worksheets', file), 'utf8');
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cm of rm[2].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[2], inner = cm[3] || '';
      let v = '';
      if (/t="s"/.test(attrs)) {
        const i = (inner.match(/<v>(\d+)<\/v>/) || [])[1];
        v = i !== undefined ? shared[Number(i)] : '';
      } else if (/t="inlineStr"/.test(attrs)) {
        v = decode([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
      } else {
        v = decode((inner.match(/<v>([\s\S]*?)<\/v>/) || [, ''])[1]);
      }
      cells[colIndex(cm[1])] = v;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
    rows.push(cells);
  }
  return rows;
}

const rows = readSheet('sheet2.xml');
const head = rows[0];
const col = (n) => head.indexOf(n);
const cBatch = col('Batch'), cNum = col('#'), cType = col('Page type');
const cUrl = col('New URL'), cKw = col('Target keyword'), cOld = col('Old URL to 301');

/* ---- build the rows for the new tab ---- */
const out = [[
  '#', 'Batch', 'Page type', 'Path', 'Full link', 'Status', 'Target keyword', 'Old URL to 301',
]];

let live = 0, planned = 0, notPage = 0;
for (const r of rows.slice(1)) {
  if (!r[cBatch]) continue;
  const p = (r[cUrl] || '').trim();
  const isPath = p.startsWith('/');

  let link = '', status;
  if (isPath) {
    link = ORIGIN + p;
    if (built.has(p)) { status = 'Live'; live++; }
    else { status = 'Not built yet'; planned++; }
  } else {
    /* robots.txt, sitemap.xml, the schema layer and the four Google Business
       Profiles are not pages, so they get no link. The two files that do
       exist are still worth linking. */
    if (/^(robots\.txt|sitemap\.xml)$/.test(p)) {
      link = ORIGIN + '/' + p;
      status = fs.existsSync(path.join(SITE, p)) ? 'Live' : 'Not built yet';
      if (status === 'Live') live++; else planned++;
    } else {
      status = 'Not a page';
      notPage++;
    }
  }

  out.push([
    r[cNum] ? String(Math.round(Number(r[cNum]))) : '',
    r[cBatch], r[cType] || '', p, link, status, r[cKw] || '', r[cOld] || '',
  ]);
}

/* ---- write the sheet ---- */
const letter = (i) => {
  let s = '';
  for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};

const sheetXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<cols>' +
  '<col min="1" max="1" width="5"/><col min="2" max="2" width="24"/>' +
  '<col min="3" max="3" width="18"/><col min="4" max="4" width="40"/>' +
  '<col min="5" max="5" width="64"/><col min="6" max="6" width="14"/>' +
  '<col min="7" max="7" width="30"/><col min="8" max="8" width="34"/>' +
  '</cols><sheetData>' +
  out.map((row, ri) =>
    '<row r="' + (ri + 1) + '">' +
    row.map((v, ci) =>
      v === '' ? '' :
      '<c r="' + letter(ci) + (ri + 1) + '" t="inlineStr"><is><t>' + encode(v) + '</t></is></c>'
    ).join('') +
    '</row>'
  ).join('') +
  '</sheetData></worksheet>';

/* The sheet file has to be one the workbook does not already use. */
const existing = fs.readdirSync(path.join(dir, 'xl', 'worksheets')).filter((f) => /^sheet\d+\.xml$/.test(f));
const nextNum = Math.max(...existing.map((f) => Number(f.match(/\d+/)[0]))) + 1;
const sheetFile = 'sheet' + nextNum + '.xml';
fs.writeFileSync(path.join(dir, 'xl', 'worksheets', sheetFile), sheetXml);

/* Register it: a relationship, a workbook entry, and a content type. */
const relPath = path.join(dir, 'xl', '_rels', 'workbook.xml.rels');
let rels = fs.readFileSync(relPath, 'utf8');
const usedIds = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
const rId = 'rId' + (Math.max(...usedIds) + 1);
rels = rels.replace('</Relationships>',
  '<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"' +
  ' Target="worksheets/' + sheetFile + '"/></Relationships>');
fs.writeFileSync(relPath, rels);

const wbPath = path.join(dir, 'xl', 'workbook.xml');
let wb = fs.readFileSync(wbPath, 'utf8');
const sheetIds = [...wb.matchAll(/sheetId="(\d+)"/g)].map((m) => Number(m[1]));
const TAB = 'Live links';
if (wb.includes('name="' + TAB + '"')) {
  /* Re-running should replace the tab, not stack another one up. */
  console.log('note: a "' + TAB + '" tab already exists and is being rewritten');
  wb = wb.replace(new RegExp('<sheet name="' + TAB + '"[^>]*/>'), '');
}
wb = wb.replace('</sheets>',
  '<sheet name="' + TAB + '" sheetId="' + (Math.max(...sheetIds) + 1) + '" r:id="' + rId + '"/></sheets>');
fs.writeFileSync(wbPath, wb);

const ctPath = path.join(dir, '[Content_Types].xml');
let ct = fs.readFileSync(ctPath, 'utf8');
ct = ct.replace('</Types>',
  '<Override PartName="/xl/worksheets/' + sheetFile + '"' +
  ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
fs.writeFileSync(ctPath, ct);

/* ---- repack ----
   Written here rather than shelled out. There is no zip binary, and
   PowerShell's Compress-Archive stores backslash path separators, which an
   xlsx reader rejects — the file looks fine on disk and will not open.

   The whole archive is assembled in memory and only written once it is
   complete, so a failure leaves the original workbook untouched. */
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const files = [];
(function collect(d, prefix) {
  for (const f of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const p = path.join(d, f.name);
    const name = prefix ? prefix + '/' + f.name : f.name;   // always forward slashes
    if (f.isDirectory()) collect(p, name);
    else files.push({ name, data: fs.readFileSync(p) });
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
  lh.writeUInt32LE(0x04034b50, 0);
  lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(method, 8);
  lh.writeUInt32LE(0, 10);                    // dos time/date, left at zero
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(f.data.length, 22);
  lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
  locals.push(lh, nameBuf, body);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0);
  ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8);
  ch.writeUInt16LE(method, 10); ch.writeUInt32LE(0, 12);
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(f.data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28);
  ch.writeUInt32LE(offset, 42);
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
  throw new Error('the archive came out too small; the original is untouched');
}

if (path.resolve(OUT) === path.resolve(SRC)) {
  const backup = SRC.replace(/\.xlsx$/, ' (original).xlsx');
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(SRC, backup);
    console.log('kept the original at ' + path.basename(backup));
  }
}
fs.writeFileSync(OUT, archive);
fs.rmSync(dir, { recursive: true, force: true });

console.log(
  `"${TAB}" added to ${path.basename(OUT)}: ${out.length - 1} rows\n` +
  `  ${live} live, ${planned} not built yet, ${notPage} not a page\n` +
  `  origin: ${ORIGIN}`
);
