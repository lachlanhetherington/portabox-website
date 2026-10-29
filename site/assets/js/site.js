/* Portabox — site behaviour. Vanilla, no dependencies. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav ---------- */
  function nav() {
    var bar = document.querySelector(".nav");
    if (!bar) return;
    var hero = document.querySelector(".hero");

    function onScroll() {
      // Solid once we've left the hero, or immediately on pages without one.
      var t = hero ? hero.offsetHeight - 90 : 10;
      bar.classList.toggle("is-solid", window.scrollY > t);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Desktop dropdowns: hover to open, Escape and outside-click to close.
    var items = document.querySelectorAll(".nav-item");
    Array.prototype.forEach.call(items, function (it) {
      var link = it.querySelector(".nav-link");
      var menu = it.querySelector(".dropdown");
      if (!menu || !link) return;
      var close = function () { it.classList.remove("is-open"); link.setAttribute("aria-expanded", "false"); };
      var open  = function () { it.classList.add("is-open");    link.setAttribute("aria-expanded", "true");  };

      it.addEventListener("mouseenter", open);
      it.addEventListener("mouseleave", close);
      link.addEventListener("click", function (e) {
        if (link.getAttribute("href") === "#") e.preventDefault();
        it.classList.contains("is-open") ? close() : open();
      });
      it.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); link.focus(); } });
      document.addEventListener("click", function (e) { if (!it.contains(e.target)) close(); });
    });

    // Mobile drawer
    var burger = document.querySelector(".burger");
    var drawer = document.getElementById("drawer");
    if (burger && drawer) {
      burger.addEventListener("click", function () {
        var open = burger.getAttribute("aria-expanded") === "true";
        burger.setAttribute("aria-expanded", String(!open));
        burger.setAttribute("aria-label", open ? "Open menu" : "Close menu");
        drawer.classList.toggle("is-open", !open);
        document.body.style.overflow = !open ? "hidden" : "";
        if (!open) bar.classList.add("is-solid"); else onScroll();
      });
    }
  }

  /* ---------- Reveals ---------- */
  function reveals() {
    var els = document.querySelectorAll(".rv");
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
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------- FAQ ---------- */
  function faq() {
    var qs = document.querySelectorAll(".faq-q");
    Array.prototype.forEach.call(qs, function (q) {
      q.addEventListener("click", function () {
        var open = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  /* ---------- Quote form ---------- */
  // Real Australian postcode ranges -> nearest Portabox depot.
  function depotFor(pc) {
    var hit = function (rs) {
      for (var i = 0; i < rs.length; i++) if (pc >= rs[i][0] && pc <= rs[i][1]) return true;
      return false;
    };
    if (hit([[1000,2599],[2619,2899],[2921,2999],[200,299],[2600,2618],[2900,2920]]))
      return { hub: "Greater Sydney", href: "greater-sydney.html", regional: false };
    if (hit([[3000,3999],[8000,8999]])) return { hub: "Victoria", href: "victoria.html", regional: false };
    if (hit([[4000,4999],[9000,9999]])) return { hub: "South East Queensland", href: "south-east-queensland.html", regional: false };
    if (hit([[5000,5999]]))             return { hub: "South Australia", href: "south-australia.html", regional: false };
    if (hit([[6000,6999]])) return { hub: "Western Australia", href: "regional-remote.html", regional: true };
    if (hit([[7000,7999]])) return { hub: "Tasmania",          href: "regional-remote.html", regional: true };
    if (hit([[800,999]]))   return { hub: "Northern Territory", href: "regional-remote.html", regional: true };
    return null;
  }


  /* The trace button renders its label from data-attributes, so swapping text
     means updating those plus the screen-reader copy — not textContent, which
     would wipe the button's structure. Returns the previous title. */
  function setTraceLabel(btn, title) {
    var lab = btn.querySelector(".bt-label");
    var sr = btn.querySelector(".sr-only");
    if (!lab) { var prev = btn.textContent; btn.textContent = title; return prev; }
    var was = lab.getAttribute("data-title");
    lab.setAttribute("data-title", title);
    if (sr) sr.textContent = title;
    return was;
  }

  function quotes() {
    var forms = document.querySelectorAll(".quote-form");
    Array.prototype.forEach.call(forms, function (form) {
      var input = form.querySelector("input");
      var btn   = form.querySelector(".btn-trace, .btn");
      var out   = form.parentNode.querySelector(".quote-out");
      if (!input || !btn || !out) return;

      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 4);
        input.removeAttribute("aria-invalid");
        out.innerHTML = "";
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!/^\d{4}$/.test(v)) {
          input.setAttribute("aria-invalid", "true");
          out.innerHTML = '<p class="quote-err">An Australian postcode is four digits — try 3121.</p>';
          input.focus();
          return;
        }
        btn.classList.add("is-busy");
        var label = setTraceLabel(btn, "Checking…");

        // Swap for the real /get-a-quote endpoint when it is wired up.
        window.setTimeout(function () {
          btn.classList.remove("is-busy");
          setTraceLabel(btn, label);
          var d = depotFor(Number(v));
          if (!d) {
            input.setAttribute("aria-invalid", "true");
            out.innerHTML = '<p class="quote-err">We could not match ' + v + ' to an Australian postcode.</p>';
            return;
          }
          if (btn.querySelector(".bt-label")) {
            btn.classList.add("is-done");
            window.setTimeout(function () { btn.classList.remove("is-done"); }, 2600);
          }
          out.innerHTML = d.regional
            ? '<div class="quote-ok"><b>' + v + '</b> sits outside our four depots, so ' + d.hub +
              ' runs as a regional job. We quote those individually — call <a href="tel:1800467637" style="color:inherit"><b>1800 467 637</b></a>.</div>'
            : '<div class="quote-ok">Your nearest depot is <b>' + d.hub + '</b>. We deliver to <b>' + v +
              '</b> on a standard run. <a href="' + d.href + '" style="color:inherit;text-decoration:underline">See coverage</a></div>';
        }, 620);
      });
    });
  }


  /* ---------- Hero video ----------
     The source is attached in script rather than in markup so that phones and
     anyone on reduced-motion never download 7 MB they are not going to watch —
     they get the poster frame instead. Playback also stops while the tab is
     hidden. */
  function heroVideo() {
    var v = document.querySelector(".hero-video");
    if (!v) return;

    var small = window.matchMedia("(max-width: 767px)").matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (reduce || small || saveData) return;   // poster only

    var src = v.getAttribute("data-src");
    if (!src) return;
    v.setAttribute("src", src);
    v.load();

    var play = function () {
      var t = v.play();
      if (t && t.catch) t.catch(function () { /* autoplay refused; poster stands in */ });
    };
    if (v.readyState >= 2) play();
    else v.addEventListener("loadeddata", play, { once: true });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) v.pause(); else play();
    });
  }

  function year() {
    var y = document.querySelectorAll(".yr");
    Array.prototype.forEach.call(y, function (e) { e.textContent = String(new Date().getFullYear()); });
  }

  function boot() { nav(); reveals(); faq(); quotes(); heroVideo(); year(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
