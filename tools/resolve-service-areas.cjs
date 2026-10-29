/* Measure the service areas the client lists in their footer.
 *
 *   node tools/resolve-service-areas.cjs
 *
 * The client asked for every area in the site footer to have a real page.
 * Several are regional centres rather than metro suburbs, and a page that
 * promises standard delivery somewhere a truck does not reach is worse than
 * no page at all — so each one is geocoded and measured to the nearest depot
 * before anything is written.
 *
 * Writes build/service-areas.json. Nothing is assigned by guesswork.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'build', 'quote-data.json'));
const OUT = path.join(ROOT, 'build', 'service-areas.json');

/* Past this the sheet's own guidance is that it is a Regional Solution job,
   quoted by hand rather than sold as a standard delivery. */
const IN_RANGE_KM = 200;

/* The areas as the client writes them, with the state they mean. Several of
   these names exist more than once in Australia — there is a Newcastle in
   NSW and a Newcastle in WA, a Richmond in four states — so the state is
   pinned here rather than left to whichever match the geocoder ranks first. */
const AREAS = [
  ['sunshine-coast',       'Sunshine Coast',       'Queensland'],
  ['toowoomba',            'Toowoomba',            'Queensland'],
  ['byron-bay',            'Byron Bay',            'New South Wales'],
  ['blue-mountains',       'Blue Mountains',       'New South Wales'],
  ['geelong',              'Geelong',              'Victoria'],
  ['mornington-peninsula', 'Mornington Peninsula', 'Victoria'],
  ['morwell',              'Morwell',              'Victoria'],
  ['ballarat',             'Ballarat',             'Victoria'],
  ['seymour',              'Seymour',              'Victoria'],
  ['victor-harbor',        'Victor Harbor',        'South Australia'],
  ['murray-bridge',        'Murray Bridge',        'South Australia'],
  ['barossa',              'Barossa Valley',       'South Australia'],
  ['gawler',               'Gawler',               'South Australia'],
  ['adelaide-hills',       'Adelaide Hills',       'South Australia'],
];

const hav = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
};
/* Straight line understates a drive. The multiplier is the same one the
   suburb pages were measured with, so the numbers stay comparable. */
const roadKm = (a, b) => {
  const line = hav(a, b);
  return line ? Math.round(line * (line < 20 ? 1.25 : line > 150 ? 1.22 : 1.27)) : 0;
};

function lookup(name, state) {
  const q = encodeURIComponent(`${name}, ${state}, Australia`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1&countrycodes=au`;
  const raw = execFileSync('curl', [
    '-s', '--max-time', '25',
    '-H', 'User-Agent: portabox-site-build/1.0 (one-off service-area geocode for a static site)',
    '-H', 'Accept-Language: en-AU',
    url,
  ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  try { return JSON.parse(raw); } catch { return []; }
}

(async () => {
  const out = {};
  for (const [slug, name, state] of AREAS) {
    const hits = lookup(name, state);
    const hit = hits.find((h) => (h.address && h.address.state) === state) || hits[0];
    if (!hit) { console.log('  ' + slug.padEnd(22) + 'NO MATCH'); continue; }

    const pt = { lat: Number(hit.lat), lng: Number(hit.lon) };
    let best = null;
    for (const dep of D.depots) {
      const km = roadKm(pt, dep);
      if (!best || km < best.km) best = { km, dep };
    }

    out[slug] = {
      name, state,
      lat: pt.lat, lng: pt.lng,
      km: best.km,
      depot: best.dep.id,
      inRange: best.km <= IN_RANGE_KM,
      display: hit.display_name,
    };
    console.log(
      '  ' + slug.padEnd(22) +
      String(best.km).padStart(4) + ' km from ' + best.dep.id.padEnd(10) +
      (best.km <= IN_RANGE_KM ? '' : '  OUT OF STANDARD RANGE')
    );
    await new Promise((r) => setTimeout(r, 1100));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const n = Object.values(out).filter((v) => v.inRange).length;
  console.log(`\n${Object.keys(out).length} measured, ${n} inside ${IN_RANGE_KM} km`);
})();
