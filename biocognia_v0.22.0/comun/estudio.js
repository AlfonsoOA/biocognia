/* BIOCOGNIA · participación de los grupos de SORTIVIA y DEAba Digital en el estudio BIOCOGNIA.
   Solo se ofrece en las sesiones que el investigador marca como «del estudio» (campo estudio: true de la sesión).
   El grupo decide al entrar (campo estudio: true/false del grupo) y puede cambiar de opinión desde el pie de la página.
   La exportación para el estudio incluye solo los grupos que han aceptado y sustituye su nombre por un código. */
"use strict";
const BC_ESTUDIO_TX = {
  es: {
    t: "Estudio BIOCOGNIA",
    txt: "Esta sesión forma parte del estudio BIOCOGNIA sobre aprendizaje de la Bioquímica (Universidad de Córdoba; informe del comité de ética [referencia]). Si aceptáis, el trabajo de vuestro grupo (decisiones, respuestas, puntos y justificaciones) se usará en el estudio sin el nombre del grupo. Participar o no no afecta a vuestra nota, y la actividad funciona igual.",
    si: "Todos los miembros del grupo somos mayores de edad y aceptamos participar.",
    no: "No participamos en el estudio.",
    info: "Leer la información completa",
    falta: "Elegid una de las dos opciones sobre el estudio.",
    on: "Vuestro grupo participa en el estudio", off: "Vuestro grupo no participa en el estudio",
    retirar: "Dejar de participar", unirse: "Participar",
  },
  en: {
    t: "BIOCOGNIA study",
    txt: "This session is part of the BIOCOGNIA study on learning biochemistry (University of Córdoba; ethics committee report [reference]). If you agree, your group's work (decisions, answers, points and justifications) will be used in the study without the group's name. Taking part or not does not affect your grade, and the activity works the same.",
    si: "All members of the group are 18 or older and we agree to take part.",
    no: "We do not take part in the study.",
    info: "Read the full information",
    falta: "Choose one of the two options about the study.",
    on: "Your group takes part in the study", off: "Your group does not take part in the study",
    retirar: "Stop taking part", unirse: "Take part",
  },
};
function bcEstT(lang, k) { return (BC_ESTUDIO_TX[lang] || BC_ESTUDIO_TX.es)[k]; }
function bcEstLink(lang) { return `<a href="../comun/estudio.html?lang=${lang === "en" ? "en" : "es"}" target="_blank" rel="noopener">${bcEstT(lang, "info")}</a>`; }
function bcEstCampo(lang) {
  return `<fieldset class="stack" id="estudio-box" style="border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:0">
    <legend style="font-weight:600;padding:0 4px">${bcEstT(lang, "t")}</legend>
    <p class="small" style="margin:0">${bcEstT(lang, "txt")} ${bcEstLink(lang)}</p>
    <label class="small" style="display:flex;gap:8px;align-items:flex-start"><input type="radio" name="estudio" value="1"><span>${bcEstT(lang, "si")}</span></label>
    <label class="small" style="display:flex;gap:8px;align-items:flex-start"><input type="radio" name="estudio" value="0"><span>${bcEstT(lang, "no")}</span></label>
  </fieldset>`;
}
function bcEstLeer(form) { const r = form.querySelector('input[name="estudio"]:checked'); return r ? r.value === "1" : null; }
function bcEstPie(lang, ses, g) {
  if (!ses || ses.estudio !== true || !g || typeof g.estudio !== "boolean") return "";
  return ` · ${bcEstT(lang, g.estudio ? "on" : "off")} <button type="button" class="btn small ghost" data-estudio="${g.estudio ? 0 : 1}">${bcEstT(lang, g.estudio ? "retirar" : "unirse")}</button> · ${bcEstLink(lang)}`;
}
function bcEstExport(app, sid, ses, actividad, grupos) {
  const sel = grupos.filter((g) => g.estudio === true);
  return {
    schema: "biocognia-estudio/1", app, actividad, sesion: sid, creada: ses.creada || null, modo: ses.modo || null,
    n_grupos_sesion: grupos.length, n_grupos_estudio: sel.length,
    grupos: sel.map((g, i) => { const { id, nombre, ...resto } = g; return { grupo: "G" + String(i + 1).padStart(2, "0"), ...resto }; }),
  };
}
