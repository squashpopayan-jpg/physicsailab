"""Esquemático eléctrico del pod Faro → electronica/esquema.svg

Dibujo con etiquetas de red: dos terminales con la misma etiqueta están unidos.
Uso: python tools/esquema.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
W, H = 1680, 1060
out = []
TINTA = 'var(--tinta, #1d2430)'
RED = 'var(--red, #1f6feb)'
SUAVE = 'var(--suave, #6b7480)'
POT = 'var(--pot, #c2410c)'


def e(s):
    out.append(s)


def txt(x, y, s, size=13, anchor='start', w='400', color=TINTA, cls=''):
    s = s.replace('&', '&amp;').replace('<', '&lt;')
    e(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{w}" fill="{color}" class="{cls}">{s}</text>')


def linea(pts, color=TINTA, w=1.8):
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in pts)
    e(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>')


def punto(x, y):
    e(f'<circle cx="{x}" cy="{y}" r="4" fill="{TINTA}"/>')


def etiqueta(x, y, nombre, lado='der', color=RED):
    """Etiqueta de red unida al punto (x, y). lado = hacia dónde apunta la bandera."""
    ancho = 9 + 7.6 * len(nombre)
    if lado == 'der':
        pts = [(x, y), (x + 8, y - 10), (x + 8 + ancho, y - 10), (x + 8 + ancho, y + 10), (x + 8, y + 10)]
        tx, an = x + 12, 'start'
    else:
        pts = [(x, y), (x - 8, y - 10), (x - 8 - ancho, y - 10), (x - 8 - ancho, y + 10), (x - 8, y + 10)]
        tx, an = x - 12, 'end'
    d = 'M' + ' L'.join(f'{a:.1f},{b:.1f}' for a, b in pts) + ' Z'
    e(f'<path d="{d}" fill="var(--etq, #eef4ff)" stroke="{color}" stroke-width="1.4"/>')
    txt(tx, y + 4.5, nombre, 12, an, '600', color, 'mono')


def tierra(x, y):
    linea([(x, y), (x, y + 12)])
    for i, a in enumerate((14, 9, 4)):
        linea([(x - a, y + 12 + i * 5), (x + a, y + 12 + i * 5)], w=1.8)


def resistencia(x, y, vertical, ref, valor, largo=60):
    """Resistencia (rectángulo IEC) entre (x, y) y (x, y+largo) o (x+largo, y)."""
    c = largo / 2
    if vertical:
        linea([(x, y), (x, y + c - 16)])
        linea([(x, y + c + 16), (x, y + largo)])
        e(f'<rect x="{x - 7}" y="{y + c - 16}" width="14" height="32" fill="var(--fondo, #fff)" stroke="{TINTA}" stroke-width="1.8"/>')
        txt(x + 13, y + c - 2, ref, 12, 'start', '600')
        txt(x + 13, y + c + 13, valor, 12, 'start', '400', SUAVE)
    else:
        linea([(x, y), (x + c - 16, y)])
        linea([(x + c + 16, y), (x + largo, y)])
        e(f'<rect x="{x + c - 16}" y="{y - 7}" width="32" height="14" fill="var(--fondo, #fff)" stroke="{TINTA}" stroke-width="1.8"/>')
        txt(x + c, y - 13, ref, 12, 'middle', '600')
        txt(x + c, y + 24, valor, 12, 'middle', '400', SUAVE)


def condensador(x, y, ref, valor, polar=False, largo=60):
    """Condensador vertical entre (x, y) y (x, y+largo)."""
    c = largo / 2
    linea([(x, y), (x, y + c - 4)])
    linea([(x, y + c + 4), (x, y + largo)])
    linea([(x - 14, y + c - 4), (x + 14, y + c - 4)], w=2.4)
    if polar:
        e(f'<path d="M{x - 14},{y + c + 8} Q{x},{y + c + 1} {x + 14},{y + c + 8}" fill="none" stroke="{TINTA}" stroke-width="2.4"/>')
        txt(x - 20, y + c - 8, '+', 13, 'middle', '700')
    else:
        linea([(x - 14, y + c + 4), (x + 14, y + c + 4)], w=2.4)
    txt(x + 20, y + c - 2, ref, 12, 'start', '600')
    txt(x + 20, y + c + 13, valor, 12, 'start', '400', SUAVE)


def caja(x, y, w, h, ref, nombre, izq=(), der=(), paso=30, top=36, sub=None):
    """Módulo con pines a izquierda y derecha. Devuelve dict nombre → (x, y) del extremo del pin."""
    e(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="var(--caja, #f6f7f9)" stroke="{TINTA}" stroke-width="2"/>')
    txt(x + w / 2, y - 22, ref, 13, 'middle', '700')
    txt(x + w / 2, y - 7, nombre, 12, 'middle', '400', SUAVE)
    if sub:
        txt(x + w / 2, y + h - 10, sub, 11, 'middle', '400', SUAVE)
    pines = {}
    for i, p in enumerate(izq):
        py = y + top + i * paso
        if p:
            linea([(x - 22, py), (x, py)])
            txt(x + 7, py + 4, p, 12, 'start', '500', TINTA, 'mono')
            pines[p] = (x - 22, py)
    for i, p in enumerate(der):
        py = y + top + i * paso
        if p:
            linea([(x + w, py), (x + w + 22, py)])
            txt(x + w - 7, py + 4, p, 12, 'end', '500', TINTA, 'mono')
            pines[p] = (x + w + 22, py)
    return pines


def recuadro(x, y, w, h, titulo):
    e(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="none" stroke="{SUAVE}" stroke-width="1.2" stroke-dasharray="6 5"/>')
    e(f'<rect x="{x + 14}" y="{y - 11}" width="{8 + 7.4 * len(titulo)}" height="22" fill="var(--fondo, #fff)"/>')
    txt(x + 18, y + 5, titulo, 13, 'start', '700', SUAVE)


# =====================================================================
e(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="Inter, Segoe UI, Arial, sans-serif">')
e('<style>.mono{font-family:"JetBrains Mono",Consolas,monospace}</style>')
e(f'<rect width="{W}" height="{H}" fill="var(--fondo, #fff)"/>')

# ---------------- 1. Carga y alimentación ----------------
recuadro(30, 40, 760, 330, '1 · Carga y alimentación')
j1 = caja(70, 120, 110, 100, 'J1', 'USB-C de panel', der=('VBUS', 'GND'), top=35, sub='con R 5,1 k en CC')
u1 = caja(350, 110, 150, 190, 'U1', 'cargador TP4056 + DW01', izq=('IN+', 'IN−'), der=('B+', 'B−', 'OUT+', 'OUT−'),
          top=40, paso=40, sub='1 A (R_PROG 1,2 k)')
# VBUS → IN+
linea([j1['VBUS'], (260, j1['VBUS'][1]), (260, u1['IN+'][1]), u1['IN+']])
punto(260, u1['IN+'][1])
linea([(260, u1['IN+'][1]), (260, 95)])
etiqueta(260, 95, 'VUSB', 'izq')
linea([j1['GND'], (230, j1['GND'][1]), (230, u1['IN−'][1]), u1['IN−']])
tierra(230, u1['IN−'][1] + 40)
linea([(230, u1['IN−'][1]), (230, u1['IN−'][1] + 40)])
# batería
bx = 600
yb, yn = u1['B+'][1], u1['B−'][1]
linea([u1['B+'], (bx, yb), (bx, yb + 7)])
for i, (a, yy) in enumerate([(18, yb + 7), (9, yb + 15), (18, yb + 23), (9, yb + 31)]):
    linea([(bx - a, yy), (bx + a, yy)], w=2.6 if a == 18 else 2)
linea([(bx, yb + 31), (bx, yn), u1['B−']])
txt(bx - 24, yb + 12, '+', 13, 'middle', '700')
txt(bx + 26, yb + 14, 'BT1', 13, 'start', '700')
txt(bx + 26, yb + 30, 'LiPo 3,7 V 1000–1200 mAh', 12, 'start', '400', SUAVE)
txt(bx + 26, yb + 45, '(con su protección)', 11, 'start', '400', SUAVE)
# OUT+ → SW1 → VBAT_SW
sy = u1['OUT+'][1]
linea([u1['OUT+'], (560, sy)])
e(f'<circle cx="566" cy="{sy}" r="4" fill="none" stroke="{TINTA}" stroke-width="1.8"/>')
linea([(569, sy - 2), (602, sy - 16)], w=2.2)
e(f'<circle cx="606" cy="{sy}" r="4" fill="none" stroke="{TINTA}" stroke-width="1.8"/>')
linea([(610, sy), (680, sy)])
txt(586, sy + 24, 'SW1', 12, 'middle', '700')
txt(586, sy + 38, 'SS12D00G3', 11, 'middle', '400', SUAVE)
etiqueta(680, sy, 'VBAT_SW', 'der', POT)
linea([u1['OUT−'], (540, u1['OUT−'][1])])
tierra(540, u1['OUT−'][1])
txt(48, 345, 'Con SW1 abierto la batería sigue cargando; para programar la ESP32 por USB pon SW1 en OFF.', 12, 'start', '400', SUAVE)

# ---------------- 2. Medición de batería y cargador ----------------
recuadro(30, 410, 440, 300, '2 · Medición (ADC)')
x = 150
etiqueta(x, 455, 'VBAT_SW', 'der', POT)
resistencia(x, 455, True, 'R3', '100 k', 70)
linea([(x, 525), (x, 545)])
punto(x, 545)
linea([(x, 545), (x + 60, 545)])
etiqueta(x + 60, 545, 'VBAT_ADC', 'der')
resistencia(x, 545, True, 'R4', '100 k', 70)
tierra(x, 615)
linea([(x, 545), (x - 45, 545), (x - 45, 570)])
condensador(x - 45, 570, '', '', largo=45)
txt(x - 75, 600, 'C3', 12, 'end', '600')
txt(x - 75, 614, '100 n', 12, 'end', '400', SUAVE)
tierra(x - 45, 615)
x = 345
etiqueta(x, 455, 'VUSB', 'der')
resistencia(x, 455, True, 'R5', '100 k', 70)
linea([(x, 525), (x, 545)])
punto(x, 545)
linea([(x, 545), (x + 30, 545)])
etiqueta(x + 30, 545, 'VUSB_ADC', 'der')
resistencia(x, 545, True, 'R6', '150 k', 70)
tierra(x, 615)
linea([(x, 545), (x - 45, 545), (x - 45, 570)])
condensador(x - 45, 570, '', '', largo=45)
txt(x - 75, 600, 'C4', 12, 'end', '600')
txt(x - 75, 614, '100 n', 12, 'end', '400', SUAVE)
tierra(x - 45, 615)
txt(48, 690, 'VBAT/2 → GPIO 2 · 5 V × 0,6 = 3,0 V → GPIO 3 (despierta al conectar)', 12, 'start', '400', SUAVE)

# ---------------- 3. Microcontrolador ----------------
recuadro(490, 410, 550, 450, '3 · Microcontrolador')
gp = ['GPIO1 · T1', 'GPIO2 · ADC', 'GPIO3 · ADC', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9']
u2 = caja(640, 470, 210, 340, 'U2', 'ESP32-S3 Super Mini', izq=('5V', 'GND', '3V3'), der=gp, top=40, paso=33,
          sub='o XIAO ESP32-S3')
etiqueta(u2['5V'][0], u2['5V'][1], 'VBAT_SW', 'izq', POT)
linea([u2['GND'], (u2['GND'][0] - 20, u2['GND'][1])])
tierra(u2['GND'][0] - 20, u2['GND'][1])
etiqueta(u2['3V3'][0], u2['3V3'][1], '3V3', 'izq', POT)
redes = ['TOUCH', 'VBAT_ADC', 'VUSB_ADC', 'LED_DIN', 'SDA', 'SCL', 'ACC_INT', 'LED_ON', 'TOF_XSHUT']
for g, r in zip(gp, redes):
    etiqueta(u2[g][0], u2[g][1], r, 'der')
txt(510, 835, 'Retira el LED rojo de encendido de la placa si quieres meses de reposo.', 11, 'start', '400', SUAVE)

# ---------------- 4. Anillo de LED con interruptor alto ----------------
recuadro(830, 40, 820, 330, '4 · Anillo de LED (se apaga del todo al dormir)')
# Q1 P-MOSFET
qx, qy = 1010, 150          # puerta de Q1
etiqueta(900, 80, 'VBAT_SW', 'izq', POT)
linea([(900, 80), (qx + 20, 80), (qx + 20, qy - 25)])
punto(960, 80)
linea([(qx + 20, qy - 25), (qx + 8, qy - 25), (qx + 8, qy + 25), (qx + 20, qy + 25)])
linea([(qx + 2, qy - 22), (qx + 2, qy + 22)], w=2.4)
linea([(qx + 20, qy + 25), (qx + 20, qy + 55)])
e(f'<path d="M{qx + 8},{qy} L{qx + 18},{qy - 5} L{qx + 18},{qy + 5} Z" fill="{TINTA}"/>')
linea([(qx + 8, qy), (qx + 20, qy), (qx + 20, qy - 25)])
txt(qx + 32, qy - 4, 'Q1', 13, 'start', '700')
txt(qx + 32, qy + 12, 'AO3401A (canal P)', 12, 'start', '400', SUAVE)
txt(qx + 26, qy - 30, 'S', 11, 'start', '600', SUAVE)
txt(qx + 26, qy + 42, 'D', 11, 'start', '600', SUAVE)
linea([(qx - 2, qy), (960, qy)])
txt(qx - 8, qy - 6, 'G', 11, 'end', '600', SUAVE)
punto(960, qy)
resistencia(960, 80, True, '', '', 70)
txt(946, 112, 'R11', 12, 'end', '600')
txt(946, 127, '100 k', 12, 'end', '400', SUAVE)
# Q2 NPN
nx, ny = 960, 240
linea([(960, qy), (960, ny - 22)])
e(f'<circle cx="{nx}" cy="{ny}" r="24" fill="none" stroke="{TINTA}" stroke-width="1.6"/>')
linea([(nx - 10, ny - 14), (nx - 10, ny + 14)], w=2.6)
linea([(nx - 10, ny - 6), (nx, ny - 22)])
linea([(nx - 10, ny + 6), (nx, ny + 22)])
e(f'<path d="M{nx - 1},{ny + 21} L{nx - 9},{ny + 18} L{nx - 4},{ny + 12} Z" fill="{TINTA}"/>')
linea([(nx, ny + 22), (nx, ny + 45)])
tierra(nx, ny + 45)
txt(nx + 30, ny - 4, 'Q2', 13, 'start', '700')
txt(nx + 30, ny + 12, '2N3904 (NPN)', 12, 'start', '400', SUAVE)
linea([(nx - 10, ny), (nx - 40, ny)])
punto(nx - 40, ny)
resistencia(nx - 110, ny, False, 'R9', '10 k', 70)
etiqueta(nx - 110, ny, 'LED_ON', 'izq')
linea([(nx - 40, ny), (nx - 40, ny + 20)])
resistencia(nx - 40, ny + 20, True, '', '', 55)
txt(nx - 54, ny + 44, 'R10', 11, 'end', '600')
txt(nx - 54, ny + 57, '100 k', 11, 'end', '400', SUAVE)
tierra(nx - 40, ny + 75)
# VLED → anillo
vy = qy + 55
linea([(qx + 20, vy), (1398, vy)])
punto(1115, vy)
punto(1235, vy)
txt(1175, vy - 8, 'VLED', 12, 'middle', '700', POT, 'mono')
condensador(1115, vy, 'C1', '470 µF 6,3 V', polar=True, largo=70)
tierra(1115, vy + 70)
condensador(1235, vy, 'C2', '100 n', largo=70)
tierra(1235, vy + 70)
d1 = caja(1420, vy - 40, 170, 150, 'D1', 'anillo 16 × WS2812B', izq=('5V', 'DIN', 'GND'), der=('DOUT',), top=40, paso=40,
          sub='Ø 68 mm')
resistencia(1310, d1['DIN'][1], False, 'R1', '330 Ω', 88)
linea([(1310, d1['DIN'][1]), (1310, d1['DIN'][1] + 55)])
etiqueta(1310, d1['DIN'][1] + 55, 'LED_DIN', 'izq')
linea([d1['GND'], (1375, d1['GND'][1]), (1375, d1['GND'][1] + 8)])
tierra(1375, d1['GND'][1] + 8)
txt(1598, d1['DOUT'][1] + 20, 'sin conectar', 11, 'start', '400', SUAVE)
txt(850, 358, 'LED_ON alto → Q2 conduce → la puerta de Q1 baja → el anillo recibe VBAT. Dormido: LED_ON bajo y Q1 abierto (0 mA).',
    12, 'start', '400', SUAVE)

# ---------------- 5. Sensores ----------------
recuadro(1070, 410, 580, 620, '5 · Sensores')
u3 = caja(1180, 480, 160, 250, 'U3', 'ADXL345 (GY-291)', izq=('VCC', 'GND', 'CS', 'SDO', 'SDA', 'SCL', 'INT1'), top=35,
          paso=32, sub='dirección 0x53')
etiqueta(u3['VCC'][0], u3['VCC'][1], '3V3', 'izq', POT)
linea([u3['GND'], (u3['GND'][0] - 16, u3['GND'][1])])
tierra(u3['GND'][0] - 16, u3['GND'][1])
etiqueta(u3['CS'][0], u3['CS'][1], '3V3', 'izq', POT)
linea([u3['SDO'], (u3['SDO'][0] - 44, u3['SDO'][1])])
tierra(u3['SDO'][0] - 44, u3['SDO'][1])
etiqueta(u3['SDA'][0], u3['SDA'][1], 'SDA', 'izq')
etiqueta(u3['SCL'][0], u3['SCL'][1], 'SCL', 'izq')
etiqueta(u3['INT1'][0], u3['INT1'][1], 'ACC_INT', 'izq')

u4 = caja(1460, 480, 160, 220, 'U4', 'VL53L0X (GY-530)', izq=('VIN', 'GND', 'SDA', 'SCL', 'XSHUT', 'GPIO1'), top=35,
          paso=32, sub='opcional · 0x29')
etiqueta(u4['VIN'][0], u4['VIN'][1], '3V3', 'izq', POT)
linea([u4['GND'], (u4['GND'][0] - 16, u4['GND'][1])])
tierra(u4['GND'][0] - 16, u4['GND'][1])
etiqueta(u4['SDA'][0], u4['SDA'][1], 'SDA', 'izq')
etiqueta(u4['SCL'][0], u4['SCL'][1], 'SCL', 'izq')
etiqueta(u4['XSHUT'][0], u4['XSHUT'][1], 'TOF_XSHUT', 'izq')
txt(u4['GPIO1'][0] - 4, u4['GPIO1'][1] + 4, '—', 12, 'end', '400', SUAVE)

# pull-ups I2C
for i, red in enumerate(('SDA', 'SCL')):
    x = 1140 + i * 90
    etiqueta(x, 800, '3V3', 'der', POT)
    resistencia(x, 800, True, f'R{7 + i}', '4,7 k', 70)
    etiqueta(x, 870, red, 'der')
# electrodo
etiqueta(1430, 800, 'TOUCH', 'der')
resistencia(1430, 800, True, 'R2', '470 Ω', 70)
linea([(1430, 870), (1430, 900)])
e(f'<rect x="1395" y="900" width="70" height="10" rx="2" fill="#c87533" stroke="{TINTA}" stroke-width="1.4"/>')
txt(1430, 930, 'E1 · electrodo de cobre Ø 39 mm', 12, 'middle', '600')
txt(1430, 945, 'bajo el domo', 11, 'middle', '400', SUAVE)
txt(1090, 990, 'Los módulos GY suelen traer sus propias resistencias de 4,7–10 k: R7/R8 son opcionales.', 11, 'start', '400', SUAVE)

# ---------------- Rótulo ----------------
rx, ry = 30, 900
e(f'<rect x="{rx}" y="{ry}" width="1000" height="130" rx="8" fill="none" stroke="{TINTA}" stroke-width="1.6"/>')
txt(rx + 20, ry + 36, 'FARO · pod de reacción — esquema eléctrico', 20, 'start', '700')
txt(rx + 20, ry + 62, 'Las etiquetas iguales (VBAT_SW, 3V3, SDA, …) están unidas. Tierra común en todo el circuito.', 13, 'start', '400', SUAVE)
txt(rx + 20, ry + 86, 'Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca', 13, 'start', '600')
txt(rx + 20, ry + 110, 'Revisión 1.0 · firmware faro_pod 1.0.0 · hoja 1 de 1', 12, 'start', '400', SUAVE)
e('</svg>')

dest = RAIZ / 'electronica' / 'esquema.svg'
dest.write_text('\n'.join(out), encoding='utf-8')
print('escrito', dest, len('\n'.join(out)) // 1024, 'kB')
