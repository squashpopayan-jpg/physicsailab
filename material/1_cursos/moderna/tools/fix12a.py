# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\57-fm-tunnel.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("  /* Función de onda estacionaria de dispersión")
i1 = s.index("  /* ---------- Pozo finito")
new = """  /* Función de onda estacionaria de dispersión (barrera en 0 ≤ x ≤ a) con onda incidente e^{ikx} de amplitud 1: devuelve k, q, t, r, T, R y ψ(x) = [re, im] (x en nm).
     Se resuelve hacia atrás: a la derecha ψ = e^{ik(x−a)} (amplitud 1 en x = a), dentro ψ = cosh(q(x−a)) + (ik/q)senh(q(x−a)) (o cos/sen si E > V₀),
     a la izquierda ψ = A e^{ikx} + B e^{−ikx} con A, B de la continuidad de ψ y ψ′ en x = 0; todo se divide después por A. */
  U.scatter = (E, V0, a, m = me) => {
    const c = U.hb2m(m), k = Math.sqrt(E / c), tun = E < V0, q = Math.sqrt(Math.abs(V0 - E) / c);
    const cmul = (A, B) => [A[0] * B[0] - A[1] * B[1], A[0] * B[1] + A[1] * B[0]], cdiv = (A, B) => { const d = B[0] * B[0] + B[1] * B[1]; return [(A[0] * B[0] + A[1] * B[1]) / d, (A[1] * B[0] - A[0] * B[1]) / d]; };
    const psiIn = (x) => { const d = x - a; return tun ? [Math.cosh(q * d), (k * Math.sinh(q * d)) / q] : [Math.cos(q * d), (k * Math.sin(q * d)) / q]; };
    const dpsiIn = (x) => { const d = x - a; return tun ? [q * Math.sinh(q * d), k * Math.cosh(q * d)] : [-q * Math.sin(q * d), k * Math.cos(q * d)]; };
    const p0 = psiIn(0), d0 = dpsiIn(0), dIk = cdiv(d0, [0, k]);
    const A = [(p0[0] + dIk[0]) / 2, (p0[1] + dIk[1]) / 2], B = [(p0[0] - dIk[0]) / 2, (p0[1] - dIk[1]) / 2];
    const tau = cdiv([1, 0], A), r = cdiv(B, A), t = cmul(tau, [Math.cos(k * a), -Math.sin(k * a)]);   /* ψ = t e^{ikx} para x > a */
    return {
      k, q, t, r, T: tau[0] ** 2 + tau[1] ** 2, R: r[0] ** 2 + r[1] ** 2,
      psi: (x) => {
        if (x < 0) { const b1 = cmul(r, [Math.cos(k * x), -Math.sin(k * x)]); return [Math.cos(k * x) + b1[0], Math.sin(k * x) + b1[1]]; }
        if (x <= a) return cmul(tau, psiIn(x));
        return cmul(tau, [Math.cos(k * (x - a)), Math.sin(k * (x - a))]);
      }
    };
  };
"""
s = s[:i0] + new + s[i1:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
