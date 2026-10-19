/* Capítulo 4 — Gases reales y ecuaciones de estado */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;
  /* Referencia: CoolProp 6 (Span–Wagner, Setzmann–Wagner, Tegeler). Z(P_r) por T_r y B(T) en cm³/mol */
  const REF = {"Z":{"N2":{"1.0":[[0.2,0.9303],[0.5,0.8077],[1.5,0.2613],[2,0.3261],[3,0.4549],[4,0.5796],[5,0.7007],[6,0.8187]],"1.1":[[0.2,0.9487],[0.5,0.8647],[1,0.6957],[1.5,0.4717],[2,0.3971],[3,0.4827],[4,0.591],[5,0.7002],[6,0.8078]],"1.2":[[0.2,0.9614],[0.5,0.9006],[1,0.7909],[1.5,0.6732],[2,0.5726],[3,0.5487],[4,0.6242],[5,0.7162],[6,0.8115]],"1.5":[[0.2,0.9822],[0.5,0.9557],[1,0.9132],[1.5,0.8741],[2,0.8405],[3,0.7994],[4,0.7996],[5,0.8323],[6,0.8839]],"2.0":[[0.2,0.995],[0.5,0.9882],[1,0.9782],[1.5,0.9705],[2,0.9651],[3,0.9619],[4,0.9692],[5,0.9863],[6,1.012]]},"CH4":{"1.0":[[0.2,0.9298],[0.5,0.8065],[1.5,0.2582],[2,0.3221],[3,0.4492],[4,0.5723],[5,0.6918],[6,0.8083]],"1.1":[[0.2,0.9482],[0.5,0.8632],[1,0.6918],[1.5,0.4624],[2,0.3894],[3,0.4748],[4,0.5818],[5,0.6895],[6,0.7957]],"1.2":[[0.2,0.9608],[0.5,0.899],[1,0.7872],[1.5,0.6662],[2,0.5618],[3,0.5375],[4,0.6125],[5,0.7035],[6,0.7976]],"1.5":[[0.2,0.9815],[0.5,0.9542],[1,0.9099],[1.5,0.8687],[2,0.8329],[3,0.7874],[4,0.7844],[5,0.8154],[6,0.8657]],"2.0":[[0.2,0.9945],[0.5,0.9868],[1,0.9755],[1.5,0.9663],[2,0.9593],[3,0.9531],[4,0.9574],[5,0.9719],[6,0.9953]]},"CO2":{"1.0":[[0.2,0.9279],[0.5,0.8016],[1.5,0.2454],[2,0.3064],[3,0.4277],[4,0.5452],[5,0.6594],[6,0.7707]],"1.1":[[0.2,0.9487],[0.5,0.8654],[1,0.7023],[1.5,0.4996],[2,0.4024],[3,0.4692],[4,0.5693],[5,0.6717],[6,0.7732]],"1.2":[[0.2,0.9624],[0.5,0.904],[1,0.8009],[1.5,0.6944],[2,0.603],[3,0.5597],[4,0.6203],[5,0.7032],[6,0.7917]],"1.5":[[0.2,0.984],[0.5,0.9607],[1,0.924],[1.5,0.8911],[2,0.8634],[3,0.8304],[4,0.8309],[5,0.8585],[6,0.9036]],"2.0":[[0.2,0.9966],[0.5,0.9921],[1,0.9862],[1.5,0.9823],[2,0.9804],[3,0.9832],[4,0.995],[5,1.0151],[6,1.0424]]},"Ar":{"1.0":[[0.2,0.9302],[0.5,0.8075],[1.5,0.2613],[2,0.3258],[3,0.4543],[4,0.5786],[5,0.6993],[6,0.8168]],"1.1":[[0.2,0.9483],[0.5,0.8634],[1,0.6916],[1.5,0.4603],[2,0.391],[3,0.4787],[4,0.587],[5,0.6959],[6,0.8031]],"1.2":[[0.2,0.9607],[0.5,0.8988],[1,0.7864],[1.5,0.6643],[2,0.5597],[3,0.5388],[4,0.616],[5,0.7083],[6,0.8035]],"1.5":[[0.2,0.9814],[0.5,0.9537],[1,0.9088],[1.5,0.8669],[2,0.8305],[3,0.7845],[4,0.7824],[5,0.8147],[6,0.8664]],"2.0":[[0.2,0.9943],[0.5,0.9864],[1,0.9746],[1.5,0.9648],[2,0.9575],[3,0.9505],[4,0.9544],[5,0.9689],[6,0.9925]]}},"B":{"N2":[[100,-160.18],[150,-71.77],[200,-35.74],[250,-16.44],[300,-4.55],[400,9.1],[500,16.54],[700,24.08],[1000,28.73]],"CH4":[[100,-392.42],[150,-180.41],[200,-104.56],[250,-65.68],[300,-42.21],[400,-15.54],[500,-0.96],[700,14.35],[1000,24.93]],"CO2":[[100,-2743.1],[150,-668.42],[200,-311.22],[250,-184.02],[300,-121.27],[400,-60.27],[500,-30.72],[700,-2.0],[1000,16.45]],"Ar":[[100,-182.76],[150,-86.3],[200,-47.96],[250,-27.65],[300,-15.18],[400,-0.85],[500,7.01],[700,15.13],[1000,20.37]]}};
  const GC = { N2: '--c1', CH4: '--c3', CO2: '--c2', Ar: '--c5' };

  /* 4.1 Segundo coeficiente virial */
  EM.defineSim('virial-b', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    for (const g of Object.keys(GC)) sim.check(g, { label: TH.CRIT[g].n, value: g !== 'CO2' });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 1000, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('B', '<i>B</i>(<i>T</i>) de van der Waals', { hl: true });
    sim.out('TB', 'Temperatura de Boyle: van der Waals · real');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const act = Object.keys(GC).filter((g) => p[g]);
      const ymin = act.includes('CO2') ? -700 : -400;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 100, xmax: 1000, ymin, ymax: 60, xlabel: 'T (K)', ylabel: 'B (cm³/mol)', ml: 56 });
      pl.frame();
      pl.hline(0, { color: '--ink-3' });
      const leg = [], bs = [], tb = [];
      for (const g of act) {
        const { a, b } = TH.eosAB('vdw', g, 300);
        pl.fn((T) => (b - a / (TH.R * T)) * 1e6, { color: GC[g], width: 2 });
        for (const [T, B] of REF.B[g]) pl.dot(T, B, { color: GC[g], r: 4 });
        leg.push({ label: TH.CRIT[g].n, color: GC[g] });
        bs.push(TH.CRIT[g].n + ': ' + EM.fix((b - a / (TH.R * p.T)) * 1e6, 1) + ' cm³/mol');
        const d = REF.B[g]; let Tb = NaN;
        for (let i = 1; i < d.length; i++) if (d[i - 1][1] < 0 && d[i][1] >= 0) Tb = d[i - 1][0] + ((d[i][0] - d[i - 1][0]) * -d[i - 1][1]) / (d[i][1] - d[i - 1][1]);
        tb.push(TH.CRIT[g].n + ': ' + (a / (TH.R * b)).toFixed(0) + ' K · ' + (isFinite(Tb) ? Tb.toFixed(0) + ' K' : '&gt; 700 K'));
      }
      pl.vline(p.T, { color: '--accent' });
      if (leg.length) pl.legend(leg.concat([{ label: 'puntos: ecuación de referencia', color: '--ink-3', kind: 'dot' }]), 'br');
      sim.set('B', bs.join('<br>') || '—');
      sim.set('TB', tb.join('<br>') || '—');
    });
  });

  /* 4.2 Isotermas de van der Waals y Maxwell */
  EM.defineSim('vdw-isotermas', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Tr', { label: 'Temperatura reducida <i>T<sub>r</sub></i>', min: 0.7, max: 1.3, step: 0.005, value: 0.9, fmt: (v) => v.toFixed(3) });
    sim.check('fam', { label: 'Mostrar familia de isotermas', value: true });
    sim.out('P', 'Presión de saturación <i>P<sub>r</sub></i>', { hl: true });
    sim.out('v', 'Volúmenes de líquido y vapor <i>v<sub>r</sub></i>');
    sim.out('real', 'Valor real (argón) a este <i>T<sub>r</sub></i>');
    const bin = [], spl = [];
    for (let t = 0.7; t < 0.9999; t += 0.004) { const m = TH.vdwMaxwell(t); if (m) bin.push([t, m]); }
    /* espinodal: dP/dv = 0 ⇒ T_r = (3v−1)²/(4v³) */
    for (let v = 0.45; v < 6; v += 0.01) { const T = Math.pow(3 * v - 1, 2) / (4 * v * v * v); spl.push([v, TH.vdwPr(T, v)]); }
    /* presión de vapor reducida del argón (Tegeler, CoolProp) */
    const ARp = [[0.6, 0.0286], [0.65, 0.0564], [0.7, 0.1005], [0.75, 0.1658], [0.8, 0.2571], [0.85, 0.3797], [0.9, 0.5392], [0.95, 0.7423], [0.99, 0.9431], [1, 1]];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 5, ymin: -0.2, ymax: 1.8, xlabel: 'v_r = v/v_c', ylabel: 'P_r = P/P_c' });
      pl.frame();
      if (p.fam) for (const t of [0.8, 0.85, 0.95, 1, 1.1, 1.2]) pl.fn((v) => TH.vdwPr(t, v), { color: t === 1 ? '--c2' : '--grid-2', width: t === 1 ? 1.4 : 1, from: 0.36 });
      pl.path(bin.map(([, m]) => [m.vl, m.Pr]).concat([[1, 1]]).concat(bin.slice().reverse().map(([, m]) => [m.vg, m.Pr])), { color: '--c2', width: 2 });
      pl.path(spl, { color: '--c2', width: 1.2, dash: [4, 3] });
      pl.fn((v) => TH.vdwPr(p.Tr, v), { color: '--accent', width: 2.6, from: 0.36 });
      let Psat = null;
      if (p.Tr < 1) {
        const m = TH.vdwMaxwell(p.Tr);
        if (m) {
          Psat = m;
          const xs = [], ys = [];
          for (let i = 0; i <= 200; i++) { const v = m.vl + ((m.vg - m.vl) * i) / 200; xs.push(v); ys.push(TH.vdwPr(p.Tr, v)); }
          ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.18); ctx.beginPath();
          xs.forEach((x, i) => (i ? ctx.lineTo(pl.X(x), pl.Y(ys[i])) : ctx.moveTo(pl.X(x), pl.Y(ys[i]))));
          ctx.lineTo(pl.X(m.vg), pl.Y(m.Pr)); ctx.lineTo(pl.X(m.vl), pl.Y(m.Pr)); ctx.closePath(); ctx.fill(); ctx.restore();
          pl.path([[m.vl, m.Pr], [m.vg, m.Pr]], { color: '--ink', width: 2 });
          pl.dot(m.vl, m.Pr, { color: '--c1' }); pl.dot(m.vg, m.Pr, { color: '--c1' });
        }
      }
      pl.dot(1, 1, { color: '--ink', label: 'punto crítico' });
      pl.legend([{ label: 'isoterma elegida', color: '--accent' }, { label: 'binodal (coexistencia)', color: '--c2' }, { label: 'espinodal', color: '--c2', dash: [4, 3] }], 'tr');
      sim.set('P', Psat ? Psat.Pr.toFixed(4) : 'sin transición (T > T_c)');
      sim.set('v', Psat ? Psat.vl.toFixed(4) + ' · ' + Psat.vg.toFixed(4) : '—');
      sim.set('real', p.Tr <= 1 ? 'P_r = ' + Math.exp(TH.interp(ARp.map((a) => a[0]), ARp.map((a) => Math.log(a[1])), p.Tr)).toFixed(3) : '—');
    });
  });

  /* 4.3 Carta generalizada de compresibilidad */
  EM.defineSim('carta-z', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('g', { label: 'Gas para las curvas de Peng–Robinson', options: Object.keys(GC).map((g) => [g, TH.CRIT[g].n + ' (ω = ' + TH.CRIT[g].w + ')']), value: 'N2' });
    for (const g of Object.keys(GC)) sim.check('p' + g, { label: 'Puntos de referencia: ' + TH.CRIT[g].n, value: g !== 'CO2' });
    sim.out('z', '<i>Z</i> en <i>P<sub>r</sub></i> = 2 (Peng–Robinson)', { hl: true });
    const TRS = ['1.0', '1.1', '1.2', '1.5', '2.0'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 6, ymin: 0.2, ymax: 1.1, xlabel: 'P_r', ylabel: 'Z' });
      pl.frame();
      const c = TH.CRIT[p.g], out = [];
      TRS.forEach((tr, i) => {
        const col = ['--c2', '--c4', '--c3', '--c1', '--c5'][i];
        pl.fn((Pr) => { if (Pr <= 0) return 1; const z = TH.eosZ('pr', p.g, +tr * c.Tc, Pr * c.Pc); return z.length ? (z.length === 1 ? z[0] : z[z.length - 1]) : NaN; }, { color: col, width: 1.8, from: 0.02 });
        for (const g of Object.keys(GC)) if (p['p' + g]) for (const [Pr, z] of REF.Z[g][tr]) pl.dot(Pr, z, { color: GC[g], r: 3 });
        const z2 = TH.eosZ('pr', p.g, +tr * c.Tc, 2 * c.Pc); out.push('T_r = ' + tr + ': ' + z2[z2.length - 1].toFixed(3));
      });
      pl.hline(1, { color: '--ink-3' });
      pl.legend(TRS.map((tr, i) => ({ label: 'T_r = ' + tr + ' (PR)', color: ['--c2', '--c4', '--c3', '--c1', '--c5'][i] })).concat(Object.keys(GC).filter((g) => p['p' + g]).map((g) => ({ label: TH.CRIT[g].n, color: GC[g], kind: 'dot' }))), 'br');
      sim.set('z', out.join('<br>'));
    });
  });

  /* 4.4 Cilindros de gas: comparación de ecuaciones */
  const CYL = { N2: [10.627, 300], O2: [9.0, 293], CH4: [8.0, 288], CO2: [5.0, 293] };
  EM.defineSim('eos-compara', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: ['N2', 'O2', 'CH4', 'CO2'].map((g) => [g, TH.CRIT[g].n]), value: 'N2' });
    sim.slider('V', { label: 'Volumen del cilindro', min: 5, max: 100, step: 1, value: 50, unit: 'L', fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Masa de gas', min: 0.2, max: 20, step: 0.01, value: 10.627, unit: 'kg', fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: -30, max: 80, step: 0.5, value: 27, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('id', 'Gas ideal', { hl: true });
    sim.out('vdw', 'van der Waals');
    sim.out('rk', 'Redlich–Kwong');
    sim.out('pr', 'Peng–Robinson');
    sim.out('ph', 'Fase según Peng–Robinson');
    sim.onChange = (id) => { if (id === 'g') { const [m, T] = CYL[sim.p.g]; sim.ctl.m.set(m, true); sim.ctl.T.set(T - 273.15, true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const c = TH.CRIT[p.g], T = p.T + 273.15, n = p.m / (c.M * 1e-3), v = (p.V * 1e-3) / n;
      const Pid = (TH.R * T) / v, Ps = { vdw: TH.eosP('vdw', p.g, T, v), rk: TH.eosP('rk', p.g, T, v), pr: TH.eosP('pr', p.g, T, v) };
      /* isoterma P–v de cada modelo */
      const vmin = 1.15 * TH.eosAB('vdw', p.g, T).b, vmax = Math.max(4 * v, 5e-4);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: vmin * 1e6, xmax: vmax * 1e6, xlog: true, ymin: 0, ymax: Math.max(1.6 * Pid, 1.6 * Ps.pr) / 1e5, xlabel: 'volumen molar (cm³/mol)', ylabel: 'P (bar)' });
      pl.frame();
      pl.fn((x) => (TH.R * T) / (x * 1e-6) / 1e5, { color: '--ink-3', width: 1.5, dash: [5, 4] });
      for (const [k, col] of [['vdw', '--c1'], ['rk', '--c3'], ['pr', '--accent']]) pl.fn((x) => TH.eosP(k, p.g, T, x * 1e-6) / 1e5, { color: col, width: 2 });
      pl.vline(v * 1e6, { color: '--ink-2', label: 'cilindro' });
      pl.legend([{ label: 'ideal', color: '--ink-3', dash: [5, 4] }, { label: 'van der Waals', color: '--c1' }, { label: 'Redlich–Kwong', color: '--c3' }, { label: 'Peng–Robinson', color: '--accent' }], 'tr');
      const f = (P) => EM.fix(P / 1e5, 1) + ' bar · Z = ' + EM.fix((P * v) / (TH.R * T), 3);
      sim.set('id', f(Pid));
      sim.set('vdw', f(Ps.vdw)); sim.set('rk', f(Ps.rk)); sim.set('pr', f(Ps.pr));
      let ph = T > c.Tc ? 'supercrítico o gas (T > T_c)' : 'una fase';
      if (T < c.Tc) {
        /* ¿cae el volumen dentro de la región bifásica de PR? buscar presión de saturación por igualdad de fugacidades aproximada vía Maxwell numérica */
        const roots = (P) => TH.eosZ('pr', p.g, T, P).map((z) => (z * TH.R * T) / P);
        let lo = 1e3, hi = c.Pc, Psat = null;
        const area = (P) => { const r = roots(P); if (r.length < 3) return NaN; const vl = r[0], vg = r[2]; let I = 0; const N = 400; for (let i = 0; i < N; i++) { const a = vl + ((vg - vl) * i) / N, b = vl + ((vg - vl) * (i + 1)) / N; I += 0.5 * (TH.eosP('pr', p.g, T, a) + TH.eosP('pr', p.g, T, b)) * (b - a); } return I - P * (vg - vl); };
        const ps = []; for (let i = 1; i < 200; i++) { const P = c.Pc * (i / 200); const a = area(P); if (isFinite(a)) ps.push([P, a]); }
        for (let i = 1; i < ps.length; i++) if (ps[i - 1][1] * ps[i][1] <= 0) { lo = ps[i - 1][0]; hi = ps[i][0]; Psat = TH.bisect(area, lo, hi, 1e-9); break; }
        if (Psat) { const r = roots(Psat); if (v > r[0] && v < r[2]) { const x = (v - r[0]) / (r[2] - r[0]); ph = 'líquido + vapor a ' + EM.fix(Psat / 1e5, 1) + ' bar (x = ' + EM.fix(x, 3) + ')'; pl.hline(Psat / 1e5, { color: '--c4', label: 'P_{sat} (PR)' }); } else ph = v <= r[0] ? 'líquido' : 'vapor'; }
      }
      sim.set('ph', ph);
    });
  });
})();
