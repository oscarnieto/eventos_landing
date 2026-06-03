# Savills · Eventos — Landing page

Landing page de eventos para Savills, **dirigida por datos**: todo el contenido vive en
[`data/event.json`](data/event.json) y la plantilla lo renderiza. Esto permite crear
y duplicar landings para distintos eventos sin tocar el código — y es la base del
**editor visual** (próxima fase).

## Estructura

```
.
├── index.html              # Plantilla de la landing (5 secciones)
├── data/
│   └── event.json          # Contenido del evento (lo único que se edita por evento)
├── assets/
│   ├── css/styles.css      # Design system Savills (amarillo #FFDF00 + carbón)
│   ├── js/main.js          # Render desde JSON + cuenta atrás, calendario, formulario, menú
│   └── img/                # Logo, favicon y fotos de ponentes
└── .nojekyll               # GitHub Pages: sirve /assets tal cual
```

## Secciones

1. **Top bar** — navegación fija, transparente sobre el hero y sólida al hacer scroll; menú móvil.
2. **Hero** — sobretítulo, título, subtítulo y highlights (fecha / hora / lugar).
3. **Info** — cuenta atrás en vivo, descripción, highlights y botones de calendario.
4. **Agenda** — timeline + añadir a Google / Apple / Outlook (genera enlaces y `.ics`).
5. **Ponentes** — tarjetas con foto, nombre, cargo y compañía.
6. **Registro** — formulario (nombre, compañía, cargo, email, notas) con validación.
7. **Footer** — logo, Visita Savills.es y redes sociales.

## Formulario de registro

El formulario está **listo para que IT conecte el backend**:

- Si `registration.endpoint` en `event.json` está **vacío** → modo demo (muestra mensaje de éxito en cliente).
- Si se rellena con una URL → el formulario hace `POST` real a ese endpoint con todos los campos.

Los campos se envían con nombres claros: `fullName`, `company`, `jobTitle`, `email`, `notes`, `consent`.

## Probar en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Debe servirse por HTTP (no abrir `index.html` con `file://`), porque carga `event.json` con `fetch`.

## Desplegar en GitHub Pages

Settings → Pages → Source: la rama del proyecto, carpeta `/ (root)`.
No requiere build.
