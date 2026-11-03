# Cap. 18: moléculas — integrales de H₂⁺ por cuadratura en coordenadas esferoidales prolatas (SciPy), rotovibración de Morse por diagonalización numérica, sumas de partición (NumPy)
from scipy.integrate import dblquad
from scipy.linalg import eigh_tridiagonal, eigh as eigh_gen
# --- H₂⁺ LCAO: S, j, k, E± por integración numérica 2D (ξ ∈ [1,∞), η ∈ [−1,1]) y problema generalizado 2×2 ---
def h2p_numeric(R):
    f = lambda eta, xi, g: (R/2)**3*(xi**2-eta**2)*2*math.pi*g(xi, eta)
    rA = lambda xi, eta: R/2*(xi+eta); rB = lambda xi, eta: R/2*(xi-eta)
    phiA = lambda xi, eta: math.exp(-rA(xi, eta))/math.sqrt(math.pi); phiB = lambda xi, eta: math.exp(-rB(xi, eta))/math.sqrt(math.pi)
    I = lambda g: dblquad(lambda eta, xi: f(eta, xi, g), 1, 60, -1, 1, epsabs=1e-12, epsrel=1e-12)[0]
    S = I(lambda x, e: phiA(x, e)*phiB(x, e)); j = I(lambda x, e: phiA(x, e)**2/rB(x, e)); k = I(lambda x, e: phiA(x, e)*phiB(x, e)/rA(x, e))
    # hamiltoniano electrónico H = −∇²/2 − 1/r_A − 1/r_B; ⟨A|H|A⟩ = −1/2 − j; ⟨A|H|B⟩ = −S/2 − k (propiedad de autofunción de φ_B con −1/2∇²−1/r_B)
    HAA = -0.5-j; HAB = -0.5*S-k
    Ep = (HAA+HAB)/(1+S)+1/R; Em = (HAA-HAB)/(1-S)+1/R
    # comprobación por la ecuación generalizada con matrices
    Hm = np.array([[HAA, HAB], [HAB, HAA]]); Sm = np.array([[1, S], [S, 1]]); ev = eigh_gen(Hm, Sm, eigvals_only=True)+1/R
    return dict(R=R, S=S, j=j, k=k, Ep=float(ev[0]), Em=float(ev[1]))
ref['h2p'] = [h2p_numeric(R) for R in (1.0, 2.0, 2.5, 4.0, 6.0)]
# --- rovibración de Morse por diagonalización numérica ---
hbar = C.hbar; amu = C.atomic_mass; hcm = C.h*C.c*100
def Kcoef(mu): return hbar**2/(2*mu*amu)/hcm*1e20     # cm⁻¹ Å²
def morse_numeric(De, re, mu, we, vmax=2, Jmax=10, h_=4e-4, r0=0.25, rmax=5.0):
    Kc = Kcoef(mu); a = we/(2*math.sqrt(Kc*De)); N = int((rmax-r0)/h_); r = r0+h_*np.arange(1, N+1)
    out = {}
    for J in range(Jmax+1):
        V = De*(1-np.exp(-a*(r-re)))**2+Kc*J*(J+1)/r**2
        d = 2*Kc/h_**2+V; off = -Kc/h_**2*np.ones(N-1)
        ev = eigh_tridiagonal(d, off, select='i', select_range=(0, vmax), eigvals_only=True); out[J] = [float(x) for x in ev]
    return a, Kc, out
mu_HCl = (1.00782503223*34.968852682)/(1.00782503223+34.968852682)
a_, K_, lev = morse_numeric(37270.0, 1.2746, mu_HCl, 2990.946)
ref['morse'] = dict(De=37270.0, re=1.2746, mu=mu_HCl, we=2990.946, a=a_, K=K_, lev={str(J): v for J, v in lev.items()})
# --- poblaciones térmicas y fracción de ortohidrógeno por sumas directas ---
def part(B, T, ns=(1, 1)): return sum(ns[J % 2]*(2*J+1)*math.exp(-B*hcm*J*(J+1)/(C.k*T)) for J in range(0, 300))
ref['part'] = [dict(B=B, T=T, Z=part(B, T), Zh2=part(B, T, (1, 3)), Jmax=int(max(range(0, 100), key=lambda J: (2*J+1)*math.exp(-B*hcm*J*(J+1)/(C.k*T))))) for (B, T) in ((1.9313, 300), (1.9313, 77), (60.853, 300), (10.5934, 300), (1.99824, 298.15))]
ref['ortho'] = [dict(T=T, f=sum(3*(2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(C.k*T)) for J in range(1, 200, 2))/sum((1 if J % 2 == 0 else 3)*(2*J+1)*math.exp(-60.853*hcm*J*(J+1)/(C.k*T)) for J in range(0, 200))) for T in (20, 77, 150, 300, 1000)]
# --- B desde las masas isotópicas (periodictable) ---
import periodictable as pt
def mu_iso(el1, a1, el2, a2):
    m1 = pt.elements.isotope(f'{a1}-{el1}' if False else el1).isotopes if False else getattr(pt, el1)[a1].mass; m2 = getattr(pt, el2)[a2].mass; return m1*m2/(m1+m2)
ref['mu'] = dict(CO12=mu_iso('C', 12, 'O', 16), CO13=mu_iso('C', 13, 'O', 16), H2=mu_iso('H', 1, 'H', 1), D2=mu_iso('D', 2, 'D', 2) if False else 2.01410177812/2, N2=mu_iso('N', 14, 'N', 14), HCl=mu_iso('H', 1, 'Cl', 35))
