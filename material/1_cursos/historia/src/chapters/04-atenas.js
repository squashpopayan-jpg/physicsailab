/* Capítulo 4 — Atenas: Platón y Aristóteles */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI;

  /* 4.1 Esferas homocéntricas de Eudoxo */
  EM.defineSim('eudoxo', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('pl', { label: 'Planeta', options: Object.entries(C.PLANETS).map(([k, v]) => [k, v.n]), value: 'saturno', onInput: () => fit() });
    sim.slider('al', { label: 'Inclinación α entre los ejes de las esferas 3 y 4', min: 0.5, max: 89, step: 0.1, value: 6.2, fmt: (v) => v.toFixed(1) + '°' });
    sim.button('Ajustar α al arco observado', () => fit());
    sim.out('arc', 'Arco retrógrado del modelo', { hl: true });
    sim.out('obs', 'Arco retrógrado típico observado');
    sim.out('lat', 'Latitud máxima que alcanza el modelo');
    sim.out('ver', 'Veredicto');
    sim.note('Cuatro esferas por planeta: las dos primeras dan el movimiento zodiacal; las otras dos, de ejes inclinados y giros opuestos, trazan una «hipopedia» (lazo en forma de ocho) que produce las estaciones y retrogradaciones. La línea es la trayectoria sobre el cielo en longitud y latitud eclípticas.');
    let t = 0;
    const fit = () => {
      const p = C.PLANETS[sim.p.pl];
      let lo = 0.0005, hi = 1.55;
      if (C.eudoxusStats(hi, p.S, p.P).arc < p.arc) { sim.ctl.al.set(89, true); sim.redraw(); return; }
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (C.eudoxusStats(m, p.S, p.P).arc < p.arc ? (lo = m) : (hi = m)); }
      sim.ctl.al.set(Math.round((lo * 1800) / PI) / 10, true);
      sim.redraw();
    };
    sim.animate((dt) => { t += dt * 90; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, pd = C.PLANETS[p.pl], al = (p.al * PI) / 180;
      EM.draw.clear(cv);
      const st = C.eudoxusStats(al, pd.S, pd.P);
      const N = 600, xs = [], ys = [];
      const T0 = 0, T1 = 2.2 * pd.S;
      for (let i = 0; i <= N; i++) { const q = C.eudoxus(al, pd.S, pd.P, T0 + ((T1 - T0) * i) / N); xs.push(q.lon); ys.push(q.lat); }
      let xmin = Math.min(...xs), xmax = Math.max(...xs), ymax = Math.max(8, Math.max(...ys.map(Math.abs)) * 1.1);
      const pad = (xmax - xmin) * 0.06 + 0.5; xmin -= pad; xmax += pad;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin, xmax, ymin: -ymax, ymax, xlabel: 'longitud eclíptica (°)', ylabel: 'latitud (°)' });
      pl.frame();
      pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(xs, ys, { color: '--c1', width: 1.8 });
      const q = C.eudoxus(al, pd.S, pd.P, t % T1);
      pl.dot(q.lon, q.lat, { color: '--accent', r: 6 });
      pl.hline(5, { color: '--ink-3', label: 'banda real de latitudes planetarias (≈ ±5°)', labelRight: true });
      pl.hline(-5, { color: '--ink-3' });
      sim.set('arc', EM.fix(st.arc, 1) + '°');
      sim.set('obs', EM.fix(pd.arc, 1) + '°');
      sim.set('lat', '±' + EM.fix(st.lat, 1) + '°');
      const okA = Math.abs(st.arc - pd.arc) < 0.12 * pd.arc, okL = st.lat < 6;
      sim.set('ver', okA && okL ? 'Salva el fenómeno' : !okA ? (st.arc === 0 ? 'No hay retrogradación' : 'Arco equivocado') : 'Latitud imposible');
    });
  });

  /* 4.2 Aristóteles y la caída de los cuerpos */
  EM.defineSim('caida-arist', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('med', { label: 'Medio', options: [['air', 'Aire (1.2 kg/m³)'], ['water', 'Agua (1000 kg/m³)'], ['oil', 'Aceite (900 kg/m³)'], ['void', 'Vacío']], value: 'air' });
    sim.select('pesada', { label: 'Esfera pesada', options: [['lead', 'Plomo (11 340 kg/m³)'], ['iron', 'Hierro (7 870)'], ['stone', 'Piedra (2 600)']], value: 'lead' });
    sim.select('ligera', { label: 'Esfera ligera', options: [['wood', 'Madera de pino (500)'], ['cork', 'Corcho (240)'], ['stone', 'Piedra (2 600)']], value: 'wood' });
    sim.slider('d', { label: 'Diámetro de ambas', min: 1, max: 20, step: 0.5, value: 5, fmt: (v) => v.toFixed(1) + ' cm' });
    sim.slider('h', { label: 'Altura de caída', min: 1, max: 30, step: 0.5, value: 10, fmt: (v) => v.toFixed(1) + ' m' });
    sim.out('tr', 'Tiempo real: pesada / ligera', { hl: true });
    sim.out('ta', 'Aristóteles predice (pesada / ligera)');
    sim.out('cmp', 'Cociente de los tiempos de caída');
    sim.note('Aristóteles: la velocidad es proporcional al peso e inversa a la resistencia del medio (​v ∝ W/R). Sin medio, R = 0 y la velocidad sería infinita: de ahí concluye que el vacío no puede existir (Física IV, 8). Se compara con el modelo moderno (gravedad, empuje y resistencia cuadrática, Cd = 0.47).');
    const RHO = { lead: 11340, iron: 7870, stone: 2600, wood: 500, cork: 240 }, MED = { air: 1.2, water: 1000, oil: 900, void: 0 };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, d = p.d / 100, h = p.h, rm = MED[p.med];
      EM.draw.clear(cv);
      const rb1 = RHO[p.pesada], rb2 = RHO[p.ligera];
      const r1 = rb1 > rm ? C.fallSphere(rb1, rm, d, h) : { t: Infinity }, r2 = rb2 > rm ? C.fallSphere(rb2, rm, d, h) : { t: Infinity };
      const tmax = Math.min(Math.max(isFinite(r1.t) ? r1.t : 0, isFinite(r2.t) ? r2.t : 0, 0.5), 60) * 1.05;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: h, xlabel: 'tiempo (s)', ylabel: 'distancia recorrida (m)' });
      pl.frame();
      const pos = (r, rb) => (t) => {
        if (!(rb > rm)) return 0;
        const a = r.a, k = r.k;
        return k < 1e-12 ? 0.5 * a * t * t : Math.log(Math.cosh(t * Math.sqrt(a * k))) / k;
      };
      pl.fn(pos(r1, rb1), { color: '--c2', width: 2.4, to: isFinite(r1.t) ? r1.t : tmax });
      pl.fn(pos(r2, rb2), { color: '--c1', width: 2.4, to: isFinite(r2.t) ? r2.t : tmax });
      pl.legend([{ label: 'esfera pesada', color: '--c2' }, { label: 'esfera ligera', color: '--c1' }], 'tl');
      const wr = rb1 / rb2;
      sim.set('tr', (isFinite(r1.t) ? EM.fix(r1.t, 3) : '∞') + ' s / ' + (isFinite(r2.t) ? EM.fix(r2.t, 3) : '∞') + ' s');
      if (rm === 0) {
        sim.set('ta', 'velocidad infinita: no cabe el vacío');
        const t0 = Math.sqrt((2 * h) / 9.80665);
        sim.set('cmp', '1.000  (ambas caen en ' + EM.fix(t0, 3) + ' s)');
      } else {
        sim.set('ta', 'la pesada tarda ' + EM.fix(1 / wr, 3) + '× el tiempo de la ligera');
        sim.set('cmp', isFinite(r1.t) && isFinite(r2.t) ? EM.fix(r1.t / r2.t, 3) : (isFinite(r1.t) ? 'la ligera flota' : '—'));
      }
    });
  });

  /* 4.3 Sólidos platónicos */
  EM.defineSim('platonicos', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('s', { label: 'Sólido', options: [['tetraedro', 'Tetraedro'], ['cubo', 'Cubo'], ['octaedro', 'Octaedro'], ['icosaedro', 'Icosaedro'], ['dodecaedro', 'Dodecaedro']], value: 'tetraedro' });
    sim.check('giro', { label: 'Girar', value: true });
    sim.out('el', 'Elemento según el Timeo', { hl: true });
    sim.out('vef', 'Vértices, aristas, caras');
    sim.out('eul', 'V − A + C');
    const EL = { tetraedro: 'fuego', cubo: 'tierra', octaedro: 'aire', icosaedro: 'agua', dodecaedro: 'el cosmos entero' };
    let a = 0;
    sim.animate((dt) => { if (sim.p.giro) a += dt * 0.6; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, S = C.platonic(sim.p.s);
      EM.draw.clear(cv);
      const sc = Math.min(W, H) * 0.24 / Math.max(...S.V.map((v) => Math.hypot(...v)));
      const P = S.V.map((v) => { const q = C.rot(C.rot(v, [0, 1, 0], a), [1, 0, 0], 0.5 + 0.2 * Math.sin(a * 0.5)); return [W / 2 + q[0] * sc * 1.6, H / 2 - q[1] * sc * 1.6, q[2]]; });
      ctx.lineWidth = 1.8;
      S.E.forEach(([i, j]) => { const z = (P[i][2] + P[j][2]) / 2; ctx.strokeStyle = EM.alpha('--accent', z > 0 ? 0.95 : 0.35); ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); });
      P.forEach((q) => { ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, 2 * PI); ctx.fill(); });
      sim.set('el', EL[sim.p.s]);
      sim.set('vef', S.V.length + ', ' + S.E.length + ', ' + S.F);
      sim.set('eul', S.V.length - S.E.length + S.F);
    });
  });
})();
