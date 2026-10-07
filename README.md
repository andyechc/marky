# Marky - Online Editor Markdown

Editor de markdown en el navegador: vista previa en tiempo real, barra de formato,
buscador y reemplazo, y exportación a HTML. No hay servidor, ni cuentas, ni
telemetry: todo se queda en tu navegador.

Funciona igual en móvil y en escritorio.

## ✨ Características

- **Editor y vista previa en tiempo real**, con divisor redimensionable
  (arrastra la barra central) y sincronización de scroll opcional.
- **Panel lateral redimensionable y plegable**, con límites mínimo y máximo,
  arrastre con el ratón, ajuste con las flechas del teclado y doble clic para
  volver al ancho por defecto. El ancho se recuerda entre sesiones.
- **Móvil de verdad**: el panel se convierte en cajón superpuesto y aparece una
  barra inferior para cambiar entre editor, vista previa y acciones de archivo.
  Sin bloqueos por tamaño de pantalla.
- **Números de línea que siguen al ajuste de texto**: se mide el ancho real de
  cada línea, así que los números quedan alineados aunque el texto se ajuste en
  varias filas.
- **Barra de formato completa**: negrita, cursiva, tachado, código, encabezados,
  listas (con viñetas, numeradas y de tareas), citas, tablas, enlaces, imágenes y
  separadores. Funciona con la selección activa.
- **Buscar y reemplazar** con opciones de mayúsculas y expresiones regulares.
- **Paleta de comandos** (`Cmd/Ctrl+Shift+P`) con búsqueda difusa.
- **Esquema del documento** navegable y **archivos recientes** con renombrado.
- **Deshacer / rehacer** con historial propio, independiente del navegador.
- **Edición inteligente**: `Tab` indenta, `Enter` continúa listas y citas,
  `Esc` devuelve el foco a la aplicación.
- **Temas claro, oscuro y sepia**, que respetan la preferencia del sistema en la
  primera visita y se aplican antes del primer pintado (sin parpadeo).
- **Exportación real** a HTML autónomo, texto plano o markdown. El HTML incluye
  estilos, soporte para tema oscuro y reglas de impresión.
- **Atajos completos y verificados**: todo lo que aparece en la ayuda existe.
- **Accesible**: navegación por teclado, enlace para saltar al editor, regiones
  `aria-live`, foco visible y respeto a `prefers-reduced-motion`.
- **Arrastrar y soltar** un `.md` en cualquier parte de la ventana para abrirlo.

## ⌨️ Atajos de teclado

Todos estos atajos están implementados y probados.

### Archivo

| Atajo | Acción |
| --- | --- |
| `Cmd/Ctrl + S` | Guardar documento |
| `Cmd/Ctrl + O` | Abrir archivo |
| `Cmd/Ctrl + Shift + E` | Exportar |
| `Cmd/Ctrl + Shift + N` | Nuevo documento |

### Formato

| Atajo | Acción |
| --- | --- |
| `Cmd/Ctrl + B` | Negrita |
| `Cmd/Ctrl + I` | Cursiva |
| `Cmd/Ctrl + Shift + X` | Tachado |
| `Cmd/Ctrl + E` | Código en línea |
| `Cmd/Ctrl + Shift + E` | Bloque de código |
| `Cmd/Ctrl + 1…4` | Encabezado H1–H4 |
| `Cmd/Ctrl + Shift + 8` | Lista con viñetas |
| `Cmd/Ctrl + Shift + 7` | Lista numerada |
| `Cmd/Ctrl + Shift + 9` | Lista de tareas |
| `Cmd/Ctrl + Shift + .` | Cita |
| `Cmd/Ctrl + Shift + T` | Tabla |
| `Cmd/Ctrl + Shift + I` | Imagen |
| `Cmd/Ctrl + /` | Comentar línea |
| `Cmd/Ctrl + K` | Enlace (con texto seleccionado) |

### Edición

| Atajo | Acción |
| --- | --- |
| `Cmd/Ctrl + Z` | Deshacer |
| `Cmd/Ctrl + Shift + Z` | Rehacer |
| `Tab` | Indentar 2 espacios |
| `Shift + Tab` | Reducir sangría |
| `Enter` | Continuar lista o cita |
| `Cmd/Ctrl + Enter` | Guardar |

### Navegación

| Atajo | Acción |
| --- | --- |
| `Cmd/Ctrl + Shift + P` | Paleta de comandos |
| `Cmd/Ctrl + F` | Buscar y reemplazar |
| `Cmd/Ctrl + \` | Mostrar u ocultar panel lateral |
| `←` / `→` sobre el divisor | Ajustar el ancho del panel |
| `Cmd/Ctrl + ?` | Ayuda de atajos |
| `Esc` | Cerrar diálogo o salir del editor |

## 🎨 Marca

| Archivo | Uso |
| --- | --- |
| `public/logo.svg` | Logotipo completo (símbolo + palabra) |
| `public/mark.svg` | Solo el símbolo, para pantallas estrechas |
| `public/favicon.svg` | Icono con el color de marca incrustado |

La palabra se convirtió a **trazados vectoriales**, así que los SVG no dependen de
ninguna fuente: no hay descargas ni saltos de maquetación, y se ven nítidos a
cualquier tamaño. Los contornos usan `currentColor`, de modo que el logotipo sigue
al tema activo; los archivos sueltos de `/public` llevan el color incrustado
porque un favicon no puede heredar el color del CSS.

Las letras son **Outfit Bold**, bajo SIL Open Font License 1.1. Esa licencia
permite uso comercial, embedding y redistribución, y Outfit no tiene Reserved
Font Name, así que los trazados son libres de editar y publicar. Ver
[`ATTRIBUTION.md`](ATTRIBUTION.md) y `public/fonts/OFL-Outfit.txt`.

Para regenerar los recursos:

```bash
python3 -m venv .venv && .venv/bin/pip install fonttools brotli
.venv/bin/python scripts/build-brand.py
```

## 🛠️ Tecnologías

- **React 18** + **Vite**
- **TailwindCSS** con un sistema de tokens CSS (un tema = un bloque de variables)
- **react-markdown** + **remark-gfm** para el renderizado
- **Lucide React** para iconos

No se usa resaltado de sintaxis de terceros: el visor de código incorporate un
tokenizador propio, lo que evita ~630 kB de gramáticas que no se usaban.

## 📦 Instalación

```bash
git clone https://github.com/andyechc/marky.git
cd marky

bun install
bun run dev      # desarrollo
bun run build    # producción
```

### Scripts

| Script | Qué hace |
| --- | --- |
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Build de producción |
| `bun run lint` | ESLint, sin warnings tolerados |
| `bun run test` | Tests de las transformaciones de markdown y del export a HTML |
| `bun run verify` | `lint` + `test` + `build` |

Los tests cubren la lógica pura que, si se equivoca, corrompe el documento del
usuario: los transforms de la barra de formato y el conversor de markdown a HTML.

## 🗂 Estructura

```
src/
  context/     ajustes, documento (historial + autoguardado) y comandos de edición
  hooks/       registro central de atajos de teclado
  lib/         almacenamiento, transforms de markdown, export a HTML
  components/  shell, editor (textarea, toolbar, buscador, vista previa), UI base
```

Dos decisiones que conviene conocer antes de tocar el código:

1. **Un único registro de comandos.** La barra de formato, los atajos y la paleta
   leen del mismo sitio (`context/editorActionsContext.jsx`), así que un atajo y
   su botón no pueden desincronizarse.
2. **El tema son variables CSS, no clases.** Ningún componente usa `dark:` para
   el color de superficie; cambiar de tema es sustituir un bloque de variables en
   `globals.css`, lo que evita el fallo en que el toggle y las utilidades
   `dark:` discrepaban.

## 🌐 Demo

- [marky-md.vercel.app](https://marky-md.vercel.app/)
- [GitHub](https://github.com/andyechc/marky)

## 📄 Licencia

MIT. Ver [LICENSE](LICENSE).