import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount API router
app.use('/api', apiRouter);

// Unknown route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
