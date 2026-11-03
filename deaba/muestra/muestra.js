/* DEAba Digital · actividad de muestra (para enseñar la app a otros profesores).
   Crea en el navegador (modo demostración, nada se guarda en el servidor) una sesión con la actividad
   «diabetes_t1_medium», su guía y las respuestas de cuatro grupos ficticios, en español o en inglés. */
"use strict";
const MUESTRA = { sid: "MUEST", actividad: "diabetes_t1_medium" };

function muestraGrupos(lang) {
  const en = lang === "en";
  const R = (es, eng) => (en ? eng : es);
  const m = (reac, rutas) => ({ reac, rutas });
  // Grupo que lo resuelve bien
  const bien = {
    1: m(R("Ácido graso + CoA + ATP → acil-CoA + AMP + PPi", "Fatty acid + CoA + ATP → acyl-CoA + AMP + PPi"), ["betaox"]),
    2: m(R("acil-CoA + carnitina → acilcarnitina + CoA", "acyl-CoA + carnitine → acylcarnitine + CoA"), ["lanzadera_carnitina"]),
    3: m(R("enoil-CoA + H2O → L-3-hidroxiacil-CoA", "enoyl-CoA + H2O → L-3-hydroxyacyl-CoA"), ["betaox"]),
    4: m(R("L-3-hidroxiacil-CoA + NAD+ → 3-cetoacil-CoA + NADH", "L-3-hydroxyacyl-CoA + NAD+ → 3-ketoacyl-CoA + NADH"), ["betaox"]),
    5: m(R("3-cetoacil-CoA + CoA → acil-CoA + acetil-CoA", "3-ketoacyl-CoA + CoA → acyl-CoA + acetyl-CoA"), ["betaox"]),
    6: m(R("acetoacetil-CoA + acetil-CoA → HMG-CoA", "acetoacetyl-CoA + acetyl-CoA → HMG-CoA"), ["cetogenesis"]),
    7: m(R("HMG-CoA + NADPH → mevalonato", "HMG-CoA + NADPH → mevalonate"), ["colesterol"]),
    8: m(R("acetoacetato + NADH → D-3-hidroxibutirato", "acetoacetate + NADH → D-3-hydroxybutyrate"), ["cetogenesis"]),
    9: m(R("acetil-CoA + HCO3- + ATP → malonil-CoA", "acetyl-CoA + HCO3- + ATP → malonyl-CoA"), ["sintesis_ag"]),
    10: m(R("glucosa + ATP → glucosa-6-fosfato", "glucose + ATP → glucose 6-phosphate"), ["glucolisis"]),
    11: m(R("la forma la CAT-I", "made by CAT-I"), ["lanzadera_carnitina"]),
    12: m(R("lo forma la enoil-CoA hidratasa", "made by enoyl-CoA hydratase"), ["betaox"]),
    13: m(R("lo forma la tiolasa", "made by thiolase"), ["betaox"]),
    14: m(R("lo forma la ACC", "made by ACC"), ["sintesis_ag"]),
    15: m(R("lo gasta la PEPCK (gluconeogénesis)", "used by PEPCK (gluconeogenesis)"), ["gluconeogenesis"]),
    16: m(R("lo forma la D-3-hidroxibutirato deshidrogenasa", "made by D-3-hydroxybutyrate dehydrogenase"), ["cetogenesis"]),
    17: m(R("la libera la glucosa-6-fosfatasa", "released by glucose 6-phosphatase"), ["gluconeogenesis"]),
  };
  const copia = (o) => JSON.parse(JSON.stringify(o));
  // Grupo con el concepto erróneo típico (lo confunde con un ayuno y cree que sube el Krebs)
  const ayuno = copia(bien);
  Object.assign(ayuno, {
    7: m(R("HMG-CoA → colesterol", "HMG-CoA → cholesterol"), ["colesterol"]),
    13: m(R("viene del piruvato", "comes from pyruvate"), ["krebs"]),
    15: m(R("se gasta en el ciclo de Krebs", "used in the Krebs cycle"), ["krebs"]),
    17: m(R("sale del glucógeno", "comes from glycogen"), ["glucogenolisis"]),
  });
  // Grupo intermedio
  const medio = copia(bien);
  Object.assign(medio, {
    9: m(R("acetil-CoA → malonil-CoA", "acetyl-CoA → malonyl-CoA"), ["sintesis_ag"]),
    15: m(R("oxalacetato + acetil-CoA → citrato", "oxaloacetate + acetyl-CoA → citrate"), ["krebs"]),
    16: m(R("acetoacetato → hidroxibutirato", "acetoacetate → hydroxybutyrate"), ["cetogenesis"]),
  });
  // Grupo que aún está trabajando
  const parcial = {};
  for (let i = 1; i <= 17; i++) parcial[i] = i <= 5 ? copia(bien[i]) : m("", []);
  const t = Date.now();
  return {
    "muestra-g1": { nombre: R("Las mitocondrias", "The Mitochondria"), estado: "enviado", actualizado: t - 600000, resp: { mol: bien,
      frases: [
        { mol: "9", dir: "baja", porque: R("el glucagón la fosforila y sin insulina se inactiva", "glucagon phosphorylates it and without insulin it is inactivated"), ruta: "sintesis_ag" },
        { mol: "6", dir: "sube", porque: R("sobra acetil-CoA y no hay oxalacetato para el ciclo de Krebs", "there is excess acetyl-CoA and no oxaloacetate for the Krebs cycle"), ruta: "cetogenesis" },
        { mol: "17", dir: "sube", porque: R("no hay insulina y el hígado sigue haciendo gluconeogénesis", "there is no insulin and the liver keeps doing gluconeogenesis"), ruta: "gluconeogenesis" }],
      diag: { c1: R("Diabetes tipo 1 descompensada: cetoacidosis por falta de insulina, con hiperglucemia.", "Decompensated type 1 diabetes: ketoacidosis due to lack of insulin, with hyperglycaemia."), c2: "" },
      justif: R("Sin insulina y con glucagón alto se activa la β-oxidación; el malonil-CoA bajo libera la CAT-I; el oxalacetato se va a gluconeogénesis y el acetil-CoA sobrante forma cuerpos cetónicos. La glucosa sube: no es un ayuno.",
        "Without insulin and with high glucagon, beta oxidation is activated; low malonyl-CoA releases CAT-I; oxaloacetate goes to gluconeogenesis and the excess acetyl-CoA forms ketone bodies. Glucose goes up: it is not fasting.") } },
    "muestra-g2": { nombre: R("Equipo Krebs", "Team Krebs"), estado: "enviado", actualizado: t - 480000, resp: { mol: ayuno,
      frases: [
        { mol: "13", dir: "sube", porque: R("aumenta el ciclo de Krebs", "the Krebs cycle increases"), ruta: "krebs" },
        { mol: "10", dir: "baja", porque: R("no hay glucosa por el ayuno", "there is no glucose because of fasting"), ruta: "glucolisis" },
        { mol: "6", dir: "sube", porque: R("se hacen cuerpos cetónicos", "ketone bodies are made"), ruta: "cetogenesis" }],
      diag: { c1: R("Ayuno prolongado: no entra glucosa y se usan las grasas.", "Prolonged fasting: no glucose comes in and fats are used."), c2: "" },
      justif: R("Hay ayuno, no hay glucosa y se usan las grasas; aumenta el ciclo de Krebs para sacar energía.", "It is fasting, there is no glucose and fats are used; the Krebs cycle increases to obtain energy.") } },
    "muestra-g3": { nombre: R("Los del fondo", "The Back Row"), estado: "enviado", actualizado: t - 300000, resp: { mol: medio,
      frases: [
        { mol: "8", dir: "sube", porque: R("se fabrican cuerpos cetónicos en el hígado", "ketone bodies are made in the liver"), ruta: "cetogenesis" },
        { mol: "14", dir: "baja", porque: R("la ACC está inhibida por el glucagón", "ACC is inhibited by glucagon"), ruta: "sintesis_ag" }],
      diag: { c1: R("Diabetes descompensada con cetosis.", "Decompensated diabetes with ketosis."), c2: "" },
      justif: R("Hay mucha beta oxidación y cuerpos cetónicos, pero la glucosa no baja, así que no es un ayuno.", "There is a lot of beta oxidation and ketone bodies, but glucose does not go down, so it is not fasting.") } },
    "muestra-g4": { nombre: R("Las cetonas", "The Ketones"), estado: "editando", actualizado: t - 60000, resp: { mol: parcial,
      frases: [{ mol: "", dir: "", porque: "", ruta: "" }], diag: { c1: "", c2: "" }, justif: "" } },
  };
}

async function muestraPreparar(lang) {
  const KEY = "deaba.demo";
  let d; try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
  d.sesiones = d.sesiones || {}; d.guias = d.guias || {}; d.profesores = d.profesores || {}; d.actividades = d.actividades || {};
  d.sesiones[MUESTRA.sid] = { actividad: MUESTRA.actividad, nombre: lang === "en" ? "Sample session" : "Sesión de muestra", modo: "formativa", resultados: null,
    propietario: "demo-admin", estado: "abierta", creada: Date.now() - 900000, grupos: muestraGrupos(lang) };
  const guia = await fetch(`muestra/${MUESTRA.actividad}.guia.json`).then((r) => r.json());
  d.guias[MUESTRA.actividad] = dbGuiaGuardar(guia);
  localStorage.setItem(KEY, JSON.stringify(d));
}
