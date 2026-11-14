# Generador de PJ · Against the Darkmaster

Generador web de personajes para el juego de rol **Against the Darkmaster** (edición española).
Crea un personaje paso a paso o de un solo clic, con las reglas del *Manual del Jugador* aplicadas y comprobadas, y te lo deja listo para imprimir.

**Pruébalo:** https://josevalverde.github.io/Against-the-Darkmaster-Generador-PJ/

> Herramienta no oficial, desarrollada gracias al blog [anotacionesrol.blogspot.com](https://anotacionesrol.blogspot.com/).
> Puedes encontrar el juego de rol *Against the Darkmaster* en [other-selves.com/vsdm](https://www.other-selves.com/vsdm).

## Qué hace

- **Asistente en 7 pasos**, como en la guía de creación del manual: características, linaje y cultura, vocación y habilidades, trasfondos y equipo, atributos derivados, Pasiones y nombre.
- **Aleatorio** en cada paso y botón de **personaje al azar** de un clic, siempre editable y con «Deshacer».
- **Las reglas se comprueban solas**: cada problema aparece en su paso, con la página del manual, y los avisos no bloquean.
- **Magia**: escuelas por vocación, linaje y comunes, grimorio con los sortilegios que conoces, cuáles puedes lanzar y sus opciones de distorsión.
- **Equipo**: armas con su bonificador de combate, armaduras y escudos con su efecto en la defensa, y el atuendo de tu cultura.
- **Subida de nivel** hasta el 10 (experiencia, puntos de desarrollo por nivel) y **Senda Heroica** con Revelaciones.
- **Configuración de mesa** que fija el DJ (método de características, linajes permitidos y reglas opcionales) y se **comparte por enlace**.
- **Hoja imprimible** en A4 con la estructura de la hoja oficial; se imprime o se guarda como PDF desde el navegador.
- **Guardar y cargar**: biblioteca en tu navegador y exportar/importar en archivo JSON. Sin cuentas, sin servidor, sin recogida de datos.
- Tema **claro u oscuro**, y funciona en ordenador y en móvil.

Reglas opcionales disponibles: las mejores de doce, la fortuna favorece al osado, velocidad variable y habilidades especializadas.

## Derechos de autor

Este repositorio **no contiene el texto del manual**. Los datos de reglas son cifras y nombres, y las descripciones (linajes, culturas, trasfondos, sortilegios…) son resúmenes con palabras propias que remiten a la página del libro. Para el texto completo, consulta el manual.

La única copia de material del juego es la hoja de personaje de libre distribución (`assets/hoja-pj.pdf`).

*Against the Darkmaster* es obra de sus autores y editores. Este proyecto es un trabajo de aficionados y no está afiliado a ellos.

## Usarlo en local

El generador es HTML, CSS y JavaScript puros, sin instalación ni dependencias. Como carga archivos de datos, hay que servirlo por http (no basta abrir `index.html` con doble clic):

```bash
python3 -m http.server 8642
```

y abrir http://localhost:8642.

## Pruebas

Requieren Node 16 o superior, sin instalar nada:

```bash
npm test
```

Comprueban la coherencia de los datos, que el motor reproduce número a número el personaje de ejemplo del manual (Syndel), los casos de error y cientos de personajes aleatorios (también subidos de nivel) que deben salir sin incumplir ninguna regla.

## Cómo está hecho

```
index.html          página única
css/                estilos, tema claro/oscuro, impresión
js/engine/          motor de reglas puro, sin DOM: cálculo, validación, aleatorio, equipo, progresión
js/ui/              interfaz: pasos del asistente, resumen, mesa, biblioteca, hoja imprimible
data/               reglas en JSON (linajes, culturas, vocaciones, habilidades, trasfondos, escuelas, equipo…)
assets/             hoja de personaje libre y fuentes (licencia OFL)
tests/              pruebas del motor y de los datos
```

El motor no toca el navegador, así que se prueba con Node y la interfaz solo lo llama. Más detalles de diseño, decisiones y reglas confirmadas en [`CLAUDE.md`](CLAUDE.md) y el plan de trabajo en [`PLAN.md`](PLAN.md).

## Créditos

- Herramienta desarrollada gracias al blog [anotacionesrol.blogspot.com](https://anotacionesrol.blogspot.com/).
- Juego: [*Against the Darkmaster*](https://www.other-selves.com/vsdm).
- Fuentes: IM Fell English (Igino Marini) y Alegreya Sans (Juan Pablo del Peral), con licencia SIL Open Font License; ver [`assets/fonts/LICENCIAS.md`](assets/fonts/LICENCIAS.md).
