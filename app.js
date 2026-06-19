/* ====================================================================
   SAVILLS · OFICINAS — Office Pulse landing interactions
   --------------------------------------------------------------------
   • Standalone: se hidrata desde window.EVENT_CONFIG (lo genera el editor).
   • Modo preview (?preview=1): escucha postMessage del editor y re-aplica
     el config en vivo, sobre un único markup compartido con la landing.
   • Sin config: mantiene el HTML estático (retrocompatibilidad).
   ==================================================================== */
(function () {
  'use strict';

  var IS_PREVIEW = /[?&]preview=1\b/.test(location.search);

  /* ---------- helpers ---------- */
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* estado mutable que comparten los módulos (se actualiza en cada applyConfig) */
  var EVENT = {};
  var AGENDA = [];
  var countdownTarget = 0;

  /* ====================================================================
     HIDRATACIÓN — puede ejecutarse múltiples veces (preview en vivo)
     ==================================================================== */
  function applyConfig(cfg) {
    if (!cfg) return;

    if (cfg.meta) {
      if (cfg.meta.pageTitle) document.title = cfg.meta.pageTitle;
      if (cfg.meta.lang) document.documentElement.lang = cfg.meta.lang;
    }

    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var v = get(cfg, el.getAttribute('data-bind'));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-bind-html]').forEach(function (el) {
      var v = get(cfg, el.getAttribute('data-bind-html'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-bind-href]').forEach(function (el) {
      var v = get(cfg, el.getAttribute('data-bind-href'));
      if (v != null) el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-bind-bg]').forEach(function (el) {
      var v = get(cfg, el.getAttribute('data-bind-bg'));
      if (v) el.style.backgroundImage = "url('" + v + "')";
    });
    document.querySelectorAll('[data-bind-img]').forEach(function (el) {
      var v = get(cfg, el.getAttribute('data-bind-img'));
      var slot = el.closest('[data-logo-slot]');
      var def = slot ? slot.querySelector('.oplogo__default') : null;
      if (v) { el.src = v; el.hidden = false; if (def) def.style.display = 'none'; }
      else { el.hidden = true; el.removeAttribute('src'); if (def) def.style.display = ''; }
    });

    applyTheme(cfg.theme);
    applySections(cfg.sections);
    applyInfoOrder(cfg.infoOrder);
    renderHighlights(cfg.highlights);
    if (cfg.speakers) renderSpeakers(cfg.speakers);
    if (cfg.form && cfg.form.fields) { renderFields(cfg.form.fields); bindFormInputs(); }

    /* datos para countdown + calendario + agenda */
    if (cfg.event) {
      EVENT = {
        title: cfg.event.calendarTitle || cfg.event.name,
        location: cfg.event.location,
        start: cfg.event.start,
        end: cfg.event.end,
        desc: cfg.event.calendarDescription || cfg.event.description
      };
      var clock = document.getElementById('clock');
      if (clock && cfg.event.start) {
        clock.setAttribute('data-target', cfg.event.start);
        countdownTarget = new Date(cfg.event.start).getTime();
      }
    }
    if (cfg.agenda) { AGENDA = cfg.agenda; renderAgenda(); }

    /* en preview, todo visible de inmediato (sin animación de scroll) */
    if (IS_PREVIEW) revealAllNow();
  }

  /* highlights: se renderizan en TODOS los contenedores [data-list="highlights"]
     (hero + sección info), respetando el data-item-class de cada uno */
  function renderHighlights(items) {
    if (!items) return;
    document.querySelectorAll('[data-list="highlights"]').forEach(function (container) {
      var itemClass = container.getAttribute('data-item-class') || '';
      container.innerHTML = items.map(function (it) {
        var c = itemClass ? ' class="' + itemClass + '"' : '';
        return '<div' + c + '><dt>' + esc(it.value) + '</dt><dd>' + esc(it.label) + '</dd></div>';
      }).join('');
    });
  }

  /* aplica colores del tema como variables CSS */
  function applyTheme(t) {
    if (!t) return;
    var s = document.documentElement.style;
    if (t.accent)   s.setProperty('--yellow', t.accent);
    if (t.heroText) s.setProperty('--hero-text', t.heroText);
    if (t.infoText) s.setProperty('--info-text', t.infoText);
    if (t.infoBg)   s.setProperty('--info-bg', gradientFrom(t.infoBg));
  }
  function hexToRgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function gradientFrom(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex; // si no es hex, úsalo tal cual
    var clamp = function (v) { return Math.max(0, Math.min(255, Math.round(v))); };
    var shift = function (a) { return 'rgb(' + clamp(rgb[0] + a) + ',' + clamp(rgb[1] + a) + ',' + clamp(rgb[2] + a) + ')'; };
    return 'linear-gradient(160deg,' + shift(20) + ' 0%,' + shift(0) + ' 55%,' + shift(-14) + ' 100%)';
  }

  /* muestra u oculta secciones según cfg.sections */
  function applySections(sec) {
    if (!sec) return;
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = (sec[el.getAttribute('data-section')] === false) ? 'none' : '';
    });
  }

  /* reordena los apartados DENTRO del bloque "Información del evento"
     según cfg.infoOrder (about, countdown, highlights, agenda, speakers).
     Los apartados no listados se mantienen al final, en su secuencia. */
  function applyInfoOrder(order) {
    if (!Array.isArray(order) || !order.length) return;
    var box = document.querySelector('[data-info-blocks]');
    if (!box) return;
    var seen = {};
    order.forEach(function (key) {
      var el = box.querySelector('[data-block="' + key + '"]');
      if (el && !seen[key]) { box.appendChild(el); seen[key] = true; }
    });
    [].slice.call(box.querySelectorAll('[data-block]')).forEach(function (el) {
      var key = el.getAttribute('data-block');
      if (!seen[key]) { box.appendChild(el); seen[key] = true; }
    });
  }

  function renderSpeakers(speakers) {
    var container = document.querySelector('[data-list="speakers"]');
    if (!container) return;
    container.innerHTML = speakers.map(function (s, i) {
      var cls = 'spk reveal' + (i ? ' d' + Math.min(i, 3) : '');
      var roleCompany = [s.role, s.company].filter(Boolean).join(' · ');
      var media = s.photo
        ? '<img class="spk__img" src="' + esc(s.photo) + '" alt="' + esc(s.name) + '" style="object-fit:cover;">'
        : '<div class="spk__img spk__ph">Foto del ponente</div>';
      return '<figure class="' + cls + '">' + media +
        '<figcaption class="spk__cap"><div class="name">' + esc(s.name) + '</div>' +
        '<div class="role">' + esc(roleCompany) + '</div></figcaption></figure>';
    }).join('');
  }

  function fieldHtml(f) {
    var id = 'f-' + f.name;
    var mark = f.required ? ' <span class="req">*</span>' : ' <span class="opt">(opcional)</span>';
    var label = '<label for="' + id + '">' + esc(f.label) + mark + '</label>';
    var control;
    if (f.type === 'textarea') {
      control = '<textarea id="' + id + '" name="' + esc(f.name) + '" placeholder="' + esc(f.placeholder || '') + '"' + (f.required ? ' required' : '') + '></textarea>';
    } else if (f.type === 'select') {
      var opts = (f.options || []).map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
      control = '<select id="' + id + '" name="' + esc(f.name) + '"' + (f.required ? ' required' : '') + '>' +
        '<option value="" disabled selected>Selecciona…</option>' + opts + '</select>';
    } else {
      var ac = f.autocomplete ? ' autocomplete="' + esc(f.autocomplete) + '"' : '';
      control = '<input id="' + id + '" name="' + esc(f.name) + '" type="' + esc(f.type) + '" placeholder="' + esc(f.placeholder || '') + '"' + ac + (f.required ? ' required' : '') + '>';
    }
    var err = '<span class="field__err">' + (f.required ? 'Este campo es obligatorio.' : '') + '</span>';
    return '<div class="field">' + label + control + err + '</div>';
  }

  function renderFields(fields) {
    var container = document.querySelector('[data-fields]');
    if (!container) return;
    var html = '', i = 0;
    while (i < fields.length) {
      var f = fields[i], next = fields[i + 1];
      if (f.width === 'half' && next && next.width === 'half') {
        html += '<div class="form__row">' + fieldHtml(f) + fieldHtml(next) + '</div>';
        i += 2;
      } else {
        html += fieldHtml(f);
        i += 1;
      }
    }
    container.innerHTML = html;
  }

  function renderAgenda() {
    var stats = document.getElementById('stats');
    if (!stats) return;
    stats.innerHTML = '';
    AGENDA.forEach(function (a, i) {
      var card = document.createElement('div');
      card.className = 'stat reveal' + (i ? ' d' + Math.min(i, 3) : '');
      card.innerHTML = '<span class="stat__title">' + esc(a.title) + '</span>' +
                       '<span class="stat__value">' + esc(a.time) + '</span>';
      stats.appendChild(card);
    });
    if (IS_PREVIEW) revealAllNow();
  }

  function revealAllNow() {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ====================================================================
     ARRANQUE
     ==================================================================== */
  // Defaults si la página se abre sin config (retrocompat).
  if (window.EVENT_CONFIG) {
    applyConfig(window.EVENT_CONFIG);
  } else {
    EVENT = {
      title: 'OFICINAS · Impulso y oportunidad — Savills',
      location: 'Auditorio Savills, Pº de la Castellana 81, 28046 Madrid',
      start: '2026-06-25T09:30:00', end: '2026-06-25T14:00:00',
      desc: 'Jornada Savills Research sobre el mercado de oficinas.'
    };
    var clk = document.getElementById('clock');
    if (clk) countdownTarget = new Date(clk.getAttribute('data-target')).getTime();
    AGENDA = [
      { title: 'Recepción y café de bienvenida', time: '09:30h' },
      { title: 'El pulso del mercado de oficinas', time: '10:00h' },
      { title: 'Mesa redonda · flexibilidad y ESG', time: '11:15h' },
      { title: 'Networking y vino español', time: '13:00h' }
    ];
    renderAgenda();
  }

  /* Preview: recibe configs del editor en vivo */
  if (IS_PREVIEW) {
    document.documentElement.classList.add('is-preview');
    revealAllNow();
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'EVENT_CONFIG' && e.data.config) applyConfig(e.data.config);
    });
    // avisa al editor de que el preview está listo para recibir config
    try { window.parent.postMessage({ type: 'PREVIEW_READY' }, '*'); } catch (err) {}
  }

  /* ---------- Countdown (lee countdownTarget mutable) ---------- */
  var clock = document.getElementById('clock');
  if (clock) {
    var u = {
      days: clock.querySelector('[data-unit="days"]'),
      hours: clock.querySelector('[data-unit="hours"]'),
      mins: clock.querySelector('[data-unit="mins"]'),
      secs: clock.querySelector('[data-unit="secs"]')
    };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var setVal = function (el, n) {
      var v = pad(n);
      if (!el || el.textContent === v) return;
      el.textContent = v;
      el.classList.remove('ticked');
      void el.offsetWidth;
      el.classList.add('ticked');
    };
    var tick = function () {
      var diff = Math.max(0, countdownTarget - Date.now());
      var s = Math.floor(diff / 1000);
      setVal(u.days,  Math.floor(s / 86400));
      setVal(u.hours, Math.floor((s % 86400) / 3600));
      setVal(u.mins,  Math.floor((s % 3600) / 60));
      setVal(u.secs,  s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Scroll reveal ---------- */
  if (!IS_PREVIEW) {
    var reveals = document.querySelectorAll('.reveal');
    var reveal = function (el) { el.classList.add('in'); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      var vh = window.innerHeight || 800;
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) reveal(el);
        else io.observe(el);
      });
    } else {
      document.documentElement.classList.add('reveal-fallback');
    }
    window.addEventListener('beforeprint', function () { document.documentElement.classList.add('reveal-fallback'); });
  }

  /* ---------- Parallax: hero + registro ---------- */
  (function () {
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var coarse = window.matchMedia('(hover:none),(pointer:coarse)').matches;
    var small  = window.matchMedia('(max-width:768px)').matches;
    if (reduce || coarse || small) return;

    var items = [
      { bg: document.querySelector('.hero__bg'),     section: document.getElementById('top'),       speed: 0.10 },
      { bg: document.querySelector('.registro__bg'), section: document.getElementById('registro'),  speed: 0.10 }
    ].filter(function (p) { return p.bg && p.section; });
    if (!items.length) return;

    var ticking = false;
    var update = function () {
      ticking = false;
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var top = p.section.getBoundingClientRect().top;
        p.bg.style.transform = 'translate3d(0,' + (top * p.speed) + 'px,0)';
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* ---------- Botón "volver arriba" ---------- */
  if (!IS_PREVIEW) {
    var toTop = document.createElement('button');
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Volver arriba');
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
    document.body.appendChild(toTop);
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    var toggleTop = function () { toTop.classList.toggle('show', window.scrollY > 600); };
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
  }

  /* ---------- Add to calendar (lee EVENT mutable) ---------- */
  function toUTC(dstr) {
    var d = new Date(dstr);
    return d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, '0') +
      String(d.getUTCDate()).padStart(2, '0') + 'T' +
      String(d.getUTCHours()).padStart(2, '0') +
      String(d.getUTCMinutes()).padStart(2, '0') +
      String(d.getUTCSeconds()).padStart(2, '0') + 'Z';
  }
  function googleUrl() {
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
      action: 'TEMPLATE', text: EVENT.title, dates: toUTC(EVENT.start) + '/' + toUTC(EVENT.end),
      details: EVENT.desc, location: EVENT.location
    }).toString();
  }
  function outlookUrl() {
    return 'https://outlook.live.com/calendar/0/deeplink/compose?' + new URLSearchParams({
      path: '/calendar/action/compose', rru: 'addevent', subject: EVENT.title,
      body: EVENT.desc, location: EVENT.location, startdt: EVENT.start, enddt: EVENT.end
    }).toString();
  }
  function icsUrl() {
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Savills//Oficinas//ES',
      'BEGIN:VEVENT', 'UID:' + Date.now() + '@savills.es', 'DTSTAMP:' + toUTC(EVENT.start),
      'DTSTART:' + toUTC(EVENT.start), 'DTEND:' + toUTC(EVENT.end), 'SUMMARY:' + EVENT.title,
      'DESCRIPTION:' + EVENT.desc, 'LOCATION:' + EVENT.location,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cal]');
    if (!btn) return;
    var t = btn.getAttribute('data-cal');
    if (t === 'google') window.open(googleUrl(), '_blank');
    else if (t === 'outlook') window.open(outlookUrl(), '_blank');
    else {
      var a = document.createElement('a');
      a.href = icsUrl(); a.download = 'evento.ics';
      document.body.appendChild(a); a.click(); a.remove();
    }
  });

  /* ---------- Form validation (re-bindable) ---------- */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function fieldOf(i) { return i.closest('.field'); }
  function validate(input) {
    var v = input.value.trim(), ok = true;
    if (input.hasAttribute('required') && !v) ok = false;
    if (input.type === 'email' && v && !emailRe.test(v)) ok = false;
    fieldOf(input).classList.toggle('invalid', !ok);
    return ok;
  }
  function bindFormInputs() {
    var form = document.getElementById('reg-form');
    if (!form) return;
    form.querySelectorAll('input,textarea,select').forEach(function (input) {
      if (input.__bound) return;
      input.__bound = true;
      var recheck = function () { if (fieldOf(input).classList.contains('invalid')) validate(input); };
      input.addEventListener('blur', recheck);
      input.addEventListener('input', recheck);
    });
  }
  (function () {
    var form = document.getElementById('reg-form');
    if (!form) return;
    bindFormInputs();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (IS_PREVIEW) return; // no enviar desde el preview del editor
      var fields = form.querySelectorAll('input[required],input[type=email],textarea[required],select[required]');
      var ok = true, first = null;
      fields.forEach(function (input) { if (!validate(input)) { ok = false; if (!first) first = input; } });
      if (!ok) { if (first) first.focus(); return; }
      var nameInput = form.querySelector('#f-name');
      var name = (nameInput ? nameInput.value || '' : '').trim().split(' ')[0];
      var msg = document.getElementById('thanks-msg');
      if (name && msg) msg.textContent = 'Gracias ' + name + '. ' + thanksBaseMsg;
      openThanks();
    });
    var reset = document.getElementById('reset-form');
    if (reset) reset.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
      closeThanks();
    });
  })();

  /* ---------- Popup de gracias (tras el registro) ---------- */
  var thanksModal = document.getElementById('thanks-modal');
  var thanksMsgEl = document.getElementById('thanks-msg');
  var thanksBaseMsg = thanksMsgEl ? thanksMsgEl.textContent : '';
  function openThanks() {
    if (!thanksModal) return;
    thanksModal.hidden = false;
    requestAnimationFrame(function () { thanksModal.classList.add('show'); });
    document.documentElement.classList.add('modal-open');
  }
  function closeThanks() {
    if (!thanksModal) return;
    thanksModal.classList.remove('show');
    document.documentElement.classList.remove('modal-open');
    setTimeout(function () { thanksModal.hidden = true; }, 260);
  }
  if (thanksModal) {
    thanksModal.addEventListener('click', function (e) {
      if (e.target.closest('[data-thanks-close]')) closeThanks();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !thanksModal.hidden) closeThanks();
    });
  }
})();
