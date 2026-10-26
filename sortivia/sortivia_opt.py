"""Motor de SORTIVIA en Python (mismas reglas que sortivia.js) y búsqueda de la estrategia óptima.

La estrategia óptima es la que más puntos brutos obtiene sin pasarse del presupuesto. Se busca con
recocido simulado (muchos reinicios), después de fijar las decisiones gratuitas que no intervienen en
ninguna regla (para ellas, lo mejor es simplemente lo que más puntúa).
"""
import math, random

def elegidas(d, v):
    if d["tipo"] == "contador": return []
    ids = v if isinstance(v, list) else ([v] if v else [])
    return [o for o in d["opciones"] if o["id"] in ids]

def incluido(act, el, b):
    return b["id"] in act["bloques_obligatorios"] or el[b["id"]]["inc"]

def condiciones(act, el):
    for b in act["bloques"]:
        if not incluido(act, el, b): continue
        for d in b["decisiones"]:
            for o in elegidas(d, el[b["id"]]["dec"].get(d["id"])):
                if o["coste"]["tipo"] == "condiciones": return o["coste"]["valor"]
    return 1

def tiene_replicas(b):
    return any(o["coste"]["tipo"] == "replicas" for d in b["decisiones"] for o in d["opciones"])

def replicas(act, el):
    """Réplicas comunes: las del primer bloque incluido que tenga decisión de réplicas (para bloques sin ella)."""
    for b in act["bloques"]:
        if not incluido(act, el, b) or not tiene_replicas(b): continue
        for d in b["decisiones"]:
            for o in elegidas(d, el[b["id"]]["dec"].get(d["id"])):
                if o["coste"]["tipo"] == "replicas": return o["coste"]["n"]
        return 0
    return 0

def coste_bloque(b, sel, nc, nr=0):
    reps = 0 if tiene_replicas(b) else nr; pm = 0; mult = 1; fijo = 0; uni = 0
    for d in b["decisiones"]:
        v = sel["dec"].get(d["id"])
        if d["tipo"] == "contador": uni += max(0, int(v or 0)) * d["opciones"][0]["coste"]["valor"]; continue
        for o in elegidas(d, v):
            c = o["coste"]; t = c["tipo"]
            if t == "replicas": reps = max(reps, c["n"]); pm += c["valor"]
            elif t == "muestra": pm += c["valor"]
            elif t == "mult": mult *= c["valor"]
            elif t == "fijo": fijo += c["valor"]
    return round(nc * reps * pm * mult + fijo + uni, 2)

def coste2_total(act, el):
    """Segundo límite (coste.v2, p. ej., minutos): suma directa; ×unidades en los contadores."""
    if not act.get("limite2"): return 0
    t = 0
    for b in act["bloques"]:
        if not incluido(act, el, b): continue
        for d in b["decisiones"]:
            v = el[b["id"]]["dec"].get(d["id"])
            if d["tipo"] == "contador": t += max(0, int(v or 0)) * d["opciones"][0]["coste"].get("v2", 0); continue
            for o in elegidas(d, v): t += o["coste"].get("v2", 0)
    return t

def cabe(act, el, presupuesto):
    return coste_total(act, el) <= presupuesto and (not act.get("limite2") or coste2_total(act, el) <= act["limite2"]["valor"])

def coste_total(act, el):
    nc = condiciones(act, el); nr = replicas(act, el)
    return sum(coste_bloque(b, el[b["id"]], nc, nr) for b in act["bloques"] if incluido(act, el, b))

def termino(act, el, t, idx):
    b = idx[t["bloque"]]; inc = incluido(act, el, b)
    if "decision" not in t: ok = inc
    else:
        d = next(x for x in b["decisiones"] if x["id"] == t["decision"])
        v = el[b["id"]]["dec"].get(t["decision"]) if inc else None
        ok = inc and (any(o["id"] in t["opciones"] for o in elegidas(d, v)) if "opciones" in t else int(v or 0) > t["mayor_que"])
    return (not ok) if t["no"] else ok

def puntos_decision(d, v, P, bid):
    """Puntos de una decisión y, para cada opción elegida, si cuenta.
    Varias opciones: cuenta la mejor de las positivas; las negativas (trampas) restan todas."""
    if d["tipo"] == "contador":
        if int(v or 0) > 0:
            p = P.get(f"{bid}/{d['id']}/{d['opciones'][0]['id']}", 0); return p, [(d["opciones"][0]["id"], p, True)]
        return 0, []
    ch = [(o["id"], P.get(f"{bid}/{d['id']}/{o['id']}", 0)) for o in elegidas(d, v)]
    if d["tipo"] != "multiple": return sum(p for _, p in ch), [(i, p, True) for i, p in ch]
    pos = [x for x in ch if x[1] > 0]; best = max(pos, key=lambda x: x[1])[0] if pos else None
    det = [(i, p, (p < 0) or (i == best) or (p == 0 and not pos)) for i, p in ch]
    return sum(p for _, p, c in det if c), det

def puntos_detalle(act, clave, el, idx=None):
    """Total bruto y detalle [(bloque, decisión, opción, puntos, cuenta)].
    Los bloques se agrupan por objetivo: cuenta el bloque con más puntos de cada objetivo; de los demás
    bloques solo cuentan las penalizaciones (los errores restan siempre). Las reglas con «bloque» suman a ese
    bloque; las demás, al total."""
    idx = idx or {b["id"]: b for b in act["bloques"]}
    P = clave["puntos"]; por_obj = {}; tot = 0.0; detalle = []
    reglas_ok = [r for r in clave.get("reglas", []) if r["terminos"] and all(termino(act, el, t, idx) for t in r["terminos"])]
    for b in act["bloques"]:
        if not incluido(act, el, b): continue
        sb, det = 0, []
        for d in b["decisiones"]:
            p, ds = puntos_decision(d, el[b["id"]]["dec"].get(d["id"]), P, b["id"])
            sb += p; det += [(b["id"], d["id"], i, pp, c) for i, pp, c in ds]
        for r in reglas_ok:
            if r.get("bloque") == b["id"]: sb += r["puntos"]; det.append(("regla", r["id"], b["id"], r["puntos"], True))
        obj = (b.get("objetivo") or {}).get("id") or b["id"]
        por_obj.setdefault(obj, []).append((sb, b["id"], det))
    for obj, lst in por_obj.items():
        mejor = max(lst, key=lambda x: x[0])
        tot += mejor[0]
        for sb, bid, det in lst:
            if bid == mejor[1]: detalle += det
            else:
                for e in det:
                    cuenta = e[4] and e[3] < 0
                    if cuenta: tot += e[3]
                    detalle.append(e[:4] + (cuenta,))
    for r in reglas_ok:
        if not r.get("bloque"): tot += r["puntos"]; detalle.append(("regla", r["id"], "", r["puntos"], True))
    return tot, detalle

def puntos(act, clave, el, idx=None):
    return puntos_detalle(act, clave, el, idx)[0]

def escalar(clave, bruto):
    e = clave.get("escala")
    if not e or not e.get("maximo"): return math.floor(bruto)
    v = bruto * e["objetivo"] / e["maximo"]
    return min(e["objetivo"], math.floor(v)) if v > 0 else math.floor(v)

def optimizar(act, clave, presupuesto, reinicios=40, iteraciones=12000, semilla=1):
    rnd = random.Random(semilla)
    idx = {b["id"]: b for b in act["bloques"]}
    P = clave["puntos"]
    en_reglas = {(t["bloque"], t.get("decision")) for r in clave.get("reglas", []) for t in r["terminos"]}
    bloques_en_reglas = {t["bloque"] for r in clave.get("reglas", []) for t in r["terminos"]}
    def pts(b, d, o): return P.get(f"{b['id']}/{d['id']}/{o['id']}", 0)
    def mejor_fija(b, d):
        mejor = max(d["opciones"], key=lambda o: pts(b, d, o))["id"]
        return [mejor] if d["tipo"] == "multiple" else mejor
    libres = []   # (bloque, decisión) que el algoritmo explora
    fijas = {}
    for b in act["bloques"]:
        for d in b["decisiones"]:
            gratis = all(o["coste"]["valor"] == 0 or o["coste"]["tipo"] == "mult" and o["coste"]["valor"] == 1 for o in d["opciones"]) and d["tipo"] != "contador"
            if gratis and (b["id"], d["id"]) not in en_reglas: fijas[(b["id"], d["id"])] = mejor_fija(b, d)
            else: libres.append((b, d))
    opcionales = [b for b in act["bloques"] if b["id"] not in act["bloques_obligatorios"]]
    def aleatoria_dec(b, d):
        if d["tipo"] == "contador": return rnd.choice([0, 0, 1, 2])
        if d["tipo"] == "multiple":
            k = rnd.randint(1, min(3, len(d["opciones"])))
            return [o["id"] for o in rnd.sample(d["opciones"], k)]
        return rnd.choice(d["opciones"])["id"]
    def nueva():
        el = {b["id"]: {"inc": False, "dec": {}} for b in act["bloques"]}
        for (bid, did), v in fijas.items(): el[bid]["dec"][did] = list(v) if isinstance(v, list) else v
        for b, d in libres: el[b["id"]]["dec"][d["id"]] = aleatoria_dec(b, d)
        return el
    def copia(el): return {k: {"inc": v["inc"], "dec": {dk: (list(dv) if isinstance(dv, list) else dv) for dk, dv in v["dec"].items()}} for k, v in el.items()}
    def mover(el):
        e = copia(el)
        if rnd.random() < 0.15 and opcionales:
            b = rnd.choice(opcionales); e[b["id"]]["inc"] = not e[b["id"]]["inc"]; return e
        b, d = rnd.choice(libres)
        v = e[b["id"]]["dec"].get(d["id"])
        if d["tipo"] == "contador": e[b["id"]]["dec"][d["id"]] = max(0, min(5, int(v or 0) + rnd.choice([-1, 1])))
        elif d["tipo"] == "multiple":
            cur = set(v or []); o = rnd.choice(d["opciones"])["id"]
            if o in cur and len(cur) > 1: cur.discard(o)
            else: cur.add(o)
            e[b["id"]]["dec"][d["id"]] = sorted(cur)
        else: e[b["id"]]["dec"][d["id"]] = rnd.choice(d["opciones"])["id"]
        return e
    mejor, mejor_p = None, -math.inf
    for _ in range(reinicios):
        el = nueva()
        while not cabe(act, el, presupuesto):   # empezar desde algo que quepa
            el = nueva()
            for b in opcionales: el[b["id"]]["inc"] = rnd.random() < 0.3
        p = puntos(act, clave, el, idx) - coste_total(act, el) * 1e-5
        T0, T1 = 8.0, 0.05
        for i in range(iteraciones):
            T = T0 * (T1 / T0) ** (i / iteraciones)
            e2 = mover(el)
            if not cabe(act, e2, presupuesto): continue
            p2 = puntos(act, clave, e2, idx) - coste_total(act, e2) * 1e-5
            if p2 >= p or rnd.random() < math.exp((p2 - p) / T):
                el, p = e2, p2
                if p > mejor_p: mejor, mejor_p = copia(el), p
    if mejor:   # limpieza: quita opciones de más que no aportan puntos
        total = puntos(act, clave, mejor, idx)
        for b in act["bloques"]:
            for d in b["decisiones"]:
                if d["tipo"] != "multiple": continue
                for o in list(mejor[b["id"]]["dec"].get(d["id"]) or []):
                    cur = mejor[b["id"]]["dec"][d["id"]]
                    if len(cur) < 2: break
                    mejor[b["id"]]["dec"][d["id"]] = [x for x in cur if x != o]
                    if puntos(act, clave, mejor, idx) < total: mejor[b["id"]]["dec"][d["id"]] = cur
    return (puntos(act, clave, mejor, idx) if mejor else mejor_p), mejor

def describir(act, el):
    """Lista legible de la estrategia: [(bloque, decisión, elección, coste del bloque)]."""
    nc = condiciones(act, el); nr = replicas(act, el); filas = []
    for b in act["bloques"]:
        if not incluido(act, el, b): continue
        cb = coste_bloque(b, el[b["id"]], nc, nr)
        for d in b["decisiones"]:
            v = el[b["id"]]["dec"].get(d["id"])
            if d["tipo"] == "contador":
                if int(v or 0) > 0: filas.append((b["nombre"], d["nombre"], f"{int(v)} ×", cb))
                continue
            filas.append((b["nombre"], d["nombre"], ", ".join(str(o["label"]) for o in elegidas(d, v)), cb))
    return filas
