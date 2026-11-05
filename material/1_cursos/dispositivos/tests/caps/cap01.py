import numpy as np
# nodal: dos nodos A, B
G=np.array([[1/1e3+1/2e3+1/3e3, -1/3e3],[-1/3e3, 1/3e3+1/4e3]])
b=np.array([10/1e3, 2e-3])
va,vb=np.linalg.solve(G,b)
print('nodal VA,VB',va,vb)
# corrientes
print('I1',(10-va)/1e3,'I2',va/2e3,'I3',(va-vb)/3e3,'I4',vb/4e3)
# Thevenin 12V,1k//...: fuente 12V, R1=6k serie, R2=3k paralelo, RL
v,r1,r2=12,6e3,3e3
vth=v*r2/(r1+r2); rth=r1*r2/(r1+r2)
print('vth',vth,'rth',rth,'Pmax',vth**2/(4*rth))
# divisor: 10V, 4.7k y 10k, carga 10k
print('div', 10*10e3/(14.7e3), 'con carga 10k', 10*(10e3*10e3/20e3)/(4.7e3+5e3))
# bateria 9V rs 1.7 RL 10 ohm
rs,rl=1.7,10
print('bat I',9/(rs+rl),'Vt',9*rl/(rs+rl),'PL',(9/(rs+rl))**2*rl,'eta',rl/(rs+rl))
# maxima potencia: 9V rs 1.7
print('Pmax',81/(4*1.7))
# serie/paralelo
print(1/(1/220+1/330+1/470))
print('--- inv')
G=np.array([[1/1e3+1/2e3+1/3e3, -1/3e3],[-1/3e3, 1/3e3+1/4e3]])
for b in (np.array([10/1e3, -2e-3]), np.array([10/1e3,0]), np.array([0,2e-3])):
    print(np.linalg.solve(G,b))
print('--- lampara')
Vr,P=12,5; Rh=Vr**2/P
for V in (1.2,12,6):
    th=(V/Vr)**(2/5.2); R=Rh*th**1.2; print(V,'R',R,'I',V/R)
print('--- diodo 1N4007 5V 330')
from scipy.optimize import brentq
VT=0.025852
def vd(I,Is=2.55e-9,n=1.75,rs=0.04): return n*VT*np.log(I/Is+1)+I*rs
I=brentq(lambda I: vd(I)-(5-330*I),1e-6,0.02); print(I,vd(I))
# max pot
print(9/(2*1.7), (9/3.4)**2*1.7)
print('P int a 0.1ohm',(9/1.8)**2*1.7, 9/1.8)
