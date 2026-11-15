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

## 2. Semantic color roles

- Canvas `#F6F8F7`: application background.
- Surface `#FFFFFF`: panels, forms and tables.
- Ink `#17211C`: titles and primary text.
- Muted `#5C6B63`: helper copy and metadata.
- Border `#DCE5DE`: structural separation.
- Brand green `#198341`: the single visual accent for primary actions, focus
  and selected navigation.
- Brand green dark `#146B34`: hover and active primary controls.
- Destructive red `#B42318` and amber `#9A6700` are semantic states only.

The product is intentionally light-only. This preserves the established PADCI
brand decision; dark mode is not introduced without product approval.

## 3. Type and spacing

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
