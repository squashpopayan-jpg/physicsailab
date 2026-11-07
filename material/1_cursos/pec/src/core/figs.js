/* Figuras generadas: espiral de maduración, intra/interculturalidad y tejido de los cinco hilos. */
(function () {
  'use strict';
  const PEC = (window.PEC = window.PEC || {});
  const figs = (PEC.figs = {});
  const f1 = (n) => Math.round(n * 10) / 10;

  /* Espiral de maduración de la semilla: de adentro hacia afuera (siembra → nueva semilla) */
  figs.espiral = function () {
    const cx = 480, cy = 340, a = 18, b = 17;
    const R = (t) => a + b * t;
    const P = (t) => [cx + R(t) * Math.cos(t - Math.PI / 2), cy + R(t) * Math.sin(t - Math.PI / 2)];
    let d = '';
    for (let t = 0.5; t <= 13.6; t += 0.08) { const p = P(t); d += (d ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }
    const stages = [['Siembra', 1.25], ['Germinación', 3.7], ['Crecimiento', 6.4], ['Floración', 8.7], ['Fructificación', 11.0], ['Nueva semilla', 13.3]];
    let leaves = '';
    for (let t = 1.6; t < 13; t += 0.9) {
      const p = P(t), side = (Math.round(t * 10) % 2 ? 1 : -1);
      const ang = ((t - Math.PI / 2) * 180) / Math.PI + 90 + side * 52;
      leaves += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="20" ry="8" fill="var(--leaf)" opacity=".85" transform="rotate(${f1(ang)} ${f1(p[0])} ${f1(p[1])}) translate(${side * 14} 0)"/>`;
    }
    let marks = '';
    stages.forEach((s, i) => {
      const p = P(s[1]); const out = 1;
      const ang = s[1] - Math.PI / 2; const lx = p[0] + Math.cos(ang) * 44 * out, ly = p[1] + Math.sin(ang) * 44 * out;
      const right = lx >= cx;
      marks += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="21" fill="var(--gold)" stroke="var(--maroon)" stroke-width="4"/><text x="${f1(p[0])}" y="${f1(p[1] + 9)}" text-anchor="middle" font-size="26" font-weight="800" fill="#1B1A2E" font-family="Baloo 2, sans-serif">${i + 1}</text>`;
      marks += `<text class="svgt m" x="${f1(right ? p[0] + 34 : p[0] - 34)}" y="${f1(p[1] + 9)}" text-anchor="${right ? 'start' : 'end'}" font-size="29">${s[0]}</text>`;
    });
    return `<svg viewBox="0 0 960 680" role="img" aria-label="Espiral de maduración de la semilla, de adentro hacia afuera: 1 siembra, 2 germinación, 3 crecimiento, 4 floración, 5 fructificación, 6 nueva semilla"><path d="${d}" fill="none" stroke="var(--leaf)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>${leaves}${marks}</svg>`;
  };

  /* Intraculturalidad – interculturalidad – intraculturalidad: dos espirales unidas por una S */
  figs.intrainter = function () {
    const spiral = (cx, cy, t0, t1, dir, step) => { const pts = []; for (let t = t0; t <= t1 + 1e-9; t += step) { const r = 10 + 13 * t; pts.push([cx + r * Math.cos(dir * t), cy + r * Math.sin(dir * t)]); } return pts; };
    const L = spiral(190, 190, 0.2, 7.2, 1, 0.1);   /* sale desde el centro izquierdo */
    const Rr = spiral(630, 190, 0.2, 7.2, -1, 0.1).reverse(); /* entra al centro derecho */
    const pl = L[L.length - 1], pr = Rr[0];
    let d = 'M' + L.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L');
    d += `C${f1(pl[0] + 120)} ${f1(pl[1] - 20)} ${f1(pr[0] - 120)} ${f1(pr[1] + 20)} ${f1(pr[0])} ${f1(pr[1])}`;
    d += 'L' + Rr.slice(1).map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L');
    return `<svg viewBox="0 0 820 430" role="img" aria-label="Dos espirales unidas por una curva: intraculturalidad, interculturalidad, intraculturalidad"><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
      '<circle cx="190" cy="190" r="14" fill="var(--gold)" stroke="var(--maroon)" stroke-width="4"/><circle cx="630" cy="190" r="14" fill="var(--gold)" stroke="var(--maroon)" stroke-width="4"/>' +
      '<text class="svgt m" x="190" y="48" text-anchor="middle" font-size="31">1 · Intraculturalidad</text>' +
      '<text class="svgt m" x="410" y="408" text-anchor="middle" font-size="31" style="fill:var(--accent)">2 · Interculturalidad</text>' +
      '<text class="svgt m" x="630" y="48" text-anchor="middle" font-size="31">3 · Intraculturalidad</text></svg>';
  };

  /* Cinco ovillos (hilos) que se cruzan con los cinco sectores, atravesados por la espiritualidad */
  figs.tejido = function () {
    const hilos = [['Agroambiental', 'var(--h1)'], ['Derecho mayor', 'var(--h2)'], ['Artes y culturas', 'var(--h3)'], ['Bienestar y deporte', 'var(--h4)'], ['Comunicación y lenguajes', 'var(--h5)']];
    const sect = ['Santa Ana', 'Novirao Centro', 'Santa Bárbara', 'Santa Teresa', 'Alto Novirao'];
    const ys = [90, 205, 320, 435, 550];
    let lines = '', balls = '', mts = '';
    hilos.forEach((h, i) => sect.forEach((s, j) => { lines += `<line x1="388" y1="${ys[i]}" x2="566" y2="${ys[j]}" stroke="${h[1]}" stroke-width="4" opacity=".62"/>`; }));
    hilos.forEach((h, i) => {
      balls += `<circle cx="362" cy="${ys[i]}" r="26" fill="${h[1]}" stroke="var(--canvas)" stroke-width="4"/><path d="M347 ${ys[i] - 8}q15 -10 30 0M344 ${ys[i] + 2}q18 -12 36 0M347 ${ys[i] + 12}q15 -10 30 0" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3"/>`;
      balls += `<text class="svgt" x="326" y="${ys[i] + 9}" text-anchor="end" font-size="25" font-weight="700">${h[0]}</text>`;
    });
    sect.forEach((s, j) => {
      mts += `<path d="M582 ${ys[j] + 18}l16 -30l10 14l10 -22l20 38z" fill="var(--accent)" opacity=".9"/><text class="svgt" x="650" y="${ys[j] + 10}" font-size="25" font-weight="700">${s}</text>`;
    });
    return `<svg viewBox="0 0 860 640" role="img" aria-label="Cada uno de los cinco hilos dinamizadores se cruza con los cinco sectores del territorio, atravesados por la espiritualidad">${lines}${balls}${mts}` +
      '<text class="svgt m" transform="translate(476 320) rotate(-90)" text-anchor="middle" font-size="25" letter-spacing="7" style="fill:var(--maroon)">ESPIRITUALIDAD</text></svg>';
  };
})();
