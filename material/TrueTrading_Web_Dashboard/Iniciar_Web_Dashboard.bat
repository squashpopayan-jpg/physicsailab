@echo off
chcp 65001 >nul
title TrueTrading Web Dashboard & API Server
cd /d "C:\Users\Administrator\Desktop\TrueTrading_Web_Dashboard"

echo ==============================================================
echo    INICIANDO SERVIDOR WEB Y API TRUETRADING (PUERTO 8080)
echo ==============================================================
echo.
echo  * Abriendo panel en el navegador: http://localhost:8080
echo  * Para detenerlo: Cierra esta ventana o presiona Ctrl+C.
echo.

start "" "http://localhost:8080"
python web_server.py
pause
