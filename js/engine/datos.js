// Carga e indexado de los JSON de data/. El motor solo trabaja con el objeto indexado.

export const ARCHIVOS = ['caracteristicas', 'habilidades', 'tablas', 'linajes', 'culturas', 'vocaciones', 'trasfondos', 'escuelas', 'equipo'];

/** Carga los JSON en el navegador. `base` es la URL de la carpeta data/. */
export async function cargarDatos(base = './data/') {
  const raw = {};
  await Promise.all(ARCHIVOS.map(async (n) => {
    const r = await fetch(`${base}${n}.json`);
    if (!r.ok) throw new Error(`No se pudo cargar ${n}.json (${r.status})`);
    raw[n] = await r.json();
  }));
  return indexarDatos(raw);
}

const porId = (lista) => new Map(lista.map((x) => [x.id, x]));

/** Construye índices y utilidades a partir de los JSON en bruto. */
export function indexarDatos(raw) {
  const habilidades = porId(raw.habilidades.habilidades.filter((h) => h.id !== 'escuelas_sortilegas'));
  const especializadas = porId(raw.habilidades.especializadas.lista);
  const escuelas = porId(raw.escuelas.escuelas);
  const D = {
    raw,
    caracteristicas: raw.caracteristicas,
    tablas: raw.tablas,
    habilidades,
    especializadas,
    escuelas,
    comunes: new Set(raw.escuelas.comunes),
    linajes: porId(raw.linajes.linajes),
    culturas: porId(raw.culturas.culturas),
    vocaciones: porId(raw.vocaciones.vocaciones),
    trasfondos: porId(raw.trasfondos.trasfondos),
    armaduras: porId(raw.equipo.armaduras.lista),
    armas: porId(raw.equipo.armas.lista),
    especializadasCoste: raw.habilidades.especializadas.coste,
    caracteristicaPM: raw.vocaciones.caracteristica_pm,
    nivelesRiqueza: raw.equipo.riqueza.niveles,
    tablaLinajeCultura: raw.culturas.linaje_cultura_aleatorios,
  };
  /** Tipo de un id: 'habilidad' | 'especializada' | 'escuela' | null */
  D.tipo = (id) => (habilidades.has(id) ? 'habilidad' : especializadas.has(id) ? 'especializada' : escuelas.has(id) ? 'escuela' : null);
  /** Categoría de PD a la que pertenece un id (las escuelas son 'sortilegios'). Intimidación: la primera de su lista. */
  D.categoria = (id) => {
    const t = D.tipo(id);
    if (t === 'escuela') return 'sortilegios';
    const c = (t === 'habilidad' ? habilidades : especializadas).get(id)?.categoria;
    return Array.isArray(c) ? c[0] : c ?? null;
  };
  D.categoriasPosibles = (id) => {
    if (D.tipo(id) === 'escuela') return ['sortilegios'];
    const c = (habilidades.get(id) || especializadas.get(id))?.categoria;
    return Array.isArray(c) ? c : c ? [c] : [];
  };
  D.nombre = (id) => (habilidades.get(id) || especializadas.get(id) || escuelas.get(id))?.nombre ?? id;
  return D;
}
