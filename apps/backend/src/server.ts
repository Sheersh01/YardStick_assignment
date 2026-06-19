import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from packages/.env
dotenv.config({ path: path.resolve(__dirname, '../../../packages/.env') });

import chatRouter from './routes/chat.route';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
