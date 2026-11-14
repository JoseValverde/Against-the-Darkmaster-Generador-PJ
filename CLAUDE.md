# Generador de PJ — Against the Darkmaster

Generador web de personajes para el juego de rol *Against the Darkmaster* (VsD),
edición española. Web pública y gratuita, sin servidor. El plan por fases y los
hitos están en [PLAN.md](PLAN.md); este archivo recoge los requisitos y las
decisiones que no se deben volver a discutir.

> Este proyecto vive dentro de `El Pozo/rolApp`. El `CLAUDE.md` de El Pozo
> (ocio, líneas de disfrute) no rige el trabajo técnico de esta carpeta: aquí se
> construye software. Aplica su registro (directo, cómplice, sin preámbulos) y
> nada más.

---

## Usuario

- Hispanohablante; responde siempre en español.
- No es desarrollador ("no sé mucho de esto"): explica los pasos de git, GitHub
  y publicación con instrucciones exactas, sin jerga innecesaria.
- Las credenciales y logins (GitHub, etc.) los hace él; nunca se tocan.

---

## Modelo por fase

Claude **no puede cambiar el modelo de su propia sesión** (la herramienta lo
rechaza). Al empezar cada fase, Claude **indica en una línea qué modelo toca y
por qué**, y el usuario lo cambia en el selector de modelo de la app. Si la
fase la hace otra sesión iniciada desde esta, Claude sí puede fijarle el modelo.

Regla práctica: **Opus cuando hay que interpretar el manual, Sonnet cuando hay
que construir sobre algo ya decidido.**

| Fase | Modelo | Motivo |
|---|---|---|
| 0 · Preparación (git, repo) | Sonnet | Mecánica |
| 1 · Datos de reglas → JSON | Opus | Tablas desordenadas, letra pequeña; un error se arrastra a todo |
| 2 · Motor de reglas y pruebas | Opus | Lógica de reglas delicada |
| 3 · Asistente (UI) | Sonnet | Interfaz sobre un motor ya probado |
| 4 · Magia y equipo | Opus para extraer datos · Sonnet para la UI | Mixta |
| 5 · Subida de nivel | Opus | Reglas de progresión |
| 6 · Salidas (hoja, PDF, guardado) | Sonnet (Opus si calibrar el PDF oficial se complica) | Construcción |
| 7 · Acabado visual | Sonnet | Interfaz |
| 8 · Publicación | Sonnet | Rutina |

Subagentes con otro modelo solo si el usuario lo pide.

---

## Requisitos

### Creación de personajes
- **Asistente por los 7 pasos de la guía**: Características → Linaje y cultura →
  Vocación y PD → Trasfondos y equipo → Atributos derivados → Pasiones → Nombre.
- **Aleatorio** en cada paso + botón de **PJ completo de un clic**. El aleatorio
  debe dar PJ *coherentes* (no solo válidos) y siempre editables después.
- Validación visible: qué falta, qué sobra, qué incumple las reglas.

### Alcance de reglas (todo entra en la versión 1)
- Núcleo de la Guía de creación.
- **Magia completa**: Escuelas Sortílegas permitidas por vocación, rangos y
  sortilegios accesibles (Grimorio del Manual del Jugador).
- **Armas, armaduras y escudos** con todas las columnas de la hoja.
- **Subida de nivel** (niveles 2+).

### Reglas opcionales (interruptores)
- Las mejores de doce (tirar 12 × 1d100, quedarse 6).
- La fortuna favorece al osado (linaje y cultura aleatorios [1.5]; +1
  Determinación si además las características son aleatorias sin "mejores de doce").
- Velocidad variable (+1,5 m por cada 5 de AGI; AGI negativa resta).
- Habilidades especializadas [1.21].

### Configuración de mesa
- El DJ fija: método de características, linajes permitidos y opcionales activos.
- Se **comparte por enlace** (configuración codificada en la URL); quien lo abre
  tiene el generador configurado igual.

### Trasfondos
- Efectos **numéricos automáticos** (rangos extra, bonificadores, NR, PM…).
- Lo narrativo (crear un PNJ, Pasión vinculada) queda como recordatorio visible.
- Control de PT: cada opción una sola vez, grado menor o mayor, PT sobrantes se pierden.

### Salidas
- **Hoja imprimible propia** (HTML, A4, estructura de las 3 páginas de la hoja
  oficial; también "Guardar como PDF" del navegador).
- **Relleno del PDF oficial** de la hoja: escribir los datos encima con pdf-lib
  en el navegador. El PDF es una imagen sin campos: hay que calibrar coordenadas.
- **Guardar/cargar**: biblioteca en el navegador (localStorage, siempre dentro de
  try/catch) + exportar/importar JSON. Sin cuentas, sin servidor, sin datos personales.

### Interfaz
- Estética con el **espíritu de la hoja oficial** (pergamino/grises, rotulación
  de fantasía clásica) con **modo oscuro elegible**.
- Prioridad absoluta: **UI correcta** — clara, accesible (teclado, contraste),
  sin adornos que estorben.
- **Ordenador y móvil por igual** (responsive); la hoja imprimible pensada para A4.
- **Solo español**, con la terminología de la edición española (Linaje, Cultura,
  Vocación, Escuelas Sortílegas, Pasiones, Determinación, Senda Heroica…).

---

## Design Context (diseño visual; copia de .impeccable.md)

### Users
Jugadores y directores de juego de *Against the Darkmaster* (edición española),
empezando por la mesa del autor y abierto a cualquiera por enlace. Lo usan en
casa preparando partida (ordenador) y en la propia mesa de juego (móvil).
Tarea: crear un personaje de nivel 1 válido paso a paso, o de un clic al azar,
y sacarlo impreso o en PDF. Muchos no se saben las reglas de memoria: la app
debe guiar sin abrumar y explicar con referencias de página al manual.

### Brand Personality
**Artesanal, cálido, ochentero.** Como un manual de rol de los 80 impreso a dos
tintas y cuidado a mano: papel, tinta, rúbricas. Emociones: complicidad de mesa,
confianza (las cuentas están bien), ganas de jugar.

### Aesthetic Direction
- Referencia: la hoja oficial de personaje y los manuales clásicos de rol
  impresos a dos tintas (negro + un rojo de rúbrica), con títulos en versalitas
  de imprenta antigua y tablas limpias.
- Anti-referencias (explícitas del usuario): **videojuego/MMO** (brillos, metal,
  botones dorados en relieve), **app corporativa** (formularios grises, tarjetas
  SaaS), **fantasía de feria** (pergamino manchado falso, góticas ilegibles,
  texturas recargadas), **hoja de cálculo** (tablas densas sin jerarquía).
- Tema: sigue al sistema por defecto, con interruptor. Claro = papel crudo y
  tinta parda; oscuro = la misma hoja «a la luz de una vela»: fondo pardo muy
  oscuro, tinta marfil, la rúbrica roja aclarada. Nada de negro ni blanco puros.
- Tipografía: IM Fell English SC (titulares en versalitas de imprenta antigua)
  + Alegreya Sans (interfaz, cifras tabulares). Prioridad a la legibilidad.

### Design Principles
1. **Dos tintas.** Tinta + papel + un único acento rojo de rúbrica, usado poco y
   con intención (paso activo, errores, totales clave).
2. **La hoja manda.** La estructura y el vocabulario imitan la hoja oficial
   (Carac., Rangos, Voc., Lin., Esp., Obj., TOTAL) para que lo creado aquí se
   reconozca en papel.
3. **Guiar, no regañar.** Cada problema se dice en su paso, en frase clara y
   con la página del manual; los avisos no bloquean.
4. **Números que se leen.** Cifras tabulares, totales destacados por peso y
   tamaño, columnas alineadas; jerarquía antes que densidad.
5. **Móvil de mesa.** Todo usable con el pulgar; nada importante escondido.

---

## Derechos de autor (innegociable)

- La web lleva **mecánica + resúmenes propios + referencia de página** del manual.
  **Nunca** texto copiado del libro (descripciones, rasgos, sortilegios): se
  resume con palabras propias y se indica `pagina`.
- La carpeta `REF Against the Darkmaster/` **jamás se sube a git ni a GitHub**:
  va en `.gitignore` desde el primer commit. Antes de cada commit, comprobar que
  no se cuela ningún PDF de REF.
- Única excepción: el **PDF de la hoja de personaje**, que es de libre
  distribución según el usuario. Se publica como copia en `assets/hoja-pj.pdf`.
- Objetivo declarado: que los autores no se sientan amenazados. Ante la duda,
  resumir más y remitir al libro.

---

## Tecnología y publicación

- **HTML + CSS + JavaScript sin build** (módulos ES), datos de reglas en **JSON**.
  Sin npm en producción. pdf-lib desde CDN con versión exacta (o copiada en el repo).
- **GitHub Pages** (gratis). El repo de GitHub es el respaldo.
  - El usuario ya tiene cuenta y un repo **vacío** llamado
    "Against the Darkmaster - Generador de PJ". Pedir la URL exacta antes de
    conectar (GitHub suele convertir espacios en guiones).
  - En este Mac **no** hay `gh` ni `clasp`; sí `git` y Node 16 (vía nvm).
  - Pages se activa desde la web del repo (Settings → Pages); lo hace el usuario.
- Pruebas del motor con Node (`node --test`, disponible en Node 16.17+).
- Se descartó Google Apps Script (URL larga, aviso de Google, cuotas).

### Estructura prevista
```
index.html
css/        estilos, tema claro/oscuro, impresión
js/engine/  reglas puras: cálculos, validación, aleatorio (sin DOM)
js/ui/      pasos del asistente, hoja, biblioteca
js/pdf/     relleno de la hoja oficial
data/       JSON de reglas
assets/     hoja-pj.pdf, fuentes, iconos
tests/      pruebas del motor
REF Against the Darkmaster/   solo local, ignorada por git
```
El motor (`js/engine`) no toca el DOM: así se prueba con Node y la UI solo lo llama.

---

## Interfaz (fase 3)

- `index.html` + `css/estilos.css` + `js/ui/` (sin build). `app.js` arranca, guarda
  el estado y repinta; un archivo por paso en `js/ui/pasos/`; `resumen.js` (panel
  lateral), `mesa.js` (configuración de mesa), `estado.js` (borrador, mesa, tema),
  `comun.js` (componentes), `dom.js` (`h()` para crear elementos).
- Repintado: `ctx.actualizar(fn)` repinta el paso entero conservando foco, cursor
  y scroll (atributo `data-foco`); con `{ parcial: true }` solo resumen, pasos y
  problemas (para campos de texto).
- Mesa por enlace: parámetros `m`, `d12`, `fo`, `vv`, `es`, `sq`, `l` (linajes
  separados por puntos). La URL manda sobre lo guardado en el navegador.
- localStorage (`vsd-borrador`, `vsd-mesa`, `vsd-tema`, `vsd-paso`), siempre en
  try/catch.
- El motor tiene `pasoAleatorio(D, rng, pj, mesa, paso)`: rehace un paso y repara
  los pasos posteriores que queden inválidos. Probado en `tests/aleatorio.test.mjs`.
- **Probar en local**: hace falta servirlo por http (módulos ES y `fetch` de los
  JSON no funcionan con `file://`). Hay un `.claude/launch.json` en `rolApp/` que
  lanza `python3 -m http.server 8642` sobre esta carpeta. A mano:
  `python3 -m http.server 8642` dentro de la carpeta y abrir http://localhost:8642.
- Fuentes desde Google Fonts (IM Fell English SC, IM Fell English, Alegreya Sans).
  **Pendiente fase 7**: alojarlas en `assets/fonts/` (privacidad de visitantes
  en la UE; pedir permiso al usuario para descargarlas).
- Tablas anchas: `.paso` es contenedor (`container-type`); las columnas `.col-opc`
  se ocultan cuando el paso mide menos de 660 px. TOTAL siempre visible.

## Fuentes de reglas (carpeta REF)

| Archivo | Uso |
|---|---|
| `Guia para hacer PJ - …Manual_del_Jugador.pdf` | Extracto del Manual del Jugador, pág. 12–117 (106 págs.). Fuente principal de creación |
| `HojaPJ - …Manual_del_Jugador.pdf` | Hoja oficial, 3 páginas, solo imagen (sin texto ni campos) |
| `Against_the_Darkmaster_Manual_del_Jugador.pdf` | Manual completo (330 págs., texto extraíble). Grimorio ≈ pág. 198–277; apéndice de tablas ≈ pág. 278; armas, armaduras, riqueza |
| `PJ_Pregenerados_VsD.pdf` | Casos de prueba para el motor |
| `Manual_del_Director_de_Juego.pdf`, aventuras, mapas, guía rápida | Consulta puntual |

**Lectura de PDFs:** no hay poppler ni pdftotext. Se usa PyMuPDF instalado con
`pip install --target <scratchpad>/pylib pymupdf` y `PYTHONPATH`. Las tablas
multicolumna (p. ej. [1.4] rangos culturales, [1.7] vocaciones) salen
desordenadas en el texto: **verificarlas siempre renderizando la página a imagen**.
Los números de página impresos del manual van ~11 por delante del índice de
página del PDF de la Guía (pág. impresa 14 = página 3 del PDF).

---

## Reglas clave ya confirmadas (Guía)

- **Características** (FUE, AGI, RES, INT, SAB, POR): aleatorio 6 × 1d100 en [1.1]
  (−20 a +35) o 50 puntos en bloques de 5 (mín. 0, máx. 25). Conjuntos
  predefinidos: +20/+15/+10/+5/0/0 · +25/+20/+5/0/0/0 · +10/+10/+10/+10/+5/+5.
- **13 linajes** [1.2]: modificadores a características, PG, PG Máx, PM (solo
  nivel 1), TSF, TSV, PT, NR. Algunos rasgos condicionan el reparto (p. ej. Elfo
  crepuscular "Grácil y Elegante": POR debe ser uno de los 3 valores más altos
  antes del linaje).
- **13 culturas**: rangos culturales [1.4] (no cuentan para el límite de rangos),
  rangos en Escuelas Sortílegas a repartir, atuendo (elegir uno por línea) [1.6], NR.
  NR total = NR linaje + NR cultura.
- **6 vocaciones**: Guerrero, Pícaro, Mago, Animista, Versátil, Campeón. PD por
  categoría y bonificadores vocacionales [1.7]; PM por nivel 0/0/3/2/1/1.
  Combate: bonificadores a 1ª–5ª habilidad elegida.
- **7 categorías de habilidad**: Armadura, Combate, Aventura, Latrocinio,
  Conocimiento, Sortilegios, Corpulencia. Característica de cada una en [1.18]
  (Armadura sin característica; Escuelas Sortílegas varía).
- **Bonificador de habilidad** = característica + bonif. por rangos [1.19]
  (+5/rango hasta 10, +2 hasta 20, +1 después) + vocación + linaje + especial
  (acumulable) + objeto (solo uno, no acumulable).
- **PD**: 1 PD = 1 rango; 2 PD de otras categorías = 1 rango (o 1 PM extra);
  máx. 2 rangos por habilidad y nivel; los PD no gastados se pierden.
- **Especializadas**: Guerrero y Pícaro 2 rangos por PD; resto 2 PD por rango.
- **Derivados**: velocidad 15 m; DEF = AGI o 0 (lo mayor), limitada por armadura;
  TSF = RES + 5 + linaje; TSV = SAB + 5 + linaje; PG = bonif. de Corpulencia
  (tope PG Máx del linaje); PM = 1 por cada 10 completos de INT (Mago) / SAB
  (Animista) / POR (resto) + PM de linaje + PM de vocación; tamaño Mediano salvo
  que el linaje diga otra cosa.
- **Equipo inicial**: ropa de viaje, cinturón con vainas, un arma auxiliar,
  faltriquera, bolsa pequeña + atuendo cultural + objetos de trasfondo. Sin oro inicial.
- **Trasfondos** [1.22a/b]: 40 opciones con grado menor/mayor (coste 1/3 casi
  siempre; Cambiaformas 2/4, Entrenamiento Excepcional 1/2).
- **Pasiones**: Naturaleza, Lealtad, Motivación (hasta 3, texto libre).
  **Determinación** inicial 1 (0–5). **Senda Heroica**: cada 10 puntos de
  Determinación gastados = 1 Hito.
- **Caso de prueba de referencia — Syndel** (ejemplo de la Guía): Elfa
  crepuscular, cultura feérica, maga. Base FUE 0, AGI 10, RES 0, INT 25, SAB 5,
  POR 10 → con linaje AGI 20, INT 30, POR 15. DEF 20, TSF 15, TSV 10, 9 PM,
  NR 3, velocidad 15, tamaño Mediano. El motor debe reproducirlo exactamente.
  La hoja completa (todas las habilidades y escuelas) está en
  `tests/fixtures/syndel.json`, leída de la hoja rellenada al final de la Guía.

## Reglas confirmadas en la fase 1 (datos)

- **Escuelas Sortílegas**: cada escuela suma **su propia característica**
  (campo `caracteristica` en `escuelas.json`), no la de PM. El bonificador
  vocacional de Escuelas (+15 mago, etc.) se aplica a **todas** las escuelas.
- **Acceso a escuelas** (cap. 12): comunes [2.4] para cualquiera, ejecutables
  solo hasta 5ª urdimbre; vocacionales sin límite; de linaje sin límite y se
  pagan con PD de cualquier categoría 1:1. Al subir de nivel solo se mejoran
  escuelas ya conocidas. Solo se lanzan urdimbres ≤ nivel. Coste en PM = urdimbre.
- **Magia Negra y Nigromancia** no son comunes ni de vocación ni de linaje
  (`oscura: true`); solo accesibles por excepciones como Mago Innato.
- **PM**: por nivel = floor(car. de PM / 10) + PM de vocación (+ trasfondos);
  el PM de linaje se suma una sola vez.
- **TS por nivel** [2.3]: misma progresión que el bonificador por rango
  (+5 hasta nivel 10, +2 hasta 20, +1 después).
- **PG de linaje**: va en la columna Lin. de Corpulencia (Syndel: 0 + 5 + 25 = 30).
- **NR inicial** = linaje + cultura + trasfondos, limitado a 0-4.
- **Cultura Saqueadora**: pensada para PNJ; para PJ solo con permiso de la mesa
  (`requiere_permiso: true`).
- **Bonificadores condicionales** (p. ej. Sigilo +20 en entorno natural) no
  suman al total: la hoja de Syndel los pone entre paréntesis.
- Los datos se validan con `node tests/validar-datos.mjs` (ids y referencias
  cruzadas entre todos los JSON). Ejecutarlo tras cualquier cambio en `data/`.
- **Ids únicos entre habilidades, especializadas y escuelas**: la escuela de
  curación es `sanacion_sortilega` (la habilidad es `sanacion`). El validador
  lo comprueba.

## Motor de reglas (fase 2)

- Código en `js/engine/`, API pública en `js/engine/index.js`. Sin DOM.
- `calcular(pj, D, mesa)` devuelve la hoja completa (características,
  habilidades, escuelas, PD por nivel, derivados, PT, rasgos, equipo inicial,
  recordatorios) y `problemas`: `{ nivel: 'error' | 'aviso', paso, mensaje }`.
  `paso` es uno de `PASOS` (modelo.js) para que la UI lo muestre en su paso.
  `valido` = no hay errores. Los avisos (PD sin gastar, pasiones vacías…) no
  bloquean.
- Modelo de entrada en `modelo.js` (`pjVacio`, `mesaPorDefecto`). El desarrollo
  va **por nivel** (`desarrollo[0]` = nivel 1) con `compras`, `pago` y
  `transferencias`, ya preparado para la subida de nivel.
- `generarPJ(D, rng, mesa, fijo)` crea un PJ completo y coherente; `crearRng(semilla)`
  permite repetirlo. Pasos sueltos: `tirarCaracteristicas`, `asignarCaracteristicas`,
  `tirarLinajeCultura`, `nombreAleatorio`, `pasionAleatoria`.
- Pruebas: `npm test` (validador de datos + `node --test tests/`). Incluye Syndel
  número a número, ejemplos de PM y NR del manual, casos de error y 400 PJ
  aleatorios que deben salir sin errores. `package.json` solo declara
  `"type": "module"` y el script de pruebas: no hay dependencias.

---

## Estado

- [x] Requisitos cerrados con el usuario (noviembre 2026).
- [x] Plan de trabajo: [PLAN.md](PLAN.md).
- [x] Fase 0: repo git en esta carpeta, conectado a
  https://github.com/JoseValverde/Against-the-Darkmaster---Generador-de-PJ
  (rama `main`). GitHub Pages se activa cuando exista `index.html`.
  El usuario tiene GitHub Desktop; las subidas desde aquí funcionan
  (credenciales en el llavero de macOS).
- [x] Fase 1: datos de reglas en `data/` (13 linajes, 13 culturas, 6 vocaciones,
  23 habilidades + 14 especializadas, 40 trasfondos con efectos, 38 escuelas con
  380 sortilegios, 24 armaduras, 40 armas, equipo genérico). Validador en `tests/`.
  Pendiente para la fase 4: opciones de distorsión de sortilegios (solo
  referencia de página por ahora).
- [x] Fase 2: motor de reglas con 35 pruebas en verde (`npm test`).
- [x] Fase 3: asistente de 7 pasos en `index.html` + `js/ui/` + `css/estilos.css`,
  con aleatorio por paso, PJ de un clic, mesa por enlace, borrador y tema.
- [x] Fase 4 (magia y equipo).
  - Datos (Opus): `escuelas.json` con 185 sortilegios con `distorsion`
    [{urdimbre, texto}] (265 opciones condensadas o reescritas con palabras
    propias); `data/atuendo_equipo.json` con las armas/protecciones de cada
    opción de atuendo (53 de 112), `{ elige: [...] }` para las alternativas «o» y
    `nota` cuando se usa un arma equivalente de la tabla.
  - Motor: `js/engine/equipo.js` (`equipoSugerido`, `equipoDesdeAtuendo`,
    `filasArmas`, `sortilegiosConocidos`); la hoja trae `armas` (BC = mejor
    habilidad + penalizador del arma + penalizador de armadura al BC) y
    `grimorio`. Afinidad Mágica mayor: +1 nivel para lanzar de la predilecta.
    El generador equipa según el atuendo y añade un arma auxiliar.
  - UI (Sonnet): paso IV con «Armas y Ataques» (añadir/quitar) y «Equiparme con
    mi atuendo» (elige en las alternativas, conserva armas añadidas a mano);
    paso V con el Grimorio plegable por escuela (lanzable ya o a qué nivel,
    PM, parámetros, resumen y distorsiones).
- [ ] Fase 5 en adelante: ver PLAN.md.

Actualiza esta sección al cerrar cada fase.
