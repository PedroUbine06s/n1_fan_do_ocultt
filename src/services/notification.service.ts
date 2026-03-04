import axios from 'axios';
import { listRecipients, getMatchHistory, getMatchById } from './database.service';

import { getDistanceToGold, getDistanceToIronI } from './tracker.service';


export interface MatchResult {
  matchId: string;
  win: boolean | null;
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
  lp: number;
  tier: string;
  rank: string;
  gameDuration?: number | null;
}

function formatMatchMessage(result: MatchResult): string {
  let outcome = result.win ? 'VITÓRIA' : 'DERROTA';
  if (result.gameDuration && result.gameDuration < 240) {
    outcome = 'REMAKE';
  }
  const kda = `${result.kills}/${result.deaths}/${result.assists}`;
  const mins = result.gameDuration ? Math.floor(result.gameDuration / 60) : 0;
  const secs = result.gameDuration ? result.gameDuration % 60 : 0;
  const durationStr = result.gameDuration ? ` | ${mins}m${secs}s` : '';

  return [
    `Resultado: ${outcome}${durationStr}`,
    `Campeão: ${result.championName}`,
    `KDA: ${kda}`,
    `LP: ${result.lp} | ${result.tier} ${result.rank}`,
    `Match: ${result.matchId}`,
  ].join('\n');
}

async function sendWhatsAppMessage(phone: string, message: string, delayMessage = 15): Promise<boolean> {
  const instanceId = process.env.WAPI_INSTANCE_ID;
  const token = process.env.WAPI_BEARER_TOKEN;

  if (!instanceId || !token) {
    console.warn('WAPI instance ID or token not set. Skipping WhatsApp send.');
    return false;
  }

  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${encodeURIComponent(
    instanceId,
  )}`;

  try {
    // Some WAPI providers accept `chatId` (group id like 123@g.us). Send both fields
    // so the provider can pick the correct one. For single numbers, `phone` is used.
    const payload: any = { message, delayMessage };
    if (typeof phone === 'string' && phone.endsWith('@g.us')) {
      payload.chatId = phone;
      payload.phone = phone; // fallback for providers that expect phone
    } else {
      payload.phone = phone;
    }

    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return true;
  } catch (err: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', err?.response?.data || err?.message || err);
    return false;
  }
}

/**
 * Loga o resultado no console e envia mensagem via WhatsApp se `phone` for informado
 * ou se a variável de ambiente `WAPI_DEFAULT_PHONE` estiver definida.
 */
export async function notifyMatchResult(result: MatchResult, phone?: string): Promise<boolean> {
  let outcome = result.win ? 'VITORIA' : 'DERROTA';
  if (result.gameDuration && result.gameDuration < 240) {
    outcome = 'REMAKE';
  }
  const kda = `${result.kills}/${result.deaths}/${result.assists}`;
  const mins = result.gameDuration ? Math.floor(result.gameDuration / 60) : 0;
  const secs = result.gameDuration ? result.gameDuration % 60 : 0;
  const durationStr = result.gameDuration ? `${mins}m${secs}s` : 'N/A';

  console.log('');
  console.log('========================================');
  console.log(`  [RESULTADO] ${outcome}`);
  console.log(`  [DURACAO] ${durationStr}`);
  console.log(`  [CAMPEAO] ${result.championName}`);
  console.log(`  [KDA] ${kda}`);
  console.log(`  [LP] ${result.lp} | ${result.tier} ${result.rank}`);
  console.log('========================================');
  console.log('');

  const baseMessage = formatMatchMessage(result);

  // Append current elo and distance to goals
  const distanceGold = getDistanceToGold();
  const distanceIron = getDistanceToIronI();
  const eloLine = `Elo atual: ${result.tier} ${result.rank} ${result.lp} LP`;

  const distanceGoldLine = distanceGold.alreadyGold
    ? 'Status: já está em Gold IV ou acima.'
    : `Faltam ${distanceGold.divisions} divisão(ões) (~${distanceGold.estimatedLP} LP) até GOLD IV`;

  const distanceIronLine = distanceIron.alreadyIronI
    ? 'Status: já chegou em casa (iron 1).'
    : `Faltam ${distanceIron.divisions} divisão(ões) (~${distanceIron.estimatedLP} LP) até voltar pra casa`;

  const message = [baseMessage, eloLine, distanceGoldLine, distanceIronLine].join('\n');

  // If a specific phone was provided, send only to it.
  if (phone) {
    const sent = await sendWhatsAppMessage(phone, message, 15);
    return sent;
  }

  // If env default phone is set, send only to it.
  const defaultPhone = process.env.WAPI_DEFAULT_PHONE;
  if (defaultPhone) {
    const sent = await sendWhatsAppMessage(defaultPhone, message, 15);
    return sent;
  }

  // Otherwise, fetch active recipients from DB and send to up to 6 numbers.
  try {
    const recipients = await listRecipients(true);
    if (!recipients || recipients.length === 0) {
      console.warn('[NOTIF] Nenhum recipient ativo encontrado. Nenhum envio realizado.');
      return false;
    }

    const toSend = recipients.slice(0, 6);
    let anySuccess = false;

    for (const r of toSend) {
      const phoneTo = (r as any).phone;
      const name = (r as any).name;
      const prefMessage = name ? `${name},\n${message}` : message;
      const ok = await sendWhatsAppMessage(phoneTo, prefMessage, 15);
      console.log(`[NOTIF] Envio para ${phoneTo} (${name || 'no-name'}): ${ok ? 'SUCESSO' : 'FALHA'}`);
      if (ok) anySuccess = true;
    }

    return anySuccess;
  } catch (err: any) {
    console.error('[NOTIF] Erro ao buscar recipients e enviar mensagens:', err?.message || err);
    return false;
  }
}

/**
 * Busca a partida pelo matchId ou a última partida salva no banco e dispara notificações.
 * Se `phone` for fornecido, envia apenas para esse número.
 */
export async function notifySavedMatch(phone?: string, matchId?: string): Promise<boolean> {
  try {
    let m: any = null;

    if (matchId) {
      m = await getMatchById(matchId);
      if (!m) {
        console.warn(`[NOTIF] Partida com ID ${matchId} não encontrada no banco.`);
        return false;
      }
    } else {
      const matches = await getMatchHistory(1);
      if (!matches || matches.length === 0) {
        console.warn('[NOTIF] Nenhuma partida encontrada no banco para enviar.');
        return false;
      }
      m = matches[0];
    }

    const matchResult: MatchResult = {
      matchId: m.matchId,
      win: m.win === null ? null : !!m.win,
      kills: m.kills || 0,
      deaths: m.deaths || 0,
      assists: m.assists || 0,
      championName: m.championName || 'unknown',
      lp: m.lp || 0,
      tier: m.tier || '',
      rank: m.rank || '',
      gameDuration: m.gameDuration,
    };

    const sent = await notifyMatchResult(matchResult, phone);
    return sent;
  } catch (err: any) {
    console.error('[NOTIF] Erro ao buscar última partida e enviar notificação:', err?.message || err);
    return false;
  }
}

/**
 * Envia notificação quando o jogador entra em uma partida.
 */
export async function notifyPlayerOnline(gameMode: string, phone?: string): Promise<boolean> {
  const name = process.env.OCCULT_DAY_GAME_NAME || 'O jogador';
  const baseMessage = `🟢 *${name}* está ONLINE e acabou de entrar em uma partida!\nModo: ${gameMode}`;

  console.log('');
  console.log('========================================');
  console.log(`  [ONLINE] ${name} entrou em partida: ${gameMode}`);
  console.log('========================================');
  console.log('');

  if (phone) {
    return await sendWhatsAppMessage(phone, baseMessage, 0);
  }

  const defaultPhone = process.env.WAPI_DEFAULT_PHONE;
  if (defaultPhone) {
    return await sendWhatsAppMessage(defaultPhone, baseMessage, 0);
  }

  try {
    const recipients = await listRecipients(true);
    if (!recipients || recipients.length === 0) {
      console.warn('[NOTIF] Nenhum recipient para alertar inicio de partida.');
      return false;
    }

    const toSend = recipients.slice(0, 6);
    let anySuccess = false;

    for (const r of toSend) {
      const phoneTo = (r as any).phone;
      const recipientName = (r as any).name;
      const prefMessage = recipientName ? `Fala ${recipientName},\n${baseMessage}` : baseMessage;
      const ok = await sendWhatsAppMessage(phoneTo, prefMessage, 0);
      console.log(`[NOTIF] Alerta online enviado para ${phoneTo}: ${ok ? 'SUCESSO' : 'FALHA'}`);
      if (ok) anySuccess = true;
    }

    return anySuccess;
  } catch (err: any) {
    console.error('[NOTIF] Erro ao enviar alerta de jogador online:', err?.message || err);
    return false;
  }
}
