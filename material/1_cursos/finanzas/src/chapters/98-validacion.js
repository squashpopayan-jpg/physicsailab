/* Apéndice D — Validación del núcleo de cálculo en el navegador */
(function () {
  'use strict';
  const CC = window.CC, P = CC.L;
  const fmt = (v) => (typeof v !== 'number' || !isFinite(v) ? String(v) : Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? CC.sci(v, 6) : CC.fix(v, 7));
  const subs = (s) => String(s).replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([A-Za-zÀ-ÿ0-9]+)/g, '<sub>$1</sub>');

  CC.defineSim('validacion', function (sim) {
    const cv = sim.canvas({ aspect: 3.4 });
    const N = P.CHECKS.length;
    sim.group('Pruebas');
    sim.note(`${N} pruebas de los capítulos 3 a 25, comparadas con numpy-financial, SciPy, la hoja de Damodaran e identidades exactas.`);
    const btn = sim.button(`Ejecutar las ${N} pruebas`, () => start(), { primary: true });
    sim.check('fails', { label: 'Mostrar solo las que fallan', value: false, onInput: () => filter() });
    sim.out('st', 'Estado', { hl: true });
    sim.out('ok', 'Superadas');
    sim.out('t', 'Tiempo');
    let res = new Array(N).fill(null), running = false, t0 = 0, tEnd = 0;
    /* tabla */
    let tbody = null;
    const buildTable = () => {
      const host = document.getElementById('val-tabla');
      if (!host || tbody) return;
      const tb = document.createElement('table');
      tb.className = 'vtable valtab';
      tb.innerHTML = '<thead><tr><th>Cap.</th><th>Prueba</th><th class="c">Calculado</th><th class="c">Referencia</th><th>Fuente</th><th class="c">Error (tolerancia)</th><th class="c">Estado</th></tr></thead>';
      tbody = document.createElement('tbody');
      P.CHECKS.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.id = 'val-' + c.id;
        tr.innerHTML = `<td class="c">${c.cap}</td><td>${subs(c.what)}</td><td class="c num" data-k="v">—</td><td class="c num" data-k="r">${typeof c.ref === 'function' ? '—' : fmt(c.ref)}${c.unit ? ' ' + c.unit : ''}</td><td class="src">${c.src}</td><td class="c num" data-k="e">tol ${c.tol}${c.rel ? ' (rel.)' : ''}</td><td class="c" data-k="s"><span class="vstat pend">pendiente</span></td>`;
        tbody.append(tr);
        void i;
      });
      tb.append(tbody);
      host.innerHTML = '';
      host.append(tb);
    };
    const filter = () => {
      if (!tbody) return;
      Array.from(tbody.children).forEach((tr, i) => { tr.hidden = sim.p.fails && (!res[i] || res[i].ok); });
    };
    const fill = (i) => {
      if (!tbody) return;
      const r = res[i], c = P.CHECKS[i], tr = tbody.children[i];
      tr.querySelector('[data-k="v"]').innerHTML = fmt(r.v) + (c.unit ? ' ' + c.unit : '');
      tr.querySelector('[data-k="r"]').innerHTML = fmt(r.ref) + (c.unit ? ' ' + c.unit : '');
      tr.querySelector('[data-k="e"]').innerHTML = `${isFinite(r.err) ? CC.sci(r.err, 1) : '—'} (${c.tol}${c.rel ? ' rel.' : ''})`;
      tr.querySelector('[data-k="s"]').innerHTML = r.ok ? '<span class="vstat ok">OK</span>' : `<span class="vstat bad" title="${r.msg || ''}">FALLA</span>`;
    };
    const start = () => {
      if (running) return;
      buildTable();
      res = new Array(N).fill(null);
      if (tbody) Array.from(tbody.children).forEach((tr) => { tr.querySelector('[data-k="s"]').innerHTML = '<span class="vstat pend">pendiente</span>'; tr.querySelector('[data-k="v"]').innerHTML = '—'; });
      running = true; t0 = performance.now(); btn.disabled = true;
      let i = 0;
      const step = () => {
        const tStart = performance.now();
        while (i < N && performance.now() - tStart < 40) {
          const r = P.runCheck(P.CHECKS[i]);
          res[i] = r; fill(i); i++;
        }
        sim.redraw();
        if (i < N) setTimeout(step, 0);
        else { running = false; tEnd = performance.now(); btn.disabled = false; filter(); sim.redraw(); }
      };
      setTimeout(step, 30);
    };
    sim.onDraw(() => {
      buildTable();
      CC.draw.clear(cv);
      const caps = Array.from(new Set(P.CHECKS.map((c) => c.cap))).sort((a, b) => a - b);
      const by = {};
      P.CHECKS.forEach((c, i) => { (by[c.cap] = by[c.cap] || []).push(i); });
      const ymax = Math.max(...caps.map((c) => by[c].length)) + 1;
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.min(...caps) - 0.7, xmax: Math.max(...caps) + 0.7, ymin: 0, ymax, xticks: caps, xfmt: (v) => String(v), xlabel: 'capítulo', ylabel: 'pruebas', mb: 40 });
      pl.frame();
      const cOk = CC.col('--c3'), cBad = CC.col('--c2'), cPend = CC.alpha('--ink-3', 0.35);
      pl.clip((ctx) => {
        for (const cap of caps) {
          by[cap].forEach((i, j) => {
            const r = res[i];
            ctx.fillStyle = !r ? cPend : r.ok ? cOk : cBad;
            const x0 = pl.X(cap - 0.36), x1 = pl.X(cap + 0.36), y0 = pl.Y(j), y1 = pl.Y(j + 1);
            ctx.fillRect(x0, y1 + 1, x1 - x0, y0 - y1 - 2);
          });
        }
      });
      const done = res.filter(Boolean), ok = done.filter((r) => r.ok).length;
      sim.set('st', running ? `ejecutando… ${done.length} de ${N}` : done.length ? (ok === N ? 'todas las pruebas superadas' : `${N - ok} pruebas fallaron`) : 'listo para ejecutar');
      sim.set('ok', done.length ? `${ok} de ${done.length}` : '—');
      sim.set('t', done.length ? CC.fix(((running ? performance.now() : tEnd) - t0) / 1000, 1) + ' s' : '—');
    });
    sim.legend([{ label: 'superada', color: '--c3', kind: 'sq' }, { label: 'fallida', color: '--c2', kind: 'sq' }, { label: 'pendiente', color: '--ink-3', kind: 'sq' }]);
  });
})();
