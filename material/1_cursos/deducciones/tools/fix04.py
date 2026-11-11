import re
p='tests/caps/cap04.py'; s=open(p,encoding='utf-8').read()
def cut(start_marker, end_marker, new):
    global s
    i=s.index(start_marker); j=s.index(end_marker,i)
    s=s[:i]+new+s[j:]
cut("ident(D, 'Re z = A cos", "wr_sq = Symbol", "_Ch = 1 / complex(100 - 25, 2 * 5)\n_t0 = 0.37\n_lhs = (_Ch * __import__('cmath').exp(1j * 5 * _t0)).real\n_rhs = 1 / math.sqrt(75 ** 2 + 100) * math.cos(5 * _t0 - math.atan2(10, 75))\nrec(G_STEP, D, 'Re(Ĉ e^(iωt)) = A cos(ωt − δ) (ω = 5)', _lhs, _rhs, 'rel 1e-12', abs(_lhs - _rhs) < 1e-12)\n")
s=s.replace("rec(G_STEP, D, 'A(0) = F₀/ω₀²', float(sp.N((F0 / sqrt(Dn)).subs({w: 0, F0: 1, w0: 10, g: 1}))), 0.01, 'exacto', abs(float(sp.N((F0 / sqrt(Dn)).subs({w: 0, F0: 1, w0: 10, g: 1})))) - 0.01 < 1e-15)",
"_A0 = float(sp.N((F0 / sqrt(Dn)).subs({w: 0, F0: 1, w0: 10, g: 1})))\nrec(G_STEP, D, 'A(0) = F₀/ω₀²', _A0, 0.01, 'exacto', abs(_A0 - 0.01) < 1e-15)")
i=s.index("ident(D, 'a₂ₖ = −a₂ₖ₋₂"); j=s.index("\n",i)
s=s[:i]+"ident(D, 'a₄ de J₂ con a₀ = 1/(2²·2!) y a₂ₖ = −a₂ₖ₋₂/(4k(k+m)): 1/3072 = 1/(2!·4!·2⁶)', R_(1, 8) * R_(1, 12) * R_(1, 32), R_(1, 48 * 64))"+s[j:]
i=s.index("for k_ in range(0, 7):\n    ident(D, f'P_{k_}(1) = 1 y paridad"); j=s.index("dimcheck(D, 'P₂(x)",i)
s=s[:i]+"for k_ in range(0, 7):\n    ident(D, f'P_{k_}(1) = 1', legendre(k_, 1), 1)\n    ident(D, f'P_{k_}(−x) = (−1)^l P_{k_}(x)', legendre(k_, -xl), (-1) ** k_ * legendre(k_, xl))\n"+s[j:]
s=s.replace("nn, A = symbols('n A', positive=True, integer=True)[0], Symbol('A', positive=True)","A = Symbol('A', positive=True)")
s=s.replace("solves(D, 'resonancia: d/dω(D) = 0 → ω_r² = ω₀² − 2γ²', [Eq(diff(Dn, w) / (4 * w), 0)], w ** 2, w0 ** 2 - 2 * g ** 2, vars=[w ** 2]) if False else None\n","")
open(p,'w',encoding='utf-8').write(s)
