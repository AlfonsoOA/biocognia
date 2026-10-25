# SORTIVIA

Actividades de toma de decisiones y gamificación basadas en la metodología **ESTOPA**. Parte de BIOCOGNIA · Open Educational Technology.

- **Autoría y desarrollo:** Alfonso Olaya Abril (Departamento de Bioquímica y Biología Molecular, Universidad de Córdoba).
- **Versión:** 0.6.2.

## Cómo funciona una actividad

1. Cada grupo entra con el código de la sesión (o el enlace `…/sortivia/?s=CÓDIGO`) y un nombre de grupo.
2. Diseña su estrategia: elige el diseño experimental (control frente a problema), los bloques y sus opciones, ve el gasto en directo frente al presupuesto y justifica cada bloque. No puede enviar si se pasa del presupuesto o le faltan decisiones.
3. Al enviar, el panel del profesor calcula los puntos con la clave oculta (puntos de cada opción + reglas de coherencia), los redondea hacia abajo a decenas y asigna ese número de «números» de 10 (87 puntos → 8 números).
4. El grupo elige sus números y pide el sorteo. El panel saca un número del 1 al 10: si es uno de los suyos, gana.
5. Si pierde, pasa a la siguiente ronda con su estrategia anterior y solo conoce su total de puntos. Hay 2 rondas.

## Panel del profesorado (`panel.html`)

Se entra con Google. Hay dos papeles:

- **Administrador** (cuentas de `SV_ADMINS` en `sortivia.js` y de `esAdmin()` en `../firestore.rules`): ve todas las sesiones, autoriza al profesorado (pestaña **Profesorado**), carga las claves de las actividades del repositorio y publica, devuelve o retira las actividades creadas en el panel.
- **Profesor autorizado**: una cuenta de Google que el administrador ha dado de alta con su UID. Crea sus propias sesiones y solo ve las suyas y sus grupos; usa las actividades publicadas y puede crear actividades nuevas. No tiene acceso a los datos de QUAESTIA.

Una cuenta sin autorizar ve un aviso con su identificador (UID) para enviárselo al administrador, que lo pega en «Profesorado → Autorizar».

En cada sesión: código y enlace para los grupos, **árbitro automático** (calcula puntos y hace los sorteos; el panel debe estar abierto durante la clase), detalle de cada grupo (puntos, mejor opción de cada decisión fallada, reglas que han saltado, justificaciones), reabrir o reiniciar grupos, **Publicar las mejores elecciones** cuando el profesor quiera y descarga en CSV/JSON.

## Crear una actividad desde Excel (en el panel)

1. Rellena `plantilla/Plantilla_SORTIVIA.xlsx` (hay un ejemplo completo en `plantilla/Ejemplo_SORTIVIA.xlsx` y las instrucciones están en la propia hoja y en `proponer.html`).
2. Panel → **Crear actividad desde Excel** → carga la hoja. El navegador (SheetJS + `conversor.js`) la comprueba, busca la estrategia óptima dentro del presupuesto (unos 30 s en una actividad grande) y fija la escala para que esa estrategia obtenga `puntos_objetivo`.
3. Se guarda en Firebase: la actividad en `actividades/{id}` (estados *borrador → propuesta → publicada*) y la clave en `claves/{id}`, que solo lee el profesorado autorizado.
   - Un profesor la guarda como **borrador**, la prueba en una sesión suya y pulsa **Proponer**. El administrador la revisa y la **publica**; desde entonces está disponible para cualquier profesor y los grupos ven «Actividad diseñada por …».
   - El administrador puede publicar directamente.
4. «JSON» descarga la actividad y su clave por si se quiere pasar al repositorio (`actividades/`; la clave nunca).

Quien no tenga cuenta puede proponer una actividad desde `proponer.html`: envía el Excel por correo (la hoja contiene la clave, así que no se sube a GitHub; en GitHub solo se abre la propuesta, con la etiqueta `propuesta-sortivia`).

## Modo demostración

Añadiendo `?demo` a la dirección (`…/sortivia/panel.html?demo` y `…/sortivia/?s=CÓDIGO&demo`), todo funciona sin servidor dentro de un mismo navegador: útil para probar una actividad con dos pestañas. `panel.html?demo&rol=profesor` simula una cuenta de profesor (el UID de demostración es `demo-profesor`).

## Actualizar una actividad sin romperla

- Precios, puntos, textos en español y el orden de las filas se cambian libremente.
- Los identificadores salen de los textos en inglés (Bloque, Decisión, Opción). **Lo que va entre corchetes no cuenta**: «de novo [SPAdes, Flye]» → `de-novo`. Pon entre corchetes los programas o ejemplos que se quedan anticuados y podrás actualizarlos sin tocar las reglas.
- Si cambias el resto del texto en inglés o borras una opción que usa una regla, el conversor avisa de qué regla falla.
- No modifiques una actividad mientras haya una sesión en marcha con ella.

## Cómo se puntúa

- Cada opción suma o resta los puntos de la clave. En las decisiones de **varias opciones** cuenta la mejor opción positiva marcada y **restan todas las negativas** (las trampas).
- Los bloques se agrupan por **objetivos de la misión** (genoma, expresión génica, proteínas, producto, validación): en cada objetivo cuenta el bloque con más puntos. De los demás bloques solo cuentan sus errores; hacer dos bloques del mismo objetivo solo gasta más.
- Las **reglas de coherencia** suman o restan. Las que llevan «Bloque» suman a ese bloque (solo cuentan si es el que puntúa en su objetivo).
- **Escala:** el conversor busca la mejor estrategia posible dentro del presupuesto y escala los puntos para que obtenga `puntos_objetivo` (99 → 9 números): nadie tiene la victoria asegurada. La estrategia encontrada se escribe en la pestaña «Estrategia óptima» del Excel.

## Añadir o modificar una actividad con Python (alternativa)

1. Edita la hoja de claves (como `ESTOPA_BMSi_Keys_v2.xlsx`):
   - **Actividad**: identificador, títulos y resúmenes (es/en), presupuesto, rondas, números del sorteo, puntos por número y `puntos_objetivo`.
   - **Bloques**: nombre en inglés y español y objetivo de la misión de cada bloque.
   - **Opciones**: Bloque · Decisión · Grupo · Opción · Tipo de coste · Precio · Puntos · Notas · Selección (*única* o *múltiple*) · Decisión (ES) · Opción (ES) · Grupo (ES). Tipos de coste: *réplicas* (precio por muestra), *por muestra*, *multiplicador*, *fijo*, *por unidad* (contadores, como las validaciones) y *condiciones* (diseño experimental).
   - **Reglas**: ID · Condición · Puntos · Explicación (ES) · Explicación (EN) · Bloque (opcional). Ejemplo de condición: `metaproteomics/prodigal=yes & !genomic & !metagenomics`.
2. Conviértela: `python3 xlsx2sortivia.py hoja.xlsx actividades/ claves/` (tarda unos minutos porque busca la estrategia óptima; `--rapido` para pruebas). Comprueba las reglas, genera `actividades/<id>.json` (pública) y `claves/<id>.clave.json` (privada), y añade al Excel las pestañas «Identificadores» y «Estrategia óptima».
3. Si es una actividad nueva, añádela a `actividades/index.json`. Sube la actividad al repositorio y carga la clave en el panel (nunca la subas al repositorio).

**Réplicas comunes.** Un bloque sin decisión de réplicas usa las del primer bloque que la tenga: así una actividad de un solo flujo (como la de LCR) define el diseño y las réplicas una vez y todos sus pasos se pagan por muestra.

**Coste de cada bloque ómico** = condiciones × réplicas × (precio por muestra + Σ «por muestra») × Π «multiplicador» + Σ «fijo» + Σ unidades × «por unidad».
