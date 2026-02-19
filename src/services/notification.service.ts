import axios from 'axios';
import { listRecipients } from './database.service';

export interface MatchResult {
  matchId: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  championName: string;
  lp: number;
  tier: string;
  rank: string;
}

function formatMatchMessage(result: MatchResult): string {
  const outcome = result.win ? 'VITÓRIA' : 'DERROTA';
  const kda = `${result.kills}/${result.deaths}/${result.assists}`;

  return [
    `Resultado: ${outcome}`,
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
    await axios.post(
      url,
      {
        phone,
        message,
        delayMessage,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

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
  const outcome = result.win ? 'VITORIA' : 'DERROTA';
  const kda = `${result.kills}/${result.deaths}/${result.assists}`;

  console.log('');
  console.log('========================================');
  console.log(`  [RESULTADO] ${outcome}`);
  console.log(`  [CAMPEAO] ${result.championName}`);
  console.log(`  [KDA] ${kda}`);
  console.log(`  [LP] ${result.lp} | ${result.tier} ${result.rank}`);
  console.log('========================================');
  console.log('');

  const message = formatMatchMessage(result);

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
