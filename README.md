# BIOCOGNIA · Open Educational Technology

Ecosistema de herramientas educativas abiertas para aprender Bioquímica, basadas en la taxonomía de Bloom.

- **Autoría y desarrollo:** Alfonso Olaya Abril (Departamento de Bioquímica y Biología Molecular, Universidad de Córdoba).

| Aplicación | Función | Base metodológica | Carpeta | Estado |
| --- | --- | --- | --- | --- |
| QUAESTIA | Evaluación y autoaprendizaje | Guía de Bioquímica Metabólica | `quaestia/` | v0.3 |
| SORTIVIA | Gamificación y toma de decisiones | ESTOPA | `sortivia/` | En desarrollo |
| DEAba Digital | Aprendizaje activo | DEAba | `deaba-digital/` | En desarrollo |

Cada aplicación es independiente (su propia carpeta, versión y registro), pero comparten portada, diseño, procedimiento de consentimiento y formato de exportación.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio `AlfonsoOA/biocognia`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Portada: `https://alfonsooa.github.io/biocognia/` · QUAESTIA: `https://alfonsooa.github.io/biocognia/quaestia/`.

## Versiones

Cada aplicación se etiqueta por separado: `quaestia-v0.1.0`, `sortivia-v0.1.0`, `deaba-digital-v0.1.0`.

## Privacidad y estudio de investigación

No hay servidor ni cuentas: todo se guarda en el navegador de cada persona. La opción de participar en el estudio de investigación solo aparece a quien entra por un enlace de grupo, por ejemplo `https://alfonsooa.github.io/biocognia/?grupo=BQ2627` (la portada conserva el código al entrar en cada aplicación). Quien entra sin él usa las aplicaciones sin que se registre nada para el estudio.

## Propuestas de preguntas

Las propuestas del profesorado llegan como *issues* con la etiqueta `propuesta` (o por correo). Crea esa etiqueta en el repositorio. Las preguntas aprobadas se añaden al JSON del tema con el campo `"propuesta_por": {"nombre": "…", "afiliacion": "…"}`, y la app muestra el crédito y la lista de colaboradores automáticamente.

## Licencia

Pendiente de decidir (código y contenido por separado).
