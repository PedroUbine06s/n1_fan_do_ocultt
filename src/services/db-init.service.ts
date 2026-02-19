import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    console.log('[DB] Inicializando banco de dados...');

    // Testa conexão
    await prisma.$executeRawUnsafe('SELECT 1');
    console.log('[DB] ✅ Conexão com banco de dados estabelecida');

    // Verifica se tabelas existem, se não cria
    try {
      await prisma.match.findFirst();
      console.log('[DB] ✅ Tabelas já existem');
    } catch {
      console.log('[DB] Criando tabelas...');
      // As migrações serão executadas aqui se necessário
      console.log('[DB] ℹ️  Execute: npx prisma migrate dev para criar as tabelas');
    }

    return true;
  } catch (error) {
    console.error('[DB] ❌ Erro ao inicializar banco:', error instanceof Error ? error.message : error);
    console.error('[DB] Certifique-se de que:');
    console.error('[DB]   1. PostgreSQL está rodando');
    console.error('[DB]   2. DATABASE_URL está correto no .env');
    console.error('[DB]   3. Você executou: npx prisma migrate dev');
    process.exit(1);
  }
}

export { prisma };
