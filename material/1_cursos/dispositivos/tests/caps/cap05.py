import numpy as np
e0=8.8541878128e-12
A=0.01; d=1e-3
print('C air',e0*A/d,'er4.7',4.7*e0*A/d)
print('W 100uF 12V',0.5*100e-6*144)
print('series',1/(1/10+1/22),'par',32,'V1',12*22/32)
print('i',10e-6*5/1e-3)
print('SRF 100nF 1.5nH',1/(2*np.pi*np.sqrt(1.5e-9*100e-9)))
print('SRF 1000uF 12nH',1/(2*np.pi*np.sqrt(12e-9*1e-3)))
print('esr 1000uF',0.35/np.sqrt(1000),'esr 100uF',0.35/np.sqrt(100))
# carga RC: tiempo a 90% y 99%
print(-np.log(0.1),-np.log(0.01))
# energia cond 1 F 2.7 V
print('supercap',0.5*1*2.7**2, 'tiempo con 100mA:',1*(2.7-1.0)/0.1)
# E campo
print('E',12/1e-3,'rigidez aire 3e6')
# flash
print('flash 100uF 330V',0.5*100e-6*330**2)
# Z at 100kHz of 100uF elec with ESR .035, ESL 12nH
f=1e5; w=2*np.pi*f
for C,esr,esl in ((100e-6,0.035,12e-9),(100e-9,0.03,1.5e-9)):
    Z=esr+1j*w*esl+1/(1j*w*C); print(C,abs(Z))
# xc a 1kHz 1uF
print('Xc',1/(2*np.pi*1e3*1e-6))
# ripple IC: 2 A, C 4700uF, f=120 -> dV
print('rizado', 1/(120*4700e-6))
