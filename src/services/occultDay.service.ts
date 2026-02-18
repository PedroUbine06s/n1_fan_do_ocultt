import axios from 'axios';

const API_BASE_URL = process.env.RIOT_API_BASE_URL || 'https://br1.api.riotgames.com';
const REGIONAL_URL = process.env.RIOT_REGIONAL_URL || 'https://americas.api.riotgames.com';
const RIOT_KEY = process.env.RIOT_KEY || '';

const occultDayGameName = process.env.OCCULT_DAY_GAME_NAME || 'occultday';
const occultDayTagLine = process.env.OCCULT_DAY_TAG_LINE || 'occultday';

const riotHeaders = {
  'X-Riot-Token': RIOT_KEY,
};

export async function getOccultDayData() {
  const response = await axios.get(`${API_BASE_URL}/occult-day`, {
    headers: riotHeaders,
  });
  return response.data;
}

export async function getOccultDayPuuid() {
  const response = await axios.get(
    `${REGIONAL_URL}/riot/account/v1/accounts/by-riot-id/${occultDayGameName}/${occultDayTagLine}`,
    { headers: riotHeaders },
  );
  return response.data;
}
