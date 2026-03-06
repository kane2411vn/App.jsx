#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Empire Council — Smart Notifications (Telegram)
// Gửi nhắc nhở theo lịch ngày + insights AI cho các block quan trọng
//
// DEPLOY:
//   1. Upload file lên VPS: scp empire-notify.js deploy@76.13.220.238:/home/deploy/
//   2. Test thủ công: node /home/deploy/empire-notify.js --test
//   3. Thêm cron (mỗi phút):
//      * * * * * /usr/bin/node /home/deploy/empire-notify.js >> /var/log/empire-notify.log 2>&1
//
// ENV VARS (set trong /home/deploy/.env hoặc cron):
//   TELEGRAM_TOKEN   — bot token từ @BotFather
//   TELEGRAM_CHAT_ID — chat ID của bạn
//   OPENROUTER_KEY   — API key cho AI insights (tuỳ chọn)
// ─────────────────────────────────────────────────────────────────────────────

// Load .env nếu có
try {
  const fs = require("fs");
  if (fs.existsSync("/home/deploy/.env")) {
    fs.readFileSync("/home/deploy/.env", "utf8")
      .split("\n")
      .forEach(line => {
        const [k, ...v] = line.split("=");
        if (k && v.length) process.env[k.trim()] = v.join("=").trim();
      });
  }
} catch {}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID        = process.env.TELEGRAM_CHAT_ID;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const TEST_MODE      = process.argv.includes("--test");
const FORCE_BLOCK    = process.argv.find(a => a.startsWith("--block="))?.split("=")[1];

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error("❌ Thiếu TELEGRAM_TOKEN hoặc TELEGRAM_CHAT_ID");
  if (!TEST_MODE) process.exit(1);
}

// ─── LỊCH NGÀY (sync với App.jsx SCHED) ─────────────────────────────────────
const SCHED = [
  { id:"sc01", t:"05:30", e:"☀️",  n:"Thức dậy + 500ml nước",
    note:"Không nhìn điện thoại 15 phút đầu. Để não boot trong yên tĩnh.",
    aiAgent: null },
  { id:"sc02", t:"05:45", e:"🏃",  n:"Tập thể dục — 1 giờ",
    note:"HIIT / gym / chạy bộ. ROI cao nhất cho não bộ.",
    aiAgent: null },
  { id:"sc03", t:"06:45", e:"🧘",  n:"Thiền + tắm lạnh + ăn sáng",
    note:"10p thiền, tắm lạnh 2p, ăn protein cao.",
    aiAgent: null },
  { id:"sc04", t:"07:15", e:"🏭",  n:"Daily Briefing với Carnegie",
    note:"Hỏi: '3 việc quan trọng nhất hôm nay?' — ghi ra, cam kết.",
    aiAgent: "Carnegie",
    aiPrompt: "Bạn là Andrew Carnegie. Hôm nay là {{DATE}}. Cho tôi 1 câu insight ngắn gọn, 1 việc cụ thể nên làm nhất hôm nay, và 1 cảnh báo cần tránh. Format:\n💡 {{INSIGHT}}\n⚡ {{ACTION}}\n⚠️ {{WARNING}}\nNgắn gọn, mỗi dòng 1 câu. Tiếng Việt." },
  { id:"sc05", t:"07:30", e:"📖",  n:"Đọc sách — 30 phút",
    note:"Đọc trong yên lặng. Ghi key insight. 30p/ngày = 12 cuốn/năm.",
    aiAgent: null },
  { id:"sc06", t:"08:00", e:"🇬🇧", n:"Học tiếng Anh — 1 giờ",
    note:"Anki vocab 20p + podcast business 40p.",
    aiAgent: null },
  { id:"sc07", t:"09:00", e:"🇨🇳", n:"Học tiếng Trung — 2 giờ",
    note:"HSK flashcards 30p + đọc hiểu 30p + luyện output 60p.",
    aiAgent: null },
  { id:"sc08", t:"11:00", e:"☕",  n:"Giải lao + stretching",
    note:"Não cần reset sau 2h. Đứng dậy, đi lại, uống nước.",
    aiAgent: null },
  { id:"sc09", t:"11:20", e:"⚡",  n:"Build Empire Council",
    note:"Deep work: code, agent, deploy. Tắt mọi thứ. Chỉ build.",
    aiAgent: null },
  { id:"sc10", t:"13:00", e:"🍱",  n:"Ăn trưa + nghỉ trưa",
    note:"Ăn đủ dinh dưỡng. Nằm nghỉ 20-30p — não consolidate thông tin.",
    aiAgent: null },
  { id:"sc11", t:"14:00", e:"💻",  n:"Build + học kỹ thuật — 1.5h",
    note:"TypeScript, Cloudflare docs, hoặc tiếp tục project buổi sáng.",
    aiAgent: null },
  { id:"sc12", t:"15:30", e:"✍️",  n:"Output tiếng Anh — 30 phút",
    note:"Viết journal tiếng Anh hoặc speaking practice.",
    aiAgent: null },
  { id:"sc13", t:"16:00", e:"🚶",  n:"Đi bộ ngoài trời",
    note:"Ánh sáng tự nhiên reset cortisol. Không device. Để não wander.",
    aiAgent: null },
  { id:"sc14", t:"16:30", e:"🎯",  n:"Tự do / Side projects",
    note:"Hobby, networking, hoặc bất cứ thứ gì bạn muốn.",
    aiAgent: null },
  { id:"sc15", t:"18:00", e:"🍜",  n:"Ăn tối + thư giãn",
    note:"Không làm việc. Ăn chậm. Não cần hard off-mode để recover.",
    aiAgent: null },
  { id:"sc16", t:"19:00", e:"🏛️", n:"Review với Hội Đồng",
    note:"Phân tích 1 quyết định quan trọng trong ngày.",
    aiAgent: "Aristotle",
    aiPrompt: "Bạn là Aristotle. Hôm nay là {{DATE}}. Hỏi tôi 1 câu phản tư (reflection question) sắc bén về ngày hôm nay — giúp tôi học từ trải nghiệm và cải thiện. Chỉ 1 câu hỏi ngắn, mạnh, thực chất. Tiếng Việt." },
  { id:"sc17", t:"19:30", e:"📋",  n:"Plan ngày mai + Journal",
    note:"3 MITs ngày mai. 3 điều học được. 1 điều cần làm khác đi.",
    aiAgent: null },
  { id:"sc18", t:"20:00", e:"📵",  n:"Wind down — không màn hình",
    note:"Đọc sách giấy hoặc nghe nhạc. Blue light off.",
    aiAgent: null },
  { id:"sc19", t:"21:30", e:"😴",  n:"Ngủ — mục tiêu 8 tiếng",
    note:"Ngủ đủ = học nhanh 2×, quyết định tốt hơn. Không thương lượng.",
    aiAgent: null },
];

// ─── DEDUP KEY — tránh gửi 2 lần trong cùng 1 phút ─────────────────────────
const fs = require("fs");
const SENT_FILE = "/tmp/empire_notify_sent.json";

const getSent = () => {
  try {
    const data = JSON.parse(fs.readFileSync(SENT_FILE, "utf8"));
    const today = new Date().toDateString();
    if (data.date !== today) return {}; // reset mỗi ngày
    return data.sent || {};
  } catch { return {}; }
};

const markSent = (blockId) => {
  const today = new Date().toDateString();
  const sent = getSent();
  sent[blockId] = true;
  fs.writeFileSync(SENT_FILE, JSON.stringify({ date: today, sent }), "utf8");
};

// ─── TELEGRAM SENDER ─────────────────────────────────────────────────────────
const sendTelegram = async (text, options = {}) => {
  if (TEST_MODE) {
    console.log("\n📱 TELEGRAM MESSAGE:");
    console.log("─".repeat(50));
    console.log(text);
    console.log("─".repeat(50));
    return { ok: true };
  }
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_notification: options.silent || false,
      ...options,
    }),
  });
  const d = await r.json();
  if (!d.ok) throw new Error(`Telegram: ${d.description}`);
  return d;
};

// ─── AI INSIGHT (tuỳ chọn, chỉ cho block quan trọng) ────────────────────────
const getAIInsight = async (promptTemplate, dateStr) => {
  if (!OPENROUTER_KEY) return null;
  try {
    const prompt = promptTemplate.replace("{{DATE}}", dateStr);
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://empire.kgt.life",
        "X-Title": "Empire Notifications",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",  // Fast + cheap for notifications
        max_tokens: 200,
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });
    const d = await r.json();
    return d?.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("AI error:", e.message);
    return null;
  }
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
const main = async () => {
  const now      = new Date();
  const h        = now.getHours();
  const m        = now.getMinutes();
  const timeStr  = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  const dateStr  = now.toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const dayEmoji = ["🌙","📅","📅","📅","📅","📅","🌟"][now.getDay()]; // CN=🌙, T7=🌟

  console.log(`[${new Date().toISOString()}] Checking schedule at ${timeStr}...`);

  // Find matching schedule block
  const sent = getSent();
  let matched = SCHED.find(blk => blk.t === timeStr && !sent[blk.id]);

  // In test mode: use forced block or first block
  if (TEST_MODE) {
    if (FORCE_BLOCK) {
      matched = SCHED.find(blk => blk.id === FORCE_BLOCK) || SCHED[0];
    } else {
      matched = matched || SCHED[3]; // Default: Daily Briefing
    }
    console.log(`[TEST] Simulating block: ${matched.t} ${matched.n}`);
  }

  if (!matched) {
    console.log(`  No block at ${timeStr}`);
    return;
  }

  console.log(`  ✅ Matched: ${matched.t} — ${matched.n}`);

  // Build message
  let msg = `${dayEmoji} <b>EMPIRE — ${timeStr}</b>\n`;
  msg += `━━━━━━━━━━━━━━━\n`;
  msg += `${matched.e} <b>${matched.n}</b>\n`;
  msg += `<i>${matched.note}</i>\n`;

  // Add AI insight for special blocks
  if (matched.aiAgent && matched.aiPrompt) {
    msg += `\n⏳ Đang lấy insight từ ${matched.aiAgent}...\n`;

    // Send base message first, then AI insight separately
    try {
      await sendTelegram(msg);

      const insight = await getAIInsight(matched.aiPrompt, dateStr);
      if (insight) {
        const aiMsg =
          `🤖 <b>${matched.aiAgent.toUpperCase()}</b>\n` +
          `━━━━━━━━━━━━━━━\n` +
          insight.trim() + `\n\n` +
          `🔗 <a href="https://empire.kgt.life">empire.kgt.life</a>`;
        await sendTelegram(aiMsg);
      }
    } catch (e) {
      console.error("Send error:", e.message);
    }
  } else {
    // Simple block — add quick action tip
    msg += `\n🎯 <a href="https://empire.kgt.life">Mở Empire Council</a>`;
    try {
      await sendTelegram(msg);
    } catch (e) {
      console.error("Send error:", e.message);
    }
  }

  // Mark as sent (prevent duplicates)
  if (!TEST_MODE) markSent(matched.id);
  console.log(`  📱 Sent notification for ${matched.id}`);
};

main().catch(e => {
  console.error(`[${new Date().toISOString()}] ERROR:`, e.message);
  process.exit(1);
});
