# -*- coding: utf-8 -*-
"""Biblioteca de verificación de las deducciones.
Cada deducción del HTML (<deriv id=...>) debe tener, en tests/caps/capNN.py:
  · comprobaciones de PASOS (cadenas de igualdades simbólicas, EDO, integrales, sistemas resueltos),
  · una comprobación DIMENSIONAL del resultado final (con las unidades de la tabla <vars>),
  · y, si tiene explorador (EM.formula), la comparación del JS con la expresión simbólica (fsim).
Resultado: tests/resultados.json (lo lee build.js para el apéndice y las insignias)."""
import json, os, re, sys, math, random
from fractions import Fraction
sys.stdout.reconfigure(encoding='utf-8')
import sympy as sp
import mpmath as mp
import numpy as np
from scipy import integrate as sint, special as ssp, constants as SC

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
rows = []
G_STEP, G_DIM, G_NUM, G_SIM, G_COV = ('Pasos de las deducciones (SymPy)', 'Análisis dimensional de los resultados',
                                      'Cifras de los ejemplos', 'Explorador de fórmulas contra SymPy', 'Cobertura')
_seen = {}


def rec(group, deriv, name, got, exp, tol, ok):
    rows.append(dict(group=group, deriv=deriv, name=f'{deriv} · {name}' if deriv else name,
                     got=got, exp=exp, tol=tol, **{'pass': bool(ok)}))
    _seen.setdefault(deriv, set()).add(group)
    if not ok:
        print('FALLA', deriv, name, got, exp)
    return bool(ok)


def S(names, **kw):
    kw.setdefault('positive', True)
    r = sp.symbols(names, **kw)
    return r


def _free_sample(expr_list, rng):
    syms = set()
    for e in expr_list:
        syms |= sp.sympify(e).free_symbols
    return {s: rng.uniform(0.6, 2.4) for s in syms}


def same(a, b, tol=1e-9):
    """a ≡ b: primero simplificación simbólica; si no basta, muestreo numérico en 6 puntos aleatorios."""
    a, b = sp.sympify(a), sp.sympify(b)
    try:
        d = sp.simplify(a - b)
        if d == 0:
            return True, 'simbólico'
    except Exception:
        pass
    rng = random.Random(7)
    for _ in range(6):
        sub = _free_sample([a, b], rng)
        try:
            va, vb = complex(sp.N(a.subs(sub), 25)), complex(sp.N(b.subs(sub), 25))
        except Exception:
            return False, 'no evaluable'
        if abs(va - vb) > tol * max(1.0, abs(va), abs(vb)):
            return False, f'difieren: {va} vs {vb}'
    return True, 'numérico'


def chain(deriv, name, exprs):
    """exprs: [e0, e1, …]; cada paso k→k+1 es una reescritura equivalente."""
    ok_all = True
    for i in range(len(exprs) - 1):
        ok, how = same(exprs[i], exprs[i + 1])
        rec(G_STEP, deriv, f'{name}: paso {i+1}→{i+2} ({how})', 1.0 if ok else 0.0, 1.0, 'identidad', ok)
        ok_all &= ok
    return ok_all


def ident(deriv, name, a, b):
    ok, how = same(a, b)
    return rec(G_STEP, deriv, f'{name} ({how})', 1.0 if ok else 0.0, 1.0, 'identidad', ok)


def ode(deriv, name, eq, sol_eq):
    """Comprueba que sol_eq (Eq(f(t), …)) resuelve la EDO eq."""
    try:
        r = sp.checkodesol(eq, sol_eq)
        ok = bool(r[0])
    except Exception as ex:
        ok = False
    return rec(G_STEP, deriv, f'{name} (checkodesol)', 1.0 if ok else 0.0, 1.0, 'solución exacta', ok)


def dsolve_is(deriv, name, eq, f, ics, expected):
    """Resuelve la EDO con dsolve y compara con el resultado impreso."""
    try:
        sol = sp.dsolve(eq, f, ics=ics)
        ok, how = same(sol.rhs, expected)
    except Exception as ex:
        ok, how = False, str(ex)[:40]
    return rec(G_STEP, deriv, f'{name} (dsolve, {how})', 1.0 if ok else 0.0, 1.0, 'solución exacta', ok)


def integral(deriv, name, integrand, var, a, b, result):
    """∫_a^b integrand dvar = result (simbólico, o numérico con mpmath si la forma cerrada no sale)."""
    try:
        val = sp.integrate(integrand, (var, a, b))
        ok, how = same(val, result)
        if not ok or val.has(sp.Integral):
            raise ValueError('numérico')
    except Exception:
        rng = random.Random(3)
        ok = True
        for _ in range(4):
            sub = {s: rng.uniform(0.6, 2.0) for s in (sp.sympify(integrand).free_symbols | sp.sympify(result).free_symbols | sp.sympify(b).free_symbols) if s != var}
            f = sp.lambdify(var, sp.sympify(integrand).subs(sub), 'mpmath')
            lo, hi = sp.N(sp.sympify(a).subs(sub)), sp.N(sp.sympify(b).subs(sub))
            num = mp.quad(f, [float(lo), float(hi)])
            ok &= abs(complex(num) - complex(sp.N(sp.sympify(result).subs(sub), 20))) < 1e-8 * max(1, abs(num))
        how = 'cuadratura mpmath'
    return rec(G_STEP, deriv, f'{name} (integral, {how})', 1.0 if ok else 0.0, 1.0, 'identidad', ok)


def deriv_is(deriv, name, expr, var, result):
    ok, how = same(sp.diff(expr, var), result)
    return rec(G_STEP, deriv, f'{name} (derivada, {how})', 1.0 if ok else 0.0, 1.0, 'identidad', ok)


def solves(deriv, name, eqs, unknown, target, vars=None):
    """Resuelve el sistema para `unknown` y compara con el resultado impreso."""
    try:
        sol = sp.solve(eqs, vars or unknown, dict=True)
        ok = any(same(s[unknown], target)[0] for s in sol if unknown in s)
    except Exception as ex:
        ok = False
    return rec(G_STEP, deriv, f'{name} (solve)', 1.0 if ok else 0.0, 1.0, 'solución exacta', ok)


def series_is(deriv, name, expr, var, x0, n, result):
    s = sp.series(expr, var, x0, n).removeO()
    ok, how = same(s, result)
    return rec(G_STEP, deriv, f'{name} (serie, {how})', 1.0 if ok else 0.0, 1.0, 'identidad', ok)


def num(deriv, name, got, exp, tol=None):
    """exp str: cifra impresa en el texto (se exige el redondeo correcto); exp float: tolerancia relativa tol (def. 2e-3)."""
    got = float(got)
    if isinstance(exp, str):
        dec = len(exp.split('.')[1]) if '.' in exp else 0
        m = re.match(r'^\s*(-?\d+(?:\.\d+)?)\s*[eE]\s*(-?\d+)\s*$', exp)
        if m:
            ok = abs(got - float(exp)) <= 0.5 * abs(float(exp)) * 10 ** (-(len(m.group(1).split('.')[1]) if '.' in m.group(1) else 0)) / abs(float(m.group(1))) * 1.0000001
            tolS = 'cifra impresa'
        else:
            ok = abs(got - float(exp)) <= 0.5 * 10 ** (-dec) * 1.0000001
            tolS = f'cifra impresa (±{0.5*10**(-dec):g})'
        expf = float(exp)
    else:
        expf = float(exp)
        t = 2e-3 if tol is None else tol
        ok = abs(got - expf) <= t * max(1e-300, abs(expf))
        tolS = f'rel {t}'
    return rec(G_NUM, deriv, name, got, expf, tolS, ok)


# ---------------------------------------------------------------- Dimensiones
_B = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd']


def _v(**k):
    return tuple(Fraction(k.get(b, 0)) for b in _B)


def _add(a, b, s=1):
    return tuple(x + s * y for x, y in zip(a, b))


_U = {'kg': _v(kg=1), 'm': _v(m=1), 's': _v(s=1), 'A': _v(A=1), 'K': _v(K=1), 'mol': _v(mol=1), 'cd': _v(cd=1)}
_U['N'] = _v(kg=1, m=1, s=-2); _U['J'] = _v(kg=1, m=2, s=-2); _U['W'] = _v(kg=1, m=2, s=-3)
_U['Pa'] = _v(kg=1, m=-1, s=-2); _U['Hz'] = _v(s=-1); _U['C'] = _v(A=1, s=1); _U['V'] = _v(kg=1, m=2, s=-3, A=-1)
_U['F'] = _v(kg=-1, m=-2, s=4, A=2); _U['Ohm'] = _v(kg=1, m=2, s=-3, A=-2); _U['T'] = _v(kg=1, s=-2, A=-1)
_U['H'] = _v(kg=1, m=2, s=-2, A=-2); _U['Wb'] = _v(kg=1, m=2, s=-2, A=-1); _U['S'] = _v(kg=-1, m=-2, s=3, A=2)
_U['rad'] = _v(); _U['sr'] = _v(); _U['eV'] = _U['J']; _U['g'] = _v(kg=1); _U['1'] = _v(); _U['L'] = _v(m=3)


def udim(u):
    d = _v()
    for tk in u.split():
        m = re.match(r'^([A-Za-z0-9]+)(?:\^(-?\d+))?$', tk)
        d = _add(d, tuple(Fraction(m.group(2) or 1) * x for x in _U[m.group(1)]))
    return d


class DimError(Exception):
    pass


def dimof(e, dims):
    e = sp.sympify(e)
    z = _v()
    if e.is_Number or e in (sp.pi, sp.E) or e.is_NumberSymbol:
        return z
    if e.is_Symbol:
        if e.name not in dims:
            raise DimError(f'símbolo sin unidad: {e.name}')
        return dims[e.name]
    if e.is_Add:
        ds = [dimof(a, dims) for a in e.args]
        if any(d != ds[0] for d in ds):
            raise DimError('suma de magnitudes con dimensiones distintas: ' + str(e))
        return ds[0]
    if e.is_Mul:
        d = z
        for a in e.args:
            d = _add(d, dimof(a, dims))
        return d
    if e.is_Pow:
        b, x = e.args
        if dimof(x, dims) != z:
            raise DimError('exponente con dimensión')
        db = dimof(b, dims)
        if not x.is_Number:
            if db != z:
                raise DimError('base con dimensión y exponente simbólico')
            return z
        return tuple(Fraction(int(x.p), int(x.q)) * c for c in db)
    from sympy.core.function import AppliedUndef
    if isinstance(e, sp.Abs):
        return dimof(e.args[0], dims)
    if isinstance(e, AppliedUndef):
        if e.func.__name__ not in dims:
            raise DimError('función sin unidad: ' + e.func.__name__)
        return dims[e.func.__name__]
    if isinstance(e, sp.Derivative):
        d = dimof(e.expr, dims)
        for v, c in e.variable_count:
            d = _add(d, tuple(c * x for x in dimof(v, dims)), -1)
        return d
    if isinstance(e, sp.Integral):
        d = dimof(e.function, dims)
        for lim in e.limits:
            d = _add(d, dimof(lim[0], dims))
        return d
    if isinstance(e, sp.Function):
        for a in e.args:
            if dimof(a, dims) != z:
                raise DimError(f'argumento de {e.func.__name__} con dimensión')
        return z
    raise DimError('no sé analizar: ' + str(e))


def dimcheck(deriv, name, lhs, rhs, units):
    """units: {'nombre_sympy': 'kg m s^-2', …}. Comprueba homogeneidad dimensional de lhs = rhs."""
    dims = {k: udim(u) for k, u in units.items()}
    try:
        dl, dr = dimof(lhs, dims), dimof(rhs, dims)
        ok = dl == dr
        msg = ''
    except DimError as ex:
        ok, msg = False, str(ex)
    # coherencia con la tabla <vars> del HTML
    tab = VARS.get(deriv)
    if tab is not None:
        extra = [u for u in units.values() if u.strip() not in tab and u.strip() not in ('1',)]
        if extra:
            ok, msg = False, 'unidades que no están en la tabla de variables: ' + ', '.join(extra)
    if not ok:
        print('FALLA dimensional', deriv, name, msg)
    return rec(G_DIM, deriv, name, 1.0 if ok else 0.0, 1.0, 'homogeneidad', ok)


# ---------------------------------------------------------------- Lectura de capítulos
VARS, DERIVS = {}, []


def _scan_chapters():
    d = os.path.join(ROOT, 'src', 'chapters')
    for f in sorted(os.listdir(d)):
        if not f.endswith('.html'):
            continue
        t = open(os.path.join(d, f), encoding='utf-8').read()
        for m in re.finditer(r'<deriv\s+id="([^"]+)"[^>]*>([\s\S]*?)</deriv>', t):
            DERIVS.append(m.group(1))
            VARS[m.group(1)] = {u.strip() for u in re.findall(r'<v\s+s="[^"]*"\s+n="[^"]*"\s+u="([^"]*)"', m.group(2))}


_scan_chapters()


# ---------------------------------------------------------------- Exploradores JS contra SymPy
_JS = None


def _js():
    global _JS
    if _JS is None:
        p = os.path.join(HERE, 'jsvalues.json')
        _JS = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
    return _JS


FSIM_DONE = set()


def fsim(fid, outk, expr, conv=None, deriv=None, tol=1e-9):
    """Compara la salida `outk` del explorador `fid` (JS) con la expresión simbólica `expr`
    en las muestras de tests/jsvalues.json. conv(p) -> {nombre_símbolo: valor} (por defecto, mismos nombres que los parámetros).
    También compara los exponentes locales n = ∂ln f/∂ln p del JS con la derivada exacta de SymPy."""
    J = _js().get(fid)
    deriv = deriv or fid
    FSIM_DONE.add(fid)
    if not J:
        return rec(G_SIM, deriv, f'{fid}: sin datos del JS', 0.0, 1.0, '', False)
    expr = sp.sympify(expr)
    worst, worst_n, nn = 0.0, 0.0, 0
    for s in J['samples']:
        p = s['p']
        cp = conv(p) if conv else p
        sub = {sp.Symbol(k, positive=True): sp.Float(v, 40) for k, v in cp.items()}
        sub2 = {k: v for k, v in sub.items()}
        # el símbolo puede no ser positive: sustituir por nombre
        sub3 = {sym: sub[sp.Symbol(sym.name, positive=True)] for sym in expr.free_symbols if sp.Symbol(sym.name, positive=True) in sub}
        val = float(sp.N(expr.subs(sub3), 40))
        got = s['out'][outk]
        worst = max(worst, abs(got - val) / max(1e-300, abs(val)))
        for k, nj in s['el'][outk].items():
            if nj is None:
                continue
            k_sym = [x for x in expr.free_symbols if x.name == (k if not conv else k)]
            if not k_sym or val == 0:
                continue
            nex = float(sp.N((k_sym[0] * sp.diff(expr, k_sym[0]) / expr).subs(sub3), 40))
            worst_n = max(worst_n, abs(nj - nex) / max(1.0, abs(nex)))
            nn += 1
    rec(G_SIM, deriv, f'{fid}.{outk}: JS vs SymPy en {len(J["samples"])} muestras', worst, 0.0, f'rel {tol:g}', worst <= tol)
    if nn:
        rec(G_SIM, deriv, f'{fid}.{outk}: exponentes locales n (JS vs SymPy, {nn})', worst_n, 0.0, 'abs 1e-5', worst_n <= 1e-5)


def coverage():
    """Toda deducción necesita pasos y análisis dimensional; todo explorador JS necesita fsim."""
    for d in DERIVS:
        g = _seen.get(d, set())
        rec(G_COV, d, 'tiene comprobación de pasos', 1.0 if G_STEP in g else 0.0, 1.0, '', G_STEP in g)
        rec(G_COV, d, 'tiene comprobación dimensional', 1.0 if G_DIM in g else 0.0, 1.0, '', G_DIM in g)
    for fid in _js():
        rec(G_COV, fid, 'explorador validado contra SymPy', 1.0 if fid in FSIM_DONE else 0.0, 1.0, '', fid in FSIM_DONE)


def save():
    ok = sum(r['pass'] for r in rows)
    out = dict(ok=ok, bad=len(rows) - ok, fecha=__import__('datetime').date.today().isoformat(), rows=rows)
    json.dump(out, open(os.path.join(HERE, 'resultados.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    return ok, len(rows) - ok


def buckingham(deriv, name, units, expect_pis):
    """units: {nombre: 'kg m s^-2'}; expect_pis: lista de {nombre: exponente}. Verifica que cada Π es adimensional
    (A·x = 0) y que generan todo el núcleo (n − r grupos)."""
    names = list(units)
    A = sp.Matrix([[udim(units[n])[i] for n in names] for i in range(len(_B))])
    nul = A.nullspace()
    X = sp.Matrix([[sp.Rational(str(pi.get(n, 0))) for n in names] for pi in expect_pis]).T
    ok_zero = (A * X).is_zero_matrix
    ok_cnt = (len(nul) == len(expect_pis) and X.rank() == len(expect_pis))
    rec(G_STEP, deriv, f'{name}: grupos Π adimensionales (A·x = 0)', 1.0 if ok_zero else 0.0, 1.0, 'exacto', ok_zero)
    rec(G_STEP, deriv, f'{name}: número de grupos n − r = {len(nul)}', float(len(nul)), float(len(expect_pis)), 'exacto', ok_cnt)


def fsim_py(fid, outk, func, tol=1e-9, atol=0.0, deriv=None):
    """Como fsim, pero la referencia es una función de Python (mpmath/SciPy) que recibe el dict de parámetros de cada muestra."""
    J = _js().get(fid)
    deriv = deriv or fid
    FSIM_DONE.add(fid)
    if not J:
        return rec(G_SIM, deriv, f'{fid}: sin datos del JS', 0.0, 1.0, '', False)
    worst = 0.0
    for s in J['samples']:
        ref = float(func(s['p']))
        got = s['out'][outk]
        if got is None:
            worst = 1e9
            continue
        worst = max(worst, abs(got - ref) / max(abs(ref), atol, 1e-300))
    return rec(G_SIM, deriv, f'{fid}.{outk}: JS vs referencia independiente en {len(J["samples"])} muestras', worst, 0.0, f'rel {tol:g}', worst <= tol)
