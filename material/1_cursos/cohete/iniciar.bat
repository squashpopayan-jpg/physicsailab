@echo off
rem Inicia el servidor de Apogeo (HTTPS, para usar la camara y los sensores del celular en la misma red).
cd /d "%~dp0"
python serve.py
pause
