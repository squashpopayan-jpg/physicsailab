/* Capítulo 20 — Análisis semántico dirigido por la sintaxis */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L, S = L.sem, F = L.fol;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const COLS = { S: '--c1', SN: '--c2', SV: '--c3' };

  /* ---- 1. β-reducción paso a paso ---- */
  const EXPR = [
    ['(\\x.duerme(x))(juan)', 'Aplicar «duerme» a «juan»'],
    ['(\\P.\\Q.exists x.(P(x) & Q(x)))(\\y.libro(y))', '«un» aplicado a «libro»'],
    ['(\\P.\\Q.exists x.(P(x) & Q(x)))(\\y.libro(y))(\\z.lee(marta,z))', '«un libro» aplicado a «lee marta»'],
    ['(\\X.\\x.X(\\y.lee(x,y)))(\\P.P(libro))(marta)', 'Verbo transitivo con objeto y sujeto'],
    ['(\\x.\\y.quiere(x,y))(y)', 'Captura de variable: la y libre no debe quedar ligada']
  ];
  NL.defineSim('lambda-reducir', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    sim.group('Expresión');
    sim.select('e', { label: 'Expresión de la lista', options: EXPR.map(([, d], i) => [String(i), d]), value: '2' });
    sim.text('o', { label: 'O escriba otra (λ se escribe \\, por ejemplo \\x.f(x))', value: '' });
    sim.out('n', 'β-reducciones', { hl: true });
    sim.onDraw(() => {
      try {
        const raw = (sim.p.o || '').trim() || EXPR[+sim.p.e][0];
        const e = S.parsear(raw), traza = [S.texto(e)], r = S.reducir(e, traza);
        sim.set('n', String(S.pasos));
        box.innerHTML = `<ol style="margin:0;padding-left:1.4em">${traza.map((t, i) => `<li class="${i === traza.length - 1 ? 'hl' : ''}" style="margin:3px 0"><span class="mono" style="font-size:12.5px">${esc(t)}</span></li>`).join('')}</ol><p style="margin:8px 0 0">Forma normal: <span class="mono">${esc(S.canonica(r))}</span></p>`;
      } catch (err) { sim.set('n', 'error'); box.innerHTML = `<p style="color:var(--bad,#b3261e)">${esc(err.message)}</p>`; }
    });
  });

  /* ---- 2. Composición sobre el árbol ---- */
  const FRASES = ['juan duerme', 'marta lee un libro', 'todo estudiante lee un libro', 'un profesor ve todo gato', 'ningún estudiante duerme'];
  const EVENTOS = {
    lee: '\\Y.\\x.Y(\\y.exists z.(lectura(z) & lector(z,x) & leido(z,y)))', ve: '\\Y.\\x.Y(\\y.exists z.(vision(z) & observador(z,x) & visto(z,y)))',
    duerme: '\\x.exists z.(sueno(z) & durmiente(z,x))'
  };
  const hojas = (n) => (typeof n[1] === 'string' ? [n[1]] : n.slice(1).flatMap(hojas));
  const nodos = (n, out = []) => { if (typeof n[1] !== 'string') n.slice(1).forEach((k) => nodos(k, out)); out.push(n); return out; };
  NL.defineSim('sdd-arbol', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Árbol sintáctico' });
    const box = sim.html('pad');
    sim.group('Oración');
    sim.select('f', { label: 'Oración', options: FRASES.map((f) => [f, f]), value: FRASES[2] });
    sim.seg('l', { label: 'Ámbito (si hay dos cuantificadores)', options: [['sujeto', 'El sujeto abarca'], ['objeto', 'El objeto abarca']], value: 'sujeto' });
    sim.seg('v', { label: 'Significado del verbo', options: [['simple', 'Predicado simple'], ['evento', 'Con evento']], value: 'simple' });
    sim.out('f', 'Fórmula resultante', { hl: true });
    sim.onDraw(() => {
      const guarda = Object.assign({}, S.LEX);
      try {
        if (sim.p.v === 'evento') Object.assign(S.LEX, EVENTOS);
        const r = S.analizar(sim.p.f, sim.p.l);
        NL.drawTree(cv, r.arbol, { color: (s) => COLS[s] || '--ink-2' });
        sim.set('f', S.canonica(S.reducir(S.parsear(r.lambda))));
        const filas = nodos(r.arbol).map((n) => {
          const lam = S.componer(n, sim.p.l);
          return `<tr><td style="text-align:left"><b>${n[0]}</b></td><td style="text-align:left;white-space:normal">${esc(hojas(n).join(' '))}</td><td style="text-align:left;white-space:normal"><span class="mono" style="font-size:11.5px">${esc(S.canonica(S.reducir(S.parsear(lam))))}</span></td></tr>`;
        });
        let mundos = '';
        if (sim.p.v === 'simple') {
          const f = F.parsear(S.canonica(S.reducir(S.parsear(r.lambda))));
          mundos = `<p style="margin:8px 0 0">Valor de verdad en los mundos del capítulo 18: ` + NL.mundos.ids.map((k) => `<b>${k}</b> ${F.evaluar(NL.mundos.modelo(k), f) ? 'verdadera' : 'falsa'}`).join(' · ') + '</p>';
        }
        box.innerHTML = `<small style="color:var(--ink-3)">Significado de cada nodo, de las hojas a la raíz (cada fila aplica el significado de un hijo al del otro)</small><table class="mx"><thead><tr><th style="text-align:left">Nodo</th><th style="text-align:left">Palabras</th><th style="text-align:left">Significado (forma normal)</th></tr></thead><tbody>${filas.join('')}</tbody></table>${mundos}`;
      } catch (e) { sim.set('f', 'error'); box.innerHTML = `<p style="color:var(--bad,#b3261e)">${esc(e.message)}</p>`; } finally { for (const k of Object.keys(S.LEX)) delete S.LEX[k]; Object.assign(S.LEX, guarda); }
    });
  });

  NL.bank.add('semantica-composicional', [
    { q: 'El principio de composición afirma que el significado de una oración depende de…', opts: ['Solo las palabras, sin orden', 'Los significados de sus partes y de cómo se combinan según la estructura sintáctica', 'El tamaño del diccionario', 'El autor'], ok: 1, fb: 'Frege: el todo se calcula a partir de las partes y de la manera de combinarlas.', lvl: 1 },
    { q: 'La hipótesis «regla a regla» (rule-to-rule) dice que…', opts: ['Cada regla sintáctica lleva asociada una regla de composición semántica', 'Las reglas se aplican una a una por turno', 'Solo hay una regla', 'La semántica se calcula después del texto'], ok: 0, fb: 'Bach (1976): a cada regla de la gramática le corresponde una función que combina los significados de los constituyentes.', lvl: 2 },
    { q: 'La expresión λx.duerme(x), aplicada a «juan», da por β-reducción…', opts: ['duerme(x)', 'duerme(juan)', 'λjuan.duerme', 'juan'], ok: 1, fb: 'Se sustituye la variable ligada x por el argumento.', lvl: 1 },
    { q: 'El significado de un nombre propio como «Marta» en la gramática del curso es λP.P(marta) porque…', opts: ['Así puede combinarse con un verbo igual que un sintagma cuantificado como «todo estudiante»', 'Marta es una variable', 'Es un cuantificador', 'Solo sirve para el inglés'], ok: 0, fb: 'Subir el tipo del nombre propio da a todos los sintagmas nominales el mismo tipo (función de predicados) y la misma regla de composición.', lvl: 3 },
    { q: 'Para evitar la captura de variables en una β-reducción se…', opts: ['Borra la variable', 'Renombra la variable ligada cuando coincide con una libre del argumento', 'Se ignora', 'Se cambia el verbo'], ok: 1, fb: 'Es la sustitución sin captura (α-conversión).', lvl: 3 },
    { q: 'Si el analizador sintáctico devuelve un solo árbol, ¿cuántas lecturas puede tener «todo estudiante lee un libro»?', opts: ['Una', 'Dos, por el ámbito de los cuantificadores', 'Tres', 'Ninguna'], ok: 1, fb: 'La ambigüedad de ámbito no es sintáctica: aparece al componer los significados. Se resuelve con almacenamiento de Cooper o con representaciones infraespecificadas.', lvl: 2 },
    { q: 'La principal ventaja de integrar el análisis semántico con el sintáctico es…', opts: ['Que es siempre más rápido', 'Descartar pronto árboles cuya semántica carece de sentido', 'Que no hace falta gramática', 'Que usa menos memoria'], ok: 1, fb: 'Su inconveniente: puede calcular semántica de constituyentes que no acaban en un árbol válido.', lvl: 2 },
    { q: 'En una representación con eventos, «Matías abrió un restaurante» se escribe con…', opts: ['Un predicado de dos argumentos fijo', 'Una variable de evento y relaciones de papel (agente, tema) con él', 'Una tabla de verdad', 'Solo constantes'], ok: 1, fb: '∃e∃x (Abrir(e) ∧ Restaurante(x) ∧ Agente(e, matías) ∧ Tema(e, x)).', lvl: 2 },
    { q: '¿Cuántas β-reducciones hay entre (λx.λy.f(x,y))(a)(b) y f(a,b)?', num: 2, tol: 0, fb: 'Una por cada aplicación: primero x := a y luego y := b.', lvl: 1 },
    { q: 'El conocimiento léxico necesario para que el analizador semántico dé la representación de un verbo se guarda en…', opts: ['El lexicón con las entradas anotadas semánticamente', 'El árbol', 'El corpus de entrenamiento', 'La tabla de verdad'], ok: 0, fb: 'Cada palabra lleva su λ-expresión; las reglas solo la combinan.', lvl: 2 }
  ]);
})();
