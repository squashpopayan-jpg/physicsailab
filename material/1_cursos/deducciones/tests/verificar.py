# -*- coding: utf-8 -*-
"""Ejecuta todas las comprobaciones: python tests/verificar.py [capNN ...] [--sin-cache]
Cada tests/caps/capNN.py recibe el espacio de nombres de dlib (L) y registra sus comprobaciones.
Los capítulos cuyo código de prueba, HTML, JS y núcleo no han cambiado se leen de tests/cache (SymPy es lento)."""
import os, sys, glob, subprocess, time, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import dlib as L

args = [a for a in sys.argv[1:] if not a.startswith('--')]
nocache = '--sin-cache' in sys.argv
t0 = time.time()
subprocess.run(['node', os.path.join(HERE, 'jsdump.js')], check=True)
L._JS = None
ns = {k: getattr(L, k) for k in dir(L) if not k.startswith('__')}
os.makedirs(os.path.join(HERE, 'cache'), exist_ok=True)


def digest(files):
    h = hashlib.sha1()
    for f in files:
        if os.path.exists(f):
            h.update(open(f, 'rb').read())
    return h.hexdigest()


core = [os.path.join(ROOT, 'src', 'core', '32-formula.js'), os.path.join(HERE, 'dlib.py'), os.path.join(HERE, 'jsdump.js')]
hits = 0
for f in sorted(glob.glob(os.path.join(HERE, 'caps', 'cap*.py'))):
    name = os.path.basename(f)[:-3]
    if args and name not in args:
        continue
    nn = name[3:]
    ch = sorted(glob.glob(os.path.join(ROOT, 'src', 'chapters', nn + '-*')))
    key = digest([f] + ch + core)
    cf = os.path.join(HERE, 'cache', name + '.json')
    if not nocache and os.path.exists(cf):
        c = json.load(open(cf, encoding='utf-8'))
        if c['key'] == key:
            L.rows.extend(c['rows'])
            for d, g in c['seen'].items():
                L._seen.setdefault(d, set()).update(g)
            L.FSIM_DONE.update(c['fsim'])
            hits += 1
            continue
    n0 = len(L.rows); s0 = {d: set(g) for d, g in L._seen.items()}; f0 = set(L.FSIM_DONE)
    code = compile(open(f, encoding='utf-8').read(), f, 'exec')
    exec(code, dict(ns, __file__=f))
    seen = {d: sorted(g - s0.get(d, set())) for d, g in L._seen.items() if g - s0.get(d, set())}
    json.dump(dict(key=key, rows=L.rows[n0:], seen=seen, fsim=sorted(L.FSIM_DONE - f0)), open(cf, 'w', encoding='utf-8'), ensure_ascii=False)
if not args:
    L.coverage()
ok, bad = L.save()
print(f'{ok} de {ok+bad} pruebas superadas ({bad} fallos) en {time.time()-t0:.0f} s ({hits} capítulos desde la caché)')
sys.exit(1 if bad else 0)
