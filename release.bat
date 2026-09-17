@echo off
REM Uso via terminal: release.bat [patch|minor|major] ["mensagem de commit"]
REM Uso via clique duplo: sem argumentos, usa patch + "chore: release"
setlocal enabledelayedexpansion

set "BUMP=%~1"
if "%BUMP%"=="" set "BUMP=patch"

if not "%BUMP%"=="patch" if not "%BUMP%"=="minor" if not "%BUMP%"=="major" (
  echo Uso: release.bat [patch^|minor^|major] ["mensagem de commit"]
  pause
  exit /b 1
)

set "MSG=%~2"
if "%MSG%"=="" set "MSG=chore: release"

set "HASCHANGES="
for /f "delims=" %%i in ('git status --porcelain') do set "HASCHANGES=1"

if defined HASCHANGES (
  echo ==^> Adicionando e commitando mudancas...
  git add .
  git commit -m "%MSG%"
) else (
  echo ==^> Nada para commitar, seguindo direto pro bump de versao.
)

echo ==^> Subindo versao ^(%BUMP%^)...
call npm version %BUMP%
if errorlevel 1 (
  echo Erro ao rodar npm version. Abortando.
  pause
  exit /b 1
)

echo ==^> Enviando para o GitHub ^(commit + tag^)...
git push --follow-tags
if errorlevel 1 (
  echo Erro no git push. Verifique a mensagem acima.
  pause
  exit /b 1
)

echo.
echo Pronto. Confira a aba Actions do repositorio no GitHub para ver o publish rodar.
echo.
pause

endlocal
