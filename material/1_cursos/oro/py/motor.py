"""motor.py — Motor de backtest de la estrategia XAUUSD (versión de referencia en Python).

Es la misma lógica que corre en las simulaciones del curso (JavaScript). Las pruebas
del curso comprueban que ambas producen exactamente las mismas operaciones.

Convenciones
------------
* Velas Bid en UTC. Un pip = 0.10 USD. Un lote = 100 onzas.
* La señal se evalúa al CIERRE de la barra i; la orden entra en la APERTURA de la barra i+1.
  Las compras se llenan al Ask (Bid + spread); las ventas, al Bid. Las ventas se cierran al Ask.
* Los indicadores usan solo velas completamente cerradas: EMA20 y ATR14 en M15, EMA50 en H4.
* Dentro de una barra, el orden de los extremos se supone O->L->H->C (barra alcista) u
  O->H->L->C (barra bajista); con pess=True el extremo adverso ocurre siempre primero.
"""
import base64, json, os, zlib
import numpy as np

PIP = 0.10
AQUI = os.path.dirname(os.path.abspath(__file__))

DEFECTO = dict(
    ws=8 * 60 + 57, we=13 * 60,                       # ventana de entradas (min. del día, hora de Madrid)
    w1m=30, w2m=120, modo='tocar', maxdist=8, dema=0, techo=20, tol=60, banda=15,
    dir='ambas', contra=False, rechazo=True,
    slk=0.8, slmin=45, slmax=60, tpk=1.4, tpmin=80, tpmax=100, compsp=True,
    sld=True, sldact=20, sldpips=20, be=True, beratio=0.42, bemargin=5,
    stag=True, stagmin=30, stagprog=15, stagflo=5,
    tstop=20 * 60, vier=21 * 60, pess=False,
    risk=125.0, comm=0.0, slip=0.0,
    balas=2, onedone=True, meta=180.0, maxloss=250.0, coolm=5,
)


def params(**kw):
    p = dict(DEFECTO)
    p.update(kw)
    return p


# --------------------------------------------------------------------------- datos
class Serie:
    def __init__(self, t, o, h, l, c, sp, bm, nombre=''):
        self.t, self.o, self.h, self.l, self.c, self.sp = t, o, h, l, c, sp
        self.bm, self.n, self.nombre = bm, len(t), nombre
        self._ctx = {}


def decodificar(d):
    """Decodifica el formato compacto de src/data/*.json (ver tools/build_data.py)."""
    n = d['n']
    buf = zlib.decompress(base64.b64decode(d['b64']), -15)
    off = 0

    def tomar(dt, size):
        nonlocal off
        a = np.frombuffer(buf, dtype=dt, count=n, offset=off)
        off += n * size
        return a.astype(np.int64)
    gap = tomar('<u2', 2); dO = tomar('<i4', 4); body = tomar('<i4', 4); up = tomar('<i4', 4); dn = tomar('<i4', 4); spr = tomar('<u2', 2)
    t = d['t0'] + np.cumsum(gap)
    c = d['c0'] + np.cumsum(dO + body)
    o = np.r_[d['c0'], c[:-1]] + dO
    h = np.maximum(o, c) + up
    l = np.minimum(o, c) - dn
    return Serie(t.astype(np.float64), o / 100.0, h / 100.0, l / 100.0, c / 100.0, spr / 100.0, d['minutes'])


def cargar(nombre, ruta=None):
    """Carga 'm1', 'm5', 'm15' o 'h1' (series reales de XAUUSD del curso)."""
    ruta = ruta or os.path.join(AQUI, '..', 'src', 'data')
    with open(os.path.join(ruta, nombre + '.json')) as f:
        s = decodificar(json.load(f))
    s.nombre = nombre
    return s


def desde_dataframe(df, bm, spread_usd=0.30):
    """Construye una Serie desde un DataFrame con índice UTC y columnas open, high, low, close
    (y opcionalmente 'spread' en USD). Úselo con sus propios datos exportados de MetaTrader."""
    t = (df.index.values.astype('datetime64[m]').astype(np.int64)).astype(np.float64)
    sp = df['spread'].values if 'spread' in df else np.full(len(df), spread_usd)
    return Serie(t, df.open.values, df.high.values, df.low.values, df.close.values, sp, bm)


# --------------------------------------------------------------------------- tiempo
def _ultimo_domingo(y, m):
    d = np.datetime64('%d-%02d-31' % (y, m))
    dow = (d.astype('datetime64[D]').astype(np.int64) + 4) % 7   # 0 = domingo
    return d.astype('datetime64[m]').astype(np.int64) - dow * 1440


def desfase_madrid(t):
    """Horas de desfase de Madrid respecto a UTC (1 invierno, 2 verano) para minutos UTC t."""
    anios = t.astype('int64') // 525960 + 1970
    out = np.ones(len(t), dtype=np.int64)
    for y in np.unique(anios):
        a = _ultimo_domingo(int(y), 3) + 60
        b = _ultimo_domingo(int(y), 10) + 60
        m = (anios == y) & (t >= a) & (t < b)
        out[m] = 2
    return out


# --------------------------------------------------------------------------- indicadores
def ema(x, p):
    out = np.full(len(x), np.nan)
    if len(x) < p:
        return out
    a = 2.0 / (p + 1)
    e = float(np.mean(x[:p]))
    out[p - 1] = e
    for i in range(p, len(x)):
        e = x[i] * a + e * (1 - a)
        out[i] = e
    return out


def atr_wilder(h, l, c, p=14):
    pc = np.r_[c[0], c[:-1]]
    tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc)))
    out = np.full(len(c), np.nan)
    if len(c) < p:
        return out
    a = float(np.mean(tr[:p]))
    out[p - 1] = a
    for i in range(p, len(c)):
        a = (a * (p - 1) + tr[i]) / p
        out[i] = a
    return out


def remuestrear(S, tam):
    b = (S.t // tam).astype(np.int64) * tam
    ini = np.flatnonzero(np.r_[True, b[1:] != b[:-1]])
    fin = np.r_[ini[1:], S.n]
    return dict(t=b[ini].astype(np.float64), o=S.o[ini], h=np.maximum.reduceat(S.h, ini), l=np.minimum.reduceat(S.l, ini), c=S.c[fin - 1])


def ext_previos(x, W, maximo):
    """Máximo/mínimo de las W barras anteriores a cada i (sin incluir i). NaN si i < W."""
    n = len(x)
    out = np.full(n, np.nan)
    if n <= W:
        return out
    v = np.lib.stride_tricks.sliding_window_view(x, W)      # v[k] = x[k..k+W-1]
    r = v.max(axis=1) if maximo else v.min(axis=1)
    out[W:] = r[:n - W]
    return out


def contexto(S, ctx=None):
    clave = ctx.nombre if ctx is not None else ''
    if clave in S._ctx:
        return S._ctx[clave]
    src = ctx if ctx is not None else S
    f = remuestrear(src, 15); s = remuestrear(src, 240)
    X = dict(f=f, s=s, ema20=ema(f['c'], 20), atr14=atr_wilder(f['h'], f['l'], f['c'], 14), ema50=ema(s['c'], 50))
    cierre = S.t + S.bm
    X['im'] = np.searchsorted(f['t'] + 15, cierre, side='right') - 1
    X['ih'] = np.searchsorted(s['t'] + 240, cierre, side='right') - 1
    mad = S.t + S.bm + desfase_madrid(S.t) * 60
    X['mm'] = (mad % 1440).astype(np.int64)
    X['dia'] = (mad // 1440).astype(np.int64)
    X['sem'] = ((mad // 1440).astype(np.int64) + 3) % 7
    S._ctx[clave] = X
    return X


# --------------------------------------------------------------------------- señales
def escanear(S, X, P):
    """Barras candidatas a entrada: (índice, señal +1/-1, ATR14 M15 en pips)."""
    bm = S.bm
    W1 = max(1, round(P['w1m'] / bm)); W2 = max(1, round(P['w2m'] / bm))
    H30 = ext_previos(S.h, W1, True); L30 = ext_previos(S.l, W1, False)
    H120 = ext_previos(S.h, W2, True); L120 = ext_previos(S.l, W2, False)
    o, h, l, c = S.o, S.h, S.l, S.c
    im, ih = X['im'], X['ih']
    ok_im = im >= 20; ok_ih = ih >= 50
    e20 = np.where(ok_im, X['ema20'][np.clip(im, 0, None)], np.nan)
    atr = np.where(ok_im, X['atr14'][np.clip(im, 0, None)], np.nan)
    e50 = np.where(ok_ih, X['ema50'][np.clip(ih, 0, None)], np.nan)
    h4c = np.where(ok_ih, X['s']['c'][np.clip(ih, 0, None)], np.nan)
    diff = h4c - e50
    banda = P['banda'] * PIP
    sesgo = np.where(diff < -banda, -1, np.where(diff > banda, 1, 0))
    dema = P['dema'] * PIP; techo = P['techo'] * PIP; tol = P['tol'] * PIP; maxd = P['maxdist'] * PIP
    rech = P['rechazo']
    idx = np.arange(S.n)
    base = (X['mm'] >= P['ws']) & (X['mm'] < P['we']) & (X['sem'] < 5) & (idx >= max(W1, W2) + 1) & (idx < S.n - 2) & ok_im & ok_ih & ~np.isnan(e50) & ~np.isnan(atr) & ~np.isnan(e20) & (sesgo != 0)
    with np.errstate(invalid='ignore'):
        if P['modo'] == 'tocar':
            pro_v = (h >= H30) & ((c <= o) if rech else True) & (np.abs(H30 - c) <= maxd) & (c > e20 + dema) & (c <= H120 + techo)
            pro_c = (l <= L30) & ((c >= o) if rech else True) & (np.abs(c - L30) <= maxd) & (c < e20 - dema) & (c >= L120 - techo)
        elif P['modo'] == 'zona':
            pro_v = (c >= e20 + dema) & (H120 - tol <= c) & (c <= H120 + techo) & ((c <= o) if rech else True)
            pro_c = (c <= e20 - dema) & (L120 - techo <= c) & (c <= L120 + tol) & ((c >= o) if rech else True)
        elif P['modo'] == 'ruptura':      # momento: romper el mínimo (venta) o el máximo (compra) de 30 min a favor del sesgo
            pro_v = (l <= L30) & (c < L30) & (L30 - c <= maxd) & ((c <= o) if rech else True)
            pro_c = (h >= H30) & (c > H30) & (c - H30 <= maxd) & ((c >= o) if rech else True)
        else:                             # 'ema': rechazo en la EMA20 de M15
            pro_v = (h >= e20) & (c < e20) & (e20 - c <= maxd) & ((c <= o) if rech else True)
            pro_c = (l <= e20) & (c > e20) & (c - e20 <= maxd) & ((c >= o) if rech else True)
        con_c = ((l <= L30) | (c <= L30)) & ((c >= o) if rech else True) & (c < e20)      # compra contra-tendencia (sesgo bajista)
        con_v = ((h >= H30) | (c >= H30)) & ((c <= o) if rech else True) & (c > e20)      # venta contra-tendencia (sesgo alcista)
    if not P['contra']:
        con_c = np.zeros(S.n, bool); con_v = np.zeros(S.n, bool)
    baj = sesgo == -1
    pro = np.where(baj, pro_v, pro_c); con = np.where(baj, con_c, con_v)
    sig = np.where(pro & ~con, np.where(baj, -1, 1), np.where(con & ~pro, np.where(baj, 1, -1), 0))
    sig = np.where(base, sig, 0)
    if P['dir'] == 'venta':
        sig = np.where(sig == 1, 0, sig)
    elif P['dir'] == 'compra':
        sig = np.where(sig == -1, 0, sig)
    ci = np.flatnonzero(sig != 0)
    return ci, sig[ci], atr[ci] / PIP


# --------------------------------------------------------------------------- operación
def simular(S, X, i, d, atr_pips, P):
    n, bm = S.n, S.bm
    j = i + 1
    if j >= n:
        return None
    o, h, l, c, sp = S.o, S.h, S.l, S.c, S.sp
    spr = sp[j]
    slp = min(P['slmax'], max(P['slmin'], P['slk'] * atr_pips))
    tpp = min(P['tpmax'], max(P['tpmin'], P['tpk'] * atr_pips))
    D = slp * PIP + (spr if P['compsp'] else 0.0)
    lots = np.floor(100.0 * P['risk'] / (D * 100 + P['comm'])) / 100.0
    if not lots > 0:
        return None
    ent = o[j] + spr + P['slip'] * PIP if d == 1 else o[j] - P['slip'] * PIP
    sl = ent - d * D
    tp = ent + d * tpp * PIP
    mfe = 0.0; mae = 0.0; etapa = 0
    for k in range(j, n):
        add = sp[k] if d == -1 else 0.0
        ok, hk, lk, ck = o[k] + add, h[k] + add, l[k] + add, c[k] + add
        F = hk if d == 1 else lk
        A = lk if d == 1 else hk
        alcista = ck >= ok
        adv_primero = True if P['pess'] else (alcista if d == 1 else (not alcista))
        for fase in ('adv', 'fav') if adv_primero else ('fav', 'adv'):
            if fase == 'adv':
                mae = min(mae, (A - ent) * d / PIP)
                if (A <= sl) if d == 1 else (A >= sl):
                    hueco = (ok - sl) * d <= 0
                    return _cerrar(i, j, k, d, ent, ok if hueco else sl, lots, ('SL', 'SLD', 'BE')[etapa], P, mfe, mae)
            else:
                if (F >= tp) if d == 1 else (F <= tp):
                    return _cerrar(i, j, k, d, ent, tp, lots, 'TP', P, max(mfe, (tp - ent) * d / PIP), mae)
                m = (F - ent) * d / PIP
                if m > mfe:
                    mfe = m
                    if P['be'] and mfe >= P['beratio'] * tpp and etapa < 2:
                        sl = ent + d * P['bemargin'] * PIP; etapa = 2
                    elif P['sld'] and mfe >= P['sldact'] and etapa < 1:
                        sl = ent - d * P['sldpips'] * PIP; etapa = 1
        flot = (ck - ent) * d / PIP
        if P['stag'] and (k - j + 1) * bm >= P['stagmin'] and mfe < P['stagprog'] and flot <= -P['stagflo']:
            return _cerrar(i, j, k, d, ent, ck, lots, 'STAG', P, mfe, mae)
        mm = X['mm'][k]
        if mm >= P['tstop'] or (X['sem'][k] == 4 and mm >= P['vier']):
            return _cerrar(i, j, k, d, ent, ck, lots, 'TIME', P, mfe, mae)
        if k >= n - 1:
            return _cerrar(i, j, k, d, ent, ck, lots, 'END', P, mfe, mae)
    return None


def _cerrar(i, j, k, d, ent, px, lots, motivo, P, mfe, mae):
    usd = (px - ent) * d * lots * 100 - P['comm'] * lots
    return dict(i=i, j=j, k=k, d=d, ent=ent, px=px, lots=float(lots), motivo=motivo, usd=float(usd), R=float(usd / P['risk']), mfe=float(mfe), mae=float(mae))


def escanear_sesgo(S, X, P):
    """Todas las barras de la ventana con sesgo H4 definido, con la dirección del sesgo (pro-tendencia).
    Sirve de universo para el modelo nulo «entrar al azar a favor del sesgo»."""
    im, ih = X['im'], X['ih']
    ok_im = im >= 20; ok_ih = ih >= 50
    atr = np.where(ok_im, X['atr14'][np.clip(im, 0, None)], np.nan)
    e50 = np.where(ok_ih, X['ema50'][np.clip(ih, 0, None)], np.nan)
    h4c = np.where(ok_ih, X['s']['c'][np.clip(ih, 0, None)], np.nan)
    diff = h4c - e50
    banda = P['banda'] * PIP
    sesgo = np.where(diff < -banda, -1, np.where(diff > banda, 1, 0))
    W = max(1, round(P['w1m'] / S.bm), round(P['w2m'] / S.bm))
    idx = np.arange(S.n)
    base = (X['mm'] >= P['ws']) & (X['mm'] < P['we']) & (X['sem'] < 5) & (idx >= W + 1) & (idx < S.n - 2) & ok_im & ok_ih & ~np.isnan(atr) & (sesgo != 0)
    if P['dir'] == 'venta':
        base &= sesgo == -1
    elif P['dir'] == 'compra':
        base &= sesgo == 1
    ci = np.flatnonzero(base)
    return ci, sesgo[ci], atr[ci] / PIP


def correr(S, P=None, ctx=None, cand=None):
    """Ejecuta el backtest completo y devuelve la lista de operaciones (dicts).
    cand = (índices, señales, ATR en pips) permite probar otro conjunto de entradas."""
    P = P or params()
    X = contexto(S, ctx)
    ci, cs, ca = cand if cand is not None else escanear(S, X, P)
    cool_barras = int(np.ceil(P['coolm'] / S.bm))
    ops = []
    dia = None; cnt = 0; dpnl = 0.0; bloq = False; cool_hasta = -1; ocupado = -1
    for q in range(len(ci)):
        i = int(ci[q])
        if i <= ocupado:
            continue
        dy = int(X['dia'][i])
        if dy != dia:
            dia = dy; cnt = 0; dpnl = 0.0; bloq = False
        if bloq or cnt >= P['balas'] or i <= cool_hasta:
            continue
        t = simular(S, X, i, int(cs[q]), float(ca[q]), P)
        if t is None:
            continue
        t['dia'] = dy
        ops.append(t)
        cnt += 1; dpnl += t['usd']
        if t['usd'] > 0 and t['motivo'] == 'TP' and P['onedone']:
            bloq = True
        if dpnl >= P['meta'] or dpnl <= -P['maxloss']:
            bloq = True
        cool_hasta = t['k'] + cool_barras
        ocupado = t['k']
    return ops


def resumen(ops, P=None):
    """Estadísticos de una lista de operaciones (en R y en USD)."""
    P = P or DEFECTO
    n = len(ops)
    if n == 0:
        return dict(n=0)
    R = np.array([t['R'] for t in ops]); usd = np.array([t['usd'] for t in ops])
    eq = np.cumsum(usd); dd = float(np.max(np.maximum.accumulate(eq) - eq))
    gan = usd[usd > 0].sum(); per = -usd[usd <= 0].sum()
    sd = R.std(ddof=1) if n > 1 else float('nan')
    motivos = {}
    for t in ops:
        motivos[t['motivo']] = motivos.get(t['motivo'], 0) + 1
    return dict(n=n, aciertos=float((usd > 0).mean()), R_medio=float(R.mean()), R_sd=float(sd), ee=float(sd / np.sqrt(n)),
                t=float(R.mean() / (sd / np.sqrt(n))) if n > 1 else float('nan'), R_suma=float(R.sum()), usd=float(usd.sum()),
                pf=float(gan / per) if per > 0 else float('inf'), caida_usd=dd, motivos=motivos)


def diario(ops):
    d = {}
    for t in ops:
        d[t['dia']] = d.get(t['dia'], 0.0) + t['usd']
    return d
