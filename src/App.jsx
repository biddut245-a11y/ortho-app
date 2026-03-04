import { useState, useEffect, useCallback } from "react";

// ============================================================
// SUPABASE CONFIG (Replace with your actual keys)
// ============================================================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// ============================================================
// MOCK DATA LAYER (Works without Supabase for demo)
// ============================================================
let mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
let mockExpenses = JSON.parse(localStorage.getItem("mock_expenses") || "[]");
let mockCurrentUser = JSON.parse(localStorage.getItem("mock_current_user") || "null");

const saveMockData = () => {
  localStorage.setItem("mock_users", JSON.stringify(mockUsers));
  localStorage.setItem("mock_expenses", JSON.stringify(mockExpenses));
  localStorage.setItem("mock_current_user", JSON.stringify(mockCurrentUser));
};

const MockAuth = {
  signUp: (email, password) => {
    if (mockUsers.find(u => u.email === email)) {
      return { error: { message: "এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে" } };
    }
    const user = { id: crypto.randomUUID(), email, password, created_at: new Date().toISOString() };
    mockUsers.push(user);
    mockCurrentUser = user;
    saveMockData();
    return { data: { user }, error: null };
  },
  signIn: (email, password) => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) return { error: { message: "ইমেইল বা পাসওয়ার্ড ভুল" } };
    mockCurrentUser = user;
    saveMockData();
    return { data: { user }, error: null };
  },
  signOut: () => {
    mockCurrentUser = null;
    saveMockData();
    return { error: null };
  },
  getUser: () => ({ data: { user: mockCurrentUser }, error: null }),
};

const MockDB = {
  addExpense: (expense) => {
    const newExpense = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    mockExpenses.push(newExpense);
    saveMockData();
    return { data: newExpense, error: null };
  },
  getExpenses: (userId) => {
    return { data: mockExpenses.filter(e => e.user_id === userId), error: null };
  },
  deleteExpense: (id) => {
    mockExpenses = mockExpenses.filter(e => e.id !== id);
    saveMockData();
    return { error: null };
  },
};

// ============================================================
// CATEGORIES
// ============================================================
const CATEGORIES = [
  { id: "বাজার", label: "বাজার", icon: "🛒", color: "#10b981" },
  { id: "বিল", label: "বিল", icon: "💡", color: "#f59e0b" },
  { id: "শপিং", label: "শপিং", icon: "🛍️", color: "#8b5cf6" },
  { id: "খাবার", label: "খাবার", icon: "🍛", color: "#ef4444" },
  { id: "পরিবহন", label: "পরিবহন", icon: "🚌", color: "#3b82f6" },
  { id: "স্বাস্থ্য", label: "স্বাস্থ্য", icon: "🏥", color: "#ec4899" },
  { id: "শিক্ষা", label: "শিক্ষা", icon: "📚", color: "#06b6d4" },
  { id: "বিনোদন", label: "বিনোদন", icon: "🎬", color: "#f97316" },
  { id: "অন্যান্য", label: "অন্যান্য", icon: "📦", color: "#6b7280" },
];

// ============================================================
// CLAUDE AI INTEGRATION
// ============================================================
const getAISavingAdvice = async (expenses, userEmail) => {
  const totalByCategory = {};
  expenses.forEach(e => {
    totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount;
  });
  const totalSpent = Object.values(totalByCategory).reduce((a, b) => a + b, 0);
  const topCategory = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1])[0];

  const summaryText = Object.entries(totalByCategory)
    .map(([cat, amt]) => `${cat}: ৳${amt.toLocaleString("bn-BD")}`)
    .join(", ");

  const prompt = `তুমি একজন বিশেষজ্ঞ বাংলাদেশি ব্যক্তিগত অর্থ উপদেষ্টা। নিচের ব্যবহারকারীর খরচের তথ্য বিশ্লেষণ করে বাংলায় সংক্ষিপ্ত ও কার্যকর সঞ্চয়ের পরামর্শ দাও।

ব্যবহারকারী: ${userEmail}
মোট খরচ: ৳${totalSpent.toLocaleString()}
বিভাগ অনুযায়ী খরচ: ${summaryText}
সবচেয়ে বেশি খরচ: ${topCategory ? topCategory[0] + " (৳" + topCategory[1].toLocaleString() + ")" : "নেই"}

৩-৪টি নির্দিষ্ট ও ব্যবহারিক পরামর্শ দাও। প্রতিটি পরামর্শ আলাদা লাইনে দাও। সরাসরি পরামর্শে আসো, ভূমিকা দরকার নেই।`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "পরামর্শ লোড করতে সমস্যা হয়েছে।";
  } catch {
    return "AI পরামর্শ এই মুহূর্তে উপলব্ধ নেই। আপনার খরচের তথ্য বিশ্লেষণ করে নিজেই পরিকল্পনা করুন।";
  }
};

// ============================================================
// STYLES
// ============================================================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
    background: #0a0f1e;
    color: #e2e8f0;
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.6); } }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }

  .fade-in { animation: fadeIn 0.5s ease forwards; }
  .slide-in { animation: slideIn 0.4s ease forwards; }

  .glass {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 16px;
  }

  .glass-light {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 12px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-danger {
    background: rgba(239,68,68,0.15);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.3);
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-danger:hover { background: rgba(239,68,68,0.25); }

  .input-field {
    width: 100%;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    padding: 12px 16px;
    color: #e2e8f0;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 15px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .input-field::placeholder { color: #475569; }
  .input-field option { background: #1e293b; }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .tab-btn {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab-btn.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
  .tab-btn.inactive { background: transparent; color: #94a3b8; }
  .tab-btn.inactive:hover { background: rgba(99,102,241,0.1); color: #c7d2fe; }

  .bar-fill { transition: width 1s cubic-bezier(0.4,0,0.2,1); }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 10px;
    border: none; width: 100%;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
    text-align: left;
  }
  .nav-item.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }
  .nav-item.inactive { background: transparent; color: #64748b; }
  .nav-item.inactive:hover { background: rgba(99,102,241,0.1); color: #94a3b8; }
`;

// ============================================================
// COMPONENTS
// ============================================================

const BgMesh = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
    <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)", borderRadius: "50%" }} />
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", borderRadius: "50%" }} />
  </div>
);

// AUTH PAGE
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("সকল তথ্য পূরণ করুন"); return; }
    if (!email.includes("@gmail.com")) { setError("শুধুমাত্র Gmail ঠিকানা ব্যবহার করুন"); return; }
    if (password.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = mode === "login" ? MockAuth.signIn(email, password) : MockAuth.signUp(email, password);
    setLoading(false);

    if (result.error) { setError(result.error.message); return; }
    if (mode === "signup") { setSuccess("অ্যাকাউন্ট তৈরি হয়েছে! লগইন করুন।"); setMode("login"); setPassword(""); return; }
    onLogin(result.data.user);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", zIndex: 1 }}>
      <div className="glass fade-in" style={{ width: "100%", maxWidth: "440px", padding: "48px 40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px", animation: "float 3s ease-in-out infinite" }}>💰</div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", background: "linear-gradient(135deg, #a5b4fc, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "6px" }}>
            অর্থ ব্যবস্থাপক
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>আপনার ব্যক্তিগত আর্থিক সহকারী</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px", background: "rgba(15,23,42,0.5)", padding: "4px", borderRadius: "10px" }}>
          <button className={`tab-btn ${mode === "login" ? "active" : "inactive"}`} style={{ flex: 1 }} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>লগইন করুন</button>
          <button className={`tab-btn ${mode === "signup" ? "active" : "inactive"}`} style={{ flex: 1 }} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>নতুন অ্যাকাউন্ট</button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>Gmail ঠিকানা</label>
            <input className="input-field" type="email" placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>পাসওয়ার্ড</label>
            <input className="input-field" type="password" placeholder="কমপক্ষে ৬ অক্ষর" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#f87171", fontSize: "13px" }}>⚠️ {error}</div>}
          {success && <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#34d399", fontSize: "13px" }}>✅ {success}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}>
            {loading ? <><div className="spinner" /><span>অপেক্ষা করুন...</span></> : mode === "login" ? "লগইন করুন →" : "অ্যাকাউন্ট তৈরি করুন →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#334155", marginTop: "24px" }}>
          🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ ও ব্যক্তিগত
        </p>
      </div>
    </div>
  );
};

// EXPENSE FORM
const ExpenseForm = ({ userId, onAdd }) => {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("বাজার");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!desc || !amount || !date) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    MockDB.addExpense({ user_id: userId, description: desc, amount: parseFloat(amount), category, date });
    setDesc(""); setAmount(""); setCategory("বাজার"); setDate(new Date().toISOString().split("T")[0]);
    setLoading(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    onAdd();
  };

  return (
    <div className="glass" style={{ padding: "28px" }}>
      <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#c7d2fe", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        ➕ নতুন খরচ যোগ করুন
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>খরচের বিবরণ</label>
          <input className="input-field" placeholder="কিসের জন্য খরচ হলো?" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>টাকার পরিমাণ (৳)</label>
          <input className="input-field" type="number" placeholder="০" value={amount} onChange={e => setAmount(e.target.value)} min="0" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>তারিখ</label>
          <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>বিভাগ</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", transition: "all 0.2s",
                background: category === cat.id ? cat.color + "33" : "rgba(30,41,59,0.5)",
                color: category === cat.id ? cat.color : "#64748b",
                boxShadow: category === cat.id ? `0 0 12px ${cat.color}40` : "none",
                outline: category === cat.id ? `1px solid ${cat.color}60` : "1px solid transparent",
              }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || !desc || !amount} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? <><div className="spinner" /><span>সংরক্ষণ হচ্ছে...</span></> : success ? "✅ সংরক্ষিত হয়েছে!" : "💾 খরচ সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

// STAT CARD
const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="glass-light fade-in" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, borderRadius: "0 12px 0 100%" }} />
    <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
    <div style={{ fontSize: "22px", fontWeight: "700", color: color, marginBottom: "4px" }}>৳{Number(value).toLocaleString("bn-BD")}</div>
    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{label}</div>
    {sub && <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>{sub}</div>}
  </div>
);

// EXPENSE LIST
const ExpenseList = ({ expenses, onDelete }) => {
  if (!expenses.length) return (
    <div className="glass" style={{ padding: "40px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧾</div>
      <p style={{ color: "#475569", fontSize: "15px" }}>কোনো খরচ নেই। নতুন খরচ যোগ করুন!</p>
    </div>
  );

  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#c7d2fe" }}>📋 খরচের তালিকা</h3>
        <span style={{ fontSize: "12px", color: "#64748b" }}>{expenses.length}টি লেনদেন</span>
      </div>
      <div style={{ maxHeight: "360px", overflowY: "auto" }}>
        {[...expenses].reverse().map((exp, i) => {
          const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[8];
          return (
            <div key={exp.id} className="slide-in" style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid rgba(30,41,59,0.5)", transition: "background 0.2s", animationDelay: `${i * 0.05}s` }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: cat.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.description}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{exp.category} • {new Date(exp.date).toLocaleDateString("bn-BD")}</div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: cat.color, flexShrink: 0 }}>৳{Number(exp.amount).toLocaleString()}</div>
              <button className="btn-danger" onClick={() => onDelete(exp.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ANALYTICS
const Analytics = ({ expenses }) => {
  const [period, setPeriod] = useState("monthly");

  const now = new Date();
  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    if (period === "weekly") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalByCategory = {};
  filtered.forEach(e => { totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount; });
  const sorted = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);

  const dailyTotals = {};
  filtered.forEach(e => { dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount; });
  const dailySorted = Object.entries(dailyTotals).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button className={`tab-btn ${period === "weekly" ? "active" : "inactive"}`} onClick={() => setPeriod("weekly")}>সাপ্তাহিক</button>
        <button className={`tab-btn ${period === "monthly" ? "active" : "inactive"}`} onClick={() => setPeriod("monthly")}>মাসিক</button>
      </div>

      <div className="glass" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#c7d2fe", marginBottom: "20px" }}>📊 বিভাগ অনুযায়ী খরচ</h3>
        {sorted.length === 0 ? (
          <p style={{ color: "#475569", textAlign: "center", padding: "20px" }}>কোনো তথ্য নেই</p>
        ) : sorted.map(([cat, amt]) => {
          const catObj = CATEGORIES.find(c => c.id === cat) || CATEGORIES[8];
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <div key={cat} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{catObj.icon} {cat}</span>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{pct.toFixed(1)}%</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: catObj.color }}>৳{amt.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ height: "8px", background: "rgba(30,41,59,0.8)", borderRadius: "4px", overflow: "hidden" }}>
                <div className="bar-fill" style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${catObj.color}80, ${catObj.color})`, borderRadius: "4px" }} />
              </div>
            </div>
          );
        })}
        {total > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>মোট খরচ</span>
            <span style={{ fontSize: "18px", fontWeight: "700", color: "#a5b4fc" }}>৳{total.toLocaleString()}</span>
          </div>
        )}
      </div>

      {dailySorted.length > 0 && (
        <div className="glass" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#c7d2fe", marginBottom: "20px" }}>📈 দৈনিক খরচ (শেষ ৭ দিন)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
            {dailySorted.map(([date, amt]) => {
              const maxAmt = Math.max(...dailySorted.map(([, v]) => v));
              const h = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>৳{(amt/1000).toFixed(0)}k</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{ width: "100%", height: `${h}%`, minHeight: "4px", background: "linear-gradient(180deg, #6366f1, #8b5cf6)", borderRadius: "4px 4px 0 0", transition: "height 0.8s ease" }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569" }}>{new Date(date).getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// AI ADVISOR
const AIAdvisor = ({ expenses, userEmail }) => {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAdvice = async () => {
    if (expenses.length === 0) { setAdvice("পরামর্শ পেতে অন্তত কিছু খরচ যোগ করুন।"); setFetched(true); return; }
    setLoading(true);
    const result = await getAISavingAdvice(expenses, userEmail);
    setAdvice(result);
    setLoading(false);
    setFetched(true);
  };

  const lines = advice.split("\n").filter(l => l.trim());

  return (
    <div className="glass" style={{ padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#c7d2fe", display: "flex", alignItems: "center", gap: "8px" }}>
            🤖 AI সঞ্চয় উপদেষ্টা
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>Claude AI আপনার তথ্য বিশ্লেষণ করে পরামর্শ দেবে</p>
        </div>
        <button className="btn-primary" onClick={fetchAdvice} disabled={loading}>
          {loading ? <><div className="spinner" /><span>বিশ্লেষণ...</span></> : fetched ? "🔄 আবার জিজ্ঞেস করুন" : "💡 পরামর্শ নিন"}
        </button>
      </div>

      {!fetched && !loading && (
        <div style={{ textAlign: "center", padding: "32px", color: "#475569" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px", animation: "float 3s ease-in-out infinite" }}>🧠</div>
          <p>আপনার খরচের তথ্য বিশ্লেষণ করে ব্যক্তিগত সঞ্চয়ের পরামর্শ পেতে উপরের বোতামে ক্লিক করুন।</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#94a3b8" }}>AI আপনার তথ্য বিশ্লেষণ করছে...</p>
        </div>
      )}

      {fetched && !loading && advice && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {lines.map((line, i) => (
            <div key={i} className="glass-light fade-in" style={{ padding: "14px 18px", borderLeft: "3px solid #6366f1", animationDelay: `${i * 0.15}s` }}>
              <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>{line}</p>
            </div>
          ))}
          <p style={{ fontSize: "11px", color: "#334155", textAlign: "right", marginTop: "4px" }}>⚡ Claude AI দ্বারা পরিচালিত</p>
        </div>
      )}
    </div>
  );
};

// MAIN DASHBOARD
const Dashboard = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadExpenses = useCallback(() => {
    const { data } = MockDB.getExpenses(user.id);
    setExpenses(data || []);
  }, [user.id]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleDelete = (id) => {
    MockDB.deleteExpense(id);
    loadExpenses();
  };

  const now = new Date();
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const thisWeekExpenses = expenses.filter(e => new Date(e.date) >= weekAgo);
  const totalWeek = thisWeekExpenses.reduce((s, e) => s + e.amount, 0);

  const catTotals = {};
  thisMonthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const topCatObj = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "ড্যাশবোর্ড" },
    { id: "expenses", icon: "📝", label: "খরচ যোগ করুন" },
    { id: "analytics", icon: "📊", label: "বিশ্লেষণ" },
    { id: "ai", icon: "🤖", label: "AI উপদেষ্টা" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "240px" : "0", minWidth: sidebarOpen ? "240px" : "0",
        background: "rgba(10,15,30,0.9)", backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(99,102,241,0.1)",
        display: "flex", flexDirection: "column", padding: sidebarOpen ? "24px 16px" : "0",
        transition: "all 0.3s", overflow: "hidden", position: "sticky", top: 0, height: "100vh"
      }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>💰</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#a5b4fc" }}>অর্থ ব্যবস্থাপক</div>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px", wordBreak: "break-all" }}>{user.email}</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? "active" : "inactive"}`} onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span> <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="btn-danger" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>🚪 লগআউট</button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Topbar */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(99,102,241,0.1)", display: "flex", alignItems: "center", gap: "16px", background: "rgba(10,15,30,0.5)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px" }}>☰</button>
          <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#e2e8f0" }}>
            {navItems.find(n => n.id === activeTab)?.icon} {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "#475569" }}>
            {new Date().toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                <StatCard icon="📅" label="এই মাসের মোট খরচ" value={totalMonth} color="#6366f1" sub={`${thisMonthExpenses.length}টি লেনদেন`} />
                <StatCard icon="📆" label="এই সপ্তাহের খরচ" value={totalWeek} color="#10b981" sub={`${thisWeekExpenses.length}টি লেনদেন`} />
                <StatCard icon="💸" label="সর্বোচ্চ বিভাগ" value={topCat?.[1] || 0} color={topCatObj?.color || "#f59e0b"} sub={topCatObj ? `${topCatObj.icon} ${topCatObj.label}` : "তথ্য নেই"} />
                <StatCard icon="📊" label="মোট লেনদেন" value={expenses.length} color="#8b5cf6" sub="সকল সময়" />
              </div>
              <ExpenseList expenses={expenses} onDelete={handleDelete} />
            </div>
          )}

          {activeTab === "expenses" && (
            <div style={{ maxWidth: "600px" }} className="fade-in">
              <ExpenseForm userId={user.id} onAdd={loadExpenses} />
              <div style={{ marginTop: "20px" }}>
                <ExpenseList expenses={expenses} onDelete={handleDelete} />
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div style={{ maxWidth: "700px" }} className="fade-in">
              <Analytics expenses={expenses} />
            </div>
          )}

          {activeTab === "ai" && (
            <div style={{ maxWidth: "700px" }} className="fade-in">
              <AIAdvisor expenses={expenses} userEmail={user.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data } = MockAuth.getUser();
    setUser(data.user);
    setChecking(false);
  }, []);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { MockAuth.signOut(); setUser(null); };

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1e" }}>
      <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px", borderColor: "rgba(99,102,241,0.3)", borderTopColor: "#6366f1" }} />
    </div>
  );

  return (
    <>
      <style>{globalStyles}</style>
      <BgMesh />
      {user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthPage onLogin={handleLogin} />}
    </>
  );
}
