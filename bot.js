import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Danh sách ID nhóm được phép hoạt động
const allowedGroupIds = [-1001234567890, -1009876543210];

// Hàm gọi GPT qua OpenRouter để sinh reply hài hước
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
    return "Đùa, nhắn lằm nhắn lốn, từ từ bot đang suy nghĩ 😅";
  }
}

// Xử lý tin nhắn từ group
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text || '';

  if (msg.from.is_bot || msg.new_chat_members) return;
  if (!allowedGroupIds.includes(chatId)) return;

  bot.sendChatAction(chatId, "typing");
  const reply = await getFunnyReply(userText);
  bot.sendMessage(chatId, `🤖 ${reply}`);
});
