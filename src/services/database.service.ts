import { prisma } from './db-init.service';

// Avoid importing MatchResult from notification.service to prevent circular imports.
export interface MatchResultRecord {
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

export async function saveMatch(matchResult: MatchResultRecord): Promise<boolean> {
  try {
    await prisma.match.create({
      data: {
        matchId: matchResult.matchId,
        win: matchResult.win,
        kills: matchResult.kills,
        deaths: matchResult.deaths,
        assists: matchResult.assists,
        championName: matchResult.championName,
        lp: matchResult.lp,
        tier: matchResult.tier,
        rank: matchResult.rank,
      },
    });

    console.log(`[DB] Match ${matchResult.matchId} salvo no banco de dados`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.log(`[DB] Match ${matchResult.matchId} já existe no banco de dados`);
      return true;
    }
    console.error(`[DB] Erro ao salvar match:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getMatchHistory(limit = 10): Promise<any[]> {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return matches;
  } catch (error) {
    console.error(`[DB] Erro ao buscar histórico:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getStats() {
  try {
    const matches = await prisma.match.findMany();
    const wins = matches.filter((m: any) => m.win).length;
    const losses = matches.length - wins;
    const totalKills = matches.reduce((sum: number, m: any) => sum + m.kills, 0);
    const totalDeaths = matches.reduce((sum: number, m: any) => sum + m.deaths, 0);
    const totalAssists = matches.reduce((sum: number, m: any) => sum + m.assists, 0);
    const avgKDA = matches.length > 0 ? ((totalKills + totalAssists) / (totalDeaths || 1)).toFixed(2) : '0.00';

    return {
      totalMatches: matches.length,
      wins,
      losses,
      winRate: matches.length > 0 ? ((wins / matches.length) * 100).toFixed(2) : '0.00',
      totalKills,
      totalDeaths,
      totalAssists,
      avgKDA,
    };
  } catch (error) {
    console.error(`[DB] Erro ao calcular stats:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// Recipients management
export interface RecipientRecord {
  id?: number;
  phone: string;
  name?: string | null;
  active?: boolean;
}

export async function listRecipients(activeOnly = true): Promise<RecipientRecord[]> {
  try {
    const where = activeOnly ? { where: { active: true } } : {};
    const recipients = await (prisma as any).recipient.findMany(where);
    return recipients;
  } catch (error) {
    console.error('[DB] Erro ao listar recipients:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function addRecipient(phone: string, name?: string): Promise<boolean> {
  try {
    await (prisma as any).recipient.create({ data: { phone, name, active: true } });
    console.log(`[DB] Recipient ${phone} adicionado`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.log(`[DB] Recipient ${phone} já existe`);
      return true;
    }
    console.error('[DB] Erro ao adicionar recipient:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function removeRecipient(phone: string): Promise<boolean> {
  try {
    await (prisma as any).recipient.delete({ where: { phone } });
    console.log(`[DB] Recipient ${phone} removido`);
    return true;
  } catch (error) {
    console.error('[DB] Erro ao remover recipient:', error instanceof Error ? error.message : error);
    return false;
  }
}
