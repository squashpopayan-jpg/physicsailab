/* FARO · manual: interacciones de la página (sin dependencias salvo three.js para el visor 3D) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------------- índice activo ---------------- */
  const enlaces = $$('.indice a[href^="#"]');
  const secciones = enlaces.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window && secciones.length) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        enlaces.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secciones.forEach((s) => io.observe(s));
  }
  $$('.indice-movil a').forEach((a) => a.addEventListener('click', () => { const d = $('.indice-movil details'); if (d) d.open = false; }));

  /* ---------------- juego de reflejos (portada) ---------------- */
  (function juego() {
    const svg = $('#juego-pod');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const leds = [];
    const grupo = $('#juego-leds');
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      const c = document.createElementNS(NS, 'rect');
      const r = 118;
      c.setAttribute('x', 160 + r * Math.cos(a) - 9);
      c.setAttribute('y', 160 + r * Math.sin(a) - 9);
      c.setAttribute('width', 18);
      c.setAttribute('height', 18);
      c.setAttribute('rx', 3);
      c.setAttribute('class', 'led');
      c.setAttribute('transform', `rotate(${(a * 180) / Math.PI + 90} ${160 + r * Math.cos(a)} ${160 + r * Math.sin(a)})`);
      grupo.appendChild(c);
      leds.push(c);
    }
    const resplandor = $('#juego-resplandor');
    const lectura = $('#juego-lectura');
    const sub = $('#juego-sub');
    const hist = $('#juego-historial');
    const COL = ['#ff2a2a', '#00e05a', '#1a6bff', '#ffb000', '#00e5ff', '#ff2bd6', '#ff6a00', '#8a2bff'];
    let estado = 'reposo', t0 = 0, timer = 0, color = COL[0];
    const tiempos = [];
    function pintar(c) {
      leds.forEach((l) => (l.style.fill = c || ''));
      resplandor.style.opacity = c ? 0.55 : 0;
      if (c) resplandor.setAttribute('fill', c);
    }
    function armar() {
      clearTimeout(timer);
      estado = 'espera';
      pintar(null);
      lectura.textContent = '…';
      sub.textContent = 'espera la luz';
      timer = setTimeout(() => {
        color = COL[Math.floor(Math.random() * COL.length)];
        pintar(color);
        t0 = performance.now();
        estado = 'encendido';
        sub.textContent = '¡toca ya!';
      }, 1200 + Math.random() * 2600);
    }
    function tocar(ev) {
      if (ev) ev.preventDefault();
      if (estado === 'reposo' || estado === 'resultado') return armar();
      if (estado === 'espera') {
        clearTimeout(timer);
        estado = 'resultado';
        pintar('#b42318');
        lectura.textContent = '¡antes!';
        sub.textContent = 'salida en falso · toca para repetir';
        setTimeout(() => pintar(null), 400);
        return;
      }
      if (estado === 'encendido') {
        const tr = performance.now() - t0;
        estado = 'resultado';
        pintar(null);
        lectura.textContent = Math.round(tr) + ' ms';
        sub.textContent = tr < 300 ? 'rapidísimo · toca para repetir' : tr < 450 ? 'bien · toca para repetir' : 'toca para repetir';
        tiempos.push(tr);
        if (tiempos.length > 5) tiempos.shift();
        const m = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
        hist.textContent = 'últimos: ' + tiempos.map((t) => Math.round(t)).join(' · ') + ' ms — media ' + Math.round(m) + ' ms';
      }
    }
    svg.addEventListener('pointerdown', tocar);
    svg.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') tocar(e); });
    $('#juego-empezar').addEventListener('click', armar);
  })();

  /* ---------------- resaltado de código y copiar ---------------- */
  const KW = /\b(static|const|void|bool|int|float|double|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|size_t|char|struct|enum|return|if|else|for|while|do|switch|case|break|continue|default|true|false|nullptr|class|public|override|typedef|template|typename|auto|sizeof|volatile|inline|module|function|let|translate|rotate|difference|union|intersection|hull|cylinder|cube|linear_extrude|rotate_extrude|polygon|circle|square|offset|projection|mirror|color|for|each)\b/g;
  function resaltar(txt, lang) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const out = [];
    const re = lang === 'py'
      ? /(#[^\n]*)|("""[\s\S]*?"""|'[^'\n]*'|"[^"\n]*")|(\b\d+(?:\.\d+)?\b)/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')|(^\s*#\w+(?:[^\n/]|\/(?!\/))*)|(\b0x[0-9A-Fa-f]+\b|\b\d+(?:\.\d+)?f?\b)/gm;
    let i = 0, m;
    while ((m = re.exec(txt))) {
      out.push(esc(txt.slice(i, m.index)).replace(KW, '<span class="c-kw">$1</span>'));
      const s = esc(m[0]);
      if (m[1]) out.push('<span class="c-com">' + s + '</span>');
      else if (m[2]) out.push('<span class="c-str">' + s + '</span>');
      else if (m[3] && lang !== 'py') out.push('<span class="c-pre">' + s + '</span>');
      else out.push('<span class="c-num">' + s + '</span>');
      i = m.index + m[0].length;
    }
    out.push(esc(txt.slice(i)).replace(KW, '<span class="c-kw">$1</span>'));
    return out.join('');
  }
  $$('pre[data-lang]:not([data-lang="txt"])').forEach((pre) => {
    const pintarlo = () => { if (!pre.dataset.hecho) { pre.innerHTML = resaltar(pre.textContent, pre.dataset.lang); pre.dataset.hecho = 1; } };
    const det = pre.closest('details');
    if (det) det.addEventListener('toggle', () => det.open && pintarlo(), { once: true });
    else pintarlo();
  });
  $$('.copiar').forEach((b) => b.addEventListener('click', () => {
    const pre = b.closest('details, figure, div').querySelector('pre');
    const texto = pre.textContent;
    const ok = () => { b.textContent = 'Copiado'; setTimeout(() => (b.textContent = 'Copiar'), 1500); };
    const seleccionar = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Seleccionado: Ctrl+C'; };
    try { navigator.clipboard.writeText(texto).then(ok, seleccionar); } catch (e) { seleccionar(); }
  }));

  /* ---------------- láminas a pantalla completa ---------------- */
  $$('.lamina').forEach((fig) => fig.addEventListener('click', () => {
    const img = fig.querySelector('img');
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<div class="barra"><button class="boton sec" data-z>Acercar</button><button class="boton" data-c>Cerrar</button></div><div class="hoja"><img alt=""></div>';
    lb.querySelector('img').src = img.src;
    lb.querySelector('img').alt = img.alt;
    lb.querySelector('[data-c]').onclick = () => lb.remove();
    lb.querySelector('[data-z]').onclick = (e) => { lb.classList.toggle('zoom'); e.target.textContent = lb.classList.contains('zoom') ? 'Alejar' : 'Acercar'; };
    lb.addEventListener('keydown', (e) => e.key === 'Escape' && lb.remove());
    document.body.appendChild(lb);
    lb.querySelector('[data-c]').focus();
  }));

  /* ---------------- calculadora de autonomía ---------------- */
  (function autonomia() {
    const raiz = $('#calc-bateria');
    if (!raiz) return;
    const ids = ['cap', 'brillo', 'enc', 'tof'];
    const el = Object.fromEntries(ids.map((k) => [k, $('#cb-' + k)]));
    const out = Object.fromEntries(ids.map((k) => [k, $('#cb-' + k + '-v')]));
    function calc() {
      const cap = +el.cap.value, br = +el.brillo.value, enc = +el.enc.value / 100, tof = el.tof.checked;
      const radio = 90, reposoLed = 10, porLed = 12 * br / 255; // mA
      const leds = 16 * porLed * enc;
      const itof = tof ? 19 * 0.6 : 0;
      const total = radio + reposoLed + leds + itof + 0.5;
      const horas = (cap * 0.85) / total;
      out.cap.textContent = cap + ' mAh';
      out.brillo.textContent = br + ' / 255';
      out.enc.textContent = Math.round(enc * 100) + ' %';
      out.tof.textContent = tof ? 'sí' : 'no';
      $('#cb-horas').innerHTML = horas.toFixed(1).replace('.', ',') + ' <small>horas de ejercicio</small>';
      $('#cb-detalle').innerHTML =
        `radio ${radio} mA + anillo en reposo ${reposoLed} mA + luz ${leds.toFixed(0)} mA${tof ? ` + láser ${itof.toFixed(0)} mA` : ''} ≈ <b>${total.toFixed(0)} mA</b> de media`;
      const anch = 300, max = 220;
      const partes = [['radio', radio, 'var(--accent)'], ['anillo', reposoLed, 'var(--muted)'], ['luz', leds, 'var(--warn)'], ['láser', itof, 'var(--ok)']];
      let x = 0;
      $('#cb-barra').innerHTML = partes.filter((p) => p[1] > 0).map((p) => {
        const w = (p[1] / max) * anch;
        const r = `<rect x="${x}" y="0" width="${Math.max(w - 1, 0)}" height="18" rx="2" fill="${p[2]}"/>`;
        x += w;
        return r;
      }).join('');
    }
    ids.forEach((k) => el[k].addEventListener('input', calc));
    calc();
  })();

  /* ---------------- modelo del electrodo capacitivo ---------------- */
  (function capacitivo() {
    const svg = $('#graf-cap');
    if (!svg) return;
    const eD = $('#cap-d'), eC0 = $('#cap-c0'), eCg = $('#cap-cg');
    const W = 420, H = 240, m = { l: 46, r: 12, t: 12, b: 34 };
    const eps0 = 8.854e-3; // pF/mm
    function cmano(dmm, diam) {
      // placa paralela + término de borde (aprox. de disco): C = ε0·A/d_ef + ε0·4R·0,5
      const R = diam / 2, A = Math.PI * R * R;
      const def = dmm + 0.8 + 1.8 / 2.8; // aire + PETG (εr ≈ 2,8) hasta el electrodo
      return eps0 * A / def + eps0 * 4 * R * 0.5 * Math.exp(-dmm / (1.5 * R));
    }
    function dibujar() {
      const diam = +eD.value, c0 = +eC0.value, cg = +eCg.value;
      $('#cap-d-v').textContent = 'Ø ' + diam + ' mm';
      $('#cap-c0-v').textContent = c0 + ' pF';
      $('#cap-cg-v').textContent = cg + ' pF';
      const pts = [];
      for (let d = 0; d <= 80; d += 1) {
        const ch = cmano(d, diam);
        const efectiva = (ch * cg) / (ch + cg); // en serie con el acople a tierra del pod
        pts.push([d, (efectiva / c0) * 1000]);
      }
      const ymax = Math.max(60, Math.ceil(pts[0][1] / 50) * 50);
      const X = (d) => m.l + (d / 80) * (W - m.l - m.r);
      const Y = (v) => m.t + (1 - Math.log10(1 + v) / Math.log10(1 + ymax)) * (H - m.t - m.b);
      let s = '';
      [0, 20, 40, 60, 80].forEach((d) => { s += `<line class="eje" x1="${X(d)}" x2="${X(d)}" y1="${m.t}" y2="${H - m.b}"/><text x="${X(d)}" y="${H - m.b + 16}" text-anchor="middle">${d}</text>`; });
      [1, 10, 100, 1000].filter((v) => v <= ymax).forEach((v) => { s += `<line class="eje" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
      s += `<text x="${(W + m.l) / 2}" y="${H - 4}" text-anchor="middle">distancia de la mano al domo (mm)</text>`;
      s += `<text transform="rotate(-90 12 ${(H - m.b + m.t) / 2})" x="12" y="${(H - m.b + m.t) / 2}" text-anchor="middle">cambio de la lectura (‰)</text>`;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
      s += `<path class="area" d="${d} L${X(80)},${H - m.b} L${X(0)},${H - m.b} Z"/><path class="curva" d="${d}"/>`;
      const umbrales = [[+$('#cap-toque').value, 'toque', 'var(--ok)'], [+$('#cap-cerca').value, 'cerca', 'var(--warn)']];
      umbrales.forEach(([u, n, c]) => {
        s += `<line class="umbral" x1="${m.l}" x2="${W - m.r}" y1="${Y(u)}" y2="${Y(u)}" stroke="${c}"/><text x="${W - m.r - 4}" y="${Y(u) - 5}" text-anchor="end" style="fill:${c}">${n} ${u} ‰</text>`;
        const cruce = pts.find((p) => p[1] < u);
        if (cruce) s += `<circle cx="${X(cruce[0])}" cy="${Y(u)}" r="4" fill="${c}"/>`;
      });
      svg.innerHTML = s;
      const alc = (u) => { const p = pts.find((q) => q[1] < u); return p ? p[0] : 80; };
      $('#cap-res').innerHTML = `contacto: <b>${Math.round(pts[0][1])} ‰</b> · el toque se activa a <b>${alc(+$('#cap-toque').value)} mm</b> y la cercanía a <b>${alc(+$('#cap-cerca').value)} mm</b>`;
      $('#cap-toque-v').textContent = $('#cap-toque').value + ' ‰';
      $('#cap-cerca-v').textContent = $('#cap-cerca').value + ' ‰';
    }
    ['#cap-d', '#cap-c0', '#cap-cg', '#cap-toque', '#cap-cerca'].forEach((s) => $(s).addEventListener('input', dibujar));
    dibujar();
  })();

  /* ---------------- visor 3D ---------------- */
  (function visor() {
    const cont = $('#visor3d');
    if (!cont) return;
    if (!window.THREE || !window.FARO_MODELO) { cont.closest('.visor').hidden = true; $('#visor-respaldo').hidden = false; return; }
    const THREE = window.THREE;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { cont.closest('.visor').hidden = true; $('#visor-respaldo').hidden = false; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    cont.appendChild(renderer.domElement);
    const escena = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 4 / 3, 1, 2000);
    escena.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.85));
    const luz = new THREE.DirectionalLight(0xffffff, 0.75);
    luz.position.set(120, 260, 160);
    escena.add(luz);
    const luz2 = new THREE.DirectionalLight(0xffffff, 0.3);
    luz2.position.set(-150, 80, -120);
    escena.add(luz2);
    const corte = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const raiz = new THREE.Group();
    raiz.rotation.x = -Math.PI / 2; // el modelo usa z hacia arriba
    escena.add(raiz);
    const PARTES = {
      base: { c: 0x2b2f36, g: 'base' }, tpu: { c: 0x3a3f47, g: 'base' },
      domo: { c: 0xdfefff, g: 'domo', op: 0.38 }, ventana: { c: 0xa9d8ff, g: 'domo', op: 0.7 },
      soporte: { c: 0xf2f2f2, g: 'soporte' }, anillo: { c: 0x1b1b1b, g: 'anillo' },
      electrodo: { c: 0xc87533, g: 'sensores' }, tof: { c: 0x1b2a6b, g: 'sensores' },
      bateria: { c: 0x3a6fd8, g: 'electronica' }, placa: { c: 0xc8a165, g: 'electronica' }, esp32: { c: 0x202020, g: 'electronica' },
      adxl: { c: 0x7b3fa0, g: 'electronica' }, condensador: { c: 0x2a2a2a, g: 'electronica' }, tp4056: { c: 0x1f5fbf, g: 'electronica' },
      usb: { c: 0xb0b0b0, g: 'electronica' }, interruptor: { c: 0x303030, g: 'electronica' },
    };
    const EXPL = { base: 0, electronica: 0, soporte: 26, anillo: 38, sensores: 48, domo: 78 };
    const grupos = {};
    Object.keys(EXPL).forEach((g) => { grupos[g] = new THREE.Group(); raiz.add(grupos[g]); });
    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
    const mats = [];
    Object.entries(window.FARO_MODELO).forEach(([n, d]) => {
      const p = PARTES[n];
      if (!p) return;
      const q = new Int16Array(b64(d.v));
      const pos = new Float32Array(q.length);
      for (let i = 0; i < q.length; i++) pos[i] = q[i] * 0.05;
      const idx = d.i32 ? new Uint32Array(b64(d.i)) : new Uint16Array(b64(d.i));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: p.c, roughness: n === 'domo' ? 0.25 : 0.62, metalness: n === 'usb' ? 0.6 : 0.05, flatShading: true,
        transparent: !!p.op, opacity: p.op || 1, side: THREE.DoubleSide, depthWrite: !p.op, clippingPlanes: [],
      });
      mats.push(mat);
      const malla = new THREE.Mesh(geo, mat);
      malla.renderOrder = p.op ? 2 : 1;
      grupos[p.g].add(malla);
    });
    // LED encendidos sobre el anillo
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22b8f0 });
    for (let i = 0; i < 16; i++) {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      const r = (68 + 50) / 4;
      const m = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 0.4), ledMat);
      m.position.set(r * Math.cos(a), r * Math.sin(a), 16 + 1.6 + 1.7);
      m.rotation.z = a;
      grupos.anillo.add(m);
    }
    // órbita propia
    let az = -0.75, el = 0.62, dist = 270, explo = 0;
    const centro = new THREE.Vector3(0, 18, 0);
    function camara() {
      const yc = 17 + explo * 30;
      centro.set(0, yc, 0);
      cam.position.set(centro.x + dist * Math.cos(el) * Math.sin(az), centro.y + dist * Math.sin(el), centro.z + dist * Math.cos(el) * Math.cos(az));
      cam.lookAt(centro);
    }
    function tam() {
      const w = cont.clientWidth, h = cont.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      pinta();
    }
    function pinta() { camara(); renderer.render(escena, cam); }
    const punteros = new Map();
    let previo = null;
    cont.addEventListener('pointerdown', (e) => { cont.setPointerCapture(e.pointerId); punteros.set(e.pointerId, [e.clientX, e.clientY]); });
    cont.addEventListener('pointerup', (e) => { punteros.delete(e.pointerId); previo = null; });
    cont.addEventListener('pointercancel', (e) => { punteros.delete(e.pointerId); previo = null; });
    cont.addEventListener('pointermove', (e) => {
      if (!punteros.has(e.pointerId)) return;
      const ant = punteros.get(e.pointerId);
      punteros.set(e.pointerId, [e.clientX, e.clientY]);
      if (punteros.size === 1) {
        az -= (e.clientX - ant[0]) * 0.008;
        el = Math.max(-1.2, Math.min(1.45, el + (e.clientY - ant[1]) * 0.008));
      } else if (punteros.size === 2) {
        const [a, b] = Array.from(punteros.values());
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (previo) dist = Math.max(120, Math.min(600, dist * (previo / d)));
        previo = d;
      }
      pinta();
    });
    cont.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.max(120, Math.min(600, dist * (1 + Math.sign(e.deltaY) * 0.08))); pinta(); }, { passive: false });
    // controles
    const sl = $('#v-explo');
    sl.addEventListener('input', () => {
      explo = sl.value / 100;
      Object.entries(EXPL).forEach(([g, dz]) => (grupos[g].position.z = dz * explo));
      pinta();
    });
    $('#v-corte').addEventListener('change', (e) => { mats.forEach((m) => (m.clippingPlanes = e.target.checked ? [corte] : [])); pinta(); });
    $$('.visor [data-grupo]').forEach((cb) => cb.addEventListener('change', () => { cb.dataset.grupo.split(',').forEach((g) => (grupos[g].visible = cb.checked)); pinta(); }));
    const colores = { azul: 0x1a6bff, rojo: 0xff2a2a, verde: 0x00e05a, amarillo: 0xffb000, magenta: 0xff2bd6, apagado: 0x2a2a2a };
    $$('.visor [data-led]').forEach((b) => b.addEventListener('click', () => { ledMat.color.setHex(colores[b.dataset.led]); pinta(); }));
    new ResizeObserver(tam).observe(cont);
    tam();
  })();
})();
