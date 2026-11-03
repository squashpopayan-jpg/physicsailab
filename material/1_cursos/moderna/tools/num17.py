import math, scipy.constants as C
h,c,kB,e=C.h,C.c,C.k,C.e
for nm,nu,T in (('10GHz 300K',1e10,300),('500nm 6000K',c/500e-9,6000),('10.6um 300K',c/10.6e-6,300),('1064 300K',c/1064e-9,300),('632.8 300K',c/632.8e-9,300),('632.8 6000K',c/632.8e-9,6000)):
    x=h*nu/(kB*T); print(nm,'x',x,'ratio',math.expm1(x) if x<700 else 'inf','Boltz',math.exp(-x))
nu=c/632.8e-9; print('hv eV',h*nu/e,'T para ratio=1',h*nu/(kB*math.log(2)))
print('E 1064 eV',h*c/1064e-9/e,'10.6',h*c/10.6e-6/e)
amu=C.atomic_mass
for T in (300,400): print('dop',T,2*nu*math.sqrt(2*kB*T*math.log(2)/(20.1797*amu*c*c))/1e9)
A=3.4e6; fw=2*nu*math.sqrt(2*kB*400*math.log(2)/(20.1797*amu*c*c)); g=2*math.sqrt(math.log(2)/math.pi)/fw
print('sigma m2',(632.8e-9)**2*A*g/(8*math.pi),'natural MHz',A/(2*math.pi)/1e6)
L=0.3;print('fsr',c/(2*L)/1e6)
for R2 in (0.99,0.98,0.95): 
    gth=-math.log(0.999*R2)/(2*L); print('R2',R2,'gth',gth,'per pass %',gth*L*100,'tauc ns',1/(c*gth)*1e9,'Q',2*math.pi*nu/(c*gth))
import numpy as np
fs=499.654096e6; s=fw/(2*math.sqrt(2*math.log(2)))
print('fw400',fw/1e9)
gth=-math.log(0.999*0.99)/(2*L)
for g0 in (0.03,0.05,0.08,0.1):
    n=[q for q in range(-10,11) if g0*math.exp(-0.5*(q*fs/s)**2)>gth]; print(g0,gth,len(n))
tau=230e-6;tc=1e-9;B=1e-5;Nth=1/(B*tc);Rth=Nth/tau;print('Nth',Nth,'Rth',Rth,'phi_ss r=2.5',tc*1.5*Rth,'f',math.sqrt(1.5/(tau*tc)-(2.5/(2*tau))**2)/2/math.pi/1e3,'damp us',2*tau/2.5*1e6)
for lam,w0 in ((632.8e-9,0.3e-3),):
    print('zR',math.pi*w0**2/lam,'theta mrad',lam/(math.pi*w0)*1e3)
print('TiSa',c*100e-9/(800e-9)**2/1e12,'THz',0.4413/(c*100e-9/(800e-9)**2)*1e15,'fs')
print('FW 10fs',0.4413/10e-15/1e12,'THz')
