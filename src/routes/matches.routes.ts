import { Router, Request, Response } from 'express';
import { getPuuidByRiotId, getMatchIds, getMatchDetail, getRankedEntries } from '../services/riotApi.service';
import { saveMatch, existsMatch } from '../services/database.service';

const router = Router();

// POST /api/matches/import-last
// Busca as últimas N partidas da conta configurada e salva no banco (não duplica)
router.post('/import-last', async (req: Request, res: Response) => {
  const count = Number(req.body?.count) || 5;
  try {
    // Get puuid from env-configured riot id
    const gameName = process.env.OCCULT_DAY_GAME_NAME;
    const tagLine = process.env.OCCULT_DAY_TAG_LINE;
    if (!gameName || !tagLine) return res.status(500).json({ error: 'OCCULT_DAY_GAME_NAME / OCCULT_DAY_TAG_LINE não configurados' });

    const puuid = await getPuuidByRiotId(gameName, tagLine);
    const matchIds = await getMatchIds(puuid, count);

    // fetch ranked entries once to get current tier/rank/lp
    const rankedEntries = await getRankedEntries(puuid);
    const soloEntry = rankedEntries.find((e) => e.queueType === 'RANKED_SOLO_5x5') || rankedEntries[0] || null;

    const results: { matchId: string; saved: boolean; reason?: string }[] = [];

    for (const mid of matchIds) {
      // check duplicate
      const already = await existsMatch(mid);
      if (already) {
        results.push({ matchId: mid, saved: false, reason: 'already_exists' });
        continue;
      }

      const detail = await getMatchDetail(mid);
      if (!detail) {
        results.push({ matchId: mid, saved: false, reason: 'no_detail' });
        continue;
      }

      // find participant matching our puuid
      const participant = detail.info.participants.find((p) => p.puuid === puuid);
      if (!participant) {
        results.push({ matchId: mid, saved: false, reason: 'participant_not_found' });
        continue;
      }

      const matchRecord = {
        matchId: detail.metadata.matchId || mid,
        win: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        championName: participant.championName,
        lp: soloEntry?.leaguePoints ?? 0,
        tier: soloEntry?.tier ?? '',
        rank: soloEntry?.rank ?? '',
        playedAt: detail.info.gameCreation ? new Date(detail.info.gameCreation) : undefined,
      };

      const saved = await saveMatch(matchRecord as any);
      results.push({ matchId: mid, saved: !!saved, reason: saved ? undefined : 'save_failed' });
    }

    res.json({ success: true, imported: results });
  } catch (error: any) {
    console.error('[MATCH_IMPORT] Erro:', error);
    res.status(500).json({ success: false, error: error.message || 'erro desconhecido' });
  }
});

export default router;
