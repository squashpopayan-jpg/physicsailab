/* Portada: una oración atraviesa las capas de un sistema de PLN; panel de progreso */
(function () {
  'use strict';
  const NL = window.NL;

  NL.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, label: 'Una oración en español dividida en tokens, etiquetada y conectada por dependencias' });
    const W = ['El', 'gato', 'negro', 'duerme', 'en', 'la', 'alfombra', 'roja', '.'];
    const T = ['DET', 'NOUN', 'ADJ', 'VERB', 'ADP', 'DET', 'NOUN', 'ADJ', 'PUNCT'];
    const CT = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7'];
    const colOf = { DET: '--c6', NOUN: '--c2', ADJ: '--c3', VERB: '--c1', ADP: '--c5', PUNCT: '--ink-3' };
    /* (dependiente → núcleo, relación) */
    const D = [[0, 1, 'det'], [2, 1, 'amod'], [1, 3, 'nsubj'], [6, 3, 'obl'], [4, 6, 'case'], [5, 6, 'det'], [7, 6, 'amod'], [8, 3, 'punct']];
    let t = 0;
    sim.animate((dt) => { t += dt; if (t > 13) t = 0; });
    sim.onDraw(() => {
      NL.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const fase = t < 1.6 ? 0 : t < 3.6 ? 1 : t < 6.6 ? 2 : t < 11 ? 3 : 4;
      const nw = W.length;
      ctx.font = `500 ${Math.max(11, Math.min(15, w / 30))}px ${NL.FONT_MONO}`;
      const fs = Math.max(11, Math.min(15, w / 30));
      const pad = 8, gap = Math.max(3, w * 0.012);
      const ws = W.map((x) => ctx.measureText(x).width + 2 * pad);
      const total = ws.reduce((a, b) => a + b, 0) + gap * (nw - 1);
      let x0 = Math.max(8, (w - total) / 2);
      const sc = total > w - 16 ? (w - 16) / total : 1;
      const xs = []; let x = x0;
      ws.forEach((q) => { xs.push(x); x += (q + gap) * sc; });
      const y0 = h * 0.62, bh = fs + 14;
      const cx = (i) => xs[i] + (ws[i] * sc) / 2;
      NL.text(ctx, fase === 0 ? 'Texto: «El gato negro duerme en la alfombra roja.»' : fase === 1 ? '1 · Tokenización: separar en unidades' : fase === 2 ? '2 · Etiquetado: categoría de cada token' : fase === 3 ? '3 · Dependencias: quién modifica a quién' : '4 · Análisis completo', 12, 24, { size: 13.5, weight: 700 });
      if (fase === 0) {
        NL.text(ctx, W.join(' ').replace(' .', '.'), w / 2, y0 + 5, { size: fs + 2, mono: true, align: 'center' });
      } else {
        W.forEach((s, i) => {
          const bw = ws[i] * sc;
          ctx.fillStyle = NL.col('--surface');
          ctx.strokeStyle = fase >= 2 ? NL.col(colOf[T[i]]) : NL.col('--rule-strong');
          ctx.lineWidth = fase >= 2 ? 2 : 1.3;
          const reveal = fase === 1 ? Math.min(1, Math.max(0, (t - 1.6) / 0.25 - i * 0.18)) : 1;
          ctx.globalAlpha = reveal;
          ctx.beginPath(); ctx.roundRect(xs[i], y0 - bh / 2, bw, bh, 5); ctx.fill(); ctx.stroke();
          NL.text(ctx, s, xs[i] + bw / 2, y0 + 5, { size: fs, mono: true, align: 'center' });
          ctx.globalAlpha = 1;
          if (fase >= 2) {
            const a = fase === 2 ? Math.min(1, Math.max(0, (t - 3.6) / 0.25 - i * 0.2)) : 1;
            ctx.globalAlpha = a;
            NL.text(ctx, T[i], xs[i] + bw / 2, y0 + bh / 2 + 17, { size: Math.max(9.5, fs - 3), weight: 700, color: colOf[T[i]], align: 'center' });
            ctx.globalAlpha = 1;
          }
        });
      }
      if (fase >= 3) {
        const prog = fase === 3 ? (t - 6.6) / 4.4 : 1;
        D.forEach(([a, b, rel], k) => {
          const vis = Math.min(1, Math.max(0, prog * D.length - k));
          if (vis <= 0) return;
          const x1 = cx(a), x2 = cx(b), hgt = 22 + Math.abs(x2 - x1) * 0.22;
          const yt = y0 - bh / 2 - 2;
          ctx.globalAlpha = vis;
          ctx.strokeStyle = NL.col('--ink-2'); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x1, yt); ctx.bezierCurveTo(x1, yt - hgt, x2, yt - hgt, x2, yt); ctx.stroke();
          NL.draw.arrow(ctx, x2, yt - 6, x2, yt, { color: '--ink-2', width: 1.3, head: 6 });
          NL.text(ctx, rel, (x1 + x2) / 2, yt - hgt * 0.75 - 3, { size: Math.max(9.5, fs - 3), color: '--ink-3', align: 'center', halo: true, mono: true });
          ctx.globalAlpha = 1;
        });
      }
      if (fase === 4) NL.text(ctx, 'sujeto: «gato» · verbo: «duerme» · lugar: «alfombra»', w / 2, h - 18, { size: 12.5, color: '--ink-3', align: 'center' });
    });
  });

  /* Panel de progreso de la portada */
  NL.fillHomeProgress = function (p) {
    const box = document.querySelector('#cap-inicio .home-prog');
    if (!box) return;
    const T = NL.track, hoy = T.ymd(), banco = T.state.curso.banco, ids = Object.keys(banco);
    const dominadas = ids.filter((q) => banco[q].caja >= 3).length;
    const toca = ids.filter((q) => T.debe(q, hoy)).length;
    const total = NL.bank ? NL.bank.all().length : 0;
    box.innerHTML = `
      <div><small>Curso</small><b>${p.leidos} de ${p.caps}</b><span>capítulos estudiados</span><div class="pbar"><i style="width:${(100 * p.frac).toFixed(1)}%"></i></div></div>
      <div><small>Autoevaluaciones</small><b>${p.quizHechos ? Math.round((100 * p.qOk) / p.qN) + ' %' : '—'}</b><span>${p.quizHechos} hechas · mejores resultados</span></div>
      <div><small>Banco de preguntas</small><b>${ids.length} de ${total}</b><span>${dominadas} dominadas · ${toca} por repasar hoy</span></div>
      <div><small>Centro de pruebas</small><b style="font-size:19px">Examen y repaso</b><span><a href="#pruebas">Abrir el Centro de pruebas →</a></span></div>`;
  };
})();
