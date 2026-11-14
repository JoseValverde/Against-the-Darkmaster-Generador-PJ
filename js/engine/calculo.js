// Cálculo completo de la hoja de personaje a partir del modelo de entrada.
// calcular(pj, D, mesa) -> { caracteristicas, habilidades, escuelas, pd, derivados, ..., problemas }
// No toca el DOM ni modifica `pj`.

import { CARACTERISTICAS, CATEGORIAS, mesaPorDefecto } from './modelo.js';
import { bonoPorRangos, bonoTSPorNivel, pmPorCaracteristica, ajusteVelocidadAGI, limitar } from './reglas.js';

const RASGOS_PORTE = ['Justo y Sabio', 'Grácil y Elegante', 'Bendecido por las Estrellas'];
const NOMBRE_CAR = { FUE: 'Fuerza', AGI: 'Agilidad', RES: 'Resistencia', INT: 'Intelecto', SAB: 'Sabiduría', POR: 'Porte' };
const suma = (o) => Object.values(o || {}).reduce((a, b) => a + (Number(b) || 0), 0);

export function calcular(pjEntrada, D, mesaEntrada = {}) {
  const pj = pjEntrada;
  const mesa = { ...mesaPorDefecto(), ...mesaEntrada };
  const problemas = [];
  const problema = (nivel, paso, mensaje, campo) => problemas.push({ nivel, paso, mensaje, ...(campo ? { campo } : {}) });
  const recordatorios = [];
  const nivel = Math.max(1, pj.desarrollo?.length || pj.nivel || 1);

  const lin = pj.linaje ? D.linajes.get(pj.linaje) : null;
  const cul = pj.cultura ? D.culturas.get(pj.cultura) : null;
  const voc = pj.vocacion ? D.vocaciones.get(pj.vocacion) : null;
  if (pj.linaje && !lin) problema('error', 'linaje_cultura', `Linaje desconocido: ${pj.linaje}`);
  if (pj.cultura && !cul) problema('error', 'linaje_cultura', `Cultura desconocida: ${pj.cultura}`);
  if (pj.vocacion && !voc) problema('error', 'vocacion', `Vocación desconocida: ${pj.vocacion}`);

  // ---------- Trasfondos: efectos activos ----------
  const tras = [];
  const vistos = new Set();
  for (const t of pj.trasfondos || []) {
    const def = D.trasfondos.get(t.id);
    if (!def) { problema('error', 'trasfondos_equipo', `Trasfondo desconocido: ${t.id}`); continue; }
    if (vistos.has(t.id)) { problema('error', 'trasfondos_equipo', `${def.nombre} solo se puede elegir una vez.`); continue; }
    vistos.add(t.id);
    const grado = t.grado === 'mayor' ? 'mayor' : 'menor';
    const eleccion = t.eleccion || {};
    const grados = grado === 'mayor' && t.id !== 'vortice' ? [def.menor, def.mayor] : [def[grado]];
    const efectos = grados.flatMap((g) => g.efectos || []);
    const elecciones = grados.flatMap((g) => g.elecciones || []);
    for (const e of elecciones) {
      if (e.tipo === 'texto' || e.tipo === 'opcion' || e.tipo === 'atuendo_de' || e.tipo === 'rasgo_linaje') {
        if (eleccion[e.id] == null || eleccion[e.id] === '') problema('aviso', 'trasfondos_equipo', `${def.nombre}: falta «${e.etiqueta || e.id}».`);
      } else if (eleccion[e.id] == null) {
        problema('error', 'trasfondos_equipo', `${def.nombre}: falta elegir ${e.etiqueta || e.tipo}.`);
      }
    }
    for (const g of grados) for (const r of g.recordatorios || []) recordatorios.push(`${def.nombre}: ${r}`);
    tras.push({ def, grado, eleccion, efectos, coste: def.coste[grado] });
  }
  const resolver = (valor, eleccion) => (typeof valor === 'string' && valor.startsWith('eleccion:') ? eleccion[valor.slice(9)] : valor);
  const efectosDe = (tipo) => tras.flatMap((t) => t.efectos.filter((e) => e.tipo === tipo).map((e) => ({ ...e, t })));

  // Rasgos de linaje ignorados (Excéntrico mayor)
  const ignorados = new Set(efectosDe('ignorar_rasgo').map((e) => resolver(e.objetivo, e.t.eleccion)).filter(Boolean));

  // ---------- Características ----------
  const caracteristicas = {};
  const espCar = Object.fromEntries(CARACTERISTICAS.map((c) => [c, 0]));
  for (const e of efectosDe('caracteristica')) {
    const c = resolver(e.car, e.t.eleccion);
    if (!CARACTERISTICAS.includes(c)) continue;
    if (e.t.def.id === 'excentrico' && lin && !(lin.mods[c] < 0)) {
      problema('error', 'trasfondos_equipo', `Excéntrico: ${NOMBRE_CAR[c]} no tiene modificador negativo de linaje.`);
      continue;
    }
    espCar[c] += e.valor;
  }
  for (const c of CARACTERISTICAS) {
    const base = Number(pj.base?.[c]) || 0;
    const linaje = lin ? lin.mods[c] : 0;
    caracteristicas[c] = { base, linaje, esp: espCar[c], total: base + linaje + espCar[c] };
  }
  const T = Object.fromEntries(CARACTERISTICAS.map((c) => [c, caracteristicas[c].total]));
  validarCaracteristicas(pj, D, mesa, lin, ignorados, problema);

  // ---------- Linaje, cultura, vocación: compatibilidad ----------
  if (lin && mesa.linajes && !mesa.linajes.includes(lin.id)) problema('error', 'linaje_cultura', `El linaje ${lin.nombre} no está permitido en esta mesa.`);
  if (cul?.requiere_permiso && !mesa.saqueadora) problema('error', 'linaje_cultura', `La cultura ${cul.nombre} está pensada para PNJ; el DJ debe permitirla.`);
  if (lin && voc && (lin.vocaciones_prohibidas || []).includes(voc.id) && !ignorados.has('Supersticioso')) {
    problema('error', 'vocacion', `Un ${lin.nombre.toLowerCase()} no puede ser ${voc.nombre.toLowerCase()} (rasgo Supersticioso).`);
  }
  if (!pj.linaje) problema('error', 'linaje_cultura', 'Elige un linaje.');
  if (!pj.cultura) problema('error', 'linaje_cultura', 'Elige una cultura.');
  if (!pj.vocacion) problema('error', 'vocacion', 'Elige una vocación.');

  // ---------- Escuelas accesibles ----------
  const escuelasLinaje = new Set(lin?.escuelas_linaje?.escuelas || []);
  for (const e of efectosDe('escuelas_linaje')) e.escuelas.forEach((x) => escuelasLinaje.add(x));
  for (const e of efectosDe('escuela_linaje')) { const x = resolver(e.objetivo, e.t.eleccion); if (x) escuelasLinaje.add(x); }
  const escuelasVoc = new Set(voc?.escuelas_vocacionales || []);
  const accesoEscuela = (id) => (escuelasVoc.has(id) ? 'vocacional' : escuelasLinaje.has(id) ? 'linaje' : D.comunes.has(id) ? 'comun' : null);

  // ---------- Rangos por origen ----------
  const rangos = new Map(); // id -> { cultura, linaje, desarrollo, trasfondo }
  const add = (id, origen, n) => {
    if (!n) return;
    const r = rangos.get(id) || { cultura: 0, linaje: 0, desarrollo: 0, trasfondo: 0 };
    r[origen] += n;
    rangos.set(id, r);
  };
  // Culturales (con posible intercambio de Ascendencia Mixta mayor)
  const rangosCult = { ...(cul?.rangos || {}) };
  for (const e of efectosDe('rangos_culturales_de')) {
    const h = resolver(e.objetivo, e.t.eleccion);
    const otra = D.culturas.get(resolver(e.cultura, e.t.eleccion));
    if (h && otra) rangosCult[h] = otra.rangos[h] || 0;
  }
  // La fila genérica «escuelas_sortilegas» de la tabla [1.4] se reparte aparte (escuelas_cultura)
  for (const [id, n] of Object.entries(rangosCult)) if (id !== 'escuelas_sortilegas') add(id, 'cultura', n);
  // Ascendencia Mixta: la habilidad elegida debe tener 2+ rangos en la otra cultura (y no ser de Combate en el grado menor)
  for (const t of tras.filter((x) => x.def.id === 'ascendencia_mixta')) {
    const otra = D.culturas.get(t.eleccion.cultura);
    if (!otra) continue;
    if (otra.id === cul?.id) problema('error', 'trasfondos_equipo', 'Ascendencia Mixta: elige una cultura distinta de la tuya.');
    const h = t.eleccion.habilidad;
    if (h && (!(otra.rangos[h] >= 2) || D.categoria(h) === 'combate' || !D.tipo(h))) problema('error', 'trasfondos_equipo', `Ascendencia Mixta: ${D.nombre(h)} no es una habilidad sin combate con 2+ rangos en la cultura ${otra.nombre}.`);
    const h2 = t.eleccion.habilidad_cambio;
    if (t.grado === 'mayor' && h2 && (!(otra.rangos[h2] >= 2) || !D.tipo(h2) || h2 === h)) problema('error', 'trasfondos_equipo', `Ascendencia Mixta: ${D.nombre(h2)} debe ser otra habilidad con 2+ rangos en la cultura ${otra.nombre}.`);
  }

  // Escuelas de la cultura
  if (cul?.escuelas) {
    const reparto = pj.escuelas_cultura || {};
    const total = suma(reparto);
    const validas = new Set([...cul.escuelas.opciones, ...(cul.escuelas.incluye_linaje ? escuelasLinaje : [])]);
    for (const [id, n] of Object.entries(reparto)) {
      if (!validas.has(id)) problema('error', 'linaje_cultura', `${D.nombre(id)} no es una escuela que conceda la cultura ${cul.nombre}.`);
      add(id, 'cultura', n);
    }
    if (total !== cul.escuelas.rangos) problema(total > cul.escuelas.rangos ? 'error' : 'aviso', 'linaje_cultura', `La cultura ${cul.nombre} da ${cul.escuelas.rangos} rango(s) de escuela; has repartido ${total}.`);
    if (cul.escuelas.reparto === 'una' && Object.values(reparto).filter((n) => n > 0).length > 1) problema('error', 'linaje_cultura', `La cultura ${cul.nombre} da su rango a una sola escuela.`);
  } else if (suma(pj.escuelas_cultura)) {
    problema('error', 'linaje_cultura', 'Tu cultura no concede rangos de escuela.');
  }

  // Escuelas del linaje (rasgo Conocimiento de los Eones)
  if (lin?.escuelas_linaje) {
    const reparto = pj.escuelas_linaje || {};
    const total = suma(reparto);
    for (const [id, n] of Object.entries(reparto)) {
      if (!lin.escuelas_linaje.escuelas.includes(id)) problema('error', 'linaje_cultura', `${D.nombre(id)} no es escuela de linaje de ${lin.nombre}.`);
      add(id, 'linaje', n);
    }
    if (total !== lin.escuelas_linaje.rangos) problema(total > lin.escuelas_linaje.rangos ? 'error' : 'aviso', 'linaje_cultura', `${lin.nombre}: reparte ${lin.escuelas_linaje.rangos} rangos entre sus escuelas de linaje (llevas ${total}).`);
  } else if (suma(pj.escuelas_linaje)) {
    problema('error', 'linaje_cultura', 'Tu linaje no concede rangos de escuela.');
  }

  // Trasfondos que dan rangos
  for (const e of efectosDe('rangos')) {
    const id = resolver(e.objetivo, e.t.eleccion);
    if (!id) continue;
    const tipo = D.tipo(id);
    if (!tipo) { problema('error', 'trasfondos_equipo', `${e.t.def.nombre}: «${id}» no es una habilidad.`); continue; }
    if (tipo === 'escuela' && e.t.def.id === 'guardian_conocimientos_ocultos' && !accesoEscuela(id)) {
      problema('error', 'trasfondos_equipo', `${e.t.def.nombre}: ${D.nombre(id)} no es una escuela de tu vocación, linaje ni común.`);
    }
    if (tipo === 'escuela' && e.t.def.id === 'entrenamiento_excepcional') {
      problema('error', 'trasfondos_equipo', 'Entrenamiento Excepcional no puede elegir Escuelas Sortílegas.'); continue;
    }
    if (tipo === 'especializada' && !mesa.especializadas) problema('error', 'trasfondos_equipo', `${D.nombre(id)} es especializada y la mesa no las usa.`);
    add(id, 'trasfondo', tipo === 'especializada' && e.cantidad_especializada ? e.cantidad_especializada : e.cantidad);
  }
  for (const e of efectosDe('escuelas_linaje')) {
    const reparto = e.t.eleccion.reparto || {};
    const total = suma(reparto);
    for (const [id, n] of Object.entries(reparto)) {
      if (!escuelasLinaje.has(id)) problema('error', 'trasfondos_equipo', `${e.t.def.nombre}: ${D.nombre(id)} no es escuela de linaje.`);
      add(id, 'trasfondo', n);
    }
    if (total !== e.rangos) problema(total > e.rangos ? 'error' : 'aviso', 'trasfondos_equipo', `${e.t.def.nombre}: reparte ${e.rangos} rangos entre tus escuelas de linaje (llevas ${total}).`);
  }
  // Afinidad Mágica: la escuela predilecta debe ser vocacional
  for (const t of tras.filter((x) => x.def.id === 'afinidad_magica')) {
    if (t.eleccion.escuela && !escuelasVoc.has(t.eleccion.escuela)) problema('error', 'trasfondos_equipo', 'Afinidad Mágica: la escuela predilecta debe ser de tu vocación.');
  }

  // ---------- Desarrollo (PD) por nivel ----------
  const pd = { niveles: [], pm_extra: 0 };
  const ajustesPD = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
  for (const e of efectosDe('pd')) {
    const c = resolver(e.objetivo, e.t.eleccion);
    if (CATEGORIAS.includes(c)) ajustesPD[c] += e.valor;
  }
  validarHeterodoxa(tras, voc, D, problema);
  const conocidasAntes = new Set([...rangos.keys()].filter((id) => D.tipo(id) === 'escuela'));
  (pj.desarrollo || []).forEach((niv, i) => {
    const n = i + 1;
    const presupuesto = Object.fromEntries(CATEGORIAS.map((c) => [c, (voc?.pd[c] || 0) + ajustesPD[c]]));
    const gastado = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
    let pmExtra = 0;
    for (const tr of niv.transferencias || []) {
      const desde = tr.desde || [];
      if (desde.length !== 2 || desde.some((c) => !CATEGORIAS.includes(c))) { problema('error', 'vocacion', `Nivel ${n}: una transferencia necesita 2 PD de categorías válidas.`); continue; }
      desde.forEach((c) => { gastado[c] += 1; });
      if (tr.hacia === 'pm') pmExtra += 1;
      else if (CATEGORIAS.includes(tr.hacia)) presupuesto[tr.hacia] += 1;
      else problema('error', 'vocacion', `Nivel ${n}: destino de transferencia no válido (${tr.hacia}).`);
    }
    for (const [id, cant] of Object.entries(niv.compras || {})) {
      const r = Number(cant) || 0;
      if (r <= 0) continue;
      const tipo = D.tipo(id);
      if (!tipo) { problema('error', 'vocacion', `Nivel ${n}: «${id}» no es una habilidad.`); continue; }
      if (r > 2) problema('error', 'vocacion', `Nivel ${n}: máximo 2 rangos por nivel en ${D.nombre(id)} (tienes ${r}).`);
      let cat = D.categoria(id);
      const pago = niv.pago?.[id];
      if (pago) {
        if (tipo === 'escuela' && escuelasLinaje.has(id) && CATEGORIAS.includes(pago)) cat = pago;
        else if (tipo !== 'escuela' && D.categoriasPosibles(id).includes(pago)) cat = pago;
        else problema('error', 'vocacion', `Nivel ${n}: ${D.nombre(id)} no se puede pagar con PD de ${pago}.`);
      }
      if (tipo === 'escuela') {
        const acceso = accesoEscuela(id);
        if (!acceso) problema('error', 'vocacion', `${D.nombre(id)} no es una escuela de tu vocación, linaje ni común.`);
        if (n > 1 && !conocidasAntes.has(id)) problema('aviso', 'vocacion', `Nivel ${n}: ${D.nombre(id)} es nueva; solo se puede empezar si la aprendes en juego.`);
      }
      let coste = r;
      if (tipo === 'especializada') {
        if (!mesa.especializadas) problema('error', 'vocacion', `${D.nombre(id)} es especializada y la mesa no las usa.`);
        coste = D.especializadasCoste.rangos_por_pd[voc?.id] ? Math.ceil(r / 2) : r * 2;
      }
      gastado[cat] += coste;
      add(id, 'desarrollo', r);
    }
    for (const c of CATEGORIAS) {
      if (gastado[c] > presupuesto[c]) problema('error', 'vocacion', `Nivel ${n}: gastas ${gastado[c]} PD de ${c} y solo tienes ${presupuesto[c]}.`);
      else if (gastado[c] < presupuesto[c]) problema('aviso', 'vocacion', `Nivel ${n}: te quedan ${presupuesto[c] - gastado[c]} PD de ${c} sin gastar (se pierden).`);
    }
    pd.pm_extra += pmExtra;
    pd.niveles.push({ nivel: n, presupuesto, gastado, pm_extra: pmExtra });
    for (const id of rangos.keys()) if (D.tipo(id) === 'escuela') conocidasAntes.add(id);
  });

  // ---------- Bonificadores por columna ----------
  const voca = (id) => {
    if (!voc) return 0;
    if (D.tipo(id) === 'escuela') return voc.bonos_vocacionales.escuelas_sortilegas || 0;
    let v = voc.bonos_vocacionales[id] || 0;
    const slot = (pj.bonos_combate || []).indexOf(id);
    if (slot >= 0 && slot < voc.bonos_combate.length) v += voc.bonos_combate[slot];
    return v;
  };
  validarBonosCombate(pj, voc, D, problema);
  const bonosLinaje = new Map();
  for (const b of lin?.bonos_habilidad || []) bonosLinaje.set(b.habilidad, (bonosLinaje.get(b.habilidad) || 0) + b.valor);
  if (lin?.eleccion_habilidad) {
    const h = pj.eleccion_linaje?.habilidad;
    if (!h) problema('error', 'linaje_cultura', `${lin.nombre}: elige la habilidad de tu rasgo Especialización (+${lin.eleccion_habilidad.valor}).`);
    else if (!D.tipo(h)) problema('error', 'linaje_cultura', `Especialización: «${h}» no es una habilidad.`);
    else bonosLinaje.set(h, (bonosLinaje.get(h) || 0) + lin.eleccion_habilidad.valor);
  }
  if (lin) bonosLinaje.set('corpulencia', (bonosLinaje.get('corpulencia') || 0) + lin.pg);
  const bonoCol = (columna) => {
    const m = new Map();
    for (const e of efectosDe('bono').filter((x) => x.columna === columna)) {
      const id = resolver(e.objetivo, e.t.eleccion);
      if (!id) continue;
      if (columna === 'obj') m.set(id, Math.max(m.get(id) || 0, e.valor)); // los de objeto no se acumulan
      else m.set(id, (m.get(id) || 0) + e.valor);
    }
    return m;
  };
  const esp = bonoCol('esp');
  const obj = bonoCol('obj');
  // Educación Heterodoxa menor: la habilidad no puede tener bonificador vocacional
  for (const t of tras.filter((x) => x.def.id === 'educacion_heterodoxa')) {
    const h = t.eleccion.habilidad;
    if (h && voca(h) > 0) problema('error', 'trasfondos_equipo', `Educación Heterodoxa: ${D.nombre(h)} ya tiene bonificador vocacional.`);
  }

  // ---------- Filas de habilidades y escuelas ----------
  const fila = (id, def, carId, extra = {}) => {
    const r = rangos.get(id) || { cultura: 0, linaje: 0, desarrollo: 0, trasfondo: 0 };
    const total_rangos = r.cultura + r.linaje + r.desarrollo + r.trasfondo;
    const carValor = carId ? T[carId] : 0;
    const bono_rangos = bonoPorRangos(total_rangos);
    const v = voca(id), l = bonosLinaje.get(id) || 0, s = esp.get(id) || 0, o = obj.get(id) || 0;
    return { id, nombre: def.nombre, categoria: D.categoria(id), caracteristica: carId, car: carValor,
      rangos: { ...r, total: total_rangos }, bono_rangos, voc: v, lin: l, esp: s, obj: o,
      total: carValor + bono_rangos + v + l + s + o, pagina: def.pagina, ...extra };
  };
  const habilidades = [...D.habilidades.values()].map((h) => fila(h.id, h, h.caracteristica));
  const especializadas = [...D.especializadas.values()].filter((h) => rangos.has(h.id)).map((h) => fila(h.id, h, h.caracteristica, { especializada: true }));
  const escuelas = [...D.escuelas.values()].filter((e) => rangos.has(e.id)).map((e) => {
    const acceso = accesoEscuela(e.id);
    const f = fila(e.id, e, e.caracteristica, { acceso: acceso || 'sin_acceso' });
    const tope = acceso === 'comun' ? 5 : 10;
    f.urdimbre_conocida = Math.min(f.rangos.total, 10);
    f.urdimbre_ejecutable = Math.min(f.rangos.total, nivel, tope);
    return f;
  });
  // Condicionales de linaje que la hoja pone entre paréntesis
  const condicionales = [];
  if (lin?.id === 'elfo_crepuscular') condicionales.push({ habilidad: 'sigilo', valor: 20, cuando: 'en entornos naturales' });

  // ---------- Derivados ----------
  const corp = habilidades.find((h) => h.id === 'corpulencia');
  const pgExtra = efectosDe('pg').reduce((a, e) => a + e.valor, 0);
  const pgMax = (lin?.pg_max || 0) + efectosDe('pg_max').reduce((a, e) => a + e.valor, 0);
  const pgSinTope = corp.total + pgExtra;
  const pg = lin ? Math.min(pgSinTope, pgMax) : pgSinTope;
  if (lin && pgSinTope > pgMax) problema('aviso', 'derivados', `Tus PG (${pgSinTope}) superan el máximo del linaje; se quedan en ${pgMax}.`);

  const carPM = voc ? D.caracteristicaPM[voc.id] : null;
  const pmPorNivelTras = efectosDe('pm_por_nivel').filter((e) => !e.restringido).reduce((a, e) => a + e.valor, 0);
  const pmEscuela = efectosDe('pm_por_nivel').filter((e) => e.restringido).map((e) => ({ escuela: resolver(e.restringido, e.t.eleccion), por_nivel: e.valor, total: e.valor * nivel }));
  const pmPorNivel = (carPM ? pmPorCaracteristica(T[carPM]) : 0) + (voc?.pm_por_nivel || 0) + pmPorNivelTras;
  const pm = {
    caracteristica: carPM, por_caracteristica: carPM ? pmPorCaracteristica(T[carPM]) : 0,
    por_vocacion: voc?.pm_por_nivel || 0, por_trasfondos: pmPorNivelTras, por_nivel: pmPorNivel,
    linaje: lin?.pm || 0, transferidos: pd.pm_extra, restringidos: pmEscuela,
    total: pmPorNivel * nivel + (lin?.pm || 0) + pd.pm_extra,
  };

  const ts = (car, extraLin) => ({ car: T[car], nivel: bonoTSPorNivel(nivel), lin: extraLin || 0, esp: 0, total: T[car] + bonoTSPorNivel(nivel) + (extraLin || 0) });
  const tsf = ts('RES', lin?.tsf);
  const tsv = ts('SAB', lin?.tsv);

  const defensa = calcularDefensa(pj, D, T, habilidades.find((h) => h.id === 'armadura').total, problema);

  let velocidad = 15 + efectosDe('velocidad').reduce((a, e) => a + e.valor, 0);
  if (mesa.velocidad_variable) velocidad += ajusteVelocidadAGI(T.AGI);

  const nrBruto = (lin?.nr || 0) + (cul?.nr || 0) + efectosDe('nr').reduce((a, e) => a + e.valor, 0);
  const nr = limitar(nrBruto, 0, 4);
  const nivelSocial = D.nivelesRiqueza.find((x) => x.nr === nr)?.nombre;

  let determinacion = 1;
  const fortuna = mesa.fortuna_osado && pj.metodo === 'aleatorio' && pj.linaje_cultura_aleatorio === true;
  if (fortuna) determinacion += 1;

  // ---------- Puntos de trasfondo ----------
  const ptTotal = lin?.pt || 0;
  const ptGastado = tras.reduce((a, t) => a + t.coste, 0);
  if (ptGastado > ptTotal) problema('error', 'trasfondos_equipo', `Gastas ${ptGastado} PT y tu linaje da ${ptTotal}.`);
  else if (lin && ptGastado < ptTotal) problema('aviso', 'trasfondos_equipo', `Te quedan ${ptTotal - ptGastado} PT sin gastar (se pierden al terminar).`);

  // ---------- Atuendo y equipo inicial ----------
  const equipoInicial = [...D.tablas.equipo_inicial_comun.objetos];
  if (cul) {
    cul.atuendo.forEach((linea, i) => {
      const elegido = pj.atuendo?.[i];
      if (!elegido) problema('aviso', 'linaje_cultura', `Atuendo: elige una opción de la línea ${i + 1} (${linea.opciones.join(' / ')}).`);
      else if (!linea.opciones.includes(elegido)) problema('error', 'linaje_cultura', `Atuendo: «${elegido}» no es una opción de la línea ${i + 1}.`);
      else equipoInicial.push(elegido);
    });
  }
  for (const e of efectosDe('equipo')) equipoInicial.push(e.objeto);
  for (const t of tras.filter((x) => x.def.id === 'ascendencia_mixta' && x.eleccion.atuendo)) equipoInicial.push(t.eleccion.atuendo);

  // ---------- Rasgos, pasiones y avisos finales ----------
  const rasgos = [
    ...(lin?.rasgos || []).filter((r) => !ignorados.has(r.nombre)).map((r) => ({ origen: 'linaje', nombre: r.nombre, resumen: r.resumen })),
    ...tras.map((t) => ({ origen: 'trasfondo', nombre: `${t.def.nombre} (${t.grado})`, resumen: t.grado === 'mayor' ? `${t.def.menor.texto} ${t.def.mayor.texto}` : t.def.menor.texto })),
  ];
  const pasiones = { ...pj.pasiones };
  const pasionesExtra = [];
  if (lin?.condena) pasionesExtra.push('condena');
  if (efectosDe('pasion_extra').length) pasionesExtra.push('destino');
  for (const p of ['naturaleza', 'lealtad', 'motivacion']) if (!pasiones[p]?.trim()) problema('aviso', 'pasiones', `Pasión sin escribir: ${p}.`);
  for (const p of pasionesExtra) if (!pasiones[p]?.trim()) problema('aviso', 'pasiones', `Tu personaje tiene una Pasión extra «${p === 'condena' ? 'Condena' : 'Destino'}» sin escribir.`);
  if (!pj.nombre?.trim()) problema('aviso', 'nombre', 'Tu personaje aún no tiene nombre.');
  for (const c of condicionales) recordatorios.push(`${D.nombre(c.habilidad)} +${c.valor} ${c.cuando}.`);
  if (tras.some((t) => t.def.id === 'entrenamiento_elfico' && t.grado === 'mayor')) recordatorios.push('Entrenamiento Élfico: puedes usar AGI en vez de FUE para Filo con espada corta, larga o cimitarra.');

  return {
    nivel,
    caracteristicas,
    habilidades,
    especializadas,
    escuelas,
    condicionales,
    pd,
    derivados: {
      tsf, tsv,
      defensa_cc: defensa.cc, defensa_proyectiles: defensa.proy, agi_max_def: defensa.agiMax,
      penalizador_movimiento: defensa.penMov, penalizador_bc: defensa.penBC, penalizador_percepcion: defensa.penPer,
      pg, pg_max: pgMax, pm, nr, nivel_social: nivelSocial,
      velocidad, tamano: lin?.tamano || 'Mediano', determinacion,
    },
    pt: { total: ptTotal, gastado: ptGastado },
    rasgos,
    pasiones_extra: pasionesExtra,
    equipo_inicial: equipoInicial,
    recordatorios,
    problemas,
    valido: !problemas.some((p) => p.nivel === 'error'),
  };
}

function validarCaracteristicas(pj, D, mesa, lin, ignorados, problema) {
  const vals = CARACTERISTICAS.map((c) => Number(pj.base?.[c]) || 0);
  const metodo = pj.metodo;
  if (mesa.metodo && mesa.metodo !== 'libre') {
    const permitido = metodo === mesa.metodo || (mesa.metodo === 'aleatorio' && metodo === 'mejores_de_doce' && mesa.mejores_de_doce);
    if (!permitido) problema('error', 'caracteristicas', `La mesa usa el método «${mesa.metodo}».`);
  }
  if (metodo === 'mejores_de_doce' && !mesa.mejores_de_doce) problema('error', 'caracteristicas', 'La mesa no usa la opción «Las mejores de doce».');
  if (metodo === 'puntos') {
    const cfg = D.caracteristicas.metodos.puntos;
    const total = vals.reduce((a, b) => a + b, 0);
    if (vals.some((v) => v % cfg.paso !== 0)) problema('error', 'caracteristicas', `Reparte los puntos en bloques de ${cfg.paso}.`);
    if (vals.some((v) => v < cfg.min || v > cfg.max)) problema('error', 'caracteristicas', `Cada característica debe estar entre ${cfg.min} y ${cfg.max}.`);
    if (total !== cfg.total) problema(total > cfg.total ? 'error' : 'aviso', 'caracteristicas', `Has repartido ${total} de ${cfg.total} puntos.`);
  } else if (metodo === 'aleatorio' || metodo === 'mejores_de_doce') {
    const posibles = new Set(D.tablas.generacion_caracteristicas.filas.map((f) => f.valor));
    if (vals.some((v) => !posibles.has(v))) problema('error', 'caracteristicas', 'Algún valor no sale en la tabla de generación aleatoria [1.1].');
  } else {
    problema('error', 'caracteristicas', 'Elige un método de generación de características.');
  }
  // Restricción de Porte (antes de aplicar el linaje)
  const rasgo = lin?.rasgos?.find((r) => RASGOS_PORTE.includes(r.nombre));
  if (lin?.restriccion_porte && !(rasgo && ignorados.has(rasgo.nombre))) {
    const n = lin.restriccion_porte.top;
    const ordenados = [...vals].sort((a, b) => b - a);
    const umbral = ordenados[n - 1];
    const por = Number(pj.base?.POR) || 0;
    if (por < umbral) problema('error', 'caracteristicas', `${lin.nombre}: Porte debe ser ${n === 1 ? 'tu valor más alto' : `uno de tus ${n} valores más altos`} antes del linaje.`);
  }
}

function validarBonosCombate(pj, voc, D, problema) {
  const elegidas = (pj.bonos_combate || []).filter(Boolean); // huecos vacíos permitidos mientras se elige
  if (!voc) return;
  const huecos = voc.bonos_combate.length;
  if (elegidas.length > huecos) problema('error', 'vocacion', `${voc.nombre} tiene ${huecos} bonificador(es) de Combate y has elegido ${elegidas.length}.`);
  if (new Set(elegidas).size !== elegidas.length) problema('error', 'vocacion', 'Cada bonificador de Combate va a una habilidad distinta.');
  for (const id of elegidas) if (!D.categoriasPosibles(id).includes('combate')) problema('error', 'vocacion', `${D.nombre(id)} no es una habilidad de Combate.`);
  if (elegidas.length < huecos) problema('aviso', 'vocacion', `Asigna tus ${huecos} bonificadores vocacionales de Combate (llevas ${elegidas.length}).`);
}

function validarHeterodoxa(tras, voc, D, problema) {
  const t = tras.find((x) => x.def.id === 'educacion_heterodoxa' && x.grado === 'mayor');
  if (!t || !voc) return;
  const otra = D.vocaciones.get(t.eleccion.vocacion);
  const { categoria, categoria_menos: menos } = t.eleccion;
  if (!otra || otra.id === voc.id) problema('error', 'trasfondos_equipo', 'Educación Heterodoxa: elige otra vocación distinta de la tuya.');
  else if (!(otra.pd[categoria] >= 2)) problema('error', 'trasfondos_equipo', `Educación Heterodoxa: ${otra.nombre} no tiene 2+ PD en ${categoria}.`);
  const max = Math.max(...Object.values(voc.pd));
  if (menos && voc.pd[menos] !== max) problema('error', 'trasfondos_equipo', 'Educación Heterodoxa: el PD que pierdes sale de tu categoría con más PD.');
}

function calcularDefensa(pj, D, T, bonoArmadura, problema) {
  const piezas = [pj.equipo?.armadura, pj.equipo?.escudo, pj.equipo?.yelmo, ...(pj.equipo?.piezas || [])].filter(Boolean);
  let agiMax = Infinity, cc = 0, proy = 0, penMov = 0, penBC = 0, penPer = 0;
  for (const id of piezas) {
    const a = D.armaduras.get(id);
    if (!a) { problema('aviso', 'trasfondos_equipo', `Pieza de equipo desconocida: ${id}.`); continue; }
    if (a.agi_max_def != null) agiMax = Math.min(agiMax, a.agi_max_def);
    cc += a.def_cc || 0; proy += a.def_proy || 0;
    penMov += a.pen_movimiento || 0; penBC += a.pen_bc || 0; penPer += a.pen_percepcion || 0;
  }
  const agi = Math.min(Math.max(T.AGI, 0), agiMax);
  return {
    cc: agi + cc, proy: agi + proy, agiMax: agiMax === Infinity ? null : agiMax,
    penMov: Math.min(0, penMov + Math.max(0, bonoArmadura)), penBC, penPer,
  };
}
