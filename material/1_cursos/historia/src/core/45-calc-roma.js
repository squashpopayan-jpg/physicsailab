(function (root) {
  'use strict';
  const C = root.EM.calc, K = C.K;
  /* Calendarios: años con día bisiesto y duración media del año */
  C.yearLength = { juliano: 365.25, gregoriano: 365 + 97 / 400, egipcio: 365 };
  /* Desfase acumulado (días) entre un calendario y el año tropical tras N años */
  C.calendarDrift = (type, years) => (C.yearLength[type] - K.tropicalYear) * years;
  C.gregorianLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  /* Generador pseudoaleatorio determinista (mulberry32) y gaussiana de Box-Muller */
  C.rng = function (seed) {
    let a = seed >>> 0;
    const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    u.gauss = () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
    return u;
  };
  /* Caminata aleatoria 2D de n partículas: desplazamiento cuadrático medio por paso */
  C.randomWalkMSD = function (n, steps, sigma, seed) {
    const r = C.rng(seed);
    const x = new Float64Array(n), y = new Float64Array(n), msd = [0];
    for (let s = 1; s <= steps; s++) {
      let acc = 0;
      for (let i = 0; i < n; i++) { x[i] += sigma * r.gauss(); y[i] += sigma * r.gauss(); acc += x[i] * x[i] + y[i] * y[i]; }
      msd.push(acc / n);
    }
    return msd;
  };
})(typeof window !== 'undefined' ? window : global);
