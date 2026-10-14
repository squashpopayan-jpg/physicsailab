/* Capítulo 1 — Materiales y su ciencia */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat;
  const CLS = { metal: '--c1', 'cerámico': '--c2', 'polímero': '--c3', compuesto: '--c5', natural: '--c4', espuma: '--c6' };
  EM.CLS_COLORS = CLS;

  /* ======================================================================
     1.1 Escalera de escalas
     ====================================================================== */
  EM.defineSim('scale-ladder', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('L', { label: 'Tamaño del campo de visión (log₁₀ m)', min: -10, max: 0, step: 0.05, value: -1, fmt: (v) => EM.si(Math.pow(10, v), 'm', 2) });
    sim.out('what', 'Qué se ve', { hl: true });
    sim.out('tool', 'Con qué se observa');
    sim.out('prop', 'Propiedades que controla');
    const seed = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    /* Voronoi aproximado de granos con puntos semilla */
    const grains = Array.from({ length: 40 }, (_, i) => [seed(i + 1), seed(i + 101)]);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = p.L;
      const box = { x: 16, y: 16, w: W * 0.62 - 24, h: H - 54 };
      ctx.save();
      ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
      let what, tool, prop;
      if (L > -2.2) {
        /* pieza: engranaje */
        what = 'Componente (engranaje de acero)'; tool = 'A simple vista, calibrador, tomografía'; prop = 'Desempeño, tolerancias, defectos de fabricación';
        const s = Math.pow(10, -1 - L);
        const cx = box.x + box.w / 2, cy = box.y + box.h / 2, R = Math.min(box.w, box.h) * 0.36 * s;
        ctx.fillStyle = EM.col('--c6'); ctx.beginPath();
        for (let i = 0; i <= 240; i++) { const a = (i / 240) * 2 * Math.PI, r = R * (1 + 0.12 * Math.sign(Math.sin(18 * a))); ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
        ctx.fill();
        ctx.fillStyle = EM.col('--canvas'); ctx.beginPath(); ctx.arc(cx, cy, R * 0.3, 0, 7); ctx.fill();
      } else if (L > -4.6) {
        what = 'Microestructura: granos de ferrita y colonias de perlita'; tool = 'Microscopio óptico tras pulido y ataque con nital'; prop = 'Resistencia (Hall–Petch), tenacidad, ductilidad';
        const d = Math.pow(10, -2.2 - L) * 0.9; // escala relativa
        const N = 26, cell = box.w / (N * d * 0.25 + 1e-9);
        for (let ix = 0; ix < box.w; ix += 3) for (let iy = 0; iy < box.h; iy += 3) {
          const u = (ix / box.w) / (d * 0.4), w = (iy / box.h) / (d * 0.4) * (box.h / box.w);
          let best = 9, b2 = 9, bi = 0;
          for (let gx = Math.floor(u) - 1; gx <= Math.floor(u) + 1; gx++) for (let gy = Math.floor(w) - 1; gy <= Math.floor(w) + 1; gy++) {
            const k = ((gx * 7 + gy * 13) % 40 + 40) % 40;
            const dx = gx + grains[k][0] - u, dy = gy + grains[k][1] - w, dd = dx * dx + dy * dy;
            if (dd < best) { b2 = best; best = dd; bi = k; } else if (dd < b2) b2 = dd;
          }
          const edge = Math.sqrt(b2) - Math.sqrt(best) < 0.04;
          const pearl = bi % 3 === 0;
          ctx.fillStyle = edge ? EM.col('--ink-2') : pearl ? EM.alpha('--ink-2', ((Math.floor((ix + iy * 0.6) / 4) % 2) ? 0.55 : 0.2)) : EM.alpha('--c4', 0.15);
          ctx.fillRect(box.x + ix, box.y + iy, 3, 3);
        }
        void cell; void N;
      } else if (L > -7.4) {
        what = 'Nanoestructura: dislocaciones y láminas de cementita'; tool = 'Microscopio electrónico de transmisión (TEM)'; prop = 'Límite elástico, endurecimiento por deformación';
        const s = Math.pow(10, -5 - L);
        ctx.strokeStyle = EM.alpha('--ink-2', 0.8); ctx.lineWidth = 1.4;
        for (let k = 0; k < 14; k++) {
          ctx.beginPath();
          const y0 = box.y + seed(k + 7) * box.h, a = seed(k + 70) * 0.8;
          for (let x = 0; x <= box.w; x += 4) ctx.lineTo(box.x + x, y0 + Math.sin((x / box.w) * 6 * s + k) * 12 * s + a * x * 0.3);
          ctx.stroke();
        }
        ctx.fillStyle = EM.alpha('--c4', 0.25);
        for (let k = 0; k < 5; k++) ctx.fillRect(box.x + (k * box.w) / 5 / s % box.w, box.y, 10 / s + 4, box.h);
      } else {
        what = 'Estructura atómica: red BCC del Fe-α (a = 0.287 nm)'; tool = 'Microscopía de alta resolución, difracción de rayos X'; prop = 'Módulo elástico, densidad, expansión térmica, magnetismo';
        const a = 0.287e-9, px = box.w / (Math.pow(10, L) / a);
        const r = Math.max(1.5, px * 0.28);
        for (let i = -1; i < box.w / px + 1; i++) for (let j = -1; j < box.h / px + 1; j++) {
          EM.draw.bob(ctx, box.x + i * px, box.y + j * px, r, { color: '--c1' });
          if (px > 12) EM.draw.bob(ctx, box.x + (i + 0.5) * px, box.y + (j + 0.5) * px, r * 0.8, { color: EM.mix(EM.col('--c1'), EM.col('--canvas'), 0.4) });
        }
      }
      ctx.restore();
      ctx.strokeStyle = EM.col('--rule'); ctx.strokeRect(box.x, box.y, box.w, box.h);
      /* barra de escala */
      const bar = box.w * 0.3, val = Math.pow(10, L) * 0.3;
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(box.x + 10, box.y + box.h + 18); ctx.lineTo(box.x + 10 + bar, box.y + box.h + 18); ctx.stroke();
      EM.text(ctx, EM.si(val, 'm', 2), box.x + 14 + bar, box.y + box.h + 22, { size: 12, color: '--ink' });
      /* regla logarítmica a la derecha */
      const rx = W * 0.66, rw = W * 0.3;
      const marks = [[0, 'pieza'], [-2, 'grano grande'], [-4, 'grano fino'], [-6, 'perlita / TEM'], [-8, 'dislocación (núcleo)'], [-10, 'átomo']];
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.5;
      const yOf = (l) => 20 + ((0 - l) / 10) * (H - 50);
      ctx.beginPath(); ctx.moveTo(rx + 20, yOf(0)); ctx.lineTo(rx + 20, yOf(-10)); ctx.stroke();
      for (const [l, t] of marks) {
        ctx.beginPath(); ctx.moveTo(rx + 14, yOf(l)); ctx.lineTo(rx + 26, yOf(l)); ctx.stroke();
        EM.text(ctx, '10^{' + EM.minus(l) + '} m', rx + 32, yOf(l) + 4, { size: 11, mono: true, color: '--ink-2' });
        EM.text(ctx, t, rx + 32 + 66, yOf(l) + 4, { size: 11, color: '--ink-3' });
      }
      EM.draw.arrow(ctx, rx - 6, yOf(L), rx + 14, yOf(L), { color: '--accent', width: 2.4 });
      void rw;
      sim.set('what', what); sim.set('tool', tool); sim.set('prop', prop);
    });
  });

  /* ======================================================================
     1.2 Mapa de Ashby
     ====================================================================== */
  EM.defineSim('ashby-chart', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.select('ax', { label: 'Ejes', options: [['E-rho', 'Módulo E contra densidad ρ'], ['s-rho', 'Resistencia σ contra densidad ρ'], ['K-E', 'Tenacidad K_Ic contra módulo E'], ['k-a', 'Conductividad térmica k contra expansión α'], ['E-c', 'Módulo E contra costo por kg']], value: 'E-rho' });
    sim.slider('slope', { label: 'Pendiente de la línea guía', min: 1, max: 3, step: 1, value: 2, fmt: (v) => ({ 1: '1 · E/ρ (tirante)', 2: '2 · √E/ρ (viga)', 3: '3 · ∛E/ρ (placa)' })[v] });
    sim.slider('pos', { label: 'Posición de la línea', min: -3, max: 3, step: 0.02, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('sel', 'Material bajo el puntero', { hl: true });
    sim.out('above', 'Materiales por encima de la línea');
    let hover = -1;
    const AX = {
      'E-rho': { x: (m) => m.rho / 1000, y: (m) => m.E, xl: 'densidad ρ (Mg/m³)', yl: 'módulo E (GPa)', xr: [0.03, 30], yr: [0.001, 1500], guide: true },
      's-rho': { x: (m) => m.rho / 1000, y: (m) => m.sy, xl: 'densidad ρ (Mg/m³)', yl: 'resistencia σ_f (MPa)', xr: [0.03, 30], yr: [0.3, 3000], guide: true },
      'K-E': { x: (m) => m.E, y: (m) => m.KIc, xl: 'módulo E (GPa)', yl: 'tenacidad K_{Ic} (MPa√m)', xr: [0.001, 1500], yr: [0.01, 200], guide: false },
      'k-a': { x: (m) => m.alpha, y: (m) => m.k, xl: 'expansión α (10⁻⁶/K)', yl: 'conductividad k (W/m·K)', xr: [0.5, 300], yr: [0.01, 3000], guide: false },
      'E-c': { x: (m) => m.cost, y: (m) => m.E, xl: 'costo (USD/kg, aprox.)', yl: 'módulo E (GPa)', xr: [0.05, 200], yr: [0.001, 1500], guide: false }
    };
    let plot = null;
    EM.pointer(cv, {
      hover: (x, y) => {
        if (!plot) return false;
        const A = AX[sim.p.ax];
        let best = -1, bd = 14;
        MAT.db.forEach((m, i) => { const xv = A.x(m), yv = A.y(m); if (!(xv > 0 && yv > 0)) return; const d = Math.hypot(plot.X(xv) - x, plot.Y(yv) - y); if (d < bd) { bd = d; best = i; } });
        if (best !== hover) { hover = best; sim.redraw(); }
        return best >= 0 ? 'pointer' : false;
      },
      leave: () => { hover = -1; sim.redraw(); }
    });
    sim.legend(Object.entries(CLS).map(([k, c]) => ({ label: k, color: c, kind: 'dot' })));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, A = AX[p.ax];
      EM.draw.clear(cv);
      plot = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: A.xr[0], xmax: A.xr[1], ymin: A.yr[0], ymax: A.yr[1], xlog: true, ylog: true, xlabel: A.xl, ylabel: A.yl, ml: 62 });
      plot.frame();
      /* envolventes por familia (elipses en log) */
      const fams = {};
      MAT.db.forEach((m) => { const xv = A.x(m), yv = A.y(m); if (!(xv > 0 && yv > 0)) return; (fams[m.cls] = fams[m.cls] || []).push([Math.log10(xv), Math.log10(yv)]); });
      for (const [cls, pts] of Object.entries(fams)) {
        if (pts.length < 2) continue;
        const mx = pts.reduce((s, q) => s + q[0], 0) / pts.length, my = pts.reduce((s, q) => s + q[1], 0) / pts.length;
        let rx = 0.15, ry = 0.15;
        for (const q of pts) { rx = Math.max(rx, Math.abs(q[0] - mx) + 0.15); ry = Math.max(ry, Math.abs(q[1] - my) + 0.18); }
        ctx.save(); ctx.fillStyle = EM.alpha(CLS[cls], 0.1); ctx.strokeStyle = EM.alpha(CLS[cls], 0.5); ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const a = (i / 60) * 2 * Math.PI; ctx.lineTo(plot.X(Math.pow(10, mx + rx * Math.cos(a))), plot.Y(Math.pow(10, my + ry * Math.sin(a)))); }
        ctx.fill(); ctx.stroke(); ctx.restore();
      }
      /* línea guía */
      let above = [];
      if (A.guide) {
        const n = p.slope;
        /* log y = n log x + c */
        const c = p.pos * n;
        const f = (x) => Math.pow(10, n * Math.log10(x) + c);
        plot.fn(f, { color: '--accent', width: 2, dash: [7, 4] });
        above = MAT.db.filter((m) => A.y(m) > f(A.x(m))).map((m) => m.name);
        const idx = p.ax === 'E-rho' ? ['E/ρ', 'E^{1/2}/ρ', 'E^{1/3}/ρ'][n - 1] : ['σ/ρ', 'σ^{2/3}/ρ', 'σ^{1/2}/ρ'][n - 1];
        EM.text(ctx, 'índice ' + idx + ' constante', plot.ix + 8, plot.iy + 14, { size: 12, color: '--accent', halo: true });
      }
      MAT.db.forEach((m, i) => {
        const xv = A.x(m), yv = A.y(m);
        if (!(xv > 0 && yv > 0)) return;
        plot.dot(xv, yv, { color: CLS[m.cls], r: i === hover ? 6.5 : 4 });
      });
      if (hover >= 0) {
        const m = MAT.db[hover];
        plot.label(A.x(m), A.y(m), m.name, { dx: 9, dy: -8, color: '--ink', size: 12 });
        sim.set('sel', `${m.name}: E = ${m.E} GPa · ρ = ${m.rho} kg/m³ · σ = ${m.sy} MPa · K<sub>Ic</sub> = ${m.KIc} MPa√m · k = ${m.k} W/m·K`);
      } else sim.set('sel', '— pase el puntero sobre un punto');
      sim.set('above', A.guide ? (above.length ? above.length + ': ' + above.slice(0, 8).join(', ') + (above.length > 8 ? '…' : '') : 'ninguno') : '— (la línea guía solo aplica a los mapas contra densidad)');
    });
  });
})();
