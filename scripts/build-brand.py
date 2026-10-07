"""Generate Marky's brand assets.

Produces three SVG files and one React module, all from this single source so
the mark and the wordmark cannot drift apart.

Two decisions worth knowing:

* The wordmark is converted to outlines, so nothing is downloaded and nothing
  reflows. Letterforms come from Outfit, whose SIL OFL 1.1 licence permits this
  (including commercial use) because the family carries no Reserved Font Name.
* The React module inlines the paths instead of pointing at an <img>. An SVG
  referenced that way is a separate document and cannot inherit `currentColor`,
  so the logo would render in default black and disappear on the dark theme.
"""

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

TEXT = "Marky"
FONT = "fonts/outfit.ttf"
WEIGHT = 700
SIZE = 19.6      # em size of the wordmark
GAP = 3.0        # optical space between symbol and wordmark
BRAND = "#c2262f"
WORDMARK_WEIGHT_DESC = "Outfit Bold 700"

# The symbol, in its own 24x24 box. Solid shapes so it survives at 16px.
MARK = [
    '<g transform="rotate(-45 12 12)">',
    '<rect x="9.1" y="4.4" width="5.8" height="11.4" rx="1.6"/>',
    '<path d="M9.1 16.9 14.9 16.9 12 22.1z"/>',
    "</g>",
    '<rect x="5.2" y="20.2" width="13.6" height="2.2" rx="1.1"/>',
]


def wordmark():
    """Return (paths, ink box) for the wordmark, in final pixels.

    Glyph space has y growing up from the baseline, so the SVG transform flips
    it with a negative y scale. Each glyph's pen bounds are in its own origin,
    so the advance must be added back before the union means anything.
    """
    font = TTFont(FONT)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": WEIGHT}, inplace=True)
    s = SIZE / font["head"].unitsPerEm
    gs, cmap = font.getGlyphSet(), font.getBestCmap()

    paths, x_font, x, ink = [], 0.0, 0.0, None
    for ch in TEXT:
        name = cmap.get(ord(ch))
        if not name:
            continue
        pen = SVGPathPen(gs)
        gs[name].draw(pen)
        d = pen.getCommands()
        if d:
            paths.append(
                f'<path transform="translate({x:.2f} 0) scale({s:.5f} {-s:.5f})" d="{d}"/>'
            )

        bp = BoundsPen(gs)
        gs[name].draw(bp)
        if bp.bounds:
            b = (bp.bounds[0] + x_font, bp.bounds[1],
                 bp.bounds[2] + x_font, bp.bounds[3])
            ink = b if ink is None else (
                min(ink[0], b[0]), min(ink[1], b[1]),
                max(ink[2], b[2]), max(ink[3], b[3]),
            )

        x_font += gs[name].width
        x += gs[name].width * s

    # Union of the whole word, converted to screen space (y down).
    return paths, (ink[0] * s, ink[2] * s, -ink[3] * s, -ink[1] * s)


def icon_tile():
    """The app icon: the mark on a rounded brand tile.

    The tile keeps the brand colour rather than `currentColor`, because a logo is
    the one thing that should not shift with the theme — and the white mark only
    has contrast against the brand red, not against the lighter dark-mode accent.
    """
    return (
        f'<rect width="24" height="24" rx="5.5" fill="{BRAND}"/>'
        f'<g fill="#ffffff" transform="translate(3.15 3.15) scale(0.7375)">'
        + "".join(MARK) + "</g>"
    )


def svg_file(path, body, w, h, title, desc, fill="currentColor", extra=""):
    doc = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" '
        f'width="{w:g}" height="{h:g}" fill="none" role="img" '
        f'aria-labelledby="t d">{extra}'
        f'<title id="t">{title}</title><desc id="d">{desc}</desc>'
        f'<g fill="{fill}">{body}</g></svg>'
    )
    with open(path, "w") as fh:
        fh.write(doc + "\n")
    print(f"{path}: {w:g}x{h:g}, {len(doc)} bytes")


def jsx_component(name, uid, title, desc, body, w, h):
    body_indented = "\n        ".join(body)
    return f'''
/**
 * {title}
 *
 * {desc}
 *
 * Outlined, so no font is downloaded. `fill="currentColor"` lets the logo follow
 * the active theme; the standalone files in /public bake in a colour for
 * contexts that cannot inherit one, such as a favicon.
 */
export function {name}({{ className = '', ...props }}) {{
  return (
    <svg
      viewBox="0 0 {w:g} {h:g}"
      width={{props.width ?? {w:g}}}
      height={{props.height ?? {h:g}}}
      className={{className}}
      fill="currentColor"
      role="img"
      aria-labelledby="marky-{uid}-title"
      {{...props}}
    >
      <title id="marky-{uid}-title">{title}</title>
      <g>
        {body_indented}
      </g>
    </svg>
  )
}}
'''


paths, (x0, x1, y_top, y_bottom) = wordmark()
text_w, text_h = x1 - x0, y_bottom - y_top

LOCKUP_W = 24 + GAP + text_w
LOCKUP_H = 24
# Centre the wordmark's ink box against the symbol's optical centre.
ty = (LOCKUP_H - text_h) / 2 - y_top
tx = 24 + GAP - x0

lockup = [*MARK, f'<g transform="translate({tx:.2f} {ty:.2f})">', *paths, "</g>"]

# --- Files -----------------------------------------------------------------
svg_file("out/mark.svg", "".join(MARK), 24, 24,
         "Marky", "El símbolo de Marky: un lápiz escribiendo sobre una línea.")

svg_file("out/logo.svg", "".join(lockup), LOCKUP_W, LOCKUP_H,
         "Marky", "El logotipo de Marky: el símbolo junto a la palabra.")

# A favicon cannot inherit `color`, so the brand colour is baked in and the mark
# sits on a rounded tile.
fav = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">'
    f'<title>Marky</title>' + icon_tile() + "</svg>"
)
open("out/favicon.svg", "w").write(fav + "\n")
print(f"out/favicon.svg: {len(fav)} bytes")

# --- React module ----------------------------------------------------------
component = (
    '/* Generated by scripts/build-brand.mjs — do not edit by hand. */\n'
    '/* Letterforms: Outfit Bold, SIL OFL 1.1, converted to outlines. */\n'
    + jsx_component("Mark", "mark", "Marky (símbolo)",
                    "El símbolo de Marky: un lápiz escribiendo sobre una línea.",
                    MARK, 24, 24)
    + jsx_component("Logo", "logo", "Marky",
                    "El logotipo de Marky: el símbolo junto a la palabra.",
                    lockup, LOCKUP_W, LOCKUP_H)
)
component += f'''
/**
 * El icono de la aplicacion.
 *
 * {{@link icon_tile}}
 */
export function AppIcon({{ className = '', ...props }}) {{
  return (
    <svg
      viewBox="0 0 24 24"
      width={{props.width ?? 24}}
      height={{props.height ?? 24}}
      className={{className}}
      role="img"
      aria-labelledby="marky-appicon-title"
      {{...props}}
    >
      <title id="marky-appicon-title">Marky</title>
      {icon_tile()}
    </svg>
  )
}}
'''
open("out/brand.jsx", "w").write(component)
print(f"out/brand.jsx: {len(component)} bytes")