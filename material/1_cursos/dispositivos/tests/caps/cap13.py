import numpy as np
from scipy.optimize import brentq
VT=0.025852
def vd(I,Is,n,rs): return n*VT*np.log(I/Is+1)+I*rs
def solve(Vs,R,Is,n,rs): return brentq(lambda I: vd(I,Is,n,rs)-(Vs-R*I),1e-12,Vs/R)
m4148=(2.52e-9,1.752,0.568); m4007=(2.55e-9,1.75,0.04); sch=(3e-7,1.05,0.04)
for nm,m in (('4148',m4148),('4007',m4007),('sch',sch)):
    I=solve(5,1000,*m); print(nm,'5V/1k',I*1e3,'mA',vd(I,*m),'V', 'rd',m[1]*VT/I)
    I=solve(5,100,*m); print(nm,'5V/100',I*1e3,'mA',vd(I,*m))
# modelos 1N4148 5V 1k: ideal 5 mA; const 0.7: 4.3 mA; piecewise Vd0=0.55? rd=
print('const',(5-0.7)/1000)
# error de modelos con Vs 1V y R 1k
for Vs in (1,2,5,12):
    I=solve(Vs,1000,*m4148); print(Vs,'real',I*1e3,'ideal',Vs/1e3*1e3,'const',(Vs-0.7)/1e3*1e3 if Vs>0.7 else 0)
# potencia 1N4007 1A: vf
I=1.0; print('1N4007 1A VF',vd(I,*m4007),'P',vd(I,*m4007)*I,'Tj',25+vd(I,*m4007)*I*100)
# rd a 1mA 1N4148 y atenuacion con Rs=1k, Rb=4.3k
rd=1.752*VT/1e-3; print('rd',rd, 'att',(rd*4300/(rd+4300))/(1000+rd*4300/(rd+4300)))
# paralelo desigual: dos 1N4007 con VF 0.7 y 0.75 a 1 A: reparto
Is1=2.55e-9; Is2=Is1*np.exp(-0.05/(1.75*VT))
print('Is ratio',Is1/Is2)
# serie dos diodos 1N4007 1000V invers: reparto con fugas distinto
