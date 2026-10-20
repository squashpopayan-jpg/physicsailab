/* Capítulo 17 — Flujo potencial */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, C = FL.C;

  /* 17.1 Superposición de flujos elementales */
  const PRE = {
    semicuerpo: ['Semicuerpo de Rankine', 1, [['src', 0, 0]]],
    ovalo: ['Óvalo de Rankine', 1, [['src', -1, 0], ['snk', 1, 0]]],
    cilindro: ['Cilindro (doblete)', 1, [['dip', 0, 0]]],
    rotante: ['Cilindro con circulación', 1, [['dip', 0, 0], ['vor', 0, 0]]],
    pared: ['Fuente junto a una pared (imagen)', 0, [['src', 0, 0.8], ['src', 0, -0.8]]],
    vortices: ['Par de vórtices opuestos', 0, [['vor', -0.8, 0], ['avor', 0.8, 0]]]
  };
  EM.defineSim('superposicion', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('pre', { label: 'Configuración', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'semicuerpo' });
    sim.slider('U', { label: 'Corriente uniforme <i>U</i>', min: 0, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('m', { label: 'Caudal de las fuentes <i>m</i>', min: 0.5, max: 8, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) });
    sim.slider('G', { label: 'Circulación de los vórtices Γ (horaria +)', min: 0, max: 12, step: 0.1, value: 5, fmt: (v) => v.toFixed(1) });
    sim.out('st', 'Puntos de estancamiento', { hl: true });
    sim.out('b', 'Dimensión característica');
    sim.hint('Arrastre los elementos con el ratón.', cv);
    let E = [];
    const load = () => { const P = PRE[sim.p.pre]; sim.ctl.U.set(P[1], true); E = P[2].map(([t, x, y]) => ({ t, z: [x, y] })); };
    load();
    sim.onChange = (id) => { if (id === 'pre') load(); };
    const els = () => {
      const p = sim.p, out = p.U > 0 ? [{ t: 'U', U: p.U }] : [];
      for (const e of E) {
        if (e.t === 'src') out.push({ t: 'src', m: p.m, z: e.z });
        else if (e.t === 'snk') out.push({ t: 'src', m: -p.m, z: e.z });
        else if (e.t === 'dip') out.push({ t: 'dip', k: 2 * Math.PI * Math.max(p.U, 0.2) * 1, z: e.z });
        else if (e.t === 'vor') out.push({ t: 'vor', G: -p.G, z: e.z });
        else if (e.t === 'avor') out.push({ t: 'vor', G: p.G, z: e.z });
      }
      return out;
    };
    let view = null, drag = null;
    EM.pointer(cv, {
      down: (x, y) => { if (!view) return null; const q = view.inv(x, y); let best = null, bd = 0.25; E.forEach((e, i) => { const d = Math.hypot(e.z[0] - q[0], e.z[1] - q[1]); if (d < bd) { bd = d; best = i; } }); return best === null ? null : best; },
      move: (i, x, y) => { E[i].z = view.inv(x, y); sim.redraw(); },
      hover: (x, y) => { if (!view) return false; const q = view.inv(x, y); return E.some((e) => Math.hypot(e.z[0] - q[0], e.z[1] - q[1]) < 0.25); }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = els();
      EM.draw.clear(cv);
      const v = (view = EM.flow.view({ x: 4, y: 4, w: W - 8, h: H - 8 }, -4, 4, -2.5, 2.5));
      const vel = (x, y) => { const q = FL.potW(L, [x, y]); return [q.u, q.v]; };
      /* rapidez */
      const nx = 160, ny = 100, sp = new Float64Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = -4 + (8 * i) / (nx - 1), y = -2.5 + (5 * j) / (ny - 1), q = vel(x, y); sp[j * nx + i] = Math.hypot(q[0], q[1]); }
      EM.flow.paint(ctx, sp, nx, ny, { x: v.X(-4), y: v.Y(2.5), w: v.X(4) - v.X(-4), h: v.Y(-2.5) - v.Y(2.5) }, (s) => EM.cmap.seq(Math.min(1, s / (2.5 * Math.max(0.4, p.U))), '--c1'));
      const near = (x, y) => E.some((e) => (e.t === 'snk' || e.t === 'vor' || e.t === 'avor' || e.t === 'dip') && Math.hypot(x - e.z[0], y - e.z[1]) < 0.06);
      const box = [-4, 4, -2.5, 2.5], opt = { ds: 0.03, n: 800, box, stop: near };
      if (p.U > 0) for (let k = -12; k <= 12; k++) EM.flow.drawPath(ctx, EM.flow.trace(vel, -4, (k * 2.5) / 12.5, opt), v.map, { color: '--ink', width: 1.1, arrow: true, arrowAt: 0.15 });
      for (const e of E) {
        if (e.t === 'src') for (let k = 0; k < 16; k++) { const a = (2 * Math.PI * (k + 0.5)) / 16; EM.flow.drawPath(ctx, EM.flow.trace(vel, e.z[0] + 0.06 * Math.cos(a), e.z[1] + 0.06 * Math.sin(a), opt), v.map, { color: '--ink', width: 1.1 }); }
        if ((e.t === 'vor' || e.t === 'avor') && p.U === 0) for (let k = 1; k <= 6; k++) EM.flow.drawPath(ctx, EM.flow.trace(vel, e.z[0] + 0.25 * k, e.z[1], { ds: 0.02, n: 1500, box }), v.map, { color: '--ink', width: 1 });
      }
      if (p.pre === 'pared') { ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(v.X(-4), v.Y(0)); ctx.lineTo(v.X(4), v.Y(0)); ctx.stroke(); }
      for (const e of E) {
        const col = e.t === 'src' ? '--c2' : e.t === 'snk' ? '--c1' : e.t === 'dip' ? '--c5' : '--c3';
        ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(v.X(e.z[0]), v.Y(e.z[1]), 7, 0, 7); ctx.fill();
        ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = 1.5; ctx.stroke();
      }
      /* puntos de estancamiento: mínimos de la rapidez en la rejilla, refinados con Newton sobre (u, v) = 0 */
      const sts = [];
      for (let jj = 1; jj < ny - 1; jj++) for (let ii = 1; ii < nx - 1; ii++) {
        const k = jj * nx + ii, s0 = sp[k];
        if (!(s0 <= sp[k - 1] && s0 <= sp[k + 1] && s0 <= sp[k - nx] && s0 <= sp[k + nx] && s0 < 0.25 * Math.max(0.3, p.U))) continue;
        let x = -4 + (8 * ii) / (nx - 1), y = -2.5 + (5 * jj) / (ny - 1), ok = false;
        for (let it = 0; it < 30; it++) {
          const h = 1e-5, f = vel(x, y), fx = vel(x + h, y), fy = vel(x, y + h);
          const a11 = (fx[0] - f[0]) / h, a12 = (fy[0] - f[0]) / h, a21 = (fx[1] - f[1]) / h, a22 = (fy[1] - f[1]) / h, det = a11 * a22 - a12 * a21;
          if (!isFinite(det) || Math.abs(det) < 1e-12) break;
          const dx = (a22 * f[0] - a12 * f[1]) / det, dy = (-a21 * f[0] + a11 * f[1]) / det;
          x -= dx; y -= dy;
          if (Math.hypot(dx, dy) < 1e-10) { ok = true; break; }
        }
        if (ok && Math.abs(x) < 4 && Math.abs(y) < 2.5 && !E.some((e) => Math.hypot(x - e.z[0], y - e.z[1]) < 0.05) && !sts.some((q) => Math.hypot(q[0] - x, q[1] - y) < 0.05)) sts.push([x, y]);
      }
      for (const q of sts) {
        /* líneas divisorias: se trazan desde el punto de estancamiento en las cuatro direcciones */
        for (const [dx, dy] of [[0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02]]) EM.flow.drawPath(ctx, EM.flow.trace(vel, q[0] + dx, q[1] + dy, Object.assign({}, opt, { both: true })), v.map, { color: '--accent', width: 1.8 });
        ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(q[0]), v.Y(q[1]), 5, 0, 7); ctx.fill();
      }
      sim.set('st', sts.length ? sts.slice(0, 3).map((q) => '(' + EM.fix(q[0], 2) + ', ' + EM.fix(q[1], 2) + ')').join(' ') : 'ninguno visible');
      sim.set('b', p.pre === 'semicuerpo' ? 'ancho asintótico m/U = ' + EM.fix(p.m / Math.max(p.U, 1e-9), 2) + '; nariz en x = −m/2πU = ' + EM.fix(-p.m / (2 * Math.PI * Math.max(p.U, 1e-9)), 3) : p.pre === 'cilindro' || p.pre === 'rotante' ? 'radio a = 1' : '—');
    });
  });

  /* 17.2 Cilindro con circulación */
  EM.defineSim('cilindro-circulacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('G', { label: 'Circulación horaria Γ/(2π<i>Ua</i>)', min: -3, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('U', { label: 'Velocidad del aire', min: 1, max: 40, step: 0.5, value: 10, unit: 'm/s', fmt: (v) => v.toFixed(1) });
    sim.slider('a', { label: 'Radio del cilindro', min: 0.05, max: 1.5, step: 0.01, value: 0.1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('L', 'Sustentación ρ<i>U</i>Γ por metro', { hl: true });
    sim.out('Li', 'Integral de la presión sobre la superficie (sustentación · arrastre)');
    sim.out('st', 'Puntos de estancamiento');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, rho = 1.225;
      EM.draw.clear(cv);
      const g = p.G, Gccw = -g * 2 * Math.PI; /* en unidades U = a = 1 */
      const cyl = FL.cylinder(1, 1, Gccw);
      /* líneas de corriente: ψ = y(1 − 1/r²) − (Γccw/2π) ln r */
      const v = EM.flow.view({ x: 4, y: 4, w: W * 0.55 - 8, h: H - 8 }, -3, 3, -2.4, 2.4);
      const nx = 180, ny = 144, psi = new Float64Array(nx * ny), mask = new Uint8Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = -3 + (6 * i) / (nx - 1), y = -2.4 + (4.8 * j) / (ny - 1), r2 = x * x + y * y, k = j * nx + i; if (r2 < 1) { mask[k] = 1; continue; } psi[k] = y * (1 - 1 / r2) - (Gccw / (2 * Math.PI)) * 0.5 * Math.log(r2); }
      const r = { x: v.X(-3), y: v.Y(2.4), w: v.X(3) - v.X(-3), h: v.Y(-2.4) - v.Y(2.4) };
      const gm = (i, j) => [r.x + (i / (nx - 1)) * r.w, r.y + r.h - (j / (ny - 1)) * r.h];
      for (let L = -3; L <= 3.001; L += 0.2) EM.flow.drawSegs(ctx, EM.flow.contour(psi, nx, ny, L, mask), gm, { color: Math.abs(L) < 1e-9 ? '--accent' : '--ink-2', width: 1 });
      /* línea divisoria: ψ igual al valor en la superficie */
      const psiS = 0; EM.flow.drawSegs(ctx, EM.flow.contour(psi, nx, ny, psiS + 1e-9, mask), gm, { color: '--accent', width: 1.8 });
      ctx.fillStyle = EM.col('--solid'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), v.sx, 0, 7); ctx.fill();
      if (Math.abs(g) > 0.01) { ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), v.sx * 0.6, g > 0 ? -2.5 : -0.6, g > 0 ? -0.6 : -2.5, g < 0); ctx.stroke(); }
      if (cyl.stag) for (const t of cyl.stag) { ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(Math.cos(t)), v.Y(Math.sin(t)), 5, 0, 7); ctx.fill(); }
      /* Cp en la superficie */
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 360, ymin: Math.min(-3, cyl.Cp(Math.PI / 2) * 1.05, cyl.Cp(-Math.PI / 2) * 1.05), ymax: 1.2, xlabel: 'θ (°)', ylabel: 'C_p' });
      pl.frame();
      pl.fn((d) => 1 - 4 * Math.pow(Math.sin((d * Math.PI) / 180), 2), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.fn((d) => cyl.Cp((d * Math.PI) / 180), { color: '--accent', width: 2.4 });
      /* integral de la presión (dimensional) */
      const U = p.U, a = p.a, Gd = g * 2 * Math.PI * U * a; let Fx = 0, Fy = 0; const N = 4000;
      for (let i = 0; i < N; i++) { const th = (2 * Math.PI * (i + 0.5)) / N, pr = 0.5 * rho * U * U * cyl.Cp(th); Fx -= pr * Math.cos(th) * a * ((2 * Math.PI) / N); Fy -= pr * Math.sin(th) * a * ((2 * Math.PI) / N); }
      sim.set('L', EM.fix(rho * U * Gd, 2) + ' N/m (Γ = ' + EM.fix(Gd, 3) + ' m²/s)');
      sim.set('Li', EM.fix(Fy, 2) + ' · ' + EM.sci(Fx, 1) + ' N/m');
      sim.set('st', cyl.stag ? EM.fix((cyl.stag[0] * 180) / Math.PI, 1) + '° y ' + EM.fix((cyl.stag[1] * 180) / Math.PI, 1) + '°' : 'fuera del cilindro (|Γ| > 4πUa)');
    });
  });

  /* 17.3 Perfil de Joukowski */
  EM.defineSim('joukowski', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.slider('m', { label: 'Espesor (desplazamiento horizontal del centro)', min: 0, max: 0.2, step: 0.005, value: 0.1, fmt: (v) => v.toFixed(3) });
    sim.slider('n', { label: 'Curvatura (desplazamiento vertical)', min: 0, max: 0.15, step: 0.005, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.slider('al', { label: 'Ángulo de ataque α', min: -8, max: 15, step: 0.5, value: 5, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.check('k', { label: 'Imponer la condición de Kutta', value: true });
    sim.out('CL', '<i>C</i><sub>L</sub> · 2π sen(α+β)', { hl: true });
    sim.out('G', 'Circulación Γ/(<i>Uc</i>)');
    sim.out('cmax', 'Espesor máximo · cuerda');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, al = (p.al * Math.PI) / 180;
      EM.draw.clear(cv);
      const J0 = FL.joukowski({ m: p.m, n: p.n, alpha: al });
      const J = p.k ? J0 : FL.joukowski({ m: p.m, n: p.n, alpha: al, G: 0 });
      const v = EM.flow.view({ x: 4, y: 4, w: W - 8, h: H * 0.62 - 8 }, -3.4, 3.4, -1.5, 1.5);
      /* ψ en una malla polar alrededor del círculo, transformada al plano del perfil */
      const nr = 70, nt = 240, psi = new Float64Array(nr * nt), P = new Array(nr * nt);
      for (let j = 0; j < nt; j++) for (let i = 0; i < nr; i++) {
        const rr = J.a * (1 + 0.0005 + 6 * Math.pow(i / (nr - 1), 2)), th = (2 * Math.PI * j) / (nt - 1), z = C.add(J.s, [rr * Math.cos(th), rr * Math.sin(th)]);
        psi[j * nr + i] = J.Wz(z)[1]; P[j * nr + i] = J.map(z);
      }
      const gm = (i, j) => { const i0 = Math.min(nr - 2, Math.floor(i)), j0 = Math.min(nt - 2, Math.floor(j)), ti = i - i0, tj = j - j0; const a = P[j0 * nr + i0], b = P[j0 * nr + i0 + 1], c = P[(j0 + 1) * nr + i0], d = P[(j0 + 1) * nr + i0 + 1]; const x = (1 - ti) * (1 - tj) * a[0] + ti * (1 - tj) * b[0] + (1 - ti) * tj * c[0] + ti * tj * d[0], y = (1 - ti) * (1 - tj) * a[1] + ti * (1 - tj) * b[1] + (1 - ti) * tj * c[1] + ti * tj * d[1]; return v.map(x, y); };
      ctx.save(); ctx.beginPath(); ctx.rect(4, 4, W - 8, H * 0.62 - 8); ctx.clip();
      const ps = J.Wz(C.add(J.s, [J.a, 0]))[1];
      for (let k = -16; k <= 16; k++) EM.flow.drawSegs(ctx, EM.flow.contour(psi, nr, nt, ps + k * 0.18 + 1e-7), gm, { color: k === 0 ? '--accent' : '--ink-2', width: k === 0 ? 1.8 : 1 });
      EM.flow.solidPoly(ctx, J.prof.map((q) => v.map(q)), { fill: '--solid' });
      ctx.restore();
      /* Cp en la superficie */
      const surf = [];
      for (let i = 0; i < 400; i++) { const th = (2 * Math.PI * (i + 0.5)) / 400, z = C.add(J.s, [J.a * Math.cos(th), J.a * Math.sin(th)]), zt = J.map(z), u = J.vel(z), cp = 1 - (u[0] * u[0] + u[1] * u[1]); surf.push([zt[0], cp, Math.sin(th - Math.atan2(-J.s[1], J.a)) >= 0]); }
      const xs = surf.map((q) => q[0]), xmn = Math.min(...xs), xmx = Math.max(...xs);
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.62, w: W * 0.6, h: H * 0.38, xmin: 0, xmax: 1, ymin: -4, ymax: 1.2, xlabel: 'x/c', ylabel: 'C_p', mt: 8 });
      pl.frame();
      pl.clip((c) => { c.fillStyle = EM.col('--accent'); for (const q of surf) { const X = pl.X((q[0] - xmn) / (xmx - xmn)), Y = pl.Y(Math.max(-4, q[1])); c.fillRect(X - 1, Y - 1, 2.2, 2.2); } });
      const p2 = new EM.Plot(ctx, { x: W * 0.6, y: H * 0.62, w: W * 0.4, h: H * 0.38, xmin: -8, xmax: 15, ymin: -0.8, ymax: 2.2, xlabel: 'α (°)', ylabel: 'C_L', mt: 8, ml: 40 });
      p2.frame();
      p2.fn((d) => FL.joukowski({ m: p.m, n: p.n, alpha: (d * Math.PI) / 180 }).CL, { color: '--accent', width: 2 });
      p2.fn((d) => 2 * Math.PI * Math.sin((d * Math.PI) / 180), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      p2.dot(p.al, J0.CL, { color: '--accent', r: 5 });
      let tmax = 0; for (let i = 0; i < 200; i++) { const x = xmn + ((xmx - xmn) * (i + 0.5)) / 200; const ys = J.prof.filter((q, k) => k > 0 && (J.prof[k - 1][0] - x) * (q[0] - x) <= 0).map((q) => q[1]); if (ys.length >= 2) tmax = Math.max(tmax, Math.max(...ys) - Math.min(...ys)); }
      sim.set('CL', (p.k ? EM.fix(J0.CL, 4) : '0 (sin circulación)') + ' · ' + EM.fix(2 * Math.PI * Math.sin(al + J0.beta), 4));
      sim.set('G', EM.fix(J.G / J.chord, 4));
      sim.set('cmax', EM.fix((100 * tmax) / J.chord, 1) + ' % · ' + EM.fix(J.chord, 3) + ' c');
    });
  });
})();
