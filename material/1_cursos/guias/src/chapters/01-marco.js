/* Capítulo 1 — El laboratorio en la norma educativa */
(function () {
  'use strict';
  const EM = window.EM;
  const el = EM.el;
  const PR = () => EM.PR.lista.slice().sort((a, b) => (a.cod < b.cod ? -1 : 1));

  /* Referentes disponibles en el filtro */
  function referentes() {
    const op = [];
    for (const k of Object.keys(EM.CUR.dba)) op.push(['dba:' + k, 'DBA ' + k.split('.')[0] + '.° n.° ' + k.split('.')[1]]);
    for (const k of Object.keys(EM.CUR.est)) if (/^[FTC]/.test(k)) op.push(['est:' + k, 'Estándar ' + k + ' · ' + EM.CUR.est[k].slice(0, 70) + (EM.CUR.est[k].length > 70 ? '…' : '')]);
    for (const t of EM.CUR.saber.fisico) op.push(['tema:' + t, 'Saber 11.° · ' + t]);
    return op;
  }
  const cumple = (p, ref) => {
    const [tipo, v] = ref.split(/:(.+)/);
    if (tipo === 'dba') return (p.dba || []).includes(v);
    if (tipo === 'est') return (p.est || []).includes(v);
    if (tipo === 'tema') return (p.temas || []).includes(v);
    return false;
  };

  EM.defineSim('brujula-curricular', function (sim) {
    sim.below();
    const box = el('div', 'brujula');
    sim.stage.append(box);
    sim.select('ref', { label: 'Referente', options: referentes(), value: 'dba:10.2' });
    sim.seg('grado', { label: 'Grado', options: [['todos', 'Todos'], [10, '10.°'], [11, '11.°']], value: 'todos' });
    sim.out('n', 'Prácticas que lo desarrollan', { hl: true });
    sim.out('t', 'Tiempo total');
    sim.onDraw(() => {
      const p = sim.p, ref = p.ref;
      const [tipo, v] = ref.split(/:(.+)/);
      const texto = tipo === 'dba' ? EM.CUR.dba[v].t : tipo === 'est' ? EM.CUR.est[v] : 'Tema del componente físico de la prueba Saber 11.°: ' + v + '.';
      const lista = PR().filter((q) => cumple(q, ref) && (p.grado === 'todos' || q.grado === +p.grado));
      box.innerHTML = `<p class="brujula-ref"><b>${tipo === 'dba' ? 'DBA ' + v : tipo === 'est' ? 'Estándar ' + v : 'Saber 11.°'}</b> ${texto}</p>` +
        (lista.length ? '<div class="tablewrap"><table class="datos-html"><tr><th class="c">Código</th><th>Práctica</th><th class="c">Grado</th><th class="c">Duración</th><th class="c">Costo por grupo</th></tr>' +
          lista.map((q) => `<tr><td class="c"><b>${q.cod}</b></td><td><a href="#${q.capitulo}">${q.titulo}</a></td><td class="c">${q.grado}.°</td><td class="c">${q.tiempo} min</td><td class="c">${EM.cop(EM.PR.costo(q))}</td></tr>`).join('') + '</table></div>'
          : '<p class="ctrl-note">Ninguna práctica del cuaderno trabaja directamente este referente con el filtro de grado elegido. El capítulo propone alternativas.</p>');
      sim.set('n', String(lista.length));
      sim.set('t', lista.reduce((s, q) => s + q.tiempo, 0) + ' min');
    });
  });

  EM.defineSim('plan-anual', function (sim) {
    sim.below();
    const box = el('div', 'plan');
    sim.stage.append(box);
    sim.group('Condiciones de la institución');
    sim.seg('grado', { label: 'Grado', options: [[10, '10.°'], [11, '11.°']], value: 10 });
    sim.slider('h', { label: 'Horas semanales de física', min: 1, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) + ' h' });
    sim.slider('f', { label: 'Fracción del tiempo en laboratorio', min: 0.15, max: 0.6, step: 0.05, value: 0.33, fmt: (v) => Math.round(v * 100) + ' %' });
    sim.slider('sem', { label: 'Semanas efectivas del año', min: 30, max: 40, step: 1, value: 36, fmt: (v) => v.toFixed(0) });
    sim.check('elab', { label: 'Incluir montajes elaborados', value: false });
    sim.note('Se descuentan por defecto cuatro semanas de evaluaciones, actividades institucionales y semana de desarrollo institucional. Una hora de clase se toma de 55 min.');
    sim.out('disp', 'Tiempo de laboratorio disponible', { hl: true });
    sim.out('usado', 'Tiempo asignado');
    sim.out('cob', 'DBA de física cubiertos');
    sim.onDraw(() => {
      const p = sim.p, g = +p.grado;
      const disp = Math.round(p.sem * p.h * 55 * p.f);
      const cand = PR().filter((q) => (q.tipo === 'simple' || p.elab) && (q.grado === g));
      const dbaG = Object.keys(EM.CUR.dba).filter((k) => EM.CUR.dba[k].grado === g);
      const elegidas = [];
      let usado = 0;
      /* 1) cubrir cada DBA con la práctica más corta que lo trabaje */
      for (const d of dbaG) {
        if (elegidas.some((q) => (q.dba || []).includes(d))) continue;
        const op = cand.filter((q) => (q.dba || []).includes(d) && !elegidas.includes(q)).sort((a, b) => a.tiempo - b.tiempo)[0];
        if (op && usado + op.tiempo <= disp) { elegidas.push(op); usado += op.tiempo; }
      }
      /* 2) completar en el orden del código hasta agotar el tiempo */
      for (const q of cand) { if (elegidas.includes(q)) continue; if (usado + q.tiempo <= disp) { elegidas.push(q); usado += q.tiempo; } }
      elegidas.sort((a, b) => (a.cod < b.cod ? -1 : 1));
      /* 3) repartir en cuatro periodos con tiempos parecidos */
      const per = [[], [], [], []], tp = [0, 0, 0, 0], meta = usado / 4;
      let k = 0;
      for (const q of elegidas) { if (tp[k] >= meta && k < 3) k++; per[k].push(q); tp[k] += q.tiempo; }
      box.innerHTML = '<div class="plan-grid">' + per.map((lst, i) => `<div class="plan-per"><h4>Periodo ${i + 1}<small>${tp[i]} min</small></h4>` + (lst.length ? '<ol>' + lst.map((q) => `<li><a href="#${q.capitulo}">${q.titulo}</a><small>${q.cod} · ${q.tiempo} min · DBA ${(q.dba || []).join(', ') || '—'}</small></li>`).join('') + '</ol>' : '<p class="ctrl-note">Sin prácticas</p>') + '</div>').join('') + '</div>';
      const cub = dbaG.filter((d) => elegidas.some((q) => (q.dba || []).includes(d)));
      sim.set('disp', disp + ' min ≈ ' + Math.floor(disp / 110) + ' sesiones de 2 h');
      sim.set('usado', usado + ' min en ' + elegidas.length + ' prácticas');
      sim.set('cob', cub.length + ' de ' + dbaG.length + (cub.length < dbaG.length ? ' · falta tiempo' : ' ✓'));
    });
  });
})();
