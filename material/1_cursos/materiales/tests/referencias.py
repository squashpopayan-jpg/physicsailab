"""Referencias independientes (SciPy) para validar src/core/30-mat.js.
Escribe tests/referencias.json. Ejecutar: python tests/referencias.py"""
import json, math
import numpy as np
from scipy import special, integrate, optimize
R=8.314462618; kB=1.380649e-23; eV=1.602176634e-19; kBeV=kB/eV; NA=6.02214076e23
ref={}
ref['erf']={str(x):float(special.erf(x)) for x in [0.1,0.5,1.0,1.7,2.5,3.2,4.0]}
ref['erfc']={str(x):float(special.erfc(x)) for x in [3.2,4.0,5.0]}
ref['erfinv']={str(y):float(special.erfinv(y)) for y in [0.1,0.5,0.8235,0.99]}
ref['gamma']={str(z):float(special.gamma(z)) for z in [0.5,1.5,2.3,4.0,6.7]}
def debye(T,th):
    I=integrate.quad(lambda x: x**4*np.exp(x)/(np.exp(x)-1)**2 if x>1e-8 else x*x,0,th/T)[0]
    return 3*(T/th)**3*I
ref['debye']={f'{T},{th}':debye(T,th) for T,th in [(10,343),(50,343),(150,428),(300,343),(1000,645)]}
def mf(T,Tc):
    if T>=Tc: return 0.0
    return optimize.brentq(lambda m: m-np.tanh(m*Tc/T),1e-9,1)
ref['meanField']={f'{T}':mf(T,1043) for T in [100,500,900,1000,1040]}
def bril(J,x):
    a=(2*J+1)/(2*J); b=1/(2*J); return a/np.tanh(a*x)-b/np.tanh(b*x)
ref['brillouin']={f'{J},{x}':bril(J,x) for J,x in [(0.5,0.7),(2.5,1.3),(3.5,0.2)]}
ref['langevin']={str(x):1/np.tanh(x)-1/x for x in [0.01,0.5,2,10]}
# binodal solucion regular
def binod(Om,T):
    return optimize.brentq(lambda x: np.log(x/(1-x))+Om*(1-2*x)/(R*T),1e-14,0.5-1e-12)
ref['binodal']={f'{Om},{T}':binod(Om,T) for Om,T in [(20000,800),(20000,1100),(30000,1500)]}
# semiconductor tipo n Si, neutralidad
Si=dict(Eg0=1.170,alpha=4.73e-4,beta=636,Nc=2.86e25,Nv=3.10e25)
def Eg(T): return Si['Eg0']-Si['alpha']*T*T/(T+Si['beta'])
def ni(T): return math.sqrt(Si['Nc']*Si['Nv']*(T/300)**3)*math.exp(-Eg(T)/(2*kBeV*T))
ref['ni_Si']={str(T):ni(T) for T in [250,300,400,600]}
def ntype(T,Nd,Ed=0.045):
    Nc=Si['Nc']*(T/300)**1.5; Nv=Si['Nv']*(T/300)**1.5; g=Eg(T); kT=kBeV*T
    f=lambda EF: Nv*np.exp(-EF/kT)+Nd/(1+2*np.exp((EF-(g-Ed))/kT))-Nc*np.exp((EF-g)/kT)
    EF=optimize.brentq(f,-0.5-40*kT,g+0.5+40*kT,xtol=1e-15)
    return Nc*np.exp((EF-g)/kT)
ref['ntype']={f'{T},{Nd}':ntype(T,Nd) for T,Nd in [(50,1e21),(100,1e21),(300,1e21),(700,1e21),(300,1e23)]}
# Bloch-Gruneisen
def bg(T,th):
    f=lambda t:(t/th)**5*integrate.quad(lambda x: x**5/((np.exp(x)-1)*(1-np.exp(-x))) if x>1e-8 else 0,0,th/t)[0]
    return f(T)/f(th)
ref['bloch']={f'{T}':bg(T,343) for T in [20,80,200,600]}
# Fresnel
ref['fresnel']={'1,1.5,0':((1-1.5)/(2.5))**2}
th=math.radians(45); tt=math.asin(math.sin(th)/1.5)
rs=(math.cos(th)-1.5*math.cos(tt))/(math.cos(th)+1.5*math.cos(tt)); rp=(1.5*math.cos(th)-math.cos(tt))/(1.5*math.cos(th)+math.cos(tt))
ref['fresnel45']=[rs*rs,rp*rp]
# Simpson check & diffusion
ref['fickTime']=( (5e-4/(2*special.erfinv((1.2-0.8)/(1.2-0.25))))**2 / 1.6e-11 )
# JMAK t50
ref['jmakT50']=(math.log(2)/0.02)**(1/2.5)
# Paris integral numeric
C,m,Y,ds,a0,af=1e-12,3.0,1.12,100,1e-3,2e-2
ref['paris']=integrate.quad(lambda a: 1/(C*(Y*ds*math.sqrt(math.pi*a))**m),a0,af)[0]
# Stoner-Wohlfarth switching field at 30 deg: numeric minimisation check
def hsw(psi):
    p=math.radians(psi)
    return 1/((math.cos(p)**(2/3)+math.sin(p)**(2/3))**1.5)
ref['stoner']={str(p):hsw(p) for p in [0,30,45,70]}
json.dump(ref,open('tests/referencias.json','w'),indent=1)
print('referencias:',len(ref))
