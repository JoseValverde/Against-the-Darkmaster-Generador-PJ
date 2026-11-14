// Arranque de la interfaz: carga datos, mantiene el estado y repinta.
import { cargarDatos, calcular, PASOS, pjVacio, generarPJ, pasoAleatorio, crearRng } from '../engine/index.js';
import { h, vaciar } from './dom.js';
import { NOMBRES_PASO, problemasDelPaso } from './comun.js';
import * as estado from './estado.js';
import { pintarResumen } from './resumen.js';
import { pintarMesa } from './mesa.js';
import { pintarBiblioteca } from './biblioteca.js';
import { pintarHoja, ajustarZoom } from './hoja.js';
import pasoCaracteristicas from './pasos/caracteristicas.js';
import pasoLinaje from './pasos/linaje.js';
import pasoVocacion from './pasos/vocacion.js';
import pasoTrasfondos from './pasos/trasfondos.js';
import pasoDerivados from './pasos/derivados.js';
import pasoPasiones from './pasos/pasiones.js';
import pasoNombre from './pasos/nombre.js';

const RENDER = {
  caracteristicas: pasoCaracteristicas,
  linaje_cultura: pasoLinaje,
  vocacion: pasoVocacion,
  trasfondos_equipo: pasoTrasfondos,
  derivados: pasoDerivados,
  pasiones: pasoPasiones,
  nombre: pasoNombre,
};

const $ = (id) => document.getElementById(id);
const rng = crearRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);

const ctx = {
  D: null,
  pj: estado.cargarBorrador(),
  mesa: null,
  hoja: null,
  paso: PASOS.includes(estado.pasoGuardado()) ? estado.pasoGuardado() : PASOS[0],
  PASOS,
  rng,
  /** Cambia el PJ. `parcial` repinta solo resumen, pasos y problemas (para campos de texto). */
  actualizar(fn, { parcial = false } = {}) {
    const copia = structuredClone(ctx.pj);
    fn(copia);
    ctx.pj = copia;
    estado.guardarBorrador(copia);
    pintar({ parcial });
  },
  reemplazar(pj, mensaje) {
    const anterior = ctx.pj;
    ctx.pj = pj;
    estado.guardarBorrador(pj);
    pintar();
    if (mensaje) avisar(mensaje, () => { ctx.pj = anterior; estado.guardarBorrador(anterior); pintar(); });
  },
  irA(paso) {
    ctx.paso = paso;
    estado.guardarPaso(paso);
    pintar();
    const main = $('paso');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  },
  azarPaso(paso) {
    ctx.reemplazar(pasoAleatorio(ctx.D, rng, ctx.pj, ctx.mesa, paso), `${NOMBRES_PASO[paso]}: rehecho al azar.`);
  },
  avisar(texto, deshacer) { avisar(texto, deshacer); },
  cambiarMesa(mesa) {
    ctx.mesa = mesa;
    estado.guardarMesa(mesa);
    pintar();
  },
};

function pintar({ parcial = false } = {}) {
  ctx.hoja = calcular(ctx.pj, ctx.D, ctx.mesa);
  pintarPasos();
  pintarResumen($('resumen'), ctx);
  if (parcial) {
    const viejo = $('problemas-paso');
    const nuevo = problemasDelPaso(ctx) || h('div');
    nuevo.id = 'problemas-paso';
    if (viejo) viejo.replaceWith(nuevo);
    return;
  }
  // Conservar foco y scroll al repintar el paso
  const activo = document.activeElement;
  const foco = activo?.dataset?.foco;
  const seleccion = activo && 'selectionStart' in activo ? [activo.selectionStart, activo.selectionEnd] : null;
  const y = window.scrollY;
  const main = vaciar($('paso'));
  main.setAttribute('aria-labelledby', 'titulo-paso');
  try {
    main.append(...[].concat(RENDER[ctx.paso](ctx)).filter(Boolean));
  } catch (e) {
    console.error(e);
    main.append(h('div', { class: 'problemas' }, h('p', { class: 'error', style: 'padding:12px' },
      'Algo ha fallado al mostrar este paso. Tu personaje está a salvo: prueba otro paso o «Deshacer». Detalle: ', e.message)));
  }
  if (foco) {
    const el = document.querySelector(`[data-foco="${CSS.escape(foco)}"]`);
    el?.focus({ preventScroll: true });
    if (el && seleccion && seleccion[0] != null) try { el.setSelectionRange(...seleccion); } catch { /* no es campo de texto */ }
  }
  window.scrollTo({ top: y });
}

function pintarPasos() {
  const ol = vaciar($('lista-pasos'));
  for (const p of PASOS) {
    const errores = ctx.hoja.problemas.filter((x) => x.paso === p && x.nivel === 'error').length;
    const avisos = ctx.hoja.problemas.filter((x) => x.paso === p && x.nivel === 'aviso').length;
    const marca = errores ? h('span', { class: 'marca marca-error', title: `${errores} por corregir` }, errores)
      : avisos ? h('span', { class: 'marca marca-aviso', title: `${avisos} aviso(s)` }, avisos)
        : h('span', { class: 'marca marca-ok', 'aria-hidden': 'true' }, '✓');
    ol.append(h('li', null, h('button', {
      type: 'button', 'aria-current': p === ctx.paso ? 'step' : null, onclick: () => ctx.irA(p),
      'aria-label': `${NOMBRES_PASO[p]}${errores ? `, ${errores} por corregir` : avisos ? `, ${avisos} avisos` : ', completo'}`,
    }, h('span', { class: 'paso-nombre' }, NOMBRES_PASO[p]), marca)));
  }
  // En pantallas estrechas la lista se desplaza en horizontal: centrar el paso activo
  const activo = ol.querySelector('[aria-current="step"]');
  if (activo && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = activo.offsetLeft - (ol.clientWidth - activo.offsetWidth) / 2;
}

// Aviso efímero con «Deshacer»
let temporizador;
function avisar(texto, deshacer) {
  let t = $('tostada');
  if (!t) { t = h('div', { id: 'tostada', class: 'tostada', role: 'status' }); document.body.append(t); }
  vaciar(t).append(h('span', null, texto));
  if (deshacer) t.append(h('button', { type: 'button', class: 'btn btn-pequeno', onclick: () => { deshacer(); t.hidden = true; } }, 'Deshacer'));
  t.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { t.hidden = true; }, 7000);
}

function enlazarCabecera() {
  $('btn-aleatorio').addEventListener('click', () => {
    ctx.reemplazar(generarPJ(ctx.D, rng, ctx.mesa), 'Nuevo personaje al azar.');
    ctx.irA('nombre');
  });
  $('btn-nuevo').addEventListener('click', () => {
    ctx.reemplazar(pjVacio(), 'Hoja en blanco.');
    ctx.irA(PASOS[0]);
  });
  // Paneles desplegables bajo la cabecera (solo uno abierto a la vez)
  const paneles = [['btn-mesa', 'mesa', pintarMesa], ['btn-biblioteca', 'biblioteca', pintarBiblioteca]];
  for (const [boton, panel, pintarPanel] of paneles) {
    $(boton).addEventListener('click', () => {
      const abierto = $(boton).getAttribute('aria-expanded') === 'true';
      for (const [b, p] of paneles) { $(b).setAttribute('aria-expanded', 'false'); $(p).hidden = true; }
      if (!abierto) { $(boton).setAttribute('aria-expanded', 'true'); $(panel).hidden = false; pintarPanel($(panel), ctx); }
    });
  }
  const verHoja = (si) => {
    document.body.classList.toggle('modo-hoja', si);
    $('vista-hoja').hidden = !si;
    if (si) { ctx.hoja = calcular(ctx.pj, ctx.D, ctx.mesa); pintarHoja($('vista-hoja'), ctx, { alVolver: () => verHoja(false), alImprimir: () => window.print() }); window.scrollTo(0, 0); }
  };
  $('btn-hoja').addEventListener('click', () => verHoja(true));
  window.addEventListener('resize', () => { if (!$('vista-hoja').hidden) ajustarZoom($('vista-hoja')); });
  $('btn-tema').addEventListener('click', () => {
    const t = estado.alternarTema();
    $('btn-tema').setAttribute('aria-label', t === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  });
  $('btn-tema').setAttribute('aria-label', estado.temaEfectivo() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
}

async function iniciar() {
  try {
    ctx.D = await cargarDatos('./data/');
  } catch (e) {
    const c = $('aviso-carga');
    c.classList.add('error');
    c.textContent = location.protocol === 'file:'
      ? 'Abre el generador desde un servidor web (por ejemplo, GitHub Pages): el navegador no deja leer los datos desde un archivo local.'
      : `No se pudieron cargar las reglas: ${e.message}`;
    return;
  }
  const { mesa, compartida } = estado.cargarMesa();
  ctx.mesa = mesa;
  enlazarCabecera();
  pintar();
  $('aviso-carga').remove();
  if (compartida) avisar('Usando la configuración de mesa del enlace.');
}

iniciar();
