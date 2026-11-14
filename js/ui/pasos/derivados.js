// Paso V · Atributos derivados (solo lectura: se calculan solos)
import { h, signo } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, ref, NOMBRE_CAR } from '../comun.js';

export default function pasoDerivados(ctx) {
  const { hoja, D, pj, mesa } = ctx;
  const d = hoja.derivados;
  const lin = D.linajes.get(pj.linaje);
  const corp = hoja.habilidades.find((x) => x.id === 'corpulencia');
  const fila = (nombre, total, desglose, pagina) => h('tr', null,
    h('td', { class: 'nombre-hab' }, nombre, pagina ? h('small', null, `pág. ${pagina}`) : null),
    h('td', { style: 'text-align:left' }, desglose),
    h('td', { class: 'total' }, total));
  const pm = d.pm;

  return [
    cabeceraPaso(ctx, 'Atributos derivados', ['Se calculan solos a partir de lo anterior. Aquí ves de dónde sale cada número. ', ref(98), '.']),
    problemasDelPaso(ctx),
    h('section', { class: 'bloque' }, h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-hoja' },
      h('thead', null, h('tr', null, h('th', null, 'Atributo'), h('th', { style: 'text-align:left' }, 'Cómo se calcula'), h('th', null, 'Total'))),
      h('tbody', null,
        fila('Fortaleza (TSF)', signo(d.tsf.total), `RES ${signo(d.tsf.car)} + nivel ${signo(d.tsf.nivel)} + linaje ${signo(d.tsf.lin)}`, 98),
        fila('Voluntad (TSV)', signo(d.tsv.total), `SAB ${signo(d.tsv.car)} + nivel ${signo(d.tsv.nivel)} + linaje ${signo(d.tsv.lin)}`, 99),
        fila('Defensa cuerpo a cuerpo', d.defensa_cc, `AGI ${signo(Math.max(hoja.caracteristicas.AGI.total, 0))}${d.agi_max_def != null ? ` (máx. ${d.agi_max_def} por armadura)` : ''} + escudo y armadura`, 98),
        fila('Defensa contra proyectiles', d.defensa_proyectiles, 'Igual, con los bonificadores de proyectiles', 98),
        fila('Puntos de golpe', d.pg, `Corpulencia ${signo(corp.total)}${d.pg !== corp.total ? `, ajustado a ${d.pg}` : ''} · máximo del linaje ${d.pg_max}`, 99),
        fila('Puntos de magia', pm.total, pm.caracteristica
          ? `(${pm.por_caracteristica} por ${pm.caracteristica} + ${pm.por_vocacion} de vocación${pm.por_trasfondos ? ` + ${pm.por_trasfondos} de trasfondos` : ''}) × nivel ${hoja.nivel} + ${pm.linaje} de linaje${pm.transferidos ? ` + ${pm.transferidos} transferidos` : ''}`
          : 'Elige vocación', 128),
        ...pm.restringidos.map((r) => fila('PM solo para una escuela', r.total, `Afinidad Mágica: ${D.escuelas.get(r.escuela)?.nombre || '—'}`, 88)),
        fila('Nivel de riqueza', `${d.nr}`, `${d.nivel_social} · linaje ${signo(lin?.nr || 0)} + cultura ${signo(D.culturas.get(pj.cultura)?.nr || 0)} (máx. 4 al empezar)`, 139),
        fila('Velocidad', `${String(d.velocidad).replace('.', ',')} m`, `15 m por asalto${mesa.velocidad_variable ? ` ± 1,5 por cada 5 de AGI` : ''}`, 98),
        fila('Tamaño', d.tamano, 'Según el linaje', 99),
        fila('Determinación', d.determinacion, d.determinacion > 1 ? 'Inicial 1 + La fortuna favorece al osado' : 'Todos empiezan con 1', 102))))),
    h('section', { class: 'bloque' },
      h('h3', null, 'Rasgos especiales'),
      hoja.rasgos.length ? h('ul', { class: 'rasgos' }, hoja.rasgos.map((r) => h('li', null, h('b', null, r.nombre), ' — ', r.resumen))) : h('p', { class: 'bloque-ayuda' }, 'Aparecerán al elegir linaje y trasfondos.')),
    hoja.recordatorios.length ? h('section', { class: 'bloque' },
      h('h3', null, 'Para recordar en juego'),
      h('ul', { class: 'rasgos' }, hoja.recordatorios.map((r) => h('li', null, r)))) : null,
    piePaso(ctx),
  ];
}
