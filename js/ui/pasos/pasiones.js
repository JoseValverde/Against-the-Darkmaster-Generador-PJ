// Paso VI · Pasiones
import { h } from '../dom.js';
import { cabeceraPaso, problemasDelPaso, piePaso, botonDado, ref } from '../comun.js';
import { pasionAleatoria } from '../../engine/index.js';

const TIPOS = [
  { id: 'naturaleza', nombre: 'Naturaleza', ayuda: 'Cómo te comportas casi siempre: instinto, conducta, convicciones.' },
  { id: 'lealtad', nombre: 'Lealtad', ayuda: 'A qué o a quién eres leal, amas… o has jurado destruir.' },
  { id: 'motivacion', nombre: 'Motivación', ayuda: 'Lo que te empuja hacia delante: una meta cercana o lejana.' },
];

export default function pasoPasiones(ctx) {
  const { pj, D, hoja } = ctx;
  const cul = D.culturas.get(pj.cultura);
  const lin = D.linajes.get(pj.linaje);
  const escribir = (k, v) => ctx.actualizar((p) => { p.pasiones = { ...p.pasiones, [k]: v }; }, { parcial: true });
  const sugerir = (k) => ctx.actualizar((p) => { p.pasiones = { ...p.pasiones, [k]: pasionAleatoria(ctx.rng, k) }; });
  const campo = (id, nombre, ayuda, dado) => h('div', { class: 'campo' },
    h('label', { for: `pasion-${id}`, class: 'etiqueta', style: 'display:flex;justify-content:space-between;align-items:baseline;gap:8px' },
      h('span', null, h('b', { style: 'font-family:var(--f-titulo);font-weight:400;font-size:var(--t-l);color:var(--tinta)' }, nombre), ' ', h('span', null, ayuda)),
      dado ? h('button', { type: 'button', class: 'btn btn-pequeno dado', 'aria-label': `Sugerir ${nombre}`, onclick: dado }, 'Sugerir') : null),
    h('textarea', { id: `pasion-${id}`, 'data-foco': `pasion-${id}`, rows: 2, oninput: (e) => escribir(id, e.target.value) }, pj.pasiones?.[id] || ''));

  return [
    cabeceraPaso(ctx, 'Pasiones', ['Frases que dicen algo importante de tu héroe. Mejor escribirlas con la mesa: atan a los personajes entre sí y a la historia. Hasta tres. ', ref(100), '.'], botonDado(ctx, 'Sugerir las tres')),
    problemasDelPaso(ctx),
    cul ? h('p', { class: 'bloque-ayuda' }, h('b', null, `Ideas de la cultura ${cul.nombre.toLowerCase()}: `), cul.pasiones) : null,
    h('section', { class: 'bloque', style: 'display:grid;gap:24px' },
      TIPOS.map((t) => campo(t.id, t.nombre, t.ayuda, () => sugerir(t.id))),
      hoja.pasiones_extra.includes('condena') ? h('div', { class: 'campo' },
        campo('condena', 'Condena', 'La maldición de los firbolg; no cambia hasta derrotar al Señor de las Tinieblas.', () => ctx.actualizar((p) => {
          p.pasiones = { ...p.pasiones, condena: lin.condena.resultados[Math.floor(ctx.rng() * lin.condena.resultados.length)] };
        })),
        h('p', { class: 'ref' }, 'Tabla de Condena firbolg [1.3], pág. 42 (aquí con palabras propias).')) : null,
      hoja.pasiones_extra.includes('destino') ? campo('destino', 'Destino', 'Ligado a tu Marca del Destino; escríbelo con el DJ.') : null),
    piePaso(ctx),
  ];
}
