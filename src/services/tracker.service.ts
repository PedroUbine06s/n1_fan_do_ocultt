const RANK_LADDER = [
  'IRON IV', 'IRON III', 'IRON II', 'IRON I',
  'BRONZE IV', 'BRONZE III', 'BRONZE II', 'BRONZE I',
  'SILVER IV', 'SILVER III', 'SILVER II', 'SILVER I',
  'GOLD IV', 'GOLD III', 'GOLD II', 'GOLD I',
  'PLATINUM IV', 'PLATINUM III', 'PLATINUM II', 'PLATINUM I',
  'EMERALD IV', 'EMERALD III', 'EMERALD II', 'EMERALD I',
  'DIAMOND IV', 'DIAMOND III', 'DIAMOND II', 'DIAMOND I',
  'MASTER I', 'GRANDMASTER I', 'CHALLENGER I',
];

const GOLD_IV_INDEX = RANK_LADDER.indexOf('GOLD IV');
const IRON_I_INDEX = RANK_LADDER.indexOf('IRON I');

export interface TrackerState {
  lastMatchId: string | null;
  lastActiveGameId: number | null;
  wins: number;
  losses: number;
  lpHistory: { lp: number; tier: string; rank: string; timestamp: Date }[];
  currentTier: string;
  currentRank: string;
  currentLP: number;
}

const state: TrackerState = {
  lastMatchId: null,
  lastActiveGameId: null,
  wins: 0,
  losses: 0,
  lpHistory: [],
  currentTier: '',
  currentRank: '',
  currentLP: 0,
};

export function getState(): TrackerState {
  return { ...state, lpHistory: [...state.lpHistory] };
}

export function setLastMatchId(matchId: string): void {
  state.lastMatchId = matchId;
}

export function setLastActiveGameId(gameId: number | null): void {
  state.lastActiveGameId = gameId;
}

export function recordWin(): void {
  state.wins++;
}

export function recordLoss(): void {
  state.losses++;
}

export function updateRankInfo(tier: string, rank: string, lp: number): void {
  state.currentTier = tier;
  state.currentRank = rank;
  state.currentLP = lp;

  state.lpHistory.push({
    lp,
    tier,
    rank,
    timestamp: new Date(),
  });
}

export function getDistanceToRank(targetRank: string, goal: 'climb' | 'drop' = 'climb'): { divisions: number; estimatedLP: number; currentPosition: string; alreadyThere: boolean } {
  const currentKey = `${state.currentTier} ${state.currentRank}`;
  const currentIndex = RANK_LADDER.indexOf(currentKey);
  const targetIndex = RANK_LADDER.indexOf(targetRank);

  if (currentIndex === -1 || targetIndex === -1) {
    return {
      divisions: 0,
      estimatedLP: 0,
      currentPosition: currentKey,
      alreadyThere: false,
    };
  }

  const alreadyThere = goal === 'climb' ? currentIndex >= targetIndex : currentIndex <= targetIndex;

  if (alreadyThere) {
    return {
      divisions: 0,
      estimatedLP: 0,
      currentPosition: currentKey,
      alreadyThere: true,
    };
  }

  const divisionsAway = Math.abs(targetIndex - currentIndex);
  let estimatedLP = 0;

  if (goal === 'climb') {
    const lpInCurrentDivision = 100 - state.currentLP;
    estimatedLP = lpInCurrentDivision + (divisionsAway - 1) * 100;
  } else {
    // Para descer (drop): LP atual + (divisões - 1) * 100
    estimatedLP = state.currentLP + (divisionsAway - 1) * 100;
  }

  return {
    divisions: divisionsAway,
    estimatedLP,
    currentPosition: currentKey,
    alreadyThere: false,
  };
}

export function getDistanceToGold(): { divisions: number; estimatedLP: number; currentPosition: string; alreadyGold: boolean } {
  const dist = getDistanceToRank('GOLD IV', 'climb');
  return {
    divisions: dist.divisions,
    estimatedLP: dist.estimatedLP,
    currentPosition: dist.currentPosition,
    alreadyGold: dist.alreadyThere,
  };
}

export function getDistanceToIronI(): { divisions: number; estimatedLP: number; currentPosition: string; alreadyIronI: boolean } {
  const dist = getDistanceToRank('IRON I', 'drop');
  return {
    divisions: dist.divisions,
    estimatedLP: dist.estimatedLP,
    currentPosition: dist.currentPosition,
    alreadyIronI: dist.alreadyThere,
  };
}
