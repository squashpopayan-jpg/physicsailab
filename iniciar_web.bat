@echo off
title Portal de Fisica Interactiva - Mg. Manuel Alejandro Obando
cd /d "%~dp0"
echo Iniciando el servidor del portal de fisica...
start "" http://localhost:3000
node serve.js
pause
