import { Request, Response, NextFunction } from 'express';
import { getOccultDayData, getOccultDayPuuid } from '../services/occultDay.service';

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
