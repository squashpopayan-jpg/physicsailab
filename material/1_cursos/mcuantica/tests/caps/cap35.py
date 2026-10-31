# -*- coding: utf-8 -*-
# Capítulo 35: campo cuantizado y Jaynes–Cummings (referencia: exponencial de H en el espacio de Fock truncado)
hb35 = 1.054571817e-34; e035 = 8.8541878128e-12; a035 = 5.29177210903e-11; qe35 = 1.602176634e-19; c35 = 2.99792458e8
def _coh(nbar, N): return np.array([math.exp(-nbar/2)*nbar**(k/2)/math.sqrt(math.factorial(k)) for k in range(N)])
def _jc(c, Delta, g, t):
    N = len(c); a = np.diag(np.sqrt(np.arange(1, N)), 1); sp_ = np.array([[0, 1], [0, 0]], float); sz_ = np.diag([1.0, -1.0])
    H = 0.5*Delta*np.kron(sz_, np.eye(N))+g*(np.kron(sp_, a)+np.kron(sp_.T, a.T)); psi = linalg.expm(-1j*H*t)@np.kron([1.0, 0.0], c); M = psi.reshape(2, N); ra = M@M.conj().T
    w_ = np.linalg.eigvalsh(ra); w_ = w_[w_ > 1e-14]; return dict(Pe=ra[0, 0].real, reg=abs(ra[0, 1]), pur=np.trace(ra@ra).real, S=float(-(w_*np.log2(w_)).sum()))
# ---- Simulación 35.1 (n̄ = 25, resonancia)
c25 = _coh(25, 80); tr = 2*math.pi*5
chk(35, 'Sim: t_c', math.sqrt(2), '1.4142'); chk(35, 'Sim: t_r', tr, '31.42', 1e-3)
ts = np.linspace(29, 35, 121); pe = np.array([_jc(c25, 0, 1, t)['Pe'] for t in ts]); i = int(np.argmax(pe)); tm = ts[i]; pm = pe[i]
chk(35, 'Sim: tiempo del primer revival (exacto)', tm, '32.10', 5e-3); chk(35, 'Sim: P_e en el primer revival', pm, '0.78', 5e-3); chk(35, 'Sim: t_rev/t_r', tm/tr, '1.02', 5e-3)
chk(35, 'Sim: P_e(3/g)', _jc(c25, 0, 1, 3.0)['Pe'], '0.5057', 1e-3); chk(35, 'Sim: S(t_r/2)', _jc(c25, 0, 1, tr/2)['S'], '0.0724', 2e-3)
tt = np.linspace(1.5, 3.0, 31); Sm = max(_jc(c25, 0, 1, t)['S'] for t in tt); chk(35, 'Sim: entropía máxima ≈ 1 bit (gt ≈ 2)', Sm, '0.998', 5e-3)
pe2 = [_jc(c25, 0, 1, t)['Pe'] for t in np.linspace(60, 67, 141)]; chk(35, 'Sim: P_e en el segundo revival', max(pe2), '0.70', 1e-2); chk(35, 'Sim: tiempo del segundo revival', np.linspace(60, 67, 141)[int(np.argmax(pe2))], 63.5, 2e-2)
# ---- Simulación 35.2
chk(35, 'Sim: Ω₀ (resonancia)', 2.0, '2.0000'); chk(35, 'Sim: periodo (n = 0)', math.pi, '3.1416'); chk(35, 'Sim: Ω₃', 2*math.sqrt(4), '4.0'); chk(35, 'Sim: periodo (n = 3)', 2*math.pi/4, str(round(math.pi/2, 4)), 1e-3)
chk(35, 'Sim: Ω₀ (Δ = 3g)', math.sqrt(13), '3.6056'); chk(35, 'Sim: transferencia (Δ = 3g)', 4/13, '0.3077'); chk(35, 'Sim: θ (Δ = 3g)', 0.5*math.degrees(math.atan2(2, 3)), '16.85', 1e-3)
chk(35, 'Sim: P_e mínimo del vacío (numpy)', min(_jc(np.eye(1, 20)[0], 0, 1, t)['Pe'] for t in np.linspace(0, 4, 401)), '0.0', 1e-5, rel=False)
# ---- Simulación 35.3 (n̄ = 9, t = t_r/2)
c9 = _coh(9, 70); tr9 = 2*math.pi*3; r9 = _jc(c9, 0, 1, 0.5*tr9)
chk(35, 'Sim: pureza (n̄ = 9, t_r/2)', r9['pur'], '0.9506', 1e-3); chk(35, 'Sim: S (n̄ = 9, t_r/2)', r9['S'], '0.1705', 2e-3); chk(35, 'Sim: P_e (n̄ = 9, t_r/2)', r9['Pe'], '0.5022', 1e-3)
# ---- P1
w = 2*math.pi*51e9; E0 = math.sqrt(hb35*w/(2*e035*1e-6)); d = 1250*qe35*a035; g = d*E0/hb35
chk(35, 'P1: ω (10¹¹ s⁻¹)', w/1e11, '3.204'); chk(35, 'P1: ħω (10⁻²³ J)', hb35*w/1e-23, '3.379'); chk(35, 'P1: E₀² (10⁻⁶)', E0**2/1e-6, '1.908'); chk(35, 'P1: E₀ (mV/m)', E0*1e3, '1.381')
chk(35, 'P1: d (10⁻²⁶ C·m)', d/1e-26, '1.060'); chk(35, 'P1: g (10⁵ s⁻¹)', g/1e5, '1.388'); chk(35, 'P1: g/2π (kHz)', g/2/math.pi/1e3, '22.09'); chk(35, 'P1: 2g/2π (kHz)', 2*g/2/math.pi/1e3, '44.19'); chk(35, 'P1: π/2g (μs)', math.pi/(2*g)*1e6, '11.31'); chk(35, 'P1: π/g (μs)', math.pi/g*1e6, '22.63')
chk(35, 'P1: P_e(π/2g) por exponencial de matriz', _jc(np.eye(1, 20)[0], 0, g, math.pi/(2*g))['Pe'], '0.0', 1e-9, rel=False)
# ---- P2
chk(35, 'P2: Ω₀/g', math.sqrt(13), '3.606'); chk(35, 'P2: 4/13', 4/13, '0.3077'); chk(35, 'P2: periodo (μs)', 2*math.pi/(math.sqrt(13)*g)*1e6, '12.55'); chk(35, 'P2: 2π/Ω₀ (1/g)', 2*math.pi/math.sqrt(13), '1.743'); chk(35, 'P2: 2θ', math.degrees(math.atan2(2, 3)), '33.69'); chk(35, 'P2: θ', 0.5*math.degrees(math.atan2(2, 3)), '16.85'); chk(35, 'P2: sen²θ', math.sin(0.5*math.atan2(2, 3))**2, '0.084', 5e-3)
chk(35, 'P2: transferencia por exponencial de matriz (mín. de P_e)', 1-min(_jc(np.eye(1, 20)[0], 3, 1, t)['Pe'] for t in np.linspace(0, 6, 601)), '0.3077', 1e-3)
# ---- P3
for n, v in ((0, '2.0'), (1, '2.828'), (2, '3.464')): chk(35, f'P3: Ω_{n}', 2*math.sqrt(n+1), v, 1e-3)
# [H, N] = 0 numérico
Nn = 12; a_ = np.diag(np.sqrt(np.arange(1, Nn)), 1); sp_ = np.array([[0, 1], [0, 0]], float); sz_ = np.diag([1.0, -1.0]); H_ = 0.7*np.kron(sz_, np.eye(Nn))/2+0.3*np.kron(np.eye(2), a_.T@a_)+0.5*(np.kron(sp_, a_)+np.kron(sp_.T, a_.T))
N_ = np.kron(np.eye(2), a_.T@a_)+np.kron(sp_@sp_.T, np.eye(Nn)); cm = H_@N_-N_@H_; chk(35, 'P3: [H, N] (excepto la fila truncada)', float(np.max(np.abs(cm[:2*Nn-2, :2*Nn-2]))), '0.0', 1e-12, rel=False)
# ---- P4
chk(35, 'P4: Ω_n̄ / g', 2*math.sqrt(26), '10.2', 1e-2); chk(35, 'P4: t_c (μs)', math.sqrt(2)/g*1e6, '10.2', 5e-3); chk(35, 'P4: t_r (μs)', 2*math.pi*5/g*1e6, '226.3', 1e-3); chk(35, 'P4: t_r/t_c', math.sqrt(2)*math.pi*5, '22.2', 1e-3); chk(35, 'P4: t_rev/t_r', 32.10/tr, '1.022', 1e-3)
# ---- P5: Casimir
P_c = lambda d_: math.pi**2*hb35*c35/(240*d_**4)
chk(35, 'P5: π²ħc/240 (10⁻²⁷ J·m)', math.pi**2*hb35*c35/240/1e-27, '1.3001'); chk(35, 'P5: P (1 μm) (mPa)', P_c(1e-6)*1e3, '1.300'); chk(35, 'P5: P (100 nm) (Pa)', P_c(1e-7), '13.0'); chk(35, 'P5: P (10 nm) (10⁵ Pa)', P_c(1e-8)/1e5, '1.30'); chk(35, 'P5: P (10 nm) (atm)', P_c(1e-8)/101325, '1.28', 5e-3)
chk(35, 'P5: ζ(−3)', float(mp.zeta(-3)), str(round(1/120, 6)), 1e-5); chk(35, 'P5: −ζ(−3)·π²/6 = −π²/720', -float(mp.zeta(-3))*math.pi**2/6, str(round(-math.pi**2/720, 5)), 1e-4)
# ---- P6
r3 = _jc(c25, 0, 1, 3.0); chk(35, 'P6: |ρ_eg|(3/g)', r3['reg'], '0.150', 5e-3); chk(35, 'P6: pureza (3/g)', r3['pur'], '0.5451', 1e-3); chk(35, 'P6: S(3/g)', r3['S'], '0.934', 1e-3); chk(35, 'P6: autovalor mayor (3/g)', 0.5*(1+math.sqrt(2*r3['pur']-1)), '0.650', 1e-3)
chk(35, 'P6: S desde los autovalores', -0.65*math.log2(0.65)-0.35*math.log2(0.35), '0.934', 1e-3)
r6 = _jc(c25, 0, 1, math.pi*5); chk(35, 'P6: t_r/2', math.pi*5, '15.71', 1e-3); chk(35, 'P6: P_e (t_r/2)', r6['Pe'], '0.5000', 1e-3); chk(35, 'P6: pureza (t_r/2)', r6['pur'], '0.9827', 1e-4); chk(35, 'P6: S (t_r/2)', r6['S'], '0.0724', 2e-3); chk(35, 'P6: separación del gato 2√2 α (α = 5)', 2*math.sqrt(2)*5, '14.14', 1e-3)
