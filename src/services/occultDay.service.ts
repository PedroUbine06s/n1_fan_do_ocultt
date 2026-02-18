import axios from 'axios';

function getConfig() {
  const API_BASE_URL = process.env.RIOT_API_BASE_URL;
  const REGIONAL_URL = process.env.RIOT_REGIONAL_URL;
  const RIOT_KEY = process.env.RIOT_KEY;
  const OCCULT_DAY_GAME_NAME = process.env.OCCULT_DAY_GAME_NAME;
  const OCCULT_DAY_TAG_LINE = process.env.OCCULT_DAY_TAG_LINE;

  if (!API_BASE_URL || !REGIONAL_URL || !RIOT_KEY || !OCCULT_DAY_GAME_NAME || !OCCULT_DAY_TAG_LINE) {
    throw new Error('Missing required environment variables');
  }

  return { API_BASE_URL, REGIONAL_URL, RIOT_KEY, OCCULT_DAY_GAME_NAME, OCCULT_DAY_TAG_LINE };
}

export async function getOccultDayData() {
  const { API_BASE_URL, RIOT_KEY } = getConfig();

  const response = await axios.get(`${API_BASE_URL}/occult-day`, {
    headers: { 'X-Riot-Token': RIOT_KEY },
  });
  return response.data;
}

export async function getOccultDayPuuid() {
  const { REGIONAL_URL, RIOT_KEY, OCCULT_DAY_GAME_NAME, OCCULT_DAY_TAG_LINE } = getConfig();

  try {
    const response = await axios.get(
      `${REGIONAL_URL}/riot/account/v1/accounts/by-riot-id/${OCCULT_DAY_GAME_NAME}/${OCCULT_DAY_TAG_LINE}`,
      { headers: { 'X-Riot-Token': RIOT_KEY } },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Occult Day PUUID:', error);
    throw error;
  }
}

