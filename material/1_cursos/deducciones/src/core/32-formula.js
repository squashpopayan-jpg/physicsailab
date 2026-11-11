/* ===================================================================
   32-formula.js — Explorador de fórmulas
   EM.formula(id, spec) registra una fórmula (pura, probada en Node contra SymPy)
   y define la simulación «id»: deslizadores para cada parámetro, lectura del
   resultado, gráfica resultado–parámetro y TABLA DE SENSIBILIDAD
   (exponente local n = ∂ln f/∂ln p, efecto de +10 % y de ×2 en cada parámetro).

   spec = {
     title, aspect,
     params: [{k, label, min, max, value, log, unit, fmt, step, fixed}],   // fixed: no entra en la tabla
     outs:   [{k, label, f:(p)=>valor, unit, fmt, hl}],                    // f recibe {k: valor} en las unidades mostradas
     reads:  [{k, label, f:(p)=>texto HTML}],                              // lecturas libres (no se validan)
     draw:   (ctx, w, h, p, EM) => void,                                   // dibujo de la situación física (opcional)
     gx:     clave del parámetro en el eje x de la gráfica (por defecto el primero)
   }
   =================================================================== */
(function () {
  'use strict';
  const EM = (typeof window !== 'undefined' ? window : globalThis).EM;
  EM.F = EM.F || {};

  const H = 1e-4;
  /* Exponente local n = (p/f) ∂f/∂p: diferencia central de 4.º orden en p·(1±h), p·(1±2h) */
  function elasticity(f, p, k) {
    const v = p[k];
    if (!(v !== 0) || !isFinite(v)) return NaN;
    const at = (c) => { const a = Object.assign({}, p); a[k] = v * (1 + c * H); return f(a); };
    const f0 = f(p);
    if (!(f0 !== 0) || !isFinite(f0)) return NaN;
    return (8 * (at(1) - at(-1)) - (at(2) - at(-2))) / (12 * H * f0);
  }
  /* Cociente f(p con k·factor)/f(p) */
  function ratio(f, p, k, factor) {
    const a = Object.assign({}, p);
    a[k] *= factor;
    const f0 = f(p);
    return f0 !== 0 ? f(a) / f0 : NaN;
  }
  EM.formulaMath = { elasticity, ratio };
  /* erfc(x) y erf(x), x ≥ 0 (serie de Taylor hasta x = 1.5; fracción continua de Lentz más allá) */
  EM.erfc = function (x) {
    if (x < 0) return 2 - EM.erfc(-x);
    if (x < 1.5) {
      let t = x, s = x;
      for (let n = 1; n < 120; n++) { t *= -x * x / n; s += t / (2 * n + 1); if (Math.abs(t) < 1e-18 * Math.abs(s)) break; }
      return 1 - 2 / Math.sqrt(Math.PI) * s;
    }
    /* erfc x = e^{-x²}/(x√π) · 1/(1+ 1/(2x²)/(1+2/(2x²)/(1+3/(2x²)/…))) */
    let f = 0;
    for (let k = 200; k >= 1; k--) f = (k / 2) / (x + f);
    return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
  };
  EM.erf = function (x) { return x < 0 ? -EM.erf(-x) : 1 - EM.erfc(x); };

  /* ln Γ(x), x > 0: recurrencia hasta x ≥ 20 y serie de Stirling (error < 1e-17) */
  EM.lgamma = function (x) {
    let s = 0;
    while (x < 20) { s -= Math.log(x); x += 1; }
    const y = 1 / (x * x);
    return s + (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + (1 / 12 - y * (1 / 360 - y * (1 / 1260 - y * (1 / 1680 - y / 1188)))) / x;
  };

  EM.formula = function (id, spec) {
    spec.id = id;
    EM.F[id] = spec;
    if (!EM.defineSim) return;
    const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '');
    EM.defineSim(id, function (sim) {
      const picture = typeof spec.draw === 'function';
      const cvPic = picture ? sim.canvas({ aspect: spec.aspect || 2.6 }) : null;
      const cv = sim.canvas({ aspect: picture ? 1.9 : 2.1 });
      sim.group('Parámetros');
      for (const q of spec.params) {
        sim.slider(q.k, { label: q.label, min: q.min, max: q.max, step: q.step, value: q.value, log: !!q.log, unit: q.unit || '', fmt: q.fmt || ((v) => EM.sci(v, 3)) });
      }
      const sensParams = spec.params.filter((q) => !q.fixed);
      const gxOpts = spec.params.filter((q) => q.min !== q.max);
      if (gxOpts.length > 1) sim.select('gx', { label: 'Variable en el eje horizontal de la gráfica', options: gxOpts.map((q) => [q.k, plain(q.label)]), value: spec.gx || gxOpts[0].k });
      else sim.p.gx = spec.gx || gxOpts[0].k;
      if (spec.outs.length > 1) sim.select('oy', { label: 'Resultado que se grafica y se analiza', options: spec.outs.map((o) => [o.k, plain(o.short || o.label.split('=')[0].trim())]), value: spec.outs[0].k });
      else sim.p.oy = spec.outs[0].k;
      for (const o of spec.outs) sim.out(o.k, o.label, { hl: !!o.hl });
      for (const r of spec.reads || []) sim.out('r_' + r.k, r.label);
      const sens = EM.el('div', 'sens');
      sim.stageCol.append(sens);
      const lbl = {};
      for (const q of spec.params) lbl[q.k] = q.label.replace(/<[^>]+>/g, '').replace(/\s*\(.*$/, '').replace(/&[a-z]+;/g, '');

      sim.onDraw(() => {
        const p = {};
        for (const q of spec.params) p[q.k] = sim.p[q.k];
        const O = spec.outs.find((o) => o.k === sim.p.oy) || spec.outs[0];
        for (const o of spec.outs) {
          const v = o.f(p);
          sim.set(o.k, (o.fmt ? o.fmt(v, p) : EM.sci(v, 4)) + (o.unit ? ' ' + o.unit : ''));
        }
        for (const r of spec.reads || []) sim.set('r_' + r.k, r.f(p));
        /* Situación física */
        if (picture) {
          EM.draw.clear(cvPic);
          spec.draw(cvPic.ctx, cvPic.w, cvPic.h, p, EM);
        }
        /* Gráfica resultado–parámetro */
        const gq = spec.params.find((q) => q.k === sim.p.gx) || gxOpts[0];
        const N = 240, xs = [], ys = [];
        for (let i = 0; i <= N; i++) {
          const x = gq.log ? gq.min * Math.pow(gq.max / gq.min, i / N) : gq.min + ((gq.max - gq.min) * i) / N;
          const pp = Object.assign({}, p); pp[gq.k] = x;
          xs.push(x); ys.push(O.f(pp));
        }
        const fin = ys.filter((v) => isFinite(v));
        let ymin = Math.min(...fin), ymax = Math.max(...fin);
        const ylog = fin.length === ys.length && ymin > 0 && ymax / ymin > 30 && !!gq.log;
        if (!ylog) { const pad = (ymax - ymin) * 0.08 || Math.abs(ymax) * 0.1 || 1; ymin = ymin >= 0 && ymin < ymax * 0.5 ? 0 : ymin - pad; ymax += pad; }
        else { ymin /= 1.5; ymax *= 1.5; }
        EM.draw.clear(cv);
        const ctx = cv.ctx;
        const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '');
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: gq.min, xmax: gq.max, ymin, ymax, xlog: !!gq.log, ylog, xlabel: lbl[gq.k] + (gq.unit ? ' (' + gq.unit + ')' : ''), ylabel: strip(O.short || O.label.split('=')[0].trim()).slice(0, 34) + (O.unit ? ' (' + O.unit + ')' : ''), ml: 64, mr: 12 });
        pl.frame();
        pl.xy(xs, ys, { color: '--accent', width: 2.6 });
        const here = O.f(p), nloc = elasticity(O.f, p, gq.k);
        if (ylog && isFinite(nloc) && here > 0) {
          /* Recta tangente en log–log: f ∝ p^n */
          const tx = [gq.min, gq.max], ty = tx.map((x) => here * Math.pow(x / p[gq.k], nloc));
          pl.xy(tx, ty, { color: '--c4', width: 1.3, dash: [5, 4] });
          pl.label(gq.log ? Math.sqrt(gq.min * gq.max) : (gq.min + gq.max) / 2, ymax / 2.2, 'pendiente local n = ' + EM.fix(nloc, 3), { size: 11.5, color: '--c4', align: 'center' });
        }
        if (isFinite(here)) pl.dot(p[gq.k], here, { color: '--c2', r: 5 });

        /* Tabla de sensibilidad del resultado elegido */
        let html = `<h4>Sensibilidad de ${O.short || O.label.split('=')[0].trim()} a cada parámetro (con los demás fijos)</h4><table><tr><th>Parámetro</th><th>Exponente local <i>n</i></th><th>+10 % en el parámetro →</th><th>×2 en el parámetro →</th></tr>`;
        for (const q of sensParams) {
          const n = elasticity(O.f, p, q.k), r10 = ratio(O.f, p, q.k, 1.1), r2 = ratio(O.f, p, q.k, 2);
          const cls = !isFinite(n) ? 'zero' : Math.abs(n) < 0.005 ? 'zero' : n > 0 ? 'pos' : 'neg';
          const bar = isFinite(n) ? `<span class="bar${n < 0 ? ' neg' : ''}" style="width:${Math.min(60, Math.abs(n) * 22).toFixed(0)}px"></span>` : '';
          html += `<tr><td>${lbl[q.k]}</td><td class="n ${cls}">${isFinite(n) ? EM.fix(n, 3) : '—'}${bar}</td><td>${isFinite(r10) ? (r10 >= 1 ? '+' : '−') + EM.fix(Math.abs(r10 - 1) * 100, 2) + ' %' : '—'}</td><td>${isFinite(r2) && !q.angle ? '× ' + EM.sci(r2, 3) : '—'}</td></tr>`;
        }
        html += '</table><div class="sens-note"><i>n</i> = ∂ ln <i>f</i> / ∂ ln <i>p</i>: si el parámetro cambia un 1 %, el resultado cambia aproximadamente <i>n</i> %. Un valor constante de <i>n</i> en todo el rango indica una ley de potencias <i>f</i> ∝ <i>p</i><sup><i>n</i></sup>.</div>';
        sens.innerHTML = EM.supHTML(html);
      });
    });
  };
})();
