/* 02d_pantalla_oled
   Prueba de la OLED SSD1306 de 128x64 con Adafruit_SSD1306.
   Ajuste los tres numeros de pines con lo que halló 02c_buscar_oled. */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// --- Pines de la OLED: elija UNA linea (la de su placa) ---
const int OLED_SDA = 4;   const int OLED_SCL = 15;  const int OLED_RST = 16;  // Heltec WiFi Kit 32
// const int OLED_SDA = 5;   const int OLED_SCL = 4;   const int OLED_RST = -1;  // WEMOS/LOLIN32 OLED
// const int OLED_SDA = 21;  const int OLED_SCL = 22;  const int OLED_RST = -1;  // I2C estandar

const int ANCHO = 128;
const int ALTO  = 64;
const uint8_t DIRECCION = 0x3C;                 // casi siempre 0x3C (a veces 0x3D)

Adafruit_SSD1306 oled(ANCHO, ALTO, &Wire, OLED_RST);

void setup() {
  Serial.begin(115200);
  Wire.begin(OLED_SDA, OLED_SCL);               // arrancamos nosotros el bus con SUS pines
  // begin(voltaje, direccion, reset, periphBegin=false): no reinicia Wire
  if (!oled.begin(SSD1306_SWITCHCAPVCC, DIRECCION, true, false)) {
    Serial.println("No se pudo iniciar la OLED: revise pines y direccion");
    while (true) delay(1000);                   // se detiene aqui
  }
  oled.clearDisplay();                          // borra la memoria de imagen
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(2);                          // texto doble de grande
  oled.setCursor(0, 0);
  oled.println("OLED OK");
  oled.setTextSize(1);
  oled.println();
  oled.println("128 x 64 pixeles");
  oled.drawRect(0, 40, 128, 24, SSD1306_WHITE); // un marco para ver los bordes
  oled.display();                               // envia la imagen a la pantalla
  Serial.println("OLED inicializada");
}

void loop() {
}
