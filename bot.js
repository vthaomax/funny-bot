// bot.js - Sử dụng webhook thay cho polling

import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// Danh sách nhóm được phép hoạt động
const allowedGroupIds = [-1001234567890, -1009876543210];

// Hàm gọi GPT API để trả lời hài hước
async function getFunnyReply(prompt) {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'system', content: 'Bạn là một trợ lý hài hước, thông minh, hay cà khịa theo kiểu GenZ Việt Nam.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://t.me/ig2fa',
          'X-Title': 'Telegram funny bot'
        }
      }
    );
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Lỗi gọi OpenRouter:", err.message);
    return "Đùa, nhắn lằm nhắn lồn, từ từ bot đang suy nghĩ 😅";
  }
}

// Khởi tạo bot với chế độ webhook (không polling)
const bot = new TelegramBot(token);

// Route tiếp nhận webhook từ Telegram
app.post(`/bot${token}`, async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const userText = msg.text || '';
  if (msg.from.is_bot || msg.new_chat_members) return res.sendStatus(200);
  if (!allowedGroupIds.includes(chatId)) return res.sendStatus(200);

  bot.sendChatAction(chatId, "typing");
  const reply = await getFunnyReply(userText);
  bot.sendMessage(chatId, `🤖 ${reply}`);
  res.sendStatus(200);
});
bot.on("message", (msg) => {
  console.log("📌 Chat ID:", msg.chat.id);
});
// Thiết lập webhook cho Telegram
bot.setWebHook(`${process.env.BASE_URL}/bot${token}`);

// Khởi chạy server
app.listen(port, () => {
  console.log(`🚀 Bot đang chạy webhook tại cổng ${port}`);
});
