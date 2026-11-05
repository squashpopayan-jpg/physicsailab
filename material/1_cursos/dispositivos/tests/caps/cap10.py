import numpy as np
b=3950; r25=10e3
R=lambda T: r25*np.exp(b*(1/(T+273.15)-1/298.15))
for T in (0,25,50,100): print('NTC',T,R(T))
Vcc=5; Rf=10e3
for T in (0,25,50,100):
    print('Vout',T,Vcc*R(T)/(R(T)+Rf))
print('sens 25C',Vcc*b/298.15**2/4)
# beta from two points: R(0)=32.5k? 
T1,T2=273.15,323.15; R1,R2=R(0),R(50); print('beta',np.log(R1/R2)/(1/T1-1/T2))
# LDR
ldr=lambda lux: 20e3*(10/lux)**0.7
for l in (1,10,100,1000): print('LDR',l,ldr(l))
# MOV clamp
Vn,al=18,25; vs=Vn/al; I0=1e-3/np.sinh(al)
for I in (1e-3,0.1,2,20): print('MOV',I,vs*np.arcsinh(I/I0))
print('leak 12V',I0*np.sinh(12/vs))
# fusible
for x in (1.5,2,4,10): r=x*x; print('fuse',x,'fast',1/((r-1)*2.2),'slow',1/((r-1)*2.2*0.25))
# rele: pull-in .7*12, drop .2*12, corriente 12/400
print('rele',0.7*12,0.2*12,12/400)
# autocalentamiento NTC: 5mW * 40mW/K? 
print('sh',5e-3/1.5e-3)
# NTC en serie para linealizar: R_par?
