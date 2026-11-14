// Biblioteca de personajes en el navegador + exportar/importar JSON.
// Todo en try/catch: sin almacenamiento, la app sigue funcionando (solo no recuerda).
import { h, vaciar } from './dom.js';
import { VERSION_MODELO, pjVacio } from '../engine/index.js';

const CLAVE = 'vsd-biblioteca';

export function leerBiblioteca() {
  try { const b = JSON.parse(localStorage.getItem(CLAVE)); return Array.isArray(b) ? b : []; } catch { return []; }
}
function escribirBiblioteca(lista) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); return true; } catch { return false; }
}
const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : `pj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

function ficha(D, pj) {
  return {
    id: pj.id, nombre: pj.nombre || 'Sin nombre', nivel: pj.desarrollo?.length || 1,
    linaje: D.linajes.get(pj.linaje)?.nombre || '', cultura: D.culturas.get(pj.cultura)?.nombre || '', vocacion: D.vocaciones.get(pj.vocacion)?.nombre || '',
  };
}

/** Guarda el PJ actual (lo actualiza si ya estaba). Devuelve el PJ con su id. */
export function guardar(D, pj) {
  const conId = pj.id ? pj : { ...pj, id: nuevoId() };
  const lista = leerBiblioteca().filter((e) => e.id !== conId.id);
  lista.unshift({ ...ficha(D, conId), actualizado: new Date().toISOString(), pj: conId });
  return escribirBiblioteca(lista) ? conId : null;
}

/** Comprueba que un objeto parece un PJ de este generador y lo completa con los campos que falten. */
export function normalizarPJ(x) {
  if (!x || typeof x !== 'object' || x.version !== VERSION_MODELO || !x.base || !Array.isArray(x.desarrollo)) return null;
  return { ...pjVacio(), ...x };
}

/** Descarga un archivo generado en el propio navegador. */
export function descargar(nombre, contenido, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = h('a', { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const nombreArchivo = (pj, ext) => `${(pj.nombre || 'personaje').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/^_|_$/g, '') || 'personaje'}.${ext}`;

/** Panel «Mis personajes». */
export function pintarBiblioteca(el, ctx) {
  const lista = leerBiblioteca();
  const fecha = (iso) => { try { return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };
  const repintar = () => pintarBiblioteca(el, ctx);
  const actual = ctx.pj.id ? lista.find((e) => e.id === ctx.pj.id) : null;

  const guardarActual = () => {
    const guardado = guardar(ctx.D, ctx.pj);
    if (!guardado) { ctx.avisar('Este navegador no deja guardar (¿modo privado?). Exporta el archivo JSON para no perderlo.'); return; }
    ctx.reemplazar(guardado);
    ctx.avisar(actual ? 'Personaje actualizado en tu biblioteca.' : 'Personaje guardado en tu biblioteca.');
    repintar();
  };
  const cargar = (e) => { ctx.reemplazar(normalizarPJ(e.pj) || e.pj, `Cargado: ${e.nombre}.`); repintar(); };
  const duplicar = (e) => {
    const copia = { ...structuredClone(e.pj), id: undefined, nombre: `${e.pj.nombre || 'Personaje'} (copia)` };
    guardar(ctx.D, copia); repintar();
  };
  const borrar = (e) => {
    const antes = leerBiblioteca();
    escribirBiblioteca(antes.filter((x) => x.id !== e.id));
    ctx.avisar(`Borrado: ${e.nombre}.`, () => { escribirBiblioteca(antes); repintar(); });
    repintar();
  };
  const exportarActual = () => descargar(nombreArchivo(ctx.pj, 'json'), JSON.stringify(ctx.pj, null, 2));
  const exportarTodos = () => descargar('personajes-darkmaster.json', JSON.stringify(lista.map((e) => e.pj), null, 2));
  const importar = async (ev) => {
    const archivo = ev.target.files?.[0];
    ev.target.value = '';
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      const pjs = (Array.isArray(datos) ? datos : [datos]).map(normalizarPJ);
      if (!pjs.length || pjs.some((x) => !x)) throw new Error('no es un personaje de este generador');
      for (const p of pjs) guardar(ctx.D, p);
      if (pjs.length === 1) ctx.reemplazar(leerBiblioteca().find((e) => e.id === pjs[0].id)?.pj || pjs[0], `Importado: ${pjs[0].nombre || 'personaje'}.`);
      else ctx.avisar(`${pjs.length} personajes importados a tu biblioteca.`);
      repintar();
    } catch (e) {
      ctx.avisar(`No se pudo importar el archivo: ${e.message}.`);
    }
  };

  vaciar(el).append(
    h('h2', { id: 'biblioteca-titulo' }, 'Mis personajes'),
    h('p', { class: 'mesa-intro' }, 'Se guardan solo en este navegador. Para pasarlos a otro dispositivo o no perderlos, expórtalos como archivo.'),
    h('div', { class: 'enlace-mesa', style: 'margin-top:0' },
      h('button', { type: 'button', class: 'btn btn-tinta', onclick: guardarActual }, actual ? 'Guardar cambios' : 'Guardar este personaje'),
      h('button', { type: 'button', class: 'btn', onclick: exportarActual }, 'Exportar este (JSON)'),
      lista.length > 1 ? h('button', { type: 'button', class: 'btn', onclick: exportarTodos }, 'Exportar todos') : null,
      h('label', { class: 'btn' }, 'Importar archivo…', h('input', { type: 'file', accept: '.json,application/json', class: 'sr', onchange: importar }))),
    lista.length
      ? h('ul', { class: 'lista-pjs' }, lista.map((e) => h('li', { class: e.id === ctx.pj.id ? 'actual' : null },
        h('div', null,
          h('b', null, e.nombre), e.id === ctx.pj.id ? h('span', { class: 'ref' }, ' · abierto') : null,
          h('small', null, [e.linaje, e.cultura, e.vocacion].filter(Boolean).join(' · '), ` · nivel ${e.nivel} · ${fecha(e.actualizado)}`)),
        h('div', { class: 'lista-pjs-acciones' },
          h('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => cargar(e) }, 'Abrir'),
          h('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => duplicar(e) }, 'Duplicar'),
          h('button', { type: 'button', class: 'btn btn-pequeno btn-texto', 'aria-label': `Borrar ${e.nombre}`, onclick: () => borrar(e) }, 'Borrar')))))
      : h('p', { class: 'bloque-ayuda', style: 'margin-top:16px' }, 'Aún no has guardado ningún personaje.'));
}
