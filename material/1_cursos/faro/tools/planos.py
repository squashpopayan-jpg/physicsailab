"""Planos acotados del pod Faro (A4 apaisado, escala 1:1) → planos/*.svg

Los cortes salen del propio modelo (OpenSCAD → planos/_sec, ver tools/carcasa.py secciones)
y las cotas se calculan con los parámetros de carcasa/faro.scad, así plano y modelo coinciden.
Uso: python tools/planos.py
"""
import math
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SEC = RAIZ / 'planos' / '_sec'
SCAD = (RAIZ / 'carcasa' / 'faro.scad').read_text(encoding='utf-8')


def P(nombre):
    m = re.search(r'^\s*' + nombre + r'\s*=\s*([-0-9.]+)\s*;', SCAD, re.M)
    return float(m.group(1))


def V(nombre):
    m = re.search(r'^\s*' + nombre + r'\s*=\s*\[([^\]]*)\]\s*;', SCAD, re.M)
    return [float(x) for x in m.group(1).split(',')]


D, H, h_base, e_pared, e_piso = P('D'), P('H'), P('h_base'), P('e_pared'), P('e_piso')
R = D / 2
r_int = R - e_pared
e_domo, e_lat, R_borde, z_borde = P('e_domo'), P('e_lateral'), P('R_borde'), P('z_borde')
falda_z, falda_e, holgura = P('falda_z'), P('falda_e'), P('holgura')
falda_ext = r_int - holgura
z_tornillo, inserto_d, inserto_prof = P('z_tornillo'), P('inserto_d'), P('inserto_prof')
paso_d, avellanado_d = P('paso_d'), P('avellanado_d')
anillo_ext, anillo_int = P('anillo_d_ext'), P('anillo_d_int')
z_soporte, e_soporte, pedestal_d = P('z_soporte'), P('e_soporte'), P('pedestal_d')
holg_ped, labio_h = P('holgura_pedestal'), P('labio_h')
postes_r, poste_d, piloto_d = P('postes_r'), P('poste_d'), P('piloto_d')
ventana_d, ventana_ext, ventana_e, ventana_reb = P('ventana_d'), P('ventana_ext_d'), P('ventana_e'), P('ventana_rebaje')
usb_z, sw_z = P('usb_z'), P('sw_z')
usb_hueco, usb_bols = V('usb_hueco'), V('usb_bolsillo')
sw_ranura, sw_rebaje = V('sw_ranura'), V('sw_rebaje')
tpu_r, tpu_reb, tpu_e = V('tpu_r'), P('tpu_rebaje'), P('tpu_e')
bat, bat_c = V('bat'), V('bat_c')
placa, placa_c = V('placa'), V('placa_c')
tp, tp_c = V('tp'), V('tp_c')
tof_pcb, tof_prof = V('tof_pcb'), P('tof_prof')
z_techo = H - e_domo
z_ped = z_techo - holg_ped
r_plato = anillo_ext / 2 + 0.3 + 1.2


def f(x, nd=1):
    """Número con coma decimal y sin ceros sobrantes."""
    s = ('%.' + str(nd) + 'f') % x
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    return s.replace('.', ',')


def leer_d(nombre):
    p = SEC / (nombre + '.svg')
    if not p.exists():
        return None
    ds = re.findall(r'\sd="([^"]+)"', p.read_text(encoding='utf-8'))
    return ' '.join(' '.join(d.split()) for d in ds) if ds else None


class Hoja:
    def __init__(self, titulo, subtitulo, num, total):
        self.e = []
        self.titulo, self.subtitulo, self.num, self.total = titulo, subtitulo, num, total

    def add(self, s):
        self.e.append(s)

    # ---------- geometría ----------
    def parte(self, nombre, x0, y0, clase):
        d = leer_d(nombre)
        if d:
            self.add(f'<path d="{d}" transform="translate({x0} {y0})" class="{clase}" fill-rule="evenodd"/>')
        return d is not None

    def linea(self, pts, clase='fina'):
        d = 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in pts)
        self.add(f'<path d="{d}" class="{clase}"/>')

    def texto(self, x, y, s, t=2.8, anchor='start', peso=400, clase='', rot=0):
        s = s.replace('&', '&amp;').replace('<', '&lt;')
        tr = f' transform="rotate({rot} {x:.2f} {y:.2f})"' if rot else ''
        self.add(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{t}" text-anchor="{anchor}" font-weight="{peso}" class="{clase}"{tr}>{s}</text>')

    def flecha(self, x, y, ang):
        a = math.radians(ang)
        l, w = 2.4, 0.75
        p1 = (x - l * math.cos(a) + w * math.sin(a), y - l * math.sin(a) - w * math.cos(a))
        p2 = (x - l * math.cos(a) - w * math.sin(a), y - l * math.sin(a) + w * math.cos(a))
        self.add(f'<path d="M{x:.2f},{y:.2f} L{p1[0]:.2f},{p1[1]:.2f} L{p2[0]:.2f},{p2[1]:.2f} Z" class="punta"/>')

    def cota_h(self, x1, x2, y, texto, yref1=None, yref2=None, arriba=True):
        """Cota horizontal en la altura y; líneas de referencia desde yref."""
        for x, yr in ((x1, yref1), (x2, yref2)):
            if yr is not None:
                s = 1 if y > yr else -1
                self.linea([(x, yr + s * 0.8), (x, y + s * 1.6)], 'ref')
        self.linea([(x1, y), (x2, y)], 'fina')
        if abs(x2 - x1) > 7:
            self.flecha(x2, y, 0)
            self.flecha(x1, y, 180)
        else:
            self.flecha(x2, y, 180)
            self.flecha(x1, y, 0)
            self.linea([(x2, y), (x2 + 5, y)], 'fina')
        self.texto((x1 + x2) / 2, y - 1.0 if arriba else y + 3.4, texto, 2.8, 'middle')

    def cota_v(self, y1, y2, x, texto, xref1=None, xref2=None, izq=True):
        for yy, xr in ((y1, xref1), (y2, xref2)):
            if xr is not None:
                s = 1 if x > xr else -1
                self.linea([(xr + s * 0.8, yy), (x + s * 1.6, yy)], 'ref')
        self.linea([(x, y1), (x, y2)], 'fina')
        if abs(y2 - y1) > 7:
            self.flecha(x, max(y1, y2), 90)
            self.flecha(x, min(y1, y2), -90)
        else:
            self.flecha(x, max(y1, y2), -90)
            self.flecha(x, min(y1, y2), 90)
        ym = (y1 + y2) / 2
        if izq:
            self.texto(x - 1.0, ym, texto, 2.8, 'middle', rot=-90)
        else:
            self.texto(x + 3.2, ym, texto, 2.8, 'middle', rot=-90)

    def nota(self, x1, y1, x2, y2, texto, anchor='start'):
        """Línea de referencia con punto en (x1, y1) y texto en (x2, y2)."""
        self.add(f'<circle cx="{x1:.2f}" cy="{y1:.2f}" r="0.45" class="punta"/>')
        dx = 4 if anchor == 'start' else -4
        self.linea([(x1, y1), (x2, y2), (x2 + dx, y2)], 'fina')
        self.texto(x2 + dx + (0.8 if anchor == 'start' else -0.8), y2 + 1.0, texto, 2.6, anchor)

    def globo(self, x1, y1, x2, y2, n):
        self.add(f'<circle cx="{x1:.2f}" cy="{y1:.2f}" r="0.45" class="punta"/>')
        ang = math.atan2(y1 - y2, x1 - x2)
        self.linea([(x1, y1), (x2 + 3.2 * math.cos(ang), y2 + 3.2 * math.sin(ang))], 'fina')
        self.add(f'<circle cx="{x2:.2f}" cy="{y2:.2f}" r="3.2" class="globo"/>')
        self.texto(x2, y2 + 1.05, str(n), 3.0, 'middle', 700)

    def titulo_vista(self, x, y, s, escala='1:1'):
        self.texto(x, y, s, 3.4, 'middle', 700)
        self.texto(x, y + 4, 'escala ' + escala, 2.5, 'middle', 400, 'gris')

    def tabla(self, x, y, anchos, filas, alto=5.2):
        tot = sum(anchos)
        for i, fila in enumerate(filas):
            yy = y + i * alto
            if i == 0:
                self.add(f'<rect x="{x}" y="{yy}" width="{tot}" height="{alto}" class="cab"/>')
            self.linea([(x, yy + alto), (x + tot, yy + alto)], 'ref' if i else 'fina')
            cx = x
            for w, c in zip(anchos, fila):
                self.texto(cx + 1.2, yy + alto - 1.5, str(c), 2.5, 'start', 700 if i == 0 else 400)
                cx += w
        self.add(f'<rect x="{x}" y="{y}" width="{tot}" height="{alto * len(filas)}" class="marco2"/>')

    def guardar(self, nombre):
        W, Hh = 297, 210
        rx, ry, rw, rh = 177, 172, 110, 28
        cab = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh}" width="{W}mm" height="{Hh}mm" font-family="Inter, 'Segoe UI', Arial, sans-serif">
<defs>
<pattern id="h45" patternUnits="userSpaceOnUse" width="1.5" height="1.5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.5" stroke="#1d2430" stroke-width="0.16"/></pattern>
<pattern id="h135" patternUnits="userSpaceOnUse" width="1.5" height="1.5" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="1.5" stroke="#2563eb" stroke-width="0.16"/></pattern>
<pattern id="hx" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="2" stroke="#7c3aed" stroke-width="0.16"/></pattern>
</defs>
<style>
text{{fill:#1d2430}} .gris{{fill:#6b7480}}
.fina{{fill:none;stroke:#1d2430;stroke-width:0.18}} .ref{{fill:none;stroke:#1d2430;stroke-width:0.13}}
.eje{{fill:none;stroke:#b91c1c;stroke-width:0.15;stroke-dasharray:6 1.5 1 1.5}}
.oculta{{fill:none;stroke:#1d2430;stroke-width:0.18;stroke-dasharray:1.6 0.9}}
.punta{{fill:#1d2430}} .globo{{fill:#fff;stroke:#1d2430;stroke-width:0.22}}
.marco{{fill:none;stroke:#1d2430;stroke-width:0.5}} .marco2{{fill:none;stroke:#1d2430;stroke-width:0.25}} .cab{{fill:#eef1f5}}
.base{{fill:url(#h45);stroke:#1d2430;stroke-width:0.3}}
.domo{{fill:url(#h135);stroke:#1e40af;stroke-width:0.3}}
.soporte{{fill:url(#hx);stroke:#5b21b6;stroke-width:0.3}}
.tpu{{fill:#4b5563;stroke:#1d2430;stroke-width:0.2}}
.comp{{fill:#e5e7eb;stroke:#4b5563;stroke-width:0.2}}
.comp2{{fill:#dbeafe;stroke:#1e3a8a;stroke-width:0.2}}
.cobre{{fill:#c87533;stroke:#7c3f12;stroke-width:0.15}}
.vidrio{{fill:#cfe8ff;stroke:#1e3a8a;stroke-width:0.2}}
.sil{{fill:#f3f4f6;stroke:#374151;stroke-width:0.22}}
.silb{{fill:#dbeafe;stroke:#1e3a8a;stroke-width:0.22}}
.silv{{fill:#ede9fe;stroke:#5b21b6;stroke-width:0.22}}
.trazo{{fill:none;stroke:#1d2430;stroke-width:0.35}}
</style>
<rect x="0" y="0" width="{W}" height="{Hh}" fill="#fff"/>
<rect x="8" y="8" width="{W - 16}" height="{Hh - 16}" class="marco"/>
'''
        rot = [
            f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" class="marco"/>',
            f'<line x1="{rx}" y1="{ry + 9}" x2="{rx + rw}" y2="{ry + 9}" class="fina"/>',
            f'<line x1="{rx}" y1="{ry + 21}" x2="{rx + rw}" y2="{ry + 21}" class="fina"/>',
            f'<line x1="{rx + 78}" y1="{ry + 21}" x2="{rx + 78}" y2="{ry + rh}" class="fina"/>',
        ]
        self.e = [cab] + rot + self.e
        self.texto(rx + 3, ry + 6.6, 'FARO · pod de reacción', 4.2, 'start', 700)
        self.texto(rx + rw - 3, ry + 6.6, 'mm', 3, 'end', 400, 'gris')
        self.texto(rx + 3, ry + 14.2, self.titulo, 3.6, 'start', 700)
        self.texto(rx + 3, ry + 18.8, self.subtitulo, 2.5, 'start', 400, 'gris')
        self.texto(rx + 3, ry + 24.4, 'Mg. Manuel Alejandro Obando', 2.4, 'start', 600)
        self.texto(rx + 3, ry + 27.2, 'Depto. de Física · Universidad del Cauca', 2.2, 'start', 400, 'gris')
        self.texto(rx + 94, ry + 25.4, f'Hoja {self.num}/{self.total}', 2.8, 'middle', 700)
        self.texto(rx + 94, ry + 27.0 + 0.4, '', 2.2, 'middle')
        self.texto(rx + 3, ry - 2.4, 'Imprime en A4 apaisado al 100 % (sin «ajustar a la página»): la regla debe medir 50 mm.', 2.2, 'start', 400, 'gris')
        # regla de control de escala
        x0, y0 = 20, 196
        self.linea([(x0, y0), (x0 + 50, y0)], 'trazo')
        for i in range(0, 51, 5):
            self.linea([(x0 + i, y0), (x0 + i, y0 - (2.2 if i % 10 == 0 else 1.2))], 'fina')
        self.texto(x0 + 25, y0 + 3.4, '50 mm', 2.4, 'middle', 600)
        self.add('</svg>')
        dest = RAIZ / 'planos' / nombre
        dest.write_text('\n'.join(self.e), encoding='utf-8')
        print('plano', dest.name)


def cortes_conjunto(h, ang, x0, y0):
    for o, c in (('base', 'base'), ('tpu', 'tpu'), ('soporte', 'soporte'), ('domo', 'domo'),
                 ('bateria', 'comp2'), ('placa', 'comp'), ('esp32', 'comp'), ('adxl', 'comp'),
                 ('condensador', 'comp'), ('tp4056', 'comp2'), ('usb', 'comp'), ('interruptor', 'comp'),
                 ('anillo', 'comp'), ('tof', 'comp2'), ('ventana', 'vidrio'), ('electrodo', 'cobre')):
        h.parte(f'v{ang}_{o}', x0, y0, c)
    h.linea([(x0, y0 + 4), (x0, y0 - H - 5)], 'eje')


TOTAL = 5

# =====================================================================
# Hoja 1 · Conjunto
# =====================================================================
h = Hoja('Conjunto · cortes A–A y B–B', 'piezas, componentes y cotas generales', 1, TOTAL)
xa, ya = 82, 76
cortes_conjunto(h, 0, xa, ya)
h.titulo_vista(xa, ya + 20, 'CORTE A–A  (por el puerto USB-C y el interruptor)')
h.cota_h(xa - R, xa + R, ya - H - 6, 'Ø' + f(D), ya - h_base, ya - h_base)
h.cota_v(ya, ya - H, xa + R + 9, f(H), xa + 30, xa + 1)
h.cota_v(ya, ya - h_base, xa - R - 9, f(h_base), xa - R, xa - R)
top = ya - H - 15
h.globo(xa - 20, ya - 1.2, xa - 30, ya + 10, 1)
h.globo(xa - 47, ya - 27, xa - 56, top, 2)
h.globo(xa + 27, ya - z_soporte - 1, xa + 44, top, 3)
h.globo(xa + 40, ya + 0.2, xa + 48, ya + 10, 4)
h.globo(xa + 4, ya - z_techo - 0.6, xa + 14, top, 5)
h.globo(xa - 30, ya - z_soporte - 2.8, xa - 40, top, 6)
h.globo(xa - 12, ya - z_ped - 0.04, xa - 24, top, 7)
h.globo(xa - 1, ya - z_ped + 1.5, xa + 2, top, 8)
h.globo(xa + 31, ya - 3.2, xa + 30, ya + 10, 10)
h.globo(xa + R - 2, ya - usb_z, xa + R + 4, ya + 10, 11)
h.globo(xa - R + 3, ya - sw_z, xa - R - 3, ya + 10, 12)
h.globo(xa + 12, ya - 5.2, xa + 14, ya + 10, 9)

xb, yb = 82, 156
cortes_conjunto(h, 30, xb, yb)
h.titulo_vista(xb, yb + 20, 'CORTE B–B  (a 30°: tornillo del domo y poste del soporte)')
h.globo(xb - 22, yb - 7, xb - 26, yb + 10, 13)
h.globo(xb + 16, yb - 9, xb + 14, yb + 10, 14)
h.globo(xb + R - 1, yb - z_tornillo, xb + R + 8, yb - z_tornillo - 12, 15)
h.globo(xb - 39, yb - 8, xb - 47, yb + 10, 16)
h.nota(xb + R - 4.5, yb - z_tornillo, xb + R + 3, yb - z_tornillo + 9, 'inserto M3 + tornillo')
h.nota(xb + R - 4.5, yb - z_tornillo, xb + R + 3, yb - z_tornillo + 13, 'avellanado M3×8 (×3)')

piezas = [
    ('N°', 'Pieza', 'Material / referencia', 'Cant.'),
    ('1', 'Base', 'PETG negro · 4 perímetros', '1'),
    ('2', 'Domo', 'PETG/PLA blanco translúcido', '1'),
    ('3', 'Soporte del anillo', 'PETG/PLA blanco', '1'),
    ('4', 'Anillo antideslizante', 'TPU 95A', '1'),
    ('5', 'Ventana Ø' + f(ventana_ext) + '×' + f(ventana_e), 'acrílico transparente', '1*'),
    ('6', 'Anillo de LED', 'WS2812B ×16 · Ø' + f(anillo_ext), '1'),
    ('7', 'Electrodo Ø' + f(pedestal_d - 1), 'cinta de cobre adhesiva', '1'),
    ('8', 'Sensor de distancia', 'VL53L0X GY-530', '1*'),
    ('9', 'Placa principal', 'perforada 16×13 pasos', '1'),
    ('10', 'Cargador', 'TP4056 + DW01', '1'),
    ('11', 'Conector de carga', 'USB-C de panel', '1'),
    ('12', 'Interruptor', 'SS12D00G3', '1'),
    ('13', 'Batería', 'LiPo 103040 · 3,7 V', '1'),
    ('14', 'Acelerómetro', 'ADXL345 GY-291', '1'),
    ('15', 'Tornillo + inserto', 'M3×8 avellanado + M3×4', '3'),
    ('16', 'Tornillo del soporte', 'autorroscante 2,5×8', '3'),
]
h.tabla(168, 18, [8, 34, 60, 9], piezas)
h.texto(168, 18 + 5.2 * len(piezas) + 4, '* solo en la versión con sensor de distancia.', 2.4, 'start', 400, 'gris')
h.texto(168, 18 + 5.2 * len(piezas) + 8, 'ESP32-S3 Super Mini (U2) va sobre la placa 9; ver hoja 5.', 2.4, 'start', 400, 'gris')
h.texto(168, 18 + 5.2 * len(piezas) + 12, 'Holgura domo–base: ' + f(holgura) + ' mm; techo del domo ' + f(e_domo) + ' mm.', 2.4, 'start', 400, 'gris')
h.guardar('01_conjunto.svg')

# =====================================================================
# Hoja 2 · Base
# =====================================================================
h = Hoja('Pieza 1 · Base', 'PETG · 0,2 mm · 4 perímetros · 25 % relleno · sin soportes', 2, TOTAL)
xp, yp = 72, 80
h.parte('z5_base', xp, yp, 'base')
h.add(f'<circle cx="{xp}" cy="{yp}" r="{R}" class="fina"/>')
for a in (0, 90, 180, 270):
    pass
h.linea([(xp - R - 5, yp), (xp + R + 5, yp)], 'eje')
h.linea([(xp, yp - R - 5), (xp, yp + R + 5)], 'eje')
h.add(f'<circle cx="{xp}" cy="{yp}" r="{postes_r}" class="eje" />')
h.titulo_vista(xp, yp + R + 12, 'PLANTA  (corte horizontal a 5 mm del apoyo)')
h.cota_h(xp - R, xp + R, yp - R - 6, 'Ø' + f(D), yp, yp)
# referencias con letra (ver tabla)
sx = placa[0] / 2 - 2.54
sy0 = placa_c[1] - (placa[1] / 2 - 3.05)
sy1 = placa_c[1] + (placa[1] / 2 - 3.05)
bx0 = bat_c[0] - bat[0] / 2 - 0.6
bx1 = bat_c[0] + bat[0] / 2 + 0.6
by0 = bat_c[1] - bat[1] / 2 - 0.6
by1 = bat_c[1] + bat[1] / 2 + 0.6
h.cota_h(xp + bx0, xp + bx1, yp - by0 + 6, f(bx1 - bx0), yp - by0, yp - by0, arriba=False)
h.cota_v(yp - by0, yp - by1, xp + bx0 - 4, f(by1 - by0), xp + bx0, xp + bx0)
h.cota_h(xp - sx, xp + sx, yp - sy1 - 6, f(2 * sx, 2), yp - sy1, yp - sy1)
h.cota_v(yp - sy0, yp - sy1, xp + sx + 5, f(sy1 - sy0, 2), xp + sx, xp + sx, izq=False)
c330 = (math.cos(math.radians(330)), math.sin(math.radians(330)))
h.globo(xp, yp - postes_r, xp - 16, yp - postes_r - 8, 'A')
h.globo(xp - sx, yp - sy0, xp - 30, yp - 12, 'B')
h.globo(xp + 6, yp - bat_c[1] + 6, xp + 22, yp + 30, 'C')
h.globo(xp + tp_c[0] - tp[0] / 2 - 1, yp - tp_c[1] - 9, xp + 26, yp - 28, 'D')
h.globo(xp + R - 1.2, yp, xp + R + 4, yp - 10, 'E')
h.globo(xp - R + 1.2, yp, xp - R - 3, yp - 10, 'F')
h.globo(xp + postes_r * c330[0], yp - postes_r * c330[1], xp + 46, yp + 36, 'G')

# corte A-A de la base sola
xc, yc = 222, 34
h.parte('v0_base', xc, yc, 'base')
h.linea([(xc, yc + 4), (xc, yc - h_base - 4)], 'eje')
h.titulo_vista(xc, yc + 14, 'CORTE A–A')
h.cota_v(yc, yc - h_base, xc + R + 6, f(h_base), xc + R, xc + R, izq=False)
h.cota_v(yc, yc - e_piso, xc - 22, f(e_piso), xc - 30, xc - 30)
h.cota_h(xc - tpu_r[1], xc - tpu_r[0], yc + 6, f(tpu_r[1] - tpu_r[0]), yc, yc, arriba=False)
h.nota(xc + R - 1.2, yc - usb_z, xc + R + 3, yc - usb_z - 9, 'USB')
h.nota(xc - R + 1.2, yc - sw_z, xc - R - 3, yc - sw_z - 9, 'SW', 'end')
# corte B-B de la base
xc2, yc2 = 222, 84
h.parte('v30_base', xc2, yc2, 'base')
h.linea([(xc2, yc2 + 4), (xc2, yc2 - h_base - 4)], 'eje')
h.titulo_vista(xc2, yc2 + 14, 'CORTE B–B  (30°)')
h.cota_v(yc2, yc2 - z_tornillo, xc2 + R + 6, f(z_tornillo), xc2 + R, xc2 + R, izq=False)
h.cota_v(yc2, yc2 - z_soporte, xc2 - R - 5, f(z_soporte), xc2 - postes_r - 3.5, xc2 - postes_r - 3.5)
h.nota(xc2 + R - 1, yc2 - z_tornillo, xc2 + R - 6, yc2 - z_tornillo - 13, 'Ø' + f(paso_d) + ' avellanado Ø' + f(avellanado_d) + ' a 90° (×3)', 'end')
datos = [
    ('Ref.', 'Detalle', 'Medida'),
    ('A', '3 postes del soporte a 90°, 210°, 330°', 'Ø' + f(poste_d) + ' · piloto Ø' + f(piloto_d)),
    ('B', '4 separadores de la placa (tornillo M2)', 'Ø5 × ' + f(e_piso + 2) + ' · Ø1,6'),
    ('C', 'Cuna de la batería (alto 4)', f(bx1 - bx0) + ' × ' + f(by1 - by0)),
    ('D', 'Topes del cargador TP4056', 'paso ' + f(tp[0] + 0.8)),
    ('E', 'Ranura USB-C, centro a ' + f(usb_z) + ' del apoyo', f(usb_hueco[0]) + ' × ' + f(usb_hueco[1]) + ' r 1,3'),
    ('', 'Rebaje interior del USB-C', f(usb_bols[0]) + ' × ' + f(usb_bols[1]) + ' × ' + f(usb_bols[2])),
    ('F', 'Ranura del interruptor, centro a ' + f(sw_z), f(sw_ranura[0]) + ' × ' + f(sw_ranura[1])),
    ('', 'Rebaje exterior del interruptor', f(sw_rebaje[0]) + ' × ' + f(sw_rebaje[1]) + ' × ' + f(sw_rebaje[2])),
    ('G', 'Círculo de postes', 'Ø' + f(2 * postes_r)),
    ('', 'Rebaje del anillo TPU (fondo)', 'Ø' + f(2 * tpu_r[0]) + '–' + f(2 * tpu_r[1]) + ' × ' + f(tpu_reb)),
    ('', 'Pared · piso · texto del fondo', f(e_pared) + ' · ' + f(e_piso) + ' · 0,6'),
]
h.tabla(150, 104, [9, 70, 37], datos)
h.guardar('02_base.svg')

# =====================================================================
# Hoja 3 · Domo
# =====================================================================
h = Hoja('Pieza 2 · Domo translúcido', 'se imprime boca abajo · PETG/PLA blanco translúcido · 3 paredes · 0,2 mm', 3, TOTAL)
xd, yd = 84, 62
h.parte('v0_domo', xd, yd + 0, 'domo')
h.linea([(xd, yd - falda_z + 4), (xd, yd - H - 5)], 'eje')
h.titulo_vista(xd, yd - falda_z + 17, 'CORTE A–A  (cotas desde el apoyo de la base)')
h.cota_h(xd - R, xd + R, yd - H - 7, 'Ø' + f(D), yd - z_borde, yd - z_borde)
h.cota_h(xd - falda_ext, xd + falda_ext, yd - falda_z + 6, 'Ø' + f(2 * falda_ext) + ' falda', yd - falda_z, yd - falda_z, arriba=False)
h.cota_v(yd - h_base, yd - H, xd + R + 8, f(H - h_base), xd + R, xd + 46, izq=False)
h.cota_v(yd - falda_z, yd - h_base, xd - R - 6, f(h_base - falda_z), xd - falda_ext, xd - R)
h.cota_v(yd - z_techo, yd - H, xd + 26, f(e_domo), xd + 20, xd + 20, izq=False)
h.cota_h(xd - ventana_d / 2, xd + ventana_d / 2, yd - H - 2.2, 'Ø' + f(ventana_d), None, None)
h.nota(xd + ventana_ext / 2, yd - z_techo - 0.5, xd + 16, yd - z_techo + 9, 'rebaje Ø' + f(ventana_ext + 0.4) + ' × ' + f(ventana_reb) + ' (ventana)')
h.nota(xd - R + 1, yd - z_borde - 6, xd - R - 2, yd - H - 10, 'R' + f(R_borde) + ' + bisel 45°', 'end')
h.nota(xd + R - 1, yd - z_borde + 2, xd + R + 4, yd - z_borde + 14, 'pared ' + f(e_lat))

xd2, yd2 = 84, 138
h.parte('v30_domo', xd2, yd2, 'domo')
h.linea([(xd2, yd2 - falda_z + 4), (xd2, yd2 - H - 5)], 'eje')
h.titulo_vista(xd2, yd2 - falda_z + 12, 'CORTE B–B  (por un tetón del inserto)')
h.cota_v(yd2 - falda_z, yd2 - z_tornillo, xd2 + R + 6, f(z_tornillo - falda_z), xd2 + falda_ext, xd2 + falda_ext, izq=False)
h.nota(xd2 + falda_ext - 3, yd2 - z_tornillo, xd2 + R + 8, yd2 - z_tornillo - 12, 'Ø' + f(inserto_d) + ' × ' + f(inserto_prof) + ' para inserto M3 (×3)')
h.nota(xd2 + falda_ext - 3.5, yd2 - h_base - 3, xd2 + R + 8, yd2 - H - 4, 'tetón con apoyo a 45° (×3)')
pasos = [
    ('Impresión del domo', ''),
    ('Orientación', 'techo sobre la cama (boca abajo)'),
    ('Material', 'PETG o PLA blanco translúcido'),
    ('Capa / paredes', '0,2 mm · 3 paredes · 100 % techo'),
    ('Superficie', 'cama texturizada = acabado mate'),
    ('Soportes', 'no hacen falta (todo ≥ 45°)'),
    ('Insertos', 'M3×4 con cautín a 220 °C'),
    ('Ventana', 'acrílico Ø' + f(ventana_ext) + '×' + f(ventana_e) + ' pegado con UV'),
]
h.tabla(178, 30, [36, 73], pasos)
h.guardar('03_domo.svg')

# =====================================================================
# Hoja 4 · Soporte, anillo TPU y plantillas
# =====================================================================
h = Hoja('Pieza 3 · Soporte · Pieza 4 · TPU · plantillas', 'soporte en PETG/PLA blanco, 15–20 % de relleno', 4, TOTAL)
xs, ys = 64, 57
h.parte('v0_soporte', xs, ys, 'soporte')
h.parte('v0_tof', xs, ys, 'comp2')
h.parte('v0_anillo', xs, ys, 'comp')
h.parte('v0_electrodo', xs, ys, 'cobre')
h.linea([(xs, ys - z_soporte + 4), (xs, ys - z_ped - 5)], 'eje')
h.titulo_vista(xs, ys - z_soporte + 12, 'CORTE A–A del soporte (cotas desde el apoyo)')
h.cota_h(xs - r_plato, xs + r_plato, ys - z_soporte + 5, 'Ø' + f(2 * r_plato), ys - z_soporte, ys - z_soporte, arriba=False)
h.cota_h(xs - pedestal_d / 2, xs + pedestal_d / 2, ys - z_ped - 6, 'Ø' + f(pedestal_d) + ' pedestal', ys - z_ped, ys - z_ped)
h.cota_v(ys - z_soporte, ys - z_ped, xs - r_plato - 6, f(z_ped - z_soporte), xs - r_plato, xs - pedestal_d / 2)
h.cota_v(ys - z_soporte, ys - z_soporte - e_soporte, xs + r_plato + 5, f(e_soporte), xs + r_plato, xs + r_plato, izq=False)
h.nota(xs + 5, ys - z_ped + tof_prof - 0.5, xs + 26, ys - z_ped - 9, 'bolsillo ToF ' + f(tof_pcb[0] + 0.5) + '×' + f(tof_pcb[1] + 0.5) + '×' + f(tof_prof))
h.nota(xs + r_plato - 0.6, ys - z_soporte - e_soporte - 0.6, xs + r_plato + 4, ys - z_soporte - 10, 'labio ' + f(labio_h) + ' centra el anillo Ø' + f(anillo_ext))
h.texto(xs, ys + 14, 'El pedestal se imprime macizo con relleno: sostiene el domo si alguien lo pisa.', 2.4, 'middle', 400, 'gris')

xs2, ys2 = 58, 124
h.parte('z15_soporte', xs2, ys2, 'soporte')
h.linea([(xs2 - 46, ys2), (xs2 + 46, ys2)], 'eje')
h.linea([(xs2, ys2 - 46), (xs2, ys2 + 42)], 'eje')
h.titulo_vista(xs2, ys2 + 48, 'PLANTA del plato (corte a 15 mm)')
h.globo(xs2, ys2 - postes_r, xs2 + 16, ys2 - postes_r - 3, 'A')
h.globo(xs2 - 30, ys2 - 12, xs2 - 44, ys2 - 30, 'B')
h.globo(xs2 + 16, ys2 - 26, xs2 + 36, ys2 - 34, 'C')
h.globo(xs2 + 16, ys2, xs2 + 46, ys2 + 8, 'D')
h.globo(xs2 + 3, ys2 + 2, xs2 + 30, ys2 + 36, 'E')
leyenda = [
    ('Ref.', 'Detalle del plato'),
    ('A', '3 orejas Ø2,9 en Ø' + f(2 * postes_r)),
    ('B', 'muesca para el USB-C de la ESP32'),
    ('C', 'ranura de cables del anillo'),
    ('D', 'paso del cable del electrodo Ø2,5'),
    ('E', 'canal de cables del ToF Ø6,5'),
]
h.tabla(112, 112, [9, 52], leyenda)

# anillo TPU (1:1)
xr, yr = 233, 63
h.add(f'<circle cx="{xr}" cy="{yr}" r="{tpu_r[1] - 0.2}" class="tpu"/>')
h.add(f'<circle cx="{xr}" cy="{yr}" r="{tpu_r[0] + 0.2}" fill="#fff" stroke="#1d2430" stroke-width="0.2"/>')
h.cota_h(xr - tpu_r[1] + 0.2, xr + tpu_r[1] - 0.2, yr - tpu_r[1] - 3, 'Ø' + f(2 * tpu_r[1] - 0.4), yr, yr)
h.cota_h(xr - tpu_r[0] - 0.2, xr + tpu_r[0] + 0.2, yr - 4, 'Ø' + f(2 * tpu_r[0] + 0.4), None, None)
h.texto(xr, yr + 6, 'Pieza 4 · anillo antideslizante', 3.2, 'middle', 700)
h.texto(xr, yr + 10.5, 'TPU 95A · espesor ' + f(tpu_e) + ' (sobresale ' + f(tpu_e - tpu_reb) + ')', 2.4, 'middle', 400, 'gris')
h.texto(xr, yr + 14, 'pegar en el rebaje con cianoacrilato', 2.4, 'middle', 400, 'gris')

# plantillas 1:1
xt, yt = 206, 128
pl = RAIZ / 'carcasa' / 'electrodo_con_tof.svg'
if pl.exists():
    dd = ' '.join(re.findall(r'\sd="([^"]+)"', pl.read_text(encoding='utf-8')))
    h.add(f'<path d="{" ".join(dd.split())}" transform="translate({xt} {yt})" class="cobre" fill-rule="evenodd"/>')
h.titulo_vista(xt, yt + 25, 'PLANTILLA del electrodo')
h.texto(xt, yt + 32.5, 'cinta de cobre · sin ToF: disco entero Ø' + f(pedestal_d - 1), 2.3, 'middle', 400, 'gris')
xt3 = 258
h.add(f'<circle cx="{xt3}" cy="{yt}" r="{ventana_ext / 2}" class="vidrio"/>')
h.titulo_vista(xt3, yt + 25, 'ventana Ø' + f(ventana_ext))
h.texto(xt3, yt + 32.5, 'acrílico 1,5 mm', 2.3, 'middle', 400, 'gris')
h.guardar('04_soporte_tpu_plantillas.svg')

# =====================================================================
# Hoja 5 · Disposición interna
# =====================================================================
h = Hoja('Disposición interna (vista superior sin domo)', 'guía de montaje: posición de cada módulo', 5, TOTAL)
xi, yi = 84, 96
h.parte('z5_base', xi, yi, 'base')
h.add(f'<circle cx="{xi}" cy="{yi}" r="{R}" class="fina"/>')
for o, c in (('bateria', 'silb'), ('placa', 'sil'), ('tp4056', 'silb'), ('condensador', 'sil'), ('adxl', 'silv'),
             ('esp32', 'sil'), ('usb', 'sil'), ('interruptor', 'sil')):
    h.parte('sil_' + o, xi, yi, c)
h.add(f'<circle cx="{xi}" cy="{yi}" r="{r_plato}" class="oculta"/>')
h.add(f'<circle cx="{xi}" cy="{yi}" r="{pedestal_d / 2}" class="oculta"/>')
h.linea([(xi - R - 5, yi), (xi + R + 5, yi)], 'eje')
h.linea([(xi, yi - R - 5), (xi, yi + R + 5)], 'eje')
h.texto(xi + R + 6, yi + 4, '0°', 2.4, 'start', 600)
refs = [
    ('A', (0, bat_c[1]), (-40, -48)),
    ('B', (-11, 12), (-42, 36)),
    ('C', (11.8, 11.5), (24, 44)),
    ('D', (-15, -3.7), (-44, 8)),
    ('E', (tp_c[0], tp_c[1] + 8), (42, 30)),
    ('F', (R - 4, 0), (56, 8)),
    ('G', (-R + 2, 0), (-57, 8)),
    ('H', (18, -6), (44, -24)),
    ('I', (0, r_plato), (-24, 47)),
]
for letra, (x1, y1), (x2, y2) in refs:
    h.globo(xi + x1, yi - y1, xi + x2, yi - y2, letra)
coords = [
    ('Ref.', 'Elemento', 'Centro x, y', 'Tamaño'),
    ('A', 'Batería LiPo 103040', f(bat_c[0]) + ', ' + f(bat_c[1]), f(bat[0]) + '×' + f(bat[1]) + '×' + f(bat[2])),
    ('B', 'ESP32-S3 Super Mini', f(V('esp_c')[0], 2) + ', ' + f(V('esp_c')[1]), '22,5×18'),
    ('C', 'ADXL345 GY-291', f(V('adxl_c')[0]) + ', ' + f(V('adxl_c')[1]), '16×21'),
    ('D', 'C1 470 µF acostado', '−15, −3,7', 'Ø6,3×8'),
    ('E', 'Cargador TP4056', f(tp_c[0]) + ', ' + f(tp_c[1]), f(tp[0]) + '×' + f(tp[1])),
    ('F', 'USB-C de panel', 'a 0°, z ' + f(usb_z), '8,9×3,3'),
    ('G', 'Interruptor SS12D00G3', 'a 180°, z ' + f(sw_z), '8,6×4,4'),
    ('H', 'Placa perforada', f(placa_c[0]) + ', ' + f(placa_c[1]), f(placa[0], 2) + '×' + f(placa[1], 2)),
    ('I', 'Contorno del soporte', 'z 14–16', 'Ø' + f(2 * r_plato)),
    ('', 'Postes', 'Ø' + f(2 * postes_r) + ' · 90/210/330°', 'Ø' + f(poste_d)),
    ('', 'Tornillos del domo', 'z ' + f(z_tornillo) + ' · 30/150/270°', 'M3'),
]
h.tabla(170, 22, [9, 40, 38, 23], coords)
h.texto(170, 22 + 5.2 * len(coords) + 5, 'Origen en el centro; x hacia el USB-C, y a 90°.', 2.4, 'start', 400, 'gris')
h.texto(170, 22 + 5.2 * len(coords) + 9, 'Las alturas de cada pieza están en la hoja 1.', 2.4, 'start', 400, 'gris')
h.texto(170, 22 + 5.2 * len(coords) + 13, 'Cables: 26–28 AWG de silicona; 22 AWG para batería.', 2.4, 'start', 400, 'gris')
h.guardar('05_disposicion.svg')
