/* Capítulo 34 — Recursos lingüísticos */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L;
  const frec = (ws) => { const m = new Map(); ws.forEach((w) => m.set(w, (m.get(w) || 0) + 1)); return Array.from(m.values()).sort((a, b) => b - a); };
  let C = null;
  const corp = () => C || (C = {
    'Noticias (2.400 oraciones de CESS-ESP)': frec(L.corpus.lm.train.flatMap((s) => s.split(' ')).filter((w) => /^\p{L}+$/u.test(w))),
    'CoNLL-2002 (1.200 oraciones)': frec(L.corpus.ner.tr.flatMap((s) => s.map((x) => x[0].toLowerCase())).filter((w) => /^\p{L}+$/u.test(w)))
  });
  NL.defineSim('corpus-cobertura', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Cobertura del texto según el tamaño del vocabulario' });
    sim.group('Vocabulario');
    sim.slider('v', { label: 'Formas distintas que se conservan (las más frecuentes)', min: 50, max: 5000, step: 50, value: 1000, fmt: (v) => String(v) });
    sim.out('a', 'Cobertura del primer corpus', { hl: true });
    sim.out('b', 'Cobertura del segundo corpus');
    sim.out('h', 'Formas que aparecen una sola vez (hapax)');
    sim.onDraw(() => {
      const c = corp(), nombres = Object.keys(c), cols = ['--c1', '--c2'];
      const cob = (f, k) => { let t = 0, s = 0; f.forEach((x, i) => { t += x; if (i < k) s += x; }); return s / t; };
      sim.set('a', NL.pct(cob(c[nombres[0]], sim.p.v), 1)); sim.set('b', NL.pct(cob(c[nombres[1]], sim.p.v), 1));
      sim.set('h', nombres.map((n) => NL.pct(c[n].filter((x) => x === 1).length / c[n].length, 0)).join(' y '));
      const ctx = cv.ctx; ctx.clearRect(0, 0, cv.w, cv.h);
      const pl = new NL.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 5000, ymin: 0, ymax: 1, xlog: true, xlabel: 'vocabulario (formas más frecuentes)', ylabel: 'cobertura del texto', mb: 36, yfmt: (v) => NL.pct(v, 0) });
      pl.frame();
      nombres.forEach((n, k) => { const xs = [], ys = []; for (let v = 10; v <= 5000; v = Math.round(v * 1.15) + 1) { xs.push(v); ys.push(cob(c[n], v)); } pl.xy(xs, ys, { color: cols[k], width: 2.2 }); });
      pl.vline(sim.p.v, { color: '--ink-3', dash: [4, 4] });
      pl.legend(nombres.map((n, k) => ({ label: n, color: cols[k] })), 'br');
    });
  });
  NL.bank.add('recursos', [
    { q: 'Un corpus lingüístico es…', opts: ['Una colección de textos (o habla) organizada y, a menudo, anotada, que sirve para estudiar y entrenar sistemas', 'Un diccionario de sinónimos', 'Un programa de traducción', 'Una gramática formal'], ok: 0, fb: 'Puede ser bruto (solo texto) o anotado (categorías, árboles, entidades…).', lvl: 1 },
    { q: 'CESS-ESP y AnCora son corpus del español…', opts: ['Anotados con categorías gramaticales y estructura sintáctica', 'De solo audio', 'De mensajes de redes sociales', 'Sin anotar'], ok: 0, fb: 'Sirven para entrenar etiquetadores y analizadores.', lvl: 2 },
    { q: 'En los corpus del capítulo, con las 1.000 formas más frecuentes se cubre en torno al…', opts: ['70 % del texto', '10 %', '99 %', '30 %'], ok: 0, fb: 'CESS-ESP: 70,0 %; CoNLL-2002: 70,9 %. Es la ley de Zipf: pocas palabras cubren mucho texto.', lvl: 2 },
    { q: 'Los hapax (formas que aparecen una sola vez) son…', opts: ['Más de la mitad de las formas distintas en CESS-ESP', 'Muy raros', 'Siempre errores', 'Solo nombres propios'], ok: 0, fb: 'En CESS-ESP, el 52,9 % de las formas distintas aparece una sola vez.', lvl: 2 },
    { q: 'Antes de usar un corpus para un producto comercial hay que comprobar…', opts: ['Su licencia (por ejemplo, CC BY-NC no permite uso comercial) y la procedencia de los datos', 'Solo su tamaño', 'Solo su idioma', 'Nada'], ok: 0, fb: 'La licencia y la privacidad son tan importantes como la calidad.', lvl: 1 },
    { q: 'WordNet organiza las palabras en…', opts: ['Synsets (conjuntos de sinónimos) unidos por relaciones como la hiperonimia', 'Orden alfabético solamente', 'Árboles sintácticos', 'Frecuencias'], ok: 0, fb: 'Y el WordNet multilingüe abierto conecta lemas de unos 30 idiomas a los mismos synsets.', lvl: 1 },
    { q: 'Los corpus masivos rastreados de la web (OSCAR, mC4) se usan sobre todo para…', opts: ['Preentrenar modelos de lenguaje', 'Evaluar analizadores sintácticos', 'Enseñar gramática', 'Anotar entidades'], ok: 0, fb: 'Son enormes pero ruidosos y sin anotar; requieren filtrado y deduplicación.', lvl: 2 }
  ]);
})();
