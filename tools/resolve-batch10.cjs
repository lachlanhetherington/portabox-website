/* Work out what each batch 10 row actually is.
 *
 *   node tools/resolve-batch10.cjs
 *
 * The sheet says decide merge or rebuild per page and do not migrate as-is.
 * That decision needs a fact the sheet does not carry: where the suburb is,
 * and therefore which depot serves it — several of these names exist in more
 * than one state and at least one is in a city with no depot at all.
 *
 * So every row is geocoded against OpenStreetMap, all Australian matches are
 * kept, and each is measured to the nearest Portabox depot. Then:
 *
 *   one match inside a depot's range   -> rebuild as a suburb page there
 *   several, in different regions      -> ambiguous, needs confirming
 *   none in range                      -> outside the network, do not build
 *
 * Nothing is assigned by guesswork. The result is written to
 * build/batch10.json for the build to read.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'build', 'quote-data.json'));
const C = require(path.join(ROOT, 'build', 'content.js'));
const OUT = path.join(ROOT, 'build', 'batch10.json');

/* How far out a depot still runs a standard delivery. Past this the sheet's
   own guidance is that it is a Regional Solution job, quoted by hand. */
const IN_RANGE_KM = 200;

const hav = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
};
const roadKm = (a, b) => {
  const line = hav(a, b);
  return line ? Math.round(line * (line < 20 ? 1.25 : line > 150 ? 1.22 : 1.27)) : 0;
};

/* A depot serves more than one region, so the region is chosen by market:
   anything in the Gold Coast corridor belongs to the Gold Coast hub even
   though Gilberton serves both. */
function regionFor(hit, depotId) {
  const inRegion = C.REGIONS.filter((r) => r.depot === depotId);
  if (inRegion.length === 1) return inRegion[0];
  if (depotId === 'brisbane') {
    /* Below the Logan river and east of the hinterland reads as Gold Coast. */
    return C.REGIONS.find((r) => r.slug === (hit.lat < -27.75 ? 'gold-coast' : 'brisbane'));
  }
  if (depotId === 'sydney') {
    if (hit.lat < -34.2) return C.REGIONS.find((r) => r.slug === 'wollongong');
    if (hit.lat > -33.0) return C.REGIONS.find((r) => r.slug === 'central-coast');
    return C.REGIONS.find((r) => r.slug === 'sydney');
  }
  return inRegion[0];
}

function lookup(name) {
  const q = encodeURIComponent(`${name}, Australia`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=10&addressdetails=1&countrycodes=au`;
  const raw = execFileSync('curl', [
    '-s', '--max-time', '25',
    '-H', 'User-Agent: portabox-site-build/1.0 (one-off suburb geocode for a static site)',
    '-H', 'Accept-Language: en-AU',
    url,
  ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  try { return JSON.parse(raw); } catch { return []; }
}

const ROWS = process.argv.slice(2);
if (!ROWS.length) { console.error('pass the slugs to resolve'); process.exit(1); }

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

(async () => {
  for (const slug of ROWS) {
    if (cache[slug]) continue;
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

    const hits = lookup(name).filter((h) => {
      const t = h.addresstype || h.type || '';
      return /suburb|town|city|village|locality|neighbourhood|state_district/.test(t);
    });

    /* Keep the best match per region, measured to that region's depot. */
    const candidates = [];
    for (const h of hits) {
      const pt = { lat: Number(h.lat), lng: Number(h.lon) };
      let best = null;
      for (const dep of D.depots) {
        const km = roadKm(pt, dep);
        if (!best || km < best.km) best = { km, dep };
      }
      if (!best || best.km > IN_RANGE_KM) continue;
      const region = regionFor(pt, best.dep.id);
      if (!region) continue;
      if (candidates.some((c) => c.region.slug === region.slug)) continue;
      candidates.push({
        region, km: best.km, depot: best.dep.id,
        lat: pt.lat, lng: pt.lng,
        state: (h.address && h.address.state) || '',
        display: h.display_name,
      });
    }

    let verdict;
    if (candidates.length === 1) verdict = { action: 'rebuild', ...candidates[0] };
    else if (candidates.length > 1) verdict = { action: 'ambiguous', options: candidates.map((c) => `${c.region.name} (${c.km} km, ${c.state})`) };
    else verdict = { action: 'out-of-network' };

    cache[slug] = { name, ...verdict };
    const line = verdict.action === 'rebuild'
      ? `rebuild  -> /self-storage/${verdict.region.slug}/${slug}/  ${verdict.km} km from ${verdict.depot}`
      : verdict.action === 'ambiguous'
        ? `AMBIGUOUS -> ${verdict.options.join('  |  ')}`
        : 'OUT OF NETWORK -> no depot within ' + IN_RANGE_KM + ' km';
    console.log('  ' + slug.padEnd(20) + line);

    await new Promise((r) => setTimeout(r, 1100));
  }

  /* region holds a whole object; only the slug needs storing */
  const slim = {};
  for (const [k, v] of Object.entries(cache)) {
    slim[k] = (v.region && typeof v.region === 'object') ? { ...v, region: v.region.slug } : v;
  }
  fs.writeFileSync(OUT, JSON.stringify(slim, null, 1));

  const by = {};
  Object.values(slim).forEach((v) => { by[v.action] = (by[v.action] || 0) + 1; });
  console.log('\n' + Object.entries(by).map(([k, n]) => `${n} ${k}`).join(', '));
})();
