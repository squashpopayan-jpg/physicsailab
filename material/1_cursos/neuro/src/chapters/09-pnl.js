/* Capítulo 9 — Qué es la PNL y qué promete */
(function () {
  'use strict';
  const RC = window.RC;

  /* ======================================================================
     9.1 Demostración del efecto Barnum (Forer)
     ====================================================================== */
  const PREG = [
    ['Cuando recuerda unas vacaciones, ¿qué le llega primero?', ['Un paisaje o una escena', 'Una canción, voces o el ruido del lugar', 'El calor, el cansancio o lo que sintió']],
    ['Para aprender a llegar a un sitio nuevo prefiere…', ['Ver un mapa', 'Que se lo expliquen', 'Ir y equivocarse caminando']],
    ['Cuando alguien le cuenta un problema, usted dice…', ['«Ya veo»', '«Te escucho»', '«Te entiendo, lo siento»']],
    ['En una tienda nueva, ¿qué nota primero?', ['La decoración', 'La música', 'La temperatura o el olor']],
    ['Cuando se concentra, le molesta más…', ['El desorden visual', 'El ruido', 'Una silla incómoda']],
    ['Para relajarse prefiere…', ['Mirar algo bonito', 'Escuchar música', 'Un baño o un masaje']]
  ];
  const SIS = ['visual', 'auditivo', 'kinestésico'];
  RC.defineSim('forer', function (sim) {
    sim.side.hidden = true;
    sim.body.classList.add('below');
    sim.stage.style.display = 'none';
    const box = sim.html('quiz');
    const resp = new Array(PREG.length).fill(null);
    let nota = null, revelado = false;
    const render = () => {
      const n = resp.filter((r) => r !== null).length;
      let html = PREG.map(([q, ops], i) => `<div class="q"><b>${i + 1}. ${q}</b><div class="opts">${ops.map((o, k) => `<button type="button" data-q="${i}" data-k="${k}" class="${resp[i] === k ? 'right' : ''}">${o}</button>`).join('')}</div></div>`).join('');
      if (n === PREG.length) {
        const cnt = [0, 0, 0];
        resp.forEach((r) => cnt[r]++);
        const dom = cnt.indexOf(Math.max(...cnt));
        html += `<div class="q" style="border-top:1px solid var(--rule);padding-top:12px"><b>Su perfil: sistema ${SIS[dom]} dominante</b>
          <p>Usted procesa el mundo sobre todo de forma ${SIS[dom]}, aunque en situaciones de presión recurre a los otros canales. Tiene una gran necesidad de que los demás lo aprecien y lo valoren, y a veces es muy exigente consigo mismo. Posee un potencial considerable que todavía no ha aprovechado del todo. Por fuera suele parecer seguro y disciplinado, pero por dentro a veces duda de si tomó la decisión correcta. Prefiere cierta variedad y se siente incómodo cuando lo limitan las reglas. En unas ocasiones es sociable y conversador; en otras, reservado y prudente. Es una persona que piensa por sí misma y no acepta las ideas de otros sin pruebas.</p>
          <b>¿Qué tan bien lo describe? (0 = nada, 5 = perfectamente)</b>
          <div class="opts">${[0, 1, 2, 3, 4, 5].map((v) => `<button type="button" data-nota="${v}" class="${nota === v ? 'right' : ''}">${v}</button>`).join('')}</div></div>`;
        if (nota !== null) html += `<div class="ctrl-row"><button type="button" class="btn primary" data-rev="1">Revelar</button></div>`;
        if (revelado) html += `<div class="fb"><b>Usted calificó ${nota} de 5.</b> Excepto la primera frase, el párrafo es <b>idéntico para todas las personas</b>, sin importar sus respuestas: son afirmaciones vagas que casi todo el mundo siente propias. En el experimento de Forer el promedio fue 4,26 de 5. Además, las seis preguntas no miden un «sistema representacional»: las opciones combinan preferencias de gusto y de costumbre, y los cuestionarios de este tipo no predicen cómo aprende ni cómo se comunica mejor una persona (capítulo 10). Si su calificación fue alta, no se sienta engañado: le pasa a casi todos. Esa es justamente la lección.</div>`;
      }
      box.innerHTML = html;
      box.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { resp[+b.dataset.q] = +b.dataset.k; revelado = false; render(); }));
      box.querySelectorAll('[data-nota]').forEach((b) => b.addEventListener('click', () => { nota = +b.dataset.nota; render(); }));
      const rv = box.querySelector('[data-rev]');
      if (rv) rv.addEventListener('click', () => { revelado = true; render(); });
    };
    render();
  });

  RC.defineSim('quiz-pnl', function (sim) {
    RC.quiz(sim, [
      { q: '¿De dónde surgió la PNL?', opts: ['De experimentos de neurociencia con resonancia magnética', 'De observar y modelar a tres terapeutas en los años setenta', 'De la psiquiatría clínica'], ok: 1, fb: 'Bandler y Grinder modelaron a Perls, Satir y Erickson.' },
      { q: 'En la revisión de Witkowski (2010), ¿qué fracción de los estudios empíricos apoyaba los principios de la PNL?', opts: ['Cerca de 18 %', 'Cerca de 50 %', 'Cerca de 90 %'], ok: 0, fb: '18,2 % a favor, 54,5 % en contra y 27,3 % inconclusos, de 33 estudios.' },
      { q: 'El efecto Barnum consiste en…', opts: ['Que las personas aceptan como propias descripciones vagas y halagadoras', 'Que el lenguaje cambia el cerebro', 'Que los ojos revelan los pensamientos'], ok: 0, fb: 'Forer: 4,26 de 5 para un mismo texto entregado a todos.' },
      { q: '¿Por qué algunas técnicas de la PNL a veces ayudan?', opts: ['Porque sus explicaciones neurológicas son correctas', 'Porque contienen ingredientes de métodos probados, como la exposición o las metas concretas, además de la expectativa', 'Porque reprograman el subconsciente'], ok: 1, fb: 'Donde funcionan, coinciden con técnicas que la psicología ha probado.' },
      { q: '¿Qué concluyó la revisión sistemática de Sturt y otros (2012) sobre la PNL en salud?', opts: ['Que es muy eficaz', 'Que hay pocos estudios, de calidad pobre, y no hay evidencia suficiente para recomendarla', 'Que es peligrosa'], ok: 1, fb: 'Diez estudios, alto riesgo de sesgo; 4 de 5 ensayos sin diferencias.' }
    ], { id: 'pnl', shuffle: true });
  });
})();
