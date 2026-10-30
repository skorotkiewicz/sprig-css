#!/usr/bin/env node
import { readFile, mkdir, writeFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compile, contract, searchRecipes } from '../lib/core.js';
import { checkHTML } from '../lib/html.js';

const help = `Sprig — semantic CSS, shared good instincts.

  sprig build --all [--out sprig.css] [--force] [--json]
  sprig build --html page.html [--html other.html] [--include forms,overlays]
              [--out sprig.css] [--force] [--json]
  sprig recipe "accessible contact form" [--limit 5] [--json]
  sprig check page.html [other.html ...] [--json]
  sprig contract

Build keeps whole modules, not individual selectors. Static HTML only.
For runtime-generated markup use --all or --include. No network or AI calls.
Existing output requires --force. check is a limited lint, not an accessibility audit.
`;

async function main(argv) {
  const command = argv.shift();
  if (!command || command === '--help' || command === 'help') return console.log(help);
  if (command === '--version') return console.log(contract.version);
  const options = { html: [], include: [], positional: [], json: false, all: false, force: false, limit: 5 };
  const allowed = {
    build: ['--html', '--include', '--out', '--all', '--force', '--json'],
    recipe: ['--limit', '--json'],
    check: ['--json'],
    contract: []
  };
  if (!allowed[command]) throw new Error(`Unknown command "${command}". Run sprig --help.`);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { options.positional.push(arg); continue; }
    if (!allowed[command].includes(arg)) throw new Error(`Unknown option "${arg}" for ${command}.`);
    const key = arg.slice(2);
    if (['all', 'force', 'json'].includes(key)) { options[key] = true; continue; }
    const value = argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
    if (key === 'html') options.html.push(value);
    else if (key === 'include') options.include.push(...value.split(',').filter(Boolean));
    else options[key] = value;
  }
  if (command === 'contract') {
    if (options.positional.length) throw new Error('contract takes no arguments.');
    return console.log(JSON.stringify(contract, null, 2));
  }
  if (command === 'build') {
    if (options.positional.length) throw new Error('Use --html for each input file.');
    if (!options.all && !options.html.length) throw new Error('Specify --all or at least one --html file.');
    const html = (await Promise.all(options.html.map(file => readFile(file, 'utf8')))).join('\n');
    const result = await compile({ html, include: options.include, all: options.all });
    const out = resolve(options.out ?? 'sprig.css');
    // Even --force must not turn an HTML input into CSS.
    const actualOut = await realpath(out).catch(error => { if (error.code === 'ENOENT') return out; throw error; });
    const inputs = await Promise.all(options.html.map(file => realpath(file)));
    const outputInfo = await stat(out).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    const inputInfo = await Promise.all(options.html.map(file => stat(file)));
    if (inputs.includes(actualOut) || inputInfo.some(info => outputInfo && info.dev === outputInfo.dev && info.ino === outputInfo.ino)) {
      throw new Error('Output must not overwrite an HTML input.');
    }
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, result.css, { flag: options.force ? 'w' : 'wx' });
    const report = { output: out, modules: result.modules, bytes: result.bytes };
    return console.log(options.json ? JSON.stringify(report) : `🌱 ${result.bytes} bytes → ${out}\nModules: ${result.modules.join(', ')}`);
  }
  if (command === 'recipe') {
    const limit = Number(options.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('--limit must be an integer from 1 to 50.');
    const query = options.positional.join(' ').trim();
    if (!query) throw new Error('Give recipe a search query.');
    const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url), 'utf8'));
    const results = searchRecipes(recipes, query, limit);
    if (options.json) return console.log(JSON.stringify(results, null, 2));
    return console.log(results.length ? results.map(recipe => `# ${recipe.title} (${recipe.id})\n${recipe.description}\n\n${recipe.html}\n${recipe.js ? `\nJavaScript:\n${recipe.js}\n` : ''}\nCheck: ${recipe.checks.join(' ')}\n`).join('\n') : 'No matching recipes. Try form, dialog, navigation, or card.');
  }
  if (!options.positional.length) throw new Error('check needs at least one HTML file.');
  const reports = await Promise.all(options.positional.map(async file => ({ file, findings: checkHTML(await readFile(file, 'utf8')) })));
  console.log(options.json ? JSON.stringify(reports, null, 2) : reports.map(report => report.findings.length ? report.findings.map(f => `${report.file}:${f.line} [${f.code}] ${f.message}`).join('\n') : `${report.file}: no findings in Sprig's limited static checks (not a full audit).`).join('\n'));
  if (reports.some(report => report.findings.length)) process.exitCode = 1;
}

main(process.argv.slice(2)).catch(error => {
  console.error(`sprig: ${error.code === 'EEXIST' ? 'Output exists. Choose another path or pass --force.' : error.message}`);
  process.exitCode = 2;
});
