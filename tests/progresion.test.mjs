import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/engine/calculo.js';
import { pjVacio } from '../js/engine/modelo.js';
import { nivelPorPX, pxSiguienteNivel, bonoTSPorNivel } from '../js/engine/reglas.js';
import { generarPJ, crearRng } from '../js/engine/aleatorio.js';
import { subirNivel, bajarNivel, subirNivelesAleatorio } from '../js/engine/progresion.js';
import { cargarDatosNode, fixture } from './util.mjs';

const D = cargarDatosNode();
const prog = D.tablas.progresion;
const MESA = { metodo: 'libre' };
const syndel = { ...pjVacio(), ...fixture('syndel').entrada };

test('Tabla de PX [1.25]', () => {
  assert.deepEqual([10, 19, 20, 49, 50, 69, 70, 130, 150, 999].map((x) => nivelPorPX(prog, x)), [1, 1, 2, 4, 5, 5, 6, 9, 10, 10]);
  assert.equal(pxSiguienteNivel(prog, 1), 20);
  assert.equal(pxSiguienteNivel(prog, 5), 70);
  assert.equal(pxSiguienteNivel(prog, 10), null);
});

test('150 PJ subidos a niveles 2-10 al azar siguen siendo válidos', () => {
  const fallos = [];
  for (let s = 1; s <= 150; s++) {
    const rng = crearRng(s);
    const nivel = 2 + (s % 9);
    const pj = subirNivelesAleatorio(D, rng, generarPJ(D, rng, MESA), MESA, nivel);
    const hoja = calcular(pj, D, MESA);
    const errores = hoja.problemas.filter((p) => p.nivel === 'error');
    if (errores.length) fallos.push(`semilla ${s} nivel ${nivel}: ${errores.map((e) => e.mensaje).join(' | ')}`);
    assert.equal(hoja.nivel, nivel);
    assert.equal(hoja.derivados.tsf.nivel, bonoTSPorNivel(nivel));
    assert.ok(!hoja.problemas.some((p) => /es nueva/.test(p.mensaje)), `semilla ${s}: compra una escuela nueva al subir`);
    for (const n of hoja.pd.niveles) for (const c of Object.keys(n.presupuesto)) assert.ok(n.gastado[c] <= n.presupuesto[c], `semilla ${s} nivel ${n.nivel} ${c}`);
  }
  assert.deepEqual(fallos.slice(0, 6), [], `${fallos.length} fallos`);
});

test('Syndel a nivel 3: PM, TS y urdimbres ejecutables crecen con el nivel', () => {
  const rng = crearRng(3);
  const p = subirNivelesAleatorio(D, rng, syndel, { metodo: 'puntos' }, 3);
  const h = calcular(p, D, { metodo: 'puntos' });
  assert.equal(p.px, 30);
  assert.equal(h.derivados.pm.total, 6 * 3 + 3); // (3 por INT 30 + 3 de mago) × 3 + 3 del linaje
  assert.equal(h.derivados.tsv.total, 5 + 15);
  const cm = h.escuelas.find((e) => e.id === 'control_mental');
  assert.equal(cm.urdimbre_ejecutable, Math.min(cm.rangos.total, 3));
});

test('Nivel por encima de los PX es un error; por debajo, un aviso', () => {
  const dos = subirNivel(syndel);
  assert.ok(calcular(dos, D, { metodo: 'puntos' }).problemas.some((p) => p.nivel === 'error' && /necesitas 20 PX/.test(p.mensaje)));
  const h = calcular({ ...syndel, px: 35 }, D, { metodo: 'puntos' });
  assert.ok(h.problemas.some((p) => p.nivel === 'aviso' && /puedes subir a nivel 3/.test(p.mensaje)));
  assert.equal(h.derivados.px.siguiente, 20);
});

test('Al subir de nivel no se puede empezar una escuela nueva sin aprenderla en juego', () => {
  const p = subirNivel({ ...syndel, px: 20 });
  p.desarrollo[1].compras = { fuego_arcano: 1 };
  assert.ok(calcular(p, D, { metodo: 'puntos' }).problemas.some((x) => /Fuego Arcano es nueva/.test(x.mensaje)));
});

test('Bajar de nivel quita lo comprado en él y nunca baja de 1', () => {
  const p = subirNivelesAleatorio(D, crearRng(9), syndel, { metodo: 'puntos' }, 2);
  const b = bajarNivel(p);
  assert.equal(b.desarrollo.length, 1);
  assert.deepEqual(b.desarrollo[0], syndel.desarrollo[0]);
  assert.equal(bajarNivel(b).desarrollo.length, 1);
});

test('Revelaciones de la Senda Heroica', () => {
  const base = calcular(syndel, D, { metodo: 'puntos' });
  const p = { ...syndel, senda_marcas: 34, revelaciones: [{ tipo: 'caracteristica', car: 'AGI' }, { tipo: 'corpulencia' }, { tipo: 'pm' }] };
  const h = calcular(p, D, { metodo: 'puntos' });
  assert.equal(h.caracteristicas.AGI.total, base.caracteristicas.AGI.total + 5);
  assert.equal(h.derivados.defensa_cc, base.derivados.defensa_cc + 5);
  assert.equal(h.derivados.pg, base.derivados.pg + 10);
  assert.equal(h.derivados.pg_max, base.derivados.pg_max + 10);
  assert.equal(h.derivados.pm.total, base.derivados.pm.total + 3);
  assert.equal(h.derivados.px.hitos, 3);
  const demasiadas = { ...p, senda_marcas: 29 };
  assert.ok(calcular(demasiadas, D, { metodo: 'puntos' }).problemas.some((x) => x.nivel === 'error' && /2 Hito/.test(x.mensaje)));
});
