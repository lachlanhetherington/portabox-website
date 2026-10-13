/* Pull still frames out of a local video so they can be looked at.
 *
 * There is no ffmpeg on this machine, but Playwright ships a browser that can
 * decode and seek, which is all this needs. The frames are drawn to a canvas
 * and saved as PNGs.
 *
 *   node tools/video-frames.cjs "Loom Video.mp4" out/ 30 60 90
 *   node tools/video-frames.cjs "Loom Video.mp4" out/ --every 15
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
const outDir = process.argv[3] || 'frames';
const rest = process.argv.slice(4);

if (!file) {
  console.error('usage: video-frames.cjs <video> <outDir> [seconds...] | [--every N]');
  process.exit(1);
}

/* A file:// video cannot be read from a page that has no origin, so this
   wants an http URL. Point VIDEO_URL at the file on a local static server:

     npx http-server . -p 8777 -c-1 --silent
     VIDEO_URL="http://127.0.0.1:8777/clip.mp4" node tools/video-frames.cjs clip.mp4 out/ --every 15
*/
const fileUrl = process.env.VIDEO_URL ||
  ('file:///' + path.resolve(file).replace(/\\/g, '/').replace(/ /g, '%20'));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  /* The bundled Chromium is built without proprietary codecs, so an H.264 mp4
     never reaches loadedmetadata. Real Chrome or Edge has them, and Windows
     has at least one of the two. */
  const channels = [process.env.BROWSER_CHANNEL, 'chrome', 'msedge']
    .filter(Boolean).filter((c, i, a) => a.indexOf(c) === i).concat([undefined]);
  let b = null, used = null;
  for (const channel of channels) {
    try {
      b = await chromium.launch(channel ? { channel } : {});
      used = channel || 'bundled chromium';
      break;
    } catch (e) { /* not installed; try the next */ }
  }
  if (!b) { console.error('no usable browser'); process.exit(2); }
  console.error('using: ' + used);
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });

  /* The video has to live in a document with a real origin. Injecting it into
     a setContent document fails silently and looks exactly like a missing
     codec, which sent this down the wrong path for a while. So: navigate to
     the host serving the file, then add the element. */
  const origin = new URL(fileUrl).origin;
  await p.goto(origin + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate((src) => {
    document.body.innerHTML =
      '<video id="v" muted preload="auto"></video><canvas id="c"></canvas>';
    document.body.style.cssText = 'margin:0;background:#000';
    document.getElementById('v').src = src;
  }, fileUrl);

  const meta = await p.evaluate(() => new Promise((resolve) => {
    const v = document.getElementById('v');
    const done = () => resolve({ ok: true, duration: v.duration, w: v.videoWidth, h: v.videoHeight });
    if (v.readyState >= 1) return done();
    v.onloadedmetadata = done;
    v.onerror = () => resolve({ ok: false, err: 'decode error ' + (v.error ? v.error.code : '?') });
    setTimeout(() => resolve({ ok: false, err: 'timeout waiting for metadata' }), 20000);
  }));

  if (!meta.ok) {
    console.error('cannot read this video:', meta.err);
    console.error('(Playwright ships Chromium without proprietary codecs; an H.264 mp4 may need the "chrome" channel or ffmpeg.)');
    await b.close();
    process.exit(2);
  }

  console.log(`duration ${Math.round(meta.duration)}s, ${meta.w}x${meta.h}`);

  let times = rest.filter((x) => /^\d+(\.\d+)?$/.test(x)).map(Number);
  const everyIdx = rest.indexOf('--every');
  if (everyIdx > -1) {
    const step = Number(rest[everyIdx + 1]) || 15;
    times = [];
    for (let t = 1; t < meta.duration; t += step) times.push(Math.round(t));
  }
  if (!times.length) times = [1];

  for (const t of times) {
    const dataUrl = await p.evaluate(async (sec) => {
      const v = document.getElementById('v');
      await new Promise((res) => {
        const go = () => { v.removeEventListener('seeked', go); res(); };
        v.addEventListener('seeked', go);
        v.currentTime = sec;
        setTimeout(res, 8000);
      });
      const c = document.getElementById('c');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      return c.toDataURL('image/png');
    }, t);

    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    const name = path.join(outDir, `t${mm}m${ss}s.png`);
    fs.writeFileSync(name, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('  ' + name);
  }

  await b.close();
})();
