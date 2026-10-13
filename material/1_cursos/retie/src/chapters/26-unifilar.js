/* Capítulo 26 — Diagrama unifilar y puesta a tierra (E04) */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, N = L.N;

  RT.defineSim('simbolos', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    const lista = N.SIMBOLOS.filter((k) => RT.SIMB[k]);
    sim.group('Modo');
    sim.seg('m', { options: [['ver', 'Galería'], ['prac', 'Práctica']], value: 'ver' });
    sim.out('p', 'Aciertos', { hl: true });
    let preg = null, ok = 0, tot = 0, resp = null;
    const nueva = () => { const k = lista[Math.floor(Math.random() * lista.length)]; const ops = new Set([k]); while (ops.size < 4) ops.add(lista[Math.floor(Math.random() * lista.length)]); preg = { k, ops: [...ops].sort(() => Math.random() - 0.5) }; resp = null; };
    const pintar = () => {
      if (sim.p.m === 'ver') {
        box.innerHTML = '<div class="simb-grid">' + lista.map((k) => `<figure>${RT.simboloSVG(k, 56)}<figcaption>${RT.SIMB[k].n}</figcaption></figure>`).join('') + '</div><p style="font:12.5px var(--font-ui);color:var(--ink-3)">Redibujados de la Tabla 1.3.4.a del Libro 1 del RETIE (Res. 40284 de 2026). Use el original para las láminas.</p>';
      } else {
        if (!preg) nueva();
        box.innerHTML = `<div style="display:grid;justify-items:center;gap:10px;padding:10px">${RT.simboloSVG(preg.k, 110)}<div class="ctrl-row" style="justify-content:center">${preg.ops.map((k) => `<button type="button" class="btn${resp && k === preg.k ? ' on' : ''}" data-k="${k}" style="${resp === k && k !== preg.k ? 'border-color:var(--bad)' : ''}">${RT.SIMB[k].n}</button>`).join('')}</div>${resp ? `<button type="button" class="btn primary" id="simb-sig">Siguiente</button>` : ''}</div>`;
        box.querySelectorAll('button[data-k]').forEach((b) => b.addEventListener('click', () => { if (resp) return; resp = b.dataset.k; tot++; if (resp === preg.k) ok++; pintar(); }));
        const sg = box.querySelector('#simb-sig'); if (sg) sg.addEventListener('click', () => { nueva(); pintar(); });
      }
      sim.set('p', tot ? `${ok} de ${tot}` : '—');
    };
    sim.onChange = pintar;
    pintar();
  });

  RT.defineSim('unifilar', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    box.style.padding = '6px';
    sim.stage.append(box);
    sim.group('Diagrama');
    sim.out('d', 'Demanda');
    sim.out('a', 'Acometida y totalizador', { hl: true });
    sim.out('s', 'Puesta a tierra', { wide: true });
    RT.botonDescarga(sim.ctrlBox, 'Descargar unifilar (SVG)', () => ['unifilar-casa-ejemplo.svg', RT.unifilarSVG(K, { ink: '#1B1F22', bg: '#FFFFFF' }), 'image/svg+xml']);
    sim.onDraw(() => {
      box.innerHTML = RT.unifilarSVG(K, { ink: 'var(--ink)', acc: 'var(--accent)', verde: 'var(--l-tierra)', gris: 'var(--ink-3)' }).replace('<svg ', '<svg style="max-width:none;width:100%;min-width:900px;height:auto" ');
      const ac = L.Q.acometida(K);
      sim.set('d', RT.f(ac.dem.total, 0) + ' VA · ' + RT.f(ac.I, 1) + ' A');
      sim.set('a', ac.awg + ' AWG Cu · 2P ' + ac.In + ' A');
      const r = L.C.rVarillas(100, 2.4, 15.9, K.electrico.tierra.varillas);
      sim.set('s', `2 varillas de 2,4 m separadas 2,4 m: ${RT.f(r.R, 1)} Ω con ρ = 100 Ω·m (valor de referencia 25 Ω, Tabla 3.12.3.a); conductor del electrodo 8 AWG (Tabla 250-66).`);
    });
  });
})();
