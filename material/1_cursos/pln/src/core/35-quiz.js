/* ===================================================================
   35-quiz.js — Banco de preguntas, autoevaluaciones y Centro de pruebas.
   Cada capítulo registra su banco con NL.bank.add(idCapitulo, [preguntas]).
   Pregunta de opción múltiple: {q, opts:[…], ok: índice, fb, lvl}.
   Pregunta numérica:           {q, num: valor, tol: tolerancia, unit, fb, lvl}.
   lvl: 1 recordar · 2 comprender · 3 aplicar.
   La autoevaluación del final de cada capítulo es
     <div class="sim" data-sim="quiz" data-cap="idCapitulo" data-title="…"></div>
   y todas las respuestas alimentan el repaso espaciado (Leitner).
   =================================================================== */
(function () {
  'use strict';
  const NL = window.NL;
  const el = NL.el;

  /* ---------- Registro del banco ---------- */
  const B = (NL.bank = { items: {}, order: [] });
  B.add = function (cap, qs) {
    if (B.items[cap]) { console.warn('banco repetido: ' + cap); }
    B.items[cap] = qs.map((q, i) => Object.assign({ id: cap + '#' + (i + 1), cap, lvl: 2 }, q));
    if (!B.order.includes(cap)) B.order.push(cap);
  };
  B.get = (cap) => B.items[cap] || [];
  B.all = () => B.order.flatMap((c) => B.items[c]);
  B.byId = (id) => { const [c, i] = id.split('#'); return (B.items[c] || [])[+i - 1] || null; };

  const mulberry = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuffleOpts = (item, rng) => {
    if (item.num !== undefined || !item.opts) return item;
    const idx = item.opts.map((_, k) => k);
    for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
    return Object.assign({}, item, { opts: idx.map((k) => item.opts[k]), ok: idx.indexOf(item.ok) });
  };
  const parseAns = (s) => parseFloat(String(s).replace(/\s/g, '').replace(/−/g, '-').replace(',', '.'));
  const fmtNum = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(4)).replace('.', ','));

  /* ---------- Dibujo de una tanda de preguntas ----------
     o = {id, shuffle: 'seed'|'random'|false, record: true, labels: true,
          onAnswer(item, ok), onDone(res), againText} */
  NL.quizRender = function (box, qs, o = {}) {
    box.innerHTML = '';
    const rng = o.shuffle === 'random' ? Math.random : mulberry(97);
    const list = o.shuffle ? qs.map((it) => shuffleOpts(it, o.shuffle === 'seed' ? mulberry(31 * (+String(it.id).split('#')[1] || 1) + 7) : rng)) : qs;
    const answered = new Array(list.length).fill(null);
    const score = el('div', 'score');
    const prevTxt = () => { const q = o.id && NL.track ? NL.track.quiz(o.id) : null; return q ? ` · su mejor resultado guardado: ${q.mejor} de ${q.n}` : ''; };
    const upd = (fin) => {
      const n = answered.filter((a) => a !== null).length, ok = answered.filter((a) => a === true).length;
      if (fin && n === list.length) {
        if (o.id && NL.track) NL.track.setQuiz(o.id, ok, list.length);
        if (o.onDone) o.onDone({ ok, n: list.length, answered: answered.slice(), list });
      }
      score.innerHTML = n ? `Respondidas ${n} de ${list.length} · correctas <b>${ok}</b>` + (n === list.length ? ` (${Math.round((100 * ok) / n)} %)` + prevTxt() : '') : 'Responda cada pregunta; al elegir verá la explicación.' + prevTxt();
    };
    const mark = (qi, item, ok, fb, box1) => {
      answered[qi] = ok;
      fb.innerHTML = (ok ? '<b class="gain">Correcto.</b> ' : '<b class="loss">No es así.</b> ') + item.fb;
      fb.hidden = false;
      box1.classList.add(ok ? 'is-ok' : 'is-bad');
      if (o.record !== false && NL.track && item.id) NL.track.registrar(item.id, ok);
      if (o.onAnswer) o.onAnswer(item, ok);
      if (NL.typeset) NL.typeset(fb);
      upd(true);
    };
    list.forEach((item, qi) => {
      const d = el('div', 'q');
      const lab = o.labels && item.cap && NL.app && NL.app.byId[item.cap] ? `<small class="qcap">${NL.app.byId[item.cap].num}. ${NL.app.byId[item.cap].title}</small>` : '';
      d.append(el('b', null, `${qi + 1}. ${item.q}` + lab));
      const fb = el('div', 'fb');
      fb.hidden = true;
      if (item.num !== undefined) {
        const row = el('div', 'numrow');
        const inp = document.createElement('input');
        inp.type = 'text'; inp.inputMode = 'decimal'; inp.className = 'num-in'; inp.placeholder = 'Su respuesta' + (item.unit ? ' (' + item.unit + ')' : '');
        inp.setAttribute('aria-label', 'Respuesta numérica de la pregunta ' + (qi + 1));
        const btn = el('button', 'btn', 'Comprobar');
        btn.type = 'button';
        const go = () => {
          if (answered[qi] !== null) return;
          const v = parseAns(inp.value);
          if (!isFinite(v)) { inp.focus(); return; }
          const ok = Math.abs(v - item.num) <= (item.tol === undefined ? 1e-9 : item.tol);
          inp.disabled = true; btn.disabled = true;
          mark(qi, item, ok, fb, d);
          if (!ok) fb.insertAdjacentHTML('beforeend', ` <span class="ans">Respuesta: <b>${fmtNum(item.num)}${item.unit ? ' ' + item.unit : ''}</b>.</span>`);
        };
        btn.addEventListener('click', go);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        row.append(inp, btn);
        d.append(row, fb);
      } else {
        const ops = el('div', 'opts');
        item.opts.forEach((t, k) => {
          const b = el('button', null, t);
          b.type = 'button';
          b.addEventListener('click', () => {
            if (answered[qi] !== null) return;
            b.classList.add(k === item.ok ? 'right' : 'wrong');
            ops.children[item.ok].classList.add('right');
            mark(qi, item, k === item.ok, fb, d);
          });
          ops.append(b);
        });
        d.append(ops, fb);
      }
      box.append(d);
    });
    const again = el('button', 'btn', o.againText || 'Volver a empezar');
    again.type = 'button';
    again.addEventListener('click', () => NL.quizRender(box, qs, o));
    const foot = el('div', 'ctrl-row');
    foot.append(score, again);
    foot.style.alignItems = 'center';
    foot.style.justifyContent = 'space-between';
    box.append(foot);
    upd();
    if (NL.typeset) NL.typeset(box);
    return { list, answered };
  };

  /* ---------- Autoevaluación dentro de una simulación sin lienzo ---------- */
  NL.quiz = function (sim, qs, o = {}) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('quiz');
    NL.quizRender(box, qs, Object.assign({ shuffle: 'seed' }, o));
    return box;
  };
  NL.defineSim('quiz', function (sim, ds) {
    const cap = ds.cap;
    const qs = B.get(cap);
    if (!qs.length) { sim.fail(new Error('banco vacío: ' + cap)); return; }
    NL.quiz(sim, qs, { id: cap });
  });
})();
