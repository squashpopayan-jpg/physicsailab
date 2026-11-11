/* ===================================================================
   lib/20-markov.js — Cadenas de Markov de caracteres y de palabras
   (Shannon, 1948), entropía condicional empírica y un ELIZA en español.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const M = (L.markov = {});

  /* Normaliza para el modelo de caracteres: minúsculas, todo lo que no sea letra → un espacio */
  M.norm = (t) => t.toLowerCase().replace(/[^a-záéíóúüñ]+/g, ' ').replace(/^ | $/g, '');

  /* Modelo de orden k: Map contexto → Map siguiente → cuenta. Orden 0: contexto '' */
  M.fit = function (texto, k) {
    const s = M.norm(texto), m = new Map();
    for (let i = k; i < s.length; i++) {
      const c = s.slice(i - k, i), x = s[i];
      if (!m.has(c)) m.set(c, new Map());
      const f = m.get(c);
      f.set(x, (f.get(x) || 0) + 1);
    }
    return { k, m, s };
  };
  /* Genera n caracteres a partir de un contexto inicial; si el contexto no existe se reinicia al azar */
  M.generar = function (modelo, n, rng, ini) {
    const { k, m, s } = modelo;
    let ctx = ini !== undefined ? ini : s.slice(0, k);
    let out = ctx;
    for (let i = 0; i < n; i++) {
      let f = m.get(ctx);
      if (!f) { const keys = Array.from(m.keys()); ctx = keys[rng.int(keys.length)]; f = m.get(ctx); out += ' '; }
      const xs = Array.from(f.keys()), ws = xs.map((x) => f.get(x));
      const x = xs[rng.choice(ws)];
      out += x;
      ctx = k ? (ctx + x).slice(1) : '';
    }
    return out;
  };
  /* Entropía condicional empírica H(X | k caracteres anteriores) en bits por carácter */
  M.entropia = function (texto, k) {
    const mod = M.fit(texto, k);
    let n = 0;
    for (const f of mod.m.values()) for (const v of f.values()) n += v;
    let h = 0;
    for (const f of mod.m.values()) {
      let t = 0;
      for (const v of f.values()) t += v;
      for (const v of f.values()) h -= (v / n) * Math.log2(v / t);
    }
    return h;
  };

  /* Palabras: modelo bigrama sobre tokens en minúscula (sin signos) */
  M.palabras = (t) => t.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
  M.fitPal = function (texto) {
    const w = M.palabras(texto), m = new Map();
    for (let i = 0; i + 1 < w.length; i++) { if (!m.has(w[i])) m.set(w[i], []); m.get(w[i]).push(w[i + 1]); }
    return { w, m };
  };
  M.generarPal = function (mod, n, rng, ini) {
    let cur = ini && mod.m.has(ini) ? ini : mod.w[rng.int(mod.w.length)];
    const out = [cur];
    for (let i = 1; i < n; i++) {
      const sig = mod.m.get(cur);
      cur = sig ? sig[rng.int(sig.length)] : mod.w[rng.int(mod.w.length)];
      out.push(cur);
    }
    return out.join(' ');
  };

  /* ---------- ELIZA (Weizenbaum, 1966) en español: reglas de palabras clave y reflexión de pronombres ---------- */
  const REFLEJO = { yo: 'usted', me: 'le', mi: 'su', mis: 'sus', mío: 'suyo', soy: 'es', estoy: 'está', tengo: 'tiene', quiero: 'quiere', siento: 'siente', creo: 'cree', puedo: 'puede', hago: 'hace', voy: 'va', necesito: 'necesita', tú: 'yo', tu: 'mi', tus: 'mis', eres: 'soy', estás: 'estoy', usted: 'yo', conmigo: 'con usted' };
  M.reflejar = (t) => t.split(/\s+/).map((w) => REFLEJO[w.toLowerCase()] || w).join(' ');
  M.REGLAS = [
    { k: /\b(madre|padre|hermano|hermana|familia|mamá|papá)\b/i, r: ['Hábleme más de su familia.', 'Cuando piensa en su {0}, ¿qué siente?'] },
    { k: /\bme siento (.+)/i, r: ['¿Por qué se siente {0}?', '¿Desde cuándo se siente {0}?', '¿Con qué frecuencia se siente {0}?'] },
    { k: /\bestoy (.+)/i, r: ['¿Por qué está {0}?', '¿Cree que estar {0} es algo pasajero?'] },
    { k: /\b(?:quiero|necesito) (.+)/i, r: ['¿Qué significaría para usted conseguir {0}?', '¿Por qué quiere {0}?'] },
    { k: /\b(?:no puedo|no sé) (.+)/i, r: ['¿Qué se lo impide?', '¿Ha intentado {0}?'] },
    { k: /\bporque (.+)/i, r: ['¿Es esa la verdadera razón?', '¿Qué otras razones se le ocurren?'] },
    { k: /\b(sueño|soñé|pesadilla)\b/i, r: ['¿Qué cree que significa ese sueño?', 'Cuénteme más sobre sus sueños.'] },
    { k: /\b(sí|claro|exacto)\b/i, r: ['Entiendo. Continúe, por favor.', '¿Está seguro?'] },
    { k: /\b(no)\b/i, r: ['¿Por qué dice que no?', 'Parece muy seguro de eso.'] },
    { k: /\b(computadora|máquina|programa)\b/i, r: ['¿Le preocupa que las máquinas piensen?', '¿Qué opina de las máquinas?'] }
  ];
  M.DEFECTO = ['Siga, por favor.', 'Cuénteme más.', 'Ya veo. ¿Y eso qué le hace pensar?', 'Interesante. ¿Quiere profundizar?'];
  /* Devuelve {respuesta, regla} de forma determinista según un contador n */
  M.eliza = function (texto, n = 0) {
    const t = texto.trim().replace(/[.!?¡¿]+$/g, '');
    for (let i = 0; i < M.REGLAS.length; i++) {
      const m = t.match(M.REGLAS[i].k);
      if (m) {
        const R = M.REGLAS[i].r;
        const plantilla = R[n % R.length];
        const captura = m[1] && m.length > 1 ? M.reflejar(m[1]) : m[0];
        return { respuesta: plantilla.replace('{0}', captura), regla: i };
      }
    }
    return { respuesta: M.DEFECTO[n % M.DEFECTO.length], regla: -1 };
  };
})(typeof window !== 'undefined' ? window : globalThis);
