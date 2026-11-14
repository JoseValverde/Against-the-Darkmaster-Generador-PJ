import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/engine/calculo.js';
import { pjVacio } from '../js/engine/modelo.js';
import { bonoPorRangos, bonoTSPorNivel, pmPorCaracteristica, ajusteVelocidadAGI } from '../js/engine/reglas.js';
import { cargarDatosNode } from './util.mjs';

const D = cargarDatosNode();
const MESA = { metodo: 'libre' };
const pj = (cambios = {}) => ({ ...pjVacio(), metodo: 'puntos', base: { FUE: 10, AGI: 10, RES: 10, INT: 10, SAB: 5, POR: 5 }, linaje: 'humano', cultura: 'urbana', vocacion: 'guerrero', eleccion_linaje: { habilidad: 'filo' }, ...cambios });
const errores = (h) => h.problemas.filter((p) => p.nivel === 'error').map((p) => p.mensaje);
const tieneError = (h, texto) => errores(h).some((m) => m.includes(texto));

test('Tabla de bonificador por rango [1.19]', () => {
  assert.deepEqual([0, 1, 10, 11, 15, 20, 21, 30, 31].map(bonoPorRangos), [0, 5, 50, 52, 60, 70, 71, 80, 81]);
});
test('Bonificador de TS por nivel [2.3]', () => {
  assert.deepEqual([1, 5, 10, 11, 20, 21].map(bonoTSPorNivel), [5, 25, 50, 52, 70, 71]);
});
test('PM por característica y velocidad variable (ejemplos del manual)', () => {
  assert.deepEqual([5, 10, 15, 20, 25, 30, 35, -10].map(pmPorCaracteristica), [0, 1, 1, 2, 2, 3, 3, 0]);
  assert.equal(15 + ajusteVelocidadAGI(10), 18);
  assert.equal(15 + ajusteVelocidadAGI(-5), 13.5);
});

test('PM: elfo argénteo mago INT 25 → 9 PM a nivel 1 y 14 a nivel 2 (pág. 128)', () => {
  const base = { FUE: 0, AGI: 5, RES: 0, INT: 20, SAB: 10, POR: 15 }; // POR es de los 2 más altos
  const p = pj({ linaje: 'elfo_argenteo', cultura: 'feerica', vocacion: 'mago', base, eleccion_linaje: {} });
  assert.equal(calcular(p, D, MESA).caracteristicas.INT.total, 25);
  assert.equal(calcular(p, D, MESA).derivados.pm.total, 9);
  const p2 = { ...p, desarrollo: [p.desarrollo[0], { compras: {}, pago: {}, transferencias: [] }] };
  assert.equal(calcular(p2, D, MESA).derivados.pm.total, 14);
});

test('PM: humano mítico animista SAB 10 → 3 por nivel; elfo estelar versátil POR 30 → 4 por nivel (pág. 128)', () => {
  const a = calcular(pj({ linaje: 'humano_mitico', vocacion: 'animista', base: { FUE: 0, AGI: 0, RES: 0, INT: 0, SAB: 10, POR: 0 } }), D, MESA);
  assert.equal(a.derivados.pm.por_nivel, 3);
  const v = calcular(pj({ linaje: 'elfo_estelar', vocacion: 'versatil', base: { FUE: 0, AGI: 0, RES: 0, INT: 0, SAB: 0, POR: 15 } }), D, MESA);
  assert.equal(v.caracteristicas.POR.total, 30);
  assert.equal(v.derivados.pm.por_nivel, 4);
});

test('NR: noble humano mítico empieza con 3 (pág. 139); el máximo inicial es 4', () => {
  assert.equal(calcular(pj({ linaje: 'humano_mitico', cultura: 'noble' }), D, MESA).derivados.nr, 3);
  const rico = calcular(pj({ linaje: 'humano_mitico', cultura: 'noble', trasfondos: [{ id: 'gran_fortuna', grado: 'menor' }, { id: 'dotado', grado: 'menor', eleccion: { car: 'FUE' } }] }), D, MESA);
  assert.equal(rico.derivados.nr, 4);
});

test('Método por puntos: suma, bloques y límites', () => {
  assert.ok(tieneError(calcular(pj({ base: { FUE: 30, AGI: 10, RES: 10, INT: 0, SAB: 0, POR: 0 } }), D, MESA), 'entre 0 y 25'));
  assert.ok(tieneError(calcular(pj({ base: { FUE: 25, AGI: 25, RES: 10, INT: 0, SAB: 0, POR: 0 } }), D, MESA), 'Has repartido 60'));
  assert.ok(tieneError(calcular(pj({ base: { FUE: 12, AGI: 13, RES: 10, INT: 10, SAB: 5, POR: 0 } }), D, MESA), 'bloques de 5'));
});

test('La mesa impone el método y las opciones', () => {
  assert.ok(tieneError(calcular(pj(), D, { metodo: 'aleatorio' }), 'La mesa usa el método'));
  assert.ok(tieneError(calcular(pj({ metodo: 'mejores_de_doce', base: { FUE: 10, AGI: 10, RES: 10, INT: 10, SAB: 5, POR: 5 } }), D, { metodo: 'aleatorio' }), 'mejores de doce'));
});

test('Restricción de Porte del elfo crepuscular (top 3)', () => {
  const mal = pj({ linaje: 'elfo_crepuscular', eleccion_linaje: {}, base: { FUE: 20, AGI: 15, RES: 10, INT: 5, SAB: 0, POR: 0 } });
  assert.ok(tieneError(calcular(mal, D, MESA), 'Porte debe ser'));
  const bien = pj({ linaje: 'elfo_crepuscular', eleccion_linaje: {}, base: { FUE: 20, AGI: 15, RES: 0, INT: 5, SAB: 0, POR: 10 } });
  assert.ok(!tieneError(calcular(bien, D, MESA), 'Porte debe ser'));
});

test('Supersticioso: un enano no puede ser mago, salvo Excéntrico mayor ignorando el rasgo', () => {
  const p = pj({ linaje: 'enano', cultura: 'subterranea', vocacion: 'mago', eleccion_linaje: {} });
  assert.ok(tieneError(calcular(p, D, MESA), 'Supersticioso'));
  const ex = { ...p, trasfondos: [{ id: 'excentrico', grado: 'mayor', eleccion: { car: 'AGI', rasgo: 'Supersticioso' } }] };
  assert.ok(!tieneError(calcular(ex, D, MESA), 'Supersticioso'));
});

test('Humano: falta la habilidad de Especialización', () => {
  assert.ok(tieneError(calcular(pj({ eleccion_linaje: {} }), D, MESA), 'Especialización'));
});

test('PD: máximo 2 rangos por nivel y no gastar más de lo que hay', () => {
  const p = pj({ desarrollo: [{ compras: { filo: 3, armadura: 2, atletismo: 2, caza: 2, pelea: 2, asta: 2 }, pago: {}, transferencias: [] }] });
  const h = calcular(p, D, MESA);
  assert.ok(tieneError(h, 'máximo 2 rangos'));
  assert.ok(tieneError(h, 'gastas 7 PD de combate'));
});

test('Transferencias 2:1 hacia otra categoría y hacia PM', () => {
  const p = pj({ vocacion: 'mago', desarrollo: [{ compras: { filo: 1 }, pago: {}, transferencias: [{ desde: ['conocimiento', 'sortilegios'], hacia: 'combate' }, { desde: ['conocimiento', 'conocimiento'], hacia: 'pm' }] }] });
  const h = calcular(p, D, MESA);
  assert.equal(h.pd.niveles[0].presupuesto.combate, 1);
  assert.equal(h.pd.niveles[0].gastado.conocimiento, 3);
  assert.equal(h.derivados.pm.transferidos, 1);
  assert.ok(!tieneError(h, 'gastas'));
});

test('Escuelas: acceso por vocación, común o linaje', () => {
  const p = pj({ vocacion: 'mago', desarrollo: [{ compras: { salmos: 1, frio_arcano: 1, alivio_alma: 1 }, pago: {}, transferencias: [] }] });
  const h = calcular(p, D, MESA);
  assert.ok(tieneError(h, 'Alivio del Alma no es una escuela'));
  assert.equal(h.escuelas.find((e) => e.id === 'salmos').acceso, 'comun');
  assert.equal(h.escuelas.find((e) => e.id === 'frio_arcano').acceso, 'vocacional');
});

test('Escuela común: solo se ejecuta hasta la 5ª urdimbre aunque tenga más rangos', () => {
  const p = pj({ vocacion: 'mago', trasfondos: [{ id: 'guardian_conocimientos_ocultos', grado: 'menor', eleccion: { escuela: 'salmos' } }],
    desarrollo: Array.from({ length: 8 }, () => ({ compras: { salmos: 1 }, pago: {}, transferencias: [] })) });
  const s = calcular(p, D, MESA).escuelas.find((e) => e.id === 'salmos');
  assert.equal(s.rangos.total, 10);
  assert.equal(s.urdimbre_ejecutable, 5);
});

test('Escuela de linaje pagada con PD de otra categoría', () => {
  const p = pj({ linaje: 'elfo_estelar', vocacion: 'guerrero', eleccion_linaje: {}, base: { FUE: 10, AGI: 10, RES: 0, INT: 0, SAB: 5, POR: 25 },
    escuelas_linaje: { canciones_sortilegas: 2 },
    desarrollo: [{ compras: { canciones_sortilegas: 1 }, pago: { canciones_sortilegas: 'combate' }, transferencias: [] }] });
  const h = calcular(p, D, MESA);
  assert.equal(h.pd.niveles[0].gastado.combate, 1);
  assert.equal(h.escuelas.find((e) => e.id === 'canciones_sortilegas').rangos.total, 3);
  assert.ok(!tieneError(h, 'no se puede pagar'));
});

test('Trasfondos: PT, duplicados y efectos numéricos', () => {
  const p = pj({ trasfondos: [
    { id: 'endurecido_batalla', grado: 'menor' },
    { id: 'pies_ligeros', grado: 'menor' },
    { id: 'defensor_juramentado', grado: 'menor' },
    { id: 'dotado', grado: 'mayor', eleccion: { car: 'RES', car2: 'RES' } },
  ] });
  const h = calcular(p, D, MESA);
  assert.equal(h.pt.gastado, 6);
  assert.equal(h.caracteristicas.RES.total, 20);
  assert.equal(h.derivados.velocidad, 20);
  assert.equal(h.habilidades.find((x) => x.id === 'armadura').rangos.trasfondo, 1);
  const corp = h.habilidades.find((x) => x.id === 'corpulencia');
  assert.equal(h.derivados.pg, corp.total + 15);
  assert.ok(tieneError(calcular({ ...p, trasfondos: [...p.trasfondos, { id: 'ladron', grado: 'menor' }] }, D, MESA), 'Gastas 7 PT'));
  assert.ok(tieneError(calcular({ ...p, trasfondos: [{ id: 'ladron', grado: 'menor' }, { id: 'ladron', grado: 'menor' }] }, D, MESA), 'una vez'));
});

test('Afinidad Mágica solo con escuelas vocacionales', () => {
  const h = calcular(pj({ vocacion: 'mago', trasfondos: [{ id: 'afinidad_magica', grado: 'menor', eleccion: { escuela: 'salmos' } }] }), D, MESA);
  assert.ok(tieneError(h, 'Afinidad Mágica'));
});

test('Educación Heterodoxa mayor mueve un PD por nivel', () => {
  const p = pj({ trasfondos: [{ id: 'educacion_heterodoxa', grado: 'mayor', eleccion: { habilidad: 'carisma', vocacion: 'mago', categoria: 'conocimiento', categoria_menos: 'combate' } }] });
  const n1 = calcular(p, D, MESA).pd.niveles[0];
  assert.equal(n1.presupuesto.combate, 4);
  assert.equal(n1.presupuesto.conocimiento, 1);
});

test('Defensa con armadura: tope de AGI y bonificadores de escudo', () => {
  const p = pj({ base: { FUE: 0, AGI: 25, RES: 10, INT: 10, SAB: 5, POR: 0 }, equipo: { armadura: 'cota_de_malla', escudo: 'escudo_grande', yelmo: null, piezas: [], armas: [], objetos: [] } });
  const d = calcular(p, D, MESA).derivados;
  assert.equal(d.agi_max_def, 20);
  assert.equal(d.defensa_cc, 20 + 25);
  assert.equal(d.defensa_proyectiles, 20 + 25);
  assert.equal(d.penalizador_bc, -5);
});

test('Tope de PG del linaje', () => {
  const p = pj({ linaje: 'mediano', cultura: 'pastoral', eleccion_linaje: {}, vocacion: 'guerrero', base: { FUE: 0, AGI: 10, RES: 25, INT: 0, SAB: 0, POR: 15 },
    trasfondos: [{ id: 'endurecido_batalla', grado: 'menor' }],
    desarrollo: Array.from({ length: 12 }, () => ({ compras: { corpulencia: 2 }, pago: {}, transferencias: [] })) });
  const h = calcular(p, D, MESA);
  assert.equal(h.derivados.pg_max, 110);
  assert.equal(h.derivados.pg, 110);
});

test('Cultura Saqueadora requiere permiso de la mesa', () => {
  assert.ok(tieneError(calcular(pj({ cultura: 'saqueadora' }), D, MESA), 'pensada para PNJ'));
  assert.ok(!tieneError(calcular(pj({ cultura: 'saqueadora' }), D, { ...MESA, saqueadora: true }), 'pensada para PNJ'));
});

test('Especializadas: solo si la mesa las usa; coste según vocación', () => {
  const p = pj({ desarrollo: [{ compras: { esgrima: 2 }, pago: {}, transferencias: [] }] });
  assert.ok(tieneError(calcular(p, D, MESA), 'especializada'));
  const g = calcular(p, D, { ...MESA, especializadas: true });
  assert.equal(g.pd.niveles[0].gastado.combate, 1); // guerrero: 1 PD = 2 rangos
  const m = calcular({ ...p, vocacion: 'campeon' }, D, { ...MESA, especializadas: true });
  assert.equal(m.pd.niveles[0].gastado.combate, 4); // resto: 2 PD por rango
});
