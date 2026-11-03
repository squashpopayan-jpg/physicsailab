/* Capítulo 20 — Protocolos: analizador lógico virtual */
(function () {
  'use strict';
  const EM = window.EM;
  const bitsOf = (v, n, msb) => { const a = []; for (let i = 0; i < n; i++) a.push(msb ? (v >> (n - 1 - i)) & 1 : (v >> i) & 1); return a; };

  /* Cada canal: {name, pts:[[t_us, nivel]...]} y anotaciones [{t0,t1,txt}] */
  function uart(byte, baud) {
    const T = 1e6 / baud, bits = [0, ...bitsOf(byte, 8, false), 1], pts = [[0, 1]], ann = [];
    let t = T * 0.5;
    pts.push([t, 1]);
    bits.forEach((b, i) => { pts.push([t, b]); ann.push({ t0: t, t1: t + T, txt: i === 0 ? 'inicio' : i === 9 ? 'parada' : 'D' + (i - 1) + '=' + b }); t += T; pts.push([t, b]); });
    pts.push([t, 1]); t += T * 0.5; pts.push([t, 1]);
    return { dur: t, ch: [{ name: 'TX', pts, ann }], info: 'bit = ' + EM.fix(T, 1) + ' µs · byte = ' + EM.fix(T * 10, 0) + ' µs' };
  }
  function i2c(addr, byte, fkHz) {
    const T = 1000 / fkHz, scl = [[0, 1]], sda = [[0, 1]], ann = [];
    let t = T;
    const set = (a, v, tt) => { a.push([tt, a[a.length - 1][1]]); a.push([tt, v]); };
    set(sda, 0, t); ann.push({ t0: t, t1: t + T / 2, txt: 'S' }); t += T / 2; set(scl, 0, t);
    const sendByte = (b, label, ack) => {
      const bs = bitsOf(b, 8, true).concat([0]);
      bs.forEach((v, i) => { set(sda, v, t); set(scl, 1, t + T / 2); set(scl, 0, t + T); ann.push({ t0: t, t1: t + T, txt: i === 8 ? 'ACK' : String(v) }); t += T; });
      ann.push({ t0: t - 9 * T, t1: t - T, txt: label, big: true });
    };
    sendByte((addr << 1) | 0, '0x' + ((addr << 1) | 0).toString(16).toUpperCase() + ' (dir. + W)');
    sendByte(byte, 'dato 0x' + byte.toString(16).toUpperCase());
    set(sda, 0, t); set(scl, 1, t + T / 2); set(sda, 1, t + T); ann.push({ t0: t + T / 2, t1: t + T, txt: 'P' }); t += 1.5 * T;
    sda.push([t, 1]); scl.push([t, 1]);
    return { dur: t, ch: [{ name: 'SCL', pts: scl, ann: [] }, { name: 'SDA', pts: sda, ann }], info: '18 pulsos de reloj a ' + fkHz + ' kHz = ' + EM.fix(18 * T, 0) + ' µs' };
  }
  function spi(byte, fMHz) {
    const T = 1 / fMHz, cs = [[0, 1]], sck = [[0, 0]], mosi = [[0, 0]], ann = [];
    let t = T;
    const set = (a, v, tt) => { a.push([tt, a[a.length - 1][1]]); a.push([tt, v]); };
    set(cs, 0, t); t += T / 2;
    bitsOf(byte, 8, true).forEach((v, i) => { set(mosi, v, t); set(sck, 1, t + T / 2); set(sck, 0, t + T); ann.push({ t0: t, t1: t + T, txt: String(v) }); t += T; });
    t += T / 2; set(cs, 1, t); t += T;
    [cs, sck, mosi].forEach((a) => a.push([t, a[a.length - 1][1]]));
    return { dur: t, ch: [{ name: 'CS', pts: cs, ann: [] }, { name: 'SCK', pts: sck, ann: [] }, { name: 'MOSI', pts: mosi, ann }], info: '8 pulsos a ' + fMHz + ' MHz = ' + EM.fix(8 * T, 1) + ' µs' };
  }

  EM.defineSim('analizador', function (sim) {
    sim.below();
    const cv = sim.canvas({ aspect: 2.6 });
    sim.seg('p', { label: 'Protocolo', options: [['uart', 'UART'], ['i2c', 'I²C'], ['spi', 'SPI']], value: 'uart' });
    sim.slider('b', { label: 'Byte a transmitir (decimal)', min: 0, max: 255, step: 1, value: 65, fmt: (v) => v.toFixed(0) });
    sim.seg('baud', { label: 'Velocidad (UART)', options: [[9600, '9600'], [115200, '115200']], value: 9600 });
    sim.out('bin', 'Byte', { hl: true }); sim.out('asc', 'Carácter ASCII'); sim.out('inf', 'Temporización'); sim.out('tot', 'Duración total de la transmisión');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, b = Math.round(sim.p.b);
      EM.draw.clear(cv);
      const r = sim.p.p === 'uart' ? uart(b, sim.p.baud) : sim.p.p === 'i2c' ? i2c(0x27, b, 100) : spi(b, 1);
      const n = r.ch.length, ml = 56, mr = 14, top = 24, rowH = (H - top - 26) / n, x = (t) => ml + (t / r.dur) * (W - ml - mr);
      r.ch.forEach((c, k) => {
        const y0 = top + k * rowH, yh = y0 + rowH * 0.22, yl = y0 + rowH * 0.62;
        EM.text(ctx, c.name, 8, (yh + yl) / 2, { size: 13, weight: 700, color: '--ink', mono: true });
        ctx.strokeStyle = EM.col('--grid-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ml, yl); ctx.lineTo(W - mr, yl); ctx.stroke();
        ctx.strokeStyle = EM.col(['--c1', '--c2', '--c3'][k % 3]); ctx.lineWidth = 2.2; ctx.beginPath();
        c.pts.forEach((p, i) => { const px = x(p[0]), py = p[1] ? yh : yl; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke();
        for (const a of c.ann) {
          const xa = x(a.t0), xb = x(a.t1);
          if (!a.big) { ctx.strokeStyle = EM.col('--rule'); ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(xa, y0 + 2); ctx.lineTo(xa, yl + 6); ctx.stroke(); ctx.setLineDash([]); EM.text(ctx, a.txt, (xa + xb) / 2, yl + 14, { size: Math.max(9, Math.min(12, (xb - xa) * 0.4)), color: '--ink-2', align: 'center', mono: true }); }
          else EM.text(ctx, a.txt, (xa + xb) / 2, y0 + 4, { size: 11.5, color: '--accent', align: 'center', weight: 700 });
        }
      });
      const bin = b.toString(2).padStart(8, '0');
      sim.set('bin', `${bin} · 0x${b.toString(16).toUpperCase().padStart(2, '0')} · ${b}`);
      sim.set('asc', b >= 32 && b < 127 ? '«' + String.fromCharCode(b) + '»' : '(no imprimible)');
      sim.set('inf', r.info);
      sim.set('tot', EM.fix(r.dur, 0) + ' µs');
    });
  });
})();
