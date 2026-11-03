# Cap. 15: espín y estructura fina — diagonalización numérica del hamiltoniano completo de un estado p (6×6), Dirac exacto con mpmath, constantes de scipy
muB = C.physical_constants['Bohr magneton'][0]
# operadores de momento angular l = 1 y s = 1/2 (numpy), base |m_l, m_s> con m_l = 1, 0, −1 y m_s = ↑, ↓
def jmat(j):
    ms = np.arange(j, -j-1, -1); n = len(ms); Jz = np.diag(ms); Jp = np.zeros((n, n))
    for i in range(1, n): Jp[i-1, i] = math.sqrt(j*(j+1)-ms[i]*(ms[i]+1))
    return Jz, Jp, Jp.T
Lz, Lp, Lm = jmat(1.0); sz, sp_, sm_ = jmat(0.5)
I3, I2 = np.eye(3), np.eye(2)
LzT, SzT = np.kron(Lz, I2), np.kron(I3, sz)
LS = np.kron(Lz, sz) + 0.5*(np.kron(Lp, sm_) + np.kron(Lm, sp_))
def p_levels(A, B):
    H = A*LS + muB*B*(LzT + 2*SzT); return np.sort(np.linalg.eigvalsh(H))
ref['p6'] = []
for (A, B) in ((1.4213e-3*1.602176634e-19, 0.0), (1.4213e-3*1.602176634e-19, 0.5), (1.4213e-3*1.602176634e-19, 5.0), (1.4213e-3*1.602176634e-19, 40.0), (3.0e-5*1.602176634e-19, 1.0)):
    ref['p6'].append(dict(A=A, B=B, E=[float(v) for v in p_levels(A, B)]))
# pendientes a campo débil: g_J m_J a partir de la diferencia finita de los autovalores
A0 = 1.4213e-3*1.602176634e-19; dB = 1e-4
ev0 = p_levels(A0, 0.0); evB = np.linalg.eigvalsh(A0*LS + muB*dB*(LzT+2*SzT))
ref['weak_slopes'] = sorted([float((v-w)/(muB*dB)) for v, w in zip(evB, ev0)])
# Dirac exacto con mpmath (30 dígitos): E/mc² para el hidrógeno
import mpmath as mpm
mpm.mp.dps = 30; al = mpm.mpf('7.2973525693e-3')
def dirac_mp(n, j):
    j = mpm.mpf(j); g = mpm.sqrt((j+mpm.mpf(1)/2)**2-al**2); return float(1/mpm.sqrt(1+al**2/(n-(j+mpm.mpf(1)/2)+g)**2))
ref['dirac'] = [dict(n=n, j=j, E=dirac_mp(n, j)) for (n, j) in ((1, 0.5), (2, 0.5), (2, 1.5), (3, 1.5), (3, 2.5), (4, 3.5))]
# constantes
ref['consts'] = dict(muB=muB, muB_eVT=C.physical_constants['Bohr magneton in eV/T'][0], muB_Hz=C.physical_constants['Bohr magneton in Hz/T'][0], muN=C.physical_constants['nuclear magneton'][0],
                     g_e=-C.physical_constants['electron g factor'][0], gamma_p=C.physical_constants['proton gyromag. ratio in MHz/T'][0], gamma_n=C.physical_constants['neutron gyromag. ratio in MHz/T'][0] if 'neutron gyromag. ratio in MHz/T' in C.physical_constants else None,
                     gamma_e=C.physical_constants['electron gyromag. ratio in MHz/T'][0], gamma_d=C.physical_constants['deuteron gyromag. ratio in MHz/T'][0] if 'deuteron gyromag. ratio in MHz/T' in C.physical_constants else None, gamma_mu=C.physical_constants['muon gyromag. ratio in MHz/T'][0] if 'muon gyromag. ratio in MHz/T' in C.physical_constants else None)
ref['hf_exp'] = 1420.405751768e6
