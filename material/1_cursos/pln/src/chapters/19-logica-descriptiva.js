/* Capítulo 19 — Lógica descriptiva y ontologías */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, A = L.alc;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const DEF = { Estudiante: 'Persona & some cursa.Curso', Docente: 'Persona & some ensena.Curso', Monitor: 'Estudiante & Docente' };
  const TBOX = Object.fromEntries(Object.entries(DEF).map(([k, v]) => [k, A.parsear(v)]));
  const caja = () => `<table class="mx"><tbody>${Object.entries(DEF).map(([k, v]) => `<tr><td style="text-align:left"><b>${k}</b> ≡</td><td style="text-align:left">${esc(A.texto(A.parsear(v)))}</td></tr>`).join('')}</tbody></table>`;

  /* ---- 1. Satisfacibilidad y subsunción ---- */
  const CONC = [
    'Estudiante', 'Docente', 'Monitor', 'Persona', 'some cursa.Curso', 'only cursa.Curso',
    'Persona & some cursa.Curso', 'some cursa.Curso & only cursa.~Curso', 'Estudiante & ~Persona', 'Monitor & ~Docente', '~Estudiante', 'Estudiante | Docente'
  ];
  NL.defineSim('alc-subsuncion', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Conceptos');
    sim.select('c', { label: 'Concepto C', options: CONC.map((x, i) => [String(i), x]), value: '2' });
    sim.text('co', { label: 'o escriba otro C (some r.C, only r.C, ~, &, |)', value: '' });
    sim.select('d', { label: 'Concepto D', options: CONC.map((x, i) => [String(i), x]), value: '0' });
    sim.text('do', { label: 'o escriba otro D', value: '' });
    sim.out('r', 'Relación entre C y D', { hl: true });
    sim.onDraw(() => {
      let html = `<small style="color:var(--ink-3)">Definiciones de la TBox (nombre ≡ concepto)</small>${caja()}`;
      try {
        const sc = (sim.p.co || '').trim() || CONC[+sim.p.c], sd = (sim.p.do || '').trim() || CONC[+sim.p.d];
        const C = A.parsear(sc), D = A.parsear(sd);
        const satC = A.satisfacible(C, TBOX), satD = A.satisfacible(D, TBOX);
        const cd = A.subsume(D, C, TBOX), dc = A.subsume(C, D, TBOX);
        const rel = !satC ? 'C es insatisfacible (denota siempre el conjunto vacío)' : cd && dc ? 'C ≡ D (equivalentes)' : cd ? 'C ⊑ D (C está incluido en D)' : dc ? 'D ⊑ C (D está incluido en C)' : A.satisfacible({ k: 'and', a: C, b: D }, TBOX) ? 'independientes (comparten ejemplares posibles, ninguno incluye al otro)' : 'disjuntos (C ⊓ D es insatisfacible)';
        sim.set('r', rel);
        const fila = (txt, v) => `<tr><td style="text-align:left">${txt}</td><td class="${v ? 'hl' : ''}">${v ? 'sí' : 'no'}</td></tr>`;
        html += `<table class="mx"><thead><tr><th style="text-align:left">Pregunta</th><th>¿Se cumple?</th></tr></thead><tbody>` +
          fila(`¿Es satisfacible C = ${esc(A.texto(C))}?`, satC) + fila(`¿Es satisfacible D = ${esc(A.texto(D))}?`, satD) +
          fila('C ⊑ D (subsunción)', cd) + fila('D ⊑ C', dc) + '</tbody></table>' +
          `<p style="margin:6px 0 0;font-size:12.5px">C ⊑ D se comprueba mostrando que <span class="mono">C ⊓ ¬D</span> es insatisfacible. Aquí, desplegada la TBox y en forma normal negativa: <span class="mono">${esc(A.texto(A.nnf({ k: 'and', a: C, b: { k: 'not', a: D } }, TBOX)))}</span></p>`;
      } catch (e) { sim.set('r', 'error'); html += `<p style="color:var(--bad,#b3261e)">${esc(e.message)}</p>`; }
      box.innerHTML = html;
    });
  });

  /* ---- 2. ABox, instancias y mundo abierto ---- */
  const ESC = {
    uni: { t: 'Universidad (ana cursa c1, luis enseña c1, pepe cursa y enseña c1)', ind: ['ana', 'luis', 'pepe', 'c1'],
      afirm: [['ana', 'Persona'], ['luis', 'Persona'], ['pepe', 'Persona'], ['c1', 'Curso']], roles: [['cursa', 'ana', 'c1'], ['ensena', 'luis', 'c1'], ['cursa', 'pepe', 'c1'], ['ensena', 'pepe', 'c1']] },
    poco: { t: 'Información escasa (de ana solo se sabe que es persona)', ind: ['ana', 'c1'], afirm: [['ana', 'Persona'], ['c1', 'Curso']], roles: [] },
    neg: { t: 'Con negación (ana es persona y solo cursa lo que no es curso; cursa c1)', ind: ['ana', 'c1'], afirm: [['ana', 'Persona & only cursa.~Curso']], roles: [['cursa', 'ana', 'c1']] }
  };
  const COLS = ['Persona', 'Estudiante', 'Docente', 'Monitor'];
  NL.defineSim('alc-abox', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Hechos conocidos (ABox)');
    sim.select('e', { label: 'Escenario', options: Object.entries(ESC).map(([k, v]) => [k, v.t]), value: 'uni' });
    sim.check('cerrado', { label: 'Suponer el mundo cerrado (lo que no consta, es falso)', value: false });
    sim.out('d', 'Respuestas «desconocido»', { hl: true });
    sim.onDraw(() => {
      const e = ESC[sim.p.e];
      const abox = { afirmaciones: e.afirm.map(([a, c]) => [a, A.parsear(c)]), roles: e.roles };
      if (!A.consistente(abox, TBOX)) { box.innerHTML = '<p>ABox inconsistente.</p>'; return; }
      let desc = 0;
      const celda = (a, c) => {
        const C = A.parsear(c);
        if (A.instancia(abox, a, C, TBOX)) return ['sí', 'hl'];
        if (A.instancia(abox, a, { k: 'not', a: C }, TBOX)) return ['no (se sigue su negación)', ''];
        if (sim.p.cerrado) return ['no (no consta)', ''];
        desc++; return ['?', 'dim'];
      };
      const filas = e.ind.map((a) => `<tr><td style="text-align:left"><b>${a}</b></td>${COLS.map((c) => { const [t, k] = celda(a, c); return `<td class="${k}" style="font-size:12px">${t}</td>`; }).join('')}</tr>`).join('');
      sim.set('d', String(desc));
      box.innerHTML = `<small style="color:var(--ink-3)">Afirmaciones: ${e.afirm.map(([a, c]) => esc(a + ' : ' + A.texto(A.parsear(c)))).concat(e.roles.map(([r, a, b]) => esc(r + '(' + a + ', ' + b + ')'))).join(' · ')}</small>` +
        `<table class="mx"><thead><tr><th style="text-align:left">¿Es instancia de…?</th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table>` +
        `<small style="color:var(--ink-3)">«?» = no se sigue ni el concepto ni su negación: con mundo abierto el razonador no inventa. Con mundo cerrado, como una base de datos, se contesta «no».</small>`;
    });
  });

  NL.bank.add('logica-descriptiva', [
    { q: 'En una lógica descriptiva, un concepto como «Estudiante» denota…', opts: ['Un individuo', 'Un conjunto de individuos (una clase)', 'Una relación entre dos individuos', 'Una oración'], ok: 1, fb: 'Los conceptos son clases (predicados unarios); los roles son relaciones binarias; los individuos son constantes.', lvl: 1 },
    { q: '«∃cursa.Curso» denota…', opts: ['Los que cursan todos los cursos', 'Los que cursan al menos un curso', 'Los cursos que alguien cursa', 'Los que no cursan nada'], ok: 1, fb: 'Restricción existencial: individuos con al menos un sucesor por el rol «cursa» que sea un Curso.', lvl: 1 },
    { q: '«∀cursa.Curso» incluye a quien no cursa nada porque…', opts: ['Es un error de la lógica', 'La condición se cumple vacuamente: no tiene ningún sucesor que falle', 'Hay que cursar siempre algo', 'No incluye a nadie'], ok: 1, fb: 'La restricción universal solo exige que los que sí existan sean Curso. Para exigir al menos uno se combina con ∃.', lvl: 2 },
    { q: 'C ⊑ D se comprueba viendo que…', opts: ['C ⊓ D es satisfacible', 'C ⊓ ¬D es insatisfacible', 'C ⊔ D es satisfacible', '¬C ⊓ D es insatisfacible'], ok: 1, fb: 'Si no puede existir un individuo que sea C y no sea D, entonces todo C es D.', lvl: 2 },
    { q: '«(∃cursa.Curso) ⊓ (∀cursa.¬Curso)» es…', opts: ['Satisfacible', 'Insatisfacible: pide un curso del que se exige que no sea curso', 'Una tautología', 'Un individuo'], ok: 1, fb: 'El sucesor exigido por ∃ debe ser Curso y, por ∀, no Curso: contradicción.', lvl: 2 },
    { q: 'En el mundo abierto, si no consta que ana sea docente y tampoco que no lo sea, el razonador responde…', opts: ['Falso', 'Verdadero', 'Desconocido (no se sigue ni lo uno ni lo otro)', 'Error'], ok: 2, fb: 'Es lo contrario de una base de datos relacional, que usa el mundo cerrado.', lvl: 2 },
    { q: 'La TBox contiene…', opts: ['Los hechos sobre individuos concretos', 'Las definiciones y relaciones entre conceptos y roles (el esquema)', 'Los datos de entrenamiento', 'Solo las consultas'], ok: 1, fb: 'La ABox tiene las afirmaciones sobre individuos: ana : Persona, cursa(ana, c1).', lvl: 1 },
    { q: 'OWL 2 DL se basa en una lógica descriptiva y es…', opts: ['Indecidible', 'Decidible, con razonamiento de coste alto en el peor caso', 'Solo proposicional', 'Una base de datos'], ok: 1, fb: 'Se eligió una expresividad (SROIQ) que conserva la decidibilidad; los perfiles EL, QL y RL bajan el coste.', lvl: 3 },
    { q: 'Un grafo de conocimiento como Wikidata guarda los datos principalmente como…', opts: ['Matrices de números reales', 'Tripletas sujeto–predicado–objeto', 'Imágenes', 'Árboles sintácticos'], ok: 1, fb: 'RDF representa cada hecho como una tripleta; SPARQL las consulta.', lvl: 1 },
    { q: 'Un razonador OWL RL aplica reglas de producción. Frente a un razonador de tableaux para ALC es…', opts: ['Más expresivo en todo', 'Menos expresivo (completo solo para un fragmento) pero más escalable', 'Idéntico', 'Solo para texto'], ok: 1, fb: 'OWL RL no maneja, por ejemplo, la negación arbitraria o disyunciones en la cabeza de una regla, pero se ejecuta con reglas simples sobre millones de tripletas.', lvl: 3 }
  ]);
})();
