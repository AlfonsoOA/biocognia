# BIOCOGNIA · Open Educational Technology

**🌐 [Web](https://alfonsooa.github.io/biocognia/)** · **🧪 [QUAESTIA](https://alfonsooa.github.io/biocognia/quaestia/)** · **🔒 [Panel de datos del estudio](https://alfonsooa.github.io/biocognia/quaestia/admin.html)** · **🎲 [Panel de SORTIVIA](https://alfonsooa.github.io/biocognia/sortivia/panel.html)** (solo profesorado) · **✍️ [Proponer una actividad de SORTIVIA](https://alfonsooa.github.io/biocognia/sortivia/proponer.html)** · **🧬 [Panel de DEAba Digital](https://alfonsooa.github.io/biocognia/deaba/panel.html)** (solo profesorado)

Ecosistema de herramientas educativas abiertas para aprender Bioquímica, basadas en la taxonomía de Bloom.

- **Autoría y desarrollo:** Alfonso Olaya Abril (Departamento de Bioquímica y Biología Molecular, Universidad de Córdoba).

| Aplicación | Función | Base metodológica | Carpeta | Estado |
| --- | --- | --- | --- | --- |
| QUAESTIA | Evaluación y autoaprendizaje | Guía de Bioquímica Metabólica | `quaestia/` | v0.3 |
| SORTIVIA | Gamificación y toma de decisiones | ESTOPA | `sortivia/` | v0.7 |
| DEAba Digital | Interpretación y diseño de experimentos de expresión diferencial | DEAba | `deaba/` | v0.2 (30 actividades) |

Cada aplicación es independiente (su propia carpeta, versión y registro), pero comparten portada, diseño, procedimiento de consentimiento y formato de exportación.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio `AlfonsoOA/biocognia`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Portada: `https://alfonsooa.github.io/biocognia/` · QUAESTIA: `https://alfonsooa.github.io/biocognia/quaestia/`.

## App instalable (PWA)

BIOCOGNIA se puede instalar como una app en el móvil o el ordenador, sin tienda de aplicaciones: en Chrome, Edge o Android aparece el botón «Instalar» en la portada (o el icono de instalar en la barra de direcciones); en iPhone o iPad, Safari → Compartir → «Añadir a pantalla de inicio». Se instala una sola app, BIOCOGNIA, con accesos directos a QUAESTIA, SORTIVIA y DEAba Digital (manteniendo pulsado el icono).

- `manifest.webmanifest`: nombre, iconos (`comun/iconos/`) y accesos directos.
- `sw.js` (service worker) y `comun/pwa.js` (lo registra; se carga en todas las páginas): siempre se pide primero la versión de la red, así que los cambios subidos a GitHub se ven en cuanto hay conexión; sin conexión se usa la última copia guardada. QUAESTIA (entrenamiento y simulacro) funciona sin conexión; las sesiones de SORTIVIA y DEAba y los paneles necesitan internet. Firebase no pasa por el service worker.
- Si algún día hay que forzar que todos los dispositivos borren la copia guardada, basta con cambiar `CACHE = "biocognia-v1"` en `sw.js` (p. ej., a `biocognia-v2`).

## Versiones

Cada aplicación se etiqueta por separado: `quaestia-v0.1.0`, `sortivia-v0.1.0`, `deaba-v0.1.0`.

## Privacidad y estudio de investigación

No hay servidor ni cuentas: todo se guarda en el navegador de cada persona. La opción de participar en el estudio de investigación solo aparece a quien entra por un enlace de grupo, por ejemplo `https://alfonsooa.github.io/biocognia/?grupo=BQ2627` (la portada conserva el código al entrar en cada aplicación). Quien entra sin él usa las aplicaciones sin que se registre nada para el estudio.

## Propuestas de preguntas

Las propuestas del profesorado llegan como *issues* con la etiqueta `propuesta` (o por correo). Crea esa etiqueta en el repositorio. Las preguntas aprobadas se añaden al JSON del tema con el campo `"propuesta_por": {"nombre": "…", "afiliacion": "…"}`, y la app muestra el crédito y la lista de colaboradores automáticamente.

## Reglas de seguridad de Firebase

`firestore.rules` contiene las reglas de todo el ecosistema (QUAESTIA y SORTIVIA). Cópialas en Firebase → Firestore → Reglas → Publicar cada vez que cambien.

## Licencia

Pendiente de decidir (código y contenido por separado).
