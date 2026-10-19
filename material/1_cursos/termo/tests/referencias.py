"""Referencias independientes para validar src/core/30-thermo.js.
CoolProp (IAPWS-95, Tillner-Roth/Baehr, Span–Wagner…) y SciPy.
Escribe tests/referencias.json. Ejecutar: python tests/referencias.py"""
import json, math
import numpy as np
from scipy import special, integrate, optimize
from CoolProp.CoolProp import PropsSI as P
R=8.314462618; kB=1.380649e-23; h=6.62607015e-34; c0=299792458; NA=6.02214076e23
ref={}
# --- agua: saturación y vapor sobrecalentado fuera de la malla
ref['agua_sat']={str(T):[P('P','T',T,'Q',0,'Water'),P('H','T',T,'Q',0,'Water'),P('H','T',T,'Q',1,'Water'),P('S','T',T,'Q',0,'Water'),P('S','T',T,'Q',1,'Water'),1/P('D','T',T,'Q',1,'Water')] for T in [283.15,298.15,323.15,373.15,423.15,503.15,573.15,623.15]}
ref['agua_sup']={f'{p},{T}':[P('H','P',p,'T',T,'Water'),P('S','P',p,'T',T,'Water'),1/P('D','P',p,'T',T,'Water')] for p,T in [(1e4,373.15),(1e5,423.15),(1e6,523.15),(3e6,673.15),(8e6,773.15),(15e6,873.15),(5e5,1073.15),(2e7,923.15)]}
ref['agua_Tsat']={str(p):P('T','P',p,'Q',0,'Water') for p in [2e3,1e4,82e3,101325,1e6,1e7]}
ref['r134a_sat']={str(T):[P('P','T',T,'Q',0,'R134a'),P('H','T',T,'Q',0,'R134a'),P('H','T',T,'Q',1,'R134a'),P('S','T',T,'Q',1,'R134a')] for T in [253.15,263.15,273.15,293.15,313.15,333.15]}
ref['r134a_sup']={f'{p},{T}':[P('H','P',p,'T',T,'R134a'),P('S','P',p,'T',T,'R134a')] for p,T in [(1.4e5,273.15),(8e5,323.15),(1e6,343.15),(1.6e6,363.15)]}
# Rankine ideal (P alta 3 MPa, 350 °C; condensador 75 kPa) con CoolProp directamente
def rank(Ph,Pl,T3):
    h1=P('H','P',Pl,'Q',0,'Water'); v1=1/P('D','P',Pl,'Q',0,'Water'); s1=P('S','P',Pl,'Q',0,'Water')
    h2=P('H','P',Ph,'S',s1,'Water'); h3=P('H','P',Ph,'T',T3,'Water'); s3=P('S','P',Ph,'T',T3,'Water'); h4=P('H','P',Pl,'S',s3,'Water')
    return ((h3-h4)-(h2-h1))/(h3-h2)
def regen(Ph,Pl,Pb,T5):
    W='Water'; h1=P('H','P',Pl,'Q',0,W); v1=1/P('D','P',Pl,'Q',0,W); h2=h1+v1*(Pb-Pl)
    h3=P('H','P',Pb,'Q',0,W); v3=1/P('D','P',Pb,'Q',0,W); h4=h3+v3*(Ph-Pb)
    h5=P('H','P',Ph,'T',T5,W); s5=P('S','P',Ph,'T',T5,W); h6=P('H','P',Pb,'S',s5,W); h7=P('H','P',Pl,'S',s5,W)
    y=(h3-h2)/(h6-h2); wt=h5-h6+(1-y)*(h6-h7); wp=(1-y)*(h2-h1)+(h4-h3); return (wt-wp)/(h5-h4)
ref['regen']={'15e6,10e3,1.2e6,873.15':regen(15e6,10e3,1.2e6,873.15)}
ref['rankine']={'3e6,75e3,623.15':rank(3e6,75e3,623.15),'10e6,10e3,823.15':rank(10e6,10e3,823.15)}
def refr(Te,Tc):
    Pe=P('P','T',Te,'Q',1,'R134a'); Pc=P('P','T',Tc,'Q',0,'R134a')
    h1=P('H','T',Te,'Q',1,'R134a'); s1=P('S','T',Te,'Q',1,'R134a'); h2=P('H','P',Pc,'S',s1,'R134a'); h3=P('H','T',Tc,'Q',0,'R134a')
    return (h1-h3)/(h2-h1)
ref['refrig']={'263.15,313.15':refr(263.15,313.15),'273.15,308.15':refr(273.15,308.15)}
# --- presión de saturación (Wagner–Pruss vs IAPWS-95)
ref['psat']={str(T):P('P','T',T,'Q',0,'Water') for T in [273.16,283.15,293.15,313.15,353.15,453.15,600]}
# --- ecuaciones cúbicas: Z real con CoolProp como referencia de exactitud
ref['Zreal']={f'{g},{T},{p}':P('Z','T',T,'P',p,f) for g,f,T,p in [('CO2','CO2',320,5e6),('N2','Nitrogen',200,10e6),('CH4','Methane',250,8e6),('CO2','CO2',350,10e6)]}
# Z de Peng–Robinson calculado aparte (independiente de la implementación JS)
def prZ(Tc,Pc,w,T,p):
    k=0.37464+1.54226*w-0.26992*w*w; al=(1+k*(1-math.sqrt(T/Tc)))**2
    a=0.45724*R*R*Tc*Tc*al/Pc; b=0.0778*R*Tc/Pc; A=a*p/(R*T)**2; B=b*p/(R*T)
    r=np.roots([1,-(1-B),A-3*B*B-2*B,-(A*B-B*B-B**3)]); r=sorted([x.real for x in r if abs(x.imag)<1e-10 and x.real>B])
    return r[-1]
ref['prZ']={'CO2,320,5e6':prZ(304.13,7.3773e6,0.2239,320,5e6),'N2,200,10e6':prZ(126.19,3.3958e6,0.0372,200,10e6)}
# van der Waals: Maxwell
def maxw(Tr):
    def roots(Pr):
        r=np.roots([1,-(1/3)*(1+8*Tr/Pr),3/Pr,-1/Pr]); return sorted([x.real for x in r if abs(x.imag)<1e-9])
    def area(Pr):
        vl,_,vg=roots(Pr)
        I=integrate.quad(lambda v:8*Tr/(3*v-1)-3/v**2,vl,vg)[0]; return I-Pr*(vg-vl)
    vs=np.linspace(0.4,6,200000); p=8*Tr/(3*vs-1)-3/vs**2; d=np.diff(p)
    i1=np.where((d[:-1]<0)&(d[1:]>=0))[0][0]; i2=np.where((d[:-1]>0)&(d[1:]<=0))[0][0]
    return optimize.brentq(area,max(p[i1+1],1e-9)*1.000001,p[i2+1]*0.999999,xtol=1e-14)
ref['maxwell']={str(t):maxw(t) for t in [0.7,0.85,0.95,0.99]}
# --- Debye, Fermi, Bose, Planck
def debye(T,th): return 3*(T/th)**3*integrate.quad(lambda x:x**4*np.exp(x)/np.expm1(x)**2,0,th/T)[0]
ref['debye']={f'{T},{th}':debye(T,th) for T,th in [(10,343),(100,343),(300,428),(1000,2230)]}
ref['fermi']={f'{j},{e}':integrate.quad(lambda x:x**j/(np.exp(x-e)+1),0,np.inf,limit=200)[0]/special.gamma(j+1) for j,e in [(0.5,-2),(0.5,0),(0.5,5),(1.5,3),(0.5,20)]}
ref['bose']={f'{j},{z}':float(sum(z**k/k**j for k in range(1,400000))) for j,z in [(1.5,0.5),(2.5,0.9),(1.5,0.99)]}
def frac(lT):
    x0=h*c0/(lT*kB); return 15/math.pi**4*integrate.quad(lambda x:x**3/np.expm1(x),x0,np.inf)[0]
ref['bbfrac']={str(l):frac(l) for l in [1e-3,2.898e-3,5e-3,1e-2]}
ref['erf']={str(x):float(special.erf(x)) for x in [0.2,1,2.5,3.5]}
ref['lngamma']={str(z):float(special.gammaln(z)) for z in [0.5,3.3,50,1000.5]}
# --- cp ideal (CoolProp CP0MOLAR, gas ideal de cada ecuación de referencia)
ref['cp0']={f'{g},{T}':P('CP0MOLAR','T',T,'P',1e3,f) for g,f,T in [('N2','Nitrogen',300),('N2','Nitrogen',1000),('O2','Oxygen',300),('O2','Oxygen',1000),('CO2','CO2',300),('CO2','CO2',1000),('H2O','Water',500),('H2O','Water',1000),('CH4','Methane',300),('CH4','Methane',600),('Ar','Argon',500)]}
# psicrometría: ω y bulbo húmedo con CoolProp HAPropsSI
from CoolProp.HumidAirProp import HAPropsSI as HA
ref['psy_w']={f'{T},{r},{p}':HA('W','T',T+273.15,'R',r,'P',p) for T,r,p in [(25,0.5,101325),(20,0.7,82000),(35,0.3,101325)]}
ref['psy_wb']={f'{T},{r},{p}':HA('Twb','T',T+273.15,'R',r,'P',p)-273.15 for T,r,p in [(25,0.5,101325),(30,0.4,82000)]}
ref['psy_dew']={f'{T},{r},{p}':HA('Tdp','T',T+273.15,'R',r,'P',p)-273.15 for T,r,p in [(25,0.5,101325),(20,0.7,82000)]}
# Joule–Thomson: temperatura tras estrangular a 1 bar (ecuaciones de referencia)
ref['jt']={f'{g},{T},{p}':P('T','H',P('H','T',T,'P',p,f),'P',1e5,f) for g,f,T,p in [('N2','Nitrogen',300,200e5),('CO2','CO2',320,60e5),('CH4','Methane',300,70e5)]}
json.dump(ref,open(__file__.replace('.py','.json'),'w'),indent=1)
print('OK',sum(len(v) if isinstance(v,dict) else 1 for v in ref.values()),'referencias')
