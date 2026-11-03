# Circuitos Vivos — Electrónica, Arduino y ESP32 para el colegio

Pedido 2026-11-02: «Crear un curso con simulaciones, con el mismo estilo de cursos anteriores, pero que tenga la elaboración de proyectos en Arduino y ESP32, para estudiantes de colegio. Desde lo más básico que es conocer los elementos hasta la creación de proyectos con el paso a paso y las simulaciones. Simular también cortocircuitos o fallos. Uso de protoboard, multímetro. Proyectos de física, de aplicaciones, de uso de módulos de comunicación. Todo con detalle. Llamar a las habilidades de diseño de simulación para que se vea real.»

Arquitectura base: ConCode/moderna (namespace EM, shell.html, styles.css, 00-base, 10-ui [Sim], 20-plot, 90-app, build.js, tools/shot.js+probe.js). Almacenamiento `cv:`. Acento cobre #B4540A (oscuro #F2A65A) — a decidir al estilizar.
Salida: `node build.js` → dist/index.html, dist/circuitos-vivos.html (fragmento para artefacto), dist/Circuitos-Vivos.html.
Autor: Mg. Manuel Alejandro Obando — Depto. de Física, Universidad del Cauca (crédito en portada/pie).
Público: estudiantes de colegio (grados 8–11): lenguaje sencillo, mucha imagen, cero matemáticas pesadas; las fórmulas mínimas (Ohm, potencia, divisor) con ejemplos resueltos. Cada capítulo: lead, secciones, simulaciones, «Práctica paso a paso», «Si algo sale mal», problemas con solución paso a paso (`<details class="sol">`).

## Motor (núcleo sin DOM, probado en Node)
- `30-spice.js` EM.spice: solver MNA (R, V con resistencia interna, I, interruptor, diodo/LED/Zener con Newton + pnjlim, C/L en transitorio trapezoidal, BJT Ebers–Moll NPN/PNP, MOSFET N nivel 1, fusible, pot, LDR, NTC); análisis de fallos (sobrecorriente, potencia, polaridad, cortocircuito) con estados «muerto».
- `31-bb.js` EM.bb: geometría real de la protoboard (mm, paso 2.54), conectividad por tiras y rieles, escena → netlist (partes en agujeros, cables, pines de placas/módulos).
- `32-ino.js` EM.ino: traductor del subconjunto C/C++ de Arduino a generadores JS (tipos con desbordamiento AVR 16 bit / ESP32 32 bit, delay/millis, Serial, arreglos, funciones, #define, for/while/if/switch) + tiempo virtual.
- `33-mcu.js` EM.mcu: placas (UNO, Nano, ESP32 DevKit) con mapa de pines, modelo eléctrico de pines (Rout), ADC, PWM promediado, periféricos (Servo, LCD I2C, DHT, HC-SR04, buzzer, etc.).
- Render: `40-draw-*.js` (piezas realistas en lienzo 2D, protoboard, placas, multímetro, humo/fuego/brillo), `45-lab.js` (EM.Lab: banco virtual — escena + código editable + monitor serie + multímetro + fallos).

## Capítulos (id · título) — plan
Parte I · Los elementos
1 electricidad · Electricidad sin miedo: carga, voltaje, corriente, resistencia
2 componentes · Conociendo los componentes (catálogo)
3 protoboard · La protoboard: cómo se conecta por dentro
4 multimetro · El multímetro: medir voltaje, corriente, resistencia y continuidad
5 circuitos · Serie, paralelo, divisor de voltaje y Kirchhoff
6 fallos · Cortocircuitos y fallos: ver para evitar
7 activos · Condensadores, diodos y transistores en acción
Parte II · Arduino y ESP32
8 placas · Las placas: UNO, Nano y ESP32 (pines, 5 V y 3,3 V, límites)
9 primer · El primer sketch y el simulador de código
10 salidas · Salidas digitales: LED, secuencias, semáforo
11 entradas · Entradas digitales: pulsadores, pull-up, rebote
12 analogicas · Entradas analógicas: ADC, potenciómetro, LDR
13 pwm · PWM: brillo, servo, motor y sonido
14 serial · Comunicación serie y depuración
15 tiempo · Tiempo sin bloqueo: millis y máquinas de estados
Parte III · Sensores y actuadores
16 temperatura · Temperatura y humedad (NTC, LM35, DHT)
17 distancia · Ultrasonido y distancia (HC-SR04), IR
18 potencia · Motores, relés y transistores (diodo de rueda libre, puente H)
19 pantallas · Pantallas (LCD I2C, OLED, 7 segmentos)
Parte IV · Comunicación y módulos
20 protocolos · UART, I²C y SPI (analizador lógico)
21 bluetooth · Bluetooth (HC-05) y BLE con ESP32
22 wifi · WiFi con ESP32: servidor web, cliente, MQTT
23 radio · RFID, IR, nRF24/LoRa
24 energia · Alimentación: pilas, reguladores, consumo y sueño profundo
Parte V · Proyectos de física
25 caida · Caída libre con fotopuertas
26 pendulo · El péndulo y su periodo
27 enfriamiento · Ley de enfriamiento de Newton
28 sonido · Velocidad del sonido
29 rc · Carga y descarga de un condensador
30 balanza · Balanza con celda de carga y acelerómetro
Parte VI · Proyectos de aplicación
31 semaforo · Semáforo inteligente y alarma
32 estacion · Estación meteorológica IoT
33 riego · Riego automático y domótica
34 robot · Robot evasor / seguidor de línea
35 final · Proyecto final: método, documentación y depuración
Apéndices: 97 formulario/pinouts · 98 validación · 99 bibliografía; portada 00-inicio.
(El número y orden pueden ajustarse; actualizar aquí.)

## Procedimiento por capítulo
HTML con Write (no heredocs largos), `src/chapters/NN-id.html` + `NN-id.js` (`EM.defineSim`). Verificar con `node tools/shot.js check [ids]` y capturas. Cifras de problemas con python en tests/caps/capNN.py. Orden de validación: `python tests/referencias.py` → `python tests/problemas.py` → `node tests/validar.js` → `node build.js`.

## Estado
- 2026-11-02: carpeta creada desde moderna (shell, estilos, base, ui, plot, app, build, tools). Siguiente: motor (spice → bb → ino → mcu → render → lab).
- 2026-11-02 (tarde): MOTOR LISTO y probado en el navegador: 30-spice (79 pruebas vs SciPy/NumPy OK), 31-bb, 32-parts, 33-bench (CC/CV, PTC, daños, multímetro V/A/R/continuidad/diodo), 34-ino (traductor; falta val34), 35-mcu (UNO/Nano/ESP32, Serial, Servo, LCD I2C, DHT, HC-SR04, Wire scanner), dibujo 40–44, Lab 45 (escena realista, multímetro con puntas arrastrables, código editable con resaltado, monitor serie, fallas, scope, edición, esquema). Probado con 00-inicio y 01-electricidad (provisionales: reescribir). Siguiente: capítulos 1–7 (Parte I), luego tests val31/34/35.
- API Lab cfg: scene (objeto con boards/mcus/parts/wires/sch/env/meters) | code | meter:{mode} meterAt | controls:[{type:slider|seg|select|check|button, id,label,apply(lab,v,scene)}] | faults:[{id,label,apply(scene,lab),revert}] | outs:[{id,label,fn(lab)}] | scope:{channels:[{ref|fn,label}],span,ymin,ymax} | edit:{tray:[...],goal(lab)→{ok,msg}} | world:(lab)=>({dt,update(us,mcu)}) | view:'sch' | aspect | speeds | hint | sound | volt | labels.
- Escena abreviada: pines 'e5'→'bb:e5', '@D13'→'uno:D13'; mcu `{id:'uno',kind:'uno'|'nano'|'esp32',x,y,plug?:{col}}`; módulos con pines en fila (dir:'down' invierte) o fuera de la placa con `at:[x,y]`.
- Lección: NO usar heredocs bash con Python que contenga comillas/regex; escribir tools/patchNN.py con Write.
- 2026-11-02 (noche): PARTE I COMPLETA (caps 1–7: electricidad, componentes, protoboard, multimetro, circuitos, fallos, activos; 35 sims, build OK, `node tools/shot.js check` sin errores). Escritos tests/refs/ref34.py y tests/val/val34.js (traductor C vs evaluador de enteros) pero AÚN NO EJECUTADOS: correr `python tests/referencias.py && node tests/validar.js` y corregir (p. ej. arith() de 'ushort' en AVR debe promover a 'uint').
- PENDIENTE: cifras de caps 1–7 sin tests/caps/capNN.py; Parte II (8 placas … 15 tiempo), III (16–19), IV (20–24), V (25–30), VI (31–35), apéndices, portada real (00-inicio es provisional), val31/35 (bb, mcu), artefacto y memoria final.
- Ya soportado por el motor para Parte II+: UNO/Nano/ESP32, Serial, Servo, LCD I2C, DHT, HC-SR04 (pulseIn), Wire scanner, PWM, ADC, interrupciones, mundo físico (cfg.world), scope, edición. Falta: Lab de BT/WiFi (stubs mínimos en 35-mcu), pantalla OLED, plotter serie.
- 2026-11-03: val34 OK (499 pruebas). PARTE II COMPLETA: caps 8 placas, 9 primer, 10 salidas, 11 entradas, 12 analogicas, 13 pwm, 14 serial, 15 tiempo (55 sims). Helpers de escenas EM.cv (08-placas.js). Plan reducido: 16 temperatura, 17 distancia, 18 potencia, 19 pantallas, 20 protocolos, 21 inalambrica, 22 caida, 23 pendulo, 24 enfriamiento, 25 sonido, 26 alarma, 27 estacion, 28 final + apéndices 97/98/99.
- 2026-11-03 (tarde): caps 16 temperatura, 17 distancia, 18 potencia, 19 pantallas, 20 protocolos, 21 inalambrica hechos (66 sims). Motor: WebServer/BluetoothSerial en mcu, Lab.web/bt, escáner I2C, DHT. Siguiente: Parte V física (22 caída libre fotopuertas, 23 péndulo, 24 enfriamiento, 25 sonido), VI (26 alarma, 27 estación, 28 final), apéndices 97/98/99, portada, tests de cifras.
- 2026-11-03 (noche): CURSO COMPLETO. Caps 22 caída, 23 péndulo, 24 enfriamiento, 25 sonido, 26 alarma (PIR + máquina de estados), 27 estación (ESP32 + DHT11 + LCD + servidor web), 28 final (taller de depuración con 5 fallas + rúbrica); apéndices A formulario/pinouts, B validación, C bibliografía; portada real. 73 simulaciones, 28 caps. Pruebas: 755 (499 del motor + 256 cifras de problemas, tests/caps/cap*.py); `node tools/shot.js check` (escritorio, --mobile, --dark) sin errores. Herramienta nueva: tools/probe2.js (pasos: set/btn/speed/wait/web/out; SHOT=ruta.png) y tools/probs.py (lista problemas de un capítulo).
- Pendiente (opcional): val31/val35 (bb, mcu), probar con piezas reales las prácticas «Para hacerlo con piezas reales».
