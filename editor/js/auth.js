/* ====================================================================
   AUTH — login de comodidad (sessionStorage)
   La seguridad real la pone el servidor (ver config.js).
   ==================================================================== */
window.Auth = (function () {
  'use strict';
  var KEY = 'savills_editor_session';

  async function sha256(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  return {
    /* intenta iniciar sesión; resuelve true/false */
    login: async function (password) {
      var hash = await sha256(password || '');
      if (hash === window.EditorConfig.PASSWORD_HASH) {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        return true;
      }
      return false;
    },

    isLoggedIn: function () {
      try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    },

    logout: function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
    },

    /* protege una página: si no hay sesión, redirige al login */
    requireAuth: function (loginPath) {
      if (!this.isLoggedIn()) {
        location.href = loginPath || 'index.html';
        return false;
      }
      return true;
    }
  };
})();
