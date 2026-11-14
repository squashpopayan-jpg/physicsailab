/* 05c_medidor_oled
   Medidor de distancia HC-SR04 con una placa ESP32 + OLED SSD1306 (128x64).
   TRIG = GPIO26, ECHO = GPIO27 (con divisor de tension). */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- Pines de la OLED: elija UNA linea (la que hallo 02c_buscar_oled) ---
const int OLED_SDA = 4;   const int OLED_SCL = 15;  const int OLED_RST = 16;  // Heltec WiFi Kit 32
// const int OLED_SDA = 5;   const int OLED_SCL = 4;   const int OLED_RST = -1;  // WEMOS/LOLIN32 OLED
// const int OLED_SDA = 21;  const int OLED_SCL = 22;  const int OLED_RST = -1;  // I2C estandar

const int PIN_TRIG = 26;
const int PIN_ECHO = 27;
const float TEMPERATURA_C = 20.0;
const unsigned long TIMEOUT_US = 30000UL;
const float DIST_MIN = 2.0;
const float DIST_MAX = 400.0;
const int N_MUESTRAS = 5;
const float ESCALA_CM = 200.0;

Adafruit_SSD1306 oled(128, 64, &Wire, OLED_RST);

float velocidadCmUs() { return (331.3 + 0.606 * TEMPERATURA_C) * 0.0001; }

float medirUnaVez() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long t = pulseIn(PIN_ECHO, HIGH, TIMEOUT_US);
  if (t == 0) return -1;
  float d = t * velocidadCmUs() / 2.0;
  return (d < DIST_MIN || d > DIST_MAX) ? -1 : d;
}

float medirDistancia() {
  float v[N_MUESTRAS];
  int n = 0;
  for (int i = 0; i < N_MUESTRAS; i++) {
    float d = medirUnaVez();
    if (d > 0) v[n++] = d;
    delay(60);
  }
  if (n < 3) return -1;
  for (int i = 1; i < n; i++) {
    float x = v[i]; int j = i - 1;
    while (j >= 0 && v[j] > x) { v[j + 1] = v[j]; j--; }
    v[j + 1] = x;
  }
  return v[n / 2];
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C, true, false)) {
    Serial.println("No se pudo iniciar la OLED");
    while (true) delay(1000);
  }
  oled.setTextColor(SSD1306_WHITE);
}

void loop() {
  float d = medirDistancia();

  oled.clearDisplay();                       // la OLED se redibuja entera cada vez
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.print("Distancia (cm)");
  oled.setTextSize(3);                       // cifras de 24 px de alto
  oled.setCursor(0, 16);
  if (d < 0) { oled.setTextSize(2); oled.print("sin eco"); }
  else       oled.print(d, 1);

  int w = 0;
  if (d > 0) w = (int)(124.0 * min(d, ESCALA_CM) / ESCALA_CM);
  oled.drawRect(0, 50, 128, 14, SSD1306_WHITE);
  oled.fillRect(2, 52, w, 10, SSD1306_WHITE);
  oled.display();                            // envia la imagen a la pantalla

  Serial.println(d);
}
