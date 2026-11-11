/* Apéndice D — Panel de validación */
(function () {
  'use strict';
  const NL = window.NL, L = NL.L;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  NL.defineSim('validacion-panel', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('pad');
    const caps = () => Array.from(new Set(L.CHECKS.map((c) => c.cap))).sort((a, b) => a - b);
    sim.group('Qué ejecutar');
    sim.select('c', { label: 'Capítulo', options: [['todos', 'Todos los capítulos']].concat(caps().map((c) => [String(c), 'Capítulo ' + c + ' (' + L.CHECKS.filter((x) => x.cap === c).length + ' pruebas)'])), value: 'todos' });
    sim.out('r', 'Resultado', { hl: true });
    let corriendo = false;
    const pinta = (res, hecho, total, ms) => {
      const mal = res.filter((r) => !r.r.ok);
      sim.set('r', `${res.length - mal.length} superadas de ${res.length}${hecho < total ? ' (en curso…)' : ''}`);
      box.innerHTML = `<p style="margin:0 0 6px">${hecho < total ? `Ejecutadas ${hecho} de ${total}…` : `Terminado en ${NL.fix(ms / 1000, 1)} s: <b>${res.length - mal.length} de ${res.length}</b> superadas.`}</p>` +
        (mal.length ? `<table class="mx"><thead><tr><th>Cap.</th><th style="text-align:left">Prueba fallida</th><th>Calculado</th><th>Referencia</th></tr></thead><tbody>${mal.slice(0, 30).map(({ c, r }) => `<tr><td>${c.cap}</td><td style="text-align:left;white-space:normal">${esc(c.what)}${r.msg ? '<br><small>' + esc(r.msg) + '</small>' : ''}</td><td>${NL.fix(r.v, 6)}</td><td>${NL.fix(r.ref, 6)}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--ink-3)">Ninguna fallida.</p>') +
        (hecho >= total ? `<small style="color:var(--ink-3)">Resumen por capítulo: ${caps().filter((k) => res.some((x) => x.c.cap === k)).map((k) => `${k}: ${res.filter((x) => x.c.cap === k && x.r.ok).length}/${res.filter((x) => x.c.cap === k).length}`).join(' · ')}</small>` : '');
    };
    const ejecutar = () => {
      if (corriendo) return; corriendo = true;
      const lista = L.CHECKS.filter((c) => sim.p.c === 'todos' || String(c.cap) === sim.p.c), res = [], t0 = performance.now();
      let i = 0;
      const lote = () => {
        const fin = Math.min(lista.length, i + 12);
        for (; i < fin; i++) res.push({ c: lista[i], r: L.runCheck(lista[i]) });
        pinta(res, i, lista.length, performance.now() - t0);
        if (i < lista.length) setTimeout(lote, 0); else corriendo = false;
      };
      lote();
    };
    sim.button('Ejecutar', ejecutar, { primary: true });
    sim.onDraw(() => { if (!box.innerHTML) box.innerHTML = '<p style="color:var(--ink-3)">Pulse «Ejecutar».</p>'; });
  });
  NL.bank.add('validacion', [
    { q: 'Validar un algoritmo contra una implementación independiente sirve para…', opts: ['Detectar errores de programación comparando resultados de dos fuentes distintas', 'Mejorar la calidad lingüística', 'Acelerar el programa', 'Evitar escribir pruebas'], ok: 0, fb: 'Si coinciden, es muy improbable que ambos tengan el mismo error.', lvl: 1 },
    { q: 'Una prueba con tolerancia 10⁻¹² compara dos números…', opts: ['Aceptando diferencias por redondeo de coma flotante', 'Exigiendo igualdad exacta de bits', 'Ignorando la diferencia', 'Solo enteros'], ok: 0, fb: 'Las sumas en distinto orden producen diferencias del orden del último dígito.', lvl: 2 },
    { q: 'Que todas las pruebas se superen significa que…', opts: ['El código calcula lo mismo que las referencias en esos casos; no garantiza que el resultado sea útil lingüísticamente', 'El curso es perfecto', 'El modelo es el mejor posible', 'No hay errores posibles'], ok: 0, fb: 'La validación comprueba el cálculo, no la utilidad.', lvl: 2 }
  ]);
})();
