/* ====================================================================
   DASHBOARD — catálogo de eventos
   ==================================================================== */
(function () {
  'use strict';
  if (!Auth.requireAuth('index.html')) return;

  document.getElementById('app-name').textContent = window.EditorConfig.APP_NAME || 'Editor de Landings';
  document.getElementById('logout').addEventListener('click', function () {
    Auth.logout(); location.href = 'index.html';
  });

  var listEl = document.getElementById('list');
  var toastEl = document.getElementById('toast');
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* resuelve una ruta de imagen para mostrarla desde /editor/ */
  function resolveImg(v) {
    if (!v) return '';
    if (/^(data:|https?:|blob:)/.test(v)) return v;
    return '../' + v.replace(/^\.?\//, '');
  }
  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- crear evento nuevo desde la plantilla ---------- */
  document.getElementById('new-event').addEventListener('click', function () {
    var base = JSON.parse(JSON.stringify(window.EVENT_CONFIG)); // clon del config por defecto
    DB.create('Nuevo evento', base).then(function (rec) {
      location.href = 'edit.html?id=' + encodeURIComponent(rec.id);
    }).catch(function (e) { toast('Error al crear: ' + e.message); });
  });

  /* ---------- modal de confirmación ---------- */
  var modal = document.getElementById('modal');
  var pendingDelete = null;
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  function closeModal() { modal.classList.remove('show'); pendingDelete = null; }
  document.getElementById('modal-ok').addEventListener('click', function () {
    if (!pendingDelete) return;
    var id = pendingDelete;
    DB.remove(id).then(function () { closeModal(); render(); toast('Evento eliminado'); });
  });

  /* ---------- render ---------- */
  function render() {
    DB.list().then(function (rows) {
      if (!rows.length) {
        listEl.innerHTML =
          '<div class="empty">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>' +
          '<h2>Todavía no hay eventos</h2>' +
          '<p>Crea tu primer evento para empezar a editarlo.</p>' +
          '</div>';
        return;
      }
      var html = '<div class="grid">';
      rows.forEach(function (r) {
        var cfg = r.config || {};
        var thumb = resolveImg(cfg.hero && cfg.hero.backgroundImage);
        var title = (cfg.hero && cfg.hero.title) || r.projectName || 'Evento';
        html +=
          '<div class="card" data-id="' + r.id + '">' +
            '<div class="card__thumb" style="background-image:url(\'' + esc(thumb) + '\')">' +
              '<span class="card__badge">' + esc(r.projectName || 'Evento') + '</span>' +
            '</div>' +
            '<div class="card__body">' +
              '<div class="card__title">' + esc(title) + '</div>' +
              '<div class="card__meta">Editado ' + fmtDate(r.updatedAt) + '</div>' +
            '</div>' +
            '<div class="card__actions">' +
              '<button class="btn btn--sm btn--accent" data-act="edit">Editar</button>' +
              '<button class="btn btn--sm" data-act="export">Exportar</button>' +
              '<span class="spacer"></span>' +
              '<button class="btn btn--sm btn--ghost" data-act="dup" title="Duplicar">⧉</button>' +
              '<button class="btn btn--sm btn--danger" data-act="del" title="Eliminar">🗑</button>' +
            '</div>' +
          '</div>';
      });
      html += '</div>';
      listEl.innerHTML = html;
    });
  }

  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var card = btn.closest('.card');
    var id = card.getAttribute('data-id');
    var act = btn.getAttribute('data-act');

    if (act === 'edit') {
      location.href = 'edit.html?id=' + encodeURIComponent(id);
    } else if (act === 'dup') {
      DB.duplicate(id).then(function () { render(); toast('Evento duplicado'); });
    } else if (act === 'del') {
      pendingDelete = id;
      modal.classList.add('show');
    } else if (act === 'export') {
      btn.disabled = true; btn.textContent = 'Generando…';
      DB.get(id).then(function (rec) {
        return Exporter.exportEvent(rec);
      }).then(function () {
        btn.disabled = false; btn.textContent = 'Exportar';
        toast('ZIP descargado');
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = 'Exportar';
        toast('Error al exportar: ' + err.message);
      });
    }
  });

  render();
})();
