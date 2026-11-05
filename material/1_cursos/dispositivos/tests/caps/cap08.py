import numpy as np
L,C=10e-3,1e-6
w0=1/np.sqrt(L*C)
for R in (20,100,200,1000):
    z=R/2*np.sqrt(C/L); 
    ov=np.exp(-np.pi*z/np.sqrt(1-z*z)) if z<1 else 0
    print('R',R,'w0',w0,'f0',w0/2/np.pi,'zeta',z,'Q',1/(2*z),'ov',ov,'fd',w0*np.sqrt(max(1-z*z,0))/2/np.pi, 'ts2%',4/(z*w0))
print('Rc',2*np.sqrt(L/C))
# resonancia serie
R,L,C=10,10e-3,100e-9
f0=1/(2*np.pi*np.sqrt(L*C)); Q=np.sqrt(L/C)/R; print('f0',f0,'Q',Q,'BW',f0/Q)
# integrador
A,T,tau=1,1e-3,10e-3; print('p-p',A*T/(2*tau))
# 10-90
print('tr',2.2*1e-3)
# derivador RC=100us, entrada 5V flanco rapido: pico 5V decae
# parallel RLC: R=1k L=10mH C=100nF
Rp=1000; f0=1/(2*np.pi*np.sqrt(L*C)); Qp=Rp*np.sqrt(C/L); print('parallel Q',Qp,'BW',f0/Qp)
# amortiguamiento temporal: Q=31.6 decay envelope tau=2L/R
print('env tau',2*L/10)
