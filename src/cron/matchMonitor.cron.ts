import cron from 'node-cron';
import {
  getRankedEntries,
  getMatchIds,
  getMatchDetail,
} from '../services/riotApi.service';
import {
  getState,
  setLastMatchId,
  recordWin,
  recordLoss,
  updateRankInfo,
  getDistanceToGold,
} from '../services/tracker.service';
import { notifyMatchResult } from '../services/notification.service';

const PUUID = () => {
  const puuid = process.env.OCCULT_DAY_PUUID;
  if (!puuid) throw new Error('Variavel OCCULT_DAY_PUUID nao encontrada');
  return puuid;
};

let initialized = false;

async function initialize(): Promise<void> {
  if (initialized) return;

  console.log('[INIT] Buscando dados do invocador...');

  const entries = await getRankedEntries(PUUID());
  const soloQ = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
  if (soloQ) {
    updateRankInfo(soloQ.tier, soloQ.rank, soloQ.leaguePoints);
    const distance = getDistanceToGold();
    console.log(`[RANK] Elo atual: ${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints} LP`);
    if (distance.alreadyGold) {
      console.log('[RANK] Ja esta em Gold ou acima!');
    } else {
      console.log(`[RANK] Distancia ate Gold: ${distance.divisions} divisoes (~${distance.estimatedLP} LP)`);
    }
  } else {
    console.log('[RANK] Dados de ranqueada Solo/Duo nao encontrados (sem rank ou em md10)');
  }

  const recentMatches = await getMatchIds(PUUID(), 1);
  if (recentMatches.length > 0) {
    setLastMatchId(recentMatches[0]);
    console.log(`[INIT] Partida base definida: ${recentMatches[0]}`);
  }

  initialized = true;
  console.log('[INIT] Inicializacao concluida');
}

async function processMatch(matchId: string): Promise<void> {
  const match = await getMatchDetail(matchId);
  if (!match) return;

  const player = match.info.participants.find((p) => p.puuid === PUUID());
  if (!player) return;

  if (player.win) {
    recordWin();
  } else {
    recordLoss();
  }

  const entries = await getRankedEntries(PUUID());
  const soloQ = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');

  if (soloQ) {
    updateRankInfo(soloQ.tier, soloQ.rank, soloQ.leaguePoints);

    notifyMatchResult({
      matchId,
      win: player.win,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      championName: player.championName,
      lp: soloQ.leaguePoints,
      tier: soloQ.tier,
      rank: soloQ.rank,
    });
  }

  setLastMatchId(matchId);
}

async function checkForNewMatches(): Promise<void> {
  try {
    await initialize();
    const state = getState();

    const matchIds = await getMatchIds(PUUID(), 5);

    if (matchIds.length === 0) {
      return;
    }

    const newMatchIds: string[] = [];
    for (const id of matchIds) {
      if (id === state.lastMatchId) break;
      newMatchIds.push(id);
    }

    if (newMatchIds.length === 0) {
      return;
    }

    console.log(`[PARTIDA] ${newMatchIds.length} nova(s) partida(s) encontrada(s)!`);

    const chronologicalMatches = newMatchIds.toReversed();
    for (const matchId of chronologicalMatches) {
      await processMatch(matchId);
    }

    const updated = getState();
    const distance = getDistanceToGold();
    console.log(`[SESSAO] ${updated.wins}V ${updated.losses}D | ${updated.currentTier} ${updated.currentRank} ${updated.currentLP} LP`);
    if (!distance.alreadyGold) {
      console.log(`[GOLD] Faltam: ${distance.divisions} divisao(oes), ~${distance.estimatedLP} LP`);
    }
  } catch (error) {
    console.error('[ERRO] Falha no cron:', error instanceof Error ? error.message : error);
  }
}

export function startMatchMonitor(): void {
  const interval = process.env.CRON_INTERVAL || '*/2 * * * *';

  console.log(`[CRON] Monitor de partidas iniciado (intervalo: ${interval})`);

  checkForNewMatches();

  cron.schedule(interval, () => {
    console.log(`[CRON] [${new Date().toLocaleTimeString()}] Verificando novas partidas...`);
    checkForNewMatches();
  });
}
