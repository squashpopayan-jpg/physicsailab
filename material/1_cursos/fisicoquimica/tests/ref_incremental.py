"""Ejecuta solo los segmentos de referencias.py desde el capítulo indicado y fusiona el resultado en referencias.json.
   python tests/ref_incremental.py 34 35 36   (acelera el trabajo cuando solo cambian capítulos recientes)"""
import json, re, sys
src = open('tests/referencias.py', encoding='utf-8').read()
head = src[:src.index('# ============')]
segs = re.split(r'(?m)^(?=# ============ Cap\. )', src)
want = set(sys.argv[1:]); code = head
code += '\nimport numpy as np\nfrom scipy import integrate, optimize, special\nfrom scipy.integrate import solve_ivp, solve_bvp\nfrom scipy.linalg import eigh_tridiagonal\nfrom scipy import constants as _c, constants as _c2\nfrom CoolProp.CoolProp import PropsSI as P\nimport itertools\n'
for s in segs:
    m = re.match(r'# ============ Cap\. (\d+)', s)
    if m and m.group(1) in want: code += s.replace("json.dump(ref, open('tests/referencias.json', 'w'), indent=0)", '').split("print('referencias.json escrito")[0]
old = json.load(open('tests/referencias.json')); g = {'ref': {}}
exec(compile(code.replace('ref = {}', 'ref = {}', 1), 'ref_inc', 'exec'), g)
old.update(g['ref']); json.dump(old, open('tests/referencias.json', 'w'), indent=0); print('fusionado:', [k for k in g['ref']])
