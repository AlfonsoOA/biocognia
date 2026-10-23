"""Convierte una hoja de claves ESTOPA (formato v2) en una actividad de SORTIVIA.

Pestañas del Excel:
  Actividad  → parámetros (id, títulos, resumen, presupuesto, rondas, números, puntos por número, bloques obligatorios)
  Opciones   → Bloque | Decisión | Grupo | Opción | Tipo de coste | Precio | Puntos | Notas
               Tipos de coste: réplicas, por muestra, multiplicador, fijo, por unidad, condiciones
  Reglas     → ID | Condición | Puntos | Explicación   (reglas de coherencia; ocultas a los alumnos)

Genera:
  actividades/<id>.json      → pública (sin puntos ni reglas): va al repositorio
  <id>.clave.json            → privada (puntos y reglas): se carga en el panel, NUNCA en el repositorio
y escribe en el propio Excel una pestaña «Identificadores» con los nombres que usan las reglas.

Uso: python3 -I xlsx2sortivia.py claves_v2.xlsx carpeta_actividades/ carpeta_claves/
"""
import json, os, re, sys, unicodedata
import openpyxl

src, out_pub_dir, out_key_dir = sys.argv[1:]
TIPOS = {"réplicas": "replicas", "replicas": "replicas", "por muestra": "muestra", "multiplicador": "mult", "fijo": "fijo", "por unidad": "unidad", "condiciones": "condiciones"}

def slug(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
def num(v):
    if isinstance(v, (int, float)): return float(v)
    return float(str(v).strip().lower().lstrip("x").replace(",", ".") or 0)

wb = openpyxl.load_workbook(src)
P = {str(r[0]).strip(): r[1] for r in wb["Actividad"].iter_rows(min_row=2, values_only=True) if r[0]}
aid = slug(P["id"])
obligatorios = [slug(x) for x in str(P.get("bloques_obligatorios") or "").split(";") if x.strip()]

bloques, idx, puntos, errores = [], {}, {}, []
for i, row in enumerate(wb["Opciones"].iter_rows(min_row=2, values_only=True), start=2):
    if not row or not row[0]: continue
    B, D, G, O, TIPO, PRECIO, PTS = (list(row) + [None] * 8)[:7]
    tipo = TIPOS.get(str(TIPO).strip().lower())
    if not tipo: errores.append(f"Opciones fila {i}: tipo de coste desconocido «{TIPO}»"); continue
    bid, did = slug(B), slug(D)
    if bid not in idx:
        idx[bid] = {"id": bid, "nombre": str(B).strip(), "decisiones": [], "_d": {}}; bloques.append(idx[bid])
    blk = idx[bid]
    if did not in blk["_d"]:
        dec = {"id": did, "nombre": str(D).strip(), "tipo": "contador" if tipo == "unidad" else "unica", "opciones": []}
        blk["_d"][did] = dec; blk["decisiones"].append(dec)
    dec = blk["_d"][did]
    if tipo == "unidad":
        oid = "n"; label = str(O).strip()
    else:
        label = str(O).strip(); oid = slug(label)
    coste = {"tipo": tipo, "valor": num(PRECIO or 0)}
    if tipo == "replicas":
        coste["n"] = int(num(O))
    opt = {"id": oid, "label": label, "coste": coste}
    if G: opt["grupo"] = str(G).strip()
    if any(o["id"] == oid for o in dec["opciones"]): errores.append(f"Opciones fila {i}: opción repetida «{label}» en {B} · {D}")
    dec["opciones"].append(opt)
    puntos[f"{bid}/{did}/{oid}"] = num(PTS or 0)
for b in bloques: del b["_d"]

# Reglas de coherencia
TERM = re.compile(r"^(!?)([a-z0-9-]+)(?:/([a-z0-9-]+)(?:(=)([a-z0-9|-]+)|(>)(\d+)))?$")
reglas = []
if "Reglas" in wb.sheetnames:
    for i, row in enumerate(wb["Reglas"].iter_rows(min_row=2, values_only=True), start=2):
        if not row or not row[0] or not row[1]: continue
        rid, cond, pts, texto = (list(row) + [None] * 4)[:4]
        terms = []
        for t in [x.strip() for x in str(cond).split("&") if x.strip()]:
            m = TERM.match(t)
            if not m: errores.append(f"Reglas fila {i} ({rid}): no entiendo «{t}»"); continue
            neg, b, d, eq, opts, gt, n = m.groups()
            if b not in idx: errores.append(f"Reglas fila {i} ({rid}): no existe el bloque «{b}»"); continue
            term = {"bloque": b, "no": bool(neg)}
            if d:
                dec = next((x for x in idx[b]["decisiones"] if x["id"] == d), None)
                if not dec: errores.append(f"Reglas fila {i} ({rid}): no existe la decisión «{b}/{d}»"); continue
                term["decision"] = d
                if eq:
                    ids = opts.split("|")
                    for o in ids:
                        if not any(x["id"] == o for x in dec["opciones"]): errores.append(f"Reglas fila {i} ({rid}): no existe la opción «{b}/{d}={o}»")
                    term["opciones"] = ids
                else:
                    term["mayor_que"] = int(n)
            terms.append(term)
        reglas.append({"id": str(rid).strip(), "terminos": terms, "puntos": num(pts or 0), "texto": str(texto or "").strip()})

if errores:
    print("ERRORES:"); [print("  -", e) for e in errores]; sys.exit(1)

act = {
    "schema": "sortivia-actividad/2", "id": aid, "metodologia": "ESTOPA",
    "titulo": {"es": P.get("titulo_es") or P["id"], "en": P.get("titulo_en") or P.get("titulo_es") or P["id"]},
    "resumen": {"es": P.get("resumen_es") or "", "en": P.get("resumen_en") or P.get("resumen_es") or ""},
    "presupuesto": num(P.get("presupuesto") or 0), "numeros": int(num(P.get("numeros") or 10)), "rondas": int(num(P.get("rondas") or 2)),
    "puntos_por_numero": num(P.get("puntos_por_numero") or 10), "bloques_obligatorios": obligatorios, "bloques": bloques,
}
os.makedirs(out_pub_dir, exist_ok=True); os.makedirs(out_key_dir, exist_ok=True)
json.dump(act, open(os.path.join(out_pub_dir, f"{aid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump({"schema": "sortivia-clave/2", "actividad": aid, "puntos": puntos, "reglas": reglas},
          open(os.path.join(out_key_dir, f"{aid}.clave.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# Pestaña de identificadores para escribir reglas
if "Identificadores" in wb.sheetnames: del wb["Identificadores"]
wi = wb.create_sheet("Identificadores")
wi.append(["Bloque", "Decisión", "Opción", "Para usar en una regla"])
for b in bloques:
    for d in b["decisiones"]:
        for o in d["opciones"]:
            wi.append([b["nombre"], d["nombre"], o["label"], f"{b['id']}/{d['id']}>0" if d["tipo"] == "contador" else f"{b['id']}/{d['id']}={o['id']}"])
for c, w in zip("ABCD", (20, 24, 46, 80)): wi.column_dimensions[c].width = w
wb.save(src)
print(f"{aid}: {len(bloques)} bloques, {sum(len(b['decisiones']) for b in bloques)} decisiones, {len(puntos)} opciones, {len(reglas)} reglas")
