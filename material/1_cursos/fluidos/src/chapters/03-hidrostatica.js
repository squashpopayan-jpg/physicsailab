/* Capítulo 3 — Hidrostática */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;

  /* 3.1 Manómetro en U e inclinado */
  const MF = { agua: ['Agua', 998.2, '--water'], mercurio: ['Mercurio', 13546, '--c6'], aceite: ['Aceite manométrico (0.827)', 827, '--c2'] };
  EM.defineSim('manometro', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.seg('tipo', { label: 'Manómetro', options: [['U', 'Tubo en U'], ['inc', 'Inclinado con depósito']], value: 'U' });
    sim.select('m', { label: 'Líquido manométrico', options: Object.entries(MF).map(([k, v]) => [k, v[0]]), value: 'agua' });
    sim.slider('pg', { label: 'Presión manométrica del tanque', min: -10, max: 40, step: 0.1, value: 4, unit: 'kPa', fmt: (v) => v.toFixed(1) });
    sim.slider('th', { label: 'Inclinación de la rama de lectura', min: 5, max: 90, step: 1, value: 20, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('h', 'Desnivel vertical <i>h</i>', { hl: true });
    sim.out('L', 'Lectura a lo largo del tubo');
    sim.out('pa', 'Presión absoluta en Popayán');
    const sync = () => sim.ctl.th.show(sim.p.tipo === 'inc');
    sim.onChange = sync; sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, mf = MF[p.m];
      EM.draw.clear(cv);
      const h = (p.pg * 1000) / (mf[1] * g); /* m */
      const inc = p.tipo === 'inc', th = inc ? (p.th * Math.PI) / 180 : Math.PI / 2;
      const s = inc ? h / Math.sin(th) : h / 2; /* recorrido a lo largo de la rama derecha */
      const scale = Math.min(H * 0.32 / 0.45, 900); /* px por metro */
      const ox = W * 0.2, base = H * 0.86, rest = H * 0.55;
      /* tanque de gas */
      ctx.fillStyle = EM.alpha('--c5', 0.12); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
      ctx.fillRect(18, H * 0.1, ox - 50, H * 0.42); ctx.strokeRect(18, H * 0.1, ox - 50, H * 0.42);
      EM.text(ctx, 'gas', 18 + (ox - 50) / 2, H * 0.3, { size: 13, align: 'center', color: '--c5' });
      EM.text(ctx, EM.fix(p.pg, 1) + ' kPa man.', 18 + (ox - 50) / 2, H * 0.3 + 18, { size: 11.5, align: 'center', color: '--ink-2' });
      const tw = 10;
      /* rama izquierda */
      const lx = ox;
      const leftLevel = inc ? rest : rest + (h / 2) * scale; /* píxeles (y crece hacia abajo) */
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(18 + ox - 50, H * 0.2); ctx.lineTo(lx - tw / 2, H * 0.2); ctx.stroke();
      if (inc) {
        /* depósito ancho */
        const rw = 60;
        ctx.fillStyle = EM.alpha(mf[2], 0.45); ctx.fillRect(lx - rw / 2, leftLevel, rw, base - leftLevel);
        ctx.strokeRect(lx - rw / 2, H * 0.2, rw, base - H * 0.2);
        /* rama inclinada desde la base del depósito */
        const x0 = lx + rw / 2, y0 = base - 6, Ltot = Math.min((W - x0 - 30) / Math.cos(th || 1e-6), (y0 - 20) / Math.sin(th));
        const ux = Math.cos(th), uy = -Math.sin(th);
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = EM.alpha('--ink-2', 0.6); ctx.lineWidth = tw + 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + ux * Ltot, y0 + uy * Ltot); ctx.stroke();
        ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = tw; ctx.stroke();
        /* líquido: hasta el nivel de reposo (vertical rest-?) más el recorrido s */
        const s0 = (y0 - leftLevel) / Math.sin(th), sl = Math.max(0, Math.min(Ltot, s0 + s * scale));
        ctx.strokeStyle = EM.alpha(mf[2], 0.75); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + ux * sl, y0 + uy * sl); ctx.stroke();
        ctx.restore();
        const ex = x0 + ux * Math.min(Ltot, s0), ey = y0 + uy * Math.min(Ltot, s0);
        ctx.setLineDash([4, 3]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx - rw / 2, leftLevel); ctx.lineTo(ex + 20, ey); ctx.stroke(); ctx.setLineDash([]);
        EM.text(ctx, 'nivel de cero', ex + 24, ey + 4, { size: 11, color: '--ink-3' });
        const fx = x0 + ux * sl, fy = y0 + uy * sl;
        EM.draw.arrow(ctx, ex + 14 * uy, ey - 14 * ux, fx + 14 * uy, fy - 14 * ux, { color: '--accent', width: 1.6 });
        EM.text(ctx, 'L = ' + EM.fix(s * 1000, 1) + ' mm', (ex + fx) / 2 + 22 * uy, (ey + fy) / 2 - 22 * ux, { size: 12, color: '--accent', halo: true });
      } else {
        const rx = lx + 120, rightLevel = rest - (h / 2) * scale;
        ctx.fillStyle = EM.alpha(mf[2], 0.55);
        ctx.fillRect(lx - tw / 2, Math.min(leftLevel, base), tw, base - Math.min(leftLevel, base));
        ctx.fillRect(rx - tw / 2, Math.min(rightLevel, base), tw, base - Math.min(rightLevel, base));
        ctx.fillRect(lx - tw / 2, base, rx - lx + tw, tw);
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(lx - tw / 2, H * 0.2); ctx.lineTo(lx - tw / 2, base + tw); ctx.lineTo(rx + tw / 2, base + tw); ctx.lineTo(rx + tw / 2, 20);
        ctx.moveTo(lx + tw / 2, H * 0.2 + 6); ctx.lineTo(lx + tw / 2, base); ctx.lineTo(rx - tw / 2, base); ctx.lineTo(rx - tw / 2, 20); ctx.stroke();
        ctx.setLineDash([4, 3]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lx - 30, leftLevel); ctx.lineTo(rx + 40, leftLevel); ctx.moveTo(lx - 30, rightLevel); ctx.lineTo(rx + 40, rightLevel); ctx.stroke(); ctx.setLineDash([]);
        EM.draw.arrow(ctx, rx + 34, leftLevel, rx + 34, rightLevel, { color: '--accent', width: 1.6 });
        EM.text(ctx, 'h = ' + EM.fix(h * 1000, 1) + ' mm', rx + 42, (leftLevel + rightLevel) / 2, { size: 12, color: '--accent', baseline: 'middle', halo: true });
        EM.text(ctx, 'abierto a la atmósfera', rx, 14, { size: 11, align: 'center', color: '--ink-3' });
      }
      sim.set('h', EM.fix(h * 1000, 1) + ' mm');
      sim.set('L', EM.fix(s * 1000 * (inc ? 1 : 2), 1) + ' mm' + (inc ? ' (amplificación ' + EM.fix(1 / Math.sin(th), 2) + '×)' : ' (suma de ambas ramas)'));
      sim.set('pa', EM.fix(81.9 + p.pg, 1) + ' kPa');
    });
  });

  /* 3.2 Prensa hidráulica */
  EM.defineSim('prensa-hidraulica', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('d1', { label: 'Diámetro del pistón pequeño', min: 1, max: 10, step: 0.5, value: 2, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('d2', { label: 'Diámetro del pistón grande', min: 5, max: 40, step: 1, value: 30, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Masa sobre el pistón grande', min: 50, max: 3000, step: 10, value: 1500, unit: 'kg', fmt: (v) => v.toFixed(0) });
    sim.slider('x', { label: 'Recorrido del pistón pequeño', min: 0, max: 40, step: 0.5, value: 10, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.out('F1', 'Fuerza en el pistón pequeño', { hl: true });
    sim.out('p', 'Presión del líquido');
    sim.out('x2', 'Ascenso del pistón grande');
    sim.out('W', 'Trabajo de entrada = salida');
    let t = 0;
    sim.animate((dt) => { t += dt; sim.ctl.x.set(20 + 20 * Math.sin(0.8 * t), true); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const A1 = (Math.PI * Math.pow(p.d1 / 100, 2)) / 4, A2 = (Math.PI * Math.pow(p.d2 / 100, 2)) / 4;
      const F2 = p.m * g, pr = F2 / A2, F1 = pr * A1, x2 = (p.x / 100) * (A1 / A2);
      const s = Math.min((W * 0.32) / 0.4, 500), base = H - 30, top = 60;
      const c1 = W * 0.18, c2 = W * 0.52, w1 = Math.max(6, (p.d1 / 100) * s), w2 = (p.d2 / 100) * s;
      const y1 = top + 30 + (p.x / 100) * s * 0.5, y2 = top + 110 - x2 * s * 30;
      ctx.fillStyle = EM.alpha('--gold', 0.35);
      ctx.fillRect(c1 - w1 / 2, y1, w1, base - y1); ctx.fillRect(c2 - w2 / 2, y2, w2, base - y2); ctx.fillRect(c1 - w1 / 2, base - 24, c2 - c1, 24);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c1 - w1 / 2, top); ctx.lineTo(c1 - w1 / 2, base); ctx.lineTo(c2 + w2 / 2, base); ctx.lineTo(c2 + w2 / 2, top + 40);
      ctx.moveTo(c1 + w1 / 2, top); ctx.lineTo(c1 + w1 / 2, base - 24); ctx.lineTo(c2 - w2 / 2, base - 24); ctx.lineTo(c2 - w2 / 2, top + 40); ctx.stroke();
      ctx.fillStyle = EM.col('--solid'); ctx.fillRect(c1 - w1 / 2, y1 - 8, w1, 8); ctx.fillRect(c2 - w2 / 2, y2 - 10, w2, 10);
      EM.draw.block(ctx, c2, y2 - 32, Math.min(w2 * 1.3, 120), 44, { fill: '--c1', label: EM.fix(p.m, 0) + ' kg' });
      EM.draw.arrow(ctx, c1, y1 - 50, c1, y1 - 10, { color: '--accent', width: 2.4 });
      EM.text(ctx, 'F₁ = ' + EM.fix(F1, 1) + ' N', c1 + 10, y1 - 34, { size: 12, color: '--accent', halo: true });
      /* barras de trabajo */
      const bx = W * 0.74, bw = W * 0.22, Wk = F1 * (p.x / 100);
      EM.text(ctx, 'Trabajo (J)', bx, 24, { size: 12, weight: 650, color: '--ink-2' });
      const mxW = F1 * 0.4, bh = H - 80; /* trabajo con el recorrido máximo de 40 cm */
      const bars = [['entrada F₁x₁', Wk, '--accent'], ['salida F₂x₂', F2 * x2, '--c1']];
      bars.forEach(([n, v, c], i) => { const hh = Math.min(bh, (v / mxW) * bh); const x = bx + i * (bw / 2) + 6; ctx.fillStyle = EM.alpha(c, 0.6); ctx.fillRect(x, 40 + bh - hh, bw / 2 - 12, hh); EM.text(ctx, n, x + (bw / 2 - 12) / 2, H - 22, { size: 11, align: 'center', color: c }); EM.text(ctx, EM.fix(v, 1), x + (bw / 2 - 12) / 2, 34 + bh - hh, { size: 11, align: 'center' }); });
      sim.set('F1', EM.fix(F1, 1) + ' N (como levantar ' + EM.fix(F1 / g, 2) + ' kg)');
      sim.set('p', EM.fix(pr / 1000, 1) + ' kPa');
      sim.set('x2', EM.fix(x2 * 1000, 2) + ' mm (cociente de áreas ' + EM.fix(A2 / A1, 1) + ')');
      sim.set('W', EM.fix(Wk, 2) + ' J');
    });
  });

  /* 3.3 Atmósfera estándar */
  EM.defineSim('barometro-atm', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('z', { label: 'Altitud', min: 0, max: 30000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.check('iso', { label: 'Mostrar el modelo isotérmico (288 K)', value: true });
    sim.out('P', 'Presión (US 1976)', { hl: true });
    sim.out('T', 'Temperatura');
    sim.out('rho', 'Densidad del aire');
    sim.out('Pi', 'Modelo isotérmico');
    const PL = [['Popayán', 1760], ['Bogotá', 2640], ['Nevado del Huila', 5364], ['Everest', 8849], ['avión de línea', 11000]];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const a = FL.atm(p.z);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 105, ymin: 0, ymax: 30, xlabel: 'p (kPa)', ylabel: 'z (km)' });
      pl.frame();
      const zs = EM.M.linspace(0, 30000, 301);
      pl.xy(zs.map((z) => FL.atm(z).P / 1000), zs.map((z) => z / 1000), { color: '--c1', width: 2.4 });
      if (p.iso) pl.xy(zs.map((z) => FL.atmIso(z) / 1000), zs.map((z) => z / 1000), { color: '--c1', width: 1.4, dash: [5, 4] });
      for (const [n, z] of PL) pl.dot(FL.atm(z).P / 1000, z / 1000, { color: '--ink-3', r: 3, label: n });
      pl.dot(a.P / 1000, p.z / 1000, { color: '--accent', r: 6 });
      const p2 = new EM.Plot(ctx, { x: W * 0.42, y: 0, w: W * 0.3, h: H, xmin: 200, xmax: 300, ymin: 0, ymax: 30, xlabel: 'T (K)', ylabel: '', ml: 34 });
      p2.frame();
      p2.xy(zs.map((z) => FL.atm(z).T), zs.map((z) => z / 1000), { color: '--c2', width: 2.4 });
      p2.dot(a.T, p.z / 1000, { color: '--accent', r: 6 });
      /* columnas barométricas */
      const bx = W * 0.76, top = 30, bot = H - 30, hm = bot - top;
      const hHg = a.P / (13595.1 * g), hW = a.P / (998.2 * g);
      const col = (x, h, hmax, c, n) => { ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.strokeRect(x, top, 18, hm); const hh = (h / hmax) * hm; ctx.fillStyle = EM.alpha(c, 0.6); ctx.fillRect(x + 1, bot - hh, 16, hh); EM.text(ctx, n, x + 9, bot + 16, { size: 11, align: 'center', color: c }); EM.text(ctx, h < 1.5 ? EM.fix(h * 1000, 0) + ' mm' : EM.fix(h, 2) + ' m', x + 22, bot - hh + 4, { size: 11.5, color: '--ink' }); };
      col(bx, hHg, 0.8, '--c6', 'Hg'); col(bx + W * 0.11, hW, 10.6, '--water', 'agua');
      EM.text(ctx, 'escalas distintas', bx + W * 0.06, 16, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('P', EM.fix(a.P / 1000, 2) + ' kPa (' + EM.fix(a.P / 101325, 3) + ' atm)');
      sim.set('T', EM.fix(a.T, 2) + ' K = ' + EM.fix(a.T - 273.15, 1) + ' °C');
      sim.set('rho', EM.fix(a.rho, 4) + ' kg/m³');
      sim.set('Pi', EM.fix(FL.atmIso(p.z) / 1000, 2) + ' kPa');
    });
  });

  /* 3.4 Tanque acelerado y en rotación */
  EM.defineSim('tanque-rotante', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.seg('mode', { label: 'Movimiento', options: [['rot', 'Rotación'], ['acc', 'Aceleración horizontal']], value: 'rot' });
    sim.slider('w', { label: 'Velocidad de giro', min: 0, max: 300, step: 1, value: 150, unit: 'rpm', fmt: (v) => v.toFixed(0) });
    sim.slider('a', { label: 'Aceleración', min: -8, max: 8, step: 0.1, value: 3, unit: 'm/s²', fmt: (v) => v.toFixed(1) });
    sim.slider('H0', { label: 'Profundidad en reposo', min: 0.05, max: 0.4, step: 0.01, value: 0.25, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.out('d', 'Desnivel de la superficie', { hl: true });
    sim.out('pc', 'Presión manométrica en el fondo (centro · pared derecha)');
    sim.out('st', 'Estado');
    const sync = () => { sim.ctl.w.show(sim.p.mode === 'rot'); sim.ctl.a.show(sim.p.mode === 'acc'); };
    sim.onChange = sync; sync();
    let ph = 0;
    sim.animate((dt) => { ph += dt * (sim.p.mode === 'rot' ? (sim.p.w * 2 * Math.PI) / 60 : 0); });
    const R = 0.15, Ht = 0.5, rho = 998.2;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const sc = Math.min((W * 0.8) / (2 * R), (H - 50) / Ht), cx = W / 2, by = H - 24;
      const X = (x) => cx + x * sc, Y = (z) => by - z * sc;
      let zs, info = 'normal';
      if (p.mode === 'rot') {
        const w = (p.w * 2 * Math.PI) / 60, k = (w * w) / (2 * g);
        let z0 = p.H0 - (k * R * R) / 2, r0 = 0;
        if (z0 < 0) { r0 = Math.sqrt(Math.max(0, R * R - (2 * R * Math.sqrt(g * p.H0)) / Math.max(w, 1e-9))); z0 = -k * r0 * r0; info = 'el centro del fondo queda seco'; }
        zs = (x) => z0 + k * x * x;
        if (zs(R) > Ht) info = 'el agua se derrama por el borde';
        sim.set('d', EM.fix((zs(R) - Math.max(0, zs(0))) * 100, 2) + ' cm (centro ' + EM.fix(Math.max(0, zs(0)) * 100, 2) + ' cm, pared ' + EM.fix(Math.min(Ht, zs(R)) * 100, 2) + ' cm)');
      } else {
        const s = p.a / g;
        zs = (x) => p.H0 - s * x;
        if (zs(R) < 0 || zs(-R) < 0) info = 'parte del fondo queda seco (aprox.)';
        if (zs(-R) > Ht || zs(R) > Ht) info = 'el agua se derrama';
        sim.set('d', EM.fix(2 * R * Math.abs(s) * 100, 2) + ' cm entre paredes (θ = ' + EM.fix((Math.atan(Math.abs(s)) * 180) / Math.PI, 1) + '°)');
      }
      /* agua */
      const pts = [[X(-R), Y(0)]];
      for (let i = 0; i <= 120; i++) { const x = -R + (2 * R * i) / 120; pts.push([X(x), Y(Math.max(0, Math.min(Ht, zs(x))))]); }
      pts.push([X(R), Y(0)]);
      EM.flow.waterFill(ctx, pts, { alpha: 0.35 });
      ctx.strokeStyle = EM.col('--water'); ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 1; i < pts.length - 1; i++) { if (i === 1) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]); }
      ctx.stroke();
      /* isobaras cada 0.5 kPa */
      ctx.save(); ctx.beginPath(); ctx.rect(X(-R), Y(Ht), 2 * R * sc, Ht * sc); ctx.clip();
      ctx.strokeStyle = EM.alpha('--ink-2', 0.45); ctx.lineWidth = 1;
      for (let dp = 500; dp < 6000; dp += 500) {
        const dz = dp / (rho * g);
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i <= 120; i++) { const x = -R + (2 * R * i) / 120, z = zs(x) - dz; if (z < 0 || zs(x) < 0) { pen = false; continue; } if (!pen) { ctx.moveTo(X(x), Y(z)); pen = true; } else ctx.lineTo(X(x), Y(z)); }
        ctx.stroke();
      }
      ctx.restore();
      EM.flow.tank(ctx, X(-R), Y(Ht), 2 * R * sc, Ht * sc, { width: 2.4 });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(-R), Y(p.H0)); ctx.lineTo(X(R), Y(p.H0)); ctx.stroke(); ctx.setLineDash([]);
      if (p.mode === 'rot') {
        ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(cx, Y(Ht) - 10); ctx.lineTo(cx, by + 10); ctx.stroke(); ctx.setLineDash([]);
        /* marcas que giran (proyección) */
        for (let k = 0; k < 6; k++) { const a = ph + (k * Math.PI) / 3, x = R * 0.85 * Math.cos(a); if (Math.sin(a) < 0) continue; ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(X(x), Y(Math.max(0, zs(x))) + 4, 3, 0, 7); ctx.fill(); }
      } else EM.draw.arrow(ctx, cx - 40, Y(Ht) - 14, cx - 40 + Math.sign(p.a) * 60, Y(Ht) - 14, { color: '--accent', width: 2.2 });
      const pb = (x) => (Math.max(0, zs(x)) * rho * g) / 1000;
      sim.set('pc', EM.fix(pb(0), 3) + ' · ' + EM.fix(pb(R), 3) + ' kPa');
      sim.set('st', info);
    });
  });
})();
