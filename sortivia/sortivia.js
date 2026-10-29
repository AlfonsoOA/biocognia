/* ============================================================
   SORTIVIA — núcleo común (grupos y panel del profesor)
   BIOCOGNIA · Open Educational Technology · Alfonso Olaya Abril
   ============================================================ */
"use strict";
const SV_VERSION = "0.7.2";

/* ---------- Cálculo de costes y puntos ---------- */
// eleccion = { bloques: { [bloque]: { incluido: bool, dec: { [decision]: idOpcion | número (contadores) } } } }
// Coste de un bloque = condiciones × réplicas × (precio por muestra + Σ «por muestra») × Π «multiplicador» + Σ «fijo» + Σ unidades × «por unidad»
function svOpcion(dec, id) { return dec.opciones.find((o) => o.id === id); }
// Opciones elegidas en una decisión (única → 0 o 1; múltiple → varias).
function svElegidas(d, v) { if (d.tipo === "contador") return []; const ids = Array.isArray(v) ? v : (v ? [v] : []); return ids.map((id) => svOpcion(d, id)).filter(Boolean); }
function svIncluido(act, eleccion, b) { return act.bloques_obligatorios.includes(b.id) || !!(eleccion.bloques[b.id] && eleccion.bloques[b.id].incluido); }
function svCondiciones(act, eleccion) {
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) { const o = svElegidas(d, sel.dec && sel.dec[d.id])[0]; if (o && o.coste.tipo === "condiciones") return o.coste.valor; }
  }
  return 1;
}
// Réplicas comunes: un bloque sin decisión de réplicas usa las del primer bloque incluido que la tenga
// (p. ej., un diseño experimental único para toda la actividad). Si ninguno la tiene, 0.
function svTieneReplicas(b) { return b.decisiones.some((d) => d.opciones.some((o) => o.coste.tipo === "replicas")); }
function svReplicas(act, eleccion) {
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b) || !svTieneReplicas(b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) for (const o of svElegidas(d, sel.dec && sel.dec[d.id])) if (o.coste.tipo === "replicas") return o.coste.n;
    return 0;
  }
  return 0;
}
function svCosteBloque(b, sel, ncond = 1, nrep = 0) {
  let reps = svTieneReplicas(b) ? 0 : nrep, porMuestra = 0, mult = 1, fijo = 0, unidades = 0;
  for (const d of b.decisiones) {
    const v = sel && sel.dec ? sel.dec[d.id] : undefined;
    if (d.tipo === "contador") { const n = Math.max(0, Number(v) || 0); unidades += n * d.opciones[0].coste.valor; continue; }
    for (const o of svElegidas(d, v)) {
      const c = o.coste;
      if (c.tipo === "replicas") { reps = Math.max(reps, c.n); porMuestra += c.valor; }
      else if (c.tipo === "muestra") porMuestra += c.valor;
      else if (c.tipo === "mult") mult *= c.valor;
      else if (c.tipo === "fijo") fijo += c.valor;
    }
    // «condiciones» no cuesta por sí mismo: multiplica las muestras de todos los bloques.
  }
  return Math.round((ncond * reps * porMuestra * mult + fijo + unidades) * 100) / 100;
}
// Segundo límite opcional (p. ej., tiempo en minutos además del dinero): cada opción puede llevar coste.v2,
// que se suma tal cual (×unidades en los contadores). act.limite2 = { valor, unidad: { es, en } }.
function svCoste2Total(act, eleccion) {
  if (!act.limite2) return 0;
  let t = 0;
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) {
      const v = sel.dec ? sel.dec[d.id] : undefined;
      if (d.tipo === "contador") { t += Math.max(0, Number(v) || 0) * (d.opciones[0].coste.v2 || 0); continue; }
      for (const o of svElegidas(d, v)) t += o.coste.v2 || 0;
    }
  }
  return t;
}
function svCabe(act, eleccion) { return svCosteTotal(act, eleccion) <= act.presupuesto && (!act.limite2 || svCoste2Total(act, eleccion) <= act.limite2.valor); }
function svCosteTotal(act, eleccion) {
  const nc = svCondiciones(act, eleccion), nr = svReplicas(act, eleccion);
  return act.bloques.reduce((s, b) => s + (svIncluido(act, eleccion, b) ? svCosteBloque(b, eleccion.bloques[b.id], nc, nr) : 0), 0);
}
function svPendientes(act, eleccion, lang = "es") {
  // Decisiones de opción única sin responder en los bloques incluidos (los contadores pueden quedarse en 0).
  const falta = [];
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    for (const d of b.decisiones) if (d.tipo !== "contador" && !svElegidas(d, sel.dec && sel.dec[d.id]).length) falta.push(`${svT(b.nombre, lang)} · ${svT(d.nombre, lang)}`);
  }
  return falta;
}
function svTermino(act, eleccion, t) {
  const b = act.bloques.find((x) => x.id === t.bloque); if (!b) return false;
  const inc = svIncluido(act, eleccion, b);
  let ok;
  if (!t.decision) ok = inc;
  else {
    const d = b.decisiones.find((x) => x.id === t.decision), v = inc ? (eleccion.bloques[b.id] || { dec: {} }).dec[t.decision] : undefined;
    ok = inc && !!d && (t.opciones ? svElegidas(d, v).some((o) => t.opciones.includes(o.id)) : (Number(v) || 0) > t.mayor_que);
  }
  return t.no ? !ok : ok;
}
// Puntos de una decisión. En las de varias opciones cuenta la mejor positiva y restan todas las negativas.
function svPuntosDecision(d, v, P, bid) {
  if (d.tipo === "contador") {
    if (!(Number(v) > 0)) return { p: 0, det: [] };
    const p = Number(P[`${bid}/${d.id}/${d.opciones[0].id}`] || 0);
    return { p, det: [{ opcion: d.opciones[0].id, cantidad: Number(v), puntos: p, cuenta: true }] };
  }
  const ch = svElegidas(d, v).map((o) => ({ opcion: o.id, puntos: Number(P[`${bid}/${d.id}/${o.id}`] || 0) }));
  if (d.tipo !== "multiple") { ch.forEach((x) => (x.cuenta = true)); return { p: ch.reduce((s, x) => s + x.puntos, 0), det: ch }; }
  const pos = ch.filter((x) => x.puntos > 0), best = pos.length ? pos.reduce((a, b) => (b.puntos > a.puntos ? b : a)).opcion : null;
  ch.forEach((x) => (x.cuenta = x.puntos < 0 || x.opcion === best || (x.puntos === 0 && !pos.length)));
  return { p: ch.filter((x) => x.cuenta).reduce((s, x) => s + x.puntos, 0), det: ch };
}
// Total bruto: los bloques se agrupan por objetivo y cuenta el mejor de cada uno; de los demás solo restan los errores.
// Las reglas con «bloque» suman a ese bloque; las demás, al total.
function svPuntos(act, clave, eleccion) {
  const P = clave.puntos, porObj = {}, detalle = [];
  const reglasOk = (clave.reglas || []).filter((r) => r.terminos.length && r.terminos.every((t) => svTermino(act, eleccion, t)));
  for (const b of act.bloques) {
    if (!svIncluido(act, eleccion, b)) continue;
    const sel = eleccion.bloques[b.id] || { dec: {} };
    let sb = 0; const det = [];
    for (const d of b.decisiones) {
      const r = svPuntosDecision(d, sel.dec && sel.dec[d.id], P, b.id);
      sb += r.p; for (const x of r.det) det.push({ bloque: b.id, decision: d.id, ...x });
    }
    for (const r of reglasOk) if (r.bloque === b.id) { sb += r.puntos; det.push({ regla: r.id, texto: r.texto, bloque: b.id, puntos: r.puntos, cuenta: true }); }
    const obj = (b.objetivo && b.objetivo.id) || b.id;
    (porObj[obj] = porObj[obj] || []).push({ sb, id: b.id, det });
  }
  let total = 0;
  for (const lst of Object.values(porObj)) {
    const mejor = lst.reduce((a, b) => (b.sb > a.sb ? b : a));
    total += mejor.sb;
    for (const x of lst) {
      if (x === mejor) { detalle.push(...x.det); continue; }
      for (const e of x.det) { const cuenta = e.cuenta && e.puntos < 0; if (cuenta) total += e.puntos; detalle.push({ ...e, cuenta, noCuentaBloque: true }); }
    }
  }
  for (const r of reglasOk) if (!r.bloque) { total += r.puntos; detalle.push({ regla: r.id, texto: r.texto, puntos: r.puntos, cuenta: true }); }
  return { total, detalle };
}
// Escala: la mejor estrategia posible dentro del presupuesto obtiene escala.objetivo puntos (p. ej., 99).
function svEscalar(clave, bruto) {
  const e = clave.escala; if (!e || !e.maximo) return Math.floor(bruto);
  const v = (bruto * e.objetivo) / e.maximo;
  return v > 0 ? Math.min(e.objetivo, Math.floor(v)) : Math.floor(v);
}
// Textos en dos idiomas ({es, en}) o texto simple.
function svT(x, lang) { return x && typeof x === "object" ? (x[lang] || x.es || x.en || "") : (x == null ? "" : String(x)); }
// Mejores elecciones por decisión según la clave: en las de opción única, la(s) de más puntos;
// en las de varias, todas las que suman puntos (de más a menos). Es una guía por etapa, no un plan que quepa en el presupuesto.
function svSolucion(act, clave) {
  const decisiones = [];
  for (const b of act.bloques) for (const d of b.decisiones) {
    const pts = d.opciones.map((o) => ({ id: o.id, puntos: Number(clave.puntos[`${b.id}/${d.id}/${o.id}`] || 0) }));
    let mejores;
    if (d.tipo === "multiple") { mejores = pts.filter((x) => x.puntos > 0).sort((x, y) => y.puntos - x.puntos); if (!mejores.length) mejores = pts.filter((x) => x.puntos === Math.max(...pts.map((p) => p.puntos))); }
    else { const m = Math.max(...pts.map((x) => x.puntos)); mejores = pts.filter((x) => x.puntos === m); }
    decisiones.push({ bloque: b.id, decision: d.id, mejores });
  }
  return { decisiones, reglas: (clave.reglas || []).map((r) => ({ texto: r.texto, puntos: r.puntos })) };
}
function svNumeros(act, puntos) { return Math.max(0, Math.min(act.numeros, Math.floor(puntos / act.puntos_por_numero))); }
function svEleccionVacia(act) { const e = { bloques: {} }; for (const b of act.bloques) e.bloques[b.id] = { incluido: act.bloques_obligatorios.includes(b.id), dec: {} }; return e; }
function svAleatorio(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % n) + 1; }
function svCodigo(n = 5) { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[x % 31]).join(""); }
// Unidad del «presupuesto» de la actividad cargada: euros por defecto; una actividad puede usar otra (p. ej., días).
let SV_UNIDAD = null, SV_UNIDAD2 = null;
// «singular|plural» (p. ej., «día|días»): 1 día, 3 días.
function svEur(n, lang) {
  const r = Math.round(n), v = new Intl.NumberFormat(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 0 }).format(r);
  if (!SV_UNIDAD) return `${v} €`;
  const u = svT(SV_UNIDAD, lang).split("|");
  return `${v} ${Math.abs(r) === 1 ? u[0] : (u[1] || u[0])}`;
}
function svPrecio(o, lang) {
  const c = o.coste, en = lang === "en", e = (v) => svEur(v, lang);
  if (c.tipo === "mult") return c.valor === 1 ? "" : `×${String(c.valor).replace(".", en ? "." : ",")}`;
  if (c.tipo === "replicas") return `${e(c.valor)}${en ? "/sample" : "/muestra"}`;
  if (c.tipo === "muestra") return c.valor ? `+${e(c.valor)}${en ? "/sample" : "/muestra"}` : "";
  if (c.tipo === "unidad") return `${[c.valor ? e(c.valor) : "", SV_UNIDAD2 && c.v2 ? svCant(c.v2, SV_UNIDAD2, lang) : ""].filter(Boolean).join(" · ")} ${en ? "each" : "c/u"}`;
  if (c.tipo === "condiciones") return en ? `${c.valor} condition${c.valor > 1 ? "s" : ""}` : `${c.valor} ${c.valor > 1 ? "condiciones" : "condición"}`;
  const v2 = SV_UNIDAD2 && c.v2 ? svCant(c.v2, SV_UNIDAD2, lang) : "";
  return [c.valor ? e(c.valor) : "", v2].filter(Boolean).join(" · ");
}
function svCant(n, unidad, lang) {
  const r = Math.round(n), v = new Intl.NumberFormat(lang === "en" ? "en-GB" : "es-ES", { maximumFractionDigits: 0 }).format(r), u = svT(unidad, lang).split("|");
  return `${v} ${Math.abs(r) === 1 ? u[0] : (u[1] || u[0])}`;
}
// Actividades: primero las del repositorio (archivos estáticos); si no está, las subidas desde el panel (Firebase).
async function svCargarActividad(id) {
  let act = null;
  try { const r = await fetch(`actividades/${encodeURIComponent(id)}.json`); if (r.ok) act = await r.json(); } catch (e) {}
  if (!act) { const a = await SVB.actividad(id); if (!a || !a.datos) throw new Error("actividad " + id); act = { ...a.datos, autor: a.autor_nombre || null }; }
  SV_UNIDAD = act.unidad || null; SV_UNIDAD2 = (act.limite2 && act.limite2.unidad) || null;
  return act;
}
async function svIndiceRepo() { try { const r = await fetch("actividades/index.json"); return r.ok ? await r.json() : []; } catch (e) { return []; } }
// Cuentas con permisos de administración (las mismas que en las reglas de Firestore).
const SV_ADMINS = ["cMZwT1gAQHa5EmohnmYV9YmY4XT2"];

/* ---------- Almacenamiento: Firebase o demo local ---------- */
// Interfaz común:
//   uid() · sesion(sid) · unirse(sid, nombre) · verGrupo(sid, cb) · cambiarGrupo(sid, patch)
//   (panel) entrarAdmin() · crearSesion(datos) · sesiones() · verGrupos(sid, cb) · cambiarGrupoAdmin(sid, gid, patch)
//          · borrarGrupo(sid, gid) · cerrarSesion(sid) · clave(aid) · guardarClave(aid, clave)
function svDemo() { try { return new URLSearchParams(location.search).has("demo") || !(window.QUAESTIA_FIREBASE && window.QUAESTIA_FIREBASE.config); } catch (e) { return true; } }

// Firestore rechaza valores undefined: el modo demo hace lo mismo para que los errores aparezcan al probar.
function svComprobar(v, ruta = "") {
  if (v === undefined) throw new Error(`valor vacío (undefined) en «${ruta}»`);
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) svComprobar(x, ruta ? `${ruta}.${k}` : k);
}
function svBackendDemo() {
  const KEY = "sortivia.demo";
  const vacio = () => ({ sesiones: {}, claves: {}, actividades: {}, profesores: {} });
  const read = () => { try { return { ...vacio(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { return vacio(); } };
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
    async cambiarGrupo(sid, patch) { svComprobar(patch); const d = read(); Object.assign(d.sesiones[sid].grupos[me], patch, { actualizado: Date.now() }); write(d); },
    // En demo, «?rol=profesor» simula una cuenta de profesor (sin ella, administrador).
    async entrarAdmin() { const prof = new URLSearchParams(location.search).get("rol") === "profesor"; const uid = prof ? "demo-profesor" : "demo-admin"; me = uid; return { uid, email: prof ? "profesor@demo" : "admin@demo", nombre: prof ? "Profesora de prueba" : "Administrador (demo)" }; },
    async perfil(uid) { return read().profesores[uid] || null; },
    async rol(uid) { if (uid === "demo-admin") return "admin"; const p = read().profesores[uid]; return p && p.activo ? "profesor" : null; },
    async profesores() { return Object.entries(read().profesores).map(([uid, p]) => ({ uid, ...p })); },
    async guardarProfesor(uid, datos) { svComprobar(datos); const d = read(); d.profesores[uid] = { ...(d.profesores[uid] || {}), ...datos }; write(d); },
    async borrarProfesor(uid) { const d = read(); delete d.profesores[uid]; write(d); },
    async actividades() { return Object.entries(read().actividades).map(([id, a]) => ({ id, ...a })); },
    async actividad(aid) { return read().actividades[aid] || null; },
    async guardarActividad(aid, doc) { svComprobar(doc); const d = read(); d.actividades[aid] = doc; write(d); },
    async cambiarActividad(aid, patch) { const d = read(); Object.assign(d.actividades[aid], patch); write(d); },
    async borrarActividad(aid) { const d = read(); delete d.actividades[aid]; delete d.claves[aid]; write(d); },
    async crearSesion(datos) { const d = read(); const sid = svCodigo(5); d.sesiones[sid] = { ...datos, propietario: me, estado: "abierta", creada: Date.now(), grupos: {} }; write(d); return sid; },
    async sesiones(todas) { const d = read(); return Object.entries(d.sesiones).map(([id, s]) => ({ id, ...s, grupos: undefined })).filter((s) => todas || s.propietario === me).sort((a, b) => b.creada - a.creada); },
    verGrupos(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s ? Object.entries(s.grupos).map(([id, g]) => ({ id, ...g })) : []); }); },
    async gruposLista(sid) { const s = read().sesiones[sid]; return s ? Object.entries(s.grupos).map(([id, g]) => ({ id, ...g })) : []; },
    async cambiarGrupoAdmin(sid, gid, patch) { svComprobar(patch); const d = read(); Object.assign(d.sesiones[sid].grupos[gid], patch); write(d); },
    async borrarGrupo(sid, gid) { const d = read(); delete d.sesiones[sid].grupos[gid]; write(d); },
    async cerrarSesion(sid) { const d = read(); d.sesiones[sid].estado = "cerrada"; write(d); },
    async cambiarSesion(sid, patch) { svComprobar(patch); const d = read(); Object.assign(d.sesiones[sid], patch); write(d); },
    verSesion(sid, cb) { watch(() => { const s = read().sesiones[sid]; cb(s ? { ...s, grupos: undefined } : null); }); },
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
    auth = authM.getAuth(app); db = fsM.initializeFirestore(app, { ignoreUndefinedProperties: true }); M = { authM, fsM };
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
    async entrarAdmin() { await ready; const r = await M.authM.signInWithPopup(auth, new M.authM.GoogleAuthProvider()); return { uid: r.user.uid, email: r.user.email, nombre: r.user.displayName || "" }; },
    async perfil(uid) { try { const p = await F().getDoc(F().doc(db, "profesores", uid)); return p.exists() ? p.data() : null; } catch (e) { return null; } },
    async rol(uid) {
      if (SV_ADMINS.includes(uid)) return "admin";
      try { const p = await F().getDoc(F().doc(db, "profesores", uid)); return p.exists() && p.data().activo ? "profesor" : null; } catch (e) { return null; }
    },
    async profesores() { const q = await F().getDocs(F().collection(db, "profesores")); return q.docs.map((d) => ({ uid: d.id, ...d.data() })); },
    async guardarProfesor(uid, datos) { await F().setDoc(F().doc(db, "profesores", uid), datos, { merge: true }); },
    async borrarProfesor(uid) { await F().deleteDoc(F().doc(db, "profesores", uid)); },
    async actividades() { const q = await F().getDocs(F().collection(db, "actividades")); return q.docs.map((d) => ({ id: d.id, ...d.data() })); },
    async actividad(aid) { const s = await F().getDoc(F().doc(db, "actividades", aid)); return s.exists() ? s.data() : null; },
    async guardarActividad(aid, doc) { await F().setDoc(F().doc(db, "actividades", aid), doc); },
    async cambiarActividad(aid, patch) { await F().updateDoc(F().doc(db, "actividades", aid), patch); },
    async borrarActividad(aid) { await F().deleteDoc(F().doc(db, "claves", aid)).catch(() => {}); await F().deleteDoc(F().doc(db, "actividades", aid)); },
    async crearSesion(datos) { const sid = svCodigo(5); await F().setDoc(F().doc(db, "sesiones", sid), { ...datos, propietario: auth.currentUser.uid, estado: "abierta", creada: Date.now() }); return sid; },
    async sesiones(todas) {
      const col = F().collection(db, "sesiones");
      const q = await F().getDocs(todas ? col : F().query(col, F().where("propietario", "==", auth.currentUser.uid)));
      return q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.creada - a.creada);
    },
    verGrupos(sid, cb) { F().onSnapshot(F().collection(db, "sesiones", sid, "grupos"), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() })))); },
    async gruposLista(sid) { const q = await F().getDocs(F().collection(db, "sesiones", sid, "grupos")); return q.docs.map((d) => ({ id: d.id, ...d.data() })); },
    async cambiarGrupoAdmin(sid, gid, patch) { await F().updateDoc(gref(sid, gid), patch); },
    async borrarGrupo(sid, gid) { await F().deleteDoc(gref(sid, gid)); },
    async cerrarSesion(sid) { await F().updateDoc(F().doc(db, "sesiones", sid), { estado: "cerrada" }); },
    async cambiarSesion(sid, patch) { await F().updateDoc(F().doc(db, "sesiones", sid), patch); },
    verSesion(sid, cb) { F().onSnapshot(F().doc(db, "sesiones", sid), (d) => cb(d.exists() ? d.data() : null), () => {}); },
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
