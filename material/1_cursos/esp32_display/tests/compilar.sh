#!/bin/bash
# Compila todos los sketches del curso con arduino-cli (núcleo esp32 instalado).
# Uso: bash tests/compilar.sh <carpeta_usuario_con_libraries>
# Las librerías van en una carpeta temporal para no tocar el sketchbook del usuario.
# Escribe tests/compilacion.json con el resultado de cada sketch.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USERDIR="$1"
CLI="/c/Program Files/Arduino IDE/resources/app/lib/backend/resources/arduino-cli.exe"
export ARDUINO_DIRECTORIES_USER="$USERDIR"
export ARDUINO_DIRECTORIES_DATA="$LOCALAPPDATA/Arduino15"
export ARDUINO_DIRECTORIES_DOWNLOADS="$USERDIR/../dl"
TFT="$USERDIR/libraries/TFT_eSPI"
[ -f "$USERDIR/libraries/Select.orig" ] || cp "$TFT/User_Setup_Select.h" "$USERDIR/libraries/Select.orig"
[ -f "$USERDIR/libraries/Setup.orig" ] || cp "$TFT/User_Setup.h" "$USERDIR/libraries/Setup.orig"
OUT="${OUT:-$ROOT/tests/compilacion.json}"
CORE="$("$CLI" core list | awk '/esp32:esp32/{print $2}')"
LIBS="$("$CLI" lib list | awk 'NR>1{print}' | sed 's/  */ /g' | cut -d' ' -f1-4 | tr '\n' ';')"
echo "{\"nucleo\":\"esp32 $CORE\",\"fecha\":\"$(date +%F)\",\"resultados\":[" > "$OUT"
first=1; ok=0; bad=0

compila() {   # nombre fqbn placa_tft
  local s="$1" fqbn="$2" tft="$3"
  # SOLO="sketch@placa ..." limita la ejecución a esos casos
  if [ -n "${SOLO:-}" ] && [[ " $SOLO " != *" $s@${fqbn##*:} "* ]]; then return; fi
  # Configurar TFT_eSPI según la placa
  cp "$USERDIR/libraries/Select.orig" "$TFT/User_Setup_Select.h"; cp "$USERDIR/libraries/Setup.orig" "$TFT/User_Setup.h"
  if [ "$tft" = "tdisplay" ]; then
    sed -i 's#^//\(\#include <User_Setups/Setup25_TTGO_T_Display.h>\)#\1#; s#^\#include <User_Setup.h> #//\#include <User_Setup.h> #' "$TFT/User_Setup_Select.h"
  elif [ "$tft" = "cyd" ]; then
    cp "$USERDIR/cyd_setup.h" "$TFT/User_Setup.h"
  fi
  if [ "$tft" != none ]; then echo "  config TFT_eSPI [$tft]: $(grep -h -E '^#include <User_Setup' "$TFT/User_Setup_Select.h" | head -2 | tr '
' ' ') | driver: $(grep -h -E '^#define (ST7789|ILI9341)' "$TFT/User_Setup.h" | head -1)"; fi
  local log; log="$("$CLI" compile --fqbn "$fqbn" "$ROOT/sketches/$s" 2>&1)"; local rc=$?
  local uso; uso="$(echo "$log" | grep -i -E "sketch (uses|usa)" | head -1 | sed 's/"/\\"/g')"
  [ $first -eq 0 ] && echo "," >> "$OUT"; first=0
  if [ $rc -eq 0 ]; then ok=$((ok+1)); st=true; else bad=$((bad+1)); st=false; echo "=== FALLO $s ($fqbn)"; echo "$log" | tail -25; fi
  echo "{\"sketch\":\"$s\",\"fqbn\":\"$fqbn\",\"ok\":$st,\"uso\":\"$uso\"}" >> "$OUT"
  echo "$([ $rc -eq 0 ] && echo OK || echo FALLO)  $s  [$fqbn]  $uso"
}

compila 01_hola_serie esp32:esp32:esp32 none
compila 03_distancia_basica esp32:esp32:esp32 none
compila 04_distancia_robusta esp32:esp32:esp32 none
compila 03_distancia_basica esp32:esp32:lilygo_t_display none
compila 03_distancia_basica esp32:esp32:jczn_2432s028r none
compila 03_distancia_basica esp32:esp32:heltec_wifi_kit_32 none
compila 04_distancia_robusta esp32:esp32:lilygo_t_display none
compila 04_distancia_robusta esp32:esp32:jczn_2432s028r none
compila 04_distancia_robusta esp32:esp32:heltec_wifi_kit_32 none
compila 02a_pantalla_tdisplay esp32:esp32:lilygo_t_display tdisplay
compila 02a_pantalla_tdisplay esp32:esp32:esp32 tdisplay
compila 05a_medidor_tdisplay esp32:esp32:lilygo_t_display tdisplay
compila 05a_medidor_tdisplay esp32:esp32:esp32 tdisplay
compila 02b_pantalla_cyd esp32:esp32:jczn_2432s028r cyd
compila 02b_pantalla_cyd esp32:esp32:esp32 cyd
compila 05b_medidor_cyd esp32:esp32:jczn_2432s028r cyd
compila 05b_medidor_cyd esp32:esp32:esp32 cyd
compila 02c_buscar_oled esp32:esp32:heltec_wifi_kit_32 none
compila 02c_buscar_oled esp32:esp32:esp32 none
compila 02d_pantalla_oled esp32:esp32:heltec_wifi_kit_32 none
compila 02d_pantalla_oled esp32:esp32:esp32 none
compila 05c_medidor_oled esp32:esp32:heltec_wifi_kit_32 none
compila 05c_medidor_oled esp32:esp32:esp32 none

echo "],\"ok\":$ok,\"mal\":$bad,\"librerias\":\"$LIBS\"}" >> "$OUT"
cp "$USERDIR/libraries/Select.orig" "$TFT/User_Setup_Select.h"; cp "$USERDIR/libraries/Setup.orig" "$TFT/User_Setup.h"
echo "Compilaciones correctas: $ok   fallidas: $bad"
