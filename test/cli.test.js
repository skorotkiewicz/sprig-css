import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/sprig.js', import.meta.url));
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
async function workspace(t) {
  const dir = await mkdtemp(join(tmpdir(), 'sprig-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('CLI works from a consumer directory and reports JSON build metadata', async t => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, 'page.html'), '<main><h1>Hello</h1><button type="button">Go</button></main>');
  const result = run(['build', '--html', 'page.html', '--out', 'nested/page.css', '--json'], cwd);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.modules, ['tokens', 'base', 'layout', 'buttons']);
  assert.equal(report.bytes, Buffer.byteLength(await readFile(report.output, 'utf8')));
});

test('CLI unions multiple pages and honors explicit runtime module inclusion', async t => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, 'one.html'), '<table></table>');
  await writeFile(join(cwd, 'two.html'), '<article>Hi</article>');
  const result = run(['build', '--html', 'one.html', '--html', 'two.html', '--include', 'overlays', '--out', 'union.css', '--json'], cwd);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).modules, ['tokens', 'base', 'layout', 'cards', 'tables', 'overlays']);
});

test('CLI refuses accidental overwrites but permits explicit generated-output replacement', async t => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, 'existing.css'), 'keep me');
  let result = run(['build', '--all', '--out', 'existing.css'], cwd);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Output exists/);
  assert.equal(await readFile(join(cwd, 'existing.css'), 'utf8'), 'keep me');
  result = run(['build', '--all', '--out', 'existing.css', '--force'], cwd);
  assert.equal(result.status, 0, result.stderr);
  assert.match(await readFile(join(cwd, 'existing.css'), 'utf8'), /Sprig v/);
});

test('CLI protects HTML inputs through direct paths, symlinks, and hardlinks even with force', async t => {
  const cwd = await workspace(t);
  const html = '<p>Do not replace me.</p>';
  await writeFile(join(cwd, 'page.html'), html);
  await symlink(join(cwd, 'page.html'), join(cwd, 'alias.css'));
  await link(join(cwd, 'page.html'), join(cwd, 'hardlink.css'));
  for (const out of ['page.html', 'alias.css', 'hardlink.css']) {
    const result = run(['build', '--html', 'page.html', '--out', out, '--force'], cwd);
    assert.equal(result.status, 2, out);
    assert.match(result.stderr, /must not overwrite/);
    assert.equal(await readFile(join(cwd, 'page.html'), 'utf8'), html);
  }
});

test('CLI rejects invalid invocations and unreadable files instead of reporting success', async t => {
  const cwd = await workspace(t);
  for (const args of [
    ['nonsense'], ['build'], ['build', '--html'], ['build', '--all', '--include', 'typo'],
    ['build', '--html', 'missing.html'], ['build', '--all', '--bogus'], ['build', 'page.html'],
    ['recipe'], ['recipe', 'form', '--limit', '0'], ['recipe', 'form', '--limit', '1.5'],
    ['check'], ['check', 'missing.html'], ['contract', 'extra']
  ]) {
    const result = run(args, cwd);
    assert.equal(result.status, 2, args.join(' '));
    assert.match(result.stderr, /^sprig:/);
  }
});

test('CLI lint uses distinct finding, clean, and invocation exit codes', async t => {
  const cwd = await workspace(t);
  await writeFile(join(cwd, 'bad.html'), '<input type="email">');
  await writeFile(join(cwd, 'good.html'), '<label>Email <input type="email"></label>');
  let result = run(['check', 'bad.html', '--json'], cwd);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout)[0].findings[0].code, 'control-label');
  result = run(['check', 'good.html', '--json'], cwd);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout)[0].findings, []);
  result = run(['check', 'good.html', 'missing.html', '--json'], cwd);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
});

test('CLI recipe, help, version, and contract commands are real usable entrypoints', () => {
  let result = run(['recipe', 'modal dialog', '--limit', '1', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout)[0].id, 'modal-dialog');
  result = run(['recipe', 'quux-unfindable', '--json']);
  assert.deepEqual(JSON.parse(result.stdout), []);
  assert.match(run(['--help']).stdout, /Static HTML only/);
  assert.equal(run(['--version']).stdout.trim(), '0.1.0');
  result = run(['contract']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).name, 'Sprig');
});
