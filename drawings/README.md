# Drawings

Drawing files for [pages/plans.html](../pages/plans.html), which embeds each
one inline (via `<iframe>`) rather than just linking to it.

- `current.pdf` / `proposed.pdf` — single-page PDFs, extracted from
  `26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf` (pages 2 and 3) with:
  ```
  qpdf --empty --pages "26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf" 2 -- current.pdf
  qpdf --empty --pages "26 Agaton Road, London, SE9 3RW_Proposed_Rev0.pdf" 3 -- proposed.pdf
  ```
  (`qpdf` is on Homebrew: `brew install qpdf`.) The full original PDF is kept
  here too, in case you need one of its other pages later.

To add another drawing to the page: get it down to a single-page PDF (same
`qpdf` trick if it's one page out of a bigger set), drop it in this folder,
then copy one of the `<section class="plan-drawing">` blocks in plans.html
and point its `<iframe src>` at the new file.
