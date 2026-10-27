import numpy as np
from scipy import integrate, constants as sc

def run(R):
    Rg = sc.R
    # Ciclo de Carnot: trabajo por integración numérica de P dV en las cuatro etapas
    Th, Tc, V1, V2, g = 423.0, 313.0, 1e-3, 3e-3, 1.4
    V3 = V2*(Th/Tc)**(1/(g-1)); V4 = V1*(Th/Tc)**(1/(g-1))
    P = lambda V, T: Rg*T/V
    W1 = integrate.quad(lambda V: P(V, Th), V1, V2)[0]
    P2 = Rg*Th/V2
    W2 = integrate.quad(lambda V: P2*(V2/V)**g, V2, V3)[0]
    W3 = integrate.quad(lambda V: P(V, Tc), V3, V4)[0]
    P4 = Rg*Tc/V4
    W4 = integrate.quad(lambda V: P4*(V4/V)**g, V4, V1)[0]
    R['carnot'] = {'W': float(W1+W2+W3+W4), 'Qh': float(W1), 'eta': float((W1+W2+W3+W4)/W1), 'V3': float(V3), 'V4': float(V4)}
    # Mayer
    Rspec = Rg/28.9647
    R['mayer_mod'] = float(Rspec/(0.2395*(1-1/1.4)))
    R['mayer_1842'] = float(Rspec/(0.267*(1-1/1.421)))
    R['cal'] = sc.calorie
    # Joule: ΔT con constantes
    E = 27.2*sc.g*10.9*20
    R['joule'] = {'E': float(E), 'dT': float(E/(30*4186))}
    # Rumford: 26.5 lb de 15 a 100 °C; potencia de un caballo 745.7 W durante 2.5 h
    m = 26.5*0.45359237
    Q = m*1000*85
    R['rumford'] = {'Q': float(Q), 'W': float(745.7*9000), 'J': float(745.7*9000/Q)}
    # Rendimientos de motores
    R['eta150_40'] = float(1-313.15/423.15)
