# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\55-fm-atom.js'
s = open(p, encoding='utf-8').read()
i0 = s.index("  /* ---------- Franck–Hertz")
i1 = s.index("  /* ---------- Moseley")
new = """  /* ---------- Franck–Hertz: Monte Carlo 1D ---------- */
  /* Electrones acelerados en una región de longitud L (unidades arbitrarias) con campo uniforme V/L. Entre colisiones ganan energía; en cada colisión
     (camino libre medio mfp) pierden Eex con probabilidad pin si Ek ≥ Eex (excitación del átomo) y no pierden nada si no. Devuelve la fracción de electrones
     que llega al ánodo con energía superior al potencial retardador Vr, y la energía media final. rng(): U(0,1). */
  A.franckHertz = (V, o, rng) => {
    const { Eex = 4.887, L = 1, mfp = 0.03, Vr = 1.5, n = 400, pin = 0.9 } = o; let ok = 0, sum = 0; const field = V / L;
    for (let i = 0; i < n; i++) {
      let x = 0, Ek = 0.3 * rng();
      for (;;) {
        const step = -Math.log(1 - rng()) * mfp;
        if (x + step >= L) { Ek += field * (L - x); break; }
        x += step; Ek += field * step;
        if (Ek >= Eex && rng() < pin) Ek -= Eex;
      }
      sum += Ek; if (Ek > Vr) ok++;
    }
    return { frac: ok / n, mean: sum / n };
  };
"""
s = s[:i0] + new + s[i1:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
