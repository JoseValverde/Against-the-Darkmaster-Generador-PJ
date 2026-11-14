// API pública del motor. La interfaz importa solo desde aquí.
export { cargarDatos, indexarDatos } from './datos.js';
export { calcular } from './calculo.js';
export { pjVacio, mesaPorDefecto, CARACTERISTICAS, CATEGORIAS, PASOS, VERSION_MODELO } from './modelo.js';
export { bonoPorRangos, bonoTSPorNivel, pmPorCaracteristica } from './reglas.js';
export {
  crearRng, d100, generarPJ, tirarCaracteristicas, asignarCaracteristicas, tirarLinajeCultura,
  linajesPermitidos, culturasPermitidas, vocacionesPara, nombreAleatorio, pasionAleatoria, PRIORIDAD,
} from './aleatorio.js';
