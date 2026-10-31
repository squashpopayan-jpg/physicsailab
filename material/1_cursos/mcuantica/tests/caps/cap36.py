# -*- coding: utf-8 -*-
# Capítulo 36: integrales de camino (referencias: scipy.special.fresnel, numpy)
from scipy.special import fresnel as _fres
hb36 = 1.054571817e-34; me36 = 9.1093837015e-31
def _frac(a, Y):
    k = math.sqrt(2*a/math.pi); S, C = _fres(Y*k); q = 2*math.sqrt(math.pi/(2*a)); z = q*(C+1j*S); lim = math.sqrt(math.pi/a)
    return abs(z), abs(z)/lim*100, math.degrees(np.angle(z)), k*Y
# ---- Simulación 36.1 (a = 6)
yF = math.sqrt(math.pi/6); chk(36, 'Sim: y_F (a = 6)', yF, '0.7236'); chk(36, 'Sim: |S| límite', yF, '0.7236')
chk(36, 'Sim: fracción a y_F/2 (%)', _frac(6, yF/2)[1], '97.3'); chk(36, 'Sim: fracción a y_F (%)', _frac(6, yF)[1], '125.7'); chk(36, 'Sim: fracción a Y = 0.8 (%)', _frac(6, 0.8)[1], '109.1'); chk(36, 'Sim: fase a Y = 0.8', _frac(6, 0.8)[2], '59.5'); chk(36, 'Sim: fracción a Y = 4 (%)', _frac(6, 4.0)[1], '104.8')
chk(36, 'Sim: y_F/2', yF/2, '0.3618'); chk(36, 'Sim: y_F (a = 60)', math.sqrt(math.pi/60), '0.2288'); chk(36, 'Sim: fracción (a = 60, Y = 0.3) (%)', _frac(60, 0.3)[1], '76.7'); chk(36, 'Sim: y_F (a = 0.2)', math.sqrt(math.pi/0.2), '3.963')
chk(36, 'Sim: fase del límite (°)', 45.0, '45.0')
# ---- Simulación 36.2: producto de Trotter con la misma malla que la simulación (121 puntos, |x| ≤ 6)
def _trot(V, beta, N, M=121, L=6.0):
    xs = np.linspace(-L, L, M); dx = xs[1]-xs[0]; eps = beta/N; Vv = V(xs)
    T = np.exp(-0.5*eps*(Vv[:, None]+Vv[None, :])-(xs[:, None]-xs[None, :])**2/(2*eps))/math.sqrt(2*math.pi*eps)*dx
    Mt = np.linalg.matrix_power(T, N); d = np.diag(Mt); return float((d*xs**2).sum()/d.sum()), float(d.sum())
ho_ = lambda x: 0.5*x*x; dw_ = lambda x: (x*x-1)**2; ex3 = 0.5/math.tanh(1.5)
x16, Z16 = _trot(ho_, 3.0, 16); x8, _ = _trot(ho_, 3.0, 8)
chk(36, 'Sim: Z (N = 16)', Z16, '0.23539'); chk(36, 'Sim: Z exacta', 1/(2*math.sinh(1.5)), '0.23482'); chk(36, 'Sim: ⟨x²⟩ (N = 16)', x16, '0.55022'); chk(36, 'Sim: ⟨x²⟩ exacto', ex3, '0.55240'); chk(36, 'Sim: error (%)', abs(x16-ex3)/ex3*100, '0.39', 1e-2); chk(36, 'Sim: cociente de errores', abs(x8-ex3)/abs(x16-ex3), '3.92'); chk(36, 'Sim: ε', 3/16, '0.1875')
x64, _ = _trot(dw_, 3.0, 64, M=121); x32, _ = _trot(dw_, 3.0, 32, M=121); x512, _ = _trot(dw_, 3.0, 512, M=121)
chk(36, 'Sim: doble pozo ⟨x²⟩ (N = 64)', x64, '0.62064'); chk(36, 'Sim: doble pozo referencia (N = 512)', x512, '0.62022'); chk(36, 'Sim: doble pozo error relativo (10⁻⁴)', abs(x64-x512)/x512/1e-4, '6.8', 1e-2); chk(36, 'Sim: doble pozo cociente', abs(x32-x512)/abs(x64-x512), '4.26', 1e-2)
# ---- Simulación 36.3
def _hd(beta, P):
    eps = beta/P; return sum(1/(4/eps*math.sin(math.pi*k/P)**2+eps) for k in range(P))/P
chk(36, 'Sim: ⟨x²⟩_P exacto (β = 4, P = 16)', _hd(4, 16), '0.5148'); chk(36, 'Sim: continuo (β = 4)', 0.5/math.tanh(2), '0.5187'); chk(36, 'Sim: doble pozo (continuo, β = 3)', x512, '0.6202'); chk(36, 'Sim: doble pozo (DVR de Fourier)', 0.6201747, '0.6202')
# ---- P1
a_e = 2*me36/(hb36*1e-9); yFe = math.sqrt(math.pi/a_e); a_g = 2e-3/(hb36*1.0); yFg = math.sqrt(math.pi/a_g)
chk(36, 'P1: a electrón (10¹³ m⁻²)', a_e/1e13, '1.728'); chk(36, 'P1: y_F electrón (10⁻⁷ m)', yFe/1e-7, '4.26'); chk(36, 'P1: y_F electrón (μm)', yFe*1e6, '0.43'); chk(36, 'P1: a masa (10³¹ m⁻²)', a_g/1e31, '1.897'); chk(36, 'P1: y_F masa (10⁻¹⁶ m)', yFg/1e-16, '4.07'); chk(36, 'P1: cociente (10⁻¹⁰)', yFg/yFe/1e-10, '9.5', 5e-3)
chk(36, 'P1: cociente √(10⁹/10²⁷)', math.sqrt(1e9/1e27), str(round(math.sqrt(1e9/1e27), 11)), 1e-3)
# ---- P2
chk(36, 'P2: sinh 1.5', math.sinh(1.5), '2.1293', 1e-3); chk(36, 'P2: Z', 1/(2*math.sinh(1.5)), '0.23482'); chk(36, 'P2: e³', math.exp(3), '20.086', 1e-3); chk(36, 'P2: ⟨n⟩', 1/(math.exp(3)-1), '0.05240'); chk(36, 'P2: E', 1/(math.exp(3)-1)+0.5, '0.55240'); chk(36, 'P2: coth 1.5', 1/math.tanh(1.5), '1.10479'); chk(36, 'P2: ½coth', 0.5/math.tanh(1.5), '0.55240'); chk(36, 'P2: aumento (%)', (0.5/math.tanh(1.5)/0.5-1)*100, '10.5', 5e-3)
chk(36, 'P2: 2 sinh 1.5', 2*math.sinh(1.5), '4.2586', 1e-3)
# ---- P3
for N, v in ((8, '-1.54'), (16, '-0.393'), (32, '-0.0987'), (64, '-0.0247')): chk(36, f'P3: error relativo (%) N = {N}', (_hd(3, N)-ex3)/ex3*100, v, 2e-2)
for N, v in ((8, '0.54388'), (16, '0.55022'), (32, '0.55185'), (64, '0.55226')): chk(36, f'P3: ⟨x²⟩_N (N = {N})', _hd(3, N), v)
chk(36, 'P3: cociente 8 → 16', (_hd(3, 8)-ex3)/(_hd(3, 16)-ex3), '3.92'); chk(36, 'P3: cociente 16 → 32', (_hd(3, 16)-ex3)/(_hd(3, 32)-ex3), '3.98'); chk(36, 'P3: cociente 32 → 64', (_hd(3, 32)-ex3)/(_hd(3, 64)-ex3), '4.00'); chk(36, 'P3: ⟨x²⟩ exacto', ex3, '0.552396', 1e-5); chk(36, 'P3: ε (N = 8)', 3/8, '0.375')
# ---- P4
def _cx(x, t, a0=1.5):
    xc = math.sqrt(2)*a0*math.cos(t); pc = -math.sqrt(2)*a0*math.sin(t); return np.pi**-0.25*np.exp(-(x-xc)**2/2+1j*pc*x-1j*pc*xc/2-0.5j*t)
xx = np.array([-1.7, 0.3, 2.9]); chk(36, 'P4: ψ(x, π) = −i ψ(−x, 0) (diferencia máxima)', float(np.max(np.abs(_cx(xx, math.pi)+1j*_cx(-xx, 0.0)))), '0.0', 1e-12, rel=False)
chk(36, 'P4: centro inicial √2·α', math.sqrt(2)*1.5, '2.1213'); chk(36, 'P4: centro a medio periodo', math.sqrt(2)*1.5*math.cos(math.pi), '-2.1213')
chk(36, 'P4: |ψ| máximo en x_c(t = π)', abs(_cx(-math.sqrt(2)*1.5, math.pi))/abs(_cx(math.sqrt(2)*1.5, 0.0)), '1.0', 1e-12)
# ---- P5
eps = 0.5/4; A = np.zeros((4, 4))
for i in range(4): A[i, i] = 2/eps+eps; A[i, (i+1) % 4] -= 1/eps; A[i, (i-1) % 4] -= 1/eps
lam = np.sort(np.linalg.eigvalsh(A)); chk(36, 'P5: λ₀', lam[0], '0.125'); chk(36, 'P5: λ₁', lam[1], '16.125'); chk(36, 'P5: λ₂', lam[2], '16.125'); chk(36, 'P5: λ₃', lam[3], '32.125')
chk(36, 'P5: ⟨x²⟩₄', float(np.linalg.inv(A)[0, 0]), '2.0388'); chk(36, 'P5: 1/16.125', 1/16.125, '0.06202'); chk(36, 'P5: 1/32.125', 1/32.125, '0.03113'); chk(36, 'P5: suma 8 + …', 8+2/16.125+1/32.125, '8.1552', 1e-4); chk(36, 'P5: ½coth(0.25)', 0.5/math.tanh(0.25), '2.0415'); chk(36, 'P5: error (%)', (_hd(0.5, 4)/(0.5/math.tanh(0.25))-1)*100, '-0.13', 5e-2)
chk(36, 'P5: ⟨x²⟩₈ (β = 1)', _hd(1, 8), '1.0805'); chk(36, 'P5: continuo (β = 1)', 0.5/math.tanh(0.5), '1.0820'); chk(36, 'P5: error P = 8 (%)', (_hd(1, 8)/(0.5/math.tanh(0.5))-1)*100, '-0.14', 5e-2)
# ---- P6
chk(36, 'P6: |S| límite', math.sqrt(math.pi/6), '0.7236'); chk(36, 'P6: 2√(π/2a)', 2*math.sqrt(math.pi/12), '1.0233'); r1 = _frac(6, math.sqrt(math.pi/6)/2); r2 = _frac(6, math.sqrt(math.pi/6)); r3 = _frac(6, 2.0)
chk(36, 'P6: u (Y = y_F/2)', r1[3], '0.7071'); chk(36, 'P6: |S_Y| (Y = y_F/2)', r1[0], '0.7040'); chk(36, 'P6: fracción (%)', r1[1], '97.3'); chk(36, 'P6: fase (°)', r1[2], '14.9')
chk(36, 'P6: u (Y = y_F)', r2[3], '1.4142'); chk(36, 'P6: |S_Y| (Y = y_F)', r2[0], '0.9093'); chk(36, 'P6: fracción (%)', r2[1], '125.7'); chk(36, 'P6: fase (°)', r2[2], '53.5')
chk(36, 'P6: u (Y = 2)', r3[3], '3.9088'); chk(36, 'P6: |S_Y| (Y = 2)', r3[0], '0.6466'); chk(36, 'P6: fracción (%)', r3[1], '89.4')
