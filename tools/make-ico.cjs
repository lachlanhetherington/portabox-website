/* Build a .ico from PNG files.
 *
 *   node tools/make-ico.cjs out.ico in-16.png in-32.png [...]
 *
 * An .ico is a small header plus the PNGs stored whole — no re-encoding and
 * no image library needed, which matters here because there is no ImageMagick
 * or sharp on this machine. Browsers have accepted PNG-in-ICO since IE11.
 *
 * It is still worth shipping: /favicon.ico is requested by default whether or
 * not the HTML asks for it, and a 404 on it shows up in logs forever.
 */
const fs = require('fs');

const [out, ...pngs] = process.argv.slice(2);
if (!out || !pngs.length) {
  console.error('usage: make-ico.cjs out.ico in.png [in.png ...]');
  process.exit(1);
}

const images = pngs.map((f) => {
  const data = fs.readFileSync(f);
  /* Width and height live at bytes 16-23 of the IHDR chunk. */
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  if (w > 256 || h > 256) throw new Error(`${f} is ${w}x${h}; ico tops out at 256`);
  return { data, w, h };
});

const HEADER = 6;
const ENTRY = 16;
let offset = HEADER + ENTRY * images.length;

const header = Buffer.alloc(HEADER);
header.writeUInt16LE(0, 0);               // reserved
header.writeUInt16LE(1, 2);               // 1 = icon
header.writeUInt16LE(images.length, 4);

const entries = [];
for (const img of images) {
  const e = Buffer.alloc(ENTRY);
  e.writeUInt8(img.w === 256 ? 0 : img.w, 0);   // 0 means 256
  e.writeUInt8(img.h === 256 ? 0 : img.h, 1);
  e.writeUInt8(0, 2);                            // palette count
  e.writeUInt8(0, 3);                            // reserved
  e.writeUInt16LE(1, 4);                         // colour planes
  e.writeUInt16LE(32, 6);                        // bits per pixel
  e.writeUInt32LE(img.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.data.length;
  entries.push(e);
}

fs.writeFileSync(out, Buffer.concat([header, ...entries, ...images.map((i) => i.data)]));
console.log(`${out}: ${images.map((i) => i.w + 'x' + i.h).join(', ')} — ${fs.statSync(out).size} bytes`);
