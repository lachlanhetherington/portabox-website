/* Check every actionable row of the review sheet against the built site.
 *
 *   node audit-sheet.cjs <site-dir>
 *
 * Each item carries a test, not a memory: `has` means the new wording must
 * appear, `gone` means the old wording must not. An item only passes when
 * every one of its checks passes, so "I applied that" is never taken on
 * trust — the last few rounds showed why.
 */
const fs = require('fs');
const path = require('path');

const SITE = process.argv[2] || 'site';
const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name === 'index.html') pages.push(p);
  }
})(SITE);
const corpus = pages.map((p) => ({ p, t: fs.readFileSync(p, 'utf8') }));

const count = (s) => corpus.filter((c) => c.t.includes(s)).length;
const on = (page, s) => {
  const f = corpus.find((c) => c.p.replace(/\\/g, '/').endsWith(page + '/index.html'));
  return f ? f.t.includes(s) : false;
};
/* Same as `on`, but ignoring the shared footer. Checking a whole page for a
   string that also lives in the footer passes on every page — which is how
   the Contact row for opening hours reported green while the page body had
   none of them. */
const inBody = (page, s) => {
  const f = corpus.find((c) => c.p.replace(/\\/g, '/').endsWith(page + '/index.html'));
  return f ? f.t.split('<footer')[0].includes(s) : false;
};
const exists = (p) => fs.existsSync(path.join(SITE, p, 'index.html'));

const ITEMS = [
  // tab, row, what, checks
  ['Site-wide', 5, 'Medium drops to $209', [['has', '$209'], ['has', '$11.00']]],
  ['Site-wide', 6, 'EARL page, linked from main pages', [['page', 'earl'], ['min', 'href="/earl/"', 100]]],
  ['Site-wide', 7, 'Opening hours in the footer', [['min', '8:00am', 100], ['min', '7:30am', 100]]],
  ['Site-wide', 8, '"Four Depots In Four States"', [['min', 'Four Depots In Four States', 100], ['gone', 'Four depots, Australia-wide']]],
  ['Site-wide', 9, 'Multicolour logo', [['min', 'logo-multicolour', 100]]],
  ['Site-wide', 10, '"Talk to our team"', [['gone', 'Talk to the depot'], ['gone', 'Ring the depot'], ['gone', 'Call the depot']]],

  ['Home', 5, '"No stressful depot trips"', [['has', 'No stressful depot trips']]],
  ['Home', 6, '"our secure depot"', [['has', 'keep it at our secure depot']]],
  ['Home', 7, 'driveway -> home', [['has', 'to your home. You load it']]],
  ['Home', 8, '"Ideal for renos, decluttering or parties"', [['has', 'Ideal for renos, decluttering or parties']]],
  ['Home', 9, '"on pick up and drop off"', [['has', 'EARL keeps it level on pick up and drop off']]],
  ['Home', 10, '"change the bottom dollar"', [['has', 'bottom dollar'], ['gone', 'change the arithmetic']]],
  ['Home', 11, '"EARL, meet our hydraulic difference"', [['has', 'EARL, meet our hydraulic difference']]],
  ['Home', 12, 'Steve is a different person', [['gone', 'person-steve-avatar.jpg'], ['min', 'person-steve-v5-avatar', 10]]],
  ['Home', 13, 'Informational diagrams + "External dimensions"', [['has', 'spec-external-dimensions'], ['has', 'spec-premium-build'], ['has', 'spec-internal-dimensions'], ['has', 'External dimensions']]],

  ['How it works', 5, '"We bring the containers to you"', [['pageHas', 'how-it-works', 'We bring the containers to you']]],
  ['How it works', 6, 'east-coast wording question', [['gone', 'Four depots, Australia-wide']]],
  ['How it works', 7, 'packing sentence rewritten', [['gone', 'doors at waist height'], ['has', 'Ready when you are']]],
  ['How it works', 8, 'step 1 rewritten', [['has', 'Your Portabox arrives on an agreed date']]],
  ['How it works', 9, 'step 3 rewritten', [['has', 'We collect it on an agreed date']]],

  ['Pricing', 5, 'four new FAQs', [['has', 'cheapest way to store'], ['has', 'store it at Mum'], ['has', 'pay a neighbour'], ['has', 'hydraulic Easylift']]],
  ['Pricing', 6, '"A little driveway space" block', [['has', 'A little driveway space'], ['has', '$110'], ['has', '$60']]],
  ['Pricing', 7, '"standard three-bedroom home"', [['has', 'standard three-bedroom home'], ['gone', 'A whole three-bedroom house']]],
  ['Pricing', 8, 'clearance rewritten (3.5 x 12 m)', [['has', '3.5 m wide and 12 m long'], ['has', 'overhanging branches, power lines and eaves']]],
  ['Pricing', 9, '"Call one of our team"', [['has', 'we have arranged a lot of moving and storage']]],
  ['Pricing', 10, '"from" pricing answer', [['has', "Everybody's moving and storage needs are different"]]],
  ['Pricing', 11, 'minimum term answer', [['has', "first month's rental is the minimum"]]],
  ['Pricing', 12, 'postcode line', [['has', 'Take a quick look to see if your postcode comes up']]],

  ['About', 5, '"you hold the keys"', [['has', 'You fit the lock, you hold the keys']]],
  ['About', 6, 'depots, redelivered with the same lift', [['pageHas', 'about', 'We run depots in four cities'], ['pageHas', 'about', 'redelivered with the same hydraulic lift']]],
  ['About', 7, 'Facility -> Depot', [['gone', 'our facilities'], ['gone', 'monitored facility']]],
  ['About', 8, '"the maths speaks for itself"', [['has', 'maths speaks for itself']]],
  ['About', 9, 'driver calls half an hour before', [['has', 'Our driver calls about half an hour']]],
  ['About', 10, '"Is my stuff protected?"', [['has', 'Is my stuff protected'], ['gone', 'Is my stuff insured'], ['has', 'Contents protection is arranged']]],

  ['Contact', 5, 'opening hours on the page itself', [['bodyHas', 'contact', '8:00am'], ['bodyHas', 'contact', '7:30am']]],
  ['Contact', 6, '"next business day"', [['pageHas', 'contact', 'the team will come back to you during the next business day']]],
  ['Contact', 7, '"Talk to our team"', [['gone', 'Talk to the depot']]],

  ['Storage hub', 5, 'Price Match Guarantee line', [['has', 'covered by the same Price Match Guarantee']]],

  ['Storage at your place', 5, 'pricing toggle', [['min', 'g-price-tabs', 100]]],
  ['Storage at your place', 6, 'waist height removed', [['gone', 'waist height']]],

  ['Store with us', 5, 'pricing toggle', [['min', 'g-price-tabs', 100]]],
  ['Store with us', 7, 'EARL, contents never tilted', [['has', 'with EARL, so the contents are never tilted']]],

  ['Business storage', 5, '"Call our team"', [['gone', 'call the depot']]],
  ['Renovation storage', 5, '"lowered flat onto your property using EARL"', [['has', 'Lowered flat onto your property using EARL']]],

  ['Container sizes', 5, 'measured externally / door either end', [['has', 'The door can be placed at either end']]],
  ['Container sizes', 6, 'every measurement internal', [['has', 'Every measurement here is internal']]],
  ['Container sizes', 7, 'Placement, EARL, team', [['pageHas', 'container-sizes', 'Placement'], ['has', 'lowered straight down with EARL'], ['has', 'our team will confirm before the truck']]],
  ['Container sizes', 8, 'waist height gone', [['gone', 'waist height']]],

  ['Moving hub', 5, '"Three options we offer"', [['has', 'Three options we offer']]],
  ['Interstate moves', 5, '"EARL earns his keep"', [['has', 'EARL earns his keep'], ['gone', 'earns his keep earns its keep']]],

  ['Regional moves', 5, 'hero line replaced', [['gone', 'Outside the four depot radii we quote every job individually']]],
  ['Regional moves', 6, 'no "anywhere in Australia"', [['gone', 'anywhere in Australia'], ['gone', 'Anywhere in Australia']]],
  ['Regional moves', 7, 'overpromising trimmed', [['gone', 'we still go'], ['gone', 'Western Australia'], ['gone', 'Northern Territory']]],

  ['Locations hub', 5, 'regional language fixed', [['gone', 'Outside the radius, we still go']]],

  ['Facilities', 5, 'Sunshine Coast added', [['page', 'self-storage/sunshine-coast']]],
  ['Facilities', 7, '"Four Depots In Four States"', [['min', 'Four Depots In Four States', 100]]],

  ['Regional Australia', 5, 'page removed', [['noPage', 'locations/regional-australia']]],

  ['Adelaide', 5, 'five Adelaide suburb pages', [
    ['page', 'self-storage/victor-harbor'], ['page', 'self-storage/murray-bridge'],
    ['page', 'self-storage/barossa'], ['page', 'self-storage/gawler'],
    ['page', 'self-storage/adelaide-hills']]],
];

const OPEN = [
  ['Pricing / Storage pages', 'Across Town rates', 'the sheet lists them as "X. Y. Z." — no figures given'],
  ['Facilities', 'Row 6: "top 50 storage centres in each location"', 'not enough detail to build the right thing'],
  ['Regional moves', 'Row 8: "Remove these 5 sections"', 'the screenshot brackets three; which five?'],
  ['Home', 'Row 12 (second half)', 'the three testimonials still have no recorded source'],
  ['How it works', 'Row 10', 'a compliment about the scroll animation, no action needed'],
];

let pass = 0, fail = 0;
const failures = [];
for (const [tab, row, what, checks] of ITEMS) {
  const bad = [];
  for (const c of checks) {
    const [kind, a, b] = c;
    let ok = true;
    if (kind === 'has') ok = count(a) > 0;
    else if (kind === 'gone') ok = count(a) === 0;
    else if (kind === 'min') ok = count(a) >= b;
    else if (kind === 'page') ok = exists(a);
    else if (kind === 'noPage') ok = !exists(a);
    else if (kind === 'pageHas') ok = on(a, b);
    else if (kind === 'bodyHas') ok = inBody(a, b);
    if (!ok) bad.push(`${kind} ${JSON.stringify(a).slice(0, 46)}${b !== undefined && kind !== 'pageHas' && kind !== 'bodyHas' ? ' x' + b : ''}`);
  }
  if (bad.length) { fail++; failures.push([tab, row, what, bad]); }
  else pass++;
}

console.log(`${pass} of ${pass + fail} verified rows pass\n`);
if (failures.length) {
  console.log('NOT APPLIED / REGRESSED:');
  for (const [tab, row, what, bad] of failures) {
    console.log(`  ${tab} row ${row}: ${what}`);
    bad.forEach((b) => console.log(`      failed: ${b}`));
  }
  console.log('');
}
console.log('OPEN — needs information, not work:');
OPEN.forEach(([t, w, why]) => console.log(`  ${t} — ${w}\n      ${why}`));
