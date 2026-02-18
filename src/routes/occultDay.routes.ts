import { Router } from 'express';
import { getOccultDay, getOccultDayPuuidController } from '../controllers/occultDay.controller';

const occultDayRouter = Router();

occultDayRouter.get('/', getOccultDay);
occultDayRouter.get('/puuid', getOccultDayPuuidController);

export { occultDayRouter };