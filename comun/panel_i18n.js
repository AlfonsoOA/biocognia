/* BIOCOGNIA · idioma de los paneles del profesorado (DEAba Digital y SORTIVIA).
   El panel se escribe en español; si se elige inglés, este módulo traduce el texto que aparece en pantalla
   (nodos de texto y atributos placeholder/title/aria-label) con el diccionario de abajo. Lo que no está en el
   diccionario (títulos de actividades, nombres de grupos, respuestas) se deja tal cual: el contenido de las
   actividades ya se muestra en el idioma del panel por su cuenta. Se carga ANTES del script del panel. */
"use strict";
const PANEL_LANG = (() => {
  try { const q = new URLSearchParams(location.search).get("lang"); if (q === "es" || q === "en") { localStorage.setItem("bc.panel.lang", q); return q; } } catch (e) {}
  try { const s = localStorage.getItem("bc.panel.lang"); if (s === "es" || s === "en") return s; } catch (e) {}
  return (navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en";
})();

// [español, inglés]. {0}, {1}… = partes variables. El inglés puede ser una función de las partes.
const PANEL_EN = [
  // ---------- comunes ----------
  ["Panel del profesorado", "Teacher panel"], ["Entrar con Google", "Sign in with Google"], ["Modo demostración: todo se guarda en este navegador", "Demo mode: everything is stored in this browser"],
  ["← Inicio", "← Home"], ["Inicio", "Home"], ["Cerrar sesión", "Close session"], ["Reabrir sesión", "Reopen session"], ["Guardar", "Save"], ["Cancelar", "Cancel"],
  ["¿Seguro? Pulsa otra vez", "Sure? Click again"], ["Eliminar", "Delete"], ["Publicar", "Publish"], ["Proponer", "Propose"], ["A borrador", "Back to draft"], ["JSON", "JSON"],
  ["Nueva sesión", "New session"], ["Crear", "Create"], ["Crear sesión", "Create session"], ["Formativa", "Formative"], ["Evaluación (con calificación)", "Assessment (graded)"],
  ["Todavía no hay sesiones.", "No sessions yet."], ["Sesiones (todas)", "Sessions (all)"], ["Tus sesiones", "Your sessions"], ["Actividades", "Activities"], ["Actividad", "Activity"],
  ["Código", "Code"], ["Nombre", "Name"], ["Modo", "Mode"], ["Estado", "Status"], ["Profesor", "Teacher"], ["Tipo", "Type"], ["Nivel", "Level"], ["Asignatura", "Subject"], ["Guía", "Guide"],
  ["Grupos", "Groups"], ["Grupo", "Group"], ["Abierta", "Open"], ["Cerrada", "Closed"], ["abierta", "open"], ["cerrada", "closed"], ["formativa", "formative"], ["evaluacion", "assessment"],
  ["publicada", "published"], ["borrador", "draft"], ["propuesta", "proposal"], ["Publicada", "Published"], ["Borrador", "Draft"], ["Propuesta", "Proposal"],
  ["guía", "guide"], ["sin guía", "no guide"], ["Subir guía", "Upload guide"], ["Subir guías (varias)", "Upload guides (several)"], ["Cómo se diseña una actividad", "How to design an activity"],
  ["Crear actividad desde Excel", "Create activity from Excel"], ["Catálogo y rutas", "Catalogue and pathways"], ["Estadísticas de uso", "Usage statistics"], ["Profesorado", "Teachers"],
  ["Sesiones y actividades", "Sessions and activities"], ["Enlace para los grupos", "Link for the groups"], ["Copiar", "Copy"], ["Enlace copiado.", "Link copied."], ["Código para los grupos", "Code for the groups"],
  ["Descargar CSV", "Download CSV"], ["Imprimir / PDF", "Print / PDF"], ["Imprimir", "Print"], ["Volver", "Back"], ["Cuenta no autorizada", "Account not authorised"],
  ["administrador", "administrator"], ["profesor", "teacher"], ["Administrador (demo)", "Administrator (demo)"], ["Profesora de prueba", "Test teacher"], ["Tú", "You"],
  ["Firebase no permite esta operación con tu cuenta (¿están publicadas las reglas nuevas de Firestore?).", "Firebase does not allow this operation with your account (are the new Firestore rules published?)."],
  ["El navegador ha bloqueado la ventana: permite las ventanas emergentes para este sitio.", "The browser blocked the window: allow pop-ups for this site."],
  ["Nombre (p. ej., BQ 2.º A · grupo de tarde)", "Name (e.g., Biochem 2A · afternoon group)"], ["Nombre (p. ej., BMSi 2026-27 · grupo A)", "Name (e.g., SMB 2026-27 · group A)"],
  ["Esta cuenta ({0}) todavía no tiene acceso. Envía al administrador (b22olaba@uco.es) tu nombre, tu centro y este identificador:", "This account ({0}) does not have access yet. Send the administrator (b22olaba@uco.es) your name, your institution and this identifier:"],
  ["Esta cuenta ({0}) todavía no tiene acceso al panel. Para usar SORTIVIA con tus grupos, envía al administrador (b22olaba@uco.es) tu nombre, tu centro y este identificador:", "This account ({0}) does not have access to the panel yet. To use SORTIVIA with your groups, send the administrator (b22olaba@uco.es) your name, your institution and this identifier:"],
  ["{0} · {1} grupos · {2} enviadas", "{0} · {1} groups · {2} submitted"], ["{0} grupos con respuesta", "{0} groups with an answer"],
  ["Ya existe «{0}» ({1}): al guardar se sustituirá por esta versión.", "«{0}» already exists ({1}): saving will replace it with this version."],
  ["Leyendo la hoja…", "Reading the sheet…"], ["Leyendo el Excel…", "Reading the Excel file…"],
  ["La hoja «{0}» tiene {1} problema{2}.", "The sheet «{0}» has {1} problem{2}."], ["Corrígelos en el Excel y vuelve a cargarla:", "Fix them in the Excel file and load it again:"],
  ["Corrígelos en el Excel y vuelve a cargarlo:", "Fix them in the Excel file and load it again:"], ["Corrígelos y vuelve a cargarlo:", "Fix them and load it again:"],
  ["Guardar y publicar", "Save and publish"], ["Guardar como borrador", "Save as draft"], ["Cargar otra hoja", "Load another sheet"], ["Cargar hoja Excel (.xlsx)", "Load Excel sheet (.xlsx)"],
  ["«{0}» publicada: ya se puede usar en cualquier sesión.", "«{0}» published: it can now be used in any session."],
  ["«{0}» enviada al administrador para su revisión.", "«{0}» sent to the administrator for review."], ["«{0}» publicada.", "«{0}» published."], ["«{0}» ha vuelto a borrador.", "«{0}» is back to draft."], ["«{0}» eliminada.", "«{0}» deleted."],
  ["No se ha podido cargar", "Could not load"], ["…y {0} más.", "…and {0} more."], ["Sin asignatura", "No subject"],

  // ---------- DEAba: inicio y actividades ----------
  ["Panel del profesorado de DEAba Digital: crea sesiones, sigue a los grupos en directo, proyecta las respuestas en el plenario, consulta la guía de cada actividad y califica. Usa la misma cuenta autorizada que SORTIVIA.",
   "DEAba Digital teacher panel: create sessions, follow the groups live, project the answers in the plenary, read each activity's guide and grade. Uses the same authorised account as SORTIVIA."],
  ["{0} La guía del profesor (respuestas esperadas y preguntas para el plenario) nunca está en el repositorio: solo la ve el profesorado.", "{0} The teacher guide (expected answers and plenary questions) is never in the repository: only teachers see it."],
  ["Las actividades que propone el profesorado aparecen como «propuesta»: revísalas (guía incluida) y publícalas.", "Activities proposed by teachers appear as «proposal»: review them (including the guide) and publish them."],
  ["Crea tu actividad desde la plantilla Excel, pruébala en una sesión tuya (como borrador) y pulsa «Proponer» cuando esté lista: el administrador la revisa y la publica con tu nombre.", "Create your activity from the Excel template, try it in one of your sessions (as a draft) and click «Propose» when it is ready: the administrator reviews it and publishes it under your name."],
  ["Ya existe una actividad publicada en el repositorio con el id «{0}». Cambia el id en la hoja «Actividad».", "There is already a published activity in the repository with the id «{0}». Change the id in the «Actividad» sheet."],
  ["El id «{0}» ya lo usa una actividad de otra persona. Cambia el id en la hoja «Actividad».", "The id «{0}» is already used by someone else's activity. Change the id in the «Actividad» sheet."],
  ["«{0}» ya está publicada: para cambiarla, pide al administrador que la devuelva a borrador.", "«{0}» is already published: to change it, ask the administrator to return it to draft."],
  ["{0} · {1} conceptos · guía: {2}", "{0} · {1} concepts · guide: {2}"], ["vacía", "empty"],
  ["{0} moléculas", "{0} molecules"], ["{0} condiciones · {1} marcadores en el catálogo (se piden {2} enzimas y {3} metabolitos)", "{0} conditions · {1} markers in the catalogue ({2} enzymes and {3} metabolites requested)"],
  ["Sin textos en inglés: quien use la app en inglés verá la actividad en español.", "No English texts: anyone using the app in English will see the activity in Spanish."],
  ["Descargar JSON (actividad y guía)", "Download JSON (activity and guide)"], ["Crear una actividad desde una hoja Excel", "Create an activity from an Excel sheet"],
  ["Rellena la plantilla del", "Fill in the template for"], ["tipo 1 (interpretar)", "type 1 (interpret)"], ["o del", "or for"], ["tipo 2 (diseñar)", "type 2 (design)"],
  [". Las instrucciones están dentro y en la", ". The instructions are inside and on the"], ["página para proponer actividades", "page for proposing activities"],
  ["Cárgala aquí: el panel comprueba la hoja y separa lo que ven los grupos de la guía del profesor.", "Load it here: the panel checks the sheet and separates what the groups see from the teacher guide."],
  ["Guárdala como borrador para probarla en una sesión, o publícala directamente.", "Save it as a draft to try it in a session, or publish it directly."],
  ["Guárdala como borrador, pruébala en una sesión tuya y, cuando esté lista, pulsa «Proponer» en la lista de actividades.", "Save it as a draft, try it in one of your sessions and, when it is ready, click «Propose» in the activity list."],
  ["«{0}» guardada como borrador. Pruébala creando una sesión.", "«{0}» saved as a draft. Try it by creating a session."],
  ["«{0}» guardada como borrador. Pruébala creando una sesión y, cuando esté lista, pulsa «Proponer».", "«{0}» saved as a draft. Try it by creating a session and, when it is ready, click «Propose»."],
  ["Has elegido el archivo de la actividad ({0}.json, lo que ven los grupos). La guía es «{1}.guia.json»: está en la carpeta guias_json del zip de claves (DEAba_tandaN_claves.zip), nunca en el repositorio.",
   "You chose the activity file ({0}.json, what the groups see). The guide is «{1}.guia.json»: it is in the guias_json folder of the keys zip (DEAba_tandaN_claves.zip), never in the repository."],
  ["Este archivo es la guía de «{0}», no de «{1}».", "This file is the guide for «{0}», not for «{1}»."], ["El archivo no es un JSON válido.", "The file is not valid JSON."],
  ["Este archivo no es una guía de DEAba (debe llamarse «….guia.json»).", "This file is not a DEAba guide (its name must end in «.guia.json»)."],
  ["{0}: no hay ninguna actividad con el id «{1}»", "{0}: there is no activity with the id «{1}»"], ["{0}: no puedes cambiar la guía de «{1}»", "{0}: you cannot change the guide of «{1}»"],
  ["Subiendo {0} archivo{1}…", "Uploading {0} file{1}…"], ["Guía de «{0}» cargada.", "Guide for «{0}» loaded."],
  ["No se han cargado: {0}", "Not loaded: {0}"],
  // catálogo
  ["Catálogo del autocompletado y rutas", "Autocomplete catalogue and pathways"], ["Descargar el Excel del catálogo", "Download the catalogue Excel"], ["Cargar otro Excel", "Load another Excel file"], ["Cargar el Excel editado", "Load the edited Excel file"],
  ["Descarga el Excel con el catálogo actual y edítalo: añade, corrige o borra filas en «Metabolitos», «Enzimas» o «Rutas».", "Download the Excel file with the current catalogue and edit it: add, fix or delete rows in «Metabolitos», «Enzimas» or «Rutas»."],
  ["Cárgalo aquí: el panel lo comprueba (nombres repetidos, Ids de ruta válidos, que no falte ninguna ruta que usen las actividades) y te enseña qué cambia.", "Load it here: the panel checks it (repeated names, valid pathway Ids, no missing pathway used by the activities) and shows you what changes."],
  ["Descarga los dos archivos que genera y súbelos a GitHub.", "Download the two files it generates and upload them to GitHub."],
  ["El Excel «{0}» tiene {1} problema{2}.", "The Excel file «{0}» has {1} problem{2}."], ["Descargar catalogo.json y rutas.json", "Download catalogo.json and rutas.json"],
  ["No hay nombres ni rutas nuevos o eliminados (puede haber cambios de texto o de traducción).", "No new or deleted names or pathways (there may be text or translation changes)."],
  ["Sube los dos archivos a la carpeta", "Upload both files to the"], ["del repositorio en GitHub, sustituyendo a los actuales («Add file» → «Upload files»). Los cambios se verán en la app en un par de minutos (si no, recargad la página sin caché).", "folder of the GitHub repository, replacing the current ones («Add file» → «Upload files»). The changes will show in the app in a couple of minutes (if not, reload the page without cache)."],
  ["Ahora:", "Now:"], ["metabolitos,", "metabolites,"], ["enzimas y", "enzymes and"], ["rutas. Los nombres solo sirven para que el autocompletado ayude a escribir; nunca muestran reacciones.", "pathways. The names only help the autocomplete with spelling; they never show reactions."],
  ["Excel correcto:", "Excel file OK:"], ["{0} metabolitos · {1} enzimas · {2} rutas.", "{0} metabolites · {1} enzymes · {2} pathways."],
  ["Metabolitos nuevos ({0}): {1}", "New metabolites ({0}): {1}"], ["Metabolitos eliminados ({0}): {1}", "Deleted metabolites ({0}): {1}"], ["Enzimas nuevas ({0}): {1}", "New enzymes ({0}): {1}"],
  ["Enzimas eliminadas ({0}): {1}", "Deleted enzymes ({0}): {1}"], ["Rutas nuevas ({0}): {1}", "New pathways ({0}): {1}"], ["Rutas eliminadas ({0}): {1}", "Deleted pathways ({0}): {1}"],
  // ---------- DEAba: sesión ----------
  ["Grupos", "Groups"], ["Por molécula", "By molecule"], ["Condiciones y marcadores", "Conditions and markers"], ["Conceptos", "Concepts"],
  ["Proyectar (plenario)", "Project (plenary)"], ["Guía del profesor", "Teacher guide"], ["sin guía cargada", "no guide loaded"], ["Versión en papel", "Paper version"],
  ["Ejecutar el experimento (mostrar resultados)", "Run the experiment (show results)"], ["Ocultar los resultados", "Hide the results"],
  ["Los grupos que ya han enviado ven ahora el fold change observado de sus marcadores y pueden probar otras condiciones.", "Groups that have submitted now see the observed fold change of their markers and can try other conditions."],
  ["Todavía no se ha unido ningún grupo. Comparte el código o el enlace.", "No group has joined yet. Share the code or the link."], ["Sin respuestas todavía.", "No answers yet."], ["Todavía no ha escrito nada.", "Nothing written yet."],
  ["Trabajando", "Working"], ["Enviada", "Submitted"], ["lista para enviar", "ready to submit"], ["Falta: {0}", "Missing: {0}"], ["falta {0}", "{0} missing"],
  ["Grupo {0}", "Group {0}"], ["({0}/{1} palabras clave)", "({0}/{1} keywords)"], ["Rutas elegidas ({0} grupos)", "Pathways chosen ({0} groups)"], ["Frases sobre esta molécula", "Sentences about this molecule"],
  ["Clave:", "Key:"], ["Rutas:", "Pathways:"], ["Compartimento:", "Compartment:"], ["Por qué:", "Why:"], ["¿Por qué esta comparación?", "Why this comparison?"],
  ["Sube la guía de la actividad para ver qué conceptos aparecen en las respuestas.", "Upload the activity guide to see which concepts appear in the answers."], ["% de grupos", "% of groups"],
  ["● aparece · ◌ aparece pero en negativo («no», «sin»…) · ⚠ concepto erróneo · ◇ interpretación alternativa. Es una ayuda para orientar el plenario, no una corrección.", "● appears · ◌ appears but negated («no», «without»…) · ⚠ wrong concept · ◇ alternative interpretation. It is a guide for the plenary, not a mark."],
  ["Comparación:", "Comparison:"], ["Revisión tras los resultados", "Revision after the results"], ["Guardar nota", "Save mark"], ["Nota guardada.", "Mark saved."], ["nota: {0}", "mark: {0}"], ["nota total", "total mark"],
  ["Aviso para este grupo (lo ve en su pantalla)", "Message for this group (shown on their screen)"], ["Enviar aviso", "Send message"], ["Dejar que lo cambie", "Let them change it"], ["Eliminar grupo", "Delete group"],
  ["Comentario para el grupo", "Comment for the group"], ["Comentario", "Comment"], ["Reacciones", "Reactions"], ["Rutas", "Pathways"], ["Diagnóstico", "Diagnosis"],
  ["Interpretar el experimento", "Interpret the experiment"], ["Diseñar el experimento", "Design the experiment"], ["Tipo 1 · interpretar", "Type 1 · interpret"], ["Tipo 2 · diseñar", "Type 2 · design"],
  ["¿Qué está ocurriendo en la {0}?", "What is happening in {0}?"], ["¿Qué habéis comparado?", "What did you compare?"], ["¿Qué marcadores habéis elegido?", "Which markers did you choose?"],
  ["¿Qué demostraría vuestro experimento?", "What would your experiment show?"], ["¿Qué ideas han aparecido?", "Which ideas came up?"], ["Para el plenario", "For the plenary"],
  ["Mostrar la clave", "Show the key"], ["Nombres de los grupos", "Group names"], ["Salir de la proyección", "Leave projection"], ["La nota de «{0}» debe estar entre 0 y {1}.", "The mark for «{0}» must be between 0 and {1}."],
  ["Molécula", "Molecule"], ["Reacción", "Reaction"], ["Marcador", "Marker"], ["FC esperado", "Expected FC"], ["Respuesta del grupo", "Group answer"], ["Respuestas", "Answers"],
  ["Estadísticas de uso · DEAba Digital", "Usage statistics · DEAba Digital"],
  // ---------- SORTIVIA ----------
  ["Panel del profesorado: crea sesiones, sigue a los grupos en directo, haz de árbitro (puntos y sorteos) y convierte tus hojas de claves en actividades. Hace falta una cuenta autorizada por el administrador.",
   "Teacher panel: create sessions, follow the groups live, act as referee (points and draws) and turn your key sheets into activities. You need an account authorised by the administrator."],
  ["¿Quieres proponer una actividad?", "Want to propose an activity?"], ["proponer una actividad", "propose an activity"], ["sin cuenta.", "without an account."],
  ["Decidiendo", "Deciding"], ["Eligiendo números", "Choosing numbers"], ["Sorteo pedido", "Draw requested"], ["Ganado", "Won"], ["Fallado", "Lost"], ["Terminado", "Finished"],
  ["No se ha podido procesar el grupo «{0}»: {1}. Se reintentará.", "Could not process group «{0}»: {1}. It will be retried."], ["Hay que elegir exactamente {0} números.", "Exactly {0} numbers must be chosen."],
  ["{0} clave", "{0} key"], ["Devolver al autor", "Return to author"], ["Retirar", "Withdraw"], ["Retirar propuesta", "Withdraw proposal"], ["Papel", "Paper"], ["Panel · {0}", "Panel · {0}"],
  ["Clave ({0})", "Key ({0})"], ["Sin clave", "No key"], ["Cargar clave", "Load key"], ["Sustituir clave", "Replace key"],
  ["{0} Las claves (puntos de cada opción) nunca se publican en la web: solo las lee el profesorado autorizado.", "{0} The keys (points for each option) are never published on the web: only authorised teachers read them."],
  ["No hay actividades.", "No activities."], ["Plantilla en blanco", "Blank template"], ["plantilla en blanco", "blank template"], ["Estadísticas de uso · SORTIVIA", "Usage statistics · SORTIVIA"],
  ["UID (lo ve al entrar en el panel)", "UID (shown when they sign in to the panel)"], ["Nombre y apellidos", "Full name"], ["Correo (opcional)", "Email (optional)"], ["Centro (p. ej., Universidad de Granada)", "Institution (e.g., University of Granada)"],
  ["Cada profesor entra en este panel con su cuenta de Google. Si no está autorizado, el panel le muestra su identificador (UID) para que te lo envíe; pégalo aquí. Un profesor autorizado puede crear sus propias sesiones (solo ve las suyas y sus grupos), usar las actividades publicadas y convertir y proponer actividades nuevas. No ve los datos de QUAESTIA.",
   "Each teacher signs in to this panel with their Google account. If they are not authorised, the panel shows them their identifier (UID) to send to you; paste it here. An authorised teacher can create their own sessions (they only see theirs and their groups), use the published activities, and convert and propose new activities. They do not see QUAESTIA data."],
  ["Profesorado autorizado", "Authorised teachers"], ["Todavía no has autorizado a nadie.", "You have not authorised anyone yet."], ["Autorizar a un profesor", "Authorise a teacher"], ["Autorizar", "Authorise"],
  ["Autorizado", "Authorised"], ["Desactivado", "Deactivated"], ["Desactivar", "Deactivate"], ["Activar", "Activate"],
  ["El centro solo se usa en las estadísticas de uso. Para añadirlo o cambiarlo a alguien ya autorizado, vuelve a autorizar su UID con el centro.", "The institution is only used in the usage statistics. To add or change it for someone already authorised, authorise their UID again with the institution."],
  ["{0} ya puede entrar en el panel.", "{0} can now sign in to the panel."],
  ["Ya hay una actividad del repositorio con el id «{0}». Cambia el parámetro «id» en la pestaña Actividad.", "There is already a repository activity with the id «{0}». Change the «id» parameter in the Actividad tab."],
  ["Ya existe una actividad de otra persona con el id «{0}». Cambia el parámetro «id» en la pestaña Actividad.", "Someone else's activity already has the id «{0}». Change the «id» parameter in the Actividad tab."],
  ["Tu actividad «{0}» ya está publicada. Para cambiarla, escribe al administrador (o usa otro id).", "Your activity «{0}» is already published. To change it, write to the administrator (or use another id)."],
  ["Ya existe «{0}» ({1}{2}): al guardar se sustituirá.", "«{0}» already exists ({1}{2}): saving will replace it."],
  ["Segundo límite", "Second limit"], ["Puntos objetivo", "Target points"], ["Presupuesto", "Budget"], ["Bloques", "Blocks"], ["Decisiones", "Decisions"], ["Opciones", "Options"], ["Reglas", "Rules"],
  ["Buscando la mejor estrategia dentro del presupuesto… (unos 30 segundos; no cierres la página)", "Searching for the best strategy within the budget… (about 30 seconds; do not close the page)"],
  ["No se ha encontrado ninguna estrategia con puntos positivos dentro del presupuesto. Revisa los precios, los puntos o el presupuesto.", "No strategy with positive points was found within the budget. Check the prices, the points or the budget."],
  ["{0} puntos brutos", "{0} raw points"], ["con un gasto de", "costing"], ["{0} puntos", "{0} points"], ["Ver la estrategia óptima", "See the optimal strategy"],
  ["→ {0} número{1} de {2}. Cualquier otra estrategia obtiene puntos en proporción.", "→ {0} number{1} out of {2}. Any other strategy gets points in proportion."],
  ["Si la estrategia óptima no es la que tú esperabas, suele indicar puntos o reglas que conviene revisar en el Excel.", "If the optimal strategy is not the one you expected, it usually points to points or rules worth checking in the Excel file."],
  ["Descargar JSON (actividad y clave)", "Download JSON (activity and key)"], ["Rellena la", "Fill in the"],
  ["(pestañas Actividad, Bloques, Opciones y Reglas; las instrucciones están dentro y en la", "(tabs Actividad, Bloques, Opciones and Reglas; the instructions are inside and on the"], ["página de propuestas", "proposals page"],
  ["Cárgala aquí. El panel comprueba la hoja, busca la mejor estrategia posible dentro del presupuesto y ajusta la escala para que esa estrategia obtenga los puntos objetivo.", "Load it here. The panel checks the sheet, searches for the best possible strategy within the budget and sets the scale so that strategy gets the target points."],
  ["Mejor estrategia", "Best strategy"], ["Ronda {0}: {1} puntos", "Round {0}: {1} points"], ["Aún no ha enviado ninguna estrategia. Gasto actual: {0}.", "No strategy submitted yet. Current spending: {0}."],
  ["Reabrir edición (misma ronda)", "Reopen editing (same round)"], ["Reiniciar grupo", "Reset group"],
  ["Mejores elecciones publicadas: las ven los grupos que han terminado (ganado o sin rondas).", "Best choices published: groups that have finished (won or out of rounds) can see them."],
  ["Ocultar las mejores elecciones", "Hide the best choices"], ["Publicar las mejores elecciones", "Publish the best choices"],
  ["Falta cargar la clave de esta actividad: sin ella no se pueden calcular los puntos.", "This activity's key has not been loaded: points cannot be calculated without it."],
  ["Árbitro automático: calcular puntos y hacer los sorteos en cuanto los grupos lo pidan (deja esta página abierta durante la clase).", "Automatic referee: calculate points and run the draws as soon as groups ask (keep this page open during the class)."],
  ["Sin rondas", "Out of rounds"], ["Esperando a que entren los grupos…", "Waiting for groups to join…"], ["Descargar CSV de decisiones", "Download decisions CSV"], ["Descargar CSV de justificaciones", "Download justifications CSV"],
  ["Descargar JSON", "Download JSON"], ["Ronda", "Round"], ["Puntos", "Points"], ["Números", "Numbers"], ["Sorteo", "Draw"], ["Gasto", "Spending"], ["Justificaciones", "Justifications"],
  ["La estrategia supera el presupuesto o el tiempo disponible.", "The strategy exceeds the budget or the time available."], ["Faltan decisiones por tomar.", "Some decisions are still missing."],
  ["Las propuestas del profesorado aparecen aquí: revísalas (JSON, o creando una sesión de prueba) y publícalas. Publicada, cualquier profesor autorizado puede usarla en sus sesiones.", "Teachers' proposals appear here: review them (JSON, or by creating a test session) and publish them. Once published, any authorised teacher can use them in their sessions."],
  ["Tus borradores solo los ves tú; puedes probarlos en una sesión. Cuando estén listos, «Proponer» los envía al administrador para que los revise y los publique con tu nombre.", "Only you see your drafts; you can try them in a session. When they are ready, «Propose» sends them to the administrator to review and publish under your name."],
  ["(sin publicar: solo para pruebas)", "(unpublished: for testing only)"],
  ["Guárdala como borrador, pruébala en una sesión tuya y, cuando esté lista, pulsa «Proponer» en la lista de actividades. El administrador la revisa y la publica con tu nombre.", "Save it as a draft, try it in one of your sessions and, when it is ready, click «Propose» in the activity list. The administrator reviews it and publishes it under your name."],
  ["bloque que no cuenta en su objetivo", "block that does not count towards its goal"], ["no suma: cuenta la mejor opción", "does not add up: the best option counts"],
  ["Este archivo no es la clave de esta actividad.", "This file is not this activity's key."], ["Clave cargada.", "Key loaded."], ["Actividad diseñada por", "Activity designed by"],
  // ---------- estadísticas ----------
  ["Contando sesiones y grupos…", "Counting sessions and groups…"], ["Contar sesiones con al menos", "Count sessions with at least"], ["ninguno (todas)", "none (all)"],
  ["1 grupo que ha enviado", "1 group that has submitted"], ["{0} grupos que han enviado", "{0} groups that have submitted"],
  ["Sesiones", "Sessions"], ["Respuestas enviadas", "Answers submitted"], ["Docentes", "Teachers"], ["Centros", "Institutions"], ["Enviadas", "Submitted"], ["Curso", "Year"], ["Centro", "Institution"],
  ["Por curso académico", "By academic year"], ["Por actividad", "By activity"], ["Por centro", "By institution"], ["Docente sin nombre", "Unnamed teacher"], ["Centro sin indicar", "Institution not given"],
  ["No se cuentan nombres ni respuestas de los grupos. El centro de cada docente sale de la pestaña de profesorado de SORTIVIA (campo «Centro»). Las sesiones de prueba sin respuestas enviadas quedan fuera con el filtro por defecto.",
   "Group names and answers are not counted. Each teacher's institution comes from the SORTIVIA teachers tab («Centro» field). Test sessions with no submitted answers are left out by the default filter."],
  ["← Sesiones", "← Sessions"], ["Copiar enlace", "Copy link"], ["Abrir", "Open"], ["evaluación", "assessment"], ["nota", "mark"], ["Justificación", "Justification"], ["Proyección", "Projection"],
  ["clave", "key"], ["apoyo", "support"], ["distractor", "distractor"], ["referencia (1)", "reference (1)"], ["referencia (2)", "reference (2)"], ["válida", "valid"], ["débil", "weak"],
  ["Crear actividad desde una hoja Excel", "Create activity from an Excel sheet"], ["Clave", "Key"], ["No hay ninguna actividad.", "There are no activities."],
  ["Bloque", "Block"], ["Decisión", "Decision"], ["Elección", "Choice"], ["Coste", "Cost"], ["Opción", "Option"], ["Coherencia · {0}", "Consistency · {0}"], ["Mejor: {0}", "Best: {0}"],
  ["Han ganado", "Won"], ["JSON completo", "Full JSON"],
  ["Salir (Esc)", "Exit (Esc)"], ["DEAba · {0}", "DEAba · {0}"],
  // ---------- títulos y pie ----------
  ["DEAba Digital · Panel", "DEAba Digital · Panel"], ["SORTIVIA · Panel", "SORTIVIA · Panel"], ["DEAba Digital · panel · v{0}", "DEAba Digital · panel · v{0}"],
  // ---------- errores de las hojas Excel (los nombres de pestañas y columnas se dejan como en la plantilla) ----------
  ["Falta la hoja «{0}»", "The sheet «{0}» is missing"], ["Actividad: falta «{0}»", "Actividad: «{0}» is missing"],
  ["Actividad: «id» debe ir en minúsculas, sin tildes ni espacios (p. ej., diabetes_t1_medium)", "Actividad: «id» must be lowercase, without accents or spaces (e.g., diabetes_t1_medium)"],
  ["Actividad: «tipo» debe ser 1 o 2", "Actividad: «tipo» must be 1 or 2"], ["Actividad: «nivel» debe ser low, medium o high", "Actividad: «nivel» must be low, medium or high"],
  ["Actividad: «puntos» debe tener tres valores separados por «;»", "Actividad: «puntos» must have three values separated by «;»"],
  ["Actividad: «doi» no válido ({0}); debe empezar por 10. (p. ej., 10.5281/zenodo.1234567)", "Actividad: invalid «doi» ({0}); it must start with 10. (e.g., 10.5281/zenodo.1234567)"],
  ["Condiciones: debe haber exactamente una referencia_1 y una referencia_2", "Condiciones: there must be exactly one referencia_1 and one referencia_2"], ["Moléculas: no hay ninguna", "Moléculas: there are none"],
  ["Rutas: debe existir la ruta «otra» (la que eligen los grupos cuando ninguna encaja)", "Rutas: the pathway «otra» must exist (the one groups choose when none fits)"],
  ["{0}: la ruta «{1}» no está en la hoja «Rutas»", (a, b) => `${PANEL_FILA(a)}: the pathway «${b}» is not in the «Rutas» sheet`],
  ["{0}: Id vacío o repetido", (a) => `${PANEL_FILA(a)}: empty or repeated Id`], ["{0}: Tipo debe ser enzima o metabolito", (a) => `${PANEL_FILA(a)}: Tipo must be enzima or metabolito`],
  ["{0}: el FC va de 1 en adelante o de −1 hacia abajo (convención −1/valor)", (a) => `${PANEL_FILA(a)}: FC goes from 1 upwards or from −1 downwards (−1/value convention)`],
  ["{0}: el nivel no puede ser negativo", (a) => `${PANEL_FILA(a)}: the level cannot be negative`], ["{0}: papel «{1}» desconocido", (a, b) => `${PANEL_FILA(a)}: unknown role «${b}»`],
  ["{0}: falta el nombre en español", (a) => `${PANEL_FILA(a)}: the Spanish name is missing`], ["{0}: falta el número", (a) => `${PANEL_FILA(a)}: the number is missing`],
  ["{0}: «{1}» no es un número", (a, b) => `${PANEL_FILA(a)}: «${b}» is not a number`], ["{0}: «{1}» repetido (fila {2})", (a, b, c) => `${PANEL_FILA(a)}: «${b}» repeated (row ${c})`],
  ["{0}: falta el Id", (a) => `${PANEL_FILA(a)}: the Id is missing`], ["{0}: faltan los términos", (a) => `${PANEL_FILA(a)}: the terms are missing`],
  ["{0}: tipo «{1}» desconocido", (a, b) => `${PANEL_FILA(a)}: unknown type «${b}»`], ["{0}: sección «{1}» desconocida", (a, b) => `${PANEL_FILA(a)}: unknown section «${b}»`],
  ["Marcadores: hay menos {0}s que las que se piden", "Marcadores: there are fewer {0}s than requested"],
  ["{0}: el Id «{1}» debe ir en minúsculas, sin tildes ni espacios", (a, b) => `${PANEL_FILA(a)}: the Id «${b}» must be lowercase, without accents or spaces`],
  ["{0}: el Id «{1}» está repetido (fila {2})", (a, b, c) => `${PANEL_FILA(a)}: the Id «${b}» is repeated (row ${c})`],
  ["{0}: falta el nombre en español de «{1}»", (a, b) => `${PANEL_FILA(a)}: the Spanish name of «${b}» is missing`],
  ["Rutas: falta «{0}», que usan una o más actividades. No se puede borrar ni cambiar de Id.", "Rutas: «{0}» is missing, and one or more activities use it. It cannot be deleted or have its Id changed."],
  ["Actividad: el presupuesto debe ser mayor que 0.", "Actividad: the budget must be greater than 0."], ["Actividad: falta el parámetro «id».", "Actividad: the «id» parameter is missing."],
  ["Actividad: el bloque obligatorio «{0}» no existe en Opciones.", "Actividad: the required block «{0}» does not exist in Opciones."],
  ["Faltan las pestañas «Actividad» u «Opciones». Usa la plantilla de SORTIVIA.", "The «Actividad» or «Opciones» tabs are missing. Use the SORTIVIA template."],
  ["{0}: falta la decisión o la opción", (a) => `${PANEL_FILA(a)}: the decision or the option is missing`],
  ["{0}: opción repetida «{1}» en {2} · {3}", (a, b, c, d) => `${PANEL_FILA(a)}: repeated option «${b}» in ${c} · ${d}`],
  ["{0}: tipo de coste desconocido «{1}»", (a, b) => `${PANEL_FILA(a)}: unknown cost type «${b}»`],
  ["{0}: no entiendo «{1}»", (a, b) => `${PANEL_FILA(a)}: cannot understand «${b}»`], ["{0}: no existe el bloque «{1}» de la columna Bloque", (a, b) => `${PANEL_FILA(a)}: the block «${b}» in the Bloque column does not exist`],
  ["{0}: no existe el bloque «{1}»", (a, b) => `${PANEL_FILA(a)}: the block «${b}» does not exist`], ["{0}: no existe la decisión «{1}»", (a, b) => `${PANEL_FILA(a)}: the decision «${b}» does not exist`],
  ["{0}: no existe la opción «{1}»", (a, b) => `${PANEL_FILA(a)}: the option «${b}» does not exist`],
];
const PANEL_FILA = (x) => String(x).replace(/\bfila\b/g, "row");

const PANEL_I18N = (() => {
  const exact = new Map(), pats = [];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const [es, en] of PANEL_EN) {
    if (!/\{\d\}/.test(es)) { exact.set(es, en); continue; }
    const re = new RegExp("^" + esc(es).replace(/\\\{(\d)\\\}/g, "([\\s\\S]*?)") + "$");
    pats.push([re, en]);
  }
  function tr(s) {
    const t = s.trim(); if (!t) return null;
    if (exact.has(t)) return s.replace(t, exact.get(t));
    for (const [re, en] of pats) {
      const m = t.match(re);
      if (m) { const c = m.slice(1).map((x) => { const r = x && x !== t ? tr(x) : null; return r === null ? x : r; });
        const out = typeof en === "function" ? en(...c) : en.replace(/\{(\d)\}/g, (_, i) => c[+i] ?? ""); return s.replace(t, out); }
    }
    return null;
  }
  const ATTRS = ["placeholder", "title", "aria-label"];
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { const r = tr(root.nodeValue); if (r !== null && r !== root.nodeValue) root.nodeValue = r; return; }
    if (root.nodeType !== 1 || root.tagName === "SCRIPT" || root.tagName === "STYLE" || root.tagName === "TEXTAREA" || root.closest?.("[data-noi18n]")) return;
    for (const a of ATTRS) if (root.hasAttribute && root.hasAttribute(a)) { const r = tr(root.getAttribute(a)); if (r !== null) root.setAttribute(a, r); }
    if (root.tagName === "INPUT" && /^(button|submit)$/i.test(root.type) && root.value) { const r = tr(root.value); if (r !== null) root.value = r; }
    for (const c of root.childNodes) walk(c);
  }
  return { tr, walk };
})();

// Selector ES | EN en la cabecera y traducción en vivo de todo lo que se pinte.
(function () {
  const montar = () => {
    document.documentElement.lang = PANEL_LANG;
    const w = document.querySelector("header.bar .wrap");
    if (w && !w.querySelector(".lang")) {
      const d = document.createElement("div"); d.className = "lang"; d.setAttribute("role", "group"); d.setAttribute("aria-label", "Idioma / Language");
      d.innerHTML = `<button type="button" data-plang="es" aria-pressed="${PANEL_LANG === "es"}">ES</button><button type="button" data-plang="en" aria-pressed="${PANEL_LANG === "en"}">EN</button>`;
      w.appendChild(d);
      d.addEventListener("click", (e) => { const b = e.target.closest("[data-plang]"); if (!b || b.dataset.plang === PANEL_LANG) return; try { localStorage.setItem("bc.panel.lang", b.dataset.plang); } catch (er) {} location.reload(); });
    }
    if (PANEL_LANG !== "en") return;
    PANEL_I18N.walk(document.body); document.title = PANEL_I18N.tr(document.title) || document.title;
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") PANEL_I18N.walk(m.target);
        else if (m.type === "attributes") PANEL_I18N.walk(m.target.nodeType === 1 ? Object.assign(m.target, {}) : m.target);
        else for (const n of m.addedNodes) PANEL_I18N.walk(n);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
