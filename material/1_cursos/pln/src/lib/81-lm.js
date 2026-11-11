/* ===================================================================
   lib/81-lm.js — Modelos de lenguaje de n-gramas: conteos, máxima
   verosimilitud, suavizado de Laplace (add-k), interpolación lineal
   (Jelinek–Mercer) y Kneser–Ney interpolado; perplejidad y generación.
   Rellenos: n−1 símbolos <s> al principio y un </s> al final.
   Vocabulario: palabras con al menos `minimo` apariciones; el resto → <unk>.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const M = (L.lm = {});
  const S = '<s>', E = '</s>', U = '<unk>';
  M.S = S; M.E = E; M.U = U;

  /* Ajuste: n = orden máximo (1–4). sents = lista de oraciones (cadenas) */
  M.ajustar = function (sents, n = 3, opts = {}) {
    const minimo = opts.minimo === undefined ? 2 : opts.minimo, tok = (s) => s.split(' ').filter(Boolean);
    const frec = new Map();
    for (const s of sents) for (const w of tok(s)) frec.set(w, (frec.get(w) || 0) + 1);
    const vocab = new Set([E, U]); for (const [w, c] of frec) if (c >= minimo) vocab.add(w);
    const mod = { n, vocab, V: vocab.size, c: [null], ctx: [null], tipos: [null], cc: [null], ccCtx: [null], ccTipos: [null], tokens: 0 };
    for (let k = 1; k <= n; k++) { mod.c.push(new Map()); mod.ctx.push(new Map()); mod.tipos.push(new Map()); mod.cc.push(new Map()); mod.ccCtx.push(new Map()); mod.ccTipos.push(new Map()); }
    const inc = (m, key, d = 1) => m.set(key, (m.get(key) || 0) + d);
    for (const s of sents) {
      const t = Array(n - 1).fill(S).concat(tok(s).map((w) => (vocab.has(w) ? w : U)), [E]);
      mod.tokens += t.length - (n - 1);
      for (let i = n - 1; i < t.length; i++) {
        for (let k = 1; k <= n; k++) {
          const g = t.slice(i - k + 1, i + 1), key = g.join(' '), h = g.slice(0, -1).join(' ');
          if (!mod.c[k].has(key)) { inc(mod.tipos[k], h); }
          inc(mod.c[k], key); inc(mod.ctx[k], h);
        }
      }
    }
    /* Conteos de continuación: cuántas palabras distintas preceden a cada n-grama de orden k (a partir de los de orden k+1) */
    for (let k = 1; k < n; k++) {
      for (const key of mod.c[k + 1].keys()) {
        const p = key.indexOf(' '), suf = key.slice(p + 1);
        inc(mod.cc[k], suf);
      }
      for (const [key, v] of mod.cc[k]) { const q = key.lastIndexOf(' '), h = q < 0 ? '' : key.slice(0, q); inc(mod.ccCtx[k], h, v); inc(mod.ccTipos[k], h); }
    }
    return mod;
  };
  /* Cuántas palabras de la oración de prueba son desconocidas (→ <unk>) */
  M.mapear = (mod, s) => s.split(' ').filter(Boolean).map((w) => (mod.vocab.has(w) ? w : U));

  const hist = (mod, h, k) => h.slice(Math.max(0, h.length - (k - 1))); /* últimas k−1 palabras */
  const mle = (mod, w, h, k) => { const hh = hist(mod, h, k).join(' '), d = mod.ctx[k].get(hh) || 0; return d ? (mod.c[k].get((hh ? hh + ' ' : '') + w) || 0) / d : 0; };

  /* Probabilidad P(w | h) con h = lista de palabras previas (ya rellenadas con <s>) */
  M.prob = function (mod, w, h, o = {}) {
    const n = Math.min(mod.n, o.orden || mod.n), metodo = o.metodo || 'mle';
    if (metodo === 'mle') return mle(mod, w, h, n);
    if (metodo === 'laplace') {
      const k = o.k === undefined ? 1 : o.k, hh = hist(mod, h, n).join(' '), d = mod.ctx[n].get(hh) || 0;
      return ((mod.c[n].get((hh ? hh + ' ' : '') + w) || 0) + k) / (d + k * mod.V);
    }
    if (metodo === 'interp') {
      /* lambdas = [λ0 (uniforme), λ1, …, λn] */
      const lam = o.lambdas; let p = lam[0] / mod.V;
      for (let k = 1; k <= n; k++) p += lam[k] * mle(mod, w, h, k);
      return p;
    }
    if (metodo === 'kn') {
      const D = o.d === undefined ? 0.75 : o.d;
      const rec = (k) => {
        const hh = hist(mod, h, k).join(' ');
        if (k === 1) { const tot = mod.ccCtx[1].get('') || 0; return tot ? (mod.cc[1].get(w) || 0) / tot : 0; }
        let c, tot, tip;
        if (k === n) { c = mod.c[k].get((hh ? hh + ' ' : '') + w) || 0; tot = mod.ctx[k].get(hh) || 0; tip = mod.tipos[k].get(hh) || 0; }
        else { c = mod.cc[k].get((hh ? hh + ' ' : '') + w) || 0; tot = mod.ccCtx[k].get(hh) || 0; tip = mod.ccTipos[k].get(hh) || 0; }
        if (!tot) return rec(k - 1);
        return Math.max(c - D, 0) / tot + (D * tip / tot) * rec(k - 1);
      };
      return n === 1 ? (mod.c[1].get(w) || 0) / (mod.ctx[1].get('') || 1) : rec(n);
    }
    throw new Error('método desconocido');
  };

  /* Perplejidad sobre oraciones de prueba: devuelve {pp, logp, n, desconocidas} */
  M.perplejidad = function (mod, sents, o = {}) {
    let lp = 0, N = 0, unk = 0, cero = false;
    for (const s of sents) {
      const w = M.mapear(mod, s), t = Array(mod.n - 1).fill(S).concat(w, [E]);
      for (let i = mod.n - 1; i < t.length; i++) {
        const p = M.prob(mod, t[i], t.slice(0, i), o);
        if (p <= 0) cero = true; else lp += Math.log(p);
        N++; if (t[i] === U) unk++;
      }
    }
    return { pp: cero ? Infinity : Math.exp(-lp / N), logp: cero ? -Infinity : lp, n: N, desconocidas: unk };
  };

  /* Distribución completa sobre el vocabulario dado el historial */
  M.distribucion = (mod, h, o = {}) => Array.from(mod.vocab).map((w) => [w, M.prob(mod, w, h, o)]).filter((x) => x[1] > 0);
  M.generar = function (mod, rng, o = {}) {
    const h = Array(mod.n - 1).fill(S).concat((o.inicio || []).slice()), out = (o.inicio || []).slice();
    for (let i = 0; i < (o.max || 25); i++) {
      const d = M.distribucion(mod, h, o).filter((x) => x[0] !== U && x[0] !== S);
      if (!d.length) break;
      let tot = 0; for (const x of d) tot += x[1];
      let r = rng() * tot, w = d[d.length - 1][0];
      for (const [x, p] of d) { r -= p; if (r <= 0) { w = x; break; } }
      if (w === E) break;
      out.push(w); h.push(w);
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
