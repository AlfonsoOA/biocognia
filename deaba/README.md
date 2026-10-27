# DEAba Digital

Parte de BIOCOGNIA. Versión digital de la metodología DEAba (análisis de expresión diferencial en Bioquímica Metabólica) para trabajar en grupo en clase y discutir las respuestas en un plenario.

## Dos tipos de actividad

- **Tipo 1 · Interpretar el experimento.** Los grupos reciben las tablas de proteómica y metabolómica con su fold change (FC = condición 1 / condición 2; un valor negativo es −1/valor). Para cada molécula escriben la reacción y eligen la ruta o rutas; después explican el patrón con frases guiadas («[molécula] sube/baja porque … en [ruta]») y dicen qué está ocurriendo.
- **Tipo 2 · Diseñar el experimento.** Los grupos eligen las dos condiciones que comparan (o proponen una propia) y los marcadores de un catálogo que incluye distractores. Para cada marcador dan la reacción, la ruta, la dirección esperada y una estimación del fold change. En el plenario, el profesor «ejecuta el experimento»: cada grupo ve el fold change observado de sus marcadores y puede probar otras parejas de condiciones.

Puntuación por defecto (3 + 3 + 4). Tipo 1: reacciones, rutas y diagnóstico. Tipo 2: condiciones; enzimas, reacciones y rutas; fold change.

## Cómo se usa

- **Grupos:** `deaba/?s=CÓDIGO`. Entran con el código y el nombre del grupo, sin datos personales. Trabajan de forma independiente y no reciben corrección: todo queda abierto hasta el plenario.
- **Profesorado:** `deaba/panel.html`, con la misma cuenta autorizada que SORTIVIA. Desde el panel se puede:
  - crear sesiones formativas o de evaluación (con calificación por apartados y exportación a CSV);
  - seguir a los grupos en directo y enviarles avisos;
  - ver la agregación por molécula o por marcador y la matriz de conceptos;
  - proyectar el plenario (flechas para avanzar, Esc para salir, opción de mostrar la clave y de ocultar los nombres de los grupos).
- **Guía del profesor:** `deaba/guia.html?a=ID` (se imprime o se guarda como PDF). Solo la ve el profesorado.
- **Versión en papel:** `deaba/imprimir.html?a=ID`, recomendada para las sesiones presenciales.
- **Demostración:** añade `?demo` a cualquier página; todo se guarda solo en el navegador.

## Detección de conceptos

El panel busca en lo que escribe cada grupo los conceptos definidos en la guía:
- ignora tildes y mayúsculas;
- un `*` al final de una palabra admite cualquier terminación;
- `+` exige dos palabras a la vez;
- si la palabra va precedida de «no», «sin», «ni»… (dentro de la misma frase), la marca como negada.

**Es una ayuda para orientar el plenario, no una corrección.**

## Crear o actualizar una actividad

1. Rellena una de las plantillas de `plantilla/` (tipo 1 o tipo 2). Las columnas amarillas son la clave y solo van a la guía.
2. Convierte el Excel:
   ```
   python3 xlsx2deaba.py MiActividad.xlsx actividades/ /ruta/privada/guias/
   ```
   Se generan dos archivos:
   - `<id>.json`: lo que ven los grupos. Va al repositorio, en `actividades/`, y se añade a `actividades/index.json`.
   - `<id>.guia.json`: la guía y la clave. **No va al repositorio.** Se sube desde el panel («Subir guía»), solo con la cuenta de administrador, y queda en Firestore (`deaba_guias`), legible solo por el profesorado.
3. El identificador sigue el formato `condición_tipo_nivel` (p. ej., `diabetes_t1_medium`).

## Reglas de Firestore

DEAba usa las colecciones `deaba_sesiones` (con la subcolección `grupos`) y `deaba_guias`. Copia `firestore.rules` en Firebase → Firestore → Reglas → Publicar antes de usarlo con grupos reales.

Las reglas garantizan que:
- cada grupo solo lee y edita su propio documento;
- después de enviar, el grupo solo puede escribir su revisión;
- la nota y los avisos los escribe el profesor de la sesión.

Alfonso Olaya Abril · Departamento de Bioquímica y Biología Molecular · Universidad de Córdoba
