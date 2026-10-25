"""Carcasa del pod Faro: exporta STL, verifica choques y genera vistas.

Uso:
    python tools/carcasa.py stl        → carcasa/stl/*.stl (piezas para imprimir)
    python tools/carcasa.py choques    → interseccion de cada par de piezas/componentes
    python tools/carcasa.py vistas     → carcasa/render/*.png (ensamble, corte, explosionado)
    python tools/carcasa.py secciones  → planos/_sec/*.svg (cortes 2D para los planos)
    python tools/carcasa.py web        → manual/src/modelo.js (mallas livianas para el visor 3D)
    python tools/carcasa.py todo

Busca OpenSCAD en la variable OPENSCAD, en el PATH o en la carpeta de programas.
"""
import itertools
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SCAD = RAIZ / 'carcasa' / 'faro.scad'


def openscad():
    cands = [os.environ.get('OPENSCAD'), shutil.which('openscad'),
             r'C:\Program Files\OpenSCAD\openscad.com', r'C:\Program Files\OpenSCAD\openscad.exe']
    for c in cands:
        if c and Path(c).exists():
            return c
    sys.exit('No encuentro OpenSCAD: instala https://openscad.org o define OPENSCAD=ruta')


def correr(salida, defs, extra=()):
    args = [openscad(), '--backend', 'Manifold']
    for k, v in defs.items():
        if isinstance(v, str):
            v = '"%s"' % v
        elif isinstance(v, bool):
            v = 'true' if v else 'false'
        args += ['-D', '%s=%s' % (k, v)]
    args += list(extra) + ['-o', str(salida), str(SCAD)]
    r = subprocess.run(args, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def leer_stl(path):
    """Lee STL binario o ASCII → arreglo (n, 3, 3)."""
    data = Path(path).read_bytes()
    if len(data) >= 84:
        n = struct.unpack('<I', data[80:84])[0]
        if 84 + 50 * n == len(data):
            dt = np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')])
            return np.frombuffer(data, dtype=dt, offset=84, count=n)['v'].astype(float)
    txt = data.decode('ascii', 'ignore').split()
    vs = [[float(txt[i + 1]), float(txt[i + 2]), float(txt[i + 3])]
          for i, t in enumerate(txt) if t == 'vertex']
    return np.array(vs, float).reshape(-1, 3, 3)


def volumen(tri):
    if len(tri) == 0:
        return 0.0
    a, b, c = tri[:, 0], tri[:, 1], tri[:, 2]
    return float(np.einsum('ij,ij->i', a, np.cross(b, c)).sum() / 6.0)


PIEZAS = {
    # nombre de archivo: (parte, con_tof)
    'base': ('base', True),
    'domo_con_tof': ('domo', True),
    'domo_sin_tof': ('domo', False),
    'soporte_con_tof': ('soporte', True),
    'soporte_sin_tof': ('soporte', False),
    'anillo_tpu': ('anillo_tpu', True),
}


def cmd_stl():
    d = RAIZ / 'carcasa' / 'stl'
    d.mkdir(parents=True, exist_ok=True)
    for f in d.glob('*.stl'):
        f.unlink()
    resumen = {}
    for nombre, (parte, tof) in PIEZAS.items():
        out = d / (nombre + '.stl')
        rc, log = correr(out, {'parte': parte, 'con_tof': tof, 'calidad': 128},
                         ['--export-format', 'binstl'])
        if rc != 0 or not out.exists():
            print(log)
            sys.exit('Falló ' + nombre)
        tri = leer_stl(out)
        lo, hi = tri.reshape(-1, 3).min(0), tri.reshape(-1, 3).max(0)
        v = volumen(tri) / 1000.0
        resumen[nombre] = {'triangulos': len(tri), 'volumen_cm3': round(v, 2),
                           'caja_mm': [round(x, 2) for x in (hi - lo)]}
        print('%-18s %6d tri  %7.2f cm3  caja %s' % (nombre, len(tri), v, resumen[nombre]['caja_mm']))
    # plantillas 2D
    for parte, tof, nombre in [('electrodo_2d', True, 'electrodo_con_tof.svg'),
                               ('electrodo_2d', False, 'electrodo_sin_tof.svg'),
                               ('ventana_2d', True, 'ventana_acrilico.svg')]:
        rc, log = correr(d.parent / nombre, {'parte': parte, 'con_tof': tof, 'calidad': 128})
        if rc != 0:
            print(log)
    (RAIZ / 'carcasa' / 'piezas.json').write_text(json.dumps(resumen, indent=1), encoding='utf-8')


OBJETOS = ['base', 'domo', 'soporte', 'tpu', 'bateria', 'placa', 'esp32', 'adxl', 'condensador',
           'tp4056', 'usb', 'interruptor', 'anillo', 'tof', 'ventana', 'electrodo']


def cmd_choques():
    tmp = Path(tempfile.mkdtemp())
    malos = []
    pares = list(itertools.combinations(OBJETOS, 2))
    for a, b in pares:
        out = tmp / ('%s__%s.stl' % (a, b))
        rc, log = correr(out, {'parte': 'choque', 'choque_a': a, 'choque_b': b, 'calidad': 64},
                         ['--export-format', 'binstl'])
        vacio = ('empty' in log.lower()) or (not out.exists())
        if vacio:
            continue
        v = abs(volumen(leer_stl(out)))
        if v > 0.01:
            tri = leer_stl(out).reshape(-1, 3)
            malos.append((a, b, v, tri.min(0).round(2).tolist(), tri.max(0).round(2).tolist()))
    print('Pares revisados: %d' % len(pares))
    if not malos:
        print('Sin choques: ninguna pieza ni componente se solapa.')
    for a, b, v, lo, hi in malos:
        print('CHOQUE %-12s × %-12s  %.3f mm3  entre %s y %s' % (a, b, v, lo, hi))
    shutil.rmtree(tmp, ignore_errors=True)
    return malos


VISTAS = {
    # cámara: ojo (x, y, z) → centro (x, y, z)
    'ensamble': ({'parte': 'ensamble'}, '--camera=150,-165,120,0,0,14'),
    'corte': ({'parte': 'corte', 'angulo_corte': 0}, '--camera=55,175,85,0,0,15'),
    'corte_b': ({'parte': 'corte', 'angulo_corte': 30}, '--camera=-40,180,85,0,0,15'),
    'explosionado': ({'parte': 'explosionado'}, '--camera=175,-200,190,0,0,52'),
    'interior': ({'parte': 'interior'}, '--camera=0,-95,250,0,0,0'),
    'sin_domo': ({'parte': 'sin_domo'}, '--camera=120,-150,150,0,0,12'),
}


def cmd_vistas():
    d = RAIZ / 'carcasa' / 'render'
    d.mkdir(parents=True, exist_ok=True)
    for nombre, (defs, cam) in VISTAS.items():
        defs = dict(defs, calidad=96)
        extra = ['--preview', cam, '--imgsize=1400,1000', '--colorscheme=Tomorrow', '--projection=p',
                 '--view=']
        out = d / (nombre + '.png')
        rc, log = correr(out, defs, [e for e in extra if e != '--view='])
        print(nombre, 'ok' if out.exists() else log[-400:])


SECCIONES = ['base', 'domo', 'soporte', 'tpu', 'bateria', 'placa', 'esp32', 'adxl', 'condensador',
             'tp4056', 'usb', 'interruptor', 'anillo', 'tof', 'ventana', 'electrodo']


def cmd_secciones():
    d = RAIZ / 'planos' / '_sec'
    d.mkdir(parents=True, exist_ok=True)
    for f in d.glob('*.svg'):
        f.unlink()
    for ang in (0, 30):
        for o in SECCIONES:
            out = d / ('v%d_%s.svg' % (ang, o))
            rc, log = correr(out, {'parte': 'seccion_2d', 'angulo_corte': ang, 'objeto_sel': o, 'calidad': 128})
            if not out.exists():
                pass  # el plano no corta a este objeto
    for z in (3.5, 5, 7, 15, 30):
        for o in SECCIONES:
            out = d / ('z%s_%s.svg' % (str(z).replace('.', 'p'), o))
            correr(out, {'parte': 'planta_2d', 'z_planta': z, 'objeto_sel': o, 'calidad': 128})
    for o in ['bateria', 'placa', 'esp32', 'adxl', 'condensador', 'tp4056', 'usb', 'interruptor', 'anillo', 'soporte', 'tof']:
        correr(d / ('sil_%s.svg' % o), {'parte': 'silueta_2d', 'objeto_sel': o, 'calidad': 96})
    print('Secciones:', len(list(d.glob('*.svg'))))


def cmd_web():
    """Mallas de baja resolución para el visor 3D del manual (posiciones cuantizadas a 0,05 mm)."""
    import base64
    tmp = Path(tempfile.mkdtemp())
    piezas = {}
    for o in OBJETOS:
        out = tmp / (o + '.stl')
        correr(out, {'parte': 'objeto', 'objeto_sel': o, 'calidad': 40}, ['--export-format', 'binstl'])
        if not out.exists():
            continue
        tri = leer_stl(out).reshape(-1, 3)
        q = np.round(tri / 0.05).astype(np.int16)
        uniq, inv = np.unique(q, axis=0, return_inverse=True)
        idx = inv.astype(np.uint16 if len(uniq) < 65536 else np.uint32).ravel()
        piezas[o] = {
            'v': base64.b64encode(uniq.astype('<i2').tobytes()).decode(),
            'i': base64.b64encode(idx.tobytes()).decode(),
            'i32': bool(idx.dtype == np.uint32),
        }
        print('%-12s %6d vértices %6d triángulos' % (o, len(uniq), len(idx) // 3))
    js = 'window.FARO_MODELO = ' + json.dumps(piezas) + ';\n'
    dest = RAIZ / 'manual' / 'src' / 'modelo.js'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(js, encoding='utf-8')
    print('modelo.js: %.0f kB' % (len(js) / 1024))
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'todo'
    if cmd in ('stl', 'todo'):
        cmd_stl()
    if cmd in ('choques', 'todo'):
        cmd_choques()
    if cmd in ('vistas', 'todo'):
        cmd_vistas()
    if cmd in ('secciones', 'todo'):
        cmd_secciones()
    if cmd in ('web', 'todo'):
        cmd_web()
