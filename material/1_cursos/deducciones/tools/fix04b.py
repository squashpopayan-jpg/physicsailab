p='src/core/32-formula.js'; s=open(p,encoding='utf-8').read()
old_start=s.index("  const H = 1e-4;"); old_end=s.index("  /* Cociente f(p con k·factor)/f(p) */")
new='''  const H = 1e-5;
  /* Exponente local n = (p/f) ∂f/∂p: diferencia central de 4.º orden en p·(1±h), p·(1±2h) */
  function elasticity(f, p, k) {
    const v = p[k];
    if (!(v !== 0) || !isFinite(v)) return NaN;
    const at = (c) => { const a = Object.assign({}, p); a[k] = v * (1 + c * H); return f(a); };
    const f0 = f(p);
    if (!(f0 !== 0) || !isFinite(f0)) return NaN;
    return (8 * (at(1) - at(-1)) - (at(2) - at(-2))) / (12 * H * f0);
  }
'''
s=s[:old_start]+new+s[old_end:]
open(p,'w',encoding='utf-8').write(s)
p='tests/caps/cap04.py'; s=open(p,encoding='utf-8').read()
s=s.replace("    for xv in (0.5, 3.0, 7.5):\n        v = float(sp.N(Jm.subs(xb, xv), 20))","    Jbig = sum((-1) ** k_ / (factorial(k_) * factorial(k_ + m_)) * (xb / 2) ** (2 * k_ + m_) for k_ in range(45))\n    for xv in (0.5, 3.0, 7.5):\n        v = float(sp.N(Jbig.subs(xb, xv), 20))")
s=s.replace("(12 términos): el residuo empieza","(12 términos): el residuo empieza").replace("num(D, 'f₁₁', fr(1), '406.5')","num(D, 'f₁₁', fr(1), '406.6')")
s=s.replace("num(D, 'S₉(π/4)', float(S_N(9, mp.pi / 4)), '1.0')  # se corrige tras ver el valor","num(D, 'S₉(π/4)', float(S_N(9, mp.pi / 4)), '0.9918')")
open(p,'w',encoding='utf-8').write(s)
p='src/chapters/04-edo.html'; s=open(p,encoding='utf-8').read()
a="\(S_9(\pi/4)=0.98\ldots\) (calculado por el simulador)"
print(a in s); s=s.replace(a,"\(S_9(\pi/4)=0.9918\)")
a="\(f=406.5\) Hz"; 
print("y \(f=406.5\) Hz" in s or "406.5 Hz" in s)
s=s.replace("y \(f=406.5\) Hz","y \(f=406.6\) Hz").replace("\(f=406.5\) Hz","\(f=406.6\) Hz")
open(p,'w',encoding='utf-8').write(s)
