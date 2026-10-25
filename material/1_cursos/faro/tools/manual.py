"""Arma el manual en un solo HTML → manual/dist/faro-manual.html

Inserta estilos, scripts, el modelo 3D, el esquema, los planos, las vistas, la lista de
materiales y el código fuente completo. Uso: python tools/manual.py
"""
import base64
import csv
import html
import io
import json
import re
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / 'manual' / 'src'
DIST = RAIZ / 'manual' / 'dist'


def leer(p):
    return Path(p).read_text(encoding='utf-8')


def img_webp(nombre):
    im = Image.open(RAIZ / 'carcasa' / 'render' / (nombre + '.png')).convert('RGB')
    # recorta el margen vacío alrededor del modelo
    gris = im.convert('L')
    caja = Image.eval(gris, lambda v: 255 if v < 238 else 0).getbbox()
    if caja:
        m = 30
        caja = (max(caja[0] - m, 0), max(caja[1] - m, 0), min(caja[2] + m, im.width), min(caja[3] + m, im.height))
        im = im.crop(caja)
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=84, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


INDICE = [
    ('que-es', '1 · Qué es'), ('sistema', '2 · Cómo funciona'), ('sensores', '3 · Sensores'),
    ('materiales', '4 · Materiales'), ('electronica', '5 · Electrónica'), ('carcasa', '6 · Carcasa y planos'),
    ('montaje', '7 · Montaje'), ('firmware', '8 · Firmware'), ('puesta', '9 · Puesta en marcha'),
    ('entrenar', '10 · Ejercicios'), ('problemas', '11 · Problemas'), ('seguridad', '12 · Seguridad'),
    ('siguiente', '13 · La aplicación'), ('archivos', 'Apéndice · Archivos'),
]


def usd(x):
    return ('%.2f' % x).replace('.', ',')


def tabla_bom():
    filas = list(csv.DictReader(io.StringIO(leer(RAIZ / 'electronica' / 'materiales.csv')), delimiter=';'))
    out = ['<div class="tabla"><table><thead><tr><th>Ref.</th><th class="n">Cant.</th><th>Componente</th>'
           '<th>Especificación</th><th class="n">US$</th></tr></thead><tbody>']
    tot = {}
    grupo = None
    for f in filas:
        g = f['grupo']
        if g != grupo:
            grupo = g
            out.append(f'<tr><th colspan="5" style="text-transform:none;letter-spacing:0">{html.escape(g)}</th></tr>')
        lo, hi = float(f['usd_min']), float(f['usd_max'])
        tot.setdefault(g, [0, 0])
        tot[g][0] += lo
        tot[g][1] += hi
        nota = f' <span class="tenue">· {html.escape(f["nota"])}</span>' if f['nota'] else ''
        out.append(f'<tr><td>{html.escape(f["ref"])}</td><td class="n">{f["cantidad"]}</td><td>{html.escape(f["componente"])}</td>'
                   f'<td>{html.escape(f["especificacion"])}{nota}</td><td class="n">{usd(lo)}–{usd(hi)}</td></tr>')
    pod = [sum(v[0] for k, v in tot.items() if k != 'Hub'), sum(v[1] for k, v in tot.items() if k != 'Hub')]
    out.append('</tbody><tfoot>')
    out.append(f'<tr><td colspan="4">Total por pod (electrónica, mecánica e impresión)</td><td class="n">{usd(pod[0])}–{usd(pod[1])}</td></tr>')
    out.append(f'<tr><td colspan="4">Juego de 6 pods + hub</td><td class="n">{usd(6 * pod[0] + tot["Hub"][0])}–{usd(6 * pod[1] + tot["Hub"][1])}</td></tr>')
    out.append('</tfoot></table></div>')
    return '\n'.join(out), pod


DESC = {
    'faro_pod.ino': 'programa principal: estados, rondas, modo solo y órdenes por USB',
    'faro_hub.ino': 'arranque y bucle principal del hub',
    'config.h': 'pines, umbrales y tiempos',
    'protocolo.h': 'mensajes de radio (idéntico en pod y hub)',
    'luces.h': 'anillo WS2812B y animaciones',
    'acelerometro.h': 'ADXL345: golpe, pico de aceleración y despertar',
    'tactil.h': 'electrodo capacitivo: línea base, toque y cercanía',
    'distancia.h': 'sensor láser VL53L0X',
    'red.h': 'ESP-NOW con acuse y reintentos',
    'energia.h': 'batería, carga y sueño profundo',
    'salida.h': 'salida por USB y Bluetooth LE (UART de Nordic)',
    'radio.h': 'ESP-NOW, pods conocidos y bandeja de salida por pod',
    'texto.h': 'colores, sensores y argumentos clave=valor',
    'ejercicios.h': 'aleatorio, todos, go/no-go y secuencia',
    'ordenes.h': 'órdenes de texto, botón BOOT y LED de estado',
    'faro.scad': 'carcasa paramétrica, componentes de referencia y modos de exportación',
}
ORDEN_POD = ['faro_pod.ino', 'config.h', 'protocolo.h', 'luces.h', 'acelerometro.h', 'tactil.h', 'distancia.h', 'red.h', 'energia.h']
ORDEN_HUB = ['faro_hub.ino', 'config.h', 'protocolo.h', 'salida.h', 'radio.h', 'texto.h', 'ejercicios.h', 'ordenes.h']


def bloque_codigo(ruta, titulo, lang='cpp'):
    txt = leer(ruta)
    n = txt.count('\n') + 1
    return (f'<details class="codigo"><summary><b>{html.escape(titulo)}</b><span>{html.escape(DESC.get(Path(ruta).name, ""))} · {n} líneas</span></summary>'
            f'<div class="barra"><button class="copiar" type="button">Copiar</button></div>'
            f'<pre data-lang="{lang}">{html.escape(txt)}</pre></details>')


def codigo(carpeta, orden, prefijo):
    partes = [f'<h4>{prefijo}</h4>']
    for f in orden:
        partes.append(bloque_codigo(RAIZ / 'firmware' / carpeta / f, f'{carpeta}/{f}'))
    return '\n'.join(partes)


def planos():
    titulos = [
        ('01_conjunto', 'Hoja 1 · Conjunto: cortes A–A y B–B, lista de piezas'),
        ('02_base', 'Hoja 2 · Base: planta, cortes y ranuras'),
        ('03_domo', 'Hoja 3 · Domo: cortes, insertos y ventana'),
        ('04_soporte_tpu_plantillas', 'Hoja 4 · Soporte, anillo TPU y plantillas 1:1'),
        ('05_disposicion', 'Hoja 5 · Disposición interna de los módulos'),
    ]
    out = []
    for n, t in titulos:
        svg = (RAIZ / 'planos' / (n + '.svg')).read_bytes()
        uri = 'data:image/svg+xml;base64,' + base64.b64encode(svg).decode()
        out.append(f'<figure><div class="lamina"><img src="{uri}" alt="{html.escape(t)}" loading="lazy"></div><figcaption><b>{html.escape(t.split(":")[0])}</b>{html.escape(t[len(t.split(":")[0]):])}</figcaption></figure>')
    return '\n'.join(out)


def piezas():
    d = json.loads(leer(RAIZ / 'carcasa' / 'piezas.json'))
    filas = [
        ('Base', 'base', 'PETG negro', 'como está (piso abajo)', '0,2 mm · 4 perímetros · 25 % relleno'),
        ('Domo (con ToF)', 'domo_con_tof', 'PETG/PLA blanco translúcido', 'boca abajo, techo en la cama', '0,2 mm · 3 paredes · techo macizo'),
        ('Soporte (con ToF)', 'soporte_con_tof', 'PETG/PLA blanco', 'plato sobre la cama', '0,2 mm · 3 paredes · 15–20 % relleno'),
        ('Anillo antideslizante', 'anillo_tpu', 'TPU 95A', 'plano', '0,2 mm · 100 % · lento (20 mm/s)'),
    ]
    out = []
    for nom, k, mat, ori, aj in filas:
        v = d[k]['volumen_cm3']
        out.append(f'<tr><td>{nom}</td><td>{mat}</td><td>{ori}</td><td>{aj}</td><td class="n">{str(v).replace(".", ",")} cm³</td></tr>')
    return '\n'.join(out)


def construir():
    if leer(RAIZ / 'firmware' / 'faro_pod' / 'protocolo.h') != leer(RAIZ / 'firmware' / 'faro_hub' / 'protocolo.h'):
        raise SystemExit('protocolo.h difiere entre faro_pod y faro_hub')
    pagina = leer(SRC / 'manual.html')
    esquema = leer(RAIZ / 'electronica' / 'esquema.svg')
    esquema = re.sub(r'<\?xml[^>]*\?>', '', esquema)
    esquema = esquema.replace('class="mono"', 'class="esq-mono"').replace('.mono{', '.esq-mono{')
    bom, pod = tabla_bom()
    indice = '\n'.join(f'<li><a href="#{i}">{html.escape(t)}</a></li>' for i, t in INDICE)
    reemplazos = {
        '{{css}}': leer(SRC / 'estilos.css'),
        '{{js}}': leer(SRC / 'app.js'),
        '{{modelo}}': leer(SRC / 'modelo.js'),
        '{{indice}}': indice,
        '{{bom}}': bom,
        '{{esquema}}': esquema,
        '{{planos}}': planos(),
        '{{piezas}}': piezas(),
        '{{codigo_pod}}': codigo('faro_pod', ORDEN_POD, 'Pod'),
        '{{codigo_hub}}': codigo('faro_hub', ORDEN_HUB, 'Hub'),
        '{{codigo_scad}}': bloque_codigo(RAIZ / 'carcasa' / 'faro.scad', 'carcasa/faro.scad', 'scad'),
    }
    for k, v in reemplazos.items():
        pagina = pagina.replace(k, v)
    pagina = re.sub(r'\{\{img:(\w+)\}\}', lambda m: img_webp(m.group(1)), pagina)
    faltan = re.findall(r'\{\{[^}]+\}\}', pagina)
    if faltan:
        raise SystemExit('Marcadores sin reemplazar: %s' % faltan)
    DIST.mkdir(parents=True, exist_ok=True)
    (DIST / 'faro-manual.html').write_text(pagina, encoding='utf-8')
    # versión local con esqueleto completo (para abrir con doble clic)
    local = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + pagina + '\n</body>\n</html>\n'
    (DIST / 'index.html').write_text(local, encoding='utf-8')
    print('manual: %.0f kB · costo por pod US$ %s–%s' % (len(pagina.encode('utf-8')) / 1024, usd(pod[0]), usd(pod[1])))


if __name__ == '__main__':
    construir()
