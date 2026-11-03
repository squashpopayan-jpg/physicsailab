/* Capítulo 27 — Estación meteorológica con ESP32: pantalla, sensor y página web */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;

  const CODE = (clave) => `#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

const char* RED = "CasaWiFi";
const char* CLAVE = "${clave}";

DHT dht(4, DHT11);
LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);

float temp = 0;
float hum = 0;
bool error = false;
int visitas = 0;
unsigned long ultima = 0;

void pagina() {
  visitas++;
  String html = "<h1>Estacion del colegio</h1>";
  html += "<p>Temperatura: " + String(temp, 1) + " C</p>";
  html += "<p>Humedad: " + String(hum, 0) + " %</p>";
  if (error) html += "<p>(el sensor no responde)</p>";
  html += "<p><a href='/datos'>Ver datos en formato JSON</a></p>";
  server.send(200, "text/html", html);
}

void datos() {
  String json = "{\\"temperatura\\":" + String(temp, 1) + ",\\"humedad\\":" + String(hum, 0) + "}";
  server.send(200, "application/json", json);
}

void mostrar() {
  lcd.setCursor(0, 0);
  if (error) {
    lcd.print("Sensor sin datos");
  } else {
    lcd.print("T:");
    lcd.print(temp, 0);
    lcd.print("C  H:");
    lcd.print(hum, 0);
    lcd.print("%   ");
  }
  lcd.setCursor(0, 1);
  lcd.print("Visitas: ");
  lcd.print(visitas);
  lcd.print("    ");
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  lcd.init();
  lcd.backlight();
  dht.begin();
  lcd.setCursor(0, 0);
  lcd.print("Conectando...");
  WiFi.begin(RED, CLAVE);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  server.on("/", pagina);
  server.on("/datos", datos);
  server.begin();
}

void loop() {
  server.handleClient();                 // atender el navegador
  if (millis() - ultima > 2000) {         // medir cada 2 s sin usar delay
    ultima = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) {
      error = true;
    } else {
      error = false;
      temp = t;
      hum = h;
    }
  }
  mostrar();
}
`;

  EM.defineSim('estacion', function (sim) {
    const sc = CV.esp({
      parts: [
        { id: 'DH1', type: 'DHT11', pins: ['e20', 'e21', 'e22'], temp: 24, hum: 60 },
        { id: 'R1', type: 'R', value: 10000, pins: ['c20', 'c21'] },
        { id: 'LCD1', type: 'LCDI2C', pins: ['e24', 'e25', 'e26', 'e27'] }
      ],
      wires: [
        { id: 'wd1', a: 'a20', b: '@3V3' }, { id: 'wd2', a: 'a21', b: '@G4' }, { id: 'wd3', a: 'a22', b: '@GND' },
        { id: 'wl1', a: 'a24', b: '@GND' }, { id: 'wl2', a: 'a25', b: '@VIN' }, { id: 'wl3', a: 'a26', b: '@G21' }, { id: 'wl4', a: 'a27', b: '@G22', cut: false }
      ]
    });
    EM.Lab.mount(sim, {
      aspect: 1.5, scene: sc, code: CODE('12345678'), wifi: { ssid: 'CasaWiFi', pass: '12345678' }, speeds: [[1, '1×'], [3, '3×']],
      web: { links: [['Página', '/'], ['Datos JSON', '/datos'], ['Ruta inexistente', '/nada']] },
      controls: [
        { type: 'slider', id: 't', label: 'Temperatura del aire', min: 0, max: 45, step: 1, value: 24, unit: '°C', apply: (lab, v) => { const p = CV.partOf(lab, 'DH1'); if (p) p.temp = +v; } },
        { type: 'slider', id: 'h', label: 'Humedad relativa', min: 20, max: 95, step: 1, value: 60, unit: '%', apply: (lab, v) => { const p = CV.partOf(lab, 'DH1'); if (p) p.hum = +v; } },
        { type: 'button', label: 'Contraseña equivocada', run: (lab) => lab.setCode(CODE('clave-mala')) },
        { type: 'button', label: 'Contraseña correcta', run: (lab) => lab.setCode(CODE('12345678')) }
      ],
      faults: [
        { id: 'pu', label: 'Quitar la resistencia pull-up del DHT11', apply: (s) => { s.parts.find((p) => p.id === 'R1').pins = [null, null]; }, revert: (s) => { s.parts.find((p) => p.id === 'R1').pins = ['c20', 'c21']; } },
        { id: 'scl', label: 'Cable SCL de la pantalla suelto', apply: (s) => { s.wires.find((w) => w.id === 'wl4').cut = true; }, revert: (s) => { s.wires.find((w) => w.id === 'wl4').cut = false; } }
      ],
      outs: [
        { id: 'dt', label: 'Lo que hay en el aire (T / HR)', hl: true, fn: (lab) => { const p = CV.partOf(lab, 'DH1'); return p ? EM.fix(p.temp, 0) + ' °C / ' + EM.fix(p.hum, 0) + ' %' : '—'; } },
        { id: 'cur', label: 'Corriente que sale de VIN (pantalla)', fn: (lab) => EM.fmtI(lab.bench.partCurrent(CV.partOf(lab, 'LCD1'))) }
      ]
    });
  });
})();
