/**
 * 就職してから28歳までの男子専門！お悩み名言励ましBOT
 * LINE → Render → Dify（query対応）→ LINE
 */

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// === 環境変数 ===========================
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || process.env.CHANNEL_ACCESS_TOKEN;
const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
// =======================================

/** LINEからのWebhookを受け取るエンドポイント */
app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    // テキストメッセージのみ処理
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      let replyText = 'ただいま混み合っています。しばらくしてからもう一度お試しください。';

      try {
        // === Difyへメッセージ送信（queryベース） ===================
        const difyRes = await axios.post(
          DIFY_API_URL,
          {
            query: userMessage,                  // ← ← ← これが重要！
            user: event.source.userId,
            response_mode: 'blocking'
          },
          {
            headers: {
              Authorization: `Bearer ${DIFY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        replyText = difyRes.data.answer || replyText;
        console.log('Dify success:', replyText);
      } catch (err) {
        console.error('Dify error:', err.response?.status, err.response?.data);
      }

      try {
        // === LINEへ返信 ============================
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: replyText }]
          },
          {
            headers: {
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (err) {
        console.error('LINE reply error:', err.response?.status, err.response?.data);
      }
    }
  }

  res.sendStatus(200);
});

// === サーバー起動 ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BOT is running on port ${PORT}`));
