#!/bin/bash
# Script para setup inicial do projeto

echo "🚀 Inicializando n1_fan_do_ocultt..."

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Verificar se .env existe
if [ ! -f .env ]; then
  echo "⚠️  Arquivo .env não encontrado!"
  echo "📋 Copie o arquivo .env.example para .env e configure as variáveis:"
  echo "   cp .env.example .env"
  exit 1
fi

# 3. Executar migrações do Prisma
echo "🗄️  Executando migrações do banco de dados..."
npx prisma migrate dev --skip-generate

echo "✅ Setup concluído!"
echo ""
echo "Para rodar em desenvolvimento:"
echo "  npm run dev"
