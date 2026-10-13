/* Resize and recompress source photography into site/assets/img.
 *
 * The client's library averages 3.7 MB an image at up to 2752px wide. Nothing
 * that size belongs on a page. There is no ImageMagick or sharp here, but
 * Playwright ships a browser, and a canvas resize with a JPEG encode is all
 * this needs.
 *
 *   node tools/optimise-images.cjs plan.json
 *
 * plan.json is a list of { from, to, width, quality?, fit? }:
 *   from     path under "Portabox Content/Portabox Content/images"
 *   to       filename written into site/assets/img
 *   width    target width in px; the height follows the source ratio
 *   fit      "cover" with a height to crop to a ratio instead
 *
 * Images are served over http because a canvas cannot read a file:// image
 * without tainting — toDataURL then throws a security error.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SRC_DIR = path.join(__dirname, '..', 'Portabox Content', 'Portabox Content', 'images');
const OUT_DIR = path.join(__dirname, '..', 'site', 'assets', 'img');

const planPath = process.argv[2];
if (!planPath) { console.error('usage: optimise-images.cjs <plan.json>'); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/* A one-file static server over the source directory, so the canvas sees a
   same-origin image and stays readable. */
function serve() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const name = decodeURIComponent(req.url.replace(/^\//, '').split('?')[0]);
      if (!name) {   // the page itself; the images are fetched from this origin
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end('<!doctype html><title>resize</title>');
      }
      const file = path.join(SRC_DIR, name);
      if (!file.startsWith(SRC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end();
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve({ server: s, port: s.address().port }));
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, port } = await serve();
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`http://127.0.0.1:${port}/`).catch(() => {});

  let before = 0, after = 0, done = 0, failed = [];

  for (const item of plan) {
    const src = path.join(SRC_DIR, item.from);
    if (!fs.existsSync(src)) { failed.push(item.from + ' — not found'); continue; }
    before += fs.statSync(src).size;

    const dataUrl = await p.evaluate(async (o) => {
      const img = new Image();
      img.src = '/' + encodeURIComponent(o.from);
      await img.decode();

      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');

      if (o.height) {
        /* Crop to a ratio: scale so the shorter side fills, then centre. */
        c.width = o.width; c.height = o.height;
        const scale = Math.max(o.width / img.naturalWidth, o.height / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        ctx.drawImage(img, (o.width - w) / 2, (o.height - h) / 2, w, h);
      } else {
        const scale = Math.min(1, o.width / img.naturalWidth);
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        ctx.drawImage(img, 0, 0, c.width, c.height);
      }
      return c.toDataURL('image/jpeg', o.quality || 0.82);
    }, item);

    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT_DIR, item.to), buf);
    after += buf.length;
    done++;
    console.log(
      `  ${String(Math.round(buf.length / 1024)).padStart(5)}KB  ${item.to}` +
      `   (from ${Math.round(fs.statSync(src).size / 1024)}KB)`
    );
  }

  await b.close();
  server.close();

  failed.forEach((f) => console.log('  SKIPPED ' + f));
  console.log(
    `\n${done} images: ${(before / 1048576).toFixed(0)}MB in, ${(after / 1048576).toFixed(1)}MB out` +
    (failed.length ? `, ${failed.length} skipped` : '')
  );
  process.exitCode = failed.length ? 1 : 0;
})();
