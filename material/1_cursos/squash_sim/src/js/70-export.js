/* Exportar e importar rutinas: .json, código para compartir, ficha PNG/PDF y video con el logo de Manu_Squash. */
MS.Export = (function () {
  const { U, C, Shots, Muscles, Compile, Top, TV, Player, TL } = MS;
  const FMT = 'manu-squash-rutina', PACK = 'manu-squash-paquete';
  const CREDIT = 'Elaborado por Manu_Squash · Simulador Manu Squash';

  /* ---------- guardar archivos ---------- */
  let dlP = null;
  function downloads() {
    if (!dlP) dlP = (window.claude && typeof window.claude.use === 'function') ? Promise.resolve(window.claude.use('downloads')).catch(() => null) : Promise.resolve(null);
    return dlP;
  }
  async function saveFile(name, data, mime) {
    const dl = await downloads();
    if (dl) {
      try { await dl.save({ filename: name, data }); U.toast('Archivo listo: ' + name); return true; }
      catch (e) {
        const code = e && e.code;
        if (code === 'declined') { U.toast('Descarga cancelada.'); return false; }
        if (code === 'rate_limited') { U.toast('Ya hay una descarga pendiente de confirmar.', 'warn'); return false; }
        if (code === 'too_large') { U.toast('El archivo es demasiado grande para este visor.', 'warn'); return false; }
        if (code === 'rejected_extension' || code === 'extension_not_enabled') { U.toast('Este visor no admite archivos de ese tipo.', 'warn'); return false; }
        /* no disponible: se intenta la descarga directa */
      }
    }
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = U.h('a', { href: url, download: name, style: { display: 'none' } });
      document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
      U.toast('Descargando ' + name);
      return true;
    } catch (e) { U.toast('No fue posible guardar el archivo en este visor.', 'warn'); return false; }
  }
  const slug = (s) => (s || 'rutina').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'rutina';

  /* ---------- formato ---------- */
  function clean(rt) {
    const keep = ['nombre', 'cat', 'nivel', 'objetivo', 'descripcion', 'claves', 'musculos', 'series', 'jugadores', 'secuencia', 'ciclos', 'ritmo', 'intensidad', 'pausa', 'temp', 'alt', 'inicio', 'semilla', 'modo', 'duracion', 'anticipacion'];
    const o = { formato: FMT, version: 1, autor: 'Manu_Squash' };
    for (const k of keep) if (rt[k] != null) o[k] = U.clone(rt[k]);
    o.exportado = new Date().toISOString().slice(0, 10);
    return o;
  }
  function validate(o) {
    if (!o || typeof o !== 'object') throw new Error('El contenido no es una rutina.');
    if (o.formato === PACK && Array.isArray(o.rutinas)) return o.rutinas.map(validate1);
    return [validate1(o)];
  }
  function validate1(o) {
    if (o.formato && o.formato !== FMT) throw new Error('Formato desconocido: ' + o.formato);
    if (!Array.isArray(o.jugadores) || !o.jugadores.length || o.jugadores.length > 3) throw new Error('La rutina debe tener entre 1 y 3 jugadores.');
    const ids = new Set();
    for (const j of o.jugadores) { if (!j.id) throw new Error('Cada jugador necesita un identificador.'); ids.add(j.id); j.mano = j.mano === 'Z' ? 'Z' : 'D'; }
    if (o.modo !== 'partido') {
      if (!Array.isArray(o.secuencia) || !o.secuencia.length) throw new Error('La secuencia de golpes está vacía.');
      for (const s of o.secuencia) {
        if (!ids.has(s.j)) throw new Error('Un golpe usa un jugador inexistente: ' + s.j);
        if (s.golpe !== 'fantasma' && !Shots.CAT[s.golpe]) throw new Error('Golpe desconocido: ' + s.golpe);
      }
    }
    const r = U.clone(o); delete r.formato; delete r.version; delete r.exportado;
    return r;
  }

  /* ---------- código compacto (deflate + base64url) ---------- */
  const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (str) => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
  async function encode(obj) {
    const txt = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream !== 'undefined') {
      try { const cs = new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw')); const buf = new Uint8Array(await new Response(cs).arrayBuffer()); return 'MSQ1.' + b64u(buf); } catch (e) { /* sin compresión */ }
    }
    return 'MSQ0.' + b64u(txt);
  }
  async function decode(code) {
    code = code.trim().replace(/\s+/g, '');
    if (code.startsWith('{')) return JSON.parse(code);
    const m = code.match(/MSQ([01])\.([A-Za-z0-9_-]+)/);
    if (!m) throw new Error('No se reconoce el código. Debe empezar por «MSQ1.» o ser un JSON de rutina.');
    let bytes = unb64u(m[2]);
    if (m[1] === '1') {
      if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede descomprimir el código.');
      const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(ds).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /* ---------- ficha (lienzo A4 a 150 ppp) ---------- */
  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = String(text).split(/\s+/); let line = ''; let yy = y;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = w; } else line = t; }
    if (line) { ctx.fillText(line, x, yy); yy += lh; }
    return yy;
  }
  function courtDiagram(ctx, x0, y0, w, h, rt, tl) {
    ctx.save(); ctx.translate(x0, y0);
    const L = Top.layout(w, h);
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    Top.court(ctx, L, { zonas: false });
    const { X, Y, s } = L;
    const seqLen = (rt.secuencia || []).length || tl.shots.length;
    const first = tl.shots.slice(0, Math.min(tl.shots.length, rt.modo === 'partido' ? 10 : Math.max(seqLen, 2) + (seqLen <= 2 ? 2 : 0)));
    /* recorridos de los jugadores durante el primer ciclo */
    const tEnd = first.length ? (first[first.length - 1].t0 + 0.8) : tl.duration;
    for (const pl of tl.players) {
      ctx.strokeStyle = pl.color; ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); let st = false;
      for (const k of pl.keys) { if (k.t > tEnd) break; if (!st) { ctx.moveTo(X(k.x), Y(k.y)); st = true; } else ctx.lineTo(X(k.x), Y(k.y)); }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    /* trayectorias de bola numeradas */
    first.forEach((sh, i) => {
      const pl = tl.players.find((p) => p.id === sh.j);
      if (sh.res && sh.res.ok) {
        const P = sh.res.traj.pts; const nxt = first[i + 1];
        const tCut = nxt && nxt.contact ? nxt.t0 - sh.t0 : P[P.length - 1].t;
        ctx.strokeStyle = pl.color; ctx.lineWidth = 2.6; ctx.beginPath();
        let st = false; for (const p of P) { if (p.t > tCut) break; if (!st) { ctx.moveTo(X(p.x), Y(p.y)); st = true; } else ctx.lineTo(X(p.x), Y(p.y)); }
        ctx.stroke();
        for (const e of sh.res.traj.ev) { if (e.t > tCut) break; if (e.type === 'floor') { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const r = 0.08 * s; ctx.beginPath(); ctx.moveTo(X(e.x) - r, Y(e.y) - r); ctx.lineTo(X(e.x) + r, Y(e.y) + r); ctx.moveTo(X(e.x) + r, Y(e.y) - r); ctx.lineTo(X(e.x) - r, Y(e.y) + r); ctx.stroke(); } }
      }
      if (sh.contact) {
        const cx = sh.golpe === 'fantasma' ? sh.contact : sh.contact;
        ctx.fillStyle = pl.color; ctx.beginPath(); ctx.arc(X(cx.x), Y(cx.y), 0.17 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `800 ${0.2 * s}px Saira, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), X(cx.x), Y(cx.y) + 1);
      }
    });
    /* posiciones base */
    for (const pl of tl.players) {
      ctx.strokeStyle = pl.color; ctx.lineWidth = 3; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(X(pl.base.x), Y(pl.base.y), 0.22 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pl.color; ctx.font = `800 ${0.24 * s}px Saira, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pl.id, X(pl.base.x), Y(pl.base.y) + 1);
    }
    ctx.restore();
  }
  function ficha(rt, tl) {
    const W = 1240, H = 1754, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    /* cabecera */
    ctx.fillStyle = '#0a5a92'; ctx.fillRect(0, 0, W, 16);
    const logo = MS.logoImg;
    if (logo && logo.naturalWidth) ctx.drawImage(logo, 60, 44, 360, 360 * logo.naturalHeight / logo.naturalWidth);
    ctx.fillStyle = '#0a5a92'; ctx.font = '700 22px Saira, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('FICHA DE RUTINA', 470, 80);
    ctx.fillStyle = '#0f1a26'; ctx.font = 'italic 800 50px Saira, Arial';
    let y = wrapText(ctx, rt.nombre || 'Rutina', 470, 136, 710, 56);
    ctx.font = '600 22px "Source Sans 3", Arial'; ctx.fillStyle = '#4a5a6e';
    const n = (rt.jugadores || []).length;
    const meta = [n === 1 ? '1 jugador' : n + ' jugadores', rt.nivel || '', rt.series ? 'Series: ' + rt.series : '', rt.modo === 'partido' ? 'Partido simulado' : tl.shots.length + ' golpes'].filter(Boolean).join('  ·  ');
    y = wrapText(ctx, meta, 470, y + 6, 710, 30);
    if (rt.objetivo) { ctx.font = '400 22px "Source Sans 3", Arial'; ctx.fillStyle = '#0f1a26'; y = wrapText(ctx, 'Objetivo: ' + rt.objetivo, 470, y + 10, 710, 30); }
    const top = Math.max(y + 20, 230);
    ctx.strokeStyle = '#d5dde7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, top); ctx.lineTo(W - 60, top); ctx.stroke();
    /* diagrama */
    const dW = 560, dH = Math.round((dW * (C.L + 0.9)) / (C.W + 0.56));
    courtDiagram(ctx, 60, top + 26, dW, dH, rt, tl);
    ctx.fillStyle = '#4a5a6e'; ctx.font = '400 17px "Source Sans 3", Arial';
    wrapText(ctx, 'Números: orden de los golpes en el punto de impacto. Línea continua: trayectoria de la bola. ×: bote. Línea discontinua: recorrido del jugador. Círculos con letra: posición base.', 60, top + dH + 52, dW, 22);
    /* columna derecha */
    let x = 660, yy = top + 50; const cw = W - 60 - x;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0a5a92'; ctx.font = '700 20px Saira, Arial'; ctx.fillText('JUGADORES', x, yy); yy += 32;
    for (const j of rt.jugadores || []) {
      ctx.fillStyle = j.color || '#333'; ctx.beginPath(); ctx.arc(x + 9, yy - 7, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f1a26'; ctx.font = '600 21px "Source Sans 3", Arial';
      ctx.fillText(`${j.id} · ${j.nombre || ''} (${j.mano === 'Z' ? 'zurdo' : 'diestro'})`, x + 28, yy); yy += 30;
    }
    yy += 14;
    ctx.fillStyle = '#0a5a92'; ctx.font = '700 20px Saira, Arial'; ctx.fillText(rt.modo === 'partido' ? 'DESARROLLO' : 'SECUENCIA', x, yy); yy += 32;
    ctx.font = '400 20px "Source Sans 3", Arial'; ctx.fillStyle = '#0f1a26';
    if (rt.modo === 'partido') yy = wrapText(ctx, 'Puntos completos con golpes elegidos por reglas tácticas; el punto termina cuando un jugador no llega o comete un error.', x, yy, cw, 27);
    else (rt.secuencia || []).forEach((s, i) => {
      const def = Shots.CAT[s.golpe];
      const nm = def ? def.nombre : 'Ghosting a ' + ((C.ghost[s.zona] || {}).nombre || 'zona aleatoria').toLowerCase();
      const extra = [s.zona && def ? 'destino ' + ((C.zones[s.zona] || {}).nombre || s.zona) : '', s.impacto && s.impacto !== 'auto' ? 'impacto: ' + s.impacto : ''].filter(Boolean).join(', ');
      yy = wrapText(ctx, `${i + 1}. ${s.j}: ${nm}${extra ? ' (' + extra + ')' : ''}`, x, yy, cw, 27);
    });
    if (rt.ciclos) { ctx.fillStyle = '#4a5a6e'; yy = wrapText(ctx, `El ciclo se repite ${rt.ciclos} veces en la simulación.`, x, yy + 4, cw, 26); }
    yy += 18;
    if (rt.claves && rt.claves.length) {
      ctx.fillStyle = '#0a5a92'; ctx.font = '700 20px Saira, Arial'; ctx.fillText('PUNTOS CLAVE', x, yy); yy += 32;
      ctx.font = '400 20px "Source Sans 3", Arial'; ctx.fillStyle = '#0f1a26';
      for (const k of rt.claves) yy = wrapText(ctx, '• ' + k, x, yy, cw, 27) + 4;
      yy += 12;
    }
    /* músculos más cargados (simulación) */
    const pl = tl.players[0];
    const agg = {};
    for (const p of tl.players) if (p.load) for (const id in p.load) agg[id] = (agg[id] || 0) + p.load[id].tot;
    const top6 = Object.entries(agg).filter(([id]) => id !== 'oculares').sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (top6.length && pl) {
      ctx.fillStyle = '#0a5a92'; ctx.font = '700 20px Saira, Arial'; ctx.fillText('MÚSCULOS MÁS EXIGIDOS', x, yy); yy += 30;
      const mx = top6[0][1];
      for (const [id, v] of top6) {
        ctx.fillStyle = '#0f1a26'; ctx.font = '400 19px "Source Sans 3", Arial'; ctx.fillText(Muscles.byId[id].nombre, x, yy);
        ctx.fillStyle = '#eef2f6'; ctx.fillRect(x, yy + 7, cw, 10);
        ctx.fillStyle = '#d4442e'; ctx.fillRect(x, yy + 7, cw * v / mx, 10); yy += 38;
      }
    }
    /* números */
    const sy = top + dH + 150;
    ctx.fillStyle = '#0a5a92'; ctx.font = '700 20px Saira, Arial'; ctx.fillText('NÚMEROS DE LA SIMULACIÓN', 60, sy);
    let ry = sy + 34;
    ctx.font = '400 19px "Source Sans 3", Arial'; ctx.fillStyle = '#0f1a26';
    for (const p of tl.players) {
      const st = p.stats;
      ry = wrapText(ctx, `${p.id} · ${p.nombre}: ${U.num(st.dist, 1)} m recorridos, ${st.steps} pasos, estocadas izquierda/derecha ${st.lungI}/${st.lungD}, velocidad máxima ${U.num(st.vmax, 1)} m/s${st.kneeMin ? ', rodilla mínima ' + Math.round(st.kneeMin) + '°' : ''}.`, 60, ry, W - 120, 26);
    }
    if (rt.descripcion) { ry += 10; ctx.fillStyle = '#4a5a6e'; ry = wrapText(ctx, rt.descripcion, 60, ry, W - 120, 26); }
    /* pie */
    ctx.fillStyle = '#0a5a92'; ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = '#ffffff'; ctx.font = '700 22px Saira, Arial'; ctx.textAlign = 'left'; ctx.fillText(CREDIT, 60, H - 28);
    ctx.textAlign = 'right'; ctx.font = '400 18px "Source Sans 3", Arial'; ctx.fillText(new Date().toLocaleDateString('es-CO'), W - 60, H - 28);
    return cv;
  }
  const toBlob = (cv, type, q) => new Promise((res) => cv.toBlob(res, type, q));

  /* ---------- PDF con jsPDF (carga bajo demanda) ---------- */
  let jsPdfP = null;
  function loadJsPDF() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    if (!jsPdfP) jsPdfP = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => (window.jspdf ? res(window.jspdf) : rej(new Error('jsPDF no cargó')));
      s.onerror = () => { jsPdfP = null; rej(new Error('Sin conexión para cargar el generador de PDF.')); };
      document.head.append(s);
    });
    return jsPdfP;
  }

  /* ---------- video ---------- */
  /* Algunos navegadores anuncian MP4 pero graban 0 bytes: se prueba cada formato con una grabación de 0,4 s */
  let mimeOk = null;
  async function probe(m) {
    try {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 36;
      const ctx = cv.getContext('2d'); const st = cv.captureStream(30);
      const rec = new MediaRecorder(st, { mimeType: m }); let size = 0;
      rec.ondataavailable = (e) => { size += e.data ? e.data.size : 0; };
      const done = new Promise((r) => (rec.onstop = r));
      rec.start(100);
      for (let i = 0; i < 12; i++) { ctx.fillStyle = `hsl(${i * 30},60%,50%)`; ctx.fillRect(0, 0, 64, 36); await new Promise((r) => setTimeout(r, 34)); }
      rec.stop(); await done; st.getTracks().forEach((t) => t.stop());
      return size > 200;
    } catch (e) { return false; }
  }
  async function pickMime() {
    if (mimeOk !== null) return mimeOk;
    mimeOk = false;
    if (typeof MediaRecorder === 'undefined') return mimeOk;
    for (const [m, ext] of [['video/mp4;codecs=avc1.42E01E', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']]) {
      if (MediaRecorder.isTypeSupported(m) && await probe(m)) { mimeOk = { m, ext }; break; }
    }
    return mimeOk;
  }
  function videoFrame(ctx, W, H, rt, tl, t, cam) {
    ctx.fillStyle = '#0d1824'; ctx.fillRect(0, 0, W, H);
    const head = 70;
    const tvW = Math.round(W * 0.68), topW = W - tvW;
    ctx.save(); ctx.translate(0, head); ctx.beginPath(); ctx.rect(0, 0, tvW, H - head - 34); ctx.clip();
    TV.draw(ctx, tvW, H - head - 34, tl, t, cam, { angulos: true, trayectoria: true });
    ctx.restore();
    ctx.save(); ctx.translate(tvW, head); ctx.beginPath(); ctx.rect(0, 0, topW, H - head - 34); ctx.clip();
    Top.draw(ctx, topW, H - head - 34, tl, t, { huellas: true, trayectoria: true }, {});
    ctx.restore();
    /* cabecera con logo */
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, head);
    const logo = MS.logoImg; if (logo && logo.naturalWidth) ctx.drawImage(logo, 14, 8, (head - 16) * logo.naturalWidth / logo.naturalHeight, head - 16);
    ctx.fillStyle = '#0f1a26'; ctx.font = 'italic 800 28px Saira, Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(rt.nombre || 'Rutina', 190, head / 2 - 1);
    const L = TL.label(tl, t);
    if (L) { ctx.textAlign = 'right'; ctx.font = '600 18px "Source Sans 3", Arial'; ctx.fillStyle = L.pl ? L.pl.color : '#333'; ctx.fillText(`Golpe ${L.n} · ${L.pl ? L.pl.nombre : ''} · ${L.nombre}${L.cls && L.cls.cod !== '—' ? ' · ' + L.cls.cod : ''}`, W - 18, head / 2); }
    ctx.fillStyle = '#0a5a92'; ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = '#fff'; ctx.font = '700 15px Saira, Arial'; ctx.textAlign = 'left'; ctx.fillText(CREDIT, 14, H - 16);
    ctx.textAlign = 'right'; ctx.font = '600 15px "IBM Plex Mono", monospace'; ctx.fillText(U.num(t, 1) + ' s', W - 14, H - 16);
  }
  async function exportVideo(rt, tl) {
    U.toast('Preparando la grabación…');
    const mm = await pickMime();
    if (!mm) { MS.App.modal({ title: 'Video no disponible', body: '<p>Este navegador no puede grabar video desde la página. Usa la ficha PNG o PDF, o abre la app en Chrome, Edge o Firefox de escritorio.</p>' }); return; }
    const W = 1280, H = 720;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const dur = Math.min(tl.duration, 45);
    const bar = U.h('div', { class: 'progress' }, U.h('i'));
    const lbl = U.h('p', { class: 'small muted', style: { marginTop: '8px' } }, `Grabando ${U.num(dur, 0)} s de animación en tiempo real (${mm.ext.toUpperCase()}, 1280 × 720)…`);
    const prev = U.h('canvas', { style: { width: '100%', borderRadius: '8px', marginTop: '10px', background: '#0d1824' } }); prev.width = 640; prev.height = 360;
    let cancel = false;
    const dlg = MS.App.modal({ title: 'Grabando video', body: U.h('div', null, bar, lbl, prev), buttons: [{ label: 'Cancelar', onClick: () => { cancel = true; } }] });
    const stream = cv.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mm.m, videoBitsPerSecond: 5e6 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise((res) => (rec.onstop = res));
    const cam = Object.assign({}, MS.Sim.S.cam);
    const pctx = prev.getContext('2d');
    videoFrame(ctx, W, H, rt, tl, 0, cam);
    rec.start(250);
    const t0 = performance.now();
    await new Promise((res) => {
      const step = () => {
        const t = (performance.now() - t0) / 1000;
        if (cancel || t >= dur) return res();
        videoFrame(ctx, W, H, rt, tl, t, cam);
        pctx.drawImage(cv, 0, 0, 640, 360);
        bar.firstChild.style.width = (100 * t / dur) + '%';
        setTimeout(step, 1000 / 30);
      };
      step();
    });
    rec.stop(); await done;
    stream.getTracks().forEach((tr) => tr.stop());
    dlg.close();
    if (cancel) { U.toast('Grabación cancelada.'); return; }
    const blob = new Blob(chunks, { type: mm.m.split(';')[0] });
    if (!blob.size) { mimeOk = null; MS.App.modal({ title: 'El video salió vacío', body: '<p>Este navegador no entregó datos de video. Prueba con Chrome o Edge de escritorio, o exporta la ficha PNG o PDF.</p>' }); return; }
    await saveFile(`manu-squash-${slug(rt.nombre)}.${mm.ext}`, blob, blob.type);
  }

  /* ---------- acciones ---------- */
  async function run(kind, rt, tl, over) {
    try {
      if (!tl) tl = Compile.compile(rt, over || {});
      const name = 'manu-squash-' + slug(rt.nombre);
      if (kind === 'json') return saveFile(name + '.json', JSON.stringify(clean(rt), null, 2), 'application/json');
      if (kind === 'code') {
        const code = await encode(clean(rt));
        const box = U.h('div', { class: 'codebox', text: code });
        MS.App.modal({ title: 'Código de la rutina', body: U.h('div', null, U.h('p', { class: 'small', style: { marginBottom: '8px' } }, 'Copia este código y envíalo. En la otra app: «Rutinas y exportar» → «Importar» → pegar el código.'), box, U.h('p', { class: 'tiny muted', style: { marginTop: '6px' } }, code.length + ' caracteres')),
          buttons: [{ label: 'Copiar', primary: true, onClick: async () => { try { await navigator.clipboard.writeText(code); U.toast('Código copiado'); } catch (e) { const r = document.createRange(); r.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(r); U.toast('Selecciona y copia el texto marcado', 'warn'); return true; } } }, { label: 'Cerrar' }] });
        return;
      }
      if (kind === 'png') { const cv = ficha(rt, tl); const b = await toBlob(cv, 'image/png'); return saveFile(name + '.png', b, 'image/png'); }
      if (kind === 'pdf') {
        U.toast('Preparando el PDF…');
        const cv = ficha(rt, tl);
        const lib = await loadJsPDF();
        const doc = new lib.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        doc.setProperties({ title: rt.nombre || 'Rutina', author: 'Manu_Squash', subject: 'Ficha de rutina de squash', creator: 'Simulador Manu Squash' });
        doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
        const blob = doc.output('blob');
        return saveFile(name + '.pdf', blob, 'application/pdf');
      }
      if (kind === 'video') return exportVideo(rt, tl);
    } catch (e) {
      console.error(e);
      MS.App.modal({ title: 'No se pudo exportar', body: `<p>${U.esc(e.message || String(e))}</p>` });
    }
  }
  async function exportPack(list) {
    const o = { formato: PACK, version: 1, autor: 'Manu_Squash', rutinas: list.map(clean), exportado: new Date().toISOString().slice(0, 10) };
    return saveFile('manu-squash-mis-rutinas.json', JSON.stringify(o, null, 2), 'application/json');
  }
  async function importText(text) { const o = await decode(text); return validate(o); }

  return { run, saveFile, clean, validate, encode, decode, importText, exportPack, ficha, downloads, diagram: courtDiagram };
})();
