/* Apéndice A — Centro de pruebas y panel de avance */
(function () {
  'use strict';
  const NL = window.NL, el = NL.el;
  const caps = () => NL.app.list.filter((c) => typeof c.num === 'number' && NL.bank.get(c.id).length);
  const partes = () => { const m = []; caps().forEach((c) => { if (!m.includes(c.part)) m.push(c.part); }); return m; };
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  /* Muestra repartida: toma por turnos una pregunta de cada capítulo hasta completar n */
  function reparto(listaCaps, n) {
    const pools = listaCaps.map((c) => shuffle(NL.bank.get(c.id)));
    const out = []; let k = 0;
    while (out.length < n && pools.some((p) => p.length)) { const p = pools[k % pools.length]; if (p.length) out.push(p.pop()); k++; }
    return shuffle(out);
  }

  NL.defineSim('centro-pruebas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    const box = sim.html('tc');
    const T = NL.track;
    const cs = caps(), ps = partes();
    sim.group('Prueba');
    sim.seg('modo', { label: 'Modo', options: [['cap', 'Capítulo'], ['parte', 'Parte'], ['examen', 'Examen del curso'], ['repaso', 'Repaso']], value: 'cap', onInput: () => sync() });
    const selCap = sim.select('cap', { label: 'Capítulo', options: cs.map((c) => [c.id, `${c.num}. ${c.title}`]), value: cs.length ? cs[0].id : '' });
    const selPar = sim.select('parte', { label: 'Parte', options: ps.map((p) => [p, p]), value: ps.length ? ps[0] : '' });
    const nSl = sim.slider('n', { label: 'Número de preguntas', min: 5, max: 60, step: 5, value: 20, fmt: (v) => String(v) });
    sim.button('Comenzar prueba', () => comenzar(), { primary: true });
    sim.note('Las preguntas se mezclan y sus opciones cambian de orden en cada intento.');
    const sync = () => { const m = sim.p.modo; selCap.show(m === 'cap'); selPar.show(m === 'parte'); nSl.show(m !== 'cap'); };
    sync();

    const info = el('div', 'tc-res');
    info.innerHTML = '<h4>Listo para empezar</h4><p>Elija un modo a la izquierda y pulse «Comenzar prueba».</p>';
    const zona = el('div');
    box.append(info, zona);

    function seleccionar() {
      const m = sim.p.modo, n = sim.p.n;
      if (m === 'cap') return { titulo: 'Capítulo ' + NL.app.byId[sim.p.cap].num, qs: shuffle(NL.bank.get(sim.p.cap)) };
      if (m === 'parte') return { titulo: sim.p.parte, qs: reparto(cs.filter((c) => c.part === sim.p.parte), n) };
      if (m === 'examen') return { titulo: 'Examen del curso', qs: reparto(cs, n) };
      const hoy = T.ymd(), ids = Object.keys(T.state.curso.banco);
      const falladas = ids.filter((q) => T.state.curso.banco[q].caja === 0);
      const toca = ids.filter((q) => T.state.curso.banco[q].caja > 0 && T.debe(q, hoy));
      const qs = shuffle(falladas).concat(shuffle(toca)).map((id) => NL.bank.byId(id)).filter(Boolean).slice(0, n);
      return { titulo: 'Repaso espaciado', qs };
    }
    function comenzar() {
      const sel = seleccionar();
      zona.innerHTML = '';
      if (!sel.qs.length) { info.innerHTML = '<h4>No hay preguntas para este modo</h4><p>' + (sim.p.modo === 'repaso' ? 'Aún no tiene errores ni preguntas que toquen repasar. Haga primero alguna prueba o autoevaluación.' : 'Ese capítulo todavía no tiene preguntas.') + '</p>'; return; }
      info.innerHTML = `<h4>${sel.titulo}</h4><p>${sel.qs.length} preguntas. Responda todas para ver el resultado por capítulo.</p>`;
      const q = el('div', 'quiz');
      zona.append(q);
      NL.quizRender(q, sel.qs, {
        shuffle: 'random', labels: true, againText: 'Nueva prueba', onDone: (res) => resumen(sel, res)
      });
      /* «Nueva prueba» vuelve a armar otra selección */
      q.querySelector('.ctrl-row .btn').onclick = comenzar;
      info.scrollIntoView({ block: 'nearest' });
    }
    function resumen(sel, res) {
      const por = {};
      res.list.forEach((it, i) => { const p = (por[it.cap] = por[it.cap] || { ok: 0, n: 0 }); p.n++; if (res.answered[i]) p.ok++; });
      T.addPrueba({ modo: sim.p.modo, titulo: sel.titulo, ok: res.ok, n: res.n });
      const filas = Object.keys(por).map((c) => ({ c, ...por[c], f: por[c].ok / por[c].n })).sort((a, b) => a.f - b.f);
      const pct = Math.round((100 * res.ok) / res.n);
      const flojos = filas.filter((x) => x.f < 0.7);
      info.innerHTML = `<h4>Resultado: ${res.ok} de ${res.n} (${pct} %)</h4><div class="tc-bars">` + filas.map((x) => {
        const ch = NL.app.byId[x.c], cls = x.f < 0.5 ? 'low' : x.f < 0.8 ? 'mid' : 'hi';
        return `<div class="tc-bar"><a href="#${x.c}">${ch.num}. ${ch.title}</a><i><s class="${cls}" style="width:${Math.round(100 * x.f)}%"></s></i><span>${x.ok}/${x.n}</span></div>`;
      }).join('') + '</div>' + (flojos.length ? `<p><b>Conviene repasar:</b> ${flojos.map((x) => `<a href="#${x.c}">capítulo ${NL.app.byId[x.c].num}</a>`).join(', ')}.</p>` : '<p>Buen resultado en todos los capítulos evaluados. Vuelva a esta prueba en unos días para consolidar.</p>');
      info.scrollIntoView({ block: 'nearest' });
    }
  });

  NL.defineSim('avance-pruebas', function (sim) {
    sim.stage.style.display = 'none';
    sim.body.classList.add('below');
    sim.side.hidden = true;
    const box = sim.html('tc');
    const T = NL.track;
    function pinta() {
      const b = T.state.curso.banco, ids = Object.keys(b), hoy = T.ymd();
      const cajas = [0, 1, 2, 3, 4].map((k) => ids.filter((q) => b[q].caja === k).length);
      const mx = Math.max(1, ...cajas);
      const p = NL.progreso();
      const hist = T.state.curso.pruebas.slice(-6).reverse();
      const sinVer = NL.bank.all().filter((q) => !b[q.id]).length;
      box.innerHTML = `
        <div class="tc-stats">
          <div><small>Capítulos estudiados</small><b>${p.leidos} de ${p.caps}</b></div>
          <div><small>Preguntas vistas</small><b>${ids.length} de ${NL.bank.all().length}</b></div>
          <div><small>Por repasar hoy</small><b>${ids.filter((q) => T.debe(q, hoy)).length}</b></div>
          <div><small>Sin intentar</small><b>${sinVer}</b></div>
        </div>
        <div><b style="font-size:13px">Preguntas por caja de repaso</b>
          <div class="tc-box" style="margin-top:22px">${cajas.map((n) => `<div style="height:${Math.max(3, (52 * n) / mx)}px"><span>${n}</span></div>`).join('')}</div>
          <div class="tc-lbl">${['0 · hoy', '1 · 1 día', '2 · 3 días', '3 · 7 días', '4 · 21 días'].map((s) => `<span>${s}</span>`).join('')}</div></div>
        <div><b style="font-size:13px">Últimas pruebas</b>${hist.length ? '<table class="sim-tab" style="margin-top:6px"><thead><tr><th>Fecha</th><th>Prueba</th><th>Resultado</th></tr></thead><tbody>' + hist.map((h) => `<tr><td>${h.fecha}</td><td>${h.titulo}</td><td>${h.ok} de ${h.n} (${Math.round(100 * h.ok / h.n)} %)</td></tr>`).join('') + '</tbody></table>' : '<p style="font-size:13px;color:var(--ink-3)">Todavía no ha hecho ninguna prueba del Centro.</p>'}</div>
        <div class="ctrl-row"><button class="btn" id="tcExp" type="button">Exportar mis datos</button><button class="btn" id="tcImp" type="button">Importar</button><button class="btn" id="tcDel" type="button">Borrar mi progreso</button><input id="tcFile" type="file" accept="application/json" hidden></div>
        <p class="ctrl-note" id="tcMsg">${T.status}</p>`;
      box.querySelector('#tcExp').onclick = async () => { const r = await T.descargar('maquinas-que-leen-progreso.json', T.exportJSON(), 'application/json'); box.querySelector('#tcMsg').textContent = r === 'ok' ? 'Copia exportada.' : r === 'no' ? 'Exportación cancelada.' : 'No se pudo exportar.'; };
      box.querySelector('#tcImp').onclick = () => box.querySelector('#tcFile').click();
      box.querySelector('#tcFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { try { T.importJSON(t); } catch (err) { box.querySelector('#tcMsg').textContent = err.message; } }); };
      let armado = false;
      box.querySelector('#tcDel').onclick = (e) => {
        if (!armado) { armado = true; e.target.textContent = 'Pulse otra vez para confirmar'; setTimeout(() => { armado = false; e.target.textContent = 'Borrar mi progreso'; }, 4000); return; }
        T.borrarTodo();
      };
    }
    pinta();
    T.on(pinta);
  });
})();
