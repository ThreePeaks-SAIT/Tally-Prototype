# Tally Design System

This document is the shared visual and interaction standard for the Tally demo. It exists so independently built features feel like one product.

## 1. Core principles

1. **Use tokens, not raw values.** Use semantic classes such as `bg-primary`, `text-foreground-muted`, and `border-border`. Do not place hex colors in feature components.
2. **Desktop and tablet are primary.** Build mobile-first CSS, but optimize the final experience for kitchen tablets and laptops.
3. **Use shadcn/ui as the primitive layer.** Add and adapt a shadcn primitive when a feature needs it. Do not install unused components in advance.
4. **Consistency beats novelty.** Reuse established variants and patterns. Add a new variant only when the existing hierarchy cannot communicate the intended meaning.
5. **Accessibility is part of the component.** Keyboard behavior, focus visibility, labels, contrast, and touch-target size are required states, not later enhancements.

## 2. Source of truth

- CSS variables: `src/app/globals.css`
- Tailwind mappings: `tailwind.config.ts`
- Shared UI primitives: `src/components/ui/`
- Shared application chrome: `src/components/layout/`
- Feature-specific composition: `src/features/<feature>/components/`

Do not create a second JavaScript or TypeScript copy of the visual tokens. CSS variables are the single source of truth.

## 3. Color

### Neutral and brand tokens

| Token | Reference | Usage |
| --- | --- | --- |
| `background` | `#F6F4F0` | Application background |
| `surface` | `#FFFFFF` | Cards, tables, inputs, and panels |
| `surface-muted` | `#FBFAF7` | Subtle hover and secondary surfaces |
| `foreground` | `#0E1726` | Primary text and strongest actions |
| `foreground-muted` | `#64748B` | Secondary text and inactive icons |
| `foreground-subtle` | `#94A3B8` | Tertiary metadata and placeholders |
| `border` | `#E4E6E9` | Default borders and dividers |
| `border-soft` | `#EFF1F3` | Low-emphasis separators |
| `primary` | `#1E3A5F` | Brand actions, active navigation, and focus |
| `primary-foreground` | `#FFFFFF` | Content displayed on primary |
| `primary-soft` | `#EDF2F8` | Selected rows and informational surfaces |
| `accent` | `#6B7A3F` | Supporting accent and owner identity |
| `accent-soft` | `#E8EDD6` | Soft accent surface |

### Semantic tokens

| Meaning | Strong token | Soft token | Usage |
| --- | --- | --- | --- |
| Success | `success` | `success-soft` | Healthy stock and completed states |
| Warning | `warning` | `warning-soft` | Low stock, deadlines, and expiration |
| Danger | `danger` | `danger-soft` | Critical stock and destructive actions |

Use semantic colors only for their named meaning. Never use danger red as decoration or success green for a neutral selected state.

Status must not rely on color alone. Pair it with a label, icon, or both.

## 4. Typography

Inter is the interface typeface. JetBrains Mono is reserved for quantities, money, codes, timestamps, and compact operational labels.

| Tailwind utility | Size / line height | Intended use |
| --- | --- | --- |
| `text-micro` | 10 / 14px | Uppercase mono labels |
| `text-caption` | 11 / 16px | Metadata and timestamps |
| `text-body-sm` | 13 / 20px | Dense tables and secondary copy |
| `text-body` | 15 / 24px | Default readable content |
| `text-title-sm` | 17 / 24px | Card and section headings |
| `text-title` | 20 / 26px | Strong section headings |
| `text-page-title` | 24 / 30px | Page titles |
| `text-display` | 34 / 38px | Large numeric or presentation emphasis |

Rules:

- Use sentence case for headings, navigation, table headings, and buttons.
- Use `font-mono tabular-nums` when columns contain numeric values.
- Use `tracking-tight` for page and section headings.
- Use `tracking-widest uppercase` only for short operational labels.
- Preserve semantic HTML (`h1`, `h2`, `label`, `p`) instead of selecting an element only for its appearance.

## 5. Spacing and sizing

Use Tailwind's 4px spacing rhythm. Prefer its standard scale and avoid arbitrary values unless matching a verified prototype measurement.

| Purpose | Standard |
| --- | --- |
| Inline icon gap | 8px (`gap-2`) |
| Compact control padding | 12px (`px-3`) |
| Card padding | 16–24px (`p-4` to `p-6`) |
| Section gap | 24px (`gap-6`) |
| Page padding | 24px tablet, 28–32px desktop |
| Minimum primary control height | 44px (`h-11`) |
| Compact table control height | 36px (`h-9`) |

Do not make core tablet actions smaller than 44px unless they sit inside a dense desktop-only table row.

## 6. Radius and elevation

| Token | Value | Usage |
| --- | --- | --- |
| `rounded-sm` | 6px | Pills and compact controls |
| `rounded` | 8px | Inputs and buttons |
| `rounded-md` | 10px | Cards and panels |
| `rounded-lg` | 14px | Dialogs and prominent cards |

Elevation levels:

- `shadow-card`: flat card boundary; use for most panels.
- `shadow-elevated`: focused or featured card.
- `shadow-modal`: dialogs and floating overlays only.

Prefer borders over shadows for the normal application hierarchy.

## 7. Layout and responsiveness

- Use one shared application shell for Dashboard, Inventory, and Count.
- Keep navigation and page chrome in `components/layout`, never inside a feature.
- At `md` and above, use the persistent application navigation defined by the prototype.
- Below `md`, preserve access to every primary action without horizontal page scrolling.
- Tables may use controlled horizontal scrolling on narrow screens; primary actions must remain visible.
- Avoid fixed content heights unless required for the full-height application shell.

## 8. Component standards

### Buttons

| Variant | Purpose |
| --- | --- |
| `default` | Primary action: Save, Continue, Start count |
| `outline` | Secondary action: Cancel, Filter, Pause |
| `ghost` | Low-emphasis and icon-only actions |
| `destructive` | Irreversible or destructive actions |

The default action uses `bg-primary text-primary-foreground`. A screen should normally have only one visually dominant action per section.

Sizes:

- `sm`: dense desktop controls, 36px high.
- `default`: standard actions, 44px high.
- `icon`: square 44px touch target unless used in a dense desktop table.

### Inputs

- Standard height: 44px.
- Default surface: `bg-surface` with `border-border`.
- Placeholder: `text-foreground-subtle`.
- Focus: visible primary ring with sufficient offset from the background.
- Errors: danger border plus a written error message.
- Every field requires a programmatically associated label.

Use React Hook Form and Zod when a feature contains meaningful validation or a multi-field workflow. They are not required for a simple local search field.

### Cards and panels

- Default: `bg-surface`, `rounded-md`, `shadow-card`.
- Use 16–24px internal padding.
- Avoid nesting multiple elevated cards.
- Use a divider or spacing before adding another background color.

### Status pills

Use a single shared `Pill` or `Badge` primitive with these semantic variants:

- `success`: OK, completed, delivered.
- `warning`: low, expiring, due soon.
- `danger`: critical, out, failed.
- `info`: draft, selected, in progress.
- `neutral`: inactive metadata.

Pills use compact text and may include a dot or icon. Their label must remain understandable without color.

### Tables

- Keep headers short and left aligned; numeric columns may be right aligned.
- Use mono tabular numbers for quantities and prices.
- Use a consistent row height within each table.
- Provide a visible row hover state only when the row is interactive.
- Do not hide essential data behind hover-only interactions.

### Icons

Use one icon library consistently. When Lucide is introduced, use these sizes:

- 14px: inline with compact text.
- 16px: default navigation and inputs.
- 20px: standard buttons.
- 24px: prominent empty states or headers.

Icon-only buttons require an accessible name such as `aria-label`.

## 9. Interaction states

Every interactive component must define:

- default;
- hover;
- active or pressed;
- focus-visible;
- disabled;
- loading, when an operation is asynchronous;
- error, when the operation can fail.

Motion should clarify a state change and remain brief. Do not add decorative animation to operational workflows.

## 10. Feature implementation rules

- Route files in `src/app` only import and render the feature entry point.
- Add reusable primitives to `components/ui` only after a second concrete use appears or when the primitive is clearly application-wide.
- Keep feature-specific components inside their owning feature.
- Import another feature only through its public `index.ts`; `features/speech` is the planned shared feature for Count.
- Install shadcn components individually when a feature needs them.
- Do not copy a shared component into multiple feature folders.
- Do not add a component-gallery route during the demo phase; this document and the implemented primitives are the reference.

## 11. Accessibility checklist

- Semantic headings follow a logical order.
- Inputs have visible labels.
- All actions are keyboard reachable.
- Focus remains clearly visible.
- Text and controls meet readable contrast.
- Color is never the only status indicator.
- Icon-only actions have accessible names.
- Tablet touch targets are at least 44px where practical.
- Reduced-motion preferences are respected when motion is introduced.

## 12. Pull request checklist

Before requesting review:

- No raw color values appear in a feature component.
- Existing tokens and variants are reused.
- The feature works at tablet and desktop widths.
- Keyboard focus and labels were checked.
- Loading, empty, and error states are considered where applicable.
- New shared primitives are documented in this file.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
