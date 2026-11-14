// Comprueba la coherencia de los JSON de data/: ids únicos y referencias cruzadas.
// Uso: node tests/validar-datos.mjs
import { readFileSync } from 'node:fs';

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const car = leer('caracteristicas.json');
const hab = leer('habilidades.json');
const tab = leer('tablas.json');
const lin = leer('linajes.json');
const cul = leer('culturas.json');
const voc = leer('vocaciones.json');
const tra = leer('trasfondos.json');
const esc = leer('escuelas.json');
const eq = leer('equipo.json');

const errores = [];
const err = (m) => errores.push(m);
const unicos = (lista, nombre) => {
  const vistos = new Set();
  for (const x of lista) { if (vistos.has(x.id)) err(`${nombre}: id repetido ${x.id}`); vistos.add(x.id); }
  return vistos;
};

const CAR = new Set(car.caracteristicas.map((c) => c.id));
const HAB = unicos(hab.habilidades, 'habilidades');
const ESP = unicos(hab.especializadas.lista, 'especializadas');
const CAT = new Set(hab.categorias.map((c) => c.id));
const LIN = unicos(lin.linajes, 'linajes');
const CUL = unicos(cul.culturas, 'culturas');
const VOC = unicos(voc.vocaciones, 'vocaciones');
const ESC = unicos(esc.escuelas, 'escuelas');
unicos(tra.trasfondos, 'trasfondos');
unicos(eq.armaduras.lista, 'armaduras');
unicos(eq.armas.lista, 'armas');

for (const h of hab.habilidades) {
  if (!CAT.has(h.categoria)) err(`habilidad ${h.id}: categoría ${h.categoria}`);
  if (h.caracteristica && h.caracteristica !== 'variable' && !CAR.has(h.caracteristica)) err(`habilidad ${h.id}: característica ${h.caracteristica}`);
}

for (const l of lin.linajes) {
  if (Object.keys(l.mods).sort().join() !== [...CAR].sort().join()) err(`linaje ${l.id}: mods incompletos`);
  for (const b of l.bonos_habilidad) if (!HAB.has(b.habilidad)) err(`linaje ${l.id}: habilidad ${b.habilidad}`);
  for (const c of l.culturas_sugeridas) if (!CUL.has(c)) err(`linaje ${l.id}: cultura ${c}`);
  for (const v of l.vocaciones_prohibidas || []) if (!VOC.has(v)) err(`linaje ${l.id}: vocación ${v}`);
  for (const e of l.escuelas_linaje?.escuelas || []) if (!ESC.has(e)) err(`linaje ${l.id}: escuela ${e}`);
}

for (const c of cul.culturas) {
  let suma = 0;
  for (const [h, n] of Object.entries(c.rangos)) { if (!HAB.has(h)) err(`cultura ${c.id}: habilidad ${h}`); suma += n; }
  if (suma !== 21) err(`cultura ${c.id}: suma ${suma} rangos (esperado 21)`);
  for (const e of c.escuelas?.opciones || []) if (!ESC.has(e)) err(`cultura ${c.id}: escuela ${e}`);
}
const filas = cul.linaje_cultura_aleatorios.filas;
for (const f of filas) {
  if (!LIN.has(f.linaje)) err(`tabla [1.5]: linaje ${f.linaje}`);
  for (const x of f.culturas) if (!CUL.has(x.cultura)) err(`tabla [1.5]: cultura ${x.cultura}`);
}

for (const v of voc.vocaciones) {
  if (Object.keys(v.pd).sort().join() !== [...CAT].sort().join()) err(`vocación ${v.id}: PD incompletos`);
  for (const h of Object.keys(v.bonos_vocacionales)) if (!HAB.has(h)) err(`vocación ${v.id}: habilidad ${h}`);
  for (const e of v.escuelas_vocacionales) if (!ESC.has(e)) err(`vocación ${v.id}: escuela ${e}`);
}

const OBJETIVOS_FIJOS = new Set([...HAB, ...ESC]);
for (const t of tra.trasfondos) {
  for (const grado of ['menor', 'mayor']) {
    const g = t[grado];
    const elecciones = new Set((g.elecciones || []).concat(t.menor.elecciones || []).map((e) => e.id));
    for (const e of g.efectos || []) {
      const o = e.objetivo ?? e.car;
      if (typeof o !== 'string') continue;
      if (o.startsWith('eleccion:')) { if (!elecciones.has(o.slice(9))) err(`trasfondo ${t.id} (${grado}): elección ${o} no declarada`); }
      else if (e.car ? !CAR.has(o) : !OBJETIVOS_FIJOS.has(o)) err(`trasfondo ${t.id} (${grado}): objetivo ${o}`);
    }
    for (const e of g.efectos || []) for (const x of e.escuelas || []) if (!ESC.has(x)) err(`trasfondo ${t.id}: escuela ${x}`);
  }
}

for (const e of esc.escuelas) {
  if (!CAR.has(e.caracteristica)) err(`escuela ${e.id}: característica ${e.caracteristica}`);
  if (e.sortilegios.length !== 10) err(`escuela ${e.id}: ${e.sortilegios.length} sortilegios`);
  e.sortilegios.forEach((s, i) => { if (s.urdimbre !== i + 1) err(`escuela ${e.id}: urdimbre ${s.urdimbre} en posición ${i + 1}`); });
  for (const v of e.vocaciones) if (!VOC.has(v)) err(`escuela ${e.id}: vocación ${v}`);
}
for (const e of esc.comunes) if (!ESC.has(e)) err(`escuelas comunes: ${e}`);

for (const a of eq.armas.lista) for (const h of a.habilidades) if (!HAB.has(h.habilidad)) err(`arma ${a.id}: habilidad ${h.habilidad}`);

const r = tab.bonificador_por_rango.tramos;
if (r[0].por_rango !== 5 || r[1].por_rango !== 2 || r[2].por_rango !== 1) err('tabla [1.19] mal definida');

const resumen = `${LIN.size} linajes, ${CUL.size} culturas, ${VOC.size} vocaciones, ${HAB.size}+${ESP.size} habilidades, ` +
  `${tra.trasfondos.length} trasfondos, ${ESC.size} escuelas (${esc.escuelas.reduce((n, e) => n + e.sortilegios.length, 0)} sortilegios), ` +
  `${eq.armaduras.lista.length} armaduras, ${eq.armas.lista.length} armas`;
if (errores.length) { console.error(errores.join('\n')); console.error(`\n${errores.length} errores`); process.exit(1); }
console.log(`Datos coherentes: ${resumen}`);
