"""ayuda.py — Funciones de apoyo para los programas del curso (estadística y modelo nulo)."""
import sys
import numpy as np
import motor

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def serie_y_contexto(nombre):
    """M1 usa M5 como contexto (más historia para la EMA50 de H4); M5 y M15 usan su propia historia."""
    S = motor.cargar(nombre)
    return S, (motor.cargar('m5') if nombre == 'm1' else None)


RANGO_HORA = [5.3, 6.64, 5.04, 3.96, 3.25, 4.66, 4.88, 4.68, 4.72, 4.34, 4.06, 4.48, 5.77, 7.38, 7.65, 6.62, 5.26, 4.58, 4.53, 4.21, 3.47, 4.24, 4.15, 4.53]


def mundo(semilla=1, dias=60, sigma=3.1, vol_vol=0.35, persist=0.995, salto_p=0.002, salto_k=4.0, tendencia=0.0, reversion=0.0, spread=0.27, bm=5):
    """Mercado sintético de oro (velas M5). Con tendencia=0 y reversion=0 el precio es una martingala: no hay ventaja posible.
    Los extremos de cada vela salen de un puente browniano entre apertura y cierre (distribución exacta del máximo y el mínimo)."""
    rng = np.random.default_rng(semilla)
    por_dia = 1440 // bm
    n = dias * por_dia
    media_rango = np.mean(RANGO_HORA)
    t0 = int(np.datetime64('2026-01-05T00:00').astype('datetime64[m]').astype(np.int64))
    dias_ok = []
    d = t0 // 1440
    while len(dias_ok) < dias:
        if (d + 3) % 7 < 5:
            dias_ok.append(d)
        d += 1
    t = np.concatenate([d * 1440 + np.arange(por_dia) * bm for d in dias_ok]).astype(np.float64)
    hora = ((t % 1440) // 60).astype(int)
    sd_v = vol_vol * np.sqrt(1 - persist ** 2)
    x = np.zeros(n); e = rng.normal(size=n)
    for i in range(1, n):
        x[i] = persist * x[i - 1] + sd_v * e[i]
    sig = sigma * (np.array(RANGO_HORA)[hora] / media_rango) * np.exp(x - vol_vol ** 2 / 2)
    sig = np.where(rng.random(n) < salto_p, sig * salto_k, sig)
    z = rng.normal(size=n)
    o = np.zeros(n); c = np.zeros(n)
    p = 4000.0; m = 0.0; ancla = p
    persist_t = 0.98
    for i in range(n):
        if tendencia > 0:
            m = persist_t * m + np.sqrt(1 - persist_t ** 2) * tendencia * sig[i] * rng.normal()
        drift = m - (reversion * (p - ancla) / 48 if reversion > 0 else 0)
        o[i] = p
        p = p + drift + sig[i] * z[i]
        ancla += (p - ancla) / 48
        c[i] = p
    u = rng.random(n); v = rng.random(n)
    mx = 0.5 * (o + c + np.sqrt((c - o) ** 2 - 2 * sig ** 2 * np.log(1 - u)))
    mn = 0.5 * (o + c - np.sqrt((c - o) ** 2 - 2 * sig ** 2 * np.log(1 - v)))
    o, c, mx, mn = [np.round(a, 2) for a in (o, c, mx, mn)]
    mx = np.maximum(mx, np.maximum(o, c)); mn = np.minimum(mn, np.minimum(o, c))
    return motor.Serie(t, o, mx, mn, c, np.full(n, spread), bm, 'sintetico')


def R_de(ops):
    return np.array([t['R'] for t in ops], dtype=float)


def ic(R, z=1.96):
    """Media, error estándar, intervalo aproximado del 95 % y t de Student para una lista de R."""
    n = len(R)
    if n < 2:
        return dict(n=n, media=float('nan'), ee=float('nan'), lo=float('nan'), hi=float('nan'), t=float('nan'))
    m = R.mean(); ee = R.std(ddof=1) / np.sqrt(n)
    return dict(n=n, media=m, ee=ee, lo=m - z * ee, hi=m + z * ee, t=m / ee)


def linea(nombre, ops):
    r = motor.resumen(ops)
    if r['n'] == 0:
        return '%-34s sin operaciones' % nombre
    R = R_de(ops); c = ic(R)
    return '%-34s n=%4d  aciertos %4.1f %%  R medio %+.3f  IC95 [%+.3f, %+.3f]  t=%+.2f  USD %+8.0f  PF %.2f' % (
        nombre, r['n'], 100 * r['aciertos'], c['media'], c['lo'], c['hi'], c['t'], r['usd'], r['pf'])


def nulo(S, ctx, P, n_rep=200, semilla=1):
    """Modelo nulo: mismas ventana, sesgo, salidas y frecuencia de operaciones, pero con la hora de entrada al azar.
    Devuelve el arreglo de R medios de las réplicas."""
    X = motor.contexto(S, ctx)
    ci, cs, ca = motor.escanear(S, X, P)
    ui, us, ua = motor.escanear_sesgo(S, X, P)
    p = len(ci) / max(1, len(ui))
    rng = np.random.default_rng(semilla)
    out = []
    for _ in range(n_rep):
        m = rng.random(len(ui)) < p
        ops = motor.correr(S, P, ctx, (ui[m], us[m], ua[m]))
        if ops:
            out.append(R_de(ops).mean())
    return np.array(out)
