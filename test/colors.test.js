import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export function contrast(a, b) {
  const luminance = hex => {
    const rgb = hex.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16) / 255)
      .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

test('all fallback theme palettes meet text and meaningful-control contrast targets', async () => {
  const css = await readFile(new URL('../src/tokens.css', import.meta.url), 'utf8');
  const palettes = [...css.matchAll(/\{([^{}]+)\}/g)].map(match =>
    Object.fromEntries([...match[1].matchAll(/--sprig-([\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1], m[2]]))
  ).filter(palette => palette.bg && palette.text);
  assert.equal(palettes.length, 3, 'light, explicit dark, automatic dark');
  for (const palette of palettes) {
    for (const [foreground, background, minimum] of [
      ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['muted', 'bg', 4.5],
      ['muted', 'surface', 4.5], ['muted', 'soft', 4.5], ['accent', 'bg', 4.5],
      ['on-accent', 'accent', 4.5], ['danger', 'bg', 4.5], ['control', 'surface', 3],
      ['focus', 'bg', 3], ['focus', 'surface', 3]
    ]) assert.ok(contrast(palette[foreground], palette[background]) >= minimum, `${foreground}/${background}: ${contrast(palette[foreground], palette[background]).toFixed(2)}`);
  }
});
