/* Capítulo 9 — Gráficas, linealización y ajuste */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;

  const TR = {
    id: ['', (v) => v], cuad: ['²', (v) => v * v], inv: ['1/', (v) => 1 / v], ln: ['ln ', (v) => (v > 0 ? Math.log(v) : NaN)], raiz: ['√', (v) => (v >= 0 ? Math.sqrt(v) : NaN)]
  };
  const etiqueta = (t, n) => (t === 'id' ? n : t === 'cuad' ? n + '²' : t === 'inv' ? '1/' + n : t === 'ln' ? 'ln ' + n : '√' + n);
  const EJEMPLOS = {
    pendulo: ['L (m)', 'T (s)', '0,300\t1,105\n0,450\t1,358\n0,600\t1,566\n0,750\t1,747\n0,900\t1,916\n1,050\t2,071\n1,200\t2,213'],
    boyle: ['V (mL)', 'p (kPa)', '60\t82,2\n55\t89,4\n50\t98,0\n45\t108,9\n40\t122,3\n35\t139,6\n30\t162,8'],
    rc: ['t (s)', 'V (V)', '0\t5,98\n10\t4,02\n20\t2,70\n30\t1,83\n40\t1,22\n50\t0,83\n60\t0,56'],
    caida: ['t (s)', 'x (m)', '0,10\t0,049\n0,15\t0,110\n0,20\t0,196\n0,25\t0,305\n0,30\t0,441\n0,35\t0,598\n0,40\t0,783']
  };
  EM.parseDatos = function (txt) {
    const xs = [], ys = [];
    for (const ln of String(txt).split(/\r?\n/)) {
      const t = ln.trim();
      if (!t) continue;
      const parts = /[\t;]/.test(t) ? t.split(/[\t;]+/) : t.split(/\s+/);
      if (parts.length < 2) continue;
      const a = parseFloat(parts[0].replace(',', '.')), b = parseFloat(parts[1].replace(',', '.'));
      if (isFinite(a) && isFinite(b)) { xs.push(a); ys.push(b); }
    }
    return { xs, ys };
  };

  EM.defineSim('ajuste-datos', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const cr = sim.canvas({ aspect: 3.6 });
    const ta = document.createElement('textarea');
    ta.className = 'datos-in'; ta.rows = 7; ta.setAttribute('aria-label', 'Datos en dos columnas');
    sim.stageCol.append(ta);
    ta.addEventListener('input', () => sim.redraw());
    sim.group('Datos');
    sim.select('ej', { label: 'Ejemplo', options: [['pendulo', 'Péndulo: L y T'], ['boyle', 'Jeringa: V y p'], ['rc', 'Descarga RC: t y V'], ['caida', 'Caída libre: t y x']], value: 'pendulo', onInput: (v) => cargar(v) });
    sim.group('Transformación');
    sim.seg('tx', { label: 'Eje X', options: Object.keys(TR).map((k) => [k, k === 'id' ? 'x' : k === 'cuad' ? 'x²' : k === 'inv' ? '1/x' : k === 'ln' ? 'ln x' : '√x']), value: 'id' });
    sim.seg('ty', { label: 'Eje Y', options: Object.keys(TR).map((k) => [k, k === 'id' ? 'y' : k === 'cuad' ? 'y²' : k === 'inv' ? '1/y' : k === 'ln' ? 'ln y' : '√y']), value: 'cuad' });
    sim.check('origen', { label: 'Forzar la recta por el origen', value: false });
    sim.out('m', 'Pendiente', { hl: true });
    sim.out('b', 'Intercepto');
    sim.out('r2', 'R²');
    sim.out('res', 'Residuos');
    let nx = 'L (m)', ny = 'T (s)';
    function cargar(k) { const e = EJEMPLOS[k]; nx = e[0]; ny = e[1]; ta.value = e[2]; sim.redraw(); }
    cargar('pendulo');
    sim.onDraw(() => {
      const p = sim.p;
      D.clear(cv); D.clear(cr);
      const { xs, ys } = EM.parseDatos(ta.value);
      const X = [], Y = [];
      xs.forEach((x, i) => { const a = TR[p.tx][1](x), b = TR[p.ty][1](ys[i]); if (isFinite(a) && isFinite(b)) { X.push(a); Y.push(b); } });
      const fit = X.length >= 2 ? (p.origen ? L.fitProp(X, Y) : L.fitLine(X, Y)) : null;
      const xr = L.rango(X.concat(p.origen ? [0] : []), { cero: false }), yr = L.rango(Y.concat(p.origen ? [0] : []), { cero: false });
      const lx = etiqueta(p.tx, nx.split(' ')[0]) + (p.tx === 'id' ? ' ' + (nx.split(' ')[1] || '') : ''), ly = etiqueta(p.ty, ny.split(' ')[0]) + (p.ty === 'id' ? ' ' + (ny.split(' ')[1] || '') : '');
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: xr[0], xmax: xr[1], ymin: yr[0], ymax: yr[1], xlabel: lx, ylabel: ly });
      pl.frame();
      if (fit) pl.fn(fit.f, { color: '--c2', width: 2 });
      L.puntos(pl, X, Y);
      if (fit) {
        const res = X.map((x, i) => Y[i] - fit.f(x));
        const rm = Math.max(1e-12, ...res.map(Math.abs)) * 1.3;
        const pr = new EM.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: xr[0], xmax: xr[1], ymin: -rm, ymax: rm, ylabel: 'residuo', mb: 22 });
        pr.frame();
        pr.hline(0, { color: '--ink-3', dash: [] });
        L.puntos(pr, X, res, { color: '--c1', r: 3.5 });
        /* rachas de signo: indicio de curvatura */
        let cambios = 0;
        for (let i = 1; i < res.length; i++) if (Math.sign(res[i]) !== Math.sign(res[i - 1])) cambios++;
        const ord = X.map((x, i) => [x, res[i]]).sort((a, b) => a[0] - b[0]).map((q) => q[1]);
        let c2 = 0;
        for (let i = 1; i < ord.length; i++) if (Math.sign(ord[i]) !== Math.sign(ord[i - 1])) c2++;
        sim.set('m', L.pm(fit.m, fit.sm));
        sim.set('b', p.origen ? '0 (impuesto)' : L.pm(fit.b, fit.sb));
        sim.set('r2', EM.fix(fit.r2, 5));
        sim.set('res', c2 <= 1 && ord.length >= 5 ? '<span class="chip warn">Forman un arco: revise el modelo</span>' : '<span class="chip ok">Sin patrón evidente</span>');
      } else {
        ['m', 'b', 'r2', 'res'].forEach((k) => sim.set(k, '—'));
      }
    });
  });
})();
