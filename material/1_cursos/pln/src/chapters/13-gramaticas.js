/* Capítulo 13 — Gramáticas libres de contexto y estructura sintagmática */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, G = L.cfg;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Dibuja un árbol sintáctico [símbolo, hijos…] en un lienzo. o = {color: función(símbolo)→color, resaltar: Set de nodos} */
  NL.drawTree = function (cv, tree, o = {}) {
    NL.draw.clear(cv);
    const ctx = cv.ctx, w = cv.w, h = cv.h;
    let nHojas = 0, prof = 0;
    const lay = (t, d) => {
      prof = Math.max(prof, d);
      if (typeof t === 'string') { const n = { label: t, leaf: true, i: nHojas++, d }; n.x = n.i; return n; }
      const kids = t.slice(1).map((k) => lay(k, d + 1));
      const n = { label: t[0], kids, d, x: (kids[0].x + kids[kids.length - 1].x) / 2 };
      return n;
    };
    const root = lay(tree, 0);
    const mx = 18, ancho = Math.max(1, nHojas - 1) || 1;
    const X = (x) => (nHojas === 1 ? w / 2 : mx + 8 + (x * (w - 2 * mx - 16)) / ancho), top = 24, bot = h - 22;
    const dy = prof ? (bot - top - 18) / (prof - 1 || 1) : 0;
    const Y = (n) => (n.leaf ? bot : top + n.d * Math.min(dy, 46));
    const fs = Math.max(10, Math.min(13.5, w / (nHojas * 5.2 + 8)));
    const pintar = (n, padre) => {
      const x = X(n.x), y = Y(n);
      if (padre) { ctx.strokeStyle = NL.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(padre.x), Y(padre) + 5); ctx.lineTo(x, y - (n.leaf ? 12 : 8)); ctx.stroke(); }
      if (n.leaf) NL.text(ctx, n.label, x, y, { size: fs + 0.5, mono: true, align: 'center', weight: 600 });
      else {
        const col = o.color ? o.color(n.label) : '--accent';
        NL.text(ctx, n.label, x, y + 4, { size: fs, align: 'center', weight: 700, color: col, halo: true });
      }
      if (n.kids) n.kids.forEach((k) => pintar(k, n));
    };
    pintar(root, null);
  };
  const COLS = { S: '--c1', SN: '--c2', SV: '--c3', SP: '--c4', Det: '--ink-2', N: '--ink-2', V: '--ink-2', P: '--ink-2', Adj: '--ink-2', Pron: '--ink-2', Conj: '--ink-2' };
  const colSim = (s) => COLS[s] || '--ink-2';

  /* Generador aleatorio de oraciones con la gramática sin recursión izquierda */
  NL.defineSim('generador', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Árbol sintáctico de una oración generada al azar por la gramática' });
    const box = sim.html('pad');
    sim.group('Generador');
    sim.slider('seed', { label: 'Semilla', min: 1, max: 60, step: 1, value: 7, fmt: (v) => String(v) });
    sim.slider('prof', { label: 'Profundidad máxima', min: 3, max: 9, step: 1, value: 6, fmt: (v) => String(v) });
    sim.out('o', 'Oración generada', { hl: true, wide: true });
    sim.out('n', 'Palabras');
    sim.out('d', 'Altura del árbol');
    const g = G.toyNLR(), por = new Map();
    g.rules.forEach((r) => { if (!por.has(r.lhs)) por.set(r.lhs, []); por.get(r.lhs).push(r); });
    const hondo = (sym, memo = {}) => { if (memo[sym] !== undefined) return memo[sym]; memo[sym] = 99; const r = por.get(sym).map((x) => (x.rhs.every((s) => s[0] === "'") ? 1 : 1 + Math.max(...x.rhs.map((s) => (s[0] === "'" ? 0 : hondo(s, memo)))))); return (memo[sym] = Math.min(...r)); };
    sim.onDraw(() => {
      const rng = L.rng(sim.p.seed * 97 + 3);
      const gen = (sym, d) => {
        if (sym[0] === "'") return sym.slice(1, -1);
        let opts = por.get(sym);
        const quedan = sim.p.prof - d;
        opts = opts.filter((r) => 1 + Math.max(0, ...r.rhs.map((s) => (s[0] === "'" ? 0 : hondo(s)))) <= quedan);
        if (!opts.length) opts = por.get(sym).slice().sort((a, b) => a.rhs.length - b.rhs.length).slice(0, 1);
        const r = opts[rng.int(opts.length)];
        return [sym].concat(r.rhs.map((s) => gen(s, d + 1)));
      };
      const t = gen(g.start, 0), hs = G.hojas(t);
      const altura = (x) => (typeof x === 'string' ? 0 : 1 + Math.max(...x.slice(1).map(altura)));
      sim.set('o', hs.join(' ') + '.'); sim.set('n', String(hs.length)); sim.set('d', String(altura(t)));
      NL.drawTree(cv, t, { color: colSim });
      box.innerHTML = `<small style="color:var(--ink-3)">Notación de corchetes</small><div class="mono-box" style="white-space:pre-wrap">${esc(G.corchetes(t))}</div>`;
    });
  });

  /* Árbol de una oración elegida o escrita (CKY con la gramática del curso) */
  NL.defineSim('arbol', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Árbol sintáctico de la oración elegida' });
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Ejemplos', options: G.ORACIONES.map((f) => [f, f]), value: G.ORACIONES[4], onInput: (v) => { t.set(v, true); t.input.value = v; sim.ctl.k.set(1, true); } });
    const t = sim.text('w', { label: 'O escriba una oración (solo palabras de la gramática)', value: G.ORACIONES[4] });
    const sl = sim.slider('k', { label: 'Análisis n.º', min: 1, max: 5, step: 1, value: 1, fmt: (v) => String(v) });
    sim.out('n', 'Análisis posibles', { hl: true });
    sim.out('c', 'Constituyentes (sin categorías léxicas)');
    const g = G.toy();
    sim.onDraw(() => {
      const ws = (sim.p.w || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      const r = G.cky(g, ws, { arboles: 8 });
      sim.set('n', String(r.cuenta));
      const arb = r.arboles || [];
      sl.range(1, Math.max(2, arb.length), 1);
      if (!arb.length) { NL.draw.clear(cv); box.innerHTML = `<p style="color:var(--loss);font-weight:600">${ws.some((x) => !L.cfg.cky(g, [x]).tabla[0][1].size) ? 'Alguna palabra no está en el léxico de la gramática.' : 'La gramática no analiza esta oración.'}</p>`; sim.set('c', '—'); return; }
      const tr = arb[Math.min(sim.p.k, arb.length) - 1];
      NL.drawTree(cv, tr, { color: colSim });
      const cs = G.constituyentes(tr, 0, []);
      sim.set('c', String(cs.length));
      box.innerHTML = `<small style="color:var(--ink-3)">Constituyentes (símbolo, desde, hasta)</small><div class="tk-row">${cs.map(([s, i, j]) => `<span class="tk"><span>${s}</span><small>${esc(ws.slice(i, j).join(' '))}</small></span>`).join('')}</div>`;
    });
  });

  NL.bank.add('gramaticas', [
    { q: 'Un constituyente sintáctico es…', opts: ['Una palabra cualquiera', 'Una palabra o secuencia de palabras que funciona como una unidad en la estructura de la oración', 'Una etiqueta gramatical', 'Un signo de puntuación'], ok: 1, fb: 'Los constituyentes forman la estructura jerárquica del árbol; cada nodo interno es uno.', lvl: 1 },
    { q: 'La regla SN → Det N dice que…', opts: ['Un sintagma nominal puede estar formado por un determinante seguido de un nombre', 'Un nombre se convierte en determinante', 'Un determinante siempre precede al verbo', 'N es el símbolo inicial'], ok: 0, fb: 'Es una regla de reescritura libre de contexto: un símbolo a la izquierda y una secuencia a la derecha.', lvl: 1 },
    { q: '¿Por qué se llama «libre de contexto» a una gramática?', opts: ['Porque no tiene reglas', 'Porque cada regla se aplica a un símbolo sin importar lo que lo rodea', 'Porque no usa palabras', 'Porque no tiene recursión'], ok: 1, fb: 'La parte izquierda es un único símbolo no terminal.', lvl: 2 },
    { q: '¿Qué nivel de la jerarquía de Chomsky suelen emplear los modelos de estructura sintagmática del lenguaje natural?', opts: ['Tipo 3 (regulares)', 'Tipo 2 (libres de contexto)', 'Tipo 0 (máquinas de Turing)', 'Ninguno'], ok: 1, fb: 'Con ellos se describen la recursión y el anidamiento, que exceden a los autómatas finitos.', lvl: 2 },
    { q: '¿Qué muestra un árbol sintáctico?', opts: ['Solo la lista de palabras', 'Cómo las palabras se agrupan en constituyentes de forma jerárquica', 'La frecuencia de las palabras', 'La pronunciación'], ok: 1, fb: 'Los nodos son constituyentes y las hojas, las palabras.', lvl: 1 },
    { q: 'La regla recursiva SN → SN SP permite…', opts: ['Oraciones de longitud ilimitada, como «el gato de la casa del barrio de la ciudad»', 'Solo oraciones cortas', 'Eliminar los determinantes', 'Convertir sustantivos en verbos'], ok: 0, fb: 'La recursión es la fuente de las estructuras anidadas y de la ambigüedad.', lvl: 2 },
    { q: 'Un verbo transitivo exige…', opts: ['Un complemento directo (objeto directo)', 'Un adverbio', 'Dos sujetos', 'Una preposición siempre'], ok: 0, fb: 'Esa información de subcategorización debe modelarse en la gramática (capítulo 15).', lvl: 2 },
    { q: 'Para una gramática con las reglas SN → Det N y SN → N, ¿cuál es un sintagma nominal válido?', opts: ['«la mesa»', '«mesa la»', '«la»', '«lee la»'], ok: 0, fb: 'Det seguido de N.', lvl: 1 },
    { q: 'Una limitación de las gramáticas libres de contexto básicas para el español es…', opts: ['Que no pueden expresar la concordancia de género y número sin multiplicar las reglas', 'Que no admiten verbos', 'Que no funcionan con tildes', 'Que no tienen símbolo inicial'], ok: 0, fb: 'La solución son las gramáticas con categorías complejas o de unificación (capítulo 15).', lvl: 3 },
    { q: 'La gramática del curso tiene 53 producciones. ¿Cuántas son reglas léxicas (símbolo → palabra)?', num: 41, tol: 0, fb: '53 − 12 reglas estructurales (S 1, SN 6, SV 4, SP 1) = 41 reglas léxicas.', lvl: 3 }
  ]);
})();
