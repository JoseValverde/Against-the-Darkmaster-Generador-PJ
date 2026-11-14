// Configuración de mesa: la fija el DJ y se comparte por enlace.
import { h, vaciar } from './dom.js';
import { segmentos } from './comun.js';
import { urlDeMesa } from './estado.js';

export function pintarMesa(el, ctx) {
  const m = ctx.mesa;
  const cambiar = (k, v) => { ctx.cambiarMesa({ ...ctx.mesa, [k]: v }); pintarMesa(el, ctx); };
  const opcion = (k, titulo, detalle) => h('label', { class: 'opcion-check' },
    h('input', { type: 'checkbox', checked: m[k], onchange: (e) => cambiar(k, e.target.checked) }),
    h('span', null, titulo, h('small', null, detalle)));
  const todos = [...ctx.D.linajes.values()];
  const permitidos = new Set(m.linajes || todos.map((l) => l.id));
  const alternarLinaje = (id, si) => {
    const s = new Set(permitidos);
    si ? s.add(id) : s.delete(id);
    if (!s.size) return;
    cambiar('linajes', s.size === todos.length ? null : todos.map((l) => l.id).filter((x) => s.has(x)));
  };
  const enlace = urlDeMesa(m);

  vaciar(el).append(
    h('h2', { id: 'mesa-titulo' }, 'Configuración de mesa'),
    h('p', { class: 'mesa-intro' }, 'El DJ elige cómo se crean los personajes en su mesa y comparte el enlace: quien lo abra tendrá el generador configurado igual. Se aplica al instante.'),
    h('div', { class: 'mesa-rejilla' },
      h('fieldset', null, h('legend', null, 'Características'),
        segmentos([
          { valor: 'puntos', etiqueta: '50 puntos' },
          { valor: 'aleatorio', etiqueta: 'Tiradas' },
          { valor: 'libre', etiqueta: 'A elegir' },
        ], m.metodo, (v) => cambiar('metodo', v), 'Método de características'),
        opcion('mejores_de_doce', 'Las mejores de doce', 'Tirar 12 veces y quedarse con 6 (pág. 17).')),
      h('fieldset', null, h('legend', null, 'Reglas opcionales'),
        opcion('fortuna_osado', 'La fortuna favorece al osado', 'Linaje y cultura por tabla [1.5]; +1 Determinación con tiradas (pág. 46).'),
        opcion('velocidad_variable', 'Velocidad variable', '±1,5 m por cada 5 de AGI (pág. 98).'),
        opcion('especializadas', 'Habilidades especializadas', 'Asesinato, Esgrima, Intimidación… (pág. 81).'),
        opcion('saqueadora', 'Permitir la cultura Saqueadora', 'Pensada para PNJ (pág. 58).')),
      h('fieldset', null, h('legend', null, `Linajes permitidos (${permitidos.size} de ${todos.length})`),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px 12px' },
          todos.map((l) => h('label', { class: 'opcion-check' },
            h('input', { type: 'checkbox', checked: permitidos.has(l.id), onchange: (e) => alternarLinaje(l.id, e.target.checked) }),
            h('span', null, l.nombre)))))),
    h('div', { class: 'enlace-mesa' },
      h('input', { type: 'text', readonly: true, value: enlace, 'aria-label': 'Enlace de la mesa', onfocus: (e) => e.target.select() }),
      h('button', { type: 'button', class: 'btn btn-tinta', onclick: async (e) => {
        try { await navigator.clipboard.writeText(enlace); e.target.textContent = 'Copiado'; } catch { e.target.previousSibling.select(); e.target.textContent = 'Cópialo a mano'; }
      } }, 'Copiar enlace')),
  );
}
