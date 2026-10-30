import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compile, selectModules, contract, searchRecipes } from '../lib/core.js';
import { scanHTML, checkHTML } from '../lib/html.js';

const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8'));
const ids = html => selectModules(html).map(module => module.id);

test('small static page retains mandatory modules only', async () => {
  assert.deepEqual(ids('<main><h1>Hello</h1><p>Good things.</p></main>'), ['tokens', 'base', 'layout']);
  const packed = await compile({ html: '<p>Hi</p>' });
  const full = await compile({ all: true });
  assert.ok(packed.bytes < full.bytes);
  assert.ok(packed.css.includes('prefers-reduced-motion'));
  assert.ok(packed.css.includes('forced-colors'));
  assert.ok(!packed.css.includes('dialog::backdrop'));
});

test('module detection supports case, whitespace, quoted >, and unquoted attributes', () => {
  assert.deepEqual(ids('<BUTTON type="button">Go</BUTTON>'), ['tokens', 'base', 'layout', 'buttons']);
  assert.ok(ids('<aside\n data-callout = "note" title="2 > 1">Hi</aside>').includes('cards'));
  assert.ok(ids('<input type=submit value="Send">').includes('buttons'));
  assert.ok(ids("<a role='button'>Go</a>").includes('buttons'));
  assert.ok(ids('<div popover>Hi</div>').includes('overlays'));
  assert.ok(ids('<dialog>Hi</dialog>').includes('overlays'));
});

test('scanner ignores comments, raw-text content and escaped examples', () => {
  const html = '<!-- <table></table> --><script>const x = "<dialog>";</script><style>/* <form> */</style><textarea>&lt;x&gt;<table></textarea><title><dialog></title><p>&lt;button&gt;</p>';
  assert.deepEqual(ids(html), ['tokens', 'base', 'layout', 'forms']);
  assert.deepEqual(scanHTML('<!-- <form> unclosed').map(e => e.tag), []);
  assert.deepEqual(ids('<script>const x = "<table>";'), ['tokens', 'base', 'layout']);
});

test('all/include retain runtime modules in stable contract order', () => {
  assert.deepEqual(selectModules('', ['overlays', 'forms']).map(m => m.id), ['tokens', 'base', 'layout', 'forms', 'overlays']);
  assert.deepEqual(selectModules('', [], true).map(m => m.id), contract.modules.map(m => m.id));
  assert.throws(() => selectModules('', ['typo']), /Unknown module/);
});

test('full artifact is deterministic and all modules carry their declared layer', async () => {
  const { css, bytes } = await compile({ all: true });
  assert.equal(css, await readFile(new URL('../dist/sprig.css', import.meta.url), 'utf8'));
  assert.equal(bytes, Buffer.byteLength(css));
  for (const layer of contract.layers) assert.ok(css.includes(`@layer ${layer}`), layer);
  for (const module of contract.modules) {
    const source = await readFile(new URL(`../src/${module.file}`, import.meta.url), 'utf8');
    assert.ok(source.startsWith('@layer sprig.'), module.id);
  }
  const declared = new Set([...css.matchAll(/(--sprig-[\w-]+)\s*:/g)].map(match => match[1]));
  for (const token of contract.tokens) assert.ok(declared.has(`--sprig-${token}`), token);
  for (const name of Object.keys(contract.classes)) assert.ok(css.includes(`.${name}`), name);
  for (const name of Object.keys(contract.attributes)) assert.ok(css.includes(`[${name}`), name);
});

test('lint detects concrete common markup mistakes with lines', () => {
  const html = '<html>\n<img src="leaf.png">\n<input\n type="email" aria-invalid="true">\n<button>Save</button><dialog>Hi</dialog><p id="same"></p><p id="same"></p><input aria-label="Named" aria-describedby="missing">';
  const findings = checkHTML(html);
  const codes = new Set(findings.map(f => f.code));
  for (const code of ['document-language', 'image-alt', 'control-label', 'error-description', 'button-type', 'dialog-name', 'duplicate-id', 'missing-reference']) assert.ok(codes.has(code), code);
  assert.equal(findings.find(f => f.code === 'image-alt').line, 2);
  assert.equal(findings.find(f => f.code === 'control-label').line, 3);
});

test('lint accepts multiline, wrapping and aria labels, and decorative images', () => {
  const html = '<html lang="en"><img src="x" alt=""><label for="email">Email</label><input\n id="email" type="email"><LABEL>Agree <input type="checkbox"></LABEL><input type="hidden"><span id="name-label">Name</span><input aria-labelledby="name-label"><textarea aria-label="Message"></textarea><button type="button">Go</button><dialog aria-label="Hello"></dialog>';
  assert.deepEqual(checkHTML(html), []);
  assert.ok(checkHTML('<script>const s = "<label>";</script><input>').some(f => f.code === 'control-label'));
  assert.ok(checkHTML('<label>First <input></label><input>').some(f => f.code === 'control-label'));
});

test('recipes have stable IDs, valid records, lint-clean HTML, and parseable behavior', () => {
  assert.equal(recipes.length, 8);
  assert.equal(new Set(recipes.map(r => r.id)).size, recipes.length);
  for (const recipe of recipes) {
    assert.ok(recipe.title && recipe.description && recipe.html, recipe.id);
    assert.ok(recipe.tags.length && recipe.checks.length, recipe.id);
    assert.deepEqual(checkHTML(recipe.html), [], recipe.id);
    if (recipe.js) assert.doesNotThrow(() => new Function(recipe.js), recipe.id);
  }
});

test('retrieval ranks relevant patterns and does not index warnings or source code', () => {
  const expectations = [
    ['accessible contact form', 'contact-form'], ['modal dialog', 'modal-dialog'],
    ['popover', 'native-popover'], ['responsive card grid', 'responsive-cards'],
    ['navigation skip link', 'navigation-skip-link'], ['validation error', 'validation-error'],
    ['scrollable table', 'scrollable-table'], ['empty state', 'empty-state']
  ];
  for (const [query, id] of expectations) assert.equal(searchRecipes(recipes, query)[0]?.id, id, query);
  assert.deepEqual(searchRecipes(recipes, 'quux-nonexistent-term'), []);
  assert.deepEqual(searchRecipes(recipes, ''), []);
  const fixture = [{ id: 'one', title: 'A garden', tags: ['plants'], description: 'Informational', html: 'hiddenword', checks: ['warningword'] }];
  assert.deepEqual(searchRecipes(fixture, 'hiddenword warningword form'), []);
  assert.equal(searchRecipes(recipes, 'form', 1).length, 1);
});
