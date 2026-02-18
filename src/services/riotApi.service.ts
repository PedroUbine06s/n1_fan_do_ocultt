import axios from 'axios';

function getConfig() {
  const API_BASE_URL = process.env.RIOT_API_BASE_URL;
  const REGIONAL_URL = process.env.RIOT_REGIONAL_URL;
  const RIOT_KEY = process.env.RIOT_KEY;

  if (!API_BASE_URL || !REGIONAL_URL || !RIOT_KEY) {
    throw new Error('Missing Riot API environment variables');
  }

  return { API_BASE_URL, REGIONAL_URL, RIOT_KEY };
}

function riotHeaders() {
  return { 'X-Riot-Token': getConfig().RIOT_KEY };
}

export interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  puuid: string;
}

export async function getRankedEntries(puuid: string): Promise<RankedEntry[]> {
  try {
    const { API_BASE_URL } = getConfig();

    const response = await axios.get(
      `${API_BASE_URL}/lol/league/v4/entries/by-puuid/${puuid}`,
      { headers: riotHeaders() },
    );
    return response.data;
  } catch (error) {
    console.error('[ERRO] Falha ao buscar ranked entries:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getMatchIds(puuid: string, count = 5): Promise<string[]> {
  try {
    const { REGIONAL_URL } = getConfig();

    const response = await axios.get(
      `${REGIONAL_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        headers: riotHeaders(),
        params: { type: 'ranked', count },
      },
    );
    return response.data;
  } catch (error) {
    console.error('[ERRO] Falha ao buscar match ids:', error instanceof Error ? error.message : error);
    return [];
  }
}

export interface MatchParticipant {
  puuid: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
}

export interface MatchDetail {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: MatchParticipant[];
  };
}

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  try {
    const { REGIONAL_URL } = getConfig();

    const response = await axios.get(
      `${REGIONAL_URL}/lol/match/v5/matches/${matchId}`,
      { headers: riotHeaders() },
    );
    return response.data;
  } catch (error) {
    console.error('[ERRO] Falha ao buscar detalhes da partida:', error instanceof Error ? error.message : error);
    return null;
  }
}
