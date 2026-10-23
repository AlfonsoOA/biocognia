# SORTIVIA

Actividades de toma de decisiones y gamificación basadas en la metodología **ESTOPA**. Parte de BIOCOGNIA · Open Educational Technology.

- **Autoría y desarrollo:** Alfonso Olaya Abril (Departamento de Bioquímica y Biología Molecular, Universidad de Córdoba).
- **Versión:** 0.1.0.

## Cómo funciona una actividad

1. Cada grupo entra con el código de la sesión (o el enlace `…/sortivia/?s=CÓDIGO`) y un nombre de grupo.
2. Diseña su estrategia: elige bloques y opciones, ve el gasto en directo frente al presupuesto y justifica cada bloque. No puede enviar si se pasa del presupuesto o le faltan decisiones.
3. Al enviar, el panel del profesor calcula los puntos con la clave (oculta), los redondea hacia abajo a decenas y asigna ese número de «números» de 10 (87 puntos → 8 números).
4. El grupo elige sus números y pide el sorteo. El panel saca un número del 1 al 10: si es uno de los suyos, gana.
5. Si pierde, pasa a la siguiente ronda con su estrategia anterior y solo conoce su total de puntos. Hay 2 rondas.

## Panel del profesor (`panel.html`)

Entrar con la cuenta de Google autorizada en `../firestore.rules`. Desde el panel:

- **Cargar la clave** de cada actividad (archivo `*.clave.json`, que **no** se sube al repositorio). Se guarda en Firebase y solo la puede leer el profesor.
- **Crear sesiones** y repartir el código o el enlace.
- **Seguir a los grupos en directo** y hacer de **árbitro**: con «Árbitro automático» activado, el panel calcula puntos y hace los sorteos en cuanto los grupos lo piden. Debe estar abierto durante la clase.
- Ver las decisiones con sus puntos y las justificaciones; reabrir o reiniciar un grupo.
- Descargar las decisiones y las justificaciones en CSV.

## Modo demostración

Añadiendo `?demo` a la dirección (`…/sortivia/panel.html?demo` y `…/sortivia/?s=CÓDIGO&demo`), todo funciona sin servidor dentro de un mismo navegador: útil para probar una actividad con dos pestañas.

## Añadir una actividad

1. Prepara la hoja de claves con las columnas *Decisión · Subdecisión · Opción · Precio · Puntos* (como `ESTOPA_BMSi_Keys.xlsx`). Los precios pueden ser fijos (`500`), de réplicas (base) o multiplicadores (`x2`).
2. Conviértela con `xlsx2sortivia.py`: genera `actividades/<id>.json` (pública, sin puntos) y `<id>.clave.json` (privada).
3. Añade la actividad a `actividades/index.json` y carga la clave en el panel.

**Coste de cada bloque** = réplicas × multiplicadores (librería, profundidad…) + costes fijos.
