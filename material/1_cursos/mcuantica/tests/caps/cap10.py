# -*- coding: utf-8 -*-
# Capítulo 10: estados coherentes, comprimidos y Wigner
from scipy import stats as st
# laser
E = hc/632.8; Ej = E*e; flux = 1e-3/Ej; n_ = flux*1e-9
chk(10, 'Ej./P2: energía del fotón (eV)', E, '1.9593'); chk(10, 'Ej./P2: energía del fotón (10⁻¹⁹ J)', Ej/1e-19, '3.1391'); chk(10, 'P2: flujo (10¹⁵ s⁻¹)', flux/1e15, '3.1856'); chk(10, 'Ej.: flujo (10¹⁵, 4 cifras)', flux/1e15, '3.186')
chk(10, 'Ej./P2: ⟨n⟩ en 1 ns (10⁶)', n_/1e6, '3.19'); chk(10, 'Ej./P2: Δn', math.sqrt(n_), '1785'); chk(10, 'P2: fluctuación relativa (10⁻⁴)', 1/math.sqrt(n_)/1e-4, '5.6'); chk(10, 'Ej.: fluctuación relativa (%)', 1/math.sqrt(n_)*100, '0.056')
# coherente
for k, v in ((8, '0.13176'), (9, '0.13176'), (10, '0.11858')): chk(10, f'P1: P({k}) con ⟨n⟩ = 9', st.poisson.pmf(k, 9), v)
chk(10, 'P1: P(9) = e⁻⁹ 9⁹/9!', math.exp(-9)*9**9/math.factorial(9), '0.13176'); chk(10, 'P1: P(8) = P(9) (empate)', st.poisson.pmf(8, 9)/st.poisson.pmf(9, 9), 1.0, 1e-12)
CMEV = 1.239841984e-4
chk(10, 'P1: ⟨E⟩ de HCl (cm⁻¹)', 9.5*2990.95, '28414'); chk(10, 'P1: ⟨E⟩ de HCl (eV)', 9.5*2990.95*CMEV, '3.52')
ellH = math.sqrt(hbar/(0.97959*C.u*2*math.pi*c*100*2990.95))*1e10
chk(10, 'P1: ℓ de HCl', ellH, '0.1073'); chk(10, 'P1: amplitud √2|α|ℓ (Å)', math.sqrt(2)*3*ellH, '0.4551'); chk(10, 'P1: fracción de r_e (%)', math.sqrt(2)*3*ellH/1.275*100, '36')
chk(10, 'Sim: ⟨n⟩ con |α| = 2.5', 2.5**2, '6.25'); chk(10, 'Sim: Δn/⟨n⟩', 1/2.5, '0.4'); chk(10, 'Sim: amplitud √2|α| (|α| = 2.5)', math.sqrt(2)*2.5, '3.54'); chk(10, 'Sim: Δx = 1/√2', 1/math.sqrt(2), '0.7071'); chk(10, 'Sim: amplitud con |α| = 5', math.sqrt(2)*5, '7.07'); chk(10, 'Sim: Δn/⟨n⟩ con |α| = 5', 1/5, '0.2')
chk(10, 'Sim: e^{−4}', math.exp(-4), '0.0183'); chk(10, 'Sim: e^{−9} (10⁻⁴)', math.exp(-9)/1e-4, '1.2'); chk(10, 'P5: e^{−1}', math.exp(-1), '0.368'); chk(10, 'P5: e^{−9} (10⁻⁴)', math.exp(-9)/1e-4, '1.234')
# P3/P4 con matrices truncadas
N = 90; a = np.diag(np.sqrt(np.arange(1, N)), 1); ad = a.T
def coh(al):
    n = np.arange(N); lg = np.array([math.lgamma(k+1) for k in n]); return np.exp(-abs(al)**2/2+n*np.log(complex(al))-0.5*lg)
al = 1.3+0.8j; v = coh(al)
chk(10, 'P3: ‖a|α⟩ − α|α⟩‖', np.linalg.norm(a@v-al*v), 0.0, 1e-12, rel=False)
chk(10, 'P3: ⟨n⟩ = |α|²', np.vdot(v, ad@a@v).real, abs(al)**2, 1e-10); n2 = (ad@a)@(ad@a); chk(10, 'P3: Δn² = |α|²', (np.vdot(v, n2@v)-np.vdot(v, ad@a@v)**2).real, abs(al)**2, 1e-9)
chk(10, 'P3: ⟨a†²a²⟩ = |α|⁴', np.vdot(v, ad@ad@a@a@v).real, abs(al)**4, 1e-9)
X = (a+ad)/math.sqrt(2); Pm = 1j*(ad-a)/math.sqrt(2)
ex = lambda O: np.vdot(v, O@v)
chk(10, 'P4: Δx² = 1/2', (ex(X@X)-ex(X)**2).real, 0.5, 1e-9); chk(10, 'P4: Δp² = 1/2', (ex(Pm@Pm)-ex(Pm)**2).real, 0.5, 1e-9); chk(10, 'P4: ⟨x⟩ = √2 Re α', ex(X).real, math.sqrt(2)*al.real, 1e-10); chk(10, 'P4: ⟨p⟩ = √2 Im α', ex(Pm).real, math.sqrt(2)*al.imag, 1e-10)
be = 0.4-1.1j; w_ = coh(be); chk(10, 'P5: |⟨α|β⟩|² = e^{−|α−β|²}', abs(np.vdot(v, w_))**2, math.exp(-abs(al-be)**2), 1e-9)
# comprimido
for dB, r in ((3, '0.3454'), (6, '0.6908'), (10, '1.1513')): chk(10, f'Ej.: r para {dB} dB', dB/(10*math.log10(math.e)*2), r)
chk(10, 'Ej.: e^{−2r} para 3 dB', math.exp(-2*3/8.685889638), '0.501'); chk(10, 'Ej.: e^{−2r} para 6 dB', math.exp(-2*6/8.685889638), '0.251'); chk(10, 'Ej.: e^{−2r} para 10 dB', math.exp(-2*10/8.685889638), '0.100')
chk(10, 'Ej./P6: Δx mínimo (r = 1)', math.exp(-1)/math.sqrt(2), '0.2601'); chk(10, 'Ej./P6: Δx máximo (r = 1)', math.exp(1)/math.sqrt(2), '1.9221'); chk(10, 'Ej./P6: sinh² 1', math.sinh(1)**2, '1.381'); chk(10, 'Ej./P6: 1/cosh 1', 1/math.cosh(1), '0.648'); chk(10, 'P6: dB con r = 1', 10*math.log10(math.e**2), '8.69')
chk(10, 'Sim: dB con r = 0.8', 8.685889638*0.8, '6.95'); chk(10, 'Sim: Δx mín (r = 0.8)', math.exp(-0.8)/math.sqrt(2), '0.318'); chk(10, 'Sim: Δx máx (r = 0.8)', math.exp(0.8)/math.sqrt(2), '1.574'); chk(10, 'Sim: radio clásico √2|α| (|α| = 2)', 2*math.sqrt(2), '2.83')
chk(10, 'Sim: Δx mín (r = 1.5)', math.exp(-1.5)/math.sqrt(2), '0.158'); chk(10, 'Sim: Δx máx (r = 1.5)', math.exp(1.5)/math.sqrt(2), '3.17'); chk(10, 'Sim: dB con r = 1.5', 8.685889638*1.5, '13.03', 1e-3) if False else chk(10, 'Sim: dB con r = 1.5 (13 dB)', 8.685889638*1.5, 13, 5e-3)
# vacío comprimido por matrices: P(0) y ⟨n⟩ y solo n par
from scipy.linalg import expm
S = expm(0.5*1.0*(a@a-ad@ad)); vac = np.zeros(N, complex); vac[0] = 1; sq = S@vac
chk(10, 'P6: ⟨n⟩ = sinh² r (matrices)', np.vdot(sq, ad@a@sq).real, math.sinh(1)**2, 1e-6); chk(10, 'P6: P(0) = 1/cosh r (matrices)', abs(sq[0])**2, 1/math.cosh(1), 1e-6); chk(10, 'P6: solo n par: Σ P(impar)', float(np.sum(abs(sq[1::2])**2)), 0.0, 1e-12, rel=False)
chk(10, 'P6: Δx² del estado comprimido = e^{−2r}/2 (matrices)', (np.vdot(sq, X@X@sq)-np.vdot(sq, X@sq)**2).real, math.exp(-2)/2, 1e-6)
# Wigner: cifras de la simulación
def W(n, x, p): rho = x*x+p*p; return ((-1)**n/math.pi)*math.exp(-rho)*special.eval_laguerre(n, 2*rho)
g = np.linspace(-9, 9, 1801); XX, PP = np.meshgrid(g, g); dA = (g[1]-g[0])**2; rho = XX**2+PP**2
for n, (mn, dl) in {1: ('-0.3183', '0.2131'), 2: ('-0.1318', '0.3645'), 5: ('-0.3183', '0.6917')}.items():
    Wn = ((-1)**n/np.pi)*np.exp(-rho)*special.eval_laguerre(n, 2*rho)
    chk(10, f'Sim: mín de W (Fock n = {n})', Wn.min(), mn); chk(10, f'Sim: volumen negativo δ (Fock n = {n})', (np.abs(Wn)-Wn).sum()*dA/2, dl); chk(10, f'Sim: ∬W = 1 (Fock n = {n})', Wn.sum()*dA, '1.0000')
chk(10, 'Sim: W(0,0) de n = 1 (= −1/π)', W(1, 0, 0), '-0.3183'); chk(10, 'Sim: W(0,0) de n = 2 (= +1/π)', W(2, 0, 0), '0.3183')
def Wc(al, par, x, p):
    a_ = math.sqrt(2)*al; w = np.exp(-p*p); gg = lambda u: np.exp(-u*u)
    return w*(gg(x-a_)+gg(x+a_)+par*2*gg(x)*np.cos(2*a_*p))/(2*math.pi*(1+par*math.exp(-2*al*al)))
for (al_, par), (mn, dl) in {(1.5, 1): ('-0.1898', '0.2402'), (1.5, -1): ('-0.3183', '0.2545'), (2.0, 1): (None, '0.2937'), (2.0, -1): (None, '0.2943')}.items():
    Wn = Wc(al_, par, XX, PP)
    if mn: chk(10, f'Sim: mín de W del gato (α = {al_}, par = {par})', Wn.min(), mn)
    chk(10, f'Sim: δ del gato (α = {al_}, par = {par})', (np.abs(Wn)-Wn).sum()*dA/2, dl)
chk(10, 'Sim: W(0,0) del gato par (= +1/π)', Wc(1.5, 1, 0, 0), '0.3183'); chk(10, 'Sim: W(0,0) del gato impar (= −1/π)', Wc(1.5, -1, 0, 0), '-0.3183')
