/* 02a_pantalla_tdisplay
   Prueba de la pantalla a color de la LilyGO T-Display (ST7789, 135x240).
   Requiere TFT_eSPI con Setup25_TTGO_T_Display.h activado
   en libraries/TFT_eSPI/User_Setup_Select.h */

#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();      // objeto que controla la pantalla

void setup() {
  Serial.begin(115200);
  tft.init();                   // inicializa el controlador ST7789
  tft.setRotation(1);           // 1 = horizontal: 240 de ancho x 135 de alto
  tft.fillScreen(TFT_BLACK);    // fondo negro

  // Tres franjas de color para comprobar rojo, verde y azul
  tft.fillRect(0,   0, 80, 40, TFT_RED);
  tft.fillRect(80,  0, 80, 40, TFT_GREEN);
  tft.fillRect(160, 0, 80, 40, TFT_BLUE);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);   // texto blanco sobre negro
  tft.drawString("Pantalla OK", 10, 60, 4); // texto, x, y, fuente 4
  tft.drawString("240 x 135 px", 10, 95, 2);
  Serial.println("Pantalla inicializada");
}

void loop() {
  // Nada que repetir: la imagen queda dibujada.
}
