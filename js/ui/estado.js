// Estado de la app: borrador del PJ, mesa (desde la URL) y tema. Todo el acceso a
// localStorage va en try/catch: si falla, la app funciona igual sin recordar nada.
import { pjVacio, mesaPorDefecto } from '../engine/index.js';

const CLAVE_PJ = 'vsd-borrador';
const CLAVE_MESA = 'vsd-mesa';
const CLAVE_TEMA = 'vsd-tema';
const CLAVE_PASO = 'vsd-paso';

const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

export function cargarBorrador() {
  try {
    const p = JSON.parse(leer(CLAVE_PJ));
    if (p && p.version === 1) return { ...pjVacio(), ...p };
  } catch { /* borrador corrupto */ }
  return pjVacio();
}
export const guardarBorrador = (pj) => escribir(CLAVE_PJ, JSON.stringify(pj));
export const pasoGuardado = () => leer(CLAVE_PASO);
export const guardarPaso = (p) => escribir(CLAVE_PASO, p);

// ---- Mesa: la URL manda; si no hay parámetros, la última usada en este navegador ----
const PARAMS = { metodo: 'm', mejores_de_doce: 'd12', fortuna_osado: 'fo', velocidad_variable: 'vv', especializadas: 'es', saqueadora: 'sq', linajes: 'l' };

export function mesaDesdeURL(url = location.href) {
  const q = new URL(url).searchParams;
  if (![...Object.values(PARAMS)].some((p) => q.has(p))) return null;
  const m = mesaPorDefecto();
  if (q.has('m')) m.metodo = ['puntos', 'aleatorio', 'libre'].includes(q.get('m')) ? q.get('m') : m.metodo;
  for (const k of ['mejores_de_doce', 'fortuna_osado', 'velocidad_variable', 'especializadas', 'saqueadora']) m[k] = q.get(PARAMS[k]) === '1';
  m.linajes = q.get('l') ? q.get('l').split('.').filter(Boolean) : null;
  return m;
}

export function urlDeMesa(mesa, base = location.href) {
  const u = new URL(base);
  u.search = '';
  const q = u.searchParams;
  q.set('m', mesa.metodo);
  for (const k of ['mejores_de_doce', 'fortuna_osado', 'velocidad_variable', 'especializadas', 'saqueadora']) if (mesa[k]) q.set(PARAMS[k], '1');
  if (mesa.linajes) q.set('l', mesa.linajes.join('.'));
  return u.toString();
}

export function cargarMesa() {
  const desdeURL = mesaDesdeURL();
  if (desdeURL) return { mesa: desdeURL, compartida: true };
  try { const m = JSON.parse(leer(CLAVE_MESA)); if (m) return { mesa: { ...mesaPorDefecto(), ...m }, compartida: false }; } catch { /* nada */ }
  return { mesa: mesaPorDefecto(), compartida: false };
}
export function guardarMesa(mesa) {
  escribir(CLAVE_MESA, JSON.stringify(mesa));
  try { history.replaceState(null, '', urlDeMesa(mesa)); } catch { /* sin history */ }
}

// ---- Tema: sin valor = el del sistema ----
export function temaEfectivo() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function alternarTema() {
  const nuevo = temaEfectivo() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevo;
  escribir(CLAVE_TEMA, nuevo);
  return nuevo;
}
