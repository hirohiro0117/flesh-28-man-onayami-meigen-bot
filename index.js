const express = require("express");
const axios = require("axios");
const line = require("@line/bot-sdk");

const app = express();
app.use(express.json());

// LINE設定（Renderの環境変数に設定したLINE_CHANNEL_ACCESS_TOKEN）
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];
    if (!event) return res.sendStatus(200);

    const userMessage = event.message?.text;
    const replyToken = event.replyToken;
    if (!userMessage || !replyToken) return res.sendStatus(200);

    // Dify APIへ問い合わせ (user パラメータ必須)
    const response = await axios.post(
      "https://api.dify.ai/v1/chat-messages",
      {
        inputs: {},
        query: userMessage,
        user: "anonymous"  // 必須パラメータ "user"、必要なら event.source.userId などに置き換え
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`
        }
      }
    );

    const replyMessage = response.data?.answer || "すみません、今はお答えできません…";

    // LINEに返信
    await client.replyMessage(replyToken, {
      type: "text",
      text: replyMessage
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("エラー発生:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("LINE ↔ Dify Webhook is running!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`起動中: http://localhost:${port}`);
});
