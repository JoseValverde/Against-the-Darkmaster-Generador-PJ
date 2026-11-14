import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/engine/calculo.js';
import { pjVacio } from '../js/engine/modelo.js';
import { cargarDatosNode, fixture } from './util.mjs';

const D = cargarDatosNode();
const { entrada, esperado } = fixture('syndel');
const pj = { ...pjVacio(), ...entrada };
const hoja = calcular(pj, D, { metodo: 'puntos' });

test('Syndel: sin errores de reglas', () => {
  const errores = hoja.problemas.filter((p) => p.nivel === 'error');
  assert.deepEqual(errores, []);
});

test('Syndel: características', () => {
  for (const [c, v] of Object.entries(esperado.caracteristicas)) assert.equal(hoja.caracteristicas[c].total, v, c);
});

test('Syndel: derivados', () => {
  const d = hoja.derivados;
  assert.equal(d.tsf.total, esperado.tsf);
  assert.equal(d.tsv.total, esperado.tsv);
  assert.equal(d.defensa_cc, esperado.defensa_cc);
  assert.equal(d.defensa_proyectiles, esperado.defensa_proyectiles);
  assert.equal(d.pg, esperado.pg);
  assert.equal(d.pm.total, esperado.pm);
  assert.equal(d.nr, esperado.nr);
  assert.equal(d.velocidad, esperado.velocidad);
  assert.equal(d.tamano, esperado.tamano);
  assert.equal(d.determinacion, esperado.determinacion);
});

test('Syndel: habilidades (rangos, columnas y total)', () => {
  for (const [id, e] of Object.entries(esperado.habilidades)) {
    const h = hoja.habilidades.find((x) => x.id === id);
    assert.ok(h, id);
    assert.equal(h.rangos.total, e.rangos, `${id} rangos`);
    assert.equal(h.total, e.total, `${id} total`);
    if (e.voc != null) assert.equal(h.voc, e.voc, `${id} voc`);
    if (e.lin != null) assert.equal(h.lin, e.lin, `${id} lin`);
  }
});

test('Syndel: escuelas sortílegas', () => {
  assert.deepEqual(hoja.escuelas.map((e) => e.id).sort(), Object.keys(esperado.escuelas).sort());
  for (const [id, e] of Object.entries(esperado.escuelas)) {
    const s = hoja.escuelas.find((x) => x.id === id);
    assert.equal(s.caracteristica, e.caracteristica, `${id} car`);
    assert.equal(s.rangos.total, e.rangos, `${id} rangos`);
    assert.equal(s.total, e.total, `${id} total`);
    if (e.esp != null) assert.equal(s.esp, e.esp, `${id} esp`);
  }
});

test('Syndel: PD gastados exactamente', () => {
  const n1 = hoja.pd.niveles[0];
  for (const c of Object.keys(n1.presupuesto)) assert.equal(n1.gastado[c], n1.presupuesto[c], c);
  assert.equal(hoja.pt.gastado, hoja.pt.total);
});
