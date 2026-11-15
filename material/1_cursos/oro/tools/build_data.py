"""Codifica las series reales de XAUUSD (caché de quant_trading) en un formato compacto.

Salida:
  src/data/<nombre>.json      cabecera + datos (deflate-raw en base64), usados por el curso y por py/motor.py
  src/lib/05-data.js          las mismas series como constante ML.RAW (se decodifican en el navegador)

Formato (planar, little-endian) para n barras:
  gap   uint16[n]   minutos desde la barra anterior (la primera: 0)
  dO    int32[n]    apertura - cierre anterior, en centavos (la primera: apertura - c0)
  body  int32[n]    cierre - apertura
  up    int32[n]    máximo - max(apertura, cierre)
  dn    int32[n]    min(apertura, cierre) - mínimo
  spr   uint16[n]   spread en centavos (spread_bps * cierre / 1e4 * 100)
Los precios del caché son Bid exactos al centavo; el spread se cuantiza al centavo.
"""
import base64, json, os, sys, zlib
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = sys.argv[1] if len(sys.argv) > 1 else r'C:/Users/User/Documents/Claude/ConCode/quant_trading/data/cache'
SETS = {
    'm1': ('vt_xauusd_1m', 1),
    'm5': ('vt_xauusd_5m', 5),
    'm15': ('vt_xauusd_15m', 15),
    'h1': ('demo_xauusd_1h', 60),
}
os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)


def encode(df):
    n = len(df)
    tmin = (df.index.values.astype('datetime64[m]').astype(np.int64))
    gap = np.diff(tmin, prepend=tmin[0])
    assert gap.max() < 65535 and gap.min() >= 0
    o = np.round(df.open.values * 100).astype(np.int64)
    h = np.round(df.high.values * 100).astype(np.int64)
    l = np.round(df.low.values * 100).astype(np.int64)
    c = np.round(df.close.values * 100).astype(np.int64)
    c0 = int(c[0])
    prevc = np.r_[c0, c[:-1]]
    dO = o - prevc
    body = c - o
    up = h - np.maximum(o, c)
    dn = np.minimum(o, c) - l
    assert up.min() >= 0 and dn.min() >= 0
    spr = np.round(df.spread_bps.values / 1e4 * df.close.values * 100).astype(np.int64)
    assert spr.min() >= 0 and spr.max() < 65535
    buf = b''.join([gap.astype('<u2').tobytes(), dO.astype('<i4').tobytes(), body.astype('<i4').tobytes(),
                    up.astype('<i4').tobytes(), dn.astype('<i4').tobytes(), spr.astype('<u2').tobytes()])
    comp = zlib.compressobj(9, zlib.DEFLATED, -15)
    z = comp.compress(buf) + comp.flush()
    return {'n': int(n), 't0': int(tmin[0]), 'c0': c0, 'b64': base64.b64encode(z).decode('ascii')}


def decode(d):
    n = d['n']
    buf = zlib.decompress(base64.b64decode(d['b64']), -15)
    off = 0
    def take(dt, size):
        nonlocal off
        a = np.frombuffer(buf, dtype=dt, count=n, offset=off); off += n * size; return a
    gap = take('<u2', 2).astype(np.int64); dO = take('<i4', 4).astype(np.int64); body = take('<i4', 4).astype(np.int64)
    up = take('<i4', 4).astype(np.int64); dn = take('<i4', 4).astype(np.int64); spr = take('<u2', 2).astype(np.int64)
    t = d['t0'] + np.cumsum(gap)
    # cierre anterior acumulado: c_i = c_{i-1} + dO_i + body_i
    step = dO + body
    c = d['c0'] + np.cumsum(step) - 0  # c_0 = c0 + dO0 + body0
    prevc = np.r_[d['c0'], c[:-1]]
    o = prevc + dO
    h = np.maximum(o, c) + up
    l = np.minimum(o, c) - dn
    return t, o / 100.0, h / 100.0, l / 100.0, c / 100.0, spr / 100.0


if __name__ == '__main__':
    js = ['/* Generado por tools/build_data.py: series reales de XAUUSD (Bid) en formato compacto. No editar. */',
          'window.ML = window.ML || {};', 'ML.RAW = {};']
    for name, (f, minutes) in SETS.items():
        df = pd.read_parquet(os.path.join(CACHE, f + '.parquet'))
        d = encode(df)
        d['minutes'] = minutes
        d['start'] = str(df.index[0]); d['end'] = str(df.index[-1])
        # verificación de ida y vuelta
        t, o, h, l, c, s = decode(d)
        assert np.abs(o - df.open.values).max() < 1e-6 and np.abs(h - df.high.values).max() < 1e-6
        assert np.abs(l - df.low.values).max() < 1e-6 and np.abs(c - df.close.values).max() < 1e-6
        assert (t == df.index.values.astype('datetime64[m]').astype(np.int64)).all()
        with open(os.path.join(ROOT, 'src', 'data', name + '.json'), 'w') as fh:
            json.dump(d, fh)
        js.append('ML.RAW.%s = %s;' % (name, json.dumps(d)))
        print(name, d['n'], d['start'], d['end'], '%.0f KB' % (len(d['b64']) / 1024))
    with open(os.path.join(ROOT, 'src', 'lib', '05-data.js'), 'w') as fh:
        fh.write('\n'.join(js) + '\n')
