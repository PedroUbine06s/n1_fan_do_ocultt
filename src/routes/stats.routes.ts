import { Router, Request, Response } from 'express';
import { getMatchHistory, getStats } from '../services/database.service';

const statsRouter = Router();

/**
 * GET /stats/history
 * Obtém histórico das últimas partidas salvas
 */
statsRouter.get('/history', async (_req: Request, res: Response) => {
  try {
    const limit = Number(_req.query.limit) || 10;
    const matches = await getMatchHistory(limit);

    res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error('[STATS] Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * GET /stats/summary
 * Obtém estatísticas gerais
 */
statsRouter.get('/summary', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[STATS] Erro ao calcular stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export { statsRouter };
