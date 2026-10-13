/* Utilidades comunes. Todo el simulador vive en el espacio de nombres MS. */
'use strict';
var MS = (typeof window !== 'undefined' ? window : globalThis).MS = (typeof window !== 'undefined' ? window : globalThis).MS || {};

MS.U = (function () {
  const U = {};
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.smooth = (t) => { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  U.minJerk = (u) => { u = U.clamp(u, 0, 1); return u * u * u * (10 - 15 * u + 6 * u * u); };
  U.easeOut = (t) => 1 - (1 - U.clamp(t, 0, 1)) ** 2;
  U.easeIn = (t) => U.clamp(t, 0, 1) ** 2;
  U.v2 = (x, y) => ({ x, y });
  U.add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  U.sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  U.mul = (a, k) => ({ x: a.x * k, y: a.y * k });
  U.len = (a) => Math.hypot(a.x, a.y);
  U.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  U.norm = (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; };
  U.perp = (a) => ({ x: -a.y, y: a.x });
  U.dot = (a, b) => a.x * b.x + a.y * b.y;
  U.lerp2 = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  U.angOf = (a) => Math.atan2(a.y, a.x);
  U.angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  U.lerpAng = (a, b, t) => a + U.angDiff(a, b) * t;
  U.deg = (r) => (r * 180) / Math.PI;
  U.rad = (d) => (d * Math.PI) / 180;
  /* Vectores 3D */
  U.v3 = (x, y, z) => ({ x, y, z });
  U.a3 = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
  U.s3 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  U.m3 = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
  U.d3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  U.c3 = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  U.l3 = (a) => Math.hypot(a.x, a.y, a.z);
  U.n3 = (a) => { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
  U.lerp3 = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
  /* Generador pseudoaleatorio reproducible (mulberry32) */
  U.rng = (seed) => {
    let s = seed >>> 0 || 1;
    const f = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.pick = (arr) => arr[Math.floor(f() * arr.length) % arr.length];
    f.weighted = (pairs) => { let tot = 0; for (const p of pairs) tot += p[1]; let r = f() * tot; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; } return pairs[pairs.length - 1][0]; };
    return f;
  };
  /* Números con coma decimal */
  U.num = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '–');
  U.pct = (v, d = 0) => U.num(v * 100, d) + ' %';
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.uid = () => Math.random().toString(36).slice(2, 9);
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  /* Búsqueda binaria sobre arreglos ordenados por t */
  U.bsearch = (arr, t, key = 't') => { let lo = 0, hi = arr.length - 1; if (hi < 0 || t < arr[0][key]) return -1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m][key] <= t) lo = m; else hi = m - 1; } return lo; };
  /* DOM */
  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  U.h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kd of kids.flat()) if (kd != null && kd !== false) e.append(kd.nodeType ? kd : document.createTextNode(String(kd)));
    return e;
  };
  U.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  U.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  /* Prepara un canvas con densidad de píxeles adecuada; devuelve ctx con escala 1 = px CSS */
  U.fitCanvas = (cv, w, h) => {
    const dpr = Math.min(2.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };
  U.toast = (msg, kind) => {
    if (typeof document === 'undefined') return;
    let box = document.getElementById('toasts');
    if (!box) { box = U.h('div', { id: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(box); }
    const t = U.h('div', { class: 'toast' + (kind ? ' ' + kind : '') }, msg);
    box.append(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4400);
  };
  return U;
})();
