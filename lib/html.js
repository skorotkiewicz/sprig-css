// A conservative static HTML scanner, not an HTML validator or template compiler.
// Raw-text bodies are ignored; tag-like strings there must not select modules.
export function scanHTML(html) {
  const elements = [];
  const pattern = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\/?([a-z][\w:-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*\/?>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    if (!match[1] || match[0].startsWith('</')) continue;
    const tag = match[1].toLowerCase();
    const attributes = {};
    const attrPattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attr;
    while ((attr = attrPattern.exec(match[2] ?? ''))) {
      attributes[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
    }
    elements.push({ tag, attributes, index: match.index, line: html.slice(0, match.index).split('\n').length });
    if (['script', 'style', 'textarea', 'title'].includes(tag)) {
      const end = new RegExp(`</${tag}\\s*>`, 'gi');
      end.lastIndex = pattern.lastIndex;
      const close = end.exec(html);
      pattern.lastIndex = close ? end.lastIndex : html.length;
    }
  }
  return elements;
}

export function checkHTML(html) {
  const elements = scanHTML(html);
  const findings = [];
  const add = (element, code, message) => findings.push({ line: element.line, code, message });
  const ids = new Map();
  for (const element of elements) {
    const id = element.attributes.id;
    if (id !== undefined) {
      if (ids.has(id)) add(element, 'duplicate-id', `Duplicate id "${id}".`);
      ids.set(id, element);
    }
  }
  for (const element of elements) {
    const { tag, attributes: a, index } = element;
    if (tag === 'img' && !Object.hasOwn(a, 'alt')) add(element, 'image-alt', 'Give this image alt text, or alt="" if decorative.');
    if (tag === 'html' && !a.lang?.trim()) add(element, 'document-language', 'Set the document language with lang.');
    if (['input', 'select', 'textarea'].includes(tag) && !['hidden', 'submit', 'button', 'reset', 'image'].includes(a.type?.toLowerCase())) {
      const labelledBy = a['aria-labelledby']?.trim().split(/\s+/).every(id => ids.has(id));
      const explicitLabel = a.id && elements.some(e => e.tag === 'label' && e.attributes.for === a.id);
      // Wrapping labels: inspect the nearest label boundary before the control.
      const before = html.slice(0, index).replace(/<!--[\s\S]*?-->/g, '');
      const wrappedLabel = before.lastIndexOf('<label') > before.lastIndexOf('</label');
      if (!a['aria-label']?.trim() && !labelledBy && !explicitLabel && !wrappedLabel) add(element, 'control-label', 'Add a persistent label (for/id, wrapping label, or accessible name).');
    }
    if (a['aria-invalid'] === 'true' && !a['aria-describedby']?.trim()) add(element, 'error-description', 'Connect a text error using aria-describedby.');
    for (const name of ['aria-describedby', 'aria-labelledby']) {
      for (const id of a[name]?.trim().split(/\s+/).filter(Boolean) ?? []) {
        if (!ids.has(id)) add(element, 'missing-reference', `${name} references missing id "${id}".`);
      }
    }
    if (tag === 'dialog' && !a['aria-label']?.trim() && !a['aria-labelledby']?.trim()) add(element, 'dialog-name', 'Give the dialog an accessible name.');
    if (tag === 'a' && a.role === 'button') add(element, 'action-link', 'Prefer a real button for actions; use links for navigation.');
    if (tag === 'button' && !a.type) add(element, 'button-type', 'Set type="button" or type="submit" explicitly.');
  }
  return findings;
}
