# Telegram Bot: Reply hài hước từ You.com (Puppeteer)
## Cách chạy bot trên local hoặc deploy Render/Railway

### 1. Cài đặt
```bash
npm install
```

### 2. Tạo file `.env`
```env
TELEGRAM_BOT_TOKEN=your_token_here
```

### 3. Chạy bot
```bash
npm start
```

### 4. Triển khai lên Render
- Tạo service mới từ repo GitHub
- Add biến môi trường: `TELEGRAM_BOT_TOKEN`
- Build Command: `npm install`
- Start Command: `npm start`
- Chọn Node >= 16

### 5. Nếu bị chặn puppeteer, thêm dòng:
```js
args: ['--no-sandbox']
```
