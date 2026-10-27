/* Capítulo 9 — Copérnico, Tycho y el cielo que cambia */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc, S = C.SOLAR, K = C.KM;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;

  /* 9.1 La escala del sistema solar según Copérnico */
  EM.defineSim('escala-copernico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('pl', { label: 'Planeta', options: [['mercurio', 'Mercurio'], ['venus', 'Venus'], ['marte', 'Marte'], ['jupiter', 'Júpiter'], ['saturno', 'Saturno']], value: 'venus', onInput: () => setDefault() });
    sim.slider('v', { label: 'Medida observada (elongación máxima, o días de oposición a cuadratura)', min: 10, max: 400, step: 0.5, value: 46, fmt: (v) => v.toFixed(1) });
    sim.out('a', 'Radio de la órbita calculado (UA)', { hl: true });
    sim.out('m', 'Valor moderno (semieje)');
    sim.out('e', 'Error');
    sim.note('Copérnico notó que con su sistema la escala del cielo queda fijada: para Venus y Mercurio, \\(a=\\operatorname{sen}\\varepsilon\\), con ε la mayor elongación respecto del Sol; para un planeta superior, el tiempo \\(t\\) entre la oposición y la cuadratura da el ángulo \\(\\varphi\\) en el Sol, y \\(a=1/\\cos\\varphi\\). En el sistema de Ptolomeo los tamaños de epiciclos y deferentes eran libres: solo contaba su razón.');
    const defaults = { mercurio: 22.8, venus: 46.3, marte: 106, jupiter: 87.6, saturno: 88.2 };
    const setDefault = () => { sim.ctl.v.set(defaults[sim.p.pl], true); sim.redraw(); };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const inf = p.pl === 'mercurio' || p.pl === 'venus';
      let a, label;
      if (inf) { a = C.copernicusInferior(p.v); label = 'ε = ' + p.v.toFixed(1) + '°'; }
      else { const r = C.copernicusSuperior(p.v, S.tierra.P, S[p.pl].P); a = r.a; label = 'φ = ' + (r.phi / DEG).toFixed(1) + '°'; if (!(a > 0) || r.phi > 1.55) a = NaN; }
      const cx = W * 0.32, cy = H * 0.5, sc = Math.min(W * 0.28, H * 0.42) / Math.max(1, isFinite(a) ? Math.min(a, 10) : 1.5);
      ctx.fillStyle = EM.col('--gold'); ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'órbita de la Tierra (1 UA)', cx + sc * 0.72, cy - sc * 0.72 - 6, { size: 11, color: '--ink-3' });
      if (isFinite(a)) {
        ctx.beginPath(); ctx.arc(cx, cy, a * sc, 0, TAU); ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
        const tE = inf ? Math.PI : 0; /* esquema: la Tierra a la derecha */
        const E = [cx + sc, cy];
        let Pp;
        if (inf) { const eps = p.v * DEG; const ang = Math.PI - eps; /* ángulo en la Tierra entre Sol y planeta = ε; el planeta está en tangente */ const d = Math.cos(eps); Pp = [E[0] - d * Math.cos(eps) * sc, E[1] - d * Math.sin(eps) * sc]; }
        else { const phi = Math.acos(1 / a); Pp = [cx + a * sc * Math.cos(phi), cy - a * sc * Math.sin(phi)]; }
        ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(Pp[0], Pp[1]); ctx.stroke();
        ctx.strokeStyle = EM.alpha('--ink-2', 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(cx, cy); ctx.lineTo(Pp[0], Pp[1]); ctx.stroke();
        ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(E[0], E[1], 5, 0, TAU); ctx.fill();
        ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(Pp[0], Pp[1], 5, 0, TAU); ctx.fill();
        EM.text(ctx, label, W * 0.62, H * 0.15, { size: 14, weight: 650 });
      }
      /* comparación de radios */
      const names = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno'];
      const x0 = W * 0.62, y0 = H * 0.3, bw = W * 0.34;
      EM.text(ctx, 'semiejes modernos (UA, escala logarítmica)', x0, y0 - 6, { size: 11, color: '--ink-3' });
      names.forEach((n, i) => {
        const y = y0 + 14 + i * 24, w = (Math.log10(S[n].a) + 0.5) / 1.6 * bw;
        ctx.fillStyle = EM.alpha(n === p.pl ? '--accent' : '--ink-3', 0.55); ctx.fillRect(x0, y, w, 12);
        EM.text(ctx, n.charAt(0).toUpperCase() + n.slice(1) + '  ' + S[n].a.toFixed(2), x0 + w + 6, y + 10, { size: 11, color: '--ink-2' });
      });
      const m = S[p.pl].a;
      sim.set('a', isFinite(a) ? EM.fix(a, 3) : '—');
      sim.set('m', EM.fix(m, 3));
      sim.set('e', isFinite(a) ? EM.fix((100 * (a - m)) / m, 1) + ' %' : '—');
    });
  });

  /* 9.2 Paralaje: cuánto mide el cielo */
  EM.defineSim('paralaje', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const PRE = { luna: ['La Luna (57′, línea de base: radio terrestre)', 3420, 'R'], nova: ['Nova de 1572: Tycho no halla más de 1′', 60, 'R'], cometa: ['Cometa de 1577: menor que la Luna (Tycho)', 900, 'R'], marte: ['Marte en oposición, Cassini y Richer (1672): unos 25″', 25, 'R'], cygni: ['61 Cygni, Bessel (1838): 0.31″ (línea de base: 1 UA)', 0.314, 'A'], proxima: ['Próxima Centauri (moderna): 0.768″', 0.768, 'A'] };
    sim.select('pre', { label: 'Caso histórico', options: Object.entries(PRE).map(([k, v]) => [k, v[0]]), value: 'luna', onInput: (k) => { sim.ctl.par.set(PRE[k][1], true); sim.ctl.base.set(PRE[k][2], true); sim.redraw(); } });
    sim.slider('par', { label: 'Paralaje medida', min: 0.05, max: 4000, step: 0.05, value: 3420, log: true, fmt: (v) => (v >= 60 ? (v / 60).toFixed(1) + '′' : v.toFixed(2) + '″') });
    sim.seg('base', { label: 'Línea de base', options: [['R', 'Radio terrestre (observadores en la Tierra)'], ['A', '1 UA (órbita de la Tierra)']], value: 'R' });
    sim.out('d', 'Distancia mínima', { hl: true });
    sim.out('u', 'En otras unidades');
    sim.out('c', 'Comparación');
    sim.note('Si un objeto está a distancia \\(d\\) y se observa desde dos puntos separados por una línea de base \\(b\\), su posición aparente cambia el ángulo \\(\\pi\\approx b/d\\). Tycho no halló paralaje apreciable para la nova de 1572 con un instrumento de precisión de ~1′: tenía que estar al menos 3 400 radios terrestres (57 veces más lejos que la Luna). Para las estrellas, la línea de base anual (2 UA) exige medir centésimas de segundo de arco.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const b = p.base === 'R' ? K.earthRadius : K.AU, d = C.parallaxDistance(b, p.par);
      const dEarthR = d / K.earthRadius, dAU = d / K.AU, dLy = d / K.lightYear;
      const f = (x) => (x >= 1e6 ? EM.sci(x, 3) : x >= 100 ? EM.fix(x, 0) : EM.fix(x, 2));
      sim.set('d', p.base === 'R' ? f(dEarthR) + ' radios terrestres' : f(dAU) + ' UA');
      sim.set('u', f(dAU) + ' UA · ' + (dLy >= 0.001 ? f(dLy) + ' años luz' : EM.sci(d, 3) + ' km'));
      sim.set('c', p.base === 'R' ? EM.fix(dEarthR / 60.3, 1) + ' × la distancia a la Luna' : EM.fix(dAU / 1, 0) + ' × la distancia Tierra–Sol');
      /* Esquema logarítmico de distancias */
      const marks = [['Luna', 60.3 * K.earthRadius], ['Sol', K.AU], ['Saturno', 9.55 * K.AU], ['Neptuno', 30 * K.AU], ['Próxima Cen.', 4.24 * K.lightYear], ['Andrómeda', 2.5e6 * K.lightYear]];
      const lmin = Math.log10(3e5), lmax = Math.log10(3e19), X = (km) => 30 + ((Math.log10(km) - lmin) / (lmax - lmin)) * (W - 60);
      ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(30, H * 0.55); ctx.lineTo(W - 30, H * 0.55); ctx.stroke();
      marks.forEach(([n, km], i) => { const x = X(km); ctx.beginPath(); ctx.moveTo(x, H * 0.55 - 6); ctx.lineTo(x, H * 0.55 + 6); ctx.stroke(); EM.text(ctx, n, x, H * 0.55 + (i % 2 ? 24 : 40), { size: 11, align: 'center', color: '--ink-2' }); });
      const x = X(d);
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(x, H * 0.55 - 8); ctx.lineTo(x - 7, H * 0.55 - 26); ctx.lineTo(x + 7, H * 0.55 - 26); ctx.closePath(); ctx.fill();
      EM.text(ctx, 'distancia (escala logarítmica)', W / 2, H * 0.12, { size: 12, align: 'center', color: '--ink-3' });
    });
  });

  /* 9.3 Tres sistemas, un mismo cielo */
  EM.defineSim('tres-sistemas', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('t', { label: 'Tiempo (años)', min: 0, max: 2.2, step: 0.005, value: 0.45, fmt: (v) => v.toFixed(3) });
    sim.out('ang', 'Longitud geocéntrica de Marte', { hl: true });
    sim.out('dif', 'Diferencia máxima entre los tres modelos');
    sim.out('dist', 'Distancia Tierra–Marte (UA)');
    sim.note('Ptolomeo (Tierra fija; deferente de radio 1.524 y epiciclo de radio 1), Copérnico (planetas en torno al Sol) y Tycho (Tierra fija; el Sol da la vuelta a la Tierra y los planetas al Sol) producen exactamente el mismo cielo: el vector Tierra→Marte es idéntico. Lo que cambia es la <em>interpretación física</em>.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, t = sim.p.t, RM = 1.524, TM = 1.881;
      EM.draw.clear(cv);
      const e = TAU * t, m = (TAU * t) / TM, mod = C.marsModels(t, RM, TM);
      const w3 = W / 3, R = Math.min(w3 * 0.4, H * 0.36) / 1.9, cy = H * 0.52;
      const dot = (x, y, r, col) => { ctx.fillStyle = EM.col(col); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
      const ring = (x, y, r, a = 0.5) => { ctx.strokeStyle = EM.alpha('--ink-3', a); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); };
      const line = (a, b, col) => { ctx.strokeStyle = EM.alpha(col, 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
      const P = (cx, v) => [cx + R * v[0], cy - R * v[1]];
      /* Ptolomeo */
      let cx = w3 * 0.5; EM.text(ctx, 'Ptolomeo', cx, 16, { size: 12, weight: 650, align: 'center' });
      const E1 = [cx, cy]; ring(cx, cy, R * RM); const Ce = P(cx, [RM * Math.cos(m), RM * Math.sin(m)]); ring(Ce[0], Ce[1], R);
      const M1 = P(cx, mod.pto); line(E1, Ce, '--ink-2'); line(Ce, M1, '--ink-2'); line(E1, M1, '--ray');
      dot(E1[0], E1[1], 5, '--c1'); dot(Ce[0], Ce[1], 2.5, '--ink-3'); dot(M1[0], M1[1], 4.5, '--c2');
      const sun1 = P(cx, [Math.cos(e + PI), Math.sin(e + PI)]); /* el Sol (solo referencia) */
      /* Copérnico */
      cx = w3 * 1.5; EM.text(ctx, 'Copérnico', cx, 16, { size: 12, weight: 650, align: 'center' });
      const S2 = [cx, cy]; ring(cx, cy, R); ring(cx, cy, R * RM);
      const E2 = P(cx, [Math.cos(e), Math.sin(e)]), M2 = P(cx, [RM * Math.cos(m), RM * Math.sin(m)]);
      line(E2, M2, '--ray'); dot(S2[0], S2[1], 7, '--gold'); dot(E2[0], E2[1], 5, '--c1'); dot(M2[0], M2[1], 4.5, '--c2');
      /* Tycho */
      cx = w3 * 2.5; EM.text(ctx, 'Tycho Brahe', cx, 16, { size: 12, weight: 650, align: 'center' });
      const E3 = [cx, cy]; ring(cx, cy, R);
      const Sn = P(cx, [-Math.cos(e), -Math.sin(e)]); ring(Sn[0], Sn[1], R * RM);
      const M3 = P(cx, mod.tyc); line(E3, Sn, '--gold'); line(Sn, M3, '--ink-2'); line(E3, M3, '--ray');
      dot(E3[0], E3[1], 5, '--c1'); dot(Sn[0], Sn[1], 7, '--gold'); dot(M3[0], M3[1], 4.5, '--c2');
      const lon = (v) => ((Math.atan2(v[1], v[0]) / DEG) + 360) % 360;
      const l = [lon(mod.pto), lon(mod.cop), lon(mod.tyc)];
      const dmax = Math.max(Math.abs(l[0] - l[1]), Math.abs(l[1] - l[2]), Math.abs(l[0] - l[2]));
      sim.set('ang', EM.fix(l[1], 3) + '°');
      sim.set('dif', EM.sci(dmax, 2) + '°');
      sim.set('dist', EM.fix(Math.hypot(mod.cop[0], mod.cop[1]), 3));
    });
  });
})();
