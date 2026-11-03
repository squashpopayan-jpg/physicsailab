# Cap. 3: movimiento hiperbólico por integración numérica de la ecuación de movimiento (4-vector), gemelos por transformación de sucesos
g0 = C.g; yr = 365.25*86400
def hyp_ode(a, tau_end):
    # d(u^t)/dτ = (a/c) u^x ; d(u^x)/dτ = (a/c) u^t ; dt/dτ = u^t/c… u en unidades de c: u^t = γ, u^x = γβ ; dx/dτ = c u^x, dt/dτ = u^t
    def f(tau, y):
        ut, ux, t, x = y
        return [a/c*ux, a/c*ut, ut, c*ux]
    sol = integrate.solve_ivp(f, [0, tau_end], [1.0, 0.0, 0.0, 0.0], method='DOP853', rtol=1e-13, atol=1e-13)
    ut, ux, t, x = sol.y[:, -1]
    return dict(gamma=ut, beta=ux/ut, t=t, x=x)
ref['hyp'] = [dict(a=a, tau=tau, **hyp_ode(a, tau)) for (a, tau) in ((g0, yr), (g0, 0.5*yr), (3*g0, yr), (0.1*g0, 5*yr), (g0, 3*yr))]
# Gemelos: se transforma el suceso «giro» (x = d, t = d/β) y el suceso en la Tierra (x = 0, t = t_E) hasta que sean simultáneos en cada sistema
def twin_ref(d, b):
    g = 1/math.sqrt(1-b*b)
    tT = d/b                          # tiempo terrestre del giro (años, c = 1)
    def tprime(x, t, bb): return 1/math.sqrt(1-bb*bb)*(t - bb*x)
    tE_out = optimize.brentq(lambda tE: tprime(0, tE, +b) - tprime(d, tT, +b), 0, 10*tT)
    tE_in = optimize.brentq(lambda tE: tprime(0, tE, -b) - tprime(d, tT, -b), 0, 10*tT)
    # tiempo propio del viajero por integración numérica de dτ = √(1−β²) dt a lo largo de la línea de universo
    tau = integrate.quad(lambda t: math.sqrt(1-b*b), 0, 2*tT)[0]
    return dict(d=d, b=b, tE_out=tE_out, tE_in=tE_in, tau=tau, tE=2*tT)
ref['twins'] = [twin_ref(d, b) for (d, b) in ((4, 0.8), (10, 0.6), (4.2465, 0.95), (1, 0.1))]
# Viaje de reposo a reposo: integración numérica del movimiento hiperbólico por tramos (a = ±g)
def trip_ode(a, d):
    def f(tau, y):
        ut, ux, t, x = y
        return [a/c*ux, a/c*ut, ut, c*ux]
    ev = lambda tau, y: y[3] - d/2
    ev.terminal = True
    sol = integrate.solve_ivp(f, [0, 1e11], [1.0, 0.0, 0.0, 0.0], method='DOP853', rtol=1e-13, atol=1e-12, events=ev)
    tau_h = sol.t_events[0][0]; t_h = sol.y_events[0][0][2]; g_h = sol.y_events[0][0][0]
    return dict(tau=2*tau_h, t=2*t_h, gammaMax=g_h)
ref['trip'] = [dict(d=d, **trip_ode(g0, d)) for d in (4.2465*C.c*yr, 26000*C.c*yr, 1.0*C.c*yr, 100*C.c*yr)]
