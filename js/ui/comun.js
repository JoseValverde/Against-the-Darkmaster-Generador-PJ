// Componentes compartidos por los pasos del asistente.
import { h, signo } from './dom.js';

export const NOMBRES_PASO = {
  caracteristicas: 'Características',
  linaje_cultura: 'Linaje y cultura',
  vocacion: 'Vocación y habilidades',
  trasfondos_equipo: 'Trasfondos y equipo',
  derivados: 'Atributos derivados',
  pasiones: 'Pasiones',
  nombre: 'Nombre y repaso',
};
export const NOMBRE_CAR = { FUE: 'Fuerza', AGI: 'Agilidad', RES: 'Resistencia', INT: 'Intelecto', SAB: 'Sabiduría', POR: 'Porte' };
export const NOMBRE_CAT = { armadura: 'Armadura', combate: 'Combate', aventura: 'Aventura', latrocinio: 'Latrocinio', conocimiento: 'Conocimiento', sortilegios: 'Sortilegios', corpulencia: 'Corpulencia' };

export const ref = (pagina, tabla) => h('span', { class: 'ref' }, `${tabla ? `${tabla}, ` : ''}pág. ${pagina}`);

/** Cabecera de paso: número romano, título y ayuda. */
export function cabeceraPaso(ctx, titulo, ayuda, extra) {
  const i = ctx.PASOS.indexOf(ctx.paso);
  return h('header', { class: 'paso-cabecera' },
    h('p', { class: 'paso-num' }, `Paso ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]} de VII`),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:space-between' },
      h('h2', { id: 'titulo-paso' }, titulo), extra || null),
    ayuda ? h('p', { class: 'paso-ayuda' }, ayuda) : null);
}

/** Lista de problemas (errores y avisos) del paso actual. */
export function problemasDelPaso(ctx) {
  const ps = ctx.hoja.problemas.filter((p) => p.paso === ctx.paso);
  if (!ps.length) return h('div', { id: 'problemas-paso' });
  const orden = [...ps.filter((p) => p.nivel === 'error'), ...ps.filter((p) => p.nivel === 'aviso')];
  return h('ul', { id: 'problemas-paso', class: 'problemas', 'aria-label': 'Pendiente en este paso' },
    orden.map((p) => h('li', { class: p.nivel }, h('span', null, p.mensaje))));
}

/** Pie con navegación entre pasos. */
export function piePaso(ctx) {
  const i = ctx.PASOS.indexOf(ctx.paso);
  const ant = ctx.PASOS[i - 1], sig = ctx.PASOS[i + 1];
  return h('nav', { class: 'paso-pie', 'aria-label': 'Navegación entre pasos' },
    ant ? h('button', { type: 'button', class: 'btn', onclick: () => ctx.irA(ant) }, `← ${NOMBRES_PASO[ant]}`) : h('span'),
    sig ? h('button', { type: 'button', class: 'btn btn-tinta', onclick: () => ctx.irA(sig) }, `${NOMBRES_PASO[sig]} →`) : null);
}

/** Botón de dado para rehacer al azar un paso. */
export function botonDado(ctx, etiqueta = 'Al azar') {
  return h('button', { type: 'button', class: 'btn dado', 'data-foco': `dado-${ctx.paso}`, onclick: () => ctx.azarPaso(ctx.paso) }, etiqueta);
}

/** Contador − valor +. */
export function contador({ valor, min = 0, max = Infinity, paso = 1, alCambiar, etiqueta, foco }) {
  return h('span', { class: 'contador-num', role: 'group', 'aria-label': etiqueta },
    h('button', { type: 'button', 'aria-label': `Bajar ${etiqueta}`, disabled: valor - paso < min, 'data-foco': foco && `${foco}-menos`, onclick: () => alCambiar(valor - paso) }, '−'),
    h('output', { 'aria-live': 'polite' }, String(valor)),
    h('button', { type: 'button', 'aria-label': `Subir ${etiqueta}`, disabled: valor + paso > max, 'data-foco': foco && `${foco}-mas`, onclick: () => alCambiar(valor + paso) }, '+'));
}

/** Control segmentado (botones con aria-pressed). */
export function segmentos(opciones, actual, alCambiar, etiqueta, foco) {
  return h('div', { class: 'segmentos', role: 'group', 'aria-label': etiqueta },
    opciones.map((o) => h('button', {
      type: 'button', 'aria-pressed': String(o.valor === actual), disabled: o.deshabilitado, title: o.titulo,
      'data-foco': foco && `${foco}-${o.valor}`, onclick: () => alCambiar(o.valor),
    }, o.etiqueta)));
}

/** <select> con opción vacía. */
export function selector({ valor, opciones, alCambiar, etiqueta, vacio = '— Elige —', foco }) {
  return h('label', { class: 'campo' }, h('span', null, etiqueta),
    h('select', { 'data-foco': foco, onchange: (e) => alCambiar(e.target.value || null) },
      vacio === null ? null : h('option', { value: '' }, vacio),
      opciones.map((o) => h('option', { value: o.valor, selected: o.valor === valor, disabled: o.deshabilitado }, o.etiqueta))));
}

export const modsTexto = (mods) => Object.entries(mods).map(([c, v]) => h('span', null, `${c} `, h('b', { class: v < 0 ? 'neg' : null }, signo(v))));
