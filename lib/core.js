import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { scanHTML } from './html.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const contract = JSON.parse(await readFile(new URL('../data/contract.json', import.meta.url), 'utf8'));

export function selectModules(html, include = [], all = false) {
  const known = new Set(contract.modules.map(module => module.id));
  for (const id of include) if (!known.has(id)) throw new Error(`Unknown module "${id}". Choose: ${[...known].join(', ')}.`);
  const elements = scanHTML(html);
  return contract.modules.filter(module => all || module.always || include.includes(module.id) || elements.some(({ tag, attributes }) =>
    module.tags.includes(tag) || module.attributes.some(trigger => {
      const [name, value] = trigger.split('=');
      return Object.hasOwn(attributes, name) && (value === undefined || attributes[name].toLowerCase() === value);
    })
  ));
}

export async function compile({ html = '', include = [], all = false } = {}) {
  const modules = selectModules(html, include, all);
  const sources = await Promise.all(modules.map(module => readFile(new URL(`../src/${module.file}`, import.meta.url), 'utf8')));
  const css = `/*! Sprig v${contract.version} | MIT | See LICENSE and NOTICE */\n` +
    `@layer ${contract.layers.join(', ')};\n\n` + sources.join('\n');
  return { css, modules: modules.map(module => module.id), bytes: Buffer.byteLength(css) };
}

export function searchRecipes(recipes, query, limit = 5) {
  const words = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}-]+/gu) ?? [])];
  if (!words.length) return [];
  return recipes.map(recipe => {
    const fields = [[recipe.id, 8], [recipe.title, 5], [recipe.tags.join(' '), 3], [recipe.description, 1]];
    const score = words.reduce((total, word) => total + fields.reduce((sum, [text, weight]) => sum + (text.toLowerCase().includes(word) ? weight : 0), 0), 0);
    return { ...recipe, score };
  }).filter(recipe => recipe.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
