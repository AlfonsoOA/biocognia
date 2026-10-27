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
    const guia = { schema: "deaba-guia/1", actividad: aid, objetivo: { es: txt(A.objetivo) }, nivel_texto: { es: txt(A.nivel_texto) }, secciones: Object.fromEntries(DB_SECCIONES.map((s) => [s, []])) };
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
        guia.moleculas[mid] = { reaccion: { es: txt(f["Reacción"]) }, rutas: rutas(f.Rutas, d), compartimento: { es: txt(f.Compartimento) }, porque: { es: txt(f["Por qué cambia"]) }, claves: lista(f["Palabras clave"]) };
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
        guia.condiciones[cid] = { comentario: { es: txt(f["Comentario (guía)"]) }, papel };
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
        guia.marcadores[mid] = { papel, reaccion: { es: txt(f["Reacción"]) }, rutas: rutas(f.Rutas, d), compartimento: { es: txt(f.Compartimento) }, porque: { es: txt(f["Por qué"]) }, claves: lista(f["Palabras clave"]), niveles };
      }
      // Orden alfabético para no delatar qué marcadores son clave (igual que en Python: primero enzimas).
      const key = (m) => `${m.tipo !== "enzima" ? 1 : 0}|${m.nombre.es.toLowerCase()}`;
      act.catalogo = cat.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
      for (const [t, n] of [["enzima", act.n_enzimas], ["metabolito", act.n_metabolitos]]) if (cat.filter((m) => m.tipo === t).length < n) errores.push(`Marcadores: hay menos ${t}s que las que se piden`);
    }
    for (const f of filas("Guía")) {
      const s = txt(f["Sección"]).toLowerCase();
      if (!DB_SECCIONES.includes(s)) { errores.push(`Guía, fila ${f.i}: sección «${s}» desconocida`); continue; }
      guia.secciones[s].push({ es: txt(f.Texto) });
    }
    guia.conceptos = [];
    for (const f of filas("Conceptos")) {
      const cid = txt(f.Id); if (!cid) { errores.push(`Conceptos, fila ${f.i}: falta el Id`); continue; }
      const alternativas = lista(f["Términos"]).map((alt) => alt.split("+").map((p) => p.trim()).filter(Boolean));
      if (!alternativas.length) errores.push(`Conceptos, fila ${f.i}: faltan los términos`);
      const tipoC = txt(f.Tipo) || "esperado";
      if (!["esperado", "alternativo", "error"].includes(tipoC)) errores.push(`Conceptos, fila ${f.i}: tipo «${tipoC}» desconocido`);
      guia.conceptos.push({ id: cid, etiqueta: txt(f.Etiqueta) || cid, alternativas, tipo: tipoC });
    }
    return { act, guia, errores };
  } catch (e) { return { act: null, guia: null, errores: [...errores, e.message] }; }
}
