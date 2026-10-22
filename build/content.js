/* =================================================================
   Portabox — site content.
   Every commercial fact here comes from portabox.au. Nothing about
   ratings, review counts, years trading or delivery totals appears,
   because the business has not published those. Container linear
   dimensions are marked indicative wherever they are shown.
   ================================================================= */


/* ---------- Routes ----------
   The scope of work specifies the live URL of every page, and the 301 map from
   auspods.com.au is built against these exact paths. Keep them here so a path
   change is one edit, not a search across every template. */
const ROUTES = {
  "index":                 "/",
  "instant-quote":         "/get-a-quote/",
  "pricing":               "/pricing/",
  "container-sizes":       "/container-sizes/",
  "how-it-works":          "/how-it-works/",
  "storage-services":      "/storage/",
  "storage-at-your-place": "/storage/self-storage/",
  "store-with-us":         "/storage/store-with-us/",
  "renovation-storage":    "/storage/renovating/",
  "business-storage":      "/business/",
  "moving-services":       "/moving/",
  "interstate-moves":      "/moving/moving-interstate/",
  "local-moves":           "/moving/moving-locally/",
  "regional-remote":       "/moving/regional-solution/",
  /* The region hubs moved to /self-storage/<city>/ for the SEO build (batch 2
     of Portabox-SEO-Build-Sheet.xlsx). The old /locations/<city>/ URLs 301 to
     them from vercel.json — they carry the Search Console history, so the
     redirect matters more than the new URL does. */
  "locations":             "/locations/",
  "south-east-queensland": "/self-storage/brisbane/",
  "greater-sydney":        "/self-storage/sydney/",
  "victoria":              "/self-storage/melbourne/",
  "south-australia":       "/self-storage/adelaide/",
  "brisbane":              "/self-storage/brisbane/",
  "sydney":                "/self-storage/sydney/",
  "melbourne":             "/self-storage/melbourne/",
  "adelaide":              "/self-storage/adelaide/",
  "gold-coast":            "/self-storage/gold-coast/",
  "central-coast":         "/self-storage/central-coast/",
  "newcastle":             "/self-storage/newcastle/",
  "wollongong":            "/self-storage/wollongong/",
  "regional-australia":    "/locations/regional-australia/",
  /* One page per depot. A depot serves more than one region — Blacktown
     covers Sydney, the Central Coast, Newcastle and Wollongong — so these
     are keyed by depot rather than by region. */
  /* Batch 6 format pages, batch 8 box shop, batch 9 comparison and trust. */
  "storage-pods":                "/storage-pods/",
  "mobile-storage":              "/mobile-storage/",
  "portable-storage-containers": "/portable-storage-containers/",
  "moving-pods":                 "/moving-pods/",
  "storage-size-calculator":     "/storage-size-calculator/",
  "moving-boxes":                "/moving-boxes/",
  "moving-boxes-brisbane":       "/moving-boxes/brisbane/",
  "packing-supplies":            "/packing-supplies/",
  "box-shop":                    "/box-shop/",
  "compare-mobile-vs-self":      "/compare/mobile-storage-vs-self-storage/",
  "compare-pods-vs-unit":        "/compare/storage-pods-vs-storage-unit/",
  "compare-pods-vs-truck":       "/compare/moving-pods-vs-truck-hire/",
  "compare-portabox-vs-taxibox": "/compare/portabox-vs-taxibox/",
  "reviews":                     "/reviews/",
  "formerly-pods-australia":     "/formerly-pods-australia/",
  "facilities":            "/facilities/",
  "facility-brisbane":     "/facilities/brisbane/",
  "facility-sydney":       "/facilities/sydney/",
  "facility-melbourne":    "/facilities/melbourne/",
  "facility-adelaide":     "/facilities/adelaide/",
  "about-us":              "/about/",
  "contact-us":            "/contact/",
};

/* Where the quote app lives. A free vercel.app subdomain belongs to whoever
   owns the Vercel project, so this address changes the moment the project
   moves accounts — and it is referenced from the CTAs, from the redirect in
   vercel.json, and from the quote app's own back arrow. Keeping it in one
   overridable place means the move is a setting, not a hunt through strings.
   verify-site.cjs checks vercel.json still agrees with this. */
const QUOTE_APP = (process.env.QUOTE_APP_URL || "https://portabox-instant-quote.vercel.app")
  .replace(/\/+$/, "") + "/";

const CONTACT = {
  phone: "1800 467 637",
  tel: "tel:1800467637",
  email: "sales@portabox.au",
  mailto: "mailto:sales@portabox.au",
  /* Every "Instant Quote" CTA on the site lands here, and so does the page at
     ROUTES["instant-quote"], which redirects rather than serving a second
     quote flow of its own. The client's own app, deployed from
     github.com/manuelbiocva/portabox-instant-quote. It reads ?postcode=
     so the hero boxes can hand over what the visitor already typed. */
  quoteApp: QUOTE_APP,
  quote: QUOTE_APP,
  quoteForm: "https://portabox.au/get-a-quote/",  // the live form on the old site
  book: "https://app.smartsheet.com/b/form/356f960443654f9fb2ca37f45c4e8ff6",
  priceMatch: "https://app.smartsheet.com/b/form/35c0f3d1f2ab4ddcb16f717266fd86c0",
  contact: "https://portabox.au/contact/",
  social: [
    ["Facebook", "https://www.facebook.com/portabox.au"],
    ["Instagram", "https://www.instagram.com/portabox.au"],
    ["LinkedIn", "https://www.linkedin.com/company/portabox-au"],
  ],
};


/* ---------- Container specifications ----------
   Source: the client's own Instant Quote tool (src/services/pricingEngine.ts,
   CONTAINER_SPECS), supplied Oct 2026. These are the first confirmed external
   dimensions, floor areas and door clearances we have had — PRODUCT.md listed
   them as unsupplied. Monthly rates in that same file disagree with the rates
   on this site and are deliberately NOT taken from it; see SIZES. */
const CONTAINER_SPECS = [
  { id:"small", name:"10 m³ Portabox", vol:10, length:"2.15 m", width:"1.52 m", height:"2.40 m",
    floor:"3.3 m²", door:"1.40 m (W) × 2.10 m (H)",
    fits:"1 bedroom apartment · Queen bed, sofa, fridge, 30–40 boxes", img:"size-s.jpg" },
  { id:"medium", name:"19 m³ Portabox", vol:19, length:"3.75 m", width:"2.20 m", height:"2.40 m",
    floor:"8.2 m²", door:"2.10 m (W) × 2.10 m (H)",
    fits:"2 bedroom home · 2 beds, dining suite, living room, 60–80 boxes", img:"size-m.jpg" },
  { id:"large", name:"25 m³ Portabox", vol:25, length:"4.95 m", width:"2.20 m", height:"2.40 m",
    floor:"10.9 m²", door:"2.10 m (W) × 2.10 m (H)",
    fits:"3 bedroom family home · 3 beds, lounge, outdoor set, 100–120 boxes", img:"size-l.jpg" },
  { id:"combo", name:"35 m³ Combo", vol:35, length:"25 m³ + 10 m³ together", width:"2.20 m & 1.52 m", height:"2.40 m",
    floor:"14.2 m²", door:"Dual ground access doors",
    fits:"4 bedroom large home · 26 to 35 m³ of contents", img:"sizes-three.jpg" },
  { id:"twolarge", name:"50 m³ (two 25 m³)", vol:50, length:"2 × 4.95 m", width:"2.20 m", height:"2.40 m",
    floor:"21.8 m²", door:"Dual large access doors",
    fits:"5 bedroom expansive home · 36 to 50 m³ of contents", img:"yard-stacked.jpg" },
];

/* Rates from the client's Instant Quote tool (pricingEngine.ts DEFAULT_CONFIG,
   supplied Oct 2026). The previous figures here ($259 / $279) did not divide
   into the per-cubic-metre numbers the site advertises: $8.76 only comes out
   of $219 / 25, and $20.90 only out of $209 / 10. Every `per` below is now
   computed from its own rate, so the arithmetic on the page is checkable.
   Awaiting the client's final confirmation — one edit here changes the site. */
const SIZES = [
  { id:"small",  name:"Small",  vol:10, rate:209, per:"20.90", suits:"Apartments and units",
    img:"size-s.jpg", holds:"A one-bedroom flat, or a single room plus whitegoods." },
  { id:"medium", name:"Medium", vol:19, rate:219, per:"11.53", suits:"Two-bedroom homes", flag:"Price drop",
    img:"size-m.jpg", holds:"Two bedrooms, a lounge, a full kitchen and the garage overflow." },
  { id:"large",  name:"Large",  vol:25, rate:219, per:"8.76",  suits:"Three-bedroom homes", flag:"Best value", best:true,
    img:"size-l.jpg", holds:"A whole three-bedroom house, including the shed and the bikes." },
];

const TESTIMONIALS = [
  { q:"Finally, a storage company that doesn't rip you off. When I actually did the sums it worked out about 40% cheaper per cubic metre than the quote I had.",
    n:"Bridget", p:"Adelaide", img:"person-bridget.png" },
  { q:"The hydraulic system is the reason nothing arrived damaged. Everything stayed where I packed it. The staff answered every time I rang, which is not something I can say about the last mob.",
    n:"Dean", p:"Sydney to Brisbane", img:"person-dean.png" },
  { q:"Having the only key mattered more than I expected. It sat in the front yard and I sorted through it a box at a time instead of doing the whole lot in one weekend.",
    n:"Steve", p:"Melbourne", img:"person-steve.png" },
];

/* ---- Navigation ------------------------------------------------- */

const STORAGE_SERVICES = [
  { slug:"storage-at-your-place", title:"Storage at Your Place",
    blurb:"The container is delivered to your address and stays there. Access it whenever you like.", img:"delivery-home.jpg" },
  { slug:"store-with-us", title:"Store With Us",
    blurb:"We collect the loaded container and keep it in a monitored facility. You still hold the only keys.", img:"yard-keys.jpg" },
  { slug:"business-storage", title:"Business & Inventory Storage",
    blurb:"Stock overflow, site equipment and seasonal inventory, stored at your premises or ours.", img:"yard-stacked.jpg" },
  { slug:"renovation-storage", title:"Renovation Storage",
    blurb:"Clear a room or a whole house while the trades work, without anything leaving your property.", img:"hybrid-choice.jpg" },
];

const MOVING_SERVICES = [
  { slug:"local-moves", title:"Local Moves",
    blurb:"Door to door within your metro area. Load once, at your own pace, with no removalist clock running.", img:"staff-tablet.jpg" },
  { slug:"interstate-moves", title:"Interstate Moves",
    blurb:"Brisbane, Sydney, Melbourne and Adelaide, door to door. It travels sealed and it travels level.", img:"sizes-three.jpg" },
  { slug:"regional-remote", title:"Regional & Remote",
    blurb:"Anywhere in Australia, quoted individually. Give us the two postcodes and we will price the run.", img:"outback.jpg" },
];

/* The four depots, straight from the build sheet's "THE FOUR DEPOTS" block.
   The per-depot phone numbers are new — the site had only the 1800 number. */
const DEPOTS = {
  /* cbdKm is road distance from the depot to its CBD, computed from the
     coordinates in build/quote-data.json. Sydney and Melbourne come from the
     prototype's measured-routes table; Brisbane and Adelaide use its road
     factor over the straight line, so they are close rather than surveyed. */
  brisbane:  { name:"Brisbane depot",  addr:"9 Citywest Court, Gilberton QLD 4208",      suburb:"Gilberton",       state:"QLD", postcode:"4208", cbdKm:44, cbd:"Brisbane CBD",  phone:"07 3053 8770", tel:"tel:0730538770" },
  sydney:    { name:"Sydney depot",    addr:"20 Carnegie Place, Blacktown NSW 2148",     suburb:"Blacktown",       state:"NSW", postcode:"2148", cbdKm:38, cbd:"Sydney CBD",    phone:"02 8310 8188", tel:"tel:0283108188" },
  melbourne: { name:"Melbourne depot", addr:"103 Fitzgerald Road, Laverton North VIC 3026", suburb:"Laverton North", state:"VIC", postcode:"3026", cbdKm:22, cbd:"Melbourne CBD", phone:"03 8375 8770", tel:"tel:0383758770" },
  adelaide:  { name:"Adelaide depot",  addr:"10 Barfield Crescent, Edinburgh North SA 5113", suburb:"Edinburgh North", state:"SA", postcode:"5113", cbdKm:32, cbd:"Adelaide CBD",  phone:"08 7160 3333", tel:"tel:0871603333" },
};

/* The eight region hubs of batch 2. Every suburb page links up to one of
   these, which is why they exist before the suburb pages do.

   `suburbs` is the list that sits beneath each hub, taken from batches 3 to 5
   with its Search Console impressions. `built:true` marks a suburb page that
   actually exists — the hub links those and prints the rest as plain text, so
   a hub never links to a page that has not been built yet.

   The four suburbs the sheet marks CHECK FIRST (Richmond, Queanbeyan,
   Springwood, Mitchell) are deliberately absent: each name exists in more
   than one state and the sheet says to confirm the state before building, or
   the page lands under the wrong hub. */
const REGIONS = [
  { slug:"brisbane", name:"Brisbane", kw:"self storage brisbane", searches:2400, depot:"brisbane",
    img:"r-brisbane.jpg", old:"/locations/brisbane/",
    blurb:"Our Gilberton depot covers Brisbane, Ipswich, Logan and the bay suburbs, and runs south to the Gold Coast.",
    suburbs:[
      { name:"Capalaba", slug:"capalaba", imp:1165, built:false },
      { name:"Yatala", slug:"yatala", imp:1286, built:false },
      { name:"Brendale", slug:"brendale", imp:308, built:false },
      { name:"Aspley", slug:"aspley", imp:370, built:false },
      { name:"Chermside", slug:"chermside", imp:542, built:false },
      { name:"Ipswich", slug:"ipswich", imp:8336, built:false },
      { name:"Browns Plains", slug:"browns-plains", imp:6465, built:false },
      { name:"Logan", slug:"logan", imp:1768, built:false },
      { name:"Milton", slug:"milton", imp:1623, built:false },
      { name:"Indooroopilly", slug:"indooroopilly", imp:1534, built:false },
      { name:"Caboolture", slug:"caboolture", imp:1352, built:false },
      { name:"Coorparoo", slug:"coorparoo", imp:35, built:false },
    ] },

  { slug:"sydney", name:"Sydney", kw:"self storage sydney", searches:2900, depot:"sydney",
    img:"r-sydney.jpg", old:"/locations/sydney/",
    blurb:"Our Blacktown depot covers greater Sydney, from the northern beaches through the inner west to the Hills and out to Penrith.",
    suburbs:[
      { name:"Marrickville", slug:"marrickville", imp:966, built:false },
      { name:"Brookvale", slug:"brookvale", imp:1008, built:false },
      { name:"North Sydney", slug:"north-sydney", imp:1115, built:false },
      { name:"Penrith", slug:"penrith", imp:2528, built:false },
      { name:"Balmain", slug:"balmain", imp:17, built:false },
      { name:"Rozelle", slug:"rozelle", imp:20, built:false },
      { name:"Gladesville", slug:"gladesville", imp:528, built:false },
      { name:"Blacktown", slug:"blacktown", imp:8149, built:false },
      { name:"Castle Hill", slug:"castle-hill", imp:6527, built:false },
      { name:"Artarmon", slug:"artarmon", imp:4467, built:false },
      { name:"Alexandria", slug:"alexandria", imp:3912, built:false },
      { name:"Dee Why", slug:"dee-why", imp:3909, built:false },
      { name:"Hornsby", slug:"hornsby", imp:2849, built:false },
      { name:"Chatswood", slug:"chatswood", imp:2020, built:false },
      { name:"Bondi Junction", slug:"bondi-junction", imp:1635, built:false },
      { name:"Northern Beaches", slug:"northern-beaches", imp:1461, built:false },
      { name:"Burwood", slug:"burwood", imp:1390, built:false },
      { name:"Waterloo", slug:"waterloo", imp:1155, built:false },
      { name:"St Marys", slug:"st-marys", imp:1062, built:false },
      { name:"Manly", slug:"manly", imp:909, built:false },
      { name:"Camperdown", slug:"camperdown", imp:793, built:false },
      { name:"Rosebery", slug:"rosebery", imp:426, built:false },
    ] },

  { slug:"melbourne", name:"Melbourne", kw:"self storage melbourne", searches:3600, depot:"melbourne",
    img:"r-melbourne.jpg", old:"/locations/melbourne/",
    blurb:"Our Laverton North depot covers metropolitan Melbourne, the bayside suburbs, the east and the south-east growth corridor.",
    suburbs:[
      { name:"Moorabbin", slug:"moorabbin", imp:1492, built:false },
      { name:"Tullamarine", slug:"tullamarine", imp:1564, built:false },
      { name:"South Melbourne", slug:"south-melbourne", imp:1909, built:false },
      { name:"Port Melbourne", slug:"port-melbourne", imp:2387, built:false },
      { name:"Mornington", slug:"mornington", imp:3948, built:false },
      { name:"Altona", slug:"altona", imp:522, built:false },
      { name:"North Melbourne", slug:"north-melbourne", imp:730, built:false },
      { name:"Hoppers Crossing", slug:"hoppers-crossing", imp:12151, built:false },
      { name:"Box Hill", slug:"box-hill", imp:11933, built:false },
      { name:"Pakenham", slug:"pakenham", imp:5039, built:false },
      { name:"Cheltenham", slug:"cheltenham", imp:3245, built:false },
      { name:"Carrum Downs", slug:"carrum-downs", imp:3204, built:false },
      { name:"Clayton", slug:"clayton", imp:1004, built:false },
      { name:"Collingwood", slug:"collingwood", imp:25, built:false },
    ] },

  { slug:"adelaide", name:"Adelaide", kw:"self storage adelaide", searches:2400, depot:"adelaide",
    img:"r-adelaide.jpg", old:"/locations/adelaide/",
    blurb:"Our Edinburgh North depot covers metropolitan Adelaide, the northern suburbs, the Hills and down to the south coast.",
    suburbs:[
      { name:"Port Adelaide", slug:"port-adelaide", imp:8914, built:false },
    ] },

  { slug:"gold-coast", name:"Gold Coast", kw:"self storage gold coast", searches:0, depot:"brisbane",
    img:"r-gold-coast.jpg", old:"/locations/gold-coast/",
    blurb:"The Gold Coast is served from our Gilberton depot, north to Hope Island and south across the border to Tweed Heads.",
    suburbs:[
      { name:"Burleigh", slug:"burleigh", imp:2432, built:false },
      { name:"Ormeau", slug:"ormeau", imp:503, built:false },
      { name:"Tweed Heads", slug:"tweed-heads", imp:7062, built:false },
      { name:"Robina", slug:"robina", imp:4409, built:false },
      { name:"Currumbin", slug:"currumbin", imp:2881, built:false },
      { name:"Nerang", slug:"nerang", imp:1715, built:false },
      { name:"Hope Island", slug:"hope-island", imp:1692, built:false },
    ] },

  { slug:"central-coast", name:"Central Coast", kw:"self storage central coast", searches:0, depot:"sydney",
    img:"r-central-coast.jpg", old:"/locations/central-coast/",
    blurb:"The Central Coast and the lower Hunter are served from our Blacktown depot, from Gosford up through Morisset to Maitland.",
    suburbs:[
      { name:"West Gosford", slug:"west-gosford", imp:16460, built:false },
      { name:"Rutherford", slug:"rutherford", imp:4968, built:false },
      { name:"Maitland", slug:"maitland", imp:1260, built:false },
      { name:"Morisset", slug:"morisset", imp:849, built:false },
    ] },

  /* New markets. The sheet notes both sit inside the Blacktown radius and
     neither has an old URL to inherit, so they start from nothing. */
  { slug:"newcastle", name:"Newcastle", kw:"self storage newcastle", searches:0, depot:"sydney", isNew:true,
    img:"r-newcastle.jpg",
    blurb:"Newcastle and the Hunter sit inside our Blacktown delivery radius. Same container, same per-cubic-metre price, delivered to your driveway.",
    suburbs:[] },

  { slug:"wollongong", name:"Wollongong", kw:"self storage wollongong", searches:0, depot:"sydney", isNew:true,
    img:"r-wollongong.jpg",
    blurb:"Wollongong and the Illawarra sit inside our Blacktown delivery radius, down the coast through Thirroul and Port Kembla.",
    suburbs:[
      { name:"Unanderra", slug:"unanderra", imp:736, built:false },
    ] },
];

const LOCATIONS = [
  { slug:"south-east-queensland", title:"South East Queensland", hub:"Brisbane",
    sats:["Gold Coast","Sunshine Coast","Toowoomba","Ipswich","Byron Bay"], img:"step-move.jpg",
    intro:"Our Brisbane depot covers the whole of South East Queensland, from the Sunshine Coast down across the border to Byron Bay, and west to Toowoomba." },
  { slug:"greater-sydney", title:"Greater Sydney", hub:"Sydney",
    sats:["Newcastle","Blue Mountains","Wollongong"], img:"sizes-three.jpg",
    intro:"Our Sydney depot runs the length of the coast from Newcastle to Wollongong, and west over the range into the Blue Mountains." },
  { slug:"victoria", title:"Victoria", hub:"Melbourne",
    sats:["Geelong","Mornington Peninsula","Ballarat","Morwell","Seymour"], img:"couple-driveway.jpg",
    intro:"Our Melbourne depot covers the metro area and reaches out to Geelong, the Mornington Peninsula, Ballarat, Morwell and Seymour." },
  { slug:"south-australia", title:"South Australia", hub:"Adelaide",
    sats:["Victor Harbor","Murray Bridge","Barossa","Gawler","Adelaide Hills"], img:"delivery-home.jpg",
    intro:"Our Adelaide depot covers the metro area, the Hills, the Barossa, and south to Victor Harbor." },
  { slug:"regional-australia", title:"Regional Australia", hub:"Anywhere", regional:true,
    sats:["Western Australia","Tasmania","Northern Territory","Far North Queensland","Outback NSW & SA"], img:"outback.jpg",
    intro:"Outside the four depot radii we quote every job individually — and we still go. Tell us the two postcodes and we will price the run." },
];

/* `short` is the label in the top nav bar; `title` is still used for the mega
   menu heading and the drawer ("All storage services"). The bar has to carry
   seven links plus two CTAs, and the full titles no longer fit on a laptop. */
const NAV = [
  { title:"Storage Services", short:"Storage",   href:"storage-services.html", items:STORAGE_SERVICES },
  { title:"Moving Services",  short:"Moving",    href:"moving-services.html",  items:MOVING_SERVICES },
  { title:"Locations",        short:"Locations", href:"locations.html",        items:LOCATIONS },
];

/* ---- Shared section fragments ----------------------------------- */

const WHY = [
  { ico:"lift",  t:"It lowers level, it never tips",
    b:"A tilt tray slides your load down an incline to get it off the deck. The EARL hydraulic frame lowers the whole container flat to the ground and lifts it flat again." },
  { ico:"cube",  t:"Priced by volume, not by footprint",
    b:"Self-storage sells you a floor area and lets you guess the rest. We publish cubic metres and the rate per cubic metre, so the comparison is arithmetic." },
  { ico:"key",   t:"You hold the only keys",
    b:"Including while the container sits in one of our facilities. Nobody at Portabox keeps a spare, and nobody opens it without you." },
  { ico:"wall",  t:"Flat interior walls",
    b:"No ribs, no wheel arches, nothing to pack around. A flat wall is the difference between stacking cleanly to the ceiling and losing room on every side." },
  { ico:"house", t:"Plain white, by design",
    b:"Built to sit in a suburban driveway for a month without becoming the thing the neighbours talk about. No livery, no hoarding, no site-yellow." },
  { ico:"globe", t:"Four depots, and well past them",
    b:"Standard delivery runs 150–200 km out from Brisbane, Sydney, Melbourne and Adelaide. Past that we quote it as a regional job, and we still go." },
];

const FAQ_GENERAL = [
  ["Do I need to be home for delivery?",
   "Not for a standard placement. We need clear access to the spot and somewhere level to set the container down — a driveway, a hardstand or firm ground. We confirm the details with you before the truck leaves."],
  ["How much notice do you need?",
   "Give us as much as you can, especially around settlement dates and end of month when everyone moves at once. Ring the depot and we will tell you honestly what is available."],
  ["What if it does not all fit?",
   "Take a second container. Because you are charged by the cubic metre rather than by the unit, two Smalls and one Large are simple to compare on price — and our team will help you size it before you book."],
  ["Is my stuff insured?",
   "Contents insurance is arranged separately. Talk to us when you book and we will point you at the right cover for what you are storing."],
  ["Can I change from storing to moving later?",
   "Yes. That is the main advantage of the container staying sealed — if your plans change, we move the same container rather than making you repack."],
];

const FAQ_PRICE = [
  ["What does 'from' pricing mean?",
   "Rates start at $209 a month for the Small and $219 for the Medium and Large. The final figure depends on your location and how long you need it. We give you the number before you commit."],
  ["Do you really beat a cheaper quote?",
   "Yes — not just match it. Send us a written quote with the container volume on it and we will beat the per-cubic-metre rate. That comparison is the whole reason we publish ours."],
  ["Is there a minimum term?",
   "Talk to your depot. Terms vary by location, and we would rather tell you the truth on the phone than print a number that does not apply to you."],
];

module.exports = {
  ROUTES, CONTACT, SIZES, CONTAINER_SPECS, TESTIMONIALS, NAV,
  DEPOTS, REGIONS,
  STORAGE_SERVICES, MOVING_SERVICES, LOCATIONS,
  WHY, FAQ_GENERAL, FAQ_PRICE,
};
