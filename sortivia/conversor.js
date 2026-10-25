/* ============================================================
   SORTIVIA — conversor de hojas de claves (Excel) en el navegador.
   Mismo formato y mismas comprobaciones que xlsx2sortivia.py; para puntuar usa el motor de sortivia.js.
   Necesita SheetJS (XLSX), que el panel carga solo cuando hace falta.
   ============================================================ */
"use strict";
const SV_TIPOS = { "réplicas": "replicas", "replicas": "replicas", "por muestra": "muestra", "multiplicador": "mult", "fijo": "fijo", "por unidad": "unidad", "condiciones": "condiciones" };
// Lo que va entre corchetes no forma parte del identificador: «de novo [SPAdes, Flye]» → de-novo.
function svSlug(s) { s = String(s); s = s.replace(/\[[^\]]*\]/g, "").trim() || s; return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function svNum(v) { if (typeof v === "number") return v; const s = String(v == null ? "" : v).trim().toLowerCase().replace(/^x/, "").replace(",", "."); return s ? Number(s) : 0; }
function svTxt(en, es) { en = en == null ? "" : String(en).trim(); es = es ? String(es).trim() : ""; return { en, es: es || en }; }
function svFilas(wb, nombre) { const ws = wb.Sheets[nombre]; return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) : null; }

// Convierte el libro Excel (ya leído con XLSX.read) en { act, clave, errores }.
function svConvertir(wb) {
  const errores = [];
  const filasAct = svFilas(wb, "Actividad"), filasOp = svFilas(wb, "Opciones");
  if (!filasAct || !filasOp) return { errores: ["Faltan las pestañas «Actividad» u «Opciones». Usa la plantilla de SORTIVIA."] };
  const P = {}; for (const r of filasAct.slice(1)) if (r[0] != null && String(r[0]).trim()) P[String(r[0]).trim()] = r[1];
  if (!P.id) errores.push("Actividad: falta el parámetro «id».");
  const aid = svSlug(P.id || "");
  const obligatorios = String(P.bloques_obligatorios || "").split(";").map((x) => x.trim()).filter(Boolean).map(svSlug);
  const info = {};
  for (const r of (svFilas(wb, "Bloques") || []).slice(1)) {
    if (!r[0] || (!r[1] && !r[2])) continue;
    info[svSlug(r[0])] = { nombre: svTxt(r[0], r[1]), objetivo: r[2] ? { id: svSlug(r[2]), nombre: svTxt(r[2], r[3]) } : null };
  }
  const bloques = [], idx = {}, puntos = {};
  filasOp.slice(1).forEach((r, k) => {
    const i = k + 2; if (!r || !r[0]) return;
    const [B, D, G, O, TIPO, PRECIO, PTS, , SELEC, D_ES, O_ES, G_ES] = r.concat(Array(12).fill(null));
    const tipo = SV_TIPOS[String(TIPO || "").trim().toLowerCase()];
    if (!tipo) { errores.push(`Opciones fila ${i}: tipo de coste desconocido «${TIPO}»`); return; }
    if (D == null || O == null) { errores.push(`Opciones fila ${i}: falta la decisión o la opción`); return; }
    const bid = svSlug(B), did = svSlug(D);
    if (!idx[bid]) { const ib = info[bid] || {}; idx[bid] = { id: bid, nombre: ib.nombre || svTxt(B), decisiones: [], _d: {} }; if (ib.objetivo) idx[bid].objetivo = ib.objetivo; bloques.push(idx[bid]); }
    const blk = idx[bid];
    if (!blk._d[did]) { const dec = { id: did, nombre: svTxt(D, D_ES), tipo: tipo === "unidad" ? "contador" : (String(SELEC || "").trim().toLowerCase().startsWith("m") ? "multiple" : "unica"), opciones: [] }; blk._d[did] = dec; blk.decisiones.push(dec); }
    const dec = blk._d[did], oid = tipo === "unidad" ? "n" : svSlug(O);
    const coste = { tipo, valor: svNum(PRECIO) }; if (tipo === "replicas") coste.n = Math.trunc(svNum(O));
    const opt = { id: oid, label: svTxt(O, O_ES), coste }; if (G) opt.grupo = svTxt(G, G_ES);
    if (dec.opciones.some((x) => x.id === oid)) errores.push(`Opciones fila ${i}: opción repetida «${O}» en ${B} · ${D}`);
    dec.opciones.push(opt); puntos[`${bid}/${did}/${oid}`] = svNum(PTS);
  });
  for (const b of bloques) delete b._d;
  const TERM = /^(!?)([a-z0-9-]+)(?:\/([a-z0-9-]+)(?:(=)([a-z0-9|-]+)|(>)(\d+)))?$/;
  const reglas = [];
  (svFilas(wb, "Reglas") || []).slice(1).forEach((r, k) => {
    const i = k + 2; if (!r || !r[0] || !r[1]) return;
    const [rid, cond, pts, tes, ten, rblk] = r.concat(Array(6).fill(null));
    const terminos = [];
    for (const t of String(cond).split("&").map((x) => x.trim()).filter(Boolean)) {
      const m = TERM.exec(t); if (!m) { errores.push(`Reglas fila ${i} (${rid}): no entiendo «${t}»`); continue; }
      const [, neg, b, d, eq, opts, , n] = m;
      if (!idx[b]) { errores.push(`Reglas fila ${i} (${rid}): no existe el bloque «${b}»`); continue; }
      const term = { bloque: b, no: !!neg };
      if (d) {
        const dec = idx[b].decisiones.find((x) => x.id === d);
        if (!dec) { errores.push(`Reglas fila ${i} (${rid}): no existe la decisión «${b}/${d}»`); continue; }
        term.decision = d;
        if (eq) { term.opciones = opts.split("|"); for (const o of term.opciones) if (!dec.opciones.some((x) => x.id === o)) errores.push(`Reglas fila ${i} (${rid}): no existe la opción «${b}/${d}=${o}»`); }
        else term.mayor_que = Number(n);
      }
      terminos.push(term);
    }
    const regla = { id: String(rid).trim(), terminos, puntos: svNum(pts), texto: svTxt(ten || tes, tes) };
    if (rblk) { if (!idx[svSlug(rblk)]) errores.push(`Reglas fila ${i} (${rid}): no existe el bloque «${rblk}» de la columna Bloque`); else regla.bloque = svSlug(rblk); }
    reglas.push(regla);
  });
  if (!(svNum(P.presupuesto) > 0)) errores.push("Actividad: el presupuesto debe ser mayor que 0.");
  for (const o of obligatorios) if (!idx[o]) errores.push(`Actividad: el bloque obligatorio «${o}» no existe en Opciones.`);
  const act = {
    schema: "sortivia-actividad/3", id: aid, metodologia: "ESTOPA",
    titulo: { es: P.titulo_es || P.id, en: P.titulo_en || P.titulo_es || P.id },
    resumen: { es: P.resumen_es || "", en: P.resumen_en || P.resumen_es || "" },
    presupuesto: svNum(P.presupuesto), numeros: Math.trunc(svNum(P.numeros || 10)), rondas: Math.trunc(svNum(P.rondas || 2)),
    puntos_por_numero: svNum(P.puntos_por_numero || 10), bloques_obligatorios: obligatorios, bloques,
  };
  if (P.unidad_es || P.unidad_en) act.unidad = { es: String(P.unidad_es || P.unidad_en).trim(), en: String(P.unidad_en || P.unidad_es).trim() };
  if (P.asignatura) act.asignatura = String(P.asignatura).trim();
  const clave = { schema: "sortivia-clave/3", actividad: aid, puntos, reglas };
  return { act, clave, errores, objetivo: svNum(P.puntos_objetivo || 99) };
}

/* ---------- Estrategia óptima (recocido simulado con el motor de la app) ---------- */
function svRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
async function svOptimizar(act, clave, presupuesto, { reinicios = 14, iteraciones = 9000, semillas = [1, 2, 3, 4], progreso } = {}) {
  const P = clave.puntos;
  const enReglas = new Set((clave.reglas || []).flatMap((r) => r.terminos.map((t) => `${t.bloque}/${t.decision || ""}`)));
  const pts = (b, d, o) => Number(P[`${b.id}/${d.id}/${o.id}`] || 0);
  const libres = [], fijas = [];
  for (const b of act.bloques) for (const d of b.decisiones) {
    const gratis = d.tipo !== "contador" && d.opciones.every((o) => o.coste.valor === 0 || (o.coste.tipo === "mult" && o.coste.valor === 1));
    if (gratis && !enReglas.has(`${b.id}/${d.id}`)) { const m = d.opciones.reduce((x, y) => (pts(b, d, y) > pts(b, d, x) ? y : x)).id; fijas.push([b.id, d.id, d.tipo === "multiple" ? [m] : m]); }
    else libres.push([b, d]);
  }
  const opcionales = act.bloques.filter((b) => !act.bloques_obligatorios.includes(b.id));
  const valor = (el) => svPuntos(act, clave, el).total - svCosteTotal(act, el) * 1e-5;
  const copia = (el) => JSON.parse(JSON.stringify(el));
  let mejor = null, mejorV = -Infinity, hecho = 0;
  const total = semillas.length * reinicios * iteraciones;
  for (const sem of semillas) {
    const rnd = svRng(sem), pick = (a) => a[Math.floor(rnd() * a.length)];
    const aleatoria = (d) => d.tipo === "contador" ? pick([0, 0, 1, 2]) : d.tipo === "multiple" ? [...d.opciones].sort(() => rnd() - 0.5).slice(0, 1 + Math.floor(rnd() * Math.min(3, d.opciones.length))).map((o) => o.id) : pick(d.opciones).id;
    const nueva = (pInc) => { const el = svEleccionVacia(act); for (const [b, d, v] of fijas) el.bloques[b].dec[d] = Array.isArray(v) ? [...v] : v; for (const [b, d] of libres) el.bloques[b.id].dec[d.id] = aleatoria(d); for (const b of opcionales) el.bloques[b.id].incluido = rnd() < pInc; return el; };
    for (let r = 0; r < reinicios; r++) {
      let el = nueva(0), intentos = 0;
      while (svCosteTotal(act, el) > presupuesto && intentos++ < 200) el = nueva(0.3);
      let v = valor(el);
      for (let i = 0; i < iteraciones; i++) {
        const T = 8 * Math.pow(0.05 / 8, i / iteraciones), e = copia(el);
        if (rnd() < 0.15 && opcionales.length) { const b = pick(opcionales); e.bloques[b.id].incluido = !e.bloques[b.id].incluido; }
        else {
          const [b, d] = pick(libres), cur = e.bloques[b.id].dec[d.id];
          if (d.tipo === "contador") e.bloques[b.id].dec[d.id] = Math.max(0, Math.min(5, (Number(cur) || 0) + (rnd() < 0.5 ? -1 : 1)));
          else if (d.tipo === "multiple") { const s = new Set(cur || []), o = pick(d.opciones).id; if (s.has(o) && s.size > 1) s.delete(o); else s.add(o); e.bloques[b.id].dec[d.id] = [...s].sort(); }
          else e.bloques[b.id].dec[d.id] = pick(d.opciones).id;
        }
        if (svCosteTotal(act, e) <= presupuesto) {
          const v2 = valor(e);
          if (v2 >= v || rnd() < Math.exp((v2 - v) / T)) { el = e; v = v2; if (v > mejorV) { mejorV = v; mejor = copia(el); } }
        }
        if (++hecho % 3000 === 0) { if (progreso) progreso(hecho / total); await new Promise((res) => setTimeout(res, 0)); }
      }
    }
  }
  if (mejor) {   // limpieza: quita opciones de más que no aportan puntos (deja la estrategia mínima equivalente)
    const total = svPuntos(act, clave, mejor).total;
    for (const b of act.bloques) for (const d of b.decisiones) {
      if (d.tipo !== "multiple") continue;
      for (const o of [...(mejor.bloques[b.id].dec[d.id] || [])]) {
        const cur = mejor.bloques[b.id].dec[d.id]; if (cur.length < 2) break;
        mejor.bloques[b.id].dec[d.id] = cur.filter((x) => x !== o);
        if (svPuntos(act, clave, mejor).total < total) mejor.bloques[b.id].dec[d.id] = cur;
      }
    }
  }
  return { bruto: mejor ? svPuntos(act, clave, mejor).total : 0, plan: mejor };
}
