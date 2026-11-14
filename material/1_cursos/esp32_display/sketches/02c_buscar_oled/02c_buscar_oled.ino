/* 02c_buscar_oled
   Busca la pantalla OLED por I2C probando los pares de pines (SDA, SCL)
   más habituales en las placas ESP32 con OLED integrado.
   Escribe en el Monitor Serie (115200) la dirección y los pines hallados. */

#include <Wire.h>

struct Par { int sda; int scl; const char* nombre; };

const Par PARES[] = {
  {4,  15, "Heltec WiFi Kit 32 (SDA=4, SCL=15, RST=16)"},
  {5,  4,  "Clones WEMOS/LOLIN32 OLED (SDA=5, SCL=4)"},
  {21, 22, "Pines I2C estandar (SDA=21, SCL=22)"},
};
const int N_PARES = sizeof(PARES) / sizeof(PARES[0]);
const int PIN_RST_OLED = 16;    // el Heltec necesita un pulso de reset

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Buscando OLED por I2C...");

  // Pulso de reset: algunas placas (Heltec) no inician la OLED sin el.
  pinMode(PIN_RST_OLED, OUTPUT);
  digitalWrite(PIN_RST_OLED, LOW);
  delay(20);
  digitalWrite(PIN_RST_OLED, HIGH);
  delay(50);

  bool hallada = false;
  for (int i = 0; i < N_PARES; i++) {
    Wire.end();                                  // libera el bus anterior
    Wire.begin(PARES[i].sda, PARES[i].scl);      // prueba este par de pines
    for (uint8_t dir = 1; dir < 127; dir++) {
      Wire.beginTransmission(dir);               // intenta hablar a la direccion
      if (Wire.endTransmission() == 0) {         // 0 = alguien contesto (ACK)
        Serial.print("Dispositivo en 0x");
        Serial.print(dir, HEX);
        Serial.print("  con  ");
        Serial.println(PARES[i].nombre);
        hallada = true;
      }
    }
  }
  if (!hallada) Serial.println("No se encontro nada. Revise la placa o pruebe con otros pines.");
  Serial.println("Fin de la busqueda.");
}

void loop() {
}
