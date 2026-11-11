/* Modelo anatómico 3D: la misma malla del atleta en pose anatómica, con los músculos como regiones
   seleccionables. Modo «dual» (anterior + posterior, fijo) o «orbit» (una figura que se gira arrastrando). */
MS.Body = (function () {
  const { U } = MS;
  const meshCache = {};
  function mesh(lod) { return meshCache[lod] || (meshCache[lod] = MS.Athlete.build(MS.Athlete.anatSkeleton(), { lod, edges: true })); }

  function view(az, cx, baseY, sc) {
    const d = { x: Math.cos(az), y: Math.sin(az) }, rt = { x: -d.y, y: d.x };
    return {
      proj: (p) => ({ x: cx + (p.x * rt.x + p.y * rt.y) * sc, y: baseY - p.z * sc, z: p.x * d.x + p.y * d.y }),
      facing: (n) => n.x * d.x + n.y * d.y < -0.02,
      light: U.n3({ x: -d.x * 0.6 - rt.x * 0.35, y: -d.y * 0.6 - rt.y * 0.35, z: 0.55 }),
    };
  }

  /* opts: {mode:'dual'|'orbit', interactive, onSelect(id), onHover(id), labels} */
  function create(host, opts = {}) {
    const A = MS.Athlete, mode = opts.mode || 'dual';
    host.classList.add('bodymap');
    host.innerHTML = '';
    const cv = U.h('canvas', { role: 'img', 'aria-label': mode === 'dual' ? 'Modelo muscular, vistas anterior y posterior' : 'Modelo muscular 3D. Arrastre para girar.' });
    host.append(cv);
    const st = { colors: null, sel: null, hover: null, az: Math.PI / 2, drawn: [], raf: 0, spin: false };
    let btns = null;
    if (mode === 'orbit') {
      btns = U.h('div', { class: 'seg', role: 'group', 'aria-label': 'Vista del modelo', style: { marginTop: '8px' } });
      for (const [t, a] of [['Anterior', Math.PI / 2], ['Lateral der.', Math.PI], ['Posterior', -Math.PI / 2], ['Lateral izq.', 0]]) {
        const b = U.h('button', { text: t }); b.addEventListener('click', () => { st.spin = false; st.az = a; sync(); render(); }); b._a = a; btns.append(b);
      }
      const sp = U.h('button', { text: 'Girar' }); sp.addEventListener('click', () => { st.spin = !st.spin; sync(); if (st.spin) spin(); }); sp._spin = true; btns.append(sp);
      host.append(btns);
    }
    const sync = () => { if (btns) for (const b of btns.children) b.setAttribute('aria-pressed', String(b._spin ? st.spin : !st.spin && Math.abs(U.angDiff(b._a, st.az)) < 0.05)); };
    let lastSpin = 0;
    function spin(ts) { if (!st.spin || !cv.isConnected) return; if (lastSpin && ts) st.az += (ts - lastSpin) * 0.0007; lastSpin = ts || 0; render(true); requestAnimationFrame(spin); }

    function tokens() {
      const cs = getComputedStyle(host), g = (n, d) => (cs.getPropertyValue(n).trim() || d);
      return { musc: A.parseColor(g('--muscle', '#e9bfae')), none: A.parseColor(g('--skin', '#f5e9e0')), line: g('--muscle-line', '#b9826e'), ink: g('--ink', '#0f1a26'), ink3: g('--ink-3', '#75859a'), surf: g('--surface', '#fff'), brand: g('--brand', '#0a5a92') };
    }
    function render(now) {
      if (!now) { if (st.raf) return; st.raf = requestAnimationFrame(() => { st.raf = 0; render(true); }); return; }
      const w = Math.max(160, host.clientWidth || 300);
      const h = mode === 'dual' ? Math.round(w * 1.1) : Math.round(Math.min(w * 1.28, 600));
      cv.style.width = '100%'; cv.style.height = h + 'px';
      const ctx = U.fitCanvas(cv, w, h);
      ctx.clearRect(0, 0, w, h);
      const T = tokens();
      const lod = mode === 'dual' ? 2 : 3;
      const Q = mesh(lod);
      const style = { anat: { colors: st.colors, base: T.musc, none: T.none }, sel: st.sel, line: T.line, selLine: T.ink };
      const sc = (h - (mode === 'dual' ? 30 : 16)) / 1.84, baseY = h - (mode === 'dual' ? 24 : 8);
      const views = mode === 'dual' ? [[Math.PI / 2, w * 0.26, 'ANTERIOR'], [-Math.PI / 2, w * 0.74, 'POSTERIOR']] : [[st.az, w / 2, null]];
      st.drawn = [];
      const cent = {};
      ctx.lineJoin = 'round';
      views.forEach(([az, cx, label], vi) => {
        const V = view(az, cx, baseY, sc);
        /* sombra de contacto */
        const g = ctx.createRadialGradient(cx, baseY - 2, 0, cx, baseY - 2, sc * 0.34);
        g.addColorStop(0, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save(); ctx.translate(cx, baseY - 2); ctx.scale(1, 0.22); ctx.translate(-cx, -(baseY - 2)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, baseY - 2, sc * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        const vis = A.visible(Q, V, []);
        vis.sort((a, b) => b.z - a.z);
        for (const e of vis) {
          A.paint(ctx, e, style, V.light);
          const m = e.q.reg.m;
          if (m && (m === st.sel || m === st.hover)) { const k = m + ':' + vi, c = cent[k] || (cent[k] = { x: 0, y: 0, n: 0, cx, m }); c.x += (e.a.x + e.c.x) / 2; c.y += (e.a.y + e.c.y) / 2; c.n++; }
          st.drawn.push(e);
        }
        if (label) { ctx.fillStyle = T.ink3; ctx.font = '700 10px Saira, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; try { ctx.letterSpacing = '1px'; } catch (e) { /* opcional */ } ctx.fillText(label, cx, h - 6); }
      });
      /* etiquetas con línea guía para el músculo elegido y el señalado */
      if (opts.labels !== false) {
        for (const id of [st.sel, st.hover !== st.sel ? st.hover : null]) {
          if (!id) continue;
          let best = null; for (const k in cent) if (cent[k].m === id && (!best || cent[k].n > best.n)) best = cent[k];
          if (!best) continue;
          const px = best.x / best.n, py = best.y / best.n, name = MS.Muscles.byId[id] ? MS.Muscles.byId[id].nombre.replace(/ \(.*\)$/, '') : id;
          ctx.font = '600 12px "Source Sans 3", Arial';
          const tw = ctx.measureText(name).width + 14, right = px >= best.cx;
          let lx = right ? Math.min(w - tw - 4, px + 34) : Math.max(4, px - 34 - tw), ly = U.clamp(py - 30, 6, h - 30);
          ctx.strokeStyle = T.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(right ? lx : lx + tw, ly + 10); ctx.stroke();
          ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = id === st.sel ? T.ink : T.brand; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx, ly, tw, 20, 6); else ctx.rect(lx, ly, tw, 20); ctx.fill();
          ctx.fillStyle = T.surf; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(name, lx + 7, ly + 10.5);
        }
      }
    }
    function pick(ev) {
      const r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      for (let i = st.drawn.length - 1; i >= 0; i--) if (A.inQuad(st.drawn[i], x, y)) return st.drawn[i].q.reg.m;
      return null;
    }
    const api = {
      paint(fn) { const T = tokens(), base = `rgb(${T.musc.join(',')})`; st.colors = {}; for (const g of MS.Muscles.G) { const c = fn(g.id, base); if (c) st.colors[g.id] = A.parseColor(c); } render(); },
      activation(act) { st.colors = A.actColors(act, tokens().musc); render(); },
      select(id) { st.sel = id; render(); },
      clear() { st.colors = null; render(); },
      setView(az) { st.az = az; sync(); render(); },
      render,
    };
    if (opts.interactive) {
      let drag = null, moved = false;
      cv.style.touchAction = mode === 'orbit' ? 'pan-y' : 'auto';
      cv.addEventListener('pointerdown', (e) => { moved = false; if (mode === 'orbit') { drag = { x: e.clientX, az: st.az }; st.spin = false; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ } } });
      cv.addEventListener('pointermove', (e) => {
        if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 3) moved = true; if (moved) { st.az = drag.az + dx * 0.012; sync(); render(); } return; }
        const m = pick(e); if (m !== st.hover) { st.hover = m; cv.style.cursor = m ? 'pointer' : mode === 'orbit' ? 'grab' : 'default'; opts.onHover && opts.onHover(m); render(); }
      });
      const end = (e) => { const was = drag; drag = null; if (was && moved) return; const m = pick(e); if (m) { api.select(m); opts.onSelect && opts.onSelect(m); } };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointerleave', () => { if (st.hover) { st.hover = null; render(); } });
    }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => render()).observe(host);
    sync(); render();
    return api;
  }
  return { create };
})();
