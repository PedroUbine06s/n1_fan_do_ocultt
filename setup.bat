@echo off
REM Script para setup inicial do projeto no Windows

echo 🚀 Inicializando n1_fan_do_ocultt...

REM 1. Instalar dependências
echo 📦 Instalando dependências...
call npm install

REM 2. Verificar se .env existe
if not exist .env (
  echo ⚠️  Arquivo .env não encontrado!
  echo 📋 Configure as variáveis de ambiente no arquivo .env
  echo    Verifique o arquivo .env.example para referência
  pause
  exit /b 1
)

REM 3. Executar migrações do Prisma
echo 🗄️  Executando migrações do banco de dados...
call npx prisma migrate dev --skip-generate

echo ✅ Setup concluído!
echo.
echo Para rodar em desenvolvimento:
echo   npm run dev
pause
