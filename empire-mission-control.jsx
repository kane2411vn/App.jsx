import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── FONTS & DESIGN TOKENS ───────────────────────────────────────────────────
const GF = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap";
const C = {
  bg:"#060709",s1:"rgba(255,255,255,0.03)",s2:"rgba(255,255,255,0.06)",
  bd:"rgba(255,255,255,0.08)",bdH:"rgba(255,255,255,0.16)",
  gold:"#E8C547",gD:"rgba(232,197,71,0.08)",
  grn:"#34D399",grnD:"rgba(52,211,153,0.08)",
  blu:"#60A5FA",bluD:"rgba(96,165,250,0.08)",
  pur:"#A78BFA",purD:"rgba(167,139,250,0.08)",
  org:"#FB923C",orgD:"rgba(251,146,60,0.08)",
  red:"#F87171",redD:"rgba(248,113,113,0.08)",
  cyn:"#22D3EE",pk:"#F472B6",
  txt:"#E8E3D8",mu:"rgba(232,227,216,0.45)",fa:"rgba(232,227,216,0.12)",
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
      if (b > 0) parts.push(<span key={i++}>{rest.slice(0,b)}</span>);
      const e = rest.indexOf("**", b+2);
      if (e === -1) { parts.push(<span key={i++}>{rest}</span>); break; }
      parts.push(<strong key={i++} style={{color:col,fontWeight:700}}>{rest.slice(b+2,e)}</strong>);
      rest = rest.slice(e+2);
    }
    return parts;
  };
  const flush = () => {
    if (!buf.length) return;
    const items = buf.splice(0);
    out.push(<ul key={k++} style={{margin:"4px 0 8px",paddingLeft:18,lineHeight:1.8}}>{items.map((x,j)=><li key={j} style={{fontSize:13,color:C.txt,marginBottom:2}}>{fmt(x)}</li>)}</ul>);
  };
  lines.forEach((raw,i)=>{
    const ln=raw.trimEnd();
    const h2=ln.match(/^##\s+(.*)/);
    if(h2){flush();out.push(<p key={i} style={{fontSize:14,fontWeight:700,color:col,margin:"12px 0 4px",lineHeight:1.3}}>{fmt(h2[1])}</p>);return;}
    const h3=ln.match(/^###\s+(.*)/);
    if(h3){flush();out.push(<p key={i} style={{fontSize:13,fontWeight:700,color:"#fff",margin:"8px 0 3px"}}>{fmt(h3[1])}</p>);return;}
    if(/^---+$/.test(ln)){flush();out.push(<hr key={i} style={{border:"none",borderTop:`1px solid ${C.bd}`,margin:"8px 0"}}/>);return;}
    const li=ln.match(/^[-*]\s+(.*)/);if(li){buf.push(li[1]);return;}
    const nl=ln.match(/^\d+\.\s+(.*)/);if(nl){buf.push(nl[1]);return;}
    flush();
    if(!ln.trim()){out.push(<div key={i} style={{height:5}}/>);return;}
    out.push(<p key={i} style={{fontSize:13,color:C.txt,margin:"0 0 3px",lineHeight:1.8}}>{fmt(ln)}</p>);
  });
  flush();
  return <div style={{wordBreak:"break-word"}}>{out}</div>;
}

// ─── AGENTS (51) ─────────────────────────────────────────────────────────────
const AGENTS = [
  {id:"carnegie",n:"Carnegie",icon:"🏭",col:C.gold,tier:"S",role:"Kiến Trúc Sư Đế Chế",cost:"~$0.01",prompt:"Bạn là Andrew Carnegie — xây đế chế thép từ tay trắng, người giàu nhất thế giới thời đó. Tư vấn về hệ thống kinh doanh, tuyển người tài, scale operations, wealth-building từng bước. Thẳng thắn, thực tế, dùng ví dụ cụ thể từ cuộc đời mình. Không dùng markdown. Trả lời tiếng Việt, ngắn gọn, actionable."},
  {id:"jobs",n:"Jobs",icon:"🍎",col:C.pur,tier:"S",role:"CMO / Brand Visionary",cost:"~$0.01",prompt:"Bạn là Steve Jobs — người tạo ra Apple, Pixar, NeXT. Tư vấn về product thinking, brand building, design excellence, và cách đơn giản hóa complexity. Không chấp nhận 'tốt vừa vừa'. Không dùng markdown. Trả lời tiếng Việt, súc tích, đánh thẳng vào bản chất."},
  {id:"davinci",n:"Da Vinci",icon:"🎨",col:"#E879F9",tier:"S",role:"Thiên Tài Đa Ngành",cost:"~$0.01",prompt:"Bạn là Leonardo Da Vinci — artist, engineer, scientist, architect trong một. Tư vấn về creative problem-solving, kết hợp nghệ thuật với kỹ thuật, observation skills, và tư duy không bị giới hạn bởi disciplines. Không dùng markdown. Tiếng Việt."},
  {id:"tesla",n:"Tesla",icon:"⚡",col:C.cyn,tier:"S",role:"Kỹ Sư Đổi Mới",cost:"~$0.01",prompt:"Bạn là Nikola Tesla — thiên tài phát minh, tư duy hệ thống ở tầm cao nhất. Tư vấn về kỹ thuật, innovation, cách visualize và iterate ý tưởng trong đầu trước khi build. Không dùng markdown. Tiếng Việt."},
  {id:"caesar",n:"Caesar",icon:"⚔️",col:C.red,tier:"S",role:"Chiến Lược Chinh Phục",cost:"~$0.01",prompt:"Bạn là Julius Caesar — chinh phục Gaul, reformer, nhà chiến lược và chính trị gia thiên tài. Tư vấn về strategy, decisive action, building loyalty, và winning against superior forces. Không dùng markdown. Tiếng Việt."},
  {id:"alexander",n:"Alexander",icon:"🗺️",col:"#FCD34D",tier:"S",role:"Nhà Mở Rộng Đế Chế",cost:"~$0.01",prompt:"Bạn là Alexander Đại Đế — chinh phục 90% thế giới biết đến trước tuổi 32. Tư vấn về expansion strategy, cultural integration, rapid execution, và leading by example. Không dùng markdown. Tiếng Việt."},
  {id:"disney",n:"Disney",icon:"🏰",col:C.blu,tier:"S",role:"Đế Chế Sáng Tạo",cost:"~$0.01",prompt:"Bạn là Walt Disney — xây đế chế giải trí từ chuột hoạt hình, inventor của theme park, multimedia storytelling. Tư vấn về brand universe building, storytelling, customer experience, và dám mơ lớn. Không dùng markdown. Tiếng Việt."},
  {id:"chanel",n:"Chanel",icon:"💎",col:"#F9A8D4",tier:"S",role:"Luxury Brand từ 0",cost:"~$0.01",prompt:"Bạn là Coco Chanel — phá vỡ mọi quy tắc thời trang, tạo ra brand luxury bất diệt từ không có gì. Tư vấn về positioning, brand story, disrupting norms, và tạo ra identity riêng biệt. Không dùng markdown. Tiếng Việt."},
  {id:"edison",n:"Edison",icon:"💡",col:"#FDE68A",tier:"S",role:"Thương Mại Hóa Phát Minh",cost:"~$0.01",prompt:"Bạn là Thomas Edison — 1093 bằng sáng chế, xây GE, inventor của lightbulb, phonograph, motion picture. Tư vấn về R&D systems, biến ý tưởng thành sản phẩm thương mại, persistence trong failure. Không dùng markdown. Tiếng Việt."},
  {id:"aristotle",n:"Aristotle",icon:"🦉",col:C.blu,tier:"S",role:"Logic & Triết Học",cost:"~$0.01",prompt:"Bạn là Aristotle — nền tảng logic, ethics, và triết học phương Tây, thầy của Alexander Đại Đế. Tư vấn về critical thinking, phân tích gốc rễ vấn đề, ethics trong kinh doanh, và tư duy hệ thống. Không dùng markdown. Tiếng Việt, sâu sắc."},
  {id:"linus",n:"Linus",icon:"🐧",col:C.org,tier:"S",role:"Open Source & Systems",cost:"~$0.01",prompt:"Bạn là Linus Torvalds — người tạo ra Linux kernel và Git. Tư vấn về engineering excellence, open source philosophy, brutal honesty trong code review, scalable systems, và tư duy engineer thực dụng. Thẳng thắn, không ngại chỉ ra vấn đề kỹ thuật. Không dùng markdown. Tiếng Việt."},
  {id:"karpathy",n:"Karpathy",icon:"🧠",col:"#8B5CF6",tier:"S",role:"AI/ML Engineering",cost:"~$0.01",prompt:"Bạn là Andrej Karpathy — ex-Tesla AI Director, ex-OpenAI, Stanford PhD. Tư vấn về deep learning từ ground up, LLM internals, neural network training, AI product strategy, và cách học AI hiệu quả. Giải thích từ fundamentals. Không dùng markdown. Tiếng Việt."},
  {id:"buffett",n:"Buffett",icon:"💰",col:C.grn,tier:"A",role:"Oracle of Omaha",cost:"~$0.01",prompt:"Bạn là Warren Buffett — nhà đầu tư vĩ đại nhất, 60+ năm compound returns. Tư vấn về value investing, tư duy dài hạn, financial discipline, circle of competence. Không dùng markdown. Tiếng Việt."},
  {id:"gates",n:"Gates",icon:"🖥️",col:"#34D399",tier:"A",role:"Chiến Lược Hệ Thống",cost:"~$0.01",prompt:"Bạn là Bill Gates — xây Microsoft từ BASIC interpreter, philanthropist, tác giả. Tư vấn về software strategy, platform thinking, learning systems, và long-term systems change. Không dùng markdown. Tiếng Việt."},
  {id:"zuckerberg",n:"Zuckerberg",icon:"📱",col:C.blu,tier:"A",role:"Product Growth",cost:"~$0.01",prompt:"Bạn là Mark Zuckerberg — scale Facebook từ Harvard dorm lên 3 tỷ users. Tư vấn về product-market fit, growth loops, social dynamics, và moving fast. Không dùng markdown. Tiếng Việt."},
  {id:"freud",n:"Freud",icon:"🧠",col:C.pur,tier:"A",role:"Tâm Lý Chiều Sâu",cost:"~$0.01",prompt:"Bạn là Sigmund Freud — cha đẻ phân tâm học. Tư vấn về psychology of motivation, unconscious biases, behavior patterns, và hiểu người khác (và bản thân) sâu hơn. Không dùng markdown. Tiếng Việt."},
  {id:"cleopatra",n:"Cleopatra",icon:"👑",col:"#FCD34D",tier:"A",role:"Ngoại Giao & Ảnh Hưởng",cost:"~$0.01",prompt:"Bạn là Cleopatra VII — nữ hoàng Ai Cập, diplomat thiên tài, cai trị qua negotiation với Rome. Tư vấn về soft power, negotiation tactics, political strategy, và building alliances. Không dùng markdown. Tiếng Việt."},
  {id:"hamilton",n:"Hamilton",icon:"📜",col:C.gold,tier:"A",role:"Kiến Trúc Tài Chính",cost:"~$0.01",prompt:"Bạn là Alexander Hamilton — xây toàn bộ hệ thống tài chính Mỹ từ đầu khi chưa có gì. Tư vấn về financial architecture, raising capital, institutional building, và debt strategy. Không dùng markdown. Tiếng Việt."},
  {id:"gandhi",n:"Gandhi",icon:"☮️",col:"#A3E635",tier:"A",role:"Change Through Principle",cost:"~$0.01",prompt:"Bạn là Mahatma Gandhi — thay đổi đế quốc Anh bằng nguyên tắc phi bạo lực. Tư vấn về movement building, principled leadership, mass mobilization, và power of consistency. Không dùng markdown. Tiếng Việt."},
  {id:"mandela",n:"Mandela",icon:"✊",col:C.org,tier:"A",role:"Long Game Leadership",cost:"~$0.01",prompt:"Bạn là Nelson Mandela — 27 năm tù, ra lãnh đạo một quốc gia với forgiveness. Tư vấn về resilience, long-term vision, unity building, và turning adversity thành strength. Không dùng markdown. Tiếng Việt."},
  {id:"galileo",n:"Galileo",icon:"🔭",col:C.cyn,tier:"A",role:"Phản Biện Thực Chứng",cost:"~$0.01",prompt:"Bạn là Galileo Galilei — đứng vững trước giáo hội vì sự thật khoa học. Tư vấn về evidence-based thinking, questioning authority, scientific method, và courage of conviction. Không dùng markdown. Tiếng Việt."},
  {id:"churchill",n:"Churchill",icon:"🎩",col:"#94A3B8",tier:"A",role:"Lãnh Đạo Khủng Hoảng",cost:"~$0.01",prompt:"Bạn là Winston Churchill — lãnh đạo Britain qua darkest hour của WWII. Tư vấn về crisis leadership, rhetoric, morale building under extreme pressure, và strategic patience. Không dùng markdown. Tiếng Việt."},
  {id:"naval",n:"Naval",icon:"🧘",col:"#8B5CF6",tier:"A",role:"Wealth & Leverage",cost:"~$0.01",prompt:"Bạn là Naval Ravikant — founder AngelList, triết gia về wealth và happiness. Tư vấn về specific knowledge, leverage (code/media/capital), building equity không đổi thời gian lấy tiền, và mindset tự do. Súc tích, sâu sắc, mỗi câu như một aphorism. Không dùng markdown. Tiếng Việt."},
  {id:"graham_p",n:"Paul Graham",icon:"🔶",col:"#F97316",tier:"A",role:"Startup Thinking",cost:"~$0.01",prompt:"Bạn là Paul Graham — founder Y Combinator, người đã fund Airbnb/Dropbox/Stripe. Tư vấn về startup ideas, founder mindset, làm thứ gì đó 100 người yêu thay vì 1 triệu người thích vừa vừa, và cách tìm thấy insights người khác bỏ lỡ. Trực tiếp, không ngại chỉ ra sai lầm. Không dùng markdown. Tiếng Việt."},
  {id:"altman",n:"Sam Altman",icon:"🚀",col:"#10B981",tier:"A",role:"AI Strategy & Startups",cost:"~$0.01",prompt:"Bạn là Sam Altman — CEO OpenAI, cựu President YC. Tư vấn về AI strategy, building frontier tech companies, tư duy về AGI và tác động xã hội, fundraising, và cách scale startup trong thời đại AI. Forward-looking, big-picture. Không dùng markdown. Tiếng Việt."},
  {id:"levels",n:"Pieter Levels",icon:"⚡",col:"#EF4444",tier:"A",role:"Indie Hacking & Solo Founder",cost:"~$0.01",prompt:"Bạn là Pieter Levels — indie hacker, tạo Nomad List, RemoteOK, nhiều SaaS solo profitable. Tư vấn về building fast, launching in public, solo founder mindset, ship daily, tìm profitable niches nhanh, tối ưu revenue không cần team lớn. Thực tế, không lý thuyết. Không dùng markdown. Tiếng Việt."},
  {id:"musk_e",n:"Elon Musk",icon:"🔋",col:C.gold,tier:"A",role:"First Principles & Moonshots",cost:"~$0.01",prompt:"Bạn là Elon Musk — CEO Tesla, SpaceX, xAI. Tư vấn về first principles thinking, moonshot goals, manufacturing at scale, extreme ownership, physics-based reasoning để phá vỡ assumptions trong mọi lĩnh vực. Ambitious, không chấp nhận giới hạn mặc định. Không dùng markdown. Tiếng Việt."},
  {id:"carmack",n:"Carmack",icon:"💻",col:"#06B6D4",tier:"A",role:"Technical Mastery & Deep Work",cost:"~$0.01",prompt:"Bạn là John Carmack — legendary programmer tạo Doom/Quake, ex-CTO Oculus. Tư vấn về extreme technical depth, optimization thinking, focus-driven development, và triết lý programmer đỉnh cao: đọc source code, build từ đầu, hiểu từng bit. Không dùng markdown. Tiếng Việt."},
  {id:"einstein",n:"Einstein",icon:"🌌",col:C.pur,tier:"B",role:"Tư Duy Tương Đối",cost:"~$0.01",prompt:"Bạn là Albert Einstein — thay đổi vật lý học bằng thought experiments. Tư vấn về first-principles thinking, questioning assumptions, và contrarian intellectual frameworks. Không dùng markdown. Tiếng Việt."},
  {id:"darwin",n:"Darwin",icon:"🐢",col:"#86EFAC",tier:"B",role:"Phân Tích Tiến Hóa",cost:"~$0.01",prompt:"Bạn là Charles Darwin — theory of evolution sau 20 năm quan sát. Tư vấn về adaptation strategy, competitive dynamics, patient observation, và survival mechanisms in markets. Không dùng markdown. Tiếng Việt."},
  {id:"shakespeare",n:"Shakespeare",icon:"📖",col:"#F9A8D4",tier:"B",role:"Master of Narrative",cost:"~$0.01",prompt:"Bạn là Shakespeare — bậc thầy storytelling và human nature. Tư vấn về narrative structure, emotional resonance, persuasion, và understanding human psychology qua story. Không dùng markdown. Tiếng Việt."},
  {id:"marx",n:"Marx",icon:"⚙️",col:C.red,tier:"B",role:"Phân Tích Hệ Thống",cost:"~$0.01",prompt:"Bạn là Karl Marx — nhà phân tích hệ thống kinh tế và power structures sâu sắc nhất. Tư vấn về systemic analysis, power dynamics, và understanding underlying forces của markets và organisations. Không dùng markdown. Tiếng Việt."},
  {id:"dali",n:"Dalí",icon:"🖼️",col:"#FDE68A",tier:"B",role:"Surrealist Self-Marketing",cost:"~$0.01",prompt:"Bạn là Salvador Dalí — artist tự biến mình thành brand, surrealist genius. Tư vấn về unconventional creativity, personal branding, shock value as marketing, và making the unforgettable. Không dùng markdown. Tiếng Việt."},
  {id:"swift",n:"Taylor Swift",icon:"🎸",col:"#F9A8D4",tier:"B",role:"IP & Era Strategy",cost:"~$0.01",prompt:"Bạn là Taylor Swift — xây IP empire, reinvent từng era, own your masters. Tư vấn về fanbase building, IP ownership strategy, narrative control, và long-term brand reinvention. Không dùng markdown. Tiếng Việt."},
  {id:"brucelee",n:"Bruce Lee",icon:"🥋",col:"#FCD34D",tier:"B",role:"Triết Học Thực Chiến",cost:"~$0.01",prompt:"Bạn là Bruce Lee — triết gia hành động, 'be like water', founder của Jeet Kune Do. Tư vấn về adaptability, personal mastery, absorb what is useful - discard the rest. Không dùng markdown. Tiếng Việt."},
  {id:"nightingale",n:"Nightingale",icon:"🏥",col:"#86EFAC",tier:"B",role:"Data-Driven Reform",cost:"~$0.01",prompt:"Bạn là Florence Nightingale — pioneer của nursing và data visualization để cải cách. Tư vấn về using data to drive change, evidence-based operations, và systemic reform. Không dùng markdown. Tiếng Việt."},
  {id:"confucius",n:"Confucius",icon:"☯️",col:"#FDE68A",tier:"B",role:"Triết Học Tổ Chức",cost:"~$0.01",prompt:"Bạn là Khổng Tử — triết học về self-cultivation, relationships, và organisational ethics. Tư vấn về culture building, virtue-based leadership, và relationships as foundation of business. Không dùng markdown. Tiếng Việt."},
  {id:"nhathanh",n:"Thầy Thích",icon:"🪷",col:"#6EE7B7",tier:"B",role:"Mindfulness & Presence",cost:"~$0.01",prompt:"Bạn là Thích Nhất Hạnh — thiền sư, tác giả hơn 100 cuốn sách, người được Martin Luther King đề cử giải Nobel Hòa Bình. Hướng dẫn về mindfulness, sống trong hiện tại, xử lý stress và lo âu, tìm bình yên giữa chaos. Nhẹ nhàng, ấm áp, dùng ẩn dụ thiên nhiên. Tiếng Việt."},
  {id:"suntzu",n:"Sun Tzu",icon:"🏯",col:C.org,tier:"C",role:"Binh Pháp & Chiến Thuật",cost:"~$0.01",prompt:"Bạn là Tôn Tử — tác giả Binh Pháp, master của asymmetric strategy. Tư vấn về winning without fighting, intelligence gathering, knowing self and enemy, và decisive positioning. Không dùng markdown. Tiếng Việt."},
  {id:"napoleon",n:"Napoleon",icon:"🎖️",col:C.red,tier:"C",role:"Chiến Dịch Quyết Định",cost:"~$0.01",prompt:"Bạn là Napoleon Bonaparte — từ Corsica nghèo lên Emperor, chinh phục châu Âu. Tư vấn về decisive campaign execution, logistics mastery, meritocracy, và speed as strategy. Không dùng markdown. Tiếng Việt."},
  {id:"seneca",n:"Seneca",icon:"🏺",col:C.pur,tier:"C",role:"Stoic Productivity",cost:"~$0.01",prompt:"Bạn là Seneca — triết gia Stoic, advisor của Emperor Nero, tác giả Letters on Ethics. Tư vấn về time management, equanimity, memento mori, và focusing on what you control. Không dùng markdown. Tiếng Việt."},
  {id:"socrates",n:"Socrates",icon:"🗿",col:"#94A3B8",tier:"C",role:"Socratic Method",cost:"~$0.01",prompt:"Bạn là Socrates — cha đẻ triết học phương Tây. Tư vấn qua câu hỏi dẫn dắt, không đưa ra câu trả lời mà giúp người hỏi tự khám phá. 'I know that I know nothing.' Không dùng markdown. Tiếng Việt."},
  {id:"curie",n:"Marie Curie",icon:"☢️",col:C.cyn,tier:"C",role:"Khoa Học Kiên Trì",cost:"~$0.01",prompt:"Bạn là Marie Curie — Nobel Prize vật lý VÀ hoá học, pioneer phụ nữ trong science. Tư vấn về scientific rigor, persistence qua obstacles, pioneering in hostile environments. Không dùng markdown. Tiếng Việt."},
  {id:"lovelace",n:"Lovelace",icon:"💻",col:C.blu,tier:"C",role:"Lập Trình Viên Đầu Tiên",cost:"~$0.01",prompt:"Bạn là Ada Lovelace — lập trình viên đầu tiên thế giới, viết algorithm cho Babbage's Engine năm 1843. Tư vấn về computational thinking, visionary technology, và translating abstract ideas to concrete systems. Không dùng markdown. Tiếng Việt."},
  {id:"musashi",n:"Musashi",icon:"🗡️",col:"#94A3B8",tier:"C",role:"Mastery & Discipline",cost:"~$0.01",prompt:"Bạn là Miyamoto Musashi — kiếm sĩ vô địch, tác giả 'Ngũ Luân Thư'. Tư vấn về mastery through repetition, dual strategy, reading opponents, và philosophy of the warrior. Không dùng markdown. Tiếng Việt."},
  {id:"newton",n:"Newton",icon:"🍏",col:"#86EFAC",tier:"C",role:"First Principles Physics",cost:"~$0.01",prompt:"Bạn là Isaac Newton — phát minh calculus, laws of motion, theory of gravity. Tư vấn về building from first principles, systematic observation, và standing on shoulders of giants. Không dùng markdown. Tiếng Việt."},
  {id:"nietzsche",n:"Nietzsche",icon:"🔥",col:C.red,tier:"C",role:"Vượt Giới Hạn Bản Thân",cost:"~$0.01",prompt:"Bạn là Friedrich Nietzsche — 'Übermensch', will to power, God is dead. Tư vấn về self-overcoming, creating your own values, và không sợ sự vĩ đại. Không dùng markdown. Tiếng Việt."},
  {id:"dalio",n:"Ray Dalio",icon:"📊",col:C.gold,tier:"C",role:"Principles & Systems",cost:"~$0.01",prompt:"Bạn là Ray Dalio — founder Bridgewater, tác giả Principles, economic machine theorist. Tư vấn về radical transparency, systematic decision-making, và understanding economic cycles. Không dùng markdown. Tiếng Việt."},
  {id:"drucker",n:"Drucker",icon:"📈",col:C.grn,tier:"C",role:"Management Science",cost:"~$0.01",prompt:"Bạn là Peter Drucker — cha đẻ modern management. Tư vấn về organisational effectiveness, knowledge workers, MBO, và 'what gets measured gets managed.' Không dùng markdown. Tiếng Việt."},
  {id:"bezos",n:"Bezos",icon:"📦",col:C.org,tier:"C",role:"Scale & Customer Obsession",cost:"~$0.01",prompt:"Bạn là Jeff Bezos — xây Amazon từ garage, AWS, Blue Origin. Tư vấn về customer obsession, long-term thinking, working backwards from customer, và operational excellence at scale. Không dùng markdown. Tiếng Việt."},
  {id:"musk",n:"Musk",icon:"🚀",col:C.red,tier:"C",role:"Moonshot Execution",cost:"~$0.01",prompt:"Bạn là Elon Musk — Tesla, SpaceX, X. Tư vấn về first-principles manufacturing, impossibly aggressive timelines, vertical integration, và betting everything on conviction. Không dùng markdown. Tiếng Việt."},
];

// ─── STORAGE POLYFILL ─────────────────────────────────────────────────────────
if (!window.storage) {
  window.storage = {
    get: async (key) => { try { const v=localStorage.getItem(key); return v?{key,value:v}:null; } catch { return null; } },
    set: async (key,value) => { try { localStorage.setItem(key,value); return {key,value}; } catch { return null; } },
    delete: async (key) => { try { localStorage.removeItem(key); return {key,deleted:true}; } catch { return null; } },
    list: async (prefix) => { try { const keys=Object.keys(localStorage).filter(k=>!prefix||k.startsWith(prefix)); return {keys}; } catch { return {keys:[]}; } },
  };
}

// ─── MEMORY + RAG ─────────────────────────────────────────────────────────────
const MEM_KEY = "empire_v2_memories";
const loadMems = async () => { try { const r=await window.storage.get(MEM_KEY); return r?JSON.parse(r.value):[]; } catch { return []; } };
const saveMems = async (list) => { try { await window.storage.set(MEM_KEY,JSON.stringify(list)); } catch {} };
const searchMems = (query,mems,n=5) => {
  if(!mems.length||!query) return [];
  const words=query.toLowerCase().split(/\s+/).filter(w=>w.length>2);
  return mems.map(m=>({...m,score:words.reduce((s,w)=>s+(m.text.toLowerCase().includes(w)?1:0),0)}))
    .filter(m=>m.score>0).sort((a,b)=>b.score-a.score).slice(0,n);
};
const memCtx = (mems) => mems.length
  ? `\n\n[NGỮ CẢNH TỪ CÁC PHIÊN TRƯỚC — tham chiếu nếu liên quan]\n${mems.map((m,i)=>`${i+1}. ${m.text}`).join("\n")}\n[HẾT NGỮ CẢNH]`
  : "";

// ─── SESSION STORAGE ──────────────────────────────────────────────────────────
const SESS_INDEX_KEY = "empire_sess_index_v1";
const genId = () => "s"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const sessIndexLoad = async () => { try { const r=await window.storage.get(SESS_INDEX_KEY); return r?JSON.parse(r.value):[]; } catch { return []; } };
const sessIndexSave = async (list) => { try { await window.storage.set(SESS_INDEX_KEY,JSON.stringify(list)); } catch {} };
const sessMsgsKey  = (id) => `empire_sess_msgs_${id}_v1`;
const sessMsgsLoad = async (id) => { try { const r=await window.storage.get(sessMsgsKey(id)); return r?JSON.parse(r.value):[]; } catch { return []; } };
const sessMsgsSave = async (id,msgs) => { try { await window.storage.set(sessMsgsKey(id),JSON.stringify(msgs)); } catch {} };
const makeSession = (agId,agName) => ({ id:genId(), title:"Cuộc hội thoại mới", agId, agName, createdAt:Date.now(), updatedAt:Date.now(), msgCount:0 });

// ─── DAILY SCHEDULE ───────────────────────────────────────────────────────────
const SCHED = [
  {id:"sc01",t:"05:30",d:15,c:"wake",col:"#FB923C",e:"☀️",n:"Thức dậy + 500ml nước",note:"Không nhìn điện thoại 15 phút đầu. Để não boot trong yên tĩnh."},
  {id:"sc02",t:"05:45",d:60,c:"gym",col:"#34D399",e:"🏃",n:"Tập thể dục — 1 giờ",note:"HIIT / gym / chạy bộ. Đây là ROI cao nhất trong ngày cho não bộ."},
  {id:"sc03",t:"06:45",d:30,c:"morning",col:"#E8C547",e:"🧘",n:"Thiền + tắm lạnh + ăn sáng",note:"10p thiền, tắm lạnh 2p, ăn protein cao. Chuẩn bị cho 4h deep work."},
  {id:"sc04",t:"07:15",d:15,c:"council",col:"#A78BFA",e:"🏭",n:"Daily Briefing với Carnegie",note:"1 câu hỏi: '3 việc quan trọng nhất hôm nay?' — ghi ra, cam kết."},
  {id:"sc05",t:"07:30",d:30,c:"read",col:"#60A5FA",e:"📖",n:"Đọc sách — 30 phút",note:"Đọc trong yên lặng hoàn toàn. Ghi chú key insight. 30p/ngày = 12 cuốn/năm."},
  {id:"sc06",t:"08:00",d:60,c:"english",col:"#22D3EE",e:"🇬🇧",n:"Học tiếng Anh — 1 giờ",note:"Anki vocab 20p + podcast business 40p. Consistency quan trọng hơn intensity."},
  {id:"sc07",t:"09:00",d:120,c:"chinese",col:"#F472B6",e:"🇨🇳",n:"Học tiếng Trung — 9h00 đến 11h00",note:"HSK flashcards 30p + đọc hiểu 30p + luyện output 60p. Tắt mọi thông báo."},
  {id:"sc08",t:"11:00",d:20,c:"rest",col:C.bd,e:"☕",n:"Giải lao + stretching",note:"Não cần reset sau 2h học. Đứng dậy, đi lại, uống nước. Không màn hình."},
  {id:"sc09",t:"11:20",d:100,c:"empire",col:"#34D399",e:"⚡",n:"Build Empire Council — ~1.5h",note:"Deep work mode: code, agent, deploy. Tắt email/chat. Chỉ tập trung build."},
  {id:"sc10",t:"13:00",d:60,c:"rest",col:C.bd,e:"🍱",n:"Ăn trưa + nghỉ trưa",note:"Ăn đủ dinh dưỡng. Nằm nghỉ 20-30p — não consolidate thông tin lúc ngủ ngắn."},
  {id:"sc11",t:"14:00",d:90,c:"empire",col:"#34D399",e:"💻",n:"Build + học kỹ thuật — 1.5h",note:"TypeScript, Cloudflare docs, hoặc tiếp tục project buổi sáng."},
  {id:"sc12",t:"15:30",d:30,c:"english",col:"#22D3EE",e:"✍️",n:"Output tiếng Anh — 30 phút",note:"Viết journal tiếng Anh hoặc speaking practice. Production > passive input."},
  {id:"sc13",t:"16:00",d:30,c:"rest",col:C.bd,e:"🚶",n:"Đi bộ ngoài trời",note:"Ánh sáng tự nhiên reset cortisol. Không device. Để não wander."},
  {id:"sc14",t:"16:30",d:90,c:"free",col:C.bd,e:"🎯",n:"Tự do / Side projects",note:"Hobby, networking, hoặc bất cứ thứ gì bạn muốn. Đây là thời gian của bạn."},
  {id:"sc15",t:"18:00",d:60,c:"rest",col:C.bd,e:"🍜",n:"Ăn tối + thư giãn thực sự",note:"Không làm việc. Ăn chậm. Gia đình. Não cần hard off-mode để recover."},
  {id:"sc16",t:"19:00",d:30,c:"council",col:"#A78BFA",e:"🏛️",n:"Tối — Review với Hội Đồng",note:"Hỏi Buffett hoặc Aristotle phân tích 1 quyết định quan trọng trong ngày."},
  {id:"sc17",t:"19:30",d:30,c:"plan",col:"#E8C547",e:"📋",n:"Plan ngày mai + Journal",note:"3 MITs ngày mai. 3 điều học được hôm nay. 1 điều cần làm khác đi."},
  {id:"sc18",t:"20:00",d:90,c:"rest",col:C.bd,e:"📵",n:"Wind down — không màn hình",note:"Đọc sách giấy hoặc nghe nhạc. Blue light off. Melatonin cần bóng tối."},
  {id:"sc19",t:"21:30",d:0,c:"sleep",col:"#60A5FA",e:"😴",n:"Ngủ — mục tiêu 8 tiếng",note:"Ngủ đủ = học nhanh 2×, quyết định tốt hơn, code ít bug hơn. Không thương lượng."},
];

// ─── SETUP STEPS ─────────────────────────────────────────────────────────────
const SETUP = [
  {id:"s1",ph:1,tc:C.grn,tag:"VPS",time:"5p",title:"Đăng ký VPS Hostinger",why:"Server chạy 24/7 với IP cố định — nền tảng của toàn bộ hệ thống.",fix:"Chọn gói KVM4 trở lên để đủ RAM cho Docker + n8n + Empire.",check:"VPS đang chạy, có thể truy cập Hostinger Web Terminal",items:[{t:"ok",v:"✅ VPS Hostinger đang LIVE — srv1438773.hstgr.cloud"},{t:"ok",v:"Ubuntu 24.04 LTS · 4 CPU · 16GB RAM · 200GB SSD · IP: 76.13.220.238"}]},
  {id:"s2",ph:1,tc:C.grn,tag:"NGINX",time:"5p",title:"Cài Nginx + Node.js trên VPS",why:"Nginx serve static files, Node.js để build React app.",fix:"Dùng Hostinger Web Terminal nếu SSH bị chặn từ mạng nhà.",check:"nginx -t ra 'syntax is ok', node -v ra v20.x.x",items:[{t:"ok",v:"✅ Nginx đã cài và đang chạy"},{t:"ok",v:"✅ Node.js v20 đã cài"},{t:"ok",v:"✅ Firewall: port 22, 80, 443 đã ALLOW"}]},
  {id:"s3",ph:1,tc:C.grn,tag:"DEPLOY",time:"10p",title:"Deploy Empire Mission Control",why:"App React build bằng Vite, Nginx serve tại /var/www/empire.",fix:"Upload file jsx qua GitHub raw URL nếu SCP bị timeout.",check:"Mở http://76.13.220.238 thấy app đang chạy",items:[{t:"ok",v:"✅ App đang LIVE tại http://76.13.220.238"},{t:"ok",v:"✅ Build path: /home/deploy/empire-build/empire"},{t:"ok",v:"✅ Serve path: /var/www/empire"}]},
  {id:"s4",ph:1,tc:C.grn,tag:"OPENROUTER",time:"5p",title:"Lấy OpenRouter API Key",why:"1 key dùng được Claude, GPT, Gemini, Kimi, DeepSeek — tiết kiệm nhất.",fix:"Quên copy key: xóa key cũ → tạo key mới.",check:"Key sk-or-v1-... đã nhập vào app, credit > $0",items:[{t:"ok",v:"✅ OpenRouter account đã tạo và liên kết thẻ"},{t:"do",v:"Nhập key vào: ⚙️ Setup → CẤU HÌNH → 🔀 OpenRouter → API KEY"},{t:"go",v:"openrouter.ai → Keys → Create Key nếu chưa có"}]},
  {id:"s5",ph:2,tc:C.org,tag:"ROUTINE",time:"7p/ngày",title:"Thiết lập Routine Sáng với Council",why:"Consistency hàng ngày quan trọng hơn burst effort.",fix:"Không có cảm hứng: hỏi Council 1 câu đơn giản nhất.",check:"Đã chat với ít nhất 1 agent trong 7 ngày liên tiếp",items:[{t:"do",v:"7h sáng: mở app trên điện thoại"},{t:"do",v:"Hỏi Carnegie hoặc Council 1 câu về kế hoạch ngày hôm nay"},{t:"do",v:"Ghi 1 memory vào tab Memory về insight quan trọng"}]},
  {id:"s6",ph:2,tc:C.org,tag:"READING",time:"30p/ngày",title:"Đọc 3 cuốn sách cốt lõi Q1",why:"Nền tảng tư duy — 3 cuốn này định hình mindset builder suốt 5 năm.",fix:"Không có thời gian: audiobook khi tập thể dục.",check:"Đọc xong cả 3, ghi ít nhất 5 insight vào Memory mỗi cuốn",items:[{t:"do",v:"📖 Cuốn 1: How to Win Friends — Dale Carnegie"},{t:"do",v:"📖 Cuốn 2: Zero to One — Peter Thiel"},{t:"do",v:"📖 Cuốn 3: Principles — Ray Dalio"}]},
  {id:"s7",ph:2,tc:C.org,tag:"MEMORY",time:"Ongoing",title:"Build RAG Memory với 50+ entries",why:"Council càng nhiều context → trả lời càng cá nhân hóa.",fix:"Không biết ghi gì: copy paste đoạn hay từ sách.",check:"Tab Memory có 50+ entries với tags đa dạng",items:[{t:"do",v:"Vào tab 🧠 Memory → thêm insight từ sách đang đọc"},{t:"do",v:"Tags: strategy, mindset, business, personal, finance"},{t:"do",v:"Target: 50 memories cuối Q1, 200 memories cuối Q2"}]},
  {id:"s8",ph:2,tc:C.pur,tag:"GITHUB",time:"Ongoing",title:"Setup GitHub cho update app",why:"Cách duy nhất để update app lên VPS — qua GitHub raw URL.",fix:"File quá lớn: GitHub hỗ trợ file đến 100MB.",check:"Repo App.jsx public, có thể curl raw URL về VPS thành công",items:[{t:"ok",v:"✅ Repo github.com/kane2411vn/App.jsx đã tạo"},{t:"do",v:"Mỗi khi nhận file mới từ Claude → upload lên repo"},{t:"cmd",v:"curl -o /home/deploy/empire-build/empire/src/App.jsx RAW_URL"},{t:"cmd",v:"cd /home/deploy/empire-build/empire && npm run build && cp -r dist/* /var/www/empire/ && systemctl reload nginx"}]},
  {id:"s9",ph:3,tc:C.pur,tag:"TELEGRAM",time:"Q2",title:"Tích hợp Telegram Bot (Daily Briefing)",why:"Nhận tóm tắt tự động 7h sáng từ Council.",fix:"Dùng n8n (đã có trên VPS) để làm automation.",check:"Bot gửi briefing lúc 7h sáng mỗi ngày tự động",items:[{t:"do",v:"Tạo Telegram bot qua @BotFather → lấy token"},{t:"do",v:"n8n: tạo workflow Schedule → HTTP Request → Telegram"}]},
  {id:"s10",ph:3,tc:C.pur,tag:"N8N",time:"Q2",title:"Build RAG Pipeline với n8n",why:"Tự động index tài liệu, web pages, PDF vào Memory.",fix:"n8n đã cài sẵn trên VPS.",check:"Workflow chạy tự động index 50+ tài liệu",items:[{t:"do",v:"n8n: workflow đọc Google Drive folder → chunk text → lưu Memory"},{t:"do",v:"Schedule: mỗi ngày check tài liệu mới → auto-index"}]},
  {id:"s11",ph:3,tc:C.blu,tag:"DOMAIN",time:"Q2",title:"Cài Domain + HTTPS",why:"URL đẹp hơn IP, bắt buộc cho production.",fix:"Dùng Cloudflare DNS miễn phí.",check:"https://yourdomain.com hoạt động với SSL",items:[{t:"do",v:"Mua domain .com hoặc .vn"},{t:"cmd",v:"certbot --nginx -d yourdomain.com"}]},
  {id:"s12",ph:4,tc:C.grn,tag:"FREELANCE",time:"Q3",title:"Freelance AI Setup Project đầu tiên",why:"Từ hobby → income.",fix:"Bắt đầu miễn phí cho người quen để có case study.",check:"Ít nhất 1 client đang dùng Council",items:[{t:"do",v:"Viết case study về setup Council"},{t:"do",v:"Định giá: $300-500 setup + $50-100/tháng maintain"}]},
  {id:"s13",ph:4,tc:C.gold,tag:"REVIEW",time:"Q4",title:"Review Năm 1 — Điều chỉnh Roadmap",why:"Data beats assumptions.",fix:"Không đạt target: quan trọng là hiểu WHY.",check:"Đã review tất cả 4 quý, roadmap 2027 đã cập nhật",items:[{t:"do",v:"Review từng quý, đánh dấu achieved/missed"},{t:"do",v:"Celebrate progress — dù nhỏ."}]},
];

// ─── 5-YEAR ROADMAP ──────────────────────────────────────────────────────────
const YEARS = [
  {y:1,period:"2026",theme:"Người Xây Móng",col:C.blu,icon:"🔧",identity:"Junior AI Builder",mantra:"Mỗi ngày một brick. Consistency beats talent.",pct:30,income:"$0 → $500/tháng",metric:"51 agents · 500 queries/ngày",status:"🟡 Đang xây — BẠN ĐANG Ở ĐÂY",feasibility:85,feasNote:"Cao — công nghệ đã sẵn, roadmap rõ, chỉ cần consistency.",owns:["51 agents hoạt động với prompt đầy đủ","Council Mode: hỏi 1 → 4-8 agents trả lời song song","RAG với 100+ tài liệu được index","Daily briefing tự động 7h sáng qua Telegram bot","Chat UI mobile-friendly chạy ổn định","Chi phí vận hành < $30/tháng"],skills:["TypeScript","Cloudflare Workers","Prompt Engineering","RAG Pipeline","API Design"],quarters:[{q:"Q1",t:"Foundation",items:["Đọc 3 cuốn cốt lõi","Deploy Empire Council production","Hoàn thành Setup 13 bước","Thiết lập routine sáng"]},{q:"Q2",t:"Kỹ Năng Kỹ Thuật",items:["Master TypeScript, async/await, REST API","Build RAG pipeline với 50+ tài liệu","Integrate Telegram bot","Biết đọc và debug AI API responses"]},{q:"Q3",t:"Hệ Thống Cá Nhân",items:["PKM kết nối với Council","Tiếng Anh: nghe hiểu 80% podcast business","Tiếng Trung: HSK2","Bắt đầu monetize: 1-2 freelance AI setup"]},{q:"Q4",t:"Portfolio Đầu Tiên",items:["1 case study thực tế","Viết 10 bài về AI builder journey","Network với 10-20 người","Review năm: điều chỉnh roadmap"]}]},
  {y:2,period:"2027",theme:"Người Bán Trí Tuệ",col:C.grn,icon:"⚡",identity:"AI Systems Consultant",mantra:"Bán giải pháp, không bán thời gian.",pct:55,income:"$0 → $5,000/tháng",metric:"5-10 paying clients · white-label ready",status:"🟢 Consulting Mode",feasibility:72,feasNote:"Khá cao — nếu Năm 1 build xong. Risk: tìm clients thật trả tiền.",owns:["White-label: deploy Council cho client","Multi-user architecture","Workflow engine: sequences tự động","MCP Server: gọi Council từ Claude Code","Analytics dashboard","Template library cho các ngành"],skills:["SaaS Architecture","Multi-tenant","Sales System","Technical Writing","Team Lead"],quarters:[{q:"Q1",t:"Clients Đầu Tiên",items:["Setup Council cho 3 khách hàng — miễn phí","Document mọi setup step","Học: multi-tenant architecture","Build case study với số liệu"]},{q:"Q2",t:"Monetize Đầu Tiên",items:["$300-500/setup + $50-100/tháng","5 paying clients → $250-500 MRR","Tự động hóa onboarding","Referral hệ thống"]},{q:"Q3",t:"Scale Operations",items:["Revenue $2,000-3,000/tháng","Thuê 1 junior dev part-time","Tiếng Anh: confident business calls","Tiếng Trung: HSK3"]},{q:"Q4",t:"Product Thinking",items:["Productized service với fixed pricing","Landing page + checkout tự động","Revenue $4,000-5,000/tháng","Quyết định: lifestyle vs SaaS?"]}]},
  {y:3,period:"2028",theme:"Người Xây Sản Phẩm",col:C.pur,icon:"🚀",identity:"AI Product Builder",mantra:"Sản phẩm tốt là nhân viên không bao giờ nghỉ.",pct:75,income:"$20,000–30,000 MRR",metric:"500+ active users · $20K MRR",status:"🚀 SaaS Product",feasibility:55,feasNote:"Trung bình — cần product-market fit thực sự.",owns:["SaaS platform: self-service signup, billing","Custom knowledge base","Public API","Mobile app React Native","Voice interface","Autonomous Council"],skills:["Product Management","Growth Hacking","Community Building","Fundraising Basics","Team Management"],quarters:[{q:"Q1",t:"Launch SaaS v1",items:["$49/tháng Basic · $149/tháng Pro","100 beta users, churn < 15%","SEO + content: 10 bài/tháng"]},{q:"Q2",t:"Growth Engine",items:["Product Hunt launch","Integration: Notion, Google Workspace","Affiliate 20% recurring","MRR $10,000"]},{q:"Q3",t:"Niche Domination",items:["Focus 1 niche: Vietnam SME","Discord community: 1,000 members","Workshop/course $200-500/người"]},{q:"Q4",t:"Team & Delegation",items:["Team 3-5 người","MRR $20,000-30,000","Quyết định: raise seed hay bootstrapped?"]}]},
  {y:4,period:"2029",theme:"Người Có Tầm Ảnh Hưởng",col:C.gold,icon:"👑",identity:"AI Thought Leader",mantra:"Influence nhân rộng impact.",pct:88,income:"$50,000–70,000 MRR + investments",metric:"2,000+ users · 3 countries",status:"🌐 Platform Scale",feasibility:40,feasNote:"Khó — phụ thuộc nhiều vào execution Năm 3.",owns:["Enterprise tier","Multi-language: Vietnamese, English, Thai","Agent Marketplace","Council OS framework","Real-time collaboration","Predictive Council"],skills:["Public Speaking","Angel Investing","Executive Leadership","Global Expansion","Brand Authority"],quarters:[{q:"Q1",t:"Authority Building",items:["Book: 'Hội Đồng AI — 51 Cố Vấn Thiên Tài'","Podcast/YouTube: 50+ episodes","Speaking tại Techfest Vietnam"]},{q:"Q2",t:"Ecosystem Builder",items:["Open-source core engine","Partner với universities","Council Certification Program"]},{q:"Q3",t:"Đầu Tư & Scale",items:["Angel invest 3-5 AI startups","MRR $50,000-70,000","Expand sang Singapore, Thailand"]},{q:"Q4",t:"Legacy Foundation",items:["Empire Council Foundation","Team 15-20 người","Bạn là chairman"]}]},
  {y:5,period:"2030",theme:"Người Vận Hành Đế Chế",col:C.org,icon:"🏛️",identity:"Empire Architect",mantra:"Đế chế thật sự là khi nó chạy mà không cần bạn.",pct:97,income:"$100,000+/tháng · Time Freedom",metric:"1M+ users · industry standard",status:"🏛️ Autonomous",feasibility:30,feasNote:"Tham vọng nhưng không impossible.",owns:["Fully autonomous operations","AGI-ready architecture","1M+ queries/ngày","Council Network: 100+ communities","Physical presence: AI advisory pods","Open Protocol: industry standard"],skills:["Vision Setting","Capital Allocation","Legacy Design","Systems Thinking","Philosophy"],quarters:[{q:"Q1–Q2",t:"Full Autonomy",items:["Company vận hành không cần daily tasks","Revenue $100,000+/tháng","Test: biến mất 2 tháng, business vẫn grow"]},{q:"Q3–Q4",t:"Đế Chế Tiếp Theo",items:["Venture fund Empire AI Capital","Council 2.0: physical + digital centers","Câu hỏi: 'Tôi muốn xây gì tiếp theo?'"]}]},
];

// ─── PROVIDERS ────────────────────────────────────────────────────────────────
const PROVIDERS = {
  claude: {id:"claude",name:"Anthropic Claude",icon:"🟣",color:"#A78BFA",apiType:"anthropic",baseUrl:"anthropic",keyPlaceholder:"sk-ant-... (tuỳ chọn, để trống dùng built-in)",keyHint:"console.anthropic.com → API Keys",models:[{id:"claude-sonnet-4-20250514",label:"Claude Sonnet 4",note:"Khuyên dùng ✓"},{id:"claude-opus-4-5",label:"Claude Opus 4.5",note:"Mạnh nhất"}],defaultModel:"claude-sonnet-4-20250514"},
  openai: {id:"openai",name:"OpenAI GPT",icon:"⚫",color:"#10A37F",apiType:"openai",baseUrl:"https://api.openai.com/v1/chat/completions",keyPlaceholder:"sk-... (OpenAI API Key)",keyHint:"platform.openai.com → API Keys",models:[{id:"gpt-4.5-preview",label:"GPT-4.5 Preview",note:"Mới nhất"},{id:"gpt-4o",label:"GPT-4o",note:"Nhanh, multimodal"},{id:"o3",label:"o3",note:"Reasoning mạnh"},{id:"o4-mini",label:"o4-mini",note:"Tiết kiệm"}],defaultModel:"gpt-4.5-preview"},
  gemini: {id:"gemini",name:"Google Gemini",icon:"🔵",color:"#4285F4",apiType:"openai",baseUrl:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",keyPlaceholder:"AIza... (Google AI Studio API Key)",keyHint:"aistudio.google.com → Get API Key (miễn phí)",models:[{id:"gemini-2.5-pro",label:"Gemini 2.5 Pro",note:"Mạnh nhất"},{id:"gemini-2.5-flash",label:"Gemini 2.5 Flash",note:"Nhanh, tiết kiệm"}],defaultModel:"gemini-2.5-pro"},
  kimi: {id:"kimi",name:"Moonshot Kimi",icon:"🌙",color:"#6366F1",apiType:"openai",baseUrl:"https://api.moonshot.cn/v1/chat/completions",keyPlaceholder:"sk-... (Moonshot Platform Key)",keyHint:"platform.moonshot.cn → API Keys",models:[{id:"kimi-k2-0711-preview",label:"Kimi K2",note:"Agent & coding ✓"},{id:"moonshot-v1-128k",label:"Moonshot 128K",note:"Context cực dài"}],defaultModel:"kimi-k2-0711-preview"},
  qwen: {id:"qwen",name:"Alibaba Qwen",icon:"🟠",color:"#FB923C",apiType:"openai",baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",keyPlaceholder:"sk-... (DashScope API Key)",keyHint:"console.aliyun.com → Model Studio → API Key",models:[{id:"qwen-turbo",label:"Qwen Turbo",note:"Nhanh nhất, rẻ nhất"},{id:"qwen-plus",label:"Qwen Plus",note:"Cân bằng"},{id:"qwen-max",label:"Qwen Max",note:"Mạnh nhất"}],defaultModel:"qwen-plus"},
  openrouter: {id:"openrouter",name:"OpenRouter",icon:"🔀",color:"#6EE7B7",apiType:"openai",baseUrl:"https://openrouter.ai/api/v1/chat/completions",keyPlaceholder:"sk-or-v1-... (OpenRouter API Key)",keyHint:"openrouter.ai → Keys — 1 key dùng được 200+ models",models:[{id:"anthropic/claude-sonnet-4-5",label:"Claude Sonnet 4.5",note:"🟣 Anthropic"},{id:"anthropic/claude-opus-4-5",label:"Claude Opus 4.5",note:"🟣 Mạnh nhất"},{id:"openai/gpt-4.5-preview",label:"GPT-4.5 Preview",note:"⚫ OpenAI"},{id:"openai/gpt-4o",label:"GPT-4o",note:"⚫ Nhanh"},{id:"openai/o3",label:"o3",note:"⚫ Reasoning"},{id:"google/gemini-2.5-pro-preview",label:"Gemini 2.5 Pro",note:"🔵 Top"},{id:"google/gemini-2.5-flash-preview",label:"Gemini 2.5 Flash",note:"🔵 Nhanh"},{id:"moonshotai/kimi-k2",label:"Kimi K2",note:"🌙 Agent"},{id:"qwen/qwen-max",label:"Qwen Max",note:"🟠 Alibaba"},{id:"deepseek/deepseek-r1",label:"DeepSeek R1",note:"🧠 Reasoning OSS"},{id:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick",note:"🦙 Meta"}],defaultModel:"anthropic/claude-sonnet-4-5"},
};
const PROVIDER_LIST = Object.values(PROVIDERS);
const DEFAULT_PROVIDER = "openrouter";
const CFG_KEY = "empire_v2_config";
const loadCfg = async () => { try { const r=await window.storage.get(CFG_KEY); return r?JSON.parse(r.value):{};} catch { return {}; } };
const saveCfg = async (cfg) => { try { await window.storage.set(CFG_KEY,JSON.stringify(cfg)); } catch {} };

// ─── SHARED UI: STAR RATING ───────────────────────────────────────────────────
function StarRating({ msgId, agentId, ratings, onRate, accent }) {
  const [hov, setHov] = useState(0);
  const cur = ratings[agentId]?.lastRated?.[msgId] || 0;
  const col = accent || C.gold;
  return (
    <div style={{display:"flex",gap:1,alignItems:"center"}}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onMouseEnter={()=>setHov(s)} onMouseLeave={()=>setHov(0)}
          onClick={()=>onRate(msgId, agentId, s)}
          style={{fontSize:11,cursor:"pointer",color:(hov||cur)>=s?col:"rgba(255,255,255,0.15)",transition:"color .1s",lineHeight:1}}>
          ★
        </span>
      ))}
      {cur>0 && <span style={{fontFamily:FM,fontSize:"8px",color:col,marginLeft:3}}>{cur}</span>}
    </div>
  );
}

// ─── SHARED UI: BUBBLES ───────────────────────────────────────────────────────
function Bubbles({ msgs, busy, botRef, acol, onStar, starredIds, onRate, ratings }) {
  const [hovIdx, setHovIdx] = useState(null);
  return (
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:8}}>
      {msgs.map((m,i) => {
        const isU = m.role==="user";
        const mc  = AGENTS.find(a=>a.id===m.aid)?.col || C.gold;
        const isStarred = starredIds && starredIds.has(m.id||`msg_${i}`);
        return (
          <div key={i} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(null)}
            style={{display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start",gap:3,position:"relative"}}>
            {!isU && m.label && (
              <div style={{display:"flex",alignItems:"center",gap:6,margin:"0 0 3px 4px",flexWrap:"wrap"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:mc,margin:0}}>{m.label}</p>
                {m.modelLabel && (
                  <span style={{display:"inline-flex",alignItems:"center",gap:3,fontFamily:FM,fontSize:"8px",color:m.providerColor||mc,background:`${m.providerColor||mc}12`,border:`1px solid ${m.providerColor||mc}28`,padding:"1px 7px",borderRadius:10,lineHeight:1.6}}>
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
              {/* Action buttons on hover */}
              {hovIdx===i && (
                <div style={{position:"absolute",top:6,right:isU?"auto":-68,left:isU?-68:"auto",display:"flex",flexDirection:"column",gap:3}}>
                  {!isU && onStar && (
                    <button onClick={()=>onStar(m,i)} title={isStarred?"Đã lưu":"Lưu vào Memory"}
                      style={{width:26,height:26,borderRadius:5,background:isStarred?`${mc}22`:"rgba(0,0,0,0.55)",border:`1px solid ${isStarred?mc+"55":C.bd}`,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {isStarred?"⭐":"☆"}
                    </button>
                  )}
                  {!isU && onRate && m.aid && m.aid!=="council" && m.aid!=="" && (
                    <div style={{background:"rgba(0,0,0,0.75)",border:`1px solid ${C.bd}`,borderRadius:5,padding:"4px 7px"}}>
                      <StarRating msgId={m.id||`msg_${i}`} agentId={m.aid} ratings={ratings||{}} onRate={onRate} accent={mc}/>
                    </div>
                  )}
                </div>
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
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.txt,fontFamily:F,fontSize:13,resize:"none",lineHeight:1.65,minHeight:40}}/>
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

// ─── SMART NOTIFICATIONS PANEL ────────────────────────────────────────────────
function NotifPanel({ notifications, onRead, onClear, onClose }) {
  const typeIcon = {briefing:"🌅",memory_tip:"🧠",insight:"💡",agent_suggestion:"🤖",session_intel:"⚡",rating_milestone:"🏆",default:"🔔"};
  return (
    <div style={{position:"fixed",top:60,right:16,width:320,maxHeight:480,zIndex:300,background:"#0D0F14",border:`1px solid ${C.bd}`,borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.7)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
        <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"2px",margin:0}}>🔔 SMART NOTIFICATIONS</p>
        <div style={{display:"flex",gap:6}}>
          {notifications.some(n=>!n.read)&&<button onClick={onRead} style={{fontFamily:FM,fontSize:"8px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"2px 8px",borderRadius:3,cursor:"pointer"}}>ĐỌC HẾT</button>}
          {notifications.length>0&&<button onClick={onClear} style={{fontFamily:FM,fontSize:"8px",color:C.red,background:"transparent",border:`1px solid ${C.red}22`,padding:"2px 8px",borderRadius:3,cursor:"pointer"}}>XÓA HẾT</button>}
          <button onClick={onClose} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:16,padding:0}}>×</button>
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {notifications.length===0&&(
          <div style={{textAlign:"center",padding:"30px 16px"}}>
            <p style={{fontSize:22,margin:"0 0 8px"}}>🔔</p>
            <p style={{fontSize:12,color:C.mu,margin:0}}>Chưa có thông báo nào.</p>
          </div>
        )}
        {notifications.map(n=>{
          const ic = typeIcon[n.type]||typeIcon.default;
          return(
            <div key={n.id} style={{padding:"10px 16px",borderBottom:`1px solid ${C.bd}`,background:n.read?"transparent":C.s1,opacity:n.read?0.65:1}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{ic}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:n.read?400:600,color:n.read?C.mu:"#fff",margin:"0 0 2px",lineHeight:1.4}}>{n.title}</p>
                  <p style={{fontSize:11,color:C.fa,margin:"0 0 4px",lineHeight:1.55}}>{n.msg}</p>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.fa,margin:0}}>{new Date(n.ts).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})} · {new Date(n.ts).toLocaleDateString("vi-VN")}</p>
                </div>
                {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:C.gold,flexShrink:0,marginTop:4}}/>}
              </div>
            </div>
          );
        })}
      {/* ── Floating Pomodoro Widget ─────────────────────────────── */}
      {tab!=="pomodoro"&&(
        <div onClick={()=>setTab("pomodoro")}
          style={{position:"fixed",bottom:isMobile?80:24,right:16,zIndex:500,cursor:"pointer",
            background:pom.running?"#f9731620":C.s1,border:`1px solid ${pom.running?"#f97316":C.bd}`,
            borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,
            boxShadow:pom.running?"0 0 20px #f9731640":"none",transition:"all .3s",animation:pom.running?"none":"none"}}>
          {(()=>{
            const limit=(pom.mode==="work"?pom.work:pom.brk)*60;
            const remaining=limit-pom.elapsed;
            const mm=String(Math.floor(remaining/60)).padStart(2,"0");
            const ss=String(remaining%60).padStart(2,"0");
            return(
              <>
                <span style={{fontSize:16}}>{pom.running?"🔥":"⏱️"}</span>
                <span style={{fontFamily:FM,fontSize:12,fontWeight:700,color:pom.running?"#f97316":"#fff"}}>{mm}:{ss}</span>
                <button onClick={e=>{e.stopPropagation();setPom(p=>({...p,running:!p.running}));}}
                  style={{width:22,height:22,borderRadius:5,background:pom.running?"#F8717120":"#f9731618",
                    border:`1px solid ${pom.running?"#F87171":"#f97316"}`,color:pom.running?"#F87171":"#f97316",
                    fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {pom.running?"⏸":"▶"}
                </button>
              </>
            );
          })()}
        </div>
      )}

      </div>
    </div>
  );
}

// ─── SESSION INTELLIGENCE BADGE ───────────────────────────────────────────────
function SessionIntelBadge({ intel, col }) {
  const [open, setOpen] = useState(false);
  if (!intel) return null;
  return (
    <div style={{marginTop:4}}>
      <button onClick={()=>setOpen(p=>!p)}
        style={{display:"flex",alignItems:"center",gap:4,background:`${col}10`,border:`1px solid ${col}25`,borderRadius:4,padding:"2px 8px",cursor:"pointer",width:"100%",justifyContent:"flex-start"}}>
        <span style={{fontSize:9}}>⚡</span>
        <span style={{fontFamily:FM,fontSize:"8px",color:col,letterSpacing:"0.5px"}}>SESSION INTEL</span>
        <span style={{fontFamily:FM,fontSize:"8px",color:C.fa,marginLeft:"auto"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${col}20`,borderRadius:5,padding:"8px 10px",marginTop:3}}>
          {intel.topic&&<p style={{fontSize:10,color:col,margin:"0 0 4px",fontFamily:FM}}>📌 {intel.topic}</p>}
          {intel.insights?.length>0&&(
            <div style={{marginBottom:4}}>
              {intel.insights.map((ins,i)=><p key={i} style={{fontSize:10,color:C.fa,margin:"0 0 2px",lineHeight:1.55}}>• {ins}</p>)}
            </div>
          )}
          {intel.actions?.length>0&&(
            <div>
              <p style={{fontFamily:FM,fontSize:"8px",color:"#34D399",margin:"4px 0 2px"}}>ACTION ITEMS</p>
              {intel.actions.map((a,i)=><p key={i} style={{fontSize:10,color:"#34D399",margin:"0 0 2px",lineHeight:1.55}}>→ {a}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function ChatTab({ sessions, activeSessId, sessMessages, sessReady, sidebarOpen,
  setSidebarOpen, searchQ, setSearchQ, pickAgent, setPickAgent,
  editSessId, setEditSessId, editTitle, setEditTitle, hoverSessId, setHoverSessId,
  activeSess, activeMsgs, activeAg, newSession, switchSession, deleteSession,
  renameSession, sessUpdateCache, sessUpdateIndex, aBusy, aRef,
  aIn, setAIn, sendAgent, useRAG, mems, onStar, starredIds,
  onRate, ratings, sessIntel }) {

  const now = Date.now(), DAY = 86400000;
  const groupLabel = (ts) => {
    const diff = now-ts;
    if(diff<DAY) return "Hôm nay";
    if(diff<2*DAY) return "Hôm qua";
    if(diff<7*DAY) return "7 ngày trước";
    if(diff<30*DAY) return "Tháng này";
    return new Date(ts).toLocaleDateString("vi-VN",{month:"long",year:"numeric"});
  };
  const filtered = sessions.filter(s=>!searchQ.trim()||s.title.toLowerCase().includes(searchQ.toLowerCase())||(AGENTS.find(a=>a.id===s.agId)?.n||"").toLowerCase().includes(searchQ.toLowerCase()));
  const groups = [];
  filtered.forEach(s=>{const lbl=groupLabel(s.updatedAt);const g=groups.find(g=>g.label===lbl);if(g)g.items.push(s);else groups.push({label:lbl,items:[s]});});

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden",width:"100%",boxSizing:"border-box"}}>
      {/* SIDEBAR */}
      <div style={{width:isMobile?(sidebarOpen?"100vw":0):(sidebarOpen?252:0),flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden",position:isMobile&&sidebarOpen?"fixed":"relative",top:isMobile&&sidebarOpen?0:"auto",left:0,height:isMobile&&sidebarOpen?"100vh":"auto",zIndex:isMobile&&sidebarOpen?200:1,borderRight:`1px solid ${C.bd}`,background:isMobile&&sidebarOpen?"rgba(13,15,20,0.97)":"rgba(0,0,0,0.22)",transition:"width .22s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{padding:"14px 12px 10px",flexShrink:0,minWidth:252}}>
          <button onClick={()=>setPickAgent(true)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",marginBottom:10,borderRadius:8,background:`linear-gradient(135deg,${C.gold}1A,${C.pur}12)`,border:`1px solid ${C.gold}38`,cursor:"pointer"}}>
            <span style={{fontSize:15}}>✏️</span>
            <span style={{fontFamily:FM,fontSize:"11px",color:C.gold,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Chat Mới</span>
          </button>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:C.mu,pointerEvents:"none"}}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Tìm kiếm hội thoại…"
              style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:7,padding:"8px 28px 8px 30px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
            {searchQ&&<button onClick={()=>setSearchQ("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:14,padding:0}}>×</button>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 8px 16px",minWidth:252}}>
          {!sessReady&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{display:"flex",gap:4,justifyContent:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.gold,animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div></div>}
          {sessReady&&filtered.length===0&&<div style={{textAlign:"center",padding:"24px 12px"}}><p style={{fontSize:24,margin:"0 0 8px"}}>{searchQ?"🔍":"💬"}</p><p style={{fontSize:12,color:C.mu,margin:0,lineHeight:1.65}}>{searchQ?`Không tìm thấy "${searchQ}"`:"Chưa có hội thoại nào.\nBấm Chat Mới để bắt đầu."}</p></div>}
          {groups.map(({label,items})=>(
            <div key={label}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.fa,margin:"12px 4px 5px",letterSpacing:"1.5px",textTransform:"uppercase"}}>{label}</p>
              {items.map(s=>{
                const a=AGENTS.find(x=>x.id===s.agId)||AGENTS[0];
                const isActive=s.id===activeSessId,isHover=s.id===hoverSessId,isEdit=s.id===editSessId;
                const intel=sessIntel?.[s.id];
                return(
                  <div key={s.id} onClick={()=>!isEdit&&switchSession(s.id)}
                    onMouseEnter={()=>setHoverSessId(s.id)} onMouseLeave={()=>setHoverSessId(null)}
                    style={{padding:"8px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,background:isActive?`${a.col}14`:isHover?"rgba(255,255,255,0.04)":"transparent",border:`1px solid ${isActive?a.col+"38":"transparent"}`,transition:"all .1s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:28,height:28,borderRadius:6,background:`${a.col}18`,border:`1px solid ${a.col}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>{a.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        {isEdit?(
                          <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                            onBlur={()=>{renameSession(editSessId,editTitle||"Hội thoại");setEditSessId(null);}}
                            onKeyDown={e=>{if(e.key==="Enter"){renameSession(editSessId,editTitle||"Hội thoại");setEditSessId(null);}if(e.key==="Escape")setEditSessId(null);}}
                            onClick={e=>e.stopPropagation()}
                            style={{width:"100%",background:"rgba(0,0,0,0.4)",border:`1px solid ${a.col}60`,borderRadius:4,padding:"2px 6px",color:"#fff",fontFamily:F,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                        ):(
                          <p style={{fontSize:12,color:isActive?"#fff":C.txt,margin:"0 0 1px",fontWeight:isActive?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.35}}>{s.title}</p>
                        )}
                        <p style={{fontFamily:FM,fontSize:"8px",color:isActive?`${a.col}CC`:C.fa,margin:0}}>{a.n} · {s.msgCount>0?`${Math.floor(s.msgCount/2)} tin`:"trống"}</p>
                        {intel&&<SessionIntelBadge intel={intel} col={a.col}/>}
                      </div>
                      {(isHover||isActive)&&!isEdit&&(
                        <div style={{display:"flex",gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <button title="Đổi tên" onClick={()=>{setEditSessId(s.id);setEditTitle(s.title);}} style={{width:22,height:22,borderRadius:4,background:"rgba(255,255,255,0.06)",border:`1px solid ${C.bd}`,color:C.mu,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✏</button>
                          <button title="Xóa" onClick={()=>deleteSession(s.id)} style={{width:22,height:22,borderRadius:4,background:C.redD,border:`1px solid ${C.red}20`,color:C.red,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
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

      {/* AGENT PICKER MODAL */}
      {pickAgent&&(
        <div onClick={()=>setPickAgent(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#0D0F14",border:`1px solid ${C.bd}`,borderRadius:14,padding:"22px 24px",width:540,maxWidth:"92vw",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><p style={{fontFamily:FM,fontSize:"9px",color:C.gold,margin:"0 0 3px",letterSpacing:"2px",textTransform:"uppercase"}}>Chọn cố vấn</p><p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Bắt đầu cuộc hội thoại mới</p></div>
              <button onClick={()=>setPickAgent(false)} style={{width:30,height:30,borderRadius:6,background:C.s1,border:`1px solid ${C.bd}`,color:C.mu,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {["S","A","B","C"].map(tier=>(
                <div key={tier} style={{marginBottom:16}}>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 8px",letterSpacing:"2px",textTransform:"uppercase"}}>{tier==="S"?"⭐ S-Tier — Core":tier==="A"?"🔹 A-Tier":tier==="B"?"🔸 B-Tier":"⬡ C-Tier"}</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:6}}>
                    {AGENTS.filter(a=>a.tier===tier).map(a=>(
                      <button key={a.id} onClick={()=>{newSession(a.id);setPickAgent(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:C.s1,border:`1px solid ${a.col}28`,borderRadius:8,cursor:"pointer",textAlign:"left",transition:"all .12s"}}>
                        <span style={{fontSize:18,flexShrink:0}}>{a.icon}</span>
                        <div style={{minWidth:0}}><p style={{fontSize:12,fontWeight:600,color:"#fff",margin:"0 0 1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.n}</p><p style={{fontFamily:FM,fontSize:"8px",color:a.col,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.role}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:`1px solid ${C.bd}`}}>
          {isMobile&&sidebarOpen&&(
            <button onClick={()=>setSidebarOpen(false)}
              style={{position:"absolute",top:8,right:8,width:32,height:32,borderRadius:6,background:"rgba(255,0,0,0.15)",border:"1px solid rgba(255,0,0,0.3)",color:"#F87171",fontSize:16,cursor:"pointer",zIndex:201,display:"flex",alignItems:"center",justifyContent:"center"}}>
              ✕
            </button>
          )}
          <button onClick={()=>setSidebarOpen(p=>!p)} style={{width:32,height:32,borderRadius:6,background:C.s1,border:`1px solid ${C.bd}`,color:C.mu,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {sidebarOpen?"◀":"▶"}
          </button>
          {activeSess?(
            <>
              <div style={{width:30,height:30,borderRadius:7,background:`${activeAg.col}18`,border:`1px solid ${activeAg.col}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{activeAg.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeSess.title}</p>
                <p style={{fontFamily:FM,fontSize:"8px",color:activeAg.col,margin:0}}>
                  {activeAg.role}
                  {activeSess.provider&&PROVIDERS[activeSess.provider]&&(()=>{const sp=PROVIDERS[activeSess.provider];const sm=activeSess.model||sp.defaultModel;const ml=sp.models.find(m=>m.id===sm)?.label||sm;return<span style={{color:sp.color}}> · {sp.icon} {ml}</span>;})()}
                </p>
              </div>
              <button onClick={()=>setPickAgent(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:`${C.gold}12`,border:`1px solid ${C.gold}35`,borderRadius:6,cursor:"pointer",flexShrink:0}}>
                <span style={{fontSize:13}}>✏️</span>
                <span style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"1px",textTransform:"uppercase"}}>Chat Mới</span>
              </button>
            </>
          ):(
            <p style={{fontSize:13,color:C.mu,margin:0}}>Chọn hoặc tạo cuộc hội thoại</p>
          )}
        </div>

        {!activeSess&&(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:"0 20px"}}>
            <p style={{fontSize:36,margin:0}}>💬</p>
            <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Bắt đầu cuộc hội thoại</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:520}}>
              {AGENTS.filter(a=>a.tier==="S").map(a=>(
                <button key={a.id} onClick={()=>newSession(a.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:`${a.col}0E`,border:`1px solid ${a.col}30`,borderRadius:9,cursor:"pointer"}}>
                  <span style={{fontSize:20}}>{a.icon}</span>
                  <div style={{textAlign:"left"}}><p style={{fontSize:12,fontWeight:600,color:"#fff",margin:"0 0 1px"}}>{a.n}</p><p style={{fontFamily:FM,fontSize:"8px",color:a.col,margin:0}}>{a.role}</p></div>
                </button>
              ))}
            </div>
            <button onClick={()=>setPickAgent(true)} style={{fontFamily:FM,fontSize:"10px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"7px 20px",borderRadius:6,cursor:"pointer",letterSpacing:"1px"}}>XEM TẤT CẢ 51 AGENTS →</button>
          </div>
        )}

        {activeSess&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"0 16px"}}>
            <Bubbles msgs={activeMsgs} busy={aBusy} botRef={aRef} acol={activeAg.col} onStar={onStar} starredIds={starredIds} onRate={onRate} ratings={ratings}/>
            {activeMsgs.length===0&&!aBusy&&(
              <div style={{flexShrink:0,padding:"10px 0 6px",textAlign:"center"}}>
                <p style={{fontSize:12,color:C.mu,margin:"0 0 10px"}}>{activeAg.icon} Hội thoại với <strong style={{color:activeAg.col}}>{activeAg.n}</strong></p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {["Lời khuyên cho tôi hôm nay","Review kế hoạch của tôi","Tư vấn tài chính","Điểm mù lớn nhất của tôi?"].map(q=>(
                    <button key={q} onClick={()=>setAIn(q)} style={{fontFamily:FM,fontSize:"10px",color:activeAg.col,background:`${activeAg.col}0E`,border:`1px solid ${activeAg.col}22`,padding:"6px 13px",borderRadius:5,cursor:"pointer"}}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            <InputBar val={aIn} set={setAIn} onSend={sendAgent} busy={aBusy} ph={`Nhắn ${activeAg.n}…`} col={activeAg.col}/>
          </div>
        )}
      {/* ── Floating Pomodoro Widget ─────────────────────────────── */}
      {tab!=="pomodoro"&&(
        <div onClick={()=>setTab("pomodoro")}
          style={{position:"fixed",bottom:isMobile?80:24,right:16,zIndex:500,cursor:"pointer",
            background:pom.running?"#f9731620":C.s1,border:`1px solid ${pom.running?"#f97316":C.bd}`,
            borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,
            boxShadow:pom.running?"0 0 20px #f9731640":"none",transition:"all .3s",animation:pom.running?"none":"none"}}>
          {(()=>{
            const limit=(pom.mode==="work"?pom.work:pom.brk)*60;
            const remaining=limit-pom.elapsed;
            const mm=String(Math.floor(remaining/60)).padStart(2,"0");
            const ss=String(remaining%60).padStart(2,"0");
            return(
              <>
                <span style={{fontSize:16}}>{pom.running?"🔥":"⏱️"}</span>
                <span style={{fontFamily:FM,fontSize:12,fontWeight:700,color:pom.running?"#f97316":"#fff"}}>{mm}:{ss}</span>
                <button onClick={e=>{e.stopPropagation();setPom(p=>({...p,running:!p.running}));}}
                  style={{width:22,height:22,borderRadius:5,background:pom.running?"#F8717120":"#f9731618",
                    border:`1px solid ${pom.running?"#F87171":"#f97316"}`,color:pom.running?"#F87171":"#f97316",
                    fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {pom.running?"⏸":"▶"}
                </button>
              </>
            );
          })()}
        </div>
      )}

      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPA_URL = "https://tctdtriwrheezkathuju.supabase.co";
const SUPA_KEY = "sb_publishable_FPdg9G4kuVt6439_RJ7ZRA_2ucSc6gM";

const supa = {
  url: SUPA_URL,
  headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },

  async signUp(email, password, name, inviteCode) {
    // Check invite code first
    const ir = await fetch(`${SUPA_URL}/rest/v1/invites?code=eq.${encodeURIComponent(inviteCode)}&used_by=is.null`, { headers: this.headers });
    const invites = await ir.json();
    if (!invites?.length) throw new Error("Mã mời không hợp lệ hoặc đã được dùng.");

    // Sign up
    const r = await fetch(`${SUPA_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || d.msg || "Đăng ký thất bại");
    const uid = d.user?.id;
    const token = d.access_token;
    if (!uid) throw new Error("Không lấy được user ID");

    // Create profile
    const authHeaders = { ...this.headers, "Authorization": `Bearer ${token}` };
    await fetch(`${SUPA_URL}/rest/v1/profiles`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ id: uid, name, telegram_chat_id: "", timezone: "Asia/Ho_Chi_Minh" })
    });

    // Init user_data
    await fetch(`${SUPA_URL}/rest/v1/user_data`, {
      method: "POST", headers: authHeaders,
      body: JSON.stringify({ user_id: uid })
    });

    // Mark invite used
    await fetch(`${SUPA_URL}/rest/v1/invites?code=eq.${encodeURIComponent(inviteCode)}`, {
      method: "PATCH", headers: this.headers,
      body: JSON.stringify({ used_by: uid, used_at: new Date().toISOString() })
    });

    return { uid, token, email, name };
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "Email hoặc mật khẩu sai");
    return { uid: d.user.id, token: d.access_token, email: d.user.email, name: d.user.user_metadata?.name };
  },

  async signOut(token) {
    await fetch(`${SUPA_URL}/auth/v1/logout`, { method: "POST", headers: { ...this.headers, "Authorization": `Bearer ${token}` } });
  },

  async getProfile(uid, token) {
    const r = await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${uid}`, { headers: { ...this.headers, "Authorization": `Bearer ${token}` } });
    const d = await r.json();
    return d?.[0] || null;
  },

  async getUserData(uid, token) {
    const r = await fetch(`${SUPA_URL}/rest/v1/user_data?user_id=eq.${uid}`, { headers: { ...this.headers, "Authorization": `Bearer ${token}` } });
    const d = await r.json();
    return d?.[0] || null;
  },

  async saveUserData(uid, token, patch) {
    await fetch(`${SUPA_URL}/rest/v1/user_data?user_id=eq.${uid}`, {
      method: "PATCH",
      headers: { ...this.headers, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
    });
  },

  async updateProfile(uid, token, patch) {
    await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: "PATCH",
      headers: { ...this.headers, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
      body: JSON.stringify(patch)
    });
  },
};

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const FM = "'Space Mono',monospace";
  const F  = "'Syne',system-ui,sans-serif";
  const C  = { bg:"#0D0F14", s1:"#13141C", bd:"rgba(255,255,255,0.07)", gold:"#F5C842", mu:"rgba(232,227,216,0.45)", txt:"#E8E3D8", red:"#F87171" };

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await supa.signIn(email, password);
      } else {
        if (!name.trim()) throw new Error("Nhập tên của bạn");
        if (!invite.trim()) throw new Error("Nhập mã mời");
        result = await supa.signUp(email, password, name.trim(), invite.trim().toUpperCase());
      }
      // Load user data from Supabase
      const userData = await supa.getUserData(result.uid, result.token);
      const profile  = await supa.getProfile(result.uid, result.token);
      onAuth({ ...result, profile, userData });
    } catch(e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:F}}>
      <div style={{width:"100%",maxWidth:360}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <p style={{fontSize:40,margin:"0 0 8px"}}>🏛️</p>
          <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"3px",margin:"0 0 4px"}}>KGT EMPIRE</p>
          <p style={{fontSize:20,fontWeight:800,color:"#fff",margin:0}}>Mission Control</p>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:C.s1,borderRadius:10,padding:4,marginBottom:20,border:`1px solid ${C.bd}`}}>
          {[["login","Đăng nhập"],["signup","Đăng ký"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}}
              style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:mode===m?`${C.gold}18`:"transparent",color:mode===m?C.gold:C.mu,fontFamily:FM,fontSize:"9px",cursor:"pointer",fontWeight:mode===m?700:400}}>
              {l}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mode==="signup"&&(
            <input placeholder="Tên của bạn" value={name} onChange={e=>setName(e.target.value)}
              style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,color:C.txt,padding:"11px 14px",fontSize:13,outline:"none"}}/>
          )}
          <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,color:C.txt,padding:"11px 14px",fontSize:13,outline:"none"}}/>
          <input placeholder="Mật khẩu" type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,color:C.txt,padding:"11px 14px",fontSize:13,outline:"none"}}/>
          {mode==="signup"&&(
            <input placeholder="Mã mời (VD: EMPIRE2026)" value={invite} onChange={e=>setInvite(e.target.value)}
              style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,color:C.txt,padding:"11px 14px",fontSize:13,outline:"none"}}/>
          )}

          {err&&<p style={{color:C.red,fontFamily:FM,fontSize:"10px",margin:0,padding:"6px 10px",background:"rgba(248,113,113,0.08)",borderRadius:6}}>{err}</p>}

          <button onClick={submit} disabled={loading}
            style={{padding:"12px",borderRadius:8,background:loading?"rgba(245,200,66,0.3)":`${C.gold}22`,border:`1px solid ${C.gold}60`,color:C.gold,fontFamily:FM,fontSize:"10px",fontWeight:700,cursor:loading?"not-allowed":"pointer",marginTop:4}}>
            {loading?"Đang xử lý...":(mode==="login"?"🚀 ĐĂNG NHẬP":"✨ TẠO TÀI KHOẢN")}
          </button>
        </div>

        <p style={{textAlign:"center",fontFamily:FM,fontSize:"9px",color:C.mu,marginTop:20}}>
          Cần mã mời để đăng ký · Liên hệ admin
        </p>
      </div>
    </div>
  );
}

export default function App() {
  // ── Auth state ────────────────────────────────────────────────
  const [auth, setAuth] = useState(()=>{
    try {
      const saved = localStorage.getItem("empire_auth");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [tab,setTab] = useState("council");
  const [isMobile,setIsMobile] = useState(()=>typeof window!=="undefined"&&window.innerWidth<640);
  const [telegramChatId,setTelegramChatId] = useState("");
  const [showProfile,setShowProfile] = useState(false);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<640);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);

  const [sDone,setSDone]   = useState(()=>new Set());
  const [scDone,setScDone] = useState(()=>new Set());
  // Council
  const [panel,setPanel]       = useState(["carnegie","jobs","buffett","aristotle"]);
  const [cMsgs,setCMsgs]       = useState([]);
  const [cIn,setCIn]           = useState("");
  const [cBusy,setCBusy]       = useState(false);
  const [showGrid,setShowGrid] = useState(false);
  const cRef = useRef(null);
  // Chat sessions
  const [sessions,setSessions]         = useState([]);
  const [activeSessId,setActiveSessId] = useState(null);
  const [sessMessages,setSessMessages] = useState({});
  const [aIn,setAIn]                   = useState("");
  const [aBusy,setABusy]               = useState(false);
  const [sessReady,setSessReady]       = useState(false);
  const [sidebarOpen,setSidebarOpen]   = useState(true);
  const [searchQ,setSearchQ]           = useState("");
  const [pickAgent,setPickAgent]       = useState(false);
  const [editSessId,setEditSessId]     = useState(null);
  const [editTitle,setEditTitle]       = useState("");
  const [hoverSessId,setHoverSessId]   = useState(null);
  const aRef = useRef(null);
  // Memory / RAG
  const [mems,setMems]       = useState([]);
  const [memIn,setMemIn]     = useState("");
  const [memTag,setMemTag]   = useState("general");
  const [memReady,setMemReady] = useState(false);
  const [useRAG,setUseRAG]   = useState(true);
  const [memFilter,setMemFilter] = useState("all");
  // Provider config
  const [activeProviderId,setActiveProviderId] = useState(DEFAULT_PROVIDER);
  const [providerModels,setProviderModels]     = useState(()=>Object.fromEntries(PROVIDER_LIST.map(p=>[p.id,p.defaultModel])));
  const [apiKeys,setApiKeys]                   = useState({claude:"",openai:"",gemini:"",kimi:"",qwen:"",openrouter:""});
  const [showProvSettings,setShowProvSettings] = useState(false);
  const [expandedProv,setExpandedProv]         = useState(null);
  // Starred messages
  const [starredIds,setStarredIds] = useState(()=>new Set());
  // ── FIX: ratings state ──────────────────────────────────────────────────────
  const [ratings,setRatings] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("empire_ratings")||"{}"); } catch { return {}; }
  });
  // ── Smart Notifications ──────────────────────────────────────────────────────
  const [notifications,setNotifications] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("empire_notifs")||"[]"); } catch { return []; }
  });
  const [showNotifs,setShowNotifs] = useState(false);
  const unreadCount = notifications.filter(n=>!n.read).length;
  // ── Session Intelligence ─────────────────────────────────────────────────────
  const [sessIntel,setSessIntel] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("empire_sess_intel")||"{}"); } catch { return {}; }
  });
  // Devil's Advocate
  const [devilMode,setDevilMode]   = useState(false);
  const [devilQ,setDevilQ]         = useState("");
  const [devilRes,setDevilRes]     = useState("");
  const [devilBusy,setDevilBusy]   = useState(false);
  // Hot Seat
  const [hotSeatMode,setHotSeatMode]   = useState(false);
  const [hotSeatAgent,setHotSeatAgent] = useState("carnegie");
  const [hotSeatMsgs,setHotSeatMsgs]   = useState([]);
  const [hotSeatIn,setHotSeatIn]       = useState("");
  const [hotSeatBusy,setHotSeatBusy]   = useState(false);
  const [hotSeatQ,setHotSeatQ]         = useState(0);
  const hotSeatRef = useRef(null);
  // Consensus Meter
  const [consensusData,setConsensusData] = useState(null);
  const [consensusBusy,setConsensusBusy] = useState(false);
  // Compare Mode
  const [compareMode,setCompareMode]     = useState(false);
  const [compareAgents,setCompareAgents] = useState(["carnegie","jobs","aristotle"]);
  const [compareQ,setCompareQ]           = useState("");
  const [compareRes,setCompareRes]       = useState({});
  const [compareBusy,setCompareBusy]     = useState(false);
  // Debate Mode
  const [debateMode,setDebateMode]   = useState(false);
  const [debateA,setDebateA]         = useState("carnegie");
  const [debateB,setDebateB]         = useState("jobs");
  const [debateTopic,setDebateTopic] = useState("");
  const [debateMsgs,setDebateMsgs]   = useState([]);
  const [debateBusy,setDebateBusy]   = useState(false);
  const [debateRound,setDebateRound] = useState(0);
  const debateRef = useRef(null);
  // Analytics — Decision Log
  const [decisions,setDecisions]   = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_decisions")||"[]"); } catch { return []; } });
  const [decIn,setDecIn]           = useState({title:"",context:"",options:"",outcome:"",tags:""});
  const [showDecForm,setShowDecForm] = useState(false);
  const [analyticView,setAnalyticView] = useState("decisions");
  const [patternRes,setPatternRes]   = useState("");
  const [patternBusy,setPatternBusy] = useState(false);
  const [weeklyRes,setWeeklyRes]     = useState("");
  const [weeklyBusy,setWeeklyBusy]   = useState(false);
  // Knowledge Base
  const [kb,setKb]           = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_kb")||"{}"); } catch { return {}; } });
  const [kbAgent,setKbAgent] = useState("carnegie");
  const [kbInput,setKbInput] = useState("");
  const [kbTitle,setKbTitle] = useState("");
  const [kbView,setKbView]   = useState("browse");
  const kbTotal = Object.values(kb).reduce((s,arr)=>s+(arr?.length||0),0);
  const [kbUrl,setKbUrl]         = useState("");
  const [kbImporting,setKbImporting] = useState(false);
  const [kbImportErr,setKbImportErr] = useState("");
  const [kbAddMode,setKbAddMode] = useState("manual");
  // Daily Briefing
  const [briefing,setBriefing]       = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_briefing")||"null"); } catch { return null; } });
  const [briefingBusy,setBriefingBusy] = useState(false);
  // Agent Memory
  const [agentMems,setAgentMems]   = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_agent_mems")||"{}"); } catch { return {}; } });
  const [autoMemory,setAutoMemory] = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_auto_mem")||"true"); } catch { return true; } });
  const saveAgentMems = (u)=>{ setAgentMems(u); try { localStorage.setItem("empire_agent_mems",JSON.stringify(u)); } catch {} };
  // Web Search
  const [webSearchEnabled,setWebSearchEnabled] = useState(()=>{ try { return JSON.parse(localStorage.getItem("empire_websearch")||"false"); } catch { return false; } });
  const [webSearching,setWebSearching]         = useState(false);
  // Roadmap
  const [selYear,setSelYear] = useState(1);
  const [yrView,setYrView]   = useState("owns");
  const [openStep,setOpenStep] = useState("s1");
  // ── Finance states ──────────────────────────────────────────
  const [finTxs,setFinTxs]     = useState(()=>{try{return JSON.parse(localStorage.getItem("empire_fin_txs")||"[]");}catch{return[];}});
  const [finDebts,setFinDebts] = useState(()=>{try{return JSON.parse(localStorage.getItem("empire_fin_debts")||JSON.stringify([
    {id:"d1",n:"Nợ Mẹ",total:200000000,paid:0,col:"#ef4444",pri:1},
    {id:"d2",n:"Finance Nhóm 5",total:50000000,paid:0,col:"#f97316",pri:2},
    {id:"d3",n:"Holding",total:26000000,paid:0,col:"#60a5fa",pri:3},
  ]));}catch{return[];}});
  const [finIn,setFinIn]       = useState({type:"expense",amount:"",cat:"Ăn uống",note:"",date:new Date().toISOString().slice(0,10)});
  const [finCur,setFinCur]     = useState("VND"); // VND | USD
  const [finView,setFinView]   = useState("overview"); // overview | debts | roadmap
  const saveFinTxs = u=>{setFinTxs(u);try{localStorage.setItem("empire_fin_txs",JSON.stringify(u));}catch{}};
  const saveFinDebts = u=>{setFinDebts(u);try{localStorage.setItem("empire_fin_debts",JSON.stringify(u));}catch{}};
  // ── Goal / OKR states ──────────────────────────────────────
  const [okrs,setOkrs]         = useState(()=>{try{return JSON.parse(localStorage.getItem("empire_okrs")||"[]");}catch{return[];}});
  const [okrForm,setOkrForm]   = useState({show:false,obj:"",krs:[""]});
  const saveOkrs = u=>{setOkrs(u);try{localStorage.setItem("empire_okrs",JSON.stringify(u));}catch{}};
  // ── Pomodoro states ─────────────────────────────────────────
  const [pom,setPom]           = useState({running:false,mode:"work",elapsed:0,work:25,brk:5,sessions:0});
  const [pomExpanded,setPomExpanded] = useState(false);
  const pomRef = useRef(null);
  const saveKb = (u)=>{ setKb(u); try { localStorage.setItem("empire_kb",JSON.stringify(u)); } catch {} };

  // ── Auth handlers (after all states) ──────────────────────
  const handleAuth = (authData) => {
    const toSave = { uid: authData.uid, token: authData.token, email: authData.email, name: authData.name };
    localStorage.setItem("empire_auth", JSON.stringify(toSave));
    setAuth(toSave);
    if (authData.userData) {
      const ud = authData.userData;
      if (ud.sessions?.length) setSessions(ud.sessions);
      if (ud.memories?.length) setMems(ud.memories);
      if (ud.decisions?.length) setDecisions(ud.decisions);
      if (ud.fin_txs?.length) setFinTxs(ud.fin_txs);
      if (ud.fin_debts?.length) setFinDebts(ud.fin_debts);
      if (ud.okrs?.length) setOkrs(ud.okrs);
      if (ud.ratings && Object.keys(ud.ratings).length) setRatings(ud.ratings);
      if (ud.setup_done?.length) setSDone(new Set(ud.setup_done));
      if (ud.sched_done?.length) setScDone(new Set(ud.sched_done));
    }
    if (authData.profile?.telegram_chat_id) setTelegramChatId(authData.profile.telegram_chat_id);
  };

  const handleSignOut = async () => {
    if (auth?.token) { try { await supa.signOut(auth.token); } catch {} }
    localStorage.removeItem("empire_auth");
    setAuth(null);
  };

  // Auto-save to Supabase every 30s
  useEffect(()=>{
    if (!auth?.uid) return;
    const id = setInterval(async ()=>{
      try {
        await supa.saveUserData(auth.uid, auth.token, {
          fin_txs: finTxs, fin_debts: finDebts, okrs,
          decisions, ratings,
          setup_done: [...sDone], sched_done: [...scDone],
        });
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, [auth, finTxs, finDebts, okrs, decisions, ratings, sDone, scDone]);

  // Pomodoro timer tick
  useEffect(()=>{
    if(!pom.running) return;
    const limit=(pom.mode==="work"?pom.work:pom.brk)*60;
    const id=setInterval(()=>{
      setPom(p=>{
        if(!p.running) return p;
        const next=p.elapsed+1;
        if(next>=limit){
          const newMode=p.mode==="work"?"break":"work";
          const newSess=p.mode==="work"?p.sessions+1:p.sessions;
          try{new Audio("https://www.soundjay.com/buttons/sounds/button-09.mp3").play();}catch{}
          return{...p,mode:newMode,elapsed:0,sessions:newSess,running:false};
        }
        return{...p,elapsed:next};
      });
    },1000);
    pomRef.current=id;
    return()=>clearInterval(id);
  },[pom.running,pom.mode,pom.work,pom.brk]);


  // Derived chat
  const activeSess = sessions.find(s=>s.id===activeSessId)||null;
  const activeMsgs = activeSessId?(sessMessages[activeSessId]||[]):[];
  const activeAg   = activeSess?(AGENTS.find(a=>a.id===activeSess.agId)||AGENTS[0]):AGENTS[0];

  useEffect(()=>{ loadMems().then(m=>{setMems(m);setMemReady(true);}); },[]);
  useEffect(()=>{ loadCfg().then(cfg=>{ if(cfg.activeProviderId)setActiveProviderId(cfg.activeProviderId); if(cfg.providerModels)setProviderModels(prev=>({...prev,...cfg.providerModels})); if(cfg.apiKeys)setApiKeys(prev=>({...prev,...cfg.apiKeys})); }); },[]);
  useEffect(()=>{ sessIndexLoad().then(async(idx)=>{ setSessions(idx); const recent=idx.slice(0,10); const cache={}; for(const s of recent)cache[s.id]=await sessMsgsLoad(s.id); setSessMessages(cache); if(idx.length>0)setActiveSessId(idx[0].id); setSessReady(true); }); },[]);

  // ── Smart Notifications helpers ──────────────────────────────────────────────
  const addNotif = useCallback((notif)=>{
    const n = {id:Date.now().toString()+Math.random().toString(36).slice(2),ts:Date.now(),read:false,...notif};
    setNotifications(prev=>{
      const updated=[n,...prev].slice(0,50);
      try { localStorage.setItem("empire_notifs",JSON.stringify(updated)); } catch {}
      return updated;
    });
  },[]);
  const markAllRead = ()=>setNotifications(prev=>{const u=prev.map(n=>({...n,read:true}));try{localStorage.setItem("empire_notifs",JSON.stringify(u));}catch{}return u;});
  const clearNotifs = ()=>setNotifications([]);

  // ── RATE MESSAGE (fix for Analytics Performance Tracker) ────────────────────
  const rateMessage = useCallback((msgId, agentId, stars)=>{
    if(!agentId||agentId==="council"||agentId==="") return;
    setRatings(prev=>{
      const cur=prev[agentId]||{sum:0,count:0,lastRated:{}};
      const wasRated=cur.lastRated?.[msgId];
      const newSum   = wasRated ? (cur.sum - wasRated + stars) : (cur.sum + stars);
      const newCount = wasRated ? cur.count : (cur.count + 1);
      const updated={
        ...prev,
        [agentId]:{
          sum:newSum,
          count:newCount,
          avg:(newSum/newCount).toFixed(1),
          lastRated:{...(cur.lastRated||{}),[msgId]:stars}
        }
      };
      try { localStorage.setItem("empire_ratings",JSON.stringify(updated)); } catch {}
      // Notify on rating milestone
      const newCount2 = updated[agentId].count;
      if(newCount2===5||newCount2===20||newCount2===50){
        const ag=AGENTS.find(a=>a.id===agentId);
        addNotif({type:"rating_milestone",title:`🏆 ${ag?.n} đạt ${newCount2} ratings!`,msg:`Rating trung bình: ${updated[agentId].avg}⭐ — Xem leaderboard trong Analytics.`});
      }
      return updated;
    });
  },[addNotif]);

  // ── Session Intelligence: analyze session in background ─────────────────────
  const analyzeSession = useCallback(async(sid,msgs,ag)=>{
    if(msgs.length<4||msgs.length%4!==0) return; // every 2 exchanges
    const key=apiKeys.openrouter||apiKeys.claude;
    if(!key) return;
    try {
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod =providerModels[prov]||(prov==="openrouter"?"anthropic/claude-sonnet-4-5":PROVIDERS.claude.defaultModel);
      const sys ="Bạn là session analyzer. Phân tích cuộc hội thoại và trả về JSON: {\"topic\":\"chủ đề chính\",\"insights\":[\"insight1\",\"insight2\"],\"actions\":[\"action1\"]}. Tối đa 2 insights và 1 action. Ngắn gọn, tiếng Việt. Chỉ trả về JSON.";
      const sample=msgs.slice(-6).map(m=>(m.role==="user"?"User: ":"Agent: ")+m.content.slice(0,150)).join("\n");
      const r=await callAI(sys,[],sample,prov,mod);
      const clean=r.replace(/```json|```/g,"").trim();
      const intel=JSON.parse(clean);
      setSessIntel(prev=>{
        const updated={...prev,[sid]:intel};
        try { localStorage.setItem("empire_sess_intel",JSON.stringify(updated)); } catch {}
        return updated;
      });
      // Notify
      addNotif({type:"session_intel",title:`⚡ Session Intelligence: ${ag?.n}`,msg:intel.topic||"Phân tích cuộc hội thoại hoàn tất."});
    } catch(e) { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[apiKeys,providerModels,addNotif]);

  // ── AI CALL ──────────────────────────────────────────────────────────────────
  const callAI = async(sys,hist,txt,providerId=activeProviderId,modelId=null)=>{
    let finalSys=sys;
    if(webSearchEnabled){
      const needsSearch=/hôm nay|hiện tại|mới nhất|gần đây|2024|2025|2026|tin tức|giá|thị trường|today|current|latest|recent|news|price|market/i.test(txt);
      if(needsSearch){
        setWebSearching(true);
        const sr=await searchWeb(txt.slice(0,200));
        setWebSearching(false);
        if(sr) finalSys+="\n\n--- KẾT QUẢ TÌM KIẾM ---\n"+sr+"\n---";
      }
    }
    if(useRAG&&mems.length){ const rel=searchMems(txt,mems); if(rel.length)finalSys+=memCtx(rel); }
    const msgs=[...hist.slice(-10),{role:"user",content:txt}];
    const prov=PROVIDERS[providerId]||PROVIDERS.claude;
    const model=modelId||providerModels[providerId]||prov.defaultModel;
    if(prov.apiType==="anthropic"){
      const headers={"Content-Type":"application/json"};
      if(apiKeys.claude)headers["x-api-key"]=apiKeys.claude;
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers,body:JSON.stringify({model,max_tokens:1400,system:finalSys,messages:msgs})});
      const d=await r.json();
      if(d?.error)throw new Error(d.error.message||JSON.stringify(d.error));
      return d?.content?.[0]?.text||"Không có response.";
    }
    const key=apiKeys[prov.id];
    if(!key)throw new Error(`⚠️ Chưa có API Key cho ${prov.name}. Vào ⚙️ Setup → Provider Settings.`);
    const headers={"Content-Type":"application/json","Authorization":`Bearer ${key}`};
    if(prov.id==="openrouter"){headers["HTTP-Referer"]="https://empire.kgt.life";headers["X-Title"]="Empire Mission Control";}
    const r=await fetch(prov.baseUrl,{method:"POST",headers,body:JSON.stringify({model,messages:[{role:"system",content:finalSys},...msgs],max_tokens:1400})});
    const d=await r.json();
    if(d?.error)throw new Error(d.error?.message||JSON.stringify(d.error));
    return d?.choices?.[0]?.message?.content||"Không có response.";
  };

  const searchWeb=async(query)=>{
    try {
      const key=apiKeys.openrouter||apiKeys.claude;
      if(!key)return null;
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=providerModels[prov]||(prov==="openrouter"?"anthropic/claude-sonnet-4-5":PROVIDERS.claude.defaultModel);
      const sys="You are a web search assistant. Summarize current info about the query. Be factual. Respond in Vietnamese.";
      const um="Search and summarize: "+query+"\n\nProvide 3-5 key points.";
      const result=await callAI(sys,[],um,prov,mod);
      return result;
    } catch { return null; }
  };

  // ── Daily Briefing ────────────────────────────────────────────────────────────
  const generateBriefing=async()=>{
    setBriefingBusy(true);
    const today=new Date().toLocaleDateString("vi-VN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    const prov=apiKeys.openrouter?"openrouter":"claude";
    const mod=providerModels[prov]||(prov==="openrouter"?"anthropic/claude-sonnet-4-5":PROVIDERS.claude.defaultModel);
    const agents=["carnegie","jobs","buffett","naval","aristotle","dalio"];
    const results=[];
    for(const agId of agents){
      const ag=AGENTS.find(a=>a.id===agId);if(!ag)continue;
      try {
        const reply=await callAI(buildAgentSys(ag),[],`Hôm nay là ${today}. Insight quan trọng nhất, 1 hành động cụ thể, 1 cảnh báo. Format:\n💡 INSIGHT: [câu]\n⚡ HÀNH ĐỘNG: [việc]\n⚠️ CẢNH BÁO: [rủi ro]\nNgắn gọn.`,prov,mod);
        results.push({agId,agName:ag.n,agIcon:ag.icon,agCol:ag.col,text:reply});
      } catch { results.push({agId,agName:ag.n,agIcon:ag.icon,agCol:ag.col,text:"⚠️ Lỗi kết nối"}); }
    }
    let synthesis="";
    try {
      const allTexts=results.map(r=>r.agName+": "+r.text).join("\n\n");
      synthesis=await callAI("Tổng hợp ngắn gọn insights từ hội đồng thành 3 việc ưu tiên.",[],`Tổng hợp:\n${allTexts}\n\n3 VIỆC ƯU TIÊN hôm nay.`,prov,mod);
    } catch {}
    const b={date:today,ts:Date.now(),agents:results,synthesis};
    setBriefing(b);
    try { localStorage.setItem("empire_briefing",JSON.stringify(b)); } catch {}
    addNotif({type:"briefing",title:"🌅 Daily Briefing sẵn sàng",msg:`${today} — ${results.length} cố vấn đã cung cấp insights.`});
    setBriefingBusy(false);
  };

  // ── Decision Log ──────────────────────────────────────────────────────────────
  const saveDecision=(dec)=>{ const u=[dec,...decisions]; setDecisions(u); try{localStorage.setItem("empire_decisions",JSON.stringify(u));}catch{} };
  const deleteDecision=(id)=>{ const u=decisions.filter(d=>d.id!==id); setDecisions(u); try{localStorage.setItem("empire_decisions",JSON.stringify(u));}catch{} };
  const addDecision=()=>{
    if(!decIn.title.trim())return;
    saveDecision({id:Date.now().toString(),title:decIn.title,context:decIn.context,options:decIn.options,outcome:decIn.outcome,tags:decIn.tags.split(",").map(t=>t.trim()).filter(Boolean),ts:Date.now(),status:"open"});
    setDecIn({title:"",context:"",options:"",outcome:"",tags:""});setShowDecForm(false);
  };
  const updateDecisionStatus=(id,status)=>{ const u=decisions.map(d=>d.id===id?{...d,status}:d); setDecisions(u); try{localStorage.setItem("empire_decisions",JSON.stringify(u));}catch{} };

  // ── Pattern Insights ──────────────────────────────────────────────────────────
  const runPatternInsights=async()=>{
    if(patternBusy||mems.length<3)return;
    setPatternBusy(true);setPatternRes("");
    try {
      const memSample=mems.slice(-50).map(m=>`[${m.tag}] ${m.text.slice(0,100)}`).join("\n");
      const decSample=decisions.slice(-20).map(d=>`[${d.status}] ${d.title}: ${d.context.slice(0,80)}`).join("\n");
      const sys="Bạn là chuyên gia phân tích hành vi và tư duy. Phân tích ngắn gọn, sắc bén. Tiếng Việt.";
      const prompt=`Phân tích ${mems.length} memories và ${decisions.length} decisions:\n\nMEMORIES:\n${memSample}\n\nDECISIONS:\n${decSample}\n\nChỉ ra:\n1. BLIND SPOTS — 2-3 điểm mù\n2. PATTERNS — 2-3 pattern lặp lại\n3. STRENGTHS — 2 điểm mạnh\n4. ACTION — 1 hành động ngay`;
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const reply=await callAI(sys,[],prompt,prov,mod);
      setPatternRes(reply);
    } catch(e){setPatternRes("⚠️ "+e.message);}
    setPatternBusy(false);
  };

  const runWeeklyReport=async()=>{
    if(weeklyBusy)return;
    setWeeklyBusy(true);setWeeklyRes("");
    try {
      const weekMs=7*24*60*60*1000;
      const weekMems=mems.filter(m=>Date.now()-m.ts<weekMs);
      const weekDecs=decisions.filter(d=>Date.now()-d.ts<weekMs);
      const sys="Tổng kết tuần. Viết báo cáo ngắn gọn. Tiếng Việt.";
      const prompt=`Tổng kết tuần:\n- ${weekMems.length} memories mới\n- ${weekDecs.length} decisions\n\nMemories:\n${weekMems.slice(-10).map(m=>`• ${m.text.slice(0,80)}`).join("\n")||"Chưa có"}\n\nDecisions:\n${weekDecs.map(d=>`• [${d.status}] ${d.title}`).join("\n")||"Chưa có"}\n\nWEEKLY REPORT: 1) Tóm tắt 2) Nổi bật 3) Cần cải thiện 4) Focus tuần tới`;
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const reply=await callAI(sys,[],prompt,prov,mod);
      setWeeklyRes(reply);
    } catch(e){setWeeklyRes("⚠️ "+e.message);}
    setWeeklyBusy(false);
  };

  // ── Star message → Memory ─────────────────────────────────────────────────────
  const starMessage=(msg,idx)=>{
    const mid=msg.id||`star_${idx}_${Date.now()}`;
    setStarredIds(prev=>{
      const next=new Set(prev);
      if(next.has(mid)){next.delete(mid);return next;}
      next.add(mid);
      const snippet=msg.content.slice(0,200).replace(/\n/g," ");
      const agent=AGENTS.find(a=>a.id===msg.aid);
      const text=agent?`[⭐ ${agent.n}] ${snippet}`:`[⭐ Council] ${snippet}`;
      const newMem={id:mid,text,tag:"starred",ts:Date.now(),src:"star"};
      setMems(prev2=>{const u=[...prev2,newMem];saveMems(u);return u;});
      return next;
    });
  };

  // ── Devil's Advocate ──────────────────────────────────────────────────────────
  const runDevil=async()=>{
    const txt=devilQ.trim();if(!txt||devilBusy)return;
    setDevilBusy(true);setDevilRes("");
    try {
      const sys="Bạn là Devil's Advocate — chuyên gia phản biện. Tìm mọi lý do thất bại. 5-7 rủi ro, lỗ hổng. Không an ủi. Kết thúc bằng 'Câu hỏi sống còn bạn chưa trả lời:'. Không markdown. Tiếng Việt.";
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const reply=await callAI(sys,[],txt,prov,mod);
      setDevilRes(reply);
    } catch(e){setDevilRes("⚠️ "+e.message);}
    setDevilBusy(false);
  };

  // ── Hot Seat ──────────────────────────────────────────────────────────────────
  const startHotSeat=async(topic)=>{
    if(hotSeatBusy)return;
    const ag=AGENTS.find(a=>a.id===hotSeatAgent);if(!ag)return;
    setHotSeatMsgs([]);setHotSeatBusy(true);setHotSeatQ(1);
    try {
      const sys=ag.prompt+"\n\nHOT SEAT: Hỏi 1 câu sắc bén thách thức. Chỉ 1 câu. Không markdown. Tiếng Việt.";
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const q=await callAI(sys,[],`Chủ đề: ${topic}`,prov,mod);
      setHotSeatMsgs([{role:"assistant",content:q,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon}]);
    } catch(e){setHotSeatMsgs([{role:"assistant",content:"⚠️ "+e.message,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon}]);}
    setHotSeatBusy(false);
    setTimeout(()=>hotSeatRef.current?.scrollIntoView({behavior:"smooth"}),200);
  };
  const replyHotSeat=async()=>{
    const ans=hotSeatIn.trim();if(!ans||hotSeatBusy||!hotSeatMsgs.length)return;
    const ag=AGENTS.find(a=>a.id===hotSeatAgent);if(!ag)return;
    const newMsgs=[...hotSeatMsgs,{role:"user",content:ans}];
    setHotSeatMsgs(newMsgs);setHotSeatIn("");
    if(hotSeatQ>=5){
      setHotSeatBusy(true);
      try {
        const sys=ag.prompt+"\n\nTóm tắt coaching session: 3-4 bullet points. Tiếng Việt.";
        const hist=newMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
        const prov=apiKeys.openrouter?"openrouter":"claude";
        const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
        const summary=await callAI(sys,hist,"Tóm tắt coaching session",prov,mod);
        setHotSeatMsgs(p=>[...p,{role:"assistant",content:"🎯 **Tóm tắt coaching:**\n"+summary,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon,isSummary:true}]);
      } catch {}
      setHotSeatBusy(false);return;
    }
    setHotSeatBusy(true);setHotSeatQ(p=>p+1);
    try {
      const sys2=ag.prompt+`\n\nHOT SEAT lượt ${hotSeatQ+1}/5. Hỏi 1 câu sâu hơn. Không markdown. Tiếng Việt.`;
      const hist2=newMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
      const prov2=apiKeys.openrouter?"openrouter":"claude";
      const mod2=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const q2=await callAI(sys2,hist2,ans,prov2,mod2);
      setHotSeatMsgs(p=>[...p,{role:"assistant",content:q2,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon}]);
    } catch(e){setHotSeatMsgs(p=>[...p,{role:"assistant",content:"⚠️ "+e.message,agentName:ag.n,agentCol:ag.col,agentIcon:ag.icon}]);}
    setHotSeatBusy(false);
    setTimeout(()=>hotSeatRef.current?.scrollIntoView({behavior:"smooth"}),200);
  };


  // ── Schedule Notification Checker ──────────────────────────────────────────
  useEffect(()=>{
    const checkSchedule=()=>{
      const now=new Date();
      const h=now.getHours(),m=now.getMinutes();
      const key=`sched_notif_${now.toDateString()}`;
      const sent=JSON.parse(localStorage.getItem(key)||"[]");
      SCHED.forEach(blk=>{
        const [bh,bm]=blk.t.split(":").map(Number);
        if(h===bh&&m===bm&&!sent.includes(blk.id)){
          addNotif({type:"schedule",title:`${blk.e} ${blk.n}`,msg:blk.note,blkId:blk.id});
          const updated=[...sent,blk.id];
          localStorage.setItem(key,JSON.stringify(updated));
        }
      });
    };
    checkSchedule();
    const iv=setInterval(checkSchedule,60000);
    return()=>clearInterval(iv);
  },[addNotif]);

  // ── Load config ──────────────────────────────────────────────────────────
  useEffect(()=>{
    loadCfg().then(cfg=>{
      if(cfg.activeProviderId)setActiveProviderId(cfg.activeProviderId);
      if(cfg.providerModels)setProviderModels(prev=>({...prev,...cfg.providerModels}));
      if(cfg.apiKeys)setApiKeys(prev=>({...prev,...cfg.apiKeys}));
    });
  },[]);
  useEffect(()=>{ saveCfg({activeProviderId,providerModels,apiKeys}); },[activeProviderId,providerModels,apiKeys]);
  useEffect(()=>{ loadMems().then(m=>{setMems(m);setMemReady(true);}); },[]);
  useEffect(()=>{
    sessIndexLoad().then(async(idx)=>{
      setSessions(idx);
      const cache={};
      for(const s of idx.slice(0,10)) cache[s.id]=await sessMsgsLoad(s.id);
      setSessMessages(cache);
      if(idx.length>0)setActiveSessId(idx[0].id);
      setSessReady(true);
    });
  },[]);
  useEffect(()=>{ cRef.current?.scrollIntoView({behavior:"smooth"}); },[cMsgs,cBusy]);
  useEffect(()=>{ aRef.current?.scrollIntoView({behavior:"smooth"}); },[activeMsgs,aBusy]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const togPanel=id=>setPanel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const togS=id=>setSDone(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const togSc=id=>setScDone(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const sPct=Math.round(sDone.size/SETUP.length*100);
  const scPct=Math.round(scDone.size/SCHED.length*100);
  const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes();};
  const parseMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
  const isCurrentBlock=(blk,i)=>{
    const start=parseMin(blk.t);
    const end=i<SCHED.length-1?parseMin(SCHED[i+1].t):24*60;
    const n=nowMin();return n>=start&&n<end;
  };
  const dayStr=["CN","T2","T3","T4","T5","T6","T7"][new Date().getDay()];
  const dateStr=new Date().toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const yr=YEARS.find(y=>y.y===selYear);
  const TABS=[
    {id:"council",label:"🏛️ Council",badge:`${panel.length}/${AGENTS.length}`,color:C.gold},
    {id:"chat",label:"💬 Chat",badge:activeAg.n,color:activeAg.col},
    {id:"memory",label:"🧠 Memory",badge:`${mems.length}`,color:C.pur},
    {id:"analytics",label:"📊 Analytics",badge:`${decisions.length}`,color:"#34D399"},
    {id:"daily",label:"📅 Lịch",badge:`${scPct}%`,color:C.grn},
    {id:"setup",label:"⚙️ Setup",badge:`${sPct}%`,color:C.blu},
    {id:"roadmap",label:"🗺 5 Năm",badge:"2026–2030",color:C.org},
    {id:"knowledge",label:"📚 KB",badge:`${kbTotal}`,color:"#F59E0B"},
    {id:"finance",label:"💰 Finance",badge:`${finTxs.filter(t=>t.date===new Date().toISOString().slice(0,10)).length}tx`,color:"#34D399"},
    {id:"goals",label:"🎯 Goals",badge:`${okrs.length}`,color:"#a78bfa"},
    {id:"pomodoro",label:"⏱️ Focus",badge:`${pom.sessions}🍅`,color:"#f97316"},
  ];

  // ── Council session management ────────────────────────────────────────────
  const sessUpdateCache=(id,msgs)=>{setSessMessages(prev=>({...prev,[id]:msgs}));sessMsgsSave(id,msgs);};
  const sessUpdateIndex=(id,patch)=>{
    setSessions(prev=>{const u=prev.map(s=>s.id===id?{...s,...patch}:s).sort((a,b)=>b.updatedAt-a.updatedAt);sessIndexSave(u);return u;});
  };
  const newSession=(agId)=>{
    const a=AGENTS.find(x=>x.id===agId)||AGENTS[0];
    const pid=activeProviderId;
    const s={...makeSession(agId,a.n),provider:pid,model:providerModels[pid]||PROVIDERS[pid]?.defaultModel};
    setSessions(prev=>{const u=[s,...prev];sessIndexSave(u);return u;});
    setSessMessages(prev=>({...prev,[s.id]:[]}));
    setActiveSessId(s.id);setAIn("");
  };
  const switchSession=async(id)=>{
    setActiveSessId(id);setAIn("");
    if(!sessMessages[id]){const msgs=await sessMsgsLoad(id);setSessMessages(prev=>({...prev,[id]:msgs}));}
  };
  const deleteSession=async(id)=>{
    setSessions(prev=>{const u=prev.filter(s=>s.id!==id);sessIndexSave(u);return u;});
    setSessMessages(prev=>{const n={...prev};delete n[id];return n;});
    try{await window.storage.delete(sessMsgsKey(id));}catch{}
    setActiveSessId(prev=>prev===id?(sessions.find(s=>s.id!==id)?.id||null):prev);
  };
  const renameSession=(id,title)=>sessUpdateIndex(id,{title});

  // ── Memory helpers ──────────────────────────────────────────────────────
  const addMem=()=>{
    if(!memIn.trim())return;
    const m={id:Date.now().toString(),text:memIn.trim(),tag:memTag,ts:Date.now(),src:"manual"};
    setMems(prev=>{const u=[...prev,m];saveMems(u);return u;});
    setMemIn("");
  };
  const delMem=id=>{setMems(prev=>{const u=prev.filter(m=>m.id!==id);saveMems(u);return u;});};

  const delAgentMem=(agId,memId)=>{ const updated={...agentMems,[agId]:(agentMems[agId]||[]).filter(m=>m.id!==memId)}; saveAgentMems(updated); };

  // ── KB helpers ──────────────────────────────────────────────────────────
  const importFromUrl=async()=>{
    if(!kbUrl.trim())return;
    setKbImporting(true);setKbImportErr("");
    try {
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=providerModels[prov]||(prov==="openrouter"?"anthropic/claude-sonnet-4-5":PROVIDERS.claude.defaultModel);
      const sys="Extract và tóm tắt nội dung từ URL. Format:\nTIÊU ĐỀ: [tên]\nNỘI DUNG:\n- [point]\nChỉ trả về format này.";
      const result=await callAI(sys,[],"Extract nội dung từ URL: "+kbUrl.trim()+"\nNếu không truy cập được, tạo summary placeholder.",prov,mod);
      const titleMatch=result.match(/TIÊU ĐỀ:\s*(.+)/);
      const contentMatch=result.match(/NỘI DUNG:\s*([\s\S]+)/);
      setKbTitle(titleMatch?titleMatch[1].trim():kbUrl.split("/").pop()||"Imported");
      setKbInput(contentMatch?contentMatch[1].trim():result);
      setKbUrl("");setKbAddMode("manual");
    } catch(e){setKbImportErr("Lỗi: "+e.message);}
    setKbImporting(false);
  };

  // ── sendAgent — uses provider saved when session was created ─────────────
  const sendAgent=async()=>{
    const txt=aIn.trim();if(!txt||aBusy||!activeSessId)return;
    const sid=activeSessId;
    const sess=sessions.find(s=>s.id===sid);
    const pid=sess?.provider||activeProviderId;
    const mid=sess?.model||providerModels[pid]||PROVIDERS[pid]?.defaultModel;
    const prov=PROVIDERS[pid]||PROVIDERS.claude;
    const curMsgs=sessMessages[sid]||[];
    const nextMsgs=[...curMsgs,{role:"user",content:txt}];
    setAIn("");setABusy(true);
    sessUpdateCache(sid,nextMsgs);
    if(curMsgs.length===0)
      sessUpdateIndex(sid,{title:txt.slice(0,48)+(txt.length>48?"…":""),updatedAt:Date.now(),msgCount:1});
    try {
      const hist=curMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
      const reply=await callAI(buildAgentSys(activeAg),hist,txt,pid,mid);
      const modelLabel=prov.models.find(m=>m.id===mid)?.label||mid;
      const botMsg={role:"assistant",content:reply,label:`${activeAg.icon} ${activeAg.n}`,aid:activeAg.id,id:`msg_${Date.now()}`,providerIcon:prov.icon,modelLabel,providerColor:prov.color};
      const finalMsgs=[...nextMsgs,botMsg];
      sessUpdateCache(sid,finalMsgs);
      sessUpdateIndex(sid,{updatedAt:Date.now(),msgCount:finalMsgs.length});
      // Session Intelligence: auto-analyze after 3rd exchange
      const botCount=finalMsgs.filter(m=>m.role==="assistant").length;
      if(botCount>=2&&botCount%2===0){
        analyzeSession(sid,finalMsgs,activeAg);
      }
      if(autoMemory)extractMemory(activeAg.id,txt,reply);
      // Only notify on first reply in a new session (not every message)
      if(finalMsgs.filter(m=>m.role==="assistant").length===1){
        addNotif({type:"response",title:`${activeAg.icon} ${activeAg.n}`,msg:reply.slice(0,80)+"…"});
      }
    } catch(e){
      const errMsgs=[...nextMsgs,{role:"assistant",content:`⚠️ ${e.message||"Lỗi kết nối."}`,label:"System",aid:""}];
      sessUpdateCache(sid,errMsgs);
    }
    setABusy(false);
  };

  // ── Council ──────────────────────────────────────────────────────────────
  const mkCouncilSys=()=>{
    const names=panel.map(id=>{const a=AGENTS.find(x=>x.id===id);return`${a.icon} ${a.n}`;}).join(", ");
    const lines=panel.map(id=>{const a=AGENTS.find(x=>x.id===id);return`${a.icon} ${a.n} (${a.role}) —`;}).join("\n");
    return`Bạn là hội đồng cố vấn gồm: ${names}.\n\nVới mỗi câu hỏi, trình bày đúng format:\n${lines}\n\nKẾT LUẬN — [2-3 câu hành động cụ thể]\n\nQUY TẮC: Không dùng ** hay ## hay bất kỳ markdown. Mỗi cố vấn nói 2-4 câu. Tiếng Việt.`;
  };
  const sendCouncil=async()=>{
    const txt=cIn.trim();if(!txt||cBusy||!panel.length)return;
    setCIn("");setCBusy(true);
    setCMsgs(p=>[...p,{role:"user",content:txt}]);
    try {
      const hist=cMsgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const reply=await callAI(mkCouncilSys(),hist,txt,prov,mod);
      setCMsgs(p=>[...p,{role:"assistant",content:reply,label:"🏛️ Hội Đồng",aid:"council",id:`cmsg_${Date.now()}`}]);
      if(useRAG&&txt.length>15){
        const newMem={id:Date.now().toString(),text:`[Council] ${txt.slice(0,120)}`,tag:"council",ts:Date.now(),src:"auto"};
        setMems(prev=>{const u=[...prev,newMem];saveMems(u);return u;});
      }
    } catch(e){setCMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${e.message||"Lỗi kết nối."}`,label:"System",aid:""}]);}
    setCBusy(false);
  };

  // ── Export Council Minutes ───────────────────────────────────────────────
  const exportCouncilPDF=()=>{
    if(!cMsgs.length)return;
    const now=new Date();
    const dateStr2=now.toLocaleDateString("vi-VN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    const timeStr=now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
    const panelNames=panel.map(id=>{const a=AGENTS.find(x=>x.id===id);return a?`${a.icon} ${a.n}`:id;}).join(" · ");
    const rows=cMsgs.map((m,i)=>{
      const isU=m.role==="user";
      const bg=isU?"#1a2035":"#0f1520";
      const col=isU?"#E8C547":(AGENTS.find(a=>a.id===m.aid)?.col||"#A78BFA");
      const who=isU?"Bạn":(m.label||"Hội Đồng");
      const txt=m.content.split("<").join("&lt;").split(">").join("&gt;").split("\n").join("<br>");
      return`<div style="margin-bottom:16px;padding:14px 18px;background:${bg};border-radius:8px;border-left:3px solid ${col}"><div style="font-size:10px;color:${col};font-family:monospace;margin-bottom:6px">${who}</div><div style="font-size:13px;color:#D1CCB8;line-height:1.8">${txt}</div></div>`;
    }).join("");
    const html=`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Council Minutes</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#080B12;color:#D1CCB8;font-family:sans-serif;padding:40px;max-width:780px;margin:0 auto}</style></head><body><div style="border-bottom:1px solid #1E2533;padding-bottom:20px;margin-bottom:28px"><div style="font-size:9px;color:#4A5568;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">Empire Mission Control · Council Minutes</div><div style="font-size:24px;font-weight:800;color:#E8C547;margin-bottom:10px">Biên Bản Hội Đồng</div><div style="font-size:12px;color:#D1CCB8;margin-bottom:4px">${dateStr2} · ${timeStr}</div><div style="font-size:12px;color:#D1CCB8">${panelNames}</div></div><div>${rows}</div><div style="margin-top:28px;text-align:center"><button onclick="window.print()" style="padding:10px 28px;background:rgba(232,197,71,0.15);border:1px solid rgba(232,197,71,0.4);border-radius:6px;color:#E8C547;font-size:11px;cursor:pointer">In / Lưu PDF</button></div></body></html>`;
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(win)win.onload=()=>setTimeout(()=>{try{win.print();}catch{}},500);
  };

  // ── Debate helpers ──────────────────────────────────────────────────────
  const startDebate=async()=>{
    const topic=debateTopic.trim();if(!topic||debateBusy)return;
    setDebateMsgs([]);setDebateBusy(true);setDebateRound(0);
    const agA=AGENTS.find(a=>a.id===debateA),agB=AGENTS.find(a=>a.id===debateB);
    if(!agA||!agB){setDebateBusy(false);return;}
    const prov=apiKeys.openrouter?"openrouter":"claude";
    const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
    let history=[];
    for(let r=0;r<3;r++){
      setDebateRound(r+1);
      const sysA=agA.prompt+`\n\nBạn TRANH LUẬN ủng hộ: "${topic}". Lượt ${r+1}/3. Lập luận sắc bén, 60-80 từ. Tiếng Việt. KHÔNG markdown.`;
      try{const ra=await callAI(sysA,history,r===0?topic:`[Lượt ${r+1}]`,prov,mod);const msgA={role:"assistant",content:ra,agent:agA.id,agentName:agA.n,agentIcon:agA.icon,agentCol:agA.col,side:"A",round:r+1};setDebateMsgs(p=>[...p,msgA]);history.push({role:"user",content:`[${agA.n}]: ${ra}`});}catch{}
      const sysB=agB.prompt+`\n\nBạn PHẢN BIỆN chống: "${topic}". Lượt ${r+1}/3. Phản biện sắc bén, 60-80 từ. Tiếng Việt. KHÔNG markdown.`;
      try{const rb=await callAI(sysB,history,`[${agA.n} vừa nói]`,prov,mod);const msgB={role:"assistant",content:rb,agent:agB.id,agentName:agB.n,agentIcon:agB.icon,agentCol:agB.col,side:"B",round:r+1};setDebateMsgs(p=>[...p,msgB]);history.push({role:"user",content:`[${agB.n}]: ${rb}`});}catch{}
      await new Promise(res=>setTimeout(res,300));
    }
    try{const sv=`Trọng tài công bằng. Kết luận 50-70 từ cho cuộc tranh luận về "${topic}" giữa ${agA.n} (ủng hộ) và ${agB.n} (phản biện). Ai thuyết phục hơn? Tiếng Việt.`;const verdict=await callAI(sv,history,"Kết luận",prov,mod);setDebateMsgs(p=>[...p,{role:"assistant",content:verdict,agent:"council",agentName:"⚖️ Kết Luận",agentIcon:"⚖️",agentCol:C.gold,side:"verdict",round:4}]);}catch{}
    setDebateBusy(false);
    setTimeout(()=>debateRef.current?.scrollIntoView({behavior:"smooth"}),200);
  };

  // ── Consensus Meter ──────────────────────────────────────────────────────
  const runConsensus=async()=>{
    if(cMsgs.length<2||consensusBusy)return;
    setConsensusBusy(true);
    try{
      const lastBot=[...cMsgs].reverse().find(m=>m.role==="assistant");
      const lastQ=[...cMsgs].reverse().find(m=>m.role==="user");
      if(!lastBot||!lastQ){setConsensusBusy(false);return;}
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      const raw=await callAI("Phân tích đồng thuận. JSON: {\"score\":0-100,\"summary\":\"1 câu\",\"agree\":[],\"disagree\":[]}. Chỉ JSON.",[],`Câu hỏi: ${lastQ.content}\nTrả lời: ${lastBot.content.slice(0,600)}`,prov,mod);
      try{setConsensusData(JSON.parse(raw.replace(/```json|```/g,"").trim()));}
      catch{setConsensusData({score:50,summary:"Không phân tích được",agree:[],disagree:[]});}
    }catch{}
    setConsensusBusy(false);
  };

  // ── Compare Mode ──────────────────────────────────────────────────────────
  const runCompare=async()=>{
    const txt=compareQ.trim();if(!txt||compareBusy||compareAgents.length<2)return;
    setCompareBusy(true);setCompareRes({});
    await Promise.all(compareAgents.map(async(agId)=>{
      const ag=AGENTS.find(a=>a.id===agId);if(!ag)return;
      const prov=apiKeys.openrouter?"openrouter":"claude";
      const mod=apiKeys.openrouter?(providerModels.openrouter||"anthropic/claude-sonnet-4-5"):(providerModels.claude||PROVIDERS.claude.defaultModel);
      try{const r=await callAI(ag.prompt+"\nNgắn gọn 150 từ. Tiếng Việt.",[],txt,prov,mod);setCompareRes(p=>({...p,[agId]:r}));}
      catch(e){setCompareRes(p=>({...p,[agId]:"⚠️ "+e.message}));}
    }));
    setCompareBusy(false);
  };

  // ══ RENDER ════════════════════════════════════════════════════════════════
  // Show auth screen if not logged in
  if (!auth) return <AuthScreen onAuth={handleAuth}/>;

  return (
    <div style={{fontFamily:F,minHeight:"100vh",background:C.bg,color:C.txt,display:"flex",flexDirection:"column"}}>
      <link rel="stylesheet" href={GF}/>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <meta name="theme-color" content="#0D0F14"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      <meta name="apple-mobile-web-app-title" content="Empire Council"/>
      <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏛️</text></svg>"/>
      <style>{`
        @keyframes dot{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:2px}
        textarea{font-family:'Syne',system-ui,sans-serif!important}
        input::placeholder,textarea::placeholder{color:rgba(232,227,216,0.3)}
        *{-webkit-tap-highlight-color:transparent}
        @media(max-width:640px){
          .tab-label{display:none!important}
          .tab-badge{display:none!important}
          .stat-label{display:none!important}
          .header-stats{gap:6px!important}
          .notif-panel{width:calc(100vw - 24px)!important;right:-4px!important}
          .mob-hide{display:none!important}
          .mob-col{flex-direction:column!important}
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{borderBottom:`1px solid ${C.bd}`,flexShrink:0,background:`${C.bg}EC`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:isMobile?"8px 12px 0":"12px 20px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div>
              <p style={{fontFamily:FM,fontSize:"8px",letterSpacing:"3px",color:`${C.gold}50`,margin:"0 0 3px",textTransform:"uppercase"}}>Empire Council · Mission Control</p>
              <p style={{fontSize:17,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.5px"}}>Mission Control</p>
            </div>
            <div className="header-stats" style={{display:"flex",gap:12,alignItems:"center"}}>
              {[[panel.length+"/51","Council",C.gold],[mems.length+" items","Memory",C.pur],[sPct+"%","Setup",C.blu],[dateStr,dayStr,C.mu]].map(([v,l,col])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p className="stat-label" style={{fontFamily:FM,fontSize:"7px",color:C.fa,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"1px"}}>{l}</p>
                  <p style={{fontFamily:FM,fontSize:11,color:col,margin:0,fontWeight:600}}>{v}</p>
                </div>
              ))}
              {/* 🔔 Notification Bell */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowNotifs(p=>!p)}
                  style={{width:34,height:34,borderRadius:8,background:showNotifs?`${C.gold}18`:`${C.s1}`,border:`1px solid ${unreadCount>0?C.gold+"50":C.bd}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",position:"relative"}}>
                  <span style={{fontSize:14}}>🔔</span>
                  {unreadCount>0&&(
                    <span style={{position:"absolute",top:-4,right:-4,background:C.red,color:"#fff",fontFamily:FM,fontSize:"8px",fontWeight:700,padding:"0 4px",borderRadius:10,minWidth:14,textAlign:"center",lineHeight:"14px"}}>{unreadCount}</span>
                  )}
                </button>
                {showNotifs&&(
                  <div className="notif-panel" style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:300,width:320,animation:"slideIn .15s ease"}}>
                    <NotifPanel notifications={notifications}
                      onRead={()=>{const u=notifications.map(n=>({...n,read:true}));setNotifications(u);try{localStorage.setItem("empire_notifs",JSON.stringify(u));}catch{}}}
                      onClear={()=>{setNotifications([]);try{localStorage.removeItem("empire_notifs");}catch{}}}
                      onClose={()=>setShowNotifs(false)}/>
                  </div>
                )}
              </div>
              {/* 👤 User Avatar + Menu */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowProfile(p=>!p)}
                  style={{width:34,height:34,borderRadius:"50%",background:`${C.gold}22`,border:`1px solid ${C.gold}50`,color:C.gold,fontFamily:FM,fontSize:"11px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {auth?.name?auth.name[0].toUpperCase():"U"}
                </button>
                {showProfile&&(
                  <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:300,width:220,background:C.s2,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px",animation:"slideIn .15s ease"}}>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,margin:"0 0 4px"}}>ĐANG ĐĂNG NHẬP</p>
                    <p style={{fontSize:13,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>{auth?.name||"User"}</p>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 12px"}}>{auth?.email}</p>
                    <div style={{borderTop:`1px solid ${C.bd}`,paddingTop:10,marginTop:2}}>
                      <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 6px"}}>📱 TELEGRAM CHAT ID</p>
                      <div style={{display:"flex",gap:6}}>
                        <input value={telegramChatId} onChange={e=>setTelegramChatId(e.target.value)}
                          placeholder="Lấy từ @userinfobot"
                          style={{flex:1,background:"#111",border:`1px solid ${C.bd}`,borderRadius:5,color:"#fff",padding:"5px 8px",fontSize:11}}/>
                        <button onClick={async()=>{
                          if(!auth?.uid||!auth?.token) return;
                          await supa.updateProfile(auth.uid,auth.token,{telegram_chat_id:telegramChatId});
                          setShowProfile(false);
                        }} style={{padding:"5px 8px",borderRadius:5,background:"#34D39920",border:"1px solid #34D39940",color:"#34D399",fontSize:10,cursor:"pointer"}}>✓</button>
                      </div>
                    </div>
                    <button onClick={()=>{setShowProfile(false);handleSignOut();}}
                      style={{width:"100%",marginTop:10,padding:"8px",borderRadius:6,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#F87171",fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>{const a=tab===t.id;return(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{display:"flex",alignItems:"center",gap:6,padding:isMobile?"8px 10px":"8px 14px",flexShrink:0,background:a?`${t.color}0C`:"transparent",border:"none",borderBottom:`2px solid ${a?t.color:"transparent"}`,color:a?t.color:C.mu,cursor:"pointer",transition:"all .15s"}}>
                <span className="tab-label" style={{fontFamily:F,fontSize:12,fontWeight:a?700:400}}>{t.label}</span>
                <span className="tab-badge" style={{fontFamily:FM,fontSize:"8px",padding:"1px 7px",borderRadius:10,background:a?`${t.color}18`:"rgba(255,255,255,0.04)",border:`1px solid ${a?t.color+"40":C.bd}`,color:a?t.color:C.fa}}>{t.badge}</span>
              </button>
            );})}
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* ════ COUNCIL ════ */}
        {tab==="council"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",maxWidth:960,width:"100%",margin:"0 auto",padding:"0 20px",boxSizing:"border-box",overflow:"hidden"}}>
            {/* Controls */}
            <div style={{flexShrink:0,padding:"12px 0 8px"}}>
              <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                <button onClick={()=>setUseRAG(p=>!p)} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:useRAG?C.purD:"transparent",border:`1px solid ${useRAG?C.pur:C.bd}`,color:useRAG?C.pur:C.mu,letterSpacing:"1px"}}>🧠 RAG {useRAG?"ON":"OFF"}</button>
                <button onClick={()=>setWebSearchEnabled(p=>{const n=!p;try{localStorage.setItem("empire_websearch",JSON.stringify(n));}catch{}return n;})}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:webSearchEnabled?"rgba(52,211,153,0.08)":"transparent",border:`1px solid ${webSearchEnabled?"#34D399":C.bd}`,color:webSearchEnabled?"#34D399":C.mu,letterSpacing:"1px"}}>{webSearching?"⏳ ...":webSearchEnabled?"🌐 WEB ON":"🌐 WEB OFF"}</button>
                <button onClick={()=>setPanel(AGENTS.filter(a=>a.tier==="S").map(a=>a.id))} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:C.gD,border:`1px solid ${C.gold}28`,color:C.gold,letterSpacing:"1px"}}>S-TIER</button>
                <button onClick={()=>setPanel(AGENTS.slice(0,8).map(a=>a.id))} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>TOP 8</button>
                <span style={{fontFamily:FM,fontSize:"8px",color:apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color,background:`${apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color}10`,border:`1px solid ${apiKeys.openrouter?PROVIDERS.openrouter.color:PROVIDERS.claude.color}25`,padding:"3px 10px",borderRadius:3,marginLeft:"auto"}}>
                  {apiKeys.openrouter?`🔀 ${providerModels.openrouter||"claude-sonnet"}`:`🟣 ${providerModels.claude||PROVIDERS.claude.defaultModel}`}
                </span>
                <button onClick={()=>setShowGrid(p=>!p)} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>{showGrid?"▲ Ẩn":`▼ ${AGENTS.length} Agents`}</button>
                {cMsgs.length>0&&<button onClick={()=>setCMsgs([])} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>XÓA</button>}
                {cMsgs.length>0&&<button onClick={exportCouncilPDF} style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:C.gD,border:`1px solid ${C.gold}30`,color:C.gold,letterSpacing:"0.5px"}}>📋 MINUTES</button>}
                <button onClick={()=>{setDebateMode(p=>!p);setCompareMode(false);setDevilMode(false);setHotSeatMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:debateMode?"rgba(248,113,113,0.1)":"transparent",border:`1px solid ${debateMode?"#F87171":C.bd}`,color:debateMode?"#F87171":C.mu}}>⚔️ Debate</button>
                <button onClick={()=>{setCompareMode(p=>!p);setDebateMode(false);setDevilMode(false);setHotSeatMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:compareMode?`${C.pur}10`:"transparent",border:`1px solid ${compareMode?C.pur:C.bd}`,color:compareMode?C.pur:C.mu}}>🔀 Compare</button>
                <button onClick={()=>{setDevilMode(p=>!p);setDebateMode(false);setCompareMode(false);setHotSeatMode(false);}}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:devilMode?"rgba(248,113,113,0.08)":"transparent",border:`1px solid ${devilMode?"#F87171":C.bd}`,color:devilMode?"#F87171":C.mu}}>😈 Devil</button>
                <button onClick={()=>{setHotSeatMode(p=>!p);setDebateMode(false);setCompareMode(false);setDevilMode(false);setHotSeatMsgs([]);setHotSeatQ(0);}}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:"pointer",background:hotSeatMode?"rgba(251,146,60,0.08)":"transparent",border:`1px solid ${hotSeatMode?"#FB923C":C.bd}`,color:hotSeatMode?"#FB923C":C.mu}}>🎯 Hot Seat</button>
                {cMsgs.length>1&&<button onClick={runConsensus} disabled={consensusBusy}
                  style={{fontFamily:FM,fontSize:"9px",padding:"4px 11px",borderRadius:4,cursor:consensusBusy?"not-allowed":"pointer",background:consensusData?"rgba(52,211,153,0.08)":"transparent",border:`1px solid ${consensusData?"#34D399":C.bd}`,color:consensusData?"#34D399":C.mu}}>{consensusBusy?"⏳":"🤝"} Consensus</button>}
              </div>
              {showGrid&&(
                <div style={{maxHeight:220,overflowY:"auto",marginBottom:8}}>
                  {["S","A","B","C"].map(tier=>(
                    <div key={tier} style={{marginBottom:8}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 4px",letterSpacing:"2px"}}>{tier}-TIER</p>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {AGENTS.filter(a=>a.tier===tier).map(a=>{const sel=panel.includes(a.id);return(
                          <button key={a.id} onClick={()=>togPanel(a.id)}
                            style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",background:sel?`${a.col}14`:C.s1,border:`1px solid ${sel?a.col:C.bd}`,borderRadius:5,cursor:"pointer",transition:"all .12s"}}>
                            <span style={{fontSize:11}}>{a.icon}</span>
                            <span style={{fontFamily:FM,fontSize:"9px",color:sel?a.col:C.mu}}>{a.n}</span>
                            {sel&&<span style={{color:a.col,fontSize:8}}>✓</span>}
                          </button>
                        );})}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontFamily:FM,fontSize:"8px",color:C.fa}}>PANEL:</span>
                {panel.slice(0,10).map(id=>{const a=AGENTS.find(x=>x.id===id);if(!a)return null;return(
                  <span key={id} onClick={()=>togPanel(id)} style={{fontFamily:FM,fontSize:"9px",color:a.col,background:`${a.col}12`,border:`1px solid ${a.col}22`,padding:"2px 8px",borderRadius:3,cursor:"pointer"}}>{a.icon} {a.n} ×</span>
                );})}
                {panel.length>10&&<span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>+{panel.length-10}</span>}
              </div>
            </div>

            {/* Debate Mode */}
            {debateMode&&(
              <div style={{flexShrink:0,marginBottom:8,background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:10,padding:"12px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#F87171",letterSpacing:"2px",margin:"0 0 8px"}}>⚔️ DEBATE MODE — 3 LƯỢT TRANH LUẬN</p>
                <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 4px"}}>AGENT A (ỦNG HỘ)</p>
                    <select value={debateA} onChange={e=>setDebateA(e.target.value)} style={{width:"100%",background:C.s1,border:`1px solid ${AGENTS.find(a=>a.id===debateA)?.col||C.bd}`,borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                      {AGENTS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",paddingBottom:4}}><span style={{fontFamily:FM,fontSize:"11px",color:"#F87171",fontWeight:700}}>VS</span></div>
                  <div style={{flex:1,minWidth:120}}>
                    <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 4px"}}>AGENT B (PHẢN BIỆN)</p>
                    <select value={debateB} onChange={e=>setDebateB(e.target.value)} style={{width:"100%",background:C.s1,border:`1px solid ${AGENTS.find(a=>a.id===debateB)?.col||C.bd}`,borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                      {AGENTS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={debateTopic} onChange={e=>setDebateTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startDebate()} placeholder="Chủ đề tranh luận..." style={{flex:1,background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={startDebate} disabled={debateBusy||!debateTopic.trim()} style={{padding:"8px 14px",background:debateBusy?"transparent":"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.4)",borderRadius:6,cursor:debateBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#F87171"}}>
                    {debateBusy?`🔥 Lượt ${debateRound}/3`:"⚔️ BẮT ĐẦU"}
                  </button>
                </div>
                {debateMsgs.length>0&&(
                  <div style={{marginTop:10,maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
                    {debateMsgs.map((m,i)=>{
                      const isV=m.side==="verdict",isA=m.side==="A";
                      return(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:isV?"center":isA?"flex-start":"flex-end"}}>
                        <span style={{fontFamily:FM,fontSize:"8px",color:m.agentCol,marginBottom:2}}>{m.agentIcon} {m.agentName}</span>
                        <div style={{maxWidth:"85%",padding:"9px 13px",borderRadius:isA?"10px 10px 10px 2px":isV?"10px":"10px 10px 2px 10px",background:`${m.agentCol}08`,border:`1px solid ${m.agentCol}25`,fontSize:12,color:C.txt,lineHeight:1.7}}>{m.content}</div>
                      </div>);
                    })}
                    {debateBusy&&<div style={{display:"flex",gap:4,justifyContent:"center",padding:"4px"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#F87171",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                    <div ref={debateRef}/>
                  </div>
                )}
              </div>
            )}

            {/* Devil Mode */}
            {devilMode&&(
              <div style={{flexShrink:0,marginBottom:8,background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:10,padding:"12px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#F87171",letterSpacing:"2px",margin:"0 0 6px"}}>😈 DEVIL'S ADVOCATE — TẤN CÔNG VÀO KẾ HOẠCH</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={devilQ} onChange={e=>setDevilQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runDevil()} placeholder="Kế hoạch / ý tưởng cần phản biện..." style={{flex:1,background:C.s1,border:"1px solid rgba(248,113,113,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={runDevil} disabled={devilBusy||!devilQ.trim()} style={{padding:"8px 14px",background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.35)",borderRadius:6,cursor:devilBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#F87171"}}>{devilBusy?"⏳":"😈 TẤN CÔNG"}</button>
                </div>
                {devilRes&&<div style={{marginTop:8,background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:8,padding:"10px 14px",fontSize:12,color:C.txt,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{devilRes}</div>}
              </div>
            )}

            {/* Hot Seat Mode */}
            {hotSeatMode&&(
              <div style={{flexShrink:0,marginBottom:8,background:"rgba(251,146,60,0.04)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:10,padding:"12px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#FB923C",letterSpacing:"2px",margin:"0 0 8px"}}>🎯 HOT SEAT — AGENT HỎI NGƯỢC LẠI BẠN (5 CÂU)</p>
                <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
                  <select value={hotSeatAgent} onChange={e=>setHotSeatAgent(e.target.value)} style={{background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:5,padding:"6px 10px",color:C.txt,fontFamily:FM,fontSize:"10px",cursor:"pointer"}}>
                    {AGENTS.filter(a=>["S","A"].includes(a.tier)).map(a=><option key={a.id} value={a.id}>{a.icon} {a.n}</option>)}
                  </select>
                  <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>Câu {Math.min(hotSeatQ,5)}/5</span>
                  {hotSeatMsgs.length>0&&<button onClick={()=>{setHotSeatMsgs([]);setHotSeatQ(0);}} style={{fontFamily:FM,fontSize:"8px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,cursor:"pointer"}}>RESET</button>}
                </div>
                {hotSeatMsgs.length===0&&(
                  <div style={{display:"flex",gap:8}}>
                    <input id="hs-topic" placeholder="Chủ đề muốn được coach..." defaultValue="" style={{flex:1,background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                    <button onClick={()=>{const v=document.getElementById("hs-topic")?.value?.trim();if(v)startHotSeat(v);}} style={{padding:"8px 14px",background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"10px",color:"#FB923C"}}>🎯 BẮT ĐẦU</button>
                  </div>
                )}
                {hotSeatMsgs.length>0&&(
                  <div>
                    <div style={{maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:5,marginBottom:6}}>
                      {hotSeatMsgs.map((m,i)=>{
                        const isU=m.role==="user";
                        return(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start"}}>
                          {!isU&&<span style={{fontFamily:FM,fontSize:"8px",color:m.agentCol||"#FB923C",marginBottom:2}}>{m.agentIcon} {m.agentName}</span>}
                          <div style={{maxWidth:"88%",padding:"8px 12px",borderRadius:isU?"10px 10px 2px 10px":"10px 10px 10px 2px",background:isU?"rgba(251,146,60,0.08)":m.isSummary?"rgba(52,211,153,0.06)":"rgba(251,146,60,0.04)",border:`1px solid ${isU?"rgba(251,146,60,0.2)":m.isSummary?"rgba(52,211,153,0.2)":"rgba(251,146,60,0.12)"}`,fontSize:12,color:C.txt,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</div>
                        </div>);
                      })}
                      {hotSeatBusy&&<div style={{display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#FB923C",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                      <div ref={hotSeatRef}/>
                    </div>
                    {hotSeatQ<=5&&!hotSeatMsgs.find(m=>m.isSummary)&&(
                      <div style={{display:"flex",gap:8}}>
                        <input value={hotSeatIn} onChange={e=>setHotSeatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&replyHotSeat()} placeholder="Câu trả lời..." style={{flex:1,background:C.s1,border:"1px solid rgba(251,146,60,0.25)",borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                        <button onClick={replyHotSeat} disabled={hotSeatBusy||!hotSeatIn.trim()} style={{padding:"8px 14px",background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.35)",borderRadius:6,cursor:hotSeatBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#FB923C"}}>TRẢ LỜI →</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Consensus Meter */}
            {consensusData&&(
              <div style={{flexShrink:0,marginBottom:8,background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"10px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:0}}>🤝 CONSENSUS METER</p>
                  <div style={{flex:1,height:5,background:C.bd,borderRadius:3,overflow:"hidden",minWidth:60}}><div style={{height:"100%",width:`${consensusData.score}%`,background:"linear-gradient(90deg,#F87171,#34D399)",borderRadius:3}}/></div>
                  <span style={{fontFamily:FM,fontSize:"13px",fontWeight:700,color:consensusData.score>70?"#34D399":consensusData.score>40?"#FB923C":"#F87171"}}>{consensusData.score}%</span>
                  <button onClick={()=>setConsensusData(null)} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"transparent",border:`1px solid ${C.bd}`,padding:"2px 7px",borderRadius:3,cursor:"pointer"}}>×</button>
                </div>
                <p style={{fontSize:12,color:C.txt,margin:"0 0 5px"}}>{consensusData.summary}</p>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  {consensusData.agree?.length>0&&<div><p style={{fontFamily:FM,fontSize:"8px",color:"#34D399",margin:"0 0 3px"}}>ĐỒNG THUẬN</p>{consensusData.agree.map((a,i)=><p key={i} style={{fontSize:11,color:C.fa,margin:"0 0 2px"}}>✓ {a}</p>)}</div>}
                  {consensusData.disagree?.length>0&&<div><p style={{fontFamily:FM,fontSize:"8px",color:"#F87171",margin:"0 0 3px"}}>BẤT ĐỒNG</p>{consensusData.disagree.map((a,i)=><p key={i} style={{fontSize:11,color:C.fa,margin:"0 0 2px"}}>✗ {a}</p>)}</div>}
                </div>
              </div>
            )}

            {/* Compare Mode */}
            {compareMode&&(
              <div style={{flexShrink:0,marginBottom:8,background:`${C.pur}08`,border:`1px solid ${C.pur}25`,borderRadius:10,padding:"12px 16px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:C.pur,letterSpacing:"2px",margin:"0 0 8px"}}>🔀 COMPARE MODE — HỎI 1 CÂU, NHIỀU AGENTS TRẢ LỜI</p>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                  {AGENTS.filter(a=>a.tier==="S"||a.tier==="A").map(a=>{const sel=compareAgents.includes(a.id);return(
                    <button key={a.id} onClick={()=>setCompareAgents(p=>sel?p.filter(x=>x!==a.id):[...p,a.id])}
                      style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:sel?`${a.col}14`:"transparent",border:`1px solid ${sel?a.col:C.bd}`,borderRadius:5,cursor:"pointer",fontFamily:FM,fontSize:"9px",color:sel?a.col:C.mu}}>
                      {a.icon} {a.n} {sel&&"✓"}
                    </button>
                  );})}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={compareQ} onChange={e=>setCompareQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runCompare()} placeholder={`Hỏi ${compareAgents.length} agents cùng lúc...`} style={{flex:1,background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                  <button onClick={runCompare} disabled={compareBusy||!compareQ.trim()||compareAgents.length<2} style={{padding:"8px 14px",background:compareBusy?"transparent":`${C.pur}15`,border:`1px solid ${C.pur}40`,borderRadius:6,cursor:compareBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:C.pur}}>{compareBusy?"⏳ Đang hỏi...":"🔀 SO SÁNH"}</button>
                </div>
                {Object.keys(compareRes).length>0&&(
                  <div style={{marginTop:10,display:"grid",gridTemplateColumns:`repeat(${Math.min(compareAgents.length,3)},1fr)`,gap:8}}>
                    {compareAgents.map(agId=>{
                      const ag=AGENTS.find(a=>a.id===agId),res=compareRes[agId];if(!ag)return null;
                      return(<div key={agId} style={{background:`${ag.col}06`,border:`1px solid ${ag.col}20`,borderRadius:8,padding:"10px 12px"}}>
                        <p style={{fontFamily:FM,fontSize:"9px",color:ag.col,margin:"0 0 5px"}}>{ag.icon} {ag.n}</p>
                        {res?<p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.7}}>{res}</p>:<div style={{display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:ag.col,animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div>}
                      </div>);
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Council chat */}
            <Bubbles msgs={cMsgs} busy={cBusy} botRef={cRef} acol={C.gold} onStar={starMessage} starredIds={starredIds} onRate={rateMessage} ratings={ratings}/>
            {cMsgs.length===0&&!cBusy&&(
              <div style={{flexShrink:0,padding:"10px 0",textAlign:"center"}}>
                <p style={{fontSize:12,color:C.mu,margin:"0 0 8px"}}>Hội đồng {panel.length} cố vấn sẵn sàng.</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
                  {["Tôi nên ưu tiên gì hôm nay?","Review kế hoạch kinh doanh","Tôi đang mắc sai lầm nào?","Làm sao scale nhanh hơn?"].map(q=>(
                    <button key={q} onClick={()=>setCIn(q)} style={{fontFamily:FM,fontSize:"10px",color:C.gold,background:C.gD,border:`1px solid ${C.gold}22`,padding:"5px 12px",borderRadius:4,cursor:"pointer"}}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            <InputBar val={cIn} set={setCIn} onSend={sendCouncil} busy={cBusy} ph={panel.length===0?"Chọn ít nhất 1 agent...":"Hỏi Hội Đồng… (Enter gửi)"} col={C.gold} memHint={useRAG&&mems.length>0?mems.length+" memories":""}/>
          </div>
        )}

        {/* ════ CHAT ════ */}
        {tab==="chat"&&(
          <ChatTab sessions={sessions} activeSessId={activeSessId} sessMessages={sessMessages}
            sessReady={sessReady} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
            searchQ={searchQ} setSearchQ={setSearchQ} pickAgent={pickAgent} setPickAgent={setPickAgent}
            editSessId={editSessId} setEditSessId={setEditSessId} editTitle={editTitle} setEditTitle={setEditTitle}
            hoverSessId={hoverSessId} setHoverSessId={setHoverSessId}
            onStar={starMessage} starredIds={starredIds} onRate={rateMessage} ratings={ratings}
            sessIntel={sessIntel}
            activeSess={activeSess} activeMsgs={activeMsgs} activeAg={activeAg}
            newSession={newSession} switchSession={switchSession} deleteSession={deleteSession} renameSession={renameSession}
            sessUpdateCache={sessUpdateCache} sessUpdateIndex={sessUpdateIndex}
            aBusy={aBusy} aRef={aRef} aIn={aIn} setAIn={setAIn} sendAgent={sendAgent}
            useRAG={useRAG} mems={mems}/>
        )}

        {/* ════ MEMORY ════ */}
        {tab==="memory"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:isMobile?"10px 12px 80px":"14px 20px 40px",boxSizing:"border-box"}}>
            {/* Agent Long-term Memory */}
            <div style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#F59E0B",letterSpacing:"2px",margin:"0 0 3px"}}>🧠 AGENT LONG-TERM MEMORY</p>
                  <p style={{fontSize:12,color:C.mu,margin:0}}>Ký ức học tự động từ chat · {Object.values(agentMems).reduce((s,a)=>s+(a?.length||0),0)} memories</p>
                </div>
                <button onClick={()=>setAutoMemory(p=>{const n=!p;try{localStorage.setItem("empire_auto_mem",JSON.stringify(n));}catch{}return n;})}
                  style={{fontFamily:FM,fontSize:"9px",padding:"5px 12px",borderRadius:5,cursor:"pointer",background:autoMemory?"rgba(245,158,11,0.12)":"transparent",border:`1px solid ${autoMemory?"#F59E0B":C.bd}`,color:autoMemory?"#F59E0B":C.mu}}>
                  {autoMemory?"🟡 AUTO ON":"⚫ AUTO OFF"}
                </button>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                {AGENTS.filter(a=>agentMems[a.id]?.length>0).map(ag=>(
                  <div key={ag.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",background:`${ag.col}10`,border:`1px solid ${ag.col}30`,borderRadius:5}}>
                    <span style={{fontSize:10}}>{ag.icon}</span>
                    <span style={{fontFamily:FM,fontSize:"8px",color:ag.col}}>{ag.n}</span>
                    <span style={{fontFamily:FM,fontSize:"8px",background:`${ag.col}20`,color:ag.col,padding:"0 4px",borderRadius:3}}>{agentMems[ag.id].length}</span>
                  </div>
                ))}
                {Object.values(agentMems).every(a=>!a?.length)&&<p style={{fontSize:11,color:C.mu,margin:0}}>Chưa có ký ức. Chat với agents để bắt đầu.</p>}
              </div>
              {AGENTS.filter(a=>agentMems[a.id]?.length>0).slice(0,3).map(ag=>(
                <div key={ag.id} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px",marginBottom:8}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:ag.col,margin:"0 0 6px"}}>{ag.icon} {ag.n} · {agentMems[ag.id].length} memories</p>
                  {agentMems[ag.id].slice(-5).map(m=>(
                    <div key={m.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                        <span style={{color:m.importance===3?"#F59E0B":"#60A5FA",fontSize:9,flexShrink:0,marginTop:3}}>{m.importance===3?"⭐":"●"}</span>
                        <p style={{fontSize:11,color:C.fa,margin:0,lineHeight:1.6}}>{m.text}</p>
                      </div>
                      <button onClick={()=>delAgentMem(ag.id,m.id)} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,flexShrink:0}}>×</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* RAG Memory */}
            <div style={{background:C.purD,border:`1px solid ${C.pur}20`,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.pur,letterSpacing:"2px",margin:"0 0 4px"}}>🧠 NEURAL MEMORY + RAG SYSTEM</p>
                  <p style={{fontSize:12,color:C.txt,margin:"0 0 8px",lineHeight:1.65,maxWidth:480}}>Memories được inject vào context. Hội Đồng sẽ nhớ và tham chiếu lịch sử của bạn.</p>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontFamily:FM,fontSize:"10px",color:C.pur}}>{mems.length} memories</span>
                    <button onClick={()=>setUseRAG(p=>!p)} style={{fontFamily:FM,fontSize:"9px",color:useRAG?C.pur:C.mu,background:useRAG?C.purD:"transparent",border:`1px solid ${useRAG?C.pur:C.bd}`,padding:"3px 10px",borderRadius:3,cursor:"pointer",letterSpacing:"1px"}}>RAG {useRAG?"ACTIVE ✓":"PAUSED"}</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Memory */}
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.pur,margin:"0 0 8px",letterSpacing:"1.5px"}}>➕ THÊM MEMORY</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                {["general","finance","strategy","tech","health","language","empire"].map(tag=>(
                  <button key={tag} onClick={()=>setMemTag(tag)} style={{fontFamily:FM,fontSize:"9px",color:memTag===tag?C.pur:C.mu,background:memTag===tag?C.purD:"transparent",border:`1px solid ${memTag===tag?C.pur:C.bd}`,padding:"3px 10px",borderRadius:3,cursor:"pointer"}}>{tag}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <textarea value={memIn} onChange={e=>setMemIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addMem();}}} placeholder='Nhập fact/insight quan trọng...' rows={2}
                  style={{flex:1,background:"rgba(0,0,0,0.3)",border:`1px solid ${C.pur}28`,borderRadius:7,padding:"9px 12px",color:C.txt,fontFamily:F,fontSize:12,resize:"none",lineHeight:1.6,outline:"none"}}/>
                <button onClick={addMem} disabled={!memIn.trim()} style={{padding:"9px 18px",background:memIn.trim()?C.purD:"rgba(255,255,255,0.03)",border:`1px solid ${memIn.trim()?C.pur:C.bd}`,borderRadius:7,color:memIn.trim()?C.pur:C.mu,fontFamily:FM,fontSize:"10px",cursor:memIn.trim()?"pointer":"not-allowed",letterSpacing:"1px",flexShrink:0}}>LƯU</button>
              </div>
            </div>

            {/* Memory list */}
            <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontFamily:FM,fontSize:"8px",color:C.fa}}>LỌC:</span>
              {["all","general","finance","strategy","tech","health","language","empire","council","auto","starred"].map(f=>(
                <button key={f} onClick={()=>setMemFilter(f)} style={{fontFamily:FM,fontSize:"9px",color:memFilter===f?C.pur:C.mu,background:memFilter===f?C.purD:"transparent",border:`1px solid ${memFilter===f?C.pur:C.bd}`,padding:"2px 9px",borderRadius:3,cursor:"pointer"}}>{f}</button>
              ))}
              {mems.length>0&&<button onClick={()=>{if(window.confirm("Xóa tất cả memories?"))setMems([]);saveMems([]);}} style={{fontFamily:FM,fontSize:"9px",color:C.red,background:C.redD,border:`1px solid ${C.red}22`,padding:"2px 10px",borderRadius:3,cursor:"pointer",marginLeft:"auto"}}>XÓA HẾT</button>}
            </div>
            {!memReady&&<p style={{fontSize:12,color:C.mu,textAlign:"center",padding:"20px"}}>Đang tải…</p>}
            {memReady&&mems.length===0&&(
              <div style={{textAlign:"center",padding:"30px",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10}}>
                <p style={{fontSize:12,color:C.mu,margin:"10px 0 6px"}}>Chưa có memories. Hãy thêm những điều quan trọng về bạn.</p>
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

        {/* ════ ANALYTICS ════ */}
        {tab==="analytics"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"16px 20px",boxSizing:"border-box"}}>
            {/* Performance Leaderboard */}
            {(()=>{
              const ranked=AGENTS.map(ag=>({...ag,r:ratings[ag.id]})).filter(ag=>ag.r&&ag.r.count>0).sort((a,b)=>parseFloat(b.r.avg)-parseFloat(a.r.avg));
              if(ranked.length===0)return(
                <div style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 4px"}}>📊 AGENT PERFORMANCE TRACKER</p>
                  <p style={{fontSize:12,color:C.mu,margin:0}}>Chưa có rating. Hover lên response trong Chat → bấm ⭐ để rate 1-5 sao.</p>
                </div>
              );
              const best=ranked[0];
              return(
                <div style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 3px"}}>📊 AGENT PERFORMANCE LEADERBOARD</p>
                      <p style={{fontSize:12,color:C.mu,margin:0}}>{ranked.length} agents rated · Hover response → ⭐ để rate</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:"#34D399",margin:"0 0 2px"}}>🏆 BEST</p>
                      <p style={{fontSize:13,fontWeight:700,color:best.col,margin:0}}>{best.icon} {best.n} · {best.r.avg}⭐</p>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {ranked.map((ag,i)=>{
                      const pct=(parseFloat(ag.r.avg)/5*100).toFixed(0);
                      return(<div key={ag.id} style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontFamily:FM,fontSize:"9px",color:i===0?"#F59E0B":i===1?"#94A3B8":i===2?"#CD7F32":C.mu,width:16,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}</span>
                        <span style={{fontSize:13,width:20}}>{ag.icon}</span>
                        <span style={{fontSize:12,color:ag.col,width:90,fontWeight:600}}>{ag.n}</span>
                        <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:`linear-gradient(90deg,${ag.col}80,${ag.col})`,borderRadius:3,transition:"width .5s"}}/>
                        </div>
                        <span style={{fontFamily:FM,fontSize:"9px",color:ag.col,width:32,textAlign:"right"}}>{ag.r.avg}⭐</span>
                        <span style={{fontFamily:FM,fontSize:"8px",color:C.mu,width:36,textAlign:"right"}}>{ag.r.count}x</span>
                      </div>);
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Sub-nav */}
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {[["decisions","📝 Decision Log"],["patterns","🔍 Pattern Insights"],["weekly","📈 Weekly Report"],["agents","🤖 Agent Stats"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setAnalyticView(id)}
                  style={{fontFamily:FM,fontSize:"10px",padding:"5px 14px",borderRadius:5,cursor:"pointer",background:analyticView===id?"rgba(52,211,153,0.12)":"transparent",border:`1px solid ${analyticView===id?"#34D399":C.bd}`,color:analyticView===id?"#34D399":C.mu}}>{lbl}</button>
              ))}
            </div>

            {analyticView==="decisions"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:0}}>DECISION LOG · {decisions.length} decisions</p>
                  <button onClick={()=>setShowDecForm(p=>!p)} style={{fontFamily:FM,fontSize:"10px",color:"#34D399",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",padding:"6px 14px",borderRadius:6,cursor:"pointer"}}>{showDecForm?"✕ HỦY":"+ THÊM DECISION"}</button>
                </div>
                {showDecForm&&(
                  <div style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:10,padding:"16px",marginBottom:14}}>
                    {[["title","Tiêu đề *","text"],["context","Bối cảnh","textarea"],["options","Các lựa chọn","textarea"],["outcome","Kết quả mong đợi","text"],["tags","Tags (phân cách bằng phẩy)","text"]].map(([f,ph,type])=>(
                      <div key={f} style={{marginBottom:8}}>
                        {type==="textarea"
                          ?<textarea value={decIn[f]} onChange={e=>setDecIn(p=>({...p,[f]:e.target.value}))} placeholder={ph} rows={2} style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none",resize:"vertical"}}/>
                          :<input value={decIn[f]} onChange={e=>setDecIn(p=>({...p,[f]:e.target.value}))} placeholder={ph} style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:6,padding:"8px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                        }
                      </div>
                    ))}
                    <button onClick={addDecision} style={{padding:"8px 20px",background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.4)",borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399"}}>LƯU ✓</button>
                  </div>
                )}
                {decisions.length===0&&!showDecForm&&<div style={{textAlign:"center",padding:"40px 0",color:C.mu}}><p style={{fontSize:28,margin:"0 0 10px"}}>📝</p><p style={{fontSize:12}}>Chưa có decision nào.</p></div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {decisions.map(d=>(
                    <div key={d.id} style={{background:C.s1,border:`1px solid ${d.status==="resolved"?"rgba(52,211,153,0.2)":C.bd}`,borderRadius:9,padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:600,color:d.status==="resolved"?"#34D399":C.txt}}>{d.title}</span>
                            <span style={{fontFamily:FM,fontSize:"8px",padding:"2px 7px",borderRadius:3,background:d.status==="resolved"?"rgba(52,211,153,0.12)":"rgba(251,146,60,0.1)",color:d.status==="resolved"?"#34D399":"#FB923C"}}>{d.status==="resolved"?"✓ RESOLVED":"⏳ OPEN"}</span>
                            <span style={{fontFamily:FM,fontSize:"8px",color:C.mu,marginLeft:"auto"}}>{new Date(d.ts).toLocaleDateString("vi-VN")}</span>
                          </div>
                          {d.context&&<p style={{fontSize:12,color:C.fa,margin:"0 0 4px",lineHeight:1.6}}>{d.context}</p>}
                          {d.outcome&&<p style={{fontSize:11,color:"#34D399",margin:"0 0 6px"}}>🎯 {d.outcome}</p>}
                          {d.tags?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{d.tags.map(t=><span key={t} style={{fontFamily:FM,fontSize:"8px",padding:"1px 6px",borderRadius:3,background:"rgba(167,139,250,0.1)",color:C.pur}}>{t}</span>)}</div>}
                        </div>
                        <div style={{display:"flex",gap:5,flexShrink:0}}>
                          {d.status!=="resolved"&&<button onClick={()=>updateDecisionStatus(d.id,"resolved")} style={{fontFamily:FM,fontSize:"8px",padding:"3px 8px",borderRadius:3,cursor:"pointer",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",color:"#34D399"}}>✓</button>}
                          <button onClick={()=>deleteDecision(d.id)} style={{fontFamily:FM,fontSize:"8px",padding:"3px 8px",borderRadius:3,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyticView==="patterns"&&(
              <div>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 4px"}}>🔍 PATTERN INSIGHTS</p>
                <p style={{fontSize:12,color:C.fa,margin:"0 0 12px"}}>AI phân tích {mems.length} memories + {decisions.length} decisions → blind spots & patterns</p>
                <button onClick={runPatternInsights} disabled={patternBusy||mems.length<3}
                  style={{padding:"8px 20px",background:patternBusy?"transparent":"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",borderRadius:6,cursor:patternBusy||mems.length<3?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399",marginBottom:14}}>
                  {patternBusy?"⏳ Đang phân tích...":mems.length<3?"Cần ít nhất 3 memories":"🔍 PHÂN TÍCH NGAY"}
                </button>
                {patternRes&&<div style={{background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:10,padding:"18px 20px"}}><Md text={patternRes} accent="#34D399"/></div>}
              </div>
            )}

            {analyticView==="weekly"&&(
              <div>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 4px"}}>📈 WEEKLY REPORT</p>
                <p style={{fontSize:12,color:C.fa,margin:"0 0 12px"}}>Tổng kết 7 ngày qua</p>
                <button onClick={runWeeklyReport} disabled={weeklyBusy}
                  style={{padding:"8px 20px",background:weeklyBusy?"transparent":"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",borderRadius:6,cursor:weeklyBusy?"not-allowed":"pointer",fontFamily:FM,fontSize:"10px",color:"#34D399",marginBottom:14}}>
                  {weeklyBusy?"⏳ Đang tổng hợp...":"📈 TẠO WEEKLY REPORT"}
                </button>
                {weeklyRes&&<div style={{background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:10,padding:"18px 20px"}}><Md text={weeklyRes} accent="#34D399"/></div>}
              </div>
            )}

            {analyticView==="agents"&&(()=>{
              const idx=sessions; // use state directly
              const counts={};
              (Array.isArray(idx)?idx:[]).forEach(s=>{counts[s.agId]=(counts[s.agId]||0)+1;});
              const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
              const total=sorted.reduce((s,[,c])=>s+c,0);
              return(
                <div>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 12px"}}>🤖 AGENT USAGE STATS</p>
                  {sorted.length===0&&<div style={{textAlign:"center",padding:"30px",color:C.mu}}><p style={{fontSize:28,margin:"0 0 8px"}}>🤖</p><p>Chưa có data — hãy chat với agents!</p></div>}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {sorted.map(([agId,cnt],i)=>{
                      const ag=AGENTS.find(a=>a.id===agId);if(!ag)return null;
                      const pct=total>0?Math.round(cnt/total*100):0;
                      return(<div key={agId} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontSize:16}}>{ag.icon}</span>
                          <span style={{fontSize:13,fontWeight:600,color:ag.col}}>{ag.n}</span>
                          <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>{ag.role}</span>
                          <span style={{fontFamily:FM,fontSize:"11px",color:ag.col,marginLeft:"auto",fontWeight:700}}>{cnt} chats</span>
                          <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>{pct}%</span>
                        </div>
                        <div style={{height:4,background:C.bd,borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${ag.col},${ag.col}88)`,borderRadius:2}}/>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ DAILY ════ */}
        {tab==="daily"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>
            {/* Daily Briefing */}
            <div style={{background:"rgba(232,197,71,0.05)",border:"1px solid rgba(232,197,71,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:briefing?12:0}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"2px",margin:"0 0 2px"}}>⚡ DAILY BRIEFING — HỘI ĐỒNG CỐ VẤN</p>
                  <p style={{fontSize:12,color:C.mu,margin:0}}>{briefing?briefing.date:"Nhận insights cá nhân từ 6 cố vấn mỗi sáng"}</p>
                </div>
                <button onClick={generateBriefing} disabled={briefingBusy}
                  style={{fontFamily:FM,fontSize:"9px",padding:"6px 14px",borderRadius:6,cursor:"pointer",background:briefingBusy?"transparent":"rgba(232,197,71,0.12)",border:"1px solid rgba(232,197,71,0.4)",color:C.gold,opacity:briefingBusy?0.5:1,whiteSpace:"nowrap",flexShrink:0}}>
                  {briefingBusy?"⏳ Đang tổng hợp...":"🌅 Tạo Briefing"}
                </button>
              </div>
              {briefing&&(
                <div>
                  {briefing.synthesis&&<div style={{background:"rgba(232,197,71,0.08)",border:"1px solid rgba(232,197,71,0.25)",borderRadius:8,padding:"10px 14px",marginBottom:10}}><p style={{fontFamily:FM,fontSize:"8px",color:C.gold,letterSpacing:"2px",margin:"0 0 6px"}}>🎯 3 VIỆC ƯU TIÊN HÔM NAY</p><p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{briefing.synthesis}</p></div>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
                    {briefing.agents.map(ag=>(
                      <div key={ag.agId} style={{background:C.s1,border:`1px solid ${ag.agCol}22`,borderRadius:8,padding:"10px 12px"}}>
                        <p style={{fontFamily:FM,fontSize:"9px",color:ag.agCol,margin:"0 0 6px"}}>{ag.agIcon} {ag.agName.toUpperCase()}</p>
                        <p style={{fontSize:11,color:C.fa,margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ag.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule progress */}
            <div style={{background:C.grnD,border:`1px solid ${C.grn}20`,borderRadius:10,padding:"13px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.grn,letterSpacing:"2px",margin:"0 0 2px",textTransform:"uppercase"}}>Lịch ngày · {dayStr} {dateStr}</p>
                  <p style={{fontSize:12,color:C.txt,margin:0}}>{scDone.size===SCHED.length?"🔥 Ngày hoàn hảo!":scDone.size===0?"Bắt đầu từ block đầu tiên.":`${scDone.size}/${SCHED.length} blocks xong`}</p>
                </div>
                <p style={{fontFamily:FM,fontSize:24,color:C.grn,margin:0,fontWeight:800}}>{scPct}%</p>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2}}><div style={{width:`${scPct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${C.grn},${C.gold})`,transition:"width .4s"}}/></div>
            </div>

            {/* Schedule blocks */}
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {SCHED.map((blk,i)=>{
                const done=scDone.has(blk.id),isRest=["rest","free","sleep"].includes(blk.c),isCurr=isCurrentBlock(blk,i),col=blk.col;
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
            {/* Provider Settings */}
            <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showProvSettings?14:0}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🔌</span>
                  <div>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 3px",letterSpacing:"2px"}}>AI PROVIDER SETTINGS</p>
                    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                      {PROVIDER_LIST.map(p=>{const isActive=activeProviderId===p.id,hasKey=p.id==="claude"||!!apiKeys[p.id];return(
                        <span key={p.id} style={{fontFamily:FM,fontSize:"9px",color:isActive?p.color:C.fa,background:isActive?`${p.color}14`:"transparent",border:`1px solid ${isActive?p.color:C.bd}`,padding:"2px 8px",borderRadius:10,cursor:"pointer"}} onClick={()=>setActiveProviderId(p.id)}>
                          {p.icon} {p.name.split(" ")[1]||p.name} {hasKey?"✓":""}
                        </span>
                      );})}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setShowProvSettings(p=>!p)} style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.bd}`,padding:"5px 12px",borderRadius:5,cursor:"pointer",letterSpacing:"1px",flexShrink:0}}>{showProvSettings?"ẨN ▲":"CẤU HÌNH ▼"}</button>
              </div>
              {showProvSettings&&(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {PROVIDER_LIST.map(p=>{
                    const isExpanded=expandedProv===p.id,curModel=providerModels[p.id]||p.defaultModel,hasKey=p.id==="claude"||!!apiKeys[p.id],isActive=activeProviderId===p.id;
                    return(
                      <div key={p.id} style={{background:"rgba(0,0,0,0.25)",border:`1px solid ${isActive?p.color+"40":C.bd}`,borderRadius:8,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer"}} onClick={()=>setExpandedProv(isExpanded?null:p.id)}>
                          <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                              <p style={{fontFamily:FM,fontSize:"11px",fontWeight:700,color:isActive?p.color:"#fff",margin:0}}>{p.name}</p>
                              {isActive&&<span style={{fontFamily:FM,fontSize:"8px",color:p.color,background:`${p.color}18`,border:`1px solid ${p.color}30`,padding:"1px 7px",borderRadius:10}}>Chat 1:1 ✓</span>}
                              <span style={{fontFamily:FM,fontSize:"8px",color:hasKey?C.grn:C.org,background:hasKey?`${C.grn}10`:`${C.org}10`,border:`1px solid ${hasKey?C.grn:C.org}25`,padding:"1px 7px",borderRadius:10}}>{hasKey?"Key OK ✓":"Chưa có key"}</span>
                            </div>
                            <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"2px 0 0"}}>Model: <span style={{color:p.color}}>{p.models.find(m=>m.id===curModel)?.label||curModel}</span></p>
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                            <button onClick={e=>{e.stopPropagation();setActiveProviderId(p.id);}} style={{fontFamily:FM,fontSize:"9px",color:isActive?p.color:C.mu,background:isActive?`${p.color}14`:"transparent",border:`1px solid ${isActive?p.color:C.bd}`,padding:"4px 10px",borderRadius:4,cursor:"pointer"}}>{isActive?"Đang dùng ✓":"Dùng cho Chat"}</button>
                            <span style={{color:C.fa,fontSize:11}}>{isExpanded?"▲":"▼"}</span>
                          </div>
                        </div>
                        {isExpanded&&(
                          <div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.bd}`}}>
                            <div style={{marginTop:10}}>
                              <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px",textTransform:"uppercase"}}>API KEY {p.id==="claude"?"(tuỳ chọn)":"(bắt buộc)"}</p>
                              <input type="password" value={apiKeys[p.id]||""} onChange={e=>setApiKeys(prev=>({...prev,[p.id]:e.target.value}))} placeholder={p.keyPlaceholder}
                                style={{width:"100%",boxSizing:"border-box",background:"rgba(0,0,0,0.4)",border:`1px solid ${p.color}30`,borderRadius:5,padding:"8px 11px",color:C.txt,fontFamily:FM,fontSize:"10px",outline:"none"}}/>
                              <p style={{fontFamily:FM,fontSize:"8px",color:`${p.color}70`,margin:"5px 0 0"}}>📎 {p.keyHint}</p>
                            </div>
                            <div style={{marginTop:10}}>
                              <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 5px",letterSpacing:"1px"}}>MODEL</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {p.models.map(m=>{const sel=curModel===m.id;return(
                                  <button key={m.id} onClick={()=>setProviderModels(prev=>({...prev,[p.id]:m.id}))}
                                    style={{display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"7px 11px",background:sel?`${p.color}14`:"rgba(255,255,255,0.03)",border:`1px solid ${sel?p.color:C.bd}`,borderRadius:6,cursor:"pointer",minWidth:130}}>
                                    <span style={{fontFamily:FM,fontSize:"10px",color:sel?p.color:"#fff",fontWeight:sel?700:400}}>{m.label} {sel?"✓":""}</span>
                                    <span style={{fontFamily:FM,fontSize:"8px",color:C.mu,marginTop:2}}>{m.note}</span>
                                  </button>
                                );})}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Notifications config */}
            <div style={{background:"rgba(232,197,71,0.04)",border:"1px solid rgba(232,197,71,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"2px",margin:"0 0 8px"}}>🔔 SMART NOTIFICATIONS (TELEGRAM)</p>
              <p style={{fontSize:12,color:C.mu,margin:"0 0 10px",lineHeight:1.65}}>Telegram bot tự động nhắc theo lịch ngày và gửi Daily Briefing 7h sáng.</p>
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:8}}>
                <p style={{fontFamily:FM,fontSize:"8px",color:C.gold,margin:"0 0 6px",letterSpacing:"1px"}}>DEPLOY TRÊN VPS</p>
                <pre style={{fontFamily:FM,fontSize:"10px",color:"#34D399",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.7}}>
{`# 1. Upload empire-notifications.js lên VPS
# 2. Cài dependencies
cd /home/deploy && npm install node-fetch

# 3. Test chạy thủ công
TELEGRAM_TOKEN=xxx OPENROUTER_KEY=xxx TELEGRAM_CHAT_ID=yyy node empire-notifications.js

# 4. Thêm vào crontab (cron -e)
# Daily Briefing 7h sáng
0 7 * * * /usr/bin/node /home/deploy/empire-briefing.js

# Schedule reminders theo giờ (check mỗi phút)
* * * * * /usr/bin/node /home/deploy/empire-notifications.js >> /var/log/empire-notif.log 2>&1`}
                </pre>
              </div>
              <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:0}}>Bot token: 8592186668:AAEvnGkWCS6TePdQONzZBdlWH9iwKmjwdso · Chat ID: 1750926497</p>
            </div>

            {/* Setup progress */}
            <div style={{background:C.bluD,border:`1px solid ${C.blu}20`,borderRadius:10,padding:"13px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:C.blu,letterSpacing:"2px",margin:"0 0 2px"}}>SETUP CHECKLIST</p>
                  <p style={{fontSize:12,color:C.txt,margin:0}}>{sDone.size===SETUP.length?"🎉 Hoàn thành!":sDone.size===0?"Làm tuần tự từ Bước 1.":`Còn ${SETUP.length-sDone.size} bước nữa.`}</p>
                </div>
                <p style={{fontFamily:FM,fontSize:24,color:C.blu,margin:0,fontWeight:800}}>{sPct}%</p>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2}}><div style={{width:`${sPct}%`,height:"100%",borderRadius:2,background:`linear-gradient(90deg,${C.blu},${C.grn})`,transition:"width .5s"}}/></div>
            </div>
            {[{ph:1,l:"Phase 1 — Infrastructure",c:C.blu},{ph:2,l:"Phase 2 — Accounts & API",c:C.org},{ph:3,l:"Phase 3 — Automation",c:C.pur},{ph:4,l:"Phase 4 — Long-term",c:C.grn}].map(({ph,l,c:phC})=>(
              <div key={ph} style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"0 0 8px"}}><div style={{height:1,flex:1,background:C.bd}}/><span style={{fontFamily:FM,fontSize:"9px",color:phC,letterSpacing:"2px",textTransform:"uppercase"}}>{l}</span><div style={{height:1,flex:1,background:C.bd}}/></div>
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
                            <span style={{fontFamily:FM,fontSize:"8px",color:tc,background:`${tc}14`,border:`1px solid ${tc}25`,padding:"1px 7px",borderRadius:3,textTransform:"uppercase"}}>{step.tag}</span>
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
        {tab==="roadmap"&&yr&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:"14px 20px 40px",boxSizing:"border-box"}}>
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
              <p style={{fontFamily:FM,fontSize:"8px",color:yr.col,margin:"0 0 4px",letterSpacing:"2px",textTransform:"uppercase"}}>BẠN LÀ AI TRONG NĂM NÀY</p>
              <p style={{fontSize:19,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>{yr.icon} {yr.identity}</p>
              <p style={{fontSize:13,color:C.mu,margin:"0 0 10px",lineHeight:1.6,fontStyle:"italic"}}>"{yr.mantra}"</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>{yr.skills.map(s=><span key={s} style={{fontFamily:FM,fontSize:"9px",color:yr.col,background:`${yr.col}14`,border:`1px solid ${yr.col}28`,padding:"2px 9px",borderRadius:3}}>{s}</span>)}</div>
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {[["owns","⚙️ Empire Sở Hữu"],["quarters","📋 Kế Hoạch Quý"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setYrView(v)} style={{padding:"7px 16px",background:yrView===v?`${yr.col}14`:"rgba(255,255,255,0.02)",border:`1px solid ${yrView===v?yr.col:C.bd}`,borderRadius:6,cursor:"pointer",fontFamily:FM,fontSize:"9px",color:yrView===v?yr.col:C.mu,letterSpacing:"1px",textTransform:"uppercase"}}>{l}</button>
                ))}
              </div>
              {yrView==="owns"&&(
                <div>
                  <p style={{fontFamily:FM,fontSize:"8px",color:yr.col,margin:"0 0 8px",letterSpacing:"1.5px"}}>EMPIRE SẼ CÓ</p>
                  {yr.owns.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:yr.col,flexShrink:0,marginTop:6}}/>
                      <p style={{fontSize:12,color:C.txt,margin:0,lineHeight:1.65}}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
              {yrView==="quarters"&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
                  {yr.quarters.map(q=>(
                    <div key={q.q} style={{background:C.s1,border:`1px solid ${yr.col}20`,borderRadius:9,padding:"14px 15px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
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
            </div>
          </div>
        )}

        {/* ════ KNOWLEDGE BASE ════ */}
        {tab==="knowledge"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",maxWidth:960,width:"100%",margin:"0 auto",padding:"0 20px",boxSizing:"border-box",overflowY:"auto"}}>
            <div style={{padding:"16px 0 10px",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:14}}>
                <div>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#F59E0B",letterSpacing:"2px",margin:"0 0 3px"}}>📚 KNOWLEDGE BASE · {kbTotal} tài liệu</p>
                  <p style={{fontSize:13,color:C.txt,margin:0}}>Tài liệu bổ sung cho từng Agent — Agent tự động học khi trả lời</p>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setKbView("browse")} style={{fontFamily:FM,fontSize:"9px",padding:"5px 14px",borderRadius:5,cursor:"pointer",background:kbView==="browse"?"rgba(245,158,11,0.15)":"transparent",border:`1px solid ${kbView==="browse"?"#F59E0B":C.bd}`,color:kbView==="browse"?"#F59E0B":C.mu}}>📖 Xem</button>
                  <button onClick={()=>setKbView("add")} style={{fontFamily:FM,fontSize:"9px",padding:"5px 14px",borderRadius:5,cursor:"pointer",background:kbView==="add"?"rgba(245,158,11,0.15)":"transparent",border:`1px solid ${kbView==="add"?"#F59E0B":C.bd}`,color:kbView==="add"?"#F59E0B":C.mu}}>➕ Thêm</button>
                </div>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                {AGENTS.filter(a=>a.tier==="S"||a.tier==="A").map(a=>{const count=kb[a.id]?.length||0,sel=kbAgent===a.id;return(
                  <button key={a.id} onClick={()=>setKbAgent(a.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:sel?`${a.col}14`:"transparent",border:`1px solid ${sel?a.col:C.bd}`,borderRadius:6,cursor:"pointer"}}>
                    <span style={{fontSize:11}}>{a.icon}</span>
                    <span style={{fontFamily:FM,fontSize:"9px",color:sel?a.col:C.mu}}>{a.n}</span>
                    {count>0&&<span style={{fontFamily:FM,fontSize:"8px",background:`${a.col}22`,color:a.col,padding:"0 5px",borderRadius:8}}>{count}</span>}
                  </button>
                );})}
              </div>
            </div>
            {kbView==="add"&&(
              <div style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"16px 18px",marginBottom:14,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <p style={{fontFamily:FM,fontSize:"9px",color:"#F59E0B",letterSpacing:"2px",margin:0}}>THÊM TÀI LIỆU CHO {AGENTS.find(a=>a.id===kbAgent)?.n?.toUpperCase()||kbAgent.toUpperCase()}</p>
                  <div style={{display:"flex",gap:4}}>
                    {[["manual","✏️ Thủ công"],["url","🔗 Import URL"]].map(([m,lbl])=>(
                      <button key={m} onClick={()=>setKbAddMode(m)} style={{fontFamily:FM,fontSize:"8px",padding:"3px 10px",borderRadius:4,cursor:"pointer",background:kbAddMode===m?"rgba(245,158,11,0.15)":"transparent",border:`1px solid ${kbAddMode===m?"#F59E0B":C.bd}`,color:kbAddMode===m?"#F59E0B":C.mu}}>{lbl}</button>
                    ))}
                  </div>
                </div>
                {kbAddMode==="url"&&(
                  <div style={{marginBottom:12}}>
                    <p style={{fontFamily:FM,fontSize:"9px",color:"#3B82F6",margin:"0 0 8px"}}>🔗 PASTE URL — AI sẽ tự extract và tóm tắt</p>
                    <div style={{display:"flex",gap:6}}>
                      <input value={kbUrl} onChange={e=>setKbUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&importFromUrl()} placeholder="https://paulgraham.com/startupideas.html"
                        style={{flex:1,background:C.s1,border:`1px solid ${kbImportErr?"#EF4444":"#3B82F6"}`,borderRadius:7,padding:"9px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none"}}/>
                      <button onClick={importFromUrl} disabled={kbImporting||!kbUrl.trim()} style={{fontFamily:FM,fontSize:"9px",padding:"9px 16px",borderRadius:7,cursor:"pointer",background:kbImporting?"transparent":"rgba(59,130,246,0.15)",border:"1px solid #3B82F6",color:"#3B82F6",opacity:kbImporting?0.5:1,whiteSpace:"nowrap"}}>{kbImporting?"⏳ Đang đọc...":"🔗 Import"}</button>
                    </div>
                    {kbImportErr&&<p style={{fontFamily:FM,fontSize:"9px",color:"#EF4444",margin:"6px 0 0"}}>{kbImportErr}</p>}
                  </div>
                )}
                <input value={kbTitle} onChange={e=>setKbTitle(e.target.value)} placeholder="Tiêu đề tài liệu..." style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:7,padding:"9px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none",marginBottom:8}}/>
                <textarea value={kbInput} onChange={e=>setKbInput(e.target.value)} placeholder="Paste nội dung, insight từ sách, notes cá nhân..." rows={8}
                  style={{width:"100%",boxSizing:"border-box",background:C.s1,border:`1px solid ${C.bd}`,borderRadius:7,padding:"9px 12px",color:C.txt,fontFamily:F,fontSize:12,outline:"none",resize:"vertical",marginBottom:10}}/>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>{setKbTitle("");setKbInput("");setKbUrl("");}} style={{fontFamily:FM,fontSize:"9px",padding:"6px 14px",borderRadius:5,cursor:"pointer",background:"transparent",border:`1px solid ${C.bd}`,color:C.mu}}>Xóa</button>
                  <button onClick={()=>{
                    if(!kbTitle.trim()||!kbInput.trim())return;
                    const entry={id:Date.now().toString(),title:kbTitle.trim(),content:kbInput.trim(),ts:Date.now(),agentId:kbAgent};
                    const updated={...kb,[kbAgent]:[...(kb[kbAgent]||[]),entry]};
                    saveKb(updated);setKbTitle("");setKbInput("");setKbView("browse");
                  }} style={{fontFamily:FM,fontSize:"9px",padding:"6px 16px",borderRadius:5,cursor:"pointer",background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.4)",color:"#F59E0B",fontWeight:700}}>💾 LƯU</button>
                </div>
              </div>
            )}
            {kbView==="browse"&&(()=>{
              const agDocs=kb[kbAgent]||[],agent=AGENTS.find(a=>a.id===kbAgent);
              return agDocs.length===0?(
                <div style={{textAlign:"center",padding:"40px 20px",background:C.s1,borderRadius:10,border:`1px dashed ${C.bd}`}}>
                  <p style={{fontSize:28,margin:"0 0 8px"}}>{agent?.icon||"📚"}</p>
                  <p style={{fontSize:13,color:C.mu,margin:"0 0 12px"}}>{agent?.n} chưa có tài liệu nào.</p>
                  <button onClick={()=>setKbView("add")} style={{fontFamily:FM,fontSize:"9px",padding:"6px 16px",borderRadius:5,cursor:"pointer",background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",color:"#F59E0B"}}>➕ Thêm tài liệu đầu tiên</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {agDocs.map((doc,i)=>(
                    <div key={doc.id} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:9,padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:FM,fontSize:"8px",color:"#F59E0B",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",padding:"1px 7px",borderRadius:3}}>#{i+1}</span>
                          <p style={{fontSize:13,fontWeight:600,color:C.txt,margin:0}}>{doc.title}</p>
                        </div>
                        <button onClick={()=>{const updated={...kb,[kbAgent]:(kb[kbAgent]||[]).filter(d=>d.id!==doc.id)};saveKb(updated);}} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:13,flexShrink:0}}>×</button>
                      </div>
                      <p style={{fontSize:12,color:C.fa,margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{doc.content.slice(0,300)}{doc.content.length>300?"...":""}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}


        {/* ════ FINANCE ════ */}
        {tab==="finance"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:isMobile?"10px 12px 80px":"14px 20px 40px",boxSizing:"border-box"}}>
            {/* Currency + View toggle */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:0}}>💰 FINANCE OS</p>
              <div style={{display:"flex",gap:6}}>
                {["VND","USD"].map(c=><button key={c} onClick={()=>setFinCur(c)}
                  style={{padding:"3px 10px",borderRadius:6,border:"1px solid "+(finCur===c?"#34D399":"#333"),background:finCur===c?"#34D39918":"transparent",color:finCur===c?"#34D399":C.mu,fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>{c}</button>)}
              </div>
            </div>

            {/* Overview KPIs */}
            {(()=>{
              const usd=25000;
              const fmt=n=>finCur==="VND"?new Intl.NumberFormat("vi-VN").format(n)+"đ":"$"+new Intl.NumberFormat("en-US").format(Math.round(n/usd));
              const thisMonth=new Date().toISOString().slice(0,7);
              const monthTxs=finTxs.filter(t=>t.date&&t.date.slice(0,7)===thisMonth);
              const thu=monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0);
              const chi=monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0);
              const tietKiem=thu-chi;
              const totalDebt=finDebts.reduce((s,d)=>s+(d.total-d.paid),0);
              const netWorth=-totalDebt+tietKiem;
              return(
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
                  {[["📈 Thu tháng",fmt(thu),"#34D399"],["📉 Chi tháng",fmt(chi),"#F87171"],["💰 Tiết kiệm",fmt(tietKiem),tietKiem>=0?"#34D399":"#F87171"],["🏦 Net Worth",fmt(netWorth),netWorth>=0?"#34D399":"#F87171"]].map(([l,v,col])=>(
                    <div key={l} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 14px"}}>
                      <p style={{fontFamily:FM,fontSize:"8px",color:C.mu,margin:"0 0 4px"}}>{l}</p>
                      <p style={{fontFamily:FM,fontSize:16,fontWeight:700,color:col,margin:0}}>{v||"0đ"}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Quick Add Transaction */}
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:"#34D399",letterSpacing:"2px",margin:"0 0 10px"}}>⚡ THÊM GIAO DỊCH</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                {["expense","income"].map(tp=>(
                  <button key={tp} onClick={()=>setFinIn(p=>({...p,type:tp}))}
                    style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid "+(finIn.type===tp?(tp==="expense"?"#F87171":"#34D399"):"#333"),background:finIn.type===tp?(tp==="expense"?"#F8717118":"#34D39918"):"transparent",color:finIn.type===tp?(tp==="expense"?"#F87171":"#34D399"):C.mu,fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>
                    {tp==="expense"?"📉 Chi tiêu":"📈 Thu nhập"}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                <input placeholder="Số tiền (VD: 35000)" type="number" value={finIn.amount}
                  onChange={e=>setFinIn(p=>({...p,amount:e.target.value}))}
                  style={{background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"7px 10px",fontSize:12}}/>
                <select value={finIn.cat} onChange={e=>setFinIn(p=>({...p,cat:e.target.value}))}
                  style={{background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"7px 10px",fontSize:12}}>
                  {(finIn.type==="expense"?["Ăn uống","Cafe","Di chuyển","Mua sắm","Học tập","Sức khỏe","Giải trí","Khác"]:["Lương","Freelance","Đầu tư","Khác"]).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:6}}>
                <input placeholder="Ghi chú (VD: Cà phê buổi sáng)" value={finIn.note}
                  onChange={e=>setFinIn(p=>({...p,note:e.target.value}))}
                  style={{flex:1,background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"7px 10px",fontSize:12}}/>
                <input type="date" value={finIn.date} onChange={e=>setFinIn(p=>({...p,date:e.target.value}))}
                  style={{background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"7px 10px",fontSize:12,width:130}}/>
                <button onClick={()=>{
                  if(!finIn.amount) return;
                  const tx={id:`tx_${Date.now()}`,type:finIn.type,amount:Number(finIn.amount),cat:finIn.cat,note:finIn.note,date:finIn.date};
                  saveFinTxs([tx,...finTxs]);
                  setFinIn(p=>({...p,amount:"",note:""}));
                }} style={{padding:"7px 14px",borderRadius:6,background:"#34D399",color:"#000",fontFamily:FM,fontSize:"9px",fontWeight:700,border:"none",cursor:"pointer"}}>+ ADD</button>
              </div>
            </div>

            {/* Debt Tracker */}
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:"#F87171",letterSpacing:"2px",margin:"0 0 10px"}}>💳 TIẾN ĐỘ TRẢ NỢ</p>
              {finDebts.map(d=>{
                const remain=d.total-d.paid;
                const pct=Math.round(d.paid/d.total*100);
                return(
                  <div key={d.id} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#fff",fontWeight:600}}>{d.n}</span>
                      <span style={{fontFamily:FM,fontSize:"9px",color:d.col}}>{pct}% trả được</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3,marginBottom:4}}>
                      <div style={{width:pct+"%",height:"100%",background:`linear-gradient(90deg,${d.col},${d.col}88)`,borderRadius:3,transition:"width .3s"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontFamily:FM,fontSize:"9px",color:"#34D399"}}>Đã trả: {new Intl.NumberFormat("vi-VN").format(d.paid)}đ</span>
                      <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>Còn: {new Intl.NumberFormat("vi-VN").format(remain)}đ</span>
                      <div style={{display:"flex",gap:4}}>
                        <input type="number" placeholder="Trả thêm..." style={{width:90,background:"#111",border:"1px solid #333",borderRadius:5,color:"#fff",padding:"3px 7px",fontSize:11}}
                          id={`debt-pay-${d.id}`}/>
                        <button onClick={()=>{
                          const el=document.getElementById(`debt-pay-${d.id}`);
                          const amt=Number(el?.value)||0;
                          if(!amt) return;
                          const updated=finDebts.map(x=>x.id===d.id?{...x,paid:Math.min(x.total,x.paid+amt)}:x);
                          saveFinDebts(updated);
                          if(el) el.value="";
                        }} style={{padding:"3px 8px",borderRadius:5,background:"#34D39920",border:"1px solid #34D39940",color:"#34D399",fontSize:10,cursor:"pointer"}}>✓</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{borderTop:`1px solid ${C.bd}`,paddingTop:8,marginTop:4}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 2px"}}>TỔNG NỢ</p>
                <p style={{fontFamily:FM,fontSize:20,fontWeight:900,color:"#F87171",margin:0}}>{new Intl.NumberFormat("vi-VN").format(finDebts.reduce((s,d)=>s+(d.total-d.paid),0))}đ</p>
              </div>
            </div>

            {/* Roadmap tự do tài chính */}
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.gold,letterSpacing:"2px",margin:"0 0 10px"}}>🎯 ROADMAP TỰ DO TÀI CHÍNH</p>
              {[
                {n:1,title:"Trả nợ Mẹ 200,000,000đ",sub:"Ưu tiên số 1 · Đang thực hiện",col:"#ef4444",done:false},
                {n:2,title:"Hoàn thành GTV SEO",sub:"Deadline 21/05 · Doanh thu ổn định",col:"#f97316",done:false},
                {n:3,title:"Xây doanh nghiệp AI",sub:"n8n · Julie · Empire Council",col:"#60a5fa",done:false},
                {n:4,title:"$1,000,000 USD tài sản ròng 🏆",sub:"Tự do tài chính hoàn toàn",col:C.gold,done:false},
              ].map((s,i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:i<3?12:0}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:s.done?"#34D399":i===0?"#ef4444":"rgba(255,255,255,0.05)",border:`2px solid ${s.col}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:FM,fontSize:"10px",fontWeight:700,color:s.done?"#000":s.col}}>{s.n}</div>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:s.done?C.mu:"#fff",margin:"0 0 2px"}}>{s.title}</p>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:0}}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            {finTxs.length>0&&(
              <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 14px"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,letterSpacing:"2px",margin:"0 0 10px"}}>📋 GIAO DỊCH GẦN ĐÂY</p>
                {finTxs.slice(0,10).map(t=>(
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.bd}`}}>
                    <div>
                      <p style={{fontSize:12,color:"#fff",margin:"0 0 1px"}}>{t.cat} {t.note&&`· ${t.note}`}</p>
                      <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:0}}>{t.date}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:FM,fontSize:12,fontWeight:700,color:t.type==="income"?"#34D399":"#F87171"}}>
                        {t.type==="income"?"+":"-"}{new Intl.NumberFormat("vi-VN").format(t.amount)}đ
                      </span>
                      <button onClick={()=>saveFinTxs(finTxs.filter(x=>x.id!==t.id))}
                        style={{width:18,height:18,borderRadius:4,background:"rgba(248,113,113,0.1)",border:"none",color:"#F87171",fontSize:10,cursor:"pointer"}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ GOALS / OKR ════ */}
        {tab==="goals"&&(
          <div style={{flex:1,overflowY:"auto",maxWidth:960,width:"100%",margin:"0 auto",padding:isMobile?"10px 12px 80px":"14px 20px 40px",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:"#a78bfa",letterSpacing:"2px",margin:0}}>🎯 OKR & GOALS</p>
              <button onClick={()=>setOkrForm({show:true,obj:"",krs:[""]})}
                style={{padding:"5px 12px",borderRadius:6,background:"#a78bfa20",border:"1px solid #a78bfa40",color:"#a78bfa",fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>+ OKR MỚI</button>
            </div>

            {okrForm.show&&(
              <div style={{background:C.s1,border:"1px solid #a78bfa40",borderRadius:10,padding:"14px",marginBottom:14,animation:"fadeUp .2s ease"}}>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#a78bfa",margin:"0 0 8px"}}>OBJECTIVE</p>
                <input placeholder="VD: Đạt 50M doanh thu Q2 2026" value={okrForm.obj}
                  onChange={e=>setOkrForm(p=>({...p,obj:e.target.value}))}
                  style={{width:"100%",background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"8px 10px",fontSize:12,marginBottom:10,boxSizing:"border-box"}}/>
                <p style={{fontFamily:FM,fontSize:"9px",color:"#a78bfa",margin:"0 0 6px"}}>KEY RESULTS</p>
                {okrForm.krs.map((kr,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
                    <input placeholder={`KR${i+1}: VD: Ký 3 khách mới`} value={kr}
                      onChange={e=>{const n=[...okrForm.krs];n[i]=e.target.value;setOkrForm(p=>({...p,krs:n}));}}
                      style={{flex:1,background:"#111",border:"1px solid #333",borderRadius:6,color:"#fff",padding:"7px 10px",fontSize:12}}/>
                    {i>0&&<button onClick={()=>{const n=okrForm.krs.filter((_,j)=>j!==i);setOkrForm(p=>({...p,krs:n}));}}
                      style={{width:28,borderRadius:5,background:"rgba(248,113,113,0.1)",border:"none",color:"#F87171",cursor:"pointer"}}>×</button>}
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>setOkrForm(p=>({...p,krs:[...p.krs,""]}))}
                    style={{padding:"5px 10px",borderRadius:5,background:"#a78bfa15",border:"1px solid #a78bfa30",color:"#a78bfa",fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>+ KR</button>
                  <button onClick={()=>{
                    if(!okrForm.obj.trim()) return;
                    const newOkr={id:`okr_${Date.now()}`,obj:okrForm.obj,krs:okrForm.krs.filter(k=>k.trim()).map((k,i)=>({id:`kr_${Date.now()}_${i}`,text:k,progress:0,milestones:[]})),createdAt:Date.now()};
                    saveOkrs([...okrs,newOkr]);
                    setOkrForm({show:false,obj:"",krs:[""]});
                  }} style={{flex:1,padding:"5px",borderRadius:5,background:"#a78bfa",color:"#000",fontFamily:FM,fontSize:"9px",fontWeight:700,border:"none",cursor:"pointer"}}>LƯU OKR</button>
                  <button onClick={()=>setOkrForm({show:false,obj:"",krs:[""]})}
                    style={{padding:"5px 10px",borderRadius:5,background:"rgba(0,0,0,0.3)",border:`1px solid ${C.bd}`,color:C.mu,fontSize:"9px",cursor:"pointer"}}>Hủy</button>
                </div>
              </div>
            )}

            {okrs.length===0&&!okrForm.show&&(
              <div style={{textAlign:"center",padding:"50px 20px",color:C.mu}}>
                <p style={{fontSize:32,marginBottom:8}}>🎯</p>
                <p style={{fontFamily:FM,fontSize:"9px",letterSpacing:"2px",marginBottom:4}}>CHƯA CÓ OKR NÀO</p>
                <p style={{fontSize:12}}>Bấm "+ OKR MỚI" để bắt đầu</p>
              </div>
            )}

            {okrs.map(okr=>(
              <div key={okr.id} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px",marginBottom:12,animation:"fadeUp .2s ease"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0,flex:1,paddingRight:8}}>🎯 {okr.obj}</p>
                  <button onClick={()=>saveOkrs(okrs.filter(x=>x.id!==okr.id))}
                    style={{width:22,height:22,borderRadius:4,background:"rgba(248,113,113,0.1)",border:"none",color:"#F87171",fontSize:11,cursor:"pointer",flexShrink:0}}>×</button>
                </div>
                {okr.krs.map((kr,ki)=>(
                  <div key={kr.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:12,color:"#a78bfa"}}>KR{ki+1}: {kr.text}</span>
                      <span style={{fontFamily:FM,fontSize:"9px",color:"#a78bfa"}}>{kr.progress}%</span>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3}}>
                        <div style={{width:kr.progress+"%",height:"100%",background:"linear-gradient(90deg,#a78bfa,#c084fc)",borderRadius:3,transition:"width .3s"}}/>
                      </div>
                      <input type="range" min={0} max={100} value={kr.progress}
                        onChange={e=>{const u=okrs.map(o=>o.id===okr.id?{...o,krs:o.krs.map((k,j)=>j===ki?{...k,progress:Number(e.target.value)}:k)}:o);saveOkrs(u);}}
                        style={{width:60}}/>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.bd}`}}>
                  <span style={{fontFamily:FM,fontSize:"9px",color:C.mu}}>
                    Progress tổng: {okr.krs.length>0?Math.round(okr.krs.reduce((s,k)=>s+k.progress,0)/okr.krs.length):0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ POMODORO / FOCUS ════ */}
        {tab==="pomodoro"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px"}}>
            <p style={{fontFamily:FM,fontSize:"9px",color:"#f97316",letterSpacing:"2px",marginBottom:20}}>⏱️ FOCUS TIMER</p>

            {/* Mode toggle */}
            <div style={{display:"flex",gap:8,marginBottom:24}}>
              {[["work","🔥 Work"],["break","☕ Break"]].map(([m,l])=>(
                <button key={m} onClick={()=>setPom(p=>({...p,mode:m,elapsed:0,running:false}))}
                  style={{padding:"6px 18px",borderRadius:8,border:"1px solid "+(pom.mode===m?"#f97316":"#333"),background:pom.mode===m?"#f9731618":"transparent",color:pom.mode===m?"#f97316":C.mu,fontFamily:FM,fontSize:"9px",cursor:"pointer"}}>{l}</button>
              ))}
            </div>

            {/* Timer display */}
            {(()=>{
              const limit=(pom.mode==="work"?pom.work:pom.brk)*60;
              const remaining=limit-pom.elapsed;
              const mm=String(Math.floor(remaining/60)).padStart(2,"0");
              const ss=String(remaining%60).padStart(2,"0");
              const pct=Math.round(pom.elapsed/limit*100);
              return(
                <div style={{position:"relative",width:200,height:200,marginBottom:24}}>
                  <svg width={200} height={200} style={{transform:"rotate(-90deg)"}}>
                    <circle cx={100} cy={100} r={90} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8}/>
                    <circle cx={100} cy={100} r={90} fill="none" stroke={pom.mode==="work"?"#f97316":"#34D399"}
                      strokeWidth={8} strokeDasharray={565} strokeDashoffset={565*(1-pct/100)} strokeLinecap="round"
                      style={{transition:"stroke-dashoffset .5s"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <p style={{fontFamily:FM,fontSize:40,fontWeight:900,color:"#fff",margin:0,lineHeight:1}}>{mm}:{ss}</p>
                    <p style={{fontFamily:FM,fontSize:"9px",color:pom.mode==="work"?"#f97316":"#34D399",margin:"4px 0 0"}}>{pom.mode==="work"?"DEEP WORK":"BREAK TIME"}</p>
                  </div>
                </div>
              );
            })()}

            {/* Controls */}
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              <button onClick={()=>setPom(p=>({...p,running:!p.running}))}
                style={{padding:"10px 32px",borderRadius:10,background:pom.running?"#F8717120":"#f9731620",border:`1px solid ${pom.running?"#F87171":"#f97316"}`,color:pom.running?"#F87171":"#f97316",fontFamily:FM,fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
                {pom.running?"⏸ PAUSE":"▶ START"}
              </button>
              <button onClick={()=>setPom(p=>({...p,running:false,elapsed:0}))}
                style={{padding:"10px 16px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:`1px solid ${C.bd}`,color:C.mu,fontFamily:FM,fontSize:"11px",cursor:"pointer"}}>↺ RESET</button>
            </div>

            {/* Custom time settings */}
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"12px 20px",width:"100%",maxWidth:320}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,letterSpacing:"2px",margin:"0 0 10px",textAlign:"center"}}>⚙️ CUSTOM TIME</p>
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                {[["Work",pom.work,"work"],["Break",pom.brk,"brk"]].map(([l,v,k])=>(
                  <div key={k} style={{textAlign:"center"}}>
                    <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 4px"}}>{l} (phút)</p>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button onClick={()=>setPom(p=>({...p,[k]:Math.max(1,p[k]-5),elapsed:0,running:false}))}
                        style={{width:24,height:24,borderRadius:4,background:"rgba(255,255,255,0.05)",border:`1px solid ${C.bd}`,color:"#fff",cursor:"pointer",fontSize:14}}>−</button>
                      <span style={{fontFamily:FM,fontSize:16,fontWeight:700,color:"#fff",minWidth:28,textAlign:"center"}}>{v}</span>
                      <button onClick={()=>setPom(p=>({...p,[k]:p[k]+5,elapsed:0,running:false}))}
                        style={{width:24,height:24,borderRadius:4,background:"rgba(255,255,255,0.05)",border:`1px solid ${C.bd}`,color:"#fff",cursor:"pointer",fontSize:14}}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session count */}
            <div style={{marginTop:16,textAlign:"center"}}>
              <p style={{fontFamily:FM,fontSize:"9px",color:C.mu,margin:"0 0 4px"}}>SESSIONS HÔM NAY</p>
              <p style={{fontSize:24}}>{"🍅".repeat(Math.min(pom.sessions,8))}{pom.sessions===0?"—":""}</p>
              {pom.sessions>0&&<button onClick={()=>setPom(p=>({...p,sessions:0}))}
                style={{fontFamily:FM,fontSize:"9px",color:C.mu,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Reset sessions</button>}
            </div>
          </div>
        )}

      {/* ── Floating Pomodoro Widget ─────────────────────────────── */}
      {tab!=="pomodoro"&&(
        <div onClick={()=>setTab("pomodoro")}
          style={{position:"fixed",bottom:isMobile?80:24,right:16,zIndex:500,cursor:"pointer",
            background:pom.running?"#f9731620":C.s1,border:`1px solid ${pom.running?"#f97316":C.bd}`,
            borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,
            boxShadow:pom.running?"0 0 20px #f9731640":"none",transition:"all .3s",animation:pom.running?"none":"none"}}>
          {(()=>{
            const limit=(pom.mode==="work"?pom.work:pom.brk)*60;
            const remaining=limit-pom.elapsed;
            const mm=String(Math.floor(remaining/60)).padStart(2,"0");
            const ss=String(remaining%60).padStart(2,"0");
            return(
              <>
                <span style={{fontSize:16}}>{pom.running?"🔥":"⏱️"}</span>
                <span style={{fontFamily:FM,fontSize:12,fontWeight:700,color:pom.running?"#f97316":"#fff"}}>{mm}:{ss}</span>
                <button onClick={e=>{e.stopPropagation();setPom(p=>({...p,running:!p.running}));}}
                  style={{width:22,height:22,borderRadius:5,background:pom.running?"#F8717120":"#f9731618",
                    border:`1px solid ${pom.running?"#F87171":"#f97316"}`,color:pom.running?"#F87171":"#f97316",
                    fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {pom.running?"⏸":"▶"}
                </button>
              </>
            );
          })()}
        </div>
      )}

      </div>
    </div>
  );
}
