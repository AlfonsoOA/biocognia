# DEAba Digital

Parte de BIOCOGNIA. Versión digital de la metodología DEAba (análisis de expresión diferencial en Bioquímica Metabólica) para trabajar en grupo en clase y discutir las respuestas en un plenario.

## Dos tipos de actividad

- **Tipo 1 · Interpretar el experimento.** Los grupos reciben las tablas de proteómica y metabolómica con su fold change (FC = condición 1 / condición 2; un valor negativo es −1/valor). Para cada molécula escriben la reacción y eligen la ruta o rutas; después explican el patrón con frases guiadas («[molécula] sube/baja porque … en [ruta]») y dicen qué está ocurriendo.
- **Tipo 2 · Diseñar el experimento.** Los grupos eligen las dos condiciones que comparan (o proponen una propia) y los marcadores de un catálogo que incluye distractores. Para cada marcador dan la reacción, la ruta, la dirección esperada y una estimación del fold change. En el plenario, el profesor «ejecuta el experimento»: cada grupo ve el fold change observado de sus marcadores y puede probar otras parejas de condiciones.

Puntuación por defecto (3 + 3 + 4). Tipo 1: reacciones, rutas y diagnóstico. Tipo 2: condiciones; enzimas, reacciones y rutas; fold change.

## Escribir sin pelearse con el teclado

- **Reacciones y frases.** Al escribir, la app sugiere nombres de metabolitos, cofactores y enzimas (`catalogo.json`, más las moléculas de la propia actividad). Se aceptan con un toque, con Enter o con Tab. Los botones «→» y «+» insertan los símbolos de la reacción. Solo se sugieren **nombres**, nunca reacciones: la app ayuda a escribir, no da la respuesta.
- **Rutas.** Un buscador: se escribe parte del nombre («gluco», «cetog») y se elige de la lista.
- **Ampliar el catálogo y las rutas** (administrador): panel del profesorado → «Catálogo y rutas». Se descarga un Excel con el catálogo actual (hojas Metabolitos, Enzimas y Rutas), se edita y se vuelve a cargar; el panel lo comprueba (repetidos, Ids de ruta, que no falte ninguna ruta que usen las actividades) y genera `catalogo.json` y `rutas.json`, que se suben a esta carpeta.

## Idiomas

La interfaz está en español e inglés. Para que una actividad también se vea en inglés, rellena la columna «Valor (en)» de la hoja «Actividad» (título, contexto, misión y nombres de las condiciones) y las columnas «Nombre (en)». Lo que quede vacío se muestra en español. La guía del profesor está solo en español.

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
- **Idioma del panel:** selector ES | EN en la cabecera (se recuerda en el navegador; también `panel.html?lang=en`). En inglés se traducen los textos del panel (`../comun/panel_i18n.js`) y se muestran en inglés los títulos, el contenido de las actividades y de las guías, los conceptos y la proyección. Las respuestas de los grupos y los nombres de las pestañas y columnas de las plantillas Excel se quedan como están. Para añadir o corregir una traducción, se edita la lista `PANEL_EN` de ese archivo.

## Detección de conceptos

El panel busca en lo que escribe cada grupo los conceptos definidos en la guía:
- ignora tildes y mayúsculas;
- un `*` al final de una palabra admite cualquier terminación;
- `+` exige dos palabras a la vez;
- si la palabra va precedida de «no», «sin», «ni»… (dentro de la misma frase), la marca como negada.

**Es una ayuda para orientar el plenario, no una corrección.**

## Proponer actividades (otro profesorado)

- **Sin cuenta:** `deaba/proponer.html` explica los dos tipos, permite descargar las plantillas y enviar la propuesta por correo (con el Excel adjunto) o abrirla en GitHub (sin el archivo, porque contiene la guía).
- **Con cuenta en el panel:**
  1. «Crear actividad desde Excel». El panel comprueba la hoja con el mismo conversor que `xlsx2deaba.py` y guarda la actividad y su guía en Firestore.
  2. La actividad empieza como **borrador**. Su autor puede probarla en sus sesiones y luego pulsar «Proponer».
  3. El administrador la revisa y la **publica**. Desde ese momento aparece para todo el profesorado, con «Actividad diseñada por…».
- Las actividades del repositorio (`actividades/`) tienen prioridad. Las del panel se guardan en `deaba_actividades` y sus guías en `deaba_guias`.

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

## Cómo citar (Zenodo)

La colección de actividades se publica en Zenodo con un DOI. Cuando exista, pégalo en `coleccion.json` (campo `doi`) y la guía y la versión en papel mostrarán «Cómo citar». Una actividad aportada por otro profesor puede llevar su propio DOI en la fila `doi` de la hoja «Actividad» de la plantilla.
