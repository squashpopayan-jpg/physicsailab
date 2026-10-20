/* Capítulo 4 — Fuerzas sobre superficies y flotación */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g;
  const RW = 998.2;

  /* 4.1 Compuerta plana inclinada */
  EM.defineSim('compuerta', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.seg('sh', { label: 'Forma', options: [['rect', 'Rectángulo'], ['circ', 'Círculo'], ['tri', 'Triángulo']], value: 'rect' });
    sim.slider('b', { label: 'Ancho <i>b</i> (o diámetro)', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Longitud a lo largo de la placa <i>L</i>', min: 0.5, max: 5, step: 0.1, value: 3, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('th', { label: 'Inclinación respecto a la horizontal θ', min: 15, max: 90, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('h0', { label: 'Profundidad del borde superior', min: 0, max: 10, step: 0.1, value: 1, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.out('F', 'Fuerza hidrostática', { hl: true });
    sim.out('cp', 'Centro de presión bajo el centroide');
    sim.out('hcp', 'Profundidad del centroide · del centro de presión');
    sim.out('Fb', 'Fuerza en el borde inferior (bisagra arriba)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const shape = p.sh === 'circ' ? FL.SHAPES.circ(p.b) : FL.SHAPES[p.sh](p.b, p.L);
      const Lg = p.sh === 'circ' ? p.b : p.L, th = (p.th * Math.PI) / 180;
      const r = FL.gate(shape, p.h0, th, RW);
      const depthMax = p.h0 + Lg * Math.sin(th) + 0.8, wid = Lg * Math.cos(th) + 4;
      const v = EM.flow.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -2.5, wid, -depthMax, 0.6);
      EM.flow.waterRect(ctx, v.X(-2.5), v.Y(0), v.X(wid) - v.X(-2.5), v.Y(-depthMax) - v.Y(0));
      const x0 = 0, z0 = -p.h0, x1 = x0 + Lg * Math.cos(th), z1 = z0 - Lg * Math.sin(th);
      /* prisma de presiones normal a la placa (del lado del agua) */
      const n = [-Math.sin(th), -Math.cos(th)]; /* normal hacia el agua (izquierda-arriba) */
      const kP = 1.6 / (RW * g * Math.max(1, -z1)); /* m por Pa */
      ctx.fillStyle = EM.alpha('--c2', 0.12); ctx.strokeStyle = EM.alpha('--c2', 0.8); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(v.X(x0), v.Y(z0));
      for (let i = 0; i <= 20; i++) { const s = i / 20, x = x0 + s * (x1 - x0), z = z0 + s * (z1 - z0), pr = RW * g * -z; ctx.lineTo(v.X(x + n[0] * pr * kP), v.Y(z + n[1] * pr * kP)); }
      ctx.lineTo(v.X(x1), v.Y(z1)); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = 1; i <= 8; i++) { const s = i / 9, x = x0 + s * (x1 - x0), z = z0 + s * (z1 - z0), pr = RW * g * -z; EM.draw.arrow(ctx, v.X(x + n[0] * pr * kP), v.Y(z + n[1] * pr * kP), v.X(x), v.Y(z), { color: '--c2', width: 1.2, head: 5 }); }
      /* compuerta */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(v.X(x0), v.Y(z0)); ctx.lineTo(v.X(x1), v.Y(z1)); ctx.stroke();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(x0), v.Y(z0), 6, 0, 7); ctx.fill();
      /* centroide y centro de presión */
      const sc = (r.yc - p.h0 / Math.sin(th)), sp = (r.ycp - p.h0 / Math.sin(th));
      const C = [x0 + sc * Math.cos(th), z0 - sc * Math.sin(th)], P = [x0 + sp * Math.cos(th), z0 - sp * Math.sin(th)];
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(v.X(C[0]), v.Y(C[1]), 5, 0, 7); ctx.fill();
      EM.text(ctx, 'centroide', v.X(C[0]) + 10, v.Y(C[1]) - 6, { size: 11.5, color: '--c1', halo: true });
      EM.draw.arrow(ctx, v.X(P[0] + n[0] * 1.6), v.Y(P[1] + n[1] * 1.6), v.X(P[0]), v.Y(P[1]), { color: '--accent', width: 3.2, head: 12 });
      EM.text(ctx, 'F = ' + EM.fix(r.F / 1000, 1) + ' kN', v.X(P[0] + n[0] * 1.6) - 6, v.Y(P[1] + n[1] * 1.6) - 8, { size: 12.5, color: '--accent', align: 'right', halo: true, weight: 650 });
      EM.text(ctx, 'bisagra', v.X(x0) + 10, v.Y(z0) - 8, { size: 11, color: '--ink-2', halo: true });
      const Fb = (r.F * sp) / Lg;
      sim.set('F', EM.fix(r.F / 1000, 2) + ' kN');
      sim.set('cp', EM.fix(r.dy, 4) + ' m a lo largo de la placa');
      sim.set('hcp', EM.fix(r.hc, 3) + ' m · ' + EM.fix(r.hcp, 3) + ' m');
      sim.set('Fb', EM.fix(Fb / 1000, 2) + ' kN');
    });
  });

  /* 4.2 Presa de gravedad */
  EM.defineSim('presa', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('H', { label: 'Altura del agua <i>H</i>', min: 5, max: 30, step: 0.5, value: 30, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('b', { label: 'Ancho de la base', min: 10, max: 40, step: 0.5, value: 24, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('c', { label: 'Ancho de la corona', min: 0, max: 8, step: 0.5, value: 0, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.seg('up', { label: 'Subpresión', options: [['0', 'Ninguna'], ['full', 'Completa'], ['dren', 'Con drenaje']], value: 'full' });
    sim.slider('mu', { label: 'Coeficiente de fricción concreto–roca', min: 0.4, max: 0.9, step: 0.05, value: 0.7, fmt: (v) => v.toFixed(2) });
    sim.out('fsv', 'Factor de seguridad al volcamiento', { hl: true });
    sim.out('fsd', 'Factor de seguridad al deslizamiento');
    sim.out('e', 'Resultante sobre la base (desde el talón)');
    sim.out('F', 'Empuje · peso · subpresión (kN por m)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hc = cv.h;
      EM.draw.clear(cv);
      const Hd = 32, rc = 2400, H = p.H, b = Math.max(p.b, p.c + 1), c = p.c;
      const Wr = rc * g * c * Hd, Wt = rc * g * 0.5 * (b - c) * Hd, Wd = Wr + Wt, xW = (Wr * (c / 2) + Wt * (c + (b - c) / 3)) / Wd;
      const FH = (RW * g * H * H) / 2;
      /* subpresión: distribución lineal por tramos */
      const pu = (x) => { const ph = RW * g * H; if (p.up === '0') return 0; if (p.up === 'full') return ph * (1 - x / b); const xd = 0.12 * b; return x < xd ? ph - (ph - ph / 3) * (x / xd) : (ph / 3) * (1 - (x - xd) / (b - xd)); };
      let U = 0, MU = 0; const n = 200;
      for (let i = 0; i < n; i++) { const x = ((i + 0.5) * b) / n, f = (pu(x) * b) / n; U += f; MU += f * x; }
      const xU = U > 0 ? MU / U : 0;
      /* momentos respecto al pie (x = b) */
      const Mst = Wd * (b - xW), Mov = FH * (H / 3) + U * (b - xU);
      const fsv = Mst / Mov, fsd = (p.mu * (Wd - U)) / FH;
      const xR = b - (Mst - Mov) / Math.max(1, Wd - U); /* punto de corte de la resultante desde el talón */
      const v = EM.flow.view({ x: 20, y: 10, w: W - 40, h: Hc - 40 }, -18, b + 12, -8, Hd + 2);
      /* agua aguas arriba */
      EM.flow.waterRect(ctx, v.X(-18), v.Y(H), v.X(0) - v.X(-18), v.Y(0) - v.Y(H));
      ctx.fillStyle = EM.alpha('--sand', 0.35); ctx.fillRect(v.X(-18), v.Y(0), v.X(b + 12) - v.X(-18), v.Y(-8) - v.Y(0));
      EM.flow.solidPoly(ctx, [[v.X(0), v.Y(0)], [v.X(b), v.Y(0)], [v.X(c), v.Y(Hd)], [v.X(0), v.Y(Hd)]], { fill: '--solid' });
      /* diagrama de subpresión bajo la base */
      if (p.up !== '0') {
        const ks = 6 / (RW * g * 30);
        ctx.fillStyle = EM.alpha('--c5', 0.25); ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0));
        for (let i = 0; i <= 40; i++) { const x = (i * b) / 40; ctx.lineTo(v.X(x), v.Y(-pu(x) * ks)); }
        ctx.lineTo(v.X(b), v.Y(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
        EM.text(ctx, 'subpresión', v.X(b * 0.3), v.Y(-pu(b * 0.3) * ks) + 14, { size: 11, color: '--c5' });
      }
      /* fuerzas */
      EM.draw.arrow(ctx, v.X(-12), v.Y(H / 3), v.X(0), v.Y(H / 3), { color: '--c2', width: 2.6 });
      EM.text(ctx, 'F_H', v.X(-12), v.Y(H / 3) - 8, { size: 12, color: '--c2', weight: 650 });
      EM.draw.arrow(ctx, v.X(xW), v.Y(Hd * 0.35), v.X(xW), v.Y(Hd * 0.35 - 9), { color: '--c1', width: 2.6 });
      EM.text(ctx, 'W', v.X(xW) + 6, v.Y(Hd * 0.35) + 4, { size: 12, color: '--c1', weight: 650 });
      /* tercio central */
      ctx.fillStyle = EM.alpha('--c3', 0.35); ctx.fillRect(v.X(b / 3), v.Y(0) - 3, v.X((2 * b) / 3) - v.X(b / 3), 6);
      const ok = xR >= b / 3 && xR <= (2 * b) / 3;
      ctx.fillStyle = EM.col(ok ? '--c3' : '--c2'); ctx.beginPath(); ctx.arc(v.X(Math.min(b + 8, Math.max(-5, xR))), v.Y(0), 6, 0, 7); ctx.fill();
      EM.text(ctx, ok ? 'resultante en el tercio central' : 'resultante fuera del tercio central', v.X(b / 2), v.Y(0) + 32, { size: 11.5, align: 'center', color: ok ? '--c3' : '--c2', weight: 600 });
      sim.set('fsv', EM.fix(fsv, 2) + (fsv < 1.5 ? ' (insuficiente)' : ''));
      sim.set('fsd', EM.fix(fsd, 2) + (fsd < 1.5 ? ' (insuficiente)' : ''));
      sim.set('e', EM.fix(xR, 2) + ' m de ' + EM.fix(b, 1) + ' m');
      sim.set('F', EM.fix(FH / 1000, 0) + ' · ' + EM.fix(Wd / 1000, 0) + ' · ' + EM.fix(U / 1000, 0));
    });
  });

  /* 4.3 Arquímedes */
  const BOD = { corcho: ['Corcho', 240], pino: ['Madera de pino', 500], hielo: ['Hielo', 917], persona: ['Persona (pulmones llenos)', 985], persona2: ['Persona (tras exhalar)', 1060], aluminio: ['Aluminio', 2700], acero: ['Acero', 7850], oro: ['Oro', 19300] };
  const FLD = { agua: ['Agua dulce', 998.2], mar: ['Agua de mar', 1025], aceite: ['Aceite SAE 30', 891], glicerina: ['Glicerina', 1261], mercurio: ['Mercurio', 13546] };
  EM.defineSim('arquimedes', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('b', { label: 'Cuerpo', options: Object.entries(BOD).map(([k, v]) => [k, v[0] + ' (' + v[1] + ' kg/m³)']), value: 'hielo' });
    sim.select('f', { label: 'Fluido', options: Object.entries(FLD).map(([k, v]) => [k, v[0] + ' (' + v[1] + ' kg/m³)']), value: 'mar' });
    sim.slider('V', { label: 'Volumen del cuerpo', min: 0.1, max: 100, step: 0.1, value: 10, unit: 'L', log: true, fmt: (v) => v.toFixed(1) });
    sim.out('fr', 'Fracción sumergida', { hl: true });
    sim.out('E', 'Empuje · peso');
    sim.out('ap', 'Peso aparente (si se hunde)');
    let y = null, vy = 0;
    sim.onChange = () => { vy = 0; };
    sim.animate((dt) => {
      const p = sim.p, rb = BOD[p.b][1], rf = FLD[p.f][1], frac = rb / rf;
      const target = frac < 1 ? frac : 1.6;
      if (y === null) y = target;
      vy += (target - y) * 30 * dt - vy * 6 * dt; y += vy * dt;
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, rb = BOD[p.b][1], rf = FLD[p.f][1], frac = rb / rf, V = p.V / 1000;
      EM.draw.clear(cv);
      const sw = Math.min(W * 0.5, H * 0.95), tx = 20, ty = H * 0.25, th = H * 0.7;
      const col = p.f === 'mercurio' ? '--c6' : p.f === 'aceite' || p.f === 'glicerina' ? '--gold' : '--water';
      EM.flow.waterRect(ctx, tx, ty, sw, th, { color: col, alpha: 0.3 });
      EM.flow.tank(ctx, tx, ty - 30, sw, th + 30);
      const side = Math.min(th * 0.42, 40 + 50 * Math.cbrt(p.V / 10)), sub = Math.max(0, Math.min(1.6, y === null ? frac : y));
      let top = ty - side + sub * side;
      top = Math.min(top, ty + th - side - 1);
      EM.draw.block(ctx, tx + sw / 2, top + side / 2, side, side, { fill: p.b === 'hielo' ? '--c1' : p.b.startsWith('persona') ? '--c4' : p.b === 'oro' ? '--gold' : p.b === 'acero' || p.b === 'aluminio' ? '--c6' : '--sand', alpha: 0.8 });
      const Fw = rb * V * g, Fe = rf * Math.min(1, frac) * V * g, FeFull = rf * V * g;
      const sc = 50 / Math.max(Fw, FeFull);
      EM.draw.arrow(ctx, tx + sw / 2 - 12, top + side / 2, tx + sw / 2 - 12, top + side / 2 + Fw * sc, { color: '--c2', width: 2.4 });
      EM.draw.arrow(ctx, tx + sw / 2 + 12, top + side / 2, tx + sw / 2 + 12, top + side / 2 - (frac < 1 ? Fe : FeFull) * sc, { color: '--c1', width: 2.4 });
      EM.text(ctx, 'peso', tx + sw / 2 - 18, top + side / 2 + Fw * sc + 2, { size: 11, color: '--c2', align: 'right', halo: true });
      EM.text(ctx, 'empuje', tx + sw / 2 + 18, top + side / 2 - (frac < 1 ? Fe : FeFull) * sc, { size: 11, color: '--c1', halo: true });
      /* barra de fracción */
      const pl = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 1.2, ymin: 0, ymax: 1.25, xlabel: 'ρ_cuerpo/ρ_fluido', ylabel: 'fracción sumergida' });
      pl.frame();
      pl.fn((r) => Math.min(1, r), { color: '--c1', width: 2.2 });
      pl.vline(1, { label: 'se hunde', color: '--c2' });
      for (const [k, b] of Object.entries(BOD)) { const r = b[1] / rf; if (r <= 1.2) pl.dot(r, Math.min(1, r), { color: k === p.b ? '--accent' : '--ink-3', r: k === p.b ? 6 : 3 }); }
      sim.set('fr', frac < 1 ? EM.fix(100 * frac, 1) + ' %' : '100 % (se hunde)');
      sim.set('E', EM.fix(frac < 1 ? Fe : FeFull, 2) + ' N · ' + EM.fix(Fw, 2) + ' N');
      sim.set('ap', frac < 1 ? '— (flota)' : EM.fix(Fw - FeFull, 2) + ' N = ' + EM.fix((Fw - FeFull) / g, 3) + ' kg');
    });
  });

  /* 4.4 Estabilidad de un casco */
  const HULL = {
    barcaza: (b, D) => [[-b / 2, 0], [b / 2, 0], [b / 2, D], [-b / 2, D]],
    v: (b, D) => [[-b * 0.12, 0], [b * 0.12, 0], [b / 2, D * 0.55], [b / 2, D], [-b / 2, D], [-b / 2, D * 0.55]],
    canoa: (b, D) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + (Math.PI * i) / 24; pts.push([(b / 2) * Math.cos(a), (b / 2) * (1 + Math.sin(a)) * ((D * 0.6) / (b / 2))]); } pts.push([b / 2, D], [-b / 2, D]); return pts; }
  };
  EM.defineSim('metacentro', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('h', { label: 'Sección del casco', options: [['barcaza', 'Barcaza'], ['v', 'En V'], ['canoa', 'Redonda']], value: 'barcaza' });
    sim.slider('b', { label: 'Manga', min: 4, max: 20, step: 0.5, value: 10, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('D', { label: 'Puntal (altura del casco)', min: 2, max: 10, step: 0.1, value: 4, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('fr', { label: 'Fracción sumergida del área', min: 0.15, max: 0.85, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('KG', { label: 'Altura del centro de gravedad <i>KG</i>', min: 0.5, max: 8, step: 0.05, value: 3, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('phi', { label: 'Escora φ', min: 0, max: 90, step: 1, value: 20, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('GM', '<i>GM</i> (pendiente inicial de <i>GZ</i>)', { hl: true });
    sim.out('GZ', 'Brazo adrizante <i>GZ</i>(φ)');
    sim.out('mx', 'Máximo de <i>GZ</i> · ángulo de pérdida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const hull = HULL[p.h](p.b, p.D), G = [0, Math.min(p.KG, p.D * 2)];
      const curve = [];
      for (let d = 0; d <= 90; d += 2) curve.push([d, FL.gz(hull, p.fr, G, (d * Math.PI) / 180).GZ]);
      const GM = FL.gz(hull, p.fr, G, 1e-4).GZ / Math.sin(1e-4);
      let mx = -Infinity, amx = 0, van = null;
      for (let i = 0; i < curve.length; i++) { if (curve[i][1] > mx) { mx = curve[i][1]; amx = curve[i][0]; } if (i > 0 && van === null && curve[i - 1][1] > 0 && curve[i][1] <= 0) van = curve[i - 1][0] + (2 * curve[i - 1][1]) / (curve[i - 1][1] - curve[i][1]); }
      const phi = (p.phi * Math.PI) / 180, r = FL.gz(hull, p.fr, G, phi);
      /* dibujo del casco escorado */
      const ext = Math.max(p.b, p.D * 2) * 0.75;
      const v = EM.flow.view({ x: 6, y: 6, w: W * 0.48 - 12, h: H - 12 }, -ext, ext, r.yw - ext * 0.75, r.yw + ext * 0.85);
      EM.flow.waterRect(ctx, v.X(-ext), v.Y(r.yw), v.X(ext) - v.X(-ext), v.Y(r.yw - ext) - v.Y(r.yw));
      EM.flow.solidPoly(ctx, r.poly.map((q) => v.map(q)), { fill: EM.alpha('--c4', 0.3), color: '--ink-2', width: 1.6 });
      if (r.sub.length > 2) EM.flow.solidPoly(ctx, r.sub.map((q) => v.map(q)), { fill: EM.alpha('--water', 0.35), color: '--water', width: 1 });
      const B = r.B;
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(v.X(B[0]), v.Y(B[1]), 5, 0, 7); ctx.fill();
      EM.text(ctx, 'B', v.X(B[0]) + 7, v.Y(B[1]) + 14, { size: 13, weight: 700, color: '--c1', halo: true });
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v.X(G[0]), v.Y(G[1]), 5, 0, 7); ctx.fill();
      EM.text(ctx, 'G', v.X(G[0]) - 16, v.Y(G[1]) - 6, { size: 13, weight: 700, color: '--c2', halo: true });
      const L = 46;
      EM.draw.arrow(ctx, v.X(G[0]), v.Y(G[1]), v.X(G[0]), v.Y(G[1]) + L, { color: '--c2', width: 2.2 });
      EM.draw.arrow(ctx, v.X(B[0]), v.Y(B[1]), v.X(B[0]), v.Y(B[1]) - L, { color: '--c1', width: 2.2 });
      /* metacentro (pequeñas escoras): sobre la línea de crujía a GM sobre G */
      if (GM > 0 && p.phi < 30) { const Mx = G[0] + GM * Math.sin(phi), My = G[1] + GM * Math.cos(phi); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(v.X(Mx), v.Y(My), 5, 0, 7); ctx.stroke(); EM.text(ctx, 'M', v.X(Mx) + 8, v.Y(My), { size: 13, weight: 700, color: '--c3', halo: true }); }
      /* curva GZ */
      const ymax = Math.max(0.5, mx * 1.3), ymin = Math.min(-0.3, Math.min(...curve.map((c) => c[1])) * 1.1);
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 90, ymin, ymax, xlabel: 'escora φ (°)', ylabel: 'GZ (m)' });
      pl.frame();
      pl.fn((d) => GM * Math.sin((d * Math.PI) / 180), { color: '--c3', width: 1.4, dash: [5, 4], to: 40 });
      pl.path(curve, { color: '--accent', width: 2.6 });
      pl.dot(p.phi, r.GZ, { color: '--accent', r: 6 });
      pl.legend([{ label: 'GZ exacto (polígono)', color: '--accent' }, { label: 'GM sen φ', color: '--c3', dash: [5, 4] }], 'tr');
      sim.set('GM', EM.fix(GM, 3) + ' m' + (GM < 0 ? ' (inestable en posición recta)' : ''));
      sim.set('GZ', EM.fix(r.GZ, 3) + ' m' + (r.GZ < 0 ? ' (vuelca)' : ''));
      sim.set('mx', EM.fix(mx, 3) + ' m a ' + amx + '° · ' + (van ? EM.fix(van, 1) + '°' : '> 90°'));
    });
  });
})();
