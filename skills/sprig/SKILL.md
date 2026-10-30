---
name: sprig
description: Build semantic, accessible interfaces with Sprig CSS using its local contract, searchable HTML recipes, whole-module builds, and limited static checks.
---

# Sprig

Use semantic HTML first; Sprig supplies presentation, not application behavior.
The CLI is deterministic and local: no LLM, external API, API key, or network is required.
No published npm installation is assumed. Do not install dependencies for retrieval.
Do not change global agent instructions, permissions, hooks, or harness settings.

## 1. Read the actual contract

Commands below run from the **Sprig repository root**, using Node.js 22 or newer.
Read `data/contract.json`, or print the same contract:

```sh
node bin/sprig.js contract
```

Use only documented classes, attributes, tokens, and module IDs. Read the relevant
`src/*.css` if exact styling matters; do not invent utility classes or behavior.
With an already installed package, read its files under
`node_modules/@sprig-kit/css/` instead of assuming they exist in the app root.
For example, run `node node_modules/@sprig-kit/css/bin/sprig.js contract`.
Use that package CLI path for the recipe, build, and check commands below too;
HTML inputs and output paths still resolve from your application's working directory.

## 2. Retrieve a focused recipe

```sh
node bin/sprig.js recipe "contact form" --limit 1 --json
node bin/sprig.js recipe "modal dialog" --limit 1 --json
```

Search is weighted, case-insensitive literal matching of query terms against
`id`, `title`, `tags`, and `description`, not semantic search or code search.
Try concrete terms such as `popover`, `validation error`, `responsive cards`,
`navigation skip link`, `scrollable table`, or `empty state` if results are weak.
Read the returned `html`, optional `js`, and `checks`; do not copy HTML alone
when the behavior depends on its JavaScript.

## 3. Implement and build

- Adapt content and heading levels to the host document. Give full pages a
  language, title, viewport metadata, and one main landmark.
- Keep IDs unique and update every label, fragment, popovertarget, and ARIA ID
  reference when reusing a recipe. Run its JS after the markup exists, once per instance.
- Keep labels visible. Connect textual errors with `aria-describedby` and set
  `aria-invalid` only for known errors. Validate again on the server when applicable.
- Use explicit button types for actions and real links for navigation, never
  anchors with `role=button`. Native `disabled` prevents activation; ARIA alone does not.
- Open modal dialogs with `showModal()` and close with `close()` using explicit
  listeners. CSS cannot implement validation, state, focus management, or submissions.
- Preserve the popover recipe's native controls and details fallback. Prefer
  details alone when an in-flow disclosure is sufficient.
- Local form demos do not send data; the note demo persists only until reload.
  Wire real application behavior before claiming delivery, storage, or success.

```sh
node bin/sprig.js build --html page.html --out sprig.css
# Runtime-generated markup: safest complete stylesheet
node bin/sprig.js build --all --out sprig-all.css
# Or explicitly retain runtime modules alongside scanned static HTML
node bin/sprig.js build --html page.html --include forms,overlays --out sprig-runtime.css
```

Builds retain **whole modules**, not individual selectors. Static scanning does
not discover runtime templates or HTML hidden inside JavaScript. Use `--all` or
`--include` for every module needed at runtime. Choose an output path appropriate
to the app and link the generated stylesheet; overwriting requires explicit `--force`.

Override tokens in application CSS, not generated CSS. Sprig uses cascade layers;
normal unlayered application styles outrank its normal layered declarations:

```css
:root { --sprig-radius: .4rem; --sprig-width: 68rem; }
```

Test overrides in both themes. Scope palette overrides appropriately, including
`[data-theme="dark"]` and system-theme behavior; do not break text or focus contrast.

## 4. Check narrowly, then test real accessibility

```sh
node bin/sprig.js check page.html --json
```

This is a limited static lint, not an HTML validator or accessibility audit.
A clean result does not prove contrast, names, focus behavior, or working actions.
Follow each recipe's checks in an actual browser: Tab/Shift+Tab, Enter/Space,
Escape, skip-link focus, modal focus containment and return, form errors, popover
fallback, and keyboard table scrolling. Test at 320 CSS pixels and 400% zoom,
with light/dark themes, forced colors, and reduced motion where relevant.
Use a screen reader to check landmarks, labels, descriptions, table headers, and
status announcements; run the host project's existing accessibility tests too.
Report which tests actually ran and any remaining gaps; do not call lint an audit.
