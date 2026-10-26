/* Utilidades matemáticas, manipulación de DOM, audio sintético y temporizadores */
window.MS = window.MS || {};

MS.U = (function () {
  const U = {};

  U.$ = (s, root = document) => root.querySelector(s);
  U.$$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  U.clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rad = (deg) => (deg * Math.PI) / 180;
  U.deg = (rad) => (rad * 180) / Math.PI;

  /* Vectores 2D */
  U.dist2 = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  U.sub2 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  U.add2 = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  U.mul2 = (v, s) => ({ x: v.x * s, y: v.y * s });
  U.dot2 = (a, b) => a.x * b.x + a.y * b.y;
  U.len2 = (v) => Math.hypot(v.x, v.y);
  U.norm2 = (v) => {
    const l = U.len2(v);
    return l < 1e-6 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
  };

  /* Vectores 3D */
  U.s3 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  U.a3 = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
  U.m3 = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
  U.d3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  U.l3 = (v) => Math.hypot(v.x, v.y, v.z);
  U.n3 = (v) => {
    const l = U.l3(v);
    return l < 1e-6 ? { x: 0, y: 0, z: 0 } : { x: v.x / l, y: v.y / l, z: v.z / l };
  };
  U.c3 = (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  });
  U.lerp3 = (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  });

  /* Sintetizador de audio para árbitro (sin archivos externos) */
  let audioCtx = null;
  U.beep = function (freq = 880, dur = 0.15, type = 'sine') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {
      // Silencio si el navegador bloquea audio
    }
  };

  U.whistle = function () {
    U.beep(1200, 0.12, 'square');
    setTimeout(() => U.beep(1450, 0.22, 'square'), 100);
  };

  U.fmtSecs = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return U;
})();
