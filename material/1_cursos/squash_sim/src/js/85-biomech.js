/* Biomecánica: estocada, cadena cinética, puntos de impacto, física de la bola y cobertura desde la T. */
MS.Biomech = (function () {
  const { U, C, Chart, Ball, Shots, Player, Top } = MS;
  const deg = U.deg;

  /* ================= 1 · Estocada ================= */
  let heel = 'ancla';
  function ik2(H, A, l1, l2, pickLow) {
    let dx = A.x - H.x, dz = A.z - H.z, d = Math.hypot(dx, dz);
    const straight = d >= l1 + l2 - 1e-4;
    d = Math.min(d, l1 + l2 - 1e-4);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const ux = dx / Math.hypot(dx, dz), uz = dz / Math.hypot(dx, dz);
    const bx = H.x + ux * a, bz = H.z + uz * a;
    const k1 = { x: bx - uz * h, z: bz + ux * h }, k2 = { x: bx + uz * h, z: bz - ux * h };
    const K = pickLow ? (k1.z < k2.z ? k1 : k2) : (k1.x > k2.x ? k1 : k2);
    return { K, straight };
  }
  const ang = (P, Q, R) => { const a = { x: P.x - Q.x, z: P.z - Q.z }, b = { x: R.x - Q.x, z: R.z - Q.z }; return deg(Math.acos(U.clamp((a.x * b.x + a.z * b.z) / (Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z)), -1, 1))); };
  function lunge() {
    const L = +U.$('#luLen').value, h = +U.$('#luHip').value, lam = U.rad(+U.$('#luTr').value), p = +U.$('#luCom').value;
    U.$('#luLenL').textContent = U.num(L, 2) + ' m'; U.$('#luHipL').textContent = U.num(h, 2) + ' m'; U.$('#luTrL').textContent = Math.round(deg(lam)) + '°'; U.$('#luComL').textContent = Math.round(p * 100) + ' % del largo';
    const A = { x: 0, z: 0.08 }, toe = 0.18, heelF = -0.07;
    const Ar = heel === 'ancla' ? { x: -L, z: 0.08 } : { x: -L + 0.08, z: 0.14 };
    const H = { x: -p * L, z: h };
    const fr = ik2(H, A, 0.45, 0.45, false), rr = ik2(H, Ar, 0.45, 0.45, true);
    const Kf = fr.K, Kr = rr.K;
    const S = { x: H.x + Math.sin(lam) * 0.52, z: H.z + Math.cos(lam) * 0.52 };
    const head = { x: S.x + Math.sin(lam * 0.55) * 0.2, z: S.z + Math.cos(lam * 0.55) * 0.2 };
    /* centro de masa (proporciones segmentarias de Dempster, aproximadas) */
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
    const parts = [[0.578, { x: H.x + Math.sin(lam) * 0.3, z: H.z + Math.cos(lam) * 0.3 }], [0.1, mid(H, Kf)], [0.1, mid(H, Kr)], [0.061, mid(Kf, A)], [0.061, mid(Kr, Ar)]];
    const mt = parts.reduce((s, q) => s + q[0], 0);
    const G = { x: parts.reduce((s, q) => s + q[0] * q[1].x, 0) / mt, z: parts.reduce((s, q) => s + q[0] * q[1].z, 0) / mt };
    const back = heel === 'ancla' ? -L - 0.06 : -L + 0.04, front = toe;
    const margin = Math.min(G.x - back, front - G.x);
    const kneeAng = ang(H, Kf, A), over = Kf.x - toe, hipAng = ang(S, H, Kf), flex = 180 - kneeAng;
    const pf = Math.round(100 * Math.pow(Math.max(0, flex) / 90, 1.7) * (1 + Math.max(0, over) * 3));
    const lum = Math.round(100 * Math.sin(lam) / Math.sin(U.rad(45)));
    const rec = 0.3 + 0.35 * (L - 1.0) + 0.7 * Math.max(0, 0.62 - h) + 1.5 * Math.max(0, over) + (heel === 'punta' ? 0.08 : 0);
    const rec0 = 0.3 + 0.35 * 0.3;
    /* dibujo */
    const c = Chart.setup(U.$('#luCanvas'));
    const { ctx, w, hh = c.h, T } = c;
    const sc = Math.min(w / 3.3, c.h / 2.0), ox = w * 0.66, oz = c.h - 18;
    const X = (x) => ox + x * sc, Z = (z) => oz - z * sc;
    ctx.fillStyle = '#ddb47c'; ctx.fillRect(0, Z(0), w, c.h - Z(0));
    /* base de sustentación */
    ctx.fillStyle = margin > 0.05 ? 'rgba(43,138,87,.35)' : 'rgba(192,54,54,.4)'; ctx.fillRect(X(back), Z(0) - 4, X(front) - X(back), 8);
    const seg = (a, b, wd, col) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(a.x), Z(a.z)); ctx.lineTo(X(b.x), Z(b.z)); ctx.stroke(); };
    seg(H, Kr, 15, '#5a6b80'); seg(Kr, Ar, 11, '#5a6b80');
    if (heel === 'ancla') seg({ x: Ar.x - 0.05, z: 0.03 }, { x: Ar.x + 0.05, z: 0.03 }, 9, '#f2f2f2'); else seg({ x: Ar.x - 0.03, z: 0.1 }, { x: Ar.x + 0.12, z: 0.02 }, 8, '#f2f2f2');
    seg(H, S, 26, '#1f6fb2');
    seg(H, Kf, 16, '#2a3340'); seg(Kf, A, 12, '#e3bfa3'); seg({ x: heelF, z: 0.03 }, { x: toe, z: 0.03 }, 9, '#f7f7f7');
    const wr = { x: S.x + 0.62, z: Math.max(0.25, S.z - 0.35) };
    seg(S, wr, 9, '#e3bfa3'); seg(wr, { x: wr.x + 0.55, z: wr.z - 0.18 }, 3, '#222');
    ctx.fillStyle = '#e3bfa3'; ctx.beginPath(); ctx.arc(X(head.x), Z(head.z), 0.11 * sc, 0, Math.PI * 2); ctx.fill();
    /* rodilla y vertical de la punta */
    ctx.setLineDash([4, 4]); ctx.strokeStyle = T.ink3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(toe), Z(0)); ctx.lineTo(X(toe), Z(1.0)); ctx.stroke(); ctx.setLineDash([]);
    const kcol = over > 0.02 ? T.bad : flex > 95 ? T.warn : T.ok;
    ctx.strokeStyle = kcol; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X(Kf.x), Z(Kf.z), 13, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = kcol; ctx.font = '600 13px "IBM Plex Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText(Math.round(kneeAng) + '°', X(Kf.x) + 17, Z(Kf.z) - 6);
    /* centro de masa */
    ctx.fillStyle = T.red; ctx.beginPath(); ctx.arc(X(G.x), Z(G.z), 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T.red; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(G.x), Z(G.z)); ctx.lineTo(X(G.x), Z(0)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = T.ink2; ctx.font = '11px "Source Sans 3", Arial'; ctx.fillText('centro de masa', X(G.x) + 8, Z(G.z) + 4);
    ctx.fillText('punta del pie', X(toe) + 4, Z(1.0) + 10);
    /* vista superior de la base */
    const c2 = Chart.setup(U.$('#luBase'));
    const s2 = Math.min(c2.w / 3.0, c2.h / 0.9), o2 = c2.w * 0.7, z2 = c2.h / 2;
    const XX = (x) => o2 + x * s2, YY = (y) => z2 + y * s2;
    const ctx2 = c2.ctx;
    const foot = (cx, cy, l, wd, a, col) => { ctx2.save(); ctx2.translate(XX(cx), YY(cy)); ctx2.rotate(a); ctx2.fillStyle = col; ctx2.beginPath(); ctx2.ellipse(0, 0, l * s2 / 2, wd * s2 / 2, 0, 0, Math.PI * 2); ctx2.fill(); ctx2.restore(); };
    const poly = heel === 'ancla' ? [[heelF, -0.05], [toe, -0.05], [toe, 0.05], [-L + 0.05, 0.28], [-L - 0.05, 0.28], [-L - 0.05, 0.12]] : [[heelF, -0.05], [toe, -0.05], [toe, 0.05], [-L + 0.09, 0.2], [-L + 0.05, 0.2]];
    ctx2.fillStyle = margin > 0.05 ? 'rgba(43,138,87,.22)' : 'rgba(192,54,54,.25)'; ctx2.beginPath(); poly.forEach(([x, y], i) => (i ? ctx2.lineTo(XX(x), YY(y)) : ctx2.moveTo(XX(x), YY(y)))); ctx2.closePath(); ctx2.fill();
    foot(0.055, 0, 0.27, 0.1, 0, '#2a3340');
    if (heel === 'ancla') foot(-L, 0.2, 0.27, 0.1, Math.PI / 2, '#5a6b80'); else foot(-L + 0.07, 0.2, 0.1, 0.09, 0, '#5a6b80');
    ctx2.fillStyle = T.red; ctx2.beginPath(); ctx2.arc(XX(G.x), YY(0.09), 5, 0, Math.PI * 2); ctx2.fill();
    ctx2.fillStyle = T.ink2; ctx2.font = '11px "Source Sans 3", Arial'; ctx2.textAlign = 'left'; ctx2.fillText('Vista desde arriba: base de sustentación y proyección del centro de masa', 8, 14);
    /* lecturas */
    const out = U.$('#luOut'); out.innerHTML = '';
    const tiles = [[Math.round(kneeAng) + '°', 'rodilla delantera'], [(over > 0 ? '+' : '') + Math.round(over * 100) + ' cm', 'rodilla vs. punta'], [Math.round(hipAng) + '°', 'tronco–muslo'], [U.num(margin * 100, 0) + ' cm', 'margen de equilibrio'], [pf, 'carga patelofemoral (90° = 100)'], [Math.max(0, lum), 'carga lumbar (45° = 100)'], [(rec - rec0 >= 0 ? '+' : '') + Math.round((rec - rec0) * 1000) + ' ms', 'tiempo extra para volver']];
    for (const [b, s] of tiles) out.append(U.h('div', null, U.h('b', null, String(b)), U.h('span', null, s)));
    const v = U.$('#luVerd'); v.innerHTML = '';
    const add = (k, t) => v.append(U.h('p', { class: 'verdict ' + k }, t));
    if (fr.straight) add('warn', 'Pierna delantera estirada: estocada máxima («estirada»), recurso para bolas muy lejanas.');
    else if (flex > 95) add('bad', 'Rodilla flexionada más de 90°: sobrecarga de la articulación patelofemoral, del tendón rotuliano y del cuádriceps, y cuesta más volver a la T.');
    else if (flex >= 70) add('ok', 'Rodilla cerca de 90°: el ángulo que el manual considera protector para los cruzados.');
    else add('warn', 'Estocada alta: poca flexión de rodilla. Si la bola está baja, el tronco tendrá que doblarse.');
    if (over > 0.02) add('bad', 'La rodilla pasa la punta del pie: el centro de gravedad se va adelante, se pierde equilibrio y el jugador se «pasa de largo».');
    if (deg(lam) > 40) add('bad', 'Tronco muy inclinado: carga sobre L5–S1. Bajar con las piernas y la espalda recta.');
    if (margin < 0.05) add('bad', 'Centro de masa al borde de la base: equilibrio precario.');
    if (heel === 'punta') add('warn', 'Pie trasero en punta: base más chica; el pie, la pierna y la cadera tienden a girar (manual).');
  }

  /* ================= 2 · Cadena cinética ================= */
  const SEG = [['Piernas', 3.5, '#8a6dd1'], ['Cadera', 3.0, '#3d8fc9'], ['Tronco', 3.0, '#2f9e5b'], ['Hombro', 7.5, '#e3a23a'], ['Codo', 6.0, '#d4442e'], ['Muñeca', 5.5, '#8b2d54']];
  const KPRE = {
    'Secuencia óptima': { t: [0, 40, 80, 125, 165, 200], a: [1, 1, 0.8, 1, 1, 0.85] },
    'Todo a la vez': { t: [150, 150, 150, 150, 150, 150], a: [1, 1, 1, 1, 1, 1] },
    'Solo brazo (muñequeo)': { t: [0, 40, 80, 125, 165, 200], a: [0.15, 0.2, 0.3, 0.9, 1.1, 1.6] },
    'Sin piernas': { t: [0, 40, 80, 125, 165, 200], a: [0.1, 0.5, 0.8, 1, 1, 0.9] },
    'Tronco que gira de más': { t: [0, 40, 130, 125, 165, 200], a: [1, 1, 1.8, 1, 1, 0.85] },
  };
  const K = { t: KPRE['Secuencia óptima'].t.slice(), a: KPRE['Secuencia óptima'].a.slice() };
  function chainCalc() {
    const c = []; for (let i = 0; i < 5; i++) { const d = K.t[i + 1] - K.t[i]; c.push(d < 0 ? 0.3 : 0.4 + 0.6 * Math.exp(-(((d - 42) / 35) ** 2))); }
    const contrib = SEG.map((s, i) => { let T = 1; for (let k = i; k < 5; k++) T *= c[k]; return K.a[i] * s[1] * T; });
    const v = contrib.reduce((s, x) => s + x, 0);
    const distal = (contrib[4] + contrib[5]) / Math.max(1e-6, v);
    const load = Math.round(100 * (distal / 0.42) * Math.max(1, K.a[5]) * Math.max(1, K.a[4]));
    return { c, contrib, v, distal, load, lumbar: Math.round(100 * K.a[2] * K.a[2] / 0.64) };
  }
  function chain() {
    const R = chainCalc();
    const cc = Chart.setup(U.$('#kcCanvas'));
    const F = Chart.frame(cc, { x0: -60, x1: 300, y0: 0, y1: 1.15, xticks: [0, 100, 200], fx: (v) => v + ' ms', yticks: [0.5, 1], fy: () => '', xlabel: 'tiempo', ylabel: 'velocidad de cada segmento', pad: { l: 34 } });
    F.ctx.strokeStyle = F.tok.ink3; F.ctx.setLineDash([3, 3]); F.ctx.beginPath(); F.ctx.moveTo(F.X(200), F.T); F.ctx.lineTo(F.X(200), F.B); F.ctx.stroke(); F.ctx.setLineDash([]);
    F.ctx.fillStyle = F.tok.ink2; F.ctx.font = '11px "Source Sans 3", Arial'; F.ctx.textAlign = 'center'; F.ctx.fillText('impacto', F.X(200), F.T + 10);
    SEG.forEach((s, i) => {
      const pts = []; for (let t = -60; t <= 300; t += 4) pts.push([t, (K.a[i] / 1.8) * Math.exp(-(((t - K.t[i]) / 34) ** 2))]);
      Chart.line(F, pts, s[2], 2.2);
      F.ctx.fillStyle = s[2]; F.ctx.font = '600 11px "Source Sans 3", Arial'; F.ctx.textAlign = 'center';
      F.ctx.fillText(s[0], F.X(K.t[i]), F.Y(K.a[i] / 1.8) - 6);
    });
    const out = U.$('#kcOut'); out.innerHTML = '';
    for (const [b, s] of [[U.num(R.v * 3.6, 0) + ' km/h', 'cabeza de la raqueta'], [U.num(R.v * 3.6 * 1.3, 0) + ' km/h', 'bola (estimada)'], [R.load, 'carga en codo y muñeca'], [R.lumbar, 'carga lumbar (óptima = 100)']]) out.append(U.h('div', null, U.h('b', null, String(b)), U.h('span', null, s)));
    const v = U.$('#kcVerd');
    const vOpt = 93;
    v.className = 'verdict ' + (R.load > 150 || R.lumbar > 200 ? 'bad' : R.v * 3.6 < vOpt * 0.8 ? 'warn' : 'ok');
    v.textContent = R.load > 150 ? 'La muñeca y el codo hacen el trabajo de las piernas y el tronco: menos control y riesgo de epicondilitis o epitrocleítis.' : R.lumbar > 200 ? 'El tronco gira de más: se pierde control y se carga la zona lumbar (el manual pide minimizar esa rotación).' : R.v * 3.6 < vOpt * 0.8 ? 'La velocidad no se transmite: revisa el orden y el retraso entre segmentos (30–60 ms).' : 'Secuencia eficiente: cada segmento acelera al siguiente; potencia con poco esfuerzo.';
    for (const [i, el] of U.$$('#kcSliders input').entries()) { el.value = K.t[i]; U.$('#kcSl' + i).textContent = K.t[i] + ' ms'; }
  }
  function chainUI() {
    const pre = U.$('#kcPre');
    for (const k in KPRE) { const b = U.h('button', { class: 'chip', 'aria-pressed': String(k === 'Secuencia óptima'), text: k }); b.addEventListener('click', () => { K.t = KPRE[k].t.slice(); K.a = KPRE[k].a.slice(); for (const c of U.$$('#kcPre .chip')) c.setAttribute('aria-pressed', String(c === b)); chain(); }); pre.append(b); }
    const box = U.$('#kcSliders');
    SEG.forEach((s, i) => {
      const inp = U.h('input', { type: 'range', min: -50, max: 260, step: 5, value: K.t[i], 'aria-label': 'Pico de ' + s[0] });
      inp.addEventListener('input', () => { K.t[i] = +inp.value; for (const c of U.$$('#kcPre .chip')) c.setAttribute('aria-pressed', 'false'); chain(); });
      box.append(U.h('label', { class: 'fld' }, U.h('span', { class: 'row2' }, U.h('span', null, U.h('span', { class: 'dot', style: { background: s[2] } }), 'Pico de ' + s[0].toLowerCase()), U.h('b', { id: 'kcSl' + i }, K.t[i] + ' ms')), inp));
    });
  }

  /* ================= 3 · Puntos de impacto ================= */
  let ipTraj = null;
  function impact() {
    const off = +U.$('#ipOff').value;
    U.$('#ipOffL').textContent = off > 0 ? off + ' cm adelante' : off < 0 ? -off + ' cm atrás' : 'en la línea del pie';
    const c = Chart.setup(U.$('#ipTop'));
    const { ctx, w, h } = c;
    /* porción de la cancha: mitad derecha y frontal, jugador diestro de drive */
    const x0 = 1.9, y0 = -0.3, vw = C.W + 0.25 - x0, vh = 7.4 - y0;
    const s0 = Math.min(w / vw, h / vh), ox = (w - vw * s0) / 2 - x0 * s0, oy = -y0 * s0;
    const L = { s: s0, ox, oy, X: (x) => ox + x * s0, Y: (y) => oy + y * s0 };
    Top.court(ctx, L, {});
    const { X, Y, s } = L;
    const foot = { x: 4.95, y: 6.1 };
    const ball = { x: 5.85, y: foot.y - off / 100 };
    const th = U.rad(off * 0.9);
    /* dirección inicial: paralela a la lateral hacia la frontal, girada θ hacia el centro */
    let d = { x: -Math.sin(th), y: -Math.cos(th) };
    const pts = [ball]; let p = { x: ball.x, y: ball.y }, kind = 'paralela';
    if (off < -8) { kind = 'boast'; } else if (off > 8) kind = 'cruzada';
    for (let k = 0; k < 4; k++) {
      let tx = d.x > 0 ? (C.W - p.x) / d.x : d.x < 0 ? -p.x / d.x : Infinity, ty = d.y < 0 ? -p.y / d.y : (C.L - p.y) / d.y;
      const t = Math.min(tx, ty); p = { x: p.x + d.x * t, y: p.y + d.y * t }; pts.push(p);
      if (t === ty) { d = { x: d.x * 0.9, y: -d.y * 0.55 }; } else { d = { x: -d.x * 0.5, y: d.y * 0.85 }; }
      d = U.norm(d);
      if (pts.length > 3 && p.y > 7) break;
    }
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.setLineDash([]); ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(X(q.x), Y(q.y)) : ctx.moveTo(X(q.x), Y(q.y)))); ctx.stroke();
    /* jugador perfilado */
    ctx.save(); ctx.translate(X(foot.x), Y(foot.y));
    ctx.fillStyle = '#2a3340'; ctx.beginPath(); ctx.ellipse(0.06 * s, 0, 0.14 * s, 0.055 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a6b80'; ctx.beginPath(); ctx.ellipse(-1.05 * s, 0.15 * s, 0.055 * s, 0.14 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f6fb2'; ctx.beginPath(); ctx.ellipse(-0.45 * s, 0.05 * s, 0.13 * s, 0.25 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#d4442e'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(x0), Y(foot.y)); ctx.lineTo(X(C.W), Y(foot.y)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#d4442e'; ctx.font = `600 ${Math.max(10, 0.16 * s)}px "Source Sans 3", Arial`; ctx.textAlign = 'left'; ctx.fillText('línea del pie delantero', X(x0 + 0.15), Y(foot.y) - 5);
    ctx.fillStyle = '#0b0b0b'; ctx.beginPath(); ctx.arc(X(ball.x), Y(ball.y), Math.max(4, 0.07 * s), 0, Math.PI * 2); ctx.fill();
    const v = U.$('#ipDir');
    const M = { paralela: ['ok', 'B1 · En la línea de la pierna delantera → paralela: la bola sale pegada a la lateral.'], cruzada: ['ok', 'B2 · Por delante de la pierna delantera → cruzada: la bola cruza hacia la esquina contraria.'], boast: ['ok', 'B3 · Por detrás de la pierna delantera → boast: la bola busca primero la lateral cercana.'] };
    v.className = 'verdict ' + M[kind][0]; v.textContent = M[kind][1] + ' (sin usar la muñeca, como se enseña primero).';
    /* altura */
    if (!ipTraj) {
      const r = Shots.plan({ x: 1.0, y: 8.6, z: 0.6 }, 'drive', { env: Ball.env({ temp: 40 }) });
      ipTraj = r.ok ? r.traj : null;
    }
    const tr = ipTraj; if (!tr) return;
    const P = tr.pts; const iF = P.findIndex((q) => q.ev === 'front');
    let i2 = -1, n = 0; for (let i = iF + 1; i < P.length; i++) if (P[i].ev === 'floor') { n++; if (n === 2) { i2 = i; break; } }
    const seg2 = P.slice(iF, i2 > 0 ? i2 + 1 : P.length);
    const k = +U.$('#ipT').value / 100;
    const q = seg2[Math.min(seg2.length - 1, Math.round(k * (seg2.length - 1)))];
    const cand = Shots.candidates(tr, 'volea').concat(Shots.candidates(tr, 'pique'));
    let cls = 'volea'; const iFl = seg2.findIndex((x) => x.ev === 'floor');
    const idx = seg2.indexOf(q);
    let apexI = -1, apexZ = -1; for (let i = iFl + 1; i < seg2.length; i++) if (seg2[i].z > apexZ) { apexZ = seg2[i].z; apexI = i; }
    if (iFl < 0 || idx <= iFl) cls = q.z > 0.5 && q.y > 2.2 ? 'volea' : 'volea';
    else if (idx < apexI) cls = q.z < 0.38 ? 'sobrepique' : (apexZ - q.z < 0.1 ? 'maximo' : 'sobrepique');
    else cls = apexZ - q.z < 0.1 ? 'maximo' : 'bajo';
    U.$('#ipTL').textContent = U.num(q.t, 2) + ' s tras el golpe rival';
    const c2 = Chart.setup(U.$('#ipSide'));
    const F = Chart.frame(c2, { x0: 0, x1: C.L, y0: 0, y1: 2.2, xticks: [0, 2, 4, 6, 8], fx: (v) => v + ' m', yticks: [0.5, 1, 1.5, 2], fy: (v) => U.num(v, 1), xlabel: 'distancia desde la frontal', ylabel: 'altura (m)', pad: { l: 40 } });
    F.ctx.fillStyle = F.tok.red; F.ctx.fillRect(F.X(0) - 2, F.Y(C.tin), 4, F.Y(0) - F.Y(C.tin));
    Chart.line(F, seg2.map((x) => [x.y, x.z]), F.tok.ink3, 1.6, [4, 3]);
    const zones = [['B4', 'volea', '#3d8fc9'], ['B5', 'sobrepique', '#e3a23a'], ['B6', 'maximo', '#2b8a57'], ['B7', 'bajo', '#c03636']];
    /* marcas de cada zona */
    const mark = (pt, lab, col) => { if (!pt) return; Chart.dot(F, pt.y, pt.z, col, 4, lab); };
    const vpt = seg2.find((x, i) => i < iFl && x.z < 1.7 && x.y > 2.5);
    mark(vpt, 'B4 volea', zones[0][2]);
    mark(seg2.find((x, i) => i > iFl && x.z > 0.15), 'B5', zones[1][2]);
    mark(seg2[apexI], 'B6 máximo', zones[2][2]);
    mark(seg2.slice(apexI).find((x) => x.z < apexZ * 0.55), 'B7', zones[3][2]);
    F.ctx.strokeStyle = '#111'; F.ctx.lineWidth = 2; F.ctx.beginPath(); F.ctx.arc(F.X(q.y), F.Y(q.z), 8, 0, Math.PI * 2); F.ctx.stroke();
    const tMax = seg2[apexI] ? seg2[apexI].t : q.t;
    const dt = tMax - q.t;
    const hv = U.$('#ipH');
    const CL = Shots.CLS[cls];
    hv.className = 'verdict ' + (cls === 'bajo' ? 'warn' : 'ok');
    hv.textContent = `${CL.cod} · ${CL.nombre}: ${CL.desc} Altura ${U.num(q.z, 2)} m. ${dt > 0.02 ? 'Le quitas ' + Math.round(dt * 1000) + ' ms al rival respecto del punto máximo.' : dt < -0.02 ? 'Le das ' + Math.round(-dt * 1000) + ' ms extra al rival.' : 'Justo en la cresta del bote.'}`;
  }

  /* ================= 4 · La bola ================= */
  function ballSim() {
    const v = +U.$('#blV').value, z = +U.$('#blZ').value, T = +U.$('#blT').value, alt = +U.$('#blA').value;
    U.$('#blVL').textContent = v + ' m/s (' + Math.round(v * 3.6) + ' km/h)'; U.$('#blZL').textContent = U.num(z, 2) + ' m'; U.$('#blTL').textContent = T + ' °C'; U.$('#blAL').textContent = alt.toLocaleString('es-CO') + ' m';
    const c0 = { x: 0.9, y: 8.4, z: 0.6 };
    const run = (temp) => {
      const en = Ball.env({ temp, alt });
      const g = { type: 'front', a: 0.75, b: z };
      const s = Ball.solve(c0, v, g, en, Ball.guessTo(c0, { x: 0.75, y: 0, z }, v, en));
      if (!s) return null;
      const tr = Ball.simulate(Object.assign({}, c0, Ball.dirVel(s.az, s.el, v)), en, { until: { floor: 2 }, extra: 0.05, tMax: 6 });
      return { tr, en };
    };
    const A = run(T), B = run(Math.max(5, T - 20));
    const cc = Chart.setup(U.$('#blSide'));
    const F = Chart.frame(cc, { x0: 0, x1: C.L, y0: 0, y1: 5, xticks: [0, 2, 4, 6, 8], fx: (x) => x + ' m', yticks: [1, 2, 3, 4, 5], xlabel: 'distancia desde la frontal', ylabel: 'altura (m)', pad: { l: 40 } });
    F.ctx.strokeStyle = F.tok.red; F.ctx.lineWidth = 2;
    const hl = (zz, lab) => { F.ctx.beginPath(); F.ctx.moveTo(F.X(0), F.Y(zz)); F.ctx.lineTo(F.X(0.35), F.Y(zz)); F.ctx.stroke(); F.ctx.fillStyle = F.tok.ink3; F.ctx.font = '10px "Source Sans 3", Arial'; F.ctx.textAlign = 'left'; F.ctx.fillText(lab, F.X(0.4), F.Y(zz) + 3); };
    hl(C.tin, 'tin'); hl(C.svc, 'línea de saque'); hl(C.outFront, 'línea de fuera');
    F.ctx.fillStyle = 'rgba(160,210,240,.35)'; F.ctx.fillRect(F.X(C.L) - 4, F.Y(C.outBack + 0.5), 4, F.Y(0) - F.Y(C.outBack + 0.5));
    const out = U.$('#blOut'); out.innerHTML = '';
    if (!A) { out.append(U.h('div', null, U.h('b', null, '—'), U.h('span', null, 'Con esa velocidad no llega a esa altura'))); return; }
    if (B) Chart.line(F, B.tr.pts.map((p) => [p.y, p.z]), '#6a8fb3', 1.8, [5, 4]);
    Chart.line(F, A.tr.pts.map((p) => [p.y, p.z]), F.tok.red, 2.4);
    const info = (R) => {
      const ev = R.tr.ev; const fr = ev.find((e) => e.type === 'front'); const f1 = ev.find((e) => e.type === 'floor'); const fl = ev.filter((e) => e.type === 'floor');
      let apex = 0; if (f1) for (const p of R.tr.pts) if (p.t > f1.t && (!fl[1] || p.t < fl[1].t)) apex = Math.max(apex, p.z);
      return { fr, f1, f2: fl[1], apex };
    };
    const a = info(A), b = B ? info(B) : null;
    for (const e of A.tr.ev) if (e.type === 'floor') Chart.dot(F, e.y, 0.02, '#111', 3);
    const tiles = [
      [U.num(A.en.eBase, 2), 'coef. de restitución (' + T + ' °C)'],
      [a.fr ? U.num(a.fr.speed * 3.6, 0) + ' km/h' : '–', 'velocidad tras la frontal'],
      [a.f1 ? U.num(a.f1.y, 1) + ' m' : '–', 'primer bote (desde la frontal)'],
      [U.num(a.apex, 2) + ' m', 'altura máxima tras el bote'],
      [a.f2 ? U.num(a.f2.t, 2) + ' s' : '–', 'hasta el segundo bote'],
      [b && b.f2 && a.f2 ? (a.f2.t - b.f2.t >= 0 ? '+' : '') + Math.round((a.f2.t - b.f2.t) * 1000) + ' ms' : '–', 'frente a la bola 20 °C más fría'],
    ];
    for (const [x, s] of tiles) out.append(U.h('div', null, U.h('b', null, x), U.h('span', null, s)));
  }

  /* ================= 5 · Cobertura desde la T ================= */
  let tcPos = { x: C.T.x, y: C.T.y };
  function timeTo(p, lvKey) {
    const lv = Player.LEVELS[lvKey];
    const d = Math.max(0, U.dist(p, tcPos) - 1.45);
    return lv.rt + Player.tMin(d, lv);
  }
  function coverage() {
    const lvKey = U.$('#tcLv').value || 'avanzado';
    const cv = U.$('#tcCanvas');
    const r = cv.getBoundingClientRect(); const w = Math.max(200, r.width), h = Math.max(300, r.height);
    const ctx = U.fitCanvas(cv, w, h);
    const L = Top.layout(w, h); Top.court(ctx, L, {});
    const { X, Y, s } = L;
    const cell = 0.2;
    for (let x = 0; x < C.W; x += cell) for (let y = 0; y < C.L; y += cell) {
      const t = timeTo({ x: x + cell / 2, y: y + cell / 2 }, lvKey);
      const k = U.clamp((t - 0.5) / 1.3, 0, 1);
      ctx.fillStyle = MS.TV.heatCol(0.12 + k * 0.88);
      ctx.globalAlpha = 0.55; ctx.fillRect(X(x), Y(y), cell * s + 0.6, cell * s + 0.6); ctx.globalAlpha = 1;
    }
    /* isócronas */
    ctx.strokeStyle = 'rgba(20,30,40,.55)'; ctx.lineWidth = 1;
    for (const iso of [0.8, 1.0, 1.2, 1.4]) {
      const lv = Player.LEVELS[lvKey];
      let lo = 0, hi = 9; for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (lv.rt + Player.tMin(m, lv) < iso) lo = m; else hi = m; }
      const rad = (lo + 1.45) * s;
      ctx.beginPath(); ctx.arc(X(tcPos.x), Y(tcPos.y), rad, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#10202e'; ctx.font = `600 ${Math.max(9, 0.15 * s)}px "IBM Plex Mono", monospace`; ctx.textAlign = 'center';
      ctx.fillText(U.num(iso, 1) + ' s', X(tcPos.x), Y(tcPos.y) - rad + 12);
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(tcPos.x), Y(tcPos.y), Math.max(7, 0.14 * s), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const out = U.$('#tcOut'); out.innerHTML = '';
    let worst = 0;
    for (const k of ['FI', 'FD', 'MI', 'MD', 'BI', 'BD']) { const g = C.ghost[k]; const t = timeTo(g, lvKey); worst = Math.max(worst, t); out.append(U.h('div', null, U.h('b', null, U.num(t, 2) + ' s'), U.h('span', null, g.nombre.replace(' (volea)', '')))); }
    out.append(U.h('div', { style: { gridColumn: '1 / -1' } }, U.h('b', null, U.num(worst, 2) + ' s'), U.h('span', null, 'la esquina más lejana desde aquí (lo que el rival buscará)')));
  }

  function drawAll() { lunge(); chain(); impact(); ballSim(); coverage(); }
  function init() {
    for (const id of ['#luLen', '#luHip', '#luTr', '#luCom']) U.$(id).addEventListener('input', lunge);
    for (const b of U.$$('#luHeel button')) b.addEventListener('click', () => { heel = b.dataset.h; for (const c of U.$$('#luHeel button')) c.setAttribute('aria-pressed', String(c === b)); lunge(); });
    chainUI();
    for (const id of ['#ipOff', '#ipT']) U.$(id).addEventListener('input', impact);
    for (const id of ['#blV', '#blZ', '#blT', '#blA']) U.$(id).addEventListener('input', ballSim);
    const sel = U.$('#tcLv'); for (const k in Player.LEVELS) sel.append(U.h('option', { value: k, text: Player.LEVELS[k].nombre, selected: k === 'avanzado' ? true : null }));
    sel.addEventListener('change', coverage);
    U.$('#tcT').addEventListener('click', () => { tcPos = { x: C.T.x, y: C.T.y }; coverage(); });
    U.$('#tcBack').addEventListener('click', () => { tcPos = { x: C.T.x, y: C.T.y + 0.5 }; coverage(); });
    U.$('#tcFront').addEventListener('click', () => { tcPos = { x: C.T.x, y: 3.6 }; coverage(); });
    const cv = U.$('#tcCanvas'); let drag = false;
    const setP = (e) => { const r = cv.getBoundingClientRect(); const L = Top.layout(r.width, r.height); const p = L.inv(e.clientX - r.left, e.clientY - r.top); tcPos = C.clampIn(p, 0.3); coverage(); };
    cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); setP(e); });
    cv.addEventListener('pointermove', (e) => { if (drag) setP(e); });
    cv.addEventListener('pointerup', () => { drag = false; });
    cv.style.touchAction = 'none'; cv.style.cursor = 'crosshair';
    for (const a of U.$$('#bmNav a')) a.addEventListener('click', (e) => { e.preventDefault(); const t = U.$(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { if (MS.App.current === 'biomecanica') drawAll(); }).observe(U.$('#bm-estocada'));
  }
  MS.App.on('biomecanica', { init, show: () => setTimeout(drawAll, 20), theme: drawAll });
  return { lunge, chainCalc };
})();
