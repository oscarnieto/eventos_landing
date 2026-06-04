/* ====================================================================
   EXPORT — empaqueta un evento como landing lista para desplegar (ZIP)
   --------------------------------------------------------------------
   • Genera event-config.js con el contenido del evento.
   • Las imágenes subidas (dataURL) se materializan como ficheros en assets/.
   • Copia los ficheros base de la plantilla (HTML, CSS, JS, fuentes,
     logos y fondos fijos) tal cual.
   El resultado: una carpeta autocontenida que IT sube a su servidor.
   ==================================================================== */
window.Exporter = (function () {
  'use strict';

  /* ficheros base de la plantilla (se copian sin cambios) */
  var BASE_FILES = ['index.html', 'styles.css', 'app.js', 'image-slot.js'];
  var FIXED_ASSETS = [
    'assets/savills-logo.png',
    'assets/savills-logo-mono-black.png'
  ];
  var FONTS = [
    'fonts/Montserrat-Light.ttf', 'fonts/Montserrat-Regular.ttf',
    'fonts/Montserrat-Medium.ttf', 'fonts/Montserrat-SemiBold.ttf',
    'fonts/Montserrat-Bold.ttf', 'fonts/Montserrat-ExtraBold.ttf'
  ];

  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

  function slug(s) {
    return String(s || 'evento').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'evento';
  }

  function dataUrlParts(d) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(d);
    if (!m) return null;
    return { mime: m[1], b64: m[2], ext: EXT[m[1]] || 'png' };
  }

  /* procesa un valor de imagen:
     - dataURL  → lo añade al ZIP como assets/<name>.<ext>, devuelve la ruta
     - 'assets/..' (ruta de plantilla) → la registra para copiar, devuelve igual
     - vacío / http → sin cambios */
  function processImage(zip, value, name, toCopy) {
    if (!value) return value;
    if (/^data:/.test(value)) {
      var p = dataUrlParts(value);
      if (!p) return value;
      var path = 'assets/' + name + '.' + p.ext;
      zip.file(path, p.b64, { base64: true });
      return path;
    }
    if (/^https?:/.test(value)) return value; // URL externa, se deja
    // ruta relativa de la plantilla → copiar el fichero original
    var clean = value.replace(/^\.?\//, '');
    toCopy.add(clean);
    return clean;
  }

  function fetchInto(zip, path) {
    return fetch('../' + path).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + path);
      return r.blob();
    }).then(function (blob) { zip.file(path, blob); });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  return {
    exportEvent: function (rec) {
      if (typeof JSZip === 'undefined') return Promise.reject(new Error('JSZip no cargado'));
      var cfg = JSON.parse(JSON.stringify(rec.config)); // clon
      var zip = new JSZip();
      var toCopy = new Set();

      /* materializar / registrar imágenes del config */
      if (cfg.hero) {
        cfg.hero.backgroundImage = processImage(zip, cfg.hero.backgroundImage, 'hero', toCopy);
        cfg.hero.eventLogo = processImage(zip, cfg.hero.eventLogo, 'event-logo', toCopy);
      }
      if (cfg.registro) {
        cfg.registro.backgroundImage = processImage(zip, cfg.registro.backgroundImage, 'registro', toCopy);
      }
      if (Array.isArray(cfg.speakers)) {
        cfg.speakers.forEach(function (s, i) {
          s.photo = processImage(zip, s.photo, 'speaker-' + (i + 1), toCopy);
        });
      }

      /* event-config.js con el contenido del evento */
      zip.file('event-config.js',
        '/* Generado por el Editor de Landings — ' + new Date().toISOString() + ' */\n' +
        'window.EVENT_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n');

      /* ficheros que hay que copiar de la plantilla */
      var copies = BASE_FILES.concat(FIXED_ASSETS).concat(FONTS);
      toCopy.forEach(function (p) { if (copies.indexOf(p) === -1) copies.push(p); });

      return Promise.all(copies.map(function (p) { return fetchInto(zip, p); }))
        .then(function () { return zip.generateAsync({ type: 'blob' }); })
        .then(function (blob) {
          download(blob, slug(rec.projectName) + '.zip');
        });
    }
  };
})();
