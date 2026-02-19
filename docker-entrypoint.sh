#!/bin/sh
set -e

echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 5

echo "🗄️  Aplicando migrações do Prisma..."
npx prisma migrate deploy

echo "✅ Migrações concluídas!"
echo "🚀 Iniciando aplicação..."

exec "$@"
