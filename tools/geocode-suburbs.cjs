/* Resolve the build sheet's suburb pages to real coordinates, and from those
 * to a real road distance from the depot that serves them.
 *
 *   node tools/geocode-suburbs.cjs
 *
 * The sheet requires a depot distance on every suburb page. Only four of the
 * forty-three suburbs appear in the quote app's postcode table, so the rest
 * are looked up against OpenStreetMap's Nominatim — free, no key, and used
 * here within its policy: one request a second, a real user agent, and the
 * answers cached to build/suburb-data.json so a rebuild never calls it again.
 *
 * Every result is checked against the state the suburb is supposed to be in.
 * A mismatch is dropped rather than guessed at: a wrong distance on a page
 * about somebody's own suburb is worse than no page.
 *
 * The four suburbs the sheet marks CHECK FIRST are skipped. Each name exists
 * in more than one state and the sheet says to confirm before building.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'suburb-data.json');
const D = require(path.join(ROOT, 'build', 'quote-data.json'));
const C = require(path.join(ROOT, 'build', 'content.js'));

const STATE_OF = { brisbane: 'QLD', 'gold-coast': 'QLD', sydney: 'NSW', 'central-coast': 'NSW',
                   newcastle: 'NSW', wollongong: 'NSW', melbourne: 'VIC', adelaide: 'SA' };

/* A region is a market, not a state. Tweed Heads trades as Gold Coast and
   sits across the border in NSW; querying it as QLD matched a hinterland
   locality of the same name and put it 29 km from the depot instead of 60. */
const STATE_OVERRIDE = { 'gold-coast/tweed-heads': 'NSW' };

/* Same arithmetic the quote engine uses, so a distance shown on a suburb page
   agrees with the one the quote charges for. */
const hav = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
};
const road = (a, b) => {
  const k = D.roads[a.postcode + '-' + b.postcode];
  if (k) return { km: k, measured: true };
  const line = hav(a, b);
  if (!line) return { km: 0, measured: false };
  return { km: Math.round(line * (line < 20 ? 1.25 : line > 150 ? 1.22 : 1.27)), measured: false };
};

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

function lookup(name, state) {
  const q = encodeURIComponent(`${name}, ${state}, Australia`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&countrycodes=au`;
  const raw = execFileSync('curl', [
    '-s', '--max-time', '25',
    '-H', 'User-Agent: portabox-site-build/1.0 (one-off suburb geocode for a static site)',
    '-H', 'Accept-Language: en-AU',
    url,
  ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  let hits;
  try { hits = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(hits)) return null;

  const wanted = state.toLowerCase();
  for (const h of hits) {
    const a = h.address || {};
    const st = String(a.state || '').toLowerCase();
    const ok =
      (wanted === 'qld' && /queensland/.test(st)) ||
      (wanted === 'nsw' && /new south wales/.test(st)) ||
      (wanted === 'vic' && /victoria/.test(st)) ||
      (wanted === 'sa' && /south australia/.test(st));
    if (!ok) continue;
    return {
      lat: Number(h.lat), lng: Number(h.lon),
      postcode: String(a.postcode || ''),
      display: h.display_name,
    };
  }
  return null;
}

(async () => {
  const jobs = [];
  for (const r of C.REGIONS) {
    for (const s of r.suburbs) {
      jobs.push({ region: r.slug, regionName: r.name, depot: r.depot, slug: s.slug, name: s.name, imp: s.imp });
    }
  }

  let fetched = 0, cached = 0, failed = [];
  for (const j of jobs) {
    const key = j.region + '/' + j.slug;
    if (cache[key] && cache[key].lat) { cached++; continue; }

    const state = STATE_OVERRIDE[key] || STATE_OF[j.region];
    const hit = lookup(j.name, state);
    if (!hit) { failed.push(key); continue; }

    const depot = D.depots.find((d) => d.id === j.depot);
    const dist = road({ ...hit, postcode: hit.postcode }, depot);

    cache[key] = {
      name: j.name, region: j.region, regionName: j.regionName, depot: j.depot,
      lat: hit.lat, lng: hit.lng, postcode: hit.postcode,
      km: dist.km, measured: dist.measured, imp: j.imp,
    };
    fetched++;
    console.log(`  ${key.padEnd(34)} ${String(dist.km).padStart(4)} km from ${depot.suburb}${dist.measured ? ' (measured)' : ''}`);
    await new Promise((r) => setTimeout(r, 1100));   // Nominatim asks for 1/sec
  }

  fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
  console.log(
    `\n${Object.keys(cache).length} suburbs on file — ${fetched} looked up, ${cached} already cached` +
    (failed.length ? `, ${failed.length} not resolved: ${failed.join(', ')}` : '')
  );
})();
