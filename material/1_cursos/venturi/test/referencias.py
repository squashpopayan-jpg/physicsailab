"""Valores de referencia independientes para validar el motor del banco de Venturi.
python test/referencias.py  →  test/referencias.json
Fuentes: CoolProp (agua, IAPWS-95 y viscosidad IAPWS 2008) y fluids (medidores de presión diferencial y fricción)."""
import json, math, os
import CoolProp.CoolProp as CP
import fluids
from fluids.flow_meter import flow_meter_discharge
from fluids.friction import Blasius, friction_factor

P = 82300.0  # Pa, presión típica de Popayán
agua = []
for T in [10, 15, 17.5, 20, 22.5, 25, 30]:
    K = T + 273.15
    agua.append({'T': T, 'rho': CP.PropsSI('D', 'T', K, 'P', P, 'Water'), 'mu': CP.PropsSI('V', 'T', K, 'P', P, 'Water')})
g, rho = 9.777, 998.2
caudal = []
for dh in [0.005, 0.03, 0.1, 0.2, 0.35]:
    m = flow_meter_discharge(D=0.025, Do=0.013, P1=200000.0, P2=200000.0 - rho * g * dh, rho=rho, C=1.0, expansibility=1.0)
    caudal.append({'dh_mm': dh * 1000, 'q_Lmin': m / rho * 60000})
fric = [{'Re': Re, 'blasius': Blasius(Re), 'liso': friction_factor(Re=Re, eD=0.0)} for Re in [5000, 10000, 20000, 40000]]
out = {'fuente': {'CoolProp': CP.get_global_param_string('version'), 'fluids': fluids.__version__}, 'P': P, 'agua': agua, 'caudal': caudal, 'friccion': fric}
ruta = os.path.join(os.path.dirname(__file__), 'referencias.json')
with open(ruta, 'w', encoding='utf-8') as f: json.dump(out, f, indent=1)
print('Escrito', ruta)
