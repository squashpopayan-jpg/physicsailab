import numpy as np
k=8.617333262e-5; q=1.602176634e-19
def ni(T,Eg,n300): return n300*(T/300)**1.5*np.exp(Eg/(2*k)*(1/300-1/T))
for nm,Eg,n3 in (('Si',1.12,1e10),('Ge',0.66,2.4e13),('GaAs',1.42,2.1e6)):
    print(nm,[f'{ni(T,Eg,n3):.3g}' for T in (250,300,350,400,500)])
VT=k*300
n=1e16; ni0=1e10; p=ni0**2/n
print('p',p,'EF-Ei',VT*np.log(n/ni0),'EF-Ei p-type 1e16',-VT*np.log(1e16/ni0))
def mu(N,mmin,mmax,Nr,a): return mmin+(mmax-mmin)/(1+(N/Nr)**a)
mn=lambda N: mu(N,65,1417,8.5e16,0.72); mp=lambda N: mu(N,48,470,1.3e17,0.76)
for N in (1e14,1e15,1e16,1e17,1e18,1e19):
    print(N,'mun',mn(N),'mup',mp(N),'rho_n',1/(q*N*mn(N)),'rho_p',1/(q*N*mp(N)))
print('rho int',1/(q*1e10*(1417+470)), 1/(q*1e10*(1350+480)))
print('vd',1350*100,'D',1350*VT,'L',np.sqrt(1350*VT*1e-6)*1e4,'um')
# temperatura en que n intrinseco iguala ND=1e16 en Si
from scipy.optimize import brentq
print('T intr',brentq(lambda T: ni(T,1.12,1e10)-1e16,300,2000))
print('ni 350/300',ni(350,1.12,1e10)/1e10)
# resistividad: 1 ohm cm tipo n
from scipy.optimize import brentq
print('N for 1 ohm cm n',brentq(lambda N: 1/(q*N*mn(N))-1,1e13,1e19))
