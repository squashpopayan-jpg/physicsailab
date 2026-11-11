/* ===================================================================
   lib/73-dep.js — Gramáticas de dependencias: árboles (cabeza de cada
   palabra), proyectividad, sistema de transiciones arc-standard con
   oráculo estático, análisis basado en grafos (árbol de expansión
   máximo de Chu-Liu/Edmonds) y métricas UAS/LAS.
   Índices de palabras desde 1; la raíz artificial es 0.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const D = (L.dep = {});

  /* Oraciones anotadas a mano con relaciones de Universal Dependencies */
  const S = (w, pos, head, rel) => ({ w: w.split(' '), pos: pos.split(' '), head, rel: rel.split(' ') });
  D.DATA = [
    S('El gato duerme en la alfombra roja .', 'DET NOUN VERB ADP DET NOUN ADJ PUNCT', [2, 3, 0, 6, 6, 3, 6, 3], 'det nsubj root case det obl amod punct'),
    S('La profesora explicó el tema con claridad .', 'DET NOUN VERB DET NOUN ADP NOUN PUNCT', [2, 3, 0, 5, 3, 7, 3, 3], 'det nsubj root det obj case obl punct'),
    S('Los estudiantes analizan textos en español .', 'DET NOUN VERB NOUN ADP NOUN PUNCT', [2, 3, 0, 3, 6, 3, 3], 'det nsubj root obj case obl punct'),
    S('Marta presentó su proyecto de investigación .', 'PROPN VERB DET NOUN ADP NOUN PUNCT', [2, 0, 4, 2, 6, 4, 2], 'nsubj root det obj case nmod punct'),
    S('Ayer Marta presentó su proyecto .', 'ADV PROPN VERB DET NOUN PUNCT', [3, 3, 0, 5, 3, 3], 'advmod nsubj root det obj punct'),
    S('Mi hermano compró pan en la tienda .', 'DET NOUN VERB NOUN ADP DET NOUN PUNCT', [2, 3, 0, 3, 7, 7, 3, 3], 'det nsubj root obj case det obl punct'),
    S('El modelo identifica palabras y relaciones sintácticas .', 'DET NOUN VERB NOUN CCONJ NOUN ADJ PUNCT', [2, 3, 0, 3, 6, 4, 6, 3], 'det nsubj root obj cc conj amod punct'),
    S('Esta herramienta no reconoce todas las entidades .', 'DET NOUN ADV VERB DET DET NOUN PUNCT', [2, 4, 4, 0, 7, 7, 4, 4], 'det nsubj advmod root det det obj punct'),
    S('La universidad publicó los resultados de el proyecto .', 'DET NOUN VERB DET NOUN ADP DET NOUN PUNCT', [2, 3, 0, 5, 3, 8, 8, 5, 3], 'det nsubj root det obj case det nmod punct'),
    S('Yo vi un elefante en mi pijama .', 'PRON VERB DET NOUN ADP DET NOUN PUNCT', [2, 0, 4, 2, 7, 7, 2, 2], 'nsubj root det obj case det obl punct'),
    S('Yo vi un elefante en mi pijama .', 'PRON VERB DET NOUN ADP DET NOUN PUNCT', [2, 0, 4, 2, 7, 7, 4, 2], 'nsubj root det obj case det nmod punct')
  ];

  /* Un árbol es proyectivo si ningún par de arcos se cruza (con la raíz 0 como cabeza del arco de la raíz) */
  D.proyectivo = function (head) {
    const arcos = head.map((h, i) => [Math.min(h, i + 1), Math.max(h, i + 1)]);
    for (let a = 0; a < arcos.length; a++) for (let b = a + 1; b < arcos.length; b++) {
      const [l1, r1] = arcos[a], [l2, r2] = arcos[b];
      if ((l1 < l2 && l2 < r1 && r1 < r2) || (l2 < l1 && l1 < r2 && r2 < r1)) return false;
    }
    return true;
  };
  D.esArbol = function (head) {
    const n = head.length;
    for (let i = 1; i <= n; i++) { let k = i, c = 0; while (k !== 0 && c++ <= n) k = head[k - 1]; if (k !== 0) return false; }
    return head.filter((h) => h === 0).length === 1;
  };

  /* Arc-standard: pila, buffer, arcos. Transiciones: SH (desplazar), LA (arco a la izquierda: s1 ← s0), RA (arco a la derecha: s1 → s0). */
  D.oraculo = function (head) {
    const n = head.length, pila = [0], buf = Array.from({ length: n }, (_, i) => i + 1), trans = [];
    const pend = head.map((_, i) => head.filter((h) => h === i + 1).length);   /* dependientes sin asignar de cada palabra */
    pend.unshift(head.filter((h) => h === 0).length);
    let guard = 0;
    while ((buf.length || pila.length > 1) && guard++ < 10 * n + 10) {
      const s0 = pila[pila.length - 1], s1 = pila[pila.length - 2];
      if (pila.length >= 2 && s1 !== 0 && head[s1 - 1] === s0) { trans.push('LA'); pila.splice(pila.length - 2, 1); pend[s0]--; }
      else if (pila.length >= 2 && head[s0 - 1] === s1 && pend[s0] === 0) { trans.push('RA'); pila.pop(); pend[s1]--; }
      else if (buf.length) { trans.push('SH'); pila.push(buf.shift()); }
      else return null;
    }
    return trans;
  };
  /* Ejecuta una secuencia de transiciones; devuelve {head, pasos} donde pasos son estados {pila, buf, arco} */
  D.ejecutar = function (n, trans) {
    const pila = [0], buf = Array.from({ length: n }, (_, i) => i + 1), head = new Array(n).fill(-1), pasos = [{ pila: pila.slice(), buf: buf.slice(), t: '', arco: null }];
    for (const t of trans) {
      let arco = null;
      if (t === 'SH') pila.push(buf.shift());
      else if (t === 'LA') { const s0 = pila.pop(), s1 = pila.pop(); head[s1 - 1] = s0; pila.push(s0); arco = [s0, s1]; }
      else { const s0 = pila.pop(), s1 = pila[pila.length - 1]; head[s0 - 1] = s1; arco = [s1, s0]; }
      pasos.push({ pila: pila.slice(), buf: buf.slice(), t, arco });
    }
    return { head, pasos };
  };

  /* Árbol de expansión máximo dirigido (Chu-Liu/Edmonds). score[h][d]: puntuación del arco h → d; nodo 0 = raíz.
     Devuelve heads[1..n] (índice 0 = palabra 1). */
  D.mst = function (score) {
    const n = score.length - 1;
    const edmonds = (nodes, arcs, rootId) => {
      /* arcs: [{h, d, w, id}]; devuelve Map d → arco elegido */
      const best = new Map();
      for (const a of arcs) if (a.d !== rootId && a.h !== a.d) { const b = best.get(a.d); if (!b || a.w > b.w) best.set(a.d, a); }
      /* buscar ciclo */
      const estado = new Map();
      let ciclo = null;
      for (const v of nodes) {
        if (v === rootId || ciclo) continue;
        const camino = []; let u = v;
        while (u !== undefined && u !== rootId && !estado.has(u)) { estado.set(u, v); camino.push(u); const b = best.get(u); u = b ? b.h : undefined; }
        if (u !== undefined && u !== rootId && estado.get(u) === v) { ciclo = camino.slice(camino.indexOf(u)); }
      }
      if (!ciclo) return best;
      const enCiclo = new Set(ciclo), nuevo = 'C' + Math.random().toString(36).slice(2);
      const nodos2 = nodes.filter((x) => !enCiclo.has(x)).concat([nuevo]), arcos2 = [];
      for (const a of arcs) {
        if (enCiclo.has(a.h) && enCiclo.has(a.d)) continue;
        if (enCiclo.has(a.d)) arcos2.push({ h: a.h, d: nuevo, w: a.w - best.get(a.d).w, orig: a, tipo: 'entra' });
        else if (enCiclo.has(a.h)) arcos2.push({ h: nuevo, d: a.d, w: a.w, orig: a, tipo: 'sale' });
        else arcos2.push({ h: a.h, d: a.d, w: a.w, orig: a, tipo: 'ext' });
      }
      const sol = edmonds(nodos2, arcos2, rootId), res = new Map();
      const entra = sol.get(nuevo).orig;
      for (const [d, a] of sol) { if (d === nuevo) continue; const o = a.orig; res.set(o.d, o); }
      for (const v of ciclo) res.set(v, best.get(v));
      res.set(entra.d, entra);
      return res;
    };
    const arcs = [];
    for (let h = 0; h <= n; h++) for (let d = 1; d <= n; d++) if (h !== d) arcs.push({ h, d, w: score[h][d] });
    const nodos = Array.from({ length: n + 1 }, (_, i) => i);
    const sol = edmonds(nodos, arcs, 0);
    return Array.from({ length: n }, (_, i) => sol.get(i + 1).h);
  };
  D.pesoArbol = (score, head) => head.reduce((s, h, i) => s + score[h][i + 1], 0);

  /* UAS y LAS entre un análisis y la referencia (se excluye la puntuación si o.sinPunct) */
  D.metricas = function (pred, gold, o = {}) {
    let n = 0, u = 0, l = 0;
    gold.head.forEach((h, i) => {
      if (o.sinPunct && gold.rel[i] === 'punct') return;
      n++; if (pred.head[i] === h) { u++; if (pred.rel[i] === gold.rel[i]) l++; }
    });
    return { n, uas: u / n, las: l / n };
  };

  /* Analizador por grafos muy sencillo: puntuación de arco = log P(etiqueta del dependiente | etiqueta de la cabeza, dirección) con suavizado add-k y penalización de distancia */
  D.entrenarGrafo = function (datos, k = 0.5) {
    const c = new Map(), tot = new Map(), raiz = new Map(), rel = new Map();
    for (const s of datos) s.head.forEach((h, i) => {
      const ph = h === 0 ? 'ROOT' : s.pos[h - 1], dir = h < i + 1 ? 'D' : 'I';
      const key = ph + '|' + dir + '|' + s.pos[i]; c.set(key, (c.get(key) || 0) + 1); tot.set(ph + '|' + dir, (tot.get(ph + '|' + dir) || 0) + 1);
      const rk = ph + '|' + s.pos[i]; if (!rel.has(rk)) rel.set(rk, new Map()); rel.get(rk).set(s.rel[i], (rel.get(rk).get(s.rel[i]) || 0) + 1);
    });
    const pos = new Set(datos.flatMap((s) => s.pos));
    return {
      score: (s) => {
        const n = s.w.length, M = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(-Infinity));
        for (let h = 0; h <= n; h++) for (let d = 1; d <= n; d++) {
          if (h === d) continue;
          const ph = h === 0 ? 'ROOT' : s.pos[h - 1], dir = h < d ? 'D' : 'I';
          const num = (c.get(ph + '|' + dir + '|' + s.pos[d - 1]) || 0) + k, den = (tot.get(ph + '|' + dir) || 0) + k * pos.size;
          M[h][d] = Math.log(num / den) - 0.15 * Math.abs(h - d);
        }
        return M;
      },
      etiqueta: (ph, pd) => { const m = rel.get((ph || 'ROOT') + '|' + pd); return m ? Array.from(m.entries()).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0] : 'dep'; }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
