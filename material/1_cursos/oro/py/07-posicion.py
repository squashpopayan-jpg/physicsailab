# 07-posicion.py — Tamaño real de las posiciones, riesgo realizado y el reparto de operaciones por día
import numpy as np
import motor
from ayuda import *

for nombre in ('m1', 'm5'):
    S, ctx = serie_y_contexto(nombre)
    P = motor.params()
    ops = motor.correr(S, P, ctx)
    lots = np.array([t['lots'] for t in ops]); usd = np.array([t['usd'] for t in ops])
    sl = [t for t in ops if t['motivo'] == 'SL']
    print('%s: %d operaciones, lotes: mediana %.2f (mín %.2f, máx %.2f)' % (nombre.upper(), len(ops), np.median(lots), lots.min(), lots.max()))
    print('   Pérdida a stop completo: media %.1f USD (min %.1f, máx %.1f) frente al riesgo nominal de 125' % (
        -np.mean([t['usd'] for t in sl]), -max(t['usd'] for t in sl), -min(t['usd'] for t in sl)))
    d = motor.diario(ops)
    X = motor.contexto(S, ctx)
    dias_h = np.unique(X['dia'][(X['mm'] >= 537) & (X['mm'] < 780) & (X['sem'] < 5)])
    cuenta = np.array([sum(1 for t in ops if t['dia'] == dd) for dd in dias_h])
    print('   Días hábiles con ventana: %d | días con 0 operaciones: %.0f %% | con 1: %.0f %% | con 2: %.0f %%' % (
        len(dias_h), 100 * (cuenta == 0).mean(), 100 * (cuenta == 1).mean(), 100 * (cuenta == 2).mean()))
    pd_ = np.array([d.get(dd, 0.0) for dd in dias_h])
    print('   Resultado diario: media %+.1f USD | mejor %+.0f | peor %+.0f | días en positivo %.0f %% | en negativo %.0f %%' % (
        pd_.mean(), pd_.max(), pd_.min(), 100 * (pd_ > 0).mean(), 100 * (pd_ < 0).mean()))
    print('   Motivos de salida: %s' % motor.resumen(ops)['motivos'])
    print()

# Efecto de compensar el spread en el stop
S, ctx = serie_y_contexto('m5')
for comp in (True, False):
    P = motor.params(compsp=comp)
    ops = motor.correr(S, P, ctx)
    sl = [t for t in ops if t['motivo'] == 'SL']
    print('Compensar spread = %-5s: lote mediano %.2f | pérdida media a stop %.1f USD | R medio %+.3f' % (comp, np.median([t['lots'] for t in ops]), -np.mean([t['usd'] for t in sl]), R_de(ops).mean()))
