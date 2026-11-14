// Hoja de personaje imprimible: misma estructura que la hoja oficial (3 páginas A4)
// más una página de grimorio si el PJ conoce sortilegios. Sin logotipos ni arte oficial.
import { h, vaciar, signo } from './dom.js';
import { NOMBRE_CAR, NOMBRE_CAT } from './comun.js';
import { CARACTERISTICAS, CATEGORIAS, bonoPorRangos } from '../engine/index.js';

const v = (x) => (x == null || x === '' ? '' : String(x));
const s = (n) => (n == null ? '' : signo(n));
const sOpc = (n) => (n ? signo(n) : '');

export function pintarHoja(el, ctx, { alVolver, alImprimir, alPdfOficial }) {
  const { pj, hoja, D } = ctx;
  vaciar(el).append(
    h('div', { class: 'hoja-barra' },
      h('button', { type: 'button', class: 'btn', onclick: alVolver }, '← Volver al generador'),
      h('span', { class: 'hoja-barra-nota' }, hoja.valido ? 'Cumple las reglas.' : 'Ojo: hay cosas por corregir en el generador.'),
      h('div', { class: 'hoja-barra-acciones' },
        alPdfOficial ? h('button', { type: 'button', class: 'btn', onclick: alPdfOficial }, 'PDF oficial rellenado') : null,
        h('button', { type: 'button', class: 'btn btn-tinta', onclick: alImprimir }, 'Imprimir o guardar PDF'))),
    h('div', { class: 'hoja-paginas' },
      pagina1(pj, hoja, D), pagina2(pj, hoja, D), pagina3(pj, hoja, D),
      hoja.grimorio.length ? pagina4(pj, hoja, D) : null));
  ajustarZoom(el);
}

/** En pantallas estrechas, reduce las páginas para que quepan sin scroll horizontal. */
export function ajustarZoom(el) {
  const ancho = 794; // A4 a 96 ppp
  const disponible = Math.min(window.innerWidth, document.documentElement.clientWidth) - 24;
  el.style.setProperty('--zoom-hoja', String(Math.min(1, disponible / ancho)));
}

// ---------------------------------------------------------------------------

const titulo = (t) => h('h2', { class: 'h-titulo' }, t);
const campo = (etiqueta, valor, clase = '') => h('div', { class: `h-campo ${clase}` }, h('span', { class: 'h-valor' }, v(valor)), h('span', { class: 'h-etiqueta' }, etiqueta));
const caja = (valor) => h('span', { class: 'h-caja' }, v(valor));
const rombos = (n, llenos) => h('span', { class: 'h-rombos' }, Array.from({ length: n }, (_, i) => h('span', { class: `h-rombo${i < llenos ? ' lleno' : ''}` })));

function cabecera(pj, hoja, D) {
  const lin = D.linajes.get(pj.linaje), cul = D.culturas.get(pj.cultura), voc = D.vocaciones.get(pj.vocacion);
  return h('header', { class: 'h-cabecera' },
    h('div', { class: 'h-marca' }, h('span', null, 'Against the'), h('b', null, 'Darkmaster')),
    h('div', { class: 'h-cab-campos' },
      h('div', { class: 'h-fila' }, campo('Nombre del personaje', pj.nombre, 'ancho'), campo('Nvl.', hoja.nivel), campo('PX', hoja.derivados.px.actual), campo('Próx. Nvl.', hoja.derivados.px.siguiente ?? '—')),
      h('div', { class: 'h-fila' }, campo('Linaje', lin?.nombre), campo('Cultura', cul?.nombre), campo('Vocación', voc?.nombre))));
}

function pagina1(pj, hoja, D) {
  const pas = pj.pasiones || {};
  const extra = hoja.pasiones_extra.map((p) => [p === 'condena' ? 'Condena' : 'Destino', pas[p]]);
  const voc = D.vocaciones.get(pj.vocacion);
  const pdNivel = (c) => (voc ? voc.pd[c] + (hoja.pd.niveles[0] ? hoja.pd.niveles[0].presupuesto[c] - voc.pd[c] - transferidoA(pj, c) : 0) : '');
  const filas = new Map([...hoja.habilidades, ...hoja.especializadas].map((f) => [f.id, f]));
  const marcas = Number(pj.senda_marcas) || 0;
  return h('section', { class: 'h-pagina' },
    cabecera(pj, hoja, D),
    h('div', { class: 'h-bloque' }, titulo('Pasiones'),
      h('div', { class: 'h-pasiones' },
        [['Motivación', pas.motivacion], ['Naturaleza', pas.naturaleza], ['Lealtad', pas.lealtad], ...extra].map(([k, t]) => h('div', { class: 'h-linea' }, h('span', { class: 'h-etiqueta' }, k), h('span', { class: 'h-texto' }, v(t)))))),
    h('div', { class: 'h-dos' },
      h('div', { class: 'h-col' },
        h('div', { class: 'h-bloque h-en-linea' }, titulo('Determinación'), rombos(5, hoja.derivados.determinacion)),
        h('div', { class: 'h-bloque' }, titulo('Senda Heroica'),
          h('div', { class: 'h-senda' }, Array.from({ length: 10 }, (_, f) => h('div', { class: 'h-senda-fila' },
            Array.from({ length: 9 }, (_, i) => h('span', { class: `h-casilla${f * 10 + i < marcas ? ' llena' : ''}` })),
            h('span', { class: `h-hito${(f + 1) * 10 <= marcas ? ' lleno' : ''}` }, String((f + 1) * 10)))))),
        h('div', { class: 'h-bloque' },
          tabla('Características', ['', 'Base', 'Linaje', 'Esp.', 'TOTAL'], CARACTERISTICAS.map((c) => {
            const x = hoja.caracteristicas[c];
            return [h('span', null, h('b', null, NOMBRE_CAR[c]), ` (${c})`), s(x.base), s(x.linaje), sOpc(x.esp), h('b', null, s(x.total))];
          }), 'h-cars')),
        h('div', { class: 'h-bloque' },
          tabla('Salvaciones', ['', 'Nvl.', 'Lin.', 'Esp.', 'TOTAL'], [
            ['Fortaleza (TSF)', hoja.derivados.tsf], ['Voluntad (TSV)', hoja.derivados.tsv],
          ].map(([n, t]) => [h('b', null, n), s(t.nivel), sOpc(t.lin), sOpc(t.esp), h('b', null, s(t.car + t.nivel + t.lin + t.esp))]), 'h-cars')),
        h('div', { class: 'h-bloque' }, titulo('Rasgos especiales'),
          h('ul', { class: 'h-lista' }, hoja.rasgos.filter((r) => r.origen !== 'trasfondo').map((r) => h('li', null, h('b', null, r.nombre), ` — ${r.resumen}`)))),
        h('div', { class: 'h-bloque' }, titulo('Trasfondo'),
          h('ul', { class: 'h-lista' }, hoja.rasgos.filter((r) => r.origen === 'trasfondo').map((r) => h('li', null, h('b', null, r.nombre)))))),
      h('div', { class: 'h-col' },
        h('div', { class: 'h-bloque' }, titulo('Habilidades'),
          h('table', { class: 'h-tabla h-habs' },
            h('thead', null, h('tr', null, ['', 'Carac.', 'Rangos y Bon.', 'Voc.', 'Lin.', 'Esp.', 'Obj.', 'TOTAL'].map((t, i) => h('th', { colspan: i === 2 ? 2 : null }, t)))),
            h('tbody', null, CATEGORIAS.filter((c) => c !== 'sortilegios').flatMap((c) => [
              h('tr', { class: 'h-cat' }, h('td', { colspan: 8 }, NOMBRE_CAT[c]), h('td', { class: 'h-pd', title: 'Puntos de desarrollo por nivel' }, v(pdNivel(c)))),
              ...[...filas.values()].filter((f) => f.categoria === c || (Array.isArray(D.especializadas.get(f.id)?.categoria) && D.especializadas.get(f.id).categoria.includes(c) && f.categoria === c)).map((f) => h('tr', null,
                h('td', { class: 'h-hab' }, f.nombre, f.caracteristica ? ` (${f.caracteristica})` : f.id === 'armadura' ? ' (sin carac.)' : ''),
                h('td', null, f.caracteristica ? s(f.car) : ''),
                h('td', null, f.rangos.total || ''), h('td', null, f.rangos.total ? s(f.bono_rangos) : ''),
                h('td', null, sOpc(f.voc)), h('td', null, sOpc(f.lin)), h('td', null, sOpc(f.esp)), h('td', null, sOpc(f.obj)),
                h('td', { class: 'h-total' }, s(f.total)))),
            ])))))),
    pie());
}

/** PD recibidos por transferencias en el nivel 1 (para mostrar solo los PD de la vocación). */
function transferidoA(pj, c) {
  return (pj.desarrollo?.[0]?.transferencias || []).filter((t) => t.hacia === c).length;
}

function pagina2(pj, hoja, D) {
  const d = hoja.derivados;
  const piezas = [pj.equipo?.armadura, pj.equipo?.escudo, pj.equipo?.yelmo, ...(pj.equipo?.piezas || [])].filter(Boolean).map((id) => D.armaduras.get(id)).filter(Boolean);
  const escudo = piezas.find((p) => p.categoria === 'escudo');
  const agiDef = Math.min(Math.max(hoja.caracteristicas.AGI.total, 0), d.agi_max_def ?? Infinity);
  const objetos = [...hoja.equipo_inicial, ...(pj.equipo?.objetos || [])];
  const filasArm = Math.max(4, piezas.length), filasArmas = Math.max(4, hoja.armas.length), filasEq = Math.max(10, Math.ceil(objetos.length / 2) * 2);
  return h('section', { class: 'h-pagina' },
    h('div', { class: 'h-fila h-sup' },
      h('div', { class: 'h-recuadro' }, titulo('Ptos. de Golpe'), campo('Totales', d.pg), campo('Actuales', '')),
      h('div', { class: 'h-recuadro' }, titulo('Velocidad'), campo('Nivel de impedimenta', d.penalizador_movimiento ? 'con armadura' : 'sin carga'), campo('Velocidad de desplazamiento', `${String(d.velocidad).replace('.', ',')} m`))),
    h('div', { class: 'h-dos' },
      h('div', { class: 'h-col' },
        h('div', { class: 'h-bloque' }, titulo('Heridas'),
          h('div', { class: 'h-fila' }, campo('Hemorragia', ''), campo('Aturdido', ''), campo('Penalizaciones', '')),
          h('div', { class: 'h-fila' }, campo('Estados', '', 'ancho'))),
        h('div', { class: 'h-bloque' }, titulo('Riqueza'), h('div', { class: 'h-fila' }, campo('Nivel de riqueza', d.nr), campo('Nivel social', d.nivel_social)))),
      h('div', { class: 'h-col' },
        h('div', { class: 'h-bloque' }, titulo('Defensas'),
          h('div', { class: 'h-fila' }, campo('Bonif. de AGI', s(agiDef)), campo('Bonif. de escudo', escudo ? `${s(escudo.def_cc)} / ${s(escudo.def_proy || 0)}` : '—')),
          h('div', { class: 'h-fila' }, campo('Bonif. de objeto', '—'), campo('Bonif. especial', '—')),
          h('div', { class: 'h-fila' }, campo('Defensa cuerpo a cuerpo', d.defensa_cc, 'grande'), campo('Defensa de proyectiles', d.defensa_proyectiles, 'grande'))))),
    h('div', { class: 'h-bloque' },
      tabla('Armaduras y escudos', ['Armadura / Escudo', 'Tipo', 'Zonas protegidas', 'AGI máx. en DEF', 'Pen. al mov.', 'Pen. al combate', 'Pen. a percepción', 'DEF proy.', 'DEF c/c', 'Cualidades'],
        relleno(piezas.map((p) => [p.nombre, p.tipo || '—', p.zonas, p.agi_max_def != null ? s(p.agi_max_def) : '—', sOpc(p.pen_movimiento), sOpc(p.pen_bc), sOpc(p.pen_percepcion), sOpc(p.def_proy), sOpc(p.def_cc), p.cualidades.join(', ')]), filasArm, 10), 'h-ancha')),
    h('div', { class: 'h-bloque' },
      tabla('Armas y ataques', ['Arma / Ataque', 'Manos', 'Longitud', 'Habilidad (BC)', 'Torpeza', 'Tabla', 'Res. máx.', 'Crít. princ.', 'Crít. alt.', 'Alcance', 'Cualidades'],
        relleno(hoja.armas.map((a) => [a.nombre, a.manos, a.longitud || '—', `${a.habilidad_nombre} ${s(a.bc)}`, a.torpeza, a.tabla, a.resultado_max, a.critico, a.critico_alt || '—', a.alcance_base ?? '—', a.cualidades.join(', ')]), filasArmas, 11), 'h-ancha')),
    h('div', { class: 'h-bloque' },
      tabla('Equipo', ['Objeto y descripción', 'Ubicación', 'Objeto y descripción', 'Ubicación'],
        Array.from({ length: filasEq / 2 }, (_, i) => [objetos[i * 2] || '', '', objetos[i * 2 + 1] || '', '']), 'h-ancha')),
    pie());
}

function pagina3(pj, hoja, D) {
  const pm = hoja.derivados.pm;
  const tras = (id) => pj.trasfondos?.find((t) => t.id === id);
  const animal = tras('companero_leal')?.eleccion?.animal;
  const montura = tras('nacido_silla')?.eleccion?.montura;
  const logros = D.tablas.progresion.logros.lista.filter((l) => l.siempre);
  const filasEsc = Math.max(14, hoja.escuelas.length);
  return h('section', { class: 'h-pagina' },
    h('div', { class: 'h-bloque' },
      tabla('Puntos de magia', ['Lin.', 'Carac.', 'Esp.', 'Obt. Carac./Nvl.', 'Obt. Voc./Nvl.', 'TOTAL', 'Gastados'],
        [[s(pm.linaje), pm.caracteristica || '—', sOpc(pm.transferidos + (pm.revelaciones || 0) + pm.por_trasfondos * hoja.nivel), s(pm.por_caracteristica), s(pm.por_vocacion), h('b', null, pm.total), '']], 'h-ancha')),
    h('div', { class: 'h-bloque' },
      h('table', { class: 'h-tabla h-habs h-ancha' },
        h('caption', null, titulo('Escuelas Sortílegas')),
        h('thead', null, h('tr', null, ['Escuela', 'Carac.', 'Rangos y Bon.', 'Voc.', 'Lin.', 'Esp.', 'Obj.', 'TOTAL'].map((t, i) => h('th', { colspan: i === 2 ? 2 : null }, t)))),
        h('tbody', null, Array.from({ length: filasEsc }, (_, i) => {
          const e = hoja.escuelas[i];
          if (!e) return h('tr', null, Array.from({ length: 9 }, () => h('td', null, '')));
          return h('tr', null, h('td', { class: 'h-hab' }, `${e.nombre} (${e.caracteristica})`), h('td', null, s(e.car)), h('td', null, e.rangos.total), h('td', null, s(e.bono_rangos)),
            h('td', null, sOpc(e.voc)), h('td', null, sOpc(e.lin)), h('td', null, sOpc(e.esp)), h('td', null, sOpc(e.obj)), h('td', { class: 'h-total' }, s(e.total)));
        })))),
    h('div', { class: 'h-dos' },
      h('div', { class: 'h-bloque' }, titulo('Compañero animal'),
        h('div', { class: 'h-fila' }, campo('Nombre', animal || ''), campo('Tipo de animal', '')),
        h('div', { class: 'h-fila' }, campo('Velocidad', ''), campo('Tipo de ataque', '')),
        h('div', { class: 'h-fila' }, campo('PG', ''), campo('Bonif. combate', ''), campo('DEF', ''))),
      h('div', { class: 'h-bloque' }, titulo('Montura'),
        h('div', { class: 'h-fila' }, campo('Nombre', montura || ''), campo('Tipo de animal', '')),
        h('div', { class: 'h-fila' }, campo('Bonif. equit.', ''), campo('Velocidad', ''), campo('Tipo de ataque', '')),
        h('div', { class: 'h-fila' }, campo('PG', ''), campo('Bonif. combate', ''), campo('DEF', '')))),
    h('div', { class: 'h-bloque' }, titulo('Puntos de experiencia'),
      h('ul', { class: 'h-logros' }, [...logros.map((l) => l.texto), '', '', '', '', '', '', ''].map((t) => h('li', null, h('span', { class: 'h-circulo' }), h('span', { class: 'h-texto' }, t))))),
    pie());
}

function pagina4(pj, hoja) {
  return h('section', { class: 'h-pagina h-grimorio' },
    h('div', { class: 'h-bloque' }, titulo('Grimorio'),
      h('p', { class: 'h-nota' }, `Sortilegios conocidos. Coste en PM = urdimbre. ◆ = lo puedes lanzar a nivel ${hoja.nivel}.`)),
    h('div', { class: 'h-grim-cols' }, hoja.grimorio.map((g) => h('div', { class: 'h-grim-escuela' },
      h('h3', null, g.nombre, h('small', null, ` ${g.caracteristica} · ${s(g.total)}`)),
      h('ul', null, g.sortilegios.map((sp) => h('li', null,
        h('b', null, `${sp.ejecutable ? '◆ ' : ''}${sp.urdimbre}ª ${sp.nombre}${sp.instantaneo ? '*' : ''}`), ` — ${sp.resumen} `,
        h('span', { class: 'h-param' }, `${sp.alcance} · ${sp.area} · ${sp.duracion}${sp.salvacion ? ' · TS' : ''}`))))))),
    pie());
}

function tabla(nombre, cabeceras, filas, clase = '') {
  return h('table', { class: `h-tabla ${clase}` },
    h('caption', null, titulo(nombre)),
    h('thead', null, h('tr', null, cabeceras.map((c) => h('th', null, c)))),
    h('tbody', null, filas.map((f) => h('tr', null, f.map((c, i) => h('td', { class: i === 0 ? 'h-hab' : null }, c instanceof Node ? c : v(c)))))));
}

const relleno = (filas, minimo, columnas) => [...filas, ...Array.from({ length: Math.max(0, minimo - filas.length) }, () => Array(columnas).fill(''))];
const pie = () => h('footer', { class: 'h-pie' },
  h('span', null, 'Herramienta no oficial, desarrollada gracias al blog ', h('b', null, 'anotacionesrol.blogspot.com'), ' · '),
  h('span', null, 'Juego de rol ', h('i', null, 'Against the Darkmaster'), ': ', h('b', null, 'other-selves.com/vsdm')));
