// Mini-ayudante para crear elementos sin plantillas ni dependencias.
// h('button', { class: 'btn', onclick: fn, 'aria-pressed': true }, 'Texto', otroNodo)

export function h(tag, attrs, ...hijos) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden' || k === 'open') el[k] = !!v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  anadir(el, hijos);
  return el;
}

function anadir(el, hijos) {
  for (const c of hijos) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) anadir(el, c);
    else el.append(c instanceof Node ? c : String(c));
  }
}

export const signo = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
export const vaciar = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
