/* Portabox — gigaenergy-style homepage behaviour.
   Standalone: this page loads only this script.
   Reproduces the reference's Lenis smooth scroll, ScrollTrigger-style
   reveals and stat counters without pulling in GSAP or Lenis. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var OUT = 0.115;   // lerp factor; matches the reference's unhurried feel

  /* ---------- Smooth scroll ----------
     Wheel only. Touch keeps native momentum — re-implementing it is always
     worse, and hijacking it breaks pull-to-refresh. */
  function smooth() {
    if (reduce || coarse) return;
    var target = window.scrollY, current = target, running = false;

    function limit() { return document.documentElement.scrollHeight - window.innerHeight; }
    function tick() {
      current += (target - current) * OUT;
      if (Math.abs(target - current) < 0.4) { current = target; running = false; }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(tick);
    }
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = Math.max(0, Math.min(limit(), target + e.deltaY));
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: false });

    ["keydown", "mousedown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, function () { target = current = window.scrollY; }, { passive: true });
    });
    window.addEventListener("resize", function () { target = current = window.scrollY; });
  }

  /* ---------- Nav ---------- */
  function nav() {
    var bar = document.querySelector(".g-nav");
    var hero = document.querySelector(".g-hero");
    if (!bar) return;

    /* The bar is transparent until you scroll past the photo hero. A page
       that opens on a light card instead has nothing to be transparent over,
       and the white logo lands on white — so those start solid. */
    var photoHero = document.querySelector(".g-hero, .g-phero");
    function onScroll() {
      if (!photoHero) { bar.classList.add("is-stuck"); return; }
      var t = hero ? hero.offsetHeight - 80 : 10;
      bar.classList.toggle("is-stuck", window.scrollY > t);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = document.querySelector(".g-burger");
    var drawer = document.getElementById("g-drawer");
    if (!burger || !drawer) return;
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      drawer.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
      if (!open) bar.classList.add("is-stuck"); else onScroll();
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        burger.setAttribute("aria-expanded", "false");
        drawer.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- Mega menu ----------
     Pointer opens on hover, everyone else toggles with the button. The panel
     is a DOM child of .g-mi even though it renders fixed, so moving the mouse
     into it does not fire mouseleave; the short delay covers the strip of nav
     between the button and the panel edge. */
  function mega() {
    var items = [].slice.call(document.querySelectorAll(".g-mi"));
    if (!items.length) return;
    var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    var current = null, closeTimer = 0;

    var panelOf = function (mi) { return mi.querySelector(".g-mega"); };
    var btnOf = function (mi) { return mi.querySelector(".g-menu-t"); };

    function open(mi) {
      if (current === mi) return;
      if (current) close(current, true);
      window.clearTimeout(closeTimer);
      var p = panelOf(mi);
      p.hidden = false;
      void p.offsetWidth;          // start the transition from the closed state
      p.classList.add("is-open");
      btnOf(mi).setAttribute("aria-expanded", "true");
      current = mi;
    }

    function close(mi, now) {
      var p = panelOf(mi);
      if (!p || p.hidden) return;
      p.classList.remove("is-open");
      btnOf(mi).setAttribute("aria-expanded", "false");
      if (current === mi) current = null;
      var finish = function () { if (!p.classList.contains("is-open")) p.hidden = true; };
      if (now || reduce) finish(); else window.setTimeout(finish, 450);
    }

    function later(mi) {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () { close(mi); }, 180);
    }

    items.forEach(function (mi) {
      var btn = btnOf(mi), p = panelOf(mi);
      if (!btn || !p) return;

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (current === mi) close(mi, true); else open(mi);
      });

      if (fine) {
        mi.addEventListener("mouseenter", function () { window.clearTimeout(closeTimer); open(mi); });
        mi.addEventListener("mouseleave", function () { later(mi); });
      }

      // tabbing out of the group closes it
      mi.addEventListener("focusout", function (e) {
        if (!mi.contains(e.relatedTarget)) close(mi, true);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !current) return;
      var btn = btnOf(current);
      close(current, true);
      if (btn) btn.focus();
    });

    document.addEventListener("click", function (e) {
      if (current && !current.contains(e.target)) close(current, true);
    });

    window.addEventListener("scroll", function () {
      if (current) close(current, true);
    }, { passive: true });
  }

  /* ---------- Contact form ----------
     Validates in the browser. There is no endpoint behind it yet, so the
     confirmation says so rather than claiming a message was sent — point the
     form at a real handler (or a WordPress form plugin) before launch. */
  function contactForm() {
    Array.prototype.forEach.call(document.querySelectorAll(".g-cform"), bindValidated);
  }

  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function bindValidated(form) {
    var msg = form.querySelector(".g-cform-msg");
    if (!msg) return;

    function check(f) {
      if (f.type === "radio") {
        return !!form.querySelector('input[name="' + f.name + '"]:checked');
      }
      var v = f.value.trim();
      if (!v) return false;
      if (f.type === "email") {
        if (!EMAIL.test(v)) return false;
        var m = f.getAttribute("data-match");
        if (m) { var other = document.getElementById(m); if (other && other.value.trim() !== v) return false; }
        return true;
      }
      if (f.type === "tel") return v.replace(/\D/g, "").length >= 8;
      return true;
    }

    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true" && check(e.target)) {
        e.target.setAttribute("aria-invalid", "false");
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [], seen = {};
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
        if (f.type === "radio") {
          if (seen[f.name]) return;
          seen[f.name] = 1;
          var ok = check(f);
          if (!ok) bad.push(f);
          return;
        }
        var good = check(f);
        f.setAttribute("aria-invalid", good ? "false" : "true");
        if (!good) bad.push(f);
      });

      if (bad.length) {
        msg.className = "g-cform-msg is-err";
        msg.textContent = bad.length === 1
          ? "One field still needs attention before this can go."
          : bad.length + " fields still need attention before this can go.";
        bad[0].focus();
        return;
      }

      msg.className = "g-cform-msg";
      msg.innerHTML = "<b>" + "Your message is ready." +
        "</b> This form is not connected to a mailbox yet, " +
        "so nothing has been sent. Call <b>1800 467 637</b> or email " +
        "<a href=\"mailto:sales@portabox.au\" style=\"color:inherit\">sales@portabox.au</a> and we will pick it up straight away.";
    });
  }

  /* ---------- Quote form helpers ----------
     Carries a postcode handed over from a small form, and names the depot as
     soon as a postcode is typed. */
  /* ---------- Postcode suggestions ----------
     The postcode boxes used to lean on <datalist>, which the browser draws
     itself: Chrome renders it as a dark panel carrying its own autofill
     chrome, which looks nothing like the page it is sitting on. This is the
     same idea drawn by the site, following the ARIA combobox pattern so the
     keyboard and a screen reader get the same list the mouse does.

     The panel is appended to <body> rather than next to the input. Several
     of the inputs sit inside a .g-rise, which animates the `translate`
     property — and a transformed ancestor becomes the containing block for
     position:fixed, so a panel anchored inside one drifts with the reveal.
     Page coordinates against <body> are immune to that, and <body> carries
     the .g class, so the scoped styles still apply. */
  function suggests() {
    var node = document.getElementById("qf-suburbs");
    if (!node) return;

    var ROWS;
    try { ROWS = JSON.parse(node.textContent); } catch (e) { return; }
    if (!ROWS || !ROWS.length) return;

    var seq = 0;

    function attach(input) {
      var id = "qf-sugg-" + (++seq);
      var list = document.createElement("ul");
      list.className = "g-sugg";
      list.id = id;
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", "Matching postcodes");
      list.hidden = true;
      document.body.appendChild(list);

      input.setAttribute("role", "combobox");
      input.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-controls", id);
      input.setAttribute("aria-autocomplete", "list");
      /* The browser's own history dropdown would cover ours. */
      input.setAttribute("autocomplete", "off");

      var items = [], active = -1, picking = false;

      function place() {
        var r = input.getBoundingClientRect();
        list.style.top = (r.bottom + window.pageYOffset) + "px";
        list.style.left = (r.left + window.pageXOffset) + "px";
        list.style.width = r.width + "px";
      }

      function close() {
        list.hidden = true;
        active = -1;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
      }

      /* Digits match a postcode from the front. Letters match a suburb from
         the front first, then anywhere — so "unley" finds Unley Park and
         "adelaide" still finds North Adelaide. */
      function match(q) {
        q = String(q).trim().toLowerCase();
        if (!q) return [];
        var hits = [], i;
        if (/^[0-9]+$/.test(q)) {
          for (i = 0; i < ROWS.length && hits.length < 8; i++) {
            if (ROWS[i][0].indexOf(q) === 0) hits.push(ROWS[i]);
          }
          return hits;
        }
        for (i = 0; i < ROWS.length && hits.length < 8; i++) {
          if (ROWS[i][1].toLowerCase().indexOf(q) === 0) hits.push(ROWS[i]);
        }
        for (i = 0; i < ROWS.length && hits.length < 8; i++) {
          if (hits.indexOf(ROWS[i]) < 0 && ROWS[i][1].toLowerCase().indexOf(q) > 0) hits.push(ROWS[i]);
        }
        return hits;
      }

      function render() {
        items = match(input.value);
        if (!items.length) { close(); return; }
        var html = "";
        for (var i = 0; i < items.length; i++) {
          html += '<li role="option" aria-selected="false" id="' + id + "-" + i + '">' +
                  "<b>" + items[i][0] + "</b><span>" + items[i][1] + ", " + items[i][2] + "</span></li>";
        }
        list.innerHTML = html;
        place();
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
        active = -1;
      }

      function highlight(i) {
        var all = list.children, k;
        for (k = 0; k < all.length; k++) {
          all[k].className = k === i ? "on" : "";
          all[k].setAttribute("aria-selected", k === i ? "true" : "false");
        }
        active = i;
        if (i < 0) { input.removeAttribute("aria-activedescendant"); return; }
        input.setAttribute("aria-activedescendant", id + "-" + i);
        var el = all[i];
        if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
        else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) {
          list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
        }
      }

      function choose(i) {
        if (!items[i]) return;
        picking = true;
        input.value = items[i][0];
        /* Several suburbs share a postcode — 5061 is Hyde Park, Malvern and
           Unley Park — and the lookup would otherwise answer with whichever
           comes first, contradicting the row they just clicked. */
        input.setAttribute("data-pick", items[i][0] + "|" + items[i][1]);
        close();
        /* Everything downstream — the depot line, the rail, the price — is
           already listening for these, so a pick behaves exactly like a
           typed postcode. */
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        picking = false;
      }

      input.addEventListener("input", function () {
        if (picking) return;
        input.removeAttribute("data-pick");   // typing moves off the chosen row
        render();
      });
      input.addEventListener("focus", function () { if (input.value) render(); });
      /* A click on the panel fires blur first, so give it a beat to land. */
      input.addEventListener("blur", function () { window.setTimeout(close, 150); });

      input.addEventListener("keydown", function (e) {
        if (list.hidden) {
          if (e.key === "ArrowDown" && input.value) {
            render();
            if (!list.hidden) highlight(0);
            e.preventDefault();
          }
          return;
        }
        if (e.key === "ArrowDown") { highlight((active + 1) % items.length); e.preventDefault(); }
        else if (e.key === "ArrowUp") { highlight((active - 1 + items.length) % items.length); e.preventDefault(); }
        else if (e.key === "Enter" && active > -1) { choose(active); e.preventDefault(); }
        else if (e.key === "Escape") { close(); }
        else if (e.key === "Tab") { close(); }
      });

      list.addEventListener("mousedown", function (e) {
        var li = e.target.closest ? e.target.closest("li") : null;
        if (!li) return;
        e.preventDefault();          // hold focus so the blur timer cannot win
        choose(Array.prototype.indexOf.call(list.children, li));
      });
      list.addEventListener("mousemove", function (e) {
        var li = e.target.closest ? e.target.closest("li") : null;
        if (li) highlight(Array.prototype.indexOf.call(list.children, li));
      });

      window.addEventListener("resize", function () { if (!list.hidden) place(); });
      window.addEventListener("scroll", function () { if (!list.hidden) place(); }, { passive: true });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".quote-form input"), attach);
    ["qf-origin", "qf-dest"].forEach(function (x) {
      var el = document.getElementById(x);
      if (el) attach(el);
    });
  }

  /* ---------- Instant quote: the step flow ----------
     A port of the client's React prototype
     (website-changes/Portabox-Instant-Quote-source code): same five steps,
     same pricing engine, same numbers. The data it works on is inlined by
     the build as #qf-data, lifted straight out of the prototype's
     TypeScript by tools/extract-quote-data.cjs — so none of the rates,
     zones or distances below are retyped.

     Where the prototype has no number — zone 4, a postcode it cannot
     place, a blocked destination — this says so and asks for a call
     rather than inventing one. */
  function quoteFlow() {
    var form = document.querySelector("[data-qf]");
    var node = document.getElementById("qf-data");
    if (!form || !node) return;

    var PHONE = "1800 467 637";
    var TEL = "tel:1800467637";

    var D = JSON.parse(node.textContent);
    var Z = D.zones;
    var PANELS = form.querySelectorAll("[data-qf-panel]");
    var CRUMBS = document.querySelectorAll("[data-qf-crumb]");
    var LAST = PANELS.length;

    var S = {
      step: 1, origin: null, dest: null, service: "", placement: "",
      size: "", date: "", win: "", duration: "", billing: "monthly",
      boxes: 0, blankets: 0, reached: 1
    };

    /* ---- postcode lookup ---- */

    /* The prototype ships 63 real suburbs and falls back to a state centroid
       for anything else, so any valid Australian postcode gets an answer and
       the ones it knows get a precise one. */
    var STATE_RANGES = [
      [5000, 5999, "SA", -34.9285, 138.6007, "Adelaide area"],
      [3000, 3999, "VIC", -37.8136, 144.9631, "Melbourne area"],
      [4550, 4575, "QLD", -26.65, 153.06, "Sunshine Coast"],
      [4000, 4999, "QLD", -27.4698, 153.0251, "Brisbane / Gold Coast area"],
      [2600, 2620, "ACT", -35.2819, 149.1189, "Canberra area"],
      [6000, 6999, "WA", -31.9523, 115.8613, "Perth area"],
      [7000, 7999, "TAS", -42.8821, 147.3272, "Tasmania"],
      [800, 999, "NT", -12.4634, 130.8456, "Northern Territory"],
      [1000, 2999, "NSW", -33.8688, 151.2093, "Sydney area"]
    ];

    function lookup(v) {
      var pc = String(v).replace(/\D/g, "").slice(0, 4);
      if (pc.length !== 4) return null;
      for (var i = 0; i < D.postcodes.length; i++) {
        if (D.postcodes[i].postcode === pc) return D.postcodes[i];
      }
      var n = Number(pc);
      for (var j = 0; j < STATE_RANGES.length; j++) {
        var r = STATE_RANGES[j];
        if (n >= r[0] && n <= r[1]) {
          return { postcode: pc, suburb: r[5], state: r[2], lat: r[3], lng: r[4], region: r[5], approx: true };
        }
      }
      return null;
    }

    /* A postcode can cover several suburbs, so when one was chosen from the
       suggestion list that exact record wins over the first match — both for
       what the page says back and for the distance it measures. */
    function picked(input, digits) {
      var mark = input.getAttribute("data-pick");
      if (!mark) return null;
      var parts = mark.split("|");
      if (parts[0] !== digits) return null;
      for (var i = 0; i < D.postcodes.length; i++) {
        if (D.postcodes[i].postcode === digits && D.postcodes[i].suburb === parts[1]) return D.postcodes[i];
      }
      return null;
    }

    function blocked(rec) {
      for (var i = 0; i < D.blocked.length; i++) {
        if (D.blocked[i].postcode === rec.postcode) return D.blocked[i];
      }
      return null;
    }

    /* ---- distance ---- */
    function haversine(a, b) {
      var R = 6371, rad = Math.PI / 180;
      var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(a.lat * rad) * Math.cos(b.lat * rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
    }

    /* Road distance, not crow-flies: measured routes where the prototype has
       them, otherwise the Australian road circuity factor it uses. */
    function driving(a, b) {
      var key = a.postcode + "-" + b.postcode;
      if (D.roads[key]) return D.roads[key];
      var line = haversine(a, b);
      if (!line) return 0;
      var c = line < 20 ? 1.25 : line > 150 ? 1.22 : 1.27;
      return Math.round(line * c);
    }

    function closestDepot(rec) {
      var best = D.depots[0], km = driving(rec, D.depots[0]);
      for (var i = 1; i < D.depots.length; i++) {
        var d = driving(rec, D.depots[i]);
        if (d < km) { km = d; best = D.depots[i]; }
      }
      return { depot: best, km: km };
    }

    function hub(rec) {
      if (rec.state === "SA") return "Adelaide";
      if (rec.state === "VIC") return "Melbourne";
      if (rec.state === "NSW" || rec.state === "ACT") return "Sydney";
      if (rec.state === "QLD") {
        var n = Number(rec.postcode);
        return (n >= 4550 && n <= 4575) ? "Sunshine Coast" : "Brisbane/Gold Coast";
      }
      return null;   // WA, TAS, NT: no depot, so no matrix rate — we say so
    }

    /* ---- supplies ---- */
    function tiered(count, single, p10, p50, p100) {
      if (count <= 0) return 0;
      if (count === 10) return p10;
      if (count === 50) return p50;
      if (count === 100) return p100;
      var total = 0, rem = count;
      total += Math.floor(rem / 100) * p100; rem %= 100;
      if (rem >= 50) { total += p50; rem -= 50; }
      if (rem >= 20 && rem < 50) { total += Math.floor(rem / 10) * p10; rem %= 10; }
      else if (rem >= 10) { total += p10; rem -= 10; }
      total += Math.min(rem * single, p10);
      return Math.round(total * 100) / 100;
    }
    var P = D.supplies;
    var boxPrice = function (n) { return tiered(n, P.boxSinglePrice, P.box10Price, P.box50Price, P.box100Price); };
    var blanketPrice = function (n) { return tiered(n, P.blanketSinglePrice, P.blanket10Price, P.blanket50Price, P.blanket100Price); };

    /* ---- the engine ---- */
    function container(id) {
      for (var i = 0; i < D.containers.length; i++) if (D.containers[i].id === id) return D.containers[i];
      return null;
    }

    function zoneOf(km) {
      return km <= Z.zone1MaxKm ? 1 : km <= Z.zone2MaxKm ? 2 : km <= Z.zone3MaxKm ? 3 : 4;
    }
    function zoneRate(z) {
      return z === 2 ? Z.zone2RatePerKm : z === 3 ? Z.zone3RatePerKm : 0;
    }

    function price() {
      var o = S.origin, c = container(S.size);
      if (!o || !c || !S.service || !S.duration) return null;

      var count = c.count;
      var leg = D.legFee * count;
      var near = closestDepot(o);
      var zone = zoneOf(near.km);
      var kmCharge = (zone === 2 || zone === 3) ? Math.round(near.km * zoneRate(zone)) * count : 0;
      var call = zone === 4 && Z.zone4CallPricing;

      var isMove = S.service === "moving" || S.service === "moving_storage";
      var atFacility = !isMove && S.placement === "facility";
      var dest = isMove ? S.dest : null;

      var moveKm = 0, moveCharge = 0, fuel = 0, interstate = 0, route = "";
      if (dest) {
        moveKm = driving(o, dest);
        var mz = zoneOf(moveKm);
        moveCharge = (mz === 2 || mz === 3) ? Math.round(moveKm * zoneRate(mz)) * count : 0;
        if (mz === 4 && Z.zone4CallPricing) call = true;
        fuel = Math.round(moveKm * D.fuelPerKm * 100) / 100 * count;
        var h1 = hub(o), h2 = hub(dest);
        if (!h1 || !h2) { call = true; }
        else if (h1 !== h2) {
          route = h1 + " → " + h2;
          interstate = (D.interstate[h1 + "->" + h2] || 0) * count;
          /* A line-haul rate replaces the per-kilometre charge, and it is a
             published figure — so a long run stops being a "call us". */
          if (interstate) { call = false; moveCharge = 0; fuel = 0; }
          else { call = true; }
        }
      } else if (near.km > Z.zone1MaxKm) {
        fuel = Math.round(near.km * D.fuelPerKm * 100) / 100 * count;
      }

      /* Legs, exactly as the prototype orders them. An A-to-B move never
         detours via the depot, so it is never charged for one. */
      var legs = [];
      if (!isMove && !atFacility) {
        legs.push(["Delivery to " + o.suburb + " (empty)", leg + kmCharge + fuel, true]);
        legs.push(["Collection when you are done (empty)", leg, false]);
      } else if (atFacility) {
        legs.push(["Delivery to " + o.suburb + " (empty)", leg + kmCharge + fuel, true]);
        legs.push(["Transport to the Portabox facility (full)", leg, false]);
        legs.push(["Redelivery when you want it back (full)", leg, false]);
        legs.push(["Final pickup of the empty container", leg, false]);
      } else {
        legs.push(["Delivery to " + o.suburb + " (empty)", leg + kmCharge, true]);
        if (interstate) {
          legs.push(["Interstate transport (" + route + ")", interstate, false]);
          legs.push(["Delivery and collection at " + (dest ? dest.suburb : "the destination"), leg, false]);
        } else {
          legs.push(["Move to " + (dest ? dest.suburb : "the destination") + " (full)", leg + moveCharge + fuel, false]);
          legs.push(["Final pickup at " + (dest ? dest.suburb : "the destination"), leg, false]);
        }
      }

      /* Storage rent. Weekly and monthly are the published rates; paying
         further ahead takes the prototype's discount off the monthly. */
      var rent = 0, cycleLabel = "Monthly", saving = 0;
      var b = S.billing;
      if (b === "weekly") {
        rent = S.duration === "2_weeks" ? c.wk * 2 : c.wk;
        cycleLabel = S.duration === "2_weeks" ? "First 2 weeks" : "Per week";
      } else if (b === "monthly") {
        rent = c.mo; cycleLabel = "Per month";
        saving = Math.round(c.wk * (52 / 12)) - c.mo;
      } else {
        var months = b === "3_months_upfront" ? 3 : b === "6_months_upfront" ? 6 : 12;
        var off = months === 3 ? 0.05 : months === 6 ? 0.10 : 0.15;
        rent = Math.round(c.mo * months * (1 - off));
        cycleLabel = months + " months upfront";
        saving = c.wk * (months === 12 ? 52 : months === 6 ? 26 : 13) - rent;
      }

      var supplies = boxPrice(S.boxes) + blanketPrice(S.blankets);
      var firstLeg = legs[0][1];
      var later = 0;
      for (var i = 1; i < legs.length; i++) later += legs[i][1];

      return {
        container: c, count: count, depot: near.depot, depotKm: near.km, zone: zone,
        legs: legs, rent: rent, cycleLabel: cycleLabel, saving: saving,
        supplies: supplies, boxes: boxPrice(S.boxes), blankets: blanketPrice(S.blankets),
        today: Math.round(rent + firstLeg + supplies), later: Math.round(later),
        call: call, interstate: interstate, route: route,
        moveKm: moveKm, dest: dest, isMove: isMove, atFacility: atFacility,
        approx: !!(o.approx || (dest && dest.approx))
      };
    }

    /* ---- rendering ---- */
    var money = function (n) { return "$" + Math.round(n).toLocaleString("en-AU"); };

    function depotSay(box, rec, isDest) {
      box.hidden = false;
      box.className = "g-qf-depot";
      if (!rec) {
        box.classList.add("is-err");
        box.textContent = "That is not an Australian postcode. Four digits, like 5000 or 3121.";
        return false;
      }
      var stop = blocked(rec);
      if (stop) {
        box.classList.add("is-err");
        box.textContent = rec.postcode + " (" + stop.suburb + ") is not somewhere we can deliver. " +
          stop.reason + " Call " + PHONE + " and we will talk it through.";
        return false;
      }
      var near = closestDepot(rec);
      var h = hub(rec);
      var where = "<b>" + rec.suburb + ", " + rec.state + " " + rec.postcode + "</b>";
      if (!h) {
        box.classList.add("is-warn");
        box.innerHTML = where + " sits outside our four depots, so it runs as a Regional Solution job " +
          "we quote by hand. Keep going and we will price the container, then call " + PHONE + " about the run.";
        return true;
      }
      var z = zoneOf(near.km);
      if (z === 4) {
        box.classList.add("is-warn");
        box.innerHTML = where + " is " + near.km + " km from our " + near.depot.suburb +
          " depot — past the " + Z.zone3MaxKm + " km band, so the delivery is quoted individually.";
        return true;
      }
      box.innerHTML = where + (isDest ? " · delivered from " : " · served by ") +
        "<b>" + near.depot.name + "</b>, " + near.km + " km away" +
        (z === 1 ? " — inside the free delivery radius." :
                   " — zone " + z + ", $" + zoneRate(z) + " per km.");
      return true;
    }

    function summary() {
      var box = form.querySelector("[data-qf-summary]");
      if (!box) return;
      var q = price();
      if (!q) { box.innerHTML = '<h4>Your estimate</h4><p class="g-qf-sum-note">Answer the four steps and the price appears here.</p>'; return; }

      var rows = "";
      rows += "<dt>" + q.container.name + "</dt><dd>" + q.container.vol + "</dd>";
      rows += "<dt>Storage, " + q.cycleLabel.toLowerCase() + "</dt><dd>" + money(q.rent) + "</dd>";
      rows += "<dt>" + q.legs[0][0] + "</dt><dd>" + money(q.legs[0][1]) + "</dd>";
      if (q.supplies > 0) rows += "<dt>Packing supplies</dt><dd>" + money(q.supplies) + "</dd>";

      var later = "";
      for (var i = 1; i < q.legs.length; i++) {
        later += "<dt>" + q.legs[i][0] + "</dt><dd>" + money(q.legs[i][1]) + "</dd>";
      }

      box.innerHTML =
        "<h4>Your estimate</h4>" +
        "<dl>" + rows +
          '<div class="g-qf-sum-rule"></div>' +
          '<div class="g-qf-sum-tot"><span>Due on delivery</span><b>' + money(q.today) + "</b></div>" +
        "</dl>" +
        (later ? '<div class="g-qf-sum-later"><h4>Later, as they happen</h4><dl>' + later +
                 '<div class="g-qf-sum-rule"></div><div class="g-qf-sum-tot"><span>Remaining legs</span><b>' +
                 money(q.later) + "</b></div></dl></div>" : "") +
        '<p class="g-qf-sum-note">' +
          (q.call
            ? "Part of this run sits outside our standard bands, so the transport is quoted by hand — the container rate above is firm. "
            : "") +
          (q.approx ? "We placed your postcode by region rather than suburb, so the distance is approximate. " : "") +
          "An estimate, not an invoice. We confirm access, the date and the final figure before anything is charged. " +
          'Questions: <a href="' + TEL + '">' + PHONE + "</a>.</p>";
    }

    /* ---- step machine ---- */
    function label(n) {
      if (n === 1) return S.origin ? S.origin.suburb + " " + S.origin.postcode : "";
      if (n === 2) {
        var t = { moving: "Moving", storage: "Storage", moving_storage: "Moving and storage" }[S.service] || "";
        if (S.service === "storage" && S.placement) t += S.placement === "my_place" ? ", at my place" : ", at a facility";
        if (S.dest && (S.service === "moving" || S.service === "moving_storage")) t += " to " + S.dest.suburb;
        return t;
      }
      if (n === 3) { var c = container(S.size); return c ? c.name : ""; }
      if (n === 4) {
        var d = { "2_weeks": "2 weeks", "1_to_3_months": "1–3 months",
                  "4_to_11_months": "4–11 months", "12_plus_months": "12 months or more" }[S.duration] || "";
        if (!S.date) return d;
        /* The input hands back an ISO date; the rail should read like a date. */
        var parts = S.date.split("-");
        var when = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d + ", from " + when.toLocaleDateString("en-AU",
          { weekday: "short", day: "numeric", month: "short" });
      }
      return "";
    }

    function show(n, quiet) {
      S.step = n;
      S.reached = Math.max(S.reached, n);
      Array.prototype.forEach.call(PANELS, function (p) {
        p.hidden = Number(p.getAttribute("data-qf-panel")) !== n;
      });
      Array.prototype.forEach.call(CRUMBS, function (li) {
        var k = Number(li.getAttribute("data-qf-crumb"));
        li.className = k === n ? "now" : k < n ? "done" : "";
        var btn = li.querySelector("button");
        btn.disabled = k > S.reached;
        li.querySelector(".g-qf-crumb-v").textContent = k < n ? label(k) : "";
      });
      if (n === LAST) summary();
      if (quiet) return;
      var head = form.querySelector('[data-qf-panel="' + n + '"] .g-qf-q');
      if (head) { head.setAttribute("tabindex", "-1"); head.focus({ preventScroll: true }); }
      var shell = document.querySelector(".g-qf-shell");
      if (shell) {
        var top = shell.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      }
    }

    /* Each step says what is missing rather than refusing silently. */
    function problem(n) {
      if (n === 1) {
        if (!S.origin) return ["qf-origin", "We need the delivery postcode before we can price anything."];
        if (blocked(S.origin)) return ["qf-origin", "We cannot deliver to that postcode. Call " + PHONE + "."];
      }
      if (n === 2) {
        if (!S.service) return [null, "Pick moving, storage, or both."];
        if (S.service === "storage" && !S.placement) return [null, "Tell us where the container will live."];
        if ((S.service === "moving" || S.service === "moving_storage") && !S.dest)
          return ["qf-dest", "We need the destination postcode."];
        if (S.dest && blocked(S.dest)) return ["qf-dest", "We cannot deliver to that destination. Call " + PHONE + "."];
      }
      if (n === 3 && !S.size) return [null, "Pick a container size."];
      if (n === 4) {
        if (!S.date) return ["qf-date", "Pick a delivery date — we will confirm the window with you."];
        if (!S.duration) return [null, "Tell us roughly how long you need it."];
      }
      return null;
    }

    function complain(n) {
      var p = problem(n);
      if (!p) return false;
      var panel = form.querySelector('[data-qf-panel="' + n + '"]');
      var box = panel.querySelector("[data-qf-problem]");
      if (!box) {
        box = document.createElement("p");
        box.className = "g-qf-depot is-err";
        box.setAttribute("data-qf-problem", "");
        box.setAttribute("role", "status");
        panel.querySelector(".g-qf-nav").insertAdjacentElement("beforebegin", box);
      }
      box.hidden = false;
      box.textContent = p[1];
      if (p[0]) { var f = document.getElementById(p[0]); if (f) f.focus(); }
      return true;
    }

    function clearComplaint(n) {
      var box = form.querySelector('[data-qf-panel="' + n + '"] [data-qf-problem]');
      if (box) box.hidden = true;
    }

    /* ---- wiring ---- */

    function bindPostcode(id, boxSel, set, isDest) {
      var input = document.getElementById(id);
      var box = form.querySelector(boxSel);
      if (!input || !box) return;
      var say = function () {
        /* The label offers a suburb as well as a postcode, so letters are
           left alone instead of being stripped out from under the typist —
           the suggestion list turns the suburb into its postcode when one is
           picked. Until there are four digits there is nothing to look up,
           and saying so would only be noise while they are still typing. */
        var raw = input.value;
        var digits = raw.replace(/\D/g, "");
        if (/^[0-9]*$/.test(raw) && raw.length > 4) {
          digits = digits.slice(0, 4);
          input.value = digits;
        }
        if (digits.length !== 4) { box.hidden = true; set(null); return; }
        var rec = picked(input, digits) || lookup(digits);
        depotSay(box, rec, isDest);
        set(rec && !blocked(rec) ? rec : null);
      };
      input.addEventListener("input", say);
      input.addEventListener("change", say);
      input.__say = say;
    }

    bindPostcode("qf-origin", "[data-qf-depot]", function (r) { S.origin = r; clearComplaint(1); }, false);
    bindPostcode("qf-dest", "[data-qf-depot-dest]", function (r) { S.dest = r; clearComplaint(2); }, true);

    /* An upfront discount you cannot reach because the hire is shorter than
       the term is not an option. The first version greyed those out, which
       reads as a broken dropdown rather than as a rule — so the list is
       rebuilt to match the duration instead, and everything in it is
       always choosable. */
    var BILLING_FOR = {
      "2_weeks": ["weekly", "monthly"],
      "1_to_3_months": ["weekly", "monthly", "3_months_upfront"],
      "4_to_11_months": ["weekly", "monthly", "3_months_upfront", "6_months_upfront"],
      "12_plus_months": ["weekly", "monthly", "3_months_upfront", "6_months_upfront", "12_months_upfront"]
    };
    var BILLING_ALL = (function () {
      var sel = document.getElementById("qf-billing");
      return sel ? Array.prototype.map.call(sel.options, function (o) {
        return { value: o.value, text: o.textContent };
      }) : [];
    })();

    function billingFor(duration) {
      var sel = document.getElementById("qf-billing");
      if (!sel) return;
      var allow = BILLING_FOR[duration] || BILLING_FOR["12_plus_months"];
      var was = sel.value;
      sel.innerHTML = "";
      BILLING_ALL.forEach(function (o) {
        if (allow.indexOf(o.value) < 0) return;
        var opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.text;
        sel.appendChild(opt);
      });
      /* Keep what they chose if it survived the change. Until they have
         chosen, follow the hire: two weeks billed monthly would quote a
         month's rent for a fortnight, which is the worse of the two. */
      var fit = duration === "2_weeks" ? "weekly" : "monthly";
      sel.value = (S.billingTouched && allow.indexOf(was) > -1) ? was : fit;
      S.billing = sel.value;
    }

    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "service") {
        S.service = t.value;
        var needsPlacement = t.value === "storage";
        var needsDest = t.value === "moving" || t.value === "moving_storage";
        form.querySelector('[data-qf-sub="placement"]').hidden = !needsPlacement;
        form.querySelector('[data-qf-sub="destination"]').hidden = !needsDest;
        /* Moving and storage still ends up somewhere, so the placement
           question only belongs to pure storage. */
        if (!needsPlacement) S.placement = "";
        clearComplaint(2);
      }
      if (t.name === "placement") { S.placement = t.value; clearComplaint(2); }
      if (t.name === "size") { S.size = t.value; clearComplaint(3); }
      if (t.name === "duration") {
        S.duration = t.value;
        billingFor(t.value);
        clearComplaint(4);
      }
      if (t.id === "qf-billing") { S.billing = t.value; S.billingTouched = true; }
      if (t.id === "qf-date") { S.date = t.value; clearComplaint(4); }
      if (t.id === "qf-window") S.win = t.value;
      if (t.id === "qf-boxes" || t.id === "qf-blankets") {
        S.boxes = Number(document.getElementById("qf-boxes").value) || 0;
        S.blankets = Number(document.getElementById("qf-blankets").value) || 0;
        var out = form.querySelector("[data-qf-supplies]");
        if (out) {
          var b = boxPrice(S.boxes), k = blanketPrice(S.blankets);
          out.innerHTML = (b + k) === 0 ? "No supplies added."
            : "<b>" + money(b + k) + "</b> — " +
              (S.boxes ? S.boxes + " boxes " + money(b) : "") +
              (S.boxes && S.blankets ? ", " : "") +
              (S.blankets ? S.blankets + " blankets " + money(k) : "") +
              ". Added to the first payment.";
        }
      }
      if (S.step === LAST) summary();
    });

    /* The room estimator: add up the volumes, point at the smallest
       container that holds the total. */
    form.addEventListener("input", function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute("data-qf-room")) return;
      var total = 0;
      Array.prototype.forEach.call(form.querySelectorAll("[data-qf-room]"), function (i) {
        var n = Math.max(0, Number(i.value) || 0);
        var room = null;
        for (var k = 0; k < D.rooms.length; k++) if (D.rooms[k].id === i.getAttribute("data-qf-room")) room = D.rooms[k];
        if (room) total += n * room.m3;
      });
      var out = form.querySelector("[data-qf-calc]");
      if (!out) return;
      if (!total) { out.innerHTML = "Nothing added up yet."; return; }
      var pick = null;
      for (var c = 0; c < D.containers.length; c++) {
        if (parseFloat(D.containers[c].vol) >= total) { pick = D.containers[c]; break; }
      }
      out.innerHTML = pick
        ? "About <b>" + total + " m³</b> — the <b>" + pick.name + "</b> (" + pick.vol + ") holds that."
        : "About <b>" + total + " m³</b>, which is more than a single booking covers. Call <a href=\"" +
          TEL + "\">" + PHONE + "</a> and we will work out the combination.";
    });

    form.addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var next = e.target.closest("[data-qf-next]");
      var back = e.target.closest("[data-qf-back]");
      var goto = e.target.closest("[data-qf-goto]");
      if (next) { if (!complain(S.step)) show(Math.min(S.step + 1, LAST)); }
      else if (back) show(Math.max(S.step - 1, 1));
      else if (goto && !goto.disabled) show(Number(goto.getAttribute("data-qf-goto")));
    });
    document.addEventListener("click", function (e) {
      var goto = e.target.closest ? e.target.closest("[data-qf-goto]") : null;
      if (goto && !goto.disabled) { e.preventDefault(); show(Number(goto.getAttribute("data-qf-goto"))); }
    });

    /* ---- submit ---- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".g-qf-msg");
      var fields = ["qf-name", "qf-mobile", "qf-email"];
      var bad = null;
      fields.forEach(function (id) {
        var f = document.getElementById(id);
        var ok = f.value.trim() && (id !== "qf-email" || EMAIL.test(f.value.trim()));
        f.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !bad) bad = f;
      });
      var agree = document.getElementById("qf-agree");
      if (!agree.checked && !bad) bad = agree;
      if (bad) {
        msg.className = "g-qf-msg is-err";
        msg.textContent = bad === agree
          ? "Tick the box so we are allowed to send it."
          : "Check the highlighted field — we need a name, a mobile and a working email address.";
        bad.focus();
        return;
      }
      var q = price();
      /* Nothing to post to yet. The form says so rather than pretending a
         quote was sent; see README, "Not wired up yet". */
      msg.className = "g-qf-msg";
      msg.innerHTML = "<b>Your quote is ready.</b> This build has no mail handler connected yet, so nothing has been sent. " +
        "Everything on the right is your figure — call <a href=\"" + TEL + "\">" + PHONE + "</a> or " +
        "<a href=\"mailto:info@portabox.au\">email it through</a> and we will confirm the date.";
      if (q) msg.innerHTML += "<br><br>" + q.container.name + " · " + S.origin.suburb + " " + S.origin.postcode +
        (q.dest ? " → " + q.dest.suburb + " " + q.dest.postcode : "") + " · " + money(q.today) + " due on delivery.";
    });

    /* ---- opening state ---- */
    var today = new Date();
    today.setDate(today.getDate() + 2);
    var dateEl = document.getElementById("qf-date");
    if (dateEl) dateEl.min = today.toISOString().slice(0, 10);

    var sel = document.getElementById("qf-billing");
    if (sel) S.billing = sel.value;
    S.win = (document.getElementById("qf-window") || {}).value || "";

    /* The postcode boxes on every other page hand off to here. Arriving with
       one means step 1 is already answered, so answer it and move on. */
    show(1, true);

    var handed = (location.search.match(/[?&]postcode=(\d{1,4})/) || [])[1];
    if (handed) {
      var inp = document.getElementById("qf-origin");
      inp.value = handed;
      if (inp.__say) inp.__say();
      if (S.origin) { S.reached = 2; show(2); }
    }
  }

  /* ---------- Reveals ---------- */
  function reveals() {
    var els = document.querySelectorAll(".g-rise, .g-wipe");
    if (reduce || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------- Stat counters ----------
     Only the numeric part animates; prefixes and ranges are left alone so
     "$8.76" and "150–200" still read correctly. */
  function counters() {
    var stats = document.querySelectorAll(".g-stat b");
    if (!stats.length || reduce || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, raw = el.textContent.trim();
        var m = raw.match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/);
        if (!m) return;                       // ranges like 150–200 stay put
        var pre = m[1], end = parseFloat(m[2]), post = m[3];
        var dp = (m[2].split(".")[1] || "").length;
        var start = performance.now(), dur = 1100;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var e = 1 - Math.pow(1 - p, 4);     // expo-out, matching the CSS easing
          el.textContent = pre + (end * e).toFixed(dp) + post;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = raw;
        })(start);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(stats, function (s) { io.observe(s); });
  }

  /* ---------- Hero video ----------
     Attached in script so phones and reduced-motion users never download it. */
  function heroVideo() {
    var v = document.querySelector(".hero-video");
    if (!v) return;
    var small = window.matchMedia("(max-width: 767px), (max-height: 520px)").matches;
    var save = navigator.connection && navigator.connection.saveData;
    if (reduce || small || save) return;

    var src = v.getAttribute("data-src");
    if (!src) return;
    v.setAttribute("src", src);
    v.load();
    var play = function () { var t = v.play(); if (t && t.catch) t.catch(function () {}); };
    if (v.readyState >= 2) play(); else v.addEventListener("loadeddata", play, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) v.pause(); else play();
    });
  }

  /* ---------- Quote form ---------- */
  /* Root-absolute paths assume the site owns the domain root. WordPress
     often does not — a subdirectory install, or a different slug for the
     quote page. The theme sets window.PORTABOX before this file loads
     (wp_localize_script) and these fall back to the static paths, so the
     generated site needs no PORTABOX object at all. */
  var WP = window.PORTABOX || {};
  var BASE = (WP.base || "").replace(/[/]$/, "");
  var QUOTE_URL = WP.quoteUrl || BASE + "/get-a-quote/";
  var at = function (path) { return BASE + path; };

  function depotFor(pc) {
    var hit = function (rs) {
      for (var i = 0; i < rs.length; i++) if (pc >= rs[i][0] && pc <= rs[i][1]) return true;
      return false;
    };
    if (hit([[1000,2599],[2619,2899],[2921,2999],[200,299],[2600,2618],[2900,2920]]))
      return { hub: "Sydney", href: at("/locations/sydney/"), regional: false };
    if (hit([[3000,3999],[8000,8999]])) return { hub: "Melbourne", href: at("/locations/melbourne/"), regional: false };
    if (hit([[4000,4999],[9000,9999]])) return { hub: "Brisbane", href: at("/locations/brisbane/"), regional: false };
    if (hit([[5000,5999]]))             return { hub: "Adelaide", href: at("/locations/adelaide/"), regional: false };
    if (hit([[6000,6999]])) return { hub: "Western Australia", href: at("/moving/regional-solution/"), regional: true };
    if (hit([[7000,7999]])) return { hub: "Tasmania",          href: at("/moving/regional-solution/"), regional: true };
    if (hit([[800,999]]))   return { hub: "Northern Territory", href: at("/moving/regional-solution/"), regional: true };
    return null;
  }

  function quote() {
    Array.prototype.forEach.call(document.querySelectorAll(".quote-form"), bindQuote);
  }

  /* The postcode boxes are a lead-in to the quote app, not a form in their
     own right. The postcode is a shortcut: supplied, it rides across as
     ?postcode= and the app opens with step 1 already answered.

     It is never a gate. An empty or half-typed box used to stop people at the
     door with a red error, which is the worst place on the site to put one —
     the app asks for the postcode on its own first step anyway, and validates
     it there properly. So the button always goes. */
  function bindQuote(form) {
    var input = form.querySelector("input");
    var btn = form.querySelector("button");
    if (!input || !btn) return;

    var label = btn.querySelector("span");

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 4);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      /* The destination rides on the form so it stays a content value: see
         quoteForm() in build/build.js and CONTACT.quote in build/content.js. */
      var dest = form.getAttribute("data-quote") || QUOTE_URL;
      var v = input.value.replace(/\D/g, "").slice(0, 4);
      label.textContent = "Taking you there…";
      btn.disabled = true;
      location.href = /^\d{4}$/.test(v)
        ? dest + (dest.indexOf("?") > -1 ? "&" : "?") + "postcode=" + encodeURIComponent(v)
        : dest;
    });
  }

  /* ---------- How it works: scroll-driven journey ----------
     The tall #pj-journey is a scroll track; the page's progress through it
     drives one render() that positions every part of the SVG. Ported from the
     reference implementation, retimed against this page's own fixed nav. */
  function journey() {
    var track = document.getElementById("pj-journey");
    if (!track) return;
    var q = function (sel) { return document.querySelector(sel); };
    var el = {
      world: q("#pj-world"), clouds: q("#pj-clouds"), hills: q("#pj-hills"),
      truck: q("#pj-truck"), truckBody: q("#pj-truckBody"),
      wheels: [].slice.call(document.querySelectorAll(".pj-wheel")),
      puffs: q("#pj-puffs"), arms: q("#pj-arms"), cont: q("#pj-container"),
      legs: q("#pj-legs"), legL: q("#pj-legL"), legR: q("#pj-legR"),
      footL: q("#pj-footL"), footR: q("#pj-footR"),
      door: q("#pj-door"), lock: q("#pj-lock"), shackle: q("#pj-shackle"),
      items: [].slice.call(document.querySelectorAll("#pj-items use")),
      facility: q("#pj-facility"), newhome: q("#pj-newhome"),
      rail: q("#pj-rail"), steps: [].slice.call(document.querySelectorAll(".g-pj-step")),
      chipStep: q("#pj-chipStep"), chipPrice: q("#pj-chipPrice"),
      quote: q("#pj-quote"), stepsCol: q("#pj-stepsCol")
    };
    if (!el.world || !el.cont) return;

    var mode = "storage";
    var bar = document.querySelector(".g-nav");
    function navH() { return bar ? bar.offsetHeight : 0; }

    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
    var eo = function (t) { return 1 - Math.pow(1 - t, 3); };
    var eio = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var ei = function (t) { return t * t * t; };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var backOut = function (t) { var c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    function tr(node, v) { node.setAttribute("transform", v); }

    var T = { drive: [0, .14], lift1: [.14, .19], out1: [.19, .25], lower1: [.25, .32],
              doorUp: [.34, .38], items: .38, itemStep: .04, itemDur: .07,
              doorDown: [.57, .61], lock: [.59, .63], legsUp: [.66, .70],
              back: [.66, .74], onto: [.74, .77], off: [.78, .88], quote: [.89, .95] };
    var PARK = 370, GROUND = 440, BED = 380, HIGH = 318;
    var DOOR = { x: 202, y: 410 };

    function render(p) {
      var tx, moving = false;
      if (p < T.out1[0]) { tx = lerp(-460, PARK, eo(seg(p, T.drive[0], T.drive[1]))); moving = p < T.drive[1]; }
      else if (p < T.back[0]) { var o = seg(p, T.out1[0], T.out1[1]); tx = lerp(PARK, 1250, ei(o)); moving = o > 0 && o < 1; }
      else if (p < T.off[0]) { var bk = seg(p, T.back[0], T.back[1]); tx = lerp(1250, PARK, eo(bk)); moving = bk > 0 && bk < 1; }
      else { var fw = seg(p, T.off[0], T.off[1]); tx = lerp(PARK, 1560, eio(fw)); moving = fw > 0 && fw < 1; }

      var cam = 1000 * eio(seg(p, T.off[0] + .01, T.off[1]));
      tr(el.world, "translate(" + (-cam).toFixed(1) + ",0)");
      tr(el.clouds, "translate(" + (-cam * .25).toFixed(1) + ",0)");
      tr(el.hills, "translate(" + (-cam * .5).toFixed(1) + ",0)");

      var bounce = moving ? Math.abs(Math.sin(tx * .09)) * -3 : 0;
      tr(el.truck, "translate(" + tx.toFixed(1) + ",0)");
      tr(el.truckBody, "translate(0," + bounce.toFixed(1) + ")");
      el.puffs.style.opacity = moving ? 1 : 0;
      tr(el.puffs, "translate(" + (Math.sin(tx * .05) * 4).toFixed(1) + ",0)");
      el.wheels.forEach(function (w) {
        var bx = w.transform.baseVal.getItem(0).matrix.e;
        tr(w, "translate(" + bx + ",420) rotate(" + (tx * 2.4).toFixed(1) + ")");
      });

      var cx, cy, legsOn = false, armsUp = 0;
      if (p < T.lift1[0]) { cx = tx + 20; cy = BED + bounce; }
      else if (p < T.lower1[0]) {
        cx = PARK + 20; cy = lerp(BED, HIGH, eo(seg(p, T.lift1[0], T.lift1[1]))); legsOn = true;
        armsUp = seg(p, T.lift1[0], T.lift1[1]) * (1 - seg(p, T.out1[0], T.out1[0] + .01));
      }
      else if (p < T.legsUp[0]) { var lw = seg(p, T.lower1[0], T.lower1[1]); cx = PARK + 20; cy = lerp(HIGH, GROUND, eio(lw)); legsOn = lw < 1; }
      else if (p < T.onto[0]) { cx = PARK + 20; cy = lerp(GROUND, HIGH, eo(seg(p, T.legsUp[0], T.legsUp[1]))); legsOn = true; }
      else if (p < T.off[0]) { var on = seg(p, T.onto[0], T.onto[1]); cx = PARK + 20; cy = lerp(HIGH, BED, eio(on)); armsUp = 1 - on; }
      else { cx = tx + 20; cy = BED + bounce; }

      var land = seg(p, T.lower1[1] - .005, T.lower1[1] + .02), sq = 1 - Math.sin(land * Math.PI) * .05;
      tr(el.cont, "translate(" + cx.toFixed(1) + "," + (cy - 150 * sq).toFixed(1) + ") scale(" + (2 - sq).toFixed(3) + "," + sq.toFixed(3) + ")");
      tr(el.arms, "translate(0," + (-armsUp * (BED - HIGH)).toFixed(1) + ")");

      el.legs.style.opacity = legsOn ? 1 : 0;
      var legLen = Math.max(0, GROUND - cy);
      [el.legL, el.legR].forEach(function (l) { l.setAttribute("height", legLen.toFixed(1)); });
      [el.footL, el.footR].forEach(function (ft) { ft.setAttribute("y", (150 + legLen - 5).toFixed(1)); });

      var open = eo(seg(p, T.doorUp[0], T.doorUp[1])) - eio(seg(p, T.doorDown[0], T.doorDown[1]));
      tr(el.door, "translate(0," + (-122 * open).toFixed(1) + ")");

      var groundTop = GROUND - 150;
      el.items.forEach(function (u, i) {
        var a = T.items + i * T.itemStep, t = seg(p, a, a + T.itemDur);
        var ex = +u.dataset.x, ey = +u.dataset.y;
        var sx = DOOR.x - (PARK + 20) - 22, sy = DOOR.y - groundTop - 20;
        var x = lerp(sx, ex, eio(t)), y = lerp(sy, ey, eio(t)) - Math.sin(t * Math.PI) * 150;
        var rot = (1 - t) * -160 * (i % 2 ? 1 : -1);
        u.setAttribute("x", 0); u.setAttribute("y", 0);
        tr(u, "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + rot.toFixed(1) + " 22 20)");
        u.style.opacity = t > 0 ? 1 : 0;
      });

      var lk = seg(p, T.lock[0], T.lock[1]);
      tr(el.lock, "translate(120,128) scale(" + (lk > 0 ? backOut(lk) : 0).toFixed(3) + ")");
      tr(el.shackle, "translate(0," + (-7 * (1 - eo(seg(p, T.lock[0] + .015, T.lock[1])))).toFixed(1) + ")");

      var active = p < .33 ? 0 : p < .655 ? 1 : 2;
      el.steps.forEach(function (st, i) { st.classList.toggle("on", i === active); st.classList.toggle("done", i < active); });
      el.rail.style.transform = "scaleY(" + clamp(p / T.off[1]) + ")";

      /* Reduced motion, and short landscape, both make the form a static
         block in CSS — the timeline must not drive its opacity or the reveal
         would undo that. */
      // Matches the CSS that unpins the section: short landscape, and short
      // phones. In both the quote panel is a static block owned by CSS.
      var flat = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) ||
                 (window.innerWidth <= 860 && window.innerHeight <= 760);
      if (reduce || flat) {
        el.chipStep.textContent = "Step " + (active + 1) + " of 3";
      } else {
        var qp = eo(seg(p, T.quote[0], T.quote[1]));
        var narrow = window.innerWidth <= 860 || window.innerHeight <= 520;
        el.quote.style.opacity = qp;
        el.quote.style.transform = narrow
          ? "translateY(" + (120 * (1 - qp)) + "%)"
          : "translateY(calc(-50% + " + (40 * (1 - qp)).toFixed(1) + "px))";
        el.quote.style.pointerEvents = qp > .6 ? "auto" : "none";
        el.stepsCol.style.opacity = narrow ? 1 : 1 - qp;
        el.chipPrice.style.opacity = 1 - qp;
        el.chipStep.textContent = qp > .5 ? "Ready when you are" : "Step " + (active + 1) + " of 3";
      }

      el.facility.style.opacity = mode === "storage" ? 1 : 0;
      el.newhome.style.opacity = mode === "moving" ? 1 : 0;
    }

    function progress() {
      var r = track.getBoundingClientRect(), top = navH();
      var total = r.height - (window.innerHeight - top);
      return total > 0 ? clamp((top - r.top) / total) : 1;
    }

    var raf = 0;
    function tick() { raf = 0; render(progress()); }

    if (reduce) {
      /* One representative frame: container delivered and packed, door open. */
      render(0.57);
    } else {
      window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
      window.addEventListener("resize", tick);
      tick();
    }

    var copy = {
      storage: { h: "We store it", p: "We collect it on an agreed date and bring the container back to our depot.",
                 proof: "Adelaide, Melbourne, Brisbane, Sydney", q: "Where should we drop your Portabox?" },
      moving: { h: "We move it", p: "We collect it level and deliver it to your new home. No double handling.",
                proof: "Load once, unload once", q: "Where are you moving from?" }
    };
    Array.prototype.forEach.call(document.querySelectorAll(".g-pj-tabs button"), function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.dataset.mode;
        Array.prototype.forEach.call(document.querySelectorAll(".g-pj-tabs button"), function (o) {
          o.setAttribute("aria-pressed", String(o === btn));
        });
        q("#pj-s3h").textContent = copy[mode].h;
        q("#pj-s3p").textContent = copy[mode].p;
        q("#pj-s3proof").textContent = copy[mode].proof;
        q("#pj-qh").textContent = copy[mode].q;
        if (reduce) render(0.57); else tick();
      });
    });
  }

  function year() {
    Array.prototype.forEach.call(document.querySelectorAll(".yr"), function (e) {
      e.textContent = String(new Date().getFullYear());
    });
  }

  function boot() { smooth(); nav(); mega(); reveals(); counters(); heroVideo(); quote(); contactForm(); suggests(); quoteFlow(); journey(); year(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* ---- Pricing toggle ----------------------------------------------------
   The client asked for one table that switches between their rate sets.
   Tabs rather than a two-state switch, because there are three sets and a
   fourth is expected once the Across Town figures arrive.
   Without JS every panel is still in the HTML; only the first is visible,
   and the rest are reachable because `hidden` is the only thing hiding them. */
(function () {
  /* Every group on the page, not just the first: the homepage and the
     pricing page each carry one, and a page could show both. */
  [].slice.call(document.querySelectorAll(".g-price-tabs")).forEach(initTabs);

  function initTabs(tabs) {
  var buttons = [].slice.call(tabs.querySelectorAll("button"));
  /* The note belongs to this group, so find it from the group's own ids
     rather than a fixed one shared across the page. */
  var note = document.getElementById(
    (buttons[0] && buttons[0].dataset.panel || "").replace(/-[^-]+$/, "-note")
  );

  function show(btn) {
    buttons.forEach(function (b) {
      var panel = document.getElementById(b.dataset.panel);
      var on = b === btn;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (panel) { if (on) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", ""); }
    });
    if (note && btn.getAttribute("data-note")) note.textContent = btn.getAttribute("data-note");
  }

  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (btn) show(btn);
  });

  /* Left and right move between tabs, which is what a tablist is expected
     to do once one of them has focus. */
  tabs.addEventListener("keydown", function (e) {
    var i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    var next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
    if (next < 0 || next >= buttons.length) return;
    e.preventDefault();
    buttons[next].focus();
    show(buttons[next]);
  });
  }
})();
