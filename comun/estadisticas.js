/* BIOCOGNIA · estadísticas de uso para los paneles de DEAba Digital y SORTIVIA (solo administrador).
   Cuenta sesiones, grupos, respuestas enviadas, docentes, centros y actividades. No usa ni muestra datos de los grupos
   (nombres ni respuestas): solo cuántos hay y si han enviado. */
"use strict";
const BC_STATS_V = "1.1";
const BC_L = () => (typeof PANEL_LANG !== "undefined" ? PANEL_LANG : "es");
const BC_LOC = () => (BC_L() === "en" ? "en-GB" : "es-ES");

function bcCurso(ms) { const d = new Date(ms), y = d.getFullYear(); return d.getMonth() >= 8 ? `${y}/${String(y + 1).slice(2)}` : `${y - 1}/${String(y).slice(2)}`; }
function bcFecha(ms) { return new Date(ms).toLocaleDateString(BC_LOC(), { day: "numeric", month: "short", year: "numeric" }); }

// datos = { app, sesiones:[{id, actividad, propietario, creada, modo}], grupos:{sid:[grupo]}, profesores:[{uid, nombre, centro}],
//           admin:{uids:[], nombre, centro}, actividades:{id:{titulo, detalle}}, enviado:(g)=>bool, minEnviados }
function bcCalcular(datos) {
  const min = datos.minEnviados ?? 1, prof = new Map((datos.profesores || []).map((p) => [p.uid, p]));
  const quien = (uid) => {
    if ((datos.admin.uids || []).includes(uid)) return { nombre: datos.admin.nombre, centro: datos.admin.centro };
    const p = prof.get(uid) || {}; return { nombre: p.nombre || "Docente sin nombre", centro: p.centro || "Centro sin indicar" };
  };
  const filas = [];
  for (const s of datos.sesiones) {
    const gs = datos.grupos[s.id] || [], env = gs.filter(datos.enviado).length;
    if (env < min || !s.creada) continue;
    const q = quien(s.propietario), a = datos.actividades[s.actividad] || {};
    filas.push({ sesion: s.id, fecha: s.creada, curso: bcCurso(s.creada), actividad: s.actividad, titulo: a.titulo || s.actividad, detalle: a.detalle || "",
      profesor: q.nombre, uid: s.propietario, centro: q.centro, modo: s.modo || "", grupos: gs.length, enviados: env });
  }
  filas.sort((a, b) => a.fecha - b.fecha);
  const agrupar = (clave) => {
    const m = new Map();
    for (const f of filas) {
      const k = f[clave], x = m.get(k) || { clave: k, f, sesiones: 0, grupos: 0, enviados: 0, profes: new Set(), centros: new Set() };
      x.sesiones++; x.grupos += f.grupos; x.enviados += f.enviados; x.profes.add(f.uid); x.centros.add(f.centro); m.set(k, x);
    }
    return [...m.values()];
  };
  const suma = (k) => filas.reduce((t, f) => t + f[k], 0);
  return {
    app: datos.app, min, filas,
    total: { sesiones: filas.length, grupos: suma("grupos"), enviados: suma("enviados"), profesores: new Set(filas.map((f) => f.uid)).size,
      centros: new Set(filas.map((f) => f.centro)).size, actividades: new Set(filas.map((f) => f.actividad)).size,
      desde: filas.length ? filas[0].fecha : null, hasta: filas.length ? filas[filas.length - 1].fecha : null },
    porCurso: agrupar("curso").sort((a, b) => a.clave.localeCompare(b.clave)),
    porActividad: agrupar("actividad").sort((a, b) => b.sesiones - a.sesiones || b.grupos - a.grupos),
    porCentro: agrupar("centro").sort((a, b) => b.sesiones - a.sesiones),
  };
}

function bcResumenTexto(r) {
  const t = r.total, pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (BC_L() === "en") {
    if (!t.sesiones) return `There are no ${r.app} sessions yet with at least ${pl(r.min, "group")} that submitted an answer.`;
    return `Between ${bcFecha(t.desde)} and ${bcFecha(t.hasta)}, ${r.app} was used in ${pl(t.sesiones, "class session")} with ${pl(t.grupos, "student group")} `
      + `(${pl(t.enviados, "answer")} submitted), led by ${pl(t.profesores, "teacher")} from ${t.centros} institution${t.centros === 1 ? "" : "s"}, `
      + `with ${t.actividades} different activit${t.actividades === 1 ? "y" : "ies"}.`;
  }
  if (!t.sesiones) return `Todavía no hay sesiones de ${r.app} con al menos ${r.min} grupo${r.min === 1 ? "" : "s"} que haya enviado su respuesta.`;
  return `Entre el ${bcFecha(t.desde)} y el ${bcFecha(t.hasta)}, ${r.app} se ha usado en ${t.sesiones} sesion${t.sesiones === 1 ? "" : "es"} de clase con ${t.grupos} grupos de estudiantes `
    + `(${t.enviados} respuestas enviadas), dirigidas por ${t.profesores} docente${t.profesores === 1 ? "" : "s"} de ${t.centros} centro${t.centros === 1 ? "" : "s"}, `
    + `con ${t.actividades} actividad${t.actividades === 1 ? "" : "es"} distinta${t.actividades === 1 ? "" : "s"}.`;
}

function bcVista(r, esc) {
  const t = r.total, n = (x) => `<td class="n">${x}</td>`;
  const tabla = (cab, filas) => `<div class="tablebox"><table><thead><tr>${cab.map((c, i) => `<th${i ? ' class="n"' : ""}>${c}</th>`).join("")}</tr></thead><tbody>${filas}</tbody></table></div>`;
  const tiles = [["Sesiones", t.sesiones], ["Grupos", t.grupos], ["Respuestas enviadas", t.enviados], ["Docentes", t.profesores], ["Centros", t.centros], ["Actividades", t.actividades]]
    .map(([k, v]) => `<div class="bc-tile"><b>${v}</b><span>${k}</span></div>`).join("");
  return `<style>.bc-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}.bc-tile{border:1px solid var(--line);border-radius:var(--r,10px);padding:10px 12px;background:var(--surface)}.bc-tile b{display:block;font-size:1.6rem;font-family:var(--f-display,Georgia,serif)}.bc-tile span{font-size:.85rem;color:var(--muted)}</style>
    <div class="bc-tiles">${tiles}</div>
    <p class="notice small" id="bc-resumen">${esc(bcResumenTexto(r))}</p>
    ${t.sesiones ? `<h3>Por curso académico</h3>${tabla(["Curso", "Sesiones", "Grupos", "Enviadas", "Docentes", "Centros"], r.porCurso.map((x) => `<tr><td>${esc(x.clave)}</td>${n(x.sesiones)}${n(x.grupos)}${n(x.enviados)}${n(x.profes.size)}${n(x.centros.size)}</tr>`).join(""))}
    <h3>Por actividad</h3>${tabla(["Actividad", "Sesiones", "Grupos", "Enviadas", "Docentes"], r.porActividad.map((x) => `<tr><td>${esc(x.f.titulo)}${x.f.detalle ? ` <span class="small muted">${esc(x.f.detalle)}</span>` : ""}</td>${n(x.sesiones)}${n(x.grupos)}${n(x.enviados)}${n(x.profes.size)}</tr>`).join(""))}
    <h3>Por centro</h3>${tabla(["Centro", "Sesiones", "Grupos", "Enviadas", "Docentes"], r.porCentro.map((x) => `<tr><td>${esc(x.clave)}</td>${n(x.sesiones)}${n(x.grupos)}${n(x.enviados)}${n(x.profes.size)}</tr>`).join(""))}` : ""}`;
}

function bcCSV(r) {
  const c = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cab = ["app", "fecha", "curso", "actividad_id", "actividad", "docente", "centro", "modo", "grupos", "respuestas_enviadas"];
  return [cab.join(";"), ...r.filas.map((f) => [r.app, new Date(f.fecha).toISOString().slice(0, 10), f.curso, f.actividad, f.titulo, f.profesor, f.centro, f.modo, f.grupos, f.enviados].map(c).join(";"))].join("\n");
}

// Hoja imprimible (o PDF) con el resumen, para adjuntar como evidencia de uso.
function bcImprimir(r, esc) {
  const w = window.open("", "_blank"); if (!w) return false;
  const hoy = new Date().toLocaleDateString(BC_LOC(), { day: "numeric", month: "long", year: "numeric" });
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(r.app)} · estadísticas de uso</title>
    <style>:root{--line:#bbb;--muted:#555;--surface:#fff;--r:8px}body{font-family:system-ui,sans-serif;color:#111;max-width:780px;margin:24px auto;padding:0 16px;font-size:14px}
    h1{font-family:Georgia,serif;margin:0 0 4px}h3{margin:18px 0 6px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left}td.n,th.n{text-align:right}
    .notice{background:#f4f4f0;padding:10px;border-radius:6px}.small{font-size:12px}.muted{color:#555}@page{size:A4;margin:14mm}</style></head>
    <body><h1>${esc(r.app)} · estadísticas de uso</h1><p class="small muted">BIOCOGNIA · generado el ${hoy} desde el panel del profesorado. Se cuentan las sesiones con al menos ${r.min} grupo${r.min === 1 ? "" : "s"} que ha enviado su respuesta. No incluye datos de estudiantes.</p>
    ${bcVista(r, esc)}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
  if (BC_L() === "en" && typeof PANEL_I18N !== "undefined") {
    w.document.documentElement.lang = "en"; w.document.title = `${r.app} · usage statistics`;
    const h = w.document.querySelector("h1"), p = w.document.querySelector("body > p.small");
    if (h) h.textContent = `${r.app} · usage statistics`;
    if (p) p.textContent = `BIOCOGNIA · generated on ${hoy} from the teacher panel. Sessions with at least ${r.min} group${r.min === 1 ? "" : "s"} that submitted an answer are counted. No student data included.`;
    PANEL_I18N.walk(w.document.body);
  }
  w.document.close(); return true;
}

// Quién es el administrador (para atribuir sus sesiones a un centro).
const BC_ADMIN = { nombre: "Alfonso Olaya Abril", centro: "Universidad de Córdoba" };

// Carga todo lo necesario desde el almacenamiento de la app (DEAba o SORTIVIA) y calcula.
async function bcCargar({ app, B, adminUids, actividades, enviado, min }) {
  const [sesiones, profesores] = await Promise.all([B.sesiones(true), B.profesores ? B.profesores().catch(() => []) : []]);
  const grupos = {};
  await Promise.all(sesiones.map(async (s) => { grupos[s.id] = await B.gruposLista(s.id).catch(() => []); }));
  return { datos: { app, sesiones, grupos, profesores, admin: { uids: adminUids, ...BC_ADMIN }, actividades, enviado }, r: bcCalcular({ app, sesiones, grupos, profesores, admin: { uids: adminUids, ...BC_ADMIN }, actividades, enviado, minEnviados: min }) };
}

// Bloque completo para el panel: controles + resultados. Los botones llevan los id bc-min, bc-csv y bc-print.
function bcPanel(estado, esc) {
  if (!estado) return `<p class="muted">Contando sesiones y grupos…</p>`;
  const r = estado.r;
  return `<div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><label class="small">Contar sesiones con al menos
      <select class="field" id="bc-min" style="width:auto">${[1, 2, 3, 0].map((m) => `<option value="${m}" ${m === r.min ? "selected" : ""}>${m ? `${m} grupo${m > 1 ? "s" : ""} que ha${m > 1 ? "n" : ""} enviado` : "ninguno (todas)"}</option>`).join("")}</select></label>
    <span class="spacer"></span><button class="btn small" id="bc-csv">Descargar CSV</button><button class="btn small primary" id="bc-print">Imprimir / PDF</button></div>
    ${bcVista(r, esc)}
    <p class="small muted">No se cuentan nombres ni respuestas de los grupos. El centro de cada docente sale de la pestaña de profesorado de SORTIVIA (campo «Centro»). Las sesiones de prueba sin respuestas enviadas quedan fuera con el filtro por defecto.</p>`;
}
function bcRecalcular(estado, min) { estado.r = bcCalcular({ ...estado.datos, minEnviados: min }); return estado; }
