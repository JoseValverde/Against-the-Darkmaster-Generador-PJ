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
- **Trasfondos** [1.22a/b]: ~45 opciones con grado menor/mayor (coste 1/3 casi
  siempre; Cambiaformas 2/4, Entrenamiento Excepcional 1/2).
- **Pasiones**: Naturaleza, Lealtad, Motivación (hasta 3, texto libre).
  **Determinación** inicial 1 (0–5). **Senda Heroica**: cada 10 puntos de
  Determinación gastados = 1 Hito.
- **Caso de prueba de referencia — Syndel** (ejemplo de la Guía): Elfa
  crepuscular, cultura feérica, maga. Base FUE 0, AGI 10, RES 0, INT 25, SAB 5,
  POR 10 → con linaje AGI 20, INT 30, POR 15. DEF 20, TSF 15, TSV 10, 9 PM,
  NR 3, velocidad 15, tamaño Mediano. El motor debe reproducirlo exactamente.

---

## Estado

- [x] Requisitos cerrados con el usuario (noviembre 2026).
- [x] Plan de trabajo: [PLAN.md](PLAN.md).
- [ ] Fase 0: git init, `.gitignore`, conectar el repo (falta la URL exacta).
- [ ] Fase 1 en adelante: ver PLAN.md.

Actualiza esta sección al cerrar cada fase.
