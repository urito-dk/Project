@echo off
cd /d "%~dp0"
echo ParamIneq — http://localhost:3000
echo.
npx --yes serve . -l 3000
pause
