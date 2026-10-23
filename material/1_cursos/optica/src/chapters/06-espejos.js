/* Capítulo 6 — Espejos y superficies refractoras */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;

  /* 6.1 Dos espejos en ángulo */
  EM.defineSim('espejo-plano', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('a', { label: 'Ángulo entre los espejos α', min: 20, max: 180, step: 1, value: 60, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('phi', { label: 'Posición angular del objeto (fracción de α)', min: 0.05, max: 0.95, step: 0.01, value: 0.35, fmt: (v) => v.toFixed(2) });
    sim.out('N', 'Número de imágenes', { hl: true });
    sim.out('f', '360°/α − 1');
    /* imágenes por reflexiones sucesivas mientras la fuente esté delante del espejo */
    const images = (al, ph0) => {
      const out = [];
      const norm = (a) => { a = a % (2 * Math.PI); return a < -Math.PI ? a + 2 * Math.PI : a > Math.PI ? a - 2 * Math.PI : a; };
      const front1 = (ph) => { ph = norm(ph); return ph > 0 && ph < Math.PI; };
      const front2 = (ph) => { const d = norm(ph - al); return d < 0 && d > -Math.PI; };
      for (const start of [1, 2]) {
        let ph = ph0, m = start, flips = 0;
        for (let k = 0; k < 40; k++) {
          if (m === 1) { if (!front1(ph)) break; ph = -ph; } else { if (!front2(ph)) break; ph = 2 * al - ph; }
          flips++;
          out.push({ ph: norm(ph), flips });
          m = m === 1 ? 2 : 1;
        }
      }
      /* elimina coincidencias */
      const u = [];
      for (const q of out) if (!u.some((w) => Math.abs(norm(w.ph - q.ph)) < 1e-6)) u.push(q);
      return u;
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, al = p.a * DEG;
      EM.draw.clear(cv);
      const v = D.view({ x: 0, y: 0, w: W, h: H }, -1.25, 1.25, -1.1, 1.1);
      const r0 = 0.62, ph0 = p.phi * al;
      const ims = images(al, ph0);
      const shape = (ph, flip, col, a) => {
        /* objeto asimétrico: flecha radial con una banderita a un lado */
        const c = [r0 * Math.cos(ph), r0 * Math.sin(ph)], t = [-Math.sin(ph), Math.cos(ph)], rr = [Math.cos(ph), Math.sin(ph)];
        const s = flip ? -1 : 1;
        const A1 = [c[0] - 0.12 * rr[0], c[1] - 0.12 * rr[1]], A2 = [c[0] + 0.12 * rr[0], c[1] + 0.12 * rr[1]], F = [A2[0] + 0.08 * s * t[0] - 0.04 * rr[0], A2[1] + 0.08 * s * t[1] - 0.04 * rr[1]];
        ctx.globalAlpha = a;
        EM.draw.arrow(ctx, ...v.map(A1), ...v.map(A2), { color: col, width: 2.4 });
        ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.moveTo(...v.map(A2)); ctx.lineTo(...v.map(F)); ctx.lineTo(...v.map([A2[0] - 0.06 * rr[0], A2[1] - 0.06 * rr[1]])); ctx.fill();
        ctx.globalAlpha = 1;
      };
      ims.forEach((q) => shape(q.ph, q.flips % 2 === 1, '--c1', 0.55));
      shape(ph0, false, '--c2', 1);
      /* espejos */
      ctx.strokeStyle = EM.col('--mirror'); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(...v.map([0, 0])); ctx.lineTo(...v.map([1.05, 0])); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(...v.map([0, 0])); ctx.lineTo(...v.map([1.05 * Math.cos(al), 1.05 * Math.sin(al)])); ctx.stroke();
      ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), r0 * v.sx, 0, 7); ctx.stroke();
      EM.text(ctx, 'objeto', v.X(r0 * Math.cos(ph0)) + 10, v.Y(r0 * Math.sin(ph0)) - 10, { size: 11, color: '--c2', halo: true });
      sim.set('N', String(ims.length));
      const q = 360 / p.a;
      sim.set('f', Math.abs(q - Math.round(q)) < 1e-9 ? String(Math.round(q) - 1) : EM.fix(q - 1, 2) + ' (no entero)');
    });
  });

  /* 6.2 Espejo esférico con rayos principales */
  EM.defineSim('espejo-esferico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('tipo', { label: 'Espejo', options: [['c', 'Cóncavo'], ['v', 'Convexo']], value: 'c' });
    sim.slider('f', { label: 'Distancia focal |f|', min: 5, max: 30, step: 0.5, value: 10, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('so', { label: 'Distancia del objeto s_o', min: 2, max: 60, step: 0.1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('ho', { label: 'Altura del objeto', min: 1, max: 6, step: 0.1, value: 3, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.out('si', 'Posición de la imagen s_i', { hl: true });
    sim.out('m', 'Aumento m');
    sim.out('car', 'Carácter');
    const xM = 0;
    EM.pointer(cv, {
      down: (x, y) => (sim._v && Math.abs(x - sim._v.X(-sim.p.so)) < 14 ? 1 : null),
      move: (a, x) => { const so = Math.max(2, Math.min(60, -sim._v.ix(x))); sim.ctl.so.set(+so.toFixed(1)); },
      hover: (x) => sim._v && Math.abs(x - sim._v.X(-sim.p.so)) < 14
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = p.tipo === 'c' ? p.f : -p.f;
      EM.draw.clear(cv);
      const v = (sim._v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -64, 30, -14, 14, false));
      D.axis(ctx, v);
      const R = 2 * f;
      D.mirror(ctx, v, xM, R, 11);
      D.focus(ctx, v, xM - f, 'F'); D.focus(ctx, v, xM - R, 'C');
      const im = D.mirrorRays(ctx, v, xM, f, { x: xM - p.so, h: p.ho }, { xend: -64 });
      D.object(ctx, v, xM - p.so, p.ho, { label: 'objeto' });
      if (isFinite(im.x) && Math.abs(im.x) < 200) D.object(ctx, v, im.x, im.h, { color: '--c1', dash: im.real ? null : [4, 3], label: 'imagen' });
      sim.set('si', isFinite(im.si) ? EM.fix(im.si, 2) + ' cm' + (im.real ? ' (delante del espejo)' : ' (detrás del espejo)') : '∞');
      sim.set('m', EM.fix(im.m, 3));
      sim.set('car', (im.real ? 'real' : 'virtual') + ', ' + (im.m < 0 ? 'invertida' : 'derecha') + ', ' + (Math.abs(im.m) > 1 ? 'aumentada' : 'reducida'));
    });
  });

  /* 6.3 Espejo esférico frente a parabólico (trazado exacto) */
  EM.defineSim('espejo-aberracion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('tipo', { label: 'Forma del espejo', options: [['esf', 'Esférico'], ['par', 'Parabólico']], value: 'esf' });
    sim.slider('ap', { label: 'Semiabertura (fracción de R)', min: 0.1, max: 0.95, step: 0.01, value: 0.7, fmt: (v) => v.toFixed(2) });
    sim.slider('nr', { label: 'Número de rayos', min: 5, max: 41, step: 2, value: 21, fmt: (v) => v.toFixed(0) });
    sim.out('lsa', 'Aberración longitudinal del rayo marginal', { hl: true });
    sim.out('blur', 'Radio de la mancha en el foco paraxial');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = 1, f = 0.5;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -0.25, 1.15, -1.0, 1.0);
      const xM = 1.0, hmax = p.ap * R;
      /* superficie */
      const surfX = (h) => (p.tipo === 'esf' ? xM - R + Math.sqrt(R * R - h * h) : xM - (h * h) / (4 * f));
      ctx.strokeStyle = EM.col('--mirror'); ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const h = -hmax + (2 * hmax * i) / 80; const m = v.map([surfX(h), h]); i ? ctx.lineTo(...m) : ctx.moveTo(...m); }
      ctx.stroke();
      D.axis(ctx, v);
      D.focus(ctx, v, xM - f, 'F');
      let worst = 0, blur = 0;
      for (let i = 0; i < p.nr; i++) {
        const h = -hmax + (2 * hmax * (i + 0.5)) / p.nr;
        const P = [surfX(h), h];
        const nrm = p.tipo === 'esf' ? [P[0] - (xM - R), P[1]] : [1, h / (2 * f)];
        const L = Math.hypot(nrm[0], nrm[1]), N = [nrm[0] / L, nrm[1] / L], c = N[0];
        const d = [1 - 2 * c * N[0], -2 * c * N[1]];
        const zc = P[0] - (P[1] * d[0]) / d[1];
        const tEnd = (-0.25 - P[0]) / d[0];
        D.ray(ctx, v, [[-0.25, h], P, [P[0] + tEnd * d[0], P[1] + tEnd * d[1]]], { color: '--ray', width: 1.1, alpha: 0.8, arrow: i === 0 });
        if (Math.abs(h) > 1e-6) worst = Math.max(worst, xM - f - zc);
        const yf = P[1] + ((xM - f - P[0]) / d[0]) * d[1];
        blur = Math.max(blur, Math.abs(yf));
      }
      sim.set('lsa', p.tipo === 'esf' ? EM.fix(worst * 100, 2) + ' % de R (exacta: ' + EM.fix((R - R / (2 * Math.cos(Math.asin(hmax))) - (R - f)) * -100, 2) + ' %)' : '0 (todos los rayos van al foco)');
      sim.set('blur', EM.fix(blur * 1000, 2) + ' milésimas de R');
    });
  });

  /* 6.4 Superficie refractora esférica */
  EM.defineSim('dioptrio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n1', { label: 'Índice a la izquierda n₁', min: 1, max: 2, step: 0.001, value: 1, fmt: (v) => v.toFixed(3) });
    sim.slider('n2', { label: 'Índice a la derecha n₂', min: 1, max: 2, step: 0.001, value: 1.5, fmt: (v) => v.toFixed(3) });
    sim.slider('R', { label: 'Radio de curvatura R', min: -30, max: 30, step: 0.5, value: 10, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('so', { label: 'Distancia del objeto s_o', min: 5, max: 80, step: 0.5, value: 40, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('ang', { label: 'Abertura del haz', min: 1, max: 25, step: 0.5, value: 12, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('si', 'Imagen paraxial s_i', { hl: true });
    sim.out('P', 'Potencia de la superficie');
    sim.out('sa', 'Cruce del rayo más abierto');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = Math.abs(p.R) < 0.5 ? 0.5 : p.R;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -85, 90, -22, 22, false);
      ctx.fillStyle = EM.alpha('--glass', 0.06 + 0.3 * (p.n2 - 1));
      const hap = Math.min(18, Math.abs(R) * 0.95);
      const sx = (h) => R - Math.sign(R) * Math.sqrt(R * R - h * h);
      ctx.beginPath(); ctx.moveTo(v.X(90), v.Y(hap));
      for (let i = 0; i <= 60; i++) { const h = hap - (2 * hap * i) / 60; ctx.lineTo(v.X(sx(h)), v.Y(h)); }
      ctx.lineTo(v.X(90), v.Y(-hap)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--glass'); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const h = hap - (2 * hap * i) / 60; const m = [v.X(sx(h)), v.Y(h)]; i ? ctx.lineTo(...m) : ctx.moveTo(...m); }
      ctx.stroke();
      D.axis(ctx, v);
      const sys = [{ z: 0, c: 1 / R, n: p.n2, ap: hap }];
      const O = [-p.so, 0];
      const si = OP.surfImage(p.n1, p.n2, R, p.so);
      let marg = null, mk = 0;
      for (let k = -6; k <= 6; k++) {
        if (k === 0) continue;
        const a = ((k / 6) * p.ang * DEG);
        const r = OP.traceRay(sys, [0, 0, -p.so], [0, Math.sin(a), Math.cos(a)], 589, p.n1);
        if (r.lost) continue;
        const P = [r.p[2], r.p[1]], d = [r.d[2], r.d[1]];
        const t = (90 - P[0]) / d[0];
        D.ray(ctx, v, [O, P, [P[0] + t * d[0], P[1] + t * d[1]]], { color: '--ray', width: 1.2, alpha: 0.85, arrow: false });
        if (si < 0) { const tb = (si - P[0]) / d[0]; D.ray(ctx, v, [P, [P[0] + tb * d[0], P[1] + tb * d[1]]], { color: '--ray', width: 1, dash: [4, 4], alpha: 0.6 }); }
        if (Math.abs(k) >= mk) { mk = Math.abs(k); marg = P[0] - (P[1] * d[0]) / d[1]; }
      }
      if (isFinite(si) && Math.abs(si) < 200) { ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(v.X(si), v.Y(-4)); ctx.lineTo(v.X(si), v.Y(4)); ctx.stroke(); EM.text(ctx, 'imagen paraxial', v.X(si), v.Y(5) - 4, { size: 11, color: '--c1', align: 'center', halo: true }); }
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(-p.so), v.Y(0), 4, 0, 7); ctx.fill();
      sim.set('si', EM.fix(si, 2) + ' cm ' + (si > 0 ? '(real)' : '(virtual)'));
      sim.set('P', EM.fix((p.n2 - p.n1) / (R / 100), 2) + ' dioptrías');
      sim.set('sa', marg !== null ? EM.fix(marg, 2) + ' cm' + (mk < 6 ? ' (los rayos más abiertos no tocan la superficie)' : '') : '—');
    });
  });
})();
