import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { startMatchMonitor } from './cron/matchMonitor.cron';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`[SERVER] Rodando em http://localhost:${PORT}`);
  console.log(`[SERVER] Ambiente: ${process.env.NODE_ENV ?? 'development'}`);

  startMatchMonitor();
});
