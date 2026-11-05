import numpy as np
from scipy.optimize import brentq
VT=0.025852
Is=1e-9;n=1.3*12;rs=0.5;rsh=600;isc=0.2
def I(g,V):
    iph=isc*g/1000
    return brentq(lambda i: iph-Is*(np.exp((V+i*rs)/(n*VT))-1)-(V+i*rs)/rsh-i,-1,1)
for g in (1000,500,200):
    iph=isc*g/1000; Voc=n*VT*np.log(iph/Is+1)
    Vs=np.linspace(0,Voc,400); Ii=np.array([I(g,v) for v in Vs]); P=Vs*Ii; k=P.argmax()
    print(g,'Voc',Voc,'Isc',I(g,0),'Pmax',P[k],'at',Vs[k],Ii[k],'FF',P[k]/(Voc*I(g,0)))
# carga 30 ohm a 1000
g=1000
f=lambda V: V/30-I(g,V)
V=brentq(f,0,9); print('op',V,V/30,V*V/30)
f=lambda V: V/10-I(g,V); V=brentq(f,0,9); print('op10',V,V/10,V*V/10)
f=lambda V: V/100-I(g,V); V=brentq(f,0,9); print('op100',V,V/100,V*V/100)
# LED calculo
print('R rojo 5V 15mA',(5-1.95)/0.015,'azul',(5-3.0)/0.015,'3 rojos 12V',(12-3*1.95)/0.015)
print('PD',75e-6*10e3)
