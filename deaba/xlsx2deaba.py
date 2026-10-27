"""Convierte un Excel de DEAba Digital en:
  - <id>.json        → la actividad que ven los grupos (va al repositorio, carpeta deaba/actividades/)
  - <id>.guia.json   → la guía del profesor y la clave (NO va al repositorio: se sube desde el panel)
Uso: python3 xlsx2deaba.py actividad.xlsx [carpeta_actividades] [carpeta_guias]"""
import json, os, re, sys
from openpyxl import load_workbook

AQUI = os.path.dirname(os.path.abspath(__file__))
_RUTAS = next(p for p in (os.path.join(AQUI, "rutas.json"), os.path.join(AQUI, "..", "app", "rutas.json")) if os.path.exists(p))
RUTAS = {r["id"] for r in json.load(open(_RUTAS, encoding="utf-8"))}
SECCIONES = ["diagnostico", "pistas", "razonamiento", "alternativas", "errores", "plenario", "referencias", "notas"]


class ErrorExcel(Exception):
    pass


def txt(v):
    return "" if v is None else str(v).strip()


def num(v, donde):
    if v is None or txt(v) == "":
        raise ErrorExcel(f"{donde}: falta el número")
    try:
        return float(str(v).replace(",", "."))
    except ValueError:
        raise ErrorExcel(f"{donde}: «{v}» no es un número")


def entero(x):
    return int(x) if float(x).is_integer() else x


def filas(ws):
    cab = [txt(c.value) for c in ws[1]]
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not any(txt(x) for x in r):
            continue
        yield dict(zip(cab, r))


def lista(v, sep=";"):
    return [x.strip() for x in txt(v).split(sep) if x.strip()]


def rutas(v, donde, errores):
    rs = lista(v)
    for r in rs:
        if r not in RUTAS:
            errores.append(f"{donde}: la ruta «{r}» no está en la hoja «Rutas»")
    return rs


def bil(es, en):
    # Texto en dos idiomas: el inglés solo si está relleno.
    d = {"es": txt(es)}
    if txt(en):
        d["en"] = txt(en)
    return d


def conceptos(ws, errores):
    out = []
    for i, f in enumerate(filas(ws), start=2):
        cid, et = txt(f.get("Id")), txt(f.get("Etiqueta"))
        if not cid:
            errores.append(f"Conceptos, fila {i}: falta el Id")
            continue
        # Alternativas separadas por «;»; cada alternativa puede exigir varias palabras a la vez, unidas por «+».
        alternativas = [[p.strip() for p in alt.split("+") if p.strip()] for alt in lista(f.get("Términos"))]
        if not alternativas:
            errores.append(f"Conceptos, fila {i}: faltan los términos")
        tipo = txt(f.get("Tipo")) or "esperado"
        if tipo not in ("esperado", "alternativo", "error"):
            errores.append(f"Conceptos, fila {i}: tipo «{tipo}» desconocido")
        c = {"id": cid, "etiqueta": et or cid, "alternativas": alternativas, "tipo": tipo}
        if txt(f.get("Etiqueta (en)")):
            c["etiqueta_en"] = txt(f.get("Etiqueta (en)"))
        out.append(c)
    return out


def convertir(ruta):
    wb = load_workbook(ruta, data_only=True)
    errores = []
    if "Actividad" not in wb.sheetnames:
        raise ErrorExcel("Falta la hoja «Actividad»")
    A = {txt(f.get("Campo")): f.get("Valor") for f in filas(wb["Actividad"])}
    AEN = {txt(f.get("Campo")): f.get("Valor (en)") for f in filas(wb["Actividad"])}
    aid = txt(A.get("id"))
    if not re.fullmatch(r"[a-z0-9]+(_[a-z0-9]+)*", aid or ""):
        errores.append("Actividad: «id» debe ir en minúsculas, sin tildes ni espacios (p. ej., diabetes_t1_medium)")
    try:
        tipo = int(num(A.get("tipo"), "Actividad: tipo"))
    except ErrorExcel as e:
        raise ErrorExcel(str(e))
    if tipo not in (1, 2):
        raise ErrorExcel("Actividad: «tipo» debe ser 1 o 2")
    nivel = txt(A.get("nivel")) or "medium"
    if nivel not in ("low", "medium", "high"):
        errores.append("Actividad: «nivel» debe ser low, medium o high")
    pts = [entero(num(x, "Actividad: puntos")) for x in lista(A.get("puntos") or "3;3;4")]
    if len(pts) != 3:
        errores.append("Actividad: «puntos» debe tener tres valores separados por «;»")
    for k in ("titulo", "contexto", "mision"):
        if not txt(A.get(k)):
            errores.append(f"Actividad: falta «{k}»")

    act = {"schema": "deaba/1", "id": aid, "tipo": tipo, "nivel": nivel, "titulo": bil(A.get("titulo"), AEN.get("titulo")),
           "asignatura": txt(A.get("asignatura")), "autor": txt(A.get("autor")),
           "contexto": bil(A.get("contexto"), AEN.get("contexto")), "mision": bil(A.get("mision"), AEN.get("mision")), "puntos": pts}
    guia = {"schema": "deaba-guia/1", "actividad": aid, "objetivo": bil(A.get("objetivo"), AEN.get("objetivo")),
            "nivel_texto": bil(A.get("nivel_texto"), AEN.get("nivel_texto")), "secciones": {s: [] for s in SECCIONES}}

    if tipo == 1:
        if "Moléculas" not in wb.sheetnames:
            raise ErrorExcel("Falta la hoja «Moléculas»")
        act["condiciones"] = {"c1": bil(A.get("condicion_1") or "Condición 1", AEN.get("condicion_1") or ("Condition 1" if not txt(A.get("condicion_1")) else "")),
                              "c2": bil(A.get("condicion_2") or "Condición 2", AEN.get("condicion_2") or ("Condition 2" if not txt(A.get("condicion_2")) else ""))}
        act["moleculas"] = []
        guia["moleculas"] = {}
        vistos = set()
        for i, f in enumerate(filas(wb["Moléculas"]), start=2):
            mid, tp = txt(f.get("Id")), txt(f.get("Tipo")).lower()
            d = f"Moléculas, fila {i}"
            if not mid or mid in vistos:
                errores.append(f"{d}: Id vacío o repetido")
                continue
            vistos.add(mid)
            if tp not in ("enzima", "metabolito"):
                errores.append(f"{d}: Tipo debe ser enzima o metabolito")
            try:
                fc = entero(num(f.get("FC"), d + " (FC)"))
            except ErrorExcel as e:
                errores.append(str(e))
                fc = 1
            if -1 < fc < 1:
                errores.append(f"{d}: el FC va de 1 en adelante o de −1 hacia abajo (convención −1/valor)")
            act["moleculas"].append({"id": mid, "tipo": tp, "nombre": bil(f.get("Nombre"), f.get("Nombre (en)")), "fc": fc})
            guia["moleculas"][mid] = {"reaccion": bil(f.get("Reacción"), f.get("Reacción (en)")), "rutas": rutas(f.get("Rutas"), d, errores),
                                      "compartimento": bil(f.get("Compartimento"), f.get("Compartimento (en)")), "porque": bil(f.get("Por qué cambia"), f.get("Por qué cambia (en)")),
                                      "claves": lista(f.get("Palabras clave"))}
        if not act["moleculas"]:
            errores.append("Moléculas: no hay ninguna")
    else:
        for h in ("Condiciones", "Marcadores"):
            if h not in wb.sheetnames:
                raise ErrorExcel(f"Falta la hoja «{h}»")
        act["n_enzimas"] = entero(num(A.get("n_enzimas"), "Actividad: n_enzimas"))
        act["n_metabolitos"] = entero(num(A.get("n_metabolitos"), "Actividad: n_metabolitos"))
        act["condiciones"] = []
        guia["condiciones"] = {}
        for i, f in enumerate(filas(wb["Condiciones"]), start=2):
            cid = txt(f.get("Id"))
            if not cid:
                errores.append(f"Condiciones, fila {i}: falta el Id")
                continue
            papel = txt(f.get("Papel")) or "valida"
            if papel not in ("referencia_1", "referencia_2", "valida", "debil"):
                errores.append(f"Condiciones, fila {i}: papel «{papel}» desconocido")
            act["condiciones"].append({"id": cid, "nombre": bil(f.get("Nombre"), f.get("Nombre (en)"))})
            guia["condiciones"][cid] = {"comentario": bil(f.get("Comentario (guía)"), f.get("Comentario (en)")), "papel": papel}
        papeles = [c["papel"] for c in guia["condiciones"].values()]
        if papeles.count("referencia_1") != 1 or papeles.count("referencia_2") != 1:
            errores.append("Condiciones: debe haber exactamente una referencia_1 y una referencia_2")
        cids = [c["id"] for c in act["condiciones"]]
        cat, guia["marcadores"] = [], {}
        for i, f in enumerate(filas(wb["Marcadores"]), start=2):
            mid, tp = txt(f.get("Id")), txt(f.get("Tipo")).lower()
            d = f"Marcadores, fila {i}"
            if not mid or mid in guia["marcadores"]:
                errores.append(f"{d}: Id vacío o repetido")
                continue
            if tp not in ("enzima", "metabolito"):
                errores.append(f"{d}: Tipo debe ser enzima o metabolito")
            papel = txt(f.get("Papel")) or "apoyo"
            if papel not in ("clave", "apoyo", "distractor"):
                errores.append(f"{d}: papel «{papel}» desconocido")
            niveles = {}
            for c in cids:
                v = f.get(f"Nivel: {c}")
                try:
                    niveles[c] = entero(num(v, f"{d} (Nivel: {c})"))
                    if niveles[c] < 0:
                        errores.append(f"{d}: el nivel no puede ser negativo")
                except ErrorExcel as e:
                    errores.append(str(e))
            cat.append({"id": mid, "tipo": tp, "nombre": bil(f.get("Nombre"), f.get("Nombre (en)"))})
            guia["marcadores"][mid] = {"papel": papel, "reaccion": bil(f.get("Reacción"), f.get("Reacción (en)")), "rutas": rutas(f.get("Rutas"), d, errores),
                                       "compartimento": bil(f.get("Compartimento"), f.get("Compartimento (en)")), "porque": bil(f.get("Por qué"), f.get("Por qué (en)")),
                                       "claves": lista(f.get("Palabras clave")), "niveles": niveles}
        # El catálogo se ordena alfabéticamente para no delatar qué marcadores son clave.
        act["catalogo"] = sorted(cat, key=lambda m: (m["tipo"] != "enzima", m["nombre"]["es"].lower()))
        for t, n in (("enzima", act["n_enzimas"]), ("metabolito", act["n_metabolitos"])):
            if sum(1 for m in cat if m["tipo"] == t) < n:
                errores.append(f"Marcadores: hay menos {t}s que las que se piden")

    if "Guía" in wb.sheetnames:
        for i, f in enumerate(filas(wb["Guía"]), start=2):
            s = txt(f.get("Sección")).lower()
            if s not in SECCIONES:
                errores.append(f"Guía, fila {i}: sección «{s}» desconocida")
                continue
            guia["secciones"][s].append(bil(f.get("Texto"), f.get("Texto (en)")))
    guia["conceptos"] = conceptos(wb["Conceptos"], errores) if "Conceptos" in wb.sheetnames else []
    if errores:
        raise ErrorExcel("\n".join(errores))
    return act, guia


if __name__ == "__main__":
    src = sys.argv[1]
    d_act = sys.argv[2] if len(sys.argv) > 2 else "."
    d_guia = sys.argv[3] if len(sys.argv) > 3 else "."
    try:
        act, guia = convertir(src)
    except ErrorExcel as e:
        print("No se ha podido convertir:\n" + str(e))
        sys.exit(1)
    os.makedirs(d_act, exist_ok=True)
    os.makedirs(d_guia, exist_ok=True)
    json.dump(act, open(os.path.join(d_act, act["id"] + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(guia, open(os.path.join(d_guia, act["id"] + ".guia.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{act['id']}: actividad y guía escritas")
