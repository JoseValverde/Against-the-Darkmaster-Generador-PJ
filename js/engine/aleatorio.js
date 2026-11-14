// Generación aleatoria: tiradas, pasos sueltos y personaje completo coherente.
// Todo recibe un `rng` (función que devuelve [0,1)), para poder repetir resultados con una semilla.

import { CARACTERISTICAS, CATEGORIAS, pjVacio, mesaPorDefecto } from './modelo.js';
import { valorCaracteristicaTirada } from './reglas.js';
import { calcular } from './calculo.js';
import { equipoDesdeAtuendo } from './equipo.js';

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function crearRng(semilla = Date.now()) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const d100 = (rng) => 1 + Math.floor(rng() * 100);
const elegir = (rng, lista) => lista[Math.floor(rng() * lista.length)];
const barajar = (rng, lista) => {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** Prioridad de características por vocación (de más a menos importante). */
export const PRIORIDAD = {
  guerrero: ['FUE', 'RES', 'AGI', 'SAB', 'POR', 'INT'],
  picaro: ['AGI', 'INT', 'SAB', 'FUE', 'RES', 'POR'],
  mago: ['INT', 'AGI', 'POR', 'SAB', 'RES', 'FUE'],
  animista: ['SAB', 'RES', 'POR', 'AGI', 'INT', 'FUE'],
  versatil: ['AGI', 'POR', 'INT', 'SAB', 'FUE', 'RES'],
  campeon: ['FUE', 'POR', 'RES', 'AGI', 'SAB', 'INT'],
};

// ---------------------------------------------------------------------------
// Características

/** Tira valores según el método. Devuelve { tiradas, valores } (6 valores, sin asignar). */
export function tirarCaracteristicas(D, rng, metodo = 'aleatorio') {
  const tabla = D.tablas.generacion_caracteristicas;
  if (metodo === 'puntos') return { tiradas: [], valores: repartoPuntos(D, rng) };
  const n = metodo === 'mejores_de_doce' ? 12 : 6;
  const tiradas = Array.from({ length: n }, () => d100(rng));
  const valores = tiradas.map((t) => valorCaracteristicaTirada(tabla, t)).sort((a, b) => b - a).slice(0, 6);
  return { tiradas, valores };
}

function repartoPuntos(D, rng) {
  const cfg = D.caracteristicas.metodos.puntos;
  if (rng() < 0.4) return [...elegir(rng, cfg.conjuntos_predefinidos)].sort((a, b) => b - a);
  // 10 bloques de 5 con pesos decrecientes, máximo 25 por valor
  const vals = [0, 0, 0, 0, 0, 0];
  const pesos = [6, 5, 4, 3, 2, 1];
  let bloques = cfg.total / cfg.paso;
  while (bloques > 0) {
    const libres = vals.map((v, i) => (v < cfg.max ? i : -1)).filter((i) => i >= 0);
    const total = libres.reduce((a, i) => a + pesos[i], 0);
    let r = rng() * total;
    const i = libres.find((k) => (r -= pesos[k]) < 0) ?? libres[0];
    vals[i] += cfg.paso; bloques--;
  }
  return vals.sort((a, b) => b - a);
}

/** Asigna valores (ordenados de mayor a menor) según la vocación y respeta la restricción de Porte del linaje. */
export function asignarCaracteristicas(valores, vocacion, linaje) {
  const orden = [...(PRIORIDAD[vocacion] || CARACTERISTICAS)];
  const vals = [...valores].sort((a, b) => b - a);
  const top = linaje?.restriccion_porte?.top;
  if (top && orden.indexOf('POR') >= top) {
    orden.splice(orden.indexOf('POR'), 1);
    orden.splice(top - 1, 0, 'POR');
  }
  return Object.fromEntries(orden.map((c, i) => [c, vals[i]]));
}

// ---------------------------------------------------------------------------
// Linaje, cultura y vocación

export function linajesPermitidos(D, mesa) {
  return [...D.linajes.values()].filter((l) => !mesa.linajes || mesa.linajes.includes(l.id));
}

export function culturasPermitidas(D, mesa) {
  return [...D.culturas.values()].filter((c) => !c.requiere_permiso || mesa.saqueadora);
}

/** Tabla [1.5]: devuelve { linaje, cultura } o null si cae fuera de lo permitido. */
export function tirarLinajeCultura(D, rng) {
  const t = D.tablaLinajeCultura;
  const r1 = d100(rng), r2 = d100(rng);
  const fila = t.filas.find((f) => r1 >= f.min && r1 <= f.max);
  const cult = fila.culturas.find((c) => r2 >= c.min && r2 <= c.max);
  return { linaje: fila.linaje, cultura: cult.cultura, tiradas: [r1, r2] };
}

export function vocacionesPara(D, linaje) {
  return [...D.vocaciones.values()].filter((v) => !(linaje?.vocaciones_prohibidas || []).includes(v.id));
}

// ---------------------------------------------------------------------------
// Pasiones y nombres (textos propios, solo semillas para inspirar)

const PASIONES = {
  naturaleza: [
    'Nunca dejo a nadie atrás.', 'Primero observo, después actúo.', 'La palabra dada es sagrada.',
    'Me río del peligro, aunque me tiemblen las piernas.', 'Desconfío de quien sonríe demasiado.',
    'Todo tiene arreglo si se piensa con calma.', 'Lo salvaje me llama más que cualquier techo.', 'Mi orgullo me pierde.',
  ],
  lealtad: [
    'A mi familia, que espera mi regreso.', 'Al compañero que me salvó la vida.', 'A la orden que me formó.',
    'Al viejo mentor que me enseñó todo lo que sé.', 'A mi pueblo, aunque me haya dado la espalda.', 'A la memoria de quien perdí.',
  ],
  motivacion: [
    'Encontraré la reliquia que perdió mi linaje.', 'Vengaré la aldea que ardió ante mis ojos.', 'Demostraré que soy digno de mi nombre.',
    'Descubriré qué se esconde tras las Tinieblas.', 'Llevaré a casa algo de lo que sentirme orgulloso.', 'Romperé la maldición que pesa sobre mí.',
  ],
};
const SILABAS = {
  humano: [['Al', 'Bran', 'Ced', 'Dor', 'Ed', 'Gar', 'Hal', 'Ma', 'Ro', 'Wil'], ['ric', 'wen', 'mund', 'a', 'in', 'ard', 'lys', 'eth']],
  elfo: [['Ae', 'Cael', 'El', 'Gal', 'Ith', 'Lu', 'Mi', 'Syl', 'Tha', 'Va'], ['rin', 'driel', 'lindë', 'nor', 'wen', 'thil', 'las', 'ndel']],
  enano: [['Bal', 'Dur', 'Gim', 'Kh', 'Mor', 'Thr', 'Bo', 'Grun'], ['in', 'ar', 'dur', 'ok', 'li', 'grim', 'bur']],
  mediano: [['Bil', 'Dro', 'Fro', 'Mer', 'Pip', 'Sam', 'Tob', 'Ros'], ['bo', 'go', 'ry', 'wise', 'old', 'ie', 'kin']],
  rudo: [['Gor', 'Ug', 'Sha', 'Kru', 'Mog', 'Az', 'Brug', 'Lurz'], ['ash', 'nak', 'gul', 'oth', 'rak', 'bag', 'ug']],
};
const GRUPO_NOMBRE = { humano: 'humano', humano_mitico: 'humano', semielfo: 'elfo', elfo_argenteo: 'elfo', elfo_crepuscular: 'elfo', elfo_estelar: 'elfo', enano: 'enano', mediano: 'mediano', pueblo_salvaje: 'mediano', orco: 'rudo', semiorco: 'rudo', trol_piedra: 'rudo', firbolg: 'enano' };

export function nombreAleatorio(rng, linaje) {
  const [a, b] = SILABAS[GRUPO_NOMBRE[linaje] || 'humano'];
  return elegir(rng, a) + elegir(rng, b);
}

export function pasionAleatoria(rng, tipo) {
  return elegir(rng, PASIONES[tipo]);
}

// ---------------------------------------------------------------------------
// Personaje completo

/**
 * Genera un PJ válido y coherente. `fijo` permite fijar parte del resultado
 * (p. ej. { vocacion: 'mago' }) y la mesa limita las opciones.
 */
export function generarPJ(D, rng, mesaEntrada = {}, fijo = {}) {
  const mesa = { ...mesaPorDefecto(), ...mesaEntrada };
  const pj = pjVacio();

  // Método
  let metodo = mesa.metodo && mesa.metodo !== 'libre' ? mesa.metodo : elegir(rng, ['puntos', 'aleatorio']);
  if (metodo === 'aleatorio' && mesa.mejores_de_doce && !fijo.metodo) metodo = 'mejores_de_doce';
  if (fijo.metodo) metodo = fijo.metodo;
  pj.metodo = metodo;

  // Linaje y cultura
  const linajes = linajesPermitidos(D, mesa).map((l) => l.id);
  const culturas = culturasPermitidas(D, mesa).map((c) => c.id);
  let linaje = fijo.linaje, cultura = fijo.cultura;
  if (!linaje && mesa.fortuna_osado && metodo === 'aleatorio' && !fijo.cultura) {
    for (let i = 0; i < 50 && !linaje; i++) {
      const r = tirarLinajeCultura(D, rng);
      if (linajes.includes(r.linaje) && culturas.includes(r.cultura) && (!fijo.vocacion || vocacionesPara(D, D.linajes.get(r.linaje)).some((v) => v.id === fijo.vocacion))) {
        linaje = r.linaje; cultura = r.cultura; pj.linaje_cultura_aleatorio = true;
      }
    }
  }
  if (!linaje) {
    const candidatos = linajes.filter((l) => !fijo.vocacion || vocacionesPara(D, D.linajes.get(l)).some((v) => v.id === fijo.vocacion));
    linaje = elegir(rng, candidatos);
  }
  const lin = D.linajes.get(linaje);
  if (!cultura) {
    const sugeridas = lin.culturas_sugeridas.filter((c) => culturas.includes(c));
    cultura = elegir(rng, sugeridas.length && rng() < 0.85 ? sugeridas : culturas);
  }
  const cul = D.culturas.get(cultura);
  pj.linaje = linaje; pj.cultura = cultura;

  // Vocación y características
  const voc = D.vocaciones.get(fijo.vocacion || elegir(rng, vocacionesPara(D, lin).map((v) => v.id)));
  pj.vocacion = voc.id;
  const { tiradas, valores } = tirarCaracteristicas(D, rng, metodo);
  pj.tiradas = tiradas;
  pj.base = asignarCaracteristicas(valores, voc.id, lin);

  // Elecciones del linaje
  if (lin.eleccion_habilidad) pj.eleccion_linaje = { habilidad: habilidadFavorita(D, rng, voc, pj) };
  if (lin.escuelas_linaje) pj.escuelas_linaje = repartir(rng, lin.escuelas_linaje.escuelas, lin.escuelas_linaje.rangos);
  if (cul.escuelas) {
    const opciones = [...cul.escuelas.opciones, ...(cul.escuelas.incluye_linaje ? lin.escuelas_linaje?.escuelas || [] : [])];
    const preferidas = opciones.filter((e) => voc.escuelas_vocacionales.includes(e));
    const pool = preferidas.length ? preferidas : opciones;
    pj.escuelas_cultura = cul.escuelas.reparto === 'una' ? { [elegir(rng, pool)]: cul.escuelas.rangos } : repartir(rng, pool, cul.escuelas.rangos, true);
  }
  pj.atuendo = cul.atuendo.map((l) => elegir(rng, l.opciones));

  // Bonificadores de Combate
  const combate = [...D.habilidades.values()].filter((h) => h.categoria === 'combate')
    .map((h) => ({ id: h.id, peso: (pj.base[h.caracteristica] || 0) + rng() * 15 }))
    .sort((a, b) => b.peso - a.peso).map((x) => x.id);
  pj.bonos_combate = combate.slice(0, voc.bonos_combate.length);

  // Trasfondos (antes del desarrollo: algunos cambian PD o escuelas)
  pj.trasfondos = elegirTrasfondos(D, rng, pj, lin, voc, mesa);

  // Desarrollo de nivel 1
  pj.desarrollo = [desarrolloAleatorio(D, rng, pj, voc, lin, mesa)];

  // Pasiones, Condena y nombre
  pj.pasiones = { naturaleza: pasionAleatoria(rng, 'naturaleza'), lealtad: pasionAleatoria(rng, 'lealtad'), motivacion: pasionAleatoria(rng, 'motivacion') };
  if (lin.condena) pj.pasiones.condena = elegir(rng, lin.condena.resultados);
  if (pj.trasfondos.some((t) => t.id === 'marca_destino' && t.grado === 'mayor')) pj.pasiones.destino = 'Mi marca guarda la clave de mi destino.';
  pj.nombre = nombreAleatorio(rng, linaje);
  pj.equipo = equipoAleatorio(D, rng, pj);
  return pj;
}

/** Equipo según el atuendo, eligiendo al azar en las alternativas y añadiendo el arma auxiliar. */
function equipoAleatorio(D, rng, pj) {
  const elecciones = {};
  for (const tx of pj.atuendo || []) {
    for (const a of D.atuendoEquipo[tx]?.armas || []) if (a.elige) elecciones[tx] = elegir(rng, a.elige);
  }
  const equipo = equipoDesdeAtuendo(D, pj, elecciones);
  // Arma auxiliar a elegir (equipo inicial común): una de mano si no lleva ninguna corta
  if (!equipo.armas.some((id) => ['Mano', 'Corta'].includes(D.armas.get(id)?.longitud))) equipo.armas.push(elegir(rng, ['daga', 'porra', 'espada_corta']));
  return equipo;
}

function habilidadFavorita(D, rng, voc, pj) {
  const cand = [...D.habilidades.values()].filter((h) => h.caracteristica)
    .map((h) => ({ id: h.id, peso: (voc.bonos_vocacionales[h.id] || 0) + (pj.base[h.caracteristica] || 0) + rng() * 20 }))
    .sort((a, b) => b.peso - a.peso);
  return cand[0].id;
}

function repartir(rng, opciones, total, variado = false) {
  const r = {};
  const pool = variado ? barajar(rng, opciones) : opciones;
  for (let i = 0; i < total; i++) {
    const e = variado ? pool[i % pool.length] : elegir(rng, opciones);
    r[e] = (r[e] || 0) + 1;
  }
  return r;
}

/** Reparte los PD de nivel 1 por prioridades: bonificador vocacional, rangos culturales y característica. */
function desarrolloAleatorio(D, rng, pj, voc, lin, mesa) {
  const previa = calcular({ ...pj, desarrollo: [{ compras: {}, pago: {}, transferencias: [] }] }, D, mesa);
  const presupuesto = { ...previa.pd.niveles[0].presupuesto };
  const compras = {};
  const transferencias = [];
  const escuelasPosibles = new Set([...voc.escuelas_vocacionales, ...previa.escuelas.filter((e) => e.acceso !== 'sin_acceso').map((e) => e.id)]);
  const filas = new Map([...previa.habilidades, ...previa.escuelas].map((f) => [f.id, f]));
  const candidatos = (cat) => {
    if (cat === 'sortilegios') {
      return [...escuelasPosibles].map((id) => ({ id, peso: (filas.get(id)?.rangos.total || 0) * 4 + (pj.base[D.escuelas.get(id).caracteristica] || 0) / 2 + rng() * 25 }));
    }
    return [...D.habilidades.values()].filter((h) => h.categoria === cat).map((h) => ({
      id: h.id,
      peso: (voc.bonos_vocacionales[h.id] || 0) + (pj.bonos_combate.includes(h.id) ? 20 - pj.bonos_combate.indexOf(h.id) * 3 : 0)
        + (filas.get(h.id)?.rangos.total || 0) * 4 + (h.caracteristica ? (pj.base[h.caracteristica] || 0) / 2 : 5) + rng() * 20,
    }));
  };
  const gastar = (cat, pd) => {
    const orden = candidatos(cat).sort((a, b) => b.peso - a.peso);
    // magia: preferir un rango en varias escuelas; resto: hasta 2 rangos en las mejores
    const porHabilidad = cat === 'sortilegios' && rng() < 0.6 ? 1 : 2;
    for (const pasada of [porHabilidad, 2]) {
      for (const c of orden) {
        while (pd > 0 && (compras[c.id] || 0) < pasada) { compras[c.id] = (compras[c.id] || 0) + 1; pd--; }
        if (pd === 0) return 0;
      }
    }
    return pd;
  };
  const sobrantes = {};
  for (const cat of CATEGORIAS) sobrantes[cat] = gastar(cat, presupuesto[cat]);
  // Los sobrantes van de 2 en 2 a otra categoría con hueco (o a PM si la vocación lanza sortilegios)
  const conSobrante = () => CATEGORIAS.flatMap((c) => Array(sobrantes[c]).fill(c));
  let resto = conSobrante();
  while (resto.length >= 2) {
    const desde = [resto[0], resto[1]];
    desde.forEach((c) => { sobrantes[c]--; });
    if (voc.pm_por_nivel > 0 && rng() < 0.5) transferencias.push({ desde, hacia: 'pm' });
    else {
      const destino = barajar(rng, ['corpulencia', 'combate', 'aventura', 'latrocinio', 'conocimiento']).find((cat) => candidatos(cat).some((c) => (compras[c.id] || 0) < 2));
      if (!destino) { transferencias.push({ desde, hacia: 'pm' }); }
      else { transferencias.push({ desde, hacia: destino }); gastar(destino, 1); }
    }
    resto = conSobrante();
  }
  return { compras, pago: {}, transferencias };
}

/** Gasta los PT en trasfondos con elecciones resueltas automáticamente. */
function elegirTrasfondos(D, rng, pj, lin, voc, mesa) {
  let pt = lin.pt;
  const elegidos = [];
  const lista = barajar(rng, [...D.trasfondos.values()]);
  for (const def of lista) {
    if (pt <= 0) break;
    if (rng() < 0.35) continue; // no todos los PJ apuran opciones caras ni todas las opciones
    const mayor = def.coste.mayor <= pt && rng() < 0.35;
    const grado = mayor ? 'mayor' : 'menor';
    if (def.coste[grado] > pt) continue;
    const eleccion = resolverElecciones(D, rng, def, grado, pj, lin, voc, mesa);
    if (!eleccion) continue;
    elegidos.push({ id: def.id, grado, eleccion });
    pt -= def.coste[grado];
  }
  // Si sobran PT, rellena con grados menores baratos
  for (const def of lista) {
    if (pt <= 0) break;
    if (elegidos.some((t) => t.id === def.id) || def.coste.menor > pt) continue;
    const eleccion = resolverElecciones(D, rng, def, 'menor', pj, lin, voc, mesa);
    if (eleccion) { elegidos.push({ id: def.id, grado: 'menor', eleccion }); pt -= def.coste.menor; }
  }
  return elegidos;
}

function resolverElecciones(D, rng, def, grado, pj, lin, voc, mesa) {
  const grados = grado === 'mayor' && def.id !== 'vortice' ? [def.menor, def.mayor] : [def[grado]];
  const eleccion = {};
  const escuelasLinaje = lin.escuelas_linaje?.escuelas || [];
  const noOscuras = [...D.escuelas.values()].filter((e) => !e.oscura).map((e) => e.id);
  for (const e of grados.flatMap((g) => g.elecciones || [])) {
    let v = null;
    switch (e.tipo) {
      case 'escuela':
        if (e.filtro === 'vocacional') v = voc.escuelas_vocacionales.length ? elegir(rng, voc.escuelas_vocacionales) : null;
        else if (e.filtro === 'accesible') v = elegir(rng, [...voc.escuelas_vocacionales, ...escuelasLinaje, ...D.comunes]);
        else v = elegir(rng, noOscuras);
        break;
      case 'habilidad': {
        if (e.opciones) { v = elegir(rng, e.opciones); break; }
        const estandar = [...D.habilidades.keys()];
        if (e.filtro === 'sin_bono_vocacional') v = elegir(rng, estandar.filter((h) => !voc.bonos_vocacionales[h] && !pj.bonos_combate.includes(h)));
        else if (e.filtro === 'no_escuela_o_especializada') v = elegir(rng, estandar);
        else if (e.filtro?.startsWith('cultura_2_rangos')) {
          const otra = D.culturas.get(eleccion.cultura);
          const ok = Object.entries(otra?.rangos || {}).filter(([h, n]) => n >= 2 && D.tipo(h) && (e.filtro === 'cultura_2_rangos' || D.categoria(h) !== 'combate') && h !== eleccion.habilidad);
          v = ok.length ? elegir(rng, ok)[0] : null;
        } else v = elegir(rng, estandar);
        break;
      }
      case 'caracteristica': {
        let ops = e.opciones || CARACTERISTICAS;
        if (e.filtro === 'mod_linaje_negativo') ops = CARACTERISTICAS.filter((c) => lin.mods[c] < 0);
        v = ops.length ? elegir(rng, ops) : null;
        break;
      }
      case 'cultura': v = elegir(rng, [...D.culturas.keys()].filter((c) => c !== pj.cultura && c !== 'saqueadora')); break;
      case 'atuendo_de': { const c = D.culturas.get(eleccion.cultura); v = c ? elegir(rng, c.atuendo.flatMap((l) => l.opciones)) : null; break; }
      case 'vocacion': v = elegir(rng, [...D.vocaciones.keys()].filter((x) => x !== voc.id)); break;
      case 'categoria': {
        if (e.filtro === 'pd_2_en_vocacion') { const o = D.vocaciones.get(eleccion.vocacion); const ops = CATEGORIAS.filter((c) => o?.pd[c] >= 2); v = ops.length ? elegir(rng, ops) : null; }
        else if (e.filtro === 'max_pd_propia') { const max = Math.max(...Object.values(voc.pd)); v = elegir(rng, CATEGORIAS.filter((c) => voc.pd[c] === max)); }
        break;
      }
      case 'rasgo_linaje': v = lin.rasgos.find((r) => r.nombre === 'Supersticioso')?.nombre || elegir(rng, lin.rasgos).nombre; break;
      case 'opcion': v = elegir(rng, e.opciones); break;
      default: v = ''; // texto libre: lo escribe el jugador (queda como aviso)
    }
    if (v == null) return null;
    eleccion[e.id] = v;
  }
  // Repartos de rangos de escuela (Entrenamiento Élfico)
  for (const ef of grados.flatMap((g) => g.efectos || []).filter((x) => x.tipo === 'escuelas_linaje')) {
    eleccion.reparto = repartir(rng, ef.escuelas, ef.rangos);
  }
  // Especializada elegida sin que la mesa las use: descartar
  if (def.id === 'entrenamiento_excepcional' && D.tipo(eleccion.habilidad) === 'especializada' && !mesa.especializadas) return null;
  // Guardián: la escuela debe tener sentido para el PJ (vocacional, de linaje o común)
  return eleccion;
}

// ---------------------------------------------------------------------------
// Aleatorio por paso del asistente

/** Elecciones que dependen del linaje y la cultura (especialización, escuelas, atuendo). */
export function eleccionesLinajeCultura(D, rng, pj) {
  const lin = D.linajes.get(pj.linaje), cul = D.culturas.get(pj.cultura);
  const voc = pj.vocacion ? D.vocaciones.get(pj.vocacion) : null;
  const r = { eleccion_linaje: {}, escuelas_linaje: {}, escuelas_cultura: {}, atuendo: [] };
  if (lin?.eleccion_habilidad) r.eleccion_linaje = { habilidad: habilidadFavorita(D, rng, voc || { bonos_vocacionales: {} }, pj) };
  if (lin?.escuelas_linaje) r.escuelas_linaje = repartir(rng, lin.escuelas_linaje.escuelas, lin.escuelas_linaje.rangos);
  if (cul?.escuelas) {
    const opciones = [...cul.escuelas.opciones, ...(cul.escuelas.incluye_linaje ? lin?.escuelas_linaje?.escuelas || [] : [])];
    const preferidas = voc ? opciones.filter((e) => voc.escuelas_vocacionales.includes(e)) : [];
    const pool = preferidas.length ? preferidas : opciones;
    r.escuelas_cultura = cul.escuelas.reparto === 'una' ? { [elegir(rng, pool)]: cul.escuelas.rangos } : repartir(rng, pool, cul.escuelas.rangos, true);
  }
  if (cul) r.atuendo = cul.atuendo.map((l) => elegir(rng, l.opciones));
  return r;
}

/** Bonificadores de Combate según las características. */
export function bonosCombateAleatorios(D, rng, pj) {
  const voc = D.vocaciones.get(pj.vocacion);
  if (!voc) return [];
  return [...D.habilidades.values()].filter((h) => h.categoria === 'combate')
    .map((h) => ({ id: h.id, peso: (pj.base[h.caracteristica] || 0) + rng() * 15 }))
    .sort((a, b) => b.peso - a.peso).map((x) => x.id).slice(0, voc.bonos_combate.length);
}

/** Reparto de PD de nivel 1 coherente con lo ya elegido. */
export function desarrolloNivel1Aleatorio(D, rng, pj, mesaEntrada = {}) {
  const mesa = { ...mesaPorDefecto(), ...mesaEntrada };
  return desarrolloAleatorio(D, rng, pj, D.vocaciones.get(pj.vocacion), D.linajes.get(pj.linaje), mesa);
}

/**
 * Rehace al azar un paso del asistente y lo que depende de él, conservando lo demás.
 * Si faltan pasos previos imprescindibles (p. ej. linaje para la vocación), los rellena también.
 * Devuelve un PJ nuevo; no modifica el recibido.
 */
export function pasoAleatorio(D, rng, pjEntrada, mesaEntrada = {}, paso) {
  const mesa = { ...mesaPorDefecto(), ...mesaEntrada };
  const pj = pasoAleatorioSinReparar(D, rng, pjEntrada, mesa, paso);
  return repararDependientes(D, rng, pj, mesa, paso);
}

const ORDEN_PASOS = ['caracteristicas', 'linaje_cultura', 'vocacion', 'trasfondos_equipo', 'derivados', 'pasiones', 'nombre'];

/** Rehace al azar los pasos posteriores que hayan quedado con errores tras cambiar `paso`. */
function repararDependientes(D, rng, pj, mesa, paso) {
  const desde = ORDEN_PASOS.indexOf(paso);
  const errorEn = (p) => calcular(pj, D, mesa).problemas.some((x) => x.nivel === 'error' && x.paso === p);
  if (desde < ORDEN_PASOS.indexOf('trasfondos_equipo') && pj.vocacion && errorEn('trasfondos_equipo')) {
    pj.trasfondos = elegirTrasfondos(D, rng, pj, D.linajes.get(pj.linaje), D.vocaciones.get(pj.vocacion), mesa);
  }
  if (desde < ORDEN_PASOS.indexOf('vocacion') && pj.vocacion && errorEn('vocacion')) {
    pj.bonos_combate = bonosCombateAleatorios(D, rng, pj);
    pj.desarrollo = [desarrolloNivel1Aleatorio(D, rng, pj, mesa), ...(pj.desarrollo || []).slice(1)];
  } else if (paso === 'vocacion' && errorEn('trasfondos_equipo')) {
    pj.trasfondos = elegirTrasfondos(D, rng, pj, D.linajes.get(pj.linaje), D.vocaciones.get(pj.vocacion), mesa);
    pj.desarrollo = [desarrolloNivel1Aleatorio(D, rng, pj, mesa), ...(pj.desarrollo || []).slice(1)];
  }
  return pj;
}

function pasoAleatorioSinReparar(D, rng, pjEntrada, mesa, paso) {
  let pj = JSON.parse(JSON.stringify(pjEntrada));
  const completo = () => generarPJ(D, rng, mesa, { linaje: pj.linaje || undefined, cultura: pj.cultura || undefined, vocacion: pj.vocacion || undefined });

  if (paso === 'caracteristicas') {
    let metodo = pj.metodo;
    if (mesa.metodo && mesa.metodo !== 'libre' && !(mesa.metodo === 'aleatorio' && metodo === 'mejores_de_doce' && mesa.mejores_de_doce)) metodo = mesa.metodo;
    if (metodo === 'mejores_de_doce' && !mesa.mejores_de_doce) metodo = 'aleatorio';
    const { tiradas, valores } = tirarCaracteristicas(D, rng, metodo);
    pj.metodo = metodo; pj.tiradas = tiradas;
    pj.base = asignarCaracteristicas(valores, pj.vocacion, D.linajes.get(pj.linaje));
    delete pj.ui_asignacion;
    return pj;
  }
  if (paso === 'linaje_cultura') {
    const nuevo = generarPJ(D, rng, mesa, { vocacion: pj.vocacion || undefined, metodo: pj.metodo });
    pj.linaje = nuevo.linaje; pj.cultura = nuevo.cultura; pj.linaje_cultura_aleatorio = !!nuevo.linaje_cultura_aleatorio;
    Object.assign(pj, eleccionesLinajeCultura(D, rng, pj));
    const lin = D.linajes.get(pj.linaje);
    if (lin.restriccion_porte) pj.base = asignarCaracteristicas(Object.values(pj.base), pj.vocacion, lin);
    pj.equipo = equipoAleatorio(D, rng, pj);
    return pj;
  }
  if (paso === 'vocacion') {
    if (!pj.linaje || !pj.cultura) { const c = completo(); pj.linaje = c.linaje; pj.cultura = c.cultura; Object.assign(pj, eleccionesLinajeCultura(D, rng, pj)); }
    const lin = D.linajes.get(pj.linaje);
    pj.vocacion = elegir(rng, vocacionesPara(D, lin).map((v) => v.id));
    pj.bonos_combate = bonosCombateAleatorios(D, rng, pj);
    pj.desarrollo = [desarrolloNivel1Aleatorio(D, rng, pj, mesa), ...(pj.desarrollo || []).slice(1)];
    return pj;
  }
  if (paso === 'trasfondos_equipo') {
    if (!pj.linaje || !pj.vocacion) pj = { ...completo(), nombre: pj.nombre, pasiones: pj.pasiones };
    pj.trasfondos = elegirTrasfondos(D, rng, pj, D.linajes.get(pj.linaje), D.vocaciones.get(pj.vocacion), mesa);
    // Los trasfondos pueden cambiar PD o escuelas de linaje: se rehace el reparto de nivel 1
    pj.desarrollo = [desarrolloNivel1Aleatorio(D, rng, pj, mesa), ...(pj.desarrollo || []).slice(1)];
    pj.equipo = equipoAleatorio(D, rng, pj);
    return pj;
  }
  if (paso === 'pasiones') {
    pj.pasiones = { ...pj.pasiones, naturaleza: pasionAleatoria(rng, 'naturaleza'), lealtad: pasionAleatoria(rng, 'lealtad'), motivacion: pasionAleatoria(rng, 'motivacion') };
    const lin = D.linajes.get(pj.linaje);
    if (lin?.condena) pj.pasiones.condena = elegir(rng, lin.condena.resultados);
    return pj;
  }
  if (paso === 'nombre') { pj.nombre = nombreAleatorio(rng, pj.linaje); return pj; }
  return pj;
}
