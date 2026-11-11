/* Capítulo 1 — Análisis dimensional y escalamiento: exploradores de fórmulas */
(function () {
  'use strict';
  const EM = window.EM, K = EM.K, PI = Math.PI;
  const G = 6.6743e-11;

  /* 1.1 Periodo del péndulo: Π1 = T²g/L = F(θ0)² */
  EM.formula('pendulo-pi', {
    params: [
      { k: 'L', label: 'Longitud del hilo <i>L</i>', min: 0.01, max: 100, value: 1, log: true, unit: 'm' },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 'th', label: 'Amplitud inicial θ₀', min: 0.5, max: 170, value: 10, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true }
    ],
    outs: [
      { k: 'T', label: 'Periodo exacto <i>T</i> = 4√(<i>L</i>/<i>g</i>)·<i>K</i>(sen²θ₀/2)', f: (p) => 4 * Math.sqrt(p.L / p.g) * EM.M.ellipKE(Math.pow(Math.sin(p.th * PI / 360), 2))[0], unit: 's', hl: true },
      { k: 'T0', label: 'Periodo de ángulos pequeños 2π√(<i>L</i>/<i>g</i>)', f: (p) => 2 * PI * Math.sqrt(p.L / p.g), unit: 's' },
      { k: 'F', label: 'Función adimensional <i>F</i>(θ₀) = <i>T</i>/√(<i>L</i>/<i>g</i>)', f: (p) => 4 * EM.M.ellipKE(Math.pow(Math.sin(p.th * PI / 360), 2))[0], fmt: (v) => EM.fix(v, 4) }
    ],
    reads: [{ k: 'pi', label: 'Grupo Π₁ = <i>T</i>²<i>g</i>/<i>L</i> (solo depende de θ₀)', f: (p) => { const F = 4 * EM.M.ellipKE(Math.pow(Math.sin(p.th * PI / 360), 2))[0]; return EM.fix(F * F, 3); } }],
    aspect: 2.8,
    draw(ctx, w, h, p) {
      const a = p.th * PI / 180, px = w / 2, py = 24, Lp = Math.min(h - 50, w * 0.42) * (0.55 + 0.45 * Math.log10(p.L * 100) / 4);
      const bx = px + Lp * Math.sin(a), by = py + Lp * Math.cos(a);
      ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + Lp); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(bx, by, 11, 0, 2 * PI); ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, Lp * 0.28, PI / 2 - a, PI / 2); ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
      EM.text(ctx, 'θ₀ = ' + EM.fix(p.th, 1) + '°', px + 12, py + Lp * 0.42, { size: 12, color: '--c2' });
      EM.text(ctx, 'L', (px + bx) / 2 + 8, (py + by) / 2, { size: 12, color: '--ink-2' });
    }
  });

  /* 1.2 Onda de choque de una explosión (Taylor–Sedov) */
  EM.formula('sedov', {
    params: [
      { k: 'E', label: 'Energía liberada <i>E</i>', min: 1e3, max: 1e18, value: 4.184e13, log: true, unit: 'J' },
      { k: 'rho', label: 'Densidad del aire ρ', min: 0.01, max: 2000, value: 1.2, log: true, unit: 'kg/m³' },
      { k: 't', label: 'Tiempo desde la explosión <i>t</i>', min: 1e-4, max: 10, value: 0.05, log: true, unit: 's' },
      { k: 'xi', label: 'Constante adimensional ξ (γ = 1,4)', min: 0.9, max: 1.3, value: 1.033, unit: '', fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'R', label: 'Radio del frente de choque <i>R</i> = ξ(<i>Et</i>²/ρ)<sup>1/5</sup>', f: (p) => p.xi * Math.pow(p.E * p.t * p.t / p.rho, 0.2), unit: 'm', hl: true },
      { k: 'u', label: 'Velocidad del frente d<i>R</i>/d<i>t</i> = 2<i>R</i>/(5<i>t</i>)', f: (p) => 0.4 * p.xi * Math.pow(p.E * p.t * p.t / p.rho, 0.2) / p.t, unit: 'm/s' }
    ]
  });

  /* 1.3 Unidades de Planck por análisis dimensional (con «constantes» reescalables) */
  EM.formula('planck', {
    params: [
      { k: 'kG', label: 'Factor sobre la constante de gravitación <i>G</i>', min: 0.01, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'kh', label: 'Factor sobre ħ', min: 0.01, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'kc', label: 'Factor sobre <i>c</i>', min: 0.01, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'lP', label: 'Longitud de Planck √(ħ<i>G</i>/<i>c</i>³)', f: (p) => Math.sqrt((p.kh * K.hbar) * (p.kG * G) / Math.pow(p.kc * K.c, 3)), unit: 'm', hl: true },
      { k: 'tP', label: 'Tiempo de Planck √(ħ<i>G</i>/<i>c</i>⁵)', f: (p) => Math.sqrt((p.kh * K.hbar) * (p.kG * G) / Math.pow(p.kc * K.c, 5)), unit: 's' },
      { k: 'mP', label: 'Masa de Planck √(ħ<i>c</i>/<i>G</i>)', f: (p) => Math.sqrt((p.kh * K.hbar) * (p.kc * K.c) / (p.kG * G)), unit: 'kg' }
    ]
  });

  /* 1.4 Ondas en la superficie del agua: gravedad y capilaridad */
  EM.formula('ondas-agua', {
    params: [
      { k: 'lam', label: 'Longitud de onda λ', min: 1e-3, max: 1000, value: 0.1, log: true, unit: 'm' },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 'sig', label: 'Tensión superficial σ', min: 0.01, max: 0.1, value: 0.0728, unit: 'N/m', fmt: (v) => EM.fix(v, 4) },
      { k: 'rho', label: 'Densidad del líquido ρ', min: 500, max: 14000, value: 998, log: true, unit: 'kg/m³' }
    ],
    outs: [
      { k: 'v', label: 'Velocidad de fase <i>v</i> = √(<i>g</i>λ/2π + 2πσ/(ρλ))', f: (p) => Math.sqrt(p.g * p.lam / (2 * PI) + 2 * PI * p.sig / (p.rho * p.lam)), unit: 'm/s', hl: true },
      { k: 'lc', label: 'Longitud de onda de velocidad mínima λₘ = 2π√(σ/(ρ<i>g</i>))', f: (p) => 2 * PI * Math.sqrt(p.sig / (p.rho * p.g)), unit: 'm' },
      { k: 'vmin', label: 'Velocidad mínima <i>v</i>ₘᵢₙ = (4<i>g</i>σ/ρ)<sup>1/4</sup>', f: (p) => Math.pow(4 * p.g * p.sig / p.rho, 0.25), unit: 'm/s' },
      { k: 'P1', label: 'Grupo Π₁ = <i>v</i>²/(<i>g</i>λ)', f: (p) => (p.g * p.lam / (2 * PI) + 2 * PI * p.sig / (p.rho * p.lam)) / (p.g * p.lam), fmt: (v) => EM.fix(v, 4) }
    ]
  });

  /* 1.5 Arrastre sobre una esfera: Π = F/(ρ v² d²) = f(Re) */
  const CD = (Re) => (24 / Re) * Math.pow(1 + 0.27 * Re, 0.43) + 0.47 * (1 - Math.exp(-0.04 * Math.pow(Re, 0.38)));
  EM.formula('arrastre', {
    params: [
      { k: 'd', label: 'Diámetro de la esfera <i>d</i>', min: 1e-5, max: 1, value: 0.01, log: true, unit: 'm' },
      { k: 'v', label: 'Velocidad <i>v</i>', min: 1e-5, max: 100, value: 1, log: true, unit: 'm/s' },
      { k: 'rho', label: 'Densidad del fluido ρ', min: 1, max: 1500, value: 1.2, log: true, unit: 'kg/m³' },
      { k: 'eta', label: 'Viscosidad dinámica η', min: 1e-5, max: 1, value: 1.81e-5, log: true, unit: 'Pa·s' }
    ],
    outs: [
      { k: 'F', label: 'Fuerza de arrastre <i>F</i> = <i>C</i><sub>D</sub>(Re)·(π/8)ρ<i>v</i>²<i>d</i>²', f: (p) => { const Re = p.rho * p.v * p.d / p.eta; return CD(Re) * (PI / 8) * p.rho * p.v * p.v * p.d * p.d; }, unit: 'N', hl: true },
      { k: 'Re', label: 'Número de Reynolds Re = ρ<i>vd</i>/η', f: (p) => p.rho * p.v * p.d / p.eta },
      { k: 'CD', label: 'Coeficiente de arrastre <i>C</i><sub>D</sub>(Re)', f: (p) => CD(p.rho * p.v * p.d / p.eta), fmt: (v) => EM.sci(v, 4) },
      { k: 'Fs', label: 'Fuerza de Stokes 3πη<i>vd</i> (Re ≪ 1)', f: (p) => 3 * PI * p.eta * p.v * p.d, unit: 'N' }
    ]
  });
})();
