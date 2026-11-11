/* Capítulo 5 — Autómatas finitos y expresiones regulares */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, F = L.fsa;

  /* Dibuja un AFD (sin el estado de error) con capas BFS. activo = estado resaltado */
  function dibujarAFD(cv, d, activo, trazaArcos) {
    NL.draw.clear(cv);
    const ctx = cv.ctx, w = cv.w, h = cv.h;
    const err = F.errorState(d);
    const nodos = []; for (let q = 0; q < d.n; q++) if (q !== err) nodos.push(q);
    /* capas por BFS */
    const capa = new Map([[d.start, 0]]), cola = [d.start];
    while (cola.length) { const q = cola.shift(); for (const c of d.alphabet) { const t = d.delta[q].get(c); if (t !== err && !capa.has(t)) { capa.set(t, capa.get(q) + 1); cola.push(t); } } }
    const nCap = Math.max(...capa.values()) + 1;
    const porCapa = Array.from({ length: nCap }, () => []);
    nodos.forEach((q) => { if (capa.has(q)) porCapa[capa.get(q)].push(q); });
    const R = Math.max(11, Math.min(17, w / (nCap * 3.4)));
    const pos = new Map();
    porCapa.forEach((g, i) => g.forEach((q, j) => pos.set(q, [30 + R + (nCap === 1 ? 0 : (i * (w - 60 - 2 * R)) / (nCap - 1)), h * ((j + 1) / (g.length + 1))])));
    /* aristas agrupadas */
    const aristas = new Map();
    nodos.forEach((q) => { for (const c of d.alphabet) { const t = d.delta[q].get(c); if (t === err || !pos.has(t)) continue; const k = q + '>' + t; if (!aristas.has(k)) aristas.set(k, { a: q, b: t, sy: [] }); aristas.get(k).sy.push(c); } });
    const pares = new Set(Array.from(aristas.keys()));
    ctx.lineWidth = 1.5; ctx.font = `600 ${Math.max(10, R * 0.75)}px ${NL.FONT_MONO}`;
    const resumir = (sy) => { if (sy.length <= 3) return sy.join(','); const s = sy.slice().sort().join(''); return sy.length === d.alphabet.length ? '∗' : (/^[0-9]+$/.test(s) && sy.length === 10 ? '0-9' : sy.slice(0, 2).join(',') + ',…'); };
    for (const e of aristas.values()) {
      const [x1, y1] = pos.get(e.a), [x2, y2] = pos.get(e.b);
      const act = trazaArcos && trazaArcos.has(e.a + '>' + e.b);
      ctx.strokeStyle = act ? NL.col('--accent') : NL.col('--ink-3'); ctx.lineWidth = act ? 2.6 : 1.4;
      let lx, ly;
      if (e.a === e.b) {
        ctx.beginPath(); ctx.arc(x1, y1 - R - 8, 9, 0.2 * Math.PI, 2.8 * Math.PI); ctx.stroke();
        NL.draw.arrow(ctx, x1 + 6, y1 - R - 1.5, x1 + 4, y1 - R, { color: act ? '--accent' : '--ink-3', width: 1.4, head: 6 });
        lx = x1; ly = y1 - R - 24;
      } else {
        const dx = x2 - x1, dy = y2 - y1, L2 = Math.hypot(dx, dy), ux = dx / L2, uy = dy / L2;
        const rev = pares.has(e.b + '>' + e.a), back = capa.get(e.b) <= capa.get(e.a);
        const off = rev || back ? (back ? 34 : 18) * (e.a < e.b ? 1 : -1) : 0;
        const mx = (x1 + x2) / 2 - uy * off, my = (y1 + y2) / 2 + ux * off;
        const sx = x1 + ux * R, sy = y1 + uy * R;
        /* punto de llegada ajustado a la circunferencia */
        const tx = x2 - (x2 - mx) / Math.hypot(x2 - mx, y2 - my) * R, ty = y2 - (y2 - my) / Math.hypot(x2 - mx, y2 - my) * R;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
        NL.draw.arrow(ctx, tx - (tx - mx) * 0.08, ty - (ty - my) * 0.08, tx, ty, { color: act ? '--accent' : '--ink-3', width: 1.4, head: 7 });
        lx = 0.25 * x1 + 0.5 * mx + 0.25 * x2; ly = 0.25 * y1 + 0.5 * my + 0.25 * y2 - 6;
      }
      NL.text(ctx, resumir(e.sy), lx, ly, { size: Math.max(10, R * 0.7), mono: true, align: 'center', halo: true, color: act ? '--accent' : '--ink-2', weight: 700 });
    }
    for (const q of nodos) {
      if (!pos.has(q)) continue;
      const [x, y] = pos.get(q);
      ctx.fillStyle = q === activo ? NL.col('--accent') : NL.col('--surface');
      ctx.strokeStyle = q === activo ? NL.col('--accent') : NL.col('--ink'); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); ctx.stroke();
      if (d.finals.has(q)) { ctx.beginPath(); ctx.arc(x, y, R - 3.5, 0, 7); ctx.stroke(); }
      NL.text(ctx, 'q' + q, x, y + 4, { size: Math.max(10, R * 0.72), align: 'center', color: q === activo ? '--accent-ink' : '--ink', weight: 700 });
    }
    const [sx0, sy0] = pos.get(d.start);
    NL.draw.arrow(ctx, sx0 - R - 24, sy0, sx0 - R, sy0, { color: '--ink', width: 1.6, head: 8 });
    if (err >= 0) NL.text(ctx, 'No se dibuja el estado de error: toda transición no mostrada lleva a él.', 8, h - 8, { size: 11, color: '--ink-3' });
  }

  const PRESETS = [
    ['ba+!', 'ba+!', 'baaa!', 'ba!'], ['(a|b)*abb', '(a|b)*abb', 'babaabb', 'ab'], ['(a|b)*a(a|b)(a|b)', '(a|b)*a(a|b)(a|b)', 'abbabab', 'ab'],
    ['[0-9]+(,[0-9]+)?', '[0-9]+(,[0-9]+)?', '14,50', '0123456789,'], ['(gat|libr|cas)(o|a)s?', '(gat|libr|cas)(o|a)s?', 'gatas', 'gatoscibr'], ['(ab|ba)+', '(ab|ba)+', 'abbaab', 'ab']
  ];
  NL.defineSim('automata', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Diagrama de estados del autómata finito determinista mínimo' });
    const box = sim.html('pad');
    sim.group('Autómata');
    sim.select('p', { label: 'Expresión regular', options: PRESETS.map((p, i) => [i, p[0]]), value: 0, onInput: (i) => { cad.set(PRESETS[i][2], true); cad.input.value = PRESETS[i][2]; } });
    const cad = sim.text('s', { label: 'Cadena de entrada', value: PRESETS[0][2] });
    const sl = sim.slider('i', { label: 'Símbolos leídos', min: 0, max: 8, step: 1, value: 8, fmt: (v) => String(v) });
    sim.out('afn', 'Estados del AFN (Thompson)');
    sim.out('afd', 'Estados del AFD (subconjuntos)');
    sim.out('min', 'Estados del AFD mínimo', { hl: true });
    sim.out('res', 'Veredicto', { hl: true });
    let cache = null;
    const get = () => {
      const p = PRESETS[sim.p.p];
      if (!cache || cache.rx !== p[0]) { const n = F.nfa(p[1], p[3].split('')); const d = F.dfa(n); cache = { rx: p[0], n, d, m: F.minimizar(d) }; }
      return cache;
    };
    sim.onDraw(() => {
      const c = get(), s = sim.p.s || '';
      const i = Math.min(sim.p.i, s.length);
      sl.range(0, Math.max(1, s.length), 1);
      const path = F.caminoAFD(c.m, s);
      const k = Math.min(i, path.length - 1);
      const activo = path[k] === -1 ? c.m.start : path[k];
      const arcos = new Set(); for (let j = 0; j < k && path[j + 1] !== -1; j++) arcos.add(path[j] + '>' + path[j + 1]);
      dibujarAFD(cv, c.m, path[k] === -1 ? -9 : activo, arcos);
      const rest = s.slice(0, k), muerto = path.slice(0, k + 1).includes(-1) || (path[k] !== undefined && path[k] === F.errorState(c.m));
      const acepta = F.aceptaAFD(c.m, s), acN = F.aceptaAFN(c.n, s);
      sim.set('afn', String(c.n.n)); sim.set('afd', String(c.d.n)); sim.set('min', String(c.m.n));
      sim.set('res', acepta ? 'aceptada' : 'rechazada');
      box.innerHTML = `<div class="tk-row">${s.split('').map((ch, j) => `<span class="tk${j < k ? ' on' : ''}${j === k - 1 && muerto ? ' bad' : ''}"><span>${ch.replace(/</g, '&lt;')}</span><small>${j + 1}</small></span>`).join('') || '<span style="color:var(--ink-3)">(cadena vacía)</span>'}</div>` +
        `<p style="margin:6px 0 0">Tras leer «${rest.replace(/</g, '&lt;')}» el AFD está en ${path[k] === -1 || muerto ? '<b style="color:var(--loss)">el estado de error</b>' : '<b>q' + activo + '</b>' + (c.m.finals.has(activo) ? ' (final)' : ' (no final)')}. Veredicto de la cadena completa: <b>${acepta ? 'aceptada' : 'rechazada'}</b>` + (acepta === acN ? ' · el AFN de Thompson coincide.' : ' · ¡el AFN no coincide!') + '</p>';
    });
  });

  NL.defineSim('contador', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Estados del autómata mínimo para aⁿbⁿ con n hasta k' });
    sim.group('Contar hasta k');
    sim.slider('k', { label: 'k (n máximo)', min: 1, max: 12, step: 1, value: 4, fmt: (v) => String(v) });
    sim.out('e', 'Estados del AFD mínimo', { hl: true });
    sim.out('f', 'Fórmula 2k + 2');
    sim.out('r', 'Cadenas del lenguaje');
    const memo = {};
    const est = (k) => memo[k] || (memo[k] = F.minimizar(F.dfa(F.nfa(F.anbn(k)))).n);
    sim.onDraw(() => {
      const k = sim.p.k;
      sim.set('e', String(est(k))); sim.set('f', String(2 * k + 2)); sim.set('r', String(k + 1));
      NL.draw.clear(cv);
      const xs = [], ys = []; for (let j = 1; j <= 12; j++) { xs.push(j); ys.push(est(j)); }
      const pl = new NL.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 12.5, ymin: 0, ymax: 28, xlabel: 'k', ylabel: 'estados necesarios', mb: 32 });
      pl.frame();
      pl.xy(xs, ys, { color: '--c1', width: 2.2 });
      xs.forEach((x, i) => pl.dot(x, ys[i], { color: x === k ? '--c2' : '--c1', r: x === k ? 6 : 3.5 }));
      pl.label(1, 25, 'cada n más obliga a añadir 2 estados: no hay límite finito', { size: 11.5, color: '--ink-3' });
    });
  });

  NL.bank.add('automatas', [
    { q: '¿Qué es un estado final en un autómata finito?', opts: ['El primero que se visita', 'Un estado en el que, al terminar la cadena, esta se acepta', 'El estado de error', 'Un estado sin transiciones'], ok: 1, fb: 'La cadena se acepta si al leer todos sus símbolos el autómata está en un estado de F.', lvl: 1 },
    { q: '¿Qué distingue a un AFN de un AFD?', opts: ['El AFN no tiene estado inicial', 'Un AFN puede tener varias transiciones por símbolo y transiciones ε', 'El AFD reconoce más lenguajes', 'El AFN no acepta nada'], ok: 1, fb: 'Pero reconocen los mismos lenguajes: todo AFN tiene un AFD equivalente.', lvl: 2 },
    { q: 'La construcción de subconjuntos puede hacer crecer el número de estados hasta…', opts: ['n + 1', '2n', '2ⁿ', 'n²'], ok: 2, fb: 'Cada estado del AFD es un conjunto de estados del AFN: hasta 2ⁿ conjuntos.', lvl: 2 },
    { q: '¿Cuántos estados tiene el AFD mínimo de «el tercer símbolo desde el final es a» sobre {a, b}?', num: 8, tol: 0, fb: '\\(2^3=8\\): debe recordar los tres últimos símbolos.', lvl: 3 },
    { q: '¿Qué teorema relaciona las expresiones regulares con los autómatas finitos?', opts: ['El de Kleene: describen exactamente los mismos lenguajes', 'El de Pitágoras', 'El de Shannon', 'El teorema del bombeo prueba que son distintos'], ok: 0, fb: 'Kleene (1951): los lenguajes regulares son exactamente los que reconoce un autómata finito.', lvl: 1 },
    { q: '¿Por qué <b>ba+!</b> se rechaza «baa!!»?', opts: ['Tiene demasiadas a', 'Después del primer «!» no hay transición: el autómata entra en estado de error', 'Empieza por b', 'Es demasiado largo'], ok: 1, fb: 'El estado final q3 no tiene transiciones de salida.', lvl: 2 },
    { q: 'La morfotáctica (gat|libr|cas)(o|a)s? acepta «libras». ¿Qué falla?', opts: ['El autómata no está minimizado', 'No codifica el género de cada raíz, así que sobregenera', 'La expresión tiene un error de sintaxis', 'Las raíces están en minúsculas'], ok: 1, fb: 'Un reconocedor sin rasgos acepta combinaciones que el español no permite; hacen falta rasgos y transductores.', lvl: 2 },
    { q: '¿Por qué {aⁿbⁿ} no es regular?', opts: ['Porque es infinito', 'Porque exige contar sin límite y un autómata finito solo tiene memoria acotada', 'Porque contiene la cadena vacía', 'Porque usa dos símbolos'], ok: 1, fb: 'Para cada n fijo hay un AFD, pero necesita cada vez más estados.', lvl: 2 },
    { q: '¿Cuántos estados necesita el AFD mínimo de {aⁿbⁿ : n ≤ 3}, contando el estado de error?', num: 8, tol: 0, fb: '\\(2k+2=8\\) para k = 3.', lvl: 3 },
    { q: 'En la jerarquía de Chomsky, la sintaxis del lenguaje natural se suele modelar con…', opts: ['Gramáticas regulares', 'Gramáticas libres de contexto (autómata con pila)', 'Solo máquinas de Turing', 'Listas de palabras'], ok: 1, fb: 'La recursión y el anidamiento exigen más que un autómata finito: una pila.', lvl: 2 }
  ]);
})();
