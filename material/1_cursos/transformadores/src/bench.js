/* Banco virtual: equipo dibujado en SVG, cableado libre, instrumentos con exactitud, fusibles y calentamiento. */
(function (root) {
  'use strict';
  const E = root.TLEngine, K = E.KIT;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const DMM_X = [20, 245, 470], DMM_Y = 410;
  const SEL_POS = [['OFF', -120], ['V⎓', -82], ['V~', -44], ['Ω', -6], ['mA⎓', 32], ['mA~', 70], ['A⎓', 108], ['A~', 146]];
  const WIRE_COLORS = { rojo: '#c8312b', negro: '#25282c', azul: '#2d64c8', amarillo: '#d9a815', verde: '#2f8f4e' };
  const STAGES = { A: 'A · Relación de transformación', B: 'B · Ensayo de vacío', C: 'C · Ensayo de cortocircuito', D: 'D · Ensayo con carga', E: 'E · Polaridad', R: 'R · Resistencia de devanados', L: 'Libre' };

  /* ---------- Bornes ---------- */
  const TERMS = {};
  const term = (id, x, y, label, ring) => { TERMS[id] = { id, x, y, label, ring }; };
  term('src.l', 70, 318, 'Fuente · salida ~1', '#b8322c'); term('src.n', 150, 318, 'Fuente · salida ~2', '#202326'); term('src.pe', 250, 318, 'Fuente · tierra de protección', '#3f9a3f');
  term('tl.1', 445, 256, 'Bobina izquierda · borne 1 (•)', '#202326'); term('tl.2', 495, 256, 'Bobina izquierda · borne 2', '#202326');
  term('tr.1', 725, 256, 'Bobina derecha · borne 1 (•)', '#202326'); term('tr.2', 775, 256, 'Bobina derecha · borne 2', '#202326');
  term('ld.a', 950, 330, 'Carga resistiva · borne A', '#202326'); term('ld.b', 1080, 330, 'Carga resistiva · borne B', '#202326');
  term('sh.a', 1210, 152, 'Shunt 1 Ω · borne A', '#202326'); term('sh.b', 1330, 152, 'Shunt 1 Ω · borne B', '#202326');
  DMM_X.forEach((x, i) => {
    const n = i + 1;
    term(`d${n}.a`, x + 36, DMM_Y + 372, `DMM ${n} · borne 10 A`, '#b8322c'); term(`d${n}.ma`, x + 82, DMM_Y + 372, `DMM ${n} · borne mA`, '#b8322c');
    term(`d${n}.com`, x + 128, DMM_Y + 372, `DMM ${n} · borne COM`, '#202326'); term(`d${n}.v`, x + 174, DMM_Y + 372, `DMM ${n} · borne VΩ`, '#b8322c');
  });
  term('wm.i1', 735, 655, 'Analizador · corriente I± (entrada)', '#b8322c'); term('wm.i2', 790, 655, 'Analizador · corriente I (salida)', '#202326');
  term('wm.v1', 860, 655, 'Analizador · tensión U±', '#d9a815'); term('wm.v2', 915, 655, 'Analizador · tensión U', '#202326');
  term('sc.1', 1010, 795, 'Osciloscopio · punta CH1', '#d9b52a'); term('sc.g1', 1060, 795, 'Osciloscopio · pinza de tierra CH1', '#202326');
  term('sc.2', 1150, 795, 'Osciloscopio · punta CH2', '#3bb8e0'); term('sc.g2', 1200, 795, 'Osciloscopio · pinza de tierra CH2', '#202326');

  /* ---------- Estado ---------- */
  const newDmm = () => ({ sel: 'OFF', hold: false, fuseMa: true, fuseA: true, role: 'auto' });
  function defaultState() {
    return { version: 2, bench: 1, stage: 'B', supply: { on: false, knob: 0, fuseOk: true }, tx: { L: 'c500', R: 'c250', yoke: 'apretado' },
      load: { idx: 2, on: true }, dmm: [newDmm(), newDmm(), newDmm()], wmRole: 'auto',
      scope: { ch: [{ on: true, vdiv: 5, probe: 1, cpl: 'DC', pos: 0 }, { on: true, vdiv: 2, probe: 1, cpl: 'DC', pos: 0 }], tdiv: 0.005, trig: 0 },
      wires: [], nextWire: 1, damage: { coils: {}, load: {}, shunt: false }, repairs: 0 };
  }
  let st = defaultState(), variant = E.benchVariant(1), opts = {};
  const sim = { temp: {}, fuseHeat: { supply: 0, ma: [0, 0, 0], a: [0, 0, 0] }, mains: 0, start: Date.now(), log: [], lastLog: {}, res: null, cc: null, dc: null, meas: null,
    disp: [null, null, null], held: [null, null, null], needle: 0, pending: null, selWire: null, color: 'rojo', rnd: Math.random, ohmWarn: [0, 0, 0], tick: 0 };
  const T = (key) => (sim.temp[key] ?? K.Tamb);

  function log(type, msg, key) {
    const now = Date.now(), k = key || msg;
    if (sim.lastLog[k] && now - sim.lastLog[k] < 15000) return;
    sim.lastLog[k] = now;
    const s = Math.floor((now - sim.start) / 1000);
    sim.log.push({ t: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, type, msg });
    if (sim.log.length > 300) sim.log.shift();
    renderLog();
    if (type === 'seguridad' || type === 'daño') opts.toast && opts.toast(msg);
  }

  /* ---------- Construcción del circuito ---------- */
  function coilOn(side) { const id = st.tx[side]; if (!id || st.damage.coils[id]) return null; return E.coilSpec(id, variant); }
  function build(over) {
    const s = over || st;
    const parent = {};
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    for (const id of Object.keys(TERMS)) parent[id] = id; parent.earth = 'earth';
    union('src.pe', 'earth');
    for (const w of s.wires) union(w.a, w.b);
    const netIdx = { [find('earth')]: 0 }; let n = 1;
    for (const id of Object.keys(TERMS)) { const r = find(id); if (!(r in netIdx)) netIdx[r] = n++; }
    const net = (id) => netIdx[find(id)];
    const c = { nNets: n, f: K.f, elems: [], windings: [], core: null }, map = { dv: [], dma: [], da: [], ohm: [], wind: [] };
    const push = (e, key) => { map[key] = c.elems.length; c.elems.push(e); return c.elems.length - 1; };
    const emf = (s.supply.on ? s.supply.knob * K.supply.vmax * (1 + variant.dialErr) * (1 + sim.mains) : 0);
    if (s.supply.fuseOk) push({ k: 'V', a: net('src.l'), b: net('src.n'), E: [emf, 0], r: s.supply.on ? K.supply.r : K.supply.rOff, l: s.supply.on ? K.supply.l : 0, harm: K.supply.harm }, 'supply');
    ['L', 'R'].forEach(side => {
      const cs = coilOn(side); if (!cs) return;
      const tp = side === 'L' ? 'tl' : 'tr', Rt = cs.R * (1 + K.alphaCu * (T('coil:' + cs.id) - 20));
      map.wind.push({ side, coil: cs, k: c.windings.length });
      c.windings.push({ a: net(tp + '.1'), b: net(tp + '.2'), N: cs.N, R: Rt, Ls: 0, side });
    });
    if (c.windings.length) {
      c.core = E.coreParams(s.tx.yoke, variant);
      c.windings.forEach(w => { w.Ls = w.N * w.N * c.core.leak; });
    }
    if (s.load.on && !s.damage.load[s.load.idx]) {
      const R0 = K.loads[s.load.idx] * (1 + variant.loadErr[s.load.idx]);
      push({ k: 'R', a: net('ld.a'), b: net('ld.b'), R: R0 * (1 + K.loadTc * (T('load:' + s.load.idx) - 20)) }, 'load');
    }
    if (!s.damage.shunt) push({ k: 'R', a: net('sh.a'), b: net('sh.b'), R: K.shunt.R * (1 + variant.shuntErr) }, 'shunt');
    s.dmm.forEach((d, i) => {
      const p = `d${i + 1}.`;
      if (d.sel === 'Ω') { map.ohm[i] = c.elems.length; c.elems.push({ k: 'I', a: net(p + 'v'), b: net(p + 'com'), I: K.dmm.itest }); }
      else { map.dv[i] = c.elems.length; c.elems.push({ k: 'R', a: net(p + 'v'), b: net(p + 'com'), R: K.dmm.zin }); }
      if (d.fuseMa) { map.dma[i] = c.elems.length; c.elems.push({ k: 'R', a: net(p + 'ma'), b: net(p + 'com'), R: K.dmm.rMa }); }
      if (d.fuseA) { map.da[i] = c.elems.length; c.elems.push({ k: 'R', a: net(p + 'a'), b: net(p + 'com'), R: K.dmm.rA }); }
    });
    push({ k: 'R', a: net('wm.i1'), b: net('wm.i2'), R: K.wm.ri }, 'wmi');
    push({ k: 'R', a: net('wm.v1'), b: net('wm.v2'), R: K.wm.zv }, 'wmv');
    s.scope.ch.forEach((ch, i) => {
      push({ k: 'R', a: net('sc.' + (i + 1)), b: 0, R: K.scope.zin * ch.probe }, 'sc' + (i + 1));
      push({ k: 'R', a: net('sc.g' + (i + 1)), b: 0, R: K.scope.gnd }, 'scg' + (i + 1));
    });
    /* grupos galvánicos (caminos de baja impedancia) */
    const gp = {}; const gf = (a) => { while (gp[a] !== a) { gp[a] = gp[gp[a]]; a = gp[a]; } return a; };
    for (let i = 0; i < n; i++) gp[i] = i;
    const gu = (a, b) => { a = gf(a); b = gf(b); if (a !== b) gp[a] = b; };
    for (const e of c.elems) if (e.k === 'V' || (e.k === 'R' && e.R < 1e5)) gu(e.a, e.b);
    for (const w of c.windings) gu(w.a, w.b);
    /* nodos eléctricamente iguales: unidos por cables o por elementos de menos de 2 Ω (amperímetros, shunts) */
    const sp = {}; const sf = (a) => { while (sp[a] !== a) { sp[a] = sp[sp[a]]; a = sp[a]; } return a; };
    for (let i = 0; i < n; i++) sp[i] = i;
    for (const e of c.elems) if (e.k === 'R' && e.R < 2) { const a = sf(e.a), b = sf(e.b); if (a !== b) sp[a] = b; }
    const wired = new Set(); for (const w of s.wires) { wired.add(w.a); wired.add(w.b); }
    return { c, map, net, group: (k) => gf(k), same: (k) => sf(k), wired };
  }

  /* ---------- Simulación y lectura de instrumentos ---------- */
  function solveAll(over) {
    const cc = build(over), res = E.solve(cc.c);
    const needDC = (over || st).dmm.some(d => d.sel === 'Ω' || d.sel.endsWith('⎓'));
    const dc = needDC ? E.solveDC(cc.c) : null;
    return { cc, res, dc };
  }
  function trueValues(S, s) {
    const { cc, res, dc } = S, c = cc.c, m = cc.map, f = c.f, out = { dmm: [], wm: null, sc: [], supplyI: 0, supplyV: 0, wind: [] };
    if (m.supply !== undefined) { const e = c.elems[m.supply]; out.supplyI = E.irmsV(res, e, f); out.supplyV = E.vrms(res, e.a, e.b); }
    m.wind.forEach(w => {
      const wd = c.windings[w.k], phV = E.HS.map(h => E.vph(res, wd.a, wd.b, h)), phI = E.HS.map(h => E.iW(res, w.k, h));
      out.wind.push({ side: w.side, coil: w.coil, k: w.k, a: wd.a, b: wd.b, V: E.rmsOf(phV), I: E.rmsOf(phI), P: E.power(phV, phI), phV, phI, R: wd.R });
    });
    s.dmm.forEach((d, i) => {
      const r = { sel: d.sel, value: 0, acV: 0, phV: null, phI: null };
      const ev = m.dv[i] !== undefined ? c.elems[m.dv[i]] : (m.ohm[i] !== undefined ? c.elems[m.ohm[i]] : null);
      if (ev) { r.phV = E.HS.map(h => E.vph(res, ev.a, ev.b, h)); r.acV = E.rmsOf(r.phV); r.nets = [ev.a, ev.b]; }
      const ema = m.dma[i] !== undefined ? c.elems[m.dma[i]] : null, ea = m.da[i] !== undefined ? c.elems[m.da[i]] : null;
      r.ima = ema ? E.irmsR(res, ema) : 0; r.ia = ea ? E.irmsR(res, ea) : 0;
      if (ema) r.phIma = E.HS.map(h => E.iR(res, ema, h)); if (ea) r.phIa = E.HS.map(h => E.iR(res, ea, h));
      if (d.sel === 'V~') r.value = r.acV;
      else if (d.sel === 'mA~') { r.value = r.ima; r.phI = r.phIma; }
      else if (d.sel === 'A~') { r.value = r.ia; r.phI = r.phIa; }
      else if (d.sel === 'V⎓') r.value = dc && ev ? dc.V[ev.a][0] - dc.V[ev.b][0] : 0;
      else if (d.sel === 'mA⎓') r.value = dc && ema ? (dc.V[ema.a][0] - dc.V[ema.b][0]) / ema.R : 0;
      else if (d.sel === 'A⎓') r.value = dc && ea ? (dc.V[ea.a][0] - dc.V[ea.b][0]) / ea.R : 0;
      else if (d.sel === 'Ω') r.value = dc && ev ? (dc.V[ev.a][0] - dc.V[ev.b][0]) / K.dmm.itest + K.dmm.lead : 0;
      out.dmm.push(r);
    });
    { const ei = c.elems[m.wmi], ev = c.elems[m.wmv];
      const phV = E.HS.map(h => E.vph(res, ev.a, ev.b, h)), phI = E.HS.map(h => E.iR(res, ei, h));
      const V = E.rmsOf(phV), I = E.rmsOf(phI), P = E.power(phV, phI);
      out.wm = { V, I, P, S: V * I, pf: V * I > 1e-6 ? P / (V * I) : null, phV, phI }; }
    [1, 2].forEach(i => {
      const tip = cc.net('sc.' + i), gnd = cc.net('sc.g' + i);
      const ph = E.HS.map(h => E.vph(res, tip, 0, h));
      const floating = cc.group(tip) !== cc.group(0);
      const tipWired = cc.wired.has('sc.' + i), gndWired = cc.wired.has('sc.g' + i);
      out.sc.push({ ph, floating, tipWired, gndWired, ig: E.irmsR(res, c.elems[m['scg' + i]]) });
    });
    if (m.load !== undefined) { const e = c.elems[m.load]; out.loadI = E.irmsR(res, e); out.loadP = out.loadI ** 2 * e.R; out.loadV = E.vrms(res, e.a, e.b); }
    if (m.shunt !== undefined) { const e = c.elems[m.shunt]; out.shuntP = E.irmsR(res, e) ** 2 * e.R; }
    out.B = res.B; out.sat = res.sat; out.Pfe = res.Pfe;
    return out;
  }

  /* ---------- Paso de tiempo: deriva de la red, fusibles, temperaturas, avisos ---------- */
  function step(dt) {
    sim.mains += -sim.mains * dt / 20 + 0.0012 * Math.sqrt(dt) * E.gauss01(sim.rnd);
    const S = solveAll(); sim.res = S.res; sim.cc = S.cc; sim.dc = S.dc;
    const tv = trueValues(S, st); sim.meas = tv;
    const fuse = (key, I, In, tau, onBlow) => {
      const h = sim.fuseHeat[key[0]], idx = key[1];
      const r = I / In; let v = idx === undefined ? h : h[idx];
      if (r > 10) v = 1; else if (r > 1) v += dt * (r * r - 1) / tau; else v = Math.max(0, v - dt * 0.1);
      if (idx === undefined) sim.fuseHeat[key[0]] = v; else h[idx] = v;
      if (v >= 1) { onBlow(); if (idx === undefined) sim.fuseHeat[key[0]] = 0; else h[idx] = 0; return true; }
      return false;
    };
    let changed = false;
    if (st.supply.fuseOk && fuse(['supply'], tv.supplyI, K.supply.fuseA, K.supply.tau, () => {
      st.supply.fuseOk = false; changed = true;
      log('daño', `Se fundió el fusible de la fuente (${tv.supplyI.toFixed(2)} A > 3,15 A). ${diagnoseShort(tv)}`, 'fusefuente');
    })) { /* fundido */ }
    st.dmm.forEach((d, i) => {
      if (d.fuseMa && fuse(['ma', i], tv.dmm[i].ima, K.dmm.fuseMa, K.dmm.tauMa, () => { d.fuseMa = false; changed = true; log('daño', `Se fundió el fusible del borne mA del DMM ${i + 1} (${tv.dmm[i].ima.toFixed(2)} A). Desde ahora ese borne no mide.`, 'fma' + i); })) { /* */ }
      if (d.fuseA && fuse(['a', i], tv.dmm[i].ia, K.dmm.fuseA, K.dmm.tauA, () => { d.fuseA = false; changed = true; log('daño', `Se fundió el fusible del borne 10 A del DMM ${i + 1}.`, 'fa' + i); })) { /* */ }
    });
    /* temperaturas */
    const relax = (key, P, Rth, tau) => { const t = T(key); sim.temp[key] = t + dt * (K.Tamb + Rth * P - t) / tau; return sim.temp[key]; };
    tv.wind.forEach(w => {
      const Rth = 60 / (w.coil.Imax ** 2 * w.coil.R), t = relax('coil:' + w.coil.id, w.I * w.I * w.R, Rth, K.coilTau);
      if (w.I > 1.15 * w.coil.Imax) log('seguridad', `La bobina de ${w.coil.label} espiras conduce ${w.I.toFixed(2)} A y su máximo es ${w.coil.Imax} A: se está calentando.`, 'over' + w.coil.id);
      if (t > 150) log('seguridad', `La bobina de ${w.coil.label} espiras supera 150 °C: huele a barniz quemado. Desenergiza.`, 'hot' + w.coil.id);
      if (t > 200) { st.damage.coils[w.coil.id] = true; changed = true; log('daño', `Se quemó el aislamiento de la bobina de ${w.coil.label} espiras. Quedó abierta.`, 'burn' + w.coil.id); }
    });
    for (const k of Object.keys(sim.temp)) if (k.startsWith('coil:') && !tv.wind.some(w => 'coil:' + w.coil.id === k)) relax(k, 0, 1, K.coilTau);
    K.loads.forEach((R, i) => {
      const on = i === st.load.idx && tv.loadP !== undefined, P = on ? tv.loadP : 0, t = relax('load:' + i, P, K.loadRth, K.loadTau);
      if (on && P > K.loadW * 1.05) log('seguridad', `La resistencia de ${fmtR(R)} disipa ${P.toFixed(1)} W y su potencia nominal es 10 W.`, 'lp' + i);
      if (t > 330) log('seguridad', `Sale humo de la resistencia de ${fmtR(R)} (${t.toFixed(0)} °C).`, 'smoke' + i);
      if (t > 450 && !st.damage.load[i]) { st.damage.load[i] = true; changed = true; log('daño', `Se quemó la resistencia de ${fmtR(R)}: quedó abierta.`, 'lburn' + i); }
    });
    { const t = relax('shunt', tv.shuntP || 0, K.shunt.Rth, K.shunt.tau);
      if ((tv.shuntP || 0) > K.shunt.W * 1.05) log('seguridad', `El shunt de 1 Ω disipa ${tv.shuntP.toFixed(1)} W (máximo 5 W).`, 'shp');
      if (t > 450 && !st.damage.shunt) { st.damage.shunt = true; changed = true; log('daño', 'Se quemó el shunt de 1 Ω.', 'shburn'); } }
    tv.wind.forEach(w => { if (w.V > K.selv) log('seguridad', `Tensión peligrosa: ${w.V.toFixed(0)} V en la bobina de ${w.coil.label} espiras (> 50 V CA). No toques bornes ni cables sin desenergizar.`, 'selv' + w.side); });
    tv.sc.forEach((s, i) => { if (s.ig > 0.05) log('seguridad', `Circula ${s.ig.toFixed(2)} A por la pinza de tierra del CH${i + 1}: las dos tierras del osciloscopio están en puntos distintos del circuito.`, 'gl' + i); });
    st.dmm.forEach((d, i) => { if (d.sel === 'Ω' && tv.dmm[i].acV > 0.3) log('seguridad', `DMM ${i + 1}: medir resistencia en un circuito energizado da lecturas falsas y puede dañar el instrumento.`, 'ohmlive' + i); });
    if (changed) { renderAll(); opts.onChange && opts.onChange(); }
    updateDisplays(tv);
    sim.tick++;
  }
  function diagnoseShort(tv) {
    const why = [];
    tv.dmm.forEach((d, i) => { if (d.ima > 0.5 || d.ia > 3) why.push(`el DMM ${i + 1} conectado como amperímetro en paralelo`); });
    tv.sc.forEach((s, i) => { if (s.ig > 0.5) why.push(`las tierras del osciloscopio unidas a puntos distintos (CH${i + 1})`); });
    tv.wind.forEach(w => { if (w.I > 2 * w.coil.Imax) why.push(`sobrecorriente en la bobina de ${w.coil.label} espiras`); });
    return why.length ? 'Causa probable: ' + why.join('; ') + '.' : 'Revisa si hay un cortocircuito o un secundario en corto a plena tensión.';
  }

  /* ---------- Lectura visible de los instrumentos ---------- */
  function updateDisplays(tv) {
    st.dmm.forEach((d, i) => {
      if (d.hold && sim.held[i]) { sim.disp[i] = sim.held[i]; return; }
      if (d.sel === 'OFF') { sim.disp[i] = null; return; }
      let x = tv.dmm[i].value;
      if (d.sel === 'Ω' && tv.dmm[i].acV > 0.3) x = Math.abs(x) * (0.5 + 3 * sim.rnd()) + 50 * sim.rnd();
      if (d.sel === 'Ω' && x > 6e7) { sim.disp[i] = { ol: true, mode: 'Ω', range: K.dmm.modes['Ω'].ranges[5] }; return; }
      sim.disp[i] = E.dmmRead(d.sel, x, variant.dmm[i], sim.rnd);
    });
    const w = tv.wm, g = variant.wm, jit = () => 1 + 0.0004 * E.gauss01(sim.rnd);
    const V = w.V * (1 + g.gV) * jit(), I = w.I * (1 + g.gI) * jit(), P = w.P * (1 + g.gP) * jit();
    sim.wmDisp = { V: V < 0.5 ? 0 : V, I: I < 0.002 ? 0 : I, P: Math.abs(P) < 0.002 ? 0 : P, pf: I < 0.002 || V < 0.5 ? null : Math.max(-1, Math.min(1, P / (V * I))), over: w.I > K.wm.imax * 1.2 };
    sim.needle += 0.45 * (tv.supplyV * (1 + variant.panelErr) - sim.needle);
    renderDynamic();
    renderReadings();
  }

  /* ---------- Dibujo ---------- */
  const SEG = (() => {
    const t = 6, hs = (x1, x2, y) => `M${x1} ${y}L${x1 + t / 2} ${y - t / 2}H${x2 - t / 2}L${x2} ${y}L${x2 - t / 2} ${y + t / 2}H${x1 + t / 2}Z`;
    const vs = (x, y1, y2) => `M${x} ${y1}L${x + t / 2} ${y1 + t / 2}V${y2 - t / 2}L${x} ${y2}L${x - t / 2} ${y2 - t / 2}V${y1 + t / 2}Z`;
    return { a: hs(5, 27, 3), g: hs(5, 27, 26), d: hs(5, 27, 49), f: vs(3, 5, 25), b: vs(29, 5, 25), e: vs(3, 27, 48), c: vs(29, 27, 48) };
  })();
  const CHARS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', O: 'abcdef', L: 'fed', E: 'afged', ' ': '', r: 'eg', o: 'cdeg', F: 'aefg', U: 'bcdef' };
  function seg7(text, x, y, s, cells, on, off) {
    const items = []; for (const ch of String(text)) { if (ch === '.' && items.length) items[items.length - 1].dp = true; else items.push({ ch, dp: false }); }
    while (items.length < cells) items.unshift({ ch: ' ', dp: false });
    let out = '';
    items.slice(-cells).forEach((it, i) => {
      const segs = CHARS[it.ch] ?? '';
      out += `<g transform="translate(${x + i * 36 * s} ${y}) scale(${s}) skewX(-7)">`;
      for (const k of 'abcdefg') out += `<path d="${SEG[k]}" fill="${segs.includes(k) ? on : off}"/>`;
      out += `<circle cx="35" cy="49" r="2.8" fill="${it.dp ? on : off}"/></g>`;
    });
    return out;
  }
  function socket(t) {
    return `<g class="term" data-term="${t.id}" tabindex="0" role="button" aria-label="${esc(t.label)}"><circle cx="${t.x}" cy="${t.y}" r="13" fill="transparent"/><circle cx="${t.x}" cy="${t.y}" r="9.5" fill="${t.ring}" stroke="#0007" stroke-width="1"/><circle cx="${t.x}" cy="${t.y}" r="4.2" fill="#0b0c0d"/><circle class="term-hi" cx="${t.x}" cy="${t.y}" r="13" fill="none" stroke="#f59e0b" stroke-width="3"/></g>`;
  }
  const fmtR = (R) => R >= 1000 ? (R / 1000) + ' kΩ' : String(R).replace('.', ',') + ' Ω';

  function staticSVG() {
    let s = `<defs>
      <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e6e9"/><stop offset="1" stop-color="#c7ccd1"/></linearGradient>
      <linearGradient id="gAmber" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b73a"/><stop offset="1" stop-color="#d4951c"/></linearGradient>
      <linearGradient id="gLcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d3b4"/><stop offset="1" stop-color="#b3bf9d"/></linearGradient>
      <linearGradient id="gKnob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5058"/><stop offset="1" stop-color="#202429"/></linearGradient>
      <pattern id="pLam" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#9aa3ab"/><path d="M0 0H5" stroke="#7f8890" stroke-width="1"/></pattern>
      <pattern id="pLamV" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#9aa3ab"/><path d="M0 0V5" stroke="#7f8890" stroke-width="1"/></pattern>
      <pattern id="pWire" width="6" height="4" patternUnits="userSpaceOnUse"><path d="M0 2H6" stroke="#0003" stroke-width="1.2"/></pattern>
      <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <rect x="0" y="0" width="1400" height="860" rx="14" class="bench-top"/>`;
    /* Fuente */
    s += `<g><rect x="20" y="30" width="300" height="330" rx="12" fill="url(#gMetal)" stroke="#8f979f"/>
      <text x="36" y="56" class="dev-title">FUENTE DE CA VARIABLE</text><text x="36" y="72" class="dev-sub">0–24 V · 3 A · 60 Hz · salida aislada</text>
      <rect x="36" y="86" width="150" height="104" rx="6" fill="#f6f2e4" stroke="#6d747b"/>`;
    for (let v = 0; v <= 30; v++) {
      const a = (-55 + 110 * v / 30) * Math.PI / 180, r1 = v % 5 ? 64 : 58, x1 = 111 + 70 * Math.sin(a), y1 = 176 - 70 * Math.cos(a), x2 = 111 + r1 * Math.sin(a), y2 = 176 - r1 * Math.cos(a);
      s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#2a2d31" stroke-width="${v % 5 ? 0.8 : 1.4}"/>`;
      if (v % 5 === 0) s += `<text x="${(111 + 49 * Math.sin(a)).toFixed(1)}" y="${(180 - 49 * Math.cos(a)).toFixed(1)}" class="dev-tiny" text-anchor="middle" fill="#2a2d31">${v}</text>`;
    }
    s += `<text x="111" y="160" text-anchor="middle" class="dev-tiny" fill="#2a2d31">V~ · cl. 2,5</text><g id="needle"><path d="M111 176L111 112" stroke="#b3261e" stroke-width="1.6"/></g><circle cx="111" cy="176" r="4" fill="#2a2d31"/>
      <g data-act="knob" class="knob" tabindex="0" role="slider" aria-label="Perilla de tensión de la fuente" id="knobG"><circle cx="255" cy="138" r="40" fill="url(#gKnob)" stroke="#111"/>`;
    for (let i = 0; i <= 10; i++) { const a = (-135 + 27 * i) * Math.PI / 180; s += `<text x="${(255 + 52 * Math.sin(a)).toFixed(1)}" y="${(142 - 52 * Math.cos(a)).toFixed(1)}" class="dev-tiny" text-anchor="middle" fill="#2a2d31">${i}</text>`; }
    s += `<g id="knobPtr"><path d="M255 138L255 104" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g><circle cx="255" cy="138" r="9" fill="#2c3137"/></g>
      <text x="255" y="203" text-anchor="middle" class="dev-label">TENSIÓN</text>
      <g data-act="knob-" class="btnlike" tabindex="0" role="button" aria-label="Bajar tensión un paso fino"><circle cx="222" cy="226" r="12" fill="#3a3f45"/><text x="222" y="231" text-anchor="middle" fill="#fff" font-size="16">−</text></g>
      <g data-act="knob+" class="btnlike" tabindex="0" role="button" aria-label="Subir tensión un paso fino"><circle cx="288" cy="226" r="12" fill="#3a3f45"/><text x="288" y="231" text-anchor="middle" fill="#fff" font-size="16">+</text></g>
      <g data-act="power" class="btnlike" tabindex="0" role="switch" aria-label="Interruptor de la fuente"><rect x="40" y="224" width="58" height="36" rx="5" fill="#2a2d31"/><rect id="pwrRocker" x="45" y="229" width="48" height="26" rx="3" fill="#7c1f1a"/><text x="56" y="247" fill="#fff" font-size="12">O</text><text x="80" y="247" fill="#fff" font-size="12">I</text></g>
      <text x="69" y="276" text-anchor="middle" class="dev-tiny" fill="#2a2d31">RED 120 V</text>
      <circle id="lamp" cx="126" cy="242" r="9" fill="#5b4a22" stroke="#222"/><text x="126" y="276" text-anchor="middle" class="dev-tiny" fill="#2a2d31">PILOTO</text>
      <g data-act="fuse" class="btnlike" tabindex="0" role="button" aria-label="Portafusible de la fuente"><circle cx="176" cy="242" r="16" fill="#1f2226"/><circle id="fuseCap" cx="176" cy="242" r="9" fill="#5f666e"/></g>
      <text x="176" y="276" text-anchor="middle" class="dev-tiny" fill="#2a2d31">F 3,15 A T</text>
      <text x="110" y="300" text-anchor="middle" class="dev-tiny" fill="#2a2d31">SALIDA ~</text><text x="250" y="300" text-anchor="middle" class="dev-tiny" fill="#2a2d31">TIERRA</text>
      <path d="M58 340H162" stroke="#6d747b"/><text x="70" y="352" text-anchor="middle" class="dev-tiny" fill="#2a2d31">~1</text><text x="150" y="352" text-anchor="middle" class="dev-tiny" fill="#2a2d31">~2</text></g>`;
    /* Transformador */
    s += `<g><rect x="380" y="332" width="460" height="34" rx="4" fill="#4a5058"/><text x="470" y="354" text-anchor="middle" class="dev-tiny" fill="#dfe3e7">IZQUIERDA</text><text x="750" y="354" text-anchor="middle" class="dev-tiny" fill="#dfe3e7">DERECHA</text>
      <text x="610" y="354" text-anchor="middle" class="dev-tiny" fill="#dfe3e7">Núcleo laminado 20 × 20 mm</text>
      <path d="M440 118H500V280H720V118H780V330H440Z" fill="url(#pLamV)" stroke="#5f676f"/><rect x="500" y="280" width="220" height="50" fill="url(#pLam)" stroke="#5f676f"/>
      <g id="yokeG" data-act="yoke" class="btnlike" tabindex="0" role="button" aria-label="Yugo del núcleo: cambiar ajuste"></g>
      <g id="humG"></g>
      <g id="coilL" data-act="coilL" class="btnlike" tabindex="0" role="button" aria-label="Bobina de la pierna izquierda: cambiar"></g>
      <g id="coilR" data-act="coilR" class="btnlike" tabindex="0" role="button" aria-label="Bobina de la pierna derecha: cambiar"></g></g>`;
    /* Carga */
    s += `<g><rect x="900" y="30" width="230" height="330" rx="10" fill="#e6e2d6" stroke="#9b9585"/>
      <text x="914" y="56" class="dev-title">CARGA RESISTIVA</text><text x="914" y="72" class="dev-sub">10 valores · 10 W · ±2 %</text>
      <g data-act="load" class="btnlike" tabindex="0" role="button" aria-label="Selector de resistencia de carga"><circle cx="1015" cy="142" r="34" fill="url(#gKnob)" stroke="#111"/>`;
    K.loads.forEach((R, i) => { const a = (-135 + 30 * i) * Math.PI / 180; s += `<text x="${(1015 + 53 * Math.sin(a)).toFixed(1)}" y="${(146 - 53 * Math.cos(a)).toFixed(1)}" class="dev-tiny" text-anchor="middle" fill="#2a2d31">${R >= 1000 ? '1k' : String(R).replace('.', ',')}</text>`; });
    s += `<g id="loadPtr"><path d="M1015 142L1015 114" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g></g>
      <text id="loadVal" x="1015" y="210" text-anchor="middle" class="dev-label"></text>
      <g data-act="loadsw" class="btnlike" tabindex="0" role="switch" aria-label="Interruptor de la carga"><rect x="965" y="222" width="100" height="26" rx="13" fill="#2a2d31"/><circle id="ldKnob" cx="978" cy="235" r="10" fill="#e9e9e9"/><text id="ldTxt" x="1015" y="239" text-anchor="middle" fill="#fff" class="dev-tiny"></text></g>
      <rect id="ldBody" x="950" y="268" width="130" height="22" rx="10" fill="#d8d3c4" stroke="#7d7768"/><path d="M962 268V290M974 268V290M1056 268V290M1068 268V290" stroke="#7d7768"/>
      <path d="M950 279V318M1080 279V318" stroke="#777" stroke-width="2"/><g id="smokeG"></g></g>`;
    /* Shunt */
    s += `<g><rect x="1160" y="30" width="220" height="150" rx="10" fill="#e6e2d6" stroke="#9b9585"/>
      <text x="1174" y="56" class="dev-title">SHUNT 1,00 Ω ±1 %</text><text x="1174" y="72" class="dev-sub">5 W · para ver corrientes en el osciloscopio</text>
      <rect id="shBody" x="1210" y="94" width="120" height="20" rx="9" fill="#d8d3c4" stroke="#7d7768"/><path d="M1210 104V140M1330 104V140" stroke="#777" stroke-width="2"/></g>`;
    /* Termómetro y placa del banco */
    s += `<g data-act="ir" class="btnlike" tabindex="0" role="button" aria-label="Medir temperaturas con el termómetro infrarrojo"><rect x="1160" y="200" width="220" height="160" rx="10" fill="#e9ecef" stroke="#a3abb3"/>
      <text x="1174" y="226" class="dev-title">TERMÓMETRO IR</text><text x="1174" y="242" class="dev-sub">toca para medir temperaturas</text>
      <path d="M1200 268h90l20 -10v40l-20 -10h-20l-12 48h-26l8 -48h-40z" fill="#d23c2b" stroke="#7b2219"/><rect x="1212" y="273" width="50" height="16" rx="2" fill="url(#gLcd)"/><text id="irTxt" x="1310" y="336" class="dev-tiny" fill="#2a2d31"></text></g>`;
    /* Multímetros */
    DMM_X.forEach((x, i) => {
      const y = DMM_Y, cx = x + 105, cy = y + 232;
      s += `<g><rect x="${x}" y="${y}" width="210" height="430" rx="20" fill="url(#gAmber)" stroke="#8d6514"/><rect x="${x + 12}" y="${y + 12}" width="186" height="406" rx="13" fill="#2b2f35"/>
        <text x="${x + 24}" y="${y + 33}" fill="#f2f2f2" font-size="13" font-weight="700">DMM ${i + 1}</text><text x="${x + 186}" y="${y + 33}" fill="#aab2ba" font-size="9" text-anchor="end">6000 cuentas · TRMS</text>
        <rect x="${x + 22}" y="${y + 42}" width="166" height="80" rx="5" fill="url(#gLcd)" stroke="#111"/><g id="lcd${i}"></g>
        <g data-act="hold${i}" class="btnlike" tabindex="0" role="button" aria-label="Botón HOLD del DMM ${i + 1}"><rect x="${x + 22}" y="${y + 132}" width="58" height="22" rx="4" fill="#4b5158"/><text x="${x + 51}" y="${y + 147}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">HOLD</text></g>
        <g data-act="fuses${i}" class="btnlike" tabindex="0" role="button" aria-label="Abrir el DMM ${i + 1} para revisar fusibles"><rect x="${x + 130}" y="${y + 132}" width="58" height="22" rx="4" fill="#3a3f45"/><text x="${x + 159}" y="${y + 147}" text-anchor="middle" fill="#cfd5db" font-size="9">FUSIBLES</text></g>
        <circle cx="${cx}" cy="${cy}" r="50" fill="url(#gKnob)" stroke="#0a0a0a"/>`;
      for (const [lab, ang] of SEL_POS) {
        const a = ang * Math.PI / 180, lx = cx + 71 * Math.sin(a), ly = cy - 71 * Math.cos(a) + 4;
        s += `<g data-act="sel${i}:${lab}" class="btnlike" tabindex="0" role="button" aria-label="DMM ${i + 1}: selector en ${lab}"><circle cx="${lx.toFixed(1)}" cy="${(ly - 4).toFixed(1)}" r="15" fill="transparent"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="${lab === 'OFF' ? '#ff8f80' : '#e8ecef'}" font-size="12" font-weight="700">${lab}</text></g>`;
      }
      s += `<g id="dial${i}"></g>
        <text x="${x + 36}" y="${y + 348}" text-anchor="middle" fill="#ff9d8f" font-size="8">10 A máx</text><text x="${x + 82}" y="${y + 348}" text-anchor="middle" fill="#ff9d8f" font-size="8">600 mA</text><text x="${x + 151}" y="${y + 348}" text-anchor="middle" fill="#aab2ba" font-size="8">600 V CAT II</text>
        <text x="${x + 36}" y="${y + 402}" text-anchor="middle" fill="#e8ecef" font-size="10" font-weight="700">10A</text><text x="${x + 82}" y="${y + 402}" text-anchor="middle" fill="#e8ecef" font-size="10" font-weight="700">mA</text><text x="${x + 128}" y="${y + 402}" text-anchor="middle" fill="#e8ecef" font-size="10" font-weight="700">COM</text><text x="${x + 174}" y="${y + 402}" text-anchor="middle" fill="#e8ecef" font-size="10" font-weight="700">VΩ</text></g>`;
    });
    /* Analizador de potencia */
    s += `<g><rect x="700" y="410" width="250" height="280" rx="12" fill="url(#gMetal)" stroke="#8f979f"/>
      <text x="714" y="434" class="dev-title">ANALIZADOR DE POTENCIA</text><text x="714" y="449" class="dev-sub">monofásico · 300 V · 5 A · P activa</text>
      <rect x="714" y="458" width="222" height="160" rx="5" fill="url(#gLcd)" stroke="#111"/><g id="wmLcd"></g>
      <text x="762" y="638" text-anchor="middle" class="dev-tiny" fill="#2a2d31">CORRIENTE</text><text x="887" y="638" text-anchor="middle" class="dev-tiny" fill="#2a2d31">TENSIÓN</text>
      <text x="735" y="683" text-anchor="middle" class="dev-tiny" fill="#2a2d31">I ±</text><text x="790" y="683" text-anchor="middle" class="dev-tiny" fill="#2a2d31">I</text><text x="860" y="683" text-anchor="middle" class="dev-tiny" fill="#2a2d31">U ±</text><text x="915" y="683" text-anchor="middle" class="dev-tiny" fill="#2a2d31">U</text></g>
      <g><rect x="700" y="706" width="250" height="134" rx="10" class="plate"/><text x="716" y="732" class="plate-t" id="benchPlate">BANCO 01</text><text x="716" y="752" class="plate-s">Laboratorio de Electromagnetismo</text><text x="716" y="770" class="plate-s">Red 120 V · 60 Hz · fuente aislada</text><text x="716" y="796" class="plate-s">Antes de energizar: revisión del montaje,</text><text x="716" y="812" class="plate-s">perilla en cero y una mano libre.</text></g>`;
    /* Osciloscopio */
    s += `<g><rect x="970" y="410" width="410" height="430" rx="12" fill="url(#gMetal)" stroke="#8f979f"/>
      <text x="986" y="434" class="dev-title">OSCILOSCOPIO DIGITAL</text><text x="986" y="449" class="dev-sub">2 canales · 50 MHz · 8 bits · entrada 1 MΩ</text>
      <rect x="986" y="460" width="288" height="232" rx="4" fill="#0e171c" stroke="#111"/><g id="scrGrid"></g><g id="scrTr"></g>
      <circle cx="1325" cy="500" r="18" fill="url(#gKnob)"/><text x="1325" y="535" text-anchor="middle" class="dev-tiny" fill="#2a2d31">V/div</text>
      <circle cx="1325" cy="580" r="18" fill="url(#gKnob)"/><text x="1325" y="615" text-anchor="middle" class="dev-tiny" fill="#2a2d31">s/div</text>
      <circle cx="1325" cy="655" r="12" fill="url(#gKnob)"/><text x="1325" y="682" text-anchor="middle" class="dev-tiny" fill="#2a2d31">TRIG</text>
      <text x="1035" y="760" text-anchor="middle" class="dev-tiny" fill="#2a2d31">CH1 punta · tierra</text><text x="1175" y="760" text-anchor="middle" class="dev-tiny" fill="#2a2d31">CH2 punta · tierra</text>
      <text x="1290" y="790" class="dev-tiny" fill="#2a2d31">Tierras unidas</text><text x="1290" y="804" class="dev-tiny" fill="#2a2d31">al chasis y a</text><text x="1290" y="818" class="dev-tiny" fill="#2a2d31">la red (PE)</text></g>`;
    let grid = '';
    for (let i = 0; i <= 10; i++) grid += `<path d="M${986 + 28.8 * i} 460V692" stroke="#24363e" stroke-width="${i === 5 ? 1.2 : 0.6}"/>`;
    for (let j = 0; j <= 8; j++) grid += `<path d="M986 ${460 + 29 * j}H1274" stroke="#24363e" stroke-width="${j === 4 ? 1.2 : 0.6}"/>`;
    s = s.replace('<g id="scrGrid"></g>', `<g id="scrGrid">${grid}</g>`);
    for (const t of Object.values(TERMS)) s += socket(t);
    s += `<g id="wiresG"></g><path id="rubber" d="" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 8" opacity=".85" pointer-events="none"/>`;
    return s;
  }

  function coilSVG(side) {
    const x = side === 'L' ? 415 : 695, id = st.tx[side], tp = side === 'L' ? 'tl' : 'tr';
    if (!id) return `<rect x="${x}" y="140" width="110" height="132" rx="8" fill="#ffffff22" stroke="#555" stroke-dasharray="6 5"/><text x="${x + 55}" y="200" text-anchor="middle" class="dev-tiny" fill="#2a2d31">sin bobina</text><text x="${x + 55}" y="214" text-anchor="middle" class="dev-tiny" fill="#2a2d31">(toca para elegir)</text>`;
    const cs = E.coilSpec(id, variant), dmg = st.damage.coils[id];
    const dark = id !== 'cX';
    let s = `<rect x="${x - 4}" y="134" width="118" height="12" rx="3" fill="#1d1f22"/><rect x="${x - 4}" y="266" width="118" height="12" rx="3" fill="#1d1f22"/>
      <rect x="${x}" y="144" width="110" height="124" rx="4" fill="${cs.body}" stroke="#0006"/><rect x="${x}" y="144" width="110" height="124" fill="url(#pWire)"/>
      <rect x="${x + 14}" y="152" width="82" height="66" rx="3" fill="#f4f1e8" stroke="#0004"/>
      <text x="${x + 55}" y="174" text-anchor="middle" font-size="17" font-weight="700" fill="#1d1f22">${id === 'cX' ? 'X' : cs.N}</text>
      <text x="${x + 55}" y="190" text-anchor="middle" class="dev-tiny" fill="#1d1f22">${id === 'cX' ? 'sin rótulo' : 'espiras'}</text>
      <text x="${x + 55}" y="206" text-anchor="middle" class="dev-tiny" fill="#1d1f22">${id === 'cX' ? 'N desconocido' : `${String(cs.Imax).replace('.', ',')} A máx`}</text>
      <text x="${x + 55}" y="236" text-anchor="middle" font-size="12" font-weight="700" fill="${dark ? '#fff' : '#1d1f22'}">•1</text><text x="${x + 80}" y="236" text-anchor="middle" font-size="12" font-weight="700" fill="${dark ? '#fff' : '#1d1f22'}">2</text>`;
    if (dmg) s += `<rect x="${x}" y="144" width="110" height="124" fill="#2a1a10cc"/><text x="${x + 55}" y="210" text-anchor="middle" fill="#ffb199" font-size="12" font-weight="700">QUEMADA</text>`;
    return s;
  }
  function yokeSVG() {
    const y = st.tx.yoke;
    if (y === 'retirado') return `<rect x="440" y="68" width="340" height="50" fill="none" stroke="#5f676f" stroke-dasharray="6 6"/><text x="610" y="98" text-anchor="middle" class="dev-tiny" fill="#2a2d31">yugo retirado (toca para colocarlo)</text>`;
    const dy = y === 'flojo' ? -7 : 0, rot = y === 'flojo' ? 'rotate(-0.6 610 93)' : '';
    return `<g transform="translate(0 ${dy}) ${rot}"><rect x="440" y="68" width="340" height="50" fill="url(#pLamV)" stroke="#5f676f"/>
      <rect x="586" y="40" width="48" height="30" rx="4" fill="#3a3f45"/><rect x="570" y="30" width="80" height="12" rx="5" fill="#25282c"/>
      <text x="610" y="99" text-anchor="middle" class="dev-tiny" fill="#20242a">yugo ${y}</text></g>`;
  }

  function renderStatic() {
    const svg = $('benchSvg');
    svg.innerHTML = staticSVG();
    renderAll();
  }
  function renderAll() {
    $('coilL').innerHTML = coilSVG('L'); $('coilR').innerHTML = coilSVG('R'); $('yokeG').innerHTML = yokeSVG();
    const a = -135 + 30 * st.load.idx; $('loadPtr').setAttribute('transform', `rotate(${a} 1015 142)`);
    const R = K.loads[st.load.idx];
    $('loadVal').textContent = fmtR(R) + (st.damage.load[st.load.idx] ? ' · QUEMADA' : '');
    $('ldKnob').setAttribute('cx', st.load.on ? 1052 : 978); $('ldTxt').textContent = st.load.on ? 'CONECTADA' : 'ABIERTA';
    $('ldTxt').setAttribute('x', st.load.on ? 1000 : 1030);
    $('pwrRocker').setAttribute('fill', st.supply.on ? '#d8352a' : '#7c1f1a');
    $('fuseCap').setAttribute('fill', st.supply.fuseOk ? '#5f666e' : '#1a1a1a');
    $('benchPlate').textContent = 'BANCO ' + String(st.bench).padStart(2, '0');
    st.dmm.forEach((d, i) => {
      const ang = SEL_POS.find(p => p[0] === d.sel)[1], cx = DMM_X[i] + 105, cy = DMM_Y + 232;
      $('dial' + i).innerHTML = `<g transform="rotate(${ang} ${cx} ${cy})"><rect x="${cx - 7}" y="${cy - 50}" width="14" height="100" rx="6" fill="#16191c"/><path d="M${cx} ${cy - 46}V${cy - 26}" stroke="#ff6b5b" stroke-width="4" stroke-linecap="round"/></g>`;
    });
    renderWires(); renderDynamic(); renderToolbar(); renderReadings();
  }
  function renderDynamic() {
    if (!$('knobPtr')) return;
    $('knobPtr').setAttribute('transform', `rotate(${-135 + 270 * st.supply.knob} 255 138)`);
    $('knobG').setAttribute('aria-valuenow', (st.supply.knob * 10).toFixed(2));
    const live = st.supply.on && st.supply.fuseOk;
    $('lamp').setAttribute('fill', st.supply.on ? '#ffb020' : '#5b4a22');
    const nv = Math.max(-1, Math.min(31, live ? sim.needle : 0));
    $('needle').setAttribute('transform', `rotate(${-55 + 110 * nv / 30} 111 176)`);
    /* LCD de multímetros */
    const ON = '#1b2116', OFF = '#1b211612';
    st.dmm.forEach((d, i) => {
      const x = DMM_X[i] + 22, y = DMM_Y + 42, rd = sim.disp[i];
      let g = '';
      if (d.sel !== 'OFF') {
        const tx = rd ? E.dmmText(rd) : { txt: '', unit: '' };
        let txt = tx.txt, neg = false;
        if (txt.startsWith('-')) { neg = true; txt = txt.slice(1); }
        const ann = [d.sel.endsWith('~') ? 'AC' : d.sel.endsWith('⎓') ? 'DC' : '', 'AUTO', d.hold ? 'HOLD' : '', 'TRMS'];
        g += `<text x="${x + 8}" y="${y + 14}" font-size="9" font-weight="700" fill="${ON}">${ann.filter(Boolean).join('  ')}</text>`;
        if (neg) g += `<path d="M${x + 6} ${y + 46}h10" stroke="${ON}" stroke-width="4"/>`;
        g += seg7(txt, x + 20, y + 22, 0.82, 4, ON, OFF);
        g += `<text x="${x + 160}" y="${y + 68}" font-size="14" font-weight="700" text-anchor="end" fill="${ON}">${esc(tx.unit)}</text>`;
      }
      $('lcd' + i).innerHTML = g;
    });
    /* Analizador */
    { const x = 714, y = 458, w = sim.wmDisp; let g = '';
      if (w && live) {
        const lines = [['V', w.V, w.V >= 100 ? 1 : 2], ['A', w.I, 3], ['W', w.P, Math.abs(w.P) >= 10 ? 2 : 3], ['FP', w.pf, 3]];
        lines.forEach(([lab, v, d], k) => {
          let txt = v === null ? '----' : Math.abs(v).toFixed(d); if (w.over && lab === 'A') txt = 'OL';
          if (txt.replace('.', '').length > 4) txt = Math.abs(v).toFixed(Math.max(0, d - 1));
          const yy = y + 8 + k * 38;
          if (v !== null && v < 0 && txt !== 'OL') g += `<path d="M${x + 22} ${yy + 18}h9" stroke="${ON}" stroke-width="3.5"/>`;
          g += seg7(txt, x + 36, yy, 0.6, 4, ON, OFF) + `<text x="${x + 208}" y="${yy + 27}" text-anchor="end" font-size="13" font-weight="700" fill="${ON}">${lab}</text>`;
        });
      }
      $('wmLcd').innerHTML = g; }
    /* Resistencia de carga: color por temperatura */
    const tl = T('load:' + st.load.idx);
    $('ldBody').setAttribute('fill', heatColor(tl, '#d8d3c4'));
    $('shBody').setAttribute('fill', heatColor(T('shunt'), '#d8d3c4'));
    $('smokeG').innerHTML = tl > 330 ? `<g opacity=".55" filter="url(#fGlow)"><circle cx="1000" cy="250" r="14" fill="#8a8a8a"/><circle cx="1025" cy="236" r="18" fill="#9a9a9a"/><circle cx="1050" cy="246" r="12" fill="#8a8a8a"/></g>` : '';
    /* zumbido con yugo flojo o retirado */
    const hum = live && st.tx.yoke !== 'apretado' && sim.meas && sim.meas.wind.some(w => w.V > 1);
    $('humG').innerHTML = hum ? `<path d="M430 66q-8 -10 0 -20M420 70q-12 -16 0 -32M790 66q8 -10 0 -20M800 70q12 -16 0 -32" stroke="#b3261e" stroke-width="2" fill="none" opacity=".7"/>` : '';
    drawMiniScope();
  }
  function heatColor(t, base) {
    if (t < 60) return base;
    const k = Math.min(1, (t - 60) / 340);
    const r = Math.round(216 + (200 - 216) * k), g = Math.round(211 + (60 - 211) * k), b = Math.round(196 + (30 - 196) * k);
    return `rgb(${r},${g},${b})`;
  }
  function cablePath(a, b) {
    const A = TERMS[a], B = TERMS[b], d = Math.hypot(B.x - A.x, B.y - A.y), sag = 30 + 0.22 * d;
    const y1 = Math.min(Math.max(A.y, B.y) + sag, 852);
    return `M${A.x} ${A.y}C${A.x + (B.x - A.x) * 0.15} ${y1},${B.x - (B.x - A.x) * 0.15} ${y1},${B.x} ${B.y}`;
  }
  function renderWires() {
    let g = '';
    for (const w of st.wires) {
      const col = WIRE_COLORS[w.color] || w.color, d = cablePath(w.a, w.b), sel = sim.selWire === w.id;
      g += `<g data-wire="${w.id}" class="wire${sel ? ' sel' : ''}"><path d="${d}" stroke="transparent" stroke-width="16" fill="none"/>${sel ? `<path d="${d}" stroke="#f59e0b" stroke-width="11" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        <path d="${d}" stroke="#0008" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="${TERMS[w.a].x}" cy="${TERMS[w.a].y}" r="6.5" fill="${col}" stroke="#0009"/><circle cx="${TERMS[w.b].x}" cy="${TERMS[w.b].y}" r="6.5" fill="${col}" stroke="#0009"/></g>`;
    }
    $('wiresG').innerHTML = g;
    document.querySelectorAll('#benchSvg .term').forEach(el => el.classList.toggle('pending', el.dataset.term === sim.pending));
  }

  /* ---------- Osciloscopio ---------- */
  const VDIV = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
  const TDIV = [0.0005, 0.001, 0.002, 0.005, 0.01, 0.02];
  function scopeTraces(npts, noisy) {
    const m = sim.meas; if (!m) return null;
    const f = K.f, sc = st.scope, span = 10 * sc.tdiv;
    const trigCh = m.sc[sc.trig], fund = trigCh.ph[0], amp = Math.hypot(fund[0], fund[1]);
    let t0;
    if (amp * Math.SQRT2 > 0.1 * sc.ch[sc.trig].vdiv && trigCh.tipWired && !trigCh.floating) t0 = (-Math.PI / 2 - Math.atan2(fund[1], fund[0])) / (2 * Math.PI * f);
    else t0 = sim.rnd() / f;
    const out = [];
    m.sc.forEach((ch, i) => {
      const cfg = sc.ch[i]; if (!cfg.on) { out.push(null); return; }
      const pts = [], hum = !ch.tipWired || ch.floating, hph = sim.rnd() * 6.28;
      let clip = false;
      for (let k = 0; k <= npts; k++) {
        const t = t0 - span / 2 + span * k / npts;
        let v = cfg.cpl === 'GND' ? 0 : E.waveAt(ch.ph, f, t);
        if (hum && cfg.cpl !== 'GND') v = (ch.tipWired ? 0.3 * v : 0) + 0.06 * Math.sin(2 * Math.PI * f * t + hph) + 0.02 * E.gauss01(sim.rnd);
        if (noisy) v += 0.004 * cfg.vdiv * E.gauss01(sim.rnd) * 5 + 0.0008 * E.gauss01(sim.rnd);
        let div = v / cfg.vdiv + cfg.pos;
        if (div > 5.1) { div = 5.1; clip = true; } if (div < -5.1) { div = -5.1; clip = true; }
        div = Math.round(div * 25.6) / 25.6;
        pts.push([k / npts, div, v]);
      }
      out.push({ pts, clip, hum });
    });
    return out;
  }
  function drawMiniScope() {
    const tr = scopeTraces(160, true); if (!tr) return;
    let g = '';
    tr.forEach((c, i) => { if (!c) return; const d = c.pts.map((p, k) => (k ? 'L' : 'M') + (986 + 288 * p[0]).toFixed(1) + ' ' + (576 - 29 * p[1]).toFixed(1)).join(''); g += `<path d="${d}" stroke="${i ? '#3bc6f2' : '#f2d33b'}" stroke-width="1.4" fill="none"/>`; });
    $('scrTr').innerHTML = g;
  }
  function drawScope() {
    const cv = $('scopeCanvas'); if (!cv || !cv.offsetParent) return;
    const dpr = Math.min(2, root.devicePixelRatio || 1), W = cv.clientWidth, H = Math.round(W * 0.8);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0b1418'; g.fillRect(0, 0, W, H);
    const top = 22, ph = H - 64, dx = W / 10, dy = ph / 8;
    g.strokeStyle = '#25414b'; g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * dx + 0.5, top); g.lineTo(i * dx + 0.5, top + ph); g.stroke(); }
    for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, top + j * dy + 0.5); g.lineTo(W, top + j * dy + 0.5); g.stroke(); }
    g.strokeStyle = '#3c6573'; for (let i = 0; i < 50; i++) { g.beginPath(); g.moveTo(i * dx / 5, top + 4 * dy - 3); g.lineTo(i * dx / 5, top + 4 * dy + 3); g.stroke(); }
    const tr = scopeTraces(600, true); if (!tr) return;
    const cols = ['#f2d33b', '#3bc6f2'], sc = st.scope;
    tr.forEach((c, i) => {
      if (!c) return;
      g.strokeStyle = cols[i]; g.lineWidth = 1.6; g.beginPath();
      c.pts.forEach((p, k) => { const x = p[0] * W, y = top + ph / 2 - p[1] * dy; if (k) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
      g.fillStyle = cols[i]; g.font = '600 12px ui-monospace,Consolas,monospace';
      g.fillText((i + 1) + '▸', 2, top + ph / 2 - sc.ch[i].pos * dy + 4);
    });
    g.font = '12px ui-monospace,Consolas,monospace';
    g.fillStyle = '#f2d33b'; g.fillText(`CH1 ${fmtV(sc.ch[0].vdiv)}/div ${sc.ch[0].cpl}${sc.ch[0].probe === 10 ? ' ×10' : ''}`, 6, 15);
    g.fillStyle = '#3bc6f2'; g.fillText(`CH2 ${fmtV(sc.ch[1].vdiv)}/div ${sc.ch[1].cpl}${sc.ch[1].probe === 10 ? ' ×10' : ''}`, W * 0.36, 15);
    g.fillStyle = '#d9e2e6'; g.fillText(`${fmtT(sc.tdiv)}/div  Trig CH${sc.trig + 1} ↑`, W * 0.7, 15);
    const yb = top + ph + 18;
    tr.forEach((c, i) => {
      if (!c) return;
      const vs = c.pts.map(p => p[2]); let mx = -1e9, mn = 1e9, s2 = 0;
      const N = vs.length;
      for (const v of vs) { mx = Math.max(mx, v); mn = Math.min(mn, v); s2 += v * v; }
      g.fillStyle = cols[i];
      g.fillText(c.clip ? `CH${i + 1}  recortada: sube V/div` : `CH${i + 1}  Vpp ${fmtV(mx - mn)}  Vrms ${fmtV(Math.sqrt(s2 / N))}${c.hum ? '  señal flotante' : ''}`, 6 + i * W * 0.5, yb);
    });
    const a = sim.meas.sc[0].ph[0], b = sim.meas.sc[1].ph[0];
    if (sc.ch[0].on && sc.ch[1].on && Math.hypot(...a) > 0.01 && Math.hypot(...b) > 0.01) {
      let d = (Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0])) * 180 / Math.PI; d = ((d + 540) % 360) - 180;
      d += 0.6 * E.gauss01(sim.rnd);
      g.fillStyle = '#d9e2e6'; g.fillText(`f ${(K.f * (1 + 0.0003 * E.gauss01(sim.rnd))).toFixed(2)} Hz   desfase CH2−CH1 ${d.toFixed(1)}°`, 6, yb + 18);
    }
  }
  const fmtV = (v) => { const a = Math.abs(v); return a >= 1 ? (+v.toPrecision(3)) + ' V' : a >= 1e-3 ? (+(v * 1e3).toPrecision(3)) + ' mV' : '0 V'; };
  const fmtT = (t) => t >= 1e-3 ? (t * 1e3) + ' ms' : (t * 1e6) + ' µs';

  /* ---------- Roles de los instrumentos (qué magnitud registra cada uno) ---------- */
  function analyze() {
    const m = sim.meas, cc = sim.cc; if (!m || !cc) return null;
    const c = cc.c, sup = cc.map.supply !== undefined ? c.elems[cc.map.supply] : null;
    let prim = null, sec = null;
    const winds = m.wind;
    const supGroup = sup ? cc.group(sup.a) : -1;
    const inSup = winds.filter(w => cc.group(w.a) === supGroup);
    if (inSup.length === 1) prim = inSup[0];
    else if (inSup.length === 2) prim = inSup[0].P >= inSup[1].P ? inSup[0] : inSup[1];
    else if (winds.length) prim = winds.find(w => w.side === 'L') || winds[0];
    sec = winds.find(w => w !== prim) || null;
    const sameNets = (a, b) => { if (!a || !b) return false; const [p, q, r, t] = [a[0], a[1], b[0], b[1]].map(cc.same); return (p === r && q === t) || (p === t && q === r); };
    const matchPh = (x, y) => { const ax = E.rmsOf(x), ay = E.rmsOf(y); if (ax < 1e-9 || ay < 1e-9) return false; const d1 = E.rmsOf(x.map((p, k) => [p[0] - y[k][0], p[1] - y[k][1]])), d2 = E.rmsOf(x.map((p, k) => [p[0] + y[k][0], p[1] + y[k][1]])); return Math.min(d1, d2) < 0.03 * ay; };
    const autoRole = (d, i) => {
      const r = m.dmm[i];
      if (d.sel === 'OFF') return null;
      if (d.sel === 'Ω') return 'R';
      if (d.sel.startsWith('V')) {
        if (prim && sameNets(r.nets, [prim.a, prim.b])) return 'V1';
        if (sec && sameNets(r.nets, [sec.a, sec.b])) return 'V2';
        if (sup && r.nets && sameNets(r.nets, [sup.a, sup.b])) return 'V1';
        return 'otra';
      }
      const ph = r.phI;
      if (ph && prim && matchPh(ph, prim.phI)) return 'I1';
      if (ph && sec && matchPh(ph, sec.phI)) return 'I2';
      const jack = d.sel.startsWith('mA') ? `d${i + 1}.ma` : `d${i + 1}.a`;
      const gj = cc.group(cc.net(jack));
      if (prim && gj === cc.group(prim.a) && cc.wired.has(jack)) return 'I1';
      if (sec && gj === cc.group(sec.a) && cc.wired.has(jack)) return 'I2';
      return 'otra';
    };
    const roles = st.dmm.map((d, i) => d.role !== 'auto' ? d.role : autoRole(d, i));
    let wmRole = st.wmRole;
    if (wmRole === 'auto') {
      const wired = ['wm.i1', 'wm.i2'].every(t => cc.wired.has(t)) && ['wm.v1', 'wm.v2'].every(t => cc.wired.has(t));
      if (!wired) wmRole = null;
      else if (prim && matchPh(m.wm.phI, prim.phI)) wmRole = 'P1';
      else if (prim && cc.group(cc.net('wm.i1')) === cc.group(prim.a)) wmRole = 'P1';
      else if (sec && cc.group(cc.net('wm.i1')) === cc.group(sec.a)) wmRole = 'P2';
      else wmRole = 'otra';
    }
    /* estado del secundario: vacío, carga o cortocircuito (resistencia externa en CC) */
    let secState = null, Rext = null, loadInSec = false;
    if (sec) {
      const ex = { nNets: c.nNets, f: c.f, core: null, windings: [], elems: c.elems.filter(e => e.k === 'R').concat([{ k: 'I', a: sec.a, b: sec.b, I: 1e-3 }]) };
      const x = E.solveDC(ex); Rext = Math.abs((x.V[sec.a][0] - x.V[sec.b][0]) / 1e-3);
      secState = Rext < 0.5 ? 'corto' : Rext > 1e5 ? 'vacío' : 'carga';
      if (cc.map.load !== undefined) { const le = c.elems[cc.map.load]; loadInSec = cc.group(le.a) === cc.group(sec.a) && secState === 'carga'; }
    }
    return { prim, sec, roles, wmRole, secState, Rext, loadInSec };
  }
  const ROLE_TXT = { V1: 'V₁', V2: 'V₂', I1: 'I₁', I2: 'I₂', P1: 'P₁', P2: 'P₂', R: 'R (CC)', otra: 'otra' };

  /* Captura de lecturas tal como se ven en los instrumentos. */
  function capture() {
    const an = analyze(); if (!an) return null;
    const mm = {}, inst = [];
    st.dmm.forEach((d, i) => {
      const rd = sim.disp[i], role = an.roles[i];
      if (!rd || !role) return;
      inst.push({ name: `DMM ${i + 1}`, sel: d.sel, role, text: rd.ol ? 'OL' : E.dmmText(rd).txt + ' ' + rd.range[2], hold: d.hold });
      if (rd.ol) return;
      if (role === 'otra') { mm.otras = mm.otras || []; mm.otras.push({ v: rd.value, u: rd.u, inst: `DMM ${i + 1}`, sel: d.sel }); return; }
      let v = rd.value, u = rd.u;
      if (d.sel === 'Ω') { mm.R = mm.R || []; mm.R.push({ v, u, inst: `DMM ${i + 1}` }); return; }
      if (!mm[role]) mm[role] = { v, u, inst: `DMM ${i + 1}` };
    });
    const w = sim.wmDisp, live = st.supply.on && st.supply.fuseOk;
    if (an.wmRole && w && live && an.wmRole !== 'otra') {
      const uP = (K.wm.accP[0] / 100 * Math.abs(w.P) + K.wm.accP[1] * 0.001) / Math.sqrt(3);
      const uV = (K.wm.accV[0] / 100 * w.V + K.wm.accV[1] * 0.01) / Math.sqrt(3), uI = (K.wm.accI[0] / 100 * w.I + K.wm.accI[1] * 0.001) / Math.sqrt(3);
      const p = an.wmRole === 'P1' ? '1' : '2';
      mm['P' + p] = { v: +w.P.toFixed(3), u: uP, inst: 'Analizador' };
      if (!mm['V' + p]) mm['V' + p] = { v: +w.V.toFixed(2), u: uV, inst: 'Analizador' };
      if (!mm['I' + p]) mm['I' + p] = { v: +w.I.toFixed(3), u: uI, inst: 'Analizador' };
      inst.push({ name: 'Analizador', role: an.wmRole, text: `${w.V.toFixed(2)} V · ${w.I.toFixed(3)} A · ${w.P.toFixed(3)} W · FP ${w.pf === null ? '—' : w.pf.toFixed(3)}` });
    }
    const pc = an.prim ? an.prim.coil : null, sc = an.sec ? an.sec.coil : null;
    const cfg = { coilP: pc ? pc.id : null, coilS: sc ? sc.id : null, n1: pc && pc.id !== 'cX' ? pc.N : null, n2: sc && sc.id !== 'cX' ? sc.N : null,
      yoke: st.tx.yoke, sec: an.secState, RL: an.loadInSec ? K.loads[st.load.idx] : null, knob: +(st.supply.knob * 10).toFixed(2), on: live, bench: st.bench };
    return { cfg, m: mm, inst };
  }

  /* ---------- Revisión del montaje (como lo haría el docente antes de energizar) ---------- */
  function review() {
    const tests = [];
    const add = (lvl, msg) => tests.push({ lvl, msg });
    const knob = st.supply.on ? st.supply.knob : Math.max(st.supply.knob, 0.5);
    const hyp = JSON.parse(JSON.stringify(st)); hyp.supply.on = true; hyp.supply.fuseOk = true; hyp.supply.knob = knob;
    const save = sim.mains; sim.mains = 0;
    const S = solveAll(hyp); const tv = trueValues(S, hyp); sim.mains = save;
    const cc = S.cc, wired = cc.wired;
    if (!st.wires.length) { add('error', 'No hay cables conectados. Empieza por el circuito primario: fuente → amperímetro → bobina → fuente.'); return tests; }
    if (!st.supply.fuseOk) add('error', 'El fusible de la fuente está fundido. Apágala y reemplázalo (toca el portafusible).');
    const supWired = wired.has('src.l') && wired.has('src.n');
    if (!supWired) add('error', 'La fuente no está conectada: usa sus dos bornes de salida ~1 y ~2.');
    const sup = cc.map.supply !== undefined ? cc.c.elems[cc.map.supply] : null;
    const fed = tv.wind.filter(w => sup && cc.group(w.a) === cc.group(sup.a));
    if (supWired && !fed.length) add('error', 'La fuente no alimenta ninguna bobina. Revisa que el circuito primario se cierre a través de una bobina.');
    if (tv.supplyI > K.supply.fuseA) add('error', `Con ${(knob * K.supply.vmax).toFixed(1)} V circularían ${tv.supplyI.toFixed(2)} A por la fuente: cortocircuito o sobrecarga. ${diagnoseShort(tv)}`);
    st.dmm.forEach((d, i) => {
      const n = i + 1, jacks = ['a', 'ma', 'com', 'v'].filter(j => wired.has(`d${n}.${j}`)), r = tv.dmm[i];
      if (!jacks.length) return;
      if (jacks.length === 1) add('aviso', `DMM ${n}: tiene un solo cable; un instrumento necesita dos.`);
      if (d.sel === 'OFF') add('aviso', `DMM ${n}: está conectado pero apagado (selector en OFF).`);
      if (d.sel.endsWith('⎓')) add('aviso', `DMM ${n}: el selector está en corriente continua (⎓). En CA leerá casi cero: usa la posición con ~.`);
      const inCurrentJack = jacks.includes('a') || jacks.includes('ma');
      if ((d.sel.startsWith('V') || d.sel === 'Ω') && inCurrentJack) add('error', `DMM ${n}: el selector mide ${d.sel} pero hay un cable en un borne de corriente (${jacks.includes('ma') ? 'mA' : '10A'}). Ese borne es casi un cortocircuito.`);
      if ((d.sel.startsWith('mA') || d.sel.startsWith('A')) && !(d.sel.startsWith('mA') ? jacks.includes('ma') : jacks.includes('a'))) add('aviso', `DMM ${n}: el selector está en ${d.sel} pero el cable no está en el borne ${d.sel.startsWith('mA') ? 'mA' : '10A'}; no medirá esa corriente.`);
      if (jacks.includes('ma') && !d.fuseMa) add('error', `DMM ${n}: el fusible del borne mA está fundido. Ese borne no conduce: abre el circuito y marca 0. Desconecta el DMM y toca FUSIBLES para cambiarlo.`);
      if (jacks.includes('a') && !d.fuseA) add('error', `DMM ${n}: el fusible del borne 10 A está fundido. Desconecta el DMM y toca FUSIBLES para cambiarlo.`);
      if (r.ima > K.dmm.fuseMa) add('error', `DMM ${n}: por el borne mA pasarían ${r.ima.toFixed(2)} A (máx. 0,6 A). ${r.ima > 2 ? 'Está en paralelo con una fuente o una bobina: un amperímetro va en serie.' : 'Usa el borne de 10 A.'}`);
      else if (r.ia > K.dmm.fuseA) add('error', `DMM ${n}: por el borne 10 A pasarían ${r.ia.toFixed(1)} A: está en paralelo (un amperímetro va en serie).`);
      if (d.sel === 'Ω' && st.supply.on) add('error', `DMM ${n}: no midas resistencia con el circuito energizado. Apaga la fuente y desconecta la bobina.`);
    });
    tv.sc.forEach((s, i) => {
      if (s.ig > 0.05) add('error', `Osciloscopio: las pinzas de tierra quedan en puntos distintos del mismo circuito y la tierra de la red los une (${s.ig.toFixed(2)} A por la pinza CH${i + 1}). Conecta ambas pinzas al mismo punto.`);
      if (s.tipWired && !s.gndWired && s.floating) add('aviso', `Osciloscopio CH${i + 1}: la punta está conectada pero la pinza de tierra no; la medida quedará flotante.`);
    });
    tv.wind.forEach(w => {
      if (w.I > w.coil.Imax * 1.05) add('aviso', `La bobina de ${w.coil.label} espiras conduciría ${w.I.toFixed(2)} A (máx. ${w.coil.Imax} A).`);
      if (w.V > K.selv) add('error', `La bobina de ${w.coil.label} espiras tendría ${w.V.toFixed(0)} V (más de 50 V CA, tensión peligrosa). Reduce la tensión o cambia la relación.`);
    });
    if (tv.loadP !== undefined && tv.loadP > K.loadW) add('aviso', `La carga disiparía ${tv.loadP.toFixed(1)} W (nominal 10 W). Elige un valor mayor o baja la tensión.`);
    if (st.load.on && tv.loadP !== undefined && wired.has('ld.a') && wired.has('ld.b') && tv.loadI < 1e-4 && tv.wind.some(w => w.V > 0.5)) {
      add('aviso', 'La resistencia de carga está cableada pero no circula corriente por ella: ¿hay un voltímetro en serie o el circuito está abierto?');
    }
    const an = (() => { const keep = { meas: sim.meas, cc: sim.cc }; sim.meas = tv; sim.cc = cc; const a = analyze(); sim.meas = keep.meas; sim.cc = keep.cc; return a; })();
    if (an) {
      const roles = new Set(an.roles.filter(Boolean)); if (an.wmRole === 'P1') { roles.add('P1'); }
      const need = { A: ['V1', 'V2'], B: ['V1', 'I1', 'V2'], C: ['V1', 'I1', 'I2'], D: ['V1', 'V2', 'I1', 'I2'], E: ['V1'], R: ['R'] }[st.stage] || [];
      const miss = need.filter(r => !(roles.has(r) || (an.wmRole === 'P1' && (r === 'V1' || r === 'I1'))));
      if (miss.length) add('aviso', `Para el ensayo ${STAGES[st.stage]} falta medir: ${miss.map(r => ROLE_TXT[r]).join(', ')}.`);
      if ((st.stage === 'A' || st.stage === 'B') && an.secState && an.secState !== 'vacío') add('aviso', `El ensayo ${st.stage} se hace con el secundario abierto; ahora está en ${an.secState}.`);
      if (st.stage === 'C' && an.secState !== 'corto') add('aviso', 'En el ensayo de cortocircuito el secundario debe quedar cerrado solo a través del amperímetro (borne 10 A).');
      if (st.stage === 'C') add('info', 'Ensayo de cortocircuito: enciende con la perilla en 0 y sube despacio hasta que I₂ llegue a la corriente máxima de la bobina, nunca más.');
      if (st.stage === 'D' && an.secState !== 'carga') add('aviso', 'En el ensayo con carga, la resistencia debe estar en el circuito del secundario y su interruptor en CONECTADA.');
      if (st.stage === 'R' && st.supply.on) add('error', 'Para medir resistencia de devanados la fuente debe estar apagada.');
      if (st.stage === 'R' && an.prim && cc.group(an.prim.a) === cc.group(cc.c.elems[cc.map.supply]?.a)) add('aviso', 'Desconecta la bobina de la fuente: su devanado interno queda en paralelo y altera la lectura.');
    }
    if (!tests.some(t => t.lvl === 'error')) add(tests.some(t => t.lvl === 'aviso') ? 'info' : 'ok', st.supply.on ? 'No hay errores graves en el montaje.' : 'Montaje revisado. Enciende con la perilla en 0 y sube la tensión despacio mientras miras los amperímetros.');
    return tests;
  }

  /* ---------- Montajes de demostración ---------- */
  function demo(stage) {
    const W = (a, b, color) => ({ a, b, color });
    const prim = [W('src.l', 'wm.i1', 'rojo'), W('wm.i2', 'd2.ma', 'rojo'), W('d2.com', 'tl.1', 'negro'), W('tl.2', 'src.n', 'negro'), W('wm.v1', 'tl.1', 'amarillo'), W('wm.v2', 'tl.2', 'amarillo'), W('d1.v', 'tl.1', 'rojo'), W('d1.com', 'tl.2', 'negro')];
    let wires = [], sel = ['V~', 'mA~', 'V~'];
    if (stage === 'A' || stage === 'B' || stage === 'L') wires = prim.concat([W('d3.v', 'tr.1', 'azul'), W('d3.com', 'tr.2', 'negro')]);
    if (stage === 'C') { wires = prim.concat([W('tr.1', 'd3.a', 'azul'), W('d3.com', 'tr.2', 'negro')]); sel = ['V~', 'A~', 'A~']; wires = wires.map(w => w.a === 'wm.i2' ? W('wm.i2', 'd2.a', 'rojo') : w); }
    if (stage === 'D') { wires = [W('src.l', 'wm.i1', 'rojo'), W('wm.i2', 'tl.1', 'rojo'), W('tl.2', 'src.n', 'negro'), W('wm.v1', 'tl.1', 'amarillo'), W('wm.v2', 'tl.2', 'amarillo'), W('d1.v', 'tl.1', 'rojo'), W('d1.com', 'tl.2', 'negro'),
      W('tr.1', 'd2.ma', 'azul'), W('d2.com', 'ld.a', 'azul'), W('ld.b', 'tr.2', 'negro'), W('d3.v', 'tr.1', 'azul'), W('d3.com', 'tr.2', 'negro'), W('sc.1', 'tl.1', 'amarillo'), W('sc.g1', 'tl.2', 'negro')]; sel = ['V~', 'mA~', 'V~']; }
    if (stage === 'E') { wires = [W('src.l', 'd2.ma', 'rojo'), W('d2.com', 'tl.1', 'negro'), W('tl.2', 'src.n', 'negro'), W('d1.v', 'tl.1', 'rojo'), W('d1.com', 'tl.2', 'negro'), W('tl.2', 'tr.2', 'verde'), W('d3.v', 'tr.1', 'azul'), W('d3.com', 'tl.1', 'negro')]; }
    if (stage === 'R') { wires = [W('d1.v', 'tl.1', 'rojo'), W('d1.com', 'tl.2', 'negro'), W('d3.v', 'tr.1', 'rojo'), W('d3.com', 'tr.2', 'negro')]; sel = ['Ω', 'OFF', 'Ω']; }
    st.supply.on = false; st.supply.knob = 0;
    st.wires = wires.map(w => ({ id: st.nextWire++, ...w }));
    st.dmm.forEach((d, i) => { d.sel = sel[i]; d.role = 'auto'; d.hold = false; });
    if (stage === 'D') st.load.on = true;
    st.stage = stage;
    log('info', `Se usó el montaje de demostración del ensayo ${STAGES[stage]}.`, 'demo' + stage + Date.now());
    renderAll(); opts.onChange && opts.onChange();
  }

  /* ---------- Interacción ---------- */
  function svgPoint(evt) { const svg = $('benchSvg'), p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function energizedChange(what) { if (st.supply.on && st.supply.fuseOk && st.supply.knob > 0.01) log('seguridad', `${what} con el circuito energizado. Apaga la fuente antes de cambiar conexiones.`, 'live' + what); }
  function clickTerm(id) {
    sim.selWire = null;
    if (!sim.pending) { sim.pending = id; renderWires(); setHint(`Borne elegido: ${TERMS[id].label}. Toca otro borne para conectar el cable, o toca el mismo para cancelar.`); return; }
    if (sim.pending === id) { sim.pending = null; $('rubber').setAttribute('d', ''); renderWires(); setHint(); return; }
    const a = sim.pending, b = id; sim.pending = null; $('rubber').setAttribute('d', '');
    if (st.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { setHint('Esos dos bornes ya están unidos por un cable.'); renderWires(); return; }
    st.wires.push({ id: st.nextWire++, a, b, color: sim.color });
    energizedChange('Conectaste un cable');
    renderWires(); setHint(`Cable conectado: ${TERMS[a].label} → ${TERMS[b].label}.`); changed();
  }
  function removeWire(id) {
    st.wires = st.wires.filter(w => w.id !== id); if (sim.selWire === id) sim.selWire = null;
    energizedChange('Quitaste un cable'); renderWires(); renderToolbar(); changed();
  }
  function setKnob(v) {
    const before = st.supply.knob; st.supply.knob = Math.max(0, Math.min(1, Math.round(v * 2000) / 2000));
    if (before !== st.supply.knob) { renderDynamic(); changed(true); }
  }
  function coilMenu(side, anchor) {
    if (st.supply.on && st.supply.fuseOk) { opts.toast && opts.toast('Apaga la fuente antes de cambiar una bobina.'); log('seguridad', 'Intentaste cambiar una bobina con la fuente encendida.', 'coilLive'); return; }
    const pop = $('benchPop'), r = anchor.getBoundingClientRect(), wr = $('benchWrap').getBoundingClientRect();
    const other = st.tx[side === 'L' ? 'R' : 'L'];
    pop.innerHTML = `<p class="pop-t">Bobina de la pierna ${side === 'L' ? 'izquierda' : 'derecha'}</p>` + K.coils.map(c => {
      const cs = E.coilSpec(c.id, variant), used = other === c.id;
      return `<button type="button" data-coil="${c.id}" ${used ? 'disabled' : ''}>${c.id === 'cX' ? 'X · sin rótulo' : `${c.N} espiras · ${String(cs.Imax).replace('.', ',')} A máx`}${st.damage.coils[c.id] ? ' · quemada' : ''}${used ? ' · en uso' : ''}</button>`;
    }).join('') + `<button type="button" data-coil="">Retirar bobina</button>`;
    pop.hidden = false;
    pop.style.left = Math.max(4, r.left - wr.left + $('benchWrap').scrollLeft) + 'px'; pop.style.top = (r.bottom - wr.top + 6) + 'px';
    pop.onclick = (e) => {
      const b = e.target.closest('[data-coil]'); if (!b) return;
      const id = b.dataset.coil || null, tp = side === 'L' ? 'tl' : 'tr', n0 = st.wires.length;
      st.wires = st.wires.filter(w => !w.a.startsWith(tp + '.') && !w.b.startsWith(tp + '.'));
      st.tx[side] = id; pop.hidden = true; renderAll(); changed();
      if (n0 !== st.wires.length) opts.toast && opts.toast(`Se desconectaron ${n0 - st.wires.length} cables de la bobina que retiraste.`);
    };
  }
  function action(act, el) {
    if (act === 'power') {
      st.supply.on = !st.supply.on;
      if (st.supply.on && st.supply.knob > 0.03) log('seguridad', `Encendiste la fuente con la perilla en ${(st.supply.knob * 10).toFixed(1)}. Enciende siempre con la perilla en 0.`, 'onknob');
      log('info', st.supply.on ? 'Fuente encendida.' : 'Fuente apagada.', 'pw' + Date.now());
      renderAll(); changed(); return;
    }
    if (act === 'knob+') return setKnob(st.supply.knob + 0.002);
    if (act === 'knob-') return setKnob(st.supply.knob - 0.002);
    if (act === 'fuse') {
      if (st.supply.fuseOk) { opts.toast && opts.toast('El fusible de 3,15 A está en buen estado.'); return; }
      if (st.supply.on) { opts.toast && opts.toast('Apaga la fuente antes de cambiar el fusible.'); return; }
      st.supply.fuseOk = true; st.repairs++; log('info', 'Reemplazaste el fusible de la fuente. Antes de volver a encender, encuentra la causa.', 'rf' + Date.now()); renderAll(); changed(); return;
    }
    if (act === 'yoke') {
      const order = ['apretado', 'flojo', 'retirado'], next = order[(order.indexOf(st.tx.yoke) + 1) % 3];
      st.tx.yoke = next;
      if (st.supply.on && st.supply.knob > 0.01) log('info', `Cambiaste el yugo a «${next}» con el transformador energizado: observa I₁ y V₂.`, 'yk' + next);
      renderAll(); changed(); return;
    }
    if (act === 'coilL' || act === 'coilR') return coilMenu(act.slice(-1), el);
    if (act === 'load') { st.load.idx = (st.load.idx + 1) % K.loads.length; renderAll(); changed(); return; }
    if (act === 'loadsw') { st.load.on = !st.load.on; renderAll(); changed(); return; }
    if (act === 'ir') {
      const parts = [];
      ['L', 'R'].forEach(sd => { const id = st.tx[sd]; if (id) parts.push(`bobina ${sd === 'L' ? 'izq.' : 'der.'} ${T('coil:' + id).toFixed(0)} °C`); });
      parts.push(`carga ${T('load:' + st.load.idx).toFixed(0)} °C`, `shunt ${T('shunt').toFixed(0)} °C`);
      $('irTxt').textContent = ''; opts.toast && opts.toast('Termómetro IR: ' + parts.join(' · ')); return;
    }
    let mm = act.match(/^hold(\d)$/);
    if (mm) { const i = +mm[1], d = st.dmm[i]; d.hold = !d.hold; sim.held[i] = d.hold ? sim.disp[i] : null; renderDynamic(); renderReadings(); return; }
    mm = act.match(/^fuses(\d)$/);
    if (mm) {
      const i = +mm[1], n = i + 1, d = st.dmm[i];
      if (st.wires.some(w => w.a.startsWith(`d${n}.`) || w.b.startsWith(`d${n}.`))) { opts.toast && opts.toast(`Para abrir el DMM ${n} primero desconecta sus cables.`); return; }
      const bad = [!d.fuseMa && 'mA (630 mA)', !d.fuseA && '10 A'].filter(Boolean);
      if (!bad.length) { opts.toast && opts.toast(`DMM ${n}: los dos fusibles están bien.`); return; }
      d.fuseMa = d.fuseA = true; st.repairs++; log('info', `Reemplazaste el fusible ${bad.join(' y ')} del DMM ${n}.`, 'rdmm' + Date.now()); changed(); return;
    }
    mm = act.match(/^sel(\d):(.+)$/);
    if (mm) {
      const i = +mm[1], d = st.dmm[i], v = mm[2];
      d.sel = v; d.hold = false; sim.held[i] = null; sim.disp[i] = null;
      renderAll(); changed(); return;
    }
  }
  let saveTimer = null;
  function changed(soft) { clearTimeout(saveTimer); saveTimer = setTimeout(() => opts.onChange && opts.onChange(), soft ? 600 : 50); }
  function setHint(t) { const h = $('benchHint'); if (h) h.textContent = t || 'Toca un borne y luego otro para tender un cable. Toca un cable para seleccionarlo y quitarlo.'; }

  function bindEvents() {
    const svg = $('benchSvg');
    let drag = null;
    svg.addEventListener('pointerdown', (e) => {
      const k = e.target.closest('[data-act="knob"]');
      if (k) { drag = { y: e.clientY, x: e.clientX, v: st.supply.knob }; svg.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    svg.addEventListener('pointermove', (e) => {
      if (drag) { const dv = ((e.clientX - drag.x) - (e.clientY - drag.y)) / 600; setKnob(drag.v + dv); return; }
      if (sim.pending) { const p = svgPoint(e), A = TERMS[sim.pending]; $('rubber').setAttribute('d', `M${A.x} ${A.y}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`); $('rubber').setAttribute('stroke', WIRE_COLORS[sim.color]); }
    });
    svg.addEventListener('pointerup', () => { drag = null; });
    svg.addEventListener('wheel', (e) => { if (e.target.closest('[data-act="knob"]')) { e.preventDefault(); setKnob(st.supply.knob - Math.sign(e.deltaY) * 0.004); } }, { passive: false });
    svg.addEventListener('click', (e) => {
      $('benchPop').hidden = true;
      const t = e.target.closest('[data-term]'); if (t) { clickTerm(t.dataset.term); return; }
      const w = e.target.closest('[data-wire]');
      if (w) { const id = +w.dataset.wire; sim.selWire = sim.selWire === id ? null : id; sim.pending = null; renderWires(); renderToolbar(); const wr = st.wires.find(x => x.id === id); if (wr && sim.selWire) setHint(`Cable seleccionado: ${TERMS[wr.a].label} → ${TERMS[wr.b].label}. Pulsa «Quitar cable» o la tecla Supr.`); return; }
      const a = e.target.closest('[data-act]'); if (a && a.dataset.act !== 'knob') { action(a.dataset.act, a); return; }
      if (!a && sim.pending) { sim.pending = null; $('rubber').setAttribute('d', ''); renderWires(); setHint(); }
      if (!a && sim.selWire) { sim.selWire = null; renderWires(); renderToolbar(); setHint(); }
    });
    svg.addEventListener('keydown', (e) => {
      const t = e.target.closest('[data-term]'), a = e.target.closest('[data-act]');
      if ((e.key === 'Enter' || e.key === ' ') && (t || a)) { e.preventDefault(); if (t) clickTerm(t.dataset.term); else action(a.dataset.act, a); }
      if (a && a.dataset.act === 'knob') {
        const step = e.shiftKey ? 0.02 : 0.002;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setKnob(st.supply.knob + step); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setKnob(st.supply.knob - step); }
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sim.selWire && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); removeWire(sim.selWire); setHint(); }
      if (e.key === 'Escape') { sim.pending = null; $('rubber') && $('rubber').setAttribute('d', ''); $('benchPop').hidden = true; renderWires(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#benchPop') && !e.target.closest('[data-act^="coil"]')) { const p = $('benchPop'); if (p) p.hidden = true; } });
  }

  /* ---------- Barra de herramientas, lecturas y bitácora (HTML) ---------- */
  function renderToolbar() {
    const tb = $('benchTools'); if (!tb) return;
    $('wireColors').innerHTML = Object.entries(WIRE_COLORS).map(([k, c]) => `<button type="button" class="chip-c${sim.color === k ? ' on' : ''}" data-color="${k}" aria-label="Cable ${k}" aria-pressed="${sim.color === k}" style="--c:${c}"></button>`).join('');
    $('delWire').disabled = !sim.selWire;
    $('benchNo').value = String(st.bench);
    $('stageSel').value = st.stage;
    const dmg = [];
    if (!st.supply.fuseOk) dmg.push('fusible de la fuente');
    st.dmm.forEach((d, i) => { if (!d.fuseMa || !d.fuseA) dmg.push(`fusible del DMM ${i + 1}`); });
    Object.keys(st.damage.coils).forEach(id => st.damage.coils[id] && dmg.push(`bobina ${E.coilSpec(id, variant).label}`));
    Object.keys(st.damage.load).forEach(i => st.damage.load[i] && dmg.push(`resistencia de ${fmtR(K.loads[i])}`));
    if (st.damage.shunt) dmg.push('shunt');
    $('dmgNote').hidden = !dmg.length;
    $('dmgList').textContent = dmg.join(', ');
  }
  let readSig = '';
  function renderReadings() {
    const box = $('readBody'); if (!box || !sim.meas) return;
    const an = analyze();
    const sig = st.dmm.map(d => d.role + d.sel).join('|') + st.wmRole;
    if (sig !== readSig) {
      readSig = sig;
      const sel = (key, cur, list, label) => `<select data-role="${key}" aria-label="${label}"><option value="auto">Auto</option>${list.map(r => `<option value="${r}" ${cur === r ? 'selected' : ''}>${ROLE_TXT[r]}</option>`).join('')}</select>`;
      box.innerHTML = st.dmm.map((d, i) => `<tr><th scope="row">DMM ${i + 1}</th><td>${esc(d.sel)}</td><td class="num big" id="rv${i}"></td><td class="num muted" id="ra${i}"></td><td>${sel(i, d.role, ['V1', 'V2', 'I1', 'I2', 'R', 'otra'], `Magnitud que registra el DMM ${i + 1}`)} <span class="muted small" id="rr${i}"></span></td></tr>`).join('') +
        `<tr><th scope="row">Analizador</th><td>U · I · P</td><td class="num big" id="rvw"></td><td class="num muted">P ± 1,5 % + 3 d</td><td>${sel('wm', st.wmRole, ['P1', 'P2', 'otra'], 'Magnitud que registra el analizador')} <span class="muted small" id="rrw"></span></td></tr>` +
        `<tr><th scope="row">Voltímetro de panel</th><td>V~ clase 2,5</td><td class="num big" id="rvp"></td><td class="num muted">± 0,75 V</td><td class="muted small">solo orientativo</td></tr>`;
    }
    st.dmm.forEach((d, i) => {
      const rd = sim.disp[i], tx = rd ? E.dmmText(rd) : null;
      $('rv' + i).innerHTML = esc(d.sel === 'OFF' ? 'apagado' : rd ? (rd.ol ? 'OL' : `${tx.txt} ${tx.unit}`) : '—') + (d.hold ? ' <span class="tag">HOLD</span>' : '');
      $('ra' + i).textContent = rd && !rd.ol ? `± ${fmtNum(rd.limit, rd.range)}` : '';
      const role = an ? an.roles[i] : null;
      $('rr' + i).textContent = d.role === 'auto' && role ? '→ ' + ROLE_TXT[role] : '';
    });
    const w = sim.wmDisp, live = st.supply.on && st.supply.fuseOk;
    $('rvw').textContent = w && live ? `${w.V.toFixed(2)} V · ${w.I.toFixed(3)} A · ${w.P.toFixed(3)} W · FP ${w.pf === null ? '—' : w.pf.toFixed(3)}` : 'sin alimentación';
    $('rrw').textContent = st.wmRole === 'auto' && an && an.wmRole ? '→ ' + ROLE_TXT[an.wmRole] : '';
    $('rvp').textContent = `≈ ${live ? (Math.round(sim.needle * 2) / 2).toFixed(1) : '0'} V`;
    $('readCfg').textContent = an ? `${an.prim ? `Primario: bobina ${an.prim.coil.label}` : 'Sin primario'}${an.sec ? ` · secundario: bobina ${an.sec.coil.label} en ${an.secState}${an.loadInSec ? ' (' + fmtR(K.loads[st.load.idx]) + ')' : ''}` : ''} · yugo ${st.tx.yoke}` : '';
  }
  function fmtNum(x, r) { const u = r[2]; let k = 1; if (u === 'mV' || u === 'mA') k = 1e3; else if (u === 'kΩ') k = 1e-3; else if (u === 'MΩ') k = 1e-6; const dec = Math.max(0, Math.round(-Math.log10(r[1] * k))); return (x * k).toFixed(dec) + ' ' + u; }
  function renderLog() {
    const ul = $('benchLog'); if (!ul) return;
    const items = sim.log.slice(-60).reverse();
    ul.innerHTML = items.length ? items.map(l => `<li class="log-${l.type}"><span class="mono">${l.t}</span> <span class="log-k">${l.type}</span> ${esc(l.msg)}</li>`).join('') : '<li class="muted">Sin eventos todavía.</li>';
    const nS = sim.log.filter(l => l.type === 'seguridad').length, nD = sim.log.filter(l => l.type === 'daño').length;
    const c = $('logCount'); if (c) c.textContent = `${nS} avisos de seguridad · ${nD} daños`;
  }
  function bindHtml() {
    $('wireColors').addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (!b) return; sim.color = b.dataset.color; renderToolbar(); });
    $('delWire').addEventListener('click', () => { if (sim.selWire) { removeWire(sim.selWire); setHint(); } });
    let armed = 0;
    $('delAll').addEventListener('click', () => {
      if (!st.wires.length) return;
      if (Date.now() - armed > 3000) { armed = Date.now(); $('delAll').textContent = '¿Quitar todos? Toca de nuevo'; setTimeout(() => { $('delAll').textContent = 'Quitar todos los cables'; }, 3000); return; }
      armed = 0; $('delAll').textContent = 'Quitar todos los cables';
      energizedChange('Desconectaste todo'); st.wires = []; sim.selWire = null; sim.pending = null; renderWires(); renderToolbar(); changed();
    });
    $('benchNo').addEventListener('change', (e) => { setBench(+e.target.value); changed(); });
    $('stageSel').addEventListener('change', (e) => { st.stage = e.target.value; changed(); opts.onStage && opts.onStage(st.stage); });
    $('btnReview').addEventListener('click', () => {
      const r = review();
      $('reviewOut').hidden = false;
      $('reviewOut').innerHTML = `<p class="rv-h">Revisión del montaje · ${esc(STAGES[st.stage])}</p><ul>${r.map(t => `<li class="rv-${t.lvl}"><b>${{ error: 'Corrige', aviso: 'Revisa', info: 'Nota', ok: 'Listo' }[t.lvl]}.</b> ${esc(t.msg)}</li>`).join('')}</ul>`;
      if (r.some(t => t.lvl === 'error')) log('info', `Revisión del montaje con ${r.filter(t => t.lvl === 'error').length} errores.`, 'rev' + Date.now());
    });
    $('btnDemo').addEventListener('click', () => {
      const b = $('btnDemo');
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Reemplaza tus cables: toca de nuevo'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Montaje de demostración'; }, 3500); return; }
      b.dataset.armed = ''; b.textContent = 'Montaje de demostración'; demo(st.stage);
    });
    $('btnRepair').addEventListener('click', () => {
      if (st.supply.on) { opts.toast && opts.toast('Apaga la fuente antes de reponer equipo.'); return; }
      st.damage = { coils: {}, load: {}, shunt: false }; st.supply.fuseOk = true; st.dmm.forEach(d => { d.fuseMa = d.fuseA = true; }); st.repairs++;
      for (const k of Object.keys(sim.temp)) sim.temp[k] = K.Tamb;
      log('info', 'El laboratorista repuso el equipo dañado.', 'rep' + Date.now()); renderAll(); changed();
    });
    $('readBody').addEventListener('change', (e) => {
      const s = e.target.closest('[data-role]'); if (!s) return;
      if (s.dataset.role === 'wm') st.wmRole = s.value; else st.dmm[+s.dataset.role].role = s.value;
      renderReadings(); changed();
    });
    /* controles del osciloscopio */
    const sc = $('scopeCtl');
    const vOpts = VDIV.map(v => `<option value="${v}">${fmtV(v)}/div</option>`).join(''), tOpts = TDIV.map(t => `<option value="${t}">${fmtT(t)}/div</option>`).join('');
    sc.innerHTML = [0, 1].map(i => `<fieldset class="sc-ch sc-ch${i + 1}"><legend>CH${i + 1}</legend>
      <label class="check"><input type="checkbox" id="scOn${i}"> Activo</label>
      <label>Escala<select id="scV${i}">${vOpts}</select></label>
      <label>Acoplamiento<select id="scC${i}"><option>DC</option><option>AC</option><option>GND</option></select></label>
      <label>Sonda<select id="scP${i}"><option value="1">×1</option><option value="10">×10</option></select></label>
      <label>Posición<input type="range" id="scPos${i}" min="-4" max="4" step="0.2"></label></fieldset>`).join('') +
      `<fieldset class="sc-ch"><legend>Horizontal y disparo</legend><label>Base de tiempo<select id="scT">${tOpts}</select></label><label>Fuente de disparo<select id="scTr"><option value="0">CH1</option><option value="1">CH2</option></select></label><p class="small muted">Disparo en flanco de subida, nivel 0 V.</p></fieldset>`;
    const sync = () => {
      const s = st.scope;
      [0, 1].forEach(i => { $('scOn' + i).checked = s.ch[i].on; $('scV' + i).value = String(s.ch[i].vdiv); $('scC' + i).value = s.ch[i].cpl; $('scP' + i).value = String(s.ch[i].probe); $('scPos' + i).value = String(s.ch[i].pos); });
      $('scT').value = String(s.tdiv); $('scTr').value = String(s.trig);
    };
    sync(); bench.syncScope = sync;
    sc.addEventListener('input', (e) => {
      const s = st.scope, id = e.target.id, i = +id.slice(-1);
      if (id.startsWith('scOn')) s.ch[i].on = e.target.checked;
      else if (id.startsWith('scV')) s.ch[i].vdiv = +e.target.value;
      else if (id.startsWith('scC')) s.ch[i].cpl = e.target.value;
      else if (id.startsWith('scP')) s.ch[i].probe = +e.target.value;
      else if (id.startsWith('scPos')) s.ch[i].pos = +e.target.value;
      else if (id === 'scT') s.tdiv = +e.target.value;
      else if (id === 'scTr') s.trig = +e.target.value;
      changed(true);
    });
  }

  function setBench(n) {
    st.bench = Math.max(1, Math.min(24, n | 0)); variant = E.benchVariant(st.bench);
    renderAll();
  }

  /* ---------- API ---------- */
  let timer = null, raf = null;
  const bench = {
    STAGES, ROLE_TXT, TERMS,
    init(o) {
      opts = o || {};
      renderStatic(); bindEvents(); bindHtml(); setHint(); renderLog();
      step(0.25);
      timer = setInterval(() => { if (!document.hidden) step(0.25); }, 250);
      const loop = () => { if (!document.hidden) drawScope(); raf = setTimeout(() => requestAnimationFrame(loop), 90); };
      loop();
    },
    getState: () => JSON.parse(JSON.stringify(st)),
    setState(s) {
      if (!s || s.version !== 2) return;
      const d = defaultState();
      st = { ...d, ...s, supply: { ...d.supply, ...s.supply }, tx: { ...d.tx, ...s.tx }, load: { ...d.load, ...s.load }, scope: { ...d.scope, ...s.scope, ch: (s.scope && s.scope.ch) || d.scope.ch }, damage: { ...d.damage, ...s.damage } };
      st.dmm = d.dmm.map((x, i) => ({ ...x, ...(s.dmm && s.dmm[i]) }));
      st.wires = (s.wires || []).filter(w => TERMS[w.a] && TERMS[w.b]);
      st.supply.on = false;
      variant = E.benchVariant(st.bench); sim.disp = [null, null, null]; sim.held = [null, null, null];
      if (bench.syncScope) bench.syncScope();
      renderAll();
    },
    reset() { const b = st.bench; st = defaultState(); st.bench = b; variant = E.benchVariant(b); if (bench.syncScope) bench.syncScope(); renderAll(); changed(); },
    capture, analyze, review,
    getLog: () => sim.log.slice(),
    setLog(l) { sim.log = Array.isArray(l) ? l.slice(-300) : []; renderLog(); },
    variant: () => variant,
    stage: () => st.stage,
    setStage(s) { st.stage = s; renderToolbar(); },
    snapshotSVG() { const svg = $('benchSvg'); return svg ? svg.outerHTML : ''; },
    elapsed: () => Math.floor((Date.now() - sim.start) / 1000),
    refresh() { renderAll(); drawScope(); }
  };
  root.TLBench = bench;
})(window);
