// Equipo: lo que sugiere el atuendo, filas de armas para la hoja y sortilegios conocidos.

/** Armas y protecciones que da el atuendo elegido. Las alternativas ('o') vienen como { elige: [...] }. */
export function equipoSugerido(D, pj) {
  const textos = [...(pj.atuendo || [])];
  for (const t of pj.trasfondos || []) if (t.id === 'ascendencia_mixta' && t.eleccion?.atuendo) textos.push(t.eleccion.atuendo);
  const armas = [], proteccion = [], notas = [];
  for (const tx of textos) {
    const m = D.atuendoEquipo[tx];
    if (!m) continue;
    for (const a of m.armas || []) armas.push(a.elige ? { elige: [...a.elige], de: tx } : a);
    proteccion.push(...(m.proteccion || []));
    if (m.nota) notas.push(`${tx}: ${m.nota}`);
  }
  return { armas, proteccion, notas };
}

/**
 * Equipo listo para usar a partir del atuendo: armas (primera opción de cada alternativa, salvo
 * que `elecciones[de]` diga otra) y protección colocada en su hueco (armadura, escudo, yelmo).
 */
export function equipoDesdeAtuendo(D, pj, elecciones = {}) {
  const s = equipoSugerido(D, pj);
  const equipo = { armadura: null, escudo: null, yelmo: null, piezas: [], armas: [], objetos: [...(pj.equipo?.objetos || [])] };
  for (const a of s.armas) equipo.armas.push(a.elige ? (a.elige.includes(elecciones[a.de]) ? elecciones[a.de] : a.elige[0]) : a);
  for (const id of s.proteccion) {
    const p = D.armaduras.get(id);
    if (!p) continue;
    const hueco = p.categoria === 'armadura' ? 'armadura' : p.categoria === 'escudo' ? 'escudo' : p.categoria === 'yelmo' ? 'yelmo' : null;
    if (hueco && !equipo[hueco]) equipo[hueco] = id;
    else if (!equipo.piezas.includes(id)) equipo.piezas.push(id);
  }
  return equipo;
}

/** Filas de «Armas y Ataques» como en la hoja; la habilidad usada es la de mejor bonificador. */
export function filasArmas(D, pj, habilidades, penalizadorBC = 0, avisar = () => {}) {
  const porId = new Map(habilidades.map((h) => [h.id, h]));
  return (pj.equipo?.armas || []).map((id) => {
    const a = D.armas.get(id);
    if (!a) { avisar(`Arma desconocida: ${id}.`); return null; }
    const opciones = a.habilidades.map((x) => ({ habilidad: x.habilidad, penalizador: x.penalizador, valor: (porId.get(x.habilidad)?.total || 0) + x.penalizador }));
    const mejor = opciones.reduce((m, o) => (o.valor > m.valor ? o : m), opciones[0]);
    return {
      id: a.id, nombre: a.nombre, manos: a.manos, longitud: a.longitud,
      habilidad: mejor.habilidad, habilidad_nombre: D.nombre(mejor.habilidad), penalizador_habilidad: mejor.penalizador,
      bc: mejor.valor + penalizadorBC,
      torpeza: a.torpeza, tabla: a.tabla, resultado_max: a.resultado_max,
      critico: a.critico, critico_alt: a.critico_alt, alcance_base: a.alcance_base,
      cualidades: a.cualidades, pagina: a.pagina,
    };
  }).filter(Boolean);
}

/** Sortilegios que conoce el PJ por escuela, marcando los que puede lanzar ya. */
export function sortilegiosConocidos(D, escuelas) {
  return escuelas.filter((e) => e.urdimbre_conocida > 0).map((e) => ({
    escuela: e.id, nombre: e.nombre, caracteristica: e.caracteristica, total: e.total, acceso: e.acceso,
    urdimbre_ejecutable: e.urdimbre_ejecutable,
    sortilegios: D.escuelas.get(e.id).sortilegios.slice(0, e.urdimbre_conocida)
      .map((s) => ({ ...s, coste_pm: s.urdimbre, ejecutable: s.urdimbre <= e.urdimbre_ejecutable })),
  }));
}
