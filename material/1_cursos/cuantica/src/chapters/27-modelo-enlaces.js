/* Capítulo 27 — El modelo de enlaces de hBN-MC */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, H = P.hbn;
  const KB = H.KB;
  const f2 = (v) => CQ.fix(v, 2), f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);
  const KEYS = ['NN', 'NB', 'BB', 'CC', 'CN', 'CB', 'XN', 'XB', 'XC', 'XX'];
  const LAB = (k) => (k[0] === 'X' && k !== 'XX' ? `${k[1]}–H` : k === 'XX' ? 'X–X' : `${k[0]}–${k[1]}`);

  /* Vista «traspuesta» de una red (x ↔ y) para dibujarla apaisada */
  const transposed = (lat) => ({
    N: lat.N, s: lat.s,
    g: { x: lat.g.y, y: lat.g.x, nb: lat.g.nb },
    rel: (k, m) => { const r = lat.rel(k, m); return [r[1], r[0]]; }
  });
  const tableHTML = (rows, head) => {
    let h = '<table class="sim-tab">';
    if (head) h += '<tr>' + head.map((x) => `<th>${x}</th>`).join('') + '</tr>';
    for (const r of rows) h += '<tr>' + r.map((x) => `<td>${x}</td>`).join('') + '</tr>';
    return h + '</table>';
  };
  CQ.tableHTML = tableHTML;

  /* ======================================================================
     27.1 Laboratorio de enlaces
     ====================================================================== */
  CQ.defineSim('laboratorio-enlaces', function (sim) {
    const cv = sim.canvas({ aspect: 1.62 });
    const L = 10;
    let lat = new H.Lattice(L);
    const view = new CQ.View2D(cv, { xmin: -0.7, xmax: lat.g.H - 0.3, ymin: -0.7, ymax: lat.g.W + 0.1 });
    const PRE = {
      perf: 'h-BN perfecto', vb: 'V<sub>B</sub> + 3H', vn: 'V<sub>N</sub> + 3H', anti: 'Antisitio B↔N', cc: 'Dímero C–C', tri: 'Poro triangular n = 2 (borde N)', trib: 'Poro triangular n = 2 (borde B)'
    };
    sim.group('Herramienta');
    sim.seg('tool', { options: [['paint', 'Pintar'], ['swap', 'Intercambiar dos sitios']], value: 'paint', onInput: () => { sel = []; last = null; } });
    sim.seg('sp', { label: 'Especie para pintar', options: [['1', 'N'], ['2', 'B'], ['3', 'C'], ['0', 'X (vacancia)']], value: '0' });
    sim.select('pre', { label: 'Configuraciones de ejemplo', options: Object.keys(PRE).map((k) => [k, PRE[k].replace(/<\/?sub>/g, '')]), value: 'vb', onInput: () => load() });
    sim.group('Reservorio y temperatura');
    sim.seg('res', { label: 'Reservorio de H', options: [['tesis', 'Tesis 2019'], ['H2', 'Gran canónico (H₂)']], value: 'tesis', onInput: (v) => { lat.res = v; sim.ctl.dmu.show(v === 'H2'); } });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: 0.5, value: -1.5, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2), onInput: (v) => { lat.dmu = v; } });
    sim.slider('T', { label: 'Temperatura (para la aceptación)', min: 1000, max: 20000, value: 10000, step: 100, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.out('cnt', 'Enlaces <i>n</i><sub>αβ</sub> y su ε efectivo en el Monte Carlo', { wide: true });
    sim.out('at', 'Átomos N · B · C · vacancias');
    sim.out('nh', '<i>N</i><sub>H</sub> = <i>n</i><sub>XN</sub> + <i>n</i><sub>XB</sub> + <i>n</i><sub>XC</sub>', { hl: true });
    sim.out('id', 'Identidad 3<i>N</i><sub>α</sub> = 2<i>n</i><sub>αα</sub> + Σ<i>n</i><sub>αβ</sub>');
    sim.out('E', '<i>E</i><sub>fís</sub> − <i>E</i>(perfecto) · <i>E</i><sub>MC</sub> − <i>E</i><sub>MC</sub>(perfecto)', { hl: true });
    sim.out('dE', 'Último intercambio: Δ<i>E</i> local · recálculo completo');
    sim.out('acc', 'Aceptación e<sup>−Δ<i>E</i>/<i>k</i><sub>B</sub><i>T</i></sup>');
    sim.ctl.dmu.show(false);
    let sel = [], last = null, Eperf = 0, EperfMC = 0;
    const ref = () => { const r = new H.Lattice(L, { res: lat.res, dmu: lat.dmu }); Eperf = r.physEnergy(); EperfMC = r.energy(); };
    const load = () => {
      lat.perfect(); sel = []; last = null;
      const g = lat.g, cx = g.W / 2, cy = g.H / 2;
      const kB = lat.nearest(cx, cy, 0), kN = lat.nearest(cx, cy, 1);
      switch (sim.p.pre) {
        case 'vb': lat.s[kB] = 0; break;
        case 'vn': lat.s[kN] = 0; break;
        case 'anti': { const m = g.nb[3 * kB]; lat.s[kB] = 1; lat.s[m] = 2; break; }
        case 'cc': { const m = g.nb[3 * kB]; lat.s[kB] = 3; lat.s[m] = 3; break; }
        case 'tri': lat.triangle(2, 'N'); break;
        case 'trib': lat.triangle(2, 'B'); break;
        default: break;
      }
    };
    load();
    const pick = (px, py) => {
      const wx = view.wx(px), wy = view.wy(py);
      const k = lat.nearest(wy, wx);
      const d = Math.hypot(lat.g.x[k] - wy, lat.g.y[k] - wx);
      return d < 0.7 ? k : -1;
    };
    CQ.pointer(cv, {
      down: (x, y) => {
        const k = pick(x, y);
        if (k < 0) return null;
        if (sim.p.tool === 'paint') { lat.s[k] = +sim.p.sp; last = null; }
        else {
          sel.push(k);
          if (sel.length === 2) {
            const [a, b] = sel;
            if (a !== b && lat.s[a] !== lat.s[b]) {
              const E0 = lat.energy(), d = lat.dE(a, b);
              const t = lat.s[a]; lat.s[a] = lat.s[b]; lat.s[b] = t;
              last = { d, full: lat.energy() - E0 };
            } else last = { d: 0, full: 0 };
            sel = [];
          }
        }
        sim.redraw();
        return null;
      },
      hover: (x, y) => (pick(x, y) >= 0 ? 'pointer' : false)
    });
    sim.onDraw(() => {
      ref();
      view.update();
      CQ.draw.clear(cv);
      CQ.drawLattice(view, transposed(lat), { r: Math.max(3, 0.27 * view.s), label: true, highlight: new Set(sel) });
      const ctx = cv.ctx;
      CQ.text(ctx, sim.p.tool === 'paint' ? 'clic: pintar el sitio con la especie elegida' : sel.length ? 'elija el segundo sitio' : 'clic en dos sitios para intercambiarlos', 10, cv.h - 8, { size: 11.5, color: '--ink-2', halo: true });
      const c = lat.bondCounts(), sp = lat.species(), p = lat.p;
      const rows = KEYS.filter((k) => c[k]).map((k) => [LAB(k), String(c[k]), CQ.fix(k === 'XX' ? H.epsVV(lat.res, p) : k[0] === 'X' ? p[k] - H.shift(lat.res, lat.dmu) : p[k], 3)]);
      sim.set('cnt', tableHTML(rows, ['par', '<i>n</i>', 'ε (eV)']));
      sim.set('at', `${sp.N} · ${sp.B} · ${sp.C} · ${sp.X}`);
      sim.set('nh', String(lat.nH()));
      const idN = 2 * c.NN + c.NB + c.CN + c.XN, idB = 2 * c.BB + c.NB + c.CB + c.XB, idC = 2 * c.CC + c.CN + c.CB + c.XC;
      const ok = idN === 3 * sp.N && idB === 3 * sp.B && idC === 3 * sp.C;
      sim.set('id', `N: ${3 * sp.N} = ${idN} · B: ${3 * sp.B} = ${idB} · C: ${3 * sp.C} = ${idC} ${ok ? '✓' : '✗'}`);
      sim.set('E', `${f3(lat.physEnergy() - Eperf)} · ${f3(lat.energy() - EperfMC)} eV`);
      if (last) {
        sim.set('dE', `${f4(last.d)} · ${f4(last.full)} eV`);
        sim.set('acc', last.d <= 0 ? '1 (siempre se acepta)' : CQ.sci(Math.exp(-last.d / (KB * sim.p.T)), 3));
      } else { sim.set('dE', '—'); sim.set('acc', '—'); }
    });
  });

  /* ======================================================================
     27.2 El ajuste de Mazzoni
     ====================================================================== */
  CQ.defineSim('ajuste-mazzoni', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const ROWS = H.MAZZONI.map((r) => { const a = H.atomsFromBonds(r.n); return Object.assign({}, r, { comp: `B${a.B}C${a.C}N${a.N}` }); });
    const COMPS = ['B2C2N4', 'B4C2N2', 'B2C4N2', 'B3C2N3'], CC = ['--c1', '--c2', '--c3', '--c4'];
    const T58 = { NN: -185.29, NB: -128.1626, BB: -67.9148, CC: -107.32, CN: -147.02, CB: -88.01 };
    sim.group('Datos usados en el ajuste');
    sim.select('set', { options: [['all', 'Las 20 estructuras'], ['one', 'Quitar una estructura'], ['noE', 'Sin la familia B₂C₄N₂ (singular)'], ['only', 'Solo la familia B₂C₄N₂ (singular)']], value: 'all', onInput: (v) => sim.ctl.drop.show(v === 'one') });
    sim.slider('drop', { label: 'Estructura que se quita', min: 0, max: 19, value: 7, step: 1, fmt: (v) => ROWS[Math.round(v)].id + ' (' + ROWS[Math.round(v)].comp + ')' });
    sim.check('fix', { label: 'Fijar ε<sub>NB</sub> = <i>E</i>(BN)/3 = −128.9067 eV', value: false });
    sim.out('st', 'Estado', { hl: true });
    sim.out('par', 'Parámetros ± σ (eV)', { wide: true });
    sim.out('q', 'RMS · residuo máximo (eV por celda)');
    sim.out('r2', '<i>R</i>² · RMS de validación cruzada (LOO)');
    sim.out('pred', 'Error de predicción de la estructura quitada');
    sim.ctl.drop.show(false);
    sim.onDraw(() => {
      const mode = sim.p.set, di = Math.round(sim.p.drop);
      const use = ROWS.filter((r, i) => (mode === 'one' ? i !== di : mode === 'noE' ? r.comp !== 'B2C4N2' : mode === 'only' ? r.comp === 'B2C4N2' : true));
      const fixed = sim.p.fix ? { NB: H.E_MOL.BN / 3 } : {};
      const fit = H.fit(use, H.FIT_KEYS, fixed);
      const prm = fit.ok ? Object.assign({}, fixed, fit.params) : null;
      const model = (r) => H.FIT_KEYS.reduce((s, k) => s + (+r.n[k] || 0) * prm[k], 0);
      /* residuos */
      CQ.draw.clear(cr);
      const resid = prm ? ROWS.map((r) => r.E - model(r)) : ROWS.map(() => 0);
      const loo = {};
      if (fit.ok) fit.resid.forEach((q) => { loo[q.id] = q.loo; });
      const ymax = Math.max(1.5, ...resid.map(Math.abs), ...Object.values(loo).map(Math.abs)) * 1.15;
      const pr = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: -0.7, xmax: 19.7, ymin: -ymax, ymax, xticks: ROWS.map((_, i) => i), xfmt: (v) => ROWS[Math.round(v)] ? ROWS[Math.round(v)].id : '', xlabel: 'estructura', ylabel: 'E_{DFT} − E_{modelo} (eV)', title: 'residuos por estructura' });
      pr.frame();
      if (fit.ok) {
        pr.clip((ctx) => {
          ROWS.forEach((r, i) => {
            const inUse = use.includes(r), col = CQ.col(CC[COMPS.indexOf(r.comp)]);
            const x0 = pr.X(i - 0.32), x1 = pr.X(i + 0.32), y0 = pr.Y(0), y1 = pr.Y(resid[i]);
            ctx.fillStyle = inUse ? CQ.alpha(col, 0.75) : 'transparent';
            ctx.strokeStyle = inUse ? col : CQ.col('--ink');
            ctx.lineWidth = inUse ? 1 : 2;
            if (!inUse) ctx.setLineDash([3, 2]);
            ctx.fillRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
            ctx.strokeRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
            ctx.setLineDash([]);
            if (loo[r.id] !== undefined) { ctx.strokeStyle = CQ.col('--ink'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(pr.X(i - 0.4), pr.Y(loo[r.id])); ctx.lineTo(pr.X(i + 0.4), pr.Y(loo[r.id])); ctx.stroke(); }
          });
        });
        pr.hline(fit.rms, { color: '--ink-3', dash: [4, 4] }); pr.hline(-fit.rms, { color: '--ink-3', dash: [4, 4], label: '± RMS', labelRight: true });
      } else CQ.text(cr.ctx, 'XᵀX singular: no hay ajuste', cr.w / 2, cr.h / 2, { size: 14, align: 'center', color: '--c2', weight: 650 });
      sim.legend(COMPS.map((c, i) => ({ label: c.replace(/(\d)/g, '<sub>$1</sub>'), color: CC[i], kind: 'sq' })).concat([{ label: 'residuo LOO (raya negra)', color: '--ink' }, { label: 'estructura quitada (contorno)', color: '--ink', kind: 'dash' }]));
      /* parámetros frente a la tesis */
      CQ.draw.clear(cp);
      const pp = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -0.6, xmax: 5.6, ymin: -2.2, ymax: 2.2, xticks: [0, 1, 2, 3, 4, 5], xfmt: (v) => 'ε_{' + (H.FIT_KEYS[Math.round(v)] || '') + '}', ylabel: 'ajuste − tesis (eV)', title: 'parámetros ± σ frente a la Tabla 5.8' });
      pp.frame();
      if (prm) {
        pp.clip((ctx) => {
          H.FIT_KEYS.forEach((k, i) => {
            const d = prm[k] - T58[k], s = fit.stderr[k] || 0, x = pp.X(i);
            ctx.strokeStyle = CQ.col('--accent'); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, pp.Y(d - s)); ctx.lineTo(x, pp.Y(d + s)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - 6, pp.Y(d - s)); ctx.lineTo(x + 6, pp.Y(d - s)); ctx.moveTo(x - 6, pp.Y(d + s)); ctx.lineTo(x + 6, pp.Y(d + s)); ctx.stroke();
            ctx.fillStyle = CQ.col(fixed[k] !== undefined ? '--c2' : '--accent'); ctx.beginPath(); ctx.arc(x, pp.Y(Math.max(-2.15, Math.min(2.15, d))), 5, 0, 7); ctx.fill();
          });
        });
      }
      const rows = H.FIT_KEYS.map((k) => [`ε<sub>${k}</sub>`, prm ? CQ.fix(prm[k], 4) : '—', prm ? (fixed[k] !== undefined ? 'fijo' : '± ' + CQ.fix(fit.stderr[k], 3)) : '', CQ.fix(T58[k], 4)]);
      sim.set('par', tableHTML(rows, ['', 'ajuste', 'σ', 'tesis']));
      sim.set('st', fit.ok ? `${fit.n} estructuras, ${fit.p} parámetros libres, ${fit.dof} grados de libertad` : fit.msg);
      sim.set('q', fit.ok ? `${f3(fit.rms)} · ${f3(fit.maxAbs)}` : '—');
      sim.set('r2', fit.ok ? `${CQ.fix(fit.R2, 6)} · ${f3(fit.looRms)}` : '—');
      sim.set('pred', mode === 'one' && fit.ok ? `${ROWS[di].id}: ${f3(resid[di])} eV (con todas: ${f3(H.fit(ROWS, H.FIT_KEYS, fixed).resid[di].resid)} eV)` : '—');
    });
  });

  /* ======================================================================
     27.3 Costo de los movimientos
     ====================================================================== */
  CQ.defineSim('costos-movimientos', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Modelo');
    sim.seg('res', { label: 'Reservorio de H', options: [['tesis', 'Tesis 2019'], ['H2', 'Gran canónico (H₂)']], value: 'tesis', onInput: (v) => sim.ctl.dmu.show(v === 'H2') });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: 0.5, value: -1.5, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura señalada', min: 1000, max: 20000, value: 5000, step: 100, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.out('tab', 'Δ<i>E</i> y aceptación a la temperatura señalada', { wide: true });
    sim.out('kT', '<i>k</i><sub>B</sub><i>T</i>');
    sim.ctl.dmu.show(false);
    const moves = (res, dmu) => {
      const mk = () => new H.Lattice(12, { res, dmu });
      const out = [];
      let L = mk(); let k = L.nearest(5, 5, 0); out.push({ n: 'antisitio B↔N', d: L.dE(k, L.g.nb[3 * k]), c: '--c2' });
      L = mk(); k = L.nearest(5, 5, 0); L.s[k] = 0; out.push({ n: 'V_B ↔ N vecino', d: L.dE(k, L.g.nb[3 * k]), c: '--c4' });
      L = mk(); k = L.nearest(5, 5, 0); { const b = L.g.nb[3 * k]; L.s[k] = 3; L.s[b] = 3; const n = L.g.nb[3 * k + 1]; out.push({ n: 'C ↔ N vecino', d: L.dE(k, n), c: '--c3' }); }
      L = mk(); k = L.nearest(5, 5, 0); L.s[k] = 0; { const far = L.nearest(1, 1, 0); out.push({ n: 'V_B ↔ B lejano', d: L.dE(k, far), c: '--c5' }); }
      L = new H.Lattice(20, { res, dmu }); L.triangle(3, 'N');
      let lo = Infinity, hi = -Infinity;
      for (let a = 0; a < L.N; a++) if (L.s[a] === 0) for (let q = 0; q < 3; q++) { const m = L.g.nb[3 * a + q]; if (L.s[m]) { const d = L.dE(a, m); lo = Math.min(lo, d); hi = Math.max(hi, d); } }
      out.push({ n: 'borde de poro: mínimo', d: lo, c: '--c1' });
      out.push({ n: 'borde de poro: máximo', d: hi, c: '--c1', dash: [5, 4] });
      return out;
    };
    let cache = '', mv = [];
    sim.onDraw(() => {
      const key = sim.p.res + '|' + sim.p.dmu;
      if (key !== cache) { mv = moves(sim.p.res, sim.p.dmu); cache = key; }
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1000, xmax: 20000, ymin: -30, ymax: 0.5, xlabel: 'T de simulación (K)', ylabel: 'log₁₀ (aceptación)', title: 'probabilidad de aceptar cada movimiento: min(1, e^{−ΔE/k_BT})' });
      pl.frame();
      mv.forEach((m) => pl.fn((t) => Math.min(0, -m.d / (KB * t) / Math.LN10), { color: m.c, width: 2.2, dash: m.dash, n: 300 }));
      pl.vline(sim.p.T, { color: '--ink-3', dash: [3, 3] });
      pl.legend(mv.map((m) => ({ label: `${m.n} (${CQ.fix(m.d, 2)} eV)`, color: m.c, dash: m.dash })), 'br');
      const kT = KB * sim.p.T;
      sim.set('kT', f3(kT) + ' eV');
      sim.set('tab', tableHTML(mv.map((m) => [m.n.replace('V_B', 'V<sub>B</sub>'), f2(m.d) + ' eV', m.d <= 0 ? '1' : CQ.sci(Math.exp(-m.d / kT), 2)]), ['movimiento', 'Δ<i>E</i>', 'acept.']));
    });
  });
})();
