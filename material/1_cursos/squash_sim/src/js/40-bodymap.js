/* Mapa corporal estilizado (vista anterior y posterior) con regiones musculares interactivas.
   Las formas se definen para la mitad derecha (x ≥ 100) y se reflejan; las marcadas «c» van centradas. */
MS.Body = (function () {
  const { U } = MS;
  /* Trazo suave cerrado por Catmull-Rom */
  function smooth(pts) {
    const n = pts.length;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d + 'Z';
  }
  const mir = (pts) => pts.map(([x, y]) => [200 - x, y]);
  const SIL = {
    torso: [[100, 72], [114, 72], [134, 79], [145, 89], [142, 104], [139, 130], [133, 162], [135, 196], [140, 220], [124, 232], [100, 238], [76, 232], [60, 220], [65, 196], [67, 162], [61, 130], [58, 104], [55, 89], [66, 79], [86, 72]],
    upper: [[142, 92], [152, 86], [160, 100], [163, 130], [162, 166], [154, 170], [148, 150], [144, 120]],
    fore: [[153, 172], [163, 168], [169, 190], [170, 222], [168, 246], [161, 248], [157, 226], [152, 196]],
    thigh: [[102, 236], [124, 230], [140, 222], [143, 250], [140, 290], [134, 326], [114, 330], [106, 300], [103, 262]],
    shank: [[112, 334], [134, 330], [137, 360], [132, 400], [127, 428], [116, 428], [113, 400], [109, 362]],
    foot: [[114, 428], [128, 428], [134, 446], [110, 448]],
  };
  const FRONT = [
    ['pectoral', [[102, 92], [124, 86], [140, 96], [141, 112], [130, 124], [112, 128], [102, 124]]],
    ['deltoides', [[138, 82], [150, 86], [160, 100], [160, 118], [150, 122], [142, 108], [138, 94]]],
    ['biceps', [[147, 124], [157, 122], [162, 140], [160, 162], [153, 166], [147, 148]]],
    ['flexores', [[153, 172], [163, 170], [168, 192], [166, 222], [160, 236], [155, 220], [152, 194]]],
    ['serrato', [[134, 118], [140, 116], [140, 140], [135, 146], [131, 134]]],
    ['abdomen', [[102, 130], [116, 130], [117, 172], [116, 212], [102, 214]]],
    ['oblicuos', [[119, 132], [134, 130], [134, 160], [134, 196], [123, 212], [119, 180]]],
    ['psoas', [[105, 198], [115, 194], [125, 226], [119, 236], [109, 222]], 'deep'],
    ['aductores', [[102, 240], [114, 236], [118, 262], [116, 296], [108, 304], [103, 276]]],
    ['cuadriceps', [[128, 236], [140, 232], [142, 262], [138, 300], [130, 318], [126, 290], [126, 258]]],
    ['cuadriceps', [[116, 240], [127, 238], [127, 280], [124, 314], [118, 316], [116, 280]]],
    ['cuadriceps', [[108, 292], [116, 298], [118, 318], [114, 328], [106, 318]]],
    ['tibial', [[124, 338], [132, 338], [133, 368], [128, 400], [124, 404], [122, 372]]],
    ['peroneos', [[133, 342], [137, 350], [136, 380], [131, 398], [130, 370]]],
  ];
  const FRONT_C = [['coreProf', [[88, 176], [112, 176], [116, 200], [100, 214], [84, 200]], 'deep'], ['oculares', [[88, 34], [96, 33], [97, 38], [88, 39]]], ['oculares', [[104, 33], [112, 34], [112, 39], [103, 38]]]];
  const BACK = [
    ['trapecio', [[100, 62], [110, 66], [122, 76], [140, 84], [128, 94], [114, 108], [108, 134], [100, 146]]],
    ['deltoides', [[138, 84], [150, 86], [160, 102], [158, 120], [148, 120], [140, 104]]],
    ['manguito', [[113, 98], [133, 95], [137, 108], [131, 121], [117, 123], [111, 110]]],
    ['dorsal', [[104, 142], [117, 128], [136, 124], [140, 140], [136, 168], [122, 190], [106, 196]]],
    ['lumbares', [[101, 168], [111, 164], [114, 210], [102, 216]]],
    ['triceps', [[148, 124], [158, 122], [162, 142], [160, 164], [152, 166], [147, 146]]],
    ['extensores', [[153, 172], [163, 170], [168, 192], [166, 222], [160, 236], [155, 220], [152, 194]]],
    ['gluteoMed', [[113, 200], [134, 196], [140, 214], [128, 222], [112, 216]]],
    ['gluteoMax', [[102, 220], [126, 216], [140, 224], [140, 248], [126, 262], [104, 262]]],
    ['isquios', [[104, 268], [124, 264], [138, 264], [138, 292], [130, 322], [116, 326], [106, 300]]],
    ['gastro', [[110, 336], [124, 332], [136, 338], [136, 364], [128, 388], [116, 388], [110, 366]]],
    ['soleo', [[114, 389], [130, 387], [133, 404], [126, 416], [116, 414]]],
    ['aquiles', [[117, 415], [125, 415], [124, 430], [118, 430]]],
  ];

  function figureSVG(dx, muscles, centered, label) {
    let s = `<g transform="translate(${dx},0)">`;
    s += `<ellipse class="sil" cx="100" cy="38" rx="19" ry="24"/>`;
    s += `<path class="sil" d="M92,58 L108,58 L110,76 L90,76Z"/>`;
    s += `<path class="sil" d="${smooth(SIL.torso)}"/>`;
    for (const k of ['upper', 'fore', 'thigh', 'shank', 'foot']) { s += `<path class="sil" d="${smooth(SIL[k])}"/><path class="sil" d="${smooth(mir(SIL[k]))}"/>`; }
    s += `<ellipse class="sil" cx="167" cy="262" rx="8" ry="14"/><ellipse class="sil" cx="33" cy="262" rx="8" ry="14"/>`;
    for (const [id, pts, deep] of muscles) {
      const cls = 'm' + (deep ? ' deep' : '');
      s += `<path class="${cls}" data-m="${id}" d="${smooth(pts)}"/><path class="${cls}" data-m="${id}" d="${smooth(mir(pts))}"/>`;
    }
    for (const [id, pts, deep] of centered || []) s += `<path class="m${deep ? ' deep' : ''}" data-m="${id}" d="${smooth(pts)}"/>`;
    s += `<text x="100" y="466" text-anchor="middle">${label}</text></g>`;
    return s;
  }

  function svg() {
    return `<svg viewBox="0 0 410 472" role="img" aria-label="Mapa muscular, vista anterior y posterior">${figureSVG(0, FRONT, FRONT_C, 'ANTERIOR')}${figureSVG(210, BACK, null, 'POSTERIOR')}</svg>`;
  }

  /* Crea un mapa en `host`. opts: {interactive, onSelect(id), onHover(id)} */
  function create(host, opts = {}) {
    host.classList.add('bodymap');
    host.innerHTML = svg();
    const paths = U.$$('[data-m]', host);
    const base = () => getComputedStyle(host).getPropertyValue('--muscle').trim() || '#ecd3c6';
    let selected = null;
    const api = {
      paint(fn) { const b = base(); for (const p of paths) p.style.fill = fn(p.dataset.m, b) || b; },
      activation(act) { api.paint((id, b) => (act && act[id] ? MS.TV.heatCol(act[id].v, b) : b)); },
      select(id) { selected = id; for (const p of paths) p.classList.toggle('sel', p.dataset.m === id); },
      clear() { api.paint(() => null); },
    };
    if (opts.interactive) {
      for (const p of paths) {
        p.setAttribute('tabindex', '-1');
        p.addEventListener('mouseenter', () => { for (const q of paths) q.classList.toggle('hov', q.dataset.m === p.dataset.m); opts.onHover && opts.onHover(p.dataset.m); });
        p.addEventListener('mouseleave', () => { for (const q of paths) q.classList.remove('hov'); opts.onHover && opts.onHover(null); });
        p.addEventListener('click', () => { api.select(p.dataset.m); opts.onSelect && opts.onSelect(p.dataset.m); });
        const g = MS.Muscles.byId[p.dataset.m];
        if (g) { const t = document.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = g.nombre; p.append(t); }
      }
    }
    api.clear();
    return api;
  }
  return { create, svg, smooth };
})();
