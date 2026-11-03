# -*- coding: utf-8 -*-
"""Genera tests/referencias.json con cálculos independientes (SciPy, SymPy, mpmath, NumPy).
Cada capítulo aporta tests/refs/refNN.py, que llena el diccionario `ref`.
Ejecutar: python tests/referencias.py   (luego: node tests/validar.js)"""
import json, math, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
import numpy as np
import scipy.constants as C
from scipy import integrate, special, optimize, linalg
import mpmath as mp
import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))
ref = {}
h, c, kB, e, me = C.h, C.c, C.k, C.e, C.m_e
G = dict(json=json, math=math, np=np, C=C, integrate=integrate, special=special, optimize=optimize, linalg=linalg, mp=mp, sp=sp, ref=ref, h=h, c=c, kB=kB, e=e, me=me, os=os)
for f in sorted(glob.glob(os.path.join(HERE, 'refs', 'ref*.py'))):
    src = open(f, encoding='utf-8').read()
    exec(compile(src, f, 'exec'), G)
json.dump(ref, open(os.path.join(HERE, 'referencias.json'), 'w'), indent=1)
print('referencias.json escrito:', len(ref), 'bloques')
