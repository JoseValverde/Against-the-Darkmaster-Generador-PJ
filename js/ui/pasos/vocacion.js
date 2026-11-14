// Paso III · Vocación y habilidades (PD de nivel 1)
import { h, signo } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, botonDado, contador, selector, NOMBRE_CAT, ref } from '../comun.js';
import { CATEGORIAS, bonoPorRangos, bonosCombateAleatorios, desarrolloNivel1Aleatorio } from '../../engine/index.js';

export default function pasoVocacion(ctx) {
  const { pj, D, hoja } = ctx;
  const lin = D.linajes.get(pj.linaje);
  const voc = D.vocaciones.get(pj.vocacion);

  const elegirVocacion = (id) => ctx.actualizar((p) => {
    if (p.vocacion === id) return;
    p.vocacion = id; p.bonos_combate = [];
    p.desarrollo = [{ compras: {}, pago: {}, transferencias: [] }, ...(p.desarrollo || []).slice(1)];
  });
  const bloqueada = (v) => (lin && (lin.vocaciones_prohibidas || []).includes(v.id) ? `${lin.nombre}: Supersticioso` : null);

  return [
    cabeceraPaso(ctx, 'Vocación y habilidades', ['Tu oficio de aventurero: decide cuántos puntos de desarrollo (PD) recibes en cada categoría. ', ref(62), '.'], botonDado(ctx)),
    problemasDelPaso(ctx),
    h('section', { class: 'bloque' },
      h('h3', null, 'Vocación'),
      h('div', { class: 'elegir' },
        h('ul', { class: 'lista-opciones', 'aria-label': 'Vocaciones' }, [...D.vocaciones.values()].map((v) => {
          const b = bloqueada(v);
          return h('li', null, h('button', { type: 'button', 'aria-pressed': String(v.id === pj.vocacion), 'data-foco': `voc-${v.id}`, 'data-bloqueado': b ? 'true' : null, title: b, onclick: () => elegirVocacion(v.id) }, h('span', null, v.nombre)));
        })),
        voc ? fichaVocacion(voc, ctx) : h('p', { class: 'bloque-ayuda' }, 'Elige una vocación para repartir tus PD.'))),
    voc ? bloqueCombate(ctx, voc) : null,
    voc ? bloqueDesarrollo(ctx, voc) : null,
    voc ? bloqueTransferencias(ctx) : null,
    piePaso(ctx),
  ];
}

function fichaVocacion(v, ctx) {
  return h('article', { class: 'ficha' },
    h('div', null, h('h4', null, v.nombre), ref(v.pagina)),
    h('p', { class: 'resumen-texto' }, v.resumen),
    h('div', { class: 'mods' }, CATEGORIAS.map((c) => h('span', null, `${NOMBRE_CAT[c]} `, h('b', null, v.pd[c])))),
    h('div', { class: 'mods' }, h('span', null, 'PM por nivel ', h('b', null, v.pm_por_nivel), ` + 1 por cada 10 de ${ctx.D.caracteristicaPM[v.id]}`)),
    v.escuelas_vocacionales.length
      ? h('p', { style: 'font-size:var(--t-s)' }, h('b', null, 'Escuelas vocacionales: '), v.escuelas_vocacionales.map((e) => ctx.D.escuelas.get(e).nombre).join(', '))
      : h('p', { style: 'font-size:var(--t-s);color:var(--tinta-2)' }, 'Sin escuelas vocacionales: solo comunes o de linaje, pagadas con PD de otras categorías.'));
}

function bloqueCombate(ctx, voc) {
  if (!voc.bonos_combate.length) return null;
  const { pj, D } = ctx;
  const combate = [...D.habilidades.values(), ...(ctx.mesa.especializadas ? [...D.especializadas.values()] : [])].filter((x) => D.categoriasPosibles(x.id).includes('combate'));
  const elegidas = pj.bonos_combate || [];
  return h('section', { class: 'bloque' },
    h('h3', null, 'Bonificadores de Combate', h('button', { type: 'button', class: 'btn btn-pequeno dado', onclick: () => ctx.actualizar((p) => { p.bonos_combate = bonosCombateAleatorios(D, ctx.rng, p); }) }, 'Al azar')),
    h('p', { class: 'bloque-ayuda' }, 'Cada bonificador va a una habilidad de Combate distinta y no cambia nunca.'),
    h('div', { class: 'fila-campos' }, voc.bonos_combate.map((b, i) => selector({
      etiqueta: `${i + 1}ª habilidad: ${signo(b)}`, valor: elegidas[i], foco: `bc-${i}`,
      opciones: combate.map((x) => ({ valor: x.id, etiqueta: x.nombre, deshabilitado: elegidas.includes(x.id) && elegidas[i] !== x.id })),
      alCambiar: (v) => ctx.actualizar((p) => {
        const arr = [...(p.bonos_combate || [])];
        arr[i] = v;
        p.bonos_combate = arr.slice(0, voc.bonos_combate.length).map((x) => x || null).filter((x, k, a) => x || k < a.length - 1);
      }),
    }))));
}

function bloqueDesarrollo(ctx, voc) {
  const { pj, D, hoja, mesa } = ctx;
  const n1 = hoja.pd.niveles[0] || { presupuesto: {}, gastado: {} };
  const compras = pj.desarrollo?.[0]?.compras || {};
  const pago = pj.desarrollo?.[0]?.pago || {};
  const filas = new Map([...hoja.habilidades, ...hoja.escuelas, ...hoja.especializadas].map((f) => [f.id, f]));
  const restante = (c) => (n1.presupuesto[c] || 0) - (n1.gastado[c] || 0);
  const costeRango = (id) => (D.tipo(id) === 'especializada' ? (D.especializadasCoste.rangos_por_pd[voc.id] ? 0.5 : 2) : 1);
  const comprar = (id, v) => ctx.actualizar((p) => {
    const d = p.desarrollo[0] || (p.desarrollo[0] = { compras: {}, pago: {}, transferencias: [] });
    d.compras = { ...d.compras };
    if (v > 0) d.compras[id] = v; else delete d.compras[id];
  });
  const pagarCon = (id, cat) => ctx.actualizar((p) => {
    const d = p.desarrollo[0];
    d.pago = { ...(d.pago || {}) };
    if (cat && cat !== 'sortilegios') d.pago[id] = cat; else delete d.pago[id];
  });

  // Escuelas visibles: vocacionales, de linaje y las que ya tienen rangos; las comunes aparte
  const escLinaje = new Set([...(D.linajes.get(pj.linaje)?.escuelas_linaje?.escuelas || []), ...hoja.escuelas.filter((e) => e.acceso === 'linaje').map((e) => e.id)]);
  const principales = [...new Set([...voc.escuelas_vocacionales, ...escLinaje, ...hoja.escuelas.map((e) => e.id)])];
  const comunes = [...D.comunes].filter((e) => !principales.includes(e));

  const fila = (id, carId) => {
    const f = filas.get(id) || filaVacia(ctx, id, carId);
    const cat = pago[id] || D.categoria(id);
    const yaComprado = compras[id] || 0;
    const maxPorPD = Math.floor((restante(cat) + yaComprado * costeRango(id)) / costeRango(id));
    const otros = f.rangos.total - (f.rangos.desarrollo || 0);
    const esLinaje = D.tipo(id) === 'escuela' && escLinaje.has(id);
    return h('tr', null,
      h('td', { class: 'nombre-hab' }, f.nombre, carId ? h('small', null, carId) : null,
        esLinaje ? h('select', { class: 'col-opc', style: 'min-height:28px;font-size:var(--t-xs);margin-top:4px;width:auto', 'aria-label': `Pagar ${f.nombre} con PD de`, onchange: (e) => pagarCon(id, e.target.value) },
          CATEGORIAS.map((c) => h('option', { value: c, selected: c === cat }, `pagar con ${NOMBRE_CAT[c]}`))) : null),
      h('td', { class: 'tenue col-opc' }, signo(f.car)),
      h('td', { class: 'tenue', title: 'Rangos de cultura, linaje y trasfondos' }, otros || '·'),
      h('td', null, contador({ valor: yaComprado, min: 0, max: Math.min(2, maxPorPD), etiqueta: `rangos de ${f.nombre}`, foco: `pd-${id}`, alCambiar: (v) => comprar(id, v) })),
      h('td', { class: 'tenue col-opc' }, signo(bonoPorRangos(f.rangos.total))),
      h('td', { class: 'tenue col-opc' }, f.voc ? signo(f.voc) : '·'),
      h('td', { class: 'tenue col-opc' }, f.lin ? signo(f.lin) : '·'),
      h('td', { class: 'tenue col-opc' }, f.esp || f.obj ? signo(f.esp + f.obj) : '·'),
      h('td', { class: 'total' }, signo(f.total)));
  };
  const cabeceraCat = (c, nota) => {
    const r = restante(c);
    return h('tr', { class: 'cat-cabecera' }, h('td', { colspan: 9 }, NOMBRE_CAT[c],
      nota ? h('span', { class: 'ref' }, ` ${nota}`) : null,
      h('span', { class: `pd-estado${r > 0 ? ' sobra' : r < 0 ? ' pasa' : ''}` }, `PD ${n1.gastado[c] || 0} / ${n1.presupuesto[c] || 0}`)));
  };

  const cuerpo = [];
  for (const c of CATEGORIAS) {
    if (c === 'sortilegios') {
      cuerpo.push(cabeceraCat(c, voc.escuelas_vocacionales.length ? '' : '(escuelas de linaje o comunes, con PD transferidos)'));
      principales.forEach((id) => cuerpo.push(fila(id, D.escuelas.get(id).caracteristica)));
      cuerpo.push(h('tr', { class: 'cat-cabecera' }, h('td', { colspan: 9, style: 'font-size:var(--t-s)' }, 'Escuelas comunes', h('span', { class: 'ref' }, ' — cualquiera las aprende, solo hasta la 5ª urdimbre'))));
      comunes.forEach((id) => cuerpo.push(fila(id, D.escuelas.get(id).caracteristica)));
      continue;
    }
    cuerpo.push(cabeceraCat(c));
    [...D.habilidades.values()].filter((x) => x.categoria === c).forEach((x) => cuerpo.push(fila(x.id, x.caracteristica)));
    if (mesa.especializadas) [...D.especializadas.values()].filter((x) => D.categoria(x.id) === c).forEach((x) => cuerpo.push(fila(x.id, x.caracteristica)));
  }

  return h('section', { class: 'bloque' },
    h('h3', null, 'Desarrollo de nivel 1', h('button', { type: 'button', class: 'btn btn-pequeno dado', onclick: () => ctx.actualizar((p) => { p.desarrollo = [desarrolloNivel1Aleatorio(D, ctx.rng, p, mesa), ...p.desarrollo.slice(1)]; }) }, 'Repartir al azar')),
    h('p', { class: 'bloque-ayuda' }, '1 PD = 1 rango. Máximo 2 rangos por habilidad y nivel; los rangos de cultura no cuentan para ese límite. Los PD que sobren se pierden. ', ref(72, '[1.19]'),
      mesa.especializadas ? h('span', null, ' Especializadas: ', voc.id === 'guerrero' || voc.id === 'picaro' ? '1 PD = 2 rangos.' : '2 PD por rango.') : null),
    h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-hoja' },
      h('thead', null, h('tr', null,
        h('th', null, 'Habilidad'), h('th', { class: 'col-opc' }, 'Carac.'), h('th', { title: 'Rangos ya obtenidos' }, 'Rang.'), h('th', null, 'Comprar'),
        h('th', { class: 'col-opc' }, 'Bon.'), h('th', { class: 'col-opc' }, 'Voc.'), h('th', { class: 'col-opc' }, 'Lin.'), h('th', { class: 'col-opc' }, 'Esp.'), h('th', null, 'TOTAL'))),
      h('tbody', null, cuerpo))));
}

/** Fila calculada a mano para escuelas sin rangos (el motor solo devuelve las que tienen alguno). */
function filaVacia(ctx, id, carId) {
  const { D, hoja } = ctx;
  const voc = D.vocaciones.get(ctx.pj.vocacion);
  const car = carId ? hoja.caracteristicas[carId].total : 0;
  const v = D.tipo(id) === 'escuela' ? voc?.bonos_vocacionales.escuelas_sortilegas || 0 : 0;
  return { id, nombre: D.nombre(id), car, rangos: { total: 0, desarrollo: 0 }, voc: v, lin: 0, esp: 0, obj: 0, total: car + v };
}

function bloqueTransferencias(ctx) {
  const { pj, hoja } = ctx;
  const trans = pj.desarrollo?.[0]?.transferencias || [];
  const n1 = hoja.pd.niveles[0];
  let desde1 = CATEGORIAS.find((c) => n1.presupuesto[c] - n1.gastado[c] > 0) || 'combate', desde2 = desde1, hacia = 'corpulencia';
  const cambiarTrans = (fn) => ctx.actualizar((p) => { const d = p.desarrollo[0]; d.transferencias = fn([...(d.transferencias || [])]); });
  const opciones = (sel, alCambiar, conPM) => h('select', { onchange: (e) => alCambiar(e.target.value), style: 'width:auto' },
    CATEGORIAS.map((c) => h('option', { value: c, selected: c === sel }, NOMBRE_CAT[c])),
    conPM ? h('option', { value: 'pm' }, '1 punto de magia') : null);
  return h('section', { class: 'bloque' },
    h('h3', null, 'Transferir PD', h('span', { class: 'contador' }, '2 PD de una o dos categorías = 1 PD en otra, o 1 PM')),
    trans.length ? h('ul', { class: 'rasgos', style: 'margin-bottom:12px' }, trans.map((t, i) => h('li', null,
      `${NOMBRE_CAT[t.desde[0]]} + ${NOMBRE_CAT[t.desde[1]]} → ${t.hacia === 'pm' ? '1 PM' : NOMBRE_CAT[t.hacia]} `,
      h('button', { type: 'button', class: 'btn btn-texto btn-pequeno', onclick: () => cambiarTrans((a) => a.filter((_, k) => k !== i)) }, 'quitar')))) : null,
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' },
      h('span', { class: 'etiqueta' }, 'De'), opciones(desde1, (v) => { desde1 = v; }),
      h('span', { class: 'etiqueta' }, 'y'), opciones(desde2, (v) => { desde2 = v; }),
      h('span', { class: 'etiqueta' }, 'a'), opciones(hacia, (v) => { hacia = v; }, true),
      h('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => cambiarTrans((a) => [...a, { desde: [desde1, desde2], hacia }]) }, 'Añadir')));
}
