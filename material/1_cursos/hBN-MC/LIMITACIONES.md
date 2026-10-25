# Limitaciones conocidas y decisiones abiertas — hBN-MC v15.0.1

## Decisiones científicas pendientes

1. **Escala de ε_NB (D3).** ε_XN y ε_XB se derivaron con ε_NB = E(BN)/3
   = −128.9067 eV, pero el modelo usa el valor del ajuste, −128.1626 eV. La
   solución es un ajuste global único que incluya poros y nanocintas; la
   pestaña INV lo permite, pero faltan los datos DFT completos de los poros
   (las Tablas 5.3–5.6 de la tesis no son consistentes entre sí).
2. **ε_CH = −70.41 ± 0.40 eV es provisional.** No es un cálculo DFT. Debe
   sustituirse con el calibrador de nanocintas (AC-H y ZZ-H completamente
   pasivadas, misma configuración SIESTA que la Tabla 5.1).
3. **Reservorio de H.** El Hamiltoniano de la tesis (ε_XX = E(H₂)/2) da
   energía de borde por H negativa (−8.46 eV): sin la penalización empírica
   H–H los poros se fragmentan. Debe decidirse qué formulación se publica
   (se recomienda la gran canónica respecto de H₂ con Δμ_H explícito).
4. **Ventana química vacía** con las energías de la Tabla 5.1 para
   Δμ_H = 0. Revisar la convergencia de E(H₂) o trabajar con Δμ_H negativo.
5. **Penalización H–H** (K = 35 eV, reglas topológicas por forma): empírica,
   no procede del DFT y depende del clasificador de poros.

## Limitaciones del modelo

* Solo primeros vecinos, red rígida (sin relajación), sin curvatura ni
  sustrato, sin efectos de carga ni magnetismo.
* Las temperaturas de simulación no son temperaturas físicas (movimientos
  elementales de 6–20 eV).
* El clasificador de poros es geométrico (compacidad y razón de aspecto).
* Con geometrías importadas del constructor, la selección de pares locales
  reintenta hasta encontrar un par permitido; eso no conserva balance
  detallado exacto cuando el número de pares permitidos cambia con la
  configuración. En la red regular la propuesta es simétrica.

## Limitaciones de software

* La aplicación corre en el hilo principal del navegador; los barridos largos
  ceden el control periódicamente pero conviene no cambiar de pestaña.
* Los manuales del registro (descripción de programa y manual de usuario
  v15.0.1) se distribuyen en el paquete de registro; en el repositorio el
  manual vigente es `docs/MANUAL_USUARIO.md`.
* La pestaña INV y las notas nuevas del Paso 4 están solo en español (el
  resto de la interfaz conserva la traducción al inglés).
* Licencia: todos los derechos reservados; el titular puede adoptar una
  licencia abierta más adelante (ver `docs/REGISTRO_DNDA.md`).
