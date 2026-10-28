/* DEAba Digital — conversor de la plantilla Excel en el navegador (misma lógica que xlsx2deaba.py).
   dbConvertir(libro SheetJS) → { act, guia, errores }. Necesita DB_RUTAS cargado. */
"use strict";
const DB_SECCIONES = ["diagnostico", "pistas", "razonamiento", "alternativas", "errores", "plenario", "referencias", "notas"];
function dbConvertir(wb) {
  const errores = [];
  const txt = (v) => (v == null ? "" : String(v).trim());
  const num = (v, donde) => { if (v == null || txt(v) === "") throw new Error(`${donde}: falta el número`); const n = Number(String(v).replace(",", ".")); if (Number.isNaN(n)) throw new Error(`${donde}: «${v}» no es un número`); return n; };
  const lista = (v, sep = ";") => txt(v).split(sep).map((x) => x.trim()).filter(Boolean);
  const bil = (es, en) => { const d = { es: txt(es) }; if (txt(en)) d.en = txt(en); return d; };
  const rutasOk = new Set(DB_RUTAS.map((r) => r.id));
  const rutas = (v, donde) => { const rs = lista(v); for (const r of rs) if (!rutasOk.has(r)) errores.push(`${donde}: la ruta «${r}» no está en la hoja «Rutas»`); return rs; };
  // Filas como objetos {cabecera: valor}, saltando las vacías; «i» es el número de fila en Excel.
  const filas = (nombre) => {
    const ws = wb.Sheets[nombre]; if (!ws) return [];
    const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
    const cab = (m[0] || []).map(txt), out = [];
    m.slice(1).forEach((r, k) => { if (!r.some((x) => txt(x))) return; const o = { i: k + 2 }; cab.forEach((c, j) => { o[c] = r[j] ?? null; }); out.push(o); });
    return out;
  };
  const tiene = (h) => wb.SheetNames.includes(h);
  try {
    if (!tiene("Actividad")) throw new Error("Falta la hoja «Actividad»");
    const A = {}, AEN = {};
    for (const f of filas("Actividad")) { A[txt(f.Campo)] = f.Valor; AEN[txt(f.Campo)] = f["Valor (en)"]; }
    const aid = txt(A.id);
    if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(aid)) errores.push("Actividad: «id» debe ir en minúsculas, sin tildes ni espacios (p. ej., diabetes_t1_medium)");
    const tipo = Math.trunc(num(A.tipo, "Actividad: tipo"));
    if (tipo !== 1 && tipo !== 2) throw new Error("Actividad: «tipo» debe ser 1 o 2");
    const nivel = txt(A.nivel) || "medium";
    if (!["low", "medium", "high"].includes(nivel)) errores.push("Actividad: «nivel» debe ser low, medium o high");
    let pts = [];
    try { pts = lista(A.puntos || "3;3;4").map((x) => num(x, "Actividad: puntos")); } catch (e) { errores.push(e.message); }
    if (pts.length !== 3) errores.push("Actividad: «puntos» debe tener tres valores separados por «;»");
    for (const k of ["titulo", "contexto", "mision"]) if (!txt(A[k])) errores.push(`Actividad: falta «${k}»`);
    const act = { schema: "deaba/1", id: aid, tipo, nivel, titulo: bil(A.titulo, AEN.titulo), asignatura: txt(A.asignatura), autor: txt(A.autor),
      contexto: bil(A.contexto, AEN.contexto), mision: bil(A.mision, AEN.mision), puntos: pts };
    const doi = txt(A.doi).replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:\s*)/i, "");
    if (doi) { if (!/^10\.\d{4,9}\/\S+$/.test(doi)) errores.push(`Actividad: «doi» no válido (${doi}); debe empezar por 10. (p. ej., 10.5281/zenodo.1234567)`); act.doi = doi; }
    const guia = { schema: "deaba-guia/1", actividad: aid, objetivo: bil(A.objetivo, AEN.objetivo), nivel_texto: bil(A.nivel_texto, AEN.nivel_texto), secciones: Object.fromEntries(DB_SECCIONES.map((s) => [s, []])) };
    if (tipo === 1) {
      if (!tiene("Moléculas")) throw new Error("Falta la hoja «Moléculas»");
      const cnd = (k, def, defEn) => bil(A[k] || def, AEN[k] || (txt(A[k]) ? "" : defEn));
      act.condiciones = { c1: cnd("condicion_1", "Condición 1", "Condition 1"), c2: cnd("condicion_2", "Condición 2", "Condition 2") };
      act.moleculas = []; guia.moleculas = {};
      const vistos = new Set();
      for (const f of filas("Moléculas")) {
        const mid = txt(f.Id), tp = txt(f.Tipo).toLowerCase(), d = `Moléculas, fila ${f.i}`;
        if (!mid || vistos.has(mid)) { errores.push(`${d}: Id vacío o repetido`); continue; }
        vistos.add(mid);
        if (!["enzima", "metabolito"].includes(tp)) errores.push(`${d}: Tipo debe ser enzima o metabolito`);
        let fc = 1; try { fc = num(f.FC, `${d} (FC)`); } catch (e) { errores.push(e.message); }
        if (fc > -1 && fc < 1) errores.push(`${d}: el FC va de 1 en adelante o de −1 hacia abajo (convención −1/valor)`);
        act.moleculas.push({ id: mid, tipo: tp, nombre: bil(f.Nombre, f["Nombre (en)"]), fc });
        guia.moleculas[mid] = { reaccion: bil(f["Reacción"], f["Reacción (en)"]), rutas: rutas(f.Rutas, d), compartimento: bil(f.Compartimento, f["Compartimento (en)"]), porque: bil(f["Por qué cambia"], f["Por qué cambia (en)"]), claves: lista(f["Palabras clave"]) };
      }
      if (!act.moleculas.length) errores.push("Moléculas: no hay ninguna");
    } else {
      for (const h of ["Condiciones", "Marcadores"]) if (!tiene(h)) throw new Error(`Falta la hoja «${h}»`);
      try { act.n_enzimas = num(A.n_enzimas, "Actividad: n_enzimas"); } catch (e) { errores.push(e.message); }
      try { act.n_metabolitos = num(A.n_metabolitos, "Actividad: n_metabolitos"); } catch (e) { errores.push(e.message); }
      act.condiciones = []; guia.condiciones = {};
      for (const f of filas("Condiciones")) {
        const cid = txt(f.Id); if (!cid) { errores.push(`Condiciones, fila ${f.i}: falta el Id`); continue; }
        const papel = txt(f.Papel) || "valida";
        if (!["referencia_1", "referencia_2", "valida", "debil"].includes(papel)) errores.push(`Condiciones, fila ${f.i}: papel «${papel}» desconocido`);
        act.condiciones.push({ id: cid, nombre: bil(f.Nombre, f["Nombre (en)"]) });
        guia.condiciones[cid] = { comentario: bil(f["Comentario (guía)"], f["Comentario (en)"]), papel };
      }
      const pp = Object.values(guia.condiciones).map((c) => c.papel);
      if (pp.filter((x) => x === "referencia_1").length !== 1 || pp.filter((x) => x === "referencia_2").length !== 1) errores.push("Condiciones: debe haber exactamente una referencia_1 y una referencia_2");
      const cids = act.condiciones.map((c) => c.id), cat = []; guia.marcadores = {};
      for (const f of filas("Marcadores")) {
        const mid = txt(f.Id), tp = txt(f.Tipo).toLowerCase(), d = `Marcadores, fila ${f.i}`;
        if (!mid || guia.marcadores[mid]) { errores.push(`${d}: Id vacío o repetido`); continue; }
        if (!["enzima", "metabolito"].includes(tp)) errores.push(`${d}: Tipo debe ser enzima o metabolito`);
        const papel = txt(f.Papel) || "apoyo";
        if (!["clave", "apoyo", "distractor"].includes(papel)) errores.push(`${d}: papel «${papel}» desconocido`);
        const niveles = {};
        for (const c of cids) { try { niveles[c] = num(f[`Nivel: ${c}`], `${d} (Nivel: ${c})`); if (niveles[c] < 0) errores.push(`${d}: el nivel no puede ser negativo`); } catch (e) { errores.push(e.message); } }
        cat.push({ id: mid, tipo: tp, nombre: bil(f.Nombre, f["Nombre (en)"]) });
        guia.marcadores[mid] = { papel, reaccion: bil(f["Reacción"], f["Reacción (en)"]), rutas: rutas(f.Rutas, d), compartimento: bil(f.Compartimento, f["Compartimento (en)"]), porque: bil(f["Por qué"], f["Por qué (en)"]), claves: lista(f["Palabras clave"]), niveles };
      }
      // Orden alfabético para no delatar qué marcadores son clave (igual que en Python: primero enzimas).
      const key = (m) => `${m.tipo !== "enzima" ? 1 : 0}|${m.nombre.es.toLowerCase()}`;
      act.catalogo = cat.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
      for (const [t, n] of [["enzima", act.n_enzimas], ["metabolito", act.n_metabolitos]]) if (cat.filter((m) => m.tipo === t).length < n) errores.push(`Marcadores: hay menos ${t}s que las que se piden`);
    }
    for (const f of filas("Guía")) {
      const s = txt(f["Sección"]).toLowerCase();
      if (!DB_SECCIONES.includes(s)) { errores.push(`Guía, fila ${f.i}: sección «${s}» desconocida`); continue; }
      guia.secciones[s].push(bil(f.Texto, f["Texto (en)"]));
    }
    guia.conceptos = [];
    for (const f of filas("Conceptos")) {
      const cid = txt(f.Id); if (!cid) { errores.push(`Conceptos, fila ${f.i}: falta el Id`); continue; }
      const alternativas = lista(f["Términos"]).map((alt) => alt.split("+").map((p) => p.trim()).filter(Boolean));
      if (!alternativas.length) errores.push(`Conceptos, fila ${f.i}: faltan los términos`);
      const tipoC = txt(f.Tipo) || "esperado";
      if (!["esperado", "alternativo", "error"].includes(tipoC)) errores.push(`Conceptos, fila ${f.i}: tipo «${tipoC}» desconocido`);
      const c = { id: cid, etiqueta: txt(f.Etiqueta) || cid, alternativas, tipo: tipoC }; if (txt(f["Etiqueta (en)"])) c.etiqueta_en = txt(f["Etiqueta (en)"]);
      guia.conceptos.push(c);
    }
    return { act, guia, errores };
  } catch (e) { return { act: null, guia: null, errores: [...errores, e.message] }; }
}

/* ---------- Catálogo del autocompletado y rutas: Excel ⇄ catalogo.json + rutas.json ---------- */
const DB_CAT_INSTR = [
  ["DEAba Digital · catálogo del autocompletado y rutas"], [""],
  ["Hojas «Metabolitos» y «Enzimas»: un nombre por fila. «Español» es obligatoria; «English» es opcional (si falta, en inglés se sugiere el nombre en español)."],
  ["Son solo nombres: el autocompletado ayuda a escribir sin errores, nunca da la reacción. El orden no importa."],
  ["Hoja «Rutas»: las rutas que los grupos pueden elegir en la tarea 2 y que se usan en la columna «Rutas» de las plantillas."],
  ["«Id» en minúsculas, sin tildes ni espacios (p. ej., ciclo_calvin). No cambiéis ni borréis un Id que ya usen las actividades: el panel lo comprueba. «otra» debe existir siempre."],
  [""],
  ["Cuando termines: panel del profesorado → «Catálogo y rutas» → carga este Excel. El panel genera catalogo.json y rutas.json; súbelos a la carpeta deaba/ del repositorio en GitHub (sustituyendo a los actuales)."],
];
function dbLibroCatalogo(cat, rutas) {
  const wb = XLSX.utils.book_new();
  const hoja = (filas, anchos) => { const ws = XLSX.utils.aoa_to_sheet(filas); ws["!cols"] = anchos.map((w) => ({ wch: w })); return ws; };
  XLSX.utils.book_append_sheet(wb, hoja(DB_CAT_INSTR, [130]), "Instrucciones");
  const nombres = (l) => [["Español", "English"], ...l.map((n) => [n.es, n.en || ""])];
  XLSX.utils.book_append_sheet(wb, hoja(nombres(cat.metabolitos || []), [45, 45]), "Metabolitos");
  XLSX.utils.book_append_sheet(wb, hoja(nombres(cat.enzimas || []), [60, 60]), "Enzimas");
  XLSX.utils.book_append_sheet(wb, hoja([["Id", "Español", "English"], ...rutas.map((r) => [r.id, r.es, r.en || ""])], [22, 55, 55]), "Rutas");
  return wb;
}
// rutasUsadas: Set de ids que usan las actividades (no se pueden borrar). Devuelve { catalogo, rutas, errores, avisos }.
function dbConvertirCatalogo(wb, rutasUsadas = new Set()) {
  const errores = [], avisos = [], txt = (v) => (v == null ? "" : String(v).trim());
  const filas = (nombre) => {
    const ws = wb.Sheets[nombre]; if (!ws) { errores.push(`Falta la hoja «${nombre}»`); return []; }
    const m = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }), cab = (m[0] || []).map(txt), out = [];
    m.slice(1).forEach((r, k) => { if (!r.some((x) => txt(x))) return; const o = { i: k + 2 }; cab.forEach((c, j) => { o[c] = txt(r[j]); }); out.push(o); });
    return out;
  };
  const nombres = (hoja) => {
    const vistos = new Map(), out = [];
    for (const f of filas(hoja)) {
      const es = f["Español"] || f.Espanol || f.es, en = f.English || f["Inglés"] || f.en;
      if (!es) { errores.push(`${hoja}, fila ${f.i}: falta el nombre en español`); continue; }
      const k = dbNorm(es);
      if (vistos.has(k)) { avisos.push(`${hoja}, fila ${f.i}: «${es}» repetido (fila ${vistos.get(k)}); se queda una sola vez`); continue; }
      vistos.set(k, f.i); out.push(en ? { es, en } : { es });
    }
    return out;
  };
  const catalogo = { metabolitos: nombres("Metabolitos"), enzimas: nombres("Enzimas") };
  const rutas = [], ids = new Map();
  for (const f of filas("Rutas")) {
    const id = f.Id || f.id, es = f["Español"] || f.es, en = f.English || f.en;
    if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(id)) { errores.push(`Rutas, fila ${f.i}: el Id «${id}» debe ir en minúsculas, sin tildes ni espacios`); continue; }
    if (ids.has(id)) { errores.push(`Rutas, fila ${f.i}: el Id «${id}» está repetido (fila ${ids.get(id)})`); continue; }
    if (!es) { errores.push(`Rutas, fila ${f.i}: falta el nombre en español de «${id}»`); continue; }
    ids.set(id, f.i); rutas.push({ id, es, en: en || es });
  }
  if (!ids.has("otra")) errores.push("Rutas: debe existir la ruta «otra» (la que eligen los grupos cuando ninguna encaja)");
  for (const r of rutasUsadas) if (!ids.has(r)) errores.push(`Rutas: falta «${r}», que usan una o más actividades. No se puede borrar ni cambiar de Id.`);
  // «otra» siempre al final de la lista.
  rutas.sort((a, b) => (a.id === "otra") - (b.id === "otra"));
  return { catalogo, rutas, errores, avisos };
}
