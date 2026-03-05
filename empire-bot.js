#!/usr/bin/env node
// Empire Council — Auto Daily Briefing
// Chạy mỗi sáng 7h: gửi briefing từ 6 cố vấn qua Telegram
// Cron: 0 7 * * * /usr/bin/node /home/deploy/empire-briefing.js >> /var/log/empire-briefing.log 2>&1

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const CHAT_ID        = process.env.TELEGRAM_CHAT_ID; // ID của bạn

if (!TELEGRAM_TOKEN || !OPENROUTER_KEY || !CHAT_ID) {
  console.error("❌ Thiếu env vars: TELEGRAM_TOKEN, OPENROUTER_KEY, TELEGRAM_CHAT_ID");
  process.exit(1);
}

const MODEL = "anthropic/claude-sonnet-4-5";
const BASE  = "https://openrouter.ai/api/v1/chat/completions";

const AGENTS = [
  { id: "carnegie",  icon: "🤝", name: "Carnegie",   role: "human relations",
    sys: "Bạn là Dale Carnegie. Cho 1 insight về quan hệ con người, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
  { id: "jobs",      icon: "🍎", name: "Jobs",        role: "product vision",
    sys: "Bạn là Steve Jobs. Cho 1 insight về sản phẩm/tư duy, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
  { id: "buffett",   icon: "💰", name: "Buffett",     role: "long-term thinking",
    sys: "Bạn là Warren Buffett. Cho 1 insight về đầu tư/tư duy dài hạn, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
  { id: "naval",     icon: "🧘", name: "Naval",       role: "wealth & leverage",
    sys: "Bạn là Naval Ravikant. Cho 1 insight về wealth/leverage, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
  { id: "sun_tzu",   icon: "⚔️", name: "Sun Tzu",    role: "strategy",
    sys: "Bạn là Tôn Tử. Cho 1 insight về chiến lược, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
  { id: "dalio",     icon: "📊", name: "Dalio",       role: "principles",
    sys: "Bạn là Ray Dalio. Cho 1 insight về principles/radical truth, 1 hành động cụ thể hôm nay, 1 cảnh báo. Ngắn gọn, súc tích." },
];

async function callAI(sys, userMsg) {
  const r = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "https://empire.kgt.life",
      "X-Title": "Empire Council Briefing",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        { role: "system", content: sys },
        { role: "user",   content: userMsg },
      ],
    }),
  });
  const d = await r.json();
  if (d?.error) throw new Error(d.error.message);
  return d?.choices?.[0]?.message?.content || "";
}

async function sendTelegram(text) {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
  const d = await r.json();
  if (!d.ok) throw new Error(`Telegram error: ${d.description}`);
  return d;
}

async function main() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  console.log(`[${new Date().toISOString()}] Generating briefing for ${dateStr}...`);

  // Header message
  await sendTelegram(
    `⚡ <b>EMPIRE COUNCIL — DAILY BRIEFING</b>\n` +
    `📅 ${dateStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Đang tổng hợp insights từ 6 cố vấn...`
  );

  const userMsg = `Hôm nay là ${dateStr}. Hãy cho tôi insight quan trọng nhất, 1 hành động cụ thể nên làm hôm nay, và 1 cảnh báo/rủi ro cần tránh.\n\nFormat:\n💡 INSIGHT: [câu]\n⚡ HÀNH ĐỘNG: [việc cụ thể]\n⚠️ CẢNH BÁO: [rủi ro]\n\nNgắn gọn, súc tích, thực tế. Tiếng Việt.`;

  const results = [];

  // Get insights from each agent
  for (const ag of AGENTS) {
    try {
      console.log(`  Asking ${ag.name}...`);
      const reply = await callAI(ag.sys, userMsg);
      results.push({ ...ag, reply });

      const msg =
        `${ag.icon} <b>${ag.name.toUpperCase()}</b> <i>(${ag.role})</i>\n` +
        reply.trim();
      await sendTelegram(msg);
      await new Promise(r => setTimeout(r, 800)); // rate limit
    } catch (e) {
      console.error(`  Error with ${ag.name}:`, e.message);
    }
  }

  // Generate synthesis
  try {
    console.log("  Generating synthesis...");
    const allInsights = results.map(r => `${r.name}: ${r.reply}`).join("\n\n");
    const synthesis = await callAI(
      "Bạn là synthesis AI. Đọc insights từ hội đồng, tổng hợp ra 3 VIỆC ƯU TIÊN nhất hôm nay theo thứ tự quan trọng. Mỗi việc 1 câu ngắn. Tiếng Việt.",
      `Insights từ hội đồng:\n${allInsights}\n\nCho ra 3 việc ưu tiên hôm nay.`
    );

    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 <b>3 VIỆC ƯU TIÊN HÔM NAY</b>\n\n` +
      synthesis.trim() + `\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ <a href="https://empire.kgt.life">empire.kgt.life</a>`
    );
  } catch (e) {
    console.error("  Synthesis error:", e.message);
  }

  console.log(`[${new Date().toISOString()}] Briefing sent successfully!`);
}

main().catch(e => {
  console.error(`[${new Date().toISOString()}] FATAL:`, e.message);
  process.exit(1);
});
