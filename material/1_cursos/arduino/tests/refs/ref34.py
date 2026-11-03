# Núcleo 34: traductor de C de Arduino. Referencia independiente: evaluador de enteros de C escrito aquí con Python.
# Genera expresiones aleatorias con variables de distintos tipos y calcula su valor con las reglas de C
# (promociones enteras, conversiones aritméticas usuales, desbordamiento) para una placa de 16 bits (AVR) y otra de 32 (ESP32).
import random
rnd = random.Random(2026)

# tipo → (bits, signo)
def tinfo(t, ib):
    return {'char': (8, True), 'byte': (8, False), 'short': (16, True), 'ushort': (16, False), 'int': (ib, True), 'uint': (ib, False), 'long': (32, True), 'ulong': (32, False)}[t]

def wrap(v, t, ib):
    b, s = tinfo(t, ib)
    v &= (1 << b) - 1
    if s and v >= 1 << (b - 1): v -= 1 << b
    return v

def promote(t, ib):
    b, s = tinfo(t, ib)
    if b < ib or (b == ib and False): return 'int'
    if b == ib and s: return 'int' if t != 'long' else t
    return t

def promote_int(t, ib):
    """promoción entera: tipos más estrechos que int → int (si int los representa todos) o uint"""
    b, s = tinfo(t, ib)
    if t in ('long', 'ulong'): return t
    if b < ib: return 'int'
    if b == ib: return 'int' if s else 'uint'
    return t

def usual(t1, t2, ib):
    a, b = promote_int(t1, ib), promote_int(t2, ib)
    if a == b: return a
    ra, rb = tinfo(a, ib), tinfo(b, ib)
    # si ambos tienen el mismo signo, el de mayor rango
    if ra[1] == rb[1]: return a if ra[0] >= rb[0] else b
    # distinto signo: el sin signo tiene rango >= que el con signo → sin signo
    u, sg = (a, b) if not ra[1] else (b, a)
    if tinfo(u, ib)[0] >= tinfo(sg, ib)[0]: return u
    # el con signo puede representar todos los valores del sin signo → con signo
    return sg

def ev(op, x, tx, y, ty, ib):
    if op in ('<<', '>>'):
        rt = promote_int(tx, ib)
        b = tinfo(rt, ib)[0]
        if y < 0 or y >= b: return None
        v = wrap(x, rt, ib)
        r = (v << y) if op == '<<' else (v >> y)
        return wrap(r, rt, ib), rt
    rt = usual(tx, ty, ib)
    a, b = wrap(x, rt, ib), wrap(y, rt, ib)
    if op == '+': r = a + b
    elif op == '-': r = a - b
    elif op == '*': r = a * b
    elif op == '/':
        if b == 0: return None
        r = abs(a) // abs(b) * (1 if (a >= 0) == (b >= 0) else -1)
    elif op == '%':
        if b == 0: return None
        q = abs(a) // abs(b) * (1 if (a >= 0) == (b >= 0) else -1)
        r = a - q * b
    elif op == '&': r = a & b
    elif op == '|': r = a | b
    elif op == '^': r = a ^ b
    elif op in ('<', '>', '<=', '>=', '==', '!='):
        r = int(eval(f'{a}{op}{b}'))
        return r, 'int'
    return wrap(r, rt, ib), rt

TYPES = ['char', 'byte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong']
CT = {'char': 'char', 'byte': 'byte', 'short': 'short', 'ushort': 'unsigned short', 'int': 'int', 'uint': 'unsigned int', 'long': 'long', 'ulong': 'unsigned long'}
OPS = ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '<', '>=', '==']

def rand_val(t, ib):
    b, s = tinfo(t, ib)
    k = rnd.random()
    if k < 0.3: v = rnd.randint(-20, 20)
    elif k < 0.6: v = rnd.randint(-2000, 40000)
    else: v = rnd.randint(-(1 << (b - 1)), (1 << b) - 1)
    return wrap(v, t, ib)

ref['ino'] = []
for ib in (16, 32):
    cases = []
    for k in range(260):
        vars_ = {}
        for nm in 'abcd':
            t = rnd.choice(TYPES); vars_[nm] = (t, rand_val(t, ib))
        # expresión: ((a op b) op c) op d con 2 o 3 operandos
        names = rnd.sample('abcd', rnd.choice((2, 3, 4)))
        e = names[0]; (x, tx) = (vars_[names[0]][1], vars_[names[0]][0])
        ok = True
        for nm in names[1:]:
            op = rnd.choice(OPS)
            y, ty = vars_[nm][1], vars_[nm][0]
            r = ev(op, x, tx, y, ty, ib)
            if r is None: ok = False; break
            e = f'({e} {op} {nm})'; x, tx = r
        if not ok: continue
        cases.append(dict(vars={n: [CT[t], v] for n, (t, v) in vars_.items()}, expr=e, val=x))
    ref['ino'].append(dict(bits=ib, cases=cases))

# --- algoritmos: valores de referencia calculados aquí ---
ref['ino_alg'] = dict(
    fib=[0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
    primes=[p for p in range(2, 60) if all(p % q for q in range(2, int(p ** .5) + 1))],
    sorted=sorted([9, 3, 7, 1, 8, 2, 5]),
    # map() de Arduino con enteros largos (división truncada hacia cero)
    maps=[[x, ((x - 0) * (255 - 0)) // (1023 - 0) + 0] for x in (0, 1, 100, 511, 512, 1000, 1023)],
    map_neg=[[x, (lambda n, d: (abs(n) // abs(d)) * (1 if (n >= 0) == (d >= 0) else -1))((x - 0) * (100 - 0), 1023) + 0] for x in (0, 300, 1023)],
    overflow16=wrap(1000 * 100, 'int', 16), overflow16_60k=wrap(60 * 1000, 'int', 16),
    ulong_sub=wrap(5 - 10, 'ulong', 16),
    byte_inc=wrap(250 + 10, 'byte', 16),
    float_div=7 / 2.0, int_div=3, int_div_neg=-3, int_mod_neg=-1,
)
