import numpy as np
q=1.602176634e-19; k=8.617333262e-5; T=300; VT=k*T
ni=1e10; es=11.7*8.854e-14
def junction(NA,ND,V):
    V0=VT*np.log(NA*ND/ni**2)
    W=np.sqrt(2*es*(V0-V)/q*(1/NA+1/ND)); xn=W*NA/(NA+ND); xp=W*ND/(NA+ND)
    Em=q*ND*xn/es
    return V0,W,xn,xp,Em
print(junction(1e16,1e16,0))
print(junction(1e17,1e15,0))
V0,W,xn,xp,Em=junction(1e16,1e16,0); A=1e-4
print('Cj0 pF',es*A/W*1e12)
for V in (-5,-10): V0,W,_,_,_=junction(1e16,1e16,V); print(V,'W',W*1e4,'um','C',es*A/W*1e12)
# Is
Dp=450*VT; Dn=1150*VT; tau=1e-6
Lp=np.sqrt(Dp*tau); Ln=np.sqrt(Dn*tau)
Is=q*A*ni**2*(Dp/(Lp*1e16)+Dn/(Ln*1e16)); print('Is',Is)
for V in (0.5,0.6,0.7): print(V,Is*(np.exp(V/VT)-1))
print('decada',VT*np.log(10))
print('dVdT',(0.65-1.2)/300)
for N in (1e15,1e16,1e17,1e18): print('VBR',N,60*(1.12/1.1)**1.5*(N/1e16)**(-0.75))
print('Cd 4007',3e-6*10e-3/VT,'Cd 4148',4e-9*10e-3/VT)
# Cj(V) varicap
print('LC f',1/(2*np.pi*np.sqrt(100e-6*40e-12)))
