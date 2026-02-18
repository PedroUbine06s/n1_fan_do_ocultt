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

export function notifyMatchResult(result: MatchResult): void {
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
}
