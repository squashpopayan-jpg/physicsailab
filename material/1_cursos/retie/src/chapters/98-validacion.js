/* Apéndice D — Validación en el navegador */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L;
  const fmt = (v) => (typeof v !== 'number' || !isFinite(v) ? String(v) : Math.abs(v) >= 1e6 ? '0x' + (v >>> 0).toString(16).toUpperCase() : RT.L.C.fmt(v, Math.abs(v) >= 100 ? 2 : 4));

  RT.defineSim('validacion', function (sim) {
    const cv = sim.canvas({ aspect: 4.2 });
    const P = L.PRUEBAS(), N = P.length;
    sim.group('Pruebas');
    sim.note(`${N} pruebas de los capítulos 5 a 32. Tardan menos de un segundo.`);
    const btn = sim.button(`Ejecutar las ${N} pruebas`, () => correr(), { primary: true });
    sim.check('fallas', { label: 'Mostrar solo las que fallan', value: false, onInput: () => filtrar() });
    sim.out('st', 'Estado', { hl: true });
    sim.out('ok', 'Superadas');
    let res = new Array(N).fill(null), tbody = null;
    const tabla = () => {
      const host = document.getElementById('val-tabla');
      if (!host || tbody) return;
      const tb = document.createElement('table');
      tb.className = 'vtable valtab';
      tb.innerHTML = '<thead><tr><th>Cap.</th><th>Prueba</th><th class="num">Calculado</th><th class="num">Referencia</th><th>Fuente</th><th class="num">Error (tolerancia)</th><th>Estado</th></tr></thead>';
      tbody = document.createElement('tbody');
      P.forEach((p) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.cap}</td><td>${p.que}</td><td class="num" data-k="v">—</td><td class="num" data-k="r">${typeof p.ref === 'function' ? 'cálculo a mano' : fmt(p.ref)}</td><td class="src">${p.fuente}</td><td class="num" data-k="e">tol ${fmt(p.tol)}${p.rel ? ' (rel.)' : ''}</td><td data-k="s"><span class="vstat pend">pendiente</span></td>`;
        tbody.append(tr);
      });
      tb.append(tbody);
      host.innerHTML = '';
      host.append(tb);
    };
    const filtrar = () => { if (tbody) Array.from(tbody.children).forEach((tr, i) => { tr.hidden = sim.p.fallas && (!res[i] || res[i].ok); }); };
    const correr = () => {
      tabla();
      btn.disabled = true;
      const t0 = performance.now();
      res = P.map((p) => L.ejecutarPrueba(p));
      res.forEach((r, i) => {
        if (!tbody) return;
        const tr = tbody.children[i];
        tr.querySelector('[data-k="v"]').textContent = fmt(r.v);
        tr.querySelector('[data-k="r"]').textContent = fmt(r.ref);
        tr.querySelector('[data-k="e"]').textContent = `${isFinite(r.err) ? (r.err === 0 ? '0' : r.err.toExponential(1).replace('.', ',')) : '—'} (${fmt(P[i].tol)}${P[i].rel ? ' rel.' : ''})`;
        tr.querySelector('[data-k="s"]').innerHTML = r.ok ? '<span class="vstat ok">OK</span>' : `<span class="vstat bad" title="${r.msg || ''}">FALLA</span>`;
      });
      const ok = res.filter((r) => r.ok).length;
      sim.set('st', ok === N ? '<span class="chip ok">todas superadas</span>' : `<span class="chip bad">${N - ok} fallan</span>`);
      sim.set('ok', `${ok} de ${N} · ${RT.L.C.fmt(performance.now() - t0, 0)} ms`);
      btn.disabled = false;
      filtrar();
      sim.redraw();
    };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const w = (W - 20) / N;
      res.forEach((r, i) => {
        ctx.fillStyle = r === null ? RT.col('--rule') : r.ok ? RT.col('--ok') : RT.col('--bad');
        ctx.fillRect(10 + i * w + 1, H * 0.3, Math.max(1, w - 2), H * 0.4);
      });
      RT.text(ctx, res[0] ? 'Cada barra es una prueba' : 'Pulse «Ejecutar» para correr las pruebas', W / 2, H * 0.18, { size: 11.5, align: 'center', color: '--ink-3' });
    });
    sim.set('st', 'sin ejecutar');
    sim.set('ok', '—');
  });
})();
