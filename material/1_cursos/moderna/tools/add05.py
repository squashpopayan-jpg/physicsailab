# -*- coding: utf-8 -*-
p = r'C:\Users\User\Documents\Claude\ConCode\moderna\src\core\50-fm-rel.js'
s = open(p, encoding='utf-8').read()
add = r"""
  /* ---------- Doppler, aberración, Cherenkov y campos en movimiento ---------- */
  /* Factor de Doppler f_obs/f_fuente = 1/(γ(1 − β cos θ)); θ = ángulo, en el sistema del observador, entre la velocidad de la fuente y la dirección de la luz hacia el observador */
  R.doppler = (b, th) => 1 / (R.gamma(b) * (1 - b * Math.cos(th)));
  R.dopplerRecede = (b) => Math.sqrt((1 - b) / (1 + b));
  R.dopplerApproach = (b) => Math.sqrt((1 + b) / (1 - b));
  R.redshiftBeta = (z) => ((1 + z) * (1 + z) - 1) / ((1 + z) * (1 + z) + 1);
  R.betaRedshift = (b) => Math.sqrt((1 + b) / (1 - b)) - 1;
  /* Aberración: ángulo observado α′ de una estrella cuya dirección forma el ángulo α con la velocidad del observador (medido en el sistema en reposo respecto de las estrellas) */
  R.aberrate = (b, al) => Math.acos((Math.cos(al) + b) / (1 + b * Math.cos(al)));
  /* Efecto faro: ángulo en el laboratorio de un fotón emitido a θ* en el sistema de la fuente */
  R.headlight = (b, thStar) => Math.acos((Math.cos(thStar) + b) / (1 + b * Math.cos(thStar)));
  /* Fotones por unidad de ángulo sólido de una fuente isótropa en movimiento: (1/4π)·D² (normalizado a 1 sobre la esfera) */
  R.beamDensity = (b, th) => { const D = R.doppler(b, th); return (D * D) / (4 * Math.PI); };
  /* Radiación de Cherenkov: cos θ_c = 1/(nβ); umbral β = 1/n; energía cinética umbral (MeV) para una masa m (MeV); fotones por metro entre λ₁ y λ₂ (m) */
  R.cherenkovAngle = (n, b) => (n * b > 1 ? Math.acos(1 / (n * b)) : NaN);
  R.cherenkovThresholdK = (n, m) => m * (1 / Math.sqrt(1 - 1 / (n * n)) - 1);
  R.cherenkovYield = (n, b, l1, l2) => { const s2 = 1 - 1 / (n * n * b * b); return n * b > 1 ? 2 * Math.PI * K.alpha * s2 * (1 / l1 - 1 / l2) : 0; };
  /* Transformación de los campos E y B (impulso a lo largo de x con velocidad βc): devuelve {E: [Ex, Ey, Ez], B: [Bx, By, Bz]} en S′ */
  R.fieldBoost = (E, B, b) => {
    const g = R.gamma(b), v = b * c;
    return { E: [E[0], g * (E[1] - v * B[2]), g * (E[2] + v * B[1])], B: [B[0], g * (B[1] + (v * E[2]) / (c * c)), g * (B[2] - (v * E[1]) / (c * c))] };
  };
  /* Campo eléctrico de una carga con velocidad uniforme, relativo al de Coulomb a la misma distancia desde la posición PRESENTE; θ = ángulo entre r y v */
  R.movingChargeE = (b, th) => (1 - b * b) / Math.pow(1 - b * b * Math.sin(th) ** 2, 1.5);
  /* Invariantes: E² − c²B² y E·B */
  R.fieldInvariants = (E, B) => [E[0] ** 2 + E[1] ** 2 + E[2] ** 2 - c * c * (B[0] ** 2 + B[1] ** 2 + B[2] ** 2), E[0] * B[0] + E[1] * B[1] + E[2] * B[2]];
"""
s = s.replace("})(typeof window", add + "})(typeof window")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
