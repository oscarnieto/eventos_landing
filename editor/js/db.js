/* ====================================================================
   DB — almacenamiento de eventos en IndexedDB
   --------------------------------------------------------------------
   Cada evento es un registro autocontenido:
     { id, projectName, updatedAt, config }
   Las imágenes viven como dataURL dentro de config (el export las
   convierte en ficheros reales dentro de assets/).
   ==================================================================== */
window.DB = (function () {
  'use strict';
  var NAME = 'savills_editor', VERSION = 1, STORE = 'events';
  var _db = null;

  function open() {
    return new Promise(function (resolve, reject) {
      if (_db) return resolve(_db);
      var req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { _db = req.result; resolve(_db); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function tx(mode) {
    return open().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function uid() {
    return 'ev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  return {
    /* devuelve todos los eventos, más recientes primero */
    list: function () {
      return tx('readonly').then(function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.getAll();
          req.onsuccess = function () {
            var rows = req.result || [];
            rows.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
            resolve(rows);
          };
          req.onerror = function () { reject(req.error); };
        });
      });
    },

    get: function (id) {
      return tx('readonly').then(function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.get(id);
          req.onsuccess = function () { resolve(req.result || null); };
          req.onerror = function () { reject(req.error); };
        });
      });
    },

    /* crea un evento nuevo y devuelve el registro */
    create: function (projectName, config) {
      var rec = { id: uid(), projectName: projectName || 'Evento sin título', updatedAt: Date.now(), config: config };
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.add(rec);
          req.onsuccess = function () { resolve(rec); };
          req.onerror = function () { reject(req.error); };
        });
      });
    },

    /* guarda (actualiza) un registro existente */
    save: function (rec) {
      rec.updatedAt = Date.now();
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.put(rec);
          req.onsuccess = function () { resolve(rec); };
          req.onerror = function () { reject(req.error); };
        });
      });
    },

    /* duplica un evento */
    duplicate: function (id) {
      var self = this;
      return this.get(id).then(function (rec) {
        if (!rec) throw new Error('No existe');
        var copy = JSON.parse(JSON.stringify(rec.config));
        return self.create((rec.projectName || 'Evento') + ' (copia)', copy);
      });
    },

    remove: function (id) {
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          var req = store.delete(id);
          req.onsuccess = function () { resolve(true); };
          req.onerror = function () { reject(req.error); };
        });
      });
    }
  };
})();
