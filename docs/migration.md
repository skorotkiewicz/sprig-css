# Migrating from Pico

Sprig is an independent rewrite, **not a drop-in Pico v3**. Keep the old project working while testing a copy.

1. Replace the stylesheet link with `dist/sprig.css` in a test page. Do not load both frameworks together; both style global HTML.
2. Keep semantic markup: forms, labels, inputs, buttons, tables, articles, disclosures, and navs remain meaningful.
3. Body’s direct header/main/footer are automatically contained. `.container` and `.grid` are supported, but sizing and spacing differ.
4. Replace Pico-specific classes and properties. `.overflow-auto` becomes `.overflow`; `.secondary`/`.outline` button styling becomes `data-variant="quiet"`. There is no `.contrast` alias, grouped-control component, switch component, or automatic tooltip.
5. Replace `--pico-*` overrides with documented `--sprig-*` roles. Do not mechanically translate every old property name; the token models differ.
6. `data-theme="light"`/`"dark"` belongs on `html`. Removing it uses the OS preference. Color customizations need separate light/dark/automatic decisions.
7. For modal dialogs, retain or implement `showModal()`/`close()` behavior and name the dialog. CSS alone does not handle opening, validation, focus management, async operations, or application state.
8. Popovers are native and nonmodal, not automatically accessible application menus. Supply a fallback for unsupported browsers if required.
9. Run the limited HTML checker, then test real keyboard behavior, error/loading/disabled states, mobile widths, RTL, zoom, and all required browsers/assistive technologies.
10. Use the full stylesheet initially. Only opt into module packing after static markup and runtime-only requirements are known.

Sprig uses its own name and identity and does not claim upstream maintenance or endorsement.
