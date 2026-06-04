/* ====================================================================
   CONFIGURACIÓN DEL EDITOR
   --------------------------------------------------------------------
   IT puede cambiar la contraseña aquí.

   Para generar el hash de una contraseña nueva, abre la consola del
   navegador en esta página y ejecuta:

       await EditorConfig.hash('tu-nueva-contraseña')

   Copia el resultado y pégalo en PASSWORD_HASH.

   ⚠ IMPORTANTE PARA IT: este login es solo una capa de comodidad (UX).
   NO es seguridad real: cualquiera con las DevTools puede saltárselo.
   La protección real debe ponerse en el servidor (HTTP Basic Auth /
   .htpasswd o el SSO corporativo) delante de la carpeta /editor.
   ==================================================================== */
window.EditorConfig = {
  // Contraseña por defecto: "savills2026"
  PASSWORD_HASH: 'f4a769f2cfe60fc45baafc0ee098110a9e6b5201d58d9f314caafcf3e80e0112',

  // Nombre del proyecto/plantilla (se muestra en la cabecera del editor)
  APP_NAME: 'Savills · Editor de Landings',

  // Utilidad para generar hashes (usar desde la consola)
  hash: async function (text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }
};
