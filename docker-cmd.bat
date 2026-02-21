@echo off
setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="logs" goto logs
if "%1"=="restart" goto restart
if "%1"=="build" goto build
if "%1"=="psql" goto psql
if "%1"=="clean" goto clean
goto help

:help
echo n1_fan_do_ocultt - Docker Commands
echo.
echo Comandos disponíveis:
echo   docker-cmd.bat up           - Inicia os containers
echo   docker-cmd.bat down         - Para os containers
echo   docker-cmd.bat logs         - Mostra logs em tempo real
echo   docker-cmd.bat restart      - Reinicia os containers
echo   docker-cmd.bat build        - Rebuilda a imagem Docker
echo   docker-cmd.bat psql         - Acessa PostgreSQL direto
echo   docker-cmd.bat clean        - Remove containers, volumes e imagens
echo.
goto end

:up
docker-compose up -d
echo ✅ Containers iniciados!
echo 📊 Acesse: http://localhost:3000/api/health
goto end

:down
docker-compose down
echo ✅ Containers parados
goto end

:logs
docker-compose logs -f app
goto end

:restart
docker-compose down
docker-compose up -d
echo ✅ Containers reiniciados!
goto end

:build
docker-compose build
echo ✅ Imagem reconstruída
goto end

:psql
docker-compose exec postgres psql -U postgres -d occult_day
goto end

:clean
docker-compose down -v
echo ✅ Containers e volumes removidos
goto end

:end
endlocal
