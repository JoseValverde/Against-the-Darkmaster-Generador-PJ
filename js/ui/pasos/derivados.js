// Paso V · Atributos derivados (solo lectura: se calculan solos)
import { h, signo } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, ref, NOMBRE_CAR, contador, selector } from '../comun.js';
import { CARACTERISTICAS } from '../../engine/index.js';

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
    bloqueGrimorio(ctx),
    bloqueSenda(ctx),
    h('section', { class: 'bloque' },
      h('h3', null, 'Rasgos especiales'),
      hoja.rasgos.length ? h('ul', { class: 'rasgos' }, hoja.rasgos.map((r) => h('li', null, h('b', null, r.nombre), ' — ', r.resumen))) : h('p', { class: 'bloque-ayuda' }, 'Aparecerán al elegir linaje y trasfondos.')),
    hoja.recordatorios.length ? h('section', { class: 'bloque' },
      h('h3', null, 'Para recordar en juego'),
      h('ul', { class: 'rasgos' }, hoja.recordatorios.map((r) => h('li', null, r)))) : null,
    piePaso(ctx),
  ];
}

const ACCESO = { vocacional: 'vocacional', linaje: 'de linaje', comun: 'común', sin_acceso: 'sin acceso' };

/** Sortilegios conocidos por escuela, con lo que se puede lanzar ya. */
function bloqueGrimorio(ctx) {
  const { hoja } = ctx;
  if (!hoja.grimorio.length) return null;
  const pmTotal = hoja.derivados.pm.total;
  return h('section', { class: 'bloque' },
    h('h3', null, 'Grimorio', h('span', { class: 'contador' }, `${pmTotal} PM · cada sortilegio cuesta tantos PM como su urdimbre`)),
    h('p', { class: 'bloque-ayuda' }, 'Cada rango en una escuela te enseña una urdimbre más; solo lanzas las que no superen tu nivel (las escuelas comunes, nunca más allá de la 5ª). Distorsionar sube la urdimbre a cambio de más efecto. ', ref(126), ' y ', ref(188), '.'),
    h('div', { class: 'grimorio' }, hoja.grimorio.map((g, i) => h('details', { class: 'escuela-g', open: i === 0 },
      h('summary', null,
        h('span', { class: 'esc-nombre' }, g.nombre),
        h('span', { class: 'esc-datos' }, `${ACCESO[g.acceso] || g.acceso} · ${g.caracteristica} · bonificador `, h('b', null, signo(g.total)), ` · lanza hasta la ${g.urdimbre_ejecutable}ª`)),
      h('ul', { class: 'sortilegios' }, g.sortilegios.map((s) => itemSortilegio(ctx, g, s)))))));
}

function itemSortilegio(ctx, g, s) {
  const tope = g.acceso === 'comun' ? 5 : 10;
  // Afinidad Mágica mayor da un nivel de ventaja en la escuela predilecta
  const ventaja = Math.max(0, g.urdimbre_ejecutable - Math.min(g.sortilegios.length, ctx.hoja.nivel, tope));
  const estado = s.ejecutable ? null
    : s.urdimbre > tope ? 'Escuela común: no pasa de la 5ª urdimbre'
      : `Podrás lanzarlo a nivel ${s.urdimbre - ventaja}`;
  const params = [`Alcance ${s.alcance}`, `Área ${s.area}`, `Duración ${s.duracion}`, s.salvacion ? 'Con TS' : 'Sin TS'].join(' · ');
  return h('li', { class: `sortilegio ${s.ejecutable ? 'lanzable' : 'bloqueado'}` },
    h('span', { class: 'urd' }, `${s.urdimbre}ª`),
    h('span', { class: 's-nombre' }, s.nombre, s.instantaneo ? h('span', { class: 'inst', title: 'Acción parcial; sin preparación ni penalizador por improvisar' }, 'instantáneo') : null),
    h('span', { class: 's-pm' }, `${s.coste_pm} PM`),
    h('div', { class: 's-cuerpo' },
      h('span', null, s.resumen),
      h('span', { class: 's-params' }, params),
      estado ? h('span', { class: 's-estado' }, estado) : null,
      s.distorsion?.length ? h('ul', { class: 'distorsiones', 'aria-label': 'Distorsión' },
        s.distorsion.map((o) => h('li', null, h('b', null, `+${o.urdimbre} urdimbre: `), o.texto))) : null));
}

let nuevaRevelacion = { tipo: 'caracteristica', car: null, texto: '' };

/** Senda Heroica: marcas (Determinación gastada), Hitos y Revelaciones. */
function bloqueSenda(ctx) {
  const { pj, D, hoja } = ctx;
  const sh = D.tablas.senda_heroica;
  const marcas = Number(pj.senda_marcas) || 0;
  const hitos = hoja.derivados.px.hitos;
  const revs = pj.revelaciones || [];
  const libres = hitos - revs.length;
  const nombreRev = (t) => sh.revelaciones.find((r) => r.id === t)?.nombre || t;
  const anadir = () => {
    const r = { tipo: nuevaRevelacion.tipo };
    if (r.tipo === 'caracteristica') { if (!nuevaRevelacion.car) return; r.car = nuevaRevelacion.car; }
    if (r.tipo === 'objeto') r.texto = nuevaRevelacion.texto.trim();
    nuevaRevelacion = { tipo: 'caracteristica', car: null, texto: '' };
    ctx.actualizar((p) => { p.revelaciones = [...(p.revelaciones || []), r]; });
  };
  return h('section', { class: 'bloque' },
    h('h3', null, 'Senda Heroica', h('span', { class: 'contador' }, `${marcas} marcas · ${hitos} Hito${hitos === 1 ? '' : 's'}${hitos ? ` · ${libres} sin usar` : ''}`)),
    h('p', { class: 'bloque-ayuda' }, sh._regla, ' ', ref(sh.pagina)),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:16px;align-items:center' },
      h('span', { class: 'etiqueta' }, 'Marcas'),
      contador({ valor: marcas, min: 0, max: sh.casillas, etiqueta: 'marcas de la Senda Heroica', foco: 'senda',
        alCambiar: (v) => ctx.actualizar((p) => { p.senda_marcas = v; }) }),
      h('div', { class: 'senda', 'aria-hidden': 'true' }, Array.from({ length: 10 }, (_, i) =>
        h('span', { class: `hito${i < hitos ? ' lleno' : marcas > i * 10 ? ' medio' : ''}` }, String((i + 1) * 10))))),
    revs.length ? h('ul', { class: 'rasgos', style: 'margin-top:12px' }, revs.map((r, i) => h('li', null,
      h('b', null, nombreRev(r.tipo)), r.car ? ` — ${NOMBRE_CAR[r.car]}` : '', r.texto ? ` — ${r.texto}` : '', ' ',
      h('button', { type: 'button', class: 'btn btn-texto btn-pequeno', onclick: () => ctx.actualizar((p) => { p.revelaciones = p.revelaciones.filter((_, k) => k !== i); }) }, 'quitar')))) : null,
    libres > 0 ? h('div', { class: 'atuendo-equipo', style: 'margin-top:12px' },
      h('p', null, h('b', null, 'Nueva Revelación. '), 'Solo en un momento adecuado y con el acuerdo de la mesa.'),
      h('div', { class: 'fila-campos' },
        selector({ etiqueta: 'Tipo', valor: nuevaRevelacion.tipo, vacio: null, foco: 'rev-tipo',
          opciones: sh.revelaciones.map((r) => ({ valor: r.id, etiqueta: r.nombre })),
          alCambiar: (v) => { nuevaRevelacion.tipo = v; ctx.actualizar(() => {}); } }),
        nuevaRevelacion.tipo === 'caracteristica' ? selector({ etiqueta: 'Característica', valor: nuevaRevelacion.car, foco: 'rev-car',
          opciones: CARACTERISTICAS.map((c) => ({ valor: c, etiqueta: NOMBRE_CAR[c] })), alCambiar: (v) => { nuevaRevelacion.car = v; } }) : null,
        nuevaRevelacion.tipo === 'objeto' ? h('label', { class: 'campo' }, h('span', null, 'Qué mejora'),
          h('input', { type: 'text', 'data-foco': 'rev-texto', value: nuevaRevelacion.texto, oninput: (e) => { nuevaRevelacion.texto = e.target.value; } })) : null),
      h('p', { class: 'ref', style: 'font-style:normal' }, sh.revelaciones.find((r) => r.id === nuevaRevelacion.tipo)?.resumen),
      h('button', { type: 'button', class: 'btn btn-tinta', onclick: anadir }, 'Añadir Revelación')) : null,
    h('details', { class: 'logros' },
      h('summary', null, 'Logros que dan PX (lista de ejemplo)'),
      h('ul', { class: 'rasgos' }, D.tablas.progresion.logros.lista.map((l) => h('li', null, `${l.texto} `, h('b', null, `${l.px} PX`), l.siempre ? ' ★' : ''))),
      h('p', { class: 'ref' }, '★ recomendados en cualquier campaña. ', ref(107, '[1.26]'))));
}
