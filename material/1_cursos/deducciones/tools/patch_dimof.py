p='tests/dlib.py'; s=open(p,encoding='utf-8').read()
old="    if isinstance(e, sp.Function):\n        for a in e.args:"
new='''    from sympy.core.function import AppliedUndef
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
        for a in e.args:'''
assert old in s
s=s.replace(old,new,1)
open(p,'w',encoding='utf-8').write(s)
