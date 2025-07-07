import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Danh sách ID nhóm được phép hoạt động
const allowedGroupIds = [-1001234567890, -1009876543210];
bot.on("message", (msg) => {
  console.log("🆔 Chat ID:", msg.chat.id);
});
async function getFunnyReply(prompt) {
  const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: '/usr/bin/google-chrome'  // Render dùng Chrome có sẵn
});

  try {
    const page = await browser.newPage();
    await page.goto('https://you.com/', { waitUntil: 'networkidle2' });
    await page.click('a[href="/chat"]');
    await page.waitForSelector('textarea');
    const message = `Trả lời hài hước cho tin nhắn: "${prompt}"`;
    await page.type('textarea', message);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    const response = await page.evaluate(() => {
      const msgBlocks = document.querySelectorAll('.chatMessage') || [];
      return msgBlocks[msgBlocks.length - 1]?.innerText || "Tôi khá là bí rồi đó 😅";
    });

    return response;
  } catch (err) {
    console.error("Lỗi puppeteer:", err.message);
    return 'Đùa , nhắn lằm nhắn lốn, từ từ bot đang suy nghĩ 😅';
  } finally {
    await browser.close();
  }
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text || '';

  // Bỏ qua bot hoặc người mới
  if (msg.from.is_bot || msg.new_chat_members) return;

  // Chỉ xử lý nếu trong danh sách group cho phép
  if (!allowedGroupIds.includes(chatId)) return;

  bot.sendChatAction(chatId, "typing");
  const reply = await getFunnyReply(userText);
  bot.sendMessage(chatId, `🤖 {" " + reply}`);
});
