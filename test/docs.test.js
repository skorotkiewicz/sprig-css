import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanHTML, checkHTML } from '../lib/html.js';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const path of ['index.html', 'docs/guide.html', 'examples/starter.html']) {
  test(`${path} has clean limited lint and existing local navigation/assets`, async () => {
    const file = resolve(root, path);
    const html = await readFile(file, 'utf8');
    assert.deepEqual(checkHTML(html), []);
    const elements = scanHTML(html);
    const ids = new Set(elements.map(e => e.attributes.id).filter(Boolean));
    for (const { tag, attributes } of elements) {
      for (const key of ['href', 'src']) {
        const value = attributes[key];
        if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) continue;
        const [localPath, fragment] = value.split('#');
        if (localPath) await access(resolve(dirname(file), decodeURIComponent(localPath)));
        else if (fragment) assert.ok(ids.has(fragment), `${path}: missing #${fragment}`);
      }
      if (attributes.popovertarget) assert.ok(ids.has(attributes.popovertarget), `${path}: missing popover`);
      if (tag === 'script' && attributes.src) assert.ok(attributes.src.endsWith('.js'));
    }
  });
}
