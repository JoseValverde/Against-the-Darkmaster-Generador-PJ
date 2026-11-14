# Generador de PJ — Against the Darkmaster · Plan de trabajo

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Modo de creación | Asistente por los 7 pasos de la guía, con "aleatorio" en cada paso y PJ completo de un clic |
| Alcance de reglas | Núcleo de la guía + magia completa (escuelas y sortilegios) + armas y armaduras + subida de nivel |
| Salida | Hoja imprimible propia (A4, 3 páginas + grimorio) · guardar/cargar. Relleno del PDF oficial descartado |
| Opcionales | Mejores de doce · Fortuna favorece al osado · Velocidad variable · Habilidades especializadas |
| Configuración de mesa | El DJ fija método, linajes permitidos y opcionales; se comparte por enlace |
| Trasfondos | Efectos numéricos automáticos; lo narrativo queda como recordatorio |
| Texto del manual | Solo mecánica + resúmenes propios + referencia de página. Nada de texto copiado |
| Tecnología | HTML + CSS + JavaScript sin build, datos en JSON. Pantalla: ordenador y móvil por igual |
| Publicación | GitHub Pages (gratis); el repo de GitHub es el respaldo |
| Guardado | En el navegador de cada usuario + exportar/importar JSON. Sin servidor |
| Estética | Espíritu de la hoja oficial, con modo oscuro elegible; prioridad a una UI correcta |
| Idioma | Solo español (terminología de la edición española) |

## Regla de oro del repo

La carpeta `REF Against the Darkmaster/` **no se sube nunca** a GitHub (va en `.gitignore`).
Solo se publica el PDF de la hoja de personaje, que es de libre distribución.

## Estructura prevista

```
Against-the-Darkmaster-Generador-PJ/
  index.html
  css/            estilos, tema claro/oscuro, impresión
  js/
    engine/       reglas puras: cálculos, validación, aleatorio
    ui/           pasos del asistente, hoja, biblioteca
  data/           JSON: linajes, culturas, vocaciones, habilidades,
                  trasfondos, escuelas y sortilegios, armas, armaduras, tablas
  assets/         hoja-pj.pdf (libre), fuentes, iconos
  tests/          casos de prueba del motor
  REF Against the Darkmaster/   (solo local, ignorada por git)
```

## Fases

### 0 · Preparación
- `git init`, `.gitignore` (REF, .DS_Store), conectar con tu repo vacío y primer commit.
- Activar GitHub Pages en el repo (lo haces tú en la web; te dejo los clics).

### 1 · Datos de reglas → JSON (la base de todo) — ✅ hecha
Resultado en `data/`, validador en `tests/validar-datos.mjs`, caso de prueba
Syndel en `tests/fixtures/`. Las opciones de distorsión de sortilegios quedan
para la fase 4.
- Extraer de la Guía: características [1.1], linajes [1.2] con rasgos, culturas [1.4–1.6], linaje/cultura aleatorios [1.5], vocaciones [1.7–1.20], habilidades y características [1.18], bonificador por rango [1.19], especializadas [1.21], trasfondos [1.22] con sus efectos, derivados (pág. 98–99), Pasiones y Determinación.
- Extraer del Manual completo: Grimorio (escuelas sortílegas por vocación y sortilegios, pág. ~198–277), armas, armaduras y escudos, riqueza (apéndice).
- Las tablas cuyo texto sale desordenado del PDF (p. ej. [1.4], [1.7]) se verifican mirando la página renderizada.
- Cada entrada lleva resumen propio + `pagina` del manual.

### 2 · Motor de reglas (sin interfaz, con pruebas) — ✅ hecha
`js/engine/` con 35 pruebas (`npm test`): Syndel exacto, ejemplos del manual,
errores esperados y 400 PJ aleatorios válidos.
- Totales de característica (base + linaje + especial).
- Habilidades: característica + rangos (tabla [1.19]) + vocación + linaje + especial + objeto (no acumulable).
- PD por categoría, transferencia 2:1, máx. 2 rangos por habilidad y nivel, rangos culturales fuera del límite, especializadas (2 rangos/PD o 2 PD/rango según vocación).
- Derivados: DEF, TSF, TSV, PG (Corpulencia, con tope PG Máx del linaje), PM, NR, velocidad, tamaño.
- Trasfondos con efectos numéricos aplicados y control de PT.
- Generador aleatorio que produce PJ coherentes (no solo válidos).
- Pruebas: el ejemplo de Syndel de la guía y los PJ pregenerados deben dar exactamente sus números.

### 3 · Asistente de creación (UI) — ✅ hecha
- Pasos: Características → Linaje y cultura → Vocación y PD → Trasfondos y equipo → Derivados → Pasiones → Nombre.
- Aleatorio por paso y PJ completo de un clic; validación visible (qué falta, qué sobra).
- Configuración de mesa en la URL (método, linajes, opcionales).
- Sugerencias de Pasiones según cultura.

### 4 · Magia y equipo — ✅ hecha
- Escuelas sortílegas permitidas por vocación, rangos y sortilegios accesibles.
- Atuendo cultural, equipo inicial, armas/armaduras con sus columnas de la hoja (Torpeza, Tabla de ataque, Críticos, AGI máx. en DEF, penalizadores…).

### 5 · Subida de nivel — ✅ hecha
- PD por nivel, PM por nivel, PX y Próx. nvl., TS que crecen con el nivel, historial de qué se compró en cada nivel.

### 6 · Salidas — ✅ hecha (sin relleno del PDF oficial, descartado)
- Hoja imprimible HTML que replica la estructura de las 3 páginas (A4, también "Guardar como PDF").
- Biblioteca de personajes en el navegador + exportar/importar JSON.

### 7 · Acabado — ✅ hecha
- Tema claro (hoja) y oscuro, responsive móvil/ordenador, accesibilidad (teclado, contraste), revisión de textos.

### 8 · Publicación — ✅ hecha
- Despliegue en GitHub Pages y prueba en móvil y ordenador.

## Hitos

1. **Primer PJ válido de nivel 1** (fases 0–3 con núcleo de la guía) → ya usable.
2. **PJ completo** (fase 4 + hoja imprimible + guardar) → listo para mesa.
3. **Versión 1** (subida de nivel + publicación).

## Riesgos conocidos
- Tablas del PDF que se extraen desordenadas → verificación visual página a página.
- Trasfondos con efectos muy variados → algunos quedarán como recordatorio manual.
