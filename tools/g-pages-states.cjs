const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const { pageUrls, BASE } = require('./pages.cjs');
  const pages = pageUrls();
  const b = await chromium.launch();
  // mobile: overflow + nav
  let bad = 0;
  for (const f of pages) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(BASE + f, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(300);
    /* A redirect shell carries no chrome on purpose — no nav, so no burger.
       Checking it for one reports a deliberate choice as a defect. */
    if (!p.url().startsWith(BASE)) { await p.close(); continue; }
    const r = await p.evaluate(() => ({
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      burger: !!document.querySelector('.g-burger'),
      faq: document.querySelectorAll('details.g-faq-i').length,
    }));
    if (r.over > 0 || !r.burger) { console.log('MOBILE ISSUE', f, JSON.stringify(r)); bad++; }
    await p.close();
  }
  console.log(bad ? bad + ' mobile issues' : 'mobile: all ' + pages.length + ' pages clean, burger present');

  // FAQ works with JS disabled (details/summary)
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p2 = await ctx.newPage();
  await p2.goto('http://127.0.0.1:8899/how-it-works/', { waitUntil: 'domcontentloaded' });
  const faq = await p2.evaluate(() => {
    const d = document.querySelectorAll('details.g-faq-i');
    return { n: d.length, firstOpen: d[0] ? d[0].open : null, answerVisible: d[0] ? d[0].querySelector('.g-faq-a').getBoundingClientRect().height > 10 : null };
  });
  console.log('FAQ with JS off:', JSON.stringify(faq));
  await ctx.close();

  // reduced motion
  const rc = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p3 = await rc.newPage();
  const errs = []; p3.on('pageerror', e => errs.push(e.message));
  await p3.goto('http://127.0.0.1:8899/storage/', { waitUntil: 'networkidle' });
  await p3.waitForTimeout(500);
  const rm = await p3.evaluate(() => ({
    risenVisible: [...document.querySelectorAll('.g-rise')].every(e => getComputedStyle(e).opacity === '1'),
  }));
  console.log('reduced motion:', JSON.stringify(rm), '| errors:', errs.length ? errs : 'none');
  await rc.close();
  await b.close();
})();
