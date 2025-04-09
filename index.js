const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const DIFY_API_URL = process.env.DIFY_API_URL;

app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message') {
      const userMessage = event.message.text;
      const difyReply = await axios.post(`${DIFY_API_URL}`, {
        inputs: { input: userMessage }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const replyText = difyReply.data.answer || 'うまく応答できませんでした';

      await axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      }, {
        headers: {
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }
  res.sendStatus(200);
});

app.listen(3000, () => console.log('BOT is running on port 3000'));
