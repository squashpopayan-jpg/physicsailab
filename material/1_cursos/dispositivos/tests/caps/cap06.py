import numpy as np
mu0=4e-7*np.pi
N=100; l=0.05; d=0.01; A=np.pi*(d/2)**2
L=mu0*N*N*A/l; print('L aire',L,'ferrita 1000',L*1000)
print('B 1A aire',mu0*N*1/l,'ferr',1000*mu0*N*1/l)
print('W 10mH 2A',0.5*10e-3*4)
print('tau',100e-3/100,'Iinf',10/100)
print('spike',0.1*0.12/1e-6,'E',0.5*0.1*0.12**2)
print('X 1mH 10k',2*np.pi*1e4*1e-3)
print('Q',2*np.pi*1e6*100e-6/10)
M=0.9*np.sqrt(10e-3*40e-3); print('M',M,'aid',10e-3+40e-3+2*M,'opp',10e-3+40e-3-2*M)
print('skin 1MHz',66.1/np.sqrt(1e6),'mm; 60Hz',66.1/np.sqrt(60))
# RL with L=100mH R=100: t 90%
print('t90',np.log(10)*1e-3)
# energia: bobina 5 H 1A
print(0.5*5*1)
# induccion v=L di/dt: 10mH, 100mA in 1ms
print(10e-3*0.1/1e-3)
# reactancia 100 uH a 1 MHz
print(2*np.pi*1e6*100e-6)
# resonancia LC 10mH 100nF
print(1/(2*np.pi*np.sqrt(10e-3*100e-9)))
