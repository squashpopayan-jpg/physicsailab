/* Capítulo 35 — Ley de Ohm y circuitos */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* multímetro: ±(0,5 % + 2 dígitos) en 20 V (0,01 V) y ±(1 % + 2 dígitos) en 200 mA (0,1 mA) */
  const mV = (v, rnd) => L.quant(v * (1 + rnd.gauss(0, 0.002)) + rnd.gauss(0, 0.004), 0.01);
  const mI = (i, rnd) => L.quant(i * 1000 * (1 + rnd.gauss(0, 0.004)) + rnd.gauss(0, 0.05), 0.1);
  EM.defineSim('circuitos-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'circuitos', aspect: [1.25, 1.2],
      cols: [{ k: 'el', t: 'elemento' }, { k: 'V', t: 'V (V)', d: 2 }, { k: 'I', t: 'I (mA)', d: 1 }, { k: 'R', t: 'R = V/I (Ω)', d: 2 }, { k: 'P', t: 'P (mW)', d: 0 }],
      controles(sim) {
        sim.group('Experimento');
        sim.seg('modo', { label: 'Parte', options: [['iv', 'Curvas I–V'], ['abc', 'Circuito mixto'], ['pila', 'Pila real']], value: 'abc' });
        sim.seg('elem', { label: 'Elemento (curvas I–V)', options: [['R', 'Resistencia 100 Ω'], ['B', 'Bombillo 2,5 V']], value: 'B' });
        sim.slider('V', { label: 'Voltaje aplicado (curvas I–V)', min: 0.1, max: 3, step: 0.05, value: 1.5, unit: 'V', fmt: (v) => EM.fix(v, 2) });
        sim.check('sinB', { label: 'Desconectar B', value: false });
        sim.check('sinC', { label: 'Desconectar C', value: false });
        sim.slider('E', { label: 'fem de la fuente (2 pilas)', min: 2.4, max: 3.2, step: 0.01, value: 3.0, unit: 'V', fmt: (v) => EM.fix(v, 2) });
        sim.slider('r', { label: 'Resistencia interna', min: 0.05, max: 3, step: 0.05, value: 0.5, unit: 'Ω', fmt: (v) => EM.fix(v, 2) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h;
        if (p.modo === 'abc') {
          const c = MO.circuitoABC(p.E, p.r, { sinB: p.sinB, sinC: p.sinC }), Pn = 2.5 * 0.3;
          const xa = W * 0.12, xb = W * 0.85, xl = W * 0.35, yt = H * 0.18, y1 = H * 0.46, y2 = H * 0.7, yb = H * 0.86, rb = 14;
          const seg = (x1, y, x2, xm) => { D.line(ctx, x1, y, xm - rb - 2, y, { width: 1.8 }); D.line(ctx, xm + rb + 2, y, x2, y, { width: 1.8 }); };
          D.fuente(ctx, xa, yb, xa, yt, { label: EM.fix(p.E, 1) + ' V' });
          seg(xa, yt, xb, W * 0.5);
          D.bombillo(ctx, W * 0.5, yt - 2, rb, Math.min(1, c.PA / Pn), { label: 'A' });
          D.line(ctx, xb, yt, xb, y2, { width: 1.8 });
          seg(xl, y1, xb, W * 0.6); seg(xl, y2, xb, W * 0.6);
          D.line(ctx, xl, y1, xl, yb, { width: 1.8 }); D.line(ctx, xl, yb, xa, yb, { width: 1.8 });
          if (!p.sinB) D.bombillo(ctx, W * 0.6, y1 - 2, rb, Math.min(1, c.PB / Pn), { label: 'B' }); else D.label(ctx, 'B quitado', W * 0.6, y1 - 6, { align: 'center', color: '--c2' });
          if (!p.sinC) D.bombillo(ctx, W * 0.6, y2 - 2, rb, Math.min(1, c.PC / Pn), { label: 'C' }); else D.label(ctx, 'C quitado', W * 0.6, y2 - 6, { align: 'center', color: '--c2' });
          D.label(ctx, 'P: A ' + EM.fix(c.PA * 1000, 0) + ' mW · B ' + EM.fix(c.PB * 1000, 0) + ' mW · C ' + EM.fix(c.PC * 1000, 0) + ' mW', W * 0.5, H * 0.97, { align: 'center' });
        } else if (p.modo === 'iv') {
          const I = p.elem === 'R' ? p.V / 100 : MO.iBombillo(p.V);
          D.fuente(ctx, W * 0.15, H * 0.75, W * 0.15, H * 0.3, { label: EM.fix(p.V, 2) + ' V' });
          D.line(ctx, W * 0.15, H * 0.3, W * 0.85, H * 0.3, { width: 1.8 }); D.line(ctx, W * 0.85, H * 0.3, W * 0.85, H * 0.75, { width: 1.8 }); D.line(ctx, W * 0.15, H * 0.75, W * 0.85, H * 0.75, { width: 1.8 });
          if (p.elem === 'R') D.resistor(ctx, W * 0.4, H * 0.3, W * 0.62, H * 0.3, { label: '100 Ω' }); else D.bombillo(ctx, W * 0.5, H * 0.28, 16, Math.min(1, (p.V * I) / 0.75), { label: '2,5 V' });
          D.multimetro(ctx, W * 0.6, H * 0.45, W * 0.16, EM.fix(I * 1000, 1), { modo: 'mA' });
        } else {
          D.fuente(ctx, W * 0.2, H * 0.75, W * 0.2, H * 0.3, { label: 'ε, r' });
          D.line(ctx, W * 0.2, H * 0.3, W * 0.8, H * 0.3, { width: 1.8 }); D.line(ctx, W * 0.8, H * 0.3, W * 0.8, H * 0.75, { width: 1.8 }); D.line(ctx, W * 0.2, H * 0.75, W * 0.8, H * 0.75, { width: 1.8 });
          D.resistor(ctx, W * 0.8, H * 0.35, W * 0.8, H * 0.7, { label: 'carga' });
          D.label(ctx, 'Se cambian cargas de 220 Ω a 10 Ω', W * 0.5, H * 0.9, { align: 'center' });
        }
      },
      medir(p, rnd) {
        if (p.modo === 'iv') { const I = p.elem === 'R' ? p.V / 100 : MO.iBombillo(p.V), V = mV(p.V, rnd), Im = mI(I, rnd); return { el: p.elem === 'R' ? '100 Ω' : 'bombillo', V, I: Im, R: V / (Im / 1000), P: V * Im }; }
        if (p.modo === 'abc') {
          const c = MO.circuitoABC(p.E, p.r, { sinB: p.sinB, sinC: p.sinC }), out = [];
          const iB = p.sinB ? 0 : MO.iBombillo(c.VB), iC = p.sinC ? 0 : MO.iBombillo(c.VC);
          for (const [el, V, I] of [['A', c.VA, c.I], ['B', c.VB, iB], ['C', c.VC, iC]]) { const Vm = mV(V, rnd), Im = mI(I, rnd); out.push({ el: el + (p.sinB || p.sinC ? ' (modificado)' : ''), V: Vm, I: Im, R: Im > 0 ? Vm / (Im / 1000) : '—', P: Vm * Im }); }
          return out;
        }
        const out = [];
        for (const R of [220, 100, 47, 22, 10]) { const I = p.E / (R + p.r), V = p.E - I * p.r, Vm = mV(V, rnd), Im = mI(I, rnd); out.push({ el: 'carga ' + R + ' Ω', V: Vm, I: Im, R: Vm / (Im / 1000), P: Vm * Im }); }
        return out;
      },
      serie(p, rnd, st) {
        if (p.modo === 'iv') { let out = []; for (const elem of ['R', 'B']) for (const V of [0.25, 0.5, 1, 1.5, 2, 2.5, 3]) out.push(this.medir(Object.assign({}, p, { elem, V }), rnd, st)); return out; }
        if (p.modo === 'abc') return this.medir(Object.assign({}, p, { sinB: false, sinC: false }), rnd, st).concat(this.medir(Object.assign({}, p, { sinB: true, sinC: false }), rnd, st));
        return this.medir(p, rnd, st);
      },
      grafica(rows, p) {
        if (p.modo === 'iv') { const sel = rows.filter((r) => (p.elem === 'R' ? r.el === '100 Ω' : r.el === 'bombillo')); return { x: sel.map((r) => r.V), y: sel.map((r) => r.I), xl: 'V (V)', yl: 'I (mA)', ajuste: p.elem === 'R' ? 'origen' : null, curva: (v) => (p.elem === 'R' ? (v / 100) * 1000 : MO.iBombillo(v) * 1000), xextra: [0, 3], yextra: [0] }; }
        if (p.modo === 'pila') return { x: rows.map((r) => r.I), y: rows.map((r) => r.V), xl: 'I (mA)', yl: 'V en terminales (V)', ajuste: 'recta', cero: false };
        return { x: rows.map((_, i) => i + 1), y: rows.map((r) => r.P), xl: 'medida', yl: 'P (mW)', ajuste: null, xr: [0, Math.max(7, rows.length + 1)], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const out = [];
        if (p.modo === 'iv' && fit && p.elem === 'R') out.push(['R', 'R = 1/pendiente', L.pm(1000 / fit.m, (1000 * fit.sm) / (fit.m * fit.m), 'Ω'), true]);
        if (p.modo === 'iv' && p.elem === 'B') out.push(['Rb', 'Resistencia del bombillo a este voltaje', EM.fix(p.V / MO.iBombillo(p.V), 2) + ' Ω']);
        if (p.modo === 'pila' && fit && rows.length >= 3) { out.push(['E', 'fem = intercepto', L.pm(fit.b, fit.sb, 'V'), true]); out.push(['r', 'r = −pendiente', L.pm(-fit.m * 1000, fit.sm * 1000, 'Ω'), true]); }
        if (p.modo === 'abc') { const c = MO.circuitoABC(p.E, p.r, { sinB: p.sinB, sinC: p.sinC }); out.push(['I', 'Corriente por A', EM.fix(c.I * 1000, 1) + ' mA']); out.push(['P', 'Brillo (potencia) A · B · C', EM.fix(c.PA * 1000, 0) + ' · ' + EM.fix(c.PB * 1000, 0) + ' · ' + EM.fix(c.PC * 1000, 0) + ' mW', true]); }
        return out;
      }
    });
  });
})();
