import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../js/engine/calculo.js';
import { pjVacio } from '../js/engine/modelo.js';
import { equipoSugerido, equipoDesdeAtuendo } from '../js/engine/equipo.js';
import { generarPJ, crearRng } from '../js/engine/aleatorio.js';
import { cargarDatosNode, fixture } from './util.mjs';

const D = cargarDatosNode();
const { entrada } = fixture('syndel');
const syndel = { ...pjVacio(), ...entrada };

test('Syndel: su atuendo le da la daga, y la fila de la hoja coincide con la del manual', () => {
  const equipo = equipoDesdeAtuendo(D, syndel);
  assert.deepEqual(equipo.armas, ['daga']);
  const hoja = calcular({ ...syndel, equipo }, D, { metodo: 'puntos' });
  const [daga] = hoja.armas;
  // Hoja de Syndel: 1M, Mano, FILO, torpeza 1, tabla Filo, 120, Perfor., Apuñalar
  assert.equal(daga.manos, '1M');
  assert.equal(daga.longitud, 'Mano');
  assert.equal(daga.habilidad, 'filo'); // Filo (+5) es mejor que Pelea (0)
  assert.equal(daga.bc, 5);
  assert.equal(daga.torpeza, 1);
  assert.equal(daga.tabla, 'Filo');
  assert.equal(daga.resultado_max, '120');
  assert.equal(daga.critico, 'Perfor.');
  assert.deepEqual(daga.cualidades, ['Apuñalar']);
});

test('Syndel: grimorio con lo que conoce y lo que puede lanzar a nivel 1', () => {
  const hoja = calcular(syndel, D, { metodo: 'puntos' });
  assert.equal(hoja.grimorio.length, 7);
  const cm = hoja.grimorio.find((g) => g.escuela === 'control_mental');
  assert.equal(cm.sortilegios.length, 3);
  assert.deepEqual(cm.sortilegios.map((s) => s.ejecutable), [true, false, false]);
  assert.equal(cm.sortilegios[0].nombre, 'Dormir');
  assert.equal(cm.sortilegios[0].coste_pm, 1);
});

test('Afinidad Mágica mayor: un nivel más para lanzar de la escuela predilecta', () => {
  const p = { ...syndel, trasfondos: syndel.trasfondos.map((t) => (t.id === 'afinidad_magica' ? { ...t, grado: 'mayor', eleccion: { escuela: 'control_mental' } } : t)) };
  const cm = calcular(p, D, { metodo: 'puntos' }).grimorio.find((g) => g.escuela === 'control_mental');
  assert.equal(cm.urdimbre_ejecutable, 2);
});

test('Atuendo con alternativa («o») y protección en su hueco', () => {
  const pj = { ...pjVacio(), cultura: 'desertica', atuendo: ['Armadura lamelar', 'Hacha de batalla o cimitarra y honda', 'Caballo o camello'] };
  const s = equipoSugerido(D, pj);
  assert.deepEqual(s.armas[0], { elige: ['hacha_de_guerra', 'cimitarra'], de: 'Hacha de batalla o cimitarra y honda' });
  const e = equipoDesdeAtuendo(D, pj, { 'Hacha de batalla o cimitarra y honda': 'cimitarra' });
  assert.deepEqual(e.armas, ['cimitarra', 'honda']);
  assert.equal(e.armadura, 'armadura_lamelar');
  const y = equipoDesdeAtuendo(D, { ...pj, atuendo: ['Cota de malla', 'Daga', 'Yelmo de metal y escudo'] });
  assert.equal(y.yelmo, 'yelmo_de_metal');
  assert.equal(y.escudo, 'escudo_grande');
});

test('El penalizador de la armadura al BC se resta en las armas', () => {
  const p = { ...syndel, equipo: { armadura: 'cota_de_malla_larga', escudo: null, yelmo: null, piezas: [], armas: ['daga'], objetos: [] } };
  assert.equal(calcular(p, D, { metodo: 'puntos' }).armas[0].bc, 5 - 10);
});

test('Arma con varias habilidades: elige la de mejor bonificador con su penalizador', () => {
  const p = { ...syndel, equipo: { armadura: null, escudo: null, yelmo: null, piezas: [], armas: ['destral'], objetos: [] } };
  const d = calcular(p, D, { metodo: 'puntos' }).armas[0];
  // Contundentes 0 frente a Filo 5 − 20 = −15
  assert.equal(d.habilidad, 'contundentes');
  assert.equal(d.bc, 0);
});

test('Los PJ aleatorios salen equipados con armas válidas', () => {
  for (let s = 1; s <= 150; s++) {
    const pj = generarPJ(D, crearRng(s), { metodo: 'libre' });
    const hoja = calcular(pj, D, { metodo: 'libre' });
    assert.ok(pj.equipo.armas.length >= 1, `semilla ${s}: sin armas`);
    assert.equal(hoja.armas.length, pj.equipo.armas.length, `semilla ${s}: arma desconocida`);
    assert.ok(!hoja.problemas.some((x) => /desconocida/.test(x.mensaje)), `semilla ${s}`);
  }
});

test('Los sortilegios con distorsión traen sus opciones resumidas', () => {
  const s = D.escuelas.get('alivio_alma').sortilegios[0];
  assert.deepEqual(s.distorsion.map((o) => o.urdimbre), [4, 9]);
  const total = [...D.escuelas.values()].flatMap((e) => e.sortilegios).filter((x) => x.distorsion).length;
  assert.equal(total, 185);
});
