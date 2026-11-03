/* SORTIVIA · actividad de muestra (para enseñar la app a otros profesores).
   Crea en el navegador (modo demostración, nada se guarda en el servidor) una sesión con «El misterio del lago verde»,
   su clave (es un ejemplo: la clave es pública) y tres grupos ficticios en distintos momentos de la partida. */
"use strict";
const MUESTRA = { sid: "VERDE", actividad: "ejemplo-lago-verde" };

function muestraEleccion(act, spec) {
  const e = svEleccionVacia(act);
  for (const [b, inc, dec] of spec) { e.bloques[b].incluido = inc; Object.assign(e.bloques[b].dec, dec); }
  return e;
}

function muestraGrupos(act, clave, lang) {
  const R = (es, en) => (lang === "en" ? en : es);
  const planes = {
    bueno: muestraEleccion(act, [["sampling-design", true, { design: "problem-vs-control-lake" }],
      ["metagenomics", true, { replicates: "3", sequencing: ["short-reads"], depth: "standard", "binning-mags": "yes" }],
      ["16s-amplicons", false, {}], ["metabolomics", true, { replicates: "3", platform: ["lc-ms"], "validation-with-standards": 1 }]]),
    medio: muestraEleccion(act, [["sampling-design", true, { design: "problem-vs-control-lake" }], ["metagenomics", false, {}],
      ["16s-amplicons", true, { replicates: "3", sequencing: "v3-v4-amplicons" }],
      ["metabolomics", true, { replicates: "3", platform: ["gc-ms"], "validation-with-standards": 1 }]]),
    flojo: muestraEleccion(act, [["sampling-design", true, { design: "problem-vs-control-lake" }], ["metagenomics", false, {}],
      ["16s-amplicons", true, { replicates: "3", sequencing: "v3-v4-amplicons" }],
      ["metabolomics", true, { replicates: "3", platform: ["optical-density-only"], "validation-with-standards": 0 }]]),
  };
  const just = {
    bueno: {
      "sampling-design": R("Comparamos con un lago sano para saber qué es propio del problema.", "We compare with a healthy lake to know what is specific to the problem."),
      metagenomics: R("Con tres réplicas y MAGs sabremos quién está y qué genes tiene.", "With three replicates and MAGs we will know who is there and which genes they carry."),
      metabolomics: R("LC-MS para ver las toxinas y un patrón para confirmarlas.", "LC-MS to see the toxins and a standard to confirm them."),
    },
    medio: {
      "sampling-design": R("Lago problema frente a lago control.", "Problem lake versus control lake."),
      "16s-amplicons": R("El 16S es barato y nos dice qué bacterias hay.", "16S is cheap and tells us which bacteria are there."),
      metabolomics: R("GC-MS para los compuestos volátiles que huelen mal.", "GC-MS for the volatile compounds that smell bad."),
    },
    flojo: {
      "sampling-design": R("Comparamos con otro lago que no está verde.", "We compare with another lake that is not green."),
      "16s-amplicons": R("Para saber qué bacterias hay.", "To know which bacteria are there."),
      metabolomics: R("Medimos la turbidez del agua.", "We measure how cloudy the water is."),
    },
  };
  const ronda = (plan, n, extra) => {
    const el = planes[plan], { total, detalle } = svPuntos(act, clave, el), pts = svEscalar(clave, total);
    return { ronda: n, coste: svCosteTotal(act, el), puntos: pts, puntos_brutos: total, numeros: svNumeros(act, pts), detalle, eleccion: el, justif: just[plan], fecha: new Date(Date.now() - 1200000).toISOString(), ...extra };
  };
  const t = Date.now();
  const h1 = ronda("bueno", 1, { elegidos: [1, 2, 3, 4, 5, 6, 7, 8, 9], sorteo: 4, resultado: "ganado" });
  const h2 = ronda("medio", 1, { elegidos: [2, 3, 4, 5, 6, 7, 8], sorteo: 10, resultado: "fallado" });
  return {
    "muestra-g1": { nombre: R("Las cianobacterias", "The Cyanobacteria"), ronda: 1, estado: "ganado", eleccion: planes.bueno, justif: just.bueno, coste: h1.coste,
      puntos: h1.puntos, numeros: h1.numeros, elegidos: h1.elegidos, sorteo: 4, historial: [h1], aviso: null, actualizado: t - 900000 },
    "muestra-g2": { nombre: R("Equipo Metagenoma", "Team Metagenome"), ronda: 2, estado: "editando", eleccion: planes.medio, justif: just.medio, coste: h2.coste,
      puntos: h2.puntos, numeros: h2.numeros, elegidos: [], sorteo: null, historial: [h2], aviso: null, actualizado: t - 300000 },
    // Este grupo acaba de enviar su estrategia: el panel (árbitro automático) la puntúa al abrirlo.
    "muestra-g3": { nombre: R("Los del fondo", "The Back Row"), ronda: 1, estado: "enviado", eleccion: planes.flojo, justif: just.flojo, coste: svCosteTotal(act, planes.flojo),
      historial: [], aviso: null, actualizado: t - 60000 },
  };
}

async function muestraPreparar(lang) {
  const KEY = "sortivia.demo";
  const [act, clave] = await Promise.all([fetch(`actividades/${MUESTRA.actividad}.json`).then((r) => r.json()), fetch(`muestra/${MUESTRA.actividad}.clave.json`).then((r) => r.json())]);
  let d; try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
  d.sesiones = d.sesiones || {}; d.claves = d.claves || {}; d.actividades = d.actividades || {}; d.profesores = d.profesores || {};
  d.claves[MUESTRA.actividad] = clave;
  d.sesiones[MUESTRA.sid] = { actividad: MUESTRA.actividad, nombre: lang === "en" ? "Sample session" : "Sesión de muestra", propietario: "demo-admin", estado: "abierta",
    creada: Date.now() - 1800000, grupos: muestraGrupos(act, clave, lang) };
  localStorage.setItem(KEY, JSON.stringify(d));
}
