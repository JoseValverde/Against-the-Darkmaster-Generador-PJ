// Modelo del personaje (entrada del motor) y de la configuración de mesa.
// El motor nunca modifica estos objetos: los lee y devuelve una hoja calculada.

export const CARACTERISTICAS = ['FUE', 'AGI', 'RES', 'INT', 'SAB', 'POR'];
export const CATEGORIAS = ['armadura', 'combate', 'aventura', 'latrocinio', 'conocimiento', 'sortilegios', 'corpulencia'];
export const PASOS = ['caracteristicas', 'linaje_cultura', 'vocacion', 'trasfondos_equipo', 'derivados', 'pasiones', 'nombre'];
export const VERSION_MODELO = 1;

/**
 * Personaje vacío. Campos:
 * - metodo: 'puntos' | 'aleatorio' | 'mejores_de_doce'
 * - tiradas: resultados de 1d100 guardados (métodos aleatorios), solo informativo
 * - base: valores de característica antes del linaje
 * - eleccion_linaje: { habilidad } para el rasgo Especialización (humano, semielfo)
 * - escuelas_linaje: { escuela: rangos } reparto de los rangos de escuela del linaje
 * - escuelas_cultura: { escuela: rangos } reparto de los rangos de escuela de la cultura
 * - atuendo: una opción elegida por cada línea de atuendo de la cultura
 * - bonos_combate: ids de habilidad que reciben el 1º, 2º… bonificador de Combate
 * - desarrollo: una entrada por nivel (índice 0 = nivel 1):
 *     { compras: { id: rangos }, pago: { id: categoria }, transferencias: [{ desde: [cat, cat], hacia: cat | 'pm' }] }
 *     'pago' solo hace falta para escuelas de linaje pagadas con PD de otra categoría.
 * - trasfondos: [{ id, grado: 'menor' | 'mayor', eleccion: { ... } }]
 * - pasiones: { naturaleza, lealtad, motivacion, condena?, destino? }
 * - equipo: { armadura, escudo, yelmo, piezas: [], armas: [], objetos: [] } (ids de equipo.json o texto libre)
 */
export function pjVacio() {
  return {
    version: VERSION_MODELO,
    nombre: '',
    nivel: 1,
    metodo: 'puntos',
    tiradas: [],
    base: { FUE: 0, AGI: 0, RES: 0, INT: 0, SAB: 0, POR: 0 },
    linaje: null,
    cultura: null,
    vocacion: null,
    eleccion_linaje: {},
    escuelas_linaje: {},
    escuelas_cultura: {},
    atuendo: [],
    bonos_combate: [],
    desarrollo: [{ compras: {}, pago: {}, transferencias: [] }],
    trasfondos: [],
    pasiones: { naturaleza: '', lealtad: '', motivacion: '' },
    determinacion_extra: 0,
    equipo: { armadura: null, escudo: null, yelmo: null, piezas: [], armas: [], objetos: [] },
    notas: '',
  };
}

/** Configuración de mesa por defecto (lo que fija el DJ). */
export function mesaPorDefecto() {
  return {
    metodo: 'puntos',            // método de características obligatorio para la mesa, o 'libre'
    mejores_de_doce: false,
    fortuna_osado: false,
    velocidad_variable: false,
    especializadas: false,
    saqueadora: false,           // permitir la cultura Saqueadora a los PJ
    linajes: null,               // null = todos; si no, lista de ids permitidos
  };
}
