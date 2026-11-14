// Paso IV · Trasfondos y equipo
import { h } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, botonDado, contador, segmentos, selector, NOMBRE_CAR, NOMBRE_CAT, ref } from '../comun.js';
import { CARACTERISTICAS, CATEGORIAS, equipoSugerido, equipoDesdeAtuendo } from '../../engine/index.js';
import { signo } from '../dom.js';

let filtroTexto = '';
let soloElegidos = false;
const eleccionesAtuendo = {}; // alternativas «o» del atuendo elegidas antes de equiparse

export default function pasoTrasfondos(ctx) {
  const { pj, D, hoja } = ctx;
  const lin = D.linajes.get(pj.linaje);
  const quedan = hoja.pt.total - hoja.pt.gastado;
  const elegidos = new Map((pj.trasfondos || []).map((t) => [t.id, t]));
  const lista = [...D.trasfondos.values()].filter((t) => {
    if (soloElegidos && !elegidos.has(t.id)) return false;
    if (!filtroTexto) return true;
    const q = filtroTexto.toLowerCase();
    return t.nombre.toLowerCase().includes(q) || t.resumen.toLowerCase().includes(q);
  });

  return [
    cabeceraPaso(ctx, 'Trasfondos y equipo', ['Detalles de tu pasado que se notan en juego. Cada opción se compra una vez, en grado menor o mayor (que incluye el menor). ', ref(86, '[1.22]'), '.'], botonDado(ctx)),
    problemasDelPaso(ctx),
    h('section', { class: 'bloque' },
      h('h3', null, 'Trasfondos', h('span', { class: 'contador' }, lin ? `${quedan} de ${hoja.pt.total} PT por gastar` : 'elige linaje para saber tus PT')),
      h('div', { class: 'filtro' },
        h('input', { type: 'text', placeholder: 'Buscar trasfondo…', value: filtroTexto, 'aria-label': 'Buscar trasfondo', 'data-foco': 'filtro-tras',
          oninput: (e) => { filtroTexto = e.target.value; ctx.actualizar(() => {}); } }),
        h('label', { class: 'opcion-check', style: 'white-space:nowrap' }, h('input', { type: 'checkbox', checked: soloElegidos, onchange: (e) => { soloElegidos = e.target.checked; ctx.actualizar(() => {}); } }), h('span', null, 'Solo elegidos'))),
      h('ul', { class: 'trasfondos' }, lista.map((t) => itemTrasfondo(ctx, t, elegidos.get(t.id), quedan))),
      !lista.length ? h('p', { class: 'bloque-ayuda' }, 'Ningún trasfondo coincide con la búsqueda.') : null),
    bloqueEquipo(ctx),
    bloqueArmas(ctx),
    piePaso(ctx),
  ];
}

function itemTrasfondo(ctx, t, elegido, quedan) {
  const coste = elegido ? t.coste[elegido.grado] : 0;
  const puede = (g) => t.coste[g] <= quedan + coste;
  const cambiarGrado = (g) => ctx.actualizar((p) => {
    p.trasfondos = (p.trasfondos || []).filter((x) => x.id !== t.id);
    if (g !== 'no') p.trasfondos.push({ id: t.id, grado: g, eleccion: elegido?.eleccion || {} });
  });
  const grados = elegido && elegido.grado === 'mayor' && t.id !== 'vortice' ? [t.menor, t.mayor] : elegido ? [t[elegido.grado]] : [];
  return h('li', { class: `tras${elegido ? ' activo' : ''}` },
    h('div', { class: 'tras-cabecera' },
      h('span', { class: 'tras-nombre' }, t.nombre, h('small', null, `pág. ${t.pagina}`)),
      segmentos([
        { valor: 'no', etiqueta: 'No' },
        { valor: 'menor', etiqueta: `Menor · ${t.coste.menor} PT`, deshabilitado: !puede('menor') },
        { valor: 'mayor', etiqueta: `Mayor · ${t.coste.mayor} PT`, deshabilitado: !puede('mayor') },
      ], elegido?.grado || 'no', cambiarGrado, `Grado de ${t.nombre}`, `tras-${t.id}`)),
    h('p', { class: 'tras-texto' }, elegido ? grados.map((g) => g.texto).join(' ') : t.resumen),
    elegido ? controlesEleccion(ctx, t, elegido, grados) : null);
}

function controlesEleccion(ctx, t, elegido, grados) {
  const { D, pj, hoja } = ctx;
  const lin = D.linajes.get(pj.linaje), voc = D.vocaciones.get(pj.vocacion);
  const el = elegido.eleccion || {};
  const poner = (k, v) => ctx.actualizar((p) => {
    const x = p.trasfondos.find((y) => y.id === t.id);
    x.eleccion = { ...x.eleccion, [k]: v };
    if (k === 'cultura') { delete x.eleccion.habilidad; delete x.eleccion.habilidad_cambio; delete x.eleccion.atuendo; }
    if (k === 'vocacion') delete x.eleccion.categoria;
  });
  const ponerTexto = (k, v) => ctx.actualizar((p) => { const x = p.trasfondos.find((y) => y.id === t.id); x.eleccion = { ...x.eleccion, [k]: v }; }, { parcial: true });
  const escNombre = (id) => D.escuelas.get(id).nombre;
  const escLinaje = new Set([...(lin?.escuelas_linaje?.escuelas || []), ...hoja.escuelas.filter((e) => e.acceso === 'linaje').map((e) => e.id)]);
  const controles = [];

  for (const e of grados.flatMap((g) => g.elecciones || [])) {
    const etiqueta = e.etiqueta || ({ escuela: 'Escuela', habilidad: 'Habilidad', caracteristica: 'Característica', cultura: 'Cultura', atuendo_de: 'Objeto de su atuendo', vocacion: 'Vocación', categoria: 'Categoría', rasgo_linaje: 'Rasgo que ignoras', opcion: 'Opción' })[e.tipo] || e.id;
    let opciones = null;
    switch (e.tipo) {
      case 'escuela': {
        const ids = e.filtro === 'vocacional' ? voc?.escuelas_vocacionales || []
          : e.filtro === 'accesible' ? [...new Set([...(voc?.escuelas_vocacionales || []), ...escLinaje, ...D.comunes])]
            : [...D.escuelas.values()].filter((x) => !x.oscura).map((x) => x.id);
        opciones = ids.map((id) => ({ valor: id, etiqueta: escNombre(id) }));
        break;
      }
      case 'habilidad': {
        let ids;
        if (e.opciones) ids = e.opciones;
        else if (e.filtro === 'sin_bono_vocacional') ids = hoja.habilidades.filter((f) => !f.voc).map((f) => f.id);
        else if (e.filtro?.startsWith('cultura_2_rangos')) {
          const otra = D.culturas.get(el.cultura);
          ids = Object.entries(otra?.rangos || {}).filter(([id, n]) => n >= 2 && D.tipo(id) && (e.filtro === 'cultura_2_rangos' || D.categoria(id) !== 'combate') && (e.id !== 'habilidad_cambio' || id !== el.habilidad)).map(([id]) => id);
        } else ids = [...D.habilidades.keys(), ...(ctx.mesa.especializadas ? D.especializadas.keys() : [])];
        opciones = ids.map((id) => ({ valor: id, etiqueta: D.nombre(id) }));
        break;
      }
      case 'caracteristica': {
        let cs = e.opciones || CARACTERISTICAS;
        if (e.filtro === 'mod_linaje_negativo') cs = CARACTERISTICAS.filter((c) => lin?.mods[c] < 0);
        opciones = cs.map((c) => ({ valor: c, etiqueta: NOMBRE_CAR[c] }));
        break;
      }
      case 'cultura': opciones = [...D.culturas.values()].filter((c) => c.id !== pj.cultura).map((c) => ({ valor: c.id, etiqueta: c.nombre })); break;
      case 'atuendo_de': opciones = (D.culturas.get(el.cultura)?.atuendo || []).flatMap((l) => l.opciones).map((o) => ({ valor: o, etiqueta: o })); break;
      case 'vocacion': opciones = [...D.vocaciones.values()].filter((v) => v.id !== pj.vocacion).map((v) => ({ valor: v.id, etiqueta: v.nombre })); break;
      case 'categoria': {
        const otra = D.vocaciones.get(el.vocacion);
        const max = voc ? Math.max(...Object.values(voc.pd)) : 0;
        const cats = e.filtro === 'pd_2_en_vocacion' ? CATEGORIAS.filter((c) => otra?.pd[c] >= 2) : CATEGORIAS.filter((c) => voc?.pd[c] === max);
        opciones = cats.map((c) => ({ valor: c, etiqueta: NOMBRE_CAT[c] }));
        break;
      }
      case 'rasgo_linaje': opciones = (lin?.rasgos || []).map((r) => ({ valor: r.nombre, etiqueta: r.nombre })); break;
      case 'opcion': opciones = e.opciones.map((o) => ({ valor: o, etiqueta: o })); break;
      default: break;
    }
    if (opciones) {
      controles.push(selector({ etiqueta, valor: el[e.id], opciones, foco: `el-${t.id}-${e.id}`, alCambiar: (v) => poner(e.id, v) }));
    } else {
      controles.push(h('label', { class: 'campo' }, h('span', null, etiqueta),
        h('input', { type: 'text', value: el[e.id] || '', 'data-foco': `el-${t.id}-${e.id}`, oninput: (ev) => ponerTexto(e.id, ev.target.value) })));
    }
  }
  // Reparto de rangos de escuela (Entrenamiento Élfico)
  for (const ef of grados.flatMap((g) => g.efectos || []).filter((x) => x.tipo === 'escuelas_linaje')) {
    const rep = el.reparto || {};
    const usados = Object.values(rep).reduce((a, b) => a + b, 0);
    controles.push(h('div', { class: 'campo' }, h('span', null, `Reparte ${ef.rangos} rangos (${usados}/${ef.rangos})`),
      ef.escuelas.map((id) => h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, h('span', null, escNombre(id)),
        contador({ valor: rep[id] || 0, max: (rep[id] || 0) + ef.rangos - usados, etiqueta: escNombre(id), foco: `rep-${t.id}-${id}`,
          alCambiar: (v) => poner('reparto', { ...rep, [id]: v }) })))));
  }
  return controles.length ? h('div', { class: 'tras-elecciones' }, controles) : null;
}

function bloqueEquipo(ctx) {
  const { pj, D, hoja } = ctx;
  const armaduras = [...D.armaduras.values()];
  const eq = pj.equipo || {};
  const poner = (k, v) => ctx.actualizar((p) => { p.equipo = { ...(p.equipo || {}), [k]: v }; });
  const op = (cat) => armaduras.filter((a) => a.categoria === cat).map((a) => ({ valor: a.id, etiqueta: `${a.nombre}${a.tipo ? ` (${a.tipo.toLowerCase()})` : ''}` }));
  const d = hoja.derivados;
  return h('section', { class: 'bloque' },
    h('h3', null, 'Equipo inicial'),
    h('p', { class: 'bloque-ayuda' }, 'Empiezas con lo de abajo, sin oro: lo demás se compra con tu nivel de riqueza al llegar a un lugar civilizado. ', ref(99)),
    h('ul', { class: 'rasgos', style: 'margin-bottom:16px' }, hoja.equipo_inicial.map((o) => h('li', null, o))),
    h('h3', { style: 'font-size:var(--t-m)' }, '¿Qué llevas puesto?'),
    h('p', { class: 'bloque-ayuda' }, 'Solo afecta a la Defensa y a los penalizadores. Elige lo que te dé tu atuendo o tu trasfondo. ', ref(147, '[2.23]')),
    h('div', { class: 'fila-campos' },
      selector({ etiqueta: 'Armadura', valor: eq.armadura, opciones: op('armadura'), vacio: 'Ninguna', foco: 'eq-armadura', alCambiar: (v) => poner('armadura', v) }),
      selector({ etiqueta: 'Escudo', valor: eq.escudo, opciones: op('escudo'), vacio: 'Ninguno', foco: 'eq-escudo', alCambiar: (v) => poner('escudo', v) }),
      selector({ etiqueta: 'Yelmo', valor: eq.yelmo, opciones: op('yelmo'), vacio: 'Ninguno', foco: 'eq-yelmo', alCambiar: (v) => poner('yelmo', v) })),
    h('p', { style: 'margin-top:12px;font-size:var(--t-s)' },
      `Defensa c/c ${d.defensa_cc} · proyectiles ${d.defensa_proyectiles}`,
      d.agi_max_def != null ? ` · AGI máx. en DEF +${d.agi_max_def}` : '',
      d.penalizador_movimiento ? ` · movimiento ${d.penalizador_movimiento}` : '',
      d.penalizador_bc ? ` · BC ${d.penalizador_bc}` : '',
      d.penalizador_percepcion ? ` · Percepción ${d.penalizador_percepcion}` : ''));
}

/** «Equiparme con mi atuendo»: elige en las alternativas y lo coloca todo en su sitio. */
function bloqueAtuendo(ctx) {
  const { pj, D } = ctx;
  const s = equipoSugerido(D, pj);
  if (!s.armas.length && !s.proteccion.length) return null;
  const nombreArma = (id) => D.armas.get(id)?.nombre || id;
  const nombreProt = (id) => D.armaduras.get(id)?.nombre || id;
  const piezas = [
    ...s.armas.filter((a) => !a.elige).map(nombreArma),
    ...s.proteccion.map(nombreProt),
  ];
  const alternativas = s.armas.filter((a) => a.elige);
  const equipar = () => ctx.actualizar((p) => {
    const nuevo = equipoDesdeAtuendo(D, p, eleccionesAtuendo);
    // Conserva las armas añadidas a mano que no vienen del atuendo
    const delAtuendo = new Set(nuevo.armas);
    const extra = (p.equipo?.armas || []).filter((id) => !delAtuendo.has(id));
    p.equipo = { ...nuevo, armas: [...nuevo.armas, ...extra] };
  });
  return h('div', { class: 'atuendo-equipo' },
    h('p', null, h('b', null, 'Tu atuendo trae: '), piezas.length ? piezas.join(', ') : 'una elección', '.'),
    alternativas.length ? h('div', { class: 'fila-campos' }, alternativas.map((a) => selector({
      etiqueta: `«${a.de}»: elige`, valor: eleccionesAtuendo[a.de] || a.elige[0], vacio: null, foco: `alt-${a.de}`,
      opciones: a.elige.map((id) => ({ valor: id, etiqueta: nombreArma(id) })),
      alCambiar: (v) => { eleccionesAtuendo[a.de] = v; },
    }))) : null,
    s.notas.length ? h('ul', { class: 'notas-equipo' }, s.notas.map((n) => h('li', null, n))) : null,
    h('button', { type: 'button', class: 'btn btn-tinta', 'data-foco': 'equipar', onclick: equipar }, 'Equiparme con mi atuendo'));
}

/** Tabla «Armas y Ataques», como en la hoja. */
function bloqueArmas(ctx) {
  const { pj, D, hoja } = ctx;
  const armas = pj.equipo?.armas || [];
  let nueva = '';
  const quitar = (i) => ctx.actualizar((p) => { p.equipo = { ...p.equipo, armas: p.equipo.armas.filter((_, k) => k !== i) }; });
  const anadir = () => { if (nueva) ctx.actualizar((p) => { p.equipo = { ...(p.equipo || {}), armas: [...(p.equipo?.armas || []), nueva] }; }); };
  const lista = [...D.armas.values()];
  const grupos = [['Cuerpo a cuerpo', lista.filter((a) => a.tabla !== 'Proyect.' && a.tabla !== 'Desarm.')], ['A distancia', lista.filter((a) => a.tabla === 'Proyect.')], ['Sin armas', lista.filter((a) => a.tabla === 'Desarm.')]];
  return h('section', { class: 'bloque' },
    h('h3', null, 'Armas y Ataques'),
    h('p', { class: 'bloque-ayuda' }, 'El BC usa la mejor habilidad posible para cada arma, ya con el penalizador de tu armadura. Empiezas con un arma auxiliar de tu elección además de las del atuendo. ', ref(152, '[2.24]')),
    bloqueAtuendo(ctx),
    hoja.armas.length ? h('div', { class: 'tabla-scroll', style: 'margin-top:16px' }, h('table', { class: 'tabla-hoja tabla-armas' },
      h('thead', null, h('tr', null,
        h('th', null, 'Arma'), h('th', { class: 'col-opc' }, 'Manos'), h('th', { class: 'col-opc' }, 'Longitud'), h('th', null, 'Habilidad'),
        h('th', null, 'BC'), h('th', { title: 'Margen de torpeza' }, 'Torp.'), h('th', { class: 'col-opc' }, 'Tabla'), h('th', { class: 'col-opc', title: 'Resultado máximo' }, 'Máx.'),
        h('th', { class: 'col-opc' }, 'Crítico'), h('th', { class: 'col-opc', title: 'Alcance base (m)' }, 'Alc.'), h('th', null, h('span', { class: 'sr' }, 'Quitar')))),
      h('tbody', null, hoja.armas.map((a, i) => h('tr', null,
        h('td', { class: 'nombre-hab' }, a.nombre, a.cualidades.length ? h('small', null, a.cualidades.join(', ')) : null),
        h('td', { class: 'col-opc' }, a.manos),
        h('td', { class: 'col-opc' }, a.longitud || '—'),
        h('td', null, a.habilidad_nombre, a.penalizador_habilidad ? h('small', { class: 'tenue' }, ` ${signo(a.penalizador_habilidad)}`) : null),
        h('td', { class: 'total' }, signo(a.bc)),
        h('td', null, a.torpeza),
        h('td', { class: 'col-opc' }, a.tabla),
        h('td', { class: 'col-opc' }, a.resultado_max),
        h('td', { class: 'col-opc' }, a.critico_alt ? `${a.critico} / ${a.critico_alt}` : a.critico),
        h('td', { class: 'col-opc' }, a.alcance_base ?? '—'),
        h('td', null, h('button', { type: 'button', class: 'btn btn-texto btn-pequeno', 'aria-label': `Quitar ${a.nombre}`, onclick: () => quitar(i) }, 'quitar'))))))) : h('p', { class: 'bloque-ayuda', style: 'margin-top:12px' }, 'Aún no llevas armas.'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-top:12px' },
      h('label', { class: 'campo', style: 'flex:1 1 220px;max-width:340px' }, h('span', null, 'Añadir arma'),
        h('select', { 'data-foco': 'nueva-arma', onchange: (e) => { nueva = e.target.value; } },
          h('option', { value: '' }, '— Elige —'),
          grupos.map(([g, l]) => h('optgroup', { label: g }, l.map((a) => h('option', { value: a.id }, a.nombre)))))),
      h('button', { type: 'button', class: 'btn', onclick: anadir }, 'Añadir')));
}
