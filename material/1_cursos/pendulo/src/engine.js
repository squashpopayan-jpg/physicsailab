/* ==========================================================================
   MOTOR FÍSICO, METROLÓGICO Y ESTADÍSTICO · PÉNDULO SIMPLE & GRAVEDAD
   Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca
   ========================================================================== */

(function (window) {
  'use strict';

  // Gravedades de referencia locales e internacionales (m/s²)
  const GRAVEDADES_REFERENCIA = {
    popayan: { nombre: 'Popayán (Unicauca - 1.760 msnm)', g: 9.776, u: 0.004 },
    bogota: { nombre: 'Bogotá (2.640 msnm)', g: 9.774, u: 0.005 },
    medellin: { nombre: 'Medellín (1.495 msnm)', g: 9.780, u: 0.005 },
    cali: { nombre: 'Cali (1.000 msnm)', g: 9.781, u: 0.004 },
    barranquilla: { nombre: 'Barranquilla (Nivel del mar)', g: 9.782, u: 0.004 },
    estandar: { nombre: 'Estándar Internacional (Nivel del mar)', g: 9.80665, u: 0.001 },
    luna: { nombre: 'La Luna (Misión Apolo)', g: 1.622, u: 0.002 },
    marte: { nombre: 'Marte (Perseverance)', g: 3.721, u: 0.005 },
    jupiter: { nombre: 'Júpiter (Nivel 1 bar)', g: 24.79, u: 0.02 }
  };

  // Generador pseudoaleatorio determinístico para los 24 bancos (PRNG xorshift32)
  function createRng(seed) {
    let s = Math.abs(Math.sin(seed) * 1e9) | 0 || 123456789;
    return function () {
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }

  // Generar parámetros experimentales únicos para el banco asignado (1 a 24)
  function getBancoParams(bancoNum) {
    const b = Math.max(1, Math.min(24, parseInt(bancoNum, 10) || 1));
    const rng = createRng(b * 777 + 101);

    // Variaciones realistas de instrumentación de laboratorio
    const offsetLongitud = (rng() - 0.5) * 0.004; // ±2 mm por posición de nudo / pinza
    const tiempoReaccion = 0.12 + rng() * 0.09;   // 0.12s a 0.21s de reacción humana del cronometrista
    const masaReal = 0.050 + (rng() - 0.5) * 0.008; // 50g ± 4g de masa de plomada
    const radioEsfera = 0.012 + (rng() - 0.5) * 0.002; // 12 mm de radio
    const amortiguamientoAire = 0.0018 + rng() * 0.0008; // Coeficiente de arrastre del laboratorio
    const ruidoCronometro = 0.04 + rng() * 0.04; // Ruido aleatorio por dispersión de clic

    return {
      banco: b,
      offsetLongitud,
      tiempoReaccion,
      masaReal,
      radioEsfera,
      amortiguamientoAire,
      ruidoCronometro
    };
  }

  // Integrador numérico Runge-Kutta 4to orden (RK4) para la ecuación diferencial:
  // d²θ/dt² + (b/(m*L))*dθ/dt + (g/L)*sin(θ) = 0
  function pasoRK4(theta, omega, L, m, g, amort, dt) {
    const f1_omega = omega;
    const f1_alpha = -(g / L) * Math.sin(theta) - (amort / (m * L)) * omega;

    const th2 = theta + 0.5 * dt * f1_omega;
    const om2 = omega + 0.5 * dt * f1_alpha;
    const f2_omega = om2;
    const f2_alpha = -(g / L) * Math.sin(th2) - (amort / (m * L)) * om2;

    const th3 = theta + 0.5 * dt * f2_omega;
    const om3 = omega + 0.5 * dt * f2_alpha;
    const f3_omega = om3;
    const f3_alpha = -(g / L) * Math.sin(th3) - (amort / (m * L)) * om3;

    const th4 = theta + dt * f3_omega;
    const om4 = omega + dt * f3_alpha;
    const f4_omega = om4;
    const f4_alpha = -(g / L) * Math.sin(th4) - (amort / (m * L)) * om4;

    const nuevoTheta = theta + (dt / 6) * (f1_omega + 2 * f2_omega + 2 * f3_omega + f4_omega);
    const nuevoOmega = omega + (dt / 6) * (f1_alpha + 2 * f2_alpha + 2 * f3_alpha + f4_alpha);

    return { theta: nuevoTheta, omega: nuevoOmega };
  }

  // Cálculo del periodo teórico exacto considerando amplitudes finitas (Serie de Legendre / Borda)
  function calcularPeriodoTeorico(L, g, theta0Rad) {
    if (L <= 0 || g <= 0) return 0;
    const T0 = 2 * Math.PI * Math.sqrt(L / g);
    if (!theta0Rad || Math.abs(theta0Rad) < 1e-4) return T0;

    const k = Math.sin(theta0Rad / 2);
    // Aproximación de orden 4 en sin(theta0/2)
    const factorNoLineal = 1 + 0.25 * (k * k) + (9 / 64) * Math.pow(k, 4);
    return T0 * factorNoLineal;
  }

  // Cálculo del periodo para péndulo físico con masa esférica de radio R:
  // T_fisico = T0 * sqrt(1 + (2/5)*(R/L)^2)
  function calcularPeriodoFisico(L, g, radio) {
    const T0 = 2 * Math.PI * Math.sqrt(L / g);
    if (!radio || radio <= 0) return T0;
    const ratio = radio / L;
    return T0 * Math.sqrt(1 + 0.4 * ratio * ratio);
  }

  // Cálculos de Energía del Péndulo
  function calcularEnergias(theta, omega, L, m, g) {
    const v = L * omega;
    const Ec = 0.5 * m * v * v;
    const h = L * (1 - Math.cos(theta));
    const Ep = m * g * h;
    const Et = Ec + Ep;
    return { Ec, Ep, Et, h, v };
  }

  // ==========================================================================
  // METROLOGÍA Y REGRESIÓN LINEAL POR MÍNIMOS CUADRADOS
  // ==========================================================================

  // Promedio aritmético
  function promedio(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((acc, val) => acc + val, 0) / arr.length;
  }

  // Desviación estándar muestral (s)
  function desviacionEstandar(arr, prom) {
    if (!arr || arr.length < 2) return 0;
    const mean = prom !== undefined ? prom : promedio(arr);
    const sumSq = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
  }

  // Ajuste por Mínimos Cuadrados: Y = m*X + c
  // donde X = L (longitud), Y = T² (periodo al cuadrado)
  // Pendiente teórica: m = 4*pi² / g => g = 4*pi² / m
  function regresionLineal(puntos) {
    // puntos: [{ x: L, y: T2, uy: deltaT2 }]
    const n = puntos.length;
    if (n < 2) {
      return { valido: false, error: 'Se requieren al menos 2 longitudes distintas.' };
    }

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const p = puntos[i];
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    }

    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-12) {
      return { valido: false, error: 'Las longitudes deben ser distintas.' };
    }

    const m = (n * sumXY - sumX * sumY) / denom;
    const c = (sumY - m * sumX) / n;

    // Coeficiente de correlación R²
    const rNumerador = n * sumXY - sumX * sumY;
    const rDenom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = rDenom !== 0 ? rNumerador / rDenom : 0;
    const r2 = r * r;

    // Desviación estándar de los residuales (Syx)
    let sResiduales = 0;
    for (let i = 0; i < n; i++) {
      const yAjustado = m * puntos[i].x + c;
      sResiduales += Math.pow(puntos[i].y - yAjustado, 2);
    }
    const syx = n > 2 ? Math.sqrt(sResiduales / (n - 2)) : Math.sqrt(sResiduales);

    // Incertidumbre de la pendiente u(m) y del intercepto u(c)
    const sxx = sumX2 - (sumX * sumX) / n;
    const u_m = sxx > 0 ? syx / Math.sqrt(sxx) : 0;
    const u_c = sxx > 0 ? syx * Math.sqrt(sumX2 / (n * sxx)) : 0;

    // Gravedad experimental obtenida de la pendiente:
    // m = 4*pi²/g => g_exp = 4*pi² / m
    const g_exp = m > 0 ? (4 * Math.PI * Math.PI) / m : 0;

    // Propagación de incertidumbre:
    // u(g) = g * (u(m) / m)
    const u_g = (m > 0 && u_m > 0) ? g_exp * (u_m / m) : 0;

    return {
      valido: true,
      n,
      m,
      c,
      r2,
      syx,
      u_m,
      u_c,
      g_exp,
      u_g
    };
  }

  // Evaluación de Compatibilidad Metrológica y Z-score
  function evaluarCompatibilidad(g_exp, u_g, g_ref, u_ref) {
    if (!g_exp || g_exp <= 0) return null;
    const ref = g_ref || 9.776;
    const uR = u_ref || 0.004;

    const errorAbsoluto = Math.abs(g_exp - ref);
    const errorRelativoPct = (errorAbsoluto / ref) * 100;

    const denomZ = Math.sqrt(u_g * u_g + uR * uR);
    const zScore = denomZ > 0 ? errorAbsoluto / denomZ : 0;

    let veredicto = '';
    let clase = '';
    if (zScore <= 1.0) {
      veredicto = 'Excelente compatibilidad (Z ≤ 1.0). Tu medición concuerda con la gravedad de referencia.';
      clase = 'success';
    } else if (zScore <= 2.0) {
      veredicto = 'Compatibilidad aceptable (Z ≤ 2.0). Dentro del intervalo de confianza del 95%.';
      clase = 'success';
    } else if (zScore <= 3.0) {
      veredicto = 'Dudoso / Advertencia (2 < Z ≤ 3). Posible sesgo en longitud de centro de masa o reacción.';
      clase = 'warn';
    } else {
      veredicto = 'Incompatible (Z > 3.0). Revisa posibles errores de conteo de oscilaciones o amplitud inicial.';
      clase = 'danger';
    }

    return {
      errorAbsoluto,
      errorRelativoPct,
      zScore,
      veredicto,
      clase
    };
  }

  // Exportar al objeto global
  window.PenduloEngine = {
    GRAVEDADES_REFERENCIA,
    createRng,
    getBancoParams,
    pasoRK4,
    calcularPeriodoTeorico,
    calcularPeriodoFisico,
    calcularEnergias,
    promedio,
    desviacionEstandar,
    regresionLineal,
    evaluarCompatibilidad
  };

})(window);
