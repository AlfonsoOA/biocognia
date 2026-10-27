/* ============================================================
   DEAba Digital — núcleo común (grupos, panel, guía e impresión)
   BIOCOGNIA · Open Educational Technology · Alfonso Olaya Abril
   ============================================================ */
"use strict";
const DB_VERSION = "0.2.2";

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function dbT(x, lang) { return x && typeof x === "object" ? (x[lang] || x.es || x.en || "") : (x == null ? "" : String(x)); }
function dbLang() { try { return localStorage.getItem("db.lang") || ((navigator.language || "es").startsWith("es") ? "es" : "en"); } catch (e) { return "es"; } }
function dbSetLang(l) { try { localStorage.setItem("db.lang", l); } catch (e) {} }
function dbCodigo(n = 5) { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join(""); }
// Fold change con la convención de clase: si el cociente es < 1, se expresa como −1/valor.
function dbFC(n1, n2) {
  if (!n1 && !n2) return null; // no detectado en ninguna
  if (!n2) return Infinity; if (!n1) return -Infinity;
  const r = n1 / n2; return r >= 1 ? r : -1 / r;
}
function dbFmtFC(fc, lang = "es") {
  if (fc === null || fc === undefined || Number.isNaN(fc)) return lang === "en" ? "n.d." : "n.d.";
  if (fc === Infinity) return lang === "en" ? "only in 1" : "solo en 1";
  if (fc === -Infinity) return lang === "en" ? "only in 2" : "solo en 2";
  const v = Math.abs(fc) >= 10 ? Math.round(fc) : Math.round(fc * 10) / 10;
  const s = (v > 0 ? "+" : "") + String(v);
  return lang === "en" ? s : s.replace(".", ",");
}
// Dirección observada a partir del FC: por debajo de 1,5 en valor absoluto se considera «sin cambio».
function dbDir(fc, umbral = 1.5) { if (fc === null) return "igual"; return fc >= umbral ? "sube" : fc <= -umbral ? "baja" : "igual"; }
const DB_DIRS = { sube: { es: "sube", en: "goes up", s: "↑" }, baja: { es: "baja", en: "goes down", s: "↓" }, igual: { es: "no cambia", en: "no change", s: "≈" } };

/* ---------- Rutas y actividades ---------- */
let DB_RUTAS = [];
async function dbCargarRutas(base = "") { if (DB_RUTAS.length) return DB_RUTAS; const r = await fetch(base + "rutas.json"); DB_RUTAS = await r.json(); return DB_RUTAS; }
function dbRuta(id, lang) { const r = DB_RUTAS.find((x) => x.id === id); return r ? (r[lang] || r.es) : id; }
/* ---------- Catálogo de nombres y autocompletado ---------- */
// Solo nombres (metabolitos, cofactores, enzimas y las moléculas de la actividad): ayuda a escribir, no da la reacción.
let DB_CAT = null;
async function dbCargarCatalogo(base = "") { if (DB_CAT) return DB_CAT; try { const r = await fetch(base + "catalogo.json"); DB_CAT = await r.json(); } catch (e) { DB_CAT = { metabolitos: [], enzimas: [] }; } return DB_CAT; }
function dbNombres(lang, extra = []) {
  const vistos = new Set(), out = [];
  for (const n of [...extra, ...((DB_CAT && DB_CAT.metabolitos) || []), ...((DB_CAT && DB_CAT.enzimas) || [])]) {
    const t = dbT(n, lang), k = dbNorm(t); if (!t || vistos.has(k)) continue; vistos.add(k); out.push({ t, k, kc: k.replace(/ /g, "") });
  }
  return out;
}
// Busca sugerencias para las últimas 1–3 palabras antes del cursor. Devuelve { n (palabras a sustituir), sug: [nombres] }.
const DB_CORTAS = new Set("de la el en se un es no si su lo al ya le me te mi tu ni os nos y o a of to in is it on an as at by or be we he if so up do".split(" "));
function dbSugerencias(antes, nombres, max = 6) {
  // La coma no separa: forma parte de nombres como «fructosa-1,6-bisfosfato».
  const m = antes.match(/[^\s+→=;:()\/]+(?:\s+[^\s+→=;:()\/]+){0,2}$/u); if (!m) return null;
  const pal = m[0].split(/\s+/);
  for (let k = pal.length; k >= 1; k--) {
    const q = dbNorm(pal.slice(-k).join(" ")).replace(/\|/g, "").trim();
    // Una sola palabra: basta con 2 letras (ADP, ATP, NAD…), salvo palabras corrientes («de», «la», «en»…).
    if (q.length < (k === 1 ? 2 : 4) || (k === 1 && q.length === 2 && DB_CORTAS.has(q))) continue;
    // Se compara con y sin espacios: «acilg» encuentra «Acil graso-CoA» y «acetilcoa», «Acetil-CoA».
    const qc = q.replace(/ /g, ""), empieza = (x) => x.k.startsWith(q) || x.kc.startsWith(qc);
    const ini = nombres.filter(empieza).sort((a, b) => a.t.length - b.t.length), dentro = nombres.filter((x) => !empieza(x) && x.k.includes(" " + q));
    const sug = [...ini, ...dentro].slice(0, max).map((x) => x.t);
    if (sug.length && !(sug.length === 1 && dbNorm(sug[0]) === q)) return { n: k, texto: pal.slice(-k).join(" "), sug };
  }
  return null;
}
function dbBuscarRutas(q, lang, excluir = []) { const k = dbNorm(q); return DB_RUTAS.filter((r) => !excluir.includes(r.id) && (!k || dbNorm(r[lang] || r.es).includes(k) || dbNorm(r.es).includes(k))).slice(0, k ? 10 : 40); }

// Actividades: primero las del repositorio (archivos estáticos); si no está, las creadas desde el panel (Firebase).
async function dbActividad(id, base = "") {
  try { const r = await fetch(`${base}actividades/${encodeURIComponent(id)}.json`); if (r.ok) return r.json(); } catch (e) {}
  const a = await DBB.actividadFS(id).catch(() => null); if (!a || !a.datos) throw new Error("actividad " + id);
  return { ...a.datos, autor: a.autor_nombre || a.datos.autor || "" };
}
async function dbIndice(base = "") { try { const r = await fetch(base + "actividades/index.json"); return r.ok ? r.json() : []; } catch (e) { return []; } }
function dbTareas(act, lang = "es") {
  const en = lang === "en";
  return act.tipo === 1
    ? [en ? "Reactions" : "Reacciones", en ? "Pathways" : "Rutas", en ? "Metabolic diagnosis" : "Diagnóstico metabólico"]
    : [en ? "Experimental conditions" : "Condiciones experimentales", en ? "Enzymes, reactions and pathways" : "Enzimas, reacciones y rutas", en ? "Fold-change estimates" : "Estimación del fold change"];
}

/* ---------- Detección de conceptos (ayuda para el profesor, no corrige) ---------- */
const DB_NEG = new Set(["no", "sin", "ni", "nunca", "tampoco", "ningun", "ninguna", "ninguno", "jamas", "not", "without", "never", "nor"]);
function dbNorm(s) {
  return String(s || "").toLowerCase()
    .replace(/β/g, " beta ").replace(/α/g, " alfa ").replace(/γ/g, " gamma ").replace(/[δΔ]/g, " delta ").replace(/₂/g, "2").replace(/⁺/g, "")
    .replace(/[.;:!?\n]+/g, " | ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9*|]+/g, " ").trim();
}
// «|» marca el final de una frase o de un campo: la negación no lo cruza.
function dbTokens(s) { return dbNorm(s).replace(/\*/g, "").split(" ").filter(Boolean); }
function dbTermino(s) { return dbNorm(s).replace(/\|/g, " ").split(" ").filter(Boolean); }
// Posiciones en las que aparece un término (varias palabras; «*» final = cualquier terminación).
function dbBuscar(tokens, termino) {
  const t = dbTermino(termino); if (!t.length) return [];
  const pos = [];
  for (let i = 0; i + t.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < t.length && ok; j++) { const w = t[j]; ok = w.endsWith("*") ? tokens[i + j].startsWith(w.slice(0, -1)) : tokens[i + j] === w; }
    if (ok) pos.push(i);
  }
  return pos;
}
function dbNegado(tokens, i) { for (let k = i - 1; k >= Math.max(0, i - 3); k--) { if (tokens[k] === "|") return false; if (DB_NEG.has(tokens[k])) return true; } return false; }
// Devuelve "si" | "negado" | "no" para un concepto { alternativas: [[t1, t2…], …] }.
function dbConcepto(texto, c) {
  const tk = dbTokens(texto); let neg = false;
  for (const alt of c.alternativas || []) {
    const hits = alt.map((t) => dbBuscar(tk, t));
    if (hits.every((h) => h.length)) {
      if (hits.every((h) => h.some((i) => !dbNegado(tk, i)))) return "si";
      neg = true;
    }
  }
  return neg ? "negado" : "no";
}
function dbConceptos(texto, lista) { const o = {}; for (const c of lista || []) o[c.id] = dbConcepto(texto, c); return o; }
// Texto completo de la respuesta de un grupo (para buscar conceptos en todo lo que ha escrito).
function dbTextoGrupo(act, r) {
  if (!r) return "";
  const p = [];
  if (act.tipo === 1) {
    for (const m of Object.values(r.mol || {})) p.push(m.reac || "");
    for (const f of r.frases || []) p.push(f.porque || "");
    p.push((r.diag && r.diag.c1) || "", (r.diag && r.diag.c2) || "", r.justif || "");
  } else {
    p.push((r.cond && r.cond.porque) || "", (r.cond && r.cond.otra1) || "", (r.cond && r.cond.otra2) || "");
    for (const m of Object.values(r.marc || {})) p.push(m.reac || "");
    p.push(r.justif || "", r.revision || "");
  }
  return p.join(" \n ");
}

/* ---------- Respuestas: vacías y pendientes ---------- */
function dbVacia(act) {
  return act.tipo === 1
    ? { mol: Object.fromEntries(act.moleculas.map((m) => [m.id, { reac: "", rutas: [] }])), frases: [{ mol: "", dir: "", porque: "", ruta: "" }], diag: { c1: "", c2: "" }, justif: "" }
    : { cond: { c1: "", c2: "", otra1: "", otra2: "", porque: "" }, marc: {}, justif: "" };
}
const DB_MIN_FRASES = 3;
function dbPendientes(act, r, lang = "es") {
  const en = lang === "en", f = [];
  if (act.tipo === 1) {
    const sinR = act.moleculas.filter((m) => !((r.mol[m.id] || {}).reac || "").trim()).length;
    const sinRu = act.moleculas.filter((m) => !((r.mol[m.id] || {}).rutas || []).length).length;
    if (sinR) f.push(en ? `${sinR} molecules without a reaction` : `${sinR} moléculas sin reacción`);
    if (sinRu) f.push(en ? `${sinRu} molecules without a pathway` : `${sinRu} moléculas sin ruta`);
    const ok = (r.frases || []).filter((x) => x.mol && x.dir && (x.porque || "").trim()).length;
    if (ok < DB_MIN_FRASES) f.push(en ? `at least ${DB_MIN_FRASES} complete reasoning sentences (you have ${ok})` : `al menos ${DB_MIN_FRASES} frases de razonamiento completas (lleváis ${ok})`);
    if (!(r.diag.c1 || "").trim()) f.push(en ? `what is happening in ${dbT(act.condiciones.c1, lang)}` : `qué ocurre en la ${dbT(act.condiciones.c1, lang)}`);
  } else {
    const c = r.cond;
    if (!c.c1 || !c.c2) f.push(en ? "choose both conditions" : "elegir las dos condiciones");
    else if (c.c1 === c.c2 && c.c1 !== "otra") f.push(en ? "the two conditions must differ" : "las dos condiciones deben ser distintas");
    if ((c.c1 === "otra" && !(c.otra1 || "").trim()) || (c.c2 === "otra" && !(c.otra2 || "").trim())) f.push(en ? "describe the condition you propose" : "describir la condición que proponéis");
    if (!(c.porque || "").trim()) f.push(en ? "justify the comparison" : "justificar la comparación");
    for (const [t, n] of [["enzima", act.n_enzimas], ["metabolito", act.n_metabolitos]]) {
      const k = Object.keys(r.marc).filter((id) => (act.catalogo.find((m) => m.id === id) || {}).tipo === t).length;
      if (k !== n) f.push(en ? `choose ${n} ${t === "enzima" ? "enzymes" : "metabolites"} (you have ${k})` : `elegir ${n} ${t === "enzima" ? "enzimas" : "metabolitos"} (lleváis ${k})`);
    }
    const inc = Object.entries(r.marc).filter(([, m]) => !(m.reac || "").trim() || !(m.rutas || []).length || !m.dir || !(String(m.fc || "").trim())).length;
    if (inc) f.push(en ? `${inc} markers incomplete (reaction, pathway, direction and FC)` : `${inc} marcadores incompletos (reacción, ruta, dirección y FC)`);
  }
  return f;
}
// Fold change estimado por el grupo: admite «+5», «-3», «5», «x5», «≈1».
function dbLeerFC(s) { const m = String(s || "").replace(",", ".").match(/[-−]?\d+(\.\d+)?/); return m ? Number(m[0].replace("−", "-")) : null; }

/* ---------- Almacenamiento: Firebase o demo local ---------- */
// Grupos:  init() · sesion(sid) · unirse(sid, nombre) · verGrupo(sid, cb) · cambiarGrupo(sid, patch) · verSesion(sid, cb)
// Panel:   entrarAdmin() · rol(uid) · perfil(uid) · crearSesion(datos) · sesiones(todas) · verGrupos(sid, cb) · cambiarGrupoAdmin(sid, gid, patch)
//          · borrarGrupo(sid, gid) · cambiarSesion(sid, patch) · guia(aid) · guardarGuia(aid, guia) · guias()
const DB_ADMINS = ["cMZwT1gAQHa5EmohnmYV9YmY4XT2"];
function dbDemo() { try { return new URLSearchParams(location.search).has("demo") || !(window.QUAESTIA_FIREBASE && window.QUAESTIA_FIREBASE.config); } catch (e) { return true; } }
// Mismas restricciones que Firestore: sin «undefined» y sin listas dentro de listas.
function dbComprobar(v, ruta = "") {
  if (v === undefined) throw new Error(`valor vacío (undefined) en «${ruta}»`);
  if (Array.isArray(v) && v.some(Array.isArray)) throw new Error(`Firestore no admite listas dentro de listas («${ruta}»)`);
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) dbComprobar(x, ruta ? `${ruta}.${k}` : k);
}
// Las guías llevan listas anidadas (conceptos → alternativas): se guardan como texto JSON.
const dbGuiaGuardar = (g) => ({ schema: g.schema || "deaba-guia/1", actividad: g.actividad || "", json: JSON.stringify(g) });
const dbGuiaLeer = (d) => (d && typeof d.json === "string" ? JSON.parse(d.json) : d || null);

function dbBackendDemo() {
  const KEY = "deaba.demo";
  const vacio = () => ({ sesiones: {}, guias: {}, profesores: {}, actividades: {} });
  const read = () => { try { return { ...vacio(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { return vacio(); } };
  const write = (d) => { dbComprobar(d.sesiones, "sesiones"); dbComprobar(d.actividades, "actividades"); localStorage.setItem(KEY, JSON.stringify(d)); window.dispatchEvent(new Event("db-demo")); };
  let me; try { me = sessionStorage.getItem("db.uid") || ("demo-" + dbCodigo(8)); sessionStorage.setItem("db.uid", me); } catch (e) { me = "demo-" + dbCodigo(8); }
  const watchers = []; const fire = () => watchers.forEach((w) => w());
  window.addEventListener("storage", (e) => { if (e.key === KEY) fire(); });
  window.addEventListener("db-demo", fire);
  const watch = (fn) => { watchers.push(fn); fn(); };
  return {
    demo: true,
    async init() { return me; }, uid: () => me,
    async sesion(sid) { const s = read().sesiones[sid]; return s ? { ...s, grupos: undefined } : null; },
    async unirse(sid, nombre) { const d = read(); const s = d.sesiones[sid]; if (!s || s.estado !== "abierta") throw new Error("sesion"); s.grupos[me] = s.grupos[me] || { nombre, estado: "editando", resp: null, actualizado: Date.now() }; s.grupos[me].nombre = nombre; write(d); },
    verGrupo(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s && s.grupos[me] ? s.grupos[me] : null); }); },
    async cambiarGrupo(sid, patch) { dbComprobar(patch); const d = read(); Object.assign(d.sesiones[sid].grupos[me], patch, { actualizado: Date.now() }); write(d); },
    verSesion(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s ? { ...s, grupos: undefined } : null); }); },
    async entrarAdmin() { const prof = new URLSearchParams(location.search).get("rol") === "profesor"; const uid = prof ? "demo-profesor" : "demo-admin"; me = uid; return { uid, email: prof ? "profesor@demo" : "admin@demo", nombre: prof ? "Profesora de prueba" : "Administrador (demo)" }; },
    async rol(uid) { return uid === "demo-admin" ? "admin" : uid === "demo-profesor" ? "profesor" : null; },
    async perfil() { return null; },
    async crearSesion(datos) { const d = read(); const sid = dbCodigo(5); d.sesiones[sid] = { ...datos, propietario: me, estado: "abierta", creada: Date.now(), grupos: {} }; write(d); return sid; },
    async sesiones(todas) { const d = read(); return Object.entries(d.sesiones).map(([id, s]) => ({ id, ...s, grupos: undefined })).filter((s) => todas || s.propietario === me).sort((a, b) => b.creada - a.creada); },
    verGrupos(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s ? Object.entries(s.grupos).map(([id, g]) => ({ id, ...g })) : []); }); },
    async cambiarGrupoAdmin(sid, gid, patch) { dbComprobar(patch); const d = read(); Object.assign(d.sesiones[sid].grupos[gid], patch); write(d); },
    async borrarGrupo(sid, gid) { const d = read(); delete d.sesiones[sid].grupos[gid]; write(d); },
    async cambiarSesion(sid, patch) { dbComprobar(patch); const d = read(); Object.assign(d.sesiones[sid], patch); write(d); },
    // En demo, si la guía no se ha subido, se busca en guias/<id>.guia.json (carpeta local que NO va al repositorio).
    async guia(aid) { const g = read().guias[aid]; if (g) return dbGuiaLeer(g); try { const r = await fetch(`guias/${encodeURIComponent(aid)}.guia.json`); return r.ok ? r.json() : null; } catch (e) { return null; } },
    async guardarGuia(aid, guia) { const d = read(), x = dbGuiaGuardar(guia); dbComprobar(x); d.guias[aid] = x; write(d); },
    async guias() { return Object.keys(read().guias); },
    async actividadesFS() { return Object.entries(read().actividades || {}).map(([id, a]) => ({ id, ...a })); },
    async actividadFS(aid) { return (read().actividades || {})[aid] || null; },
    async guardarActividad(aid, doc) { dbComprobar(doc); const d = read(); d.actividades = d.actividades || {}; d.actividades[aid] = doc; write(d); },
    async cambiarActividad(aid, patch) { const d = read(); Object.assign(d.actividades[aid], patch); write(d); },
    async borrarActividad(aid) { const d = read(); delete d.actividades[aid]; delete d.guias[aid]; write(d); },
  };
}

function dbBackendFirebase() {
  const B = "https://www.gstatic.com/firebasejs/10.12.2/";
  let M = null, auth, db;
  const ready = (async () => {
    const [appM, authM, fsM] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
    const app = appM.initializeApp(window.QUAESTIA_FIREBASE.config);
    auth = authM.getAuth(app); db = fsM.initializeFirestore(app, { ignoreUndefinedProperties: true }); M = { authM, fsM };
    await auth.authStateReady();
  })();
  ready.catch(() => {}); // sin conexión: cada llamada informará del error
  const F = () => M.fsM;
  const sref = (sid) => F().doc(db, "deaba_sesiones", sid);
  const gref = (sid, gid) => F().doc(db, "deaba_sesiones", sid, "grupos", gid);
  return {
    demo: false,
    async init() { await ready; if (!auth.currentUser) await M.authM.signInAnonymously(auth); return auth.currentUser.uid; },
    uid: () => auth.currentUser && auth.currentUser.uid,
    async sesion(sid) { await ready; const s = await F().getDoc(sref(sid)); return s.exists() ? s.data() : null; },
    async unirse(sid, nombre) {
      const uid = await this.init(); const ref = gref(sid, uid); const s = await F().getDoc(ref).catch(() => null);
      if (s && s.exists()) await F().updateDoc(ref, { nombre, actualizado: F().serverTimestamp() });
      else await F().setDoc(ref, { nombre, estado: "editando", resp: null, actualizado: F().serverTimestamp() });
    },
    verGrupo(sid, cb) { F().onSnapshot(gref(sid, auth.currentUser.uid), (d) => cb(d.exists() ? d.data() : null), () => cb(null)); },
    async cambiarGrupo(sid, patch) { await F().updateDoc(gref(sid, auth.currentUser.uid), { ...patch, actualizado: F().serverTimestamp() }); },
    verSesion(sid, cb) { F().onSnapshot(sref(sid), (d) => cb(d.exists() ? d.data() : null), () => {}); },
    async entrarAdmin() { await ready; const r = await M.authM.signInWithPopup(auth, new M.authM.GoogleAuthProvider()); return { uid: r.user.uid, email: r.user.email, nombre: r.user.displayName || "" }; },
    async rol(uid) { if (DB_ADMINS.includes(uid)) return "admin"; try { const p = await F().getDoc(F().doc(db, "profesores", uid)); return p.exists() && p.data().activo ? "profesor" : null; } catch (e) { return null; } },
    async perfil(uid) { try { const p = await F().getDoc(F().doc(db, "profesores", uid)); return p.exists() ? p.data() : null; } catch (e) { return null; } },
    async crearSesion(datos) { const sid = dbCodigo(5); await F().setDoc(sref(sid), { ...datos, propietario: auth.currentUser.uid, estado: "abierta", creada: Date.now() }); return sid; },
    async sesiones(todas) {
      const col = F().collection(db, "deaba_sesiones");
      const q = await F().getDocs(todas ? col : F().query(col, F().where("propietario", "==", auth.currentUser.uid)));
      return q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.creada - a.creada);
    },
    verGrupos(sid, cb) { F().onSnapshot(F().collection(db, "deaba_sesiones", sid, "grupos"), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() })))); },
    async cambiarGrupoAdmin(sid, gid, patch) { await F().updateDoc(gref(sid, gid), patch); },
    async borrarGrupo(sid, gid) { await F().deleteDoc(gref(sid, gid)); },
    async cambiarSesion(sid, patch) { await F().updateDoc(sref(sid), patch); },
    async guia(aid) { await ready; try { const s = await F().getDoc(F().doc(db, "deaba_guias", aid)); return s.exists() ? dbGuiaLeer(s.data()) : null; } catch (e) { return null; } },
    async guardarGuia(aid, guia) { await F().setDoc(F().doc(db, "deaba_guias", aid), dbGuiaGuardar(guia)); },
    async guias() { try { const q = await F().getDocs(F().collection(db, "deaba_guias")); return q.docs.map((d) => d.id); } catch (e) { return []; } },
    async actividadesFS() { await ready; const q = await F().getDocs(F().collection(db, "deaba_actividades")); return q.docs.map((d) => ({ id: d.id, ...d.data() })); },
    async actividadFS(aid) { await ready; const s = await F().getDoc(F().doc(db, "deaba_actividades", aid)); return s.exists() ? s.data() : null; },
    async guardarActividad(aid, doc) { await F().setDoc(F().doc(db, "deaba_actividades", aid), doc); },
    async cambiarActividad(aid, patch) { await F().updateDoc(F().doc(db, "deaba_actividades", aid), patch); },
    async borrarActividad(aid) { await F().deleteDoc(F().doc(db, "deaba_guias", aid)).catch(() => {}); await F().deleteDoc(F().doc(db, "deaba_actividades", aid)); },
  };
}
const DBB = dbDemo() ? dbBackendDemo() : dbBackendFirebase();
