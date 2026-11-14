import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/engine/calculo.js';
import { generarPJ, crearRng, tirarCaracteristicas, asignarCaracteristicas } from '../js/engine/aleatorio.js';
import { cargarDatosNode } from './util.mjs';

const D = cargarDatosNode();
const MESAS = [
  { metodo: 'puntos' },
  { metodo: 'aleatorio' },
  { metodo: 'aleatorio', mejores_de_doce: true },
  { metodo: 'aleatorio', fortuna_osado: true },
  { metodo: 'libre', velocidad_variable: true, especializadas: true, saqueadora: true },
  { metodo: 'puntos', linajes: ['humano', 'enano', 'mediano'] },
];

test('400 PJ aleatorios sin errores de reglas', () => {
  const fallos = [];
  for (let semilla = 1; semilla <= 400; semilla++) {
    const mesa = MESAS[semilla % MESAS.length];
    const pj = generarPJ(D, crearRng(semilla), mesa);
    const hoja = calcular(pj, D, mesa);
    const errores = hoja.problemas.filter((p) => p.nivel === 'error');
    if (errores.length) fallos.push(`semilla ${semilla} (${pj.linaje}/${pj.cultura}/${pj.vocacion}): ${errores.map((e) => e.mensaje).join(' | ')}`);
  }
  assert.deepEqual(fallos.slice(0, 10), [], `${fallos.length} PJ con errores`);
});

test('Los PJ aleatorios gastan todos sus PD y PT', () => {
  for (let semilla = 1; semilla <= 200; semilla++) {
    const pj = generarPJ(D, crearRng(semilla), { metodo: 'puntos' });
    const hoja = calcular(pj, D, { metodo: 'puntos' });
    const n1 = hoja.pd.niveles[0];
    const sobra = Object.keys(n1.presupuesto).reduce((a, c) => a + n1.presupuesto[c] - n1.gastado[c], 0);
    assert.ok(sobra <= 1, `semilla ${semilla}: sobran ${sobra} PD`);
    assert.equal(hoja.pt.gastado, hoja.pt.total, `semilla ${semilla}: PT sin gastar`);
  }
});

test('Misma semilla, mismo personaje', () => {
  assert.deepEqual(generarPJ(D, crearRng(42)), generarPJ(D, crearRng(42)));
});

test('La mesa restringe linajes y respeta la vocación fijada', () => {
  for (let s = 1; s <= 60; s++) {
    const pj = generarPJ(D, crearRng(s), { linajes: ['enano', 'elfo_estelar'] }, { vocacion: 'guerrero' });
    assert.ok(['enano', 'elfo_estelar'].includes(pj.linaje));
    assert.equal(pj.vocacion, 'guerrero');
  }
});

test('Tiradas: aleatorio da 6 valores de la tabla; mejores de doce tira 12', () => {
  const r = crearRng(7);
  const a = tirarCaracteristicas(D, r, 'aleatorio');
  assert.equal(a.tiradas.length, 6); assert.equal(a.valores.length, 6);
  const b = tirarCaracteristicas(D, r, 'mejores_de_doce');
  assert.equal(b.tiradas.length, 12); assert.equal(b.valores.length, 6);
  const p = tirarCaracteristicas(D, r, 'puntos');
  assert.equal(p.valores.reduce((x, y) => x + y, 0), 50);
});

test('La restricción de Porte del elfo estelar se respeta al asignar', () => {
  const base = asignarCaracteristicas([25, 20, 10, 5, 0, -5], 'guerrero', D.linajes.get('elfo_estelar'));
  assert.equal(base.POR, 25);
});

test('Aleatorio por paso: cada paso deja el PJ válido partiendo de uno válido', async () => {
  const { pasoAleatorio } = await import('../js/engine/aleatorio.js');
  const pasos = ['caracteristicas', 'linaje_cultura', 'vocacion', 'trasfondos_equipo', 'pasiones', 'nombre'];
  const fallos = [];
  for (let s = 1; s <= 120; s++) {
    const mesa = MESAS[s % MESAS.length];
    const rng = crearRng(s);
    let pj = generarPJ(D, rng, mesa);
    for (const paso of pasos) {
      pj = pasoAleatorio(D, rng, pj, mesa, paso);
      const e = calcular(pj, D, mesa).problemas.filter((p) => p.nivel === 'error');
      if (e.length) fallos.push(`semilla ${s}, paso ${paso}: ${e.map((x) => x.mensaje).join(' | ')}`);
    }
  }
  assert.deepEqual(fallos.slice(0, 8), [], `${fallos.length} fallos`);
});
