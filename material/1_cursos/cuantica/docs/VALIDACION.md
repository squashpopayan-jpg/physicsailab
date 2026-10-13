# Validación del núcleo físico — «De la cuántica al nanoporo»

Cada simulación del curso usa las funciones de `src/phys/`. Este informe compara
sus resultados con soluciones exactas, identidades matemáticas y referencias
publicadas (NIST, CODATA, Clementi–Roetti, Onsager, tesis de M. A. Obando e
informe científico de hBN-MC). Se regenera con `node tests/validar.js`.

Resultado: **109 de 109 pruebas superadas** (2026-10-01, 4.6 s).

| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Ley de Wien: λ_max·T del máximo numérico de Planck | 0.00289777197 m·K | 0.00289777196 | CODATA 2018 (b) | 4.4e-9 | 0.000001 (rel.) | OK |
| 1 | Stefan–Boltzmann: σ al integrar la ley de Planck | 5.670374e-8 W/(m²K⁴) | 5.670374e-8 | CODATA 2018 (σ) | 5.8e-11 | 0.000001 (rel.) | OK |
| 1 | Hα de Balmer con la constante de Rydberg del hidrógeno | 656.469609 nm | 656.47 | NIST (vacío) | 6.0e-7 | 0.0002 (rel.) | OK |
| 2 | Crank–Nicolson conserva la norma (1000 pasos) | 1 | 1 | unitariedad | 3.8e-13 | 1e-10 | OK |
| 2 | Anchura del paquete libre en t = 5: σ₀√(1+(t/2σ₀²)²) | 2.68909954 | 2.6925824 | solución exacta | 1.3e-3 | 0.002 (rel.) | OK |
| 2 | Paquete gaussiano: Δx·Δp = ħ/2 | 0.499999769 | 0.5 | desigualdad de Heisenberg (igualdad) | 4.6e-7 | 0.0002 (rel.) | OK |
| 3 | Dos niveles: autovalor inferior (Jacobi) = ε̄ − √(Δ²/4 + t²) | -1.41421356 | -1.41421356 | fórmula cerrada (ε = ±1, t = 1) | 2.7e-11 | 1e-10 | OK |
| 3 | Matriz hermítica 3×3: autovalores reales por inmersión 2n | 3 | 3 | traza = Σ autovalores | 8.9e-16 | 1e-10 | OK |
| 4 | Pozo infinito (L = 2): E₁ por diferencias finitas | 1.2337003 | 1.23370055 | π²ħ²/(2mL²) | 2.1e-7 | 0.00001 (rel.) | OK |
| 4 | Pozo finito (V₀ = 10, L = 2): E₀ con malla alineada | -9.18025604 | -9.1802603 | raíz de tan z = √(z₀²−z²)/z | 4.6e-7 | 0.0002 (rel.) | OK |
| 4 | Barrera rectangular: T(E) por matriz de transferencia | 0.180706639 | 0.180706639 | fórmula analítica | 5.8e-16 | 1e-10 | OK |
| 5 | Oscilador armónico: E₃ numérico | 3.49997189 | 3.5 | ħω(n + ½) | 8.0e-6 | 0.00003 (rel.) | OK |
| 5 | Morse (Dₑ = 10, a = 0.7): E₀ numérico | 1.50398927 | 1.50399758 | fórmula exacta de Morse | 5.5e-6 | 0.00005 (rel.) | OK |
| 5 | Pöschl–Teller (λ = 4): E₁ numérico | -4.50005238 | -4.5 | −(λ−n)²/2 | 1.2e-5 | 0.00005 (rel.) | OK |
| 6 | Hidrógeno 1s (Numerov en malla logarítmica) | -0.5 | -0.5 | −1/(2n²) Ha | 9.4e-12 | 1e-9 | OK |
| 6 | Hidrógeno 3d | -0.0555555556 | -0.0555555556 | −1/(2n²) Ha | 3.1e-12 | 1e-9 | OK |
| 6 | Hidrógeno 4f (l = 3) | -0.03125 | -0.03125 | −1/(2n²) Ha | 2.3e-12 | 1e-8 | OK |
| 6 | ⟨r⟩ del estado 2p por integración de R₂₁ | 5 | 5 | [3n² − l(l+1)]/2 a₀ | 8.7e-15 | 1e-8 (rel.) | OK |
| 6 | Normalización ∫ r² R₃₂² dr | 1 | 1 | ortonormalidad | 1.3e-14 | 1e-9 | OK |
| 6 | Radio más probable del 1s | 1.00000001 | 1 | a₀ (radio de Bohr) | 1.3e-8 | 0.000001 | OK |
| 7 | Configuración del cromo termina en 3d⁵ 4s¹ (1 = sí) | 1 | 1 | NIST: [Ar] 3d⁵ 4s¹ | 0.0e+0 | 0 | OK |
| 7 | Configuración del cobre termina en 3d¹⁰ 4s¹ (1 = sí) | 1 | 1 | NIST: [Ar] 3d¹⁰ 4s¹ | 0.0e+0 | 0 | OK |
| 7 | Configuraciones de Z = 1 a 36 con exactamente Z electrones | 36 | 36 | conteo | 0.0e+0 | 0 | OK |
| 8 | Helio variacional: E(ζ) mínimo con ζ = 27/16 | -2.84765625 | -2.84765625 | −(27/16)² Ha | 0.0e+0 | 1e-9 | OK |
| 8 | Reglas de Slater: Z_eff del 2p del carbono | 3.25 | 3.25 | Slater (1930) | 0.0e+0 | 1e-12 | OK |
| 8 | Reglas de Slater: Z_eff del 2p del nitrógeno | 3.9 | 3.9 | Slater (1930) | 4.4e-16 | 1e-12 | OK |
| 9 | Una gaussiana para el hidrógeno: E mínima | -0.424413182 | -0.424413182 | −4/(3π) Ha | 5.6e-17 | 1e-9 | OK |
| 9 | Diez gaussianas en progresión geométrica (Rayleigh–Ritz) | -0.499961909 | -0.5 | energía exacta | 3.8e-5 | 0.0001 | OK |
| 9 | Oscilador anarmónico (λ = 0.01): E₀ ≈ ½ + ¾λ − (21/8)λ² | 0.507255273 | 0.5072375 | perturbaciones a 2.º orden | 1.8e-5 | 0.00003 | OK |
| 10 | H₂⁺ LCAO (ζ = 1): distancia de equilibrio | 2.49283042 a₀ | 2.4928 | Pauling (1928); textos de química cuántica | 1.2e-5 | 0.0002 (rel.) | OK |
| 10 | H₂⁺ LCAO (ζ = 1): energía mínima | -0.564830992 Ha | -0.56483 | LCAO clásica | 9.9e-7 | 0.00002 | OK |
| 10 | H₂⁺ con ζ optimizado (Finkelstein–Horowitz): energía | -0.586506502 Ha | -0.58651 | Finkelstein y Horowitz (1928) | 3.5e-6 | 0.00002 | OK |
| 11 | Benceno: nivel más bajo α + 2β (β = −1) | -2 | -2 | Hückel (1931) | 4.4e-16 | 1e-10 | OK |
| 11 | Borazina (α = ±1, β = −1): brecha HOMO–LUMO = 2√2 | 2.82842712 | 2.82842712 | ±√(Δ² + |β|²|1 + e^{±2πi/3}|²) | 1.3e-15 | 1e-10 | OK |
| 11 | Cadena de 10 sitios: nivel más bajo = α + 2β cos(π/11) | -1.91898595 | -1.91898595 | solución analítica | 8.9e-16 | 1e-10 | OK |
| 12 | Parámetro de red de h-BN: a = √3·d (d = 1.446 Å) | 2.50454547 Å | 2.504 | experimento (2.504 Å) | 2.2e-4 | 0.001 (rel.) | OK |
| 12 | Red recíproca: a₁·b₁ = 2π | 6.28318531 | 6.28318531 | definición | 0.0e+0 | 1e-12 | OK |
| 13 | Anillo de 12 sitios: autovalores = −2t cos(2πm/N) | -2 | -2 | teorema de Bloch | 0.0e+0 | 1e-10 | OK |
| 13 | Cadena diatómica (t₁ = t₂): brecha en k = π/a = |ε_A − ε_B| | 1.2 | 1.2 | fórmula cerrada | 0.0e+0 | 1e-12 | OK |
| 14 | Grafeno: |f(K)| = 0 (cono de Dirac) | 4.440892e-16 | 0 | simetría | 4.4e-16 | 1e-12 | OK |
| 14 | h-BN: brecha en K = ε_B − ε_N | 4.6 eV | 4.6 | modelo π de dos sitios | 0.0e+0 | 1e-12 | OK |
| 14 | Grafeno: velocidad de Fermi numérica = 3td/(2ħ) | 8.736997e+5 m/s | 8.737307e+5 | desarrollo cerca de K | 3.6e-5 | 0.002 (rel.) | OK |
| 14 | Copo triangular zigzag de orden 4: modos de energía cero | 3 | 3 | teorema de Lieb |N_A − N_B| | 0.0e+0 | 0 | OK |
| 14 | Nanocinta zigzag de grafeno: estados de borde en k = π | 2 | 2 | Fujita et al. (1996) | 0.0e+0 | 0 | OK |
| 16 | Energía de Hartree de la densidad 1s del hidrógeno | 0.3125 Ha | 0.3125 | 5/16 Ha (analítica) | 4.1e-11 | 1e-7 | OK |
| 15 | Helio Hartree–Fock: energía total | -2.86168 Ha | -2.86168 | Clementi y Roetti (1974) | 4.4e-9 | 0.000002 | OK |
| 15 | Helio Hartree–Fock: autovalor 1s | -0.917955609 Ha | -0.917956 | Clementi y Roetti (1974) | 3.9e-7 | 0.000002 | OK |
| 15 | Hidrógeno con Hartree–Fock: sin autointeracción | -0.5 Ha | -0.5 | exacto | 1.6e-11 | 1e-8 | OK |
| 17 | LDA sin espín, H: energía total | -0.445670518 Ha | -0.445671 | NIST (Kotochigova et al. 1997) | 4.8e-7 | 0.000002 | OK |
| 17 | LDA sin espín, He: energía total | -2.83483562 Ha | -2.834836 | NIST (Kotochigova et al. 1997) | 3.8e-7 | 0.000002 | OK |
| 17 | LDA sin espín, Be: energía total | -14.4472095 Ha | -14.447209 | NIST (Kotochigova et al. 1997) | 4.7e-7 | 0.000002 | OK |
| 17 | LDA sin espín, C: energía total | -37.4257485 Ha | -37.425749 | NIST (Kotochigova et al. 1997) | 4.6e-7 | 0.000002 | OK |
| 17 | LDA sin espín, N: energía total | -54.0250161 Ha | -54.025016 | NIST (Kotochigova et al. 1997) | 1.4e-7 | 0.000002 | OK |
| 17 | LDA sin espín, O: energía total | -74.4730768 Ha | -74.473077 | NIST (Kotochigova et al. 1997) | 2.0e-7 | 0.000002 | OK |
| 17 | LDA sin espín, Ne: energía total | -128.233481 Ha | -128.233481 | NIST (Kotochigova et al. 1997) | 2.7e-7 | 0.000002 | OK |
| 17 | LDA sin espín, Ar: energía total | -525.946195 Ha | -525.946195 | NIST (Kotochigova et al. 1997) | 7.4e-8 | 0.000002 | OK |
| 17 | LDA del nitrógeno: autovalor 2p | -0.266296774 Ha | -0.266297 | NIST | 2.3e-7 | 0.000002 | OK |
| 17 | LDA del neón: autovalor 1s | -30.3058549 Ha | -30.305855 | NIST | 9.0e-8 | 0.000003 | OK |
| 17 | Virial con intercambio LDA (neón, funcional homogéneo): E + T_s = 0 | -2.699392e-6 | 0 | virial (2T + V = 0) | 2.7e-6 | 0.00002 | OK |
| 15 | Virial en Hartree–Fock del helio: E + T = 0 | -7.637565e-8 | 0 | virial (2T + V = 0) | 7.6e-8 | 0.000002 | OK |
| 17 | Intercambio del gas homogéneo: ε_x·r_s | -0.458165293 | -0.4581653 | −(3/4)(9/4π²)^{1/3} Ha | 6.7e-9 | 1e-7 | OK |
| 17 | Correlación LDA (VWN) del helio con su densidad LDA | -0.111466987 Ha | -0.1115 | valor de la literatura ≈ −0.112 Ha | 3.3e-5 | 0.002 | OK |
| 18 | Pseudopotencial de Kerker (N 2p, r_c = 1.5 a₀): conservación de la norma | 0 | 0 | condición de norma | 0.0e+0 | 1e-8 | OK |
| 18 | Pseudopotencial de Kerker (N 2p): autovalor del pseudoorbital sin nodos | -0.266299436 Ha | -0.2662968 | autovalor todo-electrón LDA | 2.6e-6 | 0.00002 | OK |
| 19 | Cuantil 97.5 % de la t de Student con 4 g.l. | 2.77644511 | 2.776445 | tablas | 1.1e-7 | 0.000001 | OK |
| 19 | Cuantil 97.5 % de la t de Student con 19 g.l. | 2.09302405 | 2.093024 | tablas | 5.4e-8 | 0.000001 | OK |
| 19 | Normal estándar: Φ(1.96) | 0.975002105 | 0.9750021 | tablas | 4.9e-9 | 1e-7 | OK |
| 20 | ln C(1000, 300) = N·s(x) − ½ ln(2πN x(1−x)) (Stirling refinada) | 607.271496 | 607.27181 | aproximación de Stirling con corrección | 3.1e-4 | 0.0005 | OK |
| 21 | Pico de Schottky en k_BT/Δ | 0.416778283 | 0.41678 | dos niveles | 4.1e-6 | 0.0001 (rel.) | OK |
| 21 | Einstein a alta T (T = 50 θ_E): C → 3Nk (Dulong–Petit) | 0.999966667 | 1 | equipartición | 3.3e-5 | 0.0001 | OK |
| 21 | Debye a baja T: C/(3Nk) = (4π⁴/5)(T/θ)³ | 7.792727e-5 | 7.792727e-5 | ley T³ | 1.7e-16 | 0.002 (rel.) | OK |
| 21 | Tres niveles: C por fluctuaciones = dU/dT numérica | 2.439793e-11 | 0 | Var(E) = k_BT² C | 2.4e-11 | 1e-7 | OK |
| 21 | Aceptación del intercambio B↔N (6.24 eV) a 5000 K | 5.123301e-7 | 5.100000e-7 | docs/INFORME_CIENTIFICO.md §2 | 4.6e-3 | 0.03 (rel.) | OK |
| 21 | Aceptación del intercambio B↔N a 20 000 K | 0.0267539221 | 0.027 | docs/INFORME_CIENTIFICO.md §2 | 9.1e-3 | 0.03 (rel.) | OK |
| 22 | Entropía estándar del H₂ a 298.15 K | 130.599906 J/(mol·K) | 130.68 | NIST-JANAF | 6.1e-4 | 0.002 (rel.) | OK |
| 22 | Langmuir: cobertura ½ cuando μ = ε | 0.5 | 0.5 | definición | 0.0e+0 | 1e-14 | OK |
| 23 | Ising cuadrado: T_c de Onsager | 2.26918531 | 2.269185 | 2/ln(1+√2) | 3.1e-7 | 0.000001 | OK |
| 23 | Ising cuadrado: energía por espín en T_c | -1.41421356 | -1.41421356 | Onsager (1944) | 4.0e-15 | 0.00001 | OK |
| 23 | Ising en el panal: T_c exacta | 1.51865144 | 1.518651 | tanh(J/kT_c) = 1/√3 | 4.4e-7 | 0.000001 | OK |
| 24 | Cadena de Markov de Metropolis → población de Boltzmann | 1.387779e-17 | 0 | balance detallado | 1.4e-17 | 1e-10 | OK |
| 24 | Metropolis en V = x²/2 con T = 0.7: ⟨x²⟩ = T | 0.700030843 | 0.7 | equipartición | 4.4e-5 | 0.03 (rel.) | OK |
| 25 | Ising 4×4 por Metropolis (T = 2): energía por espín | -1.75446614 | -1.75538029 | enumeración exacta de 2¹⁶ estados | 5.2e-4 | 0.004 (rel.) | OK |
| 26 | Intercambio de réplicas en un doble pozo: fracción en x > 0 | 0.50233082 | 0.5 | simetría del paisaje | 2.3e-3 | 0.03 | OK |
| 27 | Reajuste de Mazzoni: ε_NN | -185.286445 eV | -185.29 | Tesis 2019, Tabla 5.8 | 3.6e-3 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: ε_NB | -128.162567 eV | -128.1626 | Tesis 2019, Tabla 5.8 | 3.3e-5 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: ε_BB | -67.9147783 eV | -67.9148 | Tesis 2019, Tabla 5.8 | 2.2e-5 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: ε_CC | -107.321324 eV | -107.32 | Tesis 2019, Tabla 5.8 | 1.3e-3 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: ε_CN | -147.020532 eV | -147.02 | Tesis 2019, Tabla 5.8 | 5.3e-4 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: ε_CB | -88.0090733 eV | -88.01 | Tesis 2019, Tabla 5.8 | 9.3e-4 | 0.006 | OK |
| 27 | Reajuste de Mazzoni: RMS por celda | 0.629706033 eV | 0.63 | docs/INFORME_CIENTIFICO.md §1 | 2.9e-4 | 0.0005 | OK |
| 27 | Reajuste de Mazzoni: R² | 0.999961339 | 0.99996 | docs/INFORME_CIENTIFICO.md §1 | 1.3e-6 | 0.000002 | OK |
| 27 | Reajuste de Mazzoni: RMS de validación cruzada | 0.903781654 eV | 0.904 | docs/INFORME_CIENTIFICO.md §1 | 2.2e-4 | 0.0005 | OK |
| 27 | Intercambio B↔N: 2(ε_NN + ε_BB) − 4ε_NB | 6.2408 eV | 6.24 | docs/INFORME_CIENTIFICO.md §2 | 8.0e-4 | 0.001 | OK |
| 27 | Energía de mezcla BN–C por par de enlaces mixtos | 0.4526 eV | 0.45 | docs/REVISION_ARTICULO.md §B | 2.6e-3 | 0.003 | OK |
| 27 | Sin la familia B₂C₄N₂ el ajuste no es identificable (1 = singular) | 1 | 1 | dependencia lineal de las composiciones | 0.0e+0 | 0 | OK |
| 28 | Energía de borde por H, reservorio de la tesis | -8.4586 eV | -8.4586 | −(ε_NB − ε_XN − ε_XB)/2 − ε_XX/2 (informe: −8.46) | 0.0e+0 | 0.000001 | OK |
| 28 | Energía de borde por H, gran canónico H₂ con Δμ_H = 0 | -0.9431 eV | -0.94 | docs/INFORME_CIENTIFICO.md §3.1 | 3.1e-3 | 0.004 | OK |
| 28 | Energía de borde por H, gran canónico H₂ con Δμ_H = −1.5 eV | 0.5569 eV | 0.56 | docs/INFORME_CIENTIFICO.md §3.1 | 3.1e-3 | 0.004 | OK |
| 28 | Ventana química (μ_BN = E(BN)): se abre para Δμ_H ≤ | -0.224 eV | -0.224 | docs/INFORME_CIENTIFICO.md §4.1 | 5.1e-15 | 0.001 | OK |
| 28 | Ventana química (μ_BN = 3ε_NB): se abre para Δμ_H ≤ | -0.596033333 eV | -0.596 | docs/INFORME_CIENTIFICO.md §4.1 | 3.3e-5 | 0.001 | OK |
| 28 | E_form de V_B + 3H en ambiente rico en N (red completa) | -1.0261 eV | -1.026 | docs/INFORME_CIENTIFICO.md §4.2 | 1.0e-4 | 0.001 | OK |
| 28 | E_form de V_N + 3H en ambiente rico en B (red completa) | -1.0563 eV | -1.056 | docs/INFORME_CIENTIFICO.md §4.2 | 3.0e-4 | 0.001 | OK |
| 28 | Lámina perfecta: E_form = 0 | 3.637979e-12 | 0 | definición de μ_BN = 3ε_NB | 3.6e-12 | 1e-8 | OK |
| 28 | E(fragmentado) − E(triángulo) = ΔN_H·e_H (25 vacancias) | -3.240075e-12 | 0 | identidad de la energía de borde | 3.2e-12 | 1e-7 | OK |
| 28 | E_form(triángulo n = 4, borde N) − 4·E_form(V_B + 3H), rico en N | 2.955858e-11 | 0 | E_form proporcional a N_H | 3.0e-11 | 1e-8 | OK |
| 28 | Fragmentar un triángulo de 25 vacancias (reservorio de la tesis) | -507.516 eV | -507 | docs/INFORME_CIENTIFICO.md §3.2 | 5.2e-1 | 1 | OK |
| 29 | Experimento del informe: H₂, Δμ_H = −1.5 eV, 5000 K, 60 000 pasos locales → mayor poro | 24 | 24 | docs/INFORME_CIENTIFICO.md §3.2 (triángulo 24 + 1) | 0.0e+0 | 1 | OK |
| 29 | Poro triangular de orden 6 con borde N: vacancias y H | 3.601800e+4 | 3.601800e+4 | n² vacancias, 3n enlaces N–H | 0.0e+0 | 0 | OK |
| 29 | ΔE local = recálculo completo (200 intercambios con C y vacancias) | 7.830181e-12 | 0 | coherencia del motor | 7.8e-12 | 1e-8 | OK |
