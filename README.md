# Portabox — website rebuild

A static rebuild of [portabox.au](https://portabox.au), generated from a small Node script.
22 pages, one visual system, no runtime framework. Intended to be ported to WordPress —
see [WORDPRESS.md](WORDPRESS.md).

## Run it

```bash
node build/build.js                       # writes site/
npx http-server site -p 8899 -c-1         # then open http://127.0.0.1:8899/
```

Serve `site/` as the web root, not the repo root — links and asset paths are
root-relative, the same as on Vercel, so a repo-root server gives an unstyled
page and a quote flow that 404s. A server is needed rather than opening the
files directly for the same reason.

## How the build works

Everything in `site/` is generated. Edit the sources, not the output.

```
build/content.js        the data: services, locations, sizes, FAQs, contact details
build/build.js          the generator — page entries + the shared section builders
build/variant-g.js.txt  the homepage block (nav, hero, scroll journey, footer)
build/giga-*.js.txt     source fragments spliced into build.js
tools/add-variant-g.py  splices the homepage block into build.js
site/                   the generated site — safe to delete and rebuild
```

`build.js` holds a list of page entries. Each one names a file and an array of
section builders (`hero`, `split`, `cards`, `steps`, `pricing`, `faq`, …). Those
builders emit the markup, so a page entry is mostly content, not HTML.

Two things about the order of that file are load-bearing and easy to trip over:

- The section builders run **while the page list is being built**, which is before
  the homepage block's `const` helpers exist. That is why they keep their own copies
  of the button and label helpers instead of calling into the homepage ones.
- `tools/add-variant-g.py` replaces everything between the homepage marker and the
  emit section. Anything defined in that range is lost on the next splice, so
  shared helpers live above it.

### Section backgrounds

Sections pick their own band colour, so two neighbours can land on the same one and
the seam between them disappears. `alternate()` in `build.js` walks the sections of
each page and shifts any band that repeats the one before it. The trust strip and
the footer are both the darkest navy, so they bracket the run: a page cannot open or
close on that colour. The scroll journey is exempt — its styling is keyed to the
cyan band.

### The instant quote

The quote itself is **not on this site**. It is the client's own React app,
deployed separately from
[portabox-instant-quote](https://github.com/manuelbiocva/portabox-instant-quote)
to <https://portabox-instant-quote.vercel.app/>.

What this site owns is the hand-off, and it has three parts:

- **Every CTA** comes from `CONTACT.quote` in `build/content.js`. One constant,
  127 links across 22 pages — change it there and the whole site follows.
- **The postcode boxes** carry what the visitor typed, as
  `?postcode=3000`. The destination rides on the form as `data-quote` rather
  than living in `giga.js`, so a WordPress port changes content, not script.
  The app reads that parameter and opens with step 1 already answered.
- **`/get-a-quote/` redirects.** The URL is in the scope of work's sitemap and
  is linked from outside, so it stays. `vercel.json` does it as a redirect in
  production; the build also writes a small meta-refresh shell at that path as
  the fallback for any host that does not read `vercel.json` — a WordPress
  install, or the local static server. The shell is `noindex` and its canonical
  points at the app.

That chain spans two repositories, so it can break from a change at either end
and still look fine from here. `tools/g-quote-handoff.cjs` drives it against
the live app and fails if the postcode stops arriving.

The site used to serve its own five-step flow at `/get-a-quote/`, built from
the same pricing engine. It is no longer emitted, but `build/quoteflow.js` and
its CSS and JS are still in the tree — if the external app is ever dropped,
restoring the page entry brings it back. `tools/extract-quote-data.cjs` still
lifts the rates out of the app's TypeScript, which is what keeps the two sets
of numbers from drifting.

### The SEO build

`Portabox-SEO-Build-Sheet.xlsx` is the client’s plan: 126 items in ten
batches, keyed to Search Console data from **auspods.com.au**, the site this
one replaces. `tools/read-xlsx.cjs` reads it without a dependency.

Batches 1 and 2 are built, plus Brisbane as the page template to sign off:

- **The region hubs moved** from `/locations/<city>/` to
  `/self-storage/<city>/`, and four new ones were added — Gold Coast,
  Central Coast, Newcastle, Wollongong. The old URLs 301 from `vercel.json`.
  Those redirects carry the Search Console history the whole plan exists to
  rescue, so they matter more than the new URLs do.
- **`robots.txt`, `sitemap.xml` and JSON-LD** are generated from the pages
  actually emitted, so they cannot drift. The sheet’s note was "Zero
  structured data exists on the site today".
- **Internal linking** is the thing the brief keeps returning to. Each hub
  lists every suburb beneath it and links to the other seven regions.

Two rules the data follows:

- **Suburbs that have no page yet are listed as plain text, not links.** The
  `built` flag in `REGIONS` turns each one into a link when its page lands,
  so the linking grows with the build and no hub points at a 404.
- **Nothing goes into the schema that is not already on the page.** No
  `aggregateRating`, no review count, no founding date — none have been
  supplied, and inventing them in markup is worse than inventing them in
  copy, because Google penalises it.

Still to come, and why:

| Batch | Blocked on |
| --- | --- |
| 3–5, the 43 suburb pages | Depot distance, drive time, delivery lead time, whether the council wants a kerbside permit, and the nearby-suburb list. The sheet says a page cannot publish with those blank, and four suburb names exist in more than one state. |
| 6–9, format, route, box and comparison pages | Nothing — they wait on sign-off of the Brisbane template. |
| 10, the 28 consolidation items | A merge-or-rebuild decision per page. |

The four Google Business Profile items are the client’s team, not this repo.


## The design

One system across every page: square corners, hairline rules, and the brand palette
of navy `#0E385D`, cyan `#1EC4F4` and yellow `#FED200` in Montserrat. `DESIGN.md`
has the reasoning; `site/assets/css/giga.css` is the whole of it.

Two details worth knowing before editing the CSS:

- **Reveal animations own `transform`.** Elements carrying `.g-rise` have their
  `transition` set by `.g-rise.in`, which is a shorthand and replaces the whole
  transition list. Card hovers therefore lift with the independent `translate`
  property and restate their transition at a higher specificity.
- **Nothing faded on cyan.** Navy text at 80% opacity measures 3.97:1 on the cyan
  band, below AA. On cyan, text is full navy — de-emphasis uses weight instead.
- **A hairline is not a control edge.** `--g-rule` is decoration and measures
  1.38:1 on white. The border of an input, select or choice box is held to 3:1
  by WCAG 1.4.11, which is a different rule from text contrast — the whole site
  passed AA while every field was outlined in that hairline. Controls use
  `--g-ctrl` instead; `tools/g-control-contrast.cjs` measures it.

## Verification

Scripts in `tools/` measure rather than eyeball. With the server running:

```bash
node tools/verify-site.cjs          # links, overflow, HTTP status, JS errors
node tools/g-contrast-all.cjs       # WCAG AA across every page
node tools/g-control-contrast.cjs    # WCAG 1.4.11: control borders, a separate rule
node tools/g-phero-audit.cjs        # hero text sampled against the actual photos
node tools/g-mega-contrast.cjs      # the nav mega panels
node tools/g-journey.cjs index      # scrubs the scroll animation beat by beat
node tools/g-pages-states.cjs       # mobile, reduced motion, JS-off FAQ
node tools/g-quote-handoff.cjs      # CTAs, the redirect, the postcode hand-off
node tools/g-responsive.cjs         # overflow, tap targets and text size,
                                    # 360 / 390 / 414 / 768 / 820 / 1024 / 1180
```

## Deployment

Vercel serves `site/` as the web root (`outputDirectory`), which is why links and
asset paths are root-relative. `node build/build.js` runs on every deploy, so the
live site always reflects the sources. The generator needs no packages, so the
install step is a no-op.

`vercel.json` cannot carry comments, so the caching reasoning lives here:

- **`/assets/img` and `/assets/video`** are `immutable` for a year. Those files
  keep their names deliberately; replace one by changing its filename.
- **`/assets/css` and `/assets/js` must NOT be `immutable`.** They keep their
  filenames across deploys, so a browser would hold a stale copy for as long as
  the header says and never revalidate. This actually happened: a fixed redirect
  kept 404ing for anyone who had already loaded the old script. The build appends
  a content hash (`giga.js?v=2aba84ae`) so a new build produces a new URL, which
  also bypasses caches already holding the old copy.

Run `node tools/check-vercel.cjs` before pushing config changes. An invalid key
fails the *deploy*, not the build, so it is only visible in the dashboard — a
stray `"comment"` in a header rule cost one failed deploy.

## Not wired up yet

The forms validate in the browser but have nowhere to post. They say so on submit
rather than pretending a message was sent. Before launch, point these at a real
handler or a WordPress form plugin:

- the enquiry form on `/contact/`

The postcode boxes are wired: they hand off to the quote app. The quote's own
last step is the app's problem, not this site's — and it has one. Leads there
go to `localStorage` and no further, and the admin portal that edits the rates
has no login. Both are flagged in that repository's README.

## Content that must not be invented

`PRODUCT.md` records what the client has actually published. Years trading, delivery
totals, review counts, star ratings, named business customers, press coverage and
certifications have **not** been supplied and do not appear anywhere on the site.
The testimonials are real, from the live site. Photography is the client's own.

Full pre-launch checklist at the end of `WORDPRESS.md`.
