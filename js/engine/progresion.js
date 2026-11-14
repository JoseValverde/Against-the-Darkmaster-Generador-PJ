// Subida y bajada de nivel. Funciones puras: devuelven un PJ nuevo.
import { desarrolloNivelAleatorio } from './aleatorio.js';

const nivelVacio = () => ({ compras: {}, pago: {}, transferencias: [] });
// Copia profunda compatible con Node 16 (sin structuredClone); el PJ es JSON puro
const clonar = (x) => JSON.parse(JSON.stringify(x));

/** Añade un nivel vacío (los PD se reparten después). No toca los PX. */
export function subirNivel(pj) {
  const copia = clonar(pj);
  copia.desarrollo = [...(copia.desarrollo || [nivelVacio()]), nivelVacio()];
  copia.nivel = copia.desarrollo.length;
  return copia;
}

/** Quita el último nivel y lo que se compró en él. Nunca baja de 1. */
export function bajarNivel(pj) {
  const copia = clonar(pj);
  if ((copia.desarrollo || []).length > 1) copia.desarrollo = copia.desarrollo.slice(0, -1);
  copia.nivel = copia.desarrollo.length;
  return copia;
}

/** PX mínimos para un nivel según la tabla [1.25]. */
export function pxParaNivel(D, nivel) {
  return D.tablas.progresion.px_por_nivel[String(nivel)] ?? null;
}

/**
 * Lleva el PJ hasta `nivelObjetivo` repartiendo al azar los PD de cada nivel nuevo,
 * y sube los PX al mínimo necesario si no llegan.
 */
export function subirNivelesAleatorio(D, rng, pj, mesa, nivelObjetivo) {
  let p = clonar(pj);
  const max = D.tablas.progresion.nivel_maximo;
  const objetivo = Math.min(max, Math.max(1, nivelObjetivo));
  while ((p.desarrollo || []).length < objetivo) {
    p = subirNivel(p);
    const i = p.desarrollo.length - 1;
    p.desarrollo[i] = desarrolloNivelAleatorio(D, rng, p, mesa, i);
  }
  const necesario = pxParaNivel(D, p.desarrollo.length);
  if ((Number(p.px) || 0) < necesario) p.px = necesario;
  return p;
}
