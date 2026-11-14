// Paso VII · Nombre y repaso final
import { h } from '../dom.js';
import { cabeceraPaso, piePaso, NOMBRES_PASO, ref } from '../comun.js';
import { nombreAleatorio } from '../../engine/index.js';

export default function pasoNombre(ctx) {
  const { pj, hoja } = ctx;
  const errores = hoja.problemas.filter((p) => p.nivel === 'error');
  const avisos = hoja.problemas.filter((p) => p.nivel === 'aviso');
  const porPaso = (lista) => ctx.PASOS.map((p) => [p, lista.filter((x) => x.paso === p)]).filter(([, l]) => l.length);

  return [
    cabeceraPaso(ctx, 'Nombre y repaso', ['Elige un nombre que encaje con el tono de la partida. ', ref(99), '.']),
    h('section', { class: 'bloque' },
      h('div', { style: 'display:flex;gap:8px;align-items:end;flex-wrap:wrap' },
        h('label', { class: 'campo', style: 'flex:1 1 280px' }, h('span', null, 'Nombre del personaje'),
          h('input', { type: 'text', value: pj.nombre || '', 'data-foco': 'nombre', autocomplete: 'off',
            oninput: (e) => ctx.actualizar((p) => { p.nombre = e.target.value; }, { parcial: true }) })),
        h('button', { type: 'button', class: 'btn dado', onclick: () => ctx.actualizar((p) => { p.nombre = nombreAleatorio(ctx.rng, p.linaje); }) }, 'Sugerir'))),
    h('section', { class: 'bloque' },
      h('h3', null, errores.length ? 'Antes de jugar' : 'Listo para la aventura'),
      errores.length
        ? h('p', { class: 'bloque-ayuda' }, 'Hay cosas que no cumplen las reglas. Toca un paso para ir a corregirlas:')
        : h('p', { class: 'bloque-ayuda' }, avisos.length ? 'Cumple las reglas. Quedan detalles opcionales:' : 'Tu personaje cumple todas las reglas. La hoja imprimible llegará en una próxima versión.'),
      h('div', { style: 'display:grid;gap:12px' }, porPaso([...errores, ...avisos]).map(([p, l]) => h('div', null,
        h('button', { type: 'button', class: 'btn btn-texto', style: 'padding:0', onclick: () => ctx.irA(p) }, NOMBRES_PASO[p]),
        h('ul', { class: 'problemas', style: 'margin-top:4px' }, l.map((x) => h('li', { class: x.nivel }, h('span', null, x.mensaje)))))))),
    piePaso(ctx),
  ];
}
