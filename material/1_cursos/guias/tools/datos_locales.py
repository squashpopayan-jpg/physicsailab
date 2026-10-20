"""Genera los datos locales del cuaderno.

1. src/lib/03-igrf.js   : coeficientes IGRF-14 (2025 y 2030, n <= 13) para que la
   página calcule el campo geomagnético de cualquier municipio.
2. tests/locales.json   : valores de referencia por capital (g, presión, ebullición,
   campo magnético) calculados con ppigrf y CoolProp, para validar el JS.

Uso:  python tools/datos_locales.py
"""
import datetime
import json
import math
import os

import numpy as np
import ppigrf
from CoolProp.CoolProp import PropsSI

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FECHA = datetime.datetime(2026, 10, 19)

# Capitales de departamento: (nombre, departamento, lat, lon, altitud m) — altitud aproximada de la cabecera
CAPITALES = [
    ("Leticia", "Amazonas", -4.215, -69.940, 96),
    ("Medellín", "Antioquia", 6.244, -75.581, 1495),
    ("Arauca", "Arauca", 7.084, -70.759, 125),
    ("Barranquilla", "Atlántico", 10.964, -74.796, 18),
    ("Bogotá", "Bogotá D. C.", 4.711, -74.072, 2640),
    ("Cartagena", "Bolívar", 10.391, -75.479, 2),
    ("Tunja", "Boyacá", 5.535, -73.368, 2810),
    ("Manizales", "Caldas", 5.070, -75.514, 2160),
    ("Florencia", "Caquetá", 1.614, -75.606, 242),
    ("Yopal", "Casanare", 5.337, -72.395, 350),
    ("Popayán", "Cauca", 2.444, -76.614, 1737),
    ("Valledupar", "Cesar", 10.463, -73.253, 168),
    ("Quibdó", "Chocó", 5.692, -76.658, 43),
    ("Montería", "Córdoba", 8.748, -75.881, 18),
    ("Inírida", "Guainía", 3.865, -67.924, 95),
    ("San José del Guaviare", "Guaviare", 2.572, -72.645, 175),
    ("Neiva", "Huila", 2.936, -75.281, 442),
    ("Riohacha", "La Guajira", 11.544, -72.907, 3),
    ("Santa Marta", "Magdalena", 11.241, -74.199, 2),
    ("Villavicencio", "Meta", 4.142, -73.627, 467),
    ("Pasto", "Nariño", 1.214, -77.281, 2527),
    ("Cúcuta", "Norte de Santander", 7.894, -72.508, 320),
    ("Mocoa", "Putumayo", 1.152, -76.647, 604),
    ("Armenia", "Quindío", 4.534, -75.681, 1551),
    ("Pereira", "Risaralda", 4.814, -75.694, 1411),
    ("San Andrés", "San Andrés y Providencia", 12.584, -81.701, 3),
    ("Bucaramanga", "Santander", 7.119, -73.123, 959),
    ("Sincelejo", "Sucre", 9.304, -75.397, 213),
    ("Ibagué", "Tolima", 4.439, -75.232, 1285),
    ("Cali", "Valle del Cauca", 3.451, -76.532, 1018),
    ("Mitú", "Vaupés", 1.198, -70.173, 180),
    ("Puerto Carreño", "Vichada", 6.189, -67.486, 51),
]

# Modelo atmosférico tropical (ver capítulo de datos locales)
P0, T0, LAPSO, R_AIRE, M_AIRE, G0 = 101200.0, 300.0, 0.0065, 8.314462618, 0.0289644, 9.80665


def g_normal(lat):
    """Gravedad normal WGS84 (fórmula cerrada de Somigliana), m/s²."""
    s2 = math.sin(math.radians(lat)) ** 2
    return 9.7803253359 * (1 + 0.00193185265241 * s2) / math.sqrt(1 - 0.00669437999013 * s2)


def g_local(lat, h):
    g0 = g_normal(lat)
    aire_libre = g0 - 3.086e-6 * h
    bouguer = aire_libre + 2 * math.pi * 6.674e-11 * 2670 * h
    return (aire_libre + bouguer) / 2, (bouguer - aire_libre) / 2


def presion(h):
    expo = G0 * M_AIRE / (R_AIRE * LAPSO)
    return P0 * (1 - LAPSO * h / T0) ** expo


def campo(lat, lon, h):
    be, bn, bu = (float(np.squeeze(x)) for x in ppigrf.igrf(lon, lat, h / 1000.0, FECHA))
    H = math.hypot(be, bn)
    F = math.hypot(H, bu)
    return {"F": F, "H": H, "Z": -bu, "D": math.degrees(math.atan2(be, bn)), "I": math.degrees(math.atan2(-bu, H))}


def coeficientes():
    ruta = os.path.join(os.path.dirname(ppigrf.__file__), "IGRF14.shc")
    filas = []
    with open(ruta, encoding="utf-8") as f:
        lineas = [l for l in f if not l.startswith("#")]
    epocas = [float(x) for x in lineas[1].split()]
    i25, i30 = epocas.index(2025.0), epocas.index(2030.0)
    for l in lineas[2:]:
        p = l.split()
        if len(p) < 3:
            continue
        n, m = int(p[0]), int(p[1])
        vals = [float(x) for x in p[2:]]
        filas.append((n, m, vals[i25], vals[i30]))
    return filas


def main():
    filas = coeficientes()
    nmax = max(n for n, _, _, _ in filas)
    gc = {}
    for n, m, a, b in filas:
        gc[(n, m)] = (a, b)
    # Empaquetado: para n=1..nmax, m=0..n: g(n,m) y h(n,m) (h(n,0)=0)
    g25, g30, h25, h30 = [], [], [], []
    for n in range(1, nmax + 1):
        for m in range(0, n + 1):
            a, b = gc[(n, m)]
            g25.append(a); g30.append(b)
            if m == 0:
                h25.append(0.0); h30.append(0.0)
            else:
                a, b = gc[(n, -m)]
                h25.append(a); h30.append(b)
    js = [
        "/* 03-igrf.js — GENERADO por tools/datos_locales.py: no editar a mano.",
        "   Coeficientes de Gauss del IGRF-14 (IAGA, 2024) para 2025.0 y 2030.0 (nT), n = 1…%d," % nmax,
        "   ordenados n = 1…N, m = 0…n. Entre 2025 y 2030 se interpola linealmente. */",
        "(function () {",
        "  'use strict';",
        "  window.EM = window.EM || {};",
        "  window.EM.IGRF = {",
        "    nmax: %d," % nmax,
        "    g2025: %s," % json.dumps(g25),
        "    h2025: %s," % json.dumps(h25),
        "    g2030: %s," % json.dumps(g30),
        "    h2030: %s" % json.dumps(h30),
        "  };",
        "})();",
        "",
    ]
    with open(os.path.join(ROOT, "src", "lib", "03-igrf.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(js))

    out = []
    for nom, dep, lat, lon, h in CAPITALES:
        g, ug = g_local(lat, h)
        p = presion(h)
        tb = PropsSI("T", "P", p, "Q", 0, "Water") - 273.15
        b = campo(lat, lon, h)
        out.append({"nombre": nom, "dep": dep, "lat": lat, "lon": lon, "h": h, "g": g, "ug": ug,
                    "p": p, "tb": tb, **b})
    # Puntos de control del IGRF fuera de Colombia (validación de la síntesis en JS)
    control = []
    for lat, lon, h in [(60.0, 10.0, 0.0), (-35.0, 150.0, 500.0), (0.0, 0.0, 0.0), (80.0, -100.0, 1000.0), (-70.0, 40.0, 0.0)]:
        control.append({"lat": lat, "lon": lon, "h": h, **campo(lat, lon, h)})
    # Ebullición del agua en función de la presión (CoolProp) para validar la fórmula de Antoine
    hervir = [{"p": pp, "tb": PropsSI("T", "P", pp, "Q", 0, "Water") - 273.15} for pp in (60000, 70000, 75000, 80000, 85000, 90000, 95000, 101325)]
    with open(os.path.join(ROOT, "tests", "locales.json"), "w", encoding="utf-8") as f:
        json.dump({"fecha": FECHA.strftime("%Y-%m-%d"), "capitales": out, "control": control, "hervir": hervir}, f, ensure_ascii=False, indent=1)
    for c in out:
        print("%-22s g=%.4f±%.4f  p=%.1f hPa  Tb=%.2f °C  F=%.0f H=%.0f nT  D=%.1f° I=%.1f°" % (
            c["nombre"], c["g"], c["ug"], c["p"] / 100, c["tb"], c["F"], c["H"], c["D"], c["I"]))


if __name__ == "__main__":
    main()
