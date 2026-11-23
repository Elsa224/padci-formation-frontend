# Design System: PADCI LMS

## 1. Visual theme and atmosphere

PADCI is an institutional learning platform. Its interface is calm, direct and
trustworthy: it helps a candidate submit a dossier and an operations team make
careful decisions. This is a daily product UI, not a marketing site.

- Design variance: 3/10. Predictable hierarchy supports comprehension.
- Motion intensity: 2/10. Only hover, focus and route feedback. No scroll
  choreography or automatic decorative motion.
- Visual density: 5/10. Admissions and learning information stay scannable.
- Existing Futura PT files are the brand typography and remain the typeface.

## 2. Semantic color roles - « Forêt & Savane » (2026-11-23)

The interface was perceived as washed-out: one green on near-white, grey
borders everywhere, low-contrast body copy. The palette now has a frame, an
action colour and a signal colour, each with one job.

- Forest `#0D2A1C` (`bg-forest`): the frame - sidebar, and the single
  signature surface per screen (e.g. « Reprendre ma formation »). Raised
  `#143724`, lines `#24493A`, muted text `#9DB8AA`.
- Brand green `#198341` (`bg-primary`): the only action colour (primary
  buttons, focus, links). Hover `#146B34`. Soft wash `#E7F2EB` (`bg-mint`).
- Savane `#E8761E` (`bg-savane`), the orange of the Ivorian flag: a signal,
  never a routine button - active navigation marker, « next step », progress
  of the current course, one accent button per screen at most. Text on
  savane is forest (≈ 6:1). Ink variant `#A24C08`, soft `#FDF0E3`.
- Canvas `#F3F5F2`, surface `#FFFFFF`, ink `#12201A`, body `#33423A`,
  quiet `#56645D`, line `#DDE5DF`, strong line `#C7D3CA`.
- States, one family per meaning, each with `-soft` (background), `-line`
  (border), plain and `-ink` (text): `danger` (red `#D92D20` / ink `#B42318`),
  `warning` (amber `#F79009` / ink `#9A6700`), `info` (blue `#1F6F9F` / ink
  `#175A85`). Success reuses mint + primary. `forest-soft` `#E4EBE6` is an
  opaque forest tint (roles, quiet badges). Raw Tailwind palettes (`red-*`,
  `amber-*`, `blue-*`, `gray-*`, `purple-*`…) are not used in views.

All tokens live in `src/style.css` (`@theme`). Never hard-code a hex in a view.

## 3. Type and spacing

- No tracked ALL-CAPS labels. Context labels use `.app-eyebrow`, field and
  metadata labels `.app-label`, table headers `.app-thead` - sentence case.
- Bold Futura is wide by construction: bold/semibold text is tightened
  globally (−0.022em, headings −0.028em) in `src/style.css`.
- Course content is Markdown rendered by `src/lib/markdown.ts` (escapes all
  HTML first) inside `.app-prose` (≈ 70 characters per line).

- Headings use Futura PT weight 700, tight tracking, practical sizes.
- Body copy uses Futura PT weight 400/500, 1.5-1.65 line height, and a
  readable maximum line length.
- Page title: 28px desktop, 24px mobile. Section title: 20px.
- Spacing follows a 4px rhythm. Page padding is 16px mobile, 28px tablet and
  40px desktop.

## 4. Components

- Shell: 288px sidebar on desktop, accessible overlay drawer on mobile,
  72px sticky header.
- Panels: 16px radius, white surface, one 1px border. Shadows are subtle and
  green-gray tinted; cards are reserved for grouped tasks, not every row.
- Buttons: 10-12px radius, 44px minimum touch target, primary green or quiet
  outline. Pressing a button translates 1px downward.
- Inputs: visible label, 10px radius, 2px green focus ring and inline error.
- Tables: data-focused with modest dividers and a responsive overflow wrapper.
- Loading: skeleton shapes matching the final content; no circular spinner.
- Empty states: helpful next action and no invented metrics or illustrative
  data.

## 5. Layout and responsive behavior

- Use CSS Grid for structural layouts. All multi-column content collapses to
  one column below 768px.
- No content overlap and no horizontal scrolling at 375px.
- The public catalogue uses a slim public header when logged out. It appears
  inside the role-appropriate workspace shell when logged in.
- Candidate routes, dashboard, profile and settings share the learner shell.

## 6. Motion and accessibility

- Animate only opacity and transform, below 180ms for routine feedback.
- Respect `prefers-reduced-motion`: transitions become immediate.
- Focus is always visible. Primary text/buttons meet WCAG AA contrast.
- No decorative animation, glowing effects, carousel or GSAP scroll effects.

## 7. Anti-patterns

- No AI-purple gradients, neon glows, generic stock claims or fake metrics.
- No arbitrary old orange/blue themes in authenticated product areas.
- No duplicate sidebars or standalone full-screen pages within a workspace.
- No emoji in product status or CTA copy.
- No rounded container around every fragment of information.
- No visual feature that changes API authorization, route slugs or form field
  order.


## 8. Building blocks (code)

- Classes: `.app-page`, `.app-page-header`, `.app-page-title`,
  `.app-page-copy`, `.app-panel` (18px radius), `.app-panel-forest`
  (signature surface), `.app-action-primary|secondary|accent`, `.app-input`,
  `.app-chip` + `-leaf|-savane|-neutral|-danger|-warning|-info`,
  `.app-alert` + `-danger|-warning|-info|-success` (inline banners),
  `.app-prose`. A native `<select class="app-input">` gets the palette
  chevron automatically; `textarea.app-input` gets a taller box.
- Page frame: width and gutters are set once by `WorkspaceShell` `<main>`
  (max 1280px). A view root is `.app-page` only - never its own `max-w-*`.
- Access screens (login, sign-up, password, invitation) use
  `features/auth/components/AuthShell.vue`: white form column, forest panel
  that says what the platform offers. No stock photo, no blurred blobs.
- Components (`src/components/app/`): `ProgressBar`, `ProgressRing`,
  `StatTile`, `EmptyState`, and `courseProgress()` for a course outline.
- shadcn-vue: `Button` gains `variant="accent"` (savane), sizes aligned on
  44px touch targets; `Badge` gains `leaf | savane | neutral | danger |
  warning | info` tones. `Input` (44px, white, primary focus ring), dropdown
  menus (mint hover, 12px radius), dialogs (18px, forest overlay), tooltips
  (forest), cards and tables follow the same tokens.
- Indicators are grouped in one stat band (summary before detail), not one
  card per number. Lists are rows with dividers, not grids of identical cards.
