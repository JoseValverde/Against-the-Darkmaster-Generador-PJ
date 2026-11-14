// Panel lateral: el personaje de un vistazo, como la cabecera de la hoja.
import { h, vaciar, signo } from './dom.js';
import { NOMBRES_PASO } from './comun.js';
import { CARACTERISTICAS } from '../engine/index.js';

export function pintarResumen(el, ctx) {
  const { pj, hoja, D } = ctx;
  const lin = D.linajes.get(pj.linaje), cul = D.culturas.get(pj.cultura), voc = D.vocaciones.get(pj.vocacion);
  const d = hoja.derivados;
  const pdRestante = hoja.pd.niveles[0] ? Object.keys(hoja.pd.niveles[0].presupuesto).reduce((a, c) => a + hoja.pd.niveles[0].presupuesto[c] - hoja.pd.niveles[0].gastado[c], 0) : 0;
  const errores = hoja.problemas.filter((p) => p.nivel === 'error');
  const primero = errores[0];

  vaciar(el).append(
    h('div', null,
      h('p', { class: `res-nombre${pj.nombre ? '' : ' vacio'}` }, pj.nombre || 'Sin nombre'),
      h('p', { class: 'res-sub' }, [lin?.nombre, cul?.nombre, voc?.nombre].filter(Boolean).join(' · ') || 'Elige linaje, cultura y vocación')),
    h('div', { class: 'res-cars', role: 'list', 'aria-label': 'Características' },
      CARACTERISTICAS.map((c) => h('div', { role: 'listitem' }, h('small', null, c), h('b', null, signo(hoja.caracteristicas[c].total))))),
    h('dl', { class: 'res-derivados' },
      h('dt', null, 'Nivel'), h('dd', null, hoja.nivel),
      h('dt', null, 'PX · próx. nivel'), h('dd', null, `${d.px.actual} · ${d.px.siguiente ?? '—'}`),
      h('dt', null, 'Puntos de golpe'), h('dd', null, d.pg),
      h('dt', null, 'Puntos de magia'), h('dd', null, d.pm.total),
      h('dt', null, 'Defensa c/c · proy.'), h('dd', null, `${d.defensa_cc} · ${d.defensa_proyectiles}`),
      h('dt', null, 'TSF · TSV'), h('dd', null, `${signo(d.tsf.total)} · ${signo(d.tsv.total)}`),
      h('dt', null, 'Riqueza'), h('dd', null, `${d.nr} (${d.nivel_social})`),
      h('dt', null, 'Velocidad'), h('dd', null, `${String(d.velocidad).replace('.', ',')} m`),
      h('dt', null, 'PT por gastar'), h('dd', null, `${hoja.pt.total - hoja.pt.gastado} / ${hoja.pt.total}`),
      h('dt', null, 'PD por gastar'), h('dd', null, pdRestante)),
    errores.length
      ? h('div', { class: 'res-estado mal' }, `${errores.length} cosa${errores.length > 1 ? 's' : ''} por corregir. `,
        h('button', { type: 'button', class: 'btn-texto btn', onclick: () => ctx.irA(primero.paso) }, `Ir a ${NOMBRES_PASO[primero.paso]}`))
      : h('div', { class: 'res-estado ok' }, 'Cumple las reglas. ',
        hoja.problemas.length ? `${hoja.problemas.length} aviso${hoja.problemas.length > 1 ? 's' : ''} pendiente${hoja.problemas.length > 1 ? 's' : ''}.` : 'Listo para jugar.'),
  );
}
