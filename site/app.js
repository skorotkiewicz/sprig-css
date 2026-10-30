const themeButton = document.querySelector('#theme-toggle');
const themes = ['system', 'light', 'dark'];
let theme = 'system';
try { theme = localStorage.getItem('sprig-theme') ?? 'system'; } catch { /* Storage may be unavailable in private contexts. */ }
if (!themes.includes(theme)) theme = 'system';
function applyTheme() {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  if (!themeButton) return;
  const next = themes[(themes.indexOf(theme) + 1) % themes.length];
  themeButton.textContent = `Theme: ${theme}`;
  themeButton.setAttribute('aria-label', `Color theme: ${theme}. Switch to ${next}.`);
}
applyTheme();
themeButton?.addEventListener('click', () => {
  theme = themes[(themes.indexOf(theme) + 1) % themes.length];
  applyTheme();
  try { localStorage.setItem('sprig-theme', theme); } catch { /* Theme still works without persistence. */ }
});

const gardenForm = document.querySelector('#garden-form');
gardenForm?.addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#garden-status').textContent = 'A good little beginning. Demo complete—nothing was sent or stored.';
});
const gardenSubmit = document.querySelector('#garden-submit');
if (gardenSubmit) gardenSubmit.disabled = false;

const dialog = document.querySelector('#garden-dialog');
const dialogTrigger = document.querySelector('#open-dialog');
if (dialogTrigger && typeof dialog?.showModal === 'function') {
  dialogTrigger.addEventListener('click', () => dialog.showModal());
  dialogTrigger.disabled = false;
}

if ('showPopover' in HTMLElement.prototype && 'popoverTargetElement' in HTMLButtonElement.prototype) {
  const trigger = document.querySelector('#popover-trigger');
  const fallback = document.querySelector('#popover-fallback');
  const note = document.querySelector('#garden-note');
  if (trigger) trigger.hidden = false;
  if (note) note.hidden = false;
  if (fallback) fallback.hidden = true;
}

document.querySelector('#copy-starter')?.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(document.querySelector('#starter-code').textContent);
    status.textContent = 'Copied. Plant it somewhere good.';
  } catch {
    status.textContent = 'Clipboard unavailable. Select and copy the code above.';
  }
});
