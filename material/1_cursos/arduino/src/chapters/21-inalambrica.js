/* Capítulo 21 — Bluetooth y WiFi */
(function () {
  'use strict';
  const EM = window.EM, CV = EM.cv;
  const led = () => { const L = CV.leds(['@G4'], ['rojo'], 100); return CV.esp({ parts: L.parts.map((p) => { if (p.id === 'R1') p.pins = ['h20', 'h23']; if (p.id === 'D1') p.pins = ['g23', 'g24']; return p; }), wires: [{ id: 'wl', a: '@G4', b: 'j20' }, { id: 'wk', a: 'j24', b: 'T-24' }, { id: 'wg', a: '@GND', b: 'T-1' }] }); };

  const BT = `#include <BluetoothSerial.h>

BluetoothSerial SerialBT;
const int LED = 4;

void setup() {
  pinMode(LED, OUTPUT);
  SerialBT.begin("ESP32-Curso");     // nombre que ve el teléfono
}

void loop() {
  if (SerialBT.available()) {
    char c = SerialBT.read();
    if (c == '1') {
      digitalWrite(LED, HIGH);
      SerialBT.println("LED encendido");
    } else if (c == '0') {
      digitalWrite(LED, LOW);
      SerialBT.println("LED apagado");
    }
  }
}
`;
  EM.defineSim('bluetooth', function (sim) {
    EM.Lab.mount(sim, { aspect: 1.75, scene: led(), code: BT, bt: true, speeds: [[1, '1×']], outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts.find((p) => p.id === 'D1'))) }] });
  });

  const WEB = (clave) => `#include <WiFi.h>
#include <WebServer.h>

const char* RED = "CasaWiFi";
const char* CLAVE = "${clave}";
WebServer server(80);
const int LED = 4;
bool encendido = false;

void paginaInicio() {
  String html = "<h1>Control del LED</h1>";
  html += encendido ? "<p>El LED esta ENCENDIDO</p>" : "<p>El LED esta APAGADO</p>";
  html += "<p><a href='/led?estado=1'>Encender</a> | <a href='/led?estado=0'>Apagar</a></p>";
  server.send(200, "text/html", html);
}

void controlLed() {
  if (server.arg("estado") == "1") {
    encendido = true;
  } else {
    encendido = false;
  }
  digitalWrite(LED, encendido);
  paginaInicio();
}

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(RED, CLAVE);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  server.on("/", paginaInicio);
  server.on("/led", controlLed);
  server.begin();
}

void loop() {
  server.handleClient();
}
`;
  EM.defineSim('servidor', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.75, scene: led(), code: WEB('12345678'), wifi: { ssid: 'CasaWiFi', pass: '12345678' }, speeds: [[1, '1×'], [3, '3×']],
      web: { links: [['Inicio', '/'], ['Encender', '/led?estado=1'], ['Apagar', '/led?estado=0'], ['Ruta inexistente', '/nada']] },
      controls: [{ type: 'button', label: 'Contraseña equivocada', run: (lab) => lab.setCode(WEB('clave-mala')) }, { type: 'button', label: 'Contraseña correcta', run: (lab) => lab.setCode(WEB('12345678')) }],
      outs: [{ id: 'i', label: 'Corriente del LED', hl: true, fn: (lab) => EM.fmtI(lab.bench.partCurrent(lab.scene.parts.find((p) => p.id === 'D1'))) }]
    });
  });
})();
