/* =================================================================
   Portabox static site generator.
   Node >= 16.  Run:  node build/build.js
   Emits flat .html files into site/ so the port into a WordPress
   theme stays a copy-and-split job rather than a rewrite.
   ================================================================= */

const fs = require("fs");
const path = require("path");
const C = require("./content");

const OUT = path.join(__dirname, "..", "site");

/* Asset URLs carry a hash of their contents. A stable filename plus a long
   cache header means a browser keeps the old file for as long as the header
   says and, with `immutable`, will not even revalidate — which is how a fixed
   redirect carried on 404ing for people who had already loaded the old
   script. A content hash changes the URL, so a new build is always fetched
   and any already-cached copy is bypassed. */
const crypto = require("crypto");
const asset = (rel) => {
  let v = "dev";
  try {
    v = crypto.createHash("sha1").update(fs.readFileSync(path.join(OUT, rel))).digest("hex").slice(0, 8);
  } catch (e) { /* asset missing at build time; ship the bare path */ }
  return "/" + rel + "?v=" + v;
};
const IMG = "/assets/img/";

/* A page's href and the file it is written to both come from ROUTES, so they
   can never drift apart. `/storage/self-storage/` is written to
   storage/self-storage/index.html and served at the path the scope specifies. */
const url = (k) => C.ROUTES[String(k).replace(/\.html$/, "")] || "/" + String(k).replace(/\.html$/, "") + "/";
const outFile = (k) => {
  const u = url(k);
  return u === "/" ? "index.html" : u.slice(1) + "index.html";
};

/* ---------- Icons: one stroke weight, drawn, never emoji ---------- */
const S = (d, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${extra || ""}${d}</svg>`;

const ICON = {
  lift:  S(`<path d="M3 19h18"/><rect x="6" y="7" width="12" height="8" rx="1"/><path d="M8 19v-4M16 19v-4M12 3v3"/>`),
  cube:  S(`<path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z"/><path d="M3.5 7 12 11.3 20.5 7M12 11.3v9.9"/>`),
  key:   S(`<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3.5M15.5 12v2.5"/>`),
  wall:  S(`<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 15h18"/>`),
  house: S(`<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>`),
  globe: S(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>`),
  check: S(`<path d="m4.5 12.5 5 5 10-11"/>`),
  arrow: S(`<path d="M4 12h15M13 6l6 6-6 6"/>`),
  phone: S(`<path d="M5 3.5h3.5l2 5-2.5 1.5a12 12 0 0 0 6 6L15.5 14l5 2V19.5a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 6.7 2 2 0 0 1 5 3.5z"/>`),
  clock: S(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>`),
  shield:S(`<path d="M12 3 5 6v5.5c0 4.3 3 8.2 7 9.5 4-1.3 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>`),
  truck: S(`<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5H18l3.5 3v3h-8"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>`),
  pin:   S(`<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>`),
  star:  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z"/></svg>`,
};

/* ---------- Chrome ---------- */

/* A standalone page owns its whole document: its own stylesheet, body class
   and script, and none of the shared nav or footer. */
function standaloneHead(p) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta name="theme-color" content="#0E385D">
<link rel="canonical" href="https://portabox.au${p.path}">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_AU">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset("assets/css/" + p.css)}">
</head>
<body class="${p.bodyClass}">
<a class="g-skip" href="#main">Skip to content</a>`;
}



function head(p) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta name="theme-color" content="#0E385D">
<link rel="canonical" href="https://portabox.au/${p.file === "index.html" ? "" : p.file}">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_AU">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/portabox.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function nav(active) {
  const PROMO = {
    [url("storage-services")]: { img: "yard-stacked.jpg", t: "Not sure which one?",
      b: "All four storage options side by side, with what each one suits." },
    [url("moving-services")]: { img: "sizes-three.jpg", t: "Moving soon?",
      b: "Local, interstate or regional — see how a container move runs." },
    [url("locations")]: { img: "step-move.jpg", t: "Check your postcode",
      b: "Four depots, 150–200 km each, plus regional runs beyond that." },
  };

  const groups = C.NAV.map((g) => {
    const links = g.items
      .map((i) => `<a class="mega-link" href="${url(i.slug)}">
                <b>${i.title}</b>
                <span>${i.blurb || i.intro || ""}</span>
                <em>${ICON.arrow}</em>
              </a>`)
      .join("\n              ");
    const p = PROMO[g.href];
    const cur = active === g.href ? ' aria-current="page"' : "";
    return `<li class="nav-item">
            <a class="nav-link" href="${g.href}"${cur} aria-expanded="false">${g.short || g.title}<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg></a>
            <div class="dropdown mega">
              <div class="mega-in">
                <div class="mega-col">
                  <p class="mega-head">${g.title}</p>
                  <div class="mega-links">
              ${links}
                  </div>
                </div>
                <a class="mega-promo" href="${g.href}">
                  <span class="mega-promo-img"><img src="${IMG}${p.img}" alt="" loading="lazy"></span>
                  <span class="mega-promo-body">
                    <b>${p.t}</b>
                    <span>${p.b}</span>
                    <em>See all ${g.title.toLowerCase()} ${ICON.arrow}</em>
                  </span>
                </a>
              </div>
            </div>
          </li>`;
  }).join("\n          ");

  const drawerGroups = C.NAV.map(
    (g) => `<div class="grp"><p>${g.title}</p>
        <a href="${g.href}">All ${g.title.toLowerCase()}</a>
        ${g.items.map((i) => `<a href="${url(i.slug)}">${i.title}</a>`).join("\n        ")}
      </div>`
  ).join("\n      ");

  return `
<header class="nav">
  <div class="nav-in">
    <a class="brand" href="${url("index")}" aria-label="Portabox home">
      <img class="brand-light" src="${IMG}logo-white.png" alt="Portabox — moving and storage containers" width="132" height="38">
      <img class="brand-solid" src="${IMG}logo.png" alt="" aria-hidden="true" width="132" height="38">
    </a>
    <nav class="nav-menu" aria-label="Primary">
      <ul style="display:flex;align-items:center;gap:.25rem">
          ${groups}
        <li><a class="nav-link" href="${url("pricing")}"${active === "pricing.html" ? ' aria-current="page"' : ""}>Pricing</a></li>
        <li><a class="nav-link" href="${url("how-it-works")}"${active === "how-it-works.html" ? ' aria-current="page"' : ""}>How it works</a></li>
        <li><a class="nav-link" href="${url("about-us")}"${active === "about-us.html" ? ' aria-current="page"' : ""}>About us</a></li>
        <li><a class="nav-link" href="${url("contact-us")}"${active === "contact-us.html" ? ' aria-current="page"' : ""}>Contact us</a></li>
      </ul>
    </nav>
    <div class="nav-cta">
      ${traceBtn(C.CONTACT.tel, C.CONTACT.phone, "Talk to a depot", "navsec", "btn-trace--sm")}
      ${traceBtn(C.CONTACT.quote, "Instant Quote", "No email needed", "primary", "btn-trace--sm")}
    </div>
    <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu"><span></span></button>
  </div>
</header>

<div class="drawer" id="drawer">
  <div class="wrap" style="padding-inline:0">
      ${drawerGroups}
    <div class="grp"><a href="${url("pricing")}">Pricing</a><a href="${url("how-it-works")}">How it works</a><a href="${url("about-us")}">About us</a><a href="${url("contact-us")}">Contact us</a></div>
    <div class="cta-row">
      ${traceBtn(C.CONTACT.quote, "Instant Quote", "No email needed", "primary", "btn-trace--full")}
      ${traceBtn(C.CONTACT.tel, "Call our team", C.CONTACT.phone, "dark", "btn-trace--full")}
    </div>
  </div>
</div>

<main id="main">`;
}

function footer() {
  const col = (t, links) =>
    `<div><h3>${t}</h3><ul>${links.map(([a, b]) => `<li><a href="${b}">${a}</a></li>`).join("")}</ul></div>`;
  return `</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="foot-brand"><img src="${IMG}logo.png" alt="Portabox" width="155" height="45"></div>
        <p style="margin-top:1.1rem;max-width:36ch;font-size:.9375rem;color:rgba(255,255,255,.72)">
          Portable storage and moving containers, delivered level to your door across
          Brisbane, Sydney, Melbourne, Adelaide and regional Australia.
        </p>
        <div class="btn-row" style="margin-top:1.5rem">
          ${traceBtn(C.CONTACT.quote, "Instant Quote", "No email needed", "primary", "btn-trace--sm")}
        </div>
      </div>
      ${col("Storage", C.STORAGE_SERVICES.map((s) => [s.title, url(s.slug)]))}
      ${col("Moving", C.MOVING_SERVICES.map((s) => [s.title, url(s.slug)]))}
      ${col("Locations", C.LOCATIONS.map((s) => [s.title, url(s.slug)]))}
    </div>
    <div class="foot-grid" style="margin-top:2.5rem;grid-template-columns:1fr">
      <div style="display:flex;flex-wrap:wrap;gap:.75rem 2rem">
        <a href="${C.CONTACT.tel}" style="font-weight:700;color:#fff">${C.CONTACT.phone}</a>
        <a href="${C.CONTACT.mailto}">${C.CONTACT.email}</a>
        ${C.CONTACT.social.map(([n, h]) => `<a href="${h}" rel="noopener">${n}</a>`).join("")}
      </div>
    </div>
    <div class="foot-legal">
      <p>&copy; <span class="yr">2026</span> portabox.au</p>
      <p style="display:flex;gap:1.25rem;flex-wrap:wrap">
        <a href="https://portabox.au/terms-and-conditions/">Terms &amp; Conditions</a>
        <a href="https://portabox.au/website-disclaimer/">Disclaimer</a>
        <a href="https://portabox.au/privacy-policy/">Privacy Policy</a>
      </p>
    </div>
  </div>
</footer>
<script src="assets/js/site.js"></script>
</body>
</html>`;
}

/* ---------- Section builders ----------
   Every page now uses the homepage's visual system, so these emit giga markup.
   The function names and option shapes are unchanged from the previous
   (portabox.css) implementations, which is why no page entry needed editing.

   These run while PAGES is being built — before the giga block's `const`
   helpers (gBtn, gLabel, gIntro) are initialised — so this region keeps its
   own copies instead of calling into them. */

const BANDS = { light: "white", grey: "stone", tint: "mist", cream: "mist", dark: "navy", deep: "deep", cyan: "cyan" };
const bandOf = (b) => BANDS[b] || "white";

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
const HANDSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.6 3.5h3.1l1.6 4-2.1 1.3a11.4 11.4 0 0 0 5.9 5.9l1.3-2.1 4 1.6v3.1a1.9 1.9 0 0 1-2.1 1.9A16.4 16.4 0 0 1 3.7 5.6a1.9 1.9 0 0 1 1.9-2.1z"/></svg>`;

/* Old variant names map onto the giga button kinds. */
const KIND = { primary: "yellow", outline: "line", dark: "solid", light: "line", ghost: "ghost", navsec: "ghost", oncyan: "solid" };

function traceBtn(href, title, text, variant) {
  const tel = String(href).startsWith("tel:");
  return `<a class="g-btn g-btn--${KIND[variant] || "line"}${tel ? " g-btn--tel" : ""}" href="${href}"><span>${title}</span><i>${tel ? HANDSET : ARROW}</i></a>`;
}

function traceSubmit(title, text, done, variant) {
  return `<button class="g-btn g-btn--${KIND[variant] || "yellow"}" type="submit"><span>${title}</span><i>${ARROW}</i></button>`;
}

const gl = (t) => `<p class="g-label">${t}</p>`;

const gintro = (chip, h, sub, btns) => `
    <div class="g-intro">
      <div class="g-rise">${chip ? gl(chip) : ""}<h2 class="g-h2">${h}</h2></div>
      <div class="g-rise" style="--d:110ms">
        ${sub ? `<p class="g-body">${sub}</p>` : ""}
        ${btns ? `<div class="g-btns" style="margin-top:1.75rem">${btns}</div>` : ""}
      </div>
    </div>`;

/* The multi-step instant quote. Its own module so the giga splice
   (tools/add-variant-g.py) cannot take it with the rest of the region. */
const quoteFlow = require("./quoteflow")({ bandOf, gintro, C, url, ARROW });
const QUOTE_SUBURBS = require("./quoteflow").suburbsScript();


/* No id/label pair: a page can carry two of these and duplicate ids are invalid.
   giga.js binds every .quote-form. */
/* The destination rides on the form rather than living in the script, so the
   quote app's URL stays a content value in one place and a WordPress port does
   not have to patch giga.js to change it. */
/* The label is variable because the same box answers a different question in
   different places — "get my instant quote" in a hero, "check my postcode"
   under "do we service your suburb?". Same form, same destination. */
const quoteForm = (label) => `
      <form class="g-form quote-form" data-quote="${C.CONTACT.quote}" novalidate>
        <input type="text" inputmode="numeric" maxlength="4" placeholder="Your postcode" aria-label="Delivery postcode">
        ${traceSubmit(label || "Get my instant quote", "", "", "primary")}
      </form>`;

/* Contact form. Fields mirror the enquiry form on portabox.au/contact/.
   It validates in the browser but has nowhere to post yet — see contactForm()
   in giga.js and the note in WORDPRESS.md for wiring it to a real endpoint. */
function contactForm(o) {
  o = o || {};
  const field = (id, label, input, half) =>
    `<p class="g-field${half ? " g-field--half" : ""}"><label for="${id}">${label}</label>${input}</p>`;

  const TOPICS = ["General enquiry", "Quote request", "Invoice enquiry",
                  "Customer service enquiry", "Price match"];

  return `
<section class="g-band g-band--${bandOf(o.band || "grey")}" id="contact-form">
  <div class="g-wrap">
    ${gintro("Send us a message", o.h || "Tell us what you need",
      o.sub || "Fill this in and the depot that covers your postcode will come back to you. Prefer to talk? Call 1800 467 637.")}
    <form class="g-cform g-rise" novalidate>
      <div class="g-cform-grid">
        ${field("cf-first", "First name", `<input id="cf-first" name="first" type="text" autocomplete="given-name" required>`, true)}
        ${field("cf-last", "Last name", `<input id="cf-last" name="last" type="text" autocomplete="family-name" required>`, true)}
        ${field("cf-email", "Email", `<input id="cf-email" name="email" type="email" autocomplete="email" required>`, true)}
        ${field("cf-phone", "Phone", `<input id="cf-phone" name="phone" type="tel" autocomplete="tel" required>`, true)}
        ${field("cf-postcode", "Postcode", `<input id="cf-postcode" name="postcode" type="text" inputmode="numeric" maxlength="4" autocomplete="postal-code">`, true)}
        ${field("cf-account", "Account number <span>optional</span>", `<input id="cf-account" name="account" type="text">`, true)}
        ${field("cf-topic", "What do you need help with?",
          `<select id="cf-topic" name="topic" required>${TOPICS.map((t) => `<option>${t}</option>`).join("")}</select>`)}
        ${field("cf-msg", "How can we help?",
          `<textarea id="cf-msg" name="message" rows="5" required></textarea>`)}
      </div>
      <div class="g-cform-foot">
        ${traceSubmit("Send message", "", "", "primary")}
        <p class="g-cform-note">We reply during business hours. Nothing here is shared outside Portabox.</p>
      </div>
      <div class="g-cform-msg" role="status" aria-live="polite"></div>
    </form>
  </div>
</section>`;
}

/* Instant quote request. Mirrors the live Gravity Form at
   portabox.au/get-a-quote/ — same questions, same options, same order.
   Validation runs in the browser; see contactForm() in giga.js. There is no
   endpoint behind it yet (the live one posts to Gravity Forms). */


function hero(o) {
  return `
<section class="g-phero${o.short ? " g-phero--short" : ""}">
  <div class="g-phero-bg" aria-hidden="true"><img src="${IMG}${o.img}" alt="" fetchpriority="high"></div>
  <div class="g-wrap g-phero-in">
    ${o.crumb ? `<nav class="g-crumb" aria-label="Breadcrumb">${o.crumb}</nav>` : ""}
    <h1 class="g-display g-rise">${o.h1}</h1>
    ${o.sub ? `<p class="g-phero-sub g-rise" style="--d:80ms">${o.sub}</p>` : ""}
    ${o.form ? `<div class="g-phero-form g-rise" style="--d:160ms">${quoteForm()}</div>` : ""}
    ${o.btns ? `<div class="g-btns g-rise" style="--d:160ms;margin-top:2rem">${o.btns}</div>` : ""}
  </div>
</section>`;
}

const trust = () => `
<section class="g-trust">
  <div class="g-wrap g-trust-in">
    ${[["lift", "Lowered level, never tipped"], ["key", "You hold the only keys"],
       ["cube", "Priced per cubic metre"], ["globe", "Four Depots In Four States"]]
      .map(([i, t]) => `<span class="g-trust-i">${ICON[i]}${t}</span>`).join("\n    ")}
  </div>
</section>`;

function statement(o) {
  return `
<section class="g-band g-band--${bandOf(o.band || "dark")}">
  <div class="g-wrap">
    <div class="g-said g-rise">
      ${o.chip ? gl(o.chip) : ""}
      <h2 class="g-h2">${o.h}</h2>
      ${o.sub ? `<p class="g-body" style="margin-top:1.25rem">${o.sub}</p>` : ""}
      ${o.btns ? `<div class="g-btns" style="margin-top:2rem">${o.btns}</div>` : ""}
    </div>
  </div>
</section>`;
}

function split(o) {
  /* `fit` is for charts and diagrams, which must not be cropped. */
  const cls = "g-split-img" + (o.tall ? " g-split-img--tall" : "") + (o.fit ? " g-split-img--fit" : "");
  const media = `<div class="g-rise"><img class="${cls}" src="${IMG}${o.img}" alt="${o.alt || ""}" loading="lazy"></div>`;
  const copy = `<div class="g-rise" style="--d:110ms">
        ${o.chip ? gl(o.chip) : ""}
        <h2 class="g-h2">${o.h}</h2>
        <div class="g-prose">${o.body}</div>
        ${o.btns ? `<div class="g-btns" style="margin-top:1.75rem">${o.btns}</div>` : ""}
      </div>`;
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}">
  <div class="g-wrap">
    <div class="g-split">
      ${o.flip ? copy + media : media + copy}
    </div>
  </div>
</section>`;
}

function cards(o) {
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}"${o.id ? ` id="${o.id}"` : ""}>
  <div class="g-wrap">
    ${gintro(o.chip, o.h, o.sub)}
    <div class="g-grid g-grid--3">
      ${o.items.map((i, n) => `<a class="g-card g-rise" style="--d:${n * 90}ms" href="${url(i.slug)}">
        <span class="g-card-img"><img src="${IMG}${i.img}" alt="" loading="lazy"></span>
        <h3 class="g-h3">${i.title}</h3>
        <p>${i.blurb || i.intro || ""}</p>
        <span class="g-link">${i.more || "Read more"}<span>${ARROW}</span></span>
      </a>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function featureGrid(o) {
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}">
  <div class="g-wrap">
    ${gintro(o.chip, o.h, o.sub)}
    <div class="g-grid g-grid--3">
      ${o.items.map((f, n) => `<div class="g-feat g-rise" style="--d:${n * 80}ms">
        <span class="g-feat-i">${ICON[f.ico] || ICON.check}</span>
        <h3 class="g-h3">${f.t}</h3>
        <p>${f.b}</p>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function steps(o) {
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}"${o.id ? ` id="${o.id}"` : ""}>
  <div class="g-wrap">
    ${gintro(o.chip, o.h, o.sub)}
    <div class="g-index g-index--steps">
      ${o.items.map((s, n) => `<div class="g-row g-rise" style="--d:${n * 70}ms">
        <span class="g-row-n">0${n + 1}</span>
        <span class="g-row-t">${s[0]}</span>
        <span class="g-row-d">${s[1]}</span>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}


/* Container specs as cards. Dimensions come from the client's own quoting
   tool, so "how big is it" can finally be answered on the page rather than
   deferred to a phone call. */
function specCards(o) {
  o = o || {};
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}" id="sizes">
  <div class="g-wrap">
    ${gintro(o.chip || "Every size", o.h || "External dimensions and what fits",
      o.sub || "Measured externally, so you can check the space on your driveway before you book. Door clearance is the opening you load through.")}
    <div class="g-grid g-grid--3">
      ${C.CONTAINER_SPECS.map((s, n) => `<div class="g-spec g-rise" style="--d:${n * 80}ms">
        <span class="g-card-img"><img src="${IMG}${s.img}" alt="" loading="lazy"></span>
        <h3 class="g-h3">${s.name}</h3>
        <dl class="g-spec-d">
          <div><dt>Length</dt><dd>${s.length}</dd></div>
          <div><dt>Width</dt><dd>${s.width}</dd></div>
          <div><dt>Height</dt><dd>${s.height}</dd></div>
          <div><dt>Floor area</dt><dd>${s.floor}</dd></div>
          <div><dt>Door opening</dt><dd>${s.door}</dd></div>
        </dl>
        <p class="g-spec-fit">${s.fits}</p>
      </div>`).join("\n      ")}
    </div>
    <p class="g-body g-rise" style="margin-top:2rem;max-width:none">
      Not sure which one? <a class="g-link" href="${url("pricing")}">Compare the cost per cubic metre<span>${ARROW}</span></a>
    </p>
  </div>
</section>`;
}

function pricing(o) {
  return `
<section class="g-band g-band--${bandOf((o && o.band) || "mist")}" id="pricing">
  <div class="g-wrap">
    ${gintro("Sizes &amp; pricing", "The number nobody else prints",
      "Every storage company quotes a monthly rate. Divide it by the cubic metres you actually get and the comparison stops being a matter of opinion. Here is ours, done in the open.")}
    <div class="g-price">
      ${C.SIZES.map((s, n) => `<div class="g-price-row g-rise${s.best ? " is-best" : ""}" style="--d:${n * 80}ms">
        <div>
          <div class="g-price-name"><b>${s.name}</b>${s.flag ? `<span class="g-badge">${s.flag}</span>` : ""}</div>
          <p class="g-price-feats">${s.holds}</p>
        </div>
        <div class="g-price-figs">
          <span><b>$${s.rate}</b><i>per month</i></span>
          <span><b>${s.vol} m³</b><i>total capacity</i></span>
          <span><b class="big">$${s.per}</b><i>cost per m³</i></span>
        </div>
        ${traceBtn(C.CONTACT.quote, "Select " + s.name, "", s.best ? "primary" : "outline")}
      </div>`).join("\n      ")}
    </div>
    <p class="g-body g-rise" style="margin-top:1.75rem;max-width:none">
      Rates are &ldquo;from&rdquo; prices and vary with location and term. Found a cheaper written
      quote per cubic metre? <a class="g-link" href="${C.CONTACT.priceMatch}">Get a price match<span>${ARROW}</span></a>
    </p>
  </div>
</section>`;
}

function earl() {
  return `
<section class="g-band g-band--deep" id="earl">
  <div class="g-wrap">
    ${gintro("The hydraulic difference", "EARL, meet our hydraulic difference.",
      "Most containers are dragged and tilted onto a truck. Ours stay perfectly level from your driveway to the destination.")}
    <div class="g-compare">
      <figure class="g-rise">
        <span class="g-compare-img"><img src="${IMG}tilt-method.png" alt="A tilt-tray truck angling a container off its deck" loading="lazy"></span>
        <figcaption><span class="g-tagline g-tagline--bad">Traditional tilt method</span>Containers tipped and dragged, so contents move.</figcaption>
      </figure>
      <figure class="g-rise" style="--d:110ms">
        <span class="g-compare-img"><img src="${IMG}earl-hydraulic.png" alt="The EARL hydraulic system lowering a container level to the ground" loading="lazy"></span>
        <figcaption><span class="g-tagline g-tagline--good">Portabox with EARL</span>Lifted level. Nothing tilts, slides or shifts.</figcaption>
      </figure>
    </div>
  </div>
</section>`;
}

function testimonials() {
  return `
<section class="g-band g-band--stone">
  <div class="g-wrap">
    ${gintro("Customers", "What people actually say.")}
    <div class="g-quotes">
      ${C.TESTIMONIALS.map((t, n) => `<figure class="g-quote g-rise" style="--d:${n * 90}ms">
        <blockquote>&ldquo;${t.q}&rdquo;</blockquote>
        <figcaption>
          <img src="${IMG}${t.img.replace(".png", "-avatar.jpg")}" alt="" loading="lazy" width="54" height="54">
          <span class="g-who"><b>${t.n}</b><span>${t.p}</span></span>
        </figcaption>
      </figure>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function locationList(o) {
  return `
<section class="g-band g-band--${bandOf((o && o.band) || "light")}" id="regions">
  <div class="g-wrap">
    ${gintro("Coverage", "Four depots, and a long way past them",
      "Standard runs reach 150&ndash;200 km from each depot. Past that, the Regional Solution covers large parts of regional Australia.")}
    <div class="g-regions">
      ${C.LOCATIONS.map((l, n) => `<a class="g-region g-rise" style="--d:${n * 70}ms" href="${url(l.slug)}">
        <b>${l.regional ? l.title : l.hub}</b>
        <p>${l.regional ? "Quoted per job" : l.sats.join(" &middot; ")}</p>
        <span class="g-link" style="pointer-events:none">Learn more<span>${ARROW}</span></span>
      </a>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* details/summary so the accordion needs no JavaScript. */
function faq(items, title, band, intro) {
  return `
<section class="g-band g-band--${bandOf(band || "light")}">
  <div class="g-wrap">
    <div class="g-faq-split">
      <div class="g-rise">
        ${gl("Questions")}
        <h2 class="g-h2">${title || "Before you book"}</h2>
        <p class="g-body" style="margin-top:1.25rem">${intro || "Can&rsquo;t see yours? Call one of our team &mdash; someone who actually does the runs will answer."}</p>
        <div class="g-btns" style="margin-top:1.75rem">${traceBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "", "outline")}</div>
      </div>
      <div class="g-faq g-rise" style="--d:110ms">
        ${items.map((q, n) => `<details class="g-faq-i"${n === 0 ? " open" : ""}>
          <summary>${q[0]}<i aria-hidden="true"></i></summary>
          <div class="g-faq-a"><p>${q[1]}</p></div>
        </details>`).join("\n        ")}
      </div>
    </div>
  </div>
</section>`;
}

function ctaBand(o) {
  o = o || {};
  return `
<section class="g-band g-band--${o.cyan ? "cyan" : "deep"}" id="quote">
  <div class="g-wrap">
    ${gintro("Ready to get started?", o.h || "Take a quick look to see if your postcode comes up",
      o.sub || "One field, no email address. If we cover you, you will see which depot you are on in about a second.")}
    <div class="g-rise">
      ${quoteForm()}
      <div class="g-btns" style="margin-top:1.75rem">${traceBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "", "outline")}</div>
    </div>
  </div>
</section>`;
}

/* ---------- Band alternation ----------
   Sections choose their own band, so two neighbours can easily land on the
   same colour and the seam between them vanishes (testimonials into the FAQ,
   the closing CTA into the footer). This walks the emitted sections in order
   and shifts any band that repeats the one before it.

   Two fixed neighbours bracket the sequence: the trust strip under the hero
   and the footer are both --g-navy-x, i.e. a `deep` band. So the run starts
   as if `deep` came first, and cannot end on `deep` either.

   NOTE: this lives above the giga block on purpose. tools/add-variant-g.py
   replaces everything from that block's marker down to the Emit section, so
   anything defined in between is lost on the next splice. */
const NEXT_BAND = { white: "stone", stone: "white", mist: "white", navy: "deep", deep: "navy", cyan: "white" };

function alternate(html) {
  const re = /class="g-band g-band--([a-z]+)([^"]*)"/g;
  const found = [];
  let m;
  while ((m = re.exec(html))) {
    found.push({ i: m.index, len: m[0].length, band: m[1], rest: m[2],
                 locked: / g-pj\b/.test(m[2]) });
  }
  if (!found.length) return html;

  let prev = "deep";
  found.forEach((f) => {
    // A locked section keeps its band but still counts as the neighbour.
    if (!f.locked && f.band === prev) f.band = NEXT_BAND[f.band] || "white";
    prev = f.band;
  });

  const last = found[found.length - 1];
  if (last.band === "deep" && !last.locked) {
    const before = found.length > 1 ? found[found.length - 2].band : null;
    last.band = before === "navy" ? "cyan" : "navy";
  }

  let out = "", at = 0;
  found.forEach((f) => {
    out += html.slice(at, f.i) + 'class="g-band g-band--' + f.band + f.rest + '"';
    at = f.i + f.len;
  });
  return out + html.slice(at);
}

/* ---- How does it work: three columns, and nothing else ----
   Modelled on the section called out in the review video. The point of it is
   how little it says: a numbered picture, two or three words of title, one
   line underneath. The vertical steps() builder says far more and is the
   wrong shape for the top of a landing page.

   Portabox's own square-cornered treatment rather than the round one on the
   reference site — the layout is what was being praised, not the radius. */
function simpleSteps(o) {
  return `
<section class="g-band g-band--${bandOf(o.band || "light")}">
  <div class="g-wrap">
    <div class="g-hiw-head g-rise">
      <h2 class="g-h2">${o.h || "How does it work?"}</h2>
      ${o.sub ? `<p class="g-body">${o.sub}</p>` : ""}
    </div>
    <ol class="g-hiw">
      ${o.items.map((it, i) => `
      <li class="g-hiw-i g-rise" style="--d:${i * 90}ms">
        <span class="g-hiw-pic">
          <img src="${IMG}${it.img}" alt="" loading="lazy" decoding="async" width="520" height="520">
          <span class="g-hiw-n" aria-hidden="true">${i + 1}</span>
        </span>
        <h3 class="g-hiw-t">${it.t}</h3>
        <p class="g-hiw-b">${it.b}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>`;
}

/* ---- Our storage facilities ----
   The same shape as the reference page: the question "do we service your
   suburb?" with a postcode box answering it, the depot itself as an address
   and a direct number, and a map beside it.

   The map is the keyless Google embed. A Maps Platform key is billable and
   the one that arrived with the quote app belonged to someone else's project,
   so this deliberately uses the form that needs no key. */
function facilities(r) {
  const d = C.DEPOTS[r.depot];
  const q = encodeURIComponent(d.addr);
  return `
<section class="g-band g-band--${bandOf(r.facBand || "grey")}" id="facilities">
  <div class="g-wrap">
    <div class="g-fac">
      <div class="g-fac-side g-rise">
        ${gl("Our storage facilities")}
        <h2 class="g-h2">Where your container lives</h2>

        <p class="g-fac-q">Do we service your suburb?</p>
        ${quoteForm("Check")}

        <p class="g-fac-lead">Our <strong>${r.name}</strong> facility</p>
        <a class="g-fac-card" href="${url("facility-" + r.depot)}">
          <span class="g-fac-ico" aria-hidden="true">${ICON.pin}</span>
          <span class="g-fac-txt">
            <strong>${d.name}</strong>
            <span>${d.addr}</span>
          </span>
          <span class="g-fac-go" aria-hidden="true">${ARROW}</span>
        </a>
        <p class="g-fac-tel"><a href="${d.tel}">${d.phone}</a> &middot; ${r.name} depot</p>
      </div>

      <div class="g-fac-map g-rise" style="--d:120ms">
        <iframe
          title="Map showing the Portabox ${d.suburb} depot"
          src="https://maps.google.com/maps?q=${q}&amp;z=11&amp;output=embed"
          loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </div>
</section>`;
}

/* ---- Format, box shop, comparison and trust pages (batches 6, 8 and 9) ----

   The format pages exist because the same product is searched for under four
   different names. They are not four copies of one page: each one answers the
   question that term is actually asked with, and each links to the others
   rather than pretending the synonyms do not exist.

   Prices here are the real ones — the container rates from SIZES and the
   packing supplies straight out of the quote app's config, so the box shop
   quotes what the quote charges. */

const SUPPLIES = require("./quote-data.json").supplies;

function formatPage(o) {
  return [
    hero({
      short: true, img: o.img, alt: o.alt,
      crumb: crumb([["Home", url("index")], [o.crumb || o.h1]]),
      h1: o.h1, sub: o.sub, form: true,
      btns: traceBtn(C.CONTACT.quote, "Get your instant quote", "Takes a minute", "primary") +
            traceBtn(url("container-sizes"), "Compare sizes", "10, 19 and 25 m³", "outline"),
    }),
    trust(),
    simpleSteps({
      band: "light", h: o.stepsH || "How does it work?",
      items: [
        { img: "step-deliver.jpg", t: "We deliver", b: "Your Portabox arrives on an agreed date, with <strong>EARL</strong> lowering the container to ground level." },
        { img: "step-pack.jpg", t: "You pack", b: "Ground level, your own time. You fit the <strong>lock</strong> and keep the keys." },
        { img: "step-move.jpg", t: "We store or move it", b: "We <strong>collect</strong> it on an agreed date — back to our depot, or straight to your new address." },
      ],
    }),
    split({
      band: "grey", img: o.img2 || "sizes-three.jpg", alt: o.img2alt || "The three Portabox container sizes side by side",
      flip: true, chip: o.chip, h: o.bodyH, body: o.body,
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Takes a minute", "primary"),
    }),
    pricing({ band: "light" }),
    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("Same thing, other names", "Called something else where you are?",
      "People search for this under half a dozen names. They all land on the same container.")}
    <ul class="g-sub-list g-sub-list--wide g-rise">
      ${FORMAT_LINKS.filter((f) => f.key !== o.key)
        .map((f) => `<li><a href="${url(f.key)}">${f.label}</a></li>`).join("\n      ")}
    </ul>
  </div>
</section>`,
    faq(C.FAQ_GENERAL, o.faqH || "Common questions", "light"),
    ctaBand({ cyan: true }),
  ].join("\n");
}

const FORMAT_LINKS = [
  { key: "storage-pods", label: "Storage pods" },
  { key: "mobile-storage", label: "Mobile storage" },
  { key: "portable-storage-containers", label: "Portable storage containers" },
  { key: "moving-pods", label: "Moving pods" },
  { key: "container-sizes", label: "Container sizes" },
  { key: "storage-size-calculator", label: "Storage size calculator" },
];

/* ---- the box shop ---- */
const boxRows = (kind) => {
  const p = SUPPLIES;
  const single = kind === "box" ? p.boxSinglePrice : p.blanketSinglePrice;
  const t10 = kind === "box" ? p.box10Price : p.blanket10Price;
  const t50 = kind === "box" ? p.box50Price : p.blanket50Price;
  const t100 = kind === "box" ? p.box100Price : p.blanket100Price;
  const label = kind === "box" ? "box" : "blanket";
  return [
    ["One " + label, `${single.toFixed(2)}`, "Topping up"],
    ["10 " + label + "s", `${t10}`, `${(t10 / 10).toFixed(2)} each`],
    ["50 " + label + "s", `${t50}`, `${(t50 / 50).toFixed(2)} each — a two bedroom home`],
    ["100 " + label + "s", `${t100}`, `${(t100 / 100).toFixed(2)} each — a full house`],
  ];
};

const priceTable = (kind, caption) => `
    <table class="g-ptable g-rise">
      <caption>${caption}</caption>
      <thead><tr><th scope="col">Quantity</th><th scope="col">Price</th><th scope="col">Works out at</th></tr></thead>
      <tbody>
        ${boxRows(kind).map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("\n        ")}
      </tbody>
    </table>`;

function boxShopPage(o) {
  return [
    hero({
      short: true, img: "step-pack.jpg", alt: "Packing boxes inside a Portabox container",
      crumb: crumb([["Home", url("index")], [o.crumb || o.h1]]),
      h1: o.h1, sub: o.sub, form: true,
      btns: traceBtn(C.CONTACT.quote, "Add supplies to a quote", "Priced with the container", "primary"),
    }),
    trust(),
    `
<section class="g-band g-band--light">
  <div class="g-wrap">
    ${gintro("What they cost", o.priceH || "Boxes and blankets, priced by the bundle",
      "Ordered with the container and delivered with it, so there is no separate trip and no separate delivery fee.")}
    ${priceTable("box", "Moving boxes")}
    ${priceTable("blanket", "Blanket rental")}
    <p class="g-body">Blankets are a rental — they go back when the container comes back. Boxes are yours.</p>
  </div>
</section>`,
    split({
      band: "grey", img: "couple-driveway.jpg", alt: "A couple loading a Portabox container on their driveway",
      flip: true, chip: "How many do I need?",
      h: "Roughly a box per square metre",
      body: `<p class="g-body">A one bedroom flat is usually 30 to 40 boxes, a two bedroom home 60 to 80, and a three bedroom house 100 to 120. Those are the same figures the <a href="${url("container-sizes")}">container sizes</a> page uses, so the box count and the container size agree with each other.</p>
        <p class="g-body">Order on the high side. Unused boxes are easier to deal with than a half-packed kitchen at ten at night.</p>`,
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Container and supplies", "primary"),
    }),
    o.extra || "",
    faq(C.FAQ_GENERAL, "Common questions", "light"),
    ctaBand({ cyan: true }),
  ].filter(Boolean).join("\n");
}

/* ---- comparisons ----
   Written to be useful to somebody deciding, not to run a competitor down.
   Portabox's own numbers are stated because they are ours to state; anybody
   else's are left as the thing for you to go and check, because we do not
   have their current pricing and will not invent it. */
function comparePage(o) {
  return [
    hero({
      short: true, img: o.img || "sizes-vs-rival.jpg", alt: o.alt || "Portabox containers beside a competitor's",
      crumb: crumb([["Home", url("index")], ["Compare", url("pricing")], [o.short]]),
      h1: o.h1, sub: o.sub, form: true,
      btns: traceBtn(C.CONTACT.quote, "Get your instant quote", "Takes a minute", "primary"),
    }),
    trust(),
    `
<section class="g-band g-band--light">
  <div class="g-wrap">
    ${gintro("Side by side", o.tableH, o.tableSub)}
    <table class="g-ptable g-rise">
      <thead><tr><th scope="col">&nbsp;</th><th scope="col">${o.colA}</th><th scope="col">${o.colB}</th></tr></thead>
      <tbody>
        ${o.rows.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
    ${o.note ? `<p class="g-body">${o.note}</p>` : ""}
  </div>
</section>`,
    pricing({ band: "grey" }),
    faq(C.FAQ_PRICE, "Questions about the comparison", "light"),
    ctaBand({ cyan: true }),
  ].join("\n");
}

/* ---- Interstate route pages (build sheet, batch 7) ----

   Twenty city pairs. Each carries the real line-haul rate for that direction
   out of the quote app's interstate matrix, which is why they are not twenty
   copies of one page: Adelaide to Melbourne is $1,500 and Sydney to Adelaide
   is $2,700, and the direction matters — Melbourne to Adelaide is $1,600
   while Adelaide to Melbourne is $1,500.

   The rate is the line haul for one container. The legs either end are the
   standard $149 each, and the quote adds them up properly; the page says so
   rather than presenting the line haul as the total. */
const ROUTE_CITIES = {
  sydney:       { name: "Sydney",      hub: "Sydney",              depot: "sydney" },
  melbourne:    { name: "Melbourne",   hub: "Melbourne",           depot: "melbourne" },
  brisbane:     { name: "Brisbane",    hub: "Brisbane/Gold Coast", depot: "brisbane" },
  adelaide:     { name: "Adelaide",    hub: "Adelaide",            depot: "adelaide" },
  "gold-coast": { name: "Gold Coast",  hub: "Brisbane/Gold Coast", depot: "brisbane" },
};

const ROUTES = (() => {
  const data = require("./quote-data.json");
  const out = [];
  const order = ["sydney", "melbourne", "brisbane", "adelaide", "gold-coast"];
  order.forEach((from) => order.forEach((to) => {
    if (from === to) return;
    const a = ROUTE_CITIES[from], b = ROUTE_CITIES[to];
    const rate = a.hub === b.hub ? null : data.interstate[a.hub + "->" + b.hub];
    if (a.hub !== b.hub && !rate) return;
    out.push({ from, to, a, b, rate, local: rate === null, slug: `${from}-to-${to}` });
  }));
  return out;
})();

function routeFaq(r) {
  const da = C.DEPOTS[r.a.depot], db = C.DEPOTS[r.b.depot];
  const legs = C.QUOTE_LEG_FEE || 149;
  return [
    [`How much does it cost to move from ${r.a.name} to ${r.b.name}?`,
     (r.local
       ? `<p>Both ends run off the same depot, so there is no interstate line haul on this one — it is costed as a direct local move on the distance between your two addresses, plus the delivery legs at <strong>$${legs}</strong> per container per leg.</p>`
       : `<p>The line haul for one container ${r.a.name} to ${r.b.name} is <strong>$${r.rate.toLocaleString("en-AU")}</strong>. On top of that sit the delivery legs at each end — $${legs} per container per leg — and the monthly rate for however long you keep it, from $209.</p>`) +
     `<p>That is the whole of it. The <a href="${C.CONTACT.quote}">instant quote</a> adds it up for your two addresses and shows you the breakdown before you commit.</p>`],

    [`How long does a move from ${r.a.name} to ${r.b.name} take?`,
     `<p>${r.local ? "It is a direct run between the two addresses" : "It runs on a scheduled line haul rather than a dedicated truck, which is what keeps it cheaper than a removalist"}. We give you the date when you book, after we have the two addresses — we do not quote a transit time here that we might not make.</p>`],

    [`Do I have to pack it all in one day?`,
     `<p>No, and that is the point of a container. It sits on your driveway in ${r.a.name} for as long as you need, you load it at ground level, and it leaves when you say. No removalist waiting with the clock running.</p>`],

    [`What if the new place is not ready?`,
     `<p>Then it does not have to go straight there. We can hold the container at ${db.suburb} until the ${r.b.name} end is ready, and you pay the monthly rate while it sits. Nobody opens it — your lock stays on.</p>`],

    [`Is one container enough?`,
     `<p>A 25 m³ holds a three-bedroom house including the shed. If you are over that, two containers cost two line hauls, so it is worth checking the <a href="${url("container-sizes")}">sizes</a> before you book.</p>`],
  ];
}

function routePage(r) {
  const da = C.DEPOTS[r.a.depot], db = C.DEPOTS[r.b.depot];
  const back = ROUTES.find((x) => x.from === r.to && x.to === r.from);

  return [
    hero({
      short: true, img: "interstate-map.jpg",
      alt: `The Portabox interstate route from ${r.a.name} to ${r.b.name}`,
      crumb: crumb([["Home", url("index")], ["Moving", url("moving-services")], [`${r.a.name} to ${r.b.name}`]]),
      h1: `Removalists ${r.a.name} to ${r.b.name}`,
      sub: r.local
        ? `Load once in ${r.a.name}, unload once in ${r.b.name}. Both ends run off the same depot, so this is a local move priced on the distance between them rather than an interstate line haul.`
        : `Load once in ${r.a.name}, unload once in ${r.b.name}. The container goes on the truck — you never touch it in between. Line haul from $${r.rate.toLocaleString("en-AU")} a container.`,
      form: true,
      btns: traceBtn(C.CONTACT.quote, "Book now", "Pick your date", "primary") +
            traceBtn(C.CONTACT.tel, `Call ${C.CONTACT.phone}`, "Talk it through", "outline"),
    }),
    trust(),

    simpleSteps({
      band: "light", h: `${r.a.name} to ${r.b.name}, in three moves`,
      items: [
        { img: "step-deliver.jpg", t: `We deliver in ${r.a.name}`,
          b: `The container comes from ${da.suburb} and sits <strong>level</strong> on your driveway until you are done.` },
        { img: "step-pack.jpg", t: "You load it once",
          b: "Ground level, your own pace, your own lock. Nothing gets carried twice." },
        { img: "step-move.jpg", t: `We deliver in ${r.b.name}`,
          b: `Straight to the new address via ${db.suburb} — <strong>no warehouse detour</strong>, no second handling.` },
      ],
    }),

    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("What it costs",
      r.local
        ? `${r.a.name} to ${r.b.name}, priced on the run`
        : `$${r.rate.toLocaleString("en-AU")} on the ${r.a.name} to ${r.b.name} run`,
      r.local
        ? "Both ends sit inside one depot's radius, so there is no line haul — it is costed as a local move on the distance between your two addresses."
        : "That is the line haul for one container. Here is everything that sits around it, so nothing arrives as a surprise.")}
    <ul class="g-perks g-rise">
      <li class="g-perk"><span class="g-perk-ico" aria-hidden="true">${ICON.truck}</span>
        <div><h3 class="g-perk-t">${r.local ? "The move &middot; priced on distance" : `Line haul &middot; $${r.rate.toLocaleString("en-AU")}`}</h3>
        <p class="g-perk-b">${r.local
          ? `A direct run from your door in ${r.a.name} to your door in ${r.b.name}, costed on the kilometres between them. The quote shows the figure before you commit.`
          : `${r.a.name} to ${r.b.name}, one container, direct. Two containers is two line hauls.`}</p></div></li>
      <li class="g-perk"><span class="g-perk-ico" aria-hidden="true">${ICON.house}</span>
        <div><h3 class="g-perk-t">Delivery legs &middot; $149 each</h3>
        <p class="g-perk-b">Out to you in ${r.a.name}, and out to you again in ${r.b.name}. Per container, per leg.</p></div></li>
      <li class="g-perk"><span class="g-perk-ico" aria-hidden="true">${ICON.cube}</span>
        <div><h3 class="g-perk-t">The container &middot; from $209 a month</h3>
        <p class="g-perk-b">For as long as you have it, whether that is a fortnight either side or six months in between.</p></div></li>
      <li class="g-perk"><span class="g-perk-ico" aria-hidden="true">${ICON.key}</span>
        <div><h3 class="g-perk-t">Your lock, the whole way</h3>
        <p class="g-perk-b">You lock it in ${r.a.name} and you unlock it in ${r.b.name}. It is not opened, repacked or transferred in between.</p></div></li>
    </ul>
    <p class="g-body"><a href="${url("pricing")}">See how the per-cubic-metre rate compares</a></p>
  </div>
</section>`,

    pricing({ band: "light" }),

    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("Other routes", "Moving somewhere else?",
      "Every run below is a direct line haul on the same terms.")}
    <ul class="g-sub-list g-sub-list--wide g-rise">
      ${ROUTES.filter((x) => x.slug !== r.slug).slice(0, 12)
        .map((x) => `<li><a href="/moving/${x.slug}/">${x.a.name} to ${x.b.name}</a></li>`).join("\n      ")}
    </ul>
    ${back ? `<p class="g-body">Going the other way? <a href="/moving/${back.slug}/">${back.a.name} to ${back.b.name}</a>${back.local ? "" : ` is $${back.rate.toLocaleString("en-AU")}`}.</p>` : ""}
  </div>
</section>`,

    faq(routeFaq(r), `${r.a.name} to ${r.b.name}: your questions, answered`, "light"),
    ctaBand({ cyan: true }),
  ].join("\n");
}

/* ---- Suburb pages (SEO build sheet, batches 3 to 5) ----

   43 suburbs on the sheet, 39 built. The four it marks CHECK FIRST are left
   alone: each name exists in more than one state and the sheet says to
   confirm before building, or the page lands under the wrong hub.

   Every one carries the real road distance from the depot that serves it,
   from build/suburb-data.json — coordinates looked up once against
   OpenStreetMap and distance computed with the same arithmetic the quote
   engine charges by, so the number on the page agrees with the quote.

   Two of the five fields the sheet asks for are not here, because Portabox
   has not supplied them: the delivery lead time and whether the council
   wants a kerbside permit. Both are answered honestly on the page rather
   than guessed — the lead time is confirmed when you book, and the permit
   depends on the council and on whether the container goes on your driveway
   or the road. */

const SUBURBS = (() => {
  let data = {};
  try { data = require("./suburb-data.json"); } catch (e) { /* not geocoded yet */ }
  const out = [];
  C.REGIONS.forEach((r) => {
    r.suburbs.forEach((s) => {
      const d = data[r.slug + "/" + s.slug];
      if (!d) return;
      out.push({
        ...s, ...d, region: r, url: "/self-storage/" + r.slug + "/" + s.slug + "/",
      });
    });
  });
  return out;
})();

/* Nearest neighbours by road distance from the same depot, which is what
   somebody checking coverage actually wants to see next. */
function nearbySuburbs(s, n) {
  return SUBURBS
    .filter((x) => x.region.slug === s.region.slug && x.slug !== s.slug)
    .sort((a, b) => Math.abs(a.km - s.km) - Math.abs(b.km - s.km))
    .slice(0, n);
}

function suburbFaq(s) {
  const d = C.DEPOTS[s.region.depot];
  return [
    [`How much does self storage in ${s.name} cost?`,
     `<p>From <strong>$209 a month</strong> for the 10 m³ container, $219 for the 19 m³ and the 25 m³ — the same rate anywhere we deliver, because you are paying for the container rather than for the postcode.</p>
      <p>${s.name} is ${s.km} km from the ${d.suburb} depot${s.km <= 35 ? ", inside the radius where delivery is included" : ", so the delivery leg is costed by distance"}. The <a href="${C.CONTACT.quote}">instant quote</a> gives you the figure before you commit, and the <a href="${url("pricing")}">pricing page</a> shows the arithmetic per cubic metre.</p>`],

    [`Do you deliver to ${s.name}?`,
     `<p>Yes. ${s.name} is served from our ${d.name} at ${d.addr}, ${s.km} km away by road. Put your postcode into the box at the top of this page and it will confirm it.</p>`],

    [`How long before you can deliver?`,
     `<p>It depends on what is free on the ${d.suburb} run that week, so the honest answer is that we confirm the date and the window with you before the truck is booked rather than promising one here. Ring <a href="${d.tel}">${d.phone}</a> and they will tell you what is open.</p>`],

    [`Do I need a council permit in ${s.name}?`,
     `<p>On your own driveway or in your yard, no. If the container has to sit on the road or the nature strip, most councils want a permit and the rules differ council by council — tell us the address when you book and we will tell you what applies at yours.</p>`],

    [`What size container do I need?`,
     `<p>A 10 m³ holds roughly a one-bedroom flat, a 19 m³ a two-bedroom home, and a 25 m³ a three-bedroom house including the shed. The <a href="${url("container-sizes")}">container sizes page</a> lists the internal dimensions and door clearances.</p>`],

    [`Can I keep it at my place instead of your yard?`,
     `<p>Yes, and most people in ${s.name} do. It sits on your driveway with your own lock on it and you open it whenever you like. If you would rather it went away, we collect it into ${d.suburb} — <a href="${url("facility-" + s.region.depot)}">see the facility</a>.</p>`],
  ];
}

function suburbPage(s) {
  const d = C.DEPOTS[s.region.depot];
  const near = nearbySuburbs(s, 8);
  const inRadius = s.km <= 35;

  return [
    hero({
      short: true, img: s.region.img, alt: `A Portabox container delivered in ${s.name}`,
      crumb: crumb([
        ["Home", url("index")],
        [`Self storage ${s.region.name}`, url(s.region.slug)],
        [s.name],
      ]),
      h1: `Self Storage ${s.name}`,
      sub: `A container delivered to your door in ${s.name}, ${s.km} km from our ${d.suburb} depot. From $209 a month, set down level, and you keep the only key.`,
      form: true,
      btns: traceBtn(C.CONTACT.quote, "Book now", "Pick your date", "primary") +
            traceBtn(d.tel, `Call ${d.phone}`, `${s.region.name} depot`, "outline"),
    }),
    trust(),

    simpleSteps({
      band: "light", h: `How it works in ${s.name}`,
      items: [
        { img: "step-deliver.jpg", t: "We deliver",
          b: `The container comes out from ${d.suburb}, ${s.km} km away, and sets down <strong>level</strong> on your driveway.` },
        { img: "step-pack.jpg", t: "You pack",
          b: "At ground level, in your own time. You fit the <strong>lock</strong> and keep the keys." },
        { img: "step-move.jpg", t: "We store or move it",
          b: `Leave it at your place in ${s.name}, or we <strong>collect</strong> it — to our yard or your new address.` },
      ],
    }),

    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("Delivery to " + s.name, `${s.km} km from the ${d.suburb} depot`,
      inRadius
        ? `That is inside the ${C.ZONE1_KM || 35} km radius where the delivery leg is included in the monthly rate, so what you see on the quote is what you pay.`
        : `Past the ${C.ZONE1_KM || 35} km included radius, so the delivery leg is costed by distance — the quote shows that figure before you commit, not after.`)}
    <ul class="g-perks g-rise">
      <li class="g-perk">
        <span class="g-perk-ico" aria-hidden="true">${ICON.pin}</span>
        <div><h3 class="g-perk-t">Your depot</h3>
        <p class="g-perk-b"><a href="${url("facility-" + s.region.depot)}">${d.name}</a><br>${d.addr}<br><a href="${d.tel}">${d.phone}</a></p></div>
      </li>
      <li class="g-perk">
        <span class="g-perk-ico" aria-hidden="true">${ICON.clock}</span>
        <div><h3 class="g-perk-t">When we can come</h3>
        <p class="g-perk-b">We confirm the date and the window with you before the truck is booked, rather than promising one here. Call our team for this week.</p></div>
      </li>
      <li class="g-perk">
        <span class="g-perk-ico" aria-hidden="true">${ICON.wall}</span>
        <div><h3 class="g-perk-t">Where it sits</h3>
        <p class="g-perk-b">A driveway or yard needs no permit. On the road or the nature strip most councils do want one, and it differs council by council — tell us the address and we will say.</p></div>
      </li>
      <li class="g-perk">
        <span class="g-perk-ico" aria-hidden="true">${ICON.key}</span>
        <div><h3 class="g-perk-t">Who holds the key</h3>
        <p class="g-perk-b">You do, and only you. You fit your own lock before it leaves ${s.name}, whether it stays on your driveway or comes back to ${d.suburb}.</p></div>
      </li>
    </ul>
  </div>
</section>`,

    pricing({ band: "light" }),

    near.length ? `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("Nearby", `We also deliver around ${s.name}`,
      `Same container, same rate, same run out of ${d.suburb}.`)}
    <ul class="g-sub-list g-sub-list--wide g-rise">
      ${near.map((x) => `<li><a href="${x.url}">Self storage ${x.name}</a></li>`).join("\n      ")}
    </ul>
    <p class="g-body"><a href="${url(s.region.slug)}">See everywhere we cover in ${s.region.name}</a></p>
  </div>
</section>` : "",

    faq(suburbFaq(s), `Self storage in ${s.name}: your questions, answered`, "light"),
    ctaBand({ cyan: true }),
  ].filter(Boolean).join("\n");
}

/* ---- Storage facility pages ----
   Laid out after the reference site's location page: a light card with the
   yard photographed on one side and the address, numbers and map on the
   other; then the perks of this particular yard; then what storing here is
   for; then the suburbs it reaches.

   Three things on the reference page are deliberately absent here, because
   Portabox has not supplied them and a facility page is exactly where an
   invented fact does damage: the star rating and review count, the customer
   service and facility access hours, and the specific security equipment.
   Where the reference page lists opening hours this one says to ring the
   depot, which is true. */

const DEPOT_REGIONS = (key) => C.REGIONS.filter((r) => r.depot === key);

function facilityPage(key) {
  const d = C.DEPOTS[key];
  const regions = DEPOT_REGIONS(key);
  const q = encodeURIComponent(d.addr);
  const covers = regions.map((r) => r.name);
  const suburbs = regions.filter((r) => r.suburbs.length);

  const perk = (ico, t, b) => `
        <li class="g-perk">
          <span class="g-perk-ico" aria-hidden="true">${ICON[ico]}</span>
          <div>
            <h3 class="g-perk-t">${t}</h3>
            <p class="g-perk-b">${b}</p>
          </div>
        </li>`;

  return [
    /* 1. The card: the yard on the left, the facts on the right. */
    `
<section class="g-band g-band--light g-facp-top">
  <div class="g-wrap">
    <nav class="g-crumb" aria-label="Breadcrumb">${
      crumb([["Home", url("index")], ["Storage facilities", url("facilities")], [d.suburb]])
    }</nav>
    <div class="g-facp">
      <div class="g-facp-pic g-rise">
        <img src="${IMG}yard-stacked.jpg" alt="The Portabox ${d.suburb} storage facility"
             width="1600" height="900" fetchpriority="high">
      </div>
      <div class="g-facp-info g-rise" style="--d:90ms">
        <h1 class="g-facp-h1">Portabox ${d.suburb}</h1>
        <p class="g-facp-sub">The yard every container for ${covers.join(", ")} is delivered from — and comes back to, if you store with us rather than at your place.</p>

        <div class="g-facp-tels">
          ${traceBtn(C.CONTACT.tel, C.CONTACT.phone, "National", "primary")}
          ${traceBtn(d.tel, d.phone, "This depot", "outline")}
        </div>

        <dl class="g-facp-dl">
          <dt>Address</dt>
          <dd><a href="https://www.google.com/maps/search/?api=1&amp;query=${q}" rel="noopener">${d.addr}</a></dd>
          <dt>Distance</dt>
          <dd>About ${d.cbdKm} km from the ${d.cbd}</dd>
          <dt>Access</dt>
          <dd>You do not visit the yard — we bring the container to you. To arrange a delivery or a return, ring <a href="${d.tel}">${d.phone}</a>.</dd>
        </dl>
      </div>
    </div>
  </div>
</section>`,

    trust(),

    /* 2. Perks of this yard. */
    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    <div class="g-hiw-head g-rise">
      <h2 class="g-h2">Perks of storing at ${d.suburb}</h2>
    </div>
    <ul class="g-perks">
      ${perk("truck", "It comes to you", `You never drive here. The container is delivered to your address and collected from it, so there is no trip out to ${d.suburb} with a car full of boxes.`)}
      ${perk("key", "You hold the only keys", "You fit your own lock before it leaves your place. We move the container. We do not open it, and we have no key to it.")}
      ${perk("shield", "A monitored yard", "Stored with us, your container sits inside a monitored facility rather than on a public street or an open block.")}
      ${perk("cube", "A whole container, not a cage", "You are not renting a corner of a warehouse measured in square feet. The container you packed is the container that sits here.")}
      ${perk("pin", `${d.cbdKm} km from the ${d.cbd}`, `Close enough to the city for a same-run delivery across ${covers.join(" and ")}, and far enough out that you are not paying inner-city rent for the space.`)}
      ${perk("clock", "Month to month", `No minimum term and no exit fee. Keep it a fortnight or a year — see <a href="${url("pricing")}">what it costs</a>.`)}
    </ul>
  </div>
</section>`,

    /* 3. What storing here is actually for. */
    split({
      band: "light", img: "yard-keys.jpg", flip: true,
      alt: "A customer holding the only key to their container",
      chip: "What people use it for",
      h: "Space, without the storage unit",
      body: `<p class="g-body">Between houses. Mid-renovation. A business with stock and nowhere to put it. The container turns up, you fill it, and it either stays on your driveway or comes back here until you want it.</p>
        <ul class="g-ticks">
          <li>Storing between moves</li>
          <li>Renovating around your own furniture</li>
          <li>Local or interstate moving</li>
          <li>Business stock and records</li>
        </ul>`,
      btns: traceBtn(C.CONTACT.quote, "Get your instant quote", "Takes a minute", "primary") +
            traceBtn(url("how-it-works"), "See how it works", "Three steps", "outline"),
    }),

    /* 4. Suburbs, grouped by the region they sit in. */
    suburbs.length ? `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    <div class="g-hiw-head g-rise">
      <h2 class="g-h2">Suburbs we service</h2>
      <p class="g-body">Standard delivery runs out from ${d.suburb} across ${covers.join(", ")}. If your suburb is not listed, put the postcode in above — the radius is wider than the list.</p>
    </div>
    ${suburbs.map((r) => `
    <div class="g-rise">
      <h3 class="g-fac-lead">${r.name}</h3>
      <ul class="g-sub-list g-sub-list--wide">
        ${r.suburbs.map((s) => (s.built
          ? `<li><a href="/self-storage/${r.slug}/${s.slug}/">${s.name}</a></li>`
          : `<li><span>${s.name}</span></li>`)).join("\n        ")}
      </ul>
    </div>`).join("")}
  </div>
</section>` : "",

    testimonials({ band: "light" }),
    ctaBand({ cyan: true }),
  ].filter(Boolean).join("\n");
}

/* The index: all four yards. */
function facilityIndex() {
  const keys = Object.keys(C.DEPOTS);
  return [
    hero({
      short: true, img: "yard-office.jpg", alt: "Inside the Portabox office at a container yard",
      crumb: crumb([["Home", url("index")], ["Storage facilities"]]),
      h1: "Our storage facilities",
      sub: "Four yards, and every delivery in the country goes out from one of them. You never have to visit one — but this is where your container lives if you store it with us.",
      form: true,
    }),
    trust(),
    `
<section class="g-band g-band--light">
  <div class="g-wrap">
    ${gintro("Where we are", "Four Depots In Four States",
      "Each yard runs a standard delivery radius, and anything past it we quote as a regional run.")}
    <div class="g-fac-grid">
      ${keys.map((k) => {
        const d = C.DEPOTS[k];
        const regions = DEPOT_REGIONS(k);
        return `
      <a class="g-fac-card g-rise" href="${url("facility-" + k)}">
        <span class="g-fac-ico" aria-hidden="true">${ICON.pin}</span>
        <span class="g-fac-txt">
          <strong>Portabox ${d.suburb}</strong>
          <span>${d.addr}</span>
          <span>${d.phone}${regions.length ? " &middot; serves " + regions.map((r) => r.name).join(", ") : ""}</span>
        </span>
        <span class="g-fac-go" aria-hidden="true">${ARROW}</span>
      </a>`;
      }).join("")}
    </div>
  </div>
</section>`,
    faq(C.FAQ_GENERAL, "Questions about storing with us", "grey"),
    ctaBand({ cyan: true }),
  ].join("\n");
}

/* ---- Region hubs (SEO build sheet, batch 2) ----

   Page order follows the structure asked for on the review call: what they
   came for first and the CTA impossible to miss, then how it works in the
   plainest terms, then the depot, and only then the SEO block — the suburb
   list, the sibling regions and the FAQ.

   Every suburb beneath a hub appears here whether or not its page exists yet.
   Built ones are links; the rest are plain text, so the internal linking
   grows as the pages land and no hub ever points at a 404. */

function suburbBlock(r) {
  const built = r.suburbs.filter((s) => s.built);
  const soon = r.suburbs.filter((s) => !s.built);
  if (!r.suburbs.length) {
    return `
      <p class="g-body">We deliver across ${r.name} on the standard run from our
      ${C.DEPOTS[r.depot].suburb} depot. Put your postcode in above and we will
      confirm the date before anything is booked.</p>`;
  }
  return `
      <ul class="g-sub-list">
        ${built.map((s) => `<li><a href="/self-storage/${r.slug}/${s.slug}/">Self storage ${s.name}</a></li>`).join("\n        ")}
        ${soon.map((s) => `<li><span>Self storage ${s.name}</span></li>`).join("\n        ")}
      </ul>`;
}

function siblingBlock(current) {
  return `
      <ul class="g-sub-list g-sub-list--wide">
        ${C.REGIONS.filter((x) => x.slug !== current)
          .map((x) => `<li><a href="${url(x.slug)}">Self storage ${x.name}</a></li>`)
          .join("\n        ")}
      </ul>`;
}

/* The FAQ carries the keyword in the question itself, the way the reference
   page in the review video does ("How much does an interstate move from
   Adelaide to Gold Coast cost?"). A generic site-wide FAQ ranks for nothing;
   these are the questions somebody searching "self storage <city>" actually
   types, and the answers link onward in prose rather than as a bare list. */
function regionFaq(r) {
  const d = C.DEPOTS[r.depot];
  return [
    [`How much does self storage in ${r.name} cost?`,
     `<p>From <strong>$209 a month</strong> for the 10 m³ container, $219 for the 19 m³ and the 25 m³. That is the container itself, not a share of a warehouse — which is why it is worth comparing on the <a href="${url("pricing")}">price per cubic metre</a> rather than the headline rate.</p>
      <p>Delivery inside ${Math.round(35)} km of the ${d.suburb} depot is included. Past that it is costed by distance, and the <a href="${C.CONTACT.quote}">instant quote</a> will tell you before you commit.</p>`],

    [`Do you deliver to my suburb in ${r.name}?`,
     `<p>${r.suburbs.length ? `We deliver across ${r.name}, including ${r.suburbs.slice(0, 4).map((s) => s.name).join(", ")} and the rest of the list above.` : `We deliver right across ${r.name} on the standard run.`} Put your postcode into the box at the top of this page and it will tell you which depot covers you.</p>`],

    [`What size container do I need?`,
     `<p>A 10 m³ holds about a one-bedroom flat, a 19 m³ a two-bedroom home, and a 25 m³ a three-bedroom house including the shed. If you are between two sizes, the <a href="${url("container-sizes")}">container sizes page</a> lists the internal dimensions and door clearances.</p>`],

    [`Can I keep the container at my place, or does it go to your facility?`,
     `<p>Either. Leave it on the driveway and open it whenever you like, or we collect it into the ${d.suburb} yard once you have loaded it. The rate per cubic metre is the same both ways — see <a href="${url("how-it-works")}">how it works</a>.</p>`],

    [`How soon can you deliver in ${r.name}?`,
     `<p>We confirm the date and the window with you before the truck is booked, so the honest answer is that it depends on the run. Ring the ${r.name} depot on <a href="${d.tel}">${d.phone}</a> and they will tell you what is free this week.</p>`],

    [`Do I need a council permit to put a container on the street?`,
     `<p>If it sits on your own driveway or yard, no. If it has to sit on the road or the nature strip, most councils want a permit, and the rules differ council by council. Tell us the address when you book and we will tell you what applies.</p>`],
  ];
}

function regionHub(r) {
  const d = C.DEPOTS[r.depot];
  const mapQ = encodeURIComponent(d.addr);

  return [
    /* 1. Answer the query in the H1. The postcode box and both buttons sit in
          the hero together — "the CTAs are instant, you can't miss them". */
    hero({
      short: true, img: r.img, alt: `A Portabox container delivered in ${r.name}`,
      crumb: crumb([["Home", url("index")], ["Self storage", url("locations")], [r.name]]),
      h1: `Self Storage ${r.name}`,
      sub: `${r.blurb} From $209 a month, delivered level to your driveway — you keep the only key.`,
      form: true,
      btns: traceBtn(C.CONTACT.quote, "Book now", "Pick your date", "primary") +
            traceBtn(d.tel, `Call ${d.phone}`, `${r.name} depot`, "outline"),
    }),
    trust(),

    /* 2. How it works. Three pictures, three short titles, one line each. */
    simpleSteps({
      band: "light", h: "How does it work?",
      items: [
        { img: "step-deliver.jpg", t: "We deliver",
          b: `Your container comes from the ${d.suburb} depot and sets down <strong>level</strong> on your driveway.` },
        { img: "step-pack.jpg", t: "You pack",
          b: "Load it at ground level, in your own time. You fit the <strong>lock</strong> and keep the keys." },
        { img: "step-move.jpg", t: "We store or move it",
          b: "Leave it at your place, or we <strong>collect</strong> it — to our yard or your new address." },
      ],
    }),

    /* 3. The facility — the thing people check before they trust you. */
    facilities(r),

    pricing({ band: "light" }),

    /* 4. Only now the SEO block: suburbs, siblings, FAQ. */
    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("Areas covered", `Self storage across ${r.name}`,
      r.suburbs.length
        ? `We deliver to every suburb in ${r.name} on the standard run, including ${r.suburbs.slice(0, 3).map((s) => s.name).join(", ")} and the rest below.`
        : `We deliver across ${r.name} on the standard run from ${d.suburb}.`)}
    <div class="g-rise">${suburbBlock(r)}</div>

    ${gintro("Other regions", "We cover these too",
      "Same container, same price per cubic metre, same hydraulic delivery.")}
    <div class="g-rise">${siblingBlock(r.slug)}</div>
  </div>
</section>`,

    faq(regionFaq(r), `Self storage in ${r.name}: your questions, answered`, "light"),
    ctaBand({ cyan: true }),
  ].join("\n");
}

/* ---------- Pages ---------- */

/* Swapped for gJourney() at emit time; see the Emit section. */
const JOURNEY_SLOT = "<!--JOURNEY-->";

const crumb = (trail) =>
  trail.map((t, i) => (i === trail.length - 1
    ? `<span aria-current="page">${t[0]}</span>`
    : `<a href="${t[1]}">${t[0]}</a><span class="g-crumb-s" aria-hidden="true">/</span>`)).join(" ");

const PAGES = [];

/* Service hubs */
PAGES.push({
  file: outFile("storage-services"), active: "storage-services.html",
  title: "Storage Services | Portabox",
  desc: "Portable storage at your address or in a monitored Portabox facility. Priced per cubic metre from $8.76/m³, delivered level, and you hold the only keys.",
  body: [
    hero({
      form: true,
      short: true, img: "yard-stacked.jpg", alt: "Portabox containers lined up at a secure facility",
      crumb: crumb([["Home", url("index")], ["Storage Services"]]),
      h1: "Storage services",
      sub: "Whether it sits in your driveway or in our depot, it is the same container, the same keys, covered by the same Price Match Guarantee.",
      btns: traceBtn(url("pricing"), "See pricing", "From $209", "dark"),
    }),
    trust(),
    cards({ band: "light", chip: "Storage", h: "Four ways people use it", items: C.STORAGE_SERVICES, cols: "g-4", more: "Read more" }),
    statement({
      band: "dark", chip: "The difference", h: "Nothing gets carried twice.",
      sub: "Self-storage was designed around the warehouse: the drive, the trolley, the roller door, the spare key behind the counter. All of it exists because the box cannot come to you. Ours can.",
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Let\u2019s go", "primary"),
    }),
    pricing({ band: "grey" }),
    testimonials(),
    faq(C.FAQ_GENERAL, "Storage questions", "light"),
    ctaBand(),
  ].join("\n"),
});

PAGES.push({
  file: outFile("moving-services"), active: "moving-services.html",
  title: "Moving Services | Portabox",
  desc: "Door-to-door moving between Brisbane, Sydney, Melbourne and Adelaide, or to large parts of regional Australia on a regional quote. Load once, at your own pace.",
  body: [
    hero({
      form: true,
      short: true, img: "sizes-three.jpg", alt: "Two Portabox containers ready for a move",
      crumb: crumb([["Home", url("index")], ["Moving Services"]]),
      h1: "Moving services",
      sub: "Pack it once, properly, instead of racing a removalist's clock. We carry the sealed container and lower it flat at the other end.",
      btns: traceBtn(url("locations"), "Where we go", "Four depots", "dark"),
    }),
    trust(),
    cards({ band: "light", chip: "Moving", h: "Three options we offer", items: C.MOVING_SERVICES }),
    earl(),
    steps({
      band: "light", chip: "How a move runs", h: "Load once. That is the whole trick.",
      items: [
        ["Load at the old address", "Same level placement, same unhurried loading. Take the week if you need it — the container is yours while it sits there."],
        ["We carry it across", "Door to door between the capitals, or to large parts of regional Australia on a regional quote. It travels sealed and it travels level."],
        ["It comes down at the new place", "Lowered flat at the other end, on your schedule. Unload straight into the house, or leave it on site while you work through it."],
      ],
    }),
    testimonials(),
    faq(C.FAQ_GENERAL, "Moving questions", "grey"),
    ctaBand({ h: "Moving soon? Start with a postcode." }),
  ].join("\n"),
});

PAGES.push({
  file: outFile("locations"), active: "locations.html",
  title: "Locations & Coverage | Portabox",
  desc: "Portabox delivers from depots in Brisbane, Sydney, Melbourne and Adelaide, 150–200 km out, plus regional jobs across large parts of the country.",
  body: [
    hero({
      form: true,
      short: true, img: "step-move.jpg", alt: "A Portabox truck on a coastal road",
      crumb: crumb([["Home", url("index")], ["Locations"]]),
      h1: "Where we go",
      sub: "Four depots covering the capitals and 150–200 km around each of them — and regional runs to large parts of the country beyond that.",
    }),
    trust(),
    cards({ band: "light", chip: "Coverage", h: "Pick your region", items: C.LOCATIONS, cols: "g-3", more: "See coverage" }),
    statement({
      band: "dark", chip: "Regional Australia", h: "Outside the radius, we still go.",
      sub: "Past the depot radii every job is quoted individually. Tell us the two postcodes and we will price the run honestly — including the parts other operators will not drive.",
      btns: traceBtn(C.CONTACT.tel, "Call our team", C.CONTACT.phone, "primary"),
    }),
    pricing({ band: "grey" }),
    ctaBand({ h: "Check your postcode" }),
  ].join("\n"),
});

/* Pricing + How it works */
PAGES.push({
  file: outFile("pricing"), active: "pricing.html",
  title: "Pricing & Sizes | Portabox",
  desc: "Three container sizes: 10 m³ from $209, 19 m³ and 25 m³ from $219 a month. Priced per cubic metre — $8.76/m³ on the Large.",
  body: [
    hero({
      form: true,
      short: true, img: "earl-raised.jpg", alt: "External clearance dimensions for the Small, Medium and Large Portabox containers",
      crumb: crumb([["Home", url("index")], ["Pricing"]]),
      h1: "Pricing and sizes",
      sub: "Three sizes, published volumes, and the per-cubic-metre rate printed next to each one so you can actually compare us to anybody else.",
      btns: traceBtn(C.CONTACT.priceMatch, "Get a price match", "We\u2019ll beat it", "dark"),
    }),
    trust(),
    pricing({ band: "light" }),
    cards({
      band: "grey", chip: "What fits", h: "Roughly what each one holds",
      items: C.SIZES.map((s) => ({ slug: "pricing", title: `${s.name} — ${s.vol} m³`, img: s.img, blurb: s.holds, more: `$${s.per} per m³` })),
    }),
    split({
      band: "light", img: "earl-raised.jpg", alt: "Clearance diagram for Portabox containers", flip: true,
      chip: "Will it fit?", h: "Check the clearance before you book",
      body: `<p class="muted">The preference is a level spot — a driveway, hardstand or firm ground — and a straight run for the delivery truck to reach it and place the container. Keep it clear of overhanging branches, power lines and eaves.</p>
      <p class="muted"><strong>Placement generally needs about 3.5 m wide and 12 m long</strong> for EARL to place the container. If you are unsure, contact one of our team and they can help you work it out.</p>`,
      btns: traceBtn(C.CONTACT.tel, "Call our team", C.CONTACT.phone, "outline"),
    }),
    /* The client wrote this block. Their arithmetic holds against the rates
       on this page: Store at Yours against Store With Us is $10, $80 and
       $110 a month across the three sizes, so $110 is the Large and the $60
       is what is left after paying a neighbour $50. The asterisk is theirs
       too, and it earns its place — the saving depends on size, location and
       term, and a borrowed driveway needs the owner's permission. */
    split({
      band: "white", img: "couple-driveway.jpg", fit: false,
      alt: "A Portabox container on a suburban driveway beside the house",
      chip: "Store at Yours",
      h: "A little driveway space. A lot of storage savings.",
      body: `<p class="g-body">Store at Yours is our most affordable storage option, saving you up to <strong>$110 a month</strong> compared with Store With Us.</p>
        <p class="g-body">No room at your place? Think outside your own driveway. Mum, a mate or a neighbour might have the perfect spot for your Portabox.</p>
        <p class="g-body">Even if you paid a neighbour $50 a month for the space, you could still be <strong>$60 a month</strong> ahead.<sup>*</sup></p>
        <p class="g-fine"><sup>*</sup>Savings depend on container size, location and storage term, and delivery and collection charges still apply. Another address needs the property owner&rsquo;s permission, suitable truck access and room to place the container.</p>`,
      btns: traceBtn(url("pricing"), "Find my most affordable option", "See the rates", "primary"),
    }),
    faq(C.FAQ_PRICE, "Pricing questions", "grey", "Can’t see what you are looking for? Call one of our team — we have arranged a lot of moving and storage over the years, and we are here to help."),
    testimonials(),
    ctaBand(),
  ].join("\n"),
});

PAGES.push({
  file: outFile("how-it-works"), active: "how-it-works.html",
  title: "How It Works | Portabox",
  desc: "Delivered level on the EARL hydraulic lift, loaded at ground level in your own time, then left at your place or stored in a monitored facility.",
  body: [
    hero({
      form: true,
      short: true, img: "earl-placing-container.jpg", alt: "EARL lowering a Portabox container level onto a driveway",
      crumb: crumb([["Home", url("index")], ["How it works"]]),
      h1: "How it works",
      sub: "We bring the containers to you. The only part you do is the packing.",
    }),
    trust(),
    // gJourney() cannot run here -- it uses consts the giga block initialises
    // after PAGES is built -- so the emit swaps this marker for it.
    JOURNEY_SLOT,
    steps({
      band: "light", chip: "The process", h: "From the first phone call to the last box",
      items: [
        ["You tell us the postcode", "We confirm which depot covers you, what size suits the job, and what it will cost. No email address needed to get a number."],
        ["It arrives and comes down level", "The EARL hydraulic frame lowers the container flat onto your driveway, lawn or hardstand. You do not need to be home for a standard placement."],
        ["You load it in your own time", "Ground level, no ramp, no truck to climb. Flat interior walls mean you can stack square to the sides instead of packing around wheel arches."],
        ["You lock it with your own lock", "Nobody at Portabox keeps a spare key — including while it is in one of our facilities."],
        ["It stays, or it goes", "Leave it at your place with access whenever you want it, have us store it, or have us move it interstate. Same container either way."],
      ],
    }),
    earl(),
    featureGrid({ band: "light", chip: "Why Portabox", h: "What makes the difference", items: C.WHY }),
    pricing({ band: "grey" }),
    faq(C.FAQ_GENERAL, "Common questions", "light"),
    ctaBand(),
  ].join("\n"),
});

/* ---- Individual service pages ---- */

const SERVICE_DETAIL = {
  "storage-at-your-place": {
    hero: "delivery-home.jpg", heroAlt: "A couple receiving a Portabox container at their home",
    h1: "Storage at your place",
    sub: "The container is delivered to your address and stays there. No facility trips, no access hours, no counter staff with a spare key.",
    chip: "Storage", parent: ["Storage Services", url("storage-services")],
    body: `<p class="muted">This is the option most people come to us for. We lower a container onto your driveway, lawn or hardstand and leave it with you. You load it over an afternoon or a month, whichever suits, and it sits there until you tell us otherwise.</p>
      <p class="muted">Because it never leaves your property, you get to it whenever you want — no 6pm cut-off, no booking a time slot, no driving across town with a ute full of boxes because you forgot one thing.</p>`,
    img2: "couple-driveway.jpg", img2alt: "A customer leaning on their Portabox container at home",
    points: [
      ["clock", "Access whenever you like", "It is on your property. There are no opening hours to work around and nobody to sign in with."],
      ["key", "Your lock, your keys", "You fit your own lock. Portabox does not hold a duplicate, and nobody opens it without you."],
      ["house", "Discreet by design", "Plain white, unbranded, built to sit in a suburban street for a month without becoming a talking point."],
      ["lift", "Lowered level", "The EARL hydraulic frame sets it flat on the ground. Nothing inside ever has to take a slope."],
      ["wall", "Flat interior walls", "No ribs or wheel arches to pack around, so you can stack square to the wall and use the full height."],
      ["cube", "Priced per cubic metre", "From $8.76/m³ on the 25 m³ Large. Compare that against any quote you have in hand."],
    ],
    steps: [
      ["We deliver and place it", "You tell us where it goes. We need a level spot and a straight run for the truck. A standard placement does not need you on site."],
      ["You load it at your own pace", "Ground level, no ramp needed. Take the weekend or take a month."],
      ["It stays as long as you need", "Monthly. When you are done, tell us — we collect it, or we move it to your new address."],
    ],
  },
  "store-with-us": {
    hero: "yard-keys.jpg", heroAlt: "Portabox team members helping a customer at the facility",
    h1: "Store with us",
    sub: "Load it at home, then we collect the sealed container and keep it in a monitored facility. You still hold the only keys.",
    chip: "Storage", parent: ["Storage Services", url("storage-services")],
    body: `<p class="muted">If the driveway is needed, or the house has sold, we take the loaded container away and store it for you. Nothing gets unpacked, re-handled or transferred into a different unit — the container you filled is the container that sits in the facility.</p>
      <p class="muted">Access takes 48 hours notice, because we need to bring your container to the front rather than have you climb over anyone else's. That is the one trade-off against keeping it at home.</p>`,
    img2: "yard-stacked.jpg", img2alt: "Portabox containers at a secure monitored facility",
    points: [
      ["shield", "Monitored around the clock", "The facility is under 24-hour monitoring. Your container is sealed the entire time it is with us."],
      ["key", "We still don't have a key", "This is the part that surprises people. Your lock stays on it in our facility. We cannot open it."],
      ["clock", "48 hours notice for access", "We retrieve your container and have it ready for you rather than making you climb through a warehouse."],
      ["cube", "Same per-cubic-metre rate", "Storing with us is priced on the same published volumes. No separate facility tariff."],
      ["truck", "Straight back out when you need it", "When you are ready, we deliver the same container to your new address and lower it level."],
      ["lift", "Handled level, both ways", "It is loaded and unloaded from the truck with EARL, so the contents are never tilted."],
    ],
    steps: [
      ["We deliver, you load", "Exactly as if it were staying — container down level at your address, loaded at your own pace."],
      ["You lock it, we collect it", "Your lock goes on. We pick the sealed container up and take it to the facility."],
      ["Ring 48 hours ahead for access", "We bring it to the front for you. When you are done storing, we deliver it wherever it needs to go."],
    ],
  },
  "business-storage": {
    hero: "business.jpg", heroAlt: "A Portabox container during an office relocation",
    h1: "Business & inventory storage",
    sub: "Stock overflow, seasonal inventory and site equipment — stored at your premises or ours, without a lease.",
    chip: "Storage", parent: ["Storage Services", url("storage-services")],
    body: `<p class="muted">Retail overflow after a big order. Tools and plant between jobs. Records and fit-out you need out of the way but not gone. A container on site means your stock is where your people are, and a container with us means it is out of the way without signing a warehouse lease.</p>
      <p class="muted">Because pricing is per cubic metre and monthly, it scales with the season rather than locking you into floor space you only need twice a year.</p>`,
    img2: "sizes-three.jpg", img2alt: "Two Portabox containers ready to move",
    points: [
      ["cube", "Scale by the month", "Add a container for the busy season and hand it back after. No lease, no fit-out, no make-good."],
      ["pin", "On your site or ours", "Keep it in the yard where your team works, or have us store it and bring it back when you need it."],
      ["key", "Your lock stays on it", "Nobody at Portabox holds a key — useful when you are storing stock you are accountable for."],
      ["house", "Unbranded and plain", "Nothing on the outside says what is inside, or that a business is using it."],
      ["wall", "Flat walls, full height", "Pallets, racking overflow and long items stack cleanly without packing around intrusions."],
      ["globe", "Move it between sites", "Same container, different address. Useful for multi-site work and relocations."],
    ],
    steps: [
      ["Tell us the volume", "Give us a rough cubic-metre figure or describe what you are storing — we will size it with you on the phone."],
      ["We place it where you work", "On site, in the yard, or at the facility. Delivered level, so nothing on a pallet shifts."],
      ["Flex it up and down", "Add or return containers month to month as the season moves."],
    ],
  },
  "renovation-storage": {
    hero: "renovation.jpg", heroAlt: "A Portabox container on the driveway of a house mid-renovation",
    h1: "Renovation storage",
    sub: "Clear a room or a whole house while the trades work — without anything leaving your property.",
    chip: "Storage", parent: ["Storage Services", url("storage-services")],
    body: `<p class="muted">Renovating means living around your own furniture for months. A container in the driveway takes the lounge, the spare room and everything in the shed out of the way on day one, and gives it back the week the trades finish.</p>
      <p class="muted">Keeping it on site matters more here than anywhere else: when the painter needs the hallway clear on Tuesday and you need the dining chairs back on Friday, a facility across town is useless.</p>`,
    img2: "delivery-home.jpg", img2alt: "A Portabox container being delivered to a home",
    points: [
      ["clock", "Get to it mid-job", "Pull one thing out without booking anything. It is twenty steps from your back door."],
      ["shield", "Out of the dust", "Sealed and weather-proof, which is more than can be said for a tarp in the carport."],
      ["house", "Won't upset the street", "Plain white and unbranded. It reads as a delivery, not a building site."],
      ["lift", "Set down level", "Lowered flat onto your property using EARL — no tilt, no scraping, no sliding."],
      ["cube", "Only pay for the months you need", "Monthly rates. Renovations overrun; the billing follows the job rather than a fixed term."],
      ["truck", "Or have us take it away", "If the driveway is needed for a skip or a slab pour, we collect it and bring it back."],
    ],
    steps: [
      ["Size it before the trades start", "Ring us with the number of rooms. We will tell you honestly whether one container covers it."],
      ["Load before demolition day", "Set down level in the driveway. Clear the rooms in one go rather than shuffling furniture for weeks."],
      ["Unload when the dust settles", "Keep it until the last coat is dry. Then we collect it and you have your driveway back."],
    ],
  },
  "local-moves": {
    hero: "delivery-truck-street.jpg", heroAlt: "A Portabox truck delivering a container to a suburban street",
    h1: "Local moves",
    sub: "Door to door within your metro area. Load once, at your own pace, with no removalist clock running.",
    chip: "Moving", parent: ["Moving Services", url("moving-services")],
    body: `<p class="muted">A traditional removalist turns up at 7am and everything has to be ready. With a container you load over days, in the order that makes sense to you, and we move the whole thing when you say so.</p>
      <p class="muted">It also solves the gap most local moves have: settlement on the old place and the new one rarely line up. The container simply stays loaded in between, at your address or ours.</p>`,
    img2: "couple-driveway.jpg", img2alt: "A customer with their Portabox container",
    points: [
      ["clock", "No 7am start", "Load across a week if you like. Nothing has to be ready by the time a truck arrives."],
      ["shield", "Packed once, handled once", "Everything is loaded a single time. Fewer handles means fewer chances to damage something."],
      ["lift", "Level at both ends", "Lowered flat at the old address and the new one. Your load never takes a slope."],
      ["key", "Sealed the whole way", "Your lock goes on before it leaves and comes off when you are ready. Nobody opens it in between."],
      ["house", "Bridges a settlement gap", "If the dates do not line up, the loaded container waits — at your place or in our facility."],
      ["cube", "Priced by volume", "Per cubic metre, not per hour. A slow packer does not cost more."],
    ],
    steps: [
      ["Container arrives at the old place", "Lowered level onto the driveway. Load it over as many days as you need."],
      ["We move it when you say", "Sealed, level, door to door across the metro area."],
      ["It comes down at the new place", "Unload straight in, or leave it on site while you work through the boxes."],
    ],
  },
  "interstate-moves": {
    hero: "interstate-map.jpg", heroAlt: "A map of the Portabox interstate routes between Brisbane, Sydney, Melbourne and Adelaide",
    h1: "Interstate moves",
    sub: "Brisbane, Sydney, Melbourne and Adelaide, door to door. It travels sealed and it travels level.",
    chip: "Moving", parent: ["Moving Services", url("moving-services")],
    body: `<p class="muted">Interstate is where EARL earns his keep. A load that gets tilted off a tray at both ends, after a thousand kilometres of highway, is a load that arrives rearranged. Ours is lowered flat at the old address and flat again at the new one.</p>
      <p class="muted">It is also where the settlement gap is worst. The container can sit loaded at either end — or in a facility in between — while the dates sort themselves out.</p>`,
    img2: "step-move.jpg", img2alt: "A Portabox truck on a coastal highway",
    points: [
      ["lift", "Level at both ends", "The whole argument for interstate. Nothing inside ever leans on the doors."],
      ["shield", "Sealed for the whole run", "Loaded once at your place, opened once at the other end, by you."],
      ["globe", "Between all four depots", "Brisbane, Sydney, Melbourne and Adelaide, door to door."],
      ["clock", "Dates that don't line up", "Store the loaded container at either end while settlement sorts itself out."],
      ["key", "You hold the only keys", "Including while it is in transit and while it is in a facility."],
      ["cube", "Per cubic metre", "The same published rates. You are not charged a premium for distance on the volume itself."],
    ],
    steps: [
      ["Load at the old address", "Delivered level, loaded at your pace. Your lock goes on when you are done."],
      ["We carry it across", "Door to door between the capitals. Sealed the entire way."],
      ["Lowered flat at the new place", "Unload straight into the house, or leave it on site while you work through it."],
    ],
  },
  "regional-remote": {
    hero: "outback.jpg", heroAlt: "A Portabox truck on an outback highway",
    h1: "Regional & remote",
    sub: "Large parts of regional Australia, quoted individually. Give us the two postcodes and we will price the run.",
    chip: "Moving", parent: ["Moving Services", url("moving-services")],
    body: `<p class="muted">Outside the 150–200 km depot radii we quote every job on its own merits rather than pretending a metro rate applies. That is more honest than a surcharge table, and usually cheaper than you expect.</p>
      <p class="muted">Remote and regional work is also where leaving the container on site matters most — there is rarely a facility within an hour, so a box that stays at the property is the only sensible option.</p>`,
    img2: "step-move.jpg", img2alt: "A Portabox truck on a coastal road",
    points: [
      ["pin", "Anywhere in the country", "Western Australia, Tasmania, the Territory, Far North Queensland and everything between."],
      ["phone", "Quoted by a person", "Call our team with both postcodes. You get a real figure, not an automated surcharge."],
      ["house", "It stays on the property", "No facility within an hour? Then the container staying on site is the only arrangement that works."],
      ["lift", "Level on rough ground", "Hydraulic placement matters more on gravel and uneven ground than it does on a suburban driveway."],
      ["shield", "Sealed and weather-proof", "It will be on the road a while. It is built for that."],
      ["clock", "Flexible timing", "Regional runs are scheduled around access and weather. We will be straight with you about dates."],
    ],
    steps: [
      ["Ring with both postcodes", "That is genuinely all we need to start pricing the run."],
      ["We quote the job honestly", "Including the parts of the trip other operators will not drive."],
      ["Delivered and placed level", "On gravel, on a slope, on a station track — lowered flat wherever it ends up."],
    ],
  },
};

Object.keys(SERVICE_DETAIL).forEach((slug) => {
  const d = SERVICE_DETAIL[slug];
  PAGES.push({
    file: outFile(slug),
    active: d.parent[1],
    title: `${d.h1} | Portabox`,
    desc: d.sub,
    body: [
      hero({
      form: true,
        short: true, img: d.hero, alt: d.heroAlt,
        crumb: crumb([["Home", url("index")], d.parent, [d.h1]]),
        h1: d.h1, sub: d.sub,
        btns: traceBtn(C.CONTACT.tel, "Call our team", C.CONTACT.phone, "dark"),
      }),
      trust(),
      split({
        band: "light", img: d.img2, alt: d.img2alt, flip: true,
        chip: d.chip, h: "What you actually get", body: d.body,
        btns: traceBtn(url("pricing"), "See pricing", "From $209", "outline"),
      }),
      featureGrid({ band: "grey", h: "Why this one works", items: d.points.map((p) => ({ ico: p[0], t: p[1], b: p[2] })) }),
      steps({ band: "dark", chip: "Step by step", h: "How it runs", items: d.steps }),
      pricing({ band: "light" }),
      testimonials(),
      faq(C.FAQ_GENERAL, "Questions about this service", "grey"),
      ctaBand(),
    ].join("\n"),
  });
});

/* ---- Location pages ---- */

/* The four city pages are now region hubs at /self-storage/<city>/; only
   the regional-australia page still comes from LOCATIONS. */
PAGES.push({
  file: outFile("facilities"), active: "locations.html",
  title: "Our Storage Facilities | Four Depots Australia-wide | Portabox",
  desc: "The four Portabox yards your container is delivered from — Brisbane, Sydney, Melbourne and Adelaide — with addresses, direct numbers and the regions each one covers.",
  faqs: C.FAQ_GENERAL,
  body: facilityIndex(),
});

Object.keys(C.DEPOTS).forEach((k) => {
  const d = C.DEPOTS[k];
  const regions = C.REGIONS.filter((r) => r.depot === k);
  PAGES.push({
    file: outFile("facility-" + k), active: "locations.html",
    title: `${regions[0].name} Storage Facility | ${d.suburb} | Portabox`,
    desc: `The Portabox yard at ${d.addr}. Containers for ${regions.map((r) => r.name).join(", ")} are delivered from here, and stored here if you store with us.`,
    body: facilityPage(k),
  });
});

/* ---- Batch 6: format pages ---- */
PAGES.push({
  file: outFile("storage-pods"), active: "storage-services.html",
  title: "Storage Pods Australia | Delivered to Your Door | Portabox",
  desc: "Storage pods delivered to your address and left there, or collected into a monitored yard. From $209 a month, priced per cubic metre. You keep the only key.",
  faqs: C.FAQ_GENERAL,
  body: formatPage({
    key: "storage-pods", img: "delivery-home.jpg", alt: "A storage pod delivered to a suburban home",
    h1: "Storage Pods", crumb: "Storage pods",
    sub: "A pod on your driveway instead of a unit across town. Delivered level, loaded at ground height, and the only key stays with you. From $209 a month.",
    chip: "What you get", bodyH: "A pod is just a container that comes to you",
    body: `<p class="g-body">The idea behind a pod is that the storage arrives rather than you driving to it. No trolley, no lift, no access hours, no counter staff with a spare key.</p>
      <p class="g-body">Ours come in three sizes — 10, 19 and 25 m³ — and the rate is per cubic metre, which is the only honest way to compare storage. <a href="${url("pricing")}">See the arithmetic</a>.</p>`,
    faqH: "Questions about storage pods",
  }),
});

PAGES.push({
  file: outFile("mobile-storage"), active: "storage-services.html",
  title: "Mobile Storage | Containers Delivered Australia-wide | Portabox",
  desc: "Mobile storage containers delivered to your address across Brisbane, Sydney, Melbourne, Adelaide and the Gold Coast. From $209 a month, you keep the only key.",
  faqs: C.FAQ_GENERAL,
  body: formatPage({
    key: "mobile-storage", img: "couple-driveway.jpg", alt: "A mobile storage container on a driveway",
    h1: "Mobile Storage", crumb: "Mobile storage",
    sub: "Storage that moves. It comes to your address, stays as long as you need, and goes wherever you are going next — without being unpacked in between.",
    chip: "Why mobile", bodyH: "Load it once, and only once",
    body: `<p class="g-body">The expensive part of storage is not the space. It is the double handling — into a van, out of a van, into a unit, and all of it again at the other end.</p>
      <p class="g-body">A mobile container is loaded once at your place. If it later needs to go interstate, it goes as it is — see the <a href="${url("interstate-moves")}">interstate routes</a>.</p>`,
    faqH: "Questions about mobile storage",
  }),
});

PAGES.push({
  file: outFile("portable-storage-containers"), active: "storage-services.html",
  title: "Portable Storage Containers | 10, 19 and 25 m³ | Portabox",
  desc: "Portable storage containers in three sizes, delivered level on a hydraulic frame. From $209 a month, priced per cubic metre, with the only key in your hand.",
  faqs: C.FAQ_GENERAL,
  body: formatPage({
    key: "portable-storage-containers", img: "sizes-three.jpg", alt: "Three sizes of portable storage container",
    h1: "Portable Storage Containers", crumb: "Portable storage containers",
    sub: "Australia's largest portable storage containers, in three sizes. Delivered level on the EARL hydraulic frame — never tipped, never dragged.",
    chip: "The containers", bodyH: "Three sizes, and the measurements to prove it",
    body: `<p class="g-body">10 m³, 19 m³ and 25 m³, measured inside, because the inside is what you load. A lot of comparisons quote the outside of the box.</p>
      <p class="g-body">The 25 m³ holds a three bedroom house including the shed. <a href="${url("container-sizes")}">All the dimensions are here</a>.</p>`,
    img2: "sizes-internal.jpg", img2alt: "Internal dimensions of the three container sizes",
    faqH: "Questions about the containers",
  }),
});

PAGES.push({
  file: outFile("moving-pods"), active: "moving-services.html",
  title: "Moving Pods | Load Once, Move Once | Portabox",
  desc: "Moving pods delivered to your door, loaded at ground level and driven to the new address. Local, interstate or regional. From $209 a month plus the run.",
  faqs: C.FAQ_GENERAL,
  body: formatPage({
    key: "moving-pods", img: "step-move.jpg", alt: "A Portabox moving pod on the highway",
    h1: "Moving Pods", crumb: "Moving pods",
    sub: "A pod for moving, not just storing. You load it once on your driveway and it is not opened again until it reaches the new address.",
    chip: "Moving with a pod", bodyH: "No removalist standing over you",
    body: `<p class="g-body">A removalist charges for the hours they are at your house, which is why everybody packs in a panic the night before. A pod sits there for as long as you need.</p>
      <p class="g-body">When it is full, we drive it. <a href="${url("interstate-moves")}">Interstate</a>, <a href="${url("local-moves")}">local</a>, or <a href="${url("regional-remote")}">anywhere regional</a>.</p>`,
    stepsH: "How a move with a pod works",
    faqH: "Questions about moving pods",
  }),
});

PAGES.push({
  file: outFile("storage-size-calculator"), active: "container-sizes.html",
  title: "Storage Size Calculator | Which Container Do I Need? | Portabox",
  desc: "Work out which container size you need by room and by furniture, with the internal dimensions of the 10, 19 and 25 m³ Portabox containers beside it.",
  faqs: C.FAQ_GENERAL,
  body: formatPage({
    key: "storage-size-calculator", img: "sizes-internal.jpg", alt: "Internal dimensions of the three container sizes",
    h1: "Storage Size Calculator", crumb: "Storage size calculator",
    sub: "Count the rooms you are emptying and we will point at the smallest container that holds them. The calculator is built into the quote — it runs on the same volumes.",
    chip: "Sizing it", bodyH: "Rough is good enough",
    body: `<p class="g-body">A bedroom is about 6 m³, a living room 7, a garage 8. Add them up and round up — a 10 m³ suits a one bedroom flat, a 19 m³ a two bedroom home, a 25 m³ a three bedroom house with the shed.</p>
      <p class="g-body">The <a href="${C.CONTACT.quote}">instant quote</a> has the room-by-room estimator in step three, and <a href="${url("container-sizes")}">every internal dimension is published</a>.</p>`,
    stepsH: "Not sure? Start here",
    faqH: "Questions about sizing",
  }),
});

/* ---- Batch 8: box shop ---- */
PAGES.push({
  file: outFile("moving-boxes"), active: "pricing.html",
  title: "Moving Boxes | Delivered With Your Container | Portabox",
  desc: "Moving boxes from $2.50 each, or 100 for $70, delivered with your container. Blanket rental too. No separate delivery fee and no separate trip.",
  faqs: C.FAQ_GENERAL,
  body: boxShopPage({
    h1: "Moving Boxes", crumb: "Moving boxes",
    sub: "Boxes delivered with the container, not in a separate van on a separate day. From $2.50 each, or 100 for $70.",
  }),
});

PAGES.push({
  file: outFile("moving-boxes-brisbane"), active: "pricing.html",
  title: "Moving Boxes Brisbane | Delivered With Your Container | Portabox",
  desc: "Moving boxes delivered across Brisbane with your Portabox container, from our Gilberton depot. From $2.50 each, or 100 for $70, with blanket rental available.",
  faqs: C.FAQ_GENERAL,
  body: boxShopPage({
    h1: "Moving Boxes Brisbane", crumb: "Moving boxes Brisbane",
    sub: "Boxes across Brisbane, delivered with the container from our Gilberton depot. From $2.50 each, or 100 for $70.",
    priceH: "Boxes and blankets, delivered in Brisbane",
    extra: `
<section class="g-band g-band--light">
  <div class="g-wrap">
    ${gintro("Where we deliver", "Boxes go out on the Brisbane run",
      "Same truck, same day as the container, right across the region.")}
    <ul class="g-sub-list g-sub-list--wide g-rise">
      ${C.REGIONS.filter((r) => r.depot === "brisbane").flatMap((r) => r.suburbs.map((s) => `<li><a href="/self-storage/${r.slug}/${s.slug}/">${s.name}</a></li>`)).join("\n      ")}
    </ul>
    <p class="g-body"><a href="${url("brisbane")}">See everywhere we cover in Brisbane</a></p>
  </div>
</section>`,
  }),
});

PAGES.push({
  file: outFile("packing-supplies"), active: "pricing.html",
  title: "Packing Supplies | Boxes, Blankets and Tape | Portabox",
  desc: "Packing supplies delivered with your container — moving boxes from $2.50 each and blanket rental from $2. Ordered on the quote, delivered on the same truck.",
  faqs: C.FAQ_GENERAL,
  body: boxShopPage({
    h1: "Packing Supplies", crumb: "Packing supplies",
    sub: "Everything that goes in the container, delivered with the container. Boxes to keep, blankets to borrow.",
    priceH: "What the supplies cost",
  }),
});

PAGES.push({
  file: outFile("box-shop"), active: "pricing.html",
  title: "Box Shop | Moving Boxes and Packing Supplies | Portabox",
  desc: "The Portabox box shop — moving boxes from $2.50, bundles of 100 for $70, and blanket rental, all delivered with your container rather than separately.",
  faqs: C.FAQ_GENERAL,
  body: boxShopPage({
    h1: "Box Shop", crumb: "Box shop",
    sub: "Boxes, blankets and the bits you forget. Added to the quote and delivered on the same truck as the container.",
    priceH: "The shop, in two tables",
  }),
});

/* ---- Batch 9: comparison and trust ---- */
PAGES.push({
  file: outFile("compare-mobile-vs-self"), active: "pricing.html",
  title: "Mobile Storage vs Self Storage | Which Is Cheaper? | Portabox",
  desc: "Mobile storage against a self storage unit — what each one costs you in trips, handling and access, and how to compare them honestly per cubic metre.",
  faqs: C.FAQ_PRICE,
  body: comparePage({
    short: "Mobile vs self storage", h1: "Mobile Storage vs Self Storage",
    sub: "One comes to you. One you drive to. The difference shows up in handling and in trips, not just in the monthly rate.",
    tableH: "What actually differs", tableSub: "Our figures are ours to state. For a unit, go and check the ones you are quoted — especially the cubic metres.",
    colA: "Portabox mobile storage", colB: "A self storage unit",
    rows: [
      ["Getting your things there", "It arrives at your door, level, on a hydraulic frame", "You drive them there, usually more than once"],
      ["Handling", "Loaded once, at ground height", "Van, trolley, lift, unit — then again in reverse"],
      ["Access", "On your driveway, whenever you like", "Facility hours, and somebody holds a spare key"],
      ["What you rent", "A whole container, measured inside", "A space, often quoted in square feet"],
      ["Our rate", "From $209 a month, 10 m³", "Ask for theirs per cubic metre, not per week"],
    ],
    note: `The comparison worth making is dollars per cubic metre per month. Divide whatever you are quoted by the cubic metres you actually get — the <a href="${url("pricing")}">pricing page</a> does ours.`,
  }),
});

PAGES.push({
  file: outFile("compare-pods-vs-unit"), active: "pricing.html",
  title: "Storage Pods vs a Storage Unit | Portabox",
  desc: "Storage pods against a traditional storage unit — access, handling, security and how the two compare once you work it out per cubic metre.",
  faqs: C.FAQ_PRICE,
  body: comparePage({
    short: "Pods vs unit", h1: "Storage Pods vs a Storage Unit",
    sub: "A pod is storage that turns up. A unit is storage you commute to. Here is where that actually costs or saves you.",
    tableH: "Pod against unit", tableSub: "Stated plainly, with our own numbers and none of anybody else's.",
    colA: "A Portabox pod", colB: "A storage unit",
    rows: [
      ["Where it is", "Your driveway, or our monitored yard", "A facility, on their schedule"],
      ["Who has a key", "You, and nobody else", "You, plus whoever runs the counter"],
      ["Loading", "Ground level, no ramp, no lift", "Trolley, corridor, lift"],
      ["Moving house later", "The same container goes on the truck", "Unpack it all and start again"],
      ["Our rate", "From $209 a month", "Compare theirs per cubic metre"],
    ],
  }),
});

PAGES.push({
  file: outFile("compare-pods-vs-truck"), active: "pricing.html",
  title: "Moving Pods vs Truck Hire | Which Works Out Better? | Portabox",
  desc: "Moving pods against hiring a truck — who does the driving, who does the lifting, what each costs, and when a truck is genuinely the better call.",
  faqs: C.FAQ_PRICE,
  body: comparePage({
    short: "Pods vs truck hire", h1: "Moving Pods vs Truck Hire",
    sub: "A truck is cheaper on the day and dearer in everything else. Sometimes it is still the right answer — here is when.",
    img: "step-move.jpg", alt: "A Portabox container on the highway",
    tableH: "Pod against a hire truck", tableSub: "Both are worth considering. This is the honest split.",
    colA: "A Portabox pod", colB: "Hiring a truck",
    rows: [
      ["Who drives", "We do, including interstate", "You do, both ways"],
      ["How long you have", "Days, at your own pace", "The hire window, with the clock running"],
      ["Lifting", "Ground level, once", "Up into the tray, down again, twice"],
      ["Interstate", `From $1,500 a container on the Adelaide–Melbourne run`, "Your licence, your fuel, your two days"],
      ["Better when", "You are moving house, or storing either side", "It is a short local shift and you have help"],
    ],
    note: `If it is a one-room move across town with a mate and a ute, hire the truck. If it is a house, a pod usually wins once the second trip is counted — the <a href="${C.CONTACT.quote}">quote</a> will tell you in a minute.`,
  }),
});

PAGES.push({
  file: outFile("compare-portabox-vs-taxibox"), active: "pricing.html",
  title: "Portabox vs TAXIBOX | How to Compare Them | Portabox",
  desc: "Comparing Portabox with TAXIBOX — the questions worth asking about container size, the per-cubic-metre rate, delivery and access, with our own figures stated.",
  faqs: C.FAQ_PRICE,
  body: comparePage({
    short: "Portabox vs TAXIBOX", h1: "Portabox vs TAXIBOX",
    sub: "We are not going to quote somebody else's prices at you — they change, and we would get them wrong. These are the questions to ask both of us, with our answers filled in.",
    tableH: "What to ask, and our answer", tableSub: "Take the right-hand column to whoever else you are quoting and ask them the same thing.",
    colA: "Portabox", colB: "The question to ask",
    rows: [
      ["Container sizes", "10 m³, 19 m³ and 25 m³, measured inside", "How many cubic metres, measured where?"],
      ["Monthly rate", "From $209 for the 10 m³, $219 for the 25 m³", "What is the rate per cubic metre per month?"],
      ["Delivery", `Included inside 35 km of the depot, costed by distance past it`, "What is included, and what is extra?"],
      ["Keys", "You fit the lock. We have no key", "Who else can open it?"],
      ["Interstate", "Published line haul per route", "Is the interstate price published or quoted?"],
    ],
    note: `Divide any monthly rate by the cubic metres it buys. That one number is the comparison, and ours is on the <a href="${url("pricing")}">pricing page</a> in full.`,
  }),
});

PAGES.push({
  file: outFile("reviews"), active: "about-us.html",
  title: "Portabox Reviews | What Customers Say | Portabox",
  desc: "What Portabox customers say about delivery, access and the per-cubic-metre price, in their own words.",
  body: [
    hero({
      short: true, img: "couple-driveway.jpg", alt: "Portabox customers beside their container",
      crumb: crumb([["Home", url("index")], ["Reviews"]]),
      h1: "What our customers say",
      sub: "Three of them, in their own words, from the Portabox site. We would rather show you a handful we can stand behind than a number we cannot.",
      form: true,
    }),
    trust(),
    testimonials({ band: "light" }),
    `
<section class="g-band g-band--grey">
  <div class="g-wrap">
    ${gintro("About these", "Why there are only three",
      "These are the reviews Portabox has published. We have not been given a star rating, a review count or a feed to pull from, so this page does not show one — a made-up number is worth less than three real sentences.")}
    <p class="g-body">If you have stored or moved with us and would put your name to it, ring <a href="${C.CONTACT.tel}">${C.CONTACT.phone}</a> or <a href="${C.CONTACT.mailto}">email us</a> and we will add it.</p>
  </div>
</section>`,
    faq(C.FAQ_GENERAL, "Common questions", "light"),
    ctaBand({ cyan: true }),
  ].join("\n"),
});

PAGES.push({
  file: outFile("formerly-pods-australia"), active: "about-us.html",
  title: "Formerly PODS Australia and AusPods | Now Portabox",
  desc: "AusPods and PODS Australia are now Portabox. Same containers, same depots in Brisbane, Sydney, Melbourne and Adelaide, same team — a new name and a new site.",
  faqs: [
    ["Is Portabox the same company as AusPods?",
     "<p>Yes. The name changed; the containers, the depots and the people did not.</p>"],
    ["I had a container with AusPods. Does anything change?",
     `<p>No. Your container, your lock and your rate are unchanged. If anything is unclear, ring <a href="${C.CONTACT.tel}">${C.CONTACT.phone}</a> and the depot will sort it out.</p>`],
    ["Where did auspods.com.au go?",
     "<p>Here. The old pages redirect to their equivalents on this site, so a bookmark or a search result still lands somewhere useful.</p>"],
  ],
  body: [
    hero({
      short: true, img: "yard-office.jpg", alt: "The Portabox office at a container yard",
      crumb: crumb([["Home", url("index")], ["Formerly PODS Australia"]]),
      h1: "AusPods is now Portabox",
      sub: "Same containers, same four depots, same people. A new name, and a site that finally says what the thing costs.",
      form: true,
    }),
    trust(),
    split({
      band: "light", img: "yard-stacked.jpg", alt: "Portabox containers in a monitored yard", flip: true,
      chip: "What changed", h: "The name, and not much else",
      body: `<p class="g-body">If you knew us as AusPods or as PODS Australia, you are in the right place. The containers are the same containers and they still come out of Gilberton, Blacktown, Laverton North and Edinburgh North.</p>
        <p class="g-body">What has changed is that the pricing is now published per cubic metre rather than quoted on request — <a href="${url("pricing")}">the whole thing is here</a>.</p>`,
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Takes a minute", "primary") +
            traceBtn(url("facilities"), "See the depots", "All four", "outline"),
    }),
    featureGrid({
      band: "grey", chip: "Still the same", h: "What carried over",
      items: [
        { ico: "truck", t: "The same four depots", b: "Brisbane, Sydney, Melbourne and Adelaide, at the same addresses." },
        { ico: "cube", t: "The same containers", b: "10, 19 and 25 m³, delivered level on the EARL hydraulic frame." },
        { ico: "key", t: "The same arrangement", b: "You fit the lock, you keep the only key, and nobody opens it but you." },
        { ico: "globe", t: "The same coverage", b: "Metro delivery from each depot, and regional runs well beyond them." },
      ],
    }),
    ctaBand({ cyan: true }),
  ].join("\n"),
});

ROUTES.forEach((r) => {
  PAGES.push({
    file: outFile("moving/" + r.slug), active: "moving-services.html",
    /* A same-hub run has no line haul to name, so it does not claim one. */
    title: r.local
      ? `Removalists ${r.a.name} to ${r.b.name} | Local Container Move | Portabox`
      : `Removalists ${r.a.name} to ${r.b.name} | From $${r.rate.toLocaleString("en-AU")} | Portabox`,
    desc: r.local
      ? `Moving ${r.a.name} to ${r.b.name} in a container you load once. A local run priced on distance, delivery legs $149 each, container from $209 a month.`
      : `Moving ${r.a.name} to ${r.b.name} in a container you load once. Line haul from $${r.rate.toLocaleString("en-AU")}, delivery legs $149 each, container from $209 a month.`,
    faqs: routeFaq(r),
    body: routePage(r),
  });
});

/* Suburb pages first, because emitting one marks it built, and the region
   hub below prints a suburb as plain text until its page exists. */
SUBURBS.forEach((s) => {
  PAGES.push({
    file: outFile("self-storage/" + s.region.slug + "/" + s.slug), active: "locations.html",
    title: `Self Storage ${s.name} | Containers Delivered | Portabox`,
    desc: `Portable storage and moving containers delivered to ${s.name}, ${s.km} km from our ${C.DEPOTS[s.region.depot].suburb} depot. From $209 a month. You keep the only key.`,
    faqs: suburbFaq(s),
    body: suburbPage(s),
  });
  const hit = s.region.suburbs.find((x) => x.slug === s.slug);
  if (hit) hit.built = true;
});

C.REGIONS.forEach((r) => {
  PAGES.push({
    file: outFile(r.slug), active: "locations.html",
    title: `Self Storage ${r.name} | Portable Storage Containers | Portabox`,
    desc: `${r.blurb} Containers from $209 a month, delivered level to your driveway. You keep the only key.`,
    /* Same list the page prints, so the markup cannot disagree with it. */
    faqs: regionFaq(r),
    body: regionHub(r),
  });
});

C.LOCATIONS.filter((l) => l.regional).forEach((l) => {
  const depotLine = l.regional
    ? "Every regional job is quoted individually. Tell us the two postcodes and we will price the run."
    : `Standard delivery runs 150–200 km out from our ${l.hub} depot.`;
  PAGES.push({
    file: outFile(l.slug),
    active: "locations.html",
    title: `Storage & Moving Containers in ${l.title} | Portabox`,
    desc: `${l.intro} Containers from $209 a month, delivered level. ${depotLine}`,
    body: [
      hero({
        short: true, img: l.img, alt: `Portabox containers serving ${l.title}`,
        crumb: crumb([["Home", url("index")], ["Locations", url("locations")], [l.title]]),
        h1: l.regional ? "Regional Australia" : `Storage & moving in ${l.title}`,
        sub: l.intro,
        form: true,
      }),
      trust(),
      split({
        band: "light", img: "delivery-home.jpg", alt: "A Portabox container delivered to a home", flip: true,
        chip: l.regional ? "Regional" : `${l.hub} depot`,
        h: l.regional ? "Past the radius, we still go" : `Delivering across ${l.title}`,
        body: `<p class="muted">${depotLine} ${l.regional ? "" : `We cover ${l.sats.slice(0, -1).join(", ")} and ${l.sats[l.sats.length - 1]}.`}</p>
        <p class="muted">The container comes down level on the EARL hydraulic frame, you load it at your own pace, and you fit your own lock. Leave it at your place, or have us store it — the rate is the same per cubic metre either way.</p>`,
        btns: traceBtn(C.CONTACT.quote, "Get a price", "Let\u2019s go", "primary") + traceBtn(C.CONTACT.tel, "Call our team", C.CONTACT.phone, "outline"),
      }),
      featureGrid({
        band: "grey", chip: "Areas covered",
        h: l.regional ? "Where regional runs reach" : `Suburbs and towns we reach from ${l.hub}`,
        items: l.sats.map((s) => ({ ico: "pin", t: s, b: l.regional ? "Quoted individually — ring the depot with both postcodes." : `Standard delivery from the ${l.hub} depot.` })),
      }),
      cards({
        band: "light", chip: "Services here", h: "What you can book in this region",
        items: [
          { slug: "storage-at-your-place", title: "Storage at Your Place", img: "delivery-home.jpg", blurb: "Ideal for renos, decluttering or parties.", more: "Read more" },
          { slug: "store-with-us", title: "Store With Us", img: "yard-keys.jpg", blurb: "We collect the loaded container and keep it in a monitored facility.", more: "Read more" },
          { slug: "interstate-moves", title: "Moving", img: "sizes-three.jpg", blurb: "Local, interstate or regional — door to door, sealed and level.", more: "Read more" },
        ],
      }),
      pricing({ band: "grey" }),
      earl(),
      testimonials(),
      locationList({ band: "light" }),
      ctaBand({ h: l.regional ? "Tell us where it needs to go" : `Get a price for ${l.title}` }),
    ].join("\n"),
  });
});

/* =================================================================
   HOMEPAGE — "warm editorial", after stivio.ai
   Portabox colour and typeface, stivio's structure:
     warm cream ground, light-weight large display type,
     hairline-topped feature columns, an inline tool card in the hero,
     and quiet statement bands on deep navy.
   ================================================================= */

/* EARL on a light ground. The dark-band version, earl(), is still used by
   the inner pages. */
function earlLight() {
  return `
<section class="band band--light" id="earl">
  <div class="wrap">
    <div class="split split--wide-left" style="align-items:end;margin-bottom:3rem">
      <div class="rv">
        <p style="margin-bottom:1rem"><span class="chip"><span class="dot"></span>The EARL lift</span></p>
        <h2>A tilt tray slides your things down a hill. Ours doesn’t tilt at all.</h2>
      </div>
      <p class="lede rv" style="--d:90ms">
        Most mobile storage comes off the back of a tilt tray: the deck angles, and
        everything inside takes the slope with it. The EARL hydraulic frame lifts the
        container clear and lowers it flat.
      </p>
    </div>
    <div class="compare">
      <figure class="rv">
        <div class="media media--wide"><img src="${IMG}tilt-method.png" alt="A traditional tilt-tray truck angling a container off its deck" loading="lazy"></div>
        <figcaption><span class="tag tag--bad-l">The usual way</span><p class="muted" style="margin:0">The deck tilts to unload. Whatever is inside leans, slides and ends up against the doors.</p></figcaption>
      </figure>
      <figure class="rv" style="--d:100ms">
        <div class="media media--wide"><img src="${IMG}earl-hydraulic.png" alt="The Portabox EARL hydraulic system lowering a container level to the ground" loading="lazy"></div>
        <figcaption><span class="tag tag--good-l">Portabox · EARL</span><p class="muted" style="margin:0">The frame takes the weight and lowers it flat. Nothing inside ever leaves horizontal.</p></figcaption>
      </figure>
    </div>
  </div>
</section>`;
}

/* One quote given real weight, with two supporting it. */
function featuredQuote() {
  const [a, b, c2] = C.TESTIMONIALS;
  const small = (t) => `
      <figure class="quote-card rv">
        <div class="stars">${ICON.star.repeat(5)}</div>
        <blockquote style="font-size:1rem">“${t.q}”</blockquote>
        <figcaption class="quote-who">
          <img src="${IMG}${t.img}" alt="" loading="lazy" width="46" height="46">
          <span><b>${t.n}</b><span>${t.p}</span></span>
        </figcaption>
      </figure>`;
  return `
<section class="band band--cyan">
  <div class="wrap">
    <div class="feature-q rv">
      <div class="stars" style="margin-bottom:1.25rem">${ICON.star.repeat(5)}</div>
      <blockquote class="feature-q-text">“${a.q}”</blockquote>
      <div class="quote-who" style="margin-top:2rem">
        <img src="${IMG}${a.img}" alt="" loading="lazy" width="56" height="56" style="width:56px;height:56px">
        <span><b>${a.n}</b><span>${a.p}</span></span>
      </div>
    </div>
    <div class="grid g-2" style="margin-top:3rem">${small(b)}${small(c2)}
    </div>
  </div>
</section>`;
}

/* Split hero with the quote widget as a real card, stivio-style. */
function heroC(o) {
  return `
<section class="hero-c hero-c--video">
  <div class="hero-c-copy">
    <div class="hero-c-inner">
      <h1 class="display-light">${o.h1}</h1>
      <p class="hero-c-sub">${o.sub}</p>

      <div class="tool-card">
        <div class="tool-card-lead">
          <p class="tool-eyebrow">Instant quote</p>
          <p class="tool-note">Four digits. No email address.</p>
        </div>
        <form class="quote-form tool-card-form" novalidate>
          <input type="text" inputmode="numeric" maxlength="4" placeholder="Your postcode" aria-label="Delivery postcode">
          ${traceSubmit("Get my price", "Let\u2019s go", "Depot found", "primary")}
        </form>
      </div>

      <p class="hero-c-fine">From $209 per month &middot; $8.76 per cubic metre on the 25&nbsp;m³ &middot; Brisbane, Sydney, Melbourne, Adelaide</p>
    </div>
  </div>
  <div class="hero-c-media" aria-hidden="true">
    <video class="hero-video" playsinline muted loop preload="none"
           poster="${IMG}banner-poster.jpg" data-src="/assets/video/banner.mp4"></video>
  </div>
</section>`;
}

/* The stivio signature: columns ruled by a hairline above each title. */
function ruledColumns(o) {
  const cols = o.items.map((f, n) => `
      <div class="ruled rv" style="--d:${n * 60}ms">
        <h3 class="ruled-t">${f.t}</h3>
        <p class="ruled-b">${f.b}</p>
      </div>`).join("");
  return `
<section class="band band--cream${o.id ? "" : ""}" ${o.id ? `id="${o.id}"` : ""}>
  <div class="wrap">
    <div class="rv" style="max-width:54ch;margin-bottom:3.5rem">
      ${o.chip ? `<p class="c-label">${o.chip}</p>` : ""}
      <h2 class="h-light" style="margin-top:.75rem">${o.h}</h2>
      ${o.sub ? `<p class="lede" style="margin-top:1.25rem">${o.sub}</p>` : ""}
    </div>
    <div class="ruled-grid">${cols}
    </div>
  </div>
</section>`;
}

/* A quiet statement on deep navy — deliberately low-contrast, like stivio's. */
function quietStatement(o) {
  return `
<section class="band band--cyan">
  <div class="wrap">
    <p class="quiet-statement rv">${o.h}</p>
    ${o.btns ? `<div class="btn-row rv" style="margin-top:2.5rem;justify-content:center">${o.btns}</div>` : ""}
  </div>
</section>`;
}

/* Services as ruled columns carrying a thumbnail. */
function ruledServices(o) {
  const cols = o.items.map((s, n) => `
      <a class="ruled ruled--link rv" style="--d:${n * 70}ms" href="${s.slug}.html">
        <span class="ruled-media"><img src="${IMG}${s.img}" alt="" loading="lazy"></span>
        <h3 class="ruled-t" style="margin-top:1.25rem">${s.title}</h3>
        <p class="ruled-b">${s.blurb}</p>
        <span class="ruled-go">${s.more || "Read more"} ${ICON.arrow}</span>
      </a>`).join("");
  return `
<section class="band band--cream">
  <div class="wrap">
    <div class="rv" style="max-width:54ch;margin-bottom:3.5rem">
      <p class="c-label">${o.chip}</p>
      <h2 class="h-light" style="margin-top:.75rem">${o.h}</h2>
      ${o.sub ? `<p class="lede" style="margin-top:1.25rem">${o.sub}</p>` : ""}
    </div>
    <div class="ruled-grid">${cols}
    </div>
  </div>
</section>`;
}

/* Pricing as ruled rows rather than boxes. */
function ruledPricing() {
  const rows = C.SIZES.map((s, n) => `
      <div class="price-rule rv" style="--d:${n * 70}ms">
        <div>
          <h3 class="ruled-t">${s.name}${s.flag ? ` <span class="pill-note">${s.flag}</span>` : ""}</h3>
          <p class="ruled-b" style="margin-top:.4rem">${s.holds}</p>
        </div>
        <div class="price-rule-figs">
          <div><p class="pf">${s.vol} m³</p><p class="c-label">volume</p></div>
          <div><p class="pf">$${s.rate}</p><p class="c-label">per month</p></div>
          <div><p class="pf pf--hero">$${s.per}</p><p class="c-label">per m³</p></div>
        </div>
        ${traceBtn(C.CONTACT.quote, `Choose ${s.name}`, `$${s.rate} a month`, s.best ? "primary" : "outline", "btn-trace--sm")}
      </div>`).join("");
  return `
<section class="band band--cream" id="pricing">
  <div class="wrap">
    <div class="rv" style="max-width:54ch;margin-bottom:3.5rem">
      <p class="c-label">Sizes &amp; pricing</p>
      <h2 class="h-light" style="margin-top:.75rem">The number nobody else prints</h2>
      <p class="lede" style="margin-top:1.25rem">
        Every storage company quotes a monthly rate. Divide it by the cubic metres you
        actually get and the comparison stops being a matter of opinion.
      </p>
    </div>
    <div class="price-rules">${rows}
    </div>
    <p class="small muted rv" style="margin-top:2rem">
      Rates are “from” prices and vary with location and term. Found a cheaper written quote
      per cubic metre? We beat it, not just match it —
      <a href="${C.CONTACT.priceMatch}" style="color:inherit;font-weight:700">get a price match</a>.
    </p>
  </div>
</section>`;
}




/* ---- EARL ----
   Asked for in the review sheet: "EARL Page as an update of this page - with
   a link from the main pages / with a version of 'See how we place your
   container'", against auspods' Podzilla page as the reference.

   Everything here is already said somewhere on this site — level delivery,
   no tilt, ground-level loading, the 3.5 m by 12 m placement, interstate.
   The page gathers it in one place rather than adding claims. Nothing about
   lift capacity, cycle time or mechanism is stated, because none of that has
   been supplied and a spec invented here would be repeated by the client. */
PAGES.push({
  file: outFile("earl"), active: outFile("earl"),
  title: "EARL, the Portabox hydraulic lift | Level delivery, every time | Portabox",
  desc: "EARL is the hydraulic Easylift that puts your container on the ground flat, instead of tilting it off a tray. No tilt, no drag, and you load at ground level.",
  body: [
    hero({
      form: true, short: true, img: "earl-hydraulic.png",
      alt: "The EARL hydraulic lift lowering a Portabox container level onto a driveway",
      crumb: "EARL",
      h1: "Meet EARL",
      sub: "Our hydraulic Easylift. It sets your container down flat on the ground, rather than tipping it off the back of a truck.",
    }),

    split({
      band: "white", img: "earl-raised.jpg",
      alt: "A Portabox container held level on the EARL hydraulic frame",
      chip: "The difference",
      h: "Down level, not tipped off a tray",
      body: `<p class="g-body">Most portable storage arrives on a tilt tray: the truck lifts its bed and the container slides off at an angle. Whatever is inside leans with it, and whatever was stacked goes to the low end.</p>
        <p class="g-body">EARL carries the container on a hydraulic frame and lowers it <strong>straight down</strong>, staying level the whole way. It comes back up the same way at collection, so the load is never tilted at either end.</p>`,
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Takes a minute", "primary"),
    }),

    featureGrid({
      band: "mist", chip: "What that gets you",
      h: "Why level matters more than it sounds",
      items: [
        { ico: "lift", t: "Nothing shifts on the way down", b: "The container is flat from the truck bed to the ground, so what you packed against the back wall stays against the back wall." },
        { ico: "cube", t: "You load at ground level", b: "The floor sits on the ground. No ramp, no lifting up into a doorway, and a trolley rolls straight in." },
        { ico: "shield", t: "Nothing drags", b: "It is placed rather than slid, so there is no scraping across your driveway and no load sliding inside the box." },
        { ico: "truck", t: "It works at both ends", b: "Delivery, collection, and again at the far end on an interstate run. The container is only ever handled one way." },
      ],
    }),

    split({
      band: "white", img: "tilt-method.png", fit: true, flip: true,
      alt: "A tilt tray delivery compared with the EARL hydraulic lift",
      chip: "Placement",
      h: "What EARL needs at your place",
      body: `<p class="g-body">Because the container is lowered straight down rather than slid off a tray, EARL needs room around the drop point rather than a run-up behind it.</p>
        <p class="g-body"><strong>Allow roughly 3.5 m wide and 12 m long</strong>, on a level spot — a driveway, hardstand or firm ground — clear of overhanging branches, power lines and eaves.</p>
        <p class="g-body">If you are not sure, send a photo of the spot when you book. Our team will confirm it before the truck is scheduled.</p>`,
      btns: traceBtn(C.CONTACT.tel, "Check my placement", C.CONTACT.phone, "outline"),
    }),

    faq([
      ["Does the container ever tilt?",
       "Not on the way down or the way up. EARL holds it level on the hydraulic frame for the whole lift, which is the point of it."],
      ["Do I need to be there when it arrives?",
       "Not for a standard placement. Our driver calls about half an hour before delivery, and as long as everything is cleared away from the spot — cars especially — there is no need for you to be there."],
      ["Will it mark my driveway?",
       "The container is placed on the ground rather than dragged onto it. It sits on its own bearers, and the driver will talk through the exact spot with you before setting it down."],
      ["Can EARL get into a narrow driveway?",
       "Often, but it depends on the width, the gradient and what is overhead. Send a photo of the access when you book and our team will tell you before the truck is scheduled, rather than on the day."],
    ], "EARL questions", "grey", "Can’t see what you are looking for? Call one of our team — we have arranged a lot of moving and storage over the years, and we are here to help."),

    ctaBand(),
  ].join("\n"),
});

/* ---- Container sizes ---- */
PAGES.push({
  file: outFile("container-sizes"), active: outFile("container-sizes"),
  title: "Container Sizes & Dimensions | Portabox",
  desc: "External dimensions, floor area and door clearances for every Portabox container, from 10 m³ to 50 m³. Check it fits your driveway before you book.",
  body: [
    hero({
      form: true,
      short: true, img: "earl-raised.jpg",
      alt: "Portabox containers side by side showing their external dimensions",
      crumb: crumb([["Home", url("index")], ["Container sizes"]]),
      h1: "Container sizes",
      sub: "Three container sizes and two combinations, with the external dimensions you need to check the space before it arrives.",
      btns: traceBtn(url("pricing"), "See pricing", "From $209", "outline"),
    }),
    trust(),
    specCards({ band: "light" }),
    /* The client's own dimensioned drawing of the three containers, which
       answers "will my stuff fit" faster than the spec table above it. */
    split({
      band: "grey", img: "sizes-internal.jpg",
      alt: "Internal dimensions of the 10, 19 and 25 cubic metre Portabox containers",
      chip: "Side by side",
      h: "The three sizes, measured",
      body: `<p class="g-body">Every measurement here is internal, because that is the space you actually load. A lot of comparisons quote the outside of the box.</p>
        <p class="g-body">If you are between two sizes, take the larger one — the price per cubic metre falls as the container gets bigger, so the bigger box is usually the better buy. The <a href="${url("pricing")}">pricing page</a> shows that arithmetic.</p>`,
      btns: traceBtn(C.CONTACT.quote, "Get a price", "Takes a minute", "primary"),
    }),
    split({
      band: "light", img: "earl-raised.jpg", flip: true,
      alt: "A Portabox container being lowered onto a residential driveway",
      chip: "Placement",
      h: "What the truck needs at your place",
      body: `<p>The container is lowered straight down with EARL rather than tilted off a tray, so the area needs clear space to place the container, not a run-up.</p>
        <p>A standard driveway, hardstand or firm level lawn works. If access is tight, send a photo of the spot when you book and our team will confirm before the truck is scheduled.</p>`,
      btns: traceBtn(C.CONTACT.tel, "Check my access", C.CONTACT.phone, "outline"),
    }),
    featureGrid({
      band: "light", chip: "Loading",
      h: "Why the inside measurement matters",
      items: [
        { ico: "wall", t: "Flat interior walls", b: "No ribs or wheel arches to pack around, so you stack square to the wall and use the full height." },
        { ico: "cube", t: "Full height usable", b: "2.40 m internal height on every size. Stack to the ceiling rather than losing the top third." },
        { ico: "lift", t: "Ground level loading", b: "The floor sits on the ground, so there is no ramp and nothing to lift up into." },
      ],
    }),
    pricing({ band: "grey" }),
    faq(C.FAQ_GENERAL, "Questions about sizes", "light"),
    ctaBand({ cyan: true }),
  ].join("\n"),
});

/* ---- Instant quote ----
   The quote itself is the client’s own React app, deployed separately from
   github.com/manuelbiocva/portabox-instant-quote. This URL is in the scope of
   work’s sitemap and is linked from outside the site, so it stays and
   redirects rather than 404ing or serving a second, competing quote flow.

   vercel.json does this as a 308 in production, before the page is ever
   served. The page below is the fallback for any host that does not read
   vercel.json — a WordPress install, or the local static server. */
PAGES.push({
  file: outFile("instant-quote"), active: "instant-quote.html",
  redirect: C.CONTACT.quoteApp,
  title: "Instant Quote | Portabox",
  desc: "Put in your postcode and see which depot covers you, what the container costs per month, and the price per cubic metre. From $209 a month.",
});

/* ---- About us ---- */
PAGES.push({
  file: outFile("about-us"), active: "about-us.html",
  title: "About Us | Portabox",
  desc: "Portabox delivers Australia's largest portable storage containers to your address, level on a hydraulic lift, priced per cubic metre. You keep the only keys.",
  body: [
    hero({
      form: true,
      short: true, img: "couple-driveway.jpg",
      alt: "A customer beside their Portabox container in the driveway",
      crumb: crumb([["Home", url("index")], ["About us"]]),
      h1: "About Portabox",
      sub: "We bring the container to you, set it down level, and hand you the only keys. That is the whole idea.",
      btns: traceBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "Talk to a depot", "outline"),
    }),
    trust(),
    split({
      band: "light", img: "delivery-home.jpg",
      alt: "A Portabox container being lowered onto a residential driveway",
      chip: "What we do",
      h: "Storage built around your driveway, not a warehouse",
      body: `<p>Self-storage was designed around the facility. The drive across town, the trolley, the lift, the spare key behind the counter &mdash; all of it exists because the box cannot come to you.</p>
        <p>Portabox delivers a portable storage and moving container to your address instead. You load it at ground level in your own time, then leave it at your place, have us store it at one of our facilities, or have us move it to your next home.</p>
        <p>The same container does all three. Switching from storing to moving does not mean repacking a single box.</p>`,
    }),
    featureGrid({
      band: "grey", chip: "What we stand for",
      h: "Six things we will not compromise on",
      sub: "Each one is a published figure or a physical fact about the container, not a slogan.",
      items: [
        { ico: "cube", t: "More space for your money",
          b: "Our containers are 20 to 30% larger than competitors. Fewer containers for the same job, so a lower total cost. The largest is 25 m&sup3;." },
        { ico: "lift", t: "Level, every time",
          b: "The EARL hydraulic lift keeps the container flat from the truck to the ground. Nothing tips, slides or tumbles on the way down." },
        { ico: "key", t: "You hold the only keys",
          b: "Not us, not our staff, not anyone else &mdash; including while your container sits in one of our facilities." },
        { ico: "house", t: "Discreet on your street",
          b: "Plain white containers with no neon colours and no oversized logos parked on your front yard." },
        { ico: "wall", t: "Flat interior walls",
          b: "No ribs or wheel arches to pack around, so you can stack square to the wall and use the full height." },
        { ico: "clock", t: "Month to month",
          b: "Short term through a renovation or long term between homes. No lock-in for a space you have stopped needing." },
      ],
    }),
    split({
      band: "light", flip: true, img: "about-fit-more.jpg",
      alt: "A Portabox container packed with a sofa, kayak and household boxes",
      chip: "The container",
      h: "The size of the box is the whole economy of it",
      body: `<p>Every storage company quotes you a monthly rate. What they rarely print is how many cubic metres that rate actually buys.</p>
        <p>A competitor at $290 a month for 7.9 m&sup3; is charging about $36 per cubic metre. Our Large is 25 m&sup3; at $219 a month, which is $8.76. Same job, fewer containers, less money.</p>
        <p>That is not a discount. It is a bigger box.</p>`,
      btns: traceBtn(url("pricing"), "See sizes and pricing", "From $209", "outline"),
    }),
    split({
      band: "grey", img: "volume-comparison.png", fit: true,
      alt: "Volume comparison of the Portabox Small, Medium and Large containers",
      chip: "Sizes",
      h: "Three sizes, published volumes",
      body: `<p>Small at 10 m&sup3; suits a one-bedroom flat or a single room plus whitegoods. Medium at 19 m&sup3; takes two bedrooms, a lounge, a full kitchen and the garage overflow. Large at 25 m&sup3; holds a whole three-bedroom house, including the shed and the bikes.</p>
        <p>If you are between two of them, call our team and describe the house. It costs nothing and it is quicker than guessing.</p>`,
    }),
    earl(),
    split({
      band: "light", img: "keys-handover.jpg",
      alt: "A Portabox team member handing the container keys to a customer",
      chip: "Access and security",
      h: "You fit the lock, you hold the keys.",
      body: `<p>When the container is delivered you put your own lock on it. Nobody at Portabox keeps a duplicate, and that stays true while it is sitting in one of our monitored facilities.</p>
        <p>If your container is stored with us and you want to get into it, give us 48 hours notice and bring your keys. If it is at your place, there is nothing to arrange and nobody to sign in with.</p>`,
    }),
    split({
      band: "grey", flip: true, img: "yard-office.jpg",
      alt: "Portabox containers stacked at a secure monitored storage facility",
      chip: "Our facilities",
      h: "Where your container lives if you store with us",
      body: `<p>We run facilities out of four cities &mdash; Adelaide, Melbourne, Brisbane and Sydney. Containers are kept in a monitored yard, sealed exactly as you left them, and moved with the same hydraulic lift that delivered them.</p>
        <p>Nothing is unpacked, repacked or handled on the way in. The container that leaves your driveway is the container that comes back.</p>`,
      btns: traceBtn(url("store-with-us"), "How storing with us works", "Pack once", "outline"),
    }),
    cards({
      band: "light", chip: "Three ways people use it",
      h: "One container, three jobs",
      sub: "Start with one and switch to another without repacking.",
      items: C.STORAGE_SERVICES.slice(0, 3),
    }),
    statement({
      band: "dark", chip: "Price match guarantee",
      h: "Found a better deal? Bring us the quote and we will beat it.",
      sub: "Divide any competitor's monthly rate by the cubic metres they actually give you, then compare. We think the maths speaks for itself.",
      btns: traceBtn(C.CONTACT.priceMatch, "Submit competitor quote", "We will beat it", "primary") +
            traceBtn(C.CONTACT.quote, "Instant Quote", "No email needed", "outline"),
    }),
    locationList({ band: "light" }),
    faq(C.FAQ_GENERAL, "Questions people ask us", "grey"),
    ctaBand({ cyan: true }),
  ].join("\n"),
});

/* ---- Contact us ---- */
PAGES.push({
  file: outFile("contact-us"), active: "contact-us.html",
  title: "Contact Us | Portabox",
  desc: "Call 1800 467 637 or email sales@portabox.au. Quick actions for your next move, cancellations, accounts, photo requests and permit waivers.",
  body: [
    hero({
      short: true, img: "staff-handover.jpg",
      alt: "A Portabox team member talking with a customer",
      crumb: crumb([["Home", url("index")], ["Contact us"]]),
      h1: "Contact Portabox",
      sub: "We are here to help with your storage and moving needs. Talk to the team, or use a quick action below to handle your account.",
      btns: traceBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "Talk to a depot", "primary"),
    }),
    trust(),
    contactForm({ band: "light" }),
    featureGrid({
      band: "light", chip: "Reach us",
      h: "Three ways to get in touch",
      items: [
        { ico: "phone", t: C.CONTACT.phone,
          b: "Talk to our team that covers your postcode. Quickest way to get a price or check a delivery date." },
        { ico: "globe", t: C.CONTACT.email,
          b: "Email the team for quotes, invoices and anything that needs a paper trail." },
        { ico: "check", t: "Contact form",
          b: "Invoice and customer service enquiries, submitted online with your account number." },
      ],
    }),
    /* The "Quick actions" band was dropped once this page carried its own
       form: its only action sent people off-site to one. Its copy moved here. */
    featureGrid({
      band: "grey", chip: "Self service",
      h: "What you can request online",
      sub: "Handle a movement, an invoice or a placement question without waiting on the phone.",
      items: [
        { ico: "truck", t: "Next move request", b: "Ready for your next Portabox movement." },
        { ico: "clock", t: "Cancellation of movement", b: "Cancel an upcoming scheduled movement." },
        { ico: "cube", t: "Accounts enquiry", b: "Invoices, receipts, card updates and general account questions." },
        { ico: "pin", t: "Photo request", b: "For placement of your Portabox container." },
        { ico: "shield", t: "Permit waiver", b: "If the container is going outside your property boundary." },
        { ico: "star", t: "Price match", b: "Send us a valid competitor quote and we will beat it." },
      ],
    }),
    locationList({ band: "light" }),
    faq(C.FAQ_GENERAL, "Before you call", "grey"),
    ctaBand({ cyan: true }),
  ].join("\n"),
});

/* =================================================================
   HOMEPAGE — after gigaenergy.com
   Standalone: its own stylesheet, its own script, its own nav and
   footer. Shares nothing with the other homepage.
   Copy follows portabox.netlify.app section for section.
   ================================================================= */

const gArrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`;

const gPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.6 3.5h3.1l1.6 4-2.1 1.3a11.4 11.4 0 0 0 5.9 5.9l1.3-2.1 4 1.6v3.1a1.9 1.9 0 0 1-2.1 1.9A16.4 16.4 0 0 1 3.7 5.6a1.9 1.9 0 0 1 1.9-2.1z"/></svg>`;

/* A phone number gets a handset, not the go-somewhere arrow. */
const gSocial = {
  Facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.87.24-1.46 1.49-1.46h1.51V4.46A20.6 20.6 0 0 0 14.2 4.3c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.5V21z"/></svg>`,
  Instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.1" cy="6.9" r="1.25" fill="currentColor" stroke="none"/></svg>`,
  LinkedIn: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9.6h4V21H3zm6 0h3.8v1.6h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.3c0-1.3-.03-2.96-1.85-2.96-1.85 0-2.13 1.4-2.13 2.86V21H9z"/></svg>`,
};

const gMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>`;

const gBtn = (href, text, kind) => {
  const tel = String(href).startsWith("tel:");
  return `<a class="g-btn g-btn--${kind}${tel ? " g-btn--tel" : ""}" href="${href}"><span>${text}</span><i>${tel ? gPhone : gArrow}</i></a>`;
};

const gLink = (href, text) =>
  `<a class="g-link" href="${href}">${text}<span>${gArrow}</span></a>`;

/* Same thing as a non-interactive element, for use INSIDE a card that is
   itself a link. Nested anchors are invalid and the parser will split them. */
const gLinkTag = (text) =>
  `<span class="g-link">${text}<span>${gArrow}</span></span>`;

const gLabel = (t) => `<p class="g-label">${t}</p>`;

/* Split intro: display left, body right. */
const gIntro = (label, h, body, btns) => `
    <div class="g-intro">
      <div class="g-rise">${gLabel(label)}<h2 class="g-h2">${h}</h2></div>
      <div class="g-rise" style="--d:110ms">
        ${body ? `<p class="g-body">${body}</p>` : ""}
        ${btns ? `<div class="g-btns" style="margin-top:1.75rem">${btns}</div>` : ""}
      </div>
    </div>`;

/* ---- Nav ---- */
function gNav() {
  const caret = `<svg class="g-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg>`;

  /* Each group gets a promo card so the panel has somewhere to send people
     who do not want to choose from the list. */
  const GROUPS = [
    { id: "storage", label: "Storage", href: url("storage-services"), all: "All storage services",
      items: C.STORAGE_SERVICES.map((s) => [s.title, url(s.slug), s.blurb])
        .concat([["Container sizes", url("container-sizes"), "External dimensions, floor area and door clearances for every size."]]),
      promo: ["yard-stacked.jpg", "Not sure which one?", "All four storage options side by side, with what each one suits."] },
    { id: "moving", label: "Moving", href: url("moving-services"), all: "All moving services",
      items: C.MOVING_SERVICES.map((s) => [s.title, url(s.slug), s.blurb]),
      promo: ["sizes-three.jpg", "Moving soon?", "Local, interstate or regional &mdash; see how a container move runs."] },
    { id: "locations", label: "Locations", href: url("locations"), all: "All locations",
      /* Grouped by depot rather than listed. This started as eight region
         hubs in two columns of two-line cards; at twenty-two it ran off the
         bottom of a laptop screen and the panel covered the page. The same
         grouping as the footer band, with plain links, fits in four short
         columns and tells you which depot serves you at a glance. */
      groups: ["brisbane", "sydney", "melbourne", "adelaide"].map((d) => {
        const mine = C.REGIONS.filter((r) => r.depot === d);
        const head = mine.find((r) => r.slug === d);
        return {
          name: head.name,
          href: url(head.slug),
          items: mine.filter((r) => r !== head).map((r) => [r.name, url(r.slug)]),
        };
      }),
      extra: [["Our storage facilities", url("facilities")],
              ["Regional & Remote", url("regional-remote")]],
      items: [],
      promo: ["step-move.jpg", "Check your postcode", "Four depots, 150&ndash;200 km each, plus regional runs beyond that."] },
  ];

  const FLAT = [
    ["Pricing &amp; sizes", url("pricing")],
    ["How it works", url("how-it-works")],
    ["About us", url("about-us")],
    ["Contact us", url("contact-us")],
  ];

  /* A button, not a link: it toggles a panel. The hub page is reachable from
     the "All ..." link inside, so nothing is lost to keyboard or screen reader. */
  const group = (g) => `<div class="g-mi">
        <button class="g-menu-t" type="button" aria-expanded="false" aria-controls="g-mega-${g.id}">${g.label}${caret}</button>
        <div class="g-mega" id="g-mega-${g.id}" hidden>
          <div class="g-mega-in">
            <div class="g-mega-col">
              <p class="g-mega-h">${g.label}</p>
              ${g.groups ? `<div class="g-mega-areas">
                ${g.groups.map((col) => `<div>
                  <h3><a href="${col.href}">${col.name}</a></h3>
                  <ul>${col.items.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
                </div>`).join("\n                ")}
              </div>
              <p class="g-mega-extra">
                ${g.extra.map(([t, h]) => `<a href="${h}">${t}</a>`).join("\n                ")}
              </p>` : `<div class="g-mega-links">
                ${g.items.map(([t, h, b]) => `<a class="g-mega-l" href="${h}">
                  <b>${t}</b>
                  <span>${b || ""}</span>
                  <i aria-hidden="true">${gArrow}</i>
                </a>`).join("\n                ")}
              </div>`}
              <a class="g-mega-all" href="${g.href}">${g.all}<span aria-hidden="true">${gArrow}</span></a>
            </div>
            <a class="g-mega-promo" href="${g.href}">
              <span class="g-mega-promo-img"><img src="${IMG}${g.promo[0]}" alt="" loading="lazy"></span>
              <span class="g-mega-promo-b">
                <b>${g.promo[1]}</b>
                <span>${g.promo[2]}</span>
                <em aria-hidden="true">See all${gArrow}</em>
              </span>
            </a>
          </div>
        </div>
      </div>`;

  return `
<header class="g-nav">
  <div class="g-nav-in">
    <a class="g-brand" href="${url("index")}" aria-label="Portabox home">
      <img class="on-dark-logo" src="${IMG}logo-multicolour.png" alt="Portabox" width="132" height="30">
      <img class="on-cyan-logo" src="${IMG}logo.png" alt="" aria-hidden="true" width="120" height="34">
    </a>
    <nav class="g-menu" aria-label="Primary">
      ${GROUPS.map(group).join("\n      ")}
      ${FLAT.map(([t, h]) => `<a class="g-menu-l" href="${h}">${t}</a>`).join("\n      ")}
    </nav>
    <div class="g-nav-cta">
      ${gBtn(C.CONTACT.tel, C.CONTACT.phone, "ghost")}
      ${gBtn(C.CONTACT.quote, "Instant Quote", "yellow")}
    </div>
    <button class="g-burger" type="button" aria-expanded="false" aria-controls="g-drawer" aria-label="Open menu"><b></b></button>
  </div>
</header>
<div class="g-drawer" id="g-drawer">
  <!-- The desktop bar uses the logo for this and has no room to spare; the
       drawer has both the room and the need for an explicit Home. -->
  <a class="g-dlink" href="${url("index")}">Home</a>
  ${GROUPS.map((g) => `<details class="g-dgroup">
    <summary>${g.label}<i aria-hidden="true"></i></summary>
    <div class="g-dsub">
      <a href="${g.href}">${g.all}</a>
      ${g.items.map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}
    </div>
  </details>`).join("")}
  ${FLAT.map(([t, h]) => `<a class="g-dlink" href="${h}">${t}</a>`).join("")}
  <div class="g-btns">
    ${gBtn(C.CONTACT.quote, "Instant Quote", "yellow")}
    ${gBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "ghost")}
  </div>
</div>`;
}

/* ---- Hero ---- */
function gHero() {
  return `
<section class="g-hero">
  <div class="g-hero-media" aria-hidden="true">
    <video class="hero-video" playsinline muted loop preload="none"
           poster="${IMG}banner-poster.jpg" data-src="/assets/video/banner.mp4"></video>
  </div>
  <div class="g-hero-in">
    <div class="g-wrap">
      <a class="g-flag g-rise" href="${url("pricing")}"><b>From $209</b><span>per month &mdash; see sizes &amp; pricing</span></a>
      <div class="g-hero-grid">
        <h1 class="g-display g-rise" style="--d:80ms">Storage that stays at your place.</h1>
        <div class="g-rise" style="--d:160ms">
          <p class="g-hero-body">Australia&rsquo;s largest portable storage containers. Delivered to your door. No stressful depot trips, no inflated prices.</p>
          <div class="g-hero-form">${quoteForm()}</div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

/* ---- Three service options ---- */
function gServices() {
  const items = [
    { slug: "storage-at-your-place", img: "delivery-home.jpg", t: "Storage at Your Place",
      d: "We deliver the container to your home. You load it whenever suits you.",
      f: ["Delivered to your door", "Access day or night", "Discreet white design", "Ideal for renos, decluttering or parties"],
      cta: "Explore storage" },
    { slug: "store-with-us", img: "yard-keys.jpg", t: "Store With Us",
      d: "Pack at home, then we collect it and keep it at our secure depot until you need it.",
      f: ["Pack once, no double handling", "24 hour facility security", "Access with 48 hours notice", "Short or long term"],
      cta: "Store with us" },
    { slug: "moving-services", img: "sizes-three.jpg", t: "Moving &amp; Regional",
      d: "Load at your old place and unload at your new one. Across town, interstate or regional.",
      f: ["Local and interstate moves", "Regional Solution Australia wide", "Store between homes", "EARL keeps it level on pick up and drop off"],
      cta: "Plan my move" },
  ];
  return `
<section class="g-band g-band--white">
  <div class="g-wrap">
    ${gIntro("One container, three ways", "One container.<br>Three ways to use it.",
      "The same container does all three. Switch from storing to moving later without repacking a single box.")}
    <div class="g-grid g-grid--3">
      ${items.map((i, n) => `<a class="g-card g-rise" style="--d:${n * 90}ms" href="${url(i.slug)}">
        <span class="g-card-img"><img src="${IMG}${i.img}" alt="" loading="lazy"></span>
        <h3 class="g-h3">${i.t}</h3>
        <p>${i.d}</p>
        <ul>${i.f.map((x) => `<li><span>${x}</span></li>`).join("")}</ul>
        ${gLinkTag(i.cta)}
      </a>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- How it works, as an index ---- */
function gJourney() {
  const steps = [
    ["We deliver", "Your Portabox arrives on a scheduled date and our hydraulic lift lowers it level where you need it.", "No tilting, no jolting"],
    ["You pack", "Load at your own pace. It&rsquo;s right there at your place, and you hold the keys.", "You keep the only keys"],
    ["We store it", "We collect it level and take it to our secure Portabox facility.", "Adelaide, Melbourne, Brisbane, Sydney"],
  ];
  /* The stage is driven entirely by scroll position; see journey() in giga.js.
     Every id below is a handle that timeline reads, so they are not cosmetic. */
  return `
<section class="g-band g-band--cyan g-pj" id="how">
  <div class="g-wrap">
    ${gIntro("How it works", "Three steps. You only do one of them.",
      "The only part you do is the packing. We deliver to your property, so the container is right there at your convenience, at ground level. Ready when you are!")}
    <div class="g-pj-tabs g-rise" role="group" aria-label="What do you need?">
      <button type="button" aria-pressed="true" data-mode="storage">Storage</button>
      <button type="button" aria-pressed="false" data-mode="moving">Moving</button>
    </div>
  </div>

  <div class="g-pj-journey" id="pj-journey">
    <div class="g-pj-pin">
      <div class="g-pj-left">
        <div class="g-pj-steps" id="pj-stepsCol">
          <span class="g-pj-rail"><i id="pj-rail"></i></span>
          ${steps.map((s, n) => `<div class="g-pj-step${n === 0 ? " on" : ""}">
            <span class="g-pj-dot">${n + 1}</span>
            <h3${n === 2 ? ` id="pj-s3h"` : ""}>${s[0]}</h3>
            <p${n === 2 ? ` id="pj-s3p"` : ""}>${s[1]}</p>
            <span class="g-pj-proof"${n === 2 ? ` id="pj-s3proof"` : ""}>${s[2]}</span>
          </div>`).join("")}
          <div class="g-pj-cta">${gBtn(C.CONTACT.quote, "Instant quote", "yellow")}${gBtn(url("how-it-works"), "See how it works", "ghost")}</div>
        </div>

        <form class="g-pj-quote quote-form" id="pj-quote" novalidate>
          ${gLabel("Your turn")}
          <h3 id="pj-qh">Where should we drop your Portabox?</h3>
          <div class="g-pj-qrow">
            <input name="postcode" inputmode="numeric" maxlength="4" placeholder="Your postcode" aria-label="Your postcode">
            <button class="g-btn g-btn--yellow" type="submit"><span>Get my quote</span><i>${gArrow}</i></button>
          </div>
          <small>From $209 per month, priced by the cubic metre. Or call <a href="${C.CONTACT.tel}">${C.CONTACT.phone}</a></small>
        </form>
      </div>

      <div class="g-pj-stage">
        <span class="g-pj-chip g-pj-chip--step" id="pj-chipStep">Step 1 of 3</span>
        <span class="g-pj-chip g-pj-chip--price" id="pj-chipPrice">From <b>$209/mo</b></span>
        <svg viewBox="0 0 1000 560" role="img" aria-label="A Portabox truck delivers a container, it is packed with boxes, locked, lifted back onto the truck and driven away">
        <defs>
          <linearGradient id="pj-skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9EBFB"></stop><stop offset="1" stop-color="#E9F9FE"></stop></linearGradient>
          <clipPath id="pj-doorClip"><rect x="14" y="22" width="212" height="126" rx="4"></rect></clipPath>
          <g id="pj-cbox">
            <rect x="0" y="0" width="44" height="40" rx="5" fill="#E2AE6C" stroke="#0E385D" stroke-width="3"></rect>
            <rect x="16" y="0" width="12" height="40" fill="#F3D39C"></rect>
            <rect x="0" y="0" width="44" height="40" rx="5" fill="none" stroke="#0E385D" stroke-width="3"></rect>
            <path d="M6 30h10" stroke="#0E385D" stroke-width="2.5" stroke-linecap="round"></path>
          </g>
          <g id="pj-cloud"><path d="M20 50 a22 22 0 0 1 8-40 a30 30 0 0 1 54 4 a20 20 0 0 1 22 36 z" fill="#fff" stroke="#0E385D" stroke-width="3" stroke-linejoin="round"></path></g>
        </defs>

        <rect width="1000" height="560" fill="url(#pj-skyG)"></rect>
        <g id="pj-sun"><circle cx="880" cy="92" r="46" fill="#FED200" stroke="#0E385D" stroke-width="3"></circle><circle cx="880" cy="92" r="64" fill="#FED200" opacity=".25"></circle></g>

        <!-- parallax: clouds -->
        <g id="pj-clouds" transform="translate(0.0,0)">
          <use href="#pj-cloud" x="90" y="60"></use>
          <use href="#pj-cloud" x="520" y="100" transform="scale(.8)"></use>
          <use href="#pj-cloud" x="1250" y="50"></use>
          <use href="#pj-cloud" x="1800" y="90" transform="scale(.85)"></use>
          <use href="#pj-cloud" x="2300" y="40"></use>
        </g>
        <!-- parallax: hills -->
        <g id="pj-hills" transform="translate(0.0,0)">
          <path d="M-100 440 Q 100 300 300 440 Q 480 330 700 440 Q 900 310 1100 440 Q 1300 330 1500 440 Q 1700 300 1900 440 Q 2100 340 2300 440 Z" fill="#9EDFF5" stroke="#0E385D" stroke-width="3" stroke-linejoin="round"></path>
        </g>

        <!-- world (camera pans this) -->
        <g id="pj-world" transform="translate(0.0,0)">
          <!-- road -->
          <rect x="-200" y="440" width="3000" height="140" fill="#2B4B66"></rect>
          <rect x="-200" y="436" width="3000" height="14" fill="#6BCB77" stroke="#0E385D" stroke-width="3"></rect>
          <g fill="#FED200">
            <rect x="0" y="508" width="60" height="8" rx="4"></rect><rect x="130" y="508" width="60" height="8" rx="4"></rect><rect x="260" y="508" width="60" height="8" rx="4"></rect><rect x="390" y="508" width="60" height="8" rx="4"></rect><rect x="520" y="508" width="60" height="8" rx="4"></rect><rect x="650" y="508" width="60" height="8" rx="4"></rect><rect x="780" y="508" width="60" height="8" rx="4"></rect><rect x="910" y="508" width="60" height="8" rx="4"></rect><rect x="1040" y="508" width="60" height="8" rx="4"></rect><rect x="1170" y="508" width="60" height="8" rx="4"></rect><rect x="1300" y="508" width="60" height="8" rx="4"></rect><rect x="1430" y="508" width="60" height="8" rx="4"></rect><rect x="1560" y="508" width="60" height="8" rx="4"></rect><rect x="1690" y="508" width="60" height="8" rx="4"></rect><rect x="1820" y="508" width="60" height="8" rx="4"></rect><rect x="1950" y="508" width="60" height="8" rx="4"></rect>
          </g>
          <!-- driveway -->
          <path d="M360 440 L660 440 L700 470 L330 470 Z" fill="#C9D3DB" stroke="#0E385D" stroke-width="3" stroke-linejoin="round"></path>

          <!-- tree -->
          <g>
            <rect x="22" y="330" width="16" height="110" rx="6" fill="#8A5A3B" stroke="#0E385D" stroke-width="3"></rect>
            <circle cx="30" cy="300" r="46" fill="#4FBF6B" stroke="#0E385D" stroke-width="3"></circle>
            <circle cx="6" cy="330" r="28" fill="#4FBF6B" stroke="#0E385D" stroke-width="3"></circle>
            <circle cx="56" cy="326" r="26" fill="#4FBF6B" stroke="#0E385D" stroke-width="3"></circle>
            <circle cx="40" cy="290" r="10" fill="#7ED68F"></circle>
          </g>

          <!-- origin house -->
          <g id="pj-house">
            <rect x="228" y="212" width="30" height="60" rx="4" fill="#13628A" stroke="#0E385D" stroke-width="3"></rect>
            <rect x="84" y="290" width="236" height="150" rx="10" fill="#FFFFFF" stroke="#0E385D" stroke-width="3.5"></rect>
            <path d="M62 300 Q62 292 70 286 L194 212 Q202 207 210 212 L334 286 Q342 292 342 300 Z" fill="#0E385D"></path>
            <path d="M92 292 L202 226 L312 292" fill="none" stroke="#1EC4F4" stroke-width="5" stroke-linecap="round"></path>
            <!-- windows -->
            <g stroke="#0E385D" stroke-width="3">
              <rect x="106" y="318" width="54" height="48" rx="6" fill="#9EE3F8"></rect>
              <path d="M133 318v48M106 342h54"></path>
              <rect x="244" y="318" width="54" height="48" rx="6" fill="#9EE3F8"></rect>
              <path d="M271 318v48M244 342h54"></path>
            </g>
            <path d="M112 326 l14 -6" stroke="#fff" stroke-width="4" stroke-linecap="round"></path>
            <path d="M250 326 l14 -6" stroke="#fff" stroke-width="4" stroke-linecap="round"></path>
            <rect x="102" y="366" width="62" height="12" rx="4" fill="#13628A" stroke="#0E385D" stroke-width="3"></rect>
            <rect x="240" y="366" width="62" height="12" rx="4" fill="#13628A" stroke="#0E385D" stroke-width="3"></rect>
            <g fill="#FED200" stroke="#0E385D" stroke-width="2"><circle cx="114" cy="364" r="5"></circle><circle cx="133" cy="362" r="5"></circle><circle cx="152" cy="364" r="5"></circle><circle cx="252" cy="364" r="5"></circle><circle cx="271" cy="362" r="5"></circle><circle cx="290" cy="364" r="5"></circle></g>
            <!-- door -->
            <path d="M180 440 V384 a22 22 0 0 1 44 0 V440 Z" fill="#FED200" stroke="#0E385D" stroke-width="3.5"></path>
            <circle cx="214" cy="414" r="3.5" fill="#0E385D"></circle>
            <!-- bushes -->
            <g fill="#4FBF6B" stroke="#0E385D" stroke-width="3">
              <circle cx="92" cy="432" r="18"></circle><circle cx="118" cy="436" r="14"></circle>
              <circle cx="296" cy="434" r="16"></circle><circle cx="320" cy="438" r="12"></circle>
            </g>
            <!-- letterbox -->
            <rect x="338" y="400" width="6" height="40" fill="#0E385D"></rect>
            <rect x="326" y="388" width="30" height="20" rx="8" fill="#1EC4F4" stroke="#0E385D" stroke-width="3"></rect>
          </g>

          <!-- destination: storage facility -->
          <g id="pj-facility" style="opacity: 1;">
            <rect x="1030" y="250" width="400" height="190" rx="10" fill="#0E385D"></rect>
            <path d="M1016 262 L1230 196 L1444 262 Z" fill="#13628A" stroke="#0E385D" stroke-width="3.5" stroke-linejoin="round"></path>
            <rect x="1080" y="204" width="300" height="52" rx="12" fill="#FFFFFF" stroke="#0E385D" stroke-width="3.5"></rect>
            <text x="1230" y="241" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="26" fill="#0E385D">porta<tspan fill="#1EC4F4">box</tspan> <tspan font-size="14" font-weight="700">STORAGE</tspan></text>
            <g stroke="#0E385D" stroke-width="3">
              <rect x="1052" y="296" width="104" height="144" rx="4" fill="#E8EDF1"></rect>
              <rect x="1178" y="296" width="104" height="144" rx="4" fill="#0A2A46"></rect>
              <rect x="1304" y="296" width="104" height="144" rx="4" fill="#E8EDF1"></rect>
            </g>
            <g stroke="#B5C2CC" stroke-width="3"><path d="M1056 316h96M1056 336h96M1056 356h96M1056 376h96M1056 396h96M1056 416h96M1308 316h96M1308 336h96M1308 356h96M1308 376h96M1308 396h96M1308 416h96"></path></g>
            <circle cx="1418" cy="270" r="7" fill="#FED200" stroke="#0E385D" stroke-width="2"></circle>
            <rect x="1440" y="330" width="10" height="110" fill="#0E385D"></rect>
            <rect x="1426" y="308" width="38" height="30" rx="6" fill="#FED200" stroke="#0E385D" stroke-width="3"></rect>
            <path d="M1438 323h14" stroke="#0E385D" stroke-width="3" stroke-linecap="round"></path>
          </g>

          <!-- destination: new home -->
          <g id="pj-newhome" opacity="0" style="opacity: 0;">
            <rect x="1060" y="280" width="300" height="160" rx="10" fill="#FED200" stroke="#0E385D" stroke-width="3.5"></rect>
            <path d="M1036 292 L1210 196 L1384 292 Z" fill="#1EC4F4" stroke="#0E385D" stroke-width="3.5" stroke-linejoin="round"></path>
            <g stroke="#0E385D" stroke-width="3">
              <rect x="1090" y="310" width="60" height="50" rx="6" fill="#FFFFFF"></rect>
              <rect x="1270" y="310" width="60" height="50" rx="6" fill="#FFFFFF"></rect>
            </g>
            <path d="M1186 440 V384 a24 24 0 0 1 48 0 V440 Z" fill="#0E385D"></path>
            <circle cx="1224" cy="414" r="3.5" fill="#FED200"></circle>
            <rect x="1408" y="360" width="8" height="80" fill="#0E385D"></rect>
            <rect x="1376" y="330" width="80" height="44" rx="8" fill="#FFFFFF" stroke="#0E385D" stroke-width="3"></rect>
            <text x="1416" y="359" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="18" fill="#0E385D">SOLD</text>
            <g fill="#4FBF6B" stroke="#0E385D" stroke-width="3"><circle cx="1070" cy="432" r="18"></circle><circle cx="1350" cy="432" r="18"></circle></g>
          </g>

          <!-- truck -->
          <g id="pj-truck" transform="translate(-460.0,0)">
            <g id="pj-truckBody" transform="translate(0,-1.6)">
              <!-- exhaust puffs -->
              <g id="pj-puffs" fill="#FFFFFF" stroke="#0E385D" stroke-width="2.5" transform="translate(3.4,0)" style="opacity: 1;">
                <circle cx="-14" cy="404" r="8"></circle><circle cx="-32" cy="396" r="11"></circle><circle cx="-54" cy="388" r="14"></circle>
              </g>
              <rect x="-6" y="380" width="290" height="18" rx="4" fill="#13628A" stroke="#0E385D" stroke-width="3"></rect>
              <rect x="10" y="398" width="380" height="16" rx="4" fill="#0E385D"></rect>
              <!-- hydraulic arms -->
              <g id="pj-arms" stroke="#0E385D" stroke-width="3" transform="translate(0,0.0)">
                <rect x="30" y="360" width="14" height="24" rx="3" fill="#FED200"></rect>
                <rect x="236" y="360" width="14" height="24" rx="3" fill="#FED200"></rect>
              </g>
              <!-- cab -->
              <path d="M286 414 V318 Q286 300 304 300 H356 Q372 300 380 316 L398 356 Q402 364 402 374 V414 Z" fill="#1EC4F4" stroke="#0E385D" stroke-width="3.5" stroke-linejoin="round"></path>
              <path d="M320 314 H352 Q362 314 367 324 L380 352 H320 Z" fill="#DDF5FD" stroke="#0E385D" stroke-width="3" stroke-linejoin="round"></path>
              <path d="M330 322 l16 -4" stroke="#fff" stroke-width="4" stroke-linecap="round"></path>
              <rect x="286" y="368" width="116" height="12" fill="#0E385D"></rect>
              <text x="342" y="400" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="14" fill="#0E385D">porta<tspan fill="#FFFFFF">box</tspan></text>
              <rect x="394" y="382" width="12" height="10" rx="3" fill="#FED200" stroke="#0E385D" stroke-width="2.5"></rect>
              <rect x="300" y="330" width="8" height="30" rx="3" fill="#0E385D"></rect>
            </g>
            <g class="pj-wheel" transform="translate(60,420) rotate(-1104.0)"><circle r="24" fill="#0E385D"></circle><circle r="11" fill="#DDF5FD" stroke="#0E385D" stroke-width="3"></circle><rect x="-2" y="-10" width="4" height="8" fill="#0E385D"></rect></g>
            <g class="pj-wheel" transform="translate(220,420) rotate(-1104.0)"><circle r="24" fill="#0E385D"></circle><circle r="11" fill="#DDF5FD" stroke="#0E385D" stroke-width="3"></circle><rect x="-2" y="-10" width="4" height="8" fill="#0E385D"></rect></g>
            <g class="pj-wheel" transform="translate(350,420) rotate(-1104.0)"><circle r="24" fill="#0E385D"></circle><circle r="11" fill="#DDF5FD" stroke="#0E385D" stroke-width="3"></circle><rect x="-2" y="-10" width="4" height="8" fill="#0E385D"></rect></g>
          </g>

          <!-- container -->
          <g id="pj-container" transform="translate(-440.0,228.4) scale(1.000,1.000)">
            <!-- legs -->
            <g id="pj-legs" style="opacity: 0;">
              <rect id="pj-legL" x="-12" y="150" width="10" height="61.6" fill="#FED200" stroke="#0E385D" stroke-width="2.5"></rect>
              <rect id="pj-legR" x="242" y="150" width="10" height="61.6" fill="#FED200" stroke="#0E385D" stroke-width="2.5"></rect>
              <rect id="pj-footL" x="-20" y="206.6" width="26" height="6" rx="2" fill="#0E385D"></rect>
              <rect id="pj-footR" x="234" y="206.6" width="26" height="6" rx="2" fill="#0E385D"></rect>
              <rect x="-14" y="120" width="14" height="30" rx="3" fill="#13628A" stroke="#0E385D" stroke-width="2.5"></rect>
              <rect x="240" y="120" width="14" height="30" rx="3" fill="#13628A" stroke="#0E385D" stroke-width="2.5"></rect>
            </g>
            <g id="pj-cbody">
              <rect x="0" y="0" width="240" height="150" rx="8" fill="#F4F6F8" stroke="#0E385D" stroke-width="3.5"></rect>
              <rect x="14" y="22" width="212" height="126" rx="4" fill="#0A2A46"></rect>
              <g id="pj-items">
                <use href="#pj-cbox" data-x="22" data-y="106" x="0" y="0" transform="translate(-210.0,100.0) rotate(160.0 22 20)" style="opacity: 0;"></use>
                <use href="#pj-cbox" data-x="70" data-y="106" x="0" y="0" transform="translate(-210.0,100.0) rotate(-160.0 22 20)" style="opacity: 0;"></use>
                <use href="#pj-cbox" data-x="126" data-y="106" x="0" y="0" transform="translate(-210.0,100.0) rotate(160.0 22 20)" style="opacity: 0;"></use>
                <use href="#pj-cbox" data-x="174" data-y="106" x="0" y="0" transform="translate(-210.0,100.0) rotate(-160.0 22 20)" style="opacity: 0;"></use>
              </g>
              <g clip-path="url(#pj-doorClip)">
                <g id="pj-door" transform="translate(0,0.0)">
                  <rect x="14" y="22" width="212" height="126" fill="#E4EAEF"></rect>
                  <g stroke="#B5C2CC" stroke-width="3"><path d="M14 38h212M14 54h212M14 70h212M14 86h212M14 102h212M14 118h212M14 134h212"></path></g>
                  <rect x="100" y="140" width="40" height="8" rx="3" fill="#0E385D"></rect>
                </g>
              </g>
              <!-- header strip with logo -->
              <rect x="0" y="0" width="240" height="22" rx="8" fill="#FFFFFF" stroke="#0E385D" stroke-width="3.5"></rect>
              <text x="120" y="17" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="15" fill="#0E385D">porta<tspan fill="#1EC4F4">box</tspan></text>
              <circle cx="10" cy="11" r="3" fill="#0E385D"></circle><circle cx="230" cy="11" r="3" fill="#0E385D"></circle>
              <g id="pj-lock" transform="translate(120,128) scale(0.000)">
                <path id="pj-shackle" d="M-9 -2 v-8 a9 9 0 0 1 18 0 v8" fill="none" stroke="#0E385D" stroke-width="4.5" transform="translate(0,-7.0)"></path>
                <rect x="-15" y="-4" width="30" height="24" rx="6" fill="#FED200" stroke="#0E385D" stroke-width="3"></rect>
                <circle cx="0" cy="7" r="3.5" fill="#0E385D"></circle>
              </g>
            </g>
          </g>
        </g>
      </svg>
      </div>
    </div>
  </div>
</section>`;
}

/* ---- Why we're different ---- */
function gWhy() {
  const rows = [
    ["Largest moving containers in Australia", "20 to 30% larger than competitors. Fewer containers, lower cost.", "25 m³ largest"],
    ["EARL, meet our hydraulic difference", "Perfectly level loading and unloading. No tilting, no sliding, no damage.", "EARL"],
    ["Best value per cubic metre", "The cheapest in the market once you calculate cost per cubic metre.", "$8.76 / m³"],
    ["Discreet white design", "No neon colours or massive logos on your front yard.", "Unbranded"],
    ["You control access", "You get the only keys. Your belongings, your control.", "One key"],
  ];
  return `
<section class="g-band g-band--stone">
  <div class="g-wrap">
    ${gIntro("Why we're different", "Don&rsquo;t just compare monthly rates.",
      "Compare what you&rsquo;re actually getting. Five things that change the bottom dollar.")}
    <div class="g-index g-index--plain">
      ${rows.map((r, n) => `<div class="g-row g-rise" style="--d:${n * 70}ms">
        <span class="g-row-t">${r[0]}</span>
        <span class="g-row-d">${r[1]}</span>
        <span class="g-row-m">${r[2]}</span>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- EARL ---- */
function gEarl() {
  return `
<section class="g-band g-band--deep" id="earl">
  <div class="g-wrap">
    ${gIntro("The hydraulic difference", "EARL, meet our hydraulic difference.",
      "Most containers are dragged and tilted onto a truck. Ours stay perfectly level from your driveway to the destination.")}
    <div class="g-compare">
      <figure class="g-rise">
        <span class="g-compare-img"><img src="${IMG}tilt-method.png" alt="A tilt-tray truck angling a container off its deck" loading="lazy"></span>
        <figcaption><span class="g-tagline g-tagline--bad">Traditional tilt method</span>Containers tipped and dragged, so contents move.</figcaption>
      </figure>
      <figure class="g-rise" style="--d:110ms">
        <span class="g-compare-img"><img src="${IMG}earl-hydraulic.png" alt="The EARL hydraulic system lowering a container level to the ground" loading="lazy"></span>
        <figcaption><span class="g-tagline g-tagline--good">Portabox with EARL</span>Lifted level. Nothing tilts, slides or shifts.</figcaption>
      </figure>
    </div>
    <div class="g-btns" style="margin-top:2.5rem">${gBtn(url("earl"), "See how we place your container", "yellow")}</div>
  </div>
</section>`;
}

/* ---- Build and specs ---- */
function gSpecs() {
  const items = [
    { img: "earl-raised.jpg", t: "External clearances", d: "See exactly how much space the Small, Medium or Large container needs on your driveway or street." },
    { img: "yard-stacked.jpg", t: "Premium build", d: "Heavy duty security for your belongings, engineered to withstand the elements." },
    { img: "size-l.jpg", t: "Internal dimensions", d: "Flat interior walls designed for floor to ceiling loading." },
  ];
  return `
<section class="g-band g-band--white">
  <div class="g-wrap">
    ${gIntro("Container build &amp; specs", "Built to fit. Engineered to protect.",
      "Explore our purpose built moving and storage containers.")}
    <div class="g-grid g-grid--3">
      ${items.map((i, n) => `<div class="g-card g-rise" style="--d:${n * 90}ms">
        <span class="g-card-img"><img src="${IMG}${i.img}" alt="" loading="lazy"></span>
        <h3 class="g-h3">${i.t}</h3>
        <p>${i.d}</p>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- Pricing ---- */
function gPricing() {
  const feats = {
    small:  ["Secure storage at your location", "Discreet white design"],
    medium: ["Perfectly level hydraulic system", "You keep the only keys"],
    large:  ["Largest containers available", "Weather proof construction"],
  };
  return `
<section class="g-band g-band--mist" id="pricing">
  <div class="g-wrap">
    ${gIntro("Pricing", "Have space at yours?<br>Save a bucket-load.",
      "Simple, upfront pricing with more space for your money. Here&rsquo;s what you pay per cubic metre.")}
    <div class="g-price">
      ${C.SIZES.map((s, n) => `<div class="g-price-row g-rise${s.best ? " is-best" : ""}" style="--d:${n * 80}ms">
        <div>
          <div class="g-price-name"><b>${s.name}</b>${s.flag ? `<span class="g-badge">${s.flag}</span>` : ""}</div>
          <p class="g-price-feats">${feats[s.id].join(" &middot; ")}</p>
        </div>
        <div class="g-price-figs">
          <span><b>$${s.rate}</b><i>per month</i></span>
          <span><b>${s.vol} m³</b><i>total capacity</i></span>
          <span><b class="big">$${s.per}</b><i>cost per m³</i></span>
        </div>
        ${gBtn(C.CONTACT.quote, "Select " + s.name, s.best ? "yellow" : "line")}
      </div>`).join("\n      ")}
    </div>
    <p class="g-body g-rise" style="margin-top:1.75rem;max-width:none">Not sure which size? ${gLink(url("pricing"), "Use the space calculator")}</p>
  </div>
</section>`;
}

/* ---- The cyan band: giga's brand-colour stat panel ---- */
function gStats() {
  const stats = [
    ["25", "m³ largest container"],
    ["$8.76", "lowest cost per cubic metre"],
    ["4", "secure facility cities"],
    ["150–200", "km delivery radius per depot"],
  ];
  return `
<section class="g-band g-band--cyan">
  <div class="g-wrap">
    <div class="g-intro">
      <div class="g-rise">${gLabel("By the numbers")}<h2 class="g-h2">More space for your money.</h2></div>
      <div class="g-rise" style="--d:110ms">
        <p class="g-body">Every figure here is published. Divide any competitor&rsquo;s monthly rate by the cubic metres they actually give you, then compare.</p>
      </div>
    </div>
    <div class="g-stats">
      ${stats.map((s, n) => `<div class="g-stat g-rise" style="--d:${n * 90}ms">
        <b>${s[0]}</b><span class="rule g-wipe" style="--d:${n * 90 + 200}ms"></span><span>${s[1]}</span>
      </div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- Price match ---- */
function gPriceMatch() {
  return `
<section class="g-band g-band--white">
  <div class="g-wrap">
    ${gIntro("Price match guarantee", "We guarantee to beat any competitor&rsquo;s quote.",
      "Found a better deal? Bring us a valid quote from any major competitor, and we&rsquo;ll not only match it but beat it.",
      gBtn(C.CONTACT.priceMatch, "Submit competitor quote", "solid") + gBtn(C.CONTACT.quote, "Instant quote", "line"))}
  </div>
</section>`;
}

/* ---- Testimonials ---- */
function gQuotes() {
  const items = [
    ["Finally, a storage company that doesn&rsquo;t rip you off. Worked out the maths and Portabox was 40% cheaper per cubic metre.", "Bridget", "Adelaide", "person-bridget-avatar.jpg"],
    ["The hydraulic system is brilliant. My furniture arrived without a scratch. Wendy and the team were brilliant.", "Dean", "Sydney to Brisbane", "person-dean-avatar.jpg"],
    ["Love that I have the only keys. My stuff in my front yard and I can jump in to sort it out whenever I need to.", "Steve", "Melbourne", "person-steve-avatar.jpg"],
  ];
  return `
<section class="g-band g-band--stone">
  <div class="g-wrap">
    ${gIntro("Customers", "What people actually say.", "")}
    <div class="g-quotes">
      ${items.map((q, n) => `<figure class="g-quote g-rise" style="--d:${n * 90}ms">
        <blockquote>&ldquo;${q[0]}&rdquo;</blockquote>
        <figcaption>
          <img src="${IMG}${q[3]}" alt="" loading="lazy" width="52" height="52">
          <span class="g-who"><b>${q[1]}</b><span>${q[2]}</span></span>
        </figcaption>
      </figure>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- Store with us ---- */
function gStoreWithUs() {
  return `
<section class="g-band g-band--navy">
  <div class="g-wrap">
    <div class="g-intro" style="margin-bottom:0">
      <div class="g-rise">
        ${gLabel("Store with us")}
        <h2 class="g-h2">Store with us today.</h2>
        <p class="g-body" style="margin-top:1.5rem">Whether you&rsquo;re moving home, decluttering, storing business inventory, or need extra space during renovations, Portabox provides a simple and secure storage solution.</p>
        <div class="g-index" style="margin-top:2rem;border-top-color:var(--g-rule-d)">
          ${[["24 hour monitored facilities", "Security"], ["You keep the only keys", "Access"], ["Access with 48 hours notice", "Notice"]]
            .map((r, n) => `<div class="g-row g-rise" style="--d:${n * 70}ms;grid-template-columns:1fr auto">
            <span class="g-row-t" style="font-size:1rem">${r[0]}</span>
            <span class="g-row-m">${r[1]}</span>
          </div>`).join("\n          ")}
        </div>
        <div class="g-btns" style="margin-top:2rem">${gBtn(url("store-with-us"), "Learn more", "yellow")}</div>
      </div>
      <div class="g-rise" style="--d:110ms">
        ${/* Was an office interior: a branded wall, a window and a pot plant.
              It said nothing about the three things listed beside it. This one
              carries all of them at once — the monitored yard behind her, the
              key in her hand, the container she can get to. */ ""}
        <img src="${IMG}facility-keys-yard.jpg" alt="A customer holding her own key outside her container in a Portabox depot yard" loading="lazy" style="width:100%;aspect-ratio:4/5;object-fit:cover">
      </div>
    </div>
  </div>
</section>`;
}

/* ---- Regions ---- */
function gRegions() {
  return `
<section class="g-band g-band--white" id="regions">
  <div class="g-wrap">
    ${gIntro("Regions we service", "Regions we service.",
      "Secure storage at your location, or store with us.")}
    <div class="g-regions">
      ${C.LOCATIONS.filter((l) => !l.regional).map((l, n) => `<a class="g-region g-rise" style="--d:${n * 70}ms" href="${url(l.slug)}">
        <b>${l.hub}</b>
        <p>${l.sats.join(" &middot; ")}</p>
        <span class="g-link" style="pointer-events:none">Learn more<span>${gArrow}</span></span>
      </a>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/* ---- Regional + final CTA ---- */
function gFinal() {
  return `
<section class="g-band g-band--deep">
  <div class="g-wrap">
    ${gIntro("Regional moving", "Moving outside our service areas? We have options.",
      `Call ${C.CONTACT.phone} or email ${C.CONTACT.email} to see how we can get you there and save thousands on traditional moving companies.`,
      gBtn(url("regional-remote"), "Portabox Regional Solution", "yellow"))}
  </div>
</section>

<section class="g-band g-band--cyan" id="quote">
  <div class="g-wrap">
    <div class="g-intro" style="margin-bottom:2.5rem">
      <div class="g-rise">${gLabel("Ready to get started?")}<h2 class="g-h2">Get your free quote today.</h2></div>
      <div class="g-rise" style="--d:110ms">
        <p class="g-body">See how much you can save. One field, no email address &mdash; we will tell you which depot covers you.</p>
      </div>
    </div>
    <div class="g-rise">
      <form class="g-form quote-form" novalidate>
        <label class="sr-only" for="g-pc">Delivery postcode</label>
        <input id="g-pc" type="text" inputmode="numeric" maxlength="4" placeholder="Your postcode">
        <button class="g-btn g-btn--yellow" type="submit"><span>Get my instant quote</span><i>${gArrow}</i></button>
      </form>
      <div class="g-btns" style="margin-top:1.75rem">${gBtn(C.CONTACT.tel, "Call " + C.CONTACT.phone, "line")}</div>
    </div>
  </div>
</section>`;
}

/* ---- Footer ---- */
function gFooter() {
  const col = (h, links) =>
    `<div><h4>${h}</h4><ul>${links.map(([t, u]) => `<li><a href="${u}">${t}</a></li>`).join("")}</ul></div>`;
  return `
${/* Service areas, lifted out of the footer into a band of its own.
      Twenty-three regions in one footer column ran taller than everything
      beside it; grouped by depot they fit, but they still read as small
      print. On cyan above the navy footer they are a section someone can
      actually scan, and the grouping is the client's own — their existing
      footer lists coverage the same way. Cyan on navy is also the house
      alternation rather than a one-off colour. */ ""}
<section class="g-band g-areas">
  <div class="g-wrap">
    <div class="g-areas-head">
      <p class="g-label">Where we deliver</p>
      <h2>Four depots, and a long way around each of them</h2>
    </div>
    <div class="g-areas-grid">
      ${["brisbane", "sydney", "melbourne", "adelaide"].map((d) => {
        const mine = C.REGIONS.filter((r) => r.depot === d);
        const head = mine.find((r) => r.slug === d);
        const rest = mine.filter((r) => r !== head);
        return `<div class="g-areas-col">
        <h3><span class="g-areas-pin">${ICON.pin}</span><a href="${url(head.slug)}">${head.name}</a></h3>
        <ul>${rest.map((r) => `<li><a href="${url(r.slug)}">${r.name}</a></li>`).join("")}</ul>
      </div>`;
      }).join("\n      ")}
    </div>
    <p class="g-areas-more">
      <a href="${url("locations")}">All locations</a>
      <a href="${url("facilities")}">Storage facilities</a>
      <a href="${url("regional-remote")}">Outside these areas?</a>
    </p>
  </div>
</section>

<footer class="g-foot">
  <div class="g-wrap">
    <div class="g-foot-grid">
      <div class="g-foot-brand">
        ${/* The multicolour mark, as the review sheet asks: "Dark version of the
      logo / Please utilise the multicolour version". White portabox on
      navy loses the cyan half of the wordmark entirely. */ ""}
        <img src="${IMG}logo-multicolour.png" alt="Portabox" width="166" height="38" style="height:38px;width:auto">
        <p class="g-foot-blurb">
          Australia&rsquo;s largest portable storage containers. Better value per cubic metre.
          Hydraulic lift system. You keep the only keys.
        </p>
        <ul class="g-foot-contact">
          <li><a href="${C.CONTACT.tel}">${gPhone}<span>${C.CONTACT.phone}</span></a></li>
          <li><a href="${C.CONTACT.mailto}">${gMail}<span>${C.CONTACT.email}</span></a></li>
        </ul>
        <div class="g-foot-hours">
          <h3>Opening hours</h3>
          <dl>
            ${C.CONTACT.hours.map(([where, when]) =>
              `<div><dt>${where}</dt><dd>${when}</dd></div>`).join("\n            ")}
          </dl>
        </div>
        <ul class="g-foot-social">
          ${C.CONTACT.social.map(([name, url]) =>
            `<li><a href="${url}" aria-label="Portabox on ${name}" rel="noopener">${gSocial[name] || ""}</a></li>`).join("\n          ")}
        </ul>
      </div>
      ${col("Company", [
        ["Home", url("index")],
        ["About us", url("about-us")],
        ["How it works", url("how-it-works")],
        ["Meet EARL", url("earl")],
        ["Instant quote", C.CONTACT.quote],
        ["Contact us", url("contact-us")],
      ])}
      ${col("Storage services", C.STORAGE_SERVICES.map((s) => [s.title, url(s.slug)]).concat([["Container sizes", url("container-sizes")], ["Pricing &amp; sizes", url("pricing")]]))}
      ${col("Moving services", C.MOVING_SERVICES.map((s) => [s.title, url(s.slug)]))}
    </div>

    <div class="g-foot-legal">
      <p>&copy; <span class="yr">2026</span> portabox.au. All rights reserved.</p>
      <p style="display:flex;gap:1.5rem;flex-wrap:wrap">
        <a href="https://portabox.au/terms-and-conditions/">Terms and Conditions</a>
        <a href="https://portabox.au/privacy-policy/">Privacy Policy</a>
      </p>
    </div>
  </div>
</footer>`;
}

/* ---- Page ---- */
PAGES.push({
  file: outFile("index"),
  standalone: true,
  bodyClass: "g",
  css: "giga.css",
  js: "giga.js",
  title: "Portabox — Storage That Stays at Your Place",
  desc: "Australia's largest portable storage containers. Delivered to your door. No stressful depot trips, no inflated prices. From $209 per month.",
  body: [
    gNav(),
    `<main id="main">`,
    gHero(),
    gServices(),
    gJourney(),
    gWhy(),
    gEarl(),
    gSpecs(),
    gPricing(),
    gStats(),
    gPriceMatch(),
    gQuotes(),
    gStoreWithUs(),
    gRegions(),
    gFinal(),
    `</main>`,
    gFooter(),
  ].join("\n"),
});

/* ---------- Emit ---------- */

/* ---------- Technical SEO (build sheet, batch 1 items 9–11) ----------

   The sheet's note on the schema layer is "Zero structured data exists on the
   site today", and the same was true of robots.txt and the sitemap. All three
   are generated from the pages that actually exist, so they cannot drift.

   SITE_ORIGIN is what the sitemap and the JSON-LD are absolute against. It
   has to be the live domain to be any use to a crawler, so it is overridable
   at build time for preview deploys. */
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://portabox.au").replace(/\/+$/, "");

function writeRobots() {
  fs.writeFileSync(path.join(OUT, "robots.txt"), [
    "# portabox.au",
    "User-agent: *",
    "Allow: /",
    "",
    "# The quote is a separate application on its own host.",
    "Disallow: /get-a-quote/",
    "",
    "Sitemap: " + SITE_ORIGIN + "/sitemap.xml",
    "",
  ].join("\n"), "utf8");
}

function writeSitemap(urls) {
  /* Priority is a hint rather than a ranking factor, but it costs nothing to
     say which pages matter: the homepage, then the region hubs batch 2 is
     built around, then the rest. */
  const rank = (u) =>
    u === "/" ? "1.0"
    : /^\/self-storage\/[^/]+\/$/.test(u) ? "0.9"
    : /^\/(pricing|how-it-works|container-sizes)\/$/.test(u) ? "0.8"
    : "0.6";

  const today = new Date().toISOString().slice(0, 10);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => [
      "  <url>",
      "    <loc>" + SITE_ORIGIN + u + "</loc>",
      "    <lastmod>" + today + "</lastmod>",
      "    <priority>" + rank(u) + "</priority>",
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), body, "utf8");
  return urls.length;
}

/* Only facts already published on the site go into the markup. The depot
   addresses and phone numbers come from the build sheet; the rates come from
   SIZES. No aggregateRating, no review count, no founding date — none have
   been supplied, and inventing them in markup is no better than inventing
   them in copy, with the added problem that Google penalises it. */
function schemaFor(p, pageUrl) {
  const graph = [{
    "@type": "Organization",
    "@id": SITE_ORIGIN + "/#organization",
    name: "Portabox",
    alternateName: ["PODS Australia", "AusPods"],
    url: SITE_ORIGIN + "/",
    telephone: C.CONTACT.phone,
    email: C.CONTACT.email,
    areaServed: "AU",
    sameAs: C.CONTACT.social.map((s) => s[1]),
  }];

  const region = C.REGIONS.find((r) => url(r.slug) === pageUrl);
  if (region) {
    const d = C.DEPOTS[region.depot];
    const cheapest = C.SIZES.reduce((a, s) => Math.min(a, s.rate), Infinity);
    graph.push({
      "@type": "SelfStorage",
      "@id": SITE_ORIGIN + pageUrl + "#business",
      name: "Portabox — Self Storage " + region.name,
      parentOrganization: { "@id": SITE_ORIGIN + "/#organization" },
      url: SITE_ORIGIN + pageUrl,
      telephone: d.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: d.addr.split(",")[0].trim(),
        addressLocality: d.suburb,
        addressRegion: d.state,
        postalCode: d.postcode,
        addressCountry: "AU",
      },
      areaServed: { "@type": "City", name: region.name },
      makesOffer: {
        "@type": "Offer",
        priceCurrency: "AUD",
        price: String(cheapest),
        description: "Portable storage container delivered to your address, per month",
      },
    });
  }

  if (p.faqs && p.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": SITE_ORIGIN + pageUrl + "#faq",
      mainEntity: p.faqs.map((f) => ({
        "@type": "Question",
        name: f[0],
        acceptedAnswer: { "@type": "Answer", text: String(f[1]).replace(/<[^>]+>/g, "").trim() },
      })),
    });
  }

  /* Breadcrumbs from the path itself, so they cannot disagree with the trail
     printed on the page. */
  const parts = pageUrl.split("/").filter(Boolean);
  if (parts.length) {
    const crumbs = [["Home", "/"]];
    let acc = "";
    parts.forEach((seg) => {
      acc += "/" + seg;
      const name = seg.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
      crumbs.push([name, acc + "/"]);
    });
    graph.push({
      "@type": "BreadcrumbList",
      "@id": SITE_ORIGIN + pageUrl + "#breadcrumbs",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem", position: i + 1, name: c[0], item: SITE_ORIGIN + c[1],
      })),
    });
  }

  return '<script type="application/ld+json">' +
    JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") +
    "</script>";
}


let n = 0;
const emitted = [];
PAGES.forEach((p) => {
  // The homepage carries its own nav/footer inside p.body; every other page
  // gets the same giga chrome wrapped around its sections here.
  p.path = "/" + p.file.replace(/index\.html$/, "");

  /* A redirect page carries no chrome and no assets — it exists so the URL
     keeps working on hosts that cannot do a server-side redirect, and so a
     visitor with JavaScript off still gets there. The canonical points at the
     destination and robots are told not to index this shell. */
  if (p.redirect) {
    const to = p.redirect;
    const shell = `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.title}</title>
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E385D;color:#fff;
       font:400 16px/1.6 Montserrat,"Helvetica Neue",Arial,sans-serif;text-align:center;padding:1.5rem}
  a{color:#1EC4F4}
</style>
</head>
<body>
<main>
  <p>Taking you to the Portabox instant quote&hellip;</p>
  <p><a href="${to}">Continue to the quote</a></p>
</main>
<script>
  /* Carry the postcode through, so a hand-off that lands here rather than on
     the redirect still arrives with step 1 answered. */
  (function () {
    var q = location.search || "";
    location.replace(${JSON.stringify(to)} + (q ? (${JSON.stringify(to)}.indexOf("?") > -1 ? "&" + q.slice(1) : q) : ""));
  })();
</script>
</body>
</html>`;
    emitted.push(p.path);
    const rdest = path.join(OUT, p.file);
    fs.mkdirSync(path.dirname(rdest), { recursive: true });
    fs.writeFileSync(rdest, shell, "utf8");
    n++;
    console.log(`  ${String(Math.round(shell.length / 1024)).padStart(4)}KB  ${p.file}  -> ${to}`);
    return;
  }

  const gp = Object.assign({}, p, { bodyClass: "g", css: "giga.css", js: "giga.js" });
  const tail = `\n<script src="${asset("assets/js/giga.js")}"></script>\n</body>\n</html>`;
  let html = p.standalone
    ? standaloneHead(p) + p.body + `\n<script src="${asset("assets/js/" + p.js)}"></script>\n</body>\n</html>`
    : standaloneHead(gp) + gNav() + `\n<main id="main">\n` + alternate(p.body.replace(JOURNEY_SLOT, gJourney)) + `\n</main>\n` + gFooter() + tail;

  /* A page with a postcode box also carries the suburb table its suggestion
     popup reads — 1.8 KB, and only on the pages that have one. The hero form
     is added by the chrome, so this tests the finished page rather than the
     body it was built from. */
  if (/class="g-form quote-form"|<form class="g-qf-main"| data-qf\b/.test(html)) {
    html = html.replace("</body>", QUOTE_SUBURBS + "\n</body>");
  }

  /* A page that does not open on a photo hero gets a solid nav from the
     first paint, so the white logo never lands on a white card. */
  if (!/class="g-hero|class="g-phero/.test(html)) {
    html = html.replace('<header class="g-nav"', '<header class="g-nav is-stuck"');
  }

  /* Structured data goes in the head, next to the canonical it agrees with. */
  html = html.replace("</head>", schemaFor(p, p.path) + "\n</head>");
  emitted.push(p.path);

  const dest = path.join(OUT, p.file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html, "utf8");
  n++;
  console.log(`  ${String(Math.round(html.length / 1024)).padStart(4)}KB  ${p.file}`);
});

/* robots.txt and the sitemap are written from the pages just emitted, so a
   page that exists is listed and one that does not cannot be. */
/* Pages that moved leave their old file behind: the generator writes, it has
   never removed. /locations/<city>/ sat in the output for a whole restructure
   after the hubs moved to /self-storage/<city>/ — redirected in production, so
   invisible, but still deployed and still being audited as though live.

   Only index.html files are pruned, and only ones this run did not write.
   Assets are not touched. */
const kept = new Set(emitted);
const stale = [];
(function sweep(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (f.name !== "assets") sweep(p); continue; }
    if (f.name !== "index.html") continue;
    const u = "/" + path.relative(OUT, p).split(path.sep).join("/").replace(/index\.html$/, "");
    if (!kept.has(u)) { fs.rmSync(p, { force: true }); stale.push(u); }
  }
})(OUT);
  /* A directory the prune emptied is stale too. */
  (function tidy(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (!f.isDirectory() || f.name === "assets") continue;
      const p = path.join(d, f.name);
      tidy(p);
      if (!fs.readdirSync(p).length) fs.rmdirSync(p);
    }
  })(OUT);

if (stale.length) console.log(`  pruned ${stale.length} page(s) left by an earlier structure: ${stale.join(", ")}`);

writeRobots();
const inSitemap = writeSitemap(emitted.filter((u) => !/^\/get-a-quote\//.test(u)).sort());

console.log(`\n${n} pages written to site/`);
console.log(`robots.txt, sitemap.xml (${inSitemap} URLs), JSON-LD on every page`);
