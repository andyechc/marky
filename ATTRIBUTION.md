# Attribution

## Outfit

The "Marky" wordmark in `public/logo.svg`, `public/mark.svg`,
`public/favicon.svg` and `src/components/brand/index.jsx` is set in **Outfit
Bold** and converted to vector outlines.

- Copyright 2021 The Outfit Project Authors
- Source: https://github.com/Outfitio/Outfit-Fonts
- Licence: SIL Open Font License, Version 1.1 — full text in
  [`public/fonts/OFL-Outfit.txt`](public/fonts/OFL-Outfit.txt)

### What the licence allows

The SIL Open Font License 1.1 permits use, study, modification and redistribution,
**including for commercial purposes**, and embedding in documents and software.
Outfit does not carry a Reserved Font Name, so the outlines in this repository
may be modified and shipped under this project's own terms.

Converting the wordmark to outlines means the shipped SVGs and components have no
font dependency: nothing is downloaded at runtime, nothing reflows, and rendering
is identical in every browser.

### Regenerating

```bash
# Requires Python with fonttools and brotli
python3 -m venv .venv && .venv/bin/pip install fonttools brotli
.venv/bin/python scripts/build-brand.py
```

The script downloads Outfit into a git-ignored cache (`scripts/.cache/`), then
rewrites the three SVGs and `src/components/brand/index.jsx` so the symbol and
the wordmark can never drift apart.