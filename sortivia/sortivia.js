/* ============================================================
   SORTIVIA — núcleo común (grupos y panel del profesor)
   BIOCOGNIA · Open Educational Technology · Alfonso Olaya Abril
   ============================================================ */
"use strict";
const SV_VERSION = "0.1.0";

/* ---------- Cálculo de costes y puntos ---------- */
// eleccion = { bloques: { [bloque]: { incluido: bool, dec: { [decision]: idOpcion | true } } } }
function svOpcion(dec, id) { return dec.opciones.find((o) => o.id === id); }
function svIncluido(act, eleccion, b) { return act.bloques_obligatorios.includes(b.id) || !!(eleccion.bloques[b.id] && eleccion.bloques[b.id].incluido); }
function svCosteBloque(b, sel) {
  let base = 0, mult = 1, fijo = 0;
  for (const d of b.decisiones) {
    const v = sel && sel.dec ? sel.dec[d.id] : undefined;
    if (v === undefined || v === false || v === null) continue;
    const o = d.opcional ? d.opciones[0] : svOpcion(d, v);
    if (!o) continue;
    if (o.coste.tipo === "base") base += o.coste.valor;
    else if (o.coste.tipo === "mult") mult *= o.coste.valor;
    else fijo += o.coste.valor;
  }
  return Math.round((base * mult + fijo) * 100) / 100;
}
function svCosteTotal(act, eleccion) {
  return act.bloques.reduce((s, b) => s + (svIncluido(act, eleccion, b) ? svCosteBloque(b, eleccion.bloques[b.id]) : 0), 0);
}
function svPendientes(act, eleccion) {
  // Decisiones obligatorias sin responder en los bloques incluidos.
  const falta = [];
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) if (!d.opcional && !(sel.dec && sel.dec[d.id])) falta.push(`${b.nombre} · ${d.nombre}`);
  }
  return falta;
}
function svPuntos(act, clave, eleccion) {
  let total = 0; const detalle = [];
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) {
      const v = sel.dec && sel.dec[d.id];
      if (!v) continue;
      const oid = d.opcional ? d.opciones[0].id : v;
      const p = Number(clave.puntos[`${b.id}/${d.id}/${oid}`] || 0);
      total += p; detalle.push({ bloque: b.id, decision: d.id, opcion: oid, puntos: p });
    }
  }
  return { total, detalle };
}
function svNumeros(act, puntos) { return Math.max(0, Math.min(act.numeros, Math.floor(puntos / act.puntos_por_numero))); }
function svEleccionVacia(act) { const e = { bloques: {} }; for (const b of act.bloques) e.bloques[b.id] = { incluido: act.bloques_obligatorios.includes(b.id), dec: {} }; return e; }
function svAleatorio(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % n) + 1; }
function svCodigo(n = 5) { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join(""); }
function svEur(n, lang) { return new Intl.NumberFormat(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 0 }).format(Math.round(n)) + " €"; }
function svPrecio(o, lang) { return o.coste.tipo === "mult" ? `×${String(o.coste.valor).replace(".", lang === "en" ? "." : ",")}` : (o.coste.valor ? svEur(o.coste.valor, lang) : (lang === "en" ? "no cost" : "sin coste")); }
async function svCargarActividad(id) { const r = await fetch(`actividades/${encodeURIComponent(id)}.json`); if (!r.ok) throw new Error("actividad " + id); return r.json(); }

/* ---------- Almacenamiento: Firebase o demo local ---------- */
// Interfaz común:
//   uid() · sesion(sid) · unirse(sid, nombre) · verGrupo(sid, cb) · cambiarGrupo(sid, patch)
//   (panel) entrarAdmin() · crearSesion(datos) · sesiones() · verGrupos(sid, cb) · cambiarGrupoAdmin(sid, gid, patch)
//          · borrarGrupo(sid, gid) · cerrarSesion(sid) · clave(aid) · guardarClave(aid, clave)
function svDemo() { try { return new URLSearchParams(location.search).has("demo") || !(window.QUAESTIA_FIREBASE && window.QUAESTIA_FIREBASE.config); } catch (e) { return true; } }

function svBackendDemo() {
  const KEY = "sortivia.demo";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { sesiones: {}, claves: {} }; } catch (e) { return { sesiones: {}, claves: {} }; } };
  const write = (d) => { localStorage.setItem(KEY, JSON.stringify(d)); window.dispatchEvent(new Event("sv-demo")); };
  let me; try { me = sessionStorage.getItem("sv.uid") || ("demo-" + svCodigo(8)); sessionStorage.setItem("sv.uid", me); } catch (e) { me = "demo-" + svCodigo(8); }
  const watchers = [];
  const fire = () => watchers.forEach((w) => w());
  window.addEventListener("storage", (e) => { if (e.key === KEY) fire(); });
  window.addEventListener("sv-demo", fire);
  const watch = (fn) => { watchers.push(fn); fn(); };
  return {
    demo: true,
    async init() { return me; }, uid: () => me,
    async sesion(sid) { const s = read().sesiones[sid]; return s ? { ...s, grupos: undefined } : null; },
    async unirse(sid, nombre) { const d = read(); const s = d.sesiones[sid]; if (!s || s.estado !== "abierta") throw new Error("sesion"); s.grupos[me] = s.grupos[me] || { nombre, ronda: 1, estado: "editando", eleccion: null, justif: {}, coste: 0, actualizado: Date.now() }; s.grupos[me].nombre = nombre; write(d); },
    verGrupo(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s && s.grupos[me] ? s.grupos[me] : null); }); },
    async cambiarGrupo(sid, patch) { const d = read(); Object.assign(d.sesiones[sid].grupos[me], patch, { actualizado: Date.now() }); write(d); },
    async entrarAdmin() { return { uid: me, email: "demo" }; },
    async crearSesion(datos) { const d = read(); const sid = svCodigo(5); d.sesiones[sid] = { ...datos, estado: "abierta", creada: Date.now(), grupos: {} }; write(d); return sid; },
    async sesiones() { const d = read(); return Object.entries(d.sesiones).map(([id, s]) => ({ id, ...s, grupos: undefined })).sort((a, b) => b.creada - a.creada); },
    verGrupos(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s ? Object.entries(s.grupos).map(([id, g]) => ({ id, ...g })) : []); }); },
    async cambiarGrupoAdmin(sid, gid, patch) { const d = read(); Object.assign(d.sesiones[sid].grupos[gid], patch); write(d); },
    async borrarGrupo(sid, gid) { const d = read(); delete d.sesiones[sid].grupos[gid]; write(d); },
    async cerrarSesion(sid) { const d = read(); d.sesiones[sid].estado = "cerrada"; write(d); },
    async clave(aid) { return read().claves[aid] || null; },
    async guardarClave(aid, clave) { const d = read(); d.claves[aid] = clave; write(d); },
  };
}

function svBackendFirebase() {
  const B = "https://www.gstatic.com/firebasejs/10.12.2/";
  let M = null, auth, db;
  const ready = (async () => {
    const [appM, authM, fsM] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
    const app = appM.initializeApp(window.QUAESTIA_FIREBASE.config);
    auth = authM.getAuth(app); db = fsM.getFirestore(app); M = { authM, fsM };
    await auth.authStateReady();
  })();
  const F = () => M.fsM;
  const gref = (sid, gid) => F().doc(db, "sesiones", sid, "grupos", gid);
  return {
    demo: false,
    async init() { await ready; if (!auth.currentUser) await M.authM.signInAnonymously(auth); return auth.currentUser.uid; },
    uid: () => auth.currentUser && auth.currentUser.uid,
    async sesion(sid) { await ready; const s = await F().getDoc(F().doc(db, "sesiones", sid)); return s.exists() ? s.data() : null; },
    async unirse(sid, nombre) {
      const uid = await this.init(); const ref = gref(sid, uid); const s = await F().getDoc(ref).catch(() => null);
      if (s && s.exists()) await F().updateDoc(ref, { nombre, actualizado: F().serverTimestamp() });
      else await F().setDoc(ref, { nombre, ronda: 1, estado: "editando", eleccion: null, justif: {}, coste: 0, elegidos: [], actualizado: F().serverTimestamp() });
    },
    verGrupo(sid, cb) { F().onSnapshot(gref(sid, auth.currentUser.uid), (d) => cb(d.exists() ? d.data() : null), () => cb(null)); },
    async cambiarGrupo(sid, patch) { await F().updateDoc(gref(sid, auth.currentUser.uid), { ...patch, actualizado: F().serverTimestamp() }); },
    async entrarAdmin() { await ready; const r = await M.authM.signInWithPopup(auth, new M.authM.GoogleAuthProvider()); return { uid: r.user.uid, email: r.user.email }; },
    async crearSesion(datos) { const sid = svCodigo(5); await F().setDoc(F().doc(db, "sesiones", sid), { ...datos, estado: "abierta", creada: Date.now() }); return sid; },
    async sesiones() { const q = await F().getDocs(F().collection(db, "sesiones")); return q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.creada - a.creada); },
    verGrupos(sid, cb) { F().onSnapshot(F().collection(db, "sesiones", sid, "grupos"), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() })))); },
    async cambiarGrupoAdmin(sid, gid, patch) { await F().updateDoc(gref(sid, gid), patch); },
    async borrarGrupo(sid, gid) { await F().deleteDoc(gref(sid, gid)); },
    async cerrarSesion(sid) { await F().updateDoc(F().doc(db, "sesiones", sid), { estado: "cerrada" }); },
    async clave(aid) { const s = await F().getDoc(F().doc(db, "claves", aid)); return s.exists() ? s.data() : null; },
    async guardarClave(aid, clave) { await F().setDoc(F().doc(db, "claves", aid), clave); },
  };
}
const SVB = svDemo() ? svBackendDemo() : svBackendFirebase();

/* ---------- Utilidades de interfaz ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function svLang() { try { return localStorage.getItem("sv.lang") || ((navigator.language || "es").startsWith("es") ? "es" : "en"); } catch (e) { return "es"; } }
function svSetLang(l) { try { localStorage.setItem("sv.lang", l); } catch (e) {} }
