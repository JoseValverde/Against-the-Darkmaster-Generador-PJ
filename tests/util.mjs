import { readFileSync } from 'node:fs';
import { ARCHIVOS, indexarDatos } from '../js/engine/datos.js';

export function cargarDatosNode() {
  const raw = {};
  for (const n of ARCHIVOS) raw[n] = JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
  return indexarDatos(raw);
}
export const fixture = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}.json`, import.meta.url), 'utf8'));
