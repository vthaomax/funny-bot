// bot.js - Sử dụng webhook + Groq API miễn phí + kiểm duyệt mạnh (link, từ cấm, spam)

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
const allowedGroupIds = [-1002556187305];

// Danh sách tên miền được phép gửi link
const allowedDomains = [
  "google.com", "facebook.com", "tiktok.com", "shopee.vn",
  "instagram.com", "ig2fa.com", "cloneig.shop",
  "taikhoanfb.shop", "threads.net", "twitter.com"
];

// Từ cấm / spam (không liên quan đến link)
const bannedWords = ["@everyone", "lô đề", "xóc đĩa", "tặng tiền"];

// Từ spam thường gặp
const spamPatterns = [
  /liên hệ (zalo|fb|telegram)/i,
  /inbox/i,
  /kèo thơm/i,
  /trả phí/i,
  /(hack|crack|tool)/i
];

// Hàm gọi Groq API để trả lời hài hước
async function getFunnyReply(prompt) {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

// Hàm kiểm tra link không hợp lệ
function containsInvalidLink(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  return urls.some(url => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      return !allowedDomains.some(domain => hostname === domain || hostname.endsWith("." + domain));
    } catch {
      return true;
    }
  });
}

// Hàm kiểm tra nội dung spam
function isSpam(text) {
  return spamPatterns.some(pattern => pattern.test(text));
}

// Khởi tạo bot Telegram không polling (vì dùng webhook)
const bot = new TelegramBot(token);

// Webhook route từ Telegram
app.post(`/bot${token}`, async (req, res) => {
  const msg = req.body.message;
  const newMembers = req.body.message?.new_chat_members;
  if (!msg && !newMembers) return res.sendStatus(200);

  const chatId = msg?.chat?.id || req.body.message.chat.id;

  // Chào mừng thành viên mới
  if (newMembers) {
    for (const member of newMembers) {
      if (!member.is_bot) {
        bot.sendMessage(chatId, `👋 Chào mừng @${member.username || member.first_name} đã đến với nhóm! Nhớ đọc nội quy và chuẩn bị tinh thần bị cà khịa nhé 😎`);
      }
    }
    return res.sendStatus(200);
  }

  const userText = msg.text || '';
  if (msg.from.is_bot) return res.sendStatus(200);
  if (msg.chat.type !== 'private' && !allowedGroupIds.includes(chatId)) return res.sendStatus(200);

  const containsBannedWord = bannedWords.some(word => userText.toLowerCase().includes(word));
  const hasInvalidLink = containsInvalidLink(userText);
  const isSpamMsg = isSpam(userText);

  if (containsBannedWord || hasInvalidLink || isSpamMsg) {
    try {
      await bot.deleteMessage(chatId, msg.message_id);
    } catch (err) {
      console.warn("❌ Không thể xóa tin nhắn vi phạm:", err.message);
    }
    try {
      await bot.sendMessage(chatId, `🚨 Tin nhắn vi phạm nội quy (spam, từ cấm hoặc link không hợp lệ) đã bị xóa!`, { reply_to_message_id: msg.message_id });
    } catch (err) {
      console.warn("❌ Không thể gửi cảnh báo:", err.message);
    }
    return res.sendStatus(200);
  }

  // Trả lời hài hước
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
