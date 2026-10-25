# Faro · pods de reacción

Pods de entrenamiento que se encienden en colores y responden al golpe, al toque y a la cercanía de la mano,
con carcasa impresa en 3D, electrónica de módulos (ESP32‑S3) y un hub que coordina los ejercicios.

Elaborado por Mg. Manuel Alejandro Obando · Departamento de Física, Universidad del Cauca.

## Qué hay aquí

| Carpeta | Contenido |
|---|---|
| `manual/dist/index.html` | el manual completo (ábrelo con doble clic) |
| `carcasa/faro.scad` | modelo paramétrico en OpenSCAD |
| `carcasa/stl/` | piezas listas para imprimir |
| `planos/` | 5 láminas A4 a escala 1:1 |
| `electronica/` | esquema eléctrico y lista de materiales |
| `firmware/faro_pod/` | programa de cada pod (Arduino, ESP32‑S3) |
| `firmware/faro_hub/` | programa del hub (Arduino, cualquier ESP32 con BLE) |
| `tools/` | scripts que regeneran STL, planos, esquema y manual |

## Regenerar todo

```
python tools/carcasa.py todo     # choques, STL, vistas, cortes y mallas del visor 3D (requiere OpenSCAD)
python tools/planos.py           # láminas acotadas
python tools/esquema.py          # esquema eléctrico
python tools/manual.py           # manual en un solo HTML
```

`tools/carcasa.py` busca OpenSCAD en el PATH, en `C:\Program Files\OpenSCAD` o en la variable `OPENSCAD`.

## Firmware

Arduino IDE 2 con el núcleo «esp32» de Espressif 3.1 o posterior (probado con 3.3.2), placa
«ESP32S3 Dev Module» con *USB CDC On Boot: Enabled*. Librerías del pod: Adafruit NeoPixel y VL53L0X (Pololu).
El hub no usa librerías externas.
