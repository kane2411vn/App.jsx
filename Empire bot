// ─── EMPIRE COUNCIL — TELEGRAM BOT ──────────────────────────────────────────
// Deploy: node empire-bot.js
// Requires: TELEGRAM_TOKEN và OPENROUTER_KEY trong environment

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-5";

if (!TELEGRAM_TOKEN || !OPENROUTER_KEY) {
  console.error("❌ Thiếu TELEGRAM_TOKEN hoặc OPENROUTER_KEY");
  process.exit(1);
}

// ─── AGENTS ──────────────────────────────────────────────────────────────────
const AGENTS = {
  carnegie:   { name: "Carnegie",    icon: "🤝", prompt: "Bạn là Dale Carnegie — chuyên gia về quan hệ con người, giao tiếp, thuyết phục. Tư vấn ngắn gọn, thực tế. Tiếng Việt. Không dùng markdown." },
  jobs:       { name: "Steve Jobs",  icon: "🍎", prompt: "Bạn là Steve Jobs — tầm nhìn sản phẩm, design thinking, 'think different'. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
  buffett:    { name: "Buffett",     icon: "💰", prompt: "Bạn là Warren Buffett — value investing, tư duy dài hạn, kiên nhẫn. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
  naval:      { name: "Naval",       icon: "🧘", prompt: "Bạn là Naval Ravikant — specific knowledge, leverage, wealth creation. Súc tích như aphorism. Tiếng Việt. Không dùng markdown." },
  aristotle:  { name: "Aristotle",   icon: "🏛️", prompt: "Bạn là Aristotle — logic, ethics, first principles. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
  dalio:      { name: "Ray Dalio",   icon: "📊", prompt: "Bạn là Ray Dalio — principles, macro thinking, radical transparency. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
  sun_tzu:    { name: "Sun Tzu",     icon: "⚔️", prompt: "Bạn là Tôn Tử — chiến lược, biết người biết ta, thắng trước khi đánh. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
  graham_p:   { name: "Paul Graham", icon: "🔶", prompt: "Bạn là Paul Graham — startup thinking, founder mindset, YC wisdom. Tư vấn ngắn gọn. Tiếng Việt. Không dùng markdown." },
};

const COUNCIL_AGENTS = ["carnegie", "jobs", "buffett", "naval", "aristotle", "dalio"];

// ─── OPENROUTER CALL ─────────────────────────────────────────────────────────
async function callAI(systemPrompt, userMessage) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "https://empire.kgt.life",
      "X-Title": "Empire Mission Control",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Không có phản hồi.";
}

// ─── TELEGRAM SEND ────────────────────────────────────────────────────────────
async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }),
  });
}

// ─── COMMAND HANDLERS ─────────────────────────────────────────────────────────
async function handleStart(chatId) {
  const msg = [
    "👋 <b>Empire Mission Control Bot</b>",
    "",
    "Hỏi 42 cố vấn AI của bạn ngay từ Telegram!",
    "",
    "<b>Lệnh:</b>",
    "/ask [agent] [câu hỏi] — Hỏi 1 agent",
    "/council [câu hỏi] — Hỏi cả Hội Đồng",
    "/agents — Danh sách agents",
    "/help — Xem hướng dẫn",
    "",
    "<b>Ví dụ:</b>",
    "/ask carnegie Tôi nên làm gì hôm nay?",
    "/council Chiến lược Q2 2026 của tôi?",
  ].join("\n");
  await sendMessage(chatId, msg);
}

async function handleAgents(chatId) {
  const lines = ["📋 <b>Danh sách Agents:</b>", ""];
  for (const [id, ag] of Object.entries(AGENTS)) {
    lines.push(`${ag.icon} <b>${ag.name}</b> — /ask ${id} [câu hỏi]`);
  }
  lines.push("", "🌐 Xem đầy đủ 42 agents tại: https://empire.kgt.life");
  await sendMessage(chatId, lines.join("\n"));
}

async function handleAsk(chatId, agentId, question) {
  const agent = AGENTS[agentId];
  if (!agent) {
    await sendMessage(chatId, `❌ Không tìm thấy agent <b>${agentId}</b>.\nDùng /agents để xem danh sách.`);
    return;
  }
  if (!question.trim()) {
    await sendMessage(chatId, `❓ Bạn chưa nhập câu hỏi!\nVí dụ: /ask ${agentId} Tôi nên làm gì hôm nay?`);
    return;
  }
  await sendMessage(chatId, `${agent.icon} <i>${agent.name} đang suy nghĩ...</i>`);
  try {
    const reply = await callAI(agent.prompt, question);
    await sendMessage(chatId, `${agent.icon} <b>${agent.name}:</b>\n\n${reply}`);
  } catch (e) {
    await sendMessage(chatId, `⚠️ Lỗi: ${e.message}`);
  }
}

async function handleCouncil(chatId, question) {
  if (!question.trim()) {
    await sendMessage(chatId, "❓ Bạn chưa nhập câu hỏi!\nVí dụ: /council Chiến lược Q2 2026 của tôi?");
    return;
  }
  await sendMessage(chatId, `🏛️ <i>Hội Đồng đang họp...</i>`);
  const names = COUNCIL_AGENTS.map(id => AGENTS[id].name).join(", ");
  const sys = `Bạn là hội đồng cố vấn gồm: ${names}. Với mỗi câu hỏi, mỗi cố vấn trả lời ngắn gọn 1-2 câu theo format:\n${COUNCIL_AGENTS.map(id => `${AGENTS[id].icon} ${AGENTS[id].name}:`).join("\n")}\n\nKẾT LUẬN: [1 câu hành động]\n\nTiếng Việt. Không dùng markdown hay **.`;
  try {
    const reply = await callAI(sys, question);
    await sendMessage(chatId, `🏛️ <b>Hội Đồng:</b>\n\n${reply}`);
  } catch (e) {
    await sendMessage(chatId, `⚠️ Lỗi: ${e.message}`);
  }
}

async function handleHelp(chatId) {
  const msg = [
    "📖 <b>Hướng dẫn sử dụng:</b>",
    "",
    "<b>/start</b> — Chào mừng",
    "<b>/ask [agent] [câu hỏi]</b> — Hỏi 1 agent cụ thể",
    "<b>/council [câu hỏi]</b> — Hỏi cả Hội Đồng 6 cố vấn",
    "<b>/agents</b> — Danh sách tất cả agents",
    "<b>/help</b> — Xem hướng dẫn này",
    "",
    "<b>Agents phổ biến:</b>",
    "carnegie, jobs, buffett, naval, aristotle, dalio, sun_tzu, graham_p",
    "",
    "💡 Tip: Câu hỏi càng cụ thể, câu trả lời càng chất lượng!",
    "",
    "🌐 Web: https://empire.kgt.life",
  ].join("\n");
  await sendMessage(chatId, msg);
}

// ─── PROCESS UPDATE ───────────────────────────────────────────────────────────
async function processUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text   = msg.text.trim();
  const parts  = text.split(" ");
  const cmd    = parts[0].toLowerCase().split("@")[0]; // handle /cmd@botname

  console.log(`[${new Date().toISOString()}] ${chatId}: ${text.slice(0, 80)}`);

  if (cmd === "/start") {
    await handleStart(chatId);
  } else if (cmd === "/agents") {
    await handleAgents(chatId);
  } else if (cmd === "/help") {
    await handleHelp(chatId);
  } else if (cmd === "/ask") {
    const agentId = parts[1]?.toLowerCase();
    const question = parts.slice(2).join(" ");
    await handleAsk(chatId, agentId, question);
  } else if (cmd === "/council") {
    const question = parts.slice(1).join(" ");
    await handleCouncil(chatId, question);
  } else if (!text.startsWith("/")) {
    // Free text → ask council
    await handleCouncil(chatId, text);
  }
}

// ─── POLLING LOOP ─────────────────────────────────────────────────────────────
let offset = 0;
async function poll() {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        processUpdate(update).catch(e => console.error("Handler error:", e.message));
      }
    }
  } catch (e) {
    console.error("Poll error:", e.message);
    await new Promise(r => setTimeout(r, 5000));
  }
  setTimeout(poll, 100);
}

// ─── START ────────────────────────────────────────────────────────────────────
console.log("🚀 Empire Council Bot starting...");
console.log(`📡 Model: ${MODEL}`);
poll().then(() => console.log("✅ Bot is running! Send /start to your bot."));
