/* ===================================================================
   30-ui.js — componentes de página: globos, datos curiosos, preguntas,
   experimentos, palabras con significado, lectura en voz alta
   =================================================================== */
(function () {
  'use strict';
  const FK = window.FK;
  const LET = ['A', 'B', 'C', 'D'];

  FK.qKey = (ch, i) => `q:${ch}:${i}`;
  FK.eKey = (ch, i) => `e:${ch}:${i}`;

  /* ---------- Texto para leer en voz alta ---------- */
  function readable(root) {
    const out = [];
    root.querySelectorAll('p, li, .say-b, h3, summary').forEach((e) => {
      if (e.closest('.simbox, .quiz, .exp, .tts-skip, details:not([open]) > :not(summary)')) return;
      const t = e.textContent.replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
    });
    return out.join('. ');
  }

  /* ---------- Globos de diálogo ---------- */
  function say(el, art) {
    const who = el.dataset.who || art.dataset.guide;
    const mood = el.dataset.mood || 'happy';
    const c = FK.CHARS[who] || FK.CHARS.buho;
    const body = el.innerHTML;
    el.style.setProperty('--c', c.color); el.style.setProperty('--cs', c.soft); el.style.setProperty('--cd', c.dark);
    el.innerHTML = `<div class="say-av">${FK.char(who, mood, 76)}<span class="say-n">${c.name}</span></div><div class="say-b">${body}</div>`;
  }

  /* ---------- Preguntas ---------- */
  function quiz(el, art) {
    const ch = art.dataset.id;
    el.insertAdjacentHTML('afterbegin', '<h3 class="quiz-h"><span aria-hidden="true">🧠</span> ¡A pensar!</h3>');
    el.querySelectorAll('.q').forEach((q, i) => {
      const ans = +q.dataset.ans;
      const key = FK.qKey(ch, i);
      const opts = Array.from(q.querySelectorAll('ol > li'));
      const ol = q.querySelector('ol');
      const why = q.querySelector('.why');
      if (why) why.hidden = true;
      q.querySelector('p').insertAdjacentHTML('afterbegin', `<span class="qn">${i + 1}</span>`);
      const box = FK.el('div', 'opts');
      opts.forEach((li, j) => {
        const b = FK.el('button', 'opt', `<span class="opt-l">${LET[j]}</span><span>${li.innerHTML}</span>`);
        b.type = 'button';
        b.addEventListener('click', () => {
          if (q.classList.contains('solved')) return;
          if (j === ans) {
            b.classList.add('right'); q.classList.add('solved'); FK.sfx.ok();
            const first = !FK.store.get(key, false);
            FK.store.set(key, true);
            if (why) { why.hidden = false; why.insertAdjacentHTML('afterbegin', '<b>¡Correcto!</b> '); }
            if (first) { FK.confetti(25); FK.updateProgress(); }
          } else {
            b.classList.add('wrong'); FK.sfx.no();
            setTimeout(() => b.classList.remove('wrong'), 600); b.disabled = true;
            let h = q.querySelector('.hint'); if (!h) { h = FK.el('p', 'hint'); q.appendChild(h); }
            h.textContent = 'Casi… ¡prueba otra opción!';
          }
        });
        box.appendChild(b);
      });
      ol.replaceWith(box);
      if (FK.store.get(key, false)) { q.classList.add('solved'); box.children[ans].classList.add('right'); if (why) { why.hidden = false; why.insertAdjacentHTML('afterbegin', '<b>¡Correcto!</b> '); } }
    });
  }

  /* ---------- Experimentos ---------- */
  function exp(el, art, idx) {
    const ch = art.dataset.id;
    const key = FK.eKey(ch, idx);
    const title = el.dataset.title || 'Experimento';
    const adult = el.dataset.adult === '1' || el.dataset.adult === 'true';
    const level = { 1: 'Fácil', 2: 'Medio', 3: 'Reto' }[el.dataset.level] || el.dataset.level || 'Fácil';
    const mat = el.querySelector('ul.mat'), steps = el.querySelector('ol.steps'), pred = el.querySelector('.predict'), res = el.querySelector('.result'), why = el.querySelector('.why'), warn = el.querySelector('.warn');
    const matHtml = mat ? mat.innerHTML : '', stepsHtml = steps ? steps.innerHTML : '';
    const predHtml = pred ? pred.innerHTML : '', resHtml = res ? res.innerHTML : '', whyHtml = why ? why.innerHTML : '', warnHtml = warn ? warn.innerHTML : '';
    el.innerHTML = `
      <div class="exp-head"><span class="exp-ic" aria-hidden="true">🧪</span><div><small>Experimento en casa</small><b>${title}</b></div>
        <div class="exp-chips"><span class="chip-i">⏱ ${el.dataset.time || '10 min'}</span><span class="chip-i">⭐ ${level}</span>${adult ? '<span class="chip-i adult">👩‍👧 Con un adulto</span>' : ''}</div></div>
      ${adult ? '<div class="exp-adult">👩‍👧 <b>Pide ayuda a un adulto</b> para este experimento.</div>' : ''}
      ${warnHtml ? `<div class="warn"><b>⚠️ Cuidado:</b> ${warnHtml}</div>` : ''}
      <div class="exp-cols"><div><h4>🧺 Necesitas</h4><ul class="mat">${matHtml}</ul></div><div><h4>👣 Paso a paso</h4><ol class="steps">${stepsHtml}</ol></div></div>
      ${predHtml ? `<div class="exp-pred"><b>🤔 Antes de empezar, piensa:</b> ${predHtml}</div>` : ''}
      <div class="exp-reveal" hidden>${resHtml ? `<div class="exp-res"><b>👀 ¿Qué pasó?</b> ${resHtml}</div>` : ''}${whyHtml ? `<div class="exp-why"><b>💡 ¿Por qué?</b> ${whyHtml}</div>` : ''}</div>
      <div class="exp-foot"><button type="button" class="btn ghost exp-show">👀 Ver qué pasa</button><label class="done-l"><input type="checkbox" class="exp-done"><span>¡Lo hice!</span></label></div>`;
    const done = el.querySelector('.exp-done'), rev = el.querySelector('.exp-reveal');
    done.checked = !!FK.store.get(key, false);
    done.addEventListener('change', () => { FK.store.set(key, done.checked); if (done.checked) { FK.sfx.win(); FK.confetti(40); } FK.updateProgress(); });
    el.querySelector('.exp-show').addEventListener('click', (e) => { rev.hidden = !rev.hidden; e.target.textContent = rev.hidden ? '👀 Ver qué pasa' : '🙈 Esconder'; });
    if (!resHtml && !whyHtml) el.querySelector('.exp-show').remove();
  }

  /* ---------- Palabras con significado ---------- */
  let tip = null;
  function showTip(d) {
    if (!tip) { tip = FK.el('div', 'dfn-tip'); tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); document.addEventListener('click', (e) => { if (!e.target.closest('dfn')) tip.classList.remove('on'); }); }
    tip.innerHTML = `<b>${d.textContent}</b><br>${d.dataset.def}`;
    const r = d.getBoundingClientRect();
    tip.classList.add('on');
    const w = Math.min(300, window.innerWidth - 24);
    tip.style.width = w + 'px';
    tip.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + window.scrollX + r.width / 2 - w / 2)) + 'px';
    tip.style.top = r.bottom + window.scrollY + 8 + 'px';
  }

  /* ---------- Mejora de un capítulo ---------- */
  FK.enhance = function (art) {
    art.querySelectorAll('.say').forEach((e) => say(e, art));
    art.querySelectorAll('.fact').forEach((e) => { if (!e.querySelector('.box-h')) e.insertAdjacentHTML('afterbegin', `<div class="box-h">🤯 ¿Sabías que…?</div>`); });
    art.querySelectorAll('.magic').forEach((e) => { if (!e.querySelector('.box-h')) e.insertAdjacentHTML('afterbegin', `<div class="box-h">✨ ${e.dataset.name || 'Fórmula mágica'}</div>`); });
    art.querySelectorAll('.story').forEach((e) => { if (!e.querySelector('.box-h')) e.insertAdjacentHTML('afterbegin', `<div class="box-h">📜 ${e.dataset.title || 'Una historia'}</div>`); });
    art.querySelectorAll(':scope .warn:not(.exp .warn)').forEach((e) => { if (!e.querySelector('.box-h')) e.insertAdjacentHTML('afterbegin', `<div class="box-h">⚠️ Cuidado</div>`); });
    art.querySelectorAll('details.curious').forEach((d) => { if (!d.querySelector('summary')) d.insertAdjacentHTML('afterbegin', '<summary>🧠 Para mentes curiosas</summary>'); });
    art.querySelectorAll('dfn[data-def]').forEach((d) => { d.tabIndex = 0; d.setAttribute('role', 'button'); d.addEventListener('click', (e) => { e.stopPropagation(); showTip(d); }); d.addEventListener('keydown', (e) => { if (e.key === 'Enter') showTip(d); }); });
    art.querySelectorAll('.exp').forEach((e, i) => exp(e, art, i));
    art.querySelectorAll('.quiz').forEach((e) => quiz(e, art));
    /* botón de lectura en voz alta en cada sección */
    if (FK.speakOK()) {
      art.querySelectorAll('section > h2').forEach((h) => {
        const b = FK.el('button', 'tts', '🔊'); b.type = 'button'; b.title = 'Escuchar esta parte'; b.setAttribute('aria-label', 'Escuchar esta parte');
        b.addEventListener('click', () => {
          if (FK.speaking) { FK.stopSpeak(); document.querySelectorAll('.tts.on').forEach((x) => x.classList.remove('on')); return; }
          const sec = h.parentElement;
          b.classList.add('on');
          FK.speak(h.firstChild.textContent + '. ' + readable(sec), () => b.classList.remove('on'));
        });
        h.appendChild(b);
      });
    }
    /* simulaciones: se montan al acercarse */
    const hosts = Array.from(art.querySelectorAll('.sim[data-sim]'));
    if ('IntersectionObserver' in window) {
      const lazy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { lazy.unobserve(e.target); FK.mountSim(e.target); } }), { rootMargin: '500px' });
      hosts.forEach((h) => { h.classList.add('sim-ph'); h.innerHTML = '<div class="sim-loading">🎮 Preparando el juego…</div>'; lazy.observe(h); });
    } else hosts.forEach((h) => FK.mountSim(h));
  };

  /* ---------- Progreso ---------- */
  FK.stats = function (ch) {
    const info = FK.chapterInfo && FK.chapterInfo[ch];
    if (!info) return { done: 0, total: 0 };
    let done = 0;
    info.sims.forEach((s) => { if (FK.isWon(s)) done++; });
    for (let i = 0; i < info.nq; i++) if (FK.store.get(FK.qKey(ch, i), false)) done++;
    for (let i = 0; i < info.ne; i++) if (FK.store.get(FK.eKey(ch, i), false)) done++;
    return { done, total: info.sims.length + info.nq + info.ne };
  };
  FK.totalStars = function () {
    let d = 0, t = 0;
    for (const id in (FK.chapterInfo || {})) { const s = FK.stats(id); d += s.done; t += s.total; }
    return { done: d, total: t };
  };
  FK.updateProgress = function () {
    const tot = FK.totalStars();
    const el = document.getElementById('starCount');
    if (el) el.textContent = tot.done;
    document.querySelectorAll('[data-prog]').forEach((e) => {
      const s = FK.stats(e.dataset.prog);
      const pct = s.total ? Math.round((100 * s.done) / s.total) : 0;
      e.style.setProperty('--pct', pct + '%');
      if (e.classList.contains('lvl')) { e.classList.toggle('full', s.total > 0 && s.done === s.total); e.classList.toggle('some', s.done > 0); }
      const t = e.querySelector('.prog-t'); if (t) t.textContent = `${s.done} / ${s.total}`;
    });
    if (FK.onProgress) FK.onProgress();
  };
})();
