import { Request, Response, NextFunction } from 'express';
import { getOccultDayData, getOccultDayPuuid } from '../services/occultDay.service';
import { getState, getDistanceToGold } from '../services/tracker.service';

export async function getOccultDay(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getOccultDayData();

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOccultDayPuuidController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getOccultDayPuuid();

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export function getStats(
  _req: Request,
  res: Response,
) {
  const state = getState();
  const distance = getDistanceToGold();

  res.status(200).json({
    status: 'ok',
    data: {
      session: {
        wins: state.wins,
        losses: state.losses,
        winRate: state.wins + state.losses > 0
          ? Math.round((state.wins / (state.wins + state.losses)) * 100)
          : 0,
      },
      ranked: {
        tier: state.currentTier,
        rank: state.currentRank,
        lp: state.currentLP,
      },
      goldProgress: distance,
      lpHistory: state.lpHistory,
    },
  });
}

