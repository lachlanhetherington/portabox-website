const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8899';
const { pageUrls } = require('./pages.cjs');
const files = pageUrls();   // served URL paths, nested per the scope's sitemap

/* Braces, before the browser gets involved.
   Deleting CSS rules by filtering lines is how a stylesheet ends up with a
   rule's opening line gone and its declarations orphaned into whatever came
   before. The page still loads, nothing errors, and a hero field quietly
   turns white. The browser cannot report that; counting braces can. */
function cssBalance() {
  const css = fs.readFileSync(path.join('site', 'assets', 'css', 'giga.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0, stray = 0;
  for (const ch of css) {
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth < 0) { stray++; depth = 0; } }
  }
  return { stray, open: depth };
}

/* The quote app's address lives in build/content.js, but vercel.json cannot
   read it — Vercel parses that file before any build runs, so the redirect
   destination has to be a literal. Two copies of one address drift silently:
   the CTAs would point at the new deployment while /get-a-quote/ still sent
   people to the old one. Nothing in a page render would show it. */
function quoteAppAgrees() {
  const want = require('../build/content.js').CONTACT.quoteApp;
  const red = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).redirects
    .filter((r) => /^\/get-a-quote\/?$/.test(r.source));
  if (!red.length) return ['vercel.json has no /get-a-quote redirect'];
  return red
    .filter((r) => r.destination.replace(/\/+$/, '') !== want.replace(/\/+$/, ''))
    .map((r) => `vercel.json sends ${r.source} to ${r.destination}, but the CTAs point at ${want}`);
}

(async () => {
  const braces = cssBalance();
  const quoteDrift = quoteAppAgrees();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1440,height:1000} });
  const bad404 = new Set(), errs = [];
  p.on('response', r => { if (r.status() >= 400) bad404.add(r.status()+' '+r.url().replace(BASE,'')); });
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });

  let overflow = [], brokenLinks = new Set(), missingImg = [];
  for (const f of files) {
    await p.goto(BASE+f, { waitUntil:'networkidle' });
    await p.waitForTimeout(700);

    /* /get-a-quote/ redirects to the quote app, which is a separate
       deployment with its own tests. Checking that the redirect fires is this
       file's job; auditing what it lands on is not. */
    if (!p.url().startsWith(BASE)) {
      console.log('  redirect ok       :', f, '->', p.url());
      continue;
    }

    /* loading="lazy" means an image below the fold has deliberately not been
       fetched yet, so checking straight after load reports half the page as
       missing. Walk the page down first and give the fetches a moment. */
    const pageH = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < pageH; y += 600) {
      await p.evaluate((v) => window.scrollTo(0, v), y);
      await p.waitForTimeout(120);
    }
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(600);

    const r = await p.evaluate(() => {
      const ov = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      /* An image in a collapsed menu has no box and will not have loaded.
         That is correct, not a fault, so only laid-out images count. */
      const imgs = [...document.querySelectorAll('img')]
        .filter(i => i.getBoundingClientRect().width > 0)
        .filter(i => !i.complete || i.naturalWidth === 0)
        .map(i => i.getAttribute('src'));
      const links = [...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))
        .filter(h=>h && !/^(https?:|tel:|mailto:|sms:|#)/.test(h));
      return { ov, imgs, links:[...new Set(links)] };
    });
    if (r.ov > 0) overflow.push(f+':'+r.ov);
    r.imgs.forEach(i=>missingImg.push(f+' -> '+i));
    r.links.forEach(l => { if (!fs.existsSync(path.join('site', l.split('#')[0]))) brokenLinks.add(l+'  (from '+f+')'); });
  }

  // mobile sweep on 3 representative pages
  const m = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  let movf = [];
  for (const f of ['/','/storage/self-storage/','/locations/melbourne/']) {
    await m.goto(BASE+f, { waitUntil:'networkidle' }); await m.waitForTimeout(600);
    const ov = await m.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    if (ov>0) movf.push(f+':'+ov);
  }

  // Links built in JavaScript never appear in markup, so the link crawl cannot
  // see them. After the move to nested routes, any flat .html literal in the
  // runtime script is a stale path.
  const jsStale = (fs.readFileSync('site/assets/js/giga.js', 'utf8').match(/"[a-z0-9-]+\.html"/g) || []);
  console.log('pages checked      :', files.length);
  console.log('css braces         :', braces.stray || braces.open
    ? `UNBALANCED — ${braces.stray} stray close(s), ${braces.open} left open`
    : 'balanced');
  console.log('stale paths in js  :', jsStale.length ? [...new Set(jsStale)].join(', ') : 'none');
  console.log('quote app address  :', quoteDrift.length ? quoteDrift.join('\n                     ') : 'vercel.json agrees with the CTAs');
  console.log('desktop overflow   :', overflow.length?overflow.join(', '):'none');
  console.log('mobile overflow    :', movf.length?movf.join(', '):'none');
  console.log('broken local links :', brokenLinks.size?[...brokenLinks].join('\n                     '):'none');
  console.log('images not loaded  :', missingImg.length?missingImg.slice(0,8).join('\n                     '):'none');
  console.log('http >=400         :', bad404.size?[...bad404].slice(0,8).join(', '):'none');
  console.log('js errors          :', errs.length?[...new Set(errs)].slice(0,5).join(' | '):'none');
  await b.close();
})();
