# -*- coding: utf-8 -*-
# Capítulo 1: éter, Michelson–Morley, reloj de luz, simultaneidad
g = lambda b: 1/math.sqrt(1-b*b)
b0 = 29.78e3/c
chk(1, 'Ej. MM: β = v/c (10⁻⁵)', b0/1e-5, '9.9335') if False else chk(1, 'Ej. MM: β (10⁻⁵)', b0*1e5, '9.9335')
chk(1, 'Ej. MM: β² (10⁻⁹)', b0**2*1e9, '9.8675')
chk(1, 'Ej. MM: ΔN = 2Lβ²/λ', 2*11*b0**2/550e-9, '0.395'); chk(1, 'P1: ΔN (4 cifras)', 2*11*b0**2/550e-9, '0.3947')
chk(1, 'Ej. MM: ΔN con la velocidad del Sol respecto del CMB (369.8 km/s)', 2*11*(369.8e3/c)**2/550e-9, '60.9')
chk(1, 'Sim MM: amplitud ±ΔN/2', 2*11*b0**2/550e-9/2, '0.197')
bb = math.sqrt(0.01*550e-9/(2*11))
chk(1, 'P1: β máximo (10⁻⁵)', bb*1e5, '1.5811'); chk(1, 'P1: v máxima (km/s)', bb*c/1e3, '4.740'); chk(1, 'P1: fracción de la velocidad orbital (%)', bb*c/29.78e3*100, '15.9')
chk(1, 'Sim MM: v < 4.74 km/s', bb*c/1e3, '4.74')
# reloj de luz
T0 = 2*0.30/c
chk(1, 'Ej. reloj: T₀ (ns)', T0*1e9, '2.0014'); chk(1, 'Ej. reloj: γ(0.6)', g(0.6), '1.25'); chk(1, 'Ej. reloj: T(0.6) (ns)', g(0.6)*T0*1e9, '2.5017')
chk(1, 'Ej. reloj: cT (m) a β=0.6', c*g(0.6)*T0, '0.7500'); chk(1, 'Ej. reloj: vT (m) a β=0.6', 0.6*c*g(0.6)*T0, '0.4500')
chk(1, 'Ej. reloj: γ(0.99)', g(0.99), '7.0888'); chk(1, 'Ej. reloj: T(0.99) (ns)', g(0.99)*T0*1e9, '14.187')
chk(1, 'Sim reloj: vT a β=0.99 (m)', 0.99*c*g(0.99)*T0, '4.21')
chk(1, 'Sim reloj: vT/(2L) = βγ a 0.99', 0.99*g(0.99), '7.0', 0.01)
# tren
Lp = 200/g(0.6)
chk(1, 'Ej. tren: L (m)', Lp, '160'); chk(1, 'Ej. tren: t′ de A (10⁻⁷ s)', g(0.6)*0.6*80/c*1e7, '2.0014'); chk(1, 'Ej. tren: Δt′ (10⁻⁷ s)', g(0.6)*0.6*Lp/c*1e7, '4.0028')
chk(1, 'Ej. tren: Δt′ (ns)', g(0.6)*0.6*Lp/c*1e9, '400.3'); chk(1, 'Ej. tren: vL₀/c² coincide con γvL/c²', 0.6*200/c, g(0.6)*0.6*Lp/c, 1e-12)
chk(1, 'Ej. tren: c Δt′ (m)', g(0.6)*0.6*Lp, '120'); chk(1, 'Ej. tren: intervalo en S′ (m²)', 120**2-200**2, '-25600') if False else chk(1, 'Ej. tren: intervalo (m²)', (g(0.6)*0.6*Lp)**2-200**2, -25600, 1e-12)
chk(1, 'P3: Δx′ = γΔx (m)', g(0.6)*Lp, '200')
chk(1, 'Sim tren: β=0.95, L (m)', 200/g(0.95), '62.45'); chk(1, 'Sim tren: β=0.95, Δt′ (ns)', 0.95*200/c*1e9, '633.8')
chk(1, 'Ej. tren cotidiano: vL₀/c² para 100 km/h y 200 m (10⁻¹⁴ s)', (100/3.6)*200/c**2*1e14, '6.2')
# P4: término cruzado de la ecuación de ondas bajo Galileo (SymPy)
xp, tp, vv, cc = sp.symbols("xp tp v c", positive=True); f = sp.Function('f')
psi = f(xp, tp)
dx = lambda F: sp.diff(F, xp); dt = lambda F: sp.diff(F, tp) - vv*sp.diff(F, xp)
expr = sp.expand(dx(dx(psi)) - dt(dt(psi))/cc**2)
cross = sum(expr.coeff(d) for d in (sp.Derivative(f(xp, tp), xp, tp), sp.Derivative(f(xp, tp), tp, xp))); chk(1, 'P4: coeficiente cruzado ∂x′∂t′ (SymPy), con v=0.5, c=1', cross.subs({vv: 0.5, cc: 1}), 1.0, 1e-12)
chk(1, 'P4: coeficiente de ∂²x′ = 1 − v²/c² (SymPy), v=0.5, c=1', expr.coeff(sp.Derivative(f(xp, tp), (xp, 2))).subs({vv: 0.5, cc: 1}), 0.75, 1e-12)
chk(1, 'P4: velocidad de la luz hacia +x desde S′ (c−v)/c', (1-0.5), '0.5'); chk(1, 'P4: velocidad hacia −x', (1+0.5), '1.5'); chk(1, 'P4: razón', 1.5/0.5, '3')
# P5: exacto
b = 0.1; d = 2*(1/(1-b*b)-1/math.sqrt(1-b*b))
chk(1, 'P5: 1/(1−β²)', 1/(1-b*b), '1.010101'); chk(1, 'P5: 1/√(1−β²)', 1/math.sqrt(1-b*b), '1.005038'); chk(1, 'P5: diferencia exacta (m)', d, '0.010126')
chk(1, 'P5: error relativo (%)', (d/b**2-1)*100, '1.26'); chk(1, 'P5: 5β²/4 (%)', 1.25*b*b*100, '1.25')
sx = sp.symbols('x'); ser = sp.series(1/(1-sx)-1/sp.sqrt(1-sx), sx, 0, 3).removeO(); chk(1, 'P5: coeficiente de x² en el desarrollo (SymPy) = 5/8', ser.coeff(sx, 2), 5/8, 1e-12)
# P6
chk(1, 'P6: ΔN a β=10⁻³', 2*1*1e-6/632.8e-9, '3.16'); bm = math.sqrt(1e-3*632.8e-9/2)
chk(1, 'P6: β mínimo (10⁻⁵)', bm*1e5, '1.7788'); chk(1, 'P6: v mínima (km/s)', bm*c/1e3, '5.33')
