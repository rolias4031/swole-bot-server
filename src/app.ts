// server
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cron from 'node-cron';
import routes from './api/index';
import bot from './bot/bot';

// setup
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(routes);

cron.schedule('0 34 10 * * *', async () => {
  console.log('running cron');
  await bot.api.sendMessage(
    process.env.CHAT_ID || '',
    "Hey Sailor, how's your building going today?",
  );
});

// start server
const server = app.listen(port, () => {
  console.log(`Bot server running on port ${port}`);
});

// shutdown function
function shutdown() {
  bot.stop();
  server.close((err) => {
    console.log('Express server closed');
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
