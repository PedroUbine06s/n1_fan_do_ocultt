import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { startMatchMonitor } from './cron/matchMonitor.cron';
import { initializeDatabase } from './services/db-init.service';

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`[SERVER] Rodando em http://localhost:${PORT}`);
      console.log(`[SERVER] Ambiente: ${process.env.NODE_ENV ?? 'development'}`);

      startMatchMonitor();
    });
  } catch (error) {
    console.error('[SERVER] Erro ao iniciar:', error);
    process.exit(1);
  }
}

start();
