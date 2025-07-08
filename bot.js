// bot.js - Sử dụng webhook + Groq API miễn phí

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

// Hàm gọi Groq API để trả lời hài hước
async function getFunnyReply(prompt) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Model miễn phí, nhanh
        messages: [
          { role: 'system', content: 'Bạn là một trợ lý hài hước kiểu GenZ Việt Nam, thích cà khịa một cách thông minh.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Lỗi gọi Groq API:", err.message);
    return "Bot hơi khịa quá tay, giờ bị đơ... đợi tí nha 😅";
  }
}

// Khởi tạo bot Telegram không polling (vì dùng webhook)
const bot = new TelegramBot(token);

// Webhook route từ Telegram
app.post(`/bot${token}`, async (req, res) => {
  console.log("📥 Đã nhận request từ Telegram:", JSON.stringify(req.body));

  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const userText = msg.text || '';

  console.log("📌 Tin nhắn từ:", msg.chat.type, "| ID:", chatId);


  if (msg.from.is_bot || msg.new_chat_members) return res.sendStatus(200);

  // ✅ Cho phép nhắn riêng hoặc nếu là nhóm thì kiểm tra ID nhóm
  if (msg.chat.type !== 'private' && !allowedGroupIds.includes(chatId)) return res.sendStatus(200);

  bot.sendChatAction(chatId, "typing");
  const reply = await getFunnyReply(userText);
  bot.sendMessage(chatId, `🤖 ${reply}`);
  res.sendStatus(200);
});

// Thiết lập webhook cho Telegram
bot.setWebHook(`${process.env.BASE_URL}/bot${token}`);

// Khởi chạy express server
app.listen(port, () => {
  console.log(`🚀 Bot đang chạy webhook tại cổng ${port}`);
});
