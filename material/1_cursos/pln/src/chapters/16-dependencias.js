/* Capítulo 16 — Gramáticas de dependencias */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, D = L.dep;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const frases = D.DATA.map((s, i) => [i, s.w.join(' ') + (i === 10 ? '  (variante: cuelga del nombre)' : '')]);

  /* Diagrama de arcos de dependencias sobre un lienzo. arcos: [{h, d, rel, col}] con índices 1..n y 0 = raíz */
  function dibujarArcos(cv, s, heads, rels, o = {}) {
    NL.draw.clear(cv);
    const ctx = cv.ctx, w = cv.w, h = cv.h, n = s.w.length;
    ctx.font = `600 ${Math.max(11, Math.min(14, w / (n * 5.6)))}px ${NL.FONT_MONO}`;
    const fs = Math.max(11, Math.min(14, w / (n * 5.6)));
    const anchos = s.w.map((x) => ctx.measureText(x).width + 14), tot = anchos.reduce((a, b) => a + b, 0), sc = Math.min(1, (w - 20) / tot);
    const xs = []; let x = (w - tot * sc) / 2;
    anchos.forEach((a) => { xs.push(x + (a * sc) / 2); x += a * sc; });
    const base = h - 40;
    s.w.forEach((p, i) => { NL.text(ctx, p, xs[i], base, { size: fs, mono: true, align: 'center', weight: 700 }); NL.text(ctx, s.pos[i], xs[i], base + 16, { size: Math.max(9, fs - 3.5), align: 'center', color: '--ink-3', weight: 600 }); });
    const altura = (a, b) => Math.min(base - 24, 16 + Math.abs(a - b) * 26);
    heads.forEach((hd, i) => {
      const d = i + 1, xd = xs[i], xh = hd === 0 ? xs[i] : xs[hd - 1];
      const bien = !o.gold || o.gold.head[i] === hd;
      const col = o.mal && !bien ? '--loss' : '--c1';
      if (hd === 0) { NL.draw.arrow(ctx, xd, 14, xd, base - 16, { color: col, width: 1.8, head: 7 }); NL.text(ctx, rels[i] || 'root', xd + 5, 24, { size: Math.max(9, fs - 3), color: col, weight: 700, mono: true }); return; }
      const yt = base - 16, hg = altura(d, hd);
      ctx.strokeStyle = NL.col(col); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xh, yt); ctx.bezierCurveTo(xh, yt - hg * 1.25, xd, yt - hg * 1.25, xd, yt); ctx.stroke();
      NL.draw.arrow(ctx, xd, yt - 7, xd, yt, { color: col, width: 1.4, head: 7 });
      if (o.etiquetas !== false) NL.text(ctx, rels[i] || '', (xh + xd) / 2, yt - hg * 0.94 - 2, { size: Math.max(9, fs - 3.5), mono: true, align: 'center', halo: true, color: col, weight: 700 });
    });
  }

  NL.defineSim('dependencias', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Árbol de dependencias de la oración' });
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('s', { label: 'Oración', options: frases, value: 0 });
    sim.check('e', { label: 'Mostrar las relaciones (Universal Dependencies)', value: true });
    sim.out('n', 'Palabras', { hl: true });
    sim.out('r', 'Raíz');
    sim.out('p', '¿Proyectivo?');
    sim.out('c', 'Distancia media de los arcos');
    sim.onDraw(() => {
      const s = D.DATA[sim.p.s];
      dibujarArcos(cv, s, s.head, s.rel, { etiquetas: sim.p.e });
      const raiz = s.w[s.head.indexOf(0)];
      sim.set('n', String(s.w.length)); sim.set('r', raiz); sim.set('p', D.proyectivo(s.head) ? 'sí' : 'no');
      sim.set('c', NL.fix(s.head.reduce((a, h, i) => a + (h ? Math.abs(h - (i + 1)) : 0), 0) / (s.head.length - 1), 2));
      box.innerHTML = `<table class="mx" style="text-align:left"><thead><tr><th style="text-align:left">Palabra</th><th style="text-align:left">Etiqueta</th><th style="text-align:left">Cabeza</th><th style="text-align:left">Relación</th></tr></thead><tbody>${s.w.map((w, i) => `<tr><td style="text-align:left">${i + 1} ${esc(w)}</td><td style="text-align:left">${s.pos[i]}</td><td style="text-align:left">${s.head[i] ? s.head[i] + ' ' + esc(s.w[s.head[i] - 1]) : '0 (raíz)'}</td><td style="text-align:left">${s.rel[i]}</td></tr>`).join('')}</tbody></table>`;
    });
  });

  NL.defineSim('transiciones', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('s', { label: 'Oración', options: frases.slice(0, 10), value: 4 });
    const sl = sim.slider('t', { label: 'Transición', min: 0, max: 16, step: 1, value: 4, fmt: (v) => String(v) });
    sim.out('t', 'Transiciones totales', { hl: true });
    sim.out('a', 'Arcos construidos');
    sim.onDraw(() => {
      const s = D.DATA[sim.p.s], n = s.w.length, tr = D.oraculo(s.head), ex = D.ejecutar(n, tr);
      sl.range(0, tr.length, 1);
      const k = Math.min(sim.p.t, tr.length), st = ex.pasos[k];
      sim.set('t', `${tr.length} = 2 × ${n}`);
      const arcos = ex.pasos.slice(1, k + 1).filter((p) => p.arco);
      sim.set('a', `${arcos.length} de ${n}`);
      const nom = (i) => (i === 0 ? 'ROOT' : s.w[i - 1]);
      box.innerHTML = `<div class="tk-row"><span class="tk on"><span>${st.t || 'inicio'}</span><small>última transición</small></span>${tr.map((t, i) => `<span class="tk ${i < k ? 'ok' : ''}" style="opacity:${i < k ? 1 : 0.45}"><span style="font-size:11px">${t}</span></span>`).join('')}</div>` +
        `<table class="mx" style="text-align:left"><tbody><tr><th style="text-align:left">Pila</th><td style="text-align:left">${st.pila.map(nom).map(esc).join(' · ')}</td></tr><tr><th style="text-align:left">Buffer</th><td style="text-align:left">${st.buf.map(nom).map(esc).join(' · ') || '∅'}</td></tr><tr><th style="text-align:left">Arcos</th><td style="text-align:left">${arcos.map((p) => esc(nom(p.arco[0])) + ' → ' + esc(nom(p.arco[1]))).join(' ; ') || '—'}</td></tr></tbody></table>` +
        '<p style="font-size:12.5px;color:var(--ink-3);margin:6px 0 0"><b>SH</b> mueve la primera palabra del buffer a la pila. <b>LA</b> (arco izquierdo) hace que la palabra de la cima sea cabeza de la anterior y quita la anterior. <b>RA</b> (arco derecho) hace que la penúltima sea cabeza de la de la cima y quita la cima.</p>';
    });
  });

  NL.defineSim('mst-parser', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Análisis de dependencias por árbol de expansión máximo; en rojo, las cabezas erróneas' });
    const box = sim.html('pad');
    sim.group('Evaluación dejando una oración fuera');
    sim.select('s', { label: 'Oración a analizar', options: frases.slice(0, 10), value: 0 });
    sim.slider('d', { label: 'Penalización por distancia', min: 0, max: 0.5, step: 0.05, value: 0.15, fmt: (v) => NL.fix(v, 2) });
    sim.out('u', 'UAS de esta oración', { hl: true });
    sim.out('g', 'UAS medio (10 oraciones, una a una)');
    sim.out('l', 'LAS de esta oración');
    sim.onDraw(() => {
      const i = sim.p.s, ds = D.DATA.slice(0, 10), s = ds[i];
      const analiza = (idx, pen) => {
        const m = D.entrenarGrafo(ds.filter((_, j) => j !== idx));
        const sc = m.score(ds[idx]);
        for (let h = 0; h < sc.length; h++) for (let d = 1; d < sc.length; d++) if (h !== d) sc[h][d] += (0.15 - pen) * Math.abs(h - d);
        const head = D.mst(sc);
        return { head, rel: head.map((h, k) => m.etiqueta(h === 0 ? null : ds[idx].pos[h - 1], ds[idx].pos[k])) };
      };
      const p = analiza(i, sim.p.d), me = D.metricas(p, s, { sinPunct: true });
      let tot = 0; ds.forEach((_, k) => { tot += D.metricas(analiza(k, sim.p.d), ds[k], { sinPunct: true }).uas; });
      sim.set('u', NL.pct(me.uas, 0)); sim.set('l', NL.pct(me.las, 0)); sim.set('g', NL.pct(tot / ds.length, 0));
      dibujarArcos(cv, s, p.head, p.rel, { gold: s, mal: true });
      box.innerHTML = `<small style="color:var(--ink-3)">Cabeza predicha frente a la de referencia (la puntuación se excluye)</small><div class="tk-row">${s.w.map((w, k) => `<span class="tk ${s.rel[k] === 'punct' ? '' : p.head[k] === s.head[k] ? 'ok' : 'bad'}"><span>${esc(w)}</span><small>${p.head[k]} ${p.head[k] === s.head[k] ? '' : '≠ ' + s.head[k]}</small></span>`).join('')}</div>`;
    });
  });

  NL.bank.add('dependencias', [
    { q: 'Una gramática de dependencias describe la oración…', opts: ['Con constituyentes y sintagmas', 'Con relaciones entre palabras: cada palabra depende de una cabeza', 'Con probabilidades de letras', 'Con árboles binarios solamente'], ok: 1, fb: 'No hay nodos intermedios: solo palabras y relaciones gramaticales entre ellas.', lvl: 1 },
    { q: 'En una gramática de dependencias, la raíz de la oración suele ser…', opts: ['El sujeto', 'El verbo principal', 'La primera palabra', 'La puntuación'], ok: 1, fb: 'Del verbo cuelgan sujeto, objeto y complementos.', lvl: 1 },
    { q: 'En «el gato duerme», la relación entre «gato» y «duerme» es…', opts: ['det', 'nsubj (sujeto nominal)', 'obj', 'root'], ok: 1, fb: '«Duerme» es la cabeza; «gato» es su sujeto.', lvl: 2 },
    { q: 'Un árbol de dependencias es proyectivo si…', opts: ['Tiene una sola raíz', 'Ninguno de sus arcos se cruza con otro', 'Todas las palabras tienen etiqueta', 'No tiene ciclos'], ok: 1, fb: 'La mayoría de las construcciones del español lo son; el análisis por transiciones sencillo solo produce árboles proyectivos.', lvl: 2 },
    { q: 'Con el sistema arc-standard, una oración de n palabras necesita…', opts: ['n transiciones', '2n transiciones', 'n² transiciones', 'n log n transiciones'], ok: 1, fb: 'n desplazamientos y n arcos (izquierdos o derechos).', lvl: 2 },
    { q: '¿Cuántas transiciones necesita «el gato duerme en la alfombra roja .» (8 palabras)?', num: 16, tol: 0, fb: '2 × 8 = 16 (8 SH y 8 arcos).', lvl: 3 },
    { q: '¿Qué hace el análisis por grafos (Chu-Liu/Edmonds)?', opts: ['Aplica reglas descendentes', 'Puntúa todos los posibles arcos y elige el árbol de mayor puntuación total', 'Cuenta palabras', 'Elimina la puntuación'], ok: 1, fb: 'Busca el árbol de expansión máximo dirigido con raíz en 0; los ciclos se contraen y se resuelven recursivamente.', lvl: 2 },
    { q: 'UAS (unlabeled attachment score) es…', opts: ['La fracción de palabras con la cabeza correcta', 'La fracción con cabeza y relación correctas', 'La fracción de oraciones sin errores', 'La proyectividad'], ok: 0, fb: 'LAS exige además que la etiqueta de la relación sea la correcta.', lvl: 1 },
    { q: 'Una oración de 8 palabras, una de ellas puntuación excluida; 5 de las 7 cabezas restantes son correctas. ¿UAS en %?', num: 71.4, tol: 0.2, unit: '%', fb: '5/7 = 71,4 %.', lvl: 3 },
    { q: 'La ambigüedad de «vi un elefante en mi pijama» en dependencias se ve en…', opts: ['La raíz', 'De qué palabra cuelga «pijama»: de «vi» (obl) o de «elefante» (nmod)', 'La etiqueta de «yo»', 'No existe'], ok: 1, fb: 'Es la misma ambigüedad de colgado del sintagma preposicional que en los árboles de constituyentes.', lvl: 2 }
  ]);
})();
