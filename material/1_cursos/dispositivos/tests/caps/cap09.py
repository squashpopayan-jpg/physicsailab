import numpy as np
from scipy.optimize import brentq
# cascada de dos RC iguales cargado
def H2(w,tau): s=1j*w; return 1/(1+3*s*tau+(s*tau)**2)
def H1(w,tau): return 1/(1+1j*w*tau)
tau=1e3*100e-9; fc=1/(2*np.pi*tau)
w3=brentq(lambda w: abs(H2(w,tau))-1/np.sqrt(2),1,1e6); print('fc',fc,'cascada acoplada f3',w3/2/np.pi,w3*tau)
print('cascada aislada',fc*np.sqrt(2**0.5-1)*1, fc*np.sqrt(np.sqrt(2)-1))
# LC paso bajo: L=10mH,C=100nF: f0, Q con carga RL
L,C=10e-3,100e-9; f0=1/(2*np.pi*np.sqrt(L*C)); print('f0',f0)
for RL in (100,316.2,1000,1e4):
    print(RL,'Q',RL*np.sqrt(C/L))
print('Butterworth RL',np.sqrt(L/C/ (1/2)) , np.sqrt(2*L/C))
# twin-T
R,C=10e3,10e-9; print('twinT f0',1/(2*np.pi*R*C))
# pad T 6dB y 10 dB Z0=50
for dB in (6,10,20):
    k=10**(dB/20); R1=50*(k-1)/(k+1); R2=2*50*k/(k*k-1); print(dB,'T R1',R1,'R2',R2,'pi: R3',50*(k+1)/(k-1),'R4',50*(k*k-1)/(2*k))
# adaptacion L: 50 a 200 ohm a 10 MHz
Q=np.sqrt(200/50-1); XL=Q*50; XC=200/Q; print('Q',Q,'XL',XL,'XC',XC,'L',XL/(2*np.pi*10e6),'C',1/(2*np.pi*10e6*XC))
# crossover audio 2 vias 8 ohm: fc 3 kHz 1er orden
fc=3000; print('L',8/(2*np.pi*fc),'C',1/(2*np.pi*fc*8))
# anti alias RC fc 20 kHz R=1k
print('C',1/(2*np.pi*1e3*20e3))
# HP: R=10k C=100n fc
print('HP fc',1/(2*np.pi*1e4*100e-9))
# RC LP 2o orden Sallen no
