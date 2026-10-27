/* Capítulo 15 — Newton y la luz; Römer y Bradley */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, K = C.K;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const rgb = (l, a) => { const c = C.wavelengthRGB(l); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')'; };

  /* 15.1 El prisma y el experimentum crucis */
  EM.defineSim('prisma-newton', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('A', { label: 'Ángulo del prisma', min: 30, max: 75, step: 1, value: 60, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('inc', { label: 'Giro del prisma (incidencia en la primera cara)', min: 25, max: 70, step: 0.5, value: 49, fmt: (v) => v.toFixed(1) + '°' });
    sim.seg('mod', { label: 'Experimento', options: [['uno', 'Un prisma'], ['crucis', 'Experimentum crucis'], ['inv', 'Prisma invertido']], value: 'uno' });
    sim.slider('lam', { label: 'Color elegido por la rendija (nm)', min: 400, max: 700, step: 5, value: 560, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.out('dr', 'Desviación del rojo (656 nm)', { hl: true });
    sim.out('dv', 'Desviación del violeta (405 nm)');
    sim.out('sp', 'Abanico (violeta − rojo)');
    sim.out('md', 'Desviación mínima del rojo y del violeta');
    sim.note('Newton (1666-1672): un prisma no «tiñe» la luz blanca: la separa, porque cada color se refracta con un índice distinto (dispersión). En el <em>experimentum crucis</em> una rendija deja pasar un solo color por un segundo prisma, y ese color <em>no cambia</em> ni se descompone más: los colores ya estaban en la luz blanca. Con un segundo prisma invertido, los rayos se recomponen y vuelve el blanco.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      EM.draw.clear(cv, EM.isDark() ? '#0B0E14' : '#13181F');
      const A = p.A * DEG, sc = H * 0.5, cx = W * 0.3, cy = H * 0.5;
      /* vértices del prisma (vértice hacia arriba) centrado en (cx,cy) con rotación de la entrada */
      const half = Math.tan(A / 2) * 0.5 * sc * 1.0;
      const hgt = sc * 0.9, bw = 2 * Math.tan(A / 2) * hgt;
      const apex = [cx, cy - hgt * 0.55], bl = [cx - bw / 2, cy + hgt * 0.45], br = [cx + bw / 2, cy + hgt * 0.45];
      ctx.fillStyle = 'rgba(160,200,230,0.18)'; ctx.strokeStyle = 'rgba(200,225,245,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(bl[0], bl[1]); ctx.lineTo(br[0], br[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      /* normales de las caras (hacia afuera) */
      const lf = [bl[0] - apex[0], bl[1] - apex[1]], rf = [br[0] - apex[0], br[1] - apex[1]];
      const nL = (() => { const l = Math.hypot(...lf); return [-lf[1] / l, lf[0] / l]; })(); /* izquierda: apunta hacia afuera (izq-abajo) */
      const nLo = nL[0] < 0 ? nL : [-nL[0], -nL[1]];
      const nR = (() => { const l = Math.hypot(...rf); return [rf[1] / l, -rf[0] / l]; })();
      const nRo = nR[0] > 0 ? nR : [-nR[0], -nR[1]];
      /* rayo entrante: dirección tal que forma incidencia p.inc con la normal de la cara izquierda */
      const nIn = [-nLo[0], -nLo[1]]; /* normal hacia el interior */
      const th0 = Math.atan2(nIn[1], nIn[0]), dir0 = [Math.cos(th0 - p.inc * DEG), Math.sin(th0 - p.inc * DEG)];
      const hitL = (t) => [apex[0] + lf[0] * t, apex[1] + lf[1] * t];
      const P1 = hitL(0.5);
      const src = [P1[0] - dir0[0] * W * 0.25, P1[1] - dir0[1] * W * 0.25];
      const lams = []; for (let l = 400; l <= 700; l += 10) lams.push(l);
      const pass = [], screenX = W * 0.9;
      lams.forEach((l) => {
        const n = C.cauchy(l);
        const d1 = C.refractVec(dir0, nLo, 1, n); if (!d1) return;
        /* intersección con la cara derecha: P1 + s d1 = apex + rf t */
        const det = d1[0] * -rf[1] - d1[1] * -rf[0], bx = apex[0] - P1[0], by = apex[1] - P1[1];
        const s = (bx * -rf[1] - by * -rf[0]) / det; const P2 = [P1[0] + s * d1[0], P1[1] + s * d1[1]];
        const d2 = C.refractVec(d1, [-nRo[0], -nRo[1]].map((v) => -v), n, 1); /* normal hacia el lado de donde viene el rayo = hacia dentro del vidrio */
        const dd = C.refractVec(d1, [-nRo[0], -nRo[1]], n, 1);
        if (!dd) return;
        pass.push({ l, P2, dd, n });
      });
      /* rayo blanco incidente */
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(src[0], src[1]); ctx.lineTo(P1[0], P1[1]); ctx.stroke();
      const dirAir = (q) => q.dd;
      const strike = (q, x0y0, dd, alpha, col) => { const L = (screenX - x0y0[0]) / dd[0]; ctx.strokeStyle = col || rgb(q.l, alpha); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x0y0[0], x0y0[1]); ctx.lineTo(x0y0[0] + L * dd[0], x0y0[1] + L * dd[1]); ctx.stroke(); return [x0y0[0] + L * dd[0], x0y0[1] + L * dd[1]]; };
      let dr = NaN, dv = NaN;
      const devOf = (dd) => { const a = Math.atan2(dir0[1], dir0[0]), b = Math.atan2(dd[1], dd[0]); return ((b - a) / DEG + 540) % 360 - 180; };
      if (p.mod === 'uno') {
        pass.forEach((q) => { strike(q, q.P2, q.dd, 0.95); if (q.l === 660) dr = devOf(q.dd); if (q.l === 400) dv = devOf(q.dd); });
      } else if (p.mod === 'crucis') {
        /* pantalla con rendija a mitad del abanico y segundo prisma idéntico */
        const sx = W * 0.55; let best = null;
        pass.forEach((q) => { const L = (sx - q.P2[0]) / q.dd[0], y = q.P2[1] + L * q.dd[1]; q.y = y; strike({ l: q.l }, q.P2, q.dd, 0.4); if (!best || Math.abs(q.l - p.lam) < Math.abs(best.l - p.lam)) best = q; });
        ctx.fillStyle = EM.alpha('--ink-3', 0.6); const ys = pass.map((q) => q.y), y0 = Math.min(...ys) - 8, y1 = Math.max(...ys) + 8;
        ctx.fillRect(sx - 3, 0, 6, best.y - 3 > 0 ? best.y - 3 : 0); ctx.fillRect(sx - 3, best.y + 3, 6, H);
        const q = best, L = (sx - q.P2[0]) / q.dd[0], hit = [sx, q.P2[1] + L * q.dd[1]];
        /* segundo prisma pequeño en x = 0.62W */
        const c2 = [W * 0.64, hit[1] + (screenX - sx) * 0.0 + 0], s2 = 0.28 * sc;
        const dd = [q.dd[0], q.dd[1]], n2 = q.n;
        ctx.fillStyle = 'rgba(160,200,230,0.18)'; ctx.strokeStyle = 'rgba(200,225,245,0.8)'; ctx.beginPath(); ctx.moveTo(c2[0] - s2 * 0.6, c2[1] + s2); ctx.lineTo(c2[0] + s2 * 0.6, c2[1] - s2 * 0.0 + s2 * 0); ctx.lineTo(c2[0] - s2 * 0.6, c2[1] - s2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = rgb(p.lam, 1); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hit[0], hit[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(screenX, c2[1] + (screenX - c2[0]) * dd[1] / dd[0] * 1.0); ctx.stroke();
        EM.text(ctx, 'rendija', sx, 14, { size: 11, color: '#cbd5e1', align: 'center' });
        dr = devOf(pass.find((z) => z.l === 660).dd); dv = devOf(pass.find((z) => z.l === 400).dd);
        EM.text(ctx, 'un solo color pasa por el 2.º prisma sin separarse', W * 0.78, H * 0.92, { size: 11.5, color: '#cbd5e1', align: 'center' });
      } else {
        /* prisma invertido: recompone el blanco; se dibuja un segundo prisma que anula la dispersión */
        pass.forEach((q) => { const e = strike(q, q.P2, q.dd, 0.4, rgb(q.l, 0.5)); });
        const xs = W * 0.58; let acc = [];
        pass.forEach((q) => { const L = (xs - q.P2[0]) / q.dd[0]; acc.push(q.P2[1] + L * q.dd[1]); });
        const ym = acc.reduce((a, b) => a + b, 0) / acc.length;
        ctx.fillStyle = 'rgba(160,200,230,0.18)'; ctx.strokeStyle = 'rgba(200,225,245,0.8)'; ctx.beginPath(); ctx.moveTo(xs, ym - sc * 0.5); ctx.lineTo(xs + sc * 0.4, ym); ctx.lineTo(xs, ym + sc * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(xs + sc * 0.4, ym); ctx.lineTo(screenX, ym); ctx.stroke();
        dr = devOf(pass.find((z) => z.l === 660).dd); dv = devOf(pass.find((z) => z.l === 400).dd);
        EM.text(ctx, 'luz blanca recompuesta', W * 0.78, ym - 14, { size: 11.5, color: '#e2e8f0', align: 'center' });
      }
      /* pantalla */
      ctx.strokeStyle = 'rgba(200,210,220,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(screenX, 4); ctx.lineTo(screenX, H - 4); ctx.stroke();
      const nr = C.cauchy(656), nv = C.cauchy(405);
      sim.set('dr', EM.fix(Math.abs(dr), 2) + '°'); sim.set('dv', EM.fix(Math.abs(dv), 2) + '°'); sim.set('sp', EM.fix(Math.abs(dv) - Math.abs(dr), 2) + '°');
      sim.set('md', EM.fix(C.minDeviation(nr, p.A), 2) + '° y ' + EM.fix(C.minDeviation(nv, p.A), 2) + '°  (n = ' + EM.fix(nr, 4) + ' y ' + EM.fix(nv, 4) + ')');
    });
  });

  /* 15.2 Anillos de Newton */
  EM.defineSim('anillos-newton', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('R', { label: 'Radio de curvatura de la lente', min: 0.2, max: 5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) + ' m' });
    sim.slider('lam', { label: 'Color de la luz', min: 400, max: 700, step: 5, value: 550, fmt: (v) => v.toFixed(0) + ' nm' });
    sim.check('blanca', { label: 'Luz blanca (todos los colores)', value: false });
    sim.out('r1', 'Radio del primer anillo oscuro', { hl: true });
    sim.out('r5', 'Radio del quinto anillo oscuro');
    sim.out('gap', 'Espesor del aire en el primer anillo brillante (λ/4)');
    sim.out('young', 'Young (1801): λ a partir del espesor y el orden');
    sim.note('Una lente convexa sobre un vidrio plano deja una cuña de aire; en la luz monocromática se ven anillos concéntricos: oscuros donde el espesor es un número entero de semilongitudes de onda, brillantes en los intermedios. Newton medió los espesores con micrómetros y propuso las «fases de fácil reflexión y transmisión». Young (1801) reinterpretó sus números con ondas, y a partir de ellos calculó las longitudes de onda de la luz.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv); ctx.fillStyle = '#0B0E14'; ctx.fillRect(0, 0, W * 0.5, H);
      const half = W * 0.5, cx = half * 0.5, cy = H * 0.5, rmax = Math.min(half, H) * 0.46;
      const img = ctx.createImageData(Math.floor(2 * rmax), Math.floor(2 * rmax));
      const scale = 0.0035 * (Math.sqrt(p.R)); /* radio físico máximo en metros */
      const lams = p.blanca ? [450, 520, 600, 650] : [p.lam];
      for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
        const x = (i - rmax) / rmax, y = (j - rmax) / rmax, rr = Math.hypot(x, y); if (rr > 1) continue;
        const r = rr * scale, d = (r * r) / (2 * p.R); /* espesor del aire */
        let R = 0, G = 0, B = 0;
        for (const l of lams) { const I = Math.pow(Math.sin((TAU * d * 1e9) / l), 2) ; const c = C.wavelengthRGB(l); const k = p.blanca ? 0.6 : 1; R += c[0] * I * k; G += c[1] * I * k; B += c[2] * I * k; }
        const o = (j * img.width + i) * 4; img.data[o] = Math.min(255, R); img.data[o + 1] = Math.min(255, G); img.data[o + 2] = Math.min(255, B); img.data[o + 3] = 255;
      }
      ctx.putImageData(img, Math.floor(cx - rmax), Math.floor(cy - rmax));
      /* gráfica de r_m² frente a m */
      const pl = new EM.Plot(ctx, { x: half + 10, y: 8, w: W - half - 16, h: H - 16, xmin: 0, xmax: 20, ymin: 0, ymax: 20 * p.lam * 1e-9 * p.R * 1e6 * 1.05, xlabel: 'orden m del anillo oscuro', ylabel: 'r² (mm²)' });
      pl.bg = null; pl.frame();
      pl.fn((m) => m * p.lam * 1e-9 * p.R * 1e6, { color: '--c1', width: 2 });
      for (let m = 1; m <= 20; m++) pl.dot(m, Math.pow(C.ringDark(m, p.lam, p.R), 2) * 1e6, { color: '--accent', r: 2.6 });
      sim.set('r1', EM.fix(C.ringDark(1, p.lam, p.R) * 1000, 3) + ' mm');
      sim.set('r5', EM.fix(C.ringDark(5, p.lam, p.R) * 1000, 3) + ' mm');
      sim.set('gap', EM.fix(p.lam / 4, 1) + ' nm');
      sim.set('young', 'λ = 2d/m = ' + EM.fix(C.wavelengthFromGap(p.lam / 2, 1), 0) + ' nm (con d = λ/2, m = 1)');
    });
  });

  /* 15.3 Römer y la velocidad de la luz */
  EM.defineSim('roemer', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('c', { label: 'Velocidad de la luz', min: 100000, max: 450000, step: 1000, value: 299792, fmt: (v) => v.toFixed(0) + ' km/s' });
    sim.slider('t', { label: 'Tiempo desde la oposición de Júpiter', min: 0, max: 0.55, step: 0.005, value: 0.3, fmt: (v) => (v * 12).toFixed(1) + ' meses' });
    sim.button('Römer (22 min)', () => sim.ctl.c.set(Math.round(C.romerC(138e6, 22))));
    sim.out('dl', 'Retraso acumulado del eclipse de Ío', { hl: true });
    sim.out('mx', 'Retraso máximo (≈ 2 UA/c)');
    sim.out('cc', 'c deducida de «22 minutos» y 1 UA = 138 millones de km (Cassini, 1672)');
    sim.note('Römer (1676) notó que los eclipses de Ío por Júpiter ocurrían <em>antes</em> de lo previsto cuando la Tierra estaba más cerca de Júpiter y <em>después</em> cuando estaba lejos: la luz tarda en cruzar la órbita terrestre. Predijo que el eclipse del 9 de noviembre de 1676 llegaría diez minutos tarde, y así fue. Estimó 22 minutos para cruzar la órbita (hoy 16.6) y con la UA de Cassini, c ≈ 2.1×10⁵ km/s.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const half = W * 0.38, cx = half * 0.52, cy = H * 0.5, sc = Math.min(half, H) * 0.42 / 6.2;
      ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy, 5.2026 * sc, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 1 * sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const t = p.t, E = [Math.cos(TAU * t), Math.sin(TAU * t)], J = [5.2026 * Math.cos(TAU * t / 11.862), 5.2026 * Math.sin(TAU * t / 11.862)];
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(cx + E[0] * sc, cy - E[1] * sc, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = EM.col('--c4'); ctx.beginPath(); ctx.arc(cx + J[0] * sc, cy - J[1] * sc, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = EM.alpha('--ray', 0.7); ctx.beginPath(); ctx.moveTo(cx + E[0] * sc, cy - E[1] * sc); ctx.lineTo(cx + J[0] * sc, cy - J[1] * sc); ctx.stroke();
      const pl = new EM.Plot(ctx, { x: half + 8, y: 6, w: W - half - 14, h: H - 12, xmin: 0, xmax: 0.55 * 12, ymin: -3, ymax: 20, xlabel: 'meses desde la oposición', ylabel: 'retraso (min)' });
      pl.frame();
      pl.fn((m) => C.romerDelay(m / 12, p.c), { color: '--c1', width: 2.2 });
      pl.fn((m) => C.romerDelay(m / 12, C.romerC(138e6, 22)), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.dot(t * 12, C.romerDelay(t, p.c), { color: '--accent', r: 6 });
      let mx = 0; for (let k = 0; k < 600; k++) mx = Math.max(mx, C.romerDelay((k / 600) * 1.5, p.c));
      sim.set('dl', EM.fix(C.romerDelay(t, p.c), 2) + ' min');
      sim.set('mx', EM.fix(mx, 1) + ' min  (2 UA/c = ' + EM.fix((2 * K.AU_km) / p.c / 60, 1) + ' min)');
      sim.set('cc', EM.sci(C.romerC(138e6, 22), 3) + ' km/s  (real: 2.998×10⁵)');
    });
  });

  /* 15.4 Bradley y la aberración */
  EM.defineSim('aberracion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('c', { label: 'Velocidad de la luz', min: 150000, max: 600000, step: 1000, value: 299792, fmt: (v) => v.toFixed(0) + ' km/s' });
    sim.slider('b', { label: 'Latitud eclíptica de la estrella', min: 0, max: 90, step: 1, value: 51.5, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('ph', { label: 'Época del año', min: 0, max: 1, step: 0.005, value: 0.15, fmt: (v) => (v * 12).toFixed(1) + ' meses' });
    sim.out('k', 'Constante de aberración κ = v/c', { hl: true });
    sim.out('c', 'c deducida de κ = 20.5″ y v = 29.78 km/s');
    sim.out('t', 'Tiempo que tarda la luz del Sol a la Tierra');
    sim.note('Bradley (1725-1728) buscaba la paralaje de γ Draconis con un sector zenital de 24 pies; halló un movimiento anual de 20″, pero en fase equivocada para ser paralaje (máximo cuando debía ser nulo). Lo explicó con el movimiento de la Tierra y la velocidad finita de la luz: hay que inclinar el telescopio como el paraguas bajo la lluvia, \\(\\tan\\alpha=v/c\\). Fue la primera prueba directa del movimiento orbital de la Tierra, y de paso confirmó a Römer.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, kappa = C.aberration(29.78, p.c);
      EM.draw.clear(cv);
      const half = W * 0.45, sc = Math.min(half, H) * 0.36 / 25;
      const cx = half * 0.52, cy = H * 0.5;
      ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.beginPath(); ctx.moveTo(cx - 28 * sc, cy); ctx.lineTo(cx + 28 * sc, cy); ctx.moveTo(cx, cy - 28 * sc); ctx.lineTo(cx, cy + 28 * sc); ctx.stroke();
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const q = C.aberrationPos((i / 100) * TAU, p.b, kappa); i ? ctx.lineTo(cx + q[0] * sc, cy - q[1] * sc) : ctx.moveTo(cx + q[0] * sc, cy - q[1] * sc); } ctx.stroke();
      const q = C.aberrationPos(p.ph * TAU, p.b, kappa); ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(cx + q[0] * sc, cy - q[1] * sc, 5, 0, TAU); ctx.fill();
      EM.text(ctx, 'posición aparente de la estrella (segundos de arco)', cx, 16, { size: 11, align: 'center', color: '--ink-3' });
      /* esquema del telescopio */
      const gx = half + 40, gy = H * 0.5, alpha = Math.min(kappa * 0.01, 0.4);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(gx + 60, gy + 70); ctx.lineTo(gx + 60 - Math.sin(alpha * 12) * 60, gy - 20); ctx.stroke();
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(gx + 60, gy - 90); ctx.lineTo(gx + 60, gy + 70); ctx.stroke(); ctx.setLineDash([]);
      EM.draw.arrow(ctx, gx + 20, gy + 85, gx + 20 + 38, gy + 85, { color: '--c3', width: 2.2 }); EM.text(ctx, 'v de la Tierra', gx + 20, gy + 102, { size: 11, color: '--c3' });
      EM.text(ctx, 'dirección real', gx + 66, gy - 94, { size: 10.5, color: '--ray' });
      sim.set('k', EM.fix(kappa, 2) + '″');
      sim.set('c', EM.fix(C.aberrationC(29.78, 20.5), 0) + ' km/s');
      sim.set('t', EM.fix(K.AU_km / p.c / 60, 2) + ' min = ' + EM.fix(K.AU_km / p.c, 0) + ' s');
    });
  });
})();
