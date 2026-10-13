/* Fisiología: simulador de frecuencia cardiaca/lactato, prueba de reacción y split-step. */
MS.Physio = (function () {
  const { U, Chart, Player } = MS;
  const PRE = { club: { age: 30, rally: 14, rest: 10, int: 85, n: 18, hrRest: 65 }, elite: { age: 26, rally: 19, rest: 8, int: 95, n: 22, hrRest: 52 } };
  let preset = 'club';

  /* ---------- frecuencia cardiaca ---------- */
  function simHR(p) {
    const HRmax = 208 - 0.7 * p.age, HRr = p.hrRest;
    const rng = U.rng(17);
    const out = []; let t = 0, HR = HRr + 0.45 * (HRmax - HRr), L = 1.4;
    const I = p.int / 100;
    const dt = 0.5;
    let above = 0, sum = 0, cnt = 0, Lmax = L, drops = [];
    for (let k = 0; k < p.n; k++) {
      const r = p.rally * (0.7 + 0.6 * rng()), s = p.rest * (0.8 + 0.4 * rng());
      const hrTarget = HRr + (HRmax - HRr) * Math.min(1, I * 1.02);
      for (let tt = 0; tt < r; tt += dt) {
        HR += ((hrTarget - HR) / 12) * dt;
        L += (0.085 * Math.max(0, (I - 0.7) / 0.3) - (L - 1) / 150) * dt;
        const tau = tt;
        const pc = 0.62 * Math.exp(-tau / 7), gly = (1 - Math.exp(-tau / 7)) * 0.5 * Math.exp(-tau / 45) + 0.1 * I;
        out.push({ t, HR, L, rally: true, pc: pc * I, gly: gly * I, aer: Math.max(0.08, 1 - pc - gly) * I });
        if (HR > 0.9 * HRmax) above += dt; sum += HR; cnt++; Lmax = Math.max(Lmax, L); t += dt;
      }
      const hrStart = HR;
      const restT = HRr + (HRmax - HRr) * 0.42;
      for (let tt = 0; tt < s; tt += dt) {
        HR += ((restT - HR) / 30) * dt;
        L += (-(L - 1) / 150) * dt;
        out.push({ t, HR, L, rally: false, pc: 0, gly: 0, aer: 0.35 });
        if (HR > 0.9 * HRmax) above += dt; sum += HR; cnt++; t += dt;
      }
      drops.push(hrStart - HR);
    }
    return { out, HRmax, HRr, T: t, mean: sum / cnt, above, Lmax, Lend: L, drop: drops.reduce((a, b) => a + b, 0) / drops.length };
  }
  function drawHR() {
    const p = readHR();
    const R = simHR(p);
    const c = Chart.setup(U.$('#hrCanvas'));
    const F = Chart.frame(c, { x0: 0, x1: R.T, y0: 50, y1: Math.ceil(R.HRmax / 10) * 10 + 10, yticks: [60, 80, 100, 120, 140, 160, 180, 200].filter((v) => v <= R.HRmax + 10), xticks: Array.from({ length: Math.floor(R.T / 60) + 1 }, (_, i) => i * 60), fx: (v) => v / 60 + ' min', ylabel: 'latidos por minuto', pad: { l: 50, r: 40 } });
    const { ctx } = F;
    /* zonas */
    const Z = [[0.6, 0.7, '#9ecbe8'], [0.7, 0.8, '#a6d8b4'], [0.8, 0.9, '#f3d18a'], [0.9, 1.0, '#f2a48a']];
    for (const [a, b, col] of Z) { ctx.fillStyle = col; ctx.globalAlpha = 0.22; ctx.fillRect(F.L, F.Y(b * R.HRmax), F.R - F.L, F.Y(a * R.HRmax) - F.Y(b * R.HRmax)); ctx.globalAlpha = 1; ctx.fillStyle = F.tok.ink3; ctx.font = '10px "Source Sans 3", Arial'; ctx.textAlign = 'left'; ctx.fillText(Math.round(a * 100) + '–' + Math.round(b * 100) + ' %', F.R + 3, F.Y((a + b) / 2 * R.HRmax)); }
    /* puntos (sombreado) */
    ctx.fillStyle = F.tok.brand; ctx.globalAlpha = 0.07;
    let s0 = null; for (const q of R.out) { if (q.rally && s0 == null) s0 = q.t; if (!q.rally && s0 != null) { ctx.fillRect(F.X(s0), F.T, F.X(q.t) - F.X(s0), F.B - F.T); s0 = null; } }
    ctx.globalAlpha = 1;
    Chart.line(F, R.out.map((q) => [q.t, q.HR]), F.tok.red, 2.2);
    /* lactato (eje derecho reescalado) */
    const ly = (L) => 50 + (L / 12) * (R.HRmax + 10 - 50);
    Chart.line(F, R.out.map((q) => [q.t, ly(q.L)]), F.tok.brand, 1.8, [5, 4]);
    ctx.fillStyle = F.tok.brand; ctx.font = '600 11px "Source Sans 3", Arial'; ctx.textAlign = 'left';
    ctx.fillText('lactato (escala 0–12 mmol/L)', F.L + 6, F.T + 10);
    ctx.fillStyle = F.tok.red; ctx.fillText('frecuencia cardiaca', F.L + 6, F.T + 24);
    /* energía */
    const c2 = Chart.setup(U.$('#enCanvas'));
    const F2 = Chart.frame(c2, { x0: 0, x1: R.T, y0: 0, y1: 1, yticks: [0, 0.5, 1], fy: (v) => Math.round(v * 100) + '%', xticks: [], pad: { l: 50, r: 40, b: 14 } });
    const stack = R.out.map((q) => { const tot = q.pc + q.gly + q.aer || 1; return [q.t, q.pc / tot, (q.pc + q.gly) / tot]; });
    const cx = F2.ctx;
    const band = (fn0, fn1, col) => { cx.fillStyle = col; cx.globalAlpha = 0.75; cx.beginPath(); stack.forEach((s, i) => (i ? cx.lineTo(F2.X(s[0]), F2.Y(fn1(s))) : cx.moveTo(F2.X(s[0]), F2.Y(fn1(s))))); for (let i = stack.length - 1; i >= 0; i--) cx.lineTo(F2.X(stack[i][0]), F2.Y(fn0(stack[i]))); cx.closePath(); cx.fill(); cx.globalAlpha = 1; };
    band(() => 0, (s) => s[1], '#e8a33d'); band((s) => s[1], (s) => s[2], '#d4442e'); band((s) => s[2], () => 1, '#3d8fc9');
    const lg = U.$('#enCanvas');
    lg.setAttribute('aria-label', 'Reparto estimado de energía: fosfágenos en naranja, glucolítico en rojo, oxidativo en azul');
    /* lecturas */
    const out = U.$('#hrOut'); out.innerHTML = '';
    const tiles = [[U.num(R.mean / R.HRmax * 100, 0) + ' %', 'FC media / FC máx'], [U.num(R.HRmax, 0) + ' lpm', 'FC máxima estimada'], [U.num(R.above / R.T * 100, 0) + ' %', 'tiempo sobre 90 %'], [U.num(R.Lmax, 1) + ' mmol/L', 'lactato pico'], [U.num(R.T / 60, 1) + ' min', 'duración del juego'], [U.num(R.drop, 0) + ' lpm', 'baja media en cada pausa']];
    for (const [b, s] of tiles) out.append(U.h('div', null, U.h('b', null, b), U.h('span', null, s)));
    const v = U.$('#hrVerdict');
    const m = R.mean / R.HRmax;
    v.className = 'verdict ' + (m > 0.88 ? 'bad' : m > 0.8 ? 'warn' : 'ok');
    v.textContent = m > 0.88 ? 'Intensidad de élite: casi todo el juego por encima del 85–90 %. Las pausas no alcanzan para recuperar; la base aeróbica decide quién resiste.' : m > 0.8 ? 'Zona típica del jugador de club (80–85 %): aeróbico de alta intensidad con picos anaeróbicos.' : 'Intensidad moderada: puntos cortos o pausas largas permiten recuperar entre esfuerzos.';
  }
  function readHR() { return { age: +U.$('#hrAge').value, rally: +U.$('#hrRally').value, rest: +U.$('#hrRest').value, int: +U.$('#hrInt').value, n: +U.$('#hrN').value, hrRest: PRE[preset].hrRest }; }
  function setPreset(k) {
    preset = k; const p = PRE[k];
    U.$('#hrAge').value = p.age; U.$('#hrRally').value = p.rally; U.$('#hrRest').value = p.rest; U.$('#hrInt').value = p.int; U.$('#hrN').value = p.n;
    for (const b of U.$$('#hrPreset button')) b.setAttribute('aria-pressed', String(b.dataset.p === k));
    labels(); drawHR();
  }
  function labels() {
    U.$('#hrAgeL').textContent = U.$('#hrAge').value + ' años'; U.$('#hrRallyL').textContent = U.$('#hrRally').value + ' s';
    U.$('#hrRestL').textContent = U.$('#hrRest').value + ' s'; U.$('#hrIntL').textContent = U.$('#hrInt').value + ' %'; U.$('#hrNL').textContent = U.$('#hrN').value;
  }

  /* ---------- prueba de reacción ---------- */
  const POS = { 1: [[50, 50]], 2: [[20, 22], [80, 22]], 6: [[18, 16], [82, 16], [12, 54], [88, 54], [18, 86], [82, 86]] };
  const RX = { n: 1, state: 'idle', trials: [], shownAt: 0, timer: 0, results: {} };
  function rxMsg(t) { const pad = U.$('#rxPad'); pad.innerHTML = ''; pad.append(U.h('div', { class: 'msg' }, t)); }
  function rxNext() {
    RX.state = 'wait';
    rxMsg('Atento…');
    clearTimeout(RX.timer);
    RX.timer = setTimeout(() => {
      const P = POS[RX.n], k = Math.floor(Math.random() * P.length);
      const pad = U.$('#rxPad'); pad.innerHTML = '';
      const tg = U.h('div', { class: 'tgt', style: { left: P[k][0] + '%', top: P[k][1] + '%' } }, '●');
      pad.append(tg);
      RX.state = 'show'; RX.shownAt = performance.now(); RX.target = tg;
    }, 900 + Math.random() * 1500);
  }
  function rxTap(e) {
    if (RX.state === 'idle' || RX.state === 'done') { RX.trials = []; rxNext(); return; }
    if (RX.state === 'wait') { clearTimeout(RX.timer); rxMsg('¡Demasiado pronto! Toca para seguir.'); RX.state = 'pause'; return; }
    if (RX.state === 'pause') { rxNext(); return; }
    if (RX.state === 'show') {
      const hit = e.target === RX.target || RX.target.contains(e.target);
      if (!hit) { rxMsg('Zona equivocada: toca para repetir el intento.'); RX.state = 'pause'; return; }
      const rt = performance.now() - RX.shownAt;
      RX.trials.push(rt);
      if (RX.trials.length >= 10) { RX.state = 'done'; finishRx(); return; }
      rxMsg(Math.round(rt) + ' ms · intento ' + RX.trials.length + ' de 10');
      RX.state = 'pause';
      setTimeout(() => { if (RX.state === 'pause') rxNext(); }, 650);
    }
  }
  function finishRx() {
    const a = RX.trials.slice().sort((x, y) => x - y);
    const med = a[Math.floor(a.length / 2)], best = a[0], mean = a.reduce((s, x) => s + x, 0) / a.length;
    RX.results[RX.n] = { med, best, mean };
    rxMsg(`Mediana ${Math.round(med)} ms · mejor ${Math.round(best)} ms. Toca para repetir.`);
    renderRx();
  }
  function renderRx() {
    const out = U.$('#rxOut'); out.innerHTML = '';
    for (const n of [1, 2, 6]) {
      const r = RX.results[n];
      out.append(U.h('div', null, U.h('b', null, r ? Math.round(r.med) + ' ms' : '–'), U.h('span', null, n + (n === 1 ? ' zona (simple)' : ' zonas (elección)'))));
    }
    const ks = Object.keys(RX.results).map(Number);
    if (ks.length >= 2) {
      const xs = ks.map((n) => Math.log2(n + 1)), ys = ks.map((n) => RX.results[n].med);
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, y) => s + y, 0) / ys.length;
      let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
      const b = den ? num / den : 0, a = my - b * mx;
      out.append(U.h('div', { style: { gridColumn: '1 / -1' } }, U.h('b', null, `TR ≈ ${Math.round(a)} + ${Math.round(b)} · log₂(n + 1) ms`), U.h('span', null, 'Tu ley de Hick: cada duplicación de opciones suma ' + Math.round(b) + ' ms')));
    }
  }

  /* ---------- split-step ---------- */
  function splitModel(D) {
    const RT = 220, lv = Player.LEVELS.avanzado, move = Player.tMin(2.8, lv) * 1000;
    const g = D < -30 ? 70 * Math.exp(-(((D + 30) / 130) ** 2)) : D > 20 ? 70 * Math.exp(-(((D - 20) / 70) ** 2)) : 70;
    const air = Math.max(0, D + 40 - RT);
    const start = Math.max(RT, D + 40);
    return { total: start - g + move, g, air, start, move };
  }
  function drawSplit() {
    const D = +U.$('#spD').value;
    U.$('#spL').textContent = (D > 0 ? '+' : '') + D + ' ms';
    const c = Chart.setup(U.$('#spCanvas'));
    const pts = []; for (let d = -400; d <= 300; d += 5) pts.push([d, splitModel(d).total]);
    const ys = pts.map((p) => p[1]); const y0 = Math.floor(Math.min(...ys) / 50) * 50 - 20, y1 = Math.ceil(Math.max(...ys) / 50) * 50 + 20;
    const F = Chart.frame(c, { x0: -400, x1: 300, y0, y1, xticks: [-400, -200, 0, 200], fx: (v) => (v > 0 ? '+' : '') + v, yticks: [y0 + 20, Math.round((y0 + y1) / 2 / 10) * 10, y1 - 20], fy: (v) => Math.round(v) + '', xlabel: 'aterrizaje respecto del golpe rival (ms)', ylabel: 'ms hasta la estocada', pad: { l: 52 } });
    F.ctx.fillStyle = F.tok.ok; F.ctx.globalAlpha = 0.12; F.ctx.fillRect(F.X(-40), F.T, F.X(30) - F.X(-40), F.B - F.T); F.ctx.globalAlpha = 1;
    Chart.line(F, pts, F.tok.brand, 2.4);
    const m = splitModel(D);
    Chart.dot(F, D, m.total, F.tok.red, 5, Math.round(m.total) + ' ms');
    const out = U.$('#spOut'); out.innerHTML = '';
    const none = splitModel(-400);
    for (const [b, s] of [[Math.round(m.total) + ' ms', 'hasta la estocada'], [Math.round(m.g) + ' ms', 'ganancia elástica'], [Math.round(m.air) + ' ms', 'perdidos en el aire'], [(none.total - m.total >= 0 ? '−' : '+') + Math.abs(Math.round(none.total - m.total)) + ' ms', 'frente a no hacer split-step']]) out.append(U.h('div', null, U.h('b', null, b), U.h('span', null, s)));
  }

  function drawAll() { drawHR(); drawSplit(); }
  function init() {
    for (const b of U.$$('#hrPreset button')) b.addEventListener('click', () => setPreset(b.dataset.p));
    for (const id of ['#hrAge', '#hrRally', '#hrRest', '#hrInt', '#hrN']) U.$(id).addEventListener('input', () => { labels(); drawHR(); });
    U.$('#spD').addEventListener('input', drawSplit);
    const pad = U.$('#rxPad');
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); rxTap(e); });
    pad.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (RX.state === 'show') rxTap({ target: RX.target }); else rxTap(e); } });
    for (const b of U.$$('#rxN button')) b.addEventListener('click', () => { RX.n = +b.dataset.n; RX.state = 'idle'; clearTimeout(RX.timer); for (const c of U.$$('#rxN button')) c.setAttribute('aria-pressed', String(c === b)); rxMsg('Toca aquí para empezar (10 intentos)'); });
    renderRx(); labels();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { if (MS.App.current === 'fisiologia') drawAll(); }).observe(U.$('#phHR'));
  }
  MS.App.on('fisiologia', { init, show: () => setTimeout(drawAll, 20), theme: drawAll });
  return { simHR, splitModel };
})();
