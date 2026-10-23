# Tally Design System

This file is the visual source of truth for the demo interface. Keep feature implementation aligned with these tokens and interaction rules.

## Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| `background` | `#F6F4F0` | Application background |
| `surface` | `#FFFFFF` | Cards, panels, tables, and inputs |
| `foreground` | `#0E1726` | Primary text and strong borders |
| `muted` | `#64748B` | Secondary text, metadata, and inactive icons |
| `line` | `#E4E6E9` | Dividers and neutral borders |
| `primary` | `#1E3A5F` | Navigation, primary actions, and focus accents |
| `primary-soft` | `#EDF2F8` | Selected and highlighted surfaces |
| `success` | `#15803D` | Healthy inventory and completed states |
| `warning` | `#B45309` | Low stock, deadlines, and expiration warnings |
| `danger` | `#991B1B` | Critical stock and destructive states |
| `accent` | `#6B7A3F` | Supporting accent color |

The same tokens are defined as CSS custom properties in `src/app/globals.css` and mapped in `tailwind.config.ts`.

## Typography

- Interface font: Inter.
- Numeric values, codes, timestamps, and compact labels: JetBrains Mono.
- Use sentence case for page titles, buttons, table headings, and navigation.
- Prefer clear hierarchy through size and weight rather than additional colors.

## Layout

- Design mobile-first, with tablet and desktop as the primary demo targets.
- Use a persistent sidebar for application routes on larger screens.
- Keep page content inside a consistent application shell.
- Use spacing in multiples of 4px.
- Prefer compact operational layouts with clear scan paths.

## Components

- Use shadcn/ui primitives as the base for buttons, inputs, dialogs, tables, badges, and menus.
- Shared primitives belong in `src/components/ui`.
- Shared application chrome belongs in `src/components/layout`.
- Feature-specific components remain inside their feature folder.
- Avoid inline styles; use Tailwind classes and the defined tokens.

## Interaction states

- Every interactive control must have visible hover, active, disabled, and focus states.
- Focus indicators must remain visible for keyboard navigation.
- Status must never rely on color alone; pair color with text or an icon.
- Touch targets should be at least 44px high where practical for tablet use.

## Accessibility

- Use semantic HTML and explicit form labels.
- Maintain readable color contrast.
- Preserve logical keyboard navigation order.
- Icon-only actions require accessible names.
- Do not remove focus outlines without providing an equivalent visible style.
