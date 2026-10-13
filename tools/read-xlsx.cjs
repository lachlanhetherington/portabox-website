/* Minimal xlsx reader — enough to read the client's build sheets without
   pulling in a dependency. An .xlsx is a zip of XML; the rows reference a
   shared string table by index, which is the only fiddly part.

     node tools/read-xlsx.cjs <file.xlsx> [sheetNumber] [--json]
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const file = process.argv[2];
const want = Number(process.argv[3] || 0) || null;
const asJson = process.argv.includes('--json');
if (!file) { console.error('usage: read-xlsx.cjs <file.xlsx> [sheet] [--json]'); process.exit(1); }

const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'xlsx-'));
execFileSync('unzip', ['-o', '-q', path.resolve(file), '-d', dir]);

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#10;/g, '\n').replace(/&amp;/g, '&');

let shared = [];
const ssPath = path.join(dir, 'xl', 'sharedStrings.xml');
if (fs.existsSync(ssPath)) {
  const ss = fs.readFileSync(ssPath, 'utf8');
  shared = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''))
  );
}

const wb = fs.readFileSync(path.join(dir, 'xl', 'workbook.xml'), 'utf8');
const names = [...wb.matchAll(/<sheet [^>]*name="([^"]*)"/g)].map((m) => decode(m[1]));

const colIndex = (ref) => {
  const letters = ref.replace(/[0-9]/g, '');
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const sheets = fs.readdirSync(path.join(dir, 'xl', 'worksheets'))
  .filter((f) => /^sheet\d+\.xml$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const out = [];
sheets.forEach((f, i) => {
  if (want && i + 1 !== want) return;
  const xml = fs.readFileSync(path.join(dir, 'xl', 'worksheets', f), 'utf8');
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    /* An empty cell is written self-closing: <c r="C2" s="7"/>. Matching only
       the paired form swallows it into the next cell, which then lands one
       column to the left — and since a shared-string index is just a number,
       the result reads as plausible data in the wrong column rather than as
       an error. Both forms are matched here. */
    for (const cm of rm[2].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[2];
      const inner = cm[3] || '';
      let v = '';
      if (/t="s"/.test(attrs)) {
        const idx = (inner.match(/<v>(\d+)<\/v>/) || [])[1];
        v = idx !== undefined ? shared[Number(idx)] : '';
      } else if (/t="inlineStr"/.test(attrs)) {
        v = decode([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
      } else {
        v = decode((inner.match(/<v>([\s\S]*?)<\/v>/) || [, ''])[1]);
      }
      cells[colIndex(cm[1])] = v;
    }
    for (let k = 0; k < cells.length; k++) if (cells[k] === undefined) cells[k] = '';
    rows.push(cells);
  }
  out.push({ name: names[i] || f, rows });
});

fs.rmSync(dir, { recursive: true, force: true });

if (asJson) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

out.forEach((s) => {
  console.log('\n=============== ' + s.name + ' (' + s.rows.length + ' rows) ===============');
  s.rows.forEach((r, i) => {
    const line = r.map((c) => String(c).replace(/\n/g, ' / ')).join(' | ').trim();
    if (line.replace(/\|/g, '').trim()) console.log(String(i + 1).padStart(4) + '  ' + line);
  });
});
