import cron from 'node-cron';
import {
  getPuuidByRiotId,
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

let cachedPuuid: string | null = null;

async function resolvePuuid(): Promise<string> {
  if (cachedPuuid) return cachedPuuid;

  const gameName = process.env.OCCULT_DAY_GAME_NAME;
  const tagLine = process.env.OCCULT_DAY_TAG_LINE;
  if (!gameName || !tagLine) {
    throw new Error('Variáveis OCCULT_DAY_GAME_NAME e OCCULT_DAY_TAG_LINE são obrigatórias');
  }

  cachedPuuid = await getPuuidByRiotId(gameName, tagLine);
  console.log(`[INIT] PUUID resolvido: ${cachedPuuid}`);
  return cachedPuuid;
}

function invalidatePuuid(): void {
  console.log('[PUUID] Cache invalidado, será resolvido novamente no próximo ciclo');
  cachedPuuid = null;
  initialized = false;
}

function isDecryptionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { status?: number; data?: { status?: { message?: string } } } }).response;
    return resp?.status === 400 && (resp?.data?.status?.message?.includes('decrypting') ?? false);
  }
  return false;
}

let initialized = false;

async function initialize(): Promise<void> {
  if (initialized) return;

  console.log('[INIT] Buscando dados do invocador...');

  const puuid = await resolvePuuid();
  const entries = await getRankedEntries(puuid);
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

  const recentMatches = await getMatchIds(puuid, 1);
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

  const puuid = await resolvePuuid();
  const player = match.info.participants.find((p) => p.puuid === puuid);
  if (!player) return;

  if (player.win) {
    recordWin();
  } else {
    recordLoss();
  }

  const entries = await getRankedEntries(puuid);
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

async function checkForNewMatches(retry = true): Promise<void> {
  console.log('\n\x1b[90m--------------------------------------------------------------------------------\x1b[0m');
  const cycleStart = Date.now();
  try {
    await initialize();
    const state = getState();

    const puuid = await resolvePuuid();
    const matchIds = await getMatchIds(puuid, 5);

    if (matchIds.length === 0) {
      console.log(`\x1b[33m[CRON] Nenhuma partida encontrada (ciclo: ${Date.now() - cycleStart}ms)\x1b[0m`);
      return;
    }

    const newMatchIds: string[] = [];
    for (const id of matchIds) {
      if (id === state.lastMatchId) break;
      newMatchIds.push(id);
    }

    if (newMatchIds.length === 0) {
      console.log(`\x1b[33m[CRON] Sem partidas novas (ciclo: ${Date.now() - cycleStart}ms)\x1b[0m`);
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
    if (isDecryptionError(error) && retry) {
      console.warn('[PUUID] Erro de decriptação detectado, renovando PUUID e tentando novamente...');
      invalidatePuuid();
      return checkForNewMatches(false);
    }
    console.error(`\x1b[31m[ERRO] Falha no cron:\x1b[0m`, error instanceof Error ? error.message : error);
  } finally {
    console.log(`\x1b[35m[CRON] Ciclo completo em ${Date.now() - cycleStart}ms\x1b[0m`);
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
