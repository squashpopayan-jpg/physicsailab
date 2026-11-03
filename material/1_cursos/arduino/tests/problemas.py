# -*- coding: utf-8 -*-
"""Comprobación independiente de las cifras de los problemas resueltos y de los ejemplos (SymPy, SciPy, mpmath).
Cada fila compara el valor calculado aquí ('got') con la cifra escrita en el texto del curso ('exp').
Un archivo por capítulo en tests/caps/capNN.py. Ejecutar: python tests/problemas.py  →  tests/problemas.json"""
import json, math, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
import numpy as np
import scipy.constants as C
from scipy import integrate, optimize, special, linalg
import mpmath as mp
import sympy as sp
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
rows = []
G = 'Problemas y ejemplos resueltos'

def chk(cap, name, got, exp, tol=2e-3, rel=True):
    """exp puede ser str (la cifra tal como está impresa: se exige que sea el redondeo correcto)
    o float (con tolerancia relativa tol)."""
    got = float(got)
    if isinstance(exp, str):
        dec = len(exp.split('.')[1]) if '.' in exp else 0
        t = 0.5*10**(-dec)*1.0000001
        ok = bool(abs(got-float(exp)) <= t)
        tolS = 'cifra impresa (±' + format(0.5*10**(-dec), 'g') + ')'
        expf = float(exp)
    else:
        expf = float(exp)
        err = abs(got-expf)/max(1e-300, abs(expf)) if rel else abs(got-expf)
        ok = bool(err <= tol); tolS = ('rel ' if rel else 'abs ')+str(tol)
    rows.append(dict(group=G, name=f'Cap. {cap} · {name}', got=got, exp=expf, tol=tolS, pass_=ok))
    if not ok: print('FALLA', cap, name, got, exp)

h, c, kB, e, me, hbar = C.h, C.c, C.k, C.e, C.m_e, C.hbar
hc = h*c/e*1e9   # eV·nm
mc2 = me*c*c/e   # eV

if __name__ == '__main__':
    only = sys.argv[1:]
    for _f in sorted(glob.glob(os.path.join(HERE, 'caps', 'cap*.py'))):
        if only and not any(o in os.path.basename(_f) for o in only): continue
        _spec = importlib.util.spec_from_file_location(os.path.basename(_f)[:-3], _f); _m = importlib.util.module_from_spec(_spec)
        _m.__dict__.update(dict(chk=chk, math=math, np=np, sp=sp, mp=mp, C=C, linalg=linalg, integrate=integrate, optimize=optimize, special=special, h=h, c=c, kB=kB, e=e, me=me, hbar=hbar, hc=hc, mc2=mc2, os=os))
        _spec.loader.exec_module(_m)
    out = [dict(group=r['group'], name=r['name'], got=r['got'], exp=r['exp'], tol=r['tol'], **{'pass': r['pass_']}) for r in rows]
    bad = [r for r in out if not r['pass']]
    if not only: json.dump(dict(rows=out), open(os.path.join(HERE, 'problemas.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(f'{len(out)-len(bad)} de {len(out)} cifras de problemas verificadas', '' if not bad else f'· {len(bad)} FALLAN')
