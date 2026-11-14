// Paso I · Características
import { h, signo } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, botonDado, contador, segmentos, NOMBRE_CAR, ref } from '../comun.js';
import { CARACTERISTICAS, tirarCaracteristicas, asignarCaracteristicas, PRIORIDAD } from '../../engine/index.js';
import { valorCaracteristicaTirada } from '../../engine/reglas.js';

export default function pasoCaracteristicas(ctx) {
  const { pj, mesa, D, hoja } = ctx;
  const lin = D.linajes.get(pj.linaje);
  const cfg = D.caracteristicas.metodos.puntos;
  const fijo = mesa.metodo !== 'libre' ? mesa.metodo : null;
  const metodos = [
    { valor: 'puntos', etiqueta: `${cfg.total} puntos`, deshabilitado: fijo && fijo !== 'puntos', titulo: fijo && fijo !== 'puntos' ? 'La mesa usa tiradas' : null },
    { valor: 'aleatorio', etiqueta: 'Tiradas', deshabilitado: fijo === 'puntos', titulo: fijo === 'puntos' ? 'La mesa usa reparto de puntos' : null },
  ];
  if (mesa.mejores_de_doce) metodos.push({ valor: 'mejores_de_doce', etiqueta: 'Mejores de doce', deshabilitado: fijo === 'puntos' });

  const cambiarMetodo = (m) => ctx.actualizar((p) => {
    p.metodo = m; p.tiradas = []; delete p.ui_asignacion;
    p.base = Object.fromEntries(CARACTERISTICAS.map((c) => [c, 0]));
  });

  const restriccion = lin?.restriccion_porte
    ? h('p', { class: 'bloque-ayuda' }, `${lin.nombre}: Porte debe ser `, h('b', null, lin.restriccion_porte.top === 1 ? 'tu valor más alto' : `uno de tus ${lin.restriccion_porte.top} valores más altos`), ' antes de sumar el linaje.')
    : null;

  const bloqueMetodo = pj.metodo === 'puntos' ? bloquePuntos(ctx, cfg) : bloqueTiradas(ctx);

  return [
    cabeceraPaso(ctx, 'Características', ['Seis valores que miden las aptitudes innatas de tu héroe. ', ref(15), '.'], botonDado(ctx)),
    problemasDelPaso(ctx),
    h('section', { class: 'bloque' },
      h('h3', null, 'Método'),
      segmentos(metodos, pj.metodo, cambiarMetodo, 'Método de generación', 'metodo'),
      fijo ? h('p', { class: 'bloque-ayuda', style: 'margin-top:8px' }, 'Tu mesa fija el método. El DJ puede cambiarlo en «Mesa».') : null),
    bloqueMetodo,
    restriccion,
    h('section', { class: 'bloque' },
      h('h3', null, 'Resultado', lin ? h('span', { class: 'contador' }, `con los modificadores de ${lin.nombre.toLowerCase()}`) : h('span', { class: 'contador' }, 'el linaje se suma en el paso II')),
      h('div', { class: 'car-rejilla' }, CARACTERISTICAS.map((c) => {
        const x = hoja.caracteristicas[c];
        return h('div', { class: 'car' },
          h('span', { class: 'car-nombre' }, NOMBRE_CAR[c], ' ', h('span', { class: 'ref' }, c)),
          h('span', { class: 'car-total' }, signo(x.total)),
          h('span', { class: 'car-desglose' }, `base ${signo(x.base)} · linaje ${signo(x.linaje)}${x.esp ? ` · especial ${signo(x.esp)}` : ''}`));
      }))),
    piePaso(ctx),
  ];
}

function bloquePuntos(ctx, cfg) {
  const { pj, D } = ctx;
  const usados = CARACTERISTICAS.reduce((a, c) => a + (pj.base[c] || 0), 0);
  const quedan = cfg.total - usados;
  const aplicarConjunto = (vals) => ctx.actualizar((p) => { p.base = asignarCaracteristicas(vals, p.vocacion, D.linajes.get(p.linaje)); });
  return h('section', { class: 'bloque' },
    h('h3', null, 'Reparto', h('span', { class: 'contador' }, `${quedan} de ${cfg.total} puntos por repartir`)),
    h('p', { class: 'bloque-ayuda' }, `En bloques de ${cfg.paso}, entre ${cfg.min} y ${cfg.max} por característica. `, ref(16)),
    h('div', { class: 'car-rejilla' }, CARACTERISTICAS.map((c) => h('div', { class: 'car' },
      h('span', { class: 'car-nombre' }, NOMBRE_CAR[c]),
      contador({
        valor: pj.base[c] || 0, min: cfg.min, max: Math.min(cfg.max, (pj.base[c] || 0) + quedan), paso: cfg.paso, etiqueta: NOMBRE_CAR[c], foco: `base-${c}`,
        alCambiar: (v) => ctx.actualizar((p) => { p.base[c] = v; }),
      })))),
    h('div', { style: 'margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center' },
      h('span', { class: 'etiqueta' }, 'Conjuntos del manual:'),
      cfg.conjuntos_predefinidos.map((vals) => h('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => aplicarConjunto(vals) }, vals.map(signo).join(' '))),
      h('span', { class: 'ref' }, pj.vocacion ? 'se colocan según tu vocación' : 'elige vocación para colocarlos mejor')));
}

function bloqueTiradas(ctx) {
  const { pj, D } = ctx;
  const tabla = D.tablas.generacion_caracteristicas;
  const doce = pj.metodo === 'mejores_de_doce';
  const tiradas = pj.tiradas || [];
  const asign = pj.ui_asignacion || derivarAsignacion(pj, tabla);
  const usadoPor = Object.fromEntries(Object.entries(asign).map(([c, i]) => [i, c]));
  const tirar = () => ctx.actualizar((p) => {
    const r = tirarCaracteristicas(D, ctx.rng, p.metodo);
    p.tiradas = r.tiradas;
    p.base = Object.fromEntries(CARACTERISTICAS.map((c) => [c, 0]));
    p.ui_asignacion = {};
  });
  const asignarAuto = () => ctx.actualizar((p) => {
    const orden = [...(PRIORIDAD[p.vocacion] || CARACTERISTICAS)];
    const lin = D.linajes.get(p.linaje);
    const idx = p.tiradas.map((t, i) => ({ i, v: valorCaracteristicaTirada(tabla, t) })).sort((a, b) => b.v - a.v).slice(0, 6);
    const base = asignarCaracteristicas(idx.map((x) => x.v), p.vocacion, lin);
    p.base = base;
    // Reconstruye qué tirada va a cada característica
    const libres = [...idx];
    p.ui_asignacion = {};
    for (const c of orden) {
      const k = libres.findIndex((x) => x.v === base[c]);
      if (k >= 0) { p.ui_asignacion[c] = libres[k].i; libres.splice(k, 1); }
    }
  });
  const asignar = (c, i) => ctx.actualizar((p) => {
    p.ui_asignacion = { ...(p.ui_asignacion || derivarAsignacion(p, tabla)) };
    if (i == null) { delete p.ui_asignacion[c]; p.base[c] = 0; return; }
    for (const [otra, j] of Object.entries(p.ui_asignacion)) if (j === i && otra !== c) { delete p.ui_asignacion[otra]; p.base[otra] = 0; }
    p.ui_asignacion[c] = i;
    p.base[c] = valorCaracteristicaTirada(tabla, p.tiradas[i]);
  });

  return h('section', { class: 'bloque' },
    h('h3', null, 'Tiradas', h('span', { class: 'contador' }, doce ? '12 × 1d100, te quedas con 6' : '6 × 1d100 en la tabla [1.1]')),
    h('p', { class: 'bloque-ayuda' }, 'Tira y coloca cada resultado en la característica que quieras. ', ref(16, '[1.1]')),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' },
      h('button', { type: 'button', class: 'btn btn-tinta dado', 'data-foco': 'tirar', onclick: tirar }, tiradas.length ? 'Volver a tirar' : `Tirar ${doce ? 12 : 6} veces`),
      tiradas.length ? h('button', { type: 'button', class: 'btn', onclick: asignarAuto }, pj.vocacion ? 'Colocar según mi vocación' : 'Colocar de mayor a menor') : null),
    tiradas.length ? h('div', { class: 'tiradas', 'aria-label': 'Resultados' }, tiradas.map((t, i) => h('span', { class: `tirada${usadoPor[i] ? ' usada' : ''}` },
      signo(valorCaracteristicaTirada(tabla, t)), h('small', null, usadoPor[i] ? `${usadoPor[i]} · ${t}` : `d100: ${t}`)))) : null,
    tiradas.length ? h('div', { class: 'fila-campos', style: 'margin-top:12px' }, CARACTERISTICAS.map((c) => h('label', { class: 'campo' },
      h('span', null, NOMBRE_CAR[c]),
      h('select', { 'data-foco': `asig-${c}`, onchange: (e) => asignar(c, e.target.value === '' ? null : Number(e.target.value)) },
        h('option', { value: '' }, '— Sin asignar —'),
        tiradas.map((t, i) => h('option', { value: i, selected: asign[c] === i },
          `${signo(valorCaracteristicaTirada(tabla, t))} (d100: ${t})${usadoPor[i] && usadoPor[i] !== c ? ` · en ${usadoPor[i]}` : ''}`)))))) : null);
}

/** Si el PJ viene del generador (sin asignación guardada), deduce qué tirada fue a cada característica. */
function derivarAsignacion(pj, tabla) {
  const libres = (pj.tiradas || []).map((t, i) => ({ i, v: valorCaracteristicaTirada(tabla, t) }));
  const r = {};
  for (const c of CARACTERISTICAS) {
    const k = libres.findIndex((x) => x.v === pj.base[c]);
    if (k >= 0) { r[c] = libres[k].i; libres.splice(k, 1); }
  }
  return r;
}
