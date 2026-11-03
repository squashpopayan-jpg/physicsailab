# Núcleo 30: simulador de circuitos, contra soluciones independientes (NumPy/SciPy).
VT = 0.025852

# 1) Redes resistivas: sistema lineal resuelto con numpy (leyes de Kirchhoff)
#    Puente de Wheatstone desequilibrado con fuente de 9 V (R int. 0.001): R1=1k,R2=2k,R3=3k,R4=4k,R5=1.5k (puente)
def bridge(v, R1, R2, R3, R4, R5, rs=0.001):
    # nodos: A (fuente), B (R1-R2), C (R3-R4); R1:A-B, R2:B-0, R3:A-C, R4:C-0, R5:B-C
    g = lambda r: 1.0/r
    G = np.array([[g(R1)+g(R2)+g(R5), -g(R5)], [-g(R5), g(R3)+g(R4)+g(R5)]])
    # nodo A fijo por la fuente: VA = v - rs*I ; resolvemos con A como incógnita
    # incógnitas VA, VB, VC
    M = np.array([[1/rs + g(R1)+g(R3), -g(R1), -g(R3)],
                  [-g(R1), g(R1)+g(R2)+g(R5), -g(R5)],
                  [-g(R3), -g(R5), g(R3)+g(R4)+g(R5)]])
    b = np.array([v/rs, 0, 0])
    return np.linalg.solve(M, b).tolist()
ref['bridge'] = dict(v=9, R=[1000, 2000, 3000, 4000, 1500], sol=bridge(9, 1000, 2000, 3000, 4000, 1500))

# 2) Diodo + resistencia: i = Is(exp(vd/(n VT))-1), vd = V - i R ; raíz con brentq
def diode_circ(V, R, Is, n, Rs=0.0):
    f = lambda i: V - i*(R+Rs) - n*VT*math.log(i/Is + 1)
    i = optimize.brentq(f, 1e-18, V/(R+Rs), xtol=1e-18, rtol=1e-14)
    return i
ref['diode'] = []
for (V, R, Is, n, Rs) in ((5, 220, 2.52e-9, 1.752, 0.57), (5, 1000, 2.55e-9, 1.75, 0.04), (3.3, 150, 1.2e-20, 1.8, 6.0), (9, 470, 2.52e-9, 1.752, 0.0), (12, 100, 2.55e-9, 1.75, 0.04)):
    ref['diode'].append(dict(V=V, R=R, Is=Is, n=n, Rs=Rs, i=diode_circ(V, R, Is, n, Rs)))

# 3) LED de color con rs: Is calculada para Vf a 20 mA
def isfor(vf, i, n): return i/(math.exp(vf/(n*VT))-1)
ref['led'] = []
for (name, vf, n, rs) in (('rojo', 1.95, 1.8, 6), ('verde', 2.1, 1.9, 6), ('azul', 3.0, 2.4, 8), ('blanco', 3.1, 2.5, 8)):
    Is = isfor(vf, 0.02, n)
    for (V, R) in ((5, 220), (3.3, 150), (5, 100)):
        if V - vf <= 0.2: continue
        ref['led'].append(dict(name=name, V=V, R=R, i=diode_circ(V, R, Is, n, rs)))

# 4) Zener 5.1 V alimentado a 9 V con 330 Ω y carga: i = Ibv exp(-(v+Vz)/(2 VT)) (inversa)
def zener(V, R, Vz, Ibv, RL):
    # nodo v (cátodo): (V - v)/R = v/RL + Ibv*exp((v - Vz)/(2 VT))
    f = lambda v: (V-v)/R - v/RL - Ibv*math.exp((v-Vz)/(2*VT))
    v = optimize.brentq(f, 0.0, V, xtol=1e-15, rtol=1e-14)
    return v
ref['zener'] = [dict(V=V, R=R, Vz=5.1, Ibv=0.005, RL=RL, v=zener(V, R, 5.1, 0.005, RL)) for (V, R, RL) in ((9, 330, 1000), (9, 330, 100), (12, 470, 2200), (6, 330, 1e6))]

# 5) BJT NPN (Ebers-Moll): VCC - RC - colector ; base por RB desde Vin ; fsolve independiente
def bjt(Vcc, Vin, RB, RC, Is, bf, br):
    ex = lambda x: math.exp(min(x, 700))
    def currents(vb, vc):
        ibe = Is*(ex(vb/VT)-1); ibc = Is*(ex((vb-vc)/VT)-1)
        return ibe - ibc - ibc/br, ibe/bf + ibc/br
    def vc_of(vb):   # KCL del colector, monótona en vc
        f = lambda vc: (Vcc-vc)/RC - currents(vb, vc)[0]
        return optimize.brentq(f, -2.0, max(Vcc, 0)+2.0, xtol=1e-15, rtol=1e-15)
    def g(vb):       # KCL de la base, monótona en vb
        return (Vin-vb)/RB - currents(vb, vc_of(vb))[1]
    vb = optimize.brentq(g, -1.0, max(Vin, 1.0)+1.0, xtol=1e-15, rtol=1e-15)
    vc = vc_of(vb)
    return dict(vc=vc, vb=vb, ic=(Vcc-vc)/RC)
ref['bjt'] = []
for (Vcc, Vin, RB, RC) in ((5, 5, 10000, 1000), (5, 0, 10000, 1000), (9, 3.3, 4700, 470), (5, 1.5, 100000, 1000), (12, 5, 1000, 100)):
    r = bjt(Vcc, Vin, RB, RC, 1.4e-14, 200, 3)
    r.update(Vcc=Vcc, Vin=Vin, RB=RB, RC=RC); ref['bjt'].append(r)

# 6) Transitorio RC (analítico) y RLC serie (solve_ivp DOP853)
ref['rc'] = dict(V=5, R=10000, C=100e-6, ts=[0.1, 0.5, 1.0, 2.0, 3.0, 5.0], v=[5*(1-math.exp(-t/1.0)) for t in (0.1, 0.5, 1.0, 2.0, 3.0, 5.0)])
def rlc(V, R, L, Cc, tlist):
    def f(t, y):
        q, i = y
        return [i, (V - R*i - q/Cc)/L]
    s = integrate.solve_ivp(f, (0, max(tlist)), [0, 0], method='DOP853', t_eval=tlist, rtol=1e-12, atol=1e-14)
    return [(y/Cc) for y in s.y[0]]
tl = [0.2e-3*k for k in range(1, 11)]
ref['rlc'] = dict(V=5, R=20, L=10e-3, C=10e-6, ts=tl, vc=rlc(5, 20, 10e-3, 10e-6, tl))

# 7) Rectificador de media onda con diodo y filtro RC (referencia: solve_ivp con raíz del diodo)
def rect(Vp, f, R, Cc, Is, n, t_end, tsamp):
    # vc' = (i_load_src - vc/R)/C ; la fuente (ideal) alimenta C por el diodo: i = Is(exp((vs-vc)/(nVT))-1)
    def fcn(t, y):
        vs = Vp*math.sin(2*math.pi*f*t)
        vd = vs - y[0]
        i = Is*(math.exp(min(vd/(n*VT), 60))-1)
        return [(i - y[0]/R)/Cc]
    s = integrate.solve_ivp(fcn, (0, t_end), [0.0], method='Radau', t_eval=tsamp, rtol=1e-9, atol=1e-12, max_step=1e-4)
    return s.y[0].tolist()
ts = [0.05, 0.08, 0.1, 0.12]
ref['rect'] = dict(Vp=5, f=50, R=1000, C=100e-6, Is=2.55e-9, n=1.75, ts=ts, vc=rect(5, 50, 1000, 100e-6, 2.55e-9, 1.75, 0.12, ts))

# 8) MOSFET nivel 1 como interruptor de carga: VDD - R - drenador, Vg dado
def mos(Vdd, Rd, Vg, vth, k, lam):
    def ids(vds):
        ov = Vg - vth
        if ov <= 0: return 0.0
        if vds < ov: return k*(ov*vds - vds*vds/2)*(1+lam*vds)
        return 0.5*k*ov*ov*(1+lam*vds)
    f = lambda vds: (Vdd - vds)/Rd - ids(vds)
    return optimize.brentq(f, 0, Vdd, xtol=1e-15, rtol=1e-14)
ref['mos'] = [dict(Vdd=Vdd, Rd=Rd, Vg=Vg, vth=vth, k=k, lam=lam, vds=mos(Vdd, Rd, Vg, vth, k, lam)) for (Vdd, Rd, Vg, vth, k, lam) in ((12, 10, 5, 1.7, 12, 0.01), (12, 10, 1.9, 1.7, 12, 0.01), (5, 100, 3.3, 2.1, 0.35, 0.01), (9, 1000, 2.5, 2.1, 0.35, 0.01))]
