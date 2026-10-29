# QUAESTIA

Autoevaluación y autoaprendizaje de **Bioquímica metabólica**, con preguntas clasificadas según la taxonomía de Bloom (B1 Recordar → B6 Crear). Bilingüe (ES/EN). Parte de BIOCOGNIA.

- **Banco de preguntas:** Guía de Bioquímica Metabólica (Universidad de Córdoba), https://doi.org/10.5281/zenodo.22299277. Para citar las preguntas, cita la Guía; el banco no forma parte del registro del software.
- **Versión:** 0.3.2 (estudiante, profesorado y envío automático opcional).

## Qué hace

- **Entrenamiento:** temas, 10/15/20 preguntas, filtros por sección y nivel de Bloom; corrección inmediata con justificación.
- **Simulacro:** 50 preguntas con el reparto del examen (5/10/10/5/6/7/7 por tema), corrección al entregar.
- **Preguntas cortas:** respuesta escrita, comparación con la del manual y autoevaluación.
- **Mi progreso:** historial, nota media, evolución y rendimiento por nivel de Bloom.
- **Profesorado:** crear tests por tema, nivel de Bloom o selección de preguntas, y compartirlos por enlace (`?test=…`), en versión imprimible con varios modelos o en Moodle XML; proponer preguntas (por GitHub o correo); guía «Cómo contribuir» y página de colaboradores.
- **Exportación para investigación:** JSON y CSV en formato largo (un ítem por fila), solo si la persona ha dado su consentimiento.

### Puntuación

Cada pregunta vale 1 punto repartido entre sus opciones correctas (1, ½ o ⅓); cada opción incorrecta marcada resta 0,2; se pueden marcar como máximo 3 opciones. La nota, sobre 10, no baja de 0. Los parámetros están en el objeto `CONFIG` de `index.html`.

## Privacidad

No hay servidor ni cuentas. Todo se guarda en el navegador de cada persona (`localStorage`). Las exportaciones llevan un código aleatorio nuevo y no incluyen nombre ni correo. El consentimiento para investigación es opcional y revocable; la aplicación funciona igual sin él.

## Envío automático de datos (Firebase, apagado por defecto)

Sin activar, la app no envía nada a ningún servidor. Activado, las respuestas de quien participa en el estudio (enlace de grupo + consentimiento) se envían a Firestore (región UE) con un identificador anónimo, y el equipo investigador las descarga desde `admin.html`.

**Actívalo solo cuando el Comité Ético haya aprobado la modificación del estudio.**

## Estadísticas de uso anónimas (apagadas por defecto)

Con `uso: true` en `firebase-config.js`, a quien **no** participa en el estudio se le pregunta una vez si acepta que se cuente su uso. Si acepta, al terminar cada test (o al autoevaluar una pregunta corta) se envía a la colección `uso` solo: tipo, modo, temas, número de preguntas, idioma, día y si es el primer envío de ese navegador. Sin identificador, sin respuestas y sin nota. Se puede cambiar en «Mi progreso». Las reglas de Firestore solo admiten esos campos y solo el administrador los lee.

`admin.html` suma estos recuentos a los datos del estudio en «Estadísticas de uso» (por curso, tema y modo; CSV e impresión). **Actívalo solo cuando el Comité Ético haya aprobado la enmienda.**

1. Firebase: proyecto con Firestore en región UE, Authentication con los métodos «Anónimo» y «Google», y `alfonsooa.github.io` en los dominios autorizados.
2. Edita `firebase-config.js`: pega el bloque `firebaseConfig` en `config` (no es secreto) y deja `envio: false` de momento.
3. Abre `https://alfonsooa.github.io/biocognia/quaestia/admin.html`, entra con tu cuenta de Google y copia el identificador que aparece.
4. Copia `../firestore.rules` (en la raíz del repositorio) en Firestore → Reglas, sustituye `PEGA_AQUI_TU_UID` por ese identificador y pulsa «Publicar».
5. Cuando tengas el visto bueno del comité, cambia `envio: false` por `envio: true` en `firebase-config.js`.

**Grupo de prueba.** Entrando con `?grupo=PRUEBA`, la app envía los datos aunque `envio` esté en `false`. Sirve para comprobar el circuito completo sin datos de alumnos; desde `admin.html` se borran con «Borrar datos del grupo PRUEBA».

Quien participa puede borrar lo enviado desde «Mi progreso». Los envíos sin conexión se guardan y se completan en el siguiente uso.

## Enlace para un grupo

La opción de participar en el estudio solo aparece a quien entra por un enlace de grupo; el resto usa la app sin que se registre nada para la investigación. Añadiendo `?grupo=CODIGO` al enlace (letras, números, `-` y `_`, hasta 24 caracteres), las respuestas de quien entre por él quedan etiquetadas con ese código en la exportación, sin datos personales. Ejemplo: `https://alfonsooa.github.io/biocognia/quaestia/?grupo=BQ2627`.

### Semana de uso

Cada persona empieza cuando quiere: la semana se cuenta desde su primera prueba. Todas las respuestas llevan además su fecha absoluta, de modo que, para un grupo concreto, se puede recalcular la semana del curso en el análisis.

## Actualizar el banco

Sustituye el archivo correspondiente en `data/` (`tema01.json` … `tema07.json`, esquema `metahub-tema/1`). Las preguntas cuya traducción no está marcada como `"traduccion": "done"` muestran en inglés un aviso de traducción en revisión.

## Licencia

Pendiente de decidir (código y contenido del banco por separado).
