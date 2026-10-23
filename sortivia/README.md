# SORTIVIA

Actividades de toma de decisiones y gamificación basadas en la metodología **ESTOPA**. Parte de BIOCOGNIA · Open Educational Technology.

- **Autoría y desarrollo:** Alfonso Olaya Abril (Departamento de Bioquímica y Biología Molecular, Universidad de Córdoba).
- **Versión:** 0.2.1.

## Cómo funciona una actividad

1. Cada grupo entra con el código de la sesión (o el enlace `…/sortivia/?s=CÓDIGO`) y un nombre de grupo.
2. Diseña su estrategia: elige el diseño experimental (control frente a problema), los bloques y sus opciones, ve el gasto en directo frente al presupuesto y justifica cada bloque. No puede enviar si se pasa del presupuesto o le faltan decisiones.
3. Al enviar, el panel del profesor calcula los puntos con la clave oculta (puntos de cada opción + reglas de coherencia), los redondea hacia abajo a decenas y asigna ese número de «números» de 10 (87 puntos → 8 números).
4. El grupo elige sus números y pide el sorteo. El panel saca un número del 1 al 10: si es uno de los suyos, gana.
5. Si pierde, pasa a la siguiente ronda con su estrategia anterior y solo conoce su total de puntos. Hay 2 rondas.

## Panel del profesor (`panel.html`)

Entrar con la cuenta de Google autorizada en `../firestore.rules`. Desde el panel:

- **Cargar la clave** de cada actividad (archivo `*.clave.json`, que **no** se sube al repositorio). Se guarda en Firebase y solo la puede leer el profesor.
- **Crear sesiones** y repartir el código o el enlace.
- **Seguir a los grupos en directo** y hacer de **árbitro**: con «Árbitro automático» activado, el panel calcula puntos y hace los sorteos en cuanto los grupos lo piden. Debe estar abierto durante la clase.
- Ver las decisiones con sus puntos, las reglas de coherencia que han saltado y las justificaciones; reabrir o reiniciar un grupo.
- Descargar las decisiones y las justificaciones en CSV.

## Modo demostración

Añadiendo `?demo` a la dirección (`…/sortivia/panel.html?demo` y `…/sortivia/?s=CÓDIGO&demo`), todo funciona sin servidor dentro de un mismo navegador: útil para probar una actividad con dos pestañas.

## Añadir o modificar una actividad

1. Edita la hoja de claves en formato v2 (como `ESTOPA_BMSi_Keys_v2.xlsx`), con tres pestañas:
   - **Actividad**: identificador, títulos, resumen, presupuesto, rondas, números del sorteo y puntos por número.
   - **Opciones**: Bloque · Decisión · Grupo · Opción · Tipo de coste · Precio · Puntos · Notas · Selección (*única* o *múltiple*: si se pueden elegir varias opciones en esa decisión). Tipos de coste: *réplicas* (precio por muestra), *por muestra*, *multiplicador*, *fijo*, *por unidad* (contadores, como las validaciones) y *condiciones* (diseño experimental).
   - **Reglas**: reglas de coherencia ocultas, del tipo `metaproteomics/prodigal=yes & !genomic & !metagenomics` → −10 puntos.
2. Conviértela: `python3 xlsx2sortivia.py hoja_v2.xlsx actividades/ claves/`. Comprueba que las reglas apuntan a opciones existentes, genera `actividades/<id>.json` (pública) y `claves/<id>.clave.json` (privada), y añade al Excel una pestaña «Identificadores» con los nombres que usan las reglas.
3. Si es una actividad nueva, añádela a `actividades/index.json`. Sube la actividad al repositorio y carga la clave en el panel (nunca la subas al repositorio).

**Coste de cada bloque ómico** = condiciones × réplicas × (precio por muestra + Σ «por muestra») × Π «multiplicador» + Σ «fijo» + Σ unidades × «por unidad».
