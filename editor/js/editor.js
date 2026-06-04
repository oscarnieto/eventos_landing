/* ====================================================================
   EDITOR — panel de edición + preview en vivo
   ==================================================================== */
(function () {
  'use strict';
  if (!Auth.requireAuth('index.html')) return;

  /* ---------- utilidades ---------- */
  function qs(s, r) { return (r || document).querySelector(s); }
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function setPath(obj, path, val) {
    var keys = path.split('.'), last = keys.pop();
    var t = keys.reduce(function (o, k) { return (o[k] = o[k] || {}); }, obj);
    t[last] = val;
  }
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toInput(iso) { return iso ? String(iso).slice(0, 16) : ''; }
  function fromInput(v) { return v ? (v.length === 16 ? v + ':00' : v) : ''; }

  var toastEl = qs('#toast'), toastT;
  function toast(m) {
    toastEl.textContent = m; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- estado ---------- */
  var id = new URLSearchParams(location.search).get('id');
  var REC = null, CONFIG = null;
  var iframe = qs('#preview'), previewReady = false;

  if (!id) { location.href = 'dashboard.html'; return; }

  DB.get(id).then(function (rec) {
    if (!rec) { toast('Evento no encontrado'); setTimeout(function () { location.href = 'dashboard.html'; }, 1200); return; }
    REC = rec; CONFIG = rec.config;
    qs('#project-name').value = rec.projectName || 'Evento';
    buildPanel();
    iframe.src = '../index.html?preview=1';
  });

  /* ---------- preview ---------- */
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'PREVIEW_READY') { previewReady = true; pushPreview(); }
  });
  function pushPreview() {
    if (!previewReady || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'EVENT_CONFIG', config: CONFIG }, '*');
  }

  /* ---------- guardado (debounced) ---------- */
  var saveState = qs('#save-state'), saveT;
  function markDirty() {
    saveState.textContent = 'Guardando…'; saveState.classList.remove('saved');
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      REC.config = CONFIG;
      REC.projectName = qs('#project-name').value || 'Evento';
      DB.save(REC).then(function () {
        saveState.textContent = 'Guardado'; saveState.classList.add('saved');
      });
    }, 700);
  }
  function change() { markDirty(); pushPreview(); }

  qs('#project-name').addEventListener('input', markDirty);

  /* ====================================================================
     DEFINICIÓN DE LISTAS DINÁMICAS
     ==================================================================== */
  var LISTS = {
    'highlights': {
      sortable: true,
      blank: function () { return { value: '', label: '' }; },
      item: function (it, i) {
        return labelRow('Highlight ' + (i + 1)) +
          '<div class="row-2">' +
          itemInput('highlights', i, 'value', 'Valor', it.value) +
          itemInput('highlights', i, 'label', 'Etiqueta', it.label) + '</div>';
      }
    },
    'agenda': {
      sortable: true,
      blank: function () { return { time: '', title: '' }; },
      item: function (it, i) {
        return labelRow('Punto ' + (i + 1)) +
          itemInput('agenda', i, 'time', 'Hora', it.time) +
          itemInput('agenda', i, 'title', 'Título', it.title);
      }
    },
    'speakers': {
      sortable: true,
      blank: function () { return { name: '', role: '', company: '', photo: '' }; },
      item: function (it, i) {
        var ph = it.photo || '';
        var thumb = ph ? (/^(data:|https?:)/.test(ph) ? ph : '../' + ph.replace(/^\.?\//, '')) : '';
        return '<div style="display:flex;gap:10px;align-items:flex-start">' +
            '<img class="speaker-photo" data-photo-idx="' + i + '" src="' + escHtml(thumb) + '" alt="" title="Cambiar foto">' +
            '<div style="flex:1">' +
              itemInput('speakers', i, 'name', 'Nombre', it.name) +
              itemInput('speakers', i, 'role', 'Cargo', it.role) +
              itemInput('speakers', i, 'company', 'Empresa', it.company) +
            '</div>' +
          '</div>';
      }
    },
    'form.fields': {
      sortable: true,
      blank: function () { return { name: 'campo' + Date.now().toString(36).slice(-4), type: 'text', label: 'Nuevo campo', placeholder: '', required: false, width: 'full' }; },
      item: function (it, i) {
        var types = ['text', 'email', 'tel', 'textarea', 'select'];
        var typeOpts = types.map(function (t) { return '<option value="' + t + '"' + (it.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('');
        var widthOpts = ['full', 'half'].map(function (w) { return '<option value="' + w + '"' + (it.width === w ? ' selected' : '') + '>' + (w === 'full' ? 'Ancho completo' : 'Media fila') + '</option>'; }).join('');
        var html = labelRow(it.label || 'Campo') +
          itemInput('form.fields', i, 'label', 'Etiqueta', it.label) +
          itemInput('form.fields', i, 'placeholder', 'Placeholder', it.placeholder) +
          '<div class="row-2">' +
            '<div class="field-grp"><label>Tipo</label><select class="input" data-list="form.fields" data-index="' + i + '" data-key="type">' + typeOpts + '</select></div>' +
            '<div class="field-grp"><label>Anchura</label><select class="input" data-list="form.fields" data-index="' + i + '" data-key="width">' + widthOpts + '</select></div>' +
          '</div>';
        if (it.type === 'select') {
          html += itemInput('form.fields', i, '_optionsText', 'Opciones (separadas por coma)', (it.options || []).join(', '));
        }
        html += '<label style="display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:600;margin-top:4px;cursor:pointer">' +
          '<input type="checkbox" data-list="form.fields" data-index="' + i + '" data-key="required"' + (it.required ? ' checked' : '') + '> Obligatorio</label>';
        return html;
      }
    }
  };

  function labelRow(title) {
    return '<div class="item__head">' +
      '<span class="item__handle" title="Arrastra para reordenar"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>' +
      '<span class="item__title">' + escHtml(title) + '</span>' +
      '<button class="item__del" data-del title="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>' +
      '</div>';
  }
  function itemInput(list, i, key, label, val) {
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<input class="input" data-list="' + list + '" data-index="' + i + '" data-key="' + key + '" value="' + escHtml(val) + '"></div>';
  }

  function renderList(name) {
    var container = qs('[data-list-container="' + name + '"]');
    if (!container) return;
    var arr = get(CONFIG, name) || [];
    var def = LISTS[name];
    container.innerHTML = arr.map(function (it, i) {
      return '<div class="item" data-index="' + i + '">' + def.item(it, i) + '</div>';
    }).join('');
    if (def.sortable && window.Sortable) {
      Sortable.create(container, {
        handle: '.item__handle', animation: 150,
        onEnd: function () {
          var order = [].map.call(container.children, function (el) { return +el.getAttribute('data-index'); });
          var cur = get(CONFIG, name);
          setPath(CONFIG, name, order.map(function (idx) { return cur[idx]; }));
          renderList(name); change();
        }
      });
    }
  }

  /* ====================================================================
     CONSTRUCCIÓN DEL PANEL
     ==================================================================== */
  function buildPanel() {
    var panel = qs('#panel');
    panel.innerHTML =
      section('Estilo y colores', icoPalette(),
        colorField('theme.accent', 'Color de acento', 'Subtítulo, etiquetas, botones, detalles') +
        colorField('theme.heroText', 'Color de texto de la cabecera') +
        '<hr style="border:none;border-top:1px solid var(--line);margin:16px 0">' +
        colorField('theme.infoBg', 'Color de fondo · Información') +
        colorField('theme.infoText', 'Color de texto · Información'), true) +

      section('Secciones visibles', icoEye(),
        '<p class="field-grp" style="color:var(--muted);font-size:.82rem;margin-bottom:6px">Desactiva una sección para ocultarla de la página.</p>' +
        toggleRow('countdown', 'Cuenta atrás') +
        toggleRow('highlights', 'Highlights') +
        toggleRow('calendar', 'Añadir al calendario') +
        toggleRow('agenda', 'Agenda') +
        toggleRow('speakers', 'Ponentes') +
        toggleRow('registro', 'Formulario de registro'), false) +

      section('Cabecera', icoImage(),
        logoUploader('hero.eventLogo', 'Logo del evento') +
        uploader('hero.backgroundImage', 'Imagen de fondo') +
        field('hero.title', 'Título principal') +
        field('hero.subtitle', 'Subtítulo') +
        field('hero.navCta', 'Texto del botón (menú)') +
        listBlock('highlights', 'Highlights (se muestran en cabecera e información)', 'Añadir highlight'), false) +

      section('Información del evento', icoInfo(),
        field('event.name', 'Nombre / título de sección') +
        textarea('event.description', 'Descripción') +
        '<div class="row-2">' +
          dateField('event.start', 'Inicio') +
          dateField('event.end', 'Fin') + '</div>' +
        field('event.location', 'Lugar (para el calendario)') +
        textarea('event.calendarDescription', 'Descripción para el calendario') +
        '<p class="field-grp" style="color:var(--muted);font-size:.82rem">La cuenta atrás se sincroniza automáticamente con la fecha de <strong>Inicio</strong>.</p>', false) +

      section('Agenda', icoList(),
        listBlock('agenda', 'Puntos de la agenda', 'Añadir punto'), false) +

      section('Ponentes', icoUsers(),
        listBlock('speakers', 'Ponentes', 'Añadir ponente'), false) +

      section('Formulario de registro', icoForm(),
        uploader('registro.backgroundImage', 'Imagen de fondo del formulario') +
        field('form.title', 'Título del formulario') +
        field('form.submitLabel', 'Texto del botón de envío') +
        textarea('form.legal', 'Texto legal (admite HTML)') +
        '<div class="row-2">' + field('form.successTitle', 'Título de éxito') + field('form.resetLabel', 'Texto “otra persona”') + '</div>' +
        textarea('form.successMessage', 'Mensaje de éxito') +
        listBlock('form.fields', 'Campos del formulario', 'Añadir campo'), false) +

      section('Pie de página', icoFooter(),
        field('footer.copy', 'Texto de copyright') +
        '<div class="row-2">' + field('footer.visitLabel', 'Texto del enlace') + field('footer.visitUrl', 'URL del enlace') + '</div>', false);

    // render de las listas
    Object.keys(LISTS).forEach(renderList);

    // acordeón
    panel.querySelectorAll('.section__head').forEach(function (h) {
      h.addEventListener('click', function () { h.parentNode.classList.toggle('open'); });
    });
  }

  /* generadores de HTML */
  function section(title, ico, body, open) {
    return '<div class="section' + (open ? ' open' : '') + '">' +
      '<button class="section__head">' + ico + title +
      '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>' +
      '<div class="section__body">' + body + '</div></div>';
  }
  function field(path, label) {
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<input class="input" data-path="' + path + '" value="' + escHtml(get(CONFIG, path)) + '"></div>';
  }
  function textarea(path, label) {
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<textarea class="input" data-path="' + path + '">' + escHtml(get(CONFIG, path)) + '</textarea></div>';
  }
  function dateField(path, label) {
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<input class="input" type="datetime-local" data-path="' + path + '" data-date="1" value="' + escHtml(toInput(get(CONFIG, path))) + '"></div>';
  }
  function resolveSrc(val) {
    return val ? (/^(data:|https?:)/.test(val) ? val : '../' + val.replace(/^\.?\//, '')) : '';
  }
  function uploader(path, label) {
    var src = resolveSrc(get(CONFIG, path));
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<div class="uploader" data-upload="' + path + '">' +
        '<img class="uploader__preview' + (src ? ' show' : '') + '" src="' + escHtml(src) + '">' +
        '<div class="uploader__txt"><strong>Haz clic</strong> o arrastra una imagen aquí</div>' +
        '<input type="file" accept="image/*">' +
      '</div></div>';
  }
  function logoUploader(path, label) {
    var DEFAULT_LOGO = '../assets/office-pulse-logo.png';
    var src = resolveSrc(get(CONFIG, path));
    var hasCustom = !!src;
    var previewSrc = hasCustom ? src : DEFAULT_LOGO;
    var hint = hasCustom ? 'logo personalizado' : 'logo por defecto';
    var clearBtn = hasCustom ? '<button class="btn btn--sm btn--ghost" data-clear="' + path + '" style="margin-top:8px">Quitar logo (restaurar el de la plantilla)</button>' : '';
    return '<div class="field-grp"><label>' + label + ' <span class="hint">' + hint + '</span></label>' +
      '<div class="uploader uploader--logo" data-upload="' + path + '">' +
        '<img class="uploader__preview uploader__preview--logo show" src="' + escHtml(previewSrc) + '" data-default-logo="' + DEFAULT_LOGO + '">' +
        '<div class="uploader__txt"><strong>Haz clic</strong> o arrastra el logo aquí</div>' +
        '<input type="file" accept="image/*">' +
      '</div>' + clearBtn + '</div>';
  }
  function colorField(path, label, hint) {
    var v = get(CONFIG, path) || '#000000';
    return '<div class="field-grp"><label>' + label + (hint ? ' <span class="hint">' + hint + '</span>' : '') + '</label>' +
      '<div class="color-row">' +
        '<input type="color" class="color-swatch" data-path="' + path + '" data-color="1" value="' + escHtml(v) + '">' +
        '<input class="input color-hex" data-path="' + path + '" data-color-hex="1" value="' + escHtml(v) + '">' +
      '</div></div>';
  }
  function toggleRow(name, label) {
    var on = !(CONFIG.sections && CONFIG.sections[name] === false);
    return '<label class="toggle-row"><span>' + label + '</span>' +
      '<input type="checkbox" class="switch" data-section-toggle="' + name + '"' + (on ? ' checked' : '') + '></label>';
  }
  function listBlock(name, label, addLabel) {
    return '<div class="field-grp"><label>' + label + '</label>' +
      '<div class="items" data-list-container="' + name + '"></div>' +
      '<button class="add-btn" data-add="' + name + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' + addLabel + '</button></div>';
  }

  /* ====================================================================
     EVENTOS DEL PANEL (delegation)
     ==================================================================== */
  var panel = qs('#panel');

  // inputs simples (data-path) + items de lista (data-list/index/key)
  panel.addEventListener('input', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-path')) {
      var val = el.value;
      if (el.hasAttribute('data-date')) val = fromInput(val);
      setPath(CONFIG, el.getAttribute('data-path'), val);
      if (el.hasAttribute('data-color') || el.hasAttribute('data-color-hex')) syncColorPair(el);
      change();
    } else if (el.hasAttribute('data-list')) {
      updateListField(el); change();
    }
  });
  function syncColorPair(el) {
    var row = el.closest('.color-row'); if (!row) return;
    var v = el.value;
    row.querySelectorAll('[data-path]').forEach(function (inp) {
      if (inp !== el && /^#[0-9a-fA-F]{6}$/.test(v)) inp.value = v;
    });
  }
  panel.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-section-toggle')) {
      if (!CONFIG.sections) CONFIG.sections = {};
      CONFIG.sections[el.getAttribute('data-section-toggle')] = el.checked;
      change();
    } else if (el.hasAttribute('data-list')) {
      updateListField(el);
      // si cambió el tipo de un campo de formulario, re-render para mostrar/ocultar opciones
      if (el.getAttribute('data-list') === 'form.fields' && el.getAttribute('data-key') === 'type') renderList('form.fields');
      change();
    }
  });

  function updateListField(el) {
    var list = el.getAttribute('data-list');
    var i = +el.getAttribute('data-index');
    var key = el.getAttribute('data-key');
    var arr = get(CONFIG, list);
    if (!arr || !arr[i]) return;
    if (el.type === 'checkbox') arr[i][key] = el.checked;
    else if (key === '_optionsText') arr[i].options = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    else arr[i][key] = el.value;
  }

  // añadir / eliminar items
  panel.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      var name = add.getAttribute('data-add');
      var arr = get(CONFIG, name) || [];
      arr.push(LISTS[name].blank());
      setPath(CONFIG, name, arr);
      renderList(name); change(); return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      var item = del.closest('.item');
      var container = item.parentNode;
      var name2 = container.getAttribute('data-list-container');
      var idx = +item.getAttribute('data-index');
      var arr2 = get(CONFIG, name2);
      arr2.splice(idx, 1);
      renderList(name2); change(); return;
    }
    // foto de ponente
    var photo = e.target.closest('[data-photo-idx]');
    if (photo) { pickSpeakerPhoto(+photo.getAttribute('data-photo-idx')); return; }
    // quitar logo del evento
    var clear = e.target.closest('[data-clear]');
    if (clear) {
      var cpath = clear.getAttribute('data-clear');
      setPath(CONFIG, cpath, '');
      var up = panel.querySelector('[data-upload="' + cpath + '"]');
      if (up) {
        var img = up.querySelector('.uploader__preview');
        var defaultSrc = img && img.getAttribute('data-default-logo');
        if (defaultSrc) { img.src = defaultSrc; }
        else { img.classList.remove('show'); img.removeAttribute('src'); }
        var lbl = up.parentNode.querySelector('label .hint');
        if (lbl) lbl.textContent = 'logo por defecto';
      }
      clear.remove();
      change(); return;
    }
  });

  /* ---------- uploaders de imagen ---------- */
  panel.addEventListener('click', function (e) {
    var up = e.target.closest('[data-upload]');
    if (up && !e.target.matches('input[type=file]')) up.querySelector('input[type=file]').click();
  });
  panel.addEventListener('change', function (e) {
    var input = e.target;
    if (input.type === 'file' && input.closest('[data-upload]')) {
      var up = input.closest('[data-upload]');
      var path = up.getAttribute('data-upload');
      var file = input.files[0];
      if (!file) return;
      readImage(file, function (dataUrl) {
        setPath(CONFIG, path, dataUrl);
        var img = up.querySelector('.uploader__preview');
        img.src = dataUrl; img.classList.add('show');
        if (up.classList.contains('uploader--logo')) {
          var lbl2 = up.parentNode.querySelector('label .hint');
          if (lbl2) lbl2.textContent = 'logo personalizado';
          if (!up.parentNode.querySelector('[data-clear]')) {
            var b = document.createElement('button');
            b.className = 'btn btn--sm btn--ghost'; b.setAttribute('data-clear', path);
            b.style.marginTop = '8px'; b.textContent = 'Quitar logo (restaurar el de la plantilla)';
            up.parentNode.appendChild(b);
          }
        }
        change();
      });
    }
  });
  // drag & drop sobre uploaders
  panel.addEventListener('dragover', function (e) { var up = e.target.closest('[data-upload]'); if (up) { e.preventDefault(); up.classList.add('drag'); } });
  panel.addEventListener('dragleave', function (e) { var up = e.target.closest('[data-upload]'); if (up) up.classList.remove('drag'); });
  panel.addEventListener('drop', function (e) {
    var up = e.target.closest('[data-upload]'); if (!up) return;
    e.preventDefault(); up.classList.remove('drag');
    var file = e.dataTransfer.files[0]; if (!file || !/^image\//.test(file.type)) return;
    readImage(file, function (dataUrl) {
      setPath(CONFIG, up.getAttribute('data-upload'), dataUrl);
      var img = up.querySelector('.uploader__preview'); img.src = dataUrl; img.classList.add('show');
      change();
    });
  });

  function pickSpeakerPhoto(idx) {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', function () {
      var file = input.files[0]; if (!file) return;
      readImage(file, function (dataUrl) {
        CONFIG.speakers[idx].photo = dataUrl;
        renderList('speakers'); change();
      });
    });
    input.click();
  }

  function readImage(file, cb) {
    if (file.size > 4 * 1024 * 1024) toast('Imagen grande (' + Math.round(file.size / 1024 / 1024) + 'MB): el ZIP será pesado.');
    var r = new FileReader();
    r.onload = function () { cb(r.result); };
    r.readAsDataURL(file);
  }

  /* ---------- barra superior ---------- */
  qs('#back').addEventListener('click', function () { location.href = 'dashboard.html'; });
  qs('#view-desktop').addEventListener('click', function () {
    iframe.classList.remove('mobile');
    this.classList.add('active'); qs('#view-mobile').classList.remove('active');
  });
  qs('#view-mobile').addEventListener('click', function () {
    iframe.classList.add('mobile');
    this.classList.add('active'); qs('#view-desktop').classList.remove('active');
  });
  qs('#open-preview').addEventListener('click', function () {
    window.open('../index.html?preview=1', '_blank');
    setTimeout(pushPreview, 400);
  });
  qs('#export').addEventListener('click', function () {
    var btn = this; btn.disabled = true;
    REC.config = CONFIG; REC.projectName = qs('#project-name').value || 'Evento';
    DB.save(REC).then(function () { return Exporter.exportEvent(REC); })
      .then(function () { btn.disabled = false; toast('ZIP descargado'); })
      .catch(function (err) { btn.disabled = false; toast('Error: ' + err.message); });
  });

  /* ---------- iconos ---------- */
  function ic(p) { return '<svg class="section__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
  function icoImage() { return ic('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'); }
  function icoInfo() { return ic('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'); }
  function icoClock() { return ic('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'); }
  function icoStar() { return ic('<path d="m12 2 3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 9.5 9 9z"/>'); }
  function icoList() { return ic('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'); }
  function icoUsers() { return ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>'); }
  function icoForm() { return ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>'); }
  function icoFooter() { return ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/>'); }
  function icoPalette() { return ic('<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2a4 4 0 0 0 4-4 10 10 0 0 0-12-8z"/>'); }
  function icoEye() { return ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'); }
})();
