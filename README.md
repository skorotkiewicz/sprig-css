# Sprig 🌱

**Good HTML. Great by nature.**

Semantic CSS and a shared field guide for humans and coding agents. A new project inspired by Pico’s best idea: meaningful HTML should look good without a second language of classes.

- **Plain modern CSS:** cascade layers, custom properties, OKLCH enhancement with hex fallbacks.
- **HTML first:** native forms, disclosures, modal dialogs, and popovers.
- **Seven classes:** layout and accessibility, not hundreds of atomic instructions.
- **Automatic light/dark:** explicit theme overrides, reduced-motion and forced-colors accommodations, logical properties for RTL.
- **A shared vocabulary:** machine-readable contract, eight searchable recipes, a provider-independent agent skill.
- **Optional packing:** a dependency-free Node CLI selects whole CSS modules for static HTML.
- **No runtime dependencies, model calls, telemetry, webfonts, or CDN requirement.**

**Status: 0.1 prototype.** Not affiliated with Pico CSS; not a drop-in replacement. Package naming is local and no registry publication is implied. “Perfect” is a direction, not a claim of accessibility or browser conformance.

## Try it

Copy [`dist/sprig.css`](dist/sprig.css) beside your page:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="sprig.css">
    <title>A good beginning</title>
  </head>
  <body>
    <main>
      <h1>Hello, good things.</h1>
      <p>A little structure. A lot of possibility.</p>
      <article>
        <h2>Native is a feature.</h2>
        <details>
          <summary>Tell me more</summary>
          <p>The browser already knows how this works.</p>
        </details>
      </article>
    </main>
  </body>
</html>
```

No build step needed to use the stylesheet. [Working starter](examples/starter.html) · [Interactive field guide](docs/guide.html) · [Design decisions](docs/decisions.md) · [Migration from Pico](docs/migration.md)

## Run the playground

Node **22+** is needed for tools, not for the CSS.

```sh
npm install --ignore-scripts
npm run build
npm run dev
# Open http://127.0.0.1:4173
```

The server binds only to loopback and serves an allowlist of public files. The gallery’s form is local-only; it neither transmits nor stores the entered email. The demo theme preference is stored locally when browser storage is available.

## A vocabulary you can remember

| Class | Purpose |
| --- | --- |
| `container` | Centered, bounded content; body’s direct header/main/footer already have this |
| `stack` | Vertical rhythm |
| `cluster` | Wrapping horizontal row |
| `grid` | Responsive auto-fit columns |
| `overflow` | Horizontal scrolling wrapper |
| `sr-only` | Visually hidden accessible content, revealed on focus |
| `skip-link` | Focus-revealed skip navigation |

Use real `button` elements for actions and links for navigation. `article` styles a card; `details`/`summary` work without JavaScript. Buttons accept `data-variant="quiet"` or `"danger"`. `data-callout="note"`/`"danger"` and `data-badge` cover small annotations. Native dialog/popover behavior still has to be wired correctly—CSS is not application logic.

### Make it yours

```css
/* Your unlayered CSS, after Sprig. */
:root {
  --sprig-radius: .25rem;
  --sprig-width: 68rem;
  --sprig-space: 1.25rem;
}
```

Set `data-theme="light"` or `"dark"` on `html`; remove it for OS preference. Override `--sprig-accent` and `--sprig-on-accent` together, separately for light/dark/automatic modes, and check contrast. See [the guide](docs/guide.html#themes) for a complete example and all 17 tokens.

## The agent half

Start at [`llms.txt`](llms.txt) or [`skills/sprig/SKILL.md`](skills/sprig/SKILL.md). The skill is intentionally small: inspect the contract, retrieve the relevant recipe, implement, verify. Install it manually in your agent’s supported skills directory if desired; no automatic harness edits.

```sh
node bin/sprig.js contract
node bin/sprig.js recipe "accessible contact form"
node bin/sprig.js recipe "modal dialog" --json
node bin/sprig.js check examples/starter.html --json
```

[`data/contract.json`](data/contract.json) is the public styling vocabulary; [`data/recipes.json`](data/recipes.json) contains copyable HTML, explicit JavaScript where necessary, and accessibility checks. Retrieval is a deterministic weighted text search, not AI reasoning. No service, key, or provider is required.

## Pack light, safely

```sh
# Full build
node bin/sprig.js build --all --out sprig.css

# Union of modules for static HTML pages
node bin/sprig.js build --html index.html --html about.html --out pages.css

# Keep runtime-only content too
node bin/sprig.js build --html index.html --include overlays,forms --out app.css
```

Always keeps tokens, base, and layout; selects buttons, forms, cards, tables, and overlays by static HTML tags/attributes. Whole modules preserve states, media queries, and dependencies. **This is not selector purging, template execution, a JSX parser, a minifier, or the native compiler suggested in Pico’s retirement note.** For dynamic frameworks, use the full CSS or explicitly include runtime modules. Existing output requires `--force`; an input HTML path is never a valid output.

CLI exit codes: **0** completed, **1** lint findings, **2** invocation/I/O error. `check` is a deliberately limited static lint, **not** an HTML validator or accessibility audit. See `node bin/sprig.js --help`.

For local package testing, `npm pack` creates a tarball including the built stylesheet, CLI, source modules, contract, recipes, and skill. Install that tarball into a consumer project; do not assume this package exists on npm.

## Quality gates

```sh
npm run check                       # rebuild + Node tests + starter lint
npx playwright install chromium    # first-time browser download
npm run test:browser                 # live browser interactions + axe
```

Tests cover selection/packing, scanner edge cases, CLI file safety and exit codes, retrieval, contract/CSS consistency, recipe markup, default color contrast, native interaction, theme persistence, reduced motion, RTL, and narrow viewports. Browser tests create screenshots under `test-results/`; inspect them alongside automated checks.

Current stable Chromium, Firefox, and Safari are the target, not a verified compatibility matrix. Automated browser coverage currently uses Chromium. Hex colors precede OKLCH; optional anchor positioning falls back to centered native popovers. Unsupported native popovers need an application fallback (the gallery demonstrates one). Pre-cascade-layer browsers and IE are not supported. Keyboard, screen-reader, zoom, and product-specific accessibility checks remain your responsibility.

## Why another CSS thing?

Because an LLM can generate CSS, but a team still benefits from **shared constraints**. Sprig gives humans and agents the same small API, examples, and checks instead of encouraging each generation to invent a new design system. The wild idea isn’t more AI. It’s less guessing.

Sprig does not use Pico’s name or logo as its identity. Read [NOTICE](NOTICE) for origins and [the decisions](docs/decisions.md) for the ten-idea pour, the sober ranking, tradeoffs, and unfinished work.

## License

[MIT](LICENSE). Independent rewrite, with gratitude to Pico. No affiliation or endorsement implied.
