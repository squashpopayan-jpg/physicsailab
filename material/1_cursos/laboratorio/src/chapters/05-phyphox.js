/* Capítulo 5 · phyphox y el análisis de video */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const el = MC.el;

  /* ---------- Generador de lo que "siente" el celular ---------- */
  function scene(kind, t) {
    const n = (s) => M.gauss(0, s);
    let acc = [0, 0, G], gyr = [0, 0, 0], mag = [-3.2, 26.5, -11.7], p = 822.0, snd = Math.abs(n(0.02));
    if (kind === 'mano') {
      const a = 0.12 * Math.sin(1.3 * t) + 0.05 * Math.sin(3.7 * t), b = 0.1 * Math.sin(0.9 * t + 1);
      acc = [G * Math.sin(b), G * Math.sin(a), G * Math.cos(a) * Math.cos(b)];
      gyr = [0.16 * Math.cos(1.3 * t) + 0.18 * Math.cos(3.7 * t), 0.09 * Math.cos(0.9 * t + 1), 0.05 * Math.sin(2 * t)];
      acc = acc.map((v) => v + n(0.08));
    } else if (kind === 'pendulo') {
      const Lp = 0.6, w0 = Math.sqrt(G / Lp), th0 = 0.35, gam = 0.03;
      const th = th0 * Math.exp(-gam * t) * Math.cos(w0 * t), om = -th0 * Math.exp(-gam * t) * w0 * Math.sin(w0 * t);
      acc = [0, G * Math.cos(th) + Lp * om * om, 0];
      gyr = [0, 0, om];
      mag = [26.5 * Math.sin(th), -11.7 * Math.cos(th), -26.5];
    } else if (kind === 'ascensor') {
      const tc = t % 16;
      const a = tc > 2 && tc < 3.5 ? 1.0 : tc > 8 && tc < 9.5 ? -1.0 : 0;
      const z = tc < 2 ? 0 : tc < 3.5 ? 0.5 * (tc - 2) ** 2 : tc < 8 ? 1.125 + 1.5 * (tc - 3.5) : tc < 9.5 ? 7.875 + 1.5 * (tc - 8) - 0.5 * (tc - 8) ** 2 : 9;
      acc = [0, 0, G + a];
      p = 822.0 - 0.0962 * z;
    } else if (kind === 'giro') {
      const w = 3.0, r = 0.04;
      acc = [0, -w * w * r, G];
      gyr = [0, 0, w];
      mag = [26.7 * Math.sin(w * t), 26.7 * Math.cos(w * t), -11.7];
    } else if (kind === 'aplausos') {
      const tc = t % 2;
      for (const t0 of [0.4, 0.9]) if (tc >= t0 && tc < t0 + 0.05) snd += 0.9 * Math.exp(-(tc - t0) / 0.012);
    }
    return { acc: acc.map((v) => v + n(0.012)), gyr: gyr.map((v) => v + n(0.002)), mag: mag.map((v) => v + n(0.3)), p: p + n(0.008), snd };
  }

  const EXPS = {
    accg: { name: 'Aceleración con g', group: 'Sensores sin procesar', cols: [['ax', 'Aceleración x', 'm/s^2'], ['ay', 'Aceleración y', 'm/s^2'], ['az', 'Aceleración z', 'm/s^2']], get: (s) => s.acc, tabs: ['Gráficas', 'Absoluto', 'Simple'] },
    acc: { name: 'Aceleración (sin g)', group: 'Sensores sin procesar', cols: [['ax', 'Aceleración lineal x', 'm/s^2'], ['ay', 'Aceleración lineal y', 'm/s^2'], ['az', 'Aceleración lineal z', 'm/s^2']], get: (s, k) => (k === 'pendulo' ? [0, s.acc[1] - G, 0] : [s.acc[0], s.acc[1], s.acc[2] - G]), tabs: ['Gráficas', 'Absoluto', 'Simple'] },
    gyr: { name: 'Giroscopio', group: 'Sensores sin procesar', cols: [['wx', 'Velocidad angular x', 'rad/s'], ['wy', 'Velocidad angular y', 'rad/s'], ['wz', 'Velocidad angular z', 'rad/s']], get: (s) => s.gyr, tabs: ['Gráficas', 'Absoluto', 'Simple'] },
    mag: { name: 'Magnetómetro', group: 'Sensores sin procesar', cols: [['bx', 'Campo magnético x', 'µT'], ['by', 'Campo magnético y', 'µT'], ['bz', 'Campo magnético z', 'µT']], get: (s) => s.mag, tabs: ['Gráficas', 'Absoluto', 'Simple'] },
    pres: { name: 'Presión', group: 'Sensores sin procesar', cols: [['p', 'Presión', 'hPa']], get: (s) => [s.p], tabs: ['Gráficas', 'Simple'] },
    crono: { name: 'Cronómetro acústico', group: 'Acústica', cols: [['amp', 'Amplitud', 'u.a.']], get: (s) => [s.snd], tabs: ['Cronómetro', 'Señal'] },
    pend: { name: 'Péndulo', group: 'Mecánica', cols: [['wz', 'Velocidad angular z', 'rad/s']], get: (s) => [s.gyr[2]], tabs: ['Resultados', 'Gráfica'] }
  };
  const FMTS = [
    ['xlsx', 'Excel'],
    ['comma', 'CSV (coma, punto decimal)'],
    ['tab', 'CSV (tabulador, punto decimal)'],
    ['semi', 'CSV (punto y coma, coma decimal)']
  ];

  MC.defineSim('phyphox-app', function (sim) {
    const box = el('div', 'sim-html row');
    sim.stage.append(box);
    const phone = el('div', 'phone-html');
    phone.innerHTML = '<div class="notch"></div><div class="scr"></div>';
    const scr = phone.querySelector('.scr');
    const side = el('div', 'pane');
    box.append(phone, side);
    const st = { screen: 'list', exp: null, tab: 0, running: false, data: null, timed: { delay: 3, dur: 5, phase: 'idle', t: 0, on: false }, remote: false, menu: false, dialog: null, fmt: 'comma', toast: '', toastT: 0, done: {} };
    const TASKS = [
      ['open', 'Abra el experimento «Aceleración con g».'],
      ['run', 'Inicie una medición con ▶ y deténgala después de unos segundos.'],
      ['timed', 'Haga una ejecución temporizada con 3 s de espera y 5 s de duración.'],
      ['remote', 'Permita el acceso remoto y mire la medición «desde el computador».'],
      ['export', 'Exporte los datos en el formato «punto y coma, coma decimal».'],
      ['pend', 'Ponga el celular como péndulo y lea el periodo en el experimento «Péndulo».']
    ];
    let canvas = null, pcCanvas = null, simT = 0;

    sim.group('¿Qué le pasa al celular?');
    sim.select('scn', { options: [['mesa', 'Quieto sobre la mesa'], ['mano', 'En la mano'], ['pendulo', 'Colgado como péndulo'], ['ascensor', 'En un ascensor'], ['giro', 'Girando sobre la mesa'], ['aplausos', 'Dos aplausos cada 2 s']], value: 'mesa' });
    sim.note('Cambie la situación mientras mide para ver cómo responde cada sensor.');

    const newData = () => { const E = EXPS[st.exp]; const d = { t: [] }; for (const c of E.cols) d[c[0]] = []; st.data = d; };
    const complete = (k) => { if (!st.done[k]) { st.done[k] = true; renderSide(); } };
    const toast = (s) => { st.toast = s; st.toastT = 2.5; render(); };

    function render() {
      let html = '';
      if (st.screen === 'list') {
        html += '<div class="app-bar px"><b>phyphox</b><span style="flex:1"></span><span style="opacity:.7">⋮</span></div><div class="app-body" style="gap:4px">';
        let g = null;
        for (const [k, E] of Object.entries(EXPS)) {
          if (E.group !== g) { g = E.group; html += `<div class="mini-label" style="margin:6px 0 0">${g}</div>`; }
          html += `<button class="app-btn" data-exp="${k}" style="text-align:left">${E.name}</button>`;
        }
        html += '</div>';
      } else {
        const E = EXPS[st.exp];
        const tw = st.timed.on ? (st.timed.phase === 'wait' ? `<span style="font-size:11px">inicia en ${Math.ceil(st.timed.t)} s</span>` : st.timed.phase === 'run' ? `<span style="font-size:11px">${Math.ceil(st.timed.t)} s</span>` : '<span title="Ejecución temporizada">⏱</span>') : '';
        html += `<div class="app-bar px"><button class="app-btn" data-act="back" style="padding:2px 6px;background:none;color:#fff">←</button><b style="flex:1;font-size:12.5px">${E.name}</b>${tw}<button class="app-btn" data-act="play" style="padding:3px 9px;background:none;color:#fff;font-size:15px">${st.running || st.timed.phase !== 'idle' ? '❚❚' : '▶'}</button><button class="app-btn" data-act="clear" style="padding:2px 6px;background:none;color:#fff" title="Borrar datos">🗑</button><button class="app-btn" data-act="menu" style="padding:2px 6px;background:none;color:#fff">⋮</button></div>`;
        html += '<div class="app-tabs">' + E.tabs.map((t, i) => `<button data-tab="${i}" class="${i === st.tab ? 'on' : ''}">${t}</button>`).join('') + '</div>';
        html += '<div class="app-body"><canvas class="ppx-cv" style="height:300px"></canvas><div class="ppx-num"></div></div>';
        if (st.menu) html += '<div class="app-menu"><button data-act="timed">Ejecución temporizada</button><button data-act="remote">' + (st.remote ? 'Desactivar acceso remoto' : 'Permitir acceso remoto') + '</button><button data-act="export">Exportar datos</button><button data-act="info">Información del dispositivo</button></div>';
        if (st.dialog === 'timed') html += `<div class="app-dialog"><div><b>Ejecución temporizada</b><label><input type="checkbox" data-in="ton" ${st.timed.on ? 'checked' : ''}> Activar</label><label>Retardo (s) <input type="number" data-in="delay" value="${st.timed.delay}" min="0" max="30" style="width:60px"></label><label>Duración (s) <input type="number" data-in="dur" value="${st.timed.dur}" min="1" max="120" style="width:60px"></label><div style="display:flex;gap:6px;justify-content:flex-end"><button class="app-btn" data-act="close">Cancelar</button><button class="app-btn main" data-act="tok">Aceptar</button></div></div></div>`;
        if (st.dialog === 'export') html += `<div class="app-dialog"><div><b>Exportar datos</b>${FMTS.map(([k, n]) => `<label><input type="radio" name="fmt-${sim.name}" data-fmt="${k}" ${st.fmt === k ? 'checked' : ''}> ${n}</label>`).join('')}<div style="display:flex;gap:6px;justify-content:flex-end"><button class="app-btn" data-act="close">Cancelar</button><button class="app-btn main" data-act="doexp">Exportar</button></div></div></div>`;
        if (st.dialog === 'info') html += `<div class="app-dialog"><div><b>Información del dispositivo</b><div style="font-family:var(--font-mono);font-size:11px;line-height:1.5">Acelerómetro: rango 78.4 m/s², resolución 0.0024 m/s², 400 Hz<br>Giroscopio: rango 34.9 rad/s, 400 Hz<br>Magnetómetro: rango 4912 µT, 100 Hz<br>Barómetro: 300–1100 hPa, 25 Hz</div><div style="display:flex;justify-content:flex-end"><button class="app-btn main" data-act="close">Cerrar</button></div></div></div>`;
      }
      if (st.toastT > 0) html += `<div class="app-toast">${st.toast}</div>`;
      scr.innerHTML = html;
      canvas = scr.querySelector('.ppx-cv');
      sim.redraw();
    }
    scr.addEventListener('click', (e) => {
      const b = e.target.closest('[data-exp],[data-act],[data-tab],[data-fmt]');
      if (!b) { if (st.menu) { st.menu = false; render(); } return; }
      if (b.dataset.exp) { st.exp = b.dataset.exp; st.screen = 'exp'; st.tab = 0; newData(); if (st.exp === 'accg') complete('open'); render(); return; }
      if (b.dataset.tab) { st.tab = +b.dataset.tab; render(); return; }
      if (b.dataset.fmt) { st.fmt = b.dataset.fmt; return; }
      const a = b.dataset.act;
      if (a === 'back') { stop(); st.screen = 'list'; st.menu = false; st.dialog = null; render(); }
      else if (a === 'play') {
        if (st.running || st.timed.phase !== 'idle') { stop(); if (st.data.t.length > 50) complete('run'); }
        else if (st.timed.on) { st.timed.phase = 'wait'; st.timed.t = st.timed.delay; sim.play(); }
        else { st.running = true; sim.play(); }
        render();
      } else if (a === 'clear') { newData(); simT = 0; render(); }
      else if (a === 'menu') { st.menu = !st.menu; render(); }
      else if (a === 'timed' || a === 'export' || a === 'info') { st.menu = false; st.dialog = a; render(); }
      else if (a === 'remote') { st.menu = false; st.remote = !st.remote; if (st.remote) complete('remote'); renderSide(); render(); }
      else if (a === 'close') { st.dialog = null; render(); }
      else if (a === 'tok') {
        const q = (k) => scr.querySelector(`[data-in="${k}"]`);
        st.timed.on = q('ton').checked;
        st.timed.delay = M.clamp(+q('delay').value || 0, 0, 30);
        st.timed.dur = M.clamp(+q('dur').value || 1, 1, 120);
        st.dialog = null; render();
      } else if (a === 'doexp') {
        st.dialog = null;
        if (!st.data || !st.data.t.length) toast('No hay datos para exportar.');
        else { if (st.fmt === 'semi') complete('export'); toast('Datos exportados: ' + FMTS.find((f) => f[0] === st.fmt)[1]); }
        renderSide(); render();
      }
    });
    function stop() { st.running = false; st.timed.phase = 'idle'; }
    function csv(fmt, max) {
      const E = EXPS[st.exp];
      if (!st.data) return '';
      const sep = fmt === 'semi' ? ';' : fmt === 'tab' ? '\t' : ',';
      const num = (v) => { let s = (+v.toPrecision(7)).toString(); if (fmt === 'semi') s = s.replace('.', ','); return s; };
      const head = ['"Time (s)"'].concat(E.cols.map((c) => `"${c[1]} (${c[2]})"`)).join(sep);
      const n = Math.min(st.data.t.length, max || Infinity);
      const rows = [];
      for (let i = 0; i < n; i++) rows.push([num(st.data.t[i])].concat(E.cols.map((c) => num(st.data[c[0]][i]))).join(sep));
      return [head].concat(rows).join('\n');
    }
    function renderSide() {
      let h = '<div class="mini-label">Tareas</div><div style="display:flex;flex-direction:column;gap:6px">';
      TASKS.forEach(([k, txt], i) => { h += `<div class="task${st.done[k] ? ' ok' : ''}"><b>${st.done[k] ? '✓' : i + 1}</b><span>${txt}</span></div>`; });
      h += '</div>';
      if (st.remote) h += '<div class="mini-label" style="margin-top:14px">Navegador del computador · http://192.168.1.37:8080</div><div style="border:1px solid var(--rule-strong);border-radius:6px;overflow:hidden"><div style="background:var(--surface-2);padding:4px 8px;font-size:12px;font-family:var(--font-mono)">phyphox · ' + (st.exp ? EXPS[st.exp].name : '—') + '</div><canvas class="pc-cv" style="width:100%;height:170px;display:block"></canvas></div>';
      if (st.exp && st.data && st.data.t.length) {
        const fmtName = FMTS.find((f) => f[0] === st.fmt)[1];
        h += `<div class="mini-label" style="margin-top:14px">Vista previa del archivo · ${st.fmt === 'xlsx' ? 'Excel (se muestra como CSV)' : fmtName}</div><div class="sim-table"><textarea readonly>${csv(st.fmt === 'xlsx' ? 'comma' : st.fmt, 8)}\n…</textarea></div><div class="ctrl-row" style="margin-top:6px"><button class="btn" data-copy="1">Copiar todos los datos</button></div>`;
      }
      side.innerHTML = h;
      pcCanvas = side.querySelector('.pc-cv');
      const cb = side.querySelector('[data-copy]');
      if (cb) cb.addEventListener('click', () => L.copy(csv(st.fmt === 'xlsx' ? 'tab' : st.fmt), cb, side));
      sim.redraw();
    }
    render(); renderSide();

    let sideTick = 0;
    sim.animate((dt) => {
      if (st.toastT > 0) { st.toastT -= dt; if (st.toastT <= 0) render(); }
      const tm = st.timed;
      if (tm.phase === 'wait') { tm.t -= dt; if (tm.t <= 0) { tm.phase = 'run'; tm.t = tm.dur; st.running = true; } render(); }
      else if (tm.phase === 'run') {
        tm.t -= dt;
        if (tm.t <= 0) { tm.phase = 'idle'; st.running = false; if (tm.delay === 3 && tm.dur === 5) complete('timed'); toast('Medición terminada'); }
        else if (Math.ceil(tm.t) !== Math.ceil(tm.t + dt)) render();
      }
      if (st.running && st.data) {
        const E = EXPS[st.exp];
        const h = 1 / 100;
        const n = Math.max(1, Math.round(dt / h));
        for (let i = 0; i < n; i++) {
          simT += h;
          const s = scene(sim.p.scn, simT);
          const v = E.get(s, sim.p.scn);
          st.data.t.push(+simT.toFixed(3));
          E.cols.forEach((c, j) => st.data[c[0]].push(v[j]));
        }
        if (st.data.t.length > 6000) { for (const k in st.data) st.data[k].splice(0, 1000); }
        if (st.exp === 'pend' && sim.p.scn === 'pendulo' && st.data.t.length > 400) complete('pend');
        sideTick += dt;
        if (sideTick > 0.7) { sideTick = 0; renderSide(); }
      }
      if (!st.running && tm.phase === 'idle' && st.toastT <= 0) { sim.pause(); renderSide(); }
    }, { button: false, autoplay: false });

    const fit = (cv) => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w: r.width, h: r.height };
    };
    function mini(ctx, x, y, w, h, t, ys, col, lab, unit) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      const tN = t.length ? t[t.length - 1] : 0;
      const t0 = Math.max(0, tN - 10);
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < t.length; i++) if (t[i] >= t0) { lo = Math.min(lo, ys[i]); hi = Math.max(hi, ys[i]); }
      if (!isFinite(lo)) { lo = -1; hi = 1; }
      if (hi - lo < 1e-3) { lo -= 0.5; hi += 0.5; }
      const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
      const ml = 40;
      ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1;
      ctx.strokeRect(x + ml + 0.5, y + 14.5, w - ml - 4, h - 26);
      ctx.fillStyle = '#555'; ctx.font = `9px ${MC.FONT_MONO}`; ctx.textAlign = 'right';
      ctx.fillText(MC.sci(hi, 3), x + ml - 2, y + 20); ctx.fillText(MC.sci(lo, 3), x + ml - 2, y + h - 12);
      ctx.textAlign = 'left'; ctx.fillStyle = '#333'; ctx.font = `600 10px ${MC.FONT_UI}`;
      ctx.fillText(`${lab} (${unit})`, x + ml + 2, y + 10);
      ctx.save(); ctx.beginPath(); ctx.rect(x + ml + 1, y + 15, w - ml - 5, h - 27); ctx.clip();
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath();
      let pen = false;
      for (let i = 0; i < t.length; i++) { if (t[i] < t0) continue; const px = x + ml + 1 + ((t[i] - t0) / 10) * (w - ml - 5), py = y + 15 + (1 - (ys[i] - lo) / (hi - lo)) * (h - 27); if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.restore();
    }
    const AXC = ['#E8541E', '#2B9A3A', '#2E5EAA'];
    function drawExp(cv, big) {
      if (!cv || !st.exp) return;
      const { ctx, w, h } = fit(cv);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, w, h);
      const E = EXPS[st.exp], d = st.data;
      const tab = big ? 0 : st.tab;
      const tname = E.tabs[tab];
      const numBox = scr.querySelector('.ppx-num');
      if (!big && numBox) numBox.innerHTML = '';
      if (st.exp === 'pend' && tname === 'Resultados') {
        const cr = L.crossings(d.t, d.wz, 0, -1);
        let T = NaN; if (cr.length > 2) T = (cr[cr.length - 1] - cr[0]) / (cr.length - 1);
        ctx.fillStyle = '#222'; ctx.font = `600 13px ${MC.FONT_UI}`; ctx.textAlign = 'center';
        ctx.fillText('Periodo', w / 2, 40); ctx.font = `600 28px ${MC.FONT_MONO}`; ctx.fillText(isFinite(T) ? MC.fix(T, 3) + ' s' : '—', w / 2, 76);
        ctx.font = `600 13px ${MC.FONT_UI}`; ctx.fillText('Frecuencia', w / 2, 120); ctx.font = `600 28px ${MC.FONT_MONO}`; ctx.fillText(isFinite(T) ? MC.fix(1 / T, 3) + ' Hz' : '—', w / 2, 156);
        ctx.font = `12px ${MC.FONT_UI}`; ctx.fillStyle = '#666'; ctx.fillText('L = g T²/4π² = ' + (isFinite(T) ? MC.fix((G * T * T) / (4 * Math.PI * Math.PI) * 100, 1) + ' cm' : '—'), w / 2, 196);
        return;
      }
      if (st.exp === 'crono' && tname === 'Cronómetro') {
        const ev = [];
        let last = -1;
        for (let i = 0; i < d.t.length; i++) if (d.amp[i] > 0.1 && (last < 0 || d.t[i] - last > 0.1)) { ev.push(d.t[i]); last = d.t[i]; }
        const dts = []; for (let i = 1; i < ev.length; i += 2) dts.push(ev[i] - ev[i - 1]);
        ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.font = `600 13px ${MC.FONT_UI}`; ctx.fillText('Tiempo entre los dos sonidos', w / 2, 40);
        ctx.font = `600 28px ${MC.FONT_MONO}`; ctx.fillText(dts.length ? MC.fix(dts[dts.length - 1], 4) + ' s' : '—', w / 2, 80);
        ctx.font = `12px ${MC.FONT_UI}`; ctx.fillStyle = '#666'; ctx.fillText('Umbral 0.1 · tiempo mínimo 0.1 s', w / 2, 110);
        return;
      }
      if (tname === 'Simple') {
        ctx.textAlign = 'center';
        E.cols.forEach((c, j) => {
          const arr = d[c[0]]; const v = arr.length ? arr[arr.length - 1] : NaN;
          ctx.fillStyle = '#444'; ctx.font = `600 11px ${MC.FONT_UI}`; ctx.fillText(`${c[1]} (${c[2]})`, w / 2, 30 + j * 80);
          ctx.fillStyle = AXC[j % 3]; ctx.font = `600 26px ${MC.FONT_MONO}`; ctx.fillText(isFinite(v) ? MC.fix(v, 3) : '—', w / 2, 62 + j * 80);
        });
        return;
      }
      if (tname === 'Absoluto' && E.cols.length === 3) {
        const abs = d.t.map((_, i) => Math.hypot(d[E.cols[0][0]][i], d[E.cols[1][0]][i], d[E.cols[2][0]][i]));
        mini(ctx, 2, 4, w - 4, h - 8, d.t, abs, '#7a3fbf', 'Absoluto', E.cols[0][2]);
        return;
      }
      const k = E.cols.length;
      const hh = (h - 4) / k;
      E.cols.forEach((c, j) => mini(ctx, 2, 2 + j * hh, w - 4, hh - 4, d.t, d[c[0]], AXC[j % 3], c[1], c[2]));
    }
    sim.onDraw(() => {
      drawExp(canvas, false);
      if (pcCanvas) drawExp(pcCanvas, true);
    });
  });

  /* ---------- Análisis de video ---------- */
  MC.defineSim('video-tracker', function (sim) {
    sim.cols2('1.5fr 1fr');
    const cv = sim.canvas({ aspect: 1.25, label: 'Cuadro del video' });
    const cg = sim.canvas({ aspect: 0.82, label: 'Datos marcados y ajuste' });
    const fps = 60, N = 30;
    /* Mundo: plano de la regla; la pelota se lanza con v0 = (1.1, 2.4) m/s desde (0.15, 0.25) m */
    const traj = (k) => { const t = k / fps; return [0.12 + 1.15 * t, 0.22 + 2.6 * t - 0.5 * G * t * t]; };
    const beam = [[0.05, 0.08], [0.162, 0.08]]; /* centros de los agujeros extremos (112 mm) */
    let frame = 0, marks = new Array(N).fill(null), cal = [], mode = 'cal';
    sim.group('Pasos');
    sim.seg('mode', { options: [['cal', '1. Calibrar'], ['mark', '2. Marcar']], value: 'cal', onInput: (v) => { mode = v; } });
    sim.slider('frame', { label: 'Cuadro', min: 0, max: N - 1, step: 1, value: 0, fmt: (v) => `${Math.round(v)} (t = ${MC.fix(Math.round(v) / fps, 3)} s)`, onInput: (v) => { frame = Math.round(v); } });
    sim.button('Calibrar automáticamente', () => { cal = [W2Pbeam(beam[0]), W2Pbeam(beam[1])].map((p) => [p[0] + M.gauss(0, 0.6), p[1]]); sim.ctl.mode.set('mark'); mode = 'mark'; sim.redraw(); });
    sim.button('Seguimiento automático', () => { for (let k = 0; k < N; k++) { const p = traj(k); marks[k] = [p[0] + M.gauss(0, 0.0015), p[1] + M.gauss(0, 0.0015)]; } sim.redraw(); });
    sim.button('Borrar marcas', () => { marks = new Array(N).fill(null); sim.redraw(); });
    sim.group('Toma');
    sim.check('par', { label: 'La pelota está 10 cm delante de la regla (cámara a 1.5 m)', value: false });
    sim.check('slow', { label: 'Video en cámara lenta tomado como 30 fps', value: false });
    sim.out('scale', 'Escala (calibración)');
    sim.out('n', 'Cuadros marcados');
    sim.out('g', '<i>g</i> del ajuste', { hl: true });
    sim.dataCopy(() => ({ headers: ['t (s)', 'x (m)', 'y (m)'], rows: data().map((r) => r) }));
    /* Vista: píxeles de la "imagen" */
    let img = null;
    const W2P = (p) => {
      const k = sim.p.par ? 1.5 / 1.4 : 1;
      return [img.ox + p[0] * img.s * k, img.oy - p[1] * img.s * k];
    };
    const W2Pbeam = (p) => [img.ox + p[0] * img.s, img.oy - p[1] * img.s];
    function scale() {
      if (cal.length < 2) return null;
      const dpx = Math.hypot(cal[1][0] - cal[0][0], cal[1][1] - cal[0][1]);
      return 0.112 / dpx; /* m por píxel */
    }
    function data() {
      const sc = scale();
      if (!sc) return [];
      const dtv = sim.p.slow ? 1 / 30 : 1 / fps;
      const out = [];
      marks.forEach((m, k) => {
        if (!m) return;
        const px = W2P(m);
        out.push([k * dtv, (px[0] - img.ox) * sc, (img.oy - px[1]) * sc]);
      });
      return out;
    }
    MC.pointer(cv, {
      down: (x, y) => {
        if (!img) return null;
        if (mode === 'cal') {
          if (cal.length >= 2) cal = [];
          cal.push([x, y]);
          if (cal.length === 2) { sim.ctl.mode.set('mark'); mode = 'mark'; }
        } else {
          const k = sim.p.par ? 1.5 / 1.4 : 1;
          marks[frame] = [(x - img.ox) / (img.s * k), (img.oy - y) / (img.s * k)];
          if (frame < N - 1) { frame++; sim.ctl.frame.set(frame, true); }
        }
        sim.redraw();
        return null;
      },
      hover: () => 'crosshair'
    });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      const Wd = cv.w, H = cv.h;
      img = { s: Math.min(Wd / 0.78, H / 0.7) * 0.95, ox: Wd * 0.03, oy: H * 0.95 };
      /* fondo tipo foto */
      ctx.fillStyle = MC.col('--surface-2');
      ctx.fillRect(0, 0, Wd, H);
      ctx.fillStyle = MC.alpha('--ink', 0.06);
      for (let i = 0; i < 10; i++) ctx.fillRect(0, (i * H) / 10, Wd, 1);
      D.ground(ctx, 0, img.oy, Wd, { depth: 10 });
      /* viga LEGO de 15 agujeros apoyada en el piso */
      const a = W2Pbeam([beam[0][0] - 0.004, beam[0][1]]), u = 0.008 * img.s;
      ctx.fillStyle = MC.col('--lego-gray');
      ctx.fillRect(a[0] - u * 0.5 + 0.004 * img.s, a[1] - u * 0.5, u * 15, u);
      ctx.fillStyle = MC.shade(MC.col('--lego-gray'), 0.45);
      for (let i = 0; i < 15; i++) { ctx.beginPath(); ctx.arc(a[0] + 0.004 * img.s + i * u, a[1], u * 0.28, 0, 7); ctx.fill(); }
      /* pelota en el cuadro actual (+ estela) */
      const p = W2P(traj(frame));
      const r = 0.018 * img.s * (sim.p.par ? 1.5 / 1.4 : 1);
      for (let k = Math.max(0, frame - 3); k < frame; k++) { const q = W2P(traj(k)); D.circle(ctx, q[0], q[1], r, { fill: '--body-c', fillAlpha: 0.12, color: 'none' }); }
      D.ball(ctx, p[0], p[1], r, { fill: '--body-c' });
      /* marcas */
      marks.forEach((m, k) => { if (!m) return; const q = W2P(m); ctx.strokeStyle = MC.col(k === frame ? '--accent' : '--c5'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q[0] - 5, q[1]); ctx.lineTo(q[0] + 5, q[1]); ctx.moveTo(q[0], q[1] - 5); ctx.lineTo(q[0], q[1] + 5); ctx.stroke(); });
      if (cal.length) { D.circle(ctx, cal[0][0], cal[0][1], 4, { color: '--c3', width: 2 }); if (cal[1]) { D.line(ctx, cal[0][0], cal[0][1], cal[1][0], cal[1][1], { color: '--c3', width: 2 }); D.circle(ctx, cal[1][0], cal[1][1], 4, { color: '--c3', width: 2 }); MC.text(ctx, '112 mm', (cal[0][0] + cal[1][0]) / 2, cal[0][1] - 10, { size: 11.5, align: 'center', color: '--c3', halo: true, mono: true }); } }
      MC.text(ctx, mode === 'cal' ? 'Clic en el centro del primer y del último agujero de la viga' : 'Clic sobre la pelota (avanza al siguiente cuadro)', 10, 18, { size: 12.5, color: '--ink', halo: true, weight: 600 });
      MC.text(ctx, `cuadro ${frame}/${N - 1}`, Wd - 10, img.oy - 8, { size: 12, mono: true, align: 'right', color: '--ink-2', halo: true });
      /* datos y ajuste */
      const sc = scale();
      sim.set('scale', sc ? MC.fix(sc * 1000, 3) + ' mm/píxel' : 'sin calibrar');
      const dd = data();
      sim.set('n', `${marks.filter(Boolean).length} de ${N}`);
      const c2 = cg.ctx;
      D.clear(cg);
      const tmax = (N / fps) * (sim.p.slow ? 2 : 1);
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: tmax * 1.05, ymin: 0, ymax: 0.8, xlabel: ['t', 's'], ylabel: ['y', 'm'], mt: 14 });
      P.frame();
      if (dd.length) {
        P.scatter(dd.map((r) => r[0]), dd.map((r) => r[2]), { color: '--c5', r: 3.5 });
        if (dd.length >= 4) {
          const f = L.fitPoly(dd.map((r) => r[0]), dd.map((r) => r[2]), 2);
          if (f) {
            P.fn(f.f, { color: '--accent', width: 2 });
            sim.set('g', L.pm(-2 * f.a[2], 2 * f.sa[2], 'm/s²'));
            MC.text(c2, `y = ${MC.fix(f.a[0], 3)} + ${MC.fix(f.a[1], 3)} t − ${MC.fix(-f.a[2], 3)} t²`, P.ix + 8, P.iy + 16, { size: 11.5, mono: true, color: '--accent', halo: true });
          }
        } else sim.set('g', 'faltan puntos');
      } else sim.set('g', sc ? 'marque la pelota' : 'calibre primero');
    });
  });
})();
