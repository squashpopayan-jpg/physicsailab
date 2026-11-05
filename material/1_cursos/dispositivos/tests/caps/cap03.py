import numpy as np
print('170V pk: vpp',2*170,'vrms',170/np.sqrt(2))
print('cuadrada 0-5, duty .25: rms',5*np.sqrt(.25),'mean',1.25)
R,C=10e3,10e-9
fc=1/(2*np.pi*R*C); f=5000
H=1/(1+1j*f/fc); print('fc',fc,'|H|',abs(H),'dB',20*np.log10(abs(H)),'fase',np.degrees(np.angle(H)))
f=159.155; w=2*np.pi*f; Z=1000+1/(1j*w*1e-6); print('Z',abs(Z),np.degrees(np.angle(Z)))
I=10/abs(Z); print('I',I,'VR',I*1000,'VC',I/(w*1e-6),'P',I**2*1000,'S',10*I)
# FP
S=120*2; print('S',S,'P',S*np.cos(np.radians(60)),'Q',S*np.sin(np.radians(60)))
# corregir a 0.95
P=120; phi1=np.radians(60); phi2=np.arccos(0.95); Qc=P*(np.tan(phi1)-np.tan(phi2)); Cc=Qc/(2*np.pi*60*120**2); print('Qc',Qc,'C',Cc*1e6,'uF')
# Fourier
A=1
print([4*A/(n*np.pi) for n in (1,3,5,7)], np.sqrt(np.pi**2/8-1))
# THD parcial hasta 9
a=[4/(n*np.pi) for n in (1,3,5,7,9)]; print('THD(9)',np.sqrt(sum(x**2 for x in a[1:]))/a[0])
# 20 dB/decada
for k in (0.1,1,10,100): print(k,20*np.log10(1/np.sqrt(1+k**2)),np.degrees(-np.arctan(k)))
# resolucion triangulo y sierra rms
print('tri rms',1/np.sqrt(3),'sine',1/np.sqrt(2))
