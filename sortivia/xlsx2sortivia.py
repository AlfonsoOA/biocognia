"""Convierte una hoja de claves ESTOPA (Decisión | Subdecisión | Opción | Precio | Puntos) en:
   - actividad pública (sin puntos) para la web de SORTIVIA
   - clave privada (puntos por opción) para el panel del profesor.
Uso: python3 -I xlsx2sortivia.py claves.xlsx id_actividad salida_publica.json salida_clave.json"""
import json, re, sys, unicodedata
import openpyxl

src, aid, out_pub, out_key = sys.argv[1:]
FIX = {"Numer of replicates": "Number of replicates", "Artifitial consortia": "Artificial consortia", "Decission": "Decision", "Msstats": "MSstats", "Deqms": "DEqMS"}
def slug(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
def fix(s): s = str(s).strip(); return FIX.get(s, s)

ws = openpyxl.load_workbook(src, data_only=True).active
rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if any(c is not None for c in r)]
bloques, clave = [], {}
blk = dec = None; grupo = None
for A, B, C, D, E in rows:
    if A:
        blk = {"id": slug(A), "nombre": fix(A), "decisiones": []}
        bloques.append(blk); dec = None
    if blk["id"] == "global-strategy":
        if dec is None:
            dec = {"id": "estrategia", "nombre": "Global strategy", "opciones": []}; blk["decisiones"].append(dec)
        if B: grupo = fix(B)
        opt = {"id": slug(C), "label": fix(C), "grupo": grupo, "coste": {"tipo": "fijo", "valor": float(D)}}
    elif blk["id"] == "validations":
        dec = {"id": slug(B), "nombre": fix(B), "opcional": True, "opciones": []}; blk["decisiones"].append(dec)
        opt = {"id": "si", "label": fix(C) if C else "Yes", "coste": {"tipo": "fijo", "valor": float(D)}}
    else:
        if B:
            dec = {"id": slug(fix(B)), "nombre": fix(B), "opciones": []}; blk["decisiones"].append(dec)
        if isinstance(D, str) and D.strip().lower().startswith("x"):
            coste = {"tipo": "mult", "valor": float(D.strip()[1:].strip().replace(",", "."))}
        elif dec["id"] == "number-of-replicates":
            coste = {"tipo": "base", "valor": float(D)}
        else:
            coste = {"tipo": "fijo", "valor": float(D)}
        opt = {"id": slug(C), "label": fix(C), "coste": coste}
    dec["opciones"].append(opt)
    clave[f"{blk['id']}/{dec['id']}/{opt['id']}"] = E
act = {
    "schema": "sortivia-actividad/1", "id": aid, "metodologia": "ESTOPA",
    "titulo": {"es": "The poor savior astronauts", "en": "The poor savior astronauts"},
    "resumen": {"es": "Diseñad la estrategia ómica más eficiente para demostrar la ruta biosintética de la Pepitina con un presupuesto de 17.000 €.",
                "en": "Design the most efficient omics strategy to demonstrate the biosynthetic pathway of Pepitin with a budget of €17,000."},
    "presupuesto": 17000, "moneda": "€", "numeros": 10, "rondas": 2, "puntos_por_numero": 10,
    "bloques_obligatorios": ["global-strategy"],
    "bloques": bloques,
}
json.dump(act, open(out_pub, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump({"schema": "sortivia-clave/1", "actividad": aid, "puntos": clave}, open(out_key, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(bloques), "bloques;", sum(len(b["decisiones"]) for b in bloques), "decisiones;", len(clave), "opciones")
for b in bloques: print(" ", b["id"], [ (d["id"], len(d["opciones"])) for d in b["decisiones"]])
