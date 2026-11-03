import math, scipy.constants as C, periodictable as pt
from scipy.optimize import minimize_scalar
h,c,kB,e=C.h,C.c,C.k,C.e; HA=27.211386245988; amu=C.atomic_mass; hcm=h*c*100
S=lambda R: math.exp(-R)*(1+R+R*R/3); j=lambda R:1/R-math.exp(-2*R)*(1+1/R); k=lambda R: math.exp(-R)*(1+R)
Ep=lambda R:-0.5+1/R-(j(R)+k(R))/(1+S(R)); Em=lambda R:-0.5+1/R-(j(R)-k(R))/(1-S(R))
r=minimize_scalar(Ep,bounds=(1,5),method='bounded',options=dict(xatol=1e-10)); print('Re',r.x,'Re A',r.x*0.529177210903,'E',r.fun,'De eV',(-0.5-r.fun)*HA)
for R in (2.0,): print('R=2',S(R),j(R),k(R),Ep(R),Em(R),(Ep(R)+0.5)*HA,(Em(R)+0.5)*HA, 'exact',-0.602634)
print('Em at R=2 eV rel',(Em(2)+0.5)*HA)
print('D0 H2 eV',36118.0696/8065.544, 'De',38297.2/8065.544)
mu=pt.C[12].mass*pt.O[16].mass/(pt.C[12].mass+pt.O[16].mass); I=mu*amu*(1.1283e-10)**2; B=h/(8*math.pi**2*c*I)/100
print('mu CO',mu,'I',I,'B',B,'2B GHz',2*B*c/1e7, 'B0 line GHz',2*1.92253*c/1e7)
B0=1.92253; kT=kB*300/hcm; print('kT cm-1',kT,'Jmax',math.sqrt(kT/(2*B0))-.5)
Z=sum((2*J+1)*math.exp(-B0*J*(J+1)/kT) for J in range(300)); print('Z',Z,'kT/B',kT/B0)
pop=[(2*J+1)*math.exp(-B0*J*(J+1)/kT)/Z for J in range(30)]; print('Jmax actual',max(range(30),key=lambda J:pop[J]),'pop',max(pop),pop[0],pop[1])
def ortho(T): 
    o=sum(3*(2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(kB*T)) for J in range(1,200,2)); p=sum((2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(kB*T)) for J in range(0,200,2)); return o/(o+p)
print('ortho',ortho(77),ortho(300),ortho(20))
m35=pt.H[1].mass*pt.Cl[35].mass/(pt.H[1].mass+pt.Cl[35].mass); m37=pt.H[1].mass*pt.Cl[37].mass/(pt.H[1].mass+pt.Cl[37].mass)
nu0=2990.946-2*52.8186; print('mu35,37',m35,m37,'shift',nu0*(1-math.sqrt(m35/m37)), 'ratio',math.sqrt(m35/m37))
we=2990.946;wx=52.8186;Be=10.5934;al=0.30718
F=lambda v,J:(Be-al*(v+.5))*J*(J+1)-5.319e-4*J*J*(J+1)**2
G=lambda v:we*(v+.5)-wx*(v+.5)**2
R0=G(1)-G(0)+F(1,1)-F(0,0); P1=G(1)-G(0)+F(1,0)-F(0,1); R1=G(1)-G(0)+F(1,2)-F(0,1); print('HCl',nu0,R0,P1,R0-P1,R1-R0,4*Be, 'meas R0 2906.25 P1 2865.09')
# N2 Raman
muN=pt.N[14].mass/2; B0=1.98957; rr=math.sqrt(h/(8*math.pi**2*c*muN*amu*B0*100))*1e10; print('N2 r0 A',rr,'6B',6*B0,'4B',4*B0,'stokes',[B0*(4*J+6) for J in range(4)])
kT=kB*298.15/hcm
w=lambda J,ns:ns[J%2]*(2*J+1)*math.exp(-B0*J*(J+1)/kT)
Zn=sum(w(J,(6,3)) for J in range(100)); pt_=lambda J:3*(J+1)*(J+2)/(2*(2*J+1)*(2*J+3))
I0=w(0,(6,3))/Zn*pt_(0); I1=w(1,(6,3))/Zn*pt_(1); I2=w(2,(6,3))/Zn*pt_(2); print('I0/I1',I0/I1,'I2/I1',I2/I1,'w0/w1',w(0,(6,3))/w(1,(6,3)),pt_(0),pt_(1))
