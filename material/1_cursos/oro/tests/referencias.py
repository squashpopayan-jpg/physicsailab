"""Genera tests/referencias.json: valores de referencia calculados con SciPy, pandas y zoneinfo
(bibliotecas independientes del motor del curso) y el resultado del motor de Python sobre los casos de casos.json.
Uso: python tests/referencias.py   y luego   node tests/validar.js"""
import json, os, sys
import numpy as np
import pandas as pd
from scipy import stats, special

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'py'))
import motor

ref = {}
# --- distribuciones (SciPy)
ref['norm'] = {'inv975': float(stats.norm.ppf(0.975)), 'inv80': float(stats.norm.ppf(0.8)), 'cdf196': float(stats.norm.cdf(1.96)), 'inv999': float(stats.norm.ppf(0.999)), 'sf3': float(stats.norm.sf(3.0))}
ref['erf'] = {str(x): float(special.erf(x)) for x in (0.1, 0.5, 1.0, 2.0, 3.0)}
ref['t'] = {'inv975_4': float(stats.t.ppf(0.975, 4)), 'inv975_29': float(stats.t.ppf(0.975, 29)), 'inv975_70': float(stats.t.ppf(0.975, 70)), 'cdf2.1_12': float(stats.t.cdf(2.1, 12)), 'p2_2.5_70': float(2 * stats.t.sf(2.5, 70))}
ref['betainc'] = {'2.5_3.5_0.4': float(special.betainc(2.5, 3.5, 0.4)), '0.5_7_0.2': float(special.betainc(0.5, 7, 0.2))}

# --- indicadores (pandas) sobre M5 real
m5 = motor.cargar('m5')
df = pd.DataFrame({'o': m5.o, 'h': m5.h, 'l': m5.l, 'c': m5.c}, index=pd.to_datetime(m5.t * 60, unit='s'))
m15 = df.resample('15min', label='left', closed='left').agg({'o': 'first', 'h': 'max', 'l': 'min', 'c': 'last'}).dropna()
h4 = df.resample('4h', label='left', closed='left').agg({'o': 'first', 'h': 'max', 'l': 'min', 'c': 'last'}).dropna()
ema20 = m15.c.ewm(span=20, adjust=False).mean()
ema50 = h4.c.ewm(span=50, adjust=False).mean()
pc = m15.c.shift(1).fillna(m15.c.iloc[0])
tr = pd.concat([m15.h - m15.l, (m15.h - pc).abs(), (m15.l - pc).abs()], axis=1).max(axis=1)
atr = tr.ewm(alpha=1 / 14, adjust=False).mean()
ref['ind'] = {'n15': int(len(m15)), 'n4h': int(len(h4)), 'close15_last': float(m15.c.iloc[-1]), 'high15_sum': float(m15.h.sum()), 'close4h_last': float(h4.c.iloc[-1]),
              'ema20_last': float(ema20.iloc[-1]), 'ema50_last': float(ema50.iloc[-1]), 'atr14_last': float(atr.iloc[-1]),
              'ema20_k': 5000, 'ema20_at_k': float(ema20.iloc[5000]), 'atr_at_k': float(atr.iloc[5000]), 'ema50_at_1500': float(ema50.iloc[1500])}
v = m5.h[:20000]
ref['roll'] = {'k': 12345, 'w': 24, 'max': float(v[12345 - 24:12345].max()), 'min': float(m5.l[12345 - 24:12345].min())}

# --- cambio de hora de Madrid (zoneinfo)
try:
    from zoneinfo import ZoneInfo
    from datetime import datetime, timezone
    casos = []
    for iso in ('2026-03-29T00:59', '2026-03-29T01:00', '2026-10-25T00:59', '2026-10-25T01:00', '2026-07-15T12:00', '2026-12-15T12:00', '2025-03-30T01:00', '2025-10-26T00:59', '2024-03-31T01:00', '2010-03-28T01:00'):
        t = datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)
        off = int(t.astimezone(ZoneInfo('Europe/Madrid')).utcoffset().total_seconds() // 3600)
        casos.append([int(t.timestamp() // 60), off])
    ref['madrid'] = casos
except Exception as e:  # sin base de zonas horarias
    ref['madrid'] = []
    print('zoneinfo no disponible:', e)

# --- motor de Python sobre casos.json
casos = json.load(open(os.path.join(AQUI, 'casos.json')))
cache = {}
def serie(k):
    if k not in cache:
        cache[k] = motor.cargar(k)
    return cache[k]
eng = {}
for c in casos:
    S = serie(c['serie']); ctx = serie(c['ctx']) if c['ctx'] else None
    ops = motor.correr(S, motor.params(**c['p']), ctx)
    eng[c['id']] = {'n': len(ops), 'usd': round(sum(t['usd'] for t in ops), 6), 'R': round(sum(t['R'] for t in ops), 9),
                    'first': [[t['i'], t['k'], t['d'], t['motivo']] for t in ops[:5]], 'last': [[t['i'], t['k'], t['d'], t['motivo']] for t in ops[-5:]],
                    'reasons': motor.resumen(ops)['motivos'] if ops else {}}
ref['engine'] = eng
json.dump(ref, open(os.path.join(AQUI, 'referencias.json'), 'w'), indent=1)
print('referencias.json escrito:', {k: (len(v) if hasattr(v, '__len__') else v) for k, v in ref.items()})
