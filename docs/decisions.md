# Why Sprig exists

## The soul, not the machinery

Pico made meaningful HTML immediately useful and pleasant. That is the good bone to keep. Sass-driven permutations, a historical class vocabulary, CDN-first distribution, and a strict fork identity are not the soul.

The archive note points toward plain CSS, OKLCH, layers, native UI primitives, customization, and pruning. We keep those directions where they fit a useful small release. We do **not** pretend a JavaScript module packer is the native compiler the note describes.

## The pour: ten possible futures

The first answer was “port the Sass to CSS.” Boring, but useful as a baseline. Then we used inversion, wrong constraints, wrong medium, collision, and deletion of a sacred cow to go further.

| Idea | The creative move | Excitement / 5 | Feasibility / 5 |
| --- | --- | --- | --- |
| 1. Fresh coat | Port the Sass and call it modern | 1 | 5 |
| 2. CSS seed packet | One small stylesheet, zero runtime dependencies | 3 | 5 |
| 3. HTML is the SDK | Delete the component API; make native elements the API | 4 | 5 |
| 4. Field guide | Treat a framework as a pocket nature guide for people and agents | 5 | 5 |
| 5. Disappearing framework | Pack the modules a page uses, leave no runtime behind | 5 | 4 |
| 6. Design passport | Store a project’s decisions so each agent doesn’t redesign it | 4 | 4 |
| 7. CSS terrarium | Interactive specimens instead of a glossy feature brochure | 4 | 5 |
| 8. Browser union | Let native controls do work usually outsourced to libraries | 4 | 5 |
| 9. A stylesheet that argues back | Lint semantic mistakes before debating visual taste | 5 | 3 |
| 10. Compost compiler | Learn from every page, synthesize and discard a framework per build | 5 | 1 |

The three rewrite paths were **Smooth** (modern CSS framework), **Spicy** (framework + searchable shared design knowledge), and **Unhinged** (the framework packs itself and disappears).

## The sober pick

Combine 2–5 and 7–9, but pull the dangerous bits back to an interesting seven:

- **A small semantic foundation**, not a universal UI kit.
- **A field guide**, not a huge mandatory knowledge dump.
- **Deterministic retrieval**, not a fictional AI designer.
- **Whole-module packing**, not brittle selector elimination.
- **A few static checks**, not a claim of accessibility certification.
- **A living specimen sheet**, not screenshots of imagined components.

The kernel of the absurd “compost compiler” is useful: the output can be just CSS, with no dependency on the tool that produced it. Learning from user pages, telemetry, model-generated design systems, and self-modifying build rules are deliberately absent.

## Architectural choices

### HTML is a stable collaboration language

Humans, browsers, assistive technologies, and coding agents already understand HTML. A native `details` is cheaper to explain, test, and maintain than another disclosure abstraction. Semantics are not always enough, so seven small layout/accessibility classes and a documented attribute vocabulary fill actual gaps.

This is not a compatibility fork. We preserve the useful behaviors (class-light styling, forms, cards, responsive content, themes) rather than accidental API spellings. A separately named project avoids confusing users about Pico’s archived status or trademarks.

### Modern CSS, with honest fallbacks

Named cascade layers make overrides predictable. Application CSS is normally unlayered, so it wins without specificity escalation. Semantic properties name intent rather than palette positions. Hex colors provide a fallback before OKLCH. Logical properties support directionality. Native focus outlines stay visible; native controls remain native.

Anchor positioning is opt-in and scoped per trigger/popover pair; if support is incomplete it remains centered. Native UI behavior cannot be polyfilled with CSS. The demo supplies a disclosure fallback for popovers; applications must make their own support decision. Unsupported cascade-layer browsers are out of scope.

### The contract is a boundary, not a second stylesheet

`data/contract.json` enumerates public tokens, classes, attributes, layers, and module triggers. `src/*.css` implements those decisions; tests check that the public vocabulary and stylesheet stay aligned. The contract does not pretend to generate every selector, palette, or accessibility guarantee. There is also a JSON Schema for external tooling.

Recipes colocate markup, explicit behavior, search metadata, and verification notes. Positive intent fields drive retrieval; source HTML and warnings do not accidentally dominate matches. There is no network request in retrieval or building.

### Packing is deliberately conservative

Token/base/layout modules are always kept. Optional modules are selected by literal static tags/attributes or explicit inclusion. No individual selector is deleted. State selectors, reduced-motion rules, overlays, and CSS dependencies survive as units.

This misses runtime-generated content unless declared. That is an explicit, documented limitation, preferable to silently shipping a broken state. The full stylesheet remains the best default for framework applications. The packer is dependency-free JavaScript for portability; a native compiler is not justified at this size yet.

### Personality lives in the site, not in your application

Sprig’s own gallery is a botanical field notebook: cream paper, green ink, quiet monospace labels, warm serif italics, no downloaded fonts. Its distinctive layout and decoration live in `site/`, not the framework. The framework supplies the controls, surfaces, typography baseline, and layout primitives. No network image or font is needed to render the page.

## Reality check and deliberate omissions

This is a prototype, not “perfect for everyone.” It has automated Node and Chromium coverage; it still needs real multi-browser and assistive-technology testing before production promises. The static checker is not a full HTML parser, template compiler, or conformance checker. Its limited result must not be reported as “accessible.”

No SaaS, AI API, CSS-in-JS, JavaScript styling runtime, framework adapters, automatic harness installation, auto-publishing, or forced migration. No dropdown-menu abstraction pretending a generic popover is an accessible menu. No tooltip-only controls. No native compiler or minifier. No promise that a locally chosen package name is available on a registry.

Good next work: external browser/AT validation, broader form/state fixtures, schema tooling integration, documented versioning, project-specific design passports, and measuring real downstream needs before expanding the API.
