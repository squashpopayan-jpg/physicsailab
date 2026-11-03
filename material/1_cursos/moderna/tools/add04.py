# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\50-fm-rel.js'
s = open(p, encoding='utf-8').read()
add = r"""
  /* ---------- Dinámica relativista (unidades naturales: energías en MeV, masas en MeV/c², momentos en MeV/c) ---------- */
  /* Masas (MeV/c²): CODATA 2018 (e, p, n, d) y PDG 2022 (π, μ, K, W, Z, H) */
  R.MASS = { e: 0.51099895, mu: 105.6583755, pi: 139.57039, pi0: 134.9768, K: 493.677, p: 938.27208816, n: 939.56542052, d: 1875.61294257, W: 80377, Z: 91187.6, H: 125250, top: 172690, tau: 1776.86, gamma: 0 };
  R.energy = (m, g) => g * m;                                  /* E = γmc² */
  R.kinetic = (m, g) => (g - 1) * m;                           /* K = (γ − 1)mc² */
  R.gammaFromK = (K, m) => 1 + K / m;
  R.momentumFromK = (K, m) => Math.sqrt(K * (K + 2 * m));      /* pc = √(K(K + 2mc²)) */
  R.betaFromK = (K, m) => R.momentumFromK(K, m) / (K + m);
  R.classicalK = (m, b) => 0.5 * m * b * b;                    /* ½mv² */
  R.classicalV = (K, m) => Math.sqrt((2 * K) / m);             /* v/c que daría la energía cinética clásica */
  /* Invariante s = (E₁ + E₂)² − |p₁ + p₂|² de dos partículas con ángulo θ entre sus momentos */
  R.s2 = (m1, E1, m2, E2, th) => m1 * m1 + m2 * m2 + 2 * (E1 * E2 - Math.sqrt(E1 * E1 - m1 * m1) * Math.sqrt(E2 * E2 - m2 * m2) * Math.cos(th));
  /* Energía disponible en el centro de masas (√s): blanco fijo (la partícula 2 en reposo) y colisionador frontal */
  R.sqrtsFixed = (m1, E1, m2) => Math.sqrt(m1 * m1 + m2 * m2 + 2 * E1 * m2);
  R.sqrtsCollider = (m1, E1, m2, E2) => Math.sqrt(R.s2(m1, E1, m2, E2, Math.PI));
  /* Energía de umbral (cinética del proyectil sobre blanco en reposo) para producir una masa final Mf */
  R.thresholdFixedK = (m1, m2, Mf) => (Mf * Mf - (m1 + m2) * (m1 + m2)) / (2 * m2);
  /* Energía total del haz de un blanco fijo que da el mismo √s que un colisionador simétrico de haces de energía E */
  R.fixedEquivalentE = (m, E) => (4 * E * E - 2 * m * m) / (2 * m);
  /* Momento de cada producto en la desintegración en reposo M → m₁ + m₂ */
  R.twoBodyP = (M, m1, m2) => Math.sqrt((M * M - (m1 + m2) * (m1 + m2)) * (M * M - (m1 - m2) * (m1 - m2))) / (2 * M);
  /* π⁰ → γγ: intervalo de energías de los fotones y ángulo mínimo de apertura para un π⁰ de energía E (m en MeV) */
  R.pi0Photons = (m, E) => { const g = E / m, b = Math.sqrt(1 - 1 / (g * g)); return { Emin: (E * (1 - b)) / 2, Emax: (E * (1 + b)) / 2, thetaMin: 2 * Math.asin(1 / g), gamma: g, beta: b }; };
  /* Masa invariante a partir de dos fotones: m² = 2E₁E₂(1 − cos θ) */
  R.twoPhotonMass = (E1, E2, th) => Math.sqrt(2 * E1 * E2 * (1 - Math.cos(th)));
  /* Q de una reacción a partir de masas atómicas (u): (Σ_in − Σ_out) · 931.494 MeV/u */
  R.U_MEV = 931.49410242;
  R.qValue = (inU, outU) => (inU.reduce((a, b) => a + b, 0) - outU.reduce((a, b) => a + b, 0)) * R.U_MEV;
"""
s = s.replace("})(typeof window", add + "})(typeof window")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
