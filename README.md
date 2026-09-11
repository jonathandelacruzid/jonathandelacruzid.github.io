# Portfolio template

Static HTML/CSS. No build step, no dependencies, no framework — edit the files and refresh.

## Run it

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. It must be **served**, not opened as `file://` — all paths are
root-relative (`/images/...`).

## Structure

```
index.html                  homepage: hero, project mosaic, about, contact
projects/01..05/index.html  case-study pages, one per project
_astro/global.C__PRQxV.css  all styles (~2000 lines, formatted)
_astro/*.woff2             DM Serif Display + Manrope, self-hosted (SIL OFL)
brand/                      logo.png
images/01..05/, images/about/
```

## Palette — Wandor Bright

Everything routes through the token block at the top of the stylesheet (`:root`). Change a value
there and it propagates site-wide; nothing outside that block hardcodes a color.

The design rule the tokens encode: **paper ground, ink type, teal as the single action color.**
Color is used as light tint, not as field. If you add to this, keep saturated hues for small
accents — the moment a saturated color becomes a section background, the airiness goes.

| Role | Token | Where it lands |
|---|---|---|
| Page ground | `--paper` #FBFAF8 | body, hero, project index, about, decisions |
| Secondary surface | `--paper-warm` #F5F2EE | process bands, contact, case-next, notice |
| Raised block | `--card` #EDE8E2 | case image sections |
| Hairline | `--line` #E6E1DA | every divider and border |
| Type | `--ink` / `--ink-2` / `--ink-3` | body / secondary / labels + captions |
| Action | `--accent` (`--teal-500`) | buttons, focus rings, scratch cover, dots |

### Typography

| Role | Token | Face | Fallback |
|---|---|---|---|
| Display | `--display` | DM Serif Display 400 | `Georgia, serif` |
| Text | `--sans` | Manrope 400 / 500 / 600 | `system-ui, sans-serif` |

Both are self-hosted from `_astro/` — the page makes no external font requests. Manrope ships as
one variable file per subset, declared once with `font-weight: 400 600`, so all three weights come
from the same bytes (4 font files total, ~64K).

DM Serif Display is wider than the face it replaced, so it sits closer to its container on the
narrow breakpoint. If you change the scratch-panel wording, re-check that it still fits on mobile.

### Project slot colors

Each of the five slots owns a tint (its card and case-page bands) and an accent (the italic `em`
in its title). They're deliberately pale — the accent carries the identity, not the background.

| Slot | Tint | Accent |
|---|---|---|
| 01 | `--teal-100` | `--teal-700` |
| 02 | `--sand-100` | `--clay-700` |
| 03 | `--sky-100` | `--sky-800` |
| 04 | `--plum-100` | `--plum-600` |
| 05 | `--sun-100` | `--sun-700` |

The `*-100` tints are additions — your palette ships `--teal-100` at that lightness but not the
others, so the remaining four were mixed to match it. Everything else is your set verbatim.

Case pages alternate tint against neutral (hero tint → process warm → image tint → decisions paper
→ role tint) so no page reads as flat bands of one color.

## Swapping in your images

Remaining placeholders are SVGs in the Wandor palette, labelled with the pixel size the layout
expects. Replace them with your own files at roughly the same aspect ratio and update the `src` —
the extension can change to `.jpg`/`.png`.

The headshot is the one real image. It's used at full size and framed by CSS, not cropped on disk:
`aspect-ratio: 1` plus `object-fit: cover` takes the middle square, and `border-radius: 50%` makes
the circle. Don't add `width`/`height` attributes to that `<img>` — they become presentational
hints that override `aspect-ratio` and stretch the circle into an ellipse.

| File | Size | Used by |
|---|---|---|
| `brand/logo.png` | 160×144 | header, case headers, contact, favicon — black on transparent |
| `images/headshot.jpg` | 3818×3340 | about (CSS crops it square and circles it) |
| `images/cards/01.svg`–`06.svg` | 860×1102 | one project card per slot: peeks from each homepage tile under the Experience button, and shows in full on that case page’s hero |
| `images/03/support-hub.jpg` | 1920×992 | project 03 video poster (frame at 0:30 of the recording) |
| `images/04/simulation.jpg` | 1600×1040 | project 04 video poster (the C-grade feedback moment) |

## Placeholders to replace

Name, role and city are filled in throughout. Still generic: the hero positioning line, project
titles and copy ("Project One", "Decision 1", "Step 1"), and the "Service one" capabilities list.
The contact address is set to jonathandelacruzid@gmail.com.

Project links (`Experience` buttons, `case-button`) currently point at `#`.

## Notes

- Each project slot has its own color treatment, keyed off `.project-tile--01`…`--05` on the
  homepage and `.case-01`…`.case-05` on the body of each case page.
- Case pages vary slightly by design: 01 and 04 have a full-bleed image section, 02 has an optional
  "Project notice" block, 03 frames its preview in a browser chrome, 05 is the simplest.
- The hero scratch panel is ~40 lines of vanilla JS at the bottom of `index.html`. It reads its
  cover color from `--blue`, so it follows your palette. Delete the `.scratch-reveal` div and the
  script together if you don't want it.
- To use fewer than five projects, delete the extra `<article class="project-tile...">` blocks and
  their `projects/NN/` directories. The mosaic is a CSS grid and will reflow.

- **Project modal.** On the homepage, "Experience" goes to that project's case page. There,
  "Open the experience" opens a modal (built by `_astro/project-modal.js`) that reads the project's
  title, category and description from the page. YouTube, Vimeo (including unlisted), Loom and
  Arcade links all play inline — no new tab. Arcade demos widen the modal, since people click inside
  them. Visitors can't paste links: each button names its own media with `data-video="<link>"`,
  and a button without one shows a short "isn't available" message. The hero button is a large
  solid call to action in the case accent, with a "Click here" segment
  (`.case-button-label` + `.case-button-hint`).
- **Media library.** Case pages can carry a `.case-media` section (see `projects/01/`): each
  `.media-item` row is a modal trigger with its own `data-video`, titles the modal from its
  `.media-title`, and autoplays when picked. The list's `data-category` becomes the modal's label.
  Colors follow the page's `--case-accent` / `--case-tint`, set per `.case-0N` body class.

- **Same-site video.** A trigger's `data-video` can point at a file in the site
  (`/video/support-hub.mp4`) — it plays in a `<video>` element inside the modal, with
  `data-poster` as its still. `video/support-hub.mp4` is the Support Hub screen recording,
  compressed from the original 113MB 4K `.mov` (1080p, 30fps, silent track removed).
- **Comparison matrix.** `.case-matrix` (see `projects/03/`) is a real `<table>` that scrolls
  sideways inside its own container on narrow screens. Add `.section--warm` to any paper-colored
  section to flip it to warm when two paper sections end up next to each other.

- **Documents in the modal.** Google Docs, Slides, Sheets and Drive links render through
  Drive's previewer in a taller, scrollable frame (`.pm--doc`). Same-site `.html` documents use
  the same frame; the "Trouble viewing it here?" link only appears for documents hosted elsewhere.
  Project 06's button opens the governance guide from `files/id-governance-guide.html`.
- **Rules list.** `.case-rules` + `.rule-list` (see `projects/06/`) is a numbered two-column list;
  the numbers are drawn by CSS in the page's accent color.

- **Cache versioning.** Every page loads the stylesheet and modal script with `?v=YYYYMMDDNN`.
  After editing either file, bump that number in all six HTML files so browsers fetch the new copy
  instead of reusing a stale one.
- **Document fallback.** When the modal shows a document it adds "Trouble viewing it here? Open the
  document directly ↗" and, if the button has `data-note="…"`, that disclaimer underneath.

- **Same-site documents.** `data-video` can also point at a page in the site (`/files/…html`);
  it opens in the modal's document view. `files/hr-analytics-notebook.html` is project 05's Colab
  notebook rendered for display (a duplicate title cell and the assignment's empty "Your
  interpretation goes here" prompt are left out). On any document button, `data-source` sets where
  the fallback link goes and `data-source-label` replaces its "Trouble viewing it here?" wording.

- **Project 04 media.** "Open the experience" plays `video/crafting-ai-prompts.mp4`, a 21-second
  silent recording of the JavaScript prompt-grading simulation (compressed from the 16MB .mov in
  the same folder). The full published Storyline course is also in the site at
  `courses/crafting-effective-ai-prompts/` (without its .zip and design PDF); a `data-video` path
  under `/courses/` opens in the modal's wide 16:9 player, and any button's `data-note` shows
  beneath the player. The grader itself is `story_content/user.js` inside that course.

- **Six-project grid.** Tile 01 spans the left half of row 1 beside tiles 02–03; tiles 04–06 share
  row 2. Each project keeps its own colours: 01 teal, 02 clay, 03 sky, 04 stone/deep teal,
  05 plum, 06 amber.

## Provenance

The layout, stylesheet and interaction patterns were adapted from salonformat.com. All original
text and imagery has been removed — none of that content is reusable, so replace any remaining
placeholders rather than restoring anything from the source site. The palette and both typefaces
are this project's own; the fonts (DM Serif Display, Manrope) are open source under the SIL OFL.

## Responsiveness & accessibility

- Every page is checked at phone (320–430px, portrait and landscape), tablet (768–1366px) and
  laptop/desktop (1280–2560px) sizes: no sideways scrolling, no overlapping or cut-off text,
  no text under 12px, and a 44px tap area on small links.
- Keyboard and screen readers: a "Skip to main content" link on every page, one consistent
  focus ring, named "Experience" links, sequential headings, and motion switched off for
  visitors who ask their device to reduce it. Muted text (`--ink-3`) clears 4.5:1 contrast.
- Hero scratch panel: vertical swipes scroll the page on phones; the cover clears itself once
  about half is scratched; Enter or Space reveals it from the keyboard.
- **Governance guide.** `files/ID Governance Guidelines.docx.pdf` is shown as
  `files/id-governance-guide.html` — page images (`files/id-governance-guide/`) with each
  page's text kept for screen readers — because phones can't display a PDF inside a page.
  To update it, replace the PDF and re-render the pages.
