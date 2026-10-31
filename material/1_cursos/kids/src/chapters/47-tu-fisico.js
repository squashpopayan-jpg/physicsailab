/* Capítulo 47 — Tú, físico o física */
(function () {
  'use strict';
  const FK = window.FK, M = FK.M;

  FK.sim('quien-soy', function (g) {
    FK.kit.match(g, [
      ['📜 Búho Sabio', 'Historia y método de la ciencia'], ['🐱 Newti', 'Mecánica: movimiento y fuerzas'], ['💧 Gotín', 'Fluidos: agua y aire'], ['🔥 Flamo', 'Termodinámica: calor'], ['🦇 Eco', 'Ondas y sonido'],
      ['💡 Lumi', 'Óptica: luz y color'], ['⚡ Chispa', 'Electricidad y magnetismo'], ['🚀 Cosmo', 'Astronomía y cosmología'], ['⚛️ Quarki', 'Átomos, cuántica y partículas'], ['🌍 Terra', 'Tierra, cuerpo, materiales y azar']
    ]);
  });

  /* ---------- El Gran Reto: 10 preguntas al azar de todos los capítulos ---------- */
  FK.sim('gran-reto', function (g) {
    const area = g.area('gr');
    const bank = [];
    FK.chapters.forEach((c) => c.tpl.content.querySelectorAll('.quiz .q').forEach((q) => {
      const p = q.querySelector('p'), opts = Array.from(q.querySelectorAll('ol li')).map((l) => l.innerHTML), why = q.querySelector('p.why');
      if (p && opts.length && why) bank.push({ q: p.innerHTML, opts, ans: +q.dataset.ans, why: why.innerHTML, ch: c });
    }));
    const S = { qs: [], i: 0, ok: 0, done: false };
    const N = 10;
    function newRound() {
      /* una pregunta por capítulo distinto, al azar */
      const byCh = M.shuffle(FK.chapters.filter((c) => c.num !== 47));
      S.qs = byCh.slice(0, N).map((c) => M.pick(bank.filter((b) => b.ch === c)));
      S.i = 0; S.ok = 0; S.done = false; render();
    }
    function render() {
      if (S.done) {
        const win = S.ok >= 8;
        area.innerHTML = `<div class="gr-end"><div class="gr-big">${win ? '🏆' : '💪'}</div><h3>${S.ok} de ${N}</h3><p>${win ? '¡Superaste el Gran Reto! Eres oficialmente un/a gran físico/a KIDS.' : 'Casi. Repasa los capítulos y vuelve a intentar con otras preguntas.'}</p><button class="btn primary" type="button">🔁 Otro Gran Reto</button></div>`;
        area.querySelector('button').addEventListener('click', newRound);
        if (win) g.win(`¡${S.ok} de ${N}! ¡Superaste el Gran Reto!`); else g.say(`Acertaste ${S.ok} de ${N}. Necesitas 8. ¡Tú puedes!`, 'think');
        return;
      }
      const q = S.qs[S.i];
      area.innerHTML = `<div class="gr-bar"><span>Pregunta ${S.i + 1} de ${N}</span><span>⭐ ${S.ok} aciertos</span></div><div class="gr-ch">Capítulo ${q.ch.num}: ${q.ch.title}</div><h3 class="gr-q">${q.q}</h3><div class="opts"></div><div class="gr-why" hidden></div><div class="btnrow"><button class="btn primary gr-next" type="button" hidden>Siguiente →</button></div>`;
      const box = area.querySelector('.opts'), why = area.querySelector('.gr-why'), next = area.querySelector('.gr-next');
      q.opts.forEach((o, j) => {
        const b = FK.el('button', 'opt', `<span class="opt-l">${'ABCD'[j]}</span><span>${o}</span>`); b.type = 'button';
        b.addEventListener('click', () => {
          if (box.classList.contains('locked')) return; box.classList.add('locked');
          const right = j === q.ans; if (right) { S.ok++; b.classList.add('right'); FK.sfx.ok(); } else { b.classList.add('wrong'); box.children[q.ans].classList.add('right'); FK.sfx.no(); }
          why.hidden = false; why.innerHTML = (right ? '<b>¡Correcto!</b> ' : '<b>La respuesta era la ' + 'ABCD'[q.ans] + '.</b> ') + q.why; next.hidden = false; next.textContent = S.i === N - 1 ? 'Ver mi resultado' : 'Siguiente →';
        });
        box.appendChild(b);
      });
      next.addEventListener('click', () => { S.i++; if (S.i >= N) S.done = true; render(); });
    }
    g.run({ static: true, init() { newRound(); g.say('¡Prepárate! Diez preguntas de diez mundos distintos.'); } });
  });
})();
