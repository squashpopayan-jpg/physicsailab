/* 02b_pantalla_cyd
   Prueba de la pantalla de la ESP32-2432S028R «Cheap Yellow Display»
   (ILI9341, 240x320). Requiere copiar el User_Setup.h del repositorio
   de witnessmenow dentro de libraries/TFT_eSPI (ver el curso). */

#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);           // horizontal: 320 de ancho x 240 de alto
  tft.fillScreen(TFT_BLACK);

  tft.fillRect(0,   0, 107, 60, TFT_RED);
  tft.fillRect(107, 0, 107, 60, TFT_GREEN);
  tft.fillRect(214, 0, 106, 60, TFT_BLUE);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawString("Pantalla OK", 20, 90, 4);
  tft.drawString("320 x 240 px", 20, 130, 2);
  Serial.println("Pantalla inicializada");
}

void loop() {
}
