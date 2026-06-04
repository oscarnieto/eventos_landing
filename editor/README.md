# Editor de Landings — Guía de despliegue (para IT)

Editor visual **100 % estático** (HTML/CSS/JS, sin backend ni base de datos
en servidor) que permite a perfiles no técnicos crear y editar landings de
eventos a partir de la plantilla incluida, previsualizarlas en tiempo real y
exportarlas como un paquete listo para publicar.

---

## 1. Cómo desplegarlo

Copiad **toda la carpeta del proyecto** tal cual a cualquier servidor web que
sirva ficheros estáticos (Apache, Nginx, IIS, etc.). No requiere Node, PHP,
build step ni instalación.

```
/                     ← la plantilla de la landing
  index.html
  styles.css
  app.js
  event-config.js
  image-slot.js
  assets/  fonts/
editor/               ← el editor visual
  index.html          ← login
  dashboard.html      ← catálogo de eventos
  edit.html           ← editor
  js/  css/  libs/
```

- La plantilla queda accesible en `https://vuestro-servidor/`
- El editor queda accesible en `https://vuestro-servidor/editor/`

> El editor necesita servirse vía **http(s)** (no abrir con `file://`),
> porque usa `fetch` para empaquetar la exportación y `IndexedDB` para
> guardar los borradores.

---

## 2. Seguridad y control de acceso ⚠ IMPORTANTE

El login del editor (`editor/index.html`) es **solo una capa de comodidad**.
NO es seguridad real: cualquiera con las herramientas de desarrollador del
navegador podría saltárselo.

**La protección real debe ponerla el servidor delante de la carpeta
`/editor`.** Opciones recomendadas:

- **HTTP Basic Auth** (`.htpasswd` en Apache, `auth_basic` en Nginx)
- El **SSO / Active Directory** corporativo
- Restricción por **IP de red interna / VPN**

Ejemplo Nginx:

```nginx
location /editor/ {
    auth_basic "Área restringida";
    auth_basic_user_file /etc/nginx/.htpasswd-editor;
}
```

### Cambiar la contraseña del login JS

1. Abrid `editor/index.html` en el navegador.
2. En la consola de desarrollador ejecutad:
   ```js
   await EditorConfig.hash('vuestra-nueva-contraseña')
   ```
3. Copiad el hash resultante en `editor/js/config.js` → `PASSWORD_HASH`.

Contraseña por defecto: **`savills2026`** (cambiadla antes de publicar).

---

## 3. Cómo lo usa el equipo (no técnico)

1. Entra en `/editor/` e introduce la contraseña.
2. **Mis eventos**: ve todas las landings creadas. Botón **Nuevo evento**
   para empezar una desde la plantilla.
3. **Editar**: panel a la izquierda (cabecera, info, countdown, highlights,
   agenda, ponentes, formulario, pie) con **previsualización en vivo** a la
   derecha. Los cambios se guardan solos.
4. **Exportar ZIP**: descarga la landing lista para publicar.

### Qué contiene el ZIP exportado

Una carpeta autocontenida con la landing final (`index.html`, `styles.css`,
`app.js`, `event-config.js` con el contenido del evento, y los `assets/` y
`fonts/` necesarios, incluidas las imágenes subidas). Basta con subir esa
carpeta al servidor para publicar el evento.

---

## 4. Notas técnicas

- **Almacenamiento**: los borradores se guardan en el **IndexedDB del
  navegador** de cada usuario (no en servidor). Es local a cada equipo/
  navegador. Para publicar y compartir, se usa la **exportación ZIP**.
- **Imágenes**: se suben desde el equipo del usuario y se incrustan en el
  borrador; al exportar se materializan como ficheros en `assets/`.
- **Librerías incluidas** (sin CDN, en `editor/libs/`): JSZip 3.10.1 (ZIP) y
  SortableJS 1.15.6 (reordenar campos).
- **Compatibilidad**: navegadores modernos (Chrome, Edge, Firefox, Safari).
