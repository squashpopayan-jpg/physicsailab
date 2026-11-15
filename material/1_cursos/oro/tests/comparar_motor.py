"""Compara las operaciones del motor JavaScript (tests/out/js_trades.json) con el motor de
referencia en Python (py/motor.py) para los casos de tests/casos.json. Código 1 si difieren."""
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'py'))
import motor

casos = json.load(open(os.path.join(AQUI, 'casos.json')))
js = json.load(open(os.path.join(AQUI, 'out', 'js_trades.json')))
cache = {}
def serie(k):
    if k not in cache:
        cache[k] = motor.cargar(k)
    return cache[k]

filas = []
fallos = 0
for c in casos:
    S = serie(c['serie']); ctx = serie(c['ctx']) if c['ctx'] else None
    P = motor.params(**c['p'])
    py = motor.correr(S, P, ctx)
    a = js[c['id']]
    ok = len(py) == len(a)
    maxdif = 0.0
    nd = 0
    if ok:
        for x, y in zip(py, a):
            if (x['i'], x['j'], x['k'], x['d'], x['motivo']) != (y['i'], y['j'], y['k'], y['d'], y['motivo']):
                ok = False; nd += 1; continue
            for f in ('ent', 'px', 'lots', 'usd', 'R', 'mfe', 'mae'):
                maxdif = max(maxdif, abs(x[f] - y[f]))
        ok = ok and nd == 0 and maxdif < 1e-6
    if not ok:
        fallos += 1
    filas.append((c['id'], len(py), len(a), maxdif, 'OK' if ok else 'FALLA'))
    print('%-16s py=%4d js=%4d  máx|Δ|=%.2e  %s' % filas[-1])
    if not ok and len(py) and len(a):
        for x, y in list(zip(py, a))[:400]:
            if (x['i'], x['k'], x['motivo'], x['d']) != (y['i'], y['k'], y['motivo'], y['d']):
                print('  primera diferencia: py', {k: x[k] for k in ('i', 'k', 'd', 'motivo', 'usd')}, ' js', {k: y[k] for k in ('i', 'k', 'd', 'motivo', 'usd')})
                break
print('\n%d/%d casos idénticos' % (len(casos) - fallos, len(casos)))
sys.exit(1 if fallos else 0)
