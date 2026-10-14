/* ===================================================================
   lib/75-terapias.js — Modelos para el bloque de terapias:
   recuperación del brazo tras un ictus con «no uso aprendido» y umbral
   de dosis (inspirado en Han, Arbib y Schweighofer, 2008), y ensayos
   con y sin cegamiento (sesgo de expectativa del evaluador).
   =================================================================== */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const L = (RC.L = RC.L || {});
  const T = (L.ter = {});

  /* ---------- Ictus: habilidad S del brazo afectado y elección espontánea ----------
     Cada día hay `oport` oportunidades de usar un brazo. Se elige el afectado con probabilidad
     σ(β (Q_af − Q_sano)). Usarlo da éxito con probabilidad S (recompensa 1) y mejora la habilidad
     por plasticidad dependiente del uso: S ← S + η (1 − S). Sin uso, S decae: S ← S (1 − λ).
     La terapia agrega `forzado` usos diarios durante `dias` días a partir de `inicio`. */
  T.stroke = function (o) {
    const rng = L.rng(o.seed || 3), D = o.total || 360, beta = o.beta || 8, alpha = o.alpha || 0.05;
    const eta = o.eta || 0.002, lam = o.lambda || 0.004, oport = o.oport || 40, qSano = o.qSano || 0.9;
    let S = o.S0 === undefined ? 0.35 : o.S0, Q = o.Q0 === undefined ? S : o.Q0;
    const out = { S: [], uso: [], Q: [] };
    for (let d = 0; d < D; d++) {
      const enTerapia = d >= (o.inicio || 30) && d < (o.inicio || 30) + (o.dias || 0);
      let usos = 0;
      const n = oport + (enTerapia ? o.forzado || 0 : 0);
      for (let k = 0; k < n; k++) {
        const forz = k >= oport;
        const p = 1 / (1 + Math.exp(-beta * (Q - qSano)));
        if (forz || rng() < p) {
          const r = rng() < S ? 1 : 0;
          Q += alpha * (r - Q);
          S += eta * (1 - S);
          if (!forz) usos++;
        }
      }
      S *= 1 - lam;
      out.S.push(S); out.uso.push(usos / oport); out.Q.push(Q);
    }
    return out;
  };

  /* ---------- Extinción como aprendizaje inhibitorio dependiente del contexto ----------
     (regla de Rescorla-Wagner; idea de Bouton; exposición en varios contextos, Craske y otros, 2014)
     Adquisición: V ← V + α (1 − V). Extinción en el contexto c (sin estímulo aversivo):
     p = V − Ig − Ic[c] ; Ig ← Ig + αg p ; Ic[c] ← Ic[c] + αc p  (V no se borra).
     Miedo en el contexto x tras d días: V − (Ig + Ic[x]) · e^(−d/τ)  (la inhibición es más frágil). */
  T.extincion = function (o = {}) {
    const a = o.a || 0.3, ag = o.ag === undefined ? 0.04 : o.ag, ac = o.ac === undefined ? 0.2 : o.ac;
    const nAdq = o.nAdq || 12, nExt = o.nExt || 24, k = Math.max(1, o.contextos || 1), tau = o.tau || 20;
    let V = 0, Ig = 0;
    const Ic = new Array(k).fill(0), curva = [];
    for (let i = 0; i < nAdq; i++) { curva.push(V); V += a * (1 - V); }
    for (let i = 0; i < nExt; i++) {
      const c = i % k, p = V - Ig - Ic[c];
      curva.push(p);
      Ig += ag * p; Ic[c] += ac * p;
    }
    const f = Math.exp(-(o.dias || 0) / tau);
    const miedo = (ctx) => Math.max(0, V - (Ig + (ctx >= 0 && ctx < k ? Ic[ctx] : 0)) * f);
    return { V, Ig, Ic, curva, finExt: Math.max(0, V - Ig - Ic[(nExt - 1) % k]), enA: miedo(-1), nuevo: miedo(-2), mismo: miedo((nExt - 1) % k) };
  };

  /* ---------- Ensayo con evaluador ciego o no ----------
     Mejora observada = historia natural (regresión a la media) + placebo + efecto real + sesgo del evaluador
     (solo si el evaluador sabe quién recibió el tratamiento). Devuelve d estimado y su IC del 95 %. */
  T.blindTrial = function (o) {
    const rng = L.rng(o.seed || 9), n = o.n || 60, sd = o.sd || 1;
    const nat = o.natural === undefined ? 0.3 : o.natural, plac = o.placebo || 0, eff = o.efecto || 0, sesgo = o.sesgo || 0;
    const tr = [], ct = [];
    for (let i = 0; i < n; i++) {
      tr.push(nat + plac + eff + (o.ciego ? 0 : sesgo) + sd * rng.gauss());
      ct.push(nat + (o.simulado ? plac : 0) + sd * rng.gauss());
    }
    const r = L.ev.welch(tr, ct);
    const se = Math.sqrt(2 / n + (r.d * r.d) / (4 * n));
    return { d: r.d, lo: r.d - 1.96 * se, hi: r.d + 1.96 * se, p: r.p, tr, ct };
  };
})(typeof window !== 'undefined' ? window : globalThis);
