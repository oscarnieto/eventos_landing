/* ====================================================================
   SAVILLS · OFICINAS — Office Pulse landing interactions
   ==================================================================== */
(function () {
  'use strict';

  var EVENT = {
    title: 'OFICINAS · Impulso y oportunidad — Savills',
    location: 'Auditorio Savills, Pº de la Castellana 81, 28046 Madrid',
    start: '2026-06-25T09:30:00',
    end: '2026-06-25T14:00:00',
    desc: 'Jornada Savills Research sobre el mercado de oficinas: ocupación, rentas prime, flexibilidad y sostenibilidad. Recepción desde las 09:00h.'
  };

  /* ---------- Agenda stat cards ---------- */
  var AGENDA = [
    { title: 'Recepción y café de bienvenida', time: '09:30h' },
    { title: 'El pulso del mercado de oficinas', time: '10:00h' },
    { title: 'Mesa redonda · flexibilidad y ESG', time: '11:15h' },
    { title: 'Networking y vino español', time: '13:00h' }
  ];
  var stats = document.getElementById('stats');
  if (stats) {
    AGENDA.forEach(function (a, i) {
      var card = document.createElement('div');
      card.className = 'stat reveal' + (i ? ' d' + Math.min(i, 3) : '');
      card.innerHTML = '<span class="stat__title">' + a.title + '</span>' +
                       '<span class="stat__value">' + a.time + '</span>';
      stats.appendChild(card);
    });
  }

  /* ---------- Countdown ---------- */
  var clock = document.getElementById('clock');
  if (clock) {
    var target = new Date(clock.getAttribute('data-target')).getTime();
    var u = {
      days: clock.querySelector('[data-unit="days"]'),
      hours: clock.querySelector('[data-unit="hours"]'),
      mins: clock.querySelector('[data-unit="mins"]'),
      secs: clock.querySelector('[data-unit="secs"]')
    };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var setVal = function (el, n) {
      var v = pad(n);
      if (el.textContent === v) return;
      el.textContent = v;
      el.classList.remove('ticked');
      void el.offsetWidth;
      el.classList.add('ticked');
    };
    var tick = function () {
      var diff = Math.max(0, target - Date.now());
      var s = Math.floor(diff / 1000);
      setVal(u.days,  Math.floor(s / 86400));
      setVal(u.hours, Math.floor((s % 86400) / 3600));
      setVal(u.mins,  Math.floor((s % 3600) / 60));
      setVal(u.secs,  s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Scroll reveal (fail-safe) ---------- */
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
      // Solo revela lo que ya está en pantalla al cargar; el resto al hacer scroll.
      if (r.top < vh * 0.9 && r.bottom > 0) reveal(el);
      else io.observe(el);
    });
  } else {
    document.documentElement.classList.add('reveal-fallback');
  }
  window.addEventListener('beforeprint', function () { document.documentElement.classList.add('reveal-fallback'); });

  /* ---------- Parallax: hero + registro ---------- */
  if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var parallaxItems = [
      { bg: document.querySelector('.hero__bg'),     section: document.getElementById('top'),       speed: 0.10 },
      { bg: document.querySelector('.registro__bg'), section: document.getElementById('registro'),  speed: 0.10 }
    ];
    var onScroll = function () {
      parallaxItems.forEach(function (p) {
        if (!p.bg) return;
        p.bg.style.transform = 'translateY(' + (p.section.getBoundingClientRect().top * p.speed) + 'px)';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Botón "volver arriba" ---------- */
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Volver arriba');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  var toggleTop = function () {
    toTop.classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', toggleTop, { passive: true });
  toggleTop();

  /* ---------- Add to calendar ---------- */
  function toUTC(dstr) {
    var d = new Date(dstr);
    return d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, '0') +
      String(d.getUTCDate()).padStart(2, '0') + 'T' +
      String(d.getUTCHours()).padStart(2, '0') +
      String(d.getUTCMinutes()).padStart(2, '0') +
      String(d.getUTCSeconds()).padStart(2, '0') + 'Z';
  }
  var startU = toUTC(EVENT.start), endU = toUTC(EVENT.end);
  function googleUrl() {
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
      action: 'TEMPLATE', text: EVENT.title, dates: startU + '/' + endU,
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
      'BEGIN:VEVENT', 'UID:' + Date.now() + '@savills.es', 'DTSTAMP:' + startU,
      'DTSTART:' + startU, 'DTEND:' + endU, 'SUMMARY:' + EVENT.title,
      'DESCRIPTION:' + EVENT.desc, 'LOCATION:' + EVENT.location,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  }
  document.querySelectorAll('[data-cal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-cal');
      if (t === 'google') window.open(googleUrl(), '_blank');
      else if (t === 'outlook') window.open(outlookUrl(), '_blank');
      else {
        var a = document.createElement('a');
        a.href = icsUrl(); a.download = 'savills-oficinas.ics';
        document.body.appendChild(a); a.click(); a.remove();
      }
    });
  });

  /* ---------- Form validation ---------- */
  var form = document.getElementById('reg-form');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var fieldOf = function (i) { return i.closest('.field'); };
    function validate(input) {
      var v = input.value.trim(), ok = true;
      if (input.hasAttribute('required') && !v) ok = false;
      if (input.type === 'email' && v && !emailRe.test(v)) ok = false;
      fieldOf(input).classList.toggle('invalid', !ok);
      return ok;
    }
    form.querySelectorAll('input,textarea').forEach(function (input) {
      var recheck = function () { if (fieldOf(input).classList.contains('invalid')) validate(input); };
      input.addEventListener('blur', recheck);
      input.addEventListener('input', recheck);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll('input[required],input[type=email]');
      var ok = true, first = null;
      fields.forEach(function (input) { if (!validate(input)) { ok = false; if (!first) first = input; } });
      if (!ok) { if (first) first.focus(); return; }
      var name = (form.querySelector('#f-name').value || '').trim().split(' ')[0];
      var msg = document.getElementById('success-msg');
      if (name) msg.textContent = 'Gracias ' + name + ', te hemos enviado la confirmación a tu email. Nos vemos el 25 de junio.';
      form.classList.add('done');
    });
    var reset = document.getElementById('reset-form');
    if (reset) reset.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
      form.classList.remove('done');
    });
  }
})();