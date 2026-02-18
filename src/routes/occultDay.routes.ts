import { Router } from 'express';
import { getOccultDay, getOccultDayPuuidController, getStats } from '../controllers/occultDay.controller';

const occultDayRouter = Router();

occultDayRouter.get('/', getOccultDay);
occultDayRouter.get('/puuid', getOccultDayPuuidController);
occultDayRouter.get('/stats', getStats);

export { occultDayRouter };