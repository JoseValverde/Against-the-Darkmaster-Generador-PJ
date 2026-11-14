// Paso II · Linaje y cultura
import { h, signo } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, botonDado, contador, selector, modsTexto, ref } from '../comun.js';
import { linajesPermitidos, culturasPermitidas, tirarLinajeCultura, eleccionesLinajeCultura } from '../../engine/index.js';

export default function pasoLinaje(ctx) {
  const { pj, D, mesa } = ctx;
  const lin = D.linajes.get(pj.linaje);
  const cul = D.culturas.get(pj.cultura);

  const elegirLinaje = (id) => ctx.actualizar((p) => {
    if (p.linaje === id) return;
    p.linaje = id; p.linaje_cultura_aleatorio = false;
    p.eleccion_linaje = {}; p.escuelas_linaje = {};
    if (D.culturas.get(p.cultura)?.escuelas?.incluye_linaje) p.escuelas_cultura = {};
  });
  const elegirCultura = (id) => ctx.actualizar((p) => {
    if (p.cultura === id) return;
    p.cultura = id; p.linaje_cultura_aleatorio = false;
    p.atuendo = []; p.escuelas_cultura = {};
  });
  const tirarTabla = () => {
    for (let i = 0; i < 40; i++) {
      const r = tirarLinajeCultura(D, ctx.rng);
      const okL = !mesa.linajes || mesa.linajes.includes(r.linaje);
      const okC = culturasPermitidas(D, mesa).some((c) => c.id === r.cultura);
      if (okL && okC) {
        ctx.actualizar((p) => {
          p.linaje = r.linaje; p.cultura = r.cultura; p.linaje_cultura_aleatorio = true;
          Object.assign(p, eleccionesLinajeCultura(D, ctx.rng, p));
          p.eleccion_linaje = {};
        });
        return;
      }
    }
  };

  const extraCabecera = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
    mesa.fortuna_osado ? h('button', { type: 'button', class: 'btn dado', onclick: tirarTabla, title: 'Tabla [1.5], pág. 46' }, 'Tirar en la tabla') : null,
    botonDado(ctx));

  return [
    cabeceraPaso(ctx, 'Linaje y cultura', ['El linaje es tu sangre; la cultura, dónde y cómo te criaste. ', ref(18), ' y ', ref(44), '.'], extraCabecera),
    problemasDelPaso(ctx),
    mesa.fortuna_osado && pj.linaje_cultura_aleatorio
      ? h('p', { class: 'bloque-ayuda' }, 'Linaje y cultura salieron de la tabla [1.5]. Si además tiras las características, empiezas con 1 punto más de Determinación.')
      : null,

    h('section', { class: 'bloque' },
      h('h3', null, 'Linaje'),
      h('div', { class: 'elegir' },
        listaOpciones(linajesPermitidos(D, mesa), pj.linaje, elegirLinaje, 'Linajes', (l) => (pj.vocacion && (l.vocaciones_prohibidas || []).includes(pj.vocacion) ? 'no puede ser tu vocación' : null)),
        lin ? fichaLinaje(lin, ctx) : h('p', { class: 'bloque-ayuda' }, 'Elige un linaje para ver sus rasgos.'))),

    lin?.eleccion_habilidad ? h('section', { class: 'bloque' },
      h('h3', null, 'Especialización', h('span', { class: 'contador' }, `+${lin.eleccion_habilidad.valor} a una habilidad`)),
      h('div', { class: 'fila-campos' }, selector({
        etiqueta: 'Habilidad', valor: pj.eleccion_linaje?.habilidad, foco: 'especializacion',
        opciones: [...D.habilidades.values()].map((x) => ({ valor: x.id, etiqueta: x.nombre })),
        alCambiar: (v) => ctx.actualizar((p) => { p.eleccion_linaje = v ? { habilidad: v } : {}; }),
      }))) : null,

    lin?.escuelas_linaje ? repartoEscuelas(ctx, 'Conocimiento de los Eones', lin.escuelas_linaje.escuelas, lin.escuelas_linaje.rangos, pj.escuelas_linaje || {}, (r) => ctx.actualizar((p) => { p.escuelas_linaje = r; })) : null,

    h('section', { class: 'bloque' },
      h('h3', null, 'Cultura'),
      h('div', { class: 'elegir' },
        listaOpciones(culturasPermitidas(D, mesa), pj.cultura, elegirCultura, 'Culturas', (c) => (lin?.culturas_sugeridas.includes(c.id) ? 'sugerida' : null), true),
        cul ? fichaCultura(cul, ctx) : h('p', { class: 'bloque-ayuda' }, 'Elige una cultura para ver sus rangos y su atuendo.'))),

    cul ? h('section', { class: 'bloque' },
      h('h3', null, 'Atuendo', h('span', { class: 'contador' }, 'una opción de cada línea')),
      h('div', { class: 'fila-campos' }, cul.atuendo.map((l, i) => selector({
        etiqueta: `Línea ${i + 1}`, valor: pj.atuendo?.[i], foco: `atuendo-${i}`,
        opciones: l.opciones.map((o) => ({ valor: o, etiqueta: o })),
        alCambiar: (v) => ctx.actualizar((p) => { p.atuendo = [...(p.atuendo || [])]; p.atuendo[i] = v; }),
      })))) : null,

    cul?.escuelas ? repartoEscuelas(ctx, `Escuelas de la cultura ${cul.nombre.toLowerCase()}`,
      [...cul.escuelas.opciones, ...(cul.escuelas.incluye_linaje ? lin?.escuelas_linaje?.escuelas || [] : [])],
      cul.escuelas.rangos, pj.escuelas_cultura || {}, (r) => ctx.actualizar((p) => { p.escuelas_cultura = r; }),
      cul.escuelas.reparto === 'una' ? 'Todo a una sola escuela.' : null) : null,

    piePaso(ctx),
  ];
}

function listaOpciones(items, actual, alElegir, etiqueta, nota, sugeridasPrimero = false) {
  const lista = sugeridasPrimero ? [...items].sort((a, b) => (nota(b) === 'sugerida') - (nota(a) === 'sugerida')) : items;
  return h('ul', { class: 'lista-opciones', 'aria-label': etiqueta }, lista.map((x) => {
    const n = nota(x);
    return h('li', null, h('button', {
      type: 'button', 'aria-pressed': String(x.id === actual), 'data-foco': `op-${x.id}`, onclick: () => alElegir(x.id),
      'data-bloqueado': n && n !== 'sugerida' ? 'true' : null, title: n && n !== 'sugerida' ? n : null,
    }, h('span', null, x.nombre), n === 'sugerida' ? h('span', { class: 'sug' }, 'sugerida') : null));
  }));
}

function fichaLinaje(l, ctx) {
  return h('article', { class: 'ficha' },
    h('div', null, h('h4', null, l.nombre), ref(l.pagina)),
    h('p', { class: 'resumen-texto' }, l.resumen),
    h('div', { class: 'mods', 'aria-label': 'Modificadores' }, modsTexto(l.mods)),
    h('div', { class: 'mods' },
      h('span', null, 'PG ', h('b', null, `+${l.pg}`), ` (máx. ${l.pg_max})`),
      h('span', null, 'PM ', h('b', null, signo(l.pm))),
      h('span', null, 'TSF ', h('b', null, signo(l.tsf))),
      h('span', null, 'TSV ', h('b', null, signo(l.tsv))),
      h('span', null, 'PT ', h('b', null, l.pt)),
      h('span', null, 'NR ', h('b', null, signo(l.nr))),
      l.tamano !== 'Mediano' ? h('span', null, 'Tamaño ', h('b', null, l.tamano)) : null),
    h('ul', { class: 'rasgos' }, l.rasgos.map((r) => h('li', null, h('b', null, r.nombre), ' — ', r.resumen))),
    h('p', { class: 'ref' }, 'Culturas sugeridas: ', l.culturas_sugeridas_texto || l.culturas_sugeridas.map((c) => ctx.D.culturas.get(c)?.nombre).join(', ')));
}

function fichaCultura(c, ctx) {
  const rangos = Object.entries(c.rangos).filter(([id]) => id !== 'escuelas_sortilegas').sort((a, b) => b[1] - a[1]);
  return h('article', { class: 'ficha' },
    h('div', null, h('h4', null, c.nombre), ref(c.pagina)),
    h('p', { class: 'resumen-texto' }, c.resumen),
    h('div', { class: 'mods' }, h('span', null, 'Riqueza inicial ', h('b', null, signo(c.nr)))),
    h('p', { style: 'font-size:var(--t-s)' }, h('b', null, 'Rangos culturales: '), rangos.map(([id, n]) => `${ctx.D.nombre(id)} ${n}`).join(' · '),
      c.escuelas ? ` · Escuelas Sortílegas ${c.escuelas.rangos}` : ''),
    h('p', { style: 'font-size:var(--t-s);color:var(--tinta-2)' }, h('b', null, 'Ideas para tus Pasiones: '), c.pasiones),
    c.requiere_permiso ? h('p', { class: 'bloque-ayuda' }, 'Pensada para PNJ: solo si tu mesa la permite.') : null);
}

function repartoEscuelas(ctx, titulo, opciones, total, reparto, alCambiar, nota) {
  const usados = Object.values(reparto).reduce((a, b) => a + b, 0);
  return h('section', { class: 'bloque' },
    h('h3', null, titulo, h('span', { class: 'contador' }, `${usados} de ${total} rangos`)),
    nota ? h('p', { class: 'bloque-ayuda' }, nota) : null,
    h('table', { class: 'tabla-hoja' },
      h('thead', null, h('tr', null, h('th', null, 'Escuela'), h('th', null, 'Carac.'), h('th', null, 'Rangos'))),
      h('tbody', null, opciones.map((id) => {
        const e = ctx.D.escuelas.get(id);
        return h('tr', null,
          h('td', { class: 'nombre-hab' }, e.nombre, h('small', null, e.resumen)),
          h('td', null, e.caracteristica),
          h('td', null, contador({
            valor: reparto[id] || 0, min: 0, max: (reparto[id] || 0) + (total - usados), etiqueta: e.nombre, foco: `rep-${titulo}-${id}`,
            alCambiar: (v) => { const r = { ...reparto }; if (v) r[id] = v; else delete r[id]; alCambiar(r); },
          })));
      }))));
}
