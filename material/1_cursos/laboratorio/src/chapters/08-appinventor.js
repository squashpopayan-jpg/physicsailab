/* Capítulo 8 · MIT App Inventor y alternativas */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const el = MC.el;
  const G = MC.K.gPop;

  /* ---------- Reloj de App Inventor ---------- */
  MC.defineSim('ai-reloj', function (sim) {
    sim.cols2('1fr 1.3fr');
    const ch = sim.canvas({ aspect: 1.1, label: 'Histograma de intervalos' });
    const cs = sim.canvas({ aspect: 1.45, label: 'Señal con tiempos supuestos y reales' });
    let iv = [];
    sim.group('Reloj');
    sim.slider('dt', { label: 'TimerInterval pedido', min: 5, max: 200, step: 1, value: 10, unit: 'ms', fmt: (v) => String(Math.round(v)), onInput: () => gen() });
    sim.check('busy', { label: 'Celular ocupado (gráfica en pantalla, otras aplicaciones)', value: false, onInput: () => gen() });
    sim.button('Repetir', () => gen());
    sim.out('mean', 'Intervalo real medio', { hl: true });
    sim.out('fr', 'Datos por segundo reales');
    sim.out('Ter', 'Periodo de 1 s visto con tiempos supuestos');
    function gen() {
      iv = [];
      const base = Math.max(sim.p.dt, 4);
      for (let i = 0; i < 400; i++) {
        let d = base + Math.abs(M.gauss(0, 1.5)) + (Math.random() < 0.3 ? 16.7 * Math.random() : 0);
        if (sim.p.busy && Math.random() < 0.08) d += 40 + 60 * Math.random();
        iv.push(d);
      }
      sim.redraw();
    }
    gen();
    sim.onDraw(() => {
      const mean = M.mean(iv);
      sim.set('mean', MC.fix(mean, 1) + ' ms');
      sim.set('fr', MC.fix(1000 / mean, 1));
      sim.set('Ter', MC.fix(sim.p.dt / mean, 3) + ' s (debería ser 1.000 s)');
      let ctx = ch.ctx;
      D.clear(ch);
      const mx = Math.max(...iv) * 1.05;
      const nb = 30, bw = mx / nb, cnt = new Array(nb).fill(0);
      for (const v of iv) cnt[Math.min(nb - 1, Math.floor(v / bw))]++;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: mx, ymin: 0, ymax: MC.niceCeil(Math.max(...cnt) * 1.1), xlabel: ['Δt', 'ms'], ylabel: 'frecuencia', mt: 26, title: 'Intervalos reales entre disparos' });
      P.frame();
      P.clip((c) => { for (let k = 0; k < nb; k++) { const y = P.Y(cnt[k]); c.fillStyle = MC.alpha('--c3', 0.7); c.fillRect(P.X(k * bw) + 1, y, P.X(bw) - P.X(0) - 2, P.Y(0) - y); } });
      P.vline(sim.p.dt, { color: '--accent', label: 'pedido', dash: [] });
      ctx = cs.ctx;
      D.clear(cs);
      const tReal = [0], tSup = [0];
      for (let i = 0; i < iv.length; i++) { tReal.push(tReal[i] + iv[i] / 1000); tSup.push((i + 1) * sim.p.dt / 1000); }
      const y = tReal.map((t) => Math.sin(2 * Math.PI * t));
      const T = Math.min(3, tSup[tSup.length - 1]);
      const Q = new MC.Plot(ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: T, ymin: -1.3, ymax: 1.3, xlabel: ['t', 's'], ylabel: 'señal', mt: 26, title: 'Oscilación de 1 Hz registrada' });
      Q.frame();
      Q.xy(tReal, y, { color: '--c3', width: 2 });
      Q.xy(tSup, y, { color: '--c2', width: 2, dash: [5, 4] });
      Q.legend([{ label: 'con Clock.SystemTime (real)', color: '--c3' }, { label: 'suponiendo intervalos iguales', color: '--c2', dash: [5, 4] }], 'bl');
    });
  });

  /* ---------- Tramas por Bluetooth ---------- */
  MC.defineSim('bt-trama', function (sim) {
    const cv = sim.canvas({ aspect: 1.55, label: 'Valores leídos y búfer' });
    let res = null;
    sim.group('ESP32');
    sim.slider('rate', { label: 'Líneas por segundo que envía', min: 5, max: 200, step: 1, value: 50, fmt: (v) => String(Math.round(v)), onInput: () => { res = null; } });
    sim.group('Aplicación');
    sim.select('mode', { label: 'Forma de leer en cada disparo del reloj', options: [['delim', 'ReceiveText(−1): una línea'], ['all', 'ReceiveText(−1) mientras haya bytes'], ['fixed', 'ReceiveText(8): 8 bytes fijos']], value: 'delim', onInput: () => { res = null; } });
    sim.slider('tick', { label: 'TimerInterval', min: 10, max: 100, step: 5, value: 20, unit: 'ms', fmt: (v) => String(Math.round(v)), onInput: () => { res = null; } });
    sim.button('Repetir', () => { res = null; sim.redraw(); });
    sim.out('sent', 'Líneas enviadas (10 s)');
    sim.out('ok', 'Líneas leídas bien');
    sim.out('bad', 'Líneas rotas', { hl: true });
    sim.out('lag', 'Retraso al final');
    function run() {
      const rate = Math.round(sim.p.rate), tick = sim.p.tick;
      let buf = '', sent = 0, ok = 0, bad = 0;
      const out = { t: [], y: [], bt: [], bl: [], bad: [] };
      let nextSend = 0, nextTick = 0;
      const lastSent = [];
      for (let ms = 0; ms <= 10000; ms++) {
        if (ms >= nextSend) {
          const v = Math.round(1650 + 800 * Math.sin(2 * Math.PI * 0.7 * ms / 1000) + M.gauss(0, 5));
          buf += `${ms},${v}\r\n`;
          sent++; lastSent.push(ms);
          nextSend += 1000 / rate;
        }
        if (ms >= nextTick) {
          nextTick += tick + Math.abs(M.gauss(0, 2)) + (Math.random() < 0.2 ? 10 * Math.random() : 0);
          const reads = [];
          if (sim.p.mode === 'fixed') { if (buf.length) { reads.push(buf.slice(0, 8)); buf = buf.slice(8); } }
          else {
            let n = 0;
            do { const k = buf.indexOf('\n'); if (k < 0) break; reads.push(buf.slice(0, k + 1)); buf = buf.slice(k + 1); n++; } while (sim.p.mode === 'all' && n < 1000);
          }
          for (const r of reads) {
            const parts = r.trim().split(',');
            const good = parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]) && Math.abs(+parts[0] - 0) >= 0 && +parts[1] > 500 && +parts[1] < 2800 && r.endsWith('\n');
            if (parts.length === 2 && parts[0] !== '' && parts[1] !== '' && isFinite(+parts[0]) && isFinite(+parts[1])) {
              out.t.push(ms / 1000); out.y.push(+parts[1]);
              if (good) ok++; else { bad++; out.bad.push(out.t.length - 1); }
            } else if (r.trim()) bad++;
          }
          out.bt.push(ms / 1000); out.bl.push(buf.length);
        }
      }
      const firstUnread = buf.match(/^(\d+),/);
      return { out, sent, ok, bad, lag: firstUnread ? (10000 - +firstUnread[1]) / 1000 : 0 };
    }
    sim.onDraw(() => {
      if (!res) res = run();
      sim.set('sent', String(res.sent));
      sim.set('ok', String(res.ok));
      sim.set('bad', String(res.bad));
      sim.set('lag', res.lag > 0.05 ? MC.fix(res.lag, 2) + ' s (búfer creciendo)' : 'ninguno');
      const ctx = cv.ctx;
      D.clear(cv);
      const h1 = cv.h * 0.6;
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: h1, xmin: 0, xmax: 10, ymin: 0, ymax: 3500, xlabel: '', ylabel: ['V', 'mV'], mt: 26, mb: 22, title: 'Lo que grafica la aplicación' });
      P.frame();
      P.xy(res.out.t, res.out.y, { color: '--c1', width: 1.2 });
      if (res.out.bad.length) P.scatter(res.out.bad.map((i) => res.out.t[i]), res.out.bad.map((i) => res.out.y[i]), { color: '--c2', r: 3 });
      const bmax = Math.max(64, ...res.out.bl) * 1.1;
      const Q = new MC.Plot(ctx, { x: 0, y: h1, w: cv.w, h: cv.h - h1, xmin: 0, xmax: 10, ymin: 0, ymax: bmax, xlabel: ['t', 's'], ylabel: 'bytes', mt: 22, title: 'Bytes esperando en el búfer del celular' });
      Q.frame();
      Q.xy(res.out.bt, res.out.bl, { color: '--c4', width: 1.4, fill: '--c4', fillAlpha: 0.12 });
    });
  });

  /* ---------- Rompecabezas de bloques ---------- */
  const LEVELS = [
    {
      name: '1 · Acelerómetro en pantalla', app: 'acc',
      goal: 'Muestre las tres componentes de la aceleración en tres etiquetas.',
      comps: ['LabelX', 'LabelY', 'LabelZ', '· AccelerometerSensor1'],
      prog: `when AccelerometerSensor1.AccelerationChanged (xAccel, yAccel, zAccel)
  set LabelX.Text to ??1
  set LabelY.Text to ??2
  ??s3`,
      pieces: [
        { k: 'v', dsl: '[get xAccel]', slot: '1' }, { k: 'v', dsl: '[get yAccel]', slot: '2' }, { k: 's', dsl: 'set LabelZ.Text to [get zAccel]', slot: '3' },
        { k: 'v', dsl: '["xAccel"]', why: 'Entre comillas es un texto: la etiqueta mostraría la palabra «xAccel».' },
        { k: 's', dsl: 'set LabelZ.Text to ["zAccel"]', why: 'Mostraría la palabra «zAccel», no el número.' }
      ]
    },
    {
      name: '2 · Registrador CSV', app: 'log',
      goal: 'Guarde [tiempo, az] cada vez que dispare el reloj y exporte el archivo.',
      comps: ['BotonIniciar', 'BotonGuardar', 'LabelN', '· AccelerometerSensor1', '· Clock1', '· File1'],
      prog: `initialize global datos to [create empty list]
when BotonIniciar.Click
  set Clock1.TimerEnabled to ??1
when Clock1.Timer
  ??s2
  set LabelN.Text to [length of list list=[get global datos]]
when BotonGuardar.Click
  call File1.SaveFile text=??3 fileName="/datos.csv"`,
      pieces: [
        { k: 'v', dsl: '[true]', slot: '1' },
        { k: 's', dsl: 'add items to list list=[get global datos] item=[make a list [call Clock1.SystemTime] [AccelerometerSensor1.ZAccel]]', slot: '2' },
        { k: 'v', dsl: '[list to csv table list=[get global datos]]', slot: '3' },
        { k: 'v', dsl: '[false]', why: 'Con false el reloj nunca dispara.' },
        { k: 'v', dsl: '[list to csv row list=[get global datos]]', why: '«csv row» pondría todos los datos en una sola línea.' }
      ]
    },
    {
      name: '3 · Gráfica en vivo', app: 'chart',
      goal: 'Grafique az contra el tiempo en segundos y reinicie la gráfica cada 10 s.',
      comps: ['Chart1 › ChartData2D1', '· AccelerometerSensor1', '· Clock1'],
      prog: `when AccelerometerSensor1.AccelerationChanged (xAccel, yAccel, zAccel)
  set global t to [- [call Clock1.SystemTime] [get global t0]]
  call ChartData2D1.AddEntry x=??1 y=??2
  if [> [get global t] 10000]
    ??s3
    set global t0 to [call Clock1.SystemTime]`,
      pieces: [
        { k: 'v', dsl: '[/ [get global t] 1000]', slot: '1' }, { k: 'v', dsl: '[get zAccel]', slot: '2' }, { k: 's', dsl: 'call ChartData2D1.Clear', slot: '3' },
        { k: 'v', dsl: '[get global t]', why: 'Funciona, pero el eje horizontal quedaría en milisegundos.' },
        { k: 'v', dsl: '[get xAccel]', why: 'Graficaría la componente x, no la z.' }
      ]
    },
    {
      name: '4 · Datos de la ESP32', app: 'bt',
      goal: 'Liste los dispositivos emparejados, conéctese y grafique cada línea "t,mV".',
      comps: ['ListPicker1', 'LabelEstado', 'Chart1 › ChartData2D1', '· BluetoothClient1 (DelimiterByte = 10)', '· Clock1'],
      prog: `when ListPicker1.BeforePicking
  set ListPicker1.Elements to ??1
when ListPicker1.AfterPicking
  set LabelEstado.Text to [call BluetoothClient1.Connect address=[ListPicker1.Selection]]
when Clock1.Timer
  if [and [BluetoothClient1.IsConnected] [> [call BluetoothClient1.BytesAvailableToReceive] 0]]
    set global linea to ??2
    set global partes to [split text=[get global linea] at=??3]
    call ChartData2D1.AddEntry x=[select list item list=[get global partes] index=1] y=[select list item list=[get global partes] index=2]`,
      pieces: [
        { k: 'v', dsl: '[BluetoothClient1.AddressesAndNames]', slot: '1' }, { k: 'v', dsl: '[call BluetoothClient1.ReceiveText numberOfBytes=-1]', slot: '2' }, { k: 'v', dsl: '[","]', slot: '3' },
        { k: 'v', dsl: '[call BluetoothClient1.ReceiveText numberOfBytes=8]', why: 'Ocho bytes fijos cortan las líneas por la mitad.' },
        { k: 'v', dsl: '[";"]', why: 'La ESP32 separa con coma, no con punto y coma.' }
      ]
    }
  ];
  MC.defineSim('ai-rompecabezas', function (sim) {
    const wrap = el('div', 'sim-html row');
    sim.stage.append(wrap);
    const left = el('div', 'pane');
    left.style.flex = '2 1 420px';
    const right = el('div', 'pane');
    right.style.flex = '0 1 260px';
    wrap.append(left, right);
    const st = { lv: 0, fill: {}, pick: null, running: false, t: 0, data: [], log: [], connected: false, list: false, saved: '', t0: 0, chart: [] };
    sim.group('Nivel');
    sim.seg('lv', { options: LEVELS.map((l, i) => [i, String(i + 1)]), value: 0, onInput: (v) => { st.lv = +v; reset(); } });
    sim.group('Bloques');
    sim.button('Comprobar', () => check(true), { primary: true });
    sim.button('Ejecutar en el celular', () => run());
    sim.button('Vaciar huecos', () => reset());
    sim.button('Ver solución', () => { const Lv = LEVELS[st.lv]; Lv.pieces.forEach((p, i) => { if (p.slot) st.fill[p.slot] = i; }); render(); check(true); });
    sim.group('Simulación del celular');
    sim.select('scn', { label: 'Qué hace el celular', options: [['quieto', 'Quieto sobre la mesa'], ['incl', 'Inclinado 30°'], ['agitar', 'Agitado en la mano']], value: 'quieto' });
    const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    let order = [];
    function reset() { st.fill = {}; st.pick = null; stop(); order = shuffle(LEVELS[st.lv].pieces.map((_, i) => i)); render(); }
    function render() {
      const Lv = LEVELS[st.lv];
      let html = `<div class="mini-label">${Lv.name}</div><div class="puzzle-msg" data-msg>${Lv.goal}</div>`;
      const vis = Lv.comps.filter((c) => !c.startsWith('· ')), nov = Lv.comps.filter((c) => c.startsWith('· ')).map((c) => c.slice(2));
      html += `<div class="mini-label" style="margin-top:10px">Diseñador · componentes</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--ink-2);margin-bottom:8px">Screen1: ${vis.join(', ')}<br>No visibles: ${nov.join(', ')}</div>`;
      html += '<div class="mini-label">Bloques</div><div class="workspace">' + MC.aiBlocks(Lv.prog, { slot: (tok) => tok.replace(/^\?\?s?/, '') }) + '</div>';
      html += '<div class="mini-label" style="margin-top:10px">Caja de bloques (toque uno y luego un hueco, o arrástrelo)</div><div class="toolbox">';
      const used = new Set(Object.values(st.fill));
      for (const i of order) {
        const p = Lv.pieces[i];
        const inner = p.k === 'v' ? MC.aiExprHTML(p.dsl) : MC.aiStmtHTML(p.dsl);
        html += `<div data-pid="${i}" draggable="true" style="display:inline-flex" class="${used.has(i) ? 'used' : ''}">${inner}</div>`;
      }
      html += '</div>';
      left.innerHTML = html;
      left.querySelectorAll('.toolbox > [data-pid]').forEach((d) => { d.firstElementChild.classList.toggle('picked', st.pick === +d.dataset.pid); if (used.has(+d.dataset.pid)) d.firstElementChild.classList.add('used'); });
      left.querySelectorAll('.bk-slot').forEach((s) => {
        const id = s.dataset.slot;
        if (st.fill[id] !== undefined) {
          const p = Lv.pieces[st.fill[id]];
          s.innerHTML = p.k === 'v' ? MC.aiExprHTML(p.dsl) : MC.aiStmtHTML(p.dsl);
          s.style.border = '0'; s.style.background = 'none'; s.style.minWidth = '0';
        }
      });
      renderPhone();
    }
    const msg = (html, kind) => { const m = left.querySelector('[data-msg]'); if (m) { m.innerHTML = html; m.className = 'puzzle-msg' + (kind ? ' ' + kind : ''); } };
    function place(pid, slot) {
      const Lv = LEVELS[st.lv];
      const p = Lv.pieces[pid];
      const sEl = left.querySelector(`.bk-slot[data-slot="${slot}"]`);
      const isStmt = sEl && sEl.classList.contains('stmt');
      if ((p.k === 's') !== isStmt) { msg(p.k === 's' ? 'Ese bloque es una instrucción: encaja en un hueco largo de una pila de bloques, no dentro de otro bloque.' : 'Ese bloque es un valor: encaja dentro de otro bloque, no como instrucción suelta.', 'bad'); return; }
      for (const k in st.fill) if (st.fill[k] === pid) delete st.fill[k];
      st.fill[slot] = pid;
      st.pick = null;
      render();
    }
    left.addEventListener('click', (e) => {
      const pc = e.target.closest('.toolbox > [data-pid]');
      if (pc) { const pid = +pc.dataset.pid; st.pick = st.pick === pid ? null : pid; render(); return; }
      const sl = e.target.closest('.bk-slot');
      if (sl) {
        const id = sl.dataset.slot;
        if (st.pick !== null) place(st.pick, id);
        else if (st.fill[id] !== undefined) { delete st.fill[id]; render(); }
      }
    });
    left.addEventListener('dragstart', (e) => { const pc = e.target.closest('[data-pid]'); if (pc) { e.dataTransfer.setData('text/plain', pc.dataset.pid); st.pick = +pc.dataset.pid; } });
    left.addEventListener('dragover', (e) => { if (e.target.closest('.bk-slot')) e.preventDefault(); });
    left.addEventListener('drop', (e) => { const sl = e.target.closest('.bk-slot'); if (sl) { e.preventDefault(); place(+e.dataTransfer.getData('text/plain'), sl.dataset.slot); } });
    function check(show) {
      const Lv = LEVELS[st.lv];
      const slots = Lv.pieces.filter((p) => p.slot).map((p) => p.slot);
      let ok = 0, why = '';
      for (const s of slots) {
        const sEl = left.querySelector(`.bk-slot[data-slot="${s}"]`);
        const pid = st.fill[s];
        const good = pid !== undefined && Lv.pieces[pid].slot === s;
        if (good) ok++;
        if (show && sEl) { sEl.classList.remove('ok', 'bad'); sEl.classList.add(good ? 'ok' : 'bad'); sEl.style.border = ''; }
        if (!good && pid !== undefined && Lv.pieces[pid].why) why = Lv.pieces[pid].why;
      }
      const all = ok === slots.length;
      if (show) msg(all ? '¡Correcto! Pulse «Ejecutar en el celular».' : `${ok} de ${slots.length} bloques correctos. ${why}`, all ? 'good' : 'bad');
      return all;
    }
    function stop() { st.running = false; st.t = 0; st.data = []; st.chart = []; st.connected = false; st.list = false; st.saved = ''; st.timer = false; }
    function run() {
      if (!check(true)) return;
      stop();
      st.running = true; st.t0 = 0;
      renderPhone();
      sim.play();
    }
    /* sensores simulados */
    const accNow = (t) => {
      const s = sim.p.scn;
      if (s === 'incl') return [0, G * Math.sin(M.rad(30)), G * Math.cos(M.rad(30))].map((v) => v + M.gauss(0, 0.01));
      if (s === 'agitar') return [2.5 * Math.sin(9 * t) + M.gauss(0, 0.3), 1.2 * Math.sin(7 * t + 1), G + 3 * Math.sin(11 * t) + M.gauss(0, 0.3)];
      return [M.gauss(0, 0.01), M.gauss(0, 0.01), G + M.gauss(0, 0.01)];
    };
    let phoneCanvas = null;
    function renderPhone() {
      const Lv = LEVELS[st.lv];
      let h = '<div class="phone-html"><div class="notch"></div><div class="scr"><div class="app-bar">Screen1</div><div class="app-body" data-app>';
      if (!st.running) h += '<div style="color:var(--ink-3);font-size:12.5px;padding:10px">La aplicación se ejecuta aquí cuando todos los bloques estén correctos.</div>';
      else if (Lv.app === 'acc') h += '<div class="app-row" style="font-size:16px" data-o="x"></div><div class="app-row" style="font-size:16px" data-o="y"></div><div class="app-row" style="font-size:16px" data-o="z"></div>';
      else if (Lv.app === 'log') h += '<button class="app-btn main" data-b="ini">Iniciar</button><button class="app-btn" data-b="save">Guardar</button><div class="app-row" data-o="n">0</div><textarea readonly data-o="file" style="width:100%;height:170px;font-family:var(--font-mono);font-size:10.5px;border:1px solid var(--rule)"></textarea>';
      else if (Lv.app === 'chart') h += '<canvas data-cv style="height:300px"></canvas>';
      else if (Lv.app === 'bt') h += `<button class="app-btn main" data-b="pick">Conectar</button><div class="app-row" data-o="est">${st.connected ? 'true (conectado)' : '—'}</div>` + (st.list ? '<div style="display:flex;flex-direction:column;gap:4px"><button class="app-btn" data-b="esp">98:D3:31:F5:2A:10 ESP32-Lab</button><button class="app-btn" data-b="spk">00:1A:7D:DA:71:13 Parlante JBL</button></div>' : '') + '<canvas data-cv style="height:250px"></canvas>';
      h += '</div></div></div>';
      right.innerHTML = '<div class="mini-label">Celular con la aplicación</div>' + h;
      phoneCanvas = right.querySelector('[data-cv]');
      sim.redraw();
    }
    right.addEventListener('click', (e) => {
      const b = e.target.closest('[data-b]');
      if (!b || !st.running) return;
      const a = b.dataset.b;
      if (a === 'ini') { st.timer = true; st.data = []; st.t0 = st.t; }
      else if (a === 'save') { st.timer = false; st.saved = L.parseCSV ? st.data.map((r) => r.join(',')).join('\n') : ''; }
      else if (a === 'pick') { st.list = true; renderPhone(); }
      else if (a === 'esp') { st.list = false; st.connected = true; st.chart = []; renderPhone(); }
      else if (a === 'spk') { st.list = false; st.connected = false; renderPhone(); const o = right.querySelector('[data-o="est"]'); if (o) o.textContent = 'false (no se pudo conectar)'; }
      sim.redraw();
    });
    let acc = 0;
    sim.animate((dt) => {
      if (!st.running) { sim.pause(); return; }
      st.t += dt;
      const Lv = LEVELS[st.lv];
      if (Lv.app === 'log' && st.timer) {
        acc += dt;
        while (acc > 0.024) { acc -= 0.020 + 0.012 * Math.random(); const a = accNow(st.t); st.data.push([Math.round(1727000000000 + st.t * 1000), +a[2].toFixed(4)]); }
      }
      if (Lv.app === 'chart') { const a = accNow(st.t); st.chart.push([st.t % 10, a[2]]); if (st.chart.length > 1 && st.chart[st.chart.length - 1][0] < st.chart[st.chart.length - 2][0]) st.chart = [st.chart[st.chart.length - 1]]; }
      if (Lv.app === 'bt' && st.connected) { st.chart.push([st.t, 1650 + 800 * Math.sin(2 * Math.PI * 0.7 * st.t) + M.gauss(0, 6)]); if (st.chart.length > 500) st.chart.shift(); }
    }, { button: false, autoplay: false });
    const fitC = (cvv) => { const r = cvv.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); if (cvv.width !== Math.round(r.width * dpr)) { cvv.width = Math.round(r.width * dpr); cvv.height = Math.round(r.height * dpr); } const c = cvv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w: r.width, h: r.height }; };
    sim.onDraw(() => {
      if (!st.running) return;
      const Lv = LEVELS[st.lv];
      const q = (k) => right.querySelector(`[data-o="${k}"]`);
      if (Lv.app === 'acc') { const a = accNow(st.t); if (q('x')) { q('x').textContent = MC.fix(a[0], 2).replace('−', '-'); q('y').textContent = MC.fix(a[1], 2).replace('−', '-'); q('z').textContent = MC.fix(a[2], 2).replace('−', '-'); } }
      if (Lv.app === 'log') { if (q('n')) q('n').textContent = String(st.data.length); if (q('file') && st.saved) q('file').value = '/datos.csv guardado:\n' + st.saved.split('\n').slice(0, 12).join('\n') + '\n…'; }
      if ((Lv.app === 'chart' || Lv.app === 'bt') && phoneCanvas) {
        const { c, w, h } = fitC(phoneCanvas);
        c.fillStyle = MC.col('--surface'); c.fillRect(0, 0, w, h);
        const xs = st.chart.map((p) => p[0]), ys = st.chart.map((p) => p[1]);
        const P = new MC.Plot(c, { x: 0, y: 0, w, h, xmin: Lv.app === 'bt' ? Math.max(0, st.t - 8) : 0, xmax: Lv.app === 'bt' ? Math.max(8, st.t) : 10, ymin: Lv.app === 'bt' ? 0 : 0, ymax: Lv.app === 'bt' ? 3000 : 16, xlabel: ['t', 's'], ylabel: Lv.app === 'bt' ? ['V', 'mV'] : ['a_z', 'm/s²'], ml: 42, mt: 10, grid: true });
        P.frame();
        P.xy(xs, ys, { color: '#2E5EAA', width: 1.4 });
      }
    });
    reset();
  });
})();
