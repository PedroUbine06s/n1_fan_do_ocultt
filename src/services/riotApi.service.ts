import axios, { AxiosError } from 'axios';

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

export async function getPuuidByRiotId(gameName: string, tagLine: string): Promise<string> {
  const { REGIONAL_URL } = getConfig();
  const url = `${REGIONAL_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

  console.log(`\n\x1b[36m[API] GET ${url}\x1b[0m`);
  const start = performance.now();
  const response = await axios.get(url, { headers: riotHeaders() });
  console.log(`\x1b[32m[API] getPuuidByRiotId concluido em ${Math.round(performance.now() - start)}ms\x1b[0m`);
  return response.data.puuid;
}

export async function getRankedEntries(puuid: string): Promise<RankedEntry[]> {
  try {
    const { API_BASE_URL } = getConfig();
    const url = `${API_BASE_URL}/lol/league/v4/entries/by-puuid/${puuid}`;

    console.log(`\n\x1b[36m[API] GET ${url}\x1b[0m`);
    const start = performance.now();
    const response = await axios.get(url, { headers: riotHeaders() });
    console.log(`\x1b[32m[API] getRankedEntries concluido em ${Math.round(performance.now() - start)}ms\x1b[0m`);
    return response.data;
  } catch (error) {
    console.error(`\x1b[31m[API] getRankedEntries ERRO apos request:\x1b[0m`, error instanceof AxiosError ? `${error.response?.status} - ${error.message}` : error);
    if (error instanceof AxiosError && error.response?.status === 400) throw error;
    return [];
  }
}

export async function getMatchIds(puuid: string, count = 5): Promise<string[]> {
  try {
    const { REGIONAL_URL } = getConfig();
    const url = `${REGIONAL_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`;

    console.log(`\n\x1b[36m[API] GET ${url} (count=${count})\x1b[0m`);
    const start = performance.now();
    const response = await axios.get(url, {
      headers: riotHeaders(),
      params: { type: 'ranked', count },
    });
    console.log(`\x1b[32m[API] getMatchIds concluido em ${Math.round(performance.now() - start)}ms (${response.data.length} resultados)\x1b[0m`);
    return response.data;
  } catch (error) {
    console.error(`\x1b[31m[API] getMatchIds ERRO apos request:\x1b[0m`, error instanceof AxiosError ? `${error.response?.status} - ${error.message}` : error);
    if (error instanceof AxiosError && error.response?.status === 400) throw error;
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
    const url = `${REGIONAL_URL}/lol/match/v5/matches/${matchId}`;

    console.log(`\n\x1b[36m[API] GET ${url}\x1b[0m`);
    const start = performance.now();
    const response = await axios.get(url, { headers: riotHeaders() });
    console.log(`\x1b[32m[API] getMatchDetail concluido em ${Math.round(performance.now() - start)}ms\x1b[0m`);
    return response.data;
  } catch (error) {
    console.error(`\x1b[31m[API] getMatchDetail ERRO:\x1b[0m`, error instanceof AxiosError ? `${error.response?.status} - ${error.message}` : error);
    return null;
  }
}
