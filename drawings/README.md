# Drawings

Drawing files for [pages/plans.html](../pages/plans.html), which shows each
one as a plain image on the page (no PDF viewer widget), linked through to
the original PDF for a lossless/zoomable copy.

- `current.pdf` / `proposed.pdf` — single-page PDFs, extracted from
  `26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf` (pages 2 and 3) with:
  ```
  qpdf --empty --pages "26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf" 2 -- current.pdf
  qpdf --empty --pages "26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf" 3 -- proposed.pdf
  ```
  (`qpdf` is on Homebrew: `brew install qpdf`.) The full original PDF is kept
  here too, in case you need one of its other pages later.
- `current.png` / `proposed.png` — rasterized from the PDFs above with:
  ```
  pdftoppm -png -scale-to-x 2000 -scale-to-y -1 current.pdf current
  pdftoppm -png -scale-to-x 2000 -scale-to-y -1 proposed.pdf proposed
  ```
  (`pdftoppm` is part of Homebrew's `poppler`: `brew install poppler`.) This
  names the output `current-1.png` — rename it to `current.png`.

To add another drawing to the page: get it down to a single-page PDF (same
`qpdf` trick if it's one page out of a bigger set), rasterize it to a PNG the
same way, drop both in this folder, then copy one of the
`<section class="plan-drawing">` blocks in plans.html and point its
`<img src>`/`<a href>` at the new files.
