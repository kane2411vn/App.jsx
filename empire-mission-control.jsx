import { useState, useRef, useEffect } from "react";

// ─── FONTS & DESIGN TOKENS ───────────────────────────────────────────────────
const GF = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap";
const C = {
  bg:    "#060709",
  s1:    "rgba(255,255,255,0.03)",
  s2:    "rgba(255,255,255,0.06)",
  bd:    "rgba(255,255,255,0.08)",
  bdH:   "rgba(255,255,255,0.16)",
  gold:  "#E8C547", gD: "rgba(232,197,71,0.08)",
  grn:   "#34D399", grnD: "rgba(52,211,153,0.08)",
  blu:   "#60A5FA", bluD: "rgba(96,165,250,0.08)",
  pur:   "#A78BFA", purD: "rgba(167,139,250,0.08)",
  org:   "#FB923C", orgD: "rgba(251,146,60,0.08)",
  red:   "#F87171", redD: "rgba(248,113,113,0.08)",
  cyn:   "#22D3EE", pk: "#F472B6",
  txt:   "#E8E3D8",
  mu:    "rgba(232,227,216,0.45)",
  fa:    "rgba(232,227,216,0.12)",
};
const F  = "'Syne', system-ui, sans-serif";
const FM = "'DM Mono', monospace";

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────
function Md({ text, accent }) {
  const col = accent || C.gold;
  const lines = (text || "").split("\n");
  const out = []; const buf = []; let k = 0;

  const fmt = (s) => {
    const parts = []; let rest = s, i = 0;
    while (rest) {
      const b = rest.indexOf("**");
      if (b === -1) { parts.push(<span key={i++}>{rest}</span>); break; }
      if (b > 0) parts.push(<span key={i++}>{rest.slice(0, b)}</span>);
      const e = rest.indexOf("**", b + 2);
      if (e === -1) { parts.push(<span key={i++}>{rest}</span>); break; }
      parts.push(<strong key={i++} style={{ color: col, fontWeight: 700 }}>{rest.slice(b + 2, e)}</strong>);
      rest = rest.slice(e + 2);
    }
    return parts;
  };

  const flush = () => {
    if (!buf.length) return;
    const items = buf.splice(0);
    out.push(
      <ul key={k++} style={{ margin: "4px 0 8px", paddingLeft: 18, lineHeight: 1.8 }}>
        {items.map((x, j) => <li key={j} style={{ fontSize: 13, color: C.txt, marginBottom: 2 }}>{fmt(x)}</li>)}
      </ul>
    );
  };

  lines.forEach((raw, i) => {
    const ln = raw.trimEnd();
    const h2 = ln.match(/^##\s+(.*)/);
    if (h2) { flush(); out.push(<p key={i} style={{ fontSize: 14, fontWeight: 700, color: col, margin: "12px 0 4px", lineHeight: 1.3 }}>{fmt(h2[1])}</p>); return; }
    const h3 = ln.match(/^###\s+(.*)/);
    if (h3) { flush(); out.push(<p key={i} style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "8px 0 3px" }}>{fmt(h3[1])}</p>); return; }
    if (/^---+$/.test(ln)) { flush(); out.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${C.bd}`, margin: "8px 0" }} />); return; }
    const li = ln.match(/^[-*]\s+(.*)/); if (li) { buf.push(li[1]); return; }
    const nl = ln.match(/^\d+\.\s+(.*)/); if (nl) { buf.push(nl[1]); return; }
    flush();
    if (!ln.trim()) { out.push(<div key={i} style={{ height: 5 }} />); return; }
    out.push(<p key={i} style={{ fontSize: 13, color: C.txt, margin: "0 0 3px", lineHeight: 1.8 }}>{fmt(ln)}</p>);
  });
  flush();
  return <div style={{ wordBreak: "break-word" }}>{out}</div>;
}

// ─── 42 AGENTS ───────────────────────────────────────────────────────────────
const AGENTS = [
  // S-TIER: Core advisors — Daily drivers
  { id:"carnegie",   n:"Carnegie",    icon:"🏭", col:C.gold, tier:"S", role:"Kiến Trúc Sư Đế Chế",       cost:"~$0.01",
    prompt:"Bạn là Andrew Carnegie — xây đế chế thép từ tay trắng, người giàu nhất thế giới thời đó. Tư vấn về hệ thống kinh doanh, tuyển người tài, scale operations, wealth-building từng bước. Thẳng thắn, thực tế, dùng ví dụ cụ thể từ cuộc đời mình. Không dùng markdown. Trả lời tiếng Việt, ngắn gọn, actionable." },
  { id:"jobs",       n:"Jobs",        icon:"🍎", col:C.pur,  tier:"S", role:"CMO / Brand Visionary",      cost:"~$0.01",
    prompt:"Bạn là Steve Jobs — người tạo ra Apple, Pixar, NeXT. Tư vấn về product thinking, brand building, design excellence, và cách đơn giản hóa complexity. Không chấp nhận 'tốt vừa vừa'. Không dùng markdown. Trả lời tiếng Việt, súc tích, đánh thẳng vào bản chất." },
  { id:"davinci",    n:"Da Vinci",    icon:"🎨", col:"#E879F9", tier:"S", role:"Thiên Tài Đa Ngành",      cost:"~$0.01",
    prompt:"Bạn là Leonardo Da Vinci — artist, engineer, scientist, architect trong một. Tư vấn về creative problem-solving, kết hợp nghệ thuật với kỹ thuật, observation skills, và tư duy không bị giới hạn bởi disciplines. Không dùng markdown. Tiếng Việt." },
  { id:"tesla",      n:"Tesla",       icon:"⚡", col:C.cyn,  tier:"S", role:"Kỹ Sư Đổi Mới",            cost:"~$0.01",
    prompt:"Bạn là Nikola Tesla — thiên tài phát minh, tư duy hệ thống ở tầm cao nhất. Tư vấn về kỹ thuật, innovation, cách visualize và iterate ý tưởng trong đầu trước khi build. Không dùng markdown. Tiếng Việt." },
  { id:"caesar",     n:"Caesar",      icon:"⚔️", col:C.red,  tier:"S", role:"Chiến Lược Chinh Phục",     cost:"~$0.01",
    prompt:"Bạn là Julius Caesar — chinh phục Gaul, reformer, nhà chiến lược và chính trị gia thiên tài. Tư vấn về strategy, decisive action, building loyalty, và winning against superior forces. Không dùng markdown. Tiếng Việt." },
  { id:"alexander",  n:"Alexander",   icon:"🗺️", col:"#FCD34D", tier:"S", role:"Nhà Mở Rộng Đế Chế",    cost:"~$0.01",
    prompt:"Bạn là Alexander Đại Đế — chinh phục 90% thế giới biết đến trước tuổi 32. Tư vấn về expansion strategy, cultural integration, rapid execution, và leading by example. Không dùng markdown. Tiếng Việt." },
  { id:"disney",     n:"Disney",      icon:"🏰", col:C.blu,  tier:"S", role:"Đế Chế Sáng Tạo",          cost:"~$0.01",
    prompt:"Bạn là Walt Disney — xây đế chế giải trí từ chuột hoạt hình, inventor của theme park, multimedia storytelling. Tư vấn về brand universe building, storytelling, customer experience, và dám mơ lớn. Không dùng markdown. Tiếng Việt." },
  { id:"chanel",     n:"Chanel",      icon:"💎", col:"#F9A8D4", tier:"S", role:"Luxury Brand từ 0",       cost:"~$0.01",
    prompt:"Bạn là Coco Chanel — phá vỡ mọi quy tắc thời trang, tạo ra brand luxury bất diệt từ không có gì. Tư vấn về positioning, brand story, disrupting norms, và tạo ra identity riêng biệt. Không dùng markdown. Tiếng Việt." },
  { id:"edison",     n:"Edison",      icon:"💡", col:"#FDE68A", tier:"S", role:"Thương Mại Hóa Phát Minh", cost:"~$0.01",
    prompt:"Bạn là Thomas Edison — 1093 bằng sáng chế, xây GE, inventor của lightbulb, phonograph, motion picture. Tư vấn về R&D systems, biến ý tưởng thành sản phẩm thương mại, persistence trong failure. Không dùng markdown. Tiếng Việt." },
  { id:"aristotle",  n:"Aristotle",   icon:"🦉", col:C.blu,  tier:"S", role:"Logic & Triết Học",         cost:"~$0.01",
    prompt:"Bạn là Aristotle — nền tảng logic, ethics, và triết học phương Tây, thầy của Alexander Đại Đế. Tư vấn về critical thinking, phân tích gốc rễ vấn đề, ethics trong kinh doanh, và tư duy hệ thống. Không dùng markdown. Tiếng Việt, sâu sắc." },
  // A-TIER
  { id:"buffett",    n:"Buffett",     icon:"💰", col:C.grn,  tier:"A", role:"Oracle of Omaha",           cost:"~$0.01",
    prompt:"Bạn là Warren Buffett — nhà đầu tư vĩ đại nhất, 60+ năm compound returns. Tư vấn về value investing, tư duy dài hạn, financial discipline, circle of competence. Không dùng markdown. Tiếng Việt." },
  { id:"gates",      n:"Gates",       icon:"🖥️", col:"#34D399", tier:"A", role:"Chiến Lược Hệ Thống",   cost:"~$0.01",
    prompt:"Bạn là Bill Gates — xây Microsoft từ BASIC interpreter, philanthropist, tác giả. Tư vấn về software strategy, platform thinking, learning systems, và long-term systems change. Không dùng markdown. Tiếng Việt." },
  { id:"zuckerberg", n:"Zuckerberg",  icon:"📱", col:C.blu,  tier:"A", role:"Product Growth",            cost:"~$0.01",
    prompt:"Bạn là Mark Zuckerberg — scale Facebook từ Harvard dorm lên 3 tỷ users. Tư vấn về product-market fit, growth loops, social dynamics, và moving fast. Không dùng markdown. Tiếng Việt." },
  { id:"freud",      n:"Freud",       icon:"🧠", col:C.pur,  tier:"A", role:"Tâm Lý Chiều Sâu",         cost:"~$0.01",
    prompt:"Bạn là Sigmund Freud — cha đẻ phân tâm học. Tư vấn về psychology of motivation, unconscious biases, behavior patterns, và hiểu người khác (và bản thân) sâu hơn. Không dùng markdown. Tiếng Việt." },
  { id:"cleopatra",  n:"Cleopatra",   icon:"👑", col:"#FCD34D", tier:"A", role:"Ngoại Giao & Ảnh Hưởng", cost:"~$0.01",
    prompt:"Bạn là Cleopatra VII — nữ hoàng Ai Cập, diplomat thiên tài, cai trị qua negotiation với Rome. Tư vấn về soft power, negotiation tactics, political strategy, và building alliances. Không dùng markdown. Tiếng Việt." },
  { id:"hamilton",   n:"Hamilton",    icon:"📜", col:C.gold, tier:"A", role:"Kiến Trúc Tài Chính",       cost:"~$0.01",
    prompt:"Bạn là Alexander Hamilton — xây toàn bộ hệ thống tài chính Mỹ từ đầu khi chưa có gì. Tư vấn về financial architecture, raising capital, institutional building, và debt strategy. Không dùng markdown. Tiếng Việt." },
  { id:"gandhi",     n:"Gandhi",      icon:"☮️", col:"#A3E635", tier:"A", role:"Change Through Principle", cost:"~$0.01",
    prompt:"Bạn là Mahatma Gandhi — thay đổi đế quốc Anh bằng nguyên tắc phi bạo lực. Tư vấn về movement building, principled leadership, mass mobilization, và power of consistency. Không dùng markdown. Tiếng Việt." },
  { id:"mandela",    n:"Mandela",     icon:"✊", col:C.org,  tier:"A", role:"Long Game Leadership",       cost:"~$0.01",
    prompt:"Bạn là Nelson Mandela — 27 năm tù, ra lãnh đạo một quốc gia với forgiveness. Tư vấn về resilience, long-term vision, unity building, và turning adversity thành strength. Không dùng markdown. Tiếng Việt." },
  { id:"galileo",    n:"Galileo",     icon:"🔭", col:C.cyn,  tier:"A", role:"Phản Biện Thực Chứng",      cost:"~$0.01",
    prompt:"Bạn là Galileo Galilei — đứng vững trước giáo hội vì sự thật khoa học. Tư vấn về evidence-based thinking, questioning authority, scientific method, và courage of conviction. Không dùng markdown. Tiếng Việt." },
  { id:"churchill",  n:"Churchill",   icon:"🎩", col:"#94A3B8", tier:"A", role:"Lãnh Đạo Khủng Hoảng",  cost:"~$0.01",
    prompt:"Bạn là Winston Churchill — lãnh đạo Britain qua darkest hour của WWII. Tư vấn về crisis leadership, rhetoric, morale building under extreme pressure, và strategic patience. Không dùng markdown. Tiếng Việt." },
  // B-TIER
  { id:"einstein",   n:"Einstein",    icon:"🌌", col:C.pur,  tier:"B", role:"Tư Duy Tương Đối",          cost:"~$0.01",
    prompt:"Bạn là Albert Einstein — thay đổi vật lý học bằng thought experiments. Tư vấn về first-principles thinking, questioning assumptions, và contrarian intellectual frameworks. Không dùng markdown. Tiếng Việt." },
  { id:"darwin",     n:"Darwin",      icon:"🐢", col:"#86EFAC", tier:"B", role:"Phân Tích Tiến Hóa",     cost:"~$0.01",
    prompt:"Bạn là Charles Darwin — theory of evolution sau 20 năm quan sát. Tư vấn về adaptation strategy, competitive dynamics, patient observation, và survival mechanisms in markets. Không dùng markdown. Tiếng Việt." },
  { id:"shakespeare",n:"Shakespeare", icon:"📖", col:"#F9A8D4", tier:"B", role:"Master of Narrative",     cost:"~$0.01",
    prompt:"Bạn là Shakespeare — bậc thầy storytelling và human nature. Tư vấn về narrative structure, emotional resonance, persuasion, và understanding human psychology qua story. Không dùng markdown. Tiếng Việt." },
  { id:"marx",       n:"Marx",        icon:"⚙️", col:C.red,  tier:"B", role:"Phân Tích Hệ Thống",        cost:"~$0.01",
    prompt:"Bạn là Karl Marx — nhà phân tích hệ thống kinh tế và power structures sâu sắc nhất. Tư vấn về systemic analysis, power dynamics, và understanding underlying forces của markets và organisations. Không dùng markdown. Tiếng Việt." },
  { id:"dali",       n:"Dalí",        icon:"🖼️", col:"#FDE68A", tier:"B", role:"Surrealist Self-Marketing", cost:"~$0.01",
    prompt:"Bạn là Salvador Dalí — artist tự biến mình thành brand, surrealist genius. Tư vấn về unconventional creativity, personal branding, shock value as marketing, và making the unforgettable. Không dùng markdown. Tiếng Việt." },
  { id:"swift",      n:"Taylor Swift",icon:"🎸", col:"#F9A8D4", tier:"B", role:"IP & Era Strategy",        cost:"~$0.01",
    prompt:"Bạn là Taylor Swift — xây IP empire, reinvent từng era, own your masters. Tư vấn về fanbase building, IP ownership strategy, narrative control, và long-term brand reinvention. Không dùng markdown. Tiếng Việt." },
  { id:"brucelee",   n:"Bruce Lee",   icon:"🥋", col:"#FCD34D", tier:"B", role:"Triết Học Thực Chiến",    cost:"~$0.01",
    prompt:"Bạn là Bruce Lee — triết gia hành động, 'be like water', founder của Jeet Kune Do. Tư vấn về adaptability, personal mastery, absorb what is useful - discard the rest. Không dùng markdown. Tiếng Việt." },
  { id:"nightingale",n:"Nightingale", icon:"🏥", col:"#86EFAC", tier:"B", role:"Data-Driven Reform",       cost:"~$0.01",
    prompt:"Bạn là Florence Nightingale — pioneer của nursing và data visualization để cải cách. Tư vấn về using data to drive change, evidence-based operations, và systemic reform. Không dùng markdown. Tiếng Việt." },
  { id:"confucius",  n:"Confucius",   icon:"☯️", col:"#FDE68A", tier:"B", role:"Triết Học Tổ Chức",       cost:"~$0.01",
    prompt:"Bạn là Khổng Tử — triết học về self-cultivation, relationships, và organisational ethics. Tư vấn về culture building, virtue-based leadership, và relationships as foundation of business. Không dùng markdown. Tiếng Việt." },
  // C-TIER: Chuyên ngành sâu
  { id:"suntzu",     n:"Sun Tzu",     icon:"🏯", col:C.org,  tier:"C", role:"Binh Pháp & Chiến Thuật",   cost:"~$0.01",
    prompt:"Bạn là Tôn Tử — tác giả Binh Pháp, master của asymmetric strategy. Tư vấn về winning without fighting, intelligence gathering, knowing self and enemy, và decisive positioning. Không dùng markdown. Tiếng Việt." },
  { id:"napoleon",   n:"Napoleon",    icon:"🎖️", col:C.red,  tier:"C", role:"Chiến Dịch Quyết Định",     cost:"~$0.01",
    prompt:"Bạn là Napoleon Bonaparte — từ Corsica nghèo lên Emperor, chinh phục châu Âu. Tư vấn về decisive campaign execution, logistics mastery, meritocracy, và speed as strategy. Không dùng markdown. Tiếng Việt." },
  { id:"seneca",     n:"Seneca",      icon:"🏺", col:C.pur,  tier:"C", role:"Stoic Productivity",         cost:"~$0.01",
    prompt:"Bạn là Seneca — triết gia Stoic, advisor của Emperor Nero, tác giả Letters on Ethics. Tư vấn về time management, equanimity, memento mori, và focusing on what you control. Không dùng markdown. Tiếng Việt." },
  { id:"socrates",   n:"Socrates",    icon:"🗿", col:"#94A3B8", tier:"C", role:"Socratic Method",          cost:"~$0.01",
    prompt:"Bạn là Socrates — cha đẻ triết học phương Tây. Tư vấn qua câu hỏi dẫn dắt, không đưa ra câu trả lời mà giúp người hỏi tự khám phá. 'I know that I know nothing.' Không dùng markdown. Tiếng Việt." },
  { id:"curie",      n:"Marie Curie", icon:"☢️", col:C.cyn,  tier:"C", role:"Khoa Học Kiên Trì",          cost:"~$0.01",
    prompt:"Bạn là Marie Curie — Nobel Prize vật lý VÀ hoá học, pioneer phụ nữ trong science. Tư vấn về scientific rigor, persistence qua obstacles, pioneering in hostile environments. Không dùng markdown. Tiếng Việt." },
  { id:"lovelace",   n:"Lovelace",    icon:"💻", col:C.blu,  tier:"C", role:"Lập Trình Viên Đầu Tiên",   cost:"~$0.01",
    prompt:"Bạn là Ada Lovelace — lập trình viên đầu tiên thế giới, viết algorithm cho Babbage's Engine năm 1843. Tư vấn về computational thinking, visionary technology, và translating abstract ideas to concrete systems. Không dùng markdown. Tiếng Việt." },
  { id:"musashi",    n:"Musashi",     icon:"🗡️", col:"#94A3B8", tier:"C", role:"Mastery & Discipline",    cost:"~$0.01",
    prompt:"Bạn là Miyamoto Musashi — kiếm sĩ vô địch, tác giả 'Ngũ Luân Thư'. Tư vấn về mastery through repetition, dual strategy, reading opponents, và philosophy of the warrior. Không dùng markdown. Tiếng Việt." },
  { id:"newton",     n:"Newton",      icon:"🍏", col:"#86EFAC", tier:"C", role:"First Principles Physics", cost:"~$0.01",
    prompt:"Bạn là Isaac Newton — phát minh calculus, laws of motion, theory of gravity. Tư vấn về building from first principles, systematic observation, và standing on shoulders of giants. Không dùng markdown. Tiếng Việt." },
  { id:"nietzsche",  n:"Nietzsche",   icon:"🔥", col:C.red,  tier:"C", role:"Vượt Giới Hạn Bản Thân",    cost:"~$0.01",
    prompt:"Bạn là Friedrich Nietzsche — 'Übermensch', will to power, God is dead. Tư vấn về self-overcoming, creating your own values, và không sợ sự vĩ đại. Không dùng markdown. Tiếng Việt." },
  { id:"dalio",      n:"Ray Dalio",   icon:"📊", col:C.gold, tier:"C", role:"Principles & Systems",       cost:"~$0.01",
    prompt:"Bạn là Ray Dalio — founder Bridgewater, tác giả Principles, economic machine theorist. Tư vấn về radical transparency, systematic decision-making, và understanding economic cycles. Không dùng markdown. Tiếng Việt." },
  { id:"drucker",    n:"Drucker",     icon:"📈", col:C.grn,  tier:"C", role:"Management Science",         cost:"~$0.01",
    prompt:"Bạn là Peter Drucker — cha đẻ modern management. Tư vấn về organisational effectiveness, knowledge workers, MBO, và 'what gets measured gets managed.' Không dùng markdown. Tiếng Việt." },
  { id:"bezos",      n:"Bezos",       icon:"📦", col:C.org,  tier:"C", role:"Scale & Customer Obsession", cost:"~$0.01",
    prompt:"Bạn là Jeff Bezos — xây Amazon từ garage, AWS, Blue Origin. Tư vấn về customer obsession, long-term thinking, working backwards from customer, và operational excellence at scale. Không dùng markdown. Tiếng Việt." },
  { id:"musk",       n:"Musk",        icon:"🚀", col:C.red,  tier:"C", role:"Moonshot Execution",         cost:"~$0.01",
    prompt:"Bạn là Elon Musk — Tesla, SpaceX, X. Tư vấn về first-principles manufacturing, impossibly aggressive timelines, vertical integration, và betting everything on conviction. Không dùng markdown. Tiếng Việt." },
  // ── NEW AGENTS ───────────────────────────────────────────────────────────
  { id:"buffett",    n:"Buffett",     icon:"💰", col:"#F59E0B", tier:"A", role:"Value Investor",             cost:"~$0.01",
    prompt:"Bạn là Warren Buffett — nhà đầu tư vĩ đại nhất mọi thời đại, CEO Berkshire Hathaway. Tư vấn về value investing, kiên nhẫn dài hạn, đọc báo cáo tài chính, moat của doanh nghiệp, và triết lý 'chỉ đầu tư vào thứ bạn hiểu rõ'. Thẳng thắn, dùng ví dụ đơn giản, tránh phức tạp hóa. Không dùng markdown. Tiếng Việt." },
  { id:"naval",      n:"Naval",       icon:"🧘", col:"#8B5CF6", tier:"A", role:"Wealth & Leverage",          cost:"~$0.01",
    prompt:"Bạn là Naval Ravikant — founder AngelList, triết gia về wealth và happiness. Tư vấn về specific knowledge, leverage (code/media/capital), building equity không đổi thời gian lấy tiền, và mindset tự do. Súc tích, sâu sắc, mỗi câu như một aphorism. Không dùng markdown. Tiếng Việt." },
  { id:"graham_p",   n:"Paul Graham", icon:"🔶", col:"#F97316", tier:"A", role:"Startup Thinking",           cost:"~$0.01",
    prompt:"Bạn là Paul Graham — founder Y Combinator, người đã fund Airbnb/Dropbox/Stripe. Tư vấn về startup ideas, founder mindset, làm thứ gì đó 100 người yêu thay vì 1 triệu người thích vừa vừa, và cách tìm thấy insights người khác bỏ lỡ. Trực tiếp, không ngại chỉ ra sai lầm. Không dùng markdown. Tiếng Việt." },
  { id:"nhathanh",   n:"Thầy Thích",  icon:"🪷", col:"#6EE7B7", tier:"B", role:"Mindfulness & Presence",    cost:"~$0.01",
    prompt:"Bạn là Thích Nhất Hạnh — thiền sư, tác giả hơn 100 cuốn sách, người được Martin Luther King đề cử giải Nobel Hòa Bình. Hướng dẫn về mindfulness, sống trong hiện tại, xử lý stress và lo âu, tìm bình yên giữa chaos. Nhẹ nhàng, ấm áp, dùng ẩn dụ thiên nhiên. Tiếng Việt." },
];

// ─── STORAGE POLYFILL (VPS: dùng localStorage, Claude.ai: dùng window.storage) ──
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try { const v = localStorage.getItem(key); return v ? { key, value: v } : null; }
      catch { return null; }
    },
    set: async (key, value) => {
      try { localStorage.setItem(key, value); return { key, value }; }
      catch { return null; }
    },
    delete: async (key) => {
      try { localStorage.removeItem(key); return { key, deleted: true }; }
      catch { return null; }
    },
    list: async (prefix) => {
      try {
        const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
        return { keys };
      } catch { return { keys: [] }; }
    },
  };
}

// ─── NEURAL MEMORY + RAG ─────────────────────────────────────────────────────
const MEM_KEY = "empire_v2_memories";

const loadMems = async () => {
  try { const r = await window.storage.get(MEM_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
};
const saveMems = async (list) => {
  try { await window.storage.set(MEM_KEY, JSON.stringify(list)); } catch {}
};
const searchMems = (query, mems, n = 5) => {
  if (!mems.length || !query) return [];
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return mems
    .map(m => ({ ...m, score: words.reduce((s, w) => s + (m.text.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
};
const memCtx = (mems) => mems.length
  ? `\n\n[NGỮ CẢNH TỪ CÁC PHIÊN TRƯỚC — tham chiếu nếu liên quan]\n${mems.map((m,i) => `${i+1}. ${m.text}`).join("\n")}\n[HẾT NGỮ CẢNH]`
  : "";


// ─── SESSION STORAGE ──────────────────────────────────────────────────────────
// Mỗi session = { id, title, agId, msgs, createdAt, updatedAt }
// Lưu dạng: empire_sess_INDEX_v1 = list of session metadata
//           empire_sess_MSG_{id}_v1  = messages array
const SESS_INDEX_KEY = "empire_sess_index_v1";

const genId = () => "s" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);

const sessIndexLoad = async () => {
  try { const r = await window.storage.get(SESS_INDEX_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
};
const sessIndexSave = async (list) => {
  try { await window.storage.set(SESS_INDEX_KEY, JSON.stringify(list)); } catch {}
};
const sessMsgsKey  = (id) => `empire_sess_msgs_${id}_v1`;
const sessMsgsLoad = async (id) => {
  try { const r = await window.storage.get(sessMsgsKey(id)); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
};
const sessMsgsSave = async (id, msgs) => {
  try { await window.storage.set(sessMsgsKey(id), JSON.stringify(msgs)); } catch {}
};
const sessDelete = async (id, indexList) => {
  try { await window.storage.delete(sessMsgsKey(id)); } catch {}
  return indexList.filter(s => s.id !== id);
};
const makeSession = (agId, agName) => ({
  id: genId(), title: "Cuộc hội thoại mới", agId,
  agName, createdAt: Date.now(), updatedAt: Date.now(), msgCount: 0,
});

// ─── DAILY SCHEDULE ──────────────────────────────────────────────────────────
const SCHED = [
  { id:"sc01",t:"05:30",d:15, c:"wake",    col:"#FB923C", e:"☀️", n:"Thức dậy + 500ml nước",           note:"Không nhìn điện thoại 15 phút đầu. Để não boot trong yên tĩnh." },
  { id:"sc02",t:"05:45",d:60, c:"gym",     col:"#34D399", e:"🏃", n:"Tập thể dục — 1 giờ",             note:"HIIT / gym / chạy bộ. Đây là ROI cao nhất trong ngày cho não bộ." },
  { id:"sc03",t:"06:45",d:30, c:"morning", col:"#E8C547", e:"🧘", n:"Thiền + tắm lạnh + ăn sáng",      note:"10p thiền, tắm lạnh 2p, ăn protein cao. Chuẩn bị cho 4h deep work." },
  { id:"sc04",t:"07:15",d:15, c:"council", col:"#A78BFA", e:"🏭", n:"Daily Briefing với Carnegie",     note:"1 câu hỏi: '3 việc quan trọng nhất hôm nay?' — ghi ra, cam kết." },
  { id:"sc05",t:"07:30",d:30, c:"read",    col:"#60A5FA", e:"📖", n:"Đọc sách — 30 phút",              note:"Đọc trong yên lặng hoàn toàn. Ghi chú key insight. 30p/ngày = 12 cuốn/năm." },
  { id:"sc06",t:"08:00",d:60, c:"english", col:"#22D3EE", e:"🇬🇧", n:"Học tiếng Anh — 1 giờ",         note:"Anki vocab 20p + podcast business 40p. Consistency quan trọng hơn intensity." },
  { id:"sc07",t:"09:00",d:120,c:"chinese", col:"#F472B6", e:"🇨🇳", n:"Học tiếng Trung — 9h00 đến 11h00",note:"HSK flashcards 30p + đọc hiểu 30p + luyện output 60p. Tắt mọi thông báo." },
  { id:"sc08",t:"11:00",d:20, c:"rest",    col:C.bd,      e:"☕", n:"Giải lao + stretching",           note:"Não cần reset sau 2h học. Đứng dậy, đi lại, uống nước. Không màn hình." },
  { id:"sc09",t:"11:20",d:100,c:"empire",  col:"#34D399", e:"⚡", n:"Build Empire Council — ~1.5h",   note:"Deep work mode: code, agent, deploy. Tắt email/chat. Chỉ tập trung build." },
  { id:"sc10",t:"13:00",d:60, c:"rest",    col:C.bd,      e:"🍱", n:"Ăn trưa + nghỉ trưa",            note:"Ăn đủ dinh dưỡng. Nằm nghỉ 20-30p — não consolidate thông tin lúc ngủ ngắn." },
  { id:"sc11",t:"14:00",d:90, c:"empire",  col:"#34D399", e:"💻", n:"Build + học kỹ thuật — 1.5h",    note:"TypeScript, Cloudflare docs, hoặc tiếp tục project buổi sáng." },
  { id:"sc12",t:"15:30",d:30, c:"english", col:"#22D3EE", e:"✍️", n:"Output tiếng Anh — 30 phút",     note:"Viết journal tiếng Anh hoặc speaking practice. Production > passive input." },
  { id:"sc13",t:"16:00",d:30, c:"rest",    col:C.bd,      e:"🚶", n:"Đi bộ ngoài trời",               note:"Ánh sáng tự nhiên reset cortisol. Không device. Để não wander." },
  { id:"sc14",t:"16:30",d:90, c:"free",    col:C.bd,      e:"🎯", n:"Tự do / Side projects",          note:"Hobby, networking, hoặc bất cứ thứ gì bạn muốn. Đây là thời gian của bạn." },
  { id:"sc15",t:"18:00",d:60, c:"rest",    col:C.bd,      e:"🍜", n:"Ăn tối + thư giãn thực sự",      note:"Không làm việc. Ăn chậm. Gia đình. Não cần hard off-mode để recover." },
  { id:"sc16",t:"19:00",d:30, c:"council", col:"#A78BFA", e:"🏛️", n:"Tối — Review với Hội Đồng",    note:"Hỏi Buffett hoặc Aristotle phân tích 1 quyết định quan trọng trong ngày." },
  { id:"sc17",t:"19:30",d:30, c:"plan",    col:"#E8C547", e:"📋", n:"Plan ngày mai + Journal",        note:"3 MITs ngày mai. 3 điều học được hôm nay. 1 điều cần làm khác đi." },
  { id:"sc18",t:"20:00",d:90, c:"rest",    col:C.bd,      e:"📵", n:"Wind down — không màn hình",     note:"Đọc sách giấy hoặc nghe nhạc. Blue light off. Melatonin cần bóng tối." },
  { id:"sc19",t:"21:30",d:0,  c:"sleep",   col:"#60A5FA", e:"😴", n:"Ngủ — mục tiêu 8 tiếng",        note:"Ngủ đủ = học nhanh 2×, quyết định tốt hơn, code ít bug hơn. Không thương lượng." },
];

// ─── SETUP STEPS ─────────────────────────────────────────────────────────────
const SETUP = [
  // ─── PHASE 1: ĐÃ HOÀN THÀNH ─────────────────────────────────────────────
  { id:"s1", ph:1, tc:C.grn,  tag:"VPS",         time:"5p",
    title:"Đăng ký VPS Hostinger",
    why:"Server chạy 24/7 với IP cố định — nền tảng của toàn bộ hệ thống.",
    fix:"Chọn gói KVM4 trở lên để đủ RAM cho Docker + n8n + Empire.",
    check:"VPS đang chạy, có thể truy cập Hostinger Web Terminal",
    items:[{t:"ok",v:"✅ VPS Hostinger đang LIVE — srv1438773.hstgr.cloud"},{t:"ok",v:"Ubuntu 24.04 LTS · 4 CPU · 16GB RAM · 200GB SSD · IP: 76.13.220.238"}] },
  { id:"s2", ph:1, tc:C.grn,  tag:"NGINX",        time:"5p",
    title:"Cài Nginx + Node.js trên VPS",
    why:"Nginx serve static files, Node.js để build React app.",
    fix:"Dùng Hostinger Web Terminal nếu SSH bị chặn từ mạng nhà.",
    check:"nginx -t ra 'syntax is ok', node -v ra v20.x.x",
    items:[{t:"ok",v:"✅ Nginx đã cài và đang chạy"},{t:"ok",v:"✅ Node.js v20 đã cài"},{t:"ok",v:"✅ Firewall: port 22, 80, 443 đã ALLOW"}] },
  { id:"s3", ph:1, tc:C.grn,  tag:"DEPLOY",       time:"10p",
    title:"Deploy Empire Mission Control",
    why:"App React build bằng Vite, Nginx serve tại /var/www/empire.",
    fix:"Upload file jsx qua GitHub raw URL nếu SCP bị timeout.",
    check:"Mở http://76.13.220.238 thấy app đang chạy",
    items:[{t:"ok",v:"✅ App đang LIVE tại http://76.13.220.238"},{t:"ok",v:"✅ Build path: /home/deploy/empire-build/empire"},{t:"ok",v:"✅ Serve path: /var/www/empire"}] },
  { id:"s4", ph:1, tc:C.grn,  tag:"OPENROUTER",   time:"5p",
    title:"Lấy OpenRouter API Key",
    why:"1 key dùng được Claude, GPT, Gemini, Kimi, DeepSeek — tiết kiệm nhất.",
    fix:"Quên copy key: xóa key cũ → tạo key mới.",
    check:"Key sk-or-v1-... đã nhập vào app, credit > $0",
    items:[{t:"ok",v:"✅ OpenRouter account đã tạo và liên kết thẻ"},{t:"do",v:"Nhập key vào: ⚙️ Setup → CẤU HÌNH → 🔀 OpenRouter → API KEY"},{t:"go",v:"openrouter.ai → Keys → Create Key nếu chưa có"}] },
  // ─── PHASE 2: ĐANG LÀM ────────────────────────────────────────────────────
  { id:"s5", ph:2, tc:C.org,  tag:"ROUTINE",      time:"7p/ngày",
    title:"Thiết lập Routine Sáng với Council",
    why:"Consistency hàng ngày quan trọng hơn burst effort. 5 phút/sáng = 1,800 phút/năm.",
    fix:"Không có cảm hứng: hỏi Council 1 câu đơn giản nhất — 'Tôi nên làm gì hôm nay?'",
    check:"Đã chat với ít nhất 1 agent trong 7 ngày liên tiếp",
    items:[{t:"do",v:"7h sáng: mở http://76.13.220.238 trên điện thoại"},{t:"do",v:"Hỏi Carnegie hoặc Council 1 câu về kế hoạch ngày hôm nay"},{t:"do",v:"Ghi 1 memory vào tab Memory về insight quan trọng"},{t:"do",v:"Tối: đánh dấu 1 việc đã làm được trong ngày"}] },
  { id:"s6", ph:2, tc:C.org,  tag:"READING",      time:"30p/ngày",
    title:"Đọc 3 cuốn sách cốt lõi Q1",
    why:"Nền tảng tư duy — 3 cuốn này định hình mindset builder suốt 5 năm.",
    fix:"Không có thời gian: audiobook khi tập thể dục hoặc di chuyển.",
    check:"Đọc xong cả 3, ghi ít nhất 5 insight vào Memory mỗi cuốn",
    items:[{t:"do",v:"📖 Cuốn 1: How to Win Friends — Dale Carnegie (agent Carnegie đã học xong)"},{t:"do",v:"📖 Cuốn 2: Zero to One — Peter Thiel (nền tảng startup thinking)"},{t:"do",v:"📖 Cuốn 3: Principles — Ray Dalio (decision making framework)"},{t:"do",v:"Mỗi chương xong: hỏi Council 'Insight nào áp dụng được ngay hôm nay?'"}] },
  { id:"s7", ph:2, tc:C.org,  tag:"MEMORY",       time:"Ongoing",
    title:"Build RAG Memory với 50+ entries",
    why:"Council càng nhiều context → trả lời càng cá nhân hóa và sắc bén hơn.",
    fix:"Không biết ghi gì: copy paste đoạn hay từ sách, meeting notes, ideas.",
    check:"Tab Memory có 50+ entries với tags đa dạng",
    items:[{t:"do",v:"Vào tab 🧠 Memory → thêm insight từ sách đang đọc"},{t:"do",v:"Tags nên dùng: strategy, mindset, business, personal, finance"},{t:"do",v:"Mỗi tuần: review memories cũ, hỏi Council tổng hợp patterns"},{t:"do",v:"Target: 50 memories cuối Q1, 200 memories cuối Q2"}] },
  { id:"s8", ph:2, tc:C.pur,  tag:"GITHUB",       time:"Ongoing",
    title:"Setup GitHub cho update app",
    why:"Cách duy nhất để update app lên VPS — qua GitHub raw URL.",
    fix:"File quá lớn: GitHub hỗ trợ file đến 100MB, .jsx ~130KB là ổn.",
    check:"Repo App.jsx public, có thể curl raw URL về VPS thành công",
    items:[{t:"ok",v:"✅ Repo github.com/kane2411vn/App.jsx đã tạo"},{t:"do",v:"Mỗi khi nhận file mới từ Claude → upload lên repo (Replace file)"},{t:"cmd",v:"curl -o /home/deploy/empire-build/empire/src/App.jsx RAW_URL"},{t:"cmd",v:"cd /home/deploy/empire-build/empire && npm run build && cp -r dist/* /var/www/empire/ && systemctl reload nginx"}] },
  // ─── PHASE 3: Q2 2026 ─────────────────────────────────────────────────────
  { id:"s9", ph:3, tc:C.pur,  tag:"TELEGRAM",     time:"Q2",
    title:"Tích hợp Telegram Bot (Daily Briefing)",
    why:"Nhận tóm tắt tự động 7h sáng từ Council — không cần mở máy tính.",
    fix:"Dùng n8n (đã có trên VPS) để làm automation, không cần code.",
    check:"Bot gửi briefing lúc 7h sáng mỗi ngày tự động",
    items:[{t:"do",v:"Tạo Telegram bot qua @BotFather → lấy token"},{t:"do",v:"n8n: tạo workflow Schedule → HTTP Request (Council API) → Telegram"},{t:"do",v:"Test: gửi thủ công → cấu hình cron 7h sáng"},{t:"go",v:"docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram"}] },
  { id:"s10",ph:3, tc:C.pur,  tag:"N8N",          time:"Q2",
    title:"Build RAG Pipeline với n8n",
    why:"Tự động index tài liệu, web pages, PDF vào Memory — không làm tay.",
    fix:"n8n đã cài sẵn trên VPS — không cần setup thêm server.",
    check:"Workflow chạy tự động index 50+ tài liệu vào Memory",
    items:[{t:"do",v:"n8n: tạo workflow đọc Google Drive folder → chunk text → lưu Memory"},{t:"do",v:"Tích hợp Jina AI hoặc Firecrawl để crawl web pages"},{t:"do",v:"Schedule: mỗi ngày check tài liệu mới → auto-index"}] },
  { id:"s11",ph:3, tc:C.blu,  tag:"DOMAIN",       time:"Q2",
    title:"Cài Domain + HTTPS",
    why:"URL đẹp hơn IP, bắt buộc cho production và client demo.",
    fix:"Dùng Cloudflare DNS miễn phí để trỏ domain về VPS.",
    check:"https://yourdomain.com hoạt động với SSL certificate",
    items:[{t:"do",v:"Mua domain .com hoặc .vn (namecheap.com hoặc tên.vn)"},{t:"do",v:"Cloudflare: add domain → DNS A record → 76.13.220.238"},{t:"cmd",v:"apt install -y certbot python3-certbot-nginx"},{t:"cmd",v:"certbot --nginx -d yourdomain.com"}] },
  // ─── PHASE 4: Q3-Q4 2026 ──────────────────────────────────────────────────
  { id:"s12",ph:4, tc:C.grn,  tag:"FREELANCE",    time:"Q3",
    title:"Freelance AI Setup Project đầu tiên",
    why:"Từ hobby → income. Setup Council cho 1-2 client đầu tiên.",
    fix:"Bắt đầu miễn phí cho người quen để có case study và testimonial.",
    check:"Ít nhất 1 client đang dùng Council, có feedback thật",
    items:[{t:"do",v:"Viết case study: 'Tôi đã build AI Council cho business X như thế nào'"},{t:"do",v:"Post lên LinkedIn/Facebook: offer setup miễn phí cho 2-3 người"},{t:"do",v:"Document mọi bước → biến thành playbook tái sử dụng"},{t:"do",v:"Định giá: $300-500 setup + $50-100/tháng maintain"}] },
  { id:"s13",ph:4, tc:C.gold, tag:"REVIEW",       time:"Q4",
    title:"Review Năm 1 — Điều chỉnh Roadmap",
    why:"Data beats assumptions — review thực tế để roadmap 2027 sát hơn.",
    fix:"Không đạt target: không sao — quan trọng là hiểu WHY và điều chỉnh.",
    check:"Đã review tất cả 4 quý, roadmap 2027 đã được cập nhật",
    items:[{t:"do",v:"Mở tab 📅 5 Năm → review từng quý, đánh dấu achieved/missed"},{t:"do",v:"Hỏi Council: 'Review Q1-Q4 2026 của tôi. Roadmap 2027 nên điều chỉnh gì?'"},{t:"do",v:"Celebrate progress — dù nhỏ. Consistency > perfection."},{t:"do",v:"Viết bài '1 năm xây Empire Council — những gì tôi học được'"}] },
];

// ─── 5-YEAR ROADMAP (2026–2030) ──────────────────────────────────────────────
// Note: Bắt đầu từ 2026 — bạn đang ở tháng 3/2026, tức đã vào Năm 1.
const YEARS = [
  { y:1, period:"2026", theme:"Người Xây Móng",         col:C.blu,  icon:"🔧",
    identity:"Junior AI Builder",
    mantra:"Mỗi ngày một brick. Consistency beats talent.",
    pct:30, income:"$0 → $500/tháng", metric:"42 agents · 500 queries/ngày",
    status:"🟡 Đang xây — BẠN ĐANG Ở ĐÂY",
    feasibility:85, feasNote:"Cao — công nghệ đã sẵn, roadmap rõ, chỉ cần consistency hàng ngày.",
    owns:[
      "42 agents hoạt động với prompt đầy đủ (đã có trong tool này)",
      "Council Mode: hỏi 1 → 4-8 agents trả lời song song",
      "RAG với 100+ tài liệu được index (sách, notes, research)",
      "Daily briefing tự động 7h sáng qua Telegram bot",
      "Chat UI mobile-friendly chạy ổn định",
      "Chi phí vận hành < $30/tháng",
    ],
    skills:["TypeScript","Cloudflare Workers","Prompt Engineering","RAG Pipeline","API Design"],
    quarters:[
      {q:"Q1",t:"Foundation",items:["Đọc 3 cuốn cốt lõi (Carnegie, Zero to One, Principles)","Deploy Empire Council production trên Cloudflare","Hoàn thành Windows Setup 13 bước trong tool này","Thiết lập routine sáng: tập thể dục + đọc sách + Council"]},
      {q:"Q2",t:"Kỹ Năng Kỹ Thuật",items:["Master TypeScript, async/await, REST API design","Build RAG pipeline với 50+ tài liệu đầu tiên","Integrate Telegram bot cho daily briefing","Biết đọc và debug AI API responses thành thục"]},
      {q:"Q3",t:"Hệ Thống Cá Nhân",items:["PKM (Personal Knowledge Management) kết nối với Council","Tiếng Anh: có thể nghe hiểu 80% podcast business","Tiếng Trung: HSK2 hoàn thành","Bắt đầu monetize kỹ năng: 1-2 freelance AI setup project"]},
      {q:"Q4",t:"Portfolio Đầu Tiên",items:["1 case study thực tế: giải quyết vấn đề thật bằng AI system","Viết 10 bài về AI builder journey (dù chỉ 100 người đọc)","Network với 10-20 người trong AI builder community","Review năm: điều chỉnh roadmap, celebrate progress"]},
    ],
  },
  { y:2, period:"2027", theme:"Người Bán Trí Tuệ",      col:C.grn,  icon:"⚡",
    identity:"AI Systems Consultant",
    mantra:"Bán giải pháp, không bán thời gian.",
    pct:55, income:"$0 → $5,000/tháng", metric:"5-10 paying clients · white-label ready",
    status:"🟢 Consulting Mode",
    feasibility:72, feasNote:"Khá cao — nếu Năm 1 build xong. Risk: tìm được clients thật trả tiền.",
    owns:[
      "White-label: deploy Council cho client với brand của họ",
      "Multi-user architecture: mỗi user có Council riêng",
      "Workflow engine: sequences tự động theo trigger events",
      "MCP Server: gọi Council từ Claude Code, Cursor IDE",
      "Analytics dashboard: pattern insights từ Council Minutes",
      "Template library cho các ngành: retail, agency, coaching",
    ],
    skills:["SaaS Architecture","Multi-tenant","Sales System","Technical Writing","Team Lead"],
    quarters:[
      {q:"Q1",t:"Clients Đầu Tiên",items:["Setup Council cho 3 khách hàng đầu — miễn phí để học pain points","Document mọi setup step → biến thành playbook","Học: multi-tenant architecture, user authentication","Build case study với số liệu cụ thể (time saved, decisions made)"]},
      {q:"Q2",t:"Monetize Đầu Tiên",items:["Gói dịch vụ: $300-500/setup + $50-100/tháng maintain","5 paying clients đầu tiên → $250-500 MRR","Tự động hóa onboarding: từ signup đến first query < 30 phút","Referral hệ thống: mỗi client tốt giới thiệu 1 client mới"]},
      {q:"Q3",t:"Scale Operations",items:["Revenue $2,000-3,000/tháng thuần từ AI consulting","Thuê 1 junior dev part-time để support setup","Tiếng Anh: confident trong business calls với nước ngoài","Tiếng Trung: HSK3, có thể đọc tin tức đơn giản"]},
      {q:"Q4",t:"Product Thinking",items:["Chuyển từ custom projects → productized service với fixed pricing","Landing page + pricing page + checkout tự động hoàn chỉnh","Revenue $4,000-5,000/tháng. Proof of concept hoàn chỉnh.","Quyết định: stay lifestyle business hay build SaaS thật?"]},
    ],
  },
  { y:3, period:"2028", theme:"Người Xây Sản Phẩm",      col:C.pur,  icon:"🚀",
    identity:"AI Product Builder",
    mantra:"Sản phẩm tốt là nhân viên không bao giờ nghỉ.",
    pct:75, income:"$20,000–30,000 MRR", metric:"500+ active users · $20K MRR",
    status:"🚀 SaaS Product",
    feasibility:55, feasNote:"Trung bình — đây là bước khó nhất. Cần product-market fit thực sự, không chỉ cool tech.",
    owns:[
      "SaaS platform: self-service signup, billing, dashboard hoàn chỉnh",
      "Custom knowledge base: user upload tài liệu riêng vào Council",
      "Public API: developers khác build app on top của Council",
      "Mobile app (React Native): Council trong túi, offline mode",
      "Voice interface: hỏi bằng giọng nói, agent trả lời bằng TTS",
      "Autonomous Council: AI tự họp và gửi summary khi detect risk",
    ],
    skills:["Product Management","Growth Hacking","Community Building","Fundraising Basics","Team Management"],
    quarters:[
      {q:"Q1",t:"Launch SaaS v1",items:["Empire Council SaaS: $49/tháng Basic · $149/tháng Pro","Onboarding: signup → first meaningful query < 5 phút","100 beta users, churn rate < 15%","SEO + content: 10 bài/tháng về AI productivity"]},
      {q:"Q2",t:"Growth Engine",items:["Product Hunt launch — spike traffic và feedback thật","Integration: Notion, Google Workspace, Slack webhooks","Affiliate 20% recurring cho người giới thiệu","MRR $10,000 — milestone tâm lý quan trọng nhất"]},
      {q:"Q3",t:"Niche Domination",items:["Focus 1 niche rõ: Vietnam SME hoặc SEA Solopreneurs","Discord/Telegram community: 1,000 members active","Workshop/course về AI Council methodology: $200-500/người","Partnership 3-5 complementary tools (Notion, Obsidian...)"]},
      {q:"Q4",t:"Team & Delegation",items:["Team 3-5 người: 1 senior dev, 1 CS, 1 marketer/growth","Bạn chỉ làm product vision và key architecture decisions","MRR $20,000-30,000. Company valuation $500K-1M range.","Quyết định: raise seed hay bootstrapped profitable?"]},
    ],
  },
  { y:4, period:"2029", theme:"Người Có Tầm Ảnh Hưởng",  col:C.gold, icon:"👑",
    identity:"AI Thought Leader",
    mantra:"Influence nhân rộng impact. Một người dạy 10,000 người.",
    pct:88, income:"$50,000–70,000 MRR + investments", metric:"2,000+ users · 3 countries",
    status:"🌐 Platform Scale",
    feasibility:40, feasNote:"Khó — phụ thuộc nhiều vào execution Năm 3 và timing của thị trường AI.",
    owns:[
      "Enterprise tier: Fortune 500 clients với custom deployment",
      "Multi-language: Vietnamese, English, Thai, Indonesian",
      "Agent Marketplace: community build và sell custom agents",
      "Council OS: platform framework cho bất kỳ AI advisory system",
      "Real-time collaboration: team cùng query một Council session",
      "Predictive Council: AI proactively alert khi phát hiện risk pattern",
    ],
    skills:["Public Speaking","Angel Investing","Executive Leadership","Global Expansion","Brand Authority"],
    quarters:[
      {q:"Q1",t:"Authority Building",items:["Book: 'Hội Đồng AI — 42 Cố Vấn Thiên Tài' (Vietnamese + English)","Podcast hoặc YouTube: 50+ episodes về AI productivity đã publish","Speaking tại Techfest Vietnam, Innovate Vietnam, hoặc tương đương","Được cite là expert bởi ít nhất 1 media lớn (VnExpress Tech, e27...)"]},
      {q:"Q2",t:"Ecosystem Builder",items:["Open-source core engine của Empire Council → GitHub stars","Partner với 1-2 universities: AI advisory curriculum module","Council Certification Program: người có thể trở thành 'certified Architect'","Tổ chức mini summit đầu tiên: 200-500 người tham dự"]},
      {q:"Q3",t:"Đầu Tư & Scale",items:["Angel invest 3-5 AI startups ($5-20K checks) từ revenue","Mentoring trực tiếp 10-15 AI builders","MRR $50,000-70,000. Profitable hoặc raise Series A","Expand operations sang Singapore, Thailand hoặc Philippines"]},
      {q:"Q4",t:"Legacy Foundation",items:["Empire Council Foundation: AI education cho sinh viên nghèo","Scholarship 50-100 AI builders Việt Nam mỗi năm","Team 15-20 người, operations gần như self-running","Bạn là chairman, CEO/COO handle day-to-day"]},
    ],
  },
  { y:5, period:"2030", theme:"Người Vận Hành Đế Chế",   col:C.org,  icon:"🏛️",
    identity:"Empire Architect",
    mantra:"Đế chế thật sự là khi nó chạy mà không cần bạn.",
    pct:97, income:"$100,000+/tháng · Time Freedom", metric:"1M+ users · industry standard",
    status:"🏛️ Autonomous",
    feasibility:30, feasNote:"Tham vọng nhưng không impossible — phụ thuộc hoàn toàn vào execution 4 năm trước.",
    owns:[
      "Fully autonomous: tự deploy updates, tự scale, tự recover incidents",
      "AGI-ready architecture: model mới ra → tích hợp trong 24 giờ",
      "1M+ queries/ngày — revenue tự chạy từ API usage",
      "Council Network: 100+ specialised agent communities toàn cầu",
      "Physical presence: AI advisory pods tại coworking spaces lớn",
      "Open Protocol: Empire Council = industry standard cho AI advisory",
    ],
    skills:["Vision Setting","Capital Allocation","Legacy Design","Systems Thinking","Philosophy"],
    quarters:[
      {q:"Q1–Q2",t:"Full Autonomy",items:["Company vận hành không cần daily tasks từ bạn","CEO/COO handle mọi operations, bạn là Chief Visionary Officer","Revenue $100,000+/tháng — financial freedom thực sự, không chỉ trên giấy","Test: biến mất 2 tháng, business vẫn grow — nếu được thì đã thành công"]},
      {q:"Q3–Q4",t:"Đế Chế Tiếp Theo",items:["Venture fund Empire AI Capital: đầu tư Series A vào 2-3 startups","Bắt đầu nghiên cứu Council 2.0: physical + digital AI advisory centers","Advisory roles cho 2-3 government AI policy initiatives","Câu hỏi quan trọng nhất: 'Tôi muốn xây gì tiếp theo?'"]},
    ],
  },
];


// ─── PROVIDERS ────────────────────────────────────────────────────────────────
// light = Alibaba Qwen (cheap, fast) — dùng cho Chat 1:1 thông thường
// heavy = Anthropic via OpenRouter  — dùng cho Council, tasks phức tạp
// ─── PROVIDER REGISTRY ───────────────────────────────────────────────────────
// apiType: "anthropic" | "openai" (OpenAI-compatible REST)
const PROVIDERS = {
  claude: {
    id: "claude", name: "Anthropic Claude", icon: "🟣", color: "#A78BFA",
    apiType: "anthropic", baseUrl: "anthropic",
    keyPlaceholder: "sk-ant-... (tuỳ chọn, để trống dùng built-in)",
    keyHint: "console.anthropic.com → API Keys",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4",  note: "Khuyên dùng ✓" },
      { id: "claude-opus-4-5",          label: "Claude Opus 4.5",  note: "Mạnh nhất" },
    ],
    defaultModel: "claude-sonnet-4-20250514",
  },
  openai: {
    id: "openai", name: "OpenAI GPT", icon: "⚫", color: "#10A37F",
    apiType: "openai", baseUrl: "https://api.openai.com/v1/chat/completions",
    keyPlaceholder: "sk-... (OpenAI API Key)",
    keyHint: "platform.openai.com → API Keys",
    models: [
      { id: "gpt-4.5-preview", label: "GPT-4.5 Preview", note: "Mới nhất, frontier" },
      { id: "gpt-4o",          label: "GPT-4o",          note: "Nhanh, multimodal" },
      { id: "o3",              label: "o3",              note: "Reasoning cực mạnh" },
      { id: "o4-mini",         label: "o4-mini",         note: "Tiết kiệm, nhanh" },
    ],
    defaultModel: "gpt-4.5-preview",
  },
  gemini: {
    id: "gemini", name: "Google Gemini", icon: "🔵", color: "#4285F4",
    apiType: "openai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyPlaceholder: "AIza... (Google AI Studio API Key)",
    keyHint: "aistudio.google.com → Get API Key (miễn phí)",
    models: [
      { id: "gemini-2.5-pro",            label: "Gemini 2.5 Pro",   note: "Mạnh nhất, top benchmark" },
      { id: "gemini-2.5-flash",          label: "Gemini 2.5 Flash", note: "Nhanh, tiết kiệm" },
      { id: "gemini-2.5-flash-thinking", label: "Gemini 2.5 Flash Thinking", note: "Reasoning mode" },
    ],
    defaultModel: "gemini-2.5-pro",
  },
  kimi: {
    id: "kimi", name: "Moonshot Kimi", icon: "🌙", color: "#6366F1",
    apiType: "openai", baseUrl: "https://api.moonshot.cn/v1/chat/completions",
    keyPlaceholder: "sk-... (Moonshot Platform Key)",
    keyHint: "platform.moonshot.cn → API Keys",
    models: [
      { id: "kimi-k2-0711-preview", label: "Kimi K2",        note: "Agent & coding mạnh nhất ✓" },
      { id: "moonshot-v1-32k",      label: "Moonshot 32K",   note: "Context dài" },
      { id: "moonshot-v1-128k",     label: "Moonshot 128K",  note: "Context cực dài" },
    ],
    defaultModel: "kimi-k2-0711-preview",
  },
  qwen: {
    id: "qwen", name: "Alibaba Qwen", icon: "🟠", color: "#FB923C",
    apiType: "openai",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    keyPlaceholder: "sk-... (DashScope API Key)",
    keyHint: "console.aliyun.com → Model Studio → API Key",
    models: [
      { id: "qwen-turbo", label: "Qwen Turbo", note: "Nhanh nhất, rẻ nhất" },
      { id: "qwen-plus",  label: "Qwen Plus",  note: "Cân bằng chất lượng/giá" },
      { id: "qwen-max",   label: "Qwen Max",   note: "Mạnh nhất Alibaba" },
    ],
    defaultModel: "qwen-plus",
  },
  openrouter: {
    id: "openrouter", name: "OpenRouter", icon: "🔀", color: "#6EE7B7",
    apiType: "openai",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    keyPlaceholder: "sk-or-v1-... (OpenRouter API Key)",
    keyHint: "openrouter.ai → Keys — 1 key dùng được 200+ models",
    models: [
      // Claude via OpenRouter
      { id: "anthropic/claude-sonnet-4-5",        label: "Claude Sonnet 4.5",     note: "🟣 Anthropic" },
      { id: "anthropic/claude-opus-4-5",           label: "Claude Opus 4.5",      note: "🟣 Mạnh nhất Claude" },
      // GPT via OpenRouter
      { id: "openai/gpt-4.5-preview",              label: "GPT-4.5 Preview",      note: "⚫ OpenAI mới nhất" },
      { id: "openai/gpt-4o",                       label: "GPT-4o",               note: "⚫ Nhanh multimodal" },
      { id: "openai/o3",                           label: "o3",                   note: "⚫ Reasoning mạnh" },
      // Gemini via OpenRouter
      { id: "google/gemini-2.5-pro-preview",       label: "Gemini 2.5 Pro",       note: "🔵 Top benchmark" },
      { id: "google/gemini-2.5-flash-preview",     label: "Gemini 2.5 Flash",     note: "🔵 Nhanh rẻ" },
      // Kimi via OpenRouter
      { id: "moonshotai/kimi-k2",                  label: "Kimi K2",              note: "🌙 Agent & coding" },
      // Qwen via OpenRouter
      { id: "qwen/qwen-max",                       label: "Qwen Max",             note: "🟠 Alibaba mạnh nhất" },
      { id: "qwen/qwen-turbo",                     label: "Qwen Turbo",           note: "🟠 Nhanh rẻ" },
      // Other top models
      { id: "deepseek/deepseek-r1",                label: "DeepSeek R1",          note: "🧠 Reasoning OSS" },
      { id: "meta-llama/llama-4-maverick",         label: "Llama 4 Maverick",     note: "🦙 Meta open source" },
      { id: "mistralai/mistral-large",             label: "Mistral Large",        note: "🌊 EU model" },
    ],
    defaultModel: "anthropic/claude-sonnet-4-5",
  },
};
const PROVIDER_LIST = Object.values(PROVIDERS); // ordered array
const DEFAULT_PROVIDER = "openrouter";

const CFG_KEY = "empire_v2_config";
const loadCfg = async () => {
  try { const r = await window.storage.get(CFG_KEY); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
};
const saveCfg = async (cfg) => {
  try { await window.storage.set(CFG_KEY, JSON.stringify(cfg)); } catch {}
};


// ─── SHARED UI COMPONENTS (top-level so ChatTab + App can both use them) ──────
function Bubbles({ msgs, busy, botRef, acol, onStar, starredIds }) {
  const [hovIdx, setHovIdx] = useState(null);
  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingBottom:8 }}>
      {msgs.map((m,i) => {
        const isU = m.role==="user";
        const mc  = AGENTS.find(a=>a.id===m.aid)?.col || C.gold;
        const isStarred = starredIds && starredIds.has(m.id);
        return (
          <div key={i}
            onMouseEnter={()=>setHovIdx(i)}
            onMouseLeave={()=>setHovIdx(null)}
            style={{display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start",gap:3,position:"relative"}}>
            {/* Bot message header */}
            {!isU && m.label && (
              <div style={{display:"flex",alignItems:"center",gap:6,margin:"0 0 3px 4px",flexWrap:"wrap"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:mc,margin:0}}>{m.label}</p>
                {m.modelLabel && (
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:3,
                    fontFamily:FM,fontSize:"8px",
                    color: m.providerColor || mc,
                    background: `${m.providerColor || mc}12`,
                    border: `1px solid ${m.providerColor || mc}28`,
                    padding:"1px 7px",borderRadius:10,lineHeight:1.6,
                  }}>
                    {m.providerIcon} {m.modelLabel}
                  </span>
                )}
              </div>
            )}
            <div style={{position:"relative",maxWidth:"87%"}}>
              <div style={{padding:"11px 15px",borderRadius:isU?"12px 12px 3px 12px":"12px 12px 12px 3px",background:isU?`${C.gold}0F`:`${mc}08`,border:`1px solid ${isStarred?(mc+"55"):(isU?C.gold+"22":mc+"1A")}`,transition:"border-color .15s"}}>
                {isU
                  ? <p style={{fontSize:13,color:C.txt,margin:0,lineHeight:1.75,wordBreak:"break-word"}}>{m.content}</p>
                  : <Md text={m.content} accent={mc}/>
                }
              </div>
              {/* Star button */}
              {onStar && (hovIdx===i || isStarred) && (
                <button onClick={()=>onStar(m,i)}
                  title={isStarred?"Đã lưu vào Memory":"Lưu vào Memory"}
                  style={{
                    position:"absolute", top:6, right: isU ? "auto" : -28, left: isU ? -28 : "auto",
                    background: isStarred?`${mc}22`:"rgba(0,0,0,0.5)",
                    border:`1px solid ${isStarred?mc+"55":C.bd}`,
                    borderRadius:6, padding:"3px 5px", cursor:"pointer",
                    fontSize:12, lineHeight:1, transition:"all .15s",
                  }}>
                  {isStarred ? "⭐" : "☆"}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {busy && (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
          <div style={{display:"flex",gap:4}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:acol||C.gold,animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}
          </div>
        </div>
      )}
      <div ref={botRef}/>
    </div>
  );
}

function InputBar({ val, set, onSend, busy, ph, col, memHint="" }) {
  return (
    <div style={{flexShrink:0,paddingBottom:16}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",background:C.s1,border:`1px solid ${col}30`,borderRadius:12,padding:"10px 14px"}}>
        <textarea value={val} onChange={e=>set(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSend();}}}
          placeholder={ph} rows={2}
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.txt,fontFamily:F,fontSize:13,resize:"none",lineHeight:1.65,minHeight:40}}
        />
        <button onClick={onSend} disabled={busy||!val.trim()}
          style={{flexShrink:0,width:36,height:36,borderRadius:8,background:busy||!val.trim()?"rgba(255,255,255,0.04)":`${col}18`,border:`1px solid ${busy||!val.trim()?C.bd:col}`,color:busy||!val.trim()?C.mu:col,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:busy||!val.trim()?"not-allowed":"pointer",transition:"all .15s"}}>
          {busy?"·":"↑"}
        </button>
      </div>
      <p style={{fontFamily:FM,fontSize:"8px",color:C.fa,margin:"5px 0 0",textAlign:"center"}}>
        Enter gửi · Shift+Enter xuống dòng{memHint?` · 🧠 ${memHint}`:""}
      </p>
    </div>
  );
}

// ─── CHAT TAB (extracted component to avoid IIFE-in-JSX syntax error) ────────
function ChatTab({ sessions, activeSessId, sessMessages, sessReady, sidebarOpen,
  setSidebarOpen, searchQ, setSearchQ, pickAgent, setPickAgent,
  editSessId, setEditSessId, editTitle, setEditTitle, hoverSessId, setHoverSessId,
  activeSess, activeMsgs, activeAg, newSession, switchSession, deleteSession,
  renameSession, sessUpdateCache, sessUpdateIndex, aBusy, aRef,
  aIn, setAIn, sendAgent, useRAG, mems, onStar, starredIds }) {

  const now = Date.now();
  const DAY = 86400000;
  const groupLabel = (ts) => {
    const diff = now - ts;
    if (diff < DAY)       return "Hôm nay";
    if (diff < 2 * DAY)   return "Hôm qua";
    if (diff < 7 * DAY)   return "7 ngày trước";
    if (diff < 30 * DAY)  return "Tháng này";
    return new Date(ts).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  };
  const filtered = sessions.filter(s =>
    !searchQ.trim() ||
    s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (AGENTS.find(a => a.id === s.agId)?.n || "").toLowerCase().includes(searchQ.toLowerCase())
  );
  const groups = [];
  filtered.forEach(s => {
    const lbl = groupLabel(s.updatedAt);
    const g = groups.find(g => g.label === lbl);
    if (g) g.items.push(s); else groups.push({ label: lbl, items: [s] });
  });

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div style={{
        width: sidebarOpen ? 252 : 0, flexShrink: 0,
        display: "flex", flexDirection: "column", overflow: "hidden",
        borderRight: `1px solid ${C.bd}`, background: "rgba(0,0,0,0.22)",
        transition: "width .22s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ padding: "14px 12px 10px", flexShrink: 0, minWidth: 252 }}>
          {/* New Chat */}
          <button onClick={() => setPickAgent(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 0", marginBottom: 10, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.gold}1A, ${C.pur}12)`,
              border: `1px solid ${C.gold}38`, cursor: "pointer", transition: "all .15s",
            }}>
            <span style={{ fontSize: 15 }}>✏️</span>
            <span style={{ fontFamily: FM, fontSize: "11px", color: C.gold, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Chat Mới</span>
          </button>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.mu, pointerEvents: "none" }}>🔍</span>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Tìm kiếm hội thoại…"
              style={{ width: "100%", boxSizing: "border-box", background: C.s1, border: `1px solid ${C.bd}`, borderRadius: 7, padding: "8px 28px 8px 30px", color: C.txt, fontFamily: F, fontSize: 12, outline: "none" }}
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.mu, cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
            )}
          </div>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px", minWidth: 252 }}>
          {!sessReady && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, animation: `dot 1.2s ${i*.2}s ease-in-out infinite` }}/>)}
              </div>
            </div>
          )}
          {sessReady && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 12px" }}>
              <p style={{ fontSize: 24, margin: "0 0 8px" }}>{searchQ ? "🔍" : "💬"}</p>
              <p style={{ fontSize: 12, color: C.mu, margin: 0, lineHeight: 1.65 }}>
                {searchQ ? `Không tìm thấy "${searchQ}"` : "Chưa có hội thoại nào.\nBấm Chat Mới để bắt đầu."}
              </p>
            </div>
          )}
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p style={{ fontFamily: FM, fontSize: "9px", color: C.fa, margin: "12px 4px 5px", letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</p>
              {items.map(s => {
                const a = AGENTS.find(x => x.id === s.agId) || AGENTS[0];
                const isActive = s.id === activeSessId;
                const isHover  = s.id === hoverSessId;
                const isEdit   = s.id === editSessId;
                return (
                  <div key={s.id}
                    onClick={() => !isEdit && switchSession(s.id)}
                    onMouseEnter={() => setHoverSessId(s.id)}
                    onMouseLeave={() => setHoverSessId(null)}
                    style={{
                      padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
                      background: isActive ? `${a.col}14` : isHover ? "rgba(255,255,255,0.04)" : "transparent",
                      border: `1px solid ${isActive ? a.col + "38" : "transparent"}`,
                      transition: "all .1s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${a.col}18`, border: `1px solid ${a.col}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                        {a.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEdit ? (
                          <input autoFocus value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={() => { renameSession(editSessId, editTitle || "Hội thoại"); setEditSessId(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { renameSession(editSessId, editTitle || "Hội thoại"); setEditSessId(null); } if (e.key === "Escape") setEditSessId(null); }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${a.col}60`, borderRadius: 4, padding: "2px 6px", color: "#fff", fontFamily: F, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                          />
                        ) : (
                          <p style={{ fontSize: 12, color: isActive ? "#fff" : C.txt, margin: "0 0 1px", fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.35 }}>
                            {s.title}
                          </p>
                        )}
                        <p style={{ fontFamily: FM, fontSize: "8px", color: isActive ? `${a.col}CC` : C.fa, margin: 0 }}>
                          {a.n} · {s.msgCount > 0 ? `${Math.floor(s.msgCount/2)} tin` : "trống"}
                          {s.provider && PROVIDERS[s.provider] && (
                            <span style={{ color: PROVIDERS[s.provider].color }}>
                              {" · "}{PROVIDERS[s.provider].icon}
                            </span>
                          )}
                        </p>
                      </div>
                      {(isHover || isActive) && !isEdit && (
                        <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button title="Đổi tên" onClick={() => { setEditSessId(s.id); setEditTitle(s.title); }}
                            style={{ width: 22, height: 22, borderRadius: 4, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.bd}`, color: C.mu, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✏</button>
                          <button title="Xóa" onClick={() => deleteSession(s.id)}
                            style={{ width: 22, height: 22, borderRadius: 4, background: C.redD, border: `1px solid ${C.red}20`, color: C.red, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ══ AGENT PICKER MODAL ═══════════════════════════════════════════════ */}
      {pickAgent && (
        <div onClick={() => setPickAgent(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#0D0F14", border: `1px solid ${C.bd}`, borderRadius: 14, padding: "22px 24px", width: 540, maxWidth: "92vw", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: FM, fontSize: "9px", color: C.gold, margin: "0 0 3px", letterSpacing: "2px", textTransform: "uppercase" }}>Chọn cố vấn</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Bắt đầu cuộc hội thoại mới</p>
              </div>
              <button onClick={() => setPickAgent(false)}
                style={{ width: 30, height: 30, borderRadius: 6, background: C.s1, border: `1px solid ${C.bd}`, color: C.mu, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {["S","A","B","C"].map(tier => (
                <div key={tier} style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: FM, fontSize: "8px", color: C.mu, margin: "0 0 8px", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {tier==="S"?"⭐ S-Tier — Core":tier==="A"?"🔹 A-Tier":tier==="B"?"🔸 B-Tier":"⬡ C-Tier — Specialists"}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 6 }}>
                    {AGENTS.filter(a => a.tier === tier).map(a => (
                      <button key={a.id} onClick={() => { newSession(a.id); setPickAgent(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: C.s1, border: `1px solid ${a.col}28`, borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all .12s" }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.n}</p>
                          <p style={{ fontFamily: FM, fontSize: "8px", color: a.col, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN ════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${C.bd}` }}>
          <button onClick={() => setSidebarOpen(p => !p)}
            style={{ width: 32, height: 32, borderRadius: 6, background: C.s1, border: `1px solid ${C.bd}`, color: C.mu, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
          {activeSess ? (
            <>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${activeAg.col}18`, border: `1px solid ${activeAg.col}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{activeAg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeSess.title}</p>
                <p style={{ fontFamily: FM, fontSize: "8px", color: activeAg.col, margin: 0 }}>
                  {activeAg.role}
                  {activeSess.provider && PROVIDERS[activeSess.provider] && (() => {
                    const sp = PROVIDERS[activeSess.provider];
                    const sm = activeSess.model || sp.defaultModel;
                    const ml = sp.models.find(m => m.id === sm)?.label || sm;
                    return <span style={{ color: sp.color }}> · {sp.icon} {ml}</span>;
                  })()}
                </p>
              </div>
              <button onClick={() => setPickAgent(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: `${C.gold}12`, border: `1px solid ${C.gold}35`, borderRadius: 6, cursor: "pointer", flexShrink: 0 }}>
                <span style={{ fontSize: 13 }}>✏️</span>
                <span style={{ fontFamily: FM, fontSize: "9px", color: C.gold, letterSpacing: "1px", textTransform: "uppercase" }}>Chat Mới</span>
              </button>
            </>
          ) : (
            <p style={{ fontSize: 13, color: C.mu, margin: 0 }}>Chọn hoặc tạo cuộc hội thoại</p>
          )}
        </div>

        {/* Empty state */}
        {!activeSess && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, padding: "0 20px" }}>
            <p style={{ fontSize: 36, margin: 0 }}>💬</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Bắt đầu cuộc hội thoại</p>
            <p style={{ fontSize: 13, color: C.mu, margin: 0, lineHeight: 1.6, textAlign: "center" }}>Chọn cố vấn bên dưới hoặc bấm Chat Mới từ sidebar</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 520 }}>
              {AGENTS.filter(a => a.tier === "S").map(a => (
                <button key={a.id} onClick={() => newSession(a.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: `${a.col}0E`, border: `1px solid ${a.col}30`, borderRadius: 9, cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: "0 0 1px" }}>{a.n}</p>
                    <p style={{ fontFamily: FM, fontSize: "8px", color: a.col, margin: 0 }}>{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setPickAgent(true)}
              style={{ fontFamily: FM, fontSize: "10px", color: C.mu, background: "transparent", border: `1px solid ${C.bd}`, padding: "7px 20px", borderRadius: 6, cursor: "pointer", letterSpacing: "1px" }}>
              XEM TẤT CẢ 42 AGENTS →
            </button>
          </div>
        )}

        {/* Active chat */}
        {activeSess && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "0 16px" }}>
            <Bubbles msgs={activeMsgs} busy={aBusy} botRef={aRef} acol={activeAg.col} />
            {activeMsgs.length === 0 && !aBusy && (
              <div style={{ flexShrink: 0, padding: "10px 0 6px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: C.mu, margin: "0 0 10px" }}>
                  {activeAg.icon} Hội thoại với <strong style={{ color: activeAg.col }}>{activeAg.n}</strong>
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["Lời khuyên cho tôi hôm nay","Review kế hoạch của tôi","Tư vấn tài chính","Điểm mù lớn nhất của tôi?"].map(q => (
                    <button key={q} onClick={() => setAIn(q)}
                      style={{ fontFamily: FM, fontSize: "10px", color: activeAg.col, background: `${activeAg.col}0E`, border: `1px solid ${activeAg.col}22`, padding: "6px 13px", borderRadius: 5, cursor: "pointer" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <InputBar val={aIn} set={setAIn} onSend={sendAgent} busy={aBusy} ph={`Nhắn ${activeAg.n}…`} col={activeAg.col} memHint={""}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function App() {
  const [tab,       setTab]      = useState("council");
  // Checkboxes
  const [sDone,     setSDone]    = useState(() => new Set());
  const [scDone,    setScDone]   = useState(() => new Set());
  // Council
  const [panel,     setPanel]    = useState(["carnegie","jobs","buffett","aristotle"]);
  const [cMsgs,     setCMsgs]    = useState([]);
  const [cIn,       setCIn]      = useState("");
  const [cBusy,     setCBusy]    = useState(false);
  const [showGrid,  setShowGrid] = useState(false);
  const cRef = useRef(null);
  // Chat sessions
  const [sessions,     setSessions]     = useState([]);
  const [activeSessId, setActiveSessId] = useState(null);
  const [sessMessages, setSessMessages] = useState({});
  const [aIn,          setAIn]          = useState("");
  const [aBusy,        setABusy]        = useState(false);
  const [sessReady,    setSessReady]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [searchQ,      setSearchQ]      = useState("");
  const [pickAgent,    setPickAgent]    = useState(false);
  const [editSessId,   setEditSessId]   = useState(null);
  const [editTitle,    setEditTitle]    = useState("");
  const [hoverSessId,  setHoverSessId]  = useState(null);
  const aRef = useRef(null);
  // Memory / RAG
  const [mems,      setMems]     = useState([]);
  const [memIn,     setMemIn]    = useState("");
  const [memTag,    setMemTag]   = useState("general");
  const [memReady,  setMemReady] = useState(false);
  const [useRAG,    setUseRAG]   = useState(true);
  const [memFilter, setMemFilter]= useState("all");
  // Provider config — one active provider for new chats, per-provider model + key
  const [activeProviderId, setActiveProviderId] = useState(DEFAULT_PROVIDER);
  const [providerModels,   setProviderModels]   = useState(() =>
    Object.fromEntries(PROVIDER_LIST.map(p => [p.id, p.defaultModel]))
  );
  const [apiKeys,          setApiKeys]          = useState({ claude:"", openai:"", gemini:"", kimi:"", qwen:"", openrouter:"" });
  const [showProvSettings, setShowProvSettings] = useState(false);
  const [expandedProv,     setExpandedProv]     = useState(null); // which provider card is open
  // Starred messages
  const [starredIds,  setStarredIds]  = useState(() => new Set());
  // Devil's Advocate
  const [devilMode,     setDevilMode]     = useState(false);
  const [devilQ,        setDevilQ]        = useState("");
  const [devilRes,      setDevilRes]      = useState("");
  const [devilBusy,     setDevilBusy]     = useState(false);
  // Hot Seat
  const [hotSeatMode,   setHotSeatMode]   = useState(false);
  const [hotSeatAgent,  setHotSeatAgent]  = useState("carnegie");
  const [hotSeatMsgs,   setHotSeatMsgs]   = useState([]);
  const [hotSeatIn,     setHotSeatIn]     = useState("");
  const [hotSeatBusy,   setHotSeatBusy]   = useState(false);
  const [hotSeatQ,      setHotSeatQ]      = useState(0); // question index
  const hotSeatRef = useRef(null);
  // Consensus Meter
  const [consensusData, setConsensusData] = useState(null);
  const [consensusBusy, setConsensusBusy] = useState(false);
  // Compare Mode
  const [compareMode,   setCompareMode]   = useState(false);
  const [compareAgents, setCompareAgents] = useState(["carnegie","jobs","aristotle"]);
  const [compareQ,      setCompareQ]      = useState("");
  const [compareRes,    setCompareRes]    = useState({}); // {agentId: text}
  const [compareBusy,   setCompareBusy]   = useState(false);
  // Debate Mode
  const [debateMode,    setDebateMode]    = useState(false);
  const [debateA,       setDebateA]       = useState("carnegie");
  const [debateB,       setDebateB]       = useState("jobs");
  const [debateTopic,   setDebateTopic]   = useState("");
  const [debateMsgs,    setDebateMsgs]    = useState([]);
  const [debateBusy,    setDebateBusy]    = useState(false);
  const [debateRound,   setDebateRound]   = useState(0);
  const debateRef = useRef(null);
  // Analytics — Decision Log
  const [decisions,    setDecisions]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("empire_decisions") || "[]"); } catch { return []; }
  });
  const [decIn,        setDecIn]        = useState({ title:"", context:"", options:"", outcome:"", tags:"" });
  const [showDecForm,  setShowDecForm]  = useState(false);
  const [analyticView, setAnalyticView] = useState("decisions"); // decisions | patterns | weekly | agents
  const [patternRes,   setPatternRes]   = useState("");
  const [patternBusy,  setPatternBusy]  = useState(false);
  const [weeklyRes,    setWeeklyRes]    = useState("");
  const [weeklyBusy,   setWeeklyBusy]   = useState(false);
  // Roadmap
  const [selYear,   setSelYear]  = useState(1);
  const [yrView,    setYrView]   = useState("owns");
  const [openStep,  setOpenStep] = useState("s1");

  // Derived chat
  const activeSess = sessions.find(s => s.id === activeSessId) || null;
  const activeMsgs = activeSessId ? (sessMessages[activeSessId] || []) : [];
  const activeAg   = activeSess ? (AGENTS.find(a => a.id === activeSess.agId) || AGENTS[0]) : AGENTS[0];

  // Auto-scroll
  useEffect(() => { cRef.current?.scrollIntoView({ behavior: "smooth" }); }, [cMsgs, cBusy]);
  useEffect(() => { aRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMsgs, aBusy]);
  // Load on mount
  useEffect(() => { loadMems().then(m => { setMems(m); setMemReady(true); }); }, []);
  useEffect(() => {
    loadCfg().then(cfg => {
      if (cfg.activeProviderId) setActiveProviderId(cfg.activeProviderId);
      if (cfg.providerModels)   setProviderModels(prev => ({ ...prev, ...cfg.providerModels }));
      if (cfg.apiKeys)          setApiKeys(prev => ({ ...prev, ...cfg.apiKeys }));
    });
  }, []);
  useEffect(() => {
    sessIndexLoad().then(async (idx) => {
      setSessions(idx);
      const recent = idx.slice(0, 10);
      const cache = {};
      for (const s of recent) cache[s.id] = await sessMsgsLoad(s.id);
      setSessMessages(cache);
      if (idx.length > 0) setActiveSessId(idx[0].id);
      setSessReady(true);
    });
  }, []);

  // Helpers
  const togPanel = id => setPanel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const togS  = id => setSDone(p  => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togSc = id => setScDone(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const sPct  = Math.round(sDone.size  / SETUP.length * 100);
  const scPct = Math.round(scDone.size / SCHED.length * 100);

  // ── AI CALL — dual provider ───────────────────────────────────────────────
  // callAI — routes to correct provider endpoint
  // providerId: "claude"|"openai"|"gemini"|"kimi"|"qwen"
  // modelId: specific model string (optional, falls back to providerModels[providerId])
  const callAI = async (sys, hist, txt, providerId = activeProviderId, modelId = null) => {
    let finalSys = sys;
    if (useRAG && mems.length) {
      const rel = searchMems(txt, mems);
      if (rel.length) finalSys += memCtx(rel);
    }
    const msgs = [...hist.slice(-10), { role: "user", content: txt }];
    const prov  = PROVIDERS[providerId] || PROVIDERS.claude;
    const model = modelId || providerModels[providerId] || prov.defaultModel;

    // ── Anthropic native API
    if (prov.apiType === "anthropic") {
      const headers = { "Content-Type": "application/json" };
      if (apiKeys.claude) headers["x-api-key"] = apiKeys.claude;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ model, max_tokens: 1400, system: finalSys, messages: msgs }),
      });
      const d = await r.json();
      if (d?.error) throw new Error(d.error.message || JSON.stringify(d.error));
      return d?.content?.[0]?.text || "Không có response.";
    }

    // ── OpenAI-compatible REST (OpenAI, Gemini, Kimi, Qwen, OpenRouter)
    const key = apiKeys[prov.id];
    if (!key) throw new Error(`⚠️ Chưa có API Key cho ${prov.name}. Vào ⚙️ Setup → Provider Settings để nhập.`);
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    };
    // OpenRouter requires extra headers
    if (prov.id === "openrouter") {
      headers["HTTP-Referer"] = "https://empire-council.app";
      headers["X-Title"] = "Empire Mission Control";
    }
    const r = await fetch(prov.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages: [{ role: "system", content: finalSys }, ...msgs], max_tokens: 1400 }),
    });
    const d = await r.json();
    if (d?.error) throw new Error(d.error?.message || JSON.stringify(d.error));
    return d?.choices?.[0]?.message?.content || "Không có response.";
  };

  // ── Decision Log helpers ────────────────────────────────────────────────
  const saveDecision = (dec) => {
    const updated = [dec, ...decisions];
    setDecisions(updated);
    try { localStorage.setItem("empire_decisions", JSON.stringify(updated)); } catch {}
  };
  const deleteDecision = (id) => {
    const updated = decisions.filter(d => d.id !== id);
    setDecisions(updated);
    try { localStorage.setItem("empire_decisions", JSON.stringify(updated)); } catch {}
  };
  const addDecision = () => {
    if (!decIn.title.trim()) return;
    const dec = {
      id: Date.now().toString(),
      title: decIn.title,
      context: decIn.context,
      options: decIn.options,
      outcome: decIn.outcome,
      tags: decIn.tags.split(",").map(t=>t.trim()).filter(Boolean),
      ts: Date.now(),
      status: "open",
    };
    saveDecision(dec);
    setDecIn({ title:"", context:"", options:"", outcome:"", tags:"" });
    setShowDecForm(false);
  };
  const updateDecisionStatus = (id, status) => {
    const updated = decisions.map(d => d.id===id ? {...d, status} : d);
    setDecisions(updated);
    try { localStorage.setItem("empire_decisions", JSON.stringify(updated)); } catch {}
  };

  // ── Pattern Insights ─────────────────────────────────────────────────────
  const runPatternInsights = async () => {
    if (patternBusy || mems.length < 3) return;
    setPatternBusy(true); setPatternRes("");
    try {
      const memSample = mems.slice(-50).map(m => `[${m.tag}] ${m.text.slice(0,100)}`).join("
");
      const decSample = decisions.slice(-20).map(d => `[${d.status}] ${d.title}: ${d.context.slice(0,80)}`).join("
");
      const sys = "Bạn là chuyên gia phân tích hành vi và tư duy. Phân tích ngắn gọn, sắc bén. Tiếng Việt.";
      const prompt = `Phân tích ${mems.length} memories và ${decisions.length} decisions sau:

MEMORIES:
${memSample}

DECISIONS:
${decSample}

Hãy chỉ ra:
1. BLIND SPOTS — 2-3 điểm mù trong tư duy
2. PATTERNS — 2-3 pattern lặp lại
3. STRENGTHS — 2 điểm mạnh thấy rõ
4. ACTION — 1 hành động cụ thể nên làm ngay

Ngắn gọn, mỗi điểm 1-2 câu.`;
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter || "anthropic/claude-sonnet-4-5") : (providerModels.claude || PROVIDERS.claude.defaultModel);
      const reply = await callAI(sys, [], prompt, prov, mod);
      setPatternRes(reply);
    } catch(e) { setPatternRes("⚠️ " + e.message); }
    setPatternBusy(false);
  };

  // ── Weekly Report ────────────────────────────────────────────────────────
  const runWeeklyReport = async () => {
    if (weeklyBusy) return;
    setWeeklyBusy(true); setWeeklyRes("");
    try {
      const weekMs   = 7 * 24 * 60 * 60 * 1000;
      const weekMems = mems.filter(m => Date.now() - m.ts < weekMs);
      const weekDecs = decisions.filter(d => Date.now() - d.ts < weekMs);
      const allSessions = Object.values(
        JSON.parse(localStorage.getItem("empire_sess_index") || "[]")
      );
      const weekSess = Array.isArray(allSessions) ? allSessions.filter(s => Date.now() - (s.updatedAt||0) < weekMs) : [];
      const agentCounts = {};
      weekSess.forEach(s => { agentCounts[s.agId] = (agentCounts[s.agId]||0) + 1; });
      const topAgents = Object.entries(agentCounts).sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([id, cnt]) => { const a = AGENTS.find(x=>x.id===id); return a ? `${a.icon}${a.n}(${cnt})` : id; }).join(", ");
      const sys = "Bạn là trợ lý tổng kết tuần. Viết báo cáo ngắn gọn, súc tích. Tiếng Việt.";
      const prompt = `Tổng kết tuần này:
- ${weekMems.length} memories mới ghi lại
- ${weekDecs.length} decisions mới
- ${weekSess.length} chat sessions
- Top agents: ${topAgents||"chưa có"}

Memories mới:
${weekMems.slice(-10).map(m=>`• [${m.tag}] ${m.text.slice(0,80)}`).join("
")||"Chưa có"}

Decisions:
${weekDecs.map(d=>`• [${d.status}] ${d.title}`).join("
")||"Chưa có"}

Viết WEEKLY REPORT ngắn gọn gồm: 1) Tóm tắt tuần (2-3 câu) 2) Điểm nổi bật 3) Cần cải thiện 4) Focus tuần tới`;
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter || "anthropic/claude-sonnet-4-5") : (providerModels.claude || PROVIDERS.claude.defaultModel);
      const reply = await callAI(sys, [], prompt, prov, mod);
      setWeeklyRes(reply);
    } catch(e) { setWeeklyRes("⚠️ " + e.message); }
    setWeeklyBusy(false);
  };

  // ── Star message → Memory ────────────────────────────────────────────────
  const starMessage = (msg, idx) => {
    const mid = msg.id || `star_${idx}_${Date.now()}`;
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(mid)) {
        next.delete(mid);
        return next;
      }
      next.add(mid);
      // Save to memory
      const snippet = msg.content.slice(0, 200).replace(/\n/g," ");
      const agent   = AGENTS.find(a => a.id === msg.aid);
      const text    = agent ? `[⭐ ${agent.n}] ${snippet}` : `[⭐ Council] ${snippet}`;
      const newMem  = { id: mid, text, tag: "starred", ts: Date.now(), src: "star" };
      setMems(prev2 => { const u = [...prev2, newMem]; saveMems(u); return u; });
      return next;
    });
  };

  // ── Devil's Advocate ─────────────────────────────────────────────────────
  const runDevil = async () => {
    const txt = devilQ.trim();
    if (!txt || devilBusy) return;
    setDevilBusy(true); setDevilRes("");
    try {
      const sys = `Bạn là Devil's Advocate — chuyên gia phản biện lạnh lùng và sắc bén. Nhiệm vụ: tìm mọi lý do kế hoạch/ý tưởng này sẽ THẤT BẠI. Liệt kê 5-7 rủi ro, lỗ hổng, và giả định sai lầm. Không an ủi, không tích cực. Chỉ tấn công thẳng vào điểm yếu. Kết thúc bằng: "Câu hỏi sống còn bạn chưa trả lời được:". Không dùng markdown. Tiếng Việt.`;
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter||"anthropic/claude-sonnet-4-5") : (providerModels.claude||PROVIDERS.claude.defaultModel);
      const reply = await callAI(sys, [], txt, prov, mod);
      setDevilRes(reply);
    } catch(e) { setDevilRes("⚠️ " + e.message); }
    setDevilBusy(false);
  };

  // ── Hot Seat Mode ─────────────────────────────────────────────────────────
  const startHotSeat = async (topic) => {
    if (hotSeatBusy) return;
    const ag = AGENTS.find(a => a.id === hotSeatAgent);
    if (!ag) return;
    setHotSeatMsgs([]);
    setHotSeatBusy(true);
    setHotSeatQ(1);
    try {
      const sys = ag.prompt + `

Chế độ HOT SEAT COACHING: Bạn đang coach người dùng. Hãy hỏi họ 1 câu hỏi sắc bén, thách thức, buộc họ phải suy nghĩ sâu. Chỉ hỏi 1 câu thôi, không giải thích dài dòng. Bắt đầu bằng context ngắn 1 câu rồi hỏi thẳng. Không dùng markdown. Tiếng Việt.`;
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter||"anthropic/claude-sonnet-4-5") : (providerModels.claude||PROVIDERS.claude.defaultModel);
      const q = await callAI(sys, [], `Chủ đề: ${topic}`, prov, mod);
      setHotSeatMsgs([{ role:"assistant", content:q, agentName:ag.n, agentCol:ag.col, agentIcon:ag.icon }]);
    } catch(e) { setHotSeatMsgs([{ role:"assistant", content:"⚠️ "+e.message, agentName:ag.n, agentCol:ag.col, agentIcon:ag.icon }]); }
    setHotSeatBusy(false);
    setTimeout(()=>hotSeatRef.current?.scrollIntoView({behavior:"smooth"}),200);
  };
  const replyHotSeat = async () => {
    const ans = hotSeatIn.trim();
    if (!ans || hotSeatBusy || hotSeatMsgs.length===0) return;
    const ag = AGENTS.find(a => a.id === hotSeatAgent);
    if (!ag) return;
    const newMsgs = [...hotSeatMsgs, { role:"user", content:ans }];
    setHotSeatMsgs(newMsgs);
    setHotSeatIn("");
    if (hotSeatQ >= 5) {
      // Final summary
      setHotSeatBusy(true);
      try {
        const sys = ag.prompt + `

Hãy tóm tắt ngắn gọn những insight quan trọng nhất từ cuộc coaching vừa rồi. 3-4 điểm bullet. Tiếng Việt.`;
        const hist = newMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
        const prov = apiKeys.openrouter ? "openrouter" : "claude";
        const mod  = apiKeys.openrouter ? (providerModels.openrouter||"anthropic/claude-sonnet-4-5") : (providerModels.claude||PROVIDERS.claude.defaultModel);
        const summary = await callAI(sys, hist, "Tóm tắt coaching session", prov, mod);
        setHotSeatMsgs(p=>[...p, { role:"assistant", content:"🎯 **Tóm tắt coaching:**
"+summary, agentName:ag.n, agentCol:ag.col, agentIcon:ag.icon, isSummary:true }]);
      } catch(e) {}
      setHotSeatBusy(false);
      return;
    }
    setHotSeatBusy(true);
    setHotSeatQ(p=>p+1);
    try {
      const sys = ag.prompt + `

HOT SEAT COACHING lượt ${hotSeatQ+1}/5. Dựa trên câu trả lời vừa rồi, hỏi 1 câu sâu hơn, thách thức hơn. Chỉ hỏi 1 câu. Không dùng markdown. Tiếng Việt.`;
      const hist = newMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter||"anthropic/claude-sonnet-4-5") : (providerModels.claude||PROVIDERS.claude.defaultModel);
      const q = await callAI(sys, hist, ans, prov, mod);
      setHotSeatMsgs(p=>[...p, { role:"assistant", content:q, agentName:ag.n, agentCol:ag.col, agentIcon:ag.icon }]);
    } catch(e) { setHotSeatMsgs(p=>[...p,{role:"assistant",content:"⚠️ "+e.message,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon}]); }
    setHotSeatBusy(false);
    setTimeout(()=>hotSeatRef.current?.scrollIntoView({behavior:"smooth"}),200);
  };

  // ── Consensus Meter ───────────────────────────────────────────────────────
  const runConsensus = async () => {
    if (cMsgs.length < 2 || consensusBusy) return;
    setConsensusBusy(true);
    try {
      const lastBot = [...cMsgs].reverse().find(m=>m.role==="assistant");
      const lastQ   = [...cMsgs].reverse().find(m=>m.role==="user");
      if (!lastBot || !lastQ) { setConsensusBusy(false); return; }
      const sys = `Bạn là AI phân tích. Đọc câu trả lời của Hội Đồng và phân tích mức độ đồng thuận. Trả về JSON: {"score":0-100,"summary":"1 câu","agree":["điểm1","điểm2"],"disagree":["điểm1"]}. Chỉ trả về JSON, không giải thích.`;
      const prov = apiKeys.openrouter ? "openrouter" : "claude";
      const mod  = apiKeys.openrouter ? (providerModels.openrouter||"anthropic/claude-sonnet-4-5") : (providerModels.claude||PROVIDERS.claude.defaultModel);
      const raw = await callAI(sys, [], `Câu hỏi: ${lastQ.content}

Câu trả lời: ${lastBot.content.slice(0,600)}`, prov, mod);
      try {
        const clean = raw.replace(/```json|```/g,"").trim();
        setConsensusData(JSON.parse(clean));
      } catch { setConsensusData({ score:50, summary:"Không phân tích được", agree:[], disagree:[] }); }
    } catch(e) {}
    setConsensusBusy(false);
  };

  // ── Compare Mode ─────────────────────────────────────────────────────────
  const runCompare = async () => {
    const txt = compareQ.trim();
    if (!txt || compareBusy || compareAgents.length < 2) return;
    setCompareBusy(true);
    setCompareRes({});
    try {
      const results = {};
      await Promise.all(compareAgents.map(async (agId) => {
        const ag = AGENTS.find(a => a.id === agId);
        if (!ag) return;
        const sys = ag.prompt + "\n\nTrả lời ngắn gọn, súc tích, tối đa 150 từ. Tiếng Việt.";
        const councilProv  = apiKeys.openrouter ? "openrouter" : "claude";
        const councilModel = apiKeys.openrouter
          ? (providerModels.openrouter || "anthropic/claude-sonnet-4-5")
          : (providerModels.claude || PROVIDERS.claude.defaultModel);
        try {
          const reply = await callAI(sys, [], txt, councilProv, councilModel);
          results[agId] = reply;
        } catch (e) {
          results[agId] = "⚠️ " + (e.message || "Lỗi");
        }
        setCompareRes(prev => ({ ...prev, ...results }));
      }));
    } catch(e) {}
    setCompareBusy(false);
  };

  // ── Debate Mode ──────────────────────────────────────────────────────────
  const startDebate = async () => {
    const topic = debateTopic.trim();
    if (!topic || debateBusy) return;
    setDebateMsgs([]);
    setDebateBusy(true);
    setDebateRound(0);
    const agA = AGENTS.find(a => a.id === debateA);
    const agB = AGENTS.find(a => a.id === debateB);
    if (!agA || !agB) { setDebateBusy(false); return; }
    const councilProv  = apiKeys.openrouter ? "openrouter" : "claude";
    const councilModel = apiKeys.openrouter
      ? (providerModels.openrouter || "anthropic/claude-sonnet-4-5")
      : (providerModels.claude || PROVIDERS.claude.defaultModel);
    let history = [];
    const rounds = 3;
    for (let r = 0; r < rounds; r++) {
      setDebateRound(r + 1);
      // Agent A turn
      const sysA = agA.prompt + `\n\nBạn đang TRANH LUẬN ủng hộ cho chủ đề: "${topic}".\nLượt ${r+1}/${rounds}. Đưa ra lập luận sắc bén, ngắn gọn 60-80 từ. Tiếng Việt. KHÔNG dùng markdown.`;
      try {
        const replyA = await callAI(sysA, history, r===0 ? topic : `[Lượt ${r+1}] Tiếp tục tranh luận`, councilProv, councilModel);
        const msgA = { role:"assistant", content: replyA, agent: agA.id, agentName: agA.n, agentIcon: agA.icon, agentCol: agA.col, side:"A", round: r+1 };
        setDebateMsgs(prev => [...prev, msgA]);
        history.push({ role:"user", content: `[${agA.n} nói]: ${replyA}` });
      } catch(e) { setDebateMsgs(prev => [...prev, {role:"assistant",content:"⚠️ Lỗi",agent:agA.id,agentName:agA.n,agentIcon:agA.icon,agentCol:agA.col,side:"A",round:r+1}]); }
      // Agent B turn
      const sysB = agB.prompt + `\n\nBạn đang PHẢN BIỆN chống lại chủ đề: "${topic}".\nLượt ${r+1}/${rounds}. Đưa ra lập luận phản biện sắc bén, ngắn gọn 60-80 từ. Tiếng Việt. KHÔNG dùng markdown.`;
      try {
        const replyB = await callAI(sysB, history, `[${agA.n} vừa nói]: ${history[history.length-1]?.content || ""}`, councilProv, councilModel);
        const msgB = { role:"assistant", content: replyB, agent: agB.id, agentName: agB.n, agentIcon: agB.icon, agentCol: agB.col, side:"B", round: r+1 };
        setDebateMsgs(prev => [...prev, msgB]);
        history.push({ role:"user", content: `[${agB.n} phản biện]: ${replyB}` });
      } catch(e) { setDebateMsgs(prev => [...prev, {role:"assistant",content:"⚠️ Lỗi",agent:agB.id,agentName:agB.n,agentIcon:agB.icon,agentCol:agB.col,side:"B",round:r+1}]); }
      await new Promise(res => setTimeout(res, 300));
    }
    // Verdict
    const sysVerdict = `Bạn là trọng tài công bằng. Hãy đưa ra KẾT LUẬN ngắn gọn 50-70 từ cho cuộc tranh luận về "${topic}" giữa ${agA.n} (ủng hộ) và ${agB.n} (phản biện). Ai thuyết phục hơn và tại sao? Tiếng Việt.`;
    try {
      const verdict = await callAI(sysVerdict, history, "Đưa ra kết luận cuộc tranh luận", councilProv, councilModel);
      setDebateMsgs(prev => [...prev, { role:"assistant", content: verdict, agent:"council", agentName:"⚖️ Kết Luận", agentIcon:"⚖️", agentCol: C.gold, side:"verdict", round: rounds+1 }]);
    } catch(e) {}
    setDebateBusy(false);
    setTimeout(() => debateRef.current?.scrollIntoView({ behavior:"smooth" }), 200);
  };

  // ── Export Council Minutes PDF ───────────────────────────────────────────
  const exportCouncilPDF = () => {
    if (!cMsgs.length) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const timeStr = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" });
    const panelNames = panel.map(id => {
      const a = AGENTS.find(x => x.id === id);
      return a ? (a.icon + " " + a.n) : id;
    }).join(" · ");

    const rows = cMsgs.map((m, i) => {
      const isU = m.role === "user";
      const bg  = isU ? "#1a2035" : "#0f1520";
      const col = isU ? "#E8C547" : (AGENTS.find(a => a.id === m.aid)?.col || "#A78BFA");
      const who = isU ? "Bạn" : (m.label || "Hội Đồng");
      const txt = m.content.split("<").join("&lt;").split(">").join("&gt;").split("\n").join("<br>");
      const label = i === 0 ? ("Câu hỏi " + (Math.floor(i/2)+1)) : ("Phản hồi " + (Math.floor(i/2)+1));
      return [
        "<div style=\"margin-bottom:16px;padding:14px 18px;background:" + bg + ";border-radius:8px;border-left:3px solid " + col + "\">",
        "<div style=\"font-size:10px;color:" + col + ";font-family:monospace;margin-bottom:6px;letter-spacing:1px;text-transform:uppercase\">" + who + " · " + label + "</div>",
        "<div style=\"font-size:13px;color:#D1CCB8;line-height:1.8\">" + txt + "</div>",
        "</div>"
      ].join("");
    }).join("");

    const qCount = cMsgs.filter(m => m.role === "user").length;
    const aCount = cMsgs.filter(m => m.role === "assistant").length;

    const parts = [
      "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\">",
      "<title>Council Minutes</title>",
      "<style>",
      "* { margin:0; padding:0; box-sizing:border-box; }",
      "body { background:#080B12; color:#D1CCB8; font-family:sans-serif; padding:40px; max-width:780px; margin:0 auto; }",
      "@media print { body { background:#fff!important; color:#111!important; } .no-print { display:none; } }",
      "</style></head><body>",
      "<div style=\"border-bottom:1px solid #1E2533;padding-bottom:20px;margin-bottom:28px\">",
      "<div style=\"font-size:9px;color:#4A5568;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px\">Empire Mission Control · Council Minutes</div>",
      "<div style=\"font-size:24px;font-weight:800;color:#E8C547;margin-bottom:10px\">Bien Ban Hoi Dong</div>",
      "<div style=\"font-size:12px;color:#D1CCB8;margin-bottom:4px\">Ngay: " + dateStr + " · " + timeStr + "</div>",
      "<div style=\"font-size:12px;color:#D1CCB8;margin-bottom:4px\">Hoi dong: " + panelNames + "</div>",
      "<div style=\"font-size:12px;color:#D1CCB8\">" + qCount + " cau hoi · " + aCount + " phan hoi</div>",
      "</div>",
      "<div>" + rows + "</div>",
      "<div style=\"margin-top:28px;padding-top:16px;border-top:1px solid #1E2533;font-size:9px;color:#4A5568;text-align:center\">",
      "Empire Mission Control · " + timeStr + " · " + dateStr,
      "</div>",
      "<div class=\"no-print\" style=\"margin-top:24px;text-align:center\">",
      "<button onclick=\"window.print()\" style=\"padding:10px 28px;background:rgba(232,197,71,0.15);border:1px solid rgba(232,197,71,0.4);border-radius:6px;color:#E8C547;font-size:11px;cursor:pointer\">In / Luu PDF</button>",
      "</div>",
      "</body></html>"
    ];

    const html = parts.join("");
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (win) {
      win.onload = () => { setTimeout(() => { try { win.print(); } catch(e) {} }, 500); };
    }
  };

  // ── Council (always heavy) ────────────────────────────────────────────────
  const mkCouncilSys = () => {
    const names = panel.map(id => { const a = AGENTS.find(x => x.id === id); return `${a.icon} ${a.n}`; }).join(", ");
    const lines = panel.map(id => { const a = AGENTS.find(x => x.id === id); return `${a.icon} ${a.n} (${a.role}) —`; }).join("\n");
    return `Bạn là hội đồng cố vấn gồm: ${names}.\n\nVới mỗi câu hỏi, trình bày đúng format:\n${lines}\n\nKẾT LUẬN — [2-3 câu hành động cụ thể nhất]\n\nQUY TẮC: Không dùng ** hay ## hay bất kỳ markdown. Mỗi cố vấn nói 2-4 câu. Tiếng Việt.`;
  };
  const sendCouncil = async () => {
    const txt = cIn.trim();
    if (!txt || cBusy || !panel.length) return;
    setCIn(""); setCBusy(true);
    setCMsgs(p => [...p, { role: "user", content: txt }]);
    try {
      const hist = cMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      // Council: prefer openrouter if key set, else fallback to claude
      const councilProv = apiKeys.openrouter ? "openrouter" : "claude";
      const councilModel = apiKeys.openrouter
        ? (providerModels.openrouter || "anthropic/claude-sonnet-4-5")
        : (providerModels.claude || PROVIDERS.claude.defaultModel);
      const reply = await callAI(mkCouncilSys(), hist, txt, councilProv, councilModel);
      setCMsgs(p => [...p, { role: "assistant", content: reply, label: "🏛️ Hội Đồng", aid: "council" }]);
      if (useRAG && txt.length > 15) {
        const newMem = { id: Date.now().toString(), text: `[Council] ${txt.slice(0, 120)}`, tag: "council", ts: Date.now(), src: "auto" };
        setMems(prev => { const u = [...prev, newMem]; saveMems(u); return u; });
      }
    } catch (e) {
      setCMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message || "Lỗi kết nối."}`, label: "System", aid: "" }]);
    }
    setCBusy(false);
  };

  // ── Session management ────────────────────────────────────────────────────
  const sessUpdateCache = (id, newMsgs) => {
    setSessMessages(prev => ({ ...prev, [id]: newMsgs }));
    sessMsgsSave(id, newMsgs);
  };
  const sessUpdateIndex = (id, patch) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...patch } : s).sort((a,b) => b.updatedAt - a.updatedAt);
      sessIndexSave(updated); return updated;
    });
  };
  const newSession = (agId, forceProviderId = null) => {
    const a   = AGENTS.find(x => x.id === agId) || AGENTS[0];
    const pid = forceProviderId || activeProviderId;
    const s = { ...makeSession(agId, a.n), provider: pid, model: providerModels[pid] || PROVIDERS[pid]?.defaultModel };
    setSessions(prev => { const u = [s, ...prev]; sessIndexSave(u); return u; });
    setSessMessages(prev => ({ ...prev, [s.id]: [] }));
    setActiveSessId(s.id);
    setAIn("");
  };
  const switchSession = async (id) => {
    setActiveSessId(id); setAIn("");
    if (!sessMessages[id]) {
      const msgs = await sessMsgsLoad(id);
      setSessMessages(prev => ({ ...prev, [id]: msgs }));
    }
  };
  const deleteSession = async (id) => {
    setSessions(prev => { const u = prev.filter(s => s.id !== id); sessIndexSave(u); return u; });
    setSessMessages(prev => { const n = { ...prev }; delete n[id]; return n; });
    try { await window.storage.delete(sessMsgsKey(id)); } catch {}
    setActiveSessId(prev => prev === id ? (sessions.find(s => s.id !== id)?.id || null) : prev);
  };
  const renameSession = (id, title) => sessUpdateIndex(id, { title });

  // ── sendAgent — uses the provider saved when session was created
  const sendAgent = async () => {
    const txt = aIn.trim();
    if (!txt || aBusy || !activeSessId) return;
    const sid  = activeSessId;
    const sess = sessions.find(s => s.id === sid);
    const pid  = sess?.provider || activeProviderId;
    const mid  = sess?.model    || providerModels[pid] || PROVIDERS[pid]?.defaultModel;
    const prov = PROVIDERS[pid] || PROVIDERS.claude;
    const curMsgs  = sessMessages[sid] || [];
    const nextMsgs = [...curMsgs, { role: "user", content: txt }];
    setAIn(""); setABusy(true);
    sessUpdateCache(sid, nextMsgs);
    if (curMsgs.length === 0)
      sessUpdateIndex(sid, { title: txt.slice(0,48) + (txt.length>48?"…":""), updatedAt: Date.now(), msgCount: 1 });
    try {
      const hist = curMsgs.map(m => ({ role: m.role==="user"?"user":"assistant", content: m.content }));
      const reply = await callAI(activeAg.prompt, hist, txt, pid, mid);
      // Find label for this model
      const modelLabel = prov.models.find(m => m.id === mid)?.label || mid;
      const botMsg = {
        role: "assistant", content: reply,
        label: `${activeAg.icon} ${activeAg.n}`,
        aid: activeAg.id,
        providerIcon: prov.icon,
        providerName: prov.name,
        modelLabel,
        providerColor: prov.color,
      };
      const finalMsgs = [...nextMsgs, botMsg];
      sessUpdateCache(sid, finalMsgs);
      sessUpdateIndex(sid, { updatedAt: Date.now(), msgCount: finalMsgs.length });
    } catch (e) {
      const errMsgs = [...nextMsgs, { role: "assistant", content: `⚠️ ${e.message||"Lỗi kết nối."}`, label:"System", aid:"" }];
      sessUpdateCache(sid, errMsgs);
    }
    setABusy(false);
  };

  // ── Memory helpers ────────────────────────────────────────────────────────
  const addMem = () => {
    if (!memIn.trim()) return;
    const m = { id: Date.now().toString(), text: memIn.trim(), tag: memTag, ts: Date.now(), src: "manual" };
    setMems(prev => { const u = [...prev, m]; saveMems(u); return u; });
    setMemIn("");
  };
  const delMem = (id) => { setMems(prev => { const u = prev.filter(m => m.id !== id); saveMems(u); return u; }); };

  // ── Schedule helpers ──────────────────────────────────────────────────────
  const nowMin = () => { const n = new Date(); return n.getHours()*60+n.getMinutes(); };
  const parseMin = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const isCurrentBlock = (blk, i) => {
    const start = parseMin(blk.t);
    const end = i < SCHED.length-1 ? parseMin(SCHED[i+1].t) : 24*60;
    const n = nowMin(); return n >= start && n < end;
  };

  // ── Save provider config on change ───────────────────────────────────────
  useEffect(() => {
    saveCfg({ activeProviderId, providerModels, apiKeys });
  }, [activeProviderId, providerModels, apiKeys]);

  const dayStr  = ["CN","T2","T3","T4","T5","T6","T7"][new Date().getDay()];
  const dateStr = new Date().toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});

  const TABS = [
    { id:"council",   label:"🏛️ Council",  badge:`${panel.length}/42`,  color:C.gold },
    { id:"chat",      label:"💬 Chat",      badge:activeAg.n,            color:activeAg.col },
    { id:"memory",    label:"🧠 Memory",    badge:`${mems.length}`,      color:C.pur  },
    { id:"analytics", label:"📊 Analytics", badge:`${decisions.length}`, color:"#34D399" },
    { id:"daily",     label:"📅 Lịch Ngày", badge:`${scPct}%`,           color:C.grn  },
    { id:"setup",     label:"⚙️ Setup",     badge:`${sPct}%`,            color:C.blu  },
    { id:"roadmap",   label:"🗺 5 Năm",     badge:"2026–2030",           color:C.org  },
  ];

  const yr = YEARS.find(y=>y.y===selYear);

  return (
    <div style={{fontFamily:F,minHeight:"100vh",background:C.bg,color:C.txt,display:"flex",flexDirection:"column"}}>
      <link rel="stylesheet" href={GF}/>
      <style>{`
        @keyframes dot{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:2px}
        textarea{font-family:'Syne',system-ui,sans-serif!important}
        details summary{list-style:none}
        details summary::-webkit-details-marker{display:none}
        input::placeholder,textarea::placeholder{color:rgba(232,227,216,0.3)}
      `}</style>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${C.bd}`,flexShrink:0,background:`${C.bg}EC`}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"12px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div>
              <p style={{fontFamily:FM,fontSize:"8px",letterSpacing:"3px",color:`${C.gold}50`,margin:"0 0 3px",textTransform:"uppercase"}}>Empire Council · Mission Control</p>
              <p style={{fontSize:17,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.5px"}}>Mission Control</p>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              {[[panel.length+"/42","Council",C.gold],[mems.length+" items","Memory",C.pur],[sPct+"%","Setup",C.blu],[dateStr,dayStr,C.mu]].map(([v,l,col])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p style={{fontFamily:FM,fontSize:"7px",color:C.fa,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"1px"}}>{l}</p>
                  <p style={{fontFamily:FM,fontSize:11,color:col,margin:0,fontWeight:600}}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>{const a=tab===t.id;return(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",flexShrink:0,background:a?`${t.color}0C`:"transparent",border:"none",borderBottom:`2px solid ${a?t.color:"transparent"}`,color:a?t.color:C.mu,cursor:"pointer",transition:"all .15s"}}>
                <span style={{fontFamily:F,fontSize:12,fontWeight:a?700:400}}>{t.label}</span>
                <span style={{fontFamily:FM,fontSize:"8px",padding:"1px 7px",borderRadius:10,background:a?`${t.color}18`:"rgba(255,255,255,0.04)",border:`1px solid ${a?t.color+"40":C.bd}`,color:a?t.color:C.fa}}>{t.badge}</span>
              </button>
            );})}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* PROVIDER BANNER — show when active provider has no key */}
        {tab==="chat" && activeProviderId !== "claude" && !apiKeys[activeProviderId] && (
          <div style={{background:`${PROVIDERS[activeProviderId]?.color || C.org}12`,borderBottom:`1px solid ${PROVIDERS[activeProviderId]?.color || C.org}28`,padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{fontSize:14}}>⚠️</span>
            <p style={{fontSize:12,color:PROVIDERS[activeProviderId]?.color||C.org,margin:0,flex:1}}>
              Chưa có API Key cho <strong>{PROVIDERS[activeProviderId]?.name}</strong>. Vào <strong>⚙️ Setup → Provider Settings</strong> để nhập.
            </p>
            <button onClick={()=>{setTab("setup");setShowProvSettings(true);}}
              style={{fontFamily:FM,fontSize:"9px",color:PROVIDERS[activeProviderId]?.color||C.org,background:`${PROVIDERS[activeProviderId]?.color||C.org}14`,border:`1px solid ${PROVIDERS[activeProviderId]?.color||C.org}30`,padding:"4px 12px",borderRadius:4,cursor:"pointer",flexShrink:0,letterSpacing:"1px"}}>
              CẤU HÌNH
            </button>
          </div>
        )}

        {/* ════ COUNCIL ════ */}
        {tab==="council"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",maxWidth:960,width:"100%",margin:"0 auto",padding:"0 20px",boxSizing:"border-box",overflow:"hidden"}}>
            <div style={{flexShrink:0,padding:"12px 0 10px"}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                <button onClick={()=>setUseRAG(p=>!p)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",background:useRAG?C.purD:"transparent",border:`1px solid ${useRAG?C.pur:C.bd}`,borderRadius:4,cursor:"pointer"}}>
                  <span style={{fontFamily:FM,fontSize:"9px",color:useRAG?C.pur:C.mu,letterSpacing:"1px"}}>🧠 RAG {useRAG?"ON":"OFF"}</span>
                </button>
                <button onClick={()=>setPanel(AGENTS.filter(a=>a.tier==="S").map(a=>a.id))} style={{fontFamily:FM,fontSize:"9px",color:C.gold,background:C.gD,border:`1px solid ${C.gold}28`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"1px"}}>S-TIER</button>
                <button onClick={()=>setPanel(AGENTS.slice(0,8).map(a=>a.id))} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer"}}>TOP 8</button>
                <span style={{fontFamily:FM,fontSize:"8px",color:apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color,background:`${apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color}10`,border:`1px solid ${apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color}25`,padding:"3px 10px",borderRadius:3,marginLeft:"auto"}}>
                  {apiKeys.openrouter ? `🔀 ${providerModels.openrouter||"anthropic/claude-sonnet-4-5"}` : `🟣 Council · ${providerModels.claude||PROVIDERS.claude.defaultModel}`}
                </span>
                <button onClick={()=>setShowGrid(p=>!p)} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer"}}>{showGrid?"▲ Ẩn":"▼ 42 Agents"}</button>
                {cMsgs.length>0&&<button onClick={()=>setCMsgs([])} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer"}}>XÓA</button>}
                {cMsgs.length>0&&<button onClick={exportCouncilPDF} style={{fontFamily:FM,fontSize:"9px",color:C.gold,background:C.gD,border:`1px solid ${C.gold}30`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"0.5px"}}>📋 MINUTES</button>}
                <button onClick={()=>{setDebateMode(p=>!p);setCompareMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",color:debateMode?"#F87171":C.mu,background:debateMode?"rgba(248,113,113,0.1)":"transparent",border:`1px solid ${debateMode?"#F87171":C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"0.5px"}}>
                  ⚔️ Debate
                </button>
                <button onClick={()=>{setCompareMode(p=>!p);setDebateMode(false);setDevilMode(false);setHotSeatMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",color:compareMode?C.pur:C.mu,background:compareMode?`${C.pur}10`:"transparent",border:`1px solid ${compareMode?C.pur:C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"0.5px"}}>
                  🔀 Compare
                </button>
                <button onClick={()=>{setDevilMode(p=>!p);setDebateMode(false);setCompareMode(false);setHotSeatMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",color:devilMode?"#F87171":C.mu,background:devilMode?"rgba(248,113,113,0.08)":"transparent",border:`1px solid ${devilMode?"#F87171":C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"0.5px"}}>
                  😈 Devil
                </button>
                <button onClick={()=>{setHotSeatMode(p=>!p);setDebateMode(false);setCompareMode(false);setDevilMode(false);setHotSeatMsgs([]);setHotSeatQ(0);}}
                  style={{fontFamily:FM,fontSize:"9px",color:hotSeatMode?"#FB923C":C.mu,background:hotSeatMode?"rgba(251,146,60,0.08)":"transparent",border:`1px solid ${hotSeatMode?"#FB923C":C.bd}`,padding:"4px 11px",borderRadius:4,cursor:"pointer",letterSpacing:"0.5px"}}>
                  🎯 Hot Seat
                </button>
                {cMsgs.length>1&&(
                  <button onClick={runConsensus} disabled={consensusBusy}
                    style={{fontFamily:FM,fontSize:"9px",color:consensusData?"#34D399":C.mu,background:consensusData?"rgba(52,211,153,0.08)":"transparent",border:`1px solid ${consensusData?"#34D399":C.bd}`,padding:"4px 11px",borderRadius:4,cursor:consensusBusy?"not-allowed":"pointer",letterSpacing:"0.5px"}}>
                    {consensusBusy?"⏳":"🤝"} Consensus
                  </button>
                )}
              </div>
              {showGrid&&(
                <div style={{maxHeight:240,overflowY:"auto",marginBottom:10}}>
                  {["S","A","B","C"].map(tier=>(
                    <div key={tier} style={{marginBottom:10}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"2px"}}>{tier}-TIER</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {AGENTS.filter(a=>a.tier===tier).map(a=>{const sel=panel.includes(a.id);return(
                          <button key={a.id} onClick={()=>togPanel(a.id)}
                            style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:sel?`${a.col}14`:C.s1,border:`1px solid ${sel?a.col:C.bd}`,borderRadius:5,cursor:"pointer",transition:"all .12s"}}>
                            <span style={{fontSize:12}}>{a.icon}</span>
                            <span style={{fontFamily:FM,fontSize:"9px",color:sel?a.col:C.mu,textTransform:"uppercase"}}>{a.n}</span>
                            {sel&&<span style={{color:a.col,fontSize:8}}>✓</span>}
                          </button>
                        );})}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontFamily:FM,fontSize:"8px",color:C.fa}}>PANEL:</span>
                {panel.slice(0,10).map(id=>{const a=AGENTS.find(x=>x.id===id);if(!a)return null;return(
                  <span key={id} onClick={()=>togPanel(id)} style={{fontFamily:FM,fontSize:"9px",color:a.col,background:`${a.col}12`,border:`1px solid ${a.col}22`,padding:"2px 8px",borderRadius:3,cursor:"pointer"}}>{a.icon} {a.n} ×</span>
                );})}
                {panel.length>10&&<span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>+{panel.length-10}</span>}
                {panel.length>8&&<span style={{fontFamily:FM,fontSize:"8px",color:C.org,background:C.orgD,border:`1px solid ${C.org}25`,padding:"2px 8px",borderRadius:3,marginLeft:"auto"}}>⚠ {panel.length} agents → prompt lớn → tốn hơn</span>}
              </div>
            </div>
            {/* ══ DEBATE MODE ══ */}
            {debateMode && (
              <div style={{flexShrink:0,marginBottom:10,background:"rgba(248,113,113,0.05)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:10,padding:"14px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#F87171",letterSpacing:"2px",margin:"0 0 10px"}}>⚔️ DEBATE MODE — 2 AGENTS TRANH LUẬN 3 LƯỢT</p>
                <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px"}}>AGENT A (ỦNG HỘ)</p>
                    <select value={debateA} onChange={e=>setDebateA(e.target.value)}
                      style={{width:"100%",background:C.s1,border:`1px solid ${AGENTS.find(a=>a.id===debateA)?.col||C.bd}`,borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                      {AGENTS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",paddingBottom:4}}>
                    <span style={{fontFamily:FM,fontSize:"11px",color:"#F87171",fontWeight:700}}>VS</span>
                  </div>
                  <div style={{flex:1,minWidth:120}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px"}}>AGENT B (PHẢN BIỆN)</p>
                    <select value={debateB} onChange={e=>setDebateB(e.target.value)}
                      style={{width:"100%",background:C.s1,border:`1px solid ${AGENTS.find(a=>a.id===debateB)?.col||C.bd}`,borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                      {AGENTS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={debateTopic} onChange={e=>setDebateTopic(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&startDebate()}
                    placeholder="Chủ đề tranh luận... (vd: Nên học TypeScript hay Python trước?)"
                    style={{flex:1,background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={startDebate} disabled={debateBusy||!debateTopic.trim()}
                    style={{padding:"8px 16px",background:debateBusy?"transparent":"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.4)",borderRadius:6,cursor:debateBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#F87171",letterSpacing:"1px"}}>
                    {debateBusy?`🔥 Lượt ${debateRound}/3`:"⚔️ BẮT ĐẦU"}
                  </button>
                </div>
                {debateMsgs.length>0&&(
                  <div style={{marginTop:12,maxHeight:360,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                    {debateMsgs.map((m,i)=>{
                      const isVerdict = m.side==="verdict";
                      const isA = m.side==="A";
                      return(
                        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isVerdict?"center":isA?"flex-start":"flex-end"}}>
                          <span style={{fontFamily:FM,fontSize:"8px",color:m.agentCol,marginBottom:3}}>{m.agentIcon} {m.agentName} {isVerdict?"":"· Lượt "+m.round}</span>
                          <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:isA?"10px 10px 10px 2px":isVerdict?"10px":"10px 10px 2px 10px",background:isVerdict?`${C.gold}08`:`${m.agentCol}08`,border:`1px solid ${isVerdict?C.gold+"30":m.agentCol+"25"}`,fontSize:12,color:C.txt,lineHeight:1.7}}>
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                    {debateBusy&&<div style={{display:"flex",gap:4,justifyContent:"center",padding:"6px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#F87171",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                    <div ref={debateRef}/>
                  </div>
                )}
              </div>
            )}

            {/* ══ DEVIL'S ADVOCATE ══ */}
            {devilMode && (
              <div style={{flexShrink:0,marginBottom:10,background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:10,padding:"14px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#F87171",letterSpacing:"2px",margin:"0 0 8px"}}>😈 DEVIL'S ADVOCATE — TẤN CÔNG VÀO KẾ HOẠCH CỦA BẠN</p>
                <p style={{fontSize:11,color:C.fa,margin:"0 0 10px"}}>AI sẽ tìm mọi lý do kế hoạch/ý tưởng sẽ thất bại. Không an ủi.</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={devilQ} onChange={e=>setDevilQ(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&runDevil()}
                    placeholder="Kế hoạch / ý tưởng cần phản biện..."
                    style={{flex:1,background:C.s1,border:"1px solid rgba(248,113,113,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={runDevil} disabled={devilBusy||!devilQ.trim()}
                    style={{padding:"8px 14px",background:devilBusy?"transparent":"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.35)",borderRadius:6,cursor:devilBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#F87171"}}>
                    {devilBusy?"⏳":"😈 TẤN CÔNG"}
                  </button>
                </div>
                {devilRes&&(
                  <div style={{marginTop:10,background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:8,padding:"12px 14px",fontSize:12,color:C.txt,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
                    {devilRes}
                  </div>
                )}
              </div>
            )}

            {/* ══ HOT SEAT ══ */}
            {hotSeatMode && (
              <div style={{flexShrink:0,marginBottom:10,background:"rgba(251,146,60,0.04)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:10,padding:"14px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#FB923C",letterSpacing:"2px",margin:"0 0 8px"}}>🎯 HOT SEAT — AGENT HỎI NGƯỢC LẠI BẠN (5 CÂU)</p>
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                  <select value={hotSeatAgent} onChange={e=>setHotSeatAgent(e.target.value)}
                    style={{background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                    {AGENTS.filter(a=>["S","A"].includes(a.tier)).map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                  </select>
                  <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>Câu {Math.min(hotSeatQ,5)}/5</span>
                  {hotSeatMsgs.length>0&&<button onClick={()=>{setHotSeatMsgs([]);setHotSeatQ(0);}} style={{fontFamily:FM,fontSize:"8px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,cursor:"pointer"}}>RESET</button>}
                </div>
                {hotSeatMsgs.length===0&&(
                  <div style={{display:"flex",gap:8}}>
                    <input id="hotseat-topic" placeholder="Chủ đề bạn muốn được coach..." defaultValue=""
                      style={{flex:1,background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                    <button onClick={()=>{const v=document.getElementById("hotseat-topic").value.trim();if(v)startHotSeat(v);}}
                      style={{padding:"8px 14px",background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"10px",color:"#FB923C"}}>
                      🎯 BẮT ĐẦU
                    </button>
                  </div>
                )}
                {hotSeatMsgs.length>0&&(
                  <div>
                    <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
                      {hotSeatMsgs.map((m,i)=>{
                        const isU=m.role==="user";
                        return(
                          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start"}}>
                            {!isU&&<span style={{fontFamily:FM,fontSize:"8px",color:m.agentCol||"#FB923C",marginBottom:2}}>{m.agentIcon} {m.agentName}</span>}
                            <div style={{maxWidth:"88%",padding:"9px 13px",borderRadius:isU?"10px 10px 2px 10px":"10px 10px 10px 2px",background:isU?"rgba(251,146,60,0.08)":m.isSummary?"rgba(52,211,153,0.06)":"rgba(251,146,60,0.04)",border:`1px solid ${isU?"rgba(251,146,60,0.2)":m.isSummary?"rgba(52,211,153,0.2)":"rgba(251,146,60,0.12)"}`,fontSize:12,color:C.txt,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                              {m.content}
                            </div>
                          </div>
                        );
                      })}
                      {hotSeatBusy&&<div style={{display:"flex",gap:3,padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#FB923C",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                      <div ref={hotSeatRef}/>
                    </div>
                    {hotSeatQ<=5&&!hotSeatMsgs.find(m=>m.isSummary)&&(
                      <div style={{display:"flex",gap:8}}>
                        <input value={hotSeatIn} onChange={e=>setHotSeatIn(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&replyHotSeat()}
                          placeholder="Câu trả lời của bạn..."
                          style={{flex:1,background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                        <button onClick={replyHotSeat} disabled={hotSeatBusy||!hotSeatIn.trim()}
                          style={{padding:"8px 14px",background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:6,cursor:hotSeatBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#FB923C"}}>
                          TRẢ LỜI →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ CONSENSUS METER ══ */}
            {consensusData && (
              <div style={{flexShrink:0,marginBottom:10,background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"12px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:0}}>🤝 CONSENSUS METER</p>
                  <div style={{flex:1,height:6,background:C.bd,borderRadius:3,overflow:"hidden",minWidth:80}}>
                    <div style={{height:"100%",width:`${consensusData.score}%`,background:`linear-gradient(90deg,#F87171,#34D399)`,borderRadius:3,transition:"width .5s ease"}}/>
                  </div>
                  <span style={{fontFamily:FM,fontSize:"14px",fontWeight:700,color:consensusData.score>70?"#34D399":consensusData.score>40?"#FB923C":"#F87171"}}>{consensusData.score}%</span>
                  <button onClick={()=>setConsensusData(null)} style={{fontFamily:FM,fontSize:"8px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"2px 7px",borderRadius:3,cursor:"pointer"}}>×</button>
                </div>
                <p style={{fontSize:12,color:C.txt,margin:"0 0 6px"}}>{consensusData.summary}</p>
                <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  {consensusData.agree?.length>0&&<div><p style={{fontFamily:FM,fontSize:"8px",color:"#34D399",margin:"0 0 3px"}}>ĐỒNG THUẬN</p>{consensusData.agree.map((a,i)=><p key={i} style={{fontSize:11,color:C.fa,margin:"0 0 2px"}}>✓ {a}</p>)}</div>}
                  {consensusData.disagree?.length>0&&<div><p style={{fontFamily:FM,fontSize:"8px",color:"#F87171",margin:"0 0 3px"}}>BẤT ĐỒNG</p>{consensusData.disagree.map((a,i)=><p key={i} style={{fontSize:11,color:C.fa,margin:"0 0 2px"}}>✗ {a}</p>)}</div>}
                </div>
              </div>
            )}

            {/* ══ COMPARE MODE ══ */}
            {compareMode && (
              <div style={{flexShrink:0,marginBottom:10,background:`${C.pur}08`,border:`1px solid ${C.pur}25`,borderRadius:10,padding:"14px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:C.pur,letterSpacing:"2px",margin:"0 0 10px"}}>🔀 COMPARE MODE — HỎI 1 CÂU, NHIỀU AGENTS TRẢ LỜI SONG SONG</p>
                <div style={{marginBottom:10}}>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 6px",letterSpacing:"1px"}}>CHỌN AGENTS SO SÁNH</p>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {AGENTS.filter(a=>a.tier==="S"||a.tier==="A").map(a=>{
                      const sel=compareAgents.includes(a.id);
                      return(
                        <button key={a.id} onClick={()=>setCompareAgents(prev=>sel?prev.filter(x=>x!==a.id):[...prev,a.id])}
                          style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:sel?`${a.col}14`:"transparent",border:`1px solid ${sel?a.col:C.bd}`,borderRadius:5,cursor:"pointer",fontFamily:FM,fontSize:"9px",color:sel?a.col:C.mu}}>
                          {a.icon} {a.n} {sel&&"✓"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={compareQ} onChange={e=>setCompareQ(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&runCompare()}
                    placeholder={`Hỏi ${compareAgents.length} agents cùng lúc...`}
                    style={{flex:1,background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={runCompare} disabled={compareBusy||!compareQ.trim()||compareAgents.length<2}
                    style={{padding:"8px 16px",background:compareBusy?"transparent":`${C.pur}15`,border:`1px solid ${C.pur}40`,borderRadius:6,cursor:compareBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:C.pur,letterSpacing:"1px"}}>
                    {compareBusy?"⏳ Đang hỏi...":"🔀 SO SÁNH"}
                  </button>
                </div>
                {Object.keys(compareRes).length>0&&(
                  <div style={{marginTop:12,display:"grid",gridTemplateColumns:`repeat(${Math.min(compareAgents.length,3)},1fr)`,gap:8}}>
                    {compareAgents.map(agId=>{
                      const ag=AGENTS.find(a=>a.id===agId);
                      const res=compareRes[agId];
                      if(!ag)return null;
                      return(
                        <div key={agId} style={{background:`${ag.col}06`,border:`1px solid ${ag.col}20`,borderRadius:8,padding:"10px 12px"}}>
                          <p style={{fontFamily:FM,fontSize:"9px",color:ag.col,margin:"0 0 6px"}}>{ag.icon} {ag.n}</p>
                          {res
                            ? <p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.7}}>{res}</p>
                            : <div style={{display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:ag.col,animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Bubbles msgs={cMsgs} busy={cBusy} botRef={cRef} acol={C.gold} onStar={starMessage} starredIds={starredIds}/>
            {cMsgs.length===0&&!cBusy&&(
              <div style={{flexShrink:0,padding:"12px 0",textAlign:"center"}}>
                <p style={{fontSize:12,color:C.mu,margin:"0 0 10px"}}>Hội đồng {panel.length} cố vấn sẵn sàng.</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {["Tôi nên ưu tiên gì hôm nay?","Review kế hoạch kinh doanh","Tôi đang mắc sai lầm nào?","Làm sao scale nhanh hơn?"].map(q=>(
                    <button key={q} onClick={()=>setCIn(q)} style={{fontFamily:FM,fontSize:"10px",color:C.gold,background:C.gD,border:`1px solid ${C.gold}22`,padding:"5px 12px",borderRadius:4,cursor:"pointer"}}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            <InputBar val={cIn} set={setCIn} onSend={sendCouncil} busy={cBusy} ph={panel.length===0?"Chọn ít nhất 1 agent...":"Hỏi Hội Đồng... (Enter gửi)"} col={C.gold} memHint={useRAG&&mems.length>0?mems.length+" memories":""}/>
          </div>
        )}

        {/* ════ CHAT ════ */}
        {tab==="chat"&&(
          <ChatTab
            sessions={sessions} activeSessId={activeSessId} sessMessages={sessMessages}
            sessReady={sessReady} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
            searchQ={searchQ} setSearchQ={setSearchQ}
            pickAgent={pickAgent} setPickAgent={setPickAgent}
            editSessId={editSessId} setEditSessId={setEditSessId}
            editTitle={editTitle} setEditTitle={setEditTitle}
            hoverSessId={hoverSessId} setHoverSessId={setHoverSessId}
            onStar={starMessage} starredIds={starredIds}
            activeSess={activeSess} activeMsgs={activeMsgs} activeAg={activeAg}
            newSession={newSession} switchSession={switchSession}
            deleteSession={deleteSession} renameSession={renameSession}
            sessUpdateCache={sessUpdateCache} sessUpdateIndex={sessUpdateIndex}
            aBusy={aBusy} aRef={aRef} aIn={aIn} setAIn={setAIn}
            sendAgent={sendAgent} useRAG={useRAG} mems={mems}
          />
        )}

        {/* ════ MEMORY ════ */}
        {tab==="memory"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>
            <div style={{background:C.purD,border:`1px solid ${C.pur}20`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.pur,letterSpacing:"2px",margin:"0 0 4px",textTransform:"uppercase"}}>🧠 Neural Memory + RAG System</p>
                  <p style={{fontSize:12,color:C.txt,margin:"0 0 8px",lineHeight:1.65,maxWidth:480}}>Memories được inject vào context trước mỗi query. Hội Đồng sẽ nhớ và tham chiếu lịch sử của bạn.</p>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontFamily:FM,fontSize:"10px",color:C.pur}}>{mems.length} memories</span>
                    <button onClick={()=>setUseRAG(p=>!p)} style={{fontFamily:FM,fontSize:"9px",color:useRAG?C.pur:C.mu,background:useRAG?C.purD:"transparent",border:`1px solid ${useRAG?C.pur:C.bd}`,padding:"3px 10px",borderRadius:3,cursor:"pointer",letterSpacing:"1px"}}>RAG {useRAG?"ACTIVE ✓":"PAUSED"}</button>
                  </div>
                </div>
                <div style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${C.bd}`,borderRadius:7,padding:"10px 14px",fontSize:11,color:C.mu,lineHeight:1.7,maxWidth:240}}>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.pur,margin:"0 0 5px",letterSpacing:"1px",textTransform:"uppercase"}}>Cách hoạt động</p>
                  <p style={{margin:"0 0 2px"}}>1. Thêm memories về bạn và mục tiêu</p>
                  <p style={{margin:"0 0 2px"}}>2. Trước mỗi query: tìm memories liên quan</p>
                  <p style={{margin:"0 0 2px"}}>3. Inject vào system prompt như context</p>
                  <p style={{margin:0}}>4. Agent trả lời với hiểu biết đầy đủ về bạn</p>
                </div>
              </div>
            </div>
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.pur,margin:"0 0 10px",letterSpacing:"1.5px",textTransform:"uppercase"}}>➕ Thêm Memory</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                {["general","finance","strategy","tech","health","language","empire"].map(tag=>(
                  <button key={tag} onClick={()=>setMemTag(tag)} style={{fontFamily:FM,fontSize:"9px",color:memTag===tag?C.pur:C.mu,background:memTag===tag?C.purD:"transparent",border:`1px solid ${memTag===tag?C.pur:C.bd}`,padding:"3px 10px",borderRadius:3,cursor:"pointer"}}>{tag}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <textarea value={memIn} onChange={e=>setMemIn(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addMem();}}}
                  placeholder='Nhập fact/insight quan trọng... (ví dụ: "Tôi đang xây startup AI coaching target SME Việt Nam")' rows={2}
                  style={{flex:1,background:"rgba(0,0,0,0.3)",border:`1px solid ${C.pur}28`,borderRadius:7,padding:"9px 12px",color:C.txt,fontFamily:F,fontSize:12,resize:"none",lineHeight:1.6,outline:"none"}}
                />
                <button onClick={addMem} disabled={!memIn.trim()} style={{padding:"9px 18px",background:memIn.trim()?C.purD:"rgba(255,255,255,0.03)",border:`1px solid ${memIn.trim()?C.pur:C.bd}`,borderRadius:7,color:memIn.trim()?C.pur:C.mu,fontFamily:FM,fontSize:"10px",cursor:memIn.trim()?"pointer":"not-allowed",letterSpacing:"1px",textTransform:"uppercase",flexShrink:0}}>LƯU</button>
              </div>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontFamily:FM,fontSize:"8px",color:C.fa,letterSpacing:"1px"}}>LỌC:</span>
              {["all","general","finance","strategy","tech","health","language","empire","council","auto"].map(f=>(
                <button key={f} onClick={()=>setMemFilter(f)} style={{fontFamily:FM,fontSize:"9px",color:memFilter===f?C.pur:C.mu,background:memFilter===f?C.purD:"transparent",border:`1px solid ${memFilter===f?C.pur:C.bd}`,padding:"2px 9px",borderRadius:3,cursor:"pointer"}}>{f}</button>
              ))}
              {mems.length>0&&<button onClick={()=>{if(window.confirm("Xóa tất cả memories?")){{setMems([]);saveMems([]);}}}} style={{fontFamily:FM,fontSize:"9px",color:C.red,background:C.redD,border:`1px solid ${C.red}22`,padding:"2px 10px",borderRadius:3,cursor:"pointer",marginLeft:"auto"}}>XÓA HẾT</button>}
            </div>
            {!memReady&&<p style={{fontSize:12,color:C.mu,textAlign:"center",padding:"20px"}}>Đang tải…</p>}
            {memReady&&mems.length===0&&(
              <div style={{textAlign:"center",padding:"30px 16px",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10}}>
                <span style={{fontSize:32}}>🧠</span>
                <p style={{fontSize:12,color:C.mu,margin:"10px 0 6px"}}>Chưa có memories. Hãy thêm những điều quan trọng về bạn.</p>
                <p style={{fontFamily:FM,fontSize:"10px",color:C.pur,margin:0}}>Gợi ý: tên, mục tiêu, business model, điểm mạnh/yếu…</p>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {mems.filter(m=>memFilter==="all"||m.tag===memFilter||m.src===memFilter).sort((a,b)=>b.ts-a.ts).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",background:C.s1,border:`1px solid ${m.src==="auto"?C.pur+"20":C.bd}`,borderRadius:8}}>
                  <span style={{fontFamily:FM,fontSize:"8px",color:m.src==="auto"?C.pur:C.gold,background:m.src==="auto"?C.purD:C.gD,border:`1px solid ${m.src==="auto"?C.pur:C.gold}22`,padding:"2px 7px",borderRadius:3,flexShrink:0,textTransform:"uppercase",marginTop:2}}>{m.tag}</span>
                  <p style={{flex:1,fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>{m.text}</p>
                  <div style={{flexShrink:0,textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                    <p style={{fontFamily:FM,fontSize:"7px",color:C.fa,margin:0}}>{new Date(m.ts).toLocaleDateString("vi-VN")}</p>
                    {m.src==="auto"&&<span style={{fontFamily:FM,fontSize:"7px",color:`${C.pur}60`}}>auto</span>}
                    <button onClick={()=>delMem(m.id)} style={{fontFamily:FM,fontSize:"9px",color:C.red,background:"transparent",border:`1px solid ${C.red}20`,padding:"2px 8px",borderRadius:3,cursor:"pointer"}}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ DAILY ════ */}
        {tab==="daily"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>
            <div style={{background:C.grnD,border:`1px solid ${C.grn}20`,borderRadius:10,padding:"13px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.grn,letterSpacing:"2px",margin:"0 0 2px",textTransform:"uppercase"}}>Lịch ngày · {dayStr} {dateStr}</p>
                  <p style={{fontSize:12,color:C.txt,margin:0}}>{scDone.size===SCHED.length?"🔥 Ngày hoàn hảo!":scDone.size===0?"Làm tuần tự từ block đầu tiên.":`${scDone.size}/${SCHED.length} blocks xong`}</p>
                </div>
                <p style={{fontFamily:FM,fontSize:24,color:C.grn,margin:0,fontWeight:800}}>{scPct}%</p>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2}}>
                <div style={{width:`${scPct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${C.grn},${C.gold})`,transition:"width .4s"}}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:6,marginBottom:14}}>
              {[["🏃","Thể dục","1 giờ","#34D399"],["🇨🇳","Tiếng Trung","2 giờ","#F472B6"],["🇬🇧","Tiếng Anh","1.5 giờ","#22D3EE"],["📖","Đọc sách","30 phút","#60A5FA"],["⚡","Empire","3.5 giờ","#34D399"],["☕","Nghỉ ngơi","3.5 giờ","rgba(255,255,255,0.35)"]].map(([e,l,t,col])=>(
                <div key={l} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                  <span style={{fontSize:15}}>{e}</span>
                  <p style={{fontFamily:FM,fontSize:"11px",color:col,margin:"4px 0 1px",fontWeight:700}}>{t}</p>
                  <p style={{fontSize:10,color:C.mu,margin:0}}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {SCHED.map((blk,i)=>{
                const done=scDone.has(blk.id),isRest=["rest","free","dinner","sleep"].includes(blk.c),isCurr=isCurrentBlock(blk,i),col=blk.col;
                return(
                  <div key={blk.id} onClick={()=>togSc(blk.id)}
                    style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 13px",background:isCurr?`${col}12`:done?`${C.grn}05`:isRest?"rgba(255,255,255,0.01)":C.s1,border:`1px solid ${isCurr?col+"50":done?C.grn+"28":isRest?C.bd:col+"18"}`,borderRadius:8,cursor:"pointer",transition:"all .15s",opacity:isRest&&!isCurr?0.7:1,boxShadow:isCurr?`0 0 12px ${col}15`:"none"}}>
                    <div style={{flexShrink:0,textAlign:"right",minWidth:36}}>
                      <p style={{fontFamily:FM,fontSize:"10px",color:done?C.grn:isCurr?col:isRest?C.mu:col,margin:0,fontWeight:600,lineHeight:1.2}}>{blk.t}</p>
                      {blk.d>0&&<p style={{fontFamily:FM,fontSize:"7px",color:C.fa,margin:"1px 0 0"}}>{blk.d}p</p>}
                    </div>
                    <div style={{width:3,borderRadius:2,flexShrink:0,alignSelf:"stretch",minHeight:18,background:done?C.grn:isCurr?col:isRest?"rgba(255,255,255,0.08)":col}}/>
                    <div style={{width:19,height:19,borderRadius:4,flexShrink:0,marginTop:1,background:done?C.grn:"transparent",border:`2px solid ${done?C.grn:isCurr?col:C.bdH}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s",boxShadow:done?`0 0 6px ${C.grn}40`:"none"}}>
                      {done&&<span style={{color:"#000",fontSize:10,fontWeight:800}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                        <span style={{fontSize:12}}>{blk.e}</span>
                        <p style={{fontSize:12,fontWeight:isRest?400:700,margin:0,lineHeight:1.3,color:done?"rgba(232,227,216,0.3)":isCurr?"#fff":isRest?C.mu:"#fff",textDecoration:done?"line-through":"none"}}>{blk.n}</p>
                        {isCurr&&<span style={{fontFamily:FM,fontSize:"7px",color:col,background:`${col}18`,border:`1px solid ${col}30`,padding:"1px 6px",borderRadius:3}}>NOW</span>}
                        {!isRest&&!isCurr&&<span style={{fontFamily:FM,fontSize:"7px",color:col,background:`${col}0F`,border:`1px solid ${col}18`,padding:"1px 6px",borderRadius:3,textTransform:"uppercase"}}>{blk.c}</span>}
                      </div>
                      <p style={{fontSize:11,color:done?C.fa:C.mu,margin:0,lineHeight:1.5}}>{blk.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ SETUP ════ */}
        {tab==="setup"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>

            {/* Provider Settings card */}
            <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showProvSettings?14:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🔌</span>
                  <div>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 3px",letterSpacing:"2px",textTransform:"uppercase"}}>AI Provider Settings</p>
                    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                      {PROVIDER_LIST.map(p=>{
                        const isActive = activeProviderId===p.id;
                        const hasKey   = p.id==="claude" || !!apiKeys[p.id];
                        return(
                          <span key={p.id} style={{fontFamily:FM,fontSize:"9px",color:isActive?p.color:C.fa,background:isActive?`${p.color}14`:"transparent",border:`1px solid ${isActive?p.color:C.bd}`,padding:"2px 8px",borderRadius:10,cursor:"pointer"}} onClick={()=>setActiveProviderId(p.id)}>
                            {p.icon} {p.name.split(" ")[1] || p.name} {hasKey?"✓":""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setShowProvSettings(p=>!p)} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.bd}`,padding:"5px 12px",borderRadius:5,cursor:"pointer",letterSpacing:"1px",flexShrink:0}}>{showProvSettings?"ẨN ▲":"CẤU HÌNH ▼"}</button>
              </div>

              {showProvSettings && (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {PROVIDER_LIST.map(p => {
                    const isExpanded = expandedProv===p.id;
                    const curModel   = providerModels[p.id] || p.defaultModel;
                    const hasKey     = p.id==="claude" || !!apiKeys[p.id];
                    const isActive   = activeProviderId===p.id;
                    return (
                      <div key={p.id} style={{background:"rgba(0,0,0,0.25)",border:`1px solid ${isActive?p.color+"40":C.bd}`,borderRadius:8,overflow:"hidden"}}>
                        {/* Provider row header */}
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer"}} onClick={()=>setExpandedProv(isExpanded?null:p.id)}>
                          <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                              <p style={{fontFamily:FM,fontSize:"11px",fontWeight:700,color:isActive?p.color:"#fff",margin:0}}>{p.name}</p>
                              {isActive && <span style={{fontFamily:FM,fontSize:"8px",color:p.color,background:`${p.color}18`,border:`1px solid ${p.color}30`,padding:"1px 7px",borderRadius:10}}>Chat 1:1 ✓</span>}
                              {p.id==="claude" && <span style={{fontFamily:FM,fontSize:"8px",color:"#A78BFA",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",padding:"1px 7px",borderRadius:10}}>Council ✓</span>}
                              <span style={{fontFamily:FM,fontSize:"8px",color:hasKey?C.grn:C.org,background:hasKey?`${C.grn}10`:`${C.org}10`,border:`1px solid ${hasKey?C.grn:C.org}25`,padding:"1px 7px",borderRadius:10}}>{hasKey?"Key OK ✓":"Chưa có key"}</span>
                            </div>
                            <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"2px 0 0"}}>Model hiện tại: <span style={{color:p.color}}>{p.models.find(m=>m.id===curModel)?.label || curModel}</span></p>
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                            <button onClick={e=>{e.stopPropagation();setActiveProviderId(p.id);}}
                              style={{fontFamily:FM,fontSize:"9px",color:isActive?p.color:C.mu,background:isActive?`${p.color}14`:"transparent",border:`1px solid ${isActive?p.color:C.bd}`,padding:"4px 10px",borderRadius:4,cursor:"pointer"}}>
                              {isActive?"Đang dùng ✓":"Dùng cho Chat"}
                            </button>
                            <span style={{color:C.fa,fontSize:11}}>{isExpanded?"▲":"▼"}</span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.bd}`}}>
                            {/* API Key */}
                            <div style={{marginTop:10}}>
                              <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px",textTransform:"uppercase"}}>
                                API KEY {p.id==="claude"?"(tuỳ chọn — built-in hoạt động)":"(bắt buộc)"}
                              </p>
                              <input type="password"
                                value={apiKeys[p.id] || ""}
                                onChange={e=>setApiKeys(prev=>({...prev,[p.id]:e.target.value}))}
                                placeholder={p.keyPlaceholder}
                                style={{width:"100%",boxSizing:"border-box",background:"rgba(0,0,0,0.4)",border:`1px solid ${p.color}30`,borderRadius:5,padding:"8px 11px",color:C.txt,fontFamily:FM,fontSize:"10px",outline:"none"}}
                              />
                              <p style={{fontFamily:FM,fontSize:"8px",color:`${p.color}70`,margin:"5px 0 0"}}>📎 {p.keyHint}</p>
                            </div>
                            {/* Model picker */}
                            <div style={{marginTop:10}}>
                              <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px",textTransform:"uppercase"}}>MODEL</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {p.models.map(m=>{
                                  const sel = curModel===m.id;
                                  return(
                                    <button key={m.id} onClick={()=>setProviderModels(prev=>({...prev,[p.id]:m.id}))}
                                      style={{display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"7px 11px",background:sel?`${p.color}14`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?p.color:C.bd}`,borderRadius:6,cursor:"pointer",transition:"all .12s",minWidth:140}}>
                                      <span style={{fontFamily:FM,fontSize:"10px",color:sel?p.color:"#fff",fontWeight:sel?700:400}}>{m.label} {sel?"✓":""}</span>
                                      <span style={{fontFamily:FM,fontSize:"8px",color:C.mu,marginTop:2}}>{m.note}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{background:`${PROVIDERS.claude.color}08`,border:`1px solid ${PROVIDERS.claude.color}20`,borderRadius:7,padding:"9px 13px"}}>
                    <p style={{fontFamily:FM,fontSize:"9px",color:PROVIDERS.claude.color,margin:"0 0 3px"}}>🟣 Council Tab luôn dùng Claude</p>
                    <p style={{fontSize:11,color:C.mu,margin:0,lineHeight:1.55}}>Hội đồng 42 cố vấn yêu cầu model hiểu role-play tiếng Việt sâu — Claude tối ưu nhất cho việc này.</p>
                  </div>
                </div>
              )}
            </div>
            {/* Setup progress */}
            <div style={{background:C.bluD,border:`1px solid ${C.blu}20`,borderRadius:10,padding:"13px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.blu,letterSpacing:"2px",margin:"0 0 2px",textTransform:"uppercase"}}>Windows Setup · 13 bước từ đầu đến deploy</p>
                  <p style={{fontSize:12,color:C.txt,margin:0}}>{sDone.size===SETUP.length?"🎉 Hoàn thành! Empire Council đang LIVE!":sDone.size===0?"Làm tuần tự từ Bước 1.":`Còn ${SETUP.length-sDone.size} bước nữa.`}</p>
                </div>
                <p style={{fontFamily:FM,fontSize:24,color:C.blu,margin:0,fontWeight:800}}>{sPct}%</p>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2}}>
                <div style={{width:`${sPct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${C.blu},${C.grn})`,transition:"width .5s"}}/>
              </div>
            </div>
            {[{ph:1,l:"Phase 1 — Cài tools",c:C.blu},{ph:2,l:"Phase 2 — Tài khoản & API",c:C.org},{ph:3,l:"Phase 3 — Project & cấu hình",c:C.pur},{ph:4,l:"Phase 4 — Code & Deploy",c:C.grn}].map(({ph,l,c:phC})=>(
              <div key={ph} style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"0 0 8px"}}>
                  <div style={{height:1,flex:1,background:C.bd}}/><span style={{fontFamily:FM,fontSize:"9px",color:phC,letterSpacing:"2px",textTransform:"uppercase"}}>{l}</span><div style={{height:1,flex:1,background:C.bd}}/>
                </div>
                {SETUP.filter(s=>s.ph===ph).map(step=>{
                  const done=sDone.has(step.id),open=openStep===step.id,tc=step.tc;
                  return(
                    <div key={step.id} style={{background:done?`${C.grn}04`:C.s1,border:`1px solid ${open?tc:done?C.grn+"30":C.bd}`,borderRadius:8,overflow:"hidden",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 14px",cursor:"pointer"}} onClick={()=>setOpenStep(open?null:step.id)}>
                        <div onClick={e=>{e.stopPropagation();togS(step.id);}} style={{width:21,height:21,borderRadius:5,flexShrink:0,background:done?C.grn:"transparent",border:`2px solid ${done?C.grn:C.bdH}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .12s",boxShadow:done?`0 0 7px ${C.grn}40`:"none"}}>
                          {done&&<span style={{color:"#000",fontSize:10,fontWeight:800}}>✓</span>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:2}}>
                            <span style={{fontFamily:FM,fontSize:"8px",color:tc,background:`${tc}14`,border:`1px solid ${tc}25`,padding:"1px 7px",borderRadius:3,letterSpacing:"1px",textTransform:"uppercase"}}>{step.tag}</span>
                            <span style={{fontFamily:FM,fontSize:"8px",color:C.mu}}>⏱ {step.time}</span>
                            {done&&<span style={{fontFamily:FM,fontSize:"8px",color:C.grn,fontWeight:700}}>DONE ✓</span>}
                          </div>
                          <p style={{fontSize:13,fontWeight:700,margin:0,color:done?"rgba(232,227,216,0.28)":"#fff",textDecoration:done?"line-through":"none"}}>{step.title}</p>
                        </div>
                        <span style={{fontFamily:FM,fontSize:"9px",color:C.fa,paddingTop:2}}>{open?"▲":"▼"}</span>
                      </div>
                      {open&&(
                        <div style={{padding:"0 14px 13px 47px",borderTop:`1px solid ${C.bd}`}}>
                          <p style={{fontSize:11,color:C.mu,margin:"8px 0 9px",fontStyle:"italic",lineHeight:1.65}}>💡 {step.why}</p>
                          {step.items.map((item,i)=>(
                            <div key={i} style={{marginBottom:6}}>
                              {(item.t==="do"||item.t==="go")&&<div style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:tc,flexShrink:0,fontSize:10,marginTop:3}}>{item.t==="go"?"🔗":"▸"}</span><p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>{item.v}</p></div>}
                              {item.t==="cmd"&&<div style={{background:"rgba(0,0,0,0.6)",border:`1px solid ${tc}20`,borderRadius:5,padding:"7px 11px",display:"flex",gap:7,alignItems:"flex-start",marginTop:2}}><span style={{color:tc,fontFamily:FM,fontSize:"9px",flexShrink:0,paddingTop:1}}>$</span><pre style={{fontFamily:FM,fontSize:"11px",color:tc,margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.6}}>{item.v}</pre></div>}
                              {item.t==="ok"&&<div style={{display:"flex",gap:7,alignItems:"flex-start",paddingLeft:4,marginTop:2}}><span style={{color:C.grn,flexShrink:0,fontSize:10,marginTop:2}}>→</span><p style={{fontFamily:FM,fontSize:"10px",color:C.grn,margin:0,lineHeight:1.6}}>{item.v}</p></div>}
                            </div>
                          ))}
                          {step.fix&&<div style={{marginTop:7,padding:"7px 11px",borderRadius:5,background:C.orgD,border:`1px solid ${C.org}20`}}><p style={{fontFamily:FM,fontSize:"8px",color:C.org,margin:"0 0 2px",letterSpacing:"1px",textTransform:"uppercase"}}>⚠ Nếu lỗi</p><p style={{fontSize:11,color:C.txt,margin:0,lineHeight:1.55}}>{step.fix}</p></div>}
                          {step.check&&<div style={{marginTop:6,padding:"7px 11px",borderRadius:5,background:C.grnD,border:`1px solid ${C.grn}20`}}><p style={{fontFamily:FM,fontSize:"8px",color:C.grn,margin:"0 0 2px",letterSpacing:"1px",textTransform:"uppercase"}}>✅ Checkpoint</p><p style={{fontSize:11,color:C.txt,margin:0}}>{step.check}</p></div>}
                          <button onClick={()=>togS(step.id)} style={{marginTop:10,fontFamily:FM,fontSize:"9px",letterSpacing:"1.5px",textTransform:"uppercase",background:done?C.grnD:`${tc}0F`,border:`1px solid ${done?C.grn:tc}22`,color:done?C.grn:tc,padding:"6px 14px",borderRadius:4,cursor:"pointer"}}>{done?"✓ Done — Bỏ đánh dấu":"Đánh dấu hoàn thành ✓"}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ════ ROADMAP ════ */}
        {/* ════ ANALYTICS ════ */}
        {tab==="analytics"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"16px 20px",boxSizing:"border-box"}}>

            {/* Sub-nav */}
            <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
              {[["decisions","📝 Decision Log"],["patterns","🔍 Pattern Insights"],["weekly","📈 Weekly Report"],["agents","🤖 Agent Stats"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setAnalyticView(id)}
                  style={{fontFamily:FM,fontSize:"10px",padding:"5px 14px",borderRadius:5,cursor:"pointer",letterSpacing:"0.5px",
                    background: analyticView===id ? "rgba(52,211,153,0.12)" : "transparent",
                    border: `1px solid ${analyticView===id ? "#34D399" : C.bd}`,
                    color: analyticView===id ? "#34D399" : C.mu}}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* ── DECISION LOG ── */}
            {analyticView==="decisions"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 3px"}}>DECISION LOG</p>
                    <p style={{fontSize:12,color:C.fa,margin:0}}>{decisions.length} decisions · {decisions.filter(d=>d.status==="resolved").length} resolved</p>
                  </div>
                  <button onClick={()=>setShowDecForm(p=>!p)}
                    style={{fontFamily:FM,fontSize:"10px",color:"#34D399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",padding:"6px 14px",borderRadius:6,cursor:"pointer"}}>
                    {showDecForm ? "✕ HỦY" : "+ THÊM DECISION"}
                  </button>
                </div>

                {showDecForm&&(
                  <div style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"16px",marginBottom:16}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:"#34D399",letterSpacing:"2px",margin:"0 0 12px"}}>DECISION MỚI</p>
                    {[["title","Tiêu đề quyết định *","text"],["context","Bối cảnh / Vấn đề","textarea"],["options","Các lựa chọn đã xem xét","textarea"],["outcome","Kết quả mong đợi","text"],["tags","Tags (phân cách bằng dấu phẩy)","text"]].map(([f,ph,type])=>(
                      <div key={f} style={{marginBottom:10}}>
                        {type==="textarea"
                          ? <textarea value={decIn[f]} onChange={e=>setDecIn(p=>({...p,[f]:e.target.value}))} placeholder={ph} rows={2}
                              style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none",resize:"vertical"}}/>
                          : <input value={decIn[f]} onChange={e=>setDecIn(p=>({...p,[f]:e.target.value}))} placeholder={ph}
                              style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                        }
                      </div>
                    ))}
                    <button onClick={addDecision}
                      style={{padding:"8px 20px",background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.4)",borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399",letterSpacing:"1px"}}>
                      LƯU DECISION ✓
                    </button>
                  </div>
                )}

                {decisions.length===0&&!showDecForm&&(
                  <div style={{textAlign:"center",padding:"40px 0",color:C.mu}}>
                    <p style={{fontSize:28,margin:"0 0 10px"}}>📝</p>
                    <p style={{fontSize:13,margin:"0 0 6px"}}>Chưa có decision nào</p>
                    <p style={{fontSize:11,color:C.fa}}>Mỗi quyết định quan trọng nên được ghi lại — dù nhỏ.</p>
                  </div>
                )}

                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {decisions.map(d=>(
                    <div key={d.id} style={{background:C.s1,border:`1px solid ${d.status==="resolved"?"rgba(52,211,153,0.2)":C.bd}`,borderRadius:9,padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:600,color:d.status==="resolved"?"#34D399":C.txt}}>{d.title}</span>
                            <span style={{fontFamily:FM,fontSize:"8px",padding:"2px 7px",borderRadius:3,
                              background:d.status==="resolved"?"rgba(52,211,153,0.12)":"rgba(251,146,60,0.1)",
                              color:d.status==="resolved"?"#34D399":"#FB923C"}}>
                              {d.status==="resolved"?"✓ RESOLVED":"⏳ OPEN"}
                            </span>
                            <span style={{fontFamily:FM,fontSize:"8px",color:C.mu,marginLeft:"auto"}}>
                              {new Date(d.ts).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          {d.context&&<p style={{fontSize:12,color:C.fa,margin:"0 0 4px",lineHeight:1.6}}>{d.context}</p>}
                          {d.options&&<p style={{fontSize:11,color:C.mu,margin:"0 0 4px"}}>🔀 {d.options}</p>}
                          {d.outcome&&<p style={{fontSize:11,color:"#34D399",margin:"0 0 6px"}}>🎯 {d.outcome}</p>}
                          {d.tags.length>0&&(
                            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                              {d.tags.map(t=><span key={t} style={{fontFamily:FM,fontSize:"8px",padding:"1px 6px",borderRadius:3,background:"rgba(167,139,250,0.1)",color:C.pur}}>{t}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{display:"flex",gap:5,flexShrink:0}}>
                          {d.status!=="resolved"&&(
                            <button onClick={()=>updateDecisionStatus(d.id,"resolved")}
                              style={{fontFamily:FM,fontSize:"8px",padding:"3px 8px",borderRadius:3,cursor:"pointer",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",color:"#34D399"}}>✓</button>
                          )}
                          <button onClick={()=>deleteDecision(d.id)}
                            style={{fontFamily:FM,fontSize:"8px",padding:"3px 8px",borderRadius:3,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PATTERN INSIGHTS ── */}
            {analyticView==="patterns"&&(
              <div>
                <div style={{marginBottom:16}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 4px"}}>🔍 PATTERN INSIGHTS</p>
                  <p style={{fontSize:12,color:C.fa,margin:"0 0 14px"}}>AI phân tích {mems.length} memories + {decisions.length} decisions → tìm blind spots & patterns</p>
                  <button onClick={runPatternInsights} disabled={patternBusy||mems.length<3}
                    style={{padding:"8px 20px",background:patternBusy?"transparent":"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",borderRadius:6,cursor:patternBusy||mems.length<3?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399",letterSpacing:"1px"}}>
                    {patternBusy?"⏳ Đang phân tích...":mems.length<3?"Cần ít nhất 3 memories":"🔍 PHÂN TÍCH NGAY"}
                  </button>
                </div>
                {patternRes&&(
                  <div style={{background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:10,padding:"18px 20px"}}>
                    <Md text={patternRes} accent="#34D399"/>
                  </div>
                )}
                {!patternRes&&!patternBusy&&mems.length>=3&&(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.mu}}>
                    <p style={{fontSize:28,margin:"0 0 8px"}}>🔍</p>
                    <p style={{fontSize:12}}>Bấm để AI phân tích patterns trong data của bạn</p>
                  </div>
                )}
              </div>
            )}

            {/* ── WEEKLY REPORT ── */}
            {analyticView==="weekly"&&(
              <div>
                <div style={{marginBottom:16}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 4px"}}>📈 WEEKLY REPORT</p>
                  <p style={{fontSize:12,color:C.fa,margin:"0 0 14px"}}>Tổng kết 7 ngày qua: memories, decisions, chat sessions</p>
                  <button onClick={runWeeklyReport} disabled={weeklyBusy}
                    style={{padding:"8px 20px",background:weeklyBusy?"transparent":"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",borderRadius:6,cursor:weeklyBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399",letterSpacing:"1px"}}>
                    {weeklyBusy?"⏳ Đang tổng hợp...":"📈 TẠO WEEKLY REPORT"}
                  </button>
                </div>
                {weeklyRes&&(
                  <div style={{background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:10,padding:"18px 20px"}}>
                    <Md text={weeklyRes} accent="#34D399"/>
                  </div>
                )}
                {!weeklyRes&&!weeklyBusy&&(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.mu}}>
                    <p style={{fontSize:28,margin:"0 0 8px"}}>📈</p>
                    <p style={{fontSize:12}}>Bấm để tạo báo cáo tuần này</p>
                  </div>
                )}
              </div>
            )}

            {/* ── AGENT STATS ── */}
            {analyticView==="agents"&&(()=>{
              const idx = (() => { try { return JSON.parse(localStorage.getItem("empire_sess_index")||"[]"); } catch { return []; } })();
              const counts = {};
              (Array.isArray(idx)?idx:[]).forEach(s => { counts[s.agId] = (counts[s.agId]||0)+1; });
              const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
              const total  = sorted.reduce((s,[,c])=>s+c, 0);
              return(
                <div>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 14px"}}>🤖 AGENT USAGE STATS</p>
                  {sorted.length===0&&(
                    <div style={{textAlign:"center",padding:"30px 0",color:C.mu}}>
                      <p style={{fontSize:28,margin:"0 0 8px"}}>🤖</p>
                      <p style={{fontSize:12}}>Chưa có data — hãy chat với các agents trước!</p>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {sorted.map(([agId, cnt], i)=>{
                      const ag = AGENTS.find(a=>a.id===agId);
                      if(!ag) return null;
                      const pct = total > 0 ? Math.round(cnt/total*100) : 0;
                      return(
                        <div key={agId} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                            <span style={{fontSize:16}}>{ag.icon}</span>
                            <span style={{fontSize:13,fontWeight:600,color:ag.col}}>{ag.n}</span>
                            <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>{ag.role}</span>
                            <span style={{fontFamily:FM,fontSize:"11px",color:ag.col,marginLeft:"auto",fontWeight:700}}>{cnt} chats</span>
                            <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>{pct}%</span>
                          </div>
                          <div style={{height:4,background:C.bd,borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${ag.col},${ag.col}88)`,borderRadius:2,transition:"width .4s ease"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {sorted.length>0&&(
                    <div style={{marginTop:14,padding:"12px 16px",background:"rgba(232,197,71,0.05)",border:"1px solid rgba(232,197,71,0.15)",borderRadius:8}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:C.gold,margin:"0 0 4px",letterSpacing:"1.5px"}}>TỔNG KẾT</p>
                      <p style={{fontSize:12,color:C.fa,margin:0}}>{total} tổng sessions · {sorted.length} agents đã dùng · Agent yêu thích: {AGENTS.find(a=>a.id===sorted[0]?.[0])?.n||"N/A"}</p>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {tab==="roadmap"&&yr&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
              <p style={{fontFamily:FM,fontSize:"8px",color:C.org,letterSpacing:"2px",margin:"0 0 10px",textTransform:"uppercase"}}>Lộ Trình Tự Động Hoá — 2026 đến 2030</p>
              <div style={{display:"flex",gap:4}}>
                {YEARS.map((y,i)=>(
                  <div key={y.y} onClick={()=>setSelYear(y.y)} style={{flex:1,cursor:"pointer"}}>
                    <div style={{height:8,background:`${y.col}18`,border:`1px solid ${y.col}30`,borderRadius:i===0?"4px 0 0 4px":i===4?"0 4px 4px 0":0,overflow:"hidden"}}>
                      <div style={{width:`${y.pct}%`,height:"100%",background:y.col,opacity:selYear===y.y?1:0.5,transition:"all .3s"}}/>
                    </div>
                    <p style={{fontFamily:FM,fontSize:"8px",color:selYear===y.y?y.col:C.mu,margin:"4px 0 0",textAlign:"center"}}>{y.period} · {y.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {YEARS.map(y=>{const sel=selYear===y.y;return(
                <button key={y.y} onClick={()=>{setSelYear(y.y);setYrView("owns");}} style={{flex:1,minWidth:110,padding:"12px 10px",textAlign:"center",background:sel?`${y.col}14`:C.s1,border:`1px solid ${sel?y.col:C.bd}`,borderRadius:9,cursor:"pointer",transition:"all .15s",boxShadow:sel?`0 0 14px ${y.col}18`:"none"}}>
                  <p style={{fontSize:18,margin:"0 0 4px"}}>{y.icon}</p>
                  <p style={{fontFamily:FM,fontSize:"8px",color:sel?y.col:C.mu,margin:"0 0 2px",letterSpacing:"1px"}}>{y.period}</p>
                  <p style={{fontSize:11,fontWeight:sel?700:400,color:sel?"#fff":C.mu,margin:"0 0 4px",lineHeight:1.3}}>{y.theme}</p>
                  <p style={{fontFamily:FM,fontSize:"8px",color:y.col,margin:0}}>{y.pct}% auto</p>
                </button>
              );})}
            </div>
            <div style={{background:`${yr.col}09`,border:`1px solid ${yr.col}25`,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1,minWidth:220}}>
                  <p style={{fontFamily:FM,fontSize:"8px",color:yr.col,margin:"0 0 4px",letterSpacing:"2px",textTransform:"uppercase"}}>Bạn là ai trong năm này</p>
                  <p style={{fontSize:19,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>{yr.icon} {yr.identity}</p>
                  <p style={{fontSize:13,color:C.mu,margin:"0 0 10px",lineHeight:1.6,fontStyle:"italic"}}>"{yr.mantra}"</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{yr.skills.map(s=><span key={s} style={{fontFamily:FM,fontSize:"9px",color:yr.col,background:`${yr.col}14`,border:`1px solid ${yr.col}28`,padding:"2px 9px",borderRadius:3}}>{s}</span>)}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:180}}>
                  <div style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${C.bd}`,borderRadius:7,padding:"10px 14px"}}>
                    <p style={{fontFamily:FM,fontSize:"7px",color:C.mu,margin:"0 0 3px",letterSpacing:"1px",textTransform:"uppercase"}}>Thu nhập mục tiêu</p>
                    <p style={{fontFamily:FM,fontSize:12,color:yr.col,margin:"0 0 8px",fontWeight:700}}>{yr.income}</p>
                    <p style={{fontFamily:FM,fontSize:"7px",color:C.mu,margin:"0 0 3px",letterSpacing:"1px",textTransform:"uppercase"}}>Key metric</p>
                    <p style={{fontFamily:FM,fontSize:11,color:C.grn,margin:0}}>{yr.metric}</p>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${C.bd}`,borderRadius:7,padding:"10px 14px"}}>
                    <p style={{fontFamily:FM,fontSize:"7px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px",textTransform:"uppercase"}}>Đánh giá khả thi</p>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <div style={{flex:1,height:6,background:"rgba(255,255,255,0.07)",borderRadius:3}}>
                        <div style={{width:`${yr.feasibility}%`,height:"100%",borderRadius:3,background:yr.feasibility>70?C.grn:yr.feasibility>45?C.gold:C.org}}/>
                      </div>
                      <span style={{fontFamily:FM,fontSize:12,color:yr.feasibility>70?C.grn:yr.feasibility>45?C.gold:C.org,fontWeight:700}}>{yr.feasibility}%</span>
                    </div>
                    <p style={{fontSize:10,color:C.mu,margin:0,lineHeight:1.5}}>{yr.feasNote}</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:12}}>
              {[["owns","⚙️ Empire Sở Hữu"],["quarters","📋 Hành Động Theo Quý"]].map(([v,l])=>(
                <button key={v} onClick={()=>setYrView(v)} style={{padding:"7px 16px",background:yrView===v?`${yr.col}14`:"rgba(255,255,255,0.02)",border:`1px solid ${yrView===v?yr.col:C.bd}`,borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"9px",color:yrView===v?yr.col:C.mu,letterSpacing:"1px",textTransform:"uppercase"}}>{l}</button>
              ))}
            </div>
            {yrView==="owns"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:9,padding:"14px 16px"}}>
                  <p style={{fontFamily:FM,fontSize:"8px",color:yr.col,margin:"0 0 10px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Empire sẽ có</p>
                  {yr.owns.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:yr.col,flexShrink:0,marginTop:6}}/>
                      <p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>{item}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:9,padding:"14px 16px"}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 6px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Trạng thái</p>
                    <p style={{fontSize:16,margin:"0 0 6px"}}>{yr.status}</p>
                    <div style={{height:5,background:"rgba(255,255,255,0.07)",borderRadius:2,marginTop:8}}>
                      <div style={{width:`${yr.pct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${yr.col}80,${yr.col})`}}/>
                    </div>
                    <p style={{fontFamily:FM,fontSize:10,color:yr.col,margin:"5px 0 0",fontWeight:700}}>{yr.pct}% Automation</p>
                  </div>
                  {selYear>1 && YEARS.filter(y=>y.y===selYear-1).map(prev=>(
                    <div key="prev" style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:9,padding:"14px 16px",flex:1}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 7px",letterSpacing:"1.5px",textTransform:"uppercase"}}>Tiến độ từ năm trước</p>
                      <p style={{fontSize:11,color:C.mu,margin:"0 0 4px"}}><span style={{color:prev.col}}>Năm {prev.y}:</span> {prev.pct}% · {prev.identity}</p>
                      <p style={{fontSize:11,color:C.mu,margin:0}}><span style={{color:yr.col}}>Năm {yr.y}:</span> {yr.pct}% · {yr.identity}</p>
                      <p style={{fontFamily:FM,fontSize:10,color:C.grn,margin:"7px 0 0"}}>+{yr.pct-prev.pct}% automation</p>
                    </div>
                  ))}
                  {selYear===1&&<div style={{background:C.grnD,border:`1px solid ${C.grn}20`,borderRadius:9,padding:"14px 16px",flex:1}}><p style={{fontFamily:FM,fontSize:"8px",color:C.grn,margin:"0 0 6px",letterSpacing:"1px",textTransform:"uppercase"}}>Bạn đang ở đây</p><p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>Tháng 3/2026 — đế chế bắt đầu từ đây.</p></div>}
                </div>
              </div>
            )}
            {yrView==="quarters"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:8}}>
                {yr.quarters.map(q=>(
                  <div key={q.q} style={{background:C.s1,border:`1px solid ${yr.col}20`,borderRadius:9,padding:"14px 15px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontFamily:FM,fontSize:"9px",color:yr.col,background:`${yr.col}18`,border:`1px solid ${yr.col}30`,padding:"2px 9px",borderRadius:3,letterSpacing:"1px"}}>{q.q}</span>
                      <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:0}}>{q.t}</p>
                    </div>
                    {q.items.map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:7}}>
                        <span style={{color:yr.col,flexShrink:0,fontSize:9,marginTop:4}}>▸</span>
                        <p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>{item}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div style={{marginTop:16,background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px"}}>
              <p style={{fontFamily:FM,fontSize:"8px",color:C.fa,margin:"0 0 10px",letterSpacing:"2px",textTransform:"uppercase"}}>Toàn bộ hành trình 5 năm</p>
              <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
                {YEARS.map((y,i)=>(
                  <div key={y.y} style={{display:"flex",alignItems:"center",flexShrink:0}}>
                    <div onClick={()=>setSelYear(y.y)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 14px",background:`${y.col}0E`,border:`1px solid ${selYear===y.y?y.col:y.col+"28"}`,borderRadius:7,cursor:"pointer",minWidth:110,textAlign:"center",boxShadow:selYear===y.y?`0 0 12px ${y.col}20`:"none"}}>
                      <span style={{fontSize:14}}>{y.icon}</span>
                      <p style={{fontFamily:FM,fontSize:"9px",color:y.col,margin:0}}>{y.period}</p>
                      <p style={{fontSize:10,color:selYear===y.y?"#fff":C.mu,margin:0,fontWeight:selYear===y.y?700:400,lineHeight:1.3}}>{y.theme}</p>
                      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                        <div style={{width:30,height:2,background:`${y.col}20`,borderRadius:1,overflow:"hidden"}}><div style={{width:`${y.feasibility}%`,height:"100%",background:y.col}}/></div>
                        <p style={{fontFamily:FM,fontSize:"7px",color:y.feasibility>70?C.grn:y.feasibility>45?C.gold:C.org,margin:0}}>{y.feasibility}%</p>
                      </div>
                    </div>
                    {i<4&&<div style={{width:16,height:1,background:`linear-gradient(90deg,${y.col}60,${YEARS[i+1].col}60)`,flexShrink:0}}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
