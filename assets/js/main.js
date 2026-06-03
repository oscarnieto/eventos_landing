/* ========================================================================
   Savills · Eventos — Landing engine
   Renders the landing from /data/event.json and powers all interactions.
   No build step, no dependencies. Works on GitHub Pages and any static host.
   ======================================================================== */
(function () {
  "use strict";

  /* ----------------------------- Icons -------------------------------- */
  var ICON = {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    google: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12.3c0-2 1.6-3 1.7-3a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7A3.9 3.9 0 0 0 4.4 11c-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.1 1.4-.7 2.6-.7s1.5.7 2.6.6c1.1 0 1.8-1 2.5-2a8.4 8.4 0 0 0 1.1-2.3c-.1 0-2.2-.8-2.2-3.5zM14.6 5.7A3.5 3.5 0 0 0 15.4 3a3.6 3.6 0 0 0-2.4 1.2 3.3 3.3 0 0 0-.8 2.6 3 3 0 0 0 2.4-1.1z"/></svg>',
    outlook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.5 8.65 21 11 21 14.1V21h-4v-6c0-1.43-.03-3.27-2-3.27S13 13.3 13 14.9V21H9z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-4.8zM9.8 15.3V8.7l5.7 3.3z"/></svg>'
  };

  /* --------------------------- Utilities ------------------------------ */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function get(obj, path) { return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }

  /* --------------------------- Data loading --------------------------- */
  function loadData() {
    return fetch("data/event.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("No se pudo cargar la configuración del evento.");
      return r.json();
    });
  }

  /* ------------------------- Simple text binds ------------------------ */
  function applyBinds(data) {
    $all("[data-bind]").forEach(function (node) {
      var val = get(data, node.getAttribute("data-bind"));
      if (val != null && val !== "") node.textContent = val;
    });
    // meta
    if (data.meta) {
      if (data.meta.lang) document.documentElement.lang = data.meta.lang;
      if (data.meta.title) document.title = data.meta.title;
    }
  }

  /* ------------------------------ Nav --------------------------------- */
  function renderNav(data) {
    var list = $('[data-region="nav-links"]');
    (data.nav.links || []).forEach(function (link) {
      var li = el("li");
      var a = el("a", null, esc(link.label));
      a.href = link.href;
      li.appendChild(a);
      list.appendChild(li);
    });
    var cta = $('[data-region="nav-cta"]');
    if (data.nav.cta) { cta.textContent = data.nav.cta.label; cta.href = data.nav.cta.href; }
  }

  /* --------------------------- Highlights ----------------------------- */
  function hlItem(h) {
    var li = el("li", "hl");
    li.innerHTML =
      '<span class="hl__icon">' + (ICON[h.icon] || ICON.pin) + "</span>" +
      '<span class="hl__text"><span class="hl__label">' + esc(h.label) + "</span>" +
      '<span class="hl__value">' + esc(h.value) + "</span></span>";
    return li;
  }
  function renderHighlights(data) {
    var items = data.hero.highlights || [];
    ["hero-highlights", "info-highlights", "reg-highlights"].forEach(function (region) {
      var box = $('[data-region="' + region + '"]');
      if (box) items.forEach(function (h) { box.appendChild(hlItem(h)); });
    });
  }

  /* ------------------------------ Hero -------------------------------- */
  function renderHero(data) {
    var hero = $('[data-region="hero"]');
    var img = data.hero.backgroundImage;
    if (img) {
      hero.style.backgroundImage =
        "linear-gradient(180deg, rgba(15,15,15,.45), rgba(15,15,15,.75)), url('" + img + "')";
      hero.setAttribute("data-has-image", "true");
    }
  }

  /* ---------------------------- Countdown ----------------------------- */
  function renderCountdown(data) {
    var box = $('[data-region="countdown"]');
    var target = new Date(data.event.datetime).getTime();
    var L = data.countdown.labels;
    var parts = [
      ["days", L.days], ["hours", L.hours], ["minutes", L.minutes], ["seconds", L.seconds]
    ];
    parts.forEach(function (p) {
      var cell = el("div", "cd__cell");
      cell.innerHTML = '<div class="cd__num" data-cd="' + p[0] + '">00</div><div class="cd__label">' + esc(p[1]) + "</div>";
      box.appendChild(cell);
    });
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        box.classList.add("countdown--ended");
        box.innerHTML = "El evento ha comenzado.";
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      var map = { days: d, hours: h, minutes: m, seconds: s };
      $all("[data-cd]", box).forEach(function (n) { n.textContent = pad(map[n.getAttribute("data-cd")]); });
    }
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ----------------------------- Agenda ------------------------------- */
  function renderAgenda(data) {
    var box = $('[data-region="agenda"]');
    (data.agenda.items || []).forEach(function (it) {
      var li = el("li", "tl reveal");
      li.innerHTML =
        '<span class="tl__dot"></span>' +
        '<div class="tl__body"><div class="tl__time">' + esc(it.time) + "</div>" +
        '<h3 class="tl__title">' + esc(it.title) + "</h3>" +
        '<p class="tl__desc">' + esc(it.description || "") + "</p></div>";
      box.appendChild(li);
    });
  }

  /* -------------------------- Calendar links -------------------------- */
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function toUTC(dt) {
    var d = new Date(dt);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
      "T" + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + "Z";
  }
  function calendarLinks(ev) {
    var start = toUTC(ev.datetime);
    var end = toUTC(ev.endDatetime || ev.datetime);
    var title = encodeURIComponent(ev.name);
    var details = encodeURIComponent(ev.description || "");
    var loc = encodeURIComponent(ev.location || ev.locationShort || "");
    return {
      google: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title +
        "&dates=" + start + "/" + end + "&details=" + details + "&location=" + loc,
      outlook: "https://outlook.office.com/calendar/0/deeplink/compose?subject=" + title +
        "&startdt=" + new Date(ev.datetime).toISOString() + "&enddt=" + new Date(ev.endDatetime || ev.datetime).toISOString() +
        "&body=" + details + "&location=" + loc + "&path=/calendar/action/compose&rru=addevent",
      ics:
        "data:text/calendar;charset=utf-8," + encodeURIComponent(
          ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Savills//Eventos//ES", "BEGIN:VEVENT",
            "UID:" + start + "@savills.es", "DTSTAMP:" + start, "DTSTART:" + start, "DTEND:" + end,
            "SUMMARY:" + ev.name, "DESCRIPTION:" + (ev.description || "").replace(/\n/g, "\\n"),
            "LOCATION:" + (ev.location || ev.locationShort || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n"))
    };
  }
  function renderCalendar(data) {
    var box = $('[data-region="calendar"]');
    var links = calendarLinks(data.event);
    var labels = { google: "Google Calendar", apple: "Apple Calendar", outlook: "Outlook" };
    (data.calendar.providers || []).forEach(function (p) {
      var a = el("a", "cal-btn");
      a.innerHTML = (ICON[p] || ICON.calendar) + "<span>" + esc(labels[p] || p) + "</span>";
      if (p === "google") a.href = links.google;
      else if (p === "outlook") a.href = links.outlook;
      else { a.href = links.ics; a.setAttribute("download", "evento-savills.ics"); }
      a.target = "_blank"; a.rel = "noopener";
      box.appendChild(a);
    });
  }

  /* ----------------------------- Speakers ----------------------------- */
  function renderSpeakers(data) {
    var box = $('[data-region="speakers"]');
    (data.speakers.people || []).forEach(function (p) {
      var card = el("article", "speaker reveal");
      card.innerHTML =
        '<div class="speaker__photo"><img src="' + esc(p.photo) + '" alt="' + esc(p.name) +
        '" loading="lazy" width="600" height="600"></div>' +
        '<div class="speaker__body"><h3 class="speaker__name">' + esc(p.name) + "</h3>" +
        '<p class="speaker__role">' + esc(p.role) + "</p>" +
        (p.company ? '<span class="speaker__company">' + esc(p.company) + "</span>" : "") +
        "</div>";
      box.appendChild(card);
    });
  }

  /* ------------------------------ Form -------------------------------- */
  function renderForm(data) {
    var form = $('[data-region="form"]');
    var reg = data.registration;
    form.method = reg.method || "POST";
    if (reg.endpoint) form.action = reg.endpoint;

    var textFields = reg.fields.filter(function (f) { return f.type !== "textarea"; });
    var areaFields = reg.fields.filter(function (f) { return f.type === "textarea"; });

    function fieldNode(f) {
      var wrap = el("div", "field" + (f.type === "textarea" ? " field--full" : ""));
      var id = "f_" + f.name;
      var labelHtml = esc(f.label) + (f.required ? ' <span class="req" aria-hidden="true">*</span>' : "");
      var control = f.type === "textarea"
        ? '<textarea id="' + id + '" name="' + esc(f.name) + '" ' + (f.required ? "required" : "") +
          ' placeholder="' + esc(f.placeholder || "") + '"></textarea>'
        : '<input id="' + id + '" name="' + esc(f.name) + '" type="' + esc(f.type) + '" ' +
          (f.required ? "required" : "") + ' autocomplete="' + esc(f.autocomplete || "on") + '" ' +
          (f.placeholder ? 'placeholder="' + esc(f.placeholder) + '"' : "") + ">";
      wrap.innerHTML = '<label for="' + id + '">' + labelHtml + "</label>" + control +
        '<span class="field__error">Este campo es obligatorio.</span>';
      return wrap;
    }

    // text fields in a 2-col row block, textarea full width
    var row = el("div", "form__row");
    textFields.forEach(function (f) { row.appendChild(fieldNode(f)); });
    form.appendChild(row);
    areaFields.forEach(function (f) { form.appendChild(fieldNode(f)); });

    if (reg.consent) {
      var consent = el("label", "consent");
      consent.innerHTML = '<input type="checkbox" name="consent" required> <span>' + esc(reg.consent) + "</span>";
      form.appendChild(consent);
    }

    var submit = el("button", "btn btn--solid btn--block");
    submit.type = "submit";
    submit.textContent = reg.submitLabel || "Enviar";
    form.appendChild(submit);

    form.addEventListener("submit", function (e) {
      var fields = $all("input[required], textarea[required]", form);
      var ok = true;
      fields.forEach(function (input) {
        var valid = input.type === "checkbox" ? input.checked : input.value.trim() !== "" && input.checkValidity();
        input.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid && ok) { ok = false; input.focus(); }
      });
      if (!ok) { e.preventDefault(); return; }

      // Demo mode: no backend endpoint configured → handle client-side.
      if (!reg.endpoint) {
        e.preventDefault();
        showSuccess(reg.successMessage);
      }
      // If an endpoint IS set, the browser submits normally (IT's backend handles it).
    });
  }

  function showSuccess(msg) {
    var form = $("#registerForm");
    var box = $("#formSuccess");
    form.hidden = true;
    box.hidden = false;
    box.innerHTML = "<h3>¡Registro recibido!</h3><p>" + esc(msg) + "</p>";
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ----------------------------- Footer ------------------------------- */
  function renderFooter(data) {
    var f = data.footer;
    var site = $('[data-region="footer-site"]');
    if (site) { site.textContent = f.websiteLabel; site.href = f.website; site.target = "_blank"; site.rel = "noopener"; }
    var social = $('[data-region="social"]');
    (f.social || []).forEach(function (s) {
      var li = el("li");
      var a = el("a", null, ICON[s.network] || "");
      a.href = s.url; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", s.network);
      li.appendChild(a);
      social.appendChild(li);
    });
  }

  /* --------------------- Interactions (chrome) ------------------------ */
  function initChrome() {
    var topbar = $("#topbar");
    var onScroll = function () { topbar.classList.toggle("is-solid", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = $("#navToggle");
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    $all("#primary-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      $all(".reveal").forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $all(".reveal").forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------ Boot -------------------------------- */
  function boot(data) {
    applyBinds(data);
    renderNav(data);
    renderHero(data);
    renderHighlights(data);
    renderCountdown(data);
    renderAgenda(data);
    renderCalendar(data);
    renderSpeakers(data);
    renderForm(data);
    renderFooter(data);
    initChrome();
    initReveal();
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadData().then(boot).catch(function (err) {
      console.error(err);
      var main = $("main");
      if (main) main.insertAdjacentHTML("afterbegin",
        '<p style="padding:120px 24px;text-align:center;color:#c00">No se pudo cargar el evento. ' +
        'Si abres el archivo directamente (file://), usa un servidor local o GitHub Pages.</p>');
    });
  });
})();
