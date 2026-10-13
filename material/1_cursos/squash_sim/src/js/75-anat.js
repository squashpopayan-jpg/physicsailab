/* Página de anatomía: mapa interactivo, fichas por músculo, filtro por fase y articulaciones. */
MS.Anat = (function () {
  const { U, Muscles } = MS;
  let map = null, cur = 'cuadriceps', phase = null;
  const PH = [[null, 'Sin color'], ['split', 'Split-step'], ['salida', 'Salida'], ['carrera', 'Desplazamiento'], ['estocada', 'Estocada'], ['golpeFH', 'Golpe drive'], ['golpeBH', 'Golpe revés'], ['empuje', 'Empuje'], ['recuperacion', 'Regreso']];
  const PH_ACT = { split: 'split', salida: 'salida', carrera: 'carrera', estocada: 'estocada', golpeFH: 'golpe', golpeBH: 'golpe', empuje: 'empuje', recuperacion: 'recuperacion' };
  const REG = { 'Tren inferior': ['gastro', 'soleo', 'aquiles', 'tibial', 'peroneos', 'cuadriceps', 'isquios', 'gluteoMax', 'gluteoMed', 'aductores', 'psoas'], 'Core y tronco': ['abdomen', 'oblicuos', 'coreProf', 'lumbares', 'dorsal'], 'Tren superior': ['pectoral', 'deltoides', 'manguito', 'trapecio', 'serrato', 'biceps', 'triceps', 'extensores', 'flexores'], 'Cabeza': ['oculares'] };

  function phasesOf(id) {
    const out = [];
    for (const k in Muscles.ACT) { const v = Muscles.ACT[k][id]; if (v && v[0] >= 0.5) out.push([k, v]); }
    return out.sort((a, b) => b[1][0] - a[1][0]);
  }
  function card(id) {
    const g = Muscles.byId[id]; if (!g) return;
    cur = id;
    const box = U.$('#mCard'); box.innerHTML = '';
    box.append(U.h('p', { class: 'eyebrow' }, g.region + (g.profundo ? ' · profundo' : '') + (g.tipo === 'tendón' ? ' · tendón' : '')));
    box.append(U.h('h3', null, g.nombre));
    const phs = phasesOf(id);
    const pchips = U.h('div', { class: 'chips', style: { marginTop: '8px' } }, phs.map(([k, v]) => U.h('span', { class: 'tag', title: Muscles.TIPO[v[1]] }, (Muscles.PHASE_NAMES[PH_ACT[k]] || k).replace('Golpe', k === 'golpeBH' ? 'Golpe de revés' : k === 'golpeFH' ? 'Golpe de drive' : 'Golpe') + ' · ' + Math.round(v[0] * 100) + '% · ' + Muscles.TIPO[v[1]])));
    const dl = U.h('dl', null,
      U.h('dt', null, 'Origen'), U.h('dd', null, g.origen),
      U.h('dt', null, 'Inserción'), U.h('dd', null, g.insercion),
      U.h('dt', null, 'Acción'), U.h('dd', null, g.accion),
      U.h('dt', null, 'En el squash'), U.h('dd', null, g.squash),
      U.h('dt', null, 'Fibras'), U.h('dd', null, g.fibras),
      U.h('dt', null, 'Lesión típica'), U.h('dd', null, g.lesion),
      U.h('dt', null, 'Fortalecer'), U.h('dd', null, g.fortalecer),
      U.h('dt', null, 'Estirar'), U.h('dd', null, g.estirar));
    box.append(phs.length ? U.h('div', null, U.h('p', { class: 'small muted', style: { marginTop: '6px' } }, 'Fases en las que trabaja con más intensidad:'), pchips) : '', dl);
    const btn = U.h('button', { class: 'btn', style: { marginTop: '14px' } }, 'Verlo trabajar en el simulador');
    btn.addEventListener('click', () => {
      const best = phs[0] ? phs[0][0] : 'estocada';
      const rid = best === 'golpeBH' ? 'cruzadasFondo' : best === 'golpeFH' ? 'drivesParalelos' : best === 'split' || best === 'salida' ? 'ghostAzar' : best === 'carrera' ? 'ghostDiag' : 'boastDrive';
      MS.App.go('simulador'); MS.Sim.open(MS.Routines.byId[rid], { key: 'lib:' + rid, musculos: true });
    });
    box.append(btn);
    if (map) map.select(id);
    for (const c of U.$$('#anGroups .chip')) c.setAttribute('aria-pressed', String(c.dataset.m === id));
  }
  function paint() {
    if (!map) return;
    if (!phase) { map.clear(); U.$('#anLegend').style.visibility = 'hidden'; return; }
    U.$('#anLegend').style.visibility = 'visible';
    const tbl = Muscles.ACT[phase];
    const act = {}; for (const k in tbl) act[k] = { v: tbl[k][0], tipo: tbl[k][1] };
    map.activation(act);
  }
  function init() {
    map = MS.Body.create(U.$('#anBody'), { interactive: true, onSelect: (id) => card(id) });
    const pb = U.$('#anPhase');
    for (const [k, t] of PH) {
      const b = U.h('button', { class: 'chip', 'aria-pressed': String(k === phase), text: t });
      b.addEventListener('click', () => { phase = k; for (const c of U.$$('#anPhase .chip')) c.setAttribute('aria-pressed', String(c === b)); paint(); });
      pb.append(b);
    }
    const gbox = U.$('#anGroups');
    for (const reg in REG) {
      const row = U.h('div', { class: 'mlist' }, REG[reg].map((id) => { const c = U.h('button', { class: 'chip', 'data-m': id, text: Muscles.byId[id].nombre }); c.addEventListener('click', () => { card(id); U.$('#mCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); return c; }));
      gbox.append(U.h('div', { class: 'card' }, U.h('h4', { style: { marginBottom: '8px' } }, reg), row));
    }
    const jb = U.$('#anJoints');
    for (const j of Muscles.JOINTS) jb.append(U.h('div', { class: 'card' }, U.h('h4', null, j.nombre), U.h('p', { class: 'small', style: { marginTop: '6px' } }, j.datos), U.h('p', { class: 'small muted', style: { marginTop: '6px' } }, j.squash)));
    paint(); card(cur);
  }
  MS.App.on('anatomia', { init, theme: () => paint() });
  return { select: (id) => card(id) };
})();
