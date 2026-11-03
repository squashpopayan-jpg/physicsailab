# Riel de aire · laboratorio 3D de mecánica

Animación 3D de un carrito sobre un riel de aire con fotocompuertas. Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Archivos

- `dist/Riel_de_Aire.html`: archivo único (≈700 KB, incluye Three.js r149). Se abre con doble clic y funciona sin conexión; sin internet usa fuentes del sistema.
- `dist/riel-artefacto.html`: el mismo contenido preparado para publicarlo como artefacto.
- `src/engine.js`: física (sin DOM, se prueba en Node). Define `C` (constantes del equipo), `CTL` (controles) y `MONTAJES`.
- `src/scene.js`: escena Three.js (laboratorio, riel, carritos, compuertas, polea, hilo, vectores, cámara).
- `src/app.js`: interfaz, gráficas en tiempo real, tabla de fotocompuertas, resultados, sonido.
- `test/engine.test.js`: 48 pruebas del motor contra las fórmulas analíticas.

```bash
node build.js
node test/engine.test.js
node tools/shot.js shots/x.png --wait 3000 [--mobile] [--dark] [--seq tools/seq3.json]
```

## Montajes

| Montaje | Qué se estudia | Elementos propios |
|---|---|---|
| Segunda ley | a = m·g/(M+m) con una masa colgante | polea, hilo, percha con masas ranuradas, bandeja de espuma |
| Dos carritos | tensión entre carritos, a = m·g/(MA+MB+m) | hilo entre carritos que puede aflojarse |
| Plano inclinado | a = g·sen θ, independiente de M | bloques patrón bajo el soporte, el riel gira de verdad |
| Choque elástico | ímpetu, energía, coeficiente de restitución | topes magnéticos |
| Choque inelástico | ΔK en un choque perfectamente inelástico | velcro, los carritos quedan unidos |
| Retroceso | ímpetu total cero, reparto de energía | émbolos con resorte comprimido |
| Oscilador | T = 2π√(M/2k), v máxima en el centro | dos resortes helicoidales que se estiran |

## Qué se ve y qué se puede hacer

- **Vector velocidad** (verde azulado) y **vector aceleración** (naranja) sobre cada carrito, con etiqueta numérica.
- **Gráficas x(t) y v(t)** que se dibujan mientras corre la simulación, con la curva del modelo ideal (punteada), las lecturas de cada fotocompuerta (círculos), una línea en los sucesos (cae la masa, choque) y lectura al pasar el cursor. La misma gráfica x(t) aparece en la pantalla de la computadora dentro de la escena.
- **Deslizador de masa colgante** (5–200 g). Al moverlo la corrida se reinicia y se suelta sola; la corrida anterior queda en gris para comparar (hasta 3).
- **Fotocompuertas arrastrables** sobre el riel: se mueven con el ratón en la escena o con los deslizadores. El cronómetro 3D muestra Δt de cada puerta y el intervalo entre ambas.
- Cámaras: general, seguir carrito, fotocompuerta, polea y masa, desde arriba, lateral, equipos, pantalla. Se puede girar, acercar y desplazar libremente.
- Velocidad de la animación de 0,1× a 1×; atajos: Espacio (soltar / pausa) y R (reiniciar).
- Botón para copiar los datos de las puertas y el registro completo como CSV.

## Qué lo hace real

| En el laboratorio | En el simulador |
|---|---|
| Colchón de aire | Con el soplador apagado el carrito se arrastra (μ = 0,12 / 0,16) y en pendientes pequeñas no arranca; con él, arrastre viscoso |
| Polea | Disco de 12 g (6 g equivalentes) y roce de eje de 1,6 mN: la a medida queda 2–3 % bajo m·g/(M+m) |
| Turbulencia del soplador | Ruido correlacionado de ±3,5 mm/s² (proceso de Ornstein-Uhlenbeck) |
| Nivelación | Tornillo de ±0,3°; el riel se inclina de verdad en la escena |
| La masa llega al suelo | Cae sobre una bandeja, el hilo se afloja (se dibuja con comba) y el carrito sigue con v constante hasta el tope; si regresa, el hilo se tensa de golpe |
| Cronómetro | Resolución de 0,1 ms; v = ancho de la bandera ÷ tiempo que tapa el haz (velocidad media) |
| Aviso didáctico | Si G2 queda después del punto de caída, el panel lo advierte |
| g local | 9,775 m/s² (Popayán, 1760 m, 2,4° N) |

Las masas del carrito se ven como pesas de latón colgadas a los lados (25 g cada una), y la balanza de la mesa marca la masa actual.

## Validación

`node test/engine.test.js` comprueba: a = m·g/(M+m) y T del hilo (4 combinaciones), caída y velocidad al aterrizar, a = g·sen θ (6 casos), conservación de p y K en choques elásticos (masas iguales y distintas), velocidad final y energía perdida en el inelástico, retroceso con p = 0 y K = E, período y v máxima del oscilador (3 casos), carritos acoplados, cuantización del cronómetro, sin aire/con aire, rebotes y tope de 20 s.

Medida en la interfaz con los valores por defecto (m = 50 g, M = 200 g): teoría con polea 1,909 m/s², puertas 1,906, ajuste x(t) 1,899 m/s².

## Para cambiar el equipo

Edita `C` y `CTL` en `src/engine.js` (masa de la polea, roce, longitud del riel, rangos de los deslizadores) y recompila con `node build.js`.
