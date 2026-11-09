# Design

The site is dark only, in deep navy, and borrows its one idea from the product: information is set as ruled tables.

## Color

Tokens live in `src/css/custom.css` as `--site-*`.

| Role | Token | Value |
| --- | --- | --- |
| Page ground | `--site-ground` | `#0a1424` |
| Surface | `--site-surface` | `#0f1d33` |
| Raised surface | `--site-surface-raised` | `#16273f` |
| Rule | `--site-rule` | `#1e3250` |
| Strong rule | `--site-rule-strong` | `#30496f` |
| Text | `--site-text` | `#e4ecf8` |
| Soft text | `--site-text-soft` | `#b4c4dc` |
| Muted text | `--site-text-muted` | `#93a7c5` |
| Accent | `--site-accent` | `#7fb4ff` |

Syntax colors are in `src/codeTheme.ts`.

## Type

Archivo Variable for text, using its width axis for headings (106% to 112%). JetBrains Mono Variable for code, with ligatures off. Both are self-hosted through Fontsource. Tabular numerals in tables.

## Components

- Tables use horizontal hairlines only, with left-aligned muted headers.
- Callouts have a full 1px border and no thick edge.
- Primary actions are solid accent. Secondary actions have a strong-rule border.
- The home page's signature is the mode switch, which reassigns the steps in a table between "Grid" and "Your API".

## Motion

Short color transitions (160 to 240ms, exponential ease-out), disabled under `prefers-reduced-motion`.
