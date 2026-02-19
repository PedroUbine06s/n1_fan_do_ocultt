import { Router, Request, Response } from 'express';
import { notifyMatchResult, MatchResult } from '../services/notification.service';

const notificationRouter = Router();

/**
 * POST /notifications/test
 * Testa envio de notificação WhatsApp com dados de exemplo
 * 
 * Body (opcional):
 * {
 *   "win": true,
 *   "kills": 10,
 *   "deaths": 2,
 *   "assists": 5,
 *   "championName": "Ashe",
 *   "lp": 25,
 *   "tier": "Gold",
 *   "rank": "II",
 *   "phone": "5511977803242"
 * }
 */
notificationRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const {
      win = true,
      kills = 10,
      deaths = 2,
      assists = 5,
      championName = 'Ashe',
      lp = 25,
      tier = 'Gold',
      rank = 'II',
      phone,
    } = req.body;

    const matchResult: MatchResult = {
      matchId: `test-${Date.now()}`,
      win,
      kills,
      deaths,
      assists,
      championName,
      lp,
      tier,
      rank,
    };

    console.log(`[NOTIF_TEST] Disparando notificação de teste...`);
    const sent = await notifyMatchResult(matchResult, phone);

    res.status(200).json({
      success: true,
      sent,
      message: sent ? 'Notificação enviada com sucesso' : 'Notificação não foi enviada (verifique variáveis WAPI)',
      matchResult,
    });
  } catch (error) {
    console.error('[NOTIF_TEST] Erro:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export { notificationRouter };
