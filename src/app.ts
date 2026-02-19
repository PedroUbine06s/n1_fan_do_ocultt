import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { healthRouter } from './routes/health.routes';
import { notificationRouter } from './routes/notification.routes';
import { statsRouter } from './routes/stats.routes';
import { errorHandler } from './middlewares/error-handler.middleware';
import { occultDayRouter } from './routes/occultDay.routes';
import recipientsRouter from './routes/recipients.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/stats', statsRouter);
app.use('/api/occult-day', occultDayRouter);
app.use('/api/recipients', recipientsRouter);
app.use(errorHandler);

export { app };
