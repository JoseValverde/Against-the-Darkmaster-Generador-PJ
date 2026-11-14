// Fórmulas básicas del reglamento, sin estado.

/** Bonificador por rangos [1.19]: +5 por rango hasta 10, +2 hasta 20, +1 después. */
export function bonoPorRangos(rangos) {
  const r = Math.max(0, Math.floor(rangos));
  if (r <= 10) return 5 * r;
  if (r <= 20) return 50 + 2 * (r - 10);
  return 70 + (r - 20);
}

/** Bonificador de nivel a las tiradas de salvación [2.3]: misma progresión que los rangos. */
export function bonoTSPorNivel(nivel) {
  return bonoPorRangos(nivel);
}

/** PM por nivel que da una característica: 1 por cada 10 puntos completos (nunca negativo). */
export function pmPorCaracteristica(valor) {
  return valor >= 10 ? Math.floor(valor / 10) : 0;
}

/** Velocidad variable opcional: ±1,5 m por cada 5 puntos completos de AGI. */
export function ajusteVelocidadAGI(agi) {
  return Math.trunc(agi / 5) * 1.5;
}

/** Valor de característica de la tabla [1.1] para un 1d100 (1-100). */
export function valorCaracteristicaTirada(tabla, tirada) {
  const fila = tabla.filas.find((f) => tirada >= f.min && tirada <= f.max);
  return fila ? fila.valor : null;
}

export const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
