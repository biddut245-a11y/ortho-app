import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qcjutdwcjaibstetxjwp.supabase.co";
const SUPABASE_KEY = "sb_publishable_zi-MfXk3eAweLYlfCibtRA_dkdJViX8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MockAuth = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: { message: error.message } };
    return { data, error: null };
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: { message: "ইমেইল বা পাসওয়ার্ড ভুল" } };
    return { data, error: null };
  },
  signOut: async () => { await supabase.auth.signOut(); return { error: null }; },
  getUser: async () => { const { data } = await supabase.auth.getUser(); return { data, error: null }; },
};

const MockDB = {
  addExpense: async (expense) => {
    const { data, error } = await supabase.from("expenses").insert([expense]).select().single();
    return { data, error };
  },
  getExpenses: async (userId) => {
    const { data, error } = await supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false });
    return { data: data || [], error };
  },
  deleteExpense: async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    return { error };
  },
};

const CATEGORIES = [
  { id: "বাজার", label: "বাজার", icon: "🛒", color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  { id: "বিল", label: "বিল", icon: "💡", color: "#ffd93d", bg: "rgba(255,217,61,0.12)" },
  { id: "শপিং", label: "শপিং", icon: "🛍️", color: "#c77dff", bg: "rgba(199,125,255,0.12)" },
  { id: "খাবার", label: "খাবার", icon: "🍛", color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
  { id: "পরিবহন", label: "পরিবহন", icon: "🚌", color: "#4cc9f0", bg: "rgba(76,201,240,0.12)" },
  { id: "স্বাস্থ্য", label: "স্বাস্থ্য", icon: "🏥", color: "#ff85a1", bg: "rgba(255,133,161,0.12)" },
  { id: "শিক্ষা", label: "শিক্ষা", icon: "📚", color: "#48cae4", bg: "rgba(72,202,228,0.12)" },
  { id: "বিনোদন", label: "বিনোদন", icon: "🎬", color: "#ff9f1c", bg: "rgba(255,159,28,0.12)" },
  { id: "অন্যান্য", label: "অন্যান্য", icon: "📦", color: "#adb5bd", bg: "rgba(173,181,189,0.12)" },
];

const getAISavingAdvice = async (expenses, userEmail) => {
  const totalByCategory = {};
  expenses.forEach((e) => { totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount; });
  const totalSpent = Object.values(totalByCategory).reduce((a, b) => a + b, 0);
  const topCategory = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1])[0];
  const summaryText = Object.entries(totalByCategory).map(([cat, amt]) => `${cat}: ৳${amt.toLocaleString()}`).join(", ");
  const prompt = `তুমি একজন বিশেষজ্ঞ বাংলাদেশি ব্যক্তিগত অর্থ উপদেষ্টা। নিচের ব্যবহারকারীর খরচের তথ্য বিশ্লেষণ করে বাংলায় সংক্ষিপ্ত ও কার্যকর সঞ্চয়ের পরামর্শ দাও।\n\nব্যবহারকারী: ${userEmail}\nমোট খরচ: ৳${totalSpent.toLocaleString()}\nবিভাগ: ${summaryText}\nসবচেয়ে বেশি: ${topCategory ? topCategory[0] + " (৳" + topCategory[1].toLocaleString() + ")" : "নেই"}\n\n৩-৪টি নির্দিষ্ট পরামর্শ দাও। প্রতিটি আলাদা লাইনে।`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "পরামর্শ লোড করতে সমস্যা হয়েছে।";
  } catch { return "AI পরামর্শ এই মুহূর্তে উপলব্ধ নেই।"; }
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Sora:wght@400;600;700;800&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --bg:#070b14; --surface:#0d1321; --surface2:#111827;
    --border:rgba(255,255,255,0.06); --border2:rgba(255,255,255,0.1);
    --text:#f0f4ff; --text2:#8892a4; --text3:#4a5568;
    --accent:#7c6af7; --accent2:#a78bfa;
  }
  html { font-size:16px; }
  body {
    font-family:'Hind Siliguri','Sora',sans-serif;
    background:var(--bg); color:var(--text);
    min-height:100vh; min-height:100dvh;
    overflow-x:hidden;
  }
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(124,106,247,0.3);border-radius:2px;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,106,247,0.3);}50%{box-shadow:0 0 40px rgba(124,106,247,0.6);}}

  .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }

  /* AUTH — full screen centered */
  .auth-screen {
    width:100vw; height:100vh; height:100dvh;
    display:flex; align-items:center; justify-content:center;
    padding:16px;
    position:relative; overflow:hidden;
  }
  .auth-card {
    width:100%; max-width:440px;
    background:rgba(13,19,33,0.94);
    backdrop-filter:blur(30px);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:24px;
    padding:44px 40px;
    box-shadow:0 30px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,106,247,0.1);
    position:relative; z-index:1;
  }
  @media(max-width:480px){
    .auth-card { padding:32px 22px; border-radius:20px; }
  }

  /* CARD */
  .card { background:var(--surface); border:1px solid var(--border); border-radius:20px; transition:border-color 0.3s; }
  .card:hover { border-color:var(--border2); }
  .card-sm { background:var(--surface2); border:1px solid var(--border); border-radius:14px; }

  /* INPUT */
  .inp {
    width:100%; background:var(--surface2); border:1px solid var(--border);
    border-radius:12px; padding:13px 16px; color:var(--text);
    font-family:'Hind Siliguri',sans-serif; font-size:15px;
    outline:none; transition:all 0.25s; -webkit-appearance:none;
  }
  .inp:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(124,106,247,0.15); }
  .inp::placeholder { color:var(--text3); }
  .inp option { background:#1a1f2e; }

  /* BUTTONS */
  .btn {
    border:none; cursor:pointer;
    font-family:'Hind Siliguri',sans-serif; font-weight:600;
    transition:all 0.25s; display:inline-flex; align-items:center;
    gap:8px; justify-content:center; -webkit-tap-highlight-color:transparent;
  }
  .btn-grad {
    background:linear-gradient(135deg,#7c6af7,#a78bfa); color:#fff;
    border-radius:12px; font-size:15px;
    box-shadow:0 4px 20px rgba(124,106,247,0.35);
  }
  .btn-grad:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 30px rgba(124,106,247,0.5); }
  .btn-grad:active:not(:disabled) { transform:translateY(0); }
  .btn-grad:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-del { background:rgba(255,107,107,0.1); color:#ff6b6b; padding:6px 14px; border-radius:8px; font-size:12px; border:1px solid rgba(255,107,107,0.2); }
  .btn-del:hover { background:rgba(255,107,107,0.22); }

  /* NAV */
  .nav-btn {
    display:flex; align-items:center; gap:12px; padding:11px 14px;
    border-radius:12px; border:none; width:100%;
    font-family:'Hind Siliguri',sans-serif; font-size:14px; font-weight:500;
    cursor:pointer; transition:all 0.2s; text-align:left;
    color:var(--text3); background:transparent;
    -webkit-tap-highlight-color:transparent;
  }
  .nav-btn:hover { background:rgba(124,106,247,0.08); color:var(--text2); }
  .nav-btn.on { background:rgba(124,106,247,0.15); color:var(--accent2); }

  /* SPINNER */
  .spin { width:18px; height:18px; border:2px solid rgba(255,255,255,0.2); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }

  /* DASHBOARD LAYOUT */
  .app-layout { display:flex; min-height:100vh; min-height:100dvh; }

  /* SIDEBAR */
  .sidebar {
    width:240px; min-width:240px; flex-shrink:0;
    background:rgba(7,11,20,0.97); backdrop-filter:blur(20px);
    border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    padding:22px 14px;
    position:sticky; top:0; height:100vh; height:100dvh;
    z-index:50; transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }

  /* MAIN AREA */
  .main-area { flex:1; display:flex; flex-direction:column; overflow:auto; min-width:0; }
  .topbar { padding:14px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:14px; background:rgba(7,11,20,0.85); backdrop-filter:blur(20px); position:sticky; top:0; z-index:10; }
  .page { padding:24px; flex:1; max-width:1200px; width:100%; margin:0 auto; }

  /* STAT GRID */
  .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }

  /* OVERLAY */
  .overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:49; backdrop-filter:blur(4px); }

  /* MOBILE */
  @media(max-width:900px){
    .stat-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media(max-width:768px){
    .sidebar {
      position:fixed !important; top:0; left:0; height:100vh !important; height:100dvh !important;
      transform:translateX(-100%); z-index:200;
    }
    .sidebar.open { transform:translateX(0); }
    .overlay { display:block; }
    .topbar { padding:12px 16px; }
    .page { padding:14px; }
    .stat-grid { grid-template-columns:repeat(2,1fr); gap:10px; }
    .form-cols { grid-template-columns:1fr !important; }
    .hide-mobile { display:none !important; }
  }
  @media(max-width:420px){
    .stat-grid { grid-template-columns:1fr 1fr; gap:8px; }
    .stat-val { font-size:18px !important; }
  }
`;

/* ═══════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════ */
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    setErr(""); setOk("");
    if (!email || !pass) { setErr("সকল তথ্য পূরণ করুন"); return; }
    if (!email.includes("@gmail.com")) { setErr("শুধুমাত্র Gmail ঠিকানা ব্যবহার করুন"); return; }
    if (pass.length < 6) { setErr("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    setLoading(true);
    const r = mode === "login" ? await MockAuth.signIn(email, pass) : await MockAuth.signUp(email, pass);
    setLoading(false);
    if (r.error) { setErr(r.error.message); return; }
    if (mode === "signup") {
      setOk("✅ অ্যাকাউন্ট তৈরি হয়েছে! Email verify করুন তারপর লগইন করুন।");
      setMode("login"); setPass(""); return;
    }
    onLogin(r.data.user);
  };

  return (
    <div className="auth-screen">
      {/* BG blobs */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"8%", left:"10%", width:500, height:500, background:"radial-gradient(circle,rgba(124,106,247,0.14) 0%,transparent 65%)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:"8%", right:"8%", width:380, height:380, background:"radial-gradient(circle,rgba(0,212,170,0.09) 0%,transparent 65%)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:800, height:800, background:"radial-gradient(circle,rgba(167,139,250,0.04) 0%,transparent 60%)", borderRadius:"50%" }} />
      </div>

      <div className="auth-card fade-up">
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:72, height:72, borderRadius:22, background:"linear-gradient(135deg,rgba(124,106,247,0.25),rgba(167,139,250,0.08))", border:"1px solid rgba(124,106,247,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 18px", animation:"float 3s ease-in-out infinite" }}>💰</div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:"var(--text)", marginBottom:8, letterSpacing:"-0.5px" }}>অর্থ ব্যবস্থাপক</h1>
          <p style={{ color:"var(--text3)", fontSize:14 }}>আপনার স্মার্ট আর্থিক সহকারী</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(0,0,0,0.35)", borderRadius:13, padding:4, marginBottom:28, border:"1px solid var(--border)" }}>
          {[["login","লগইন করুন"],["signup","নতুন অ্যাকাউন্ট"]].map(([m,l]) => (
            <button key={m} onClick={() => { setMode(m); setErr(""); setOk(""); }} className="btn" style={{ flex:1, padding:"10px 8px", borderRadius:10, fontSize:14, fontWeight:600, background:mode===m?"linear-gradient(135deg,#7c6af7,#a78bfa)":"transparent", color:mode===m?"#fff":"var(--text3)", boxShadow:mode===m?"0 4px 15px rgba(124,106,247,0.3)":"none", transition:"all 0.25s" }}>{l}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, letterSpacing:"1px", textTransform:"uppercase" }}>Gmail ঠিকানা</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>📧</span>
              <input className="inp" type="email" placeholder="example@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ paddingLeft:44 }} />
            </div>
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, letterSpacing:"1px", textTransform:"uppercase" }}>পাসওয়ার্ড</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔐</span>
              <input className="inp" type="password" placeholder="কমপক্ষে ৬ অক্ষর" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{ paddingLeft:44 }} />
            </div>
          </div>

          {err && (
            <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:10, padding:"12px 16px", color:"#ff6b6b", fontSize:13, display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ flexShrink:0 }}>⚠️</span><span>{err}</span>
            </div>
          )}
          {ok && (
            <div style={{ background:"rgba(0,212,170,0.1)", border:"1px solid rgba(0,212,170,0.25)", borderRadius:10, padding:"12px 16px", color:"#00d4aa", fontSize:13 }}>{ok}</div>
          )}

          <button className="btn btn-grad" onClick={submit} disabled={loading} style={{ width:"100%", padding:"15px", marginTop:4, fontSize:15 }}>
            {loading ? <><div className="spin"/><span>একটু অপেক্ষা...</span></> : mode==="login" ? "লগইন করুন →" : "অ্যাকাউন্ট তৈরি করুন →"}
          </button>
        </div>

        <p style={{ marginTop:24, textAlign:"center", fontSize:12, color:"var(--text3)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════ */
const StatCard = ({ icon, label, value, color, sub, delay=0 }) => (
  <div className="card fade-up" style={{ padding:20, animationDelay:`${delay}ms`, position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:-15, right:-15, width:90, height:90, background:`radial-gradient(circle,${color}15 0%,transparent 70%)`, borderRadius:"50%", pointerEvents:"none" }} />
    <div style={{ width:42, height:42, borderRadius:12, background:`${color}18`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, marginBottom:14 }}>{icon}</div>
    <div className="stat-val" style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:color, marginBottom:4 }}>৳{Number(value).toLocaleString()}</div>
    <div style={{ fontSize:12, color:"var(--text2)", fontWeight:500, marginBottom:2 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:"var(--text3)" }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════
   EXPENSE FORM
═══════════════════════════════════════════════ */
const ExpenseForm = ({ userId, onAdd }) => {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("বাজার");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!desc || !amount || !date) return;
    setLoading(true);
    await MockDB.addExpense({ user_id:userId, description:desc, amount:parseFloat(amount), category:cat, date });
    setDesc(""); setAmount(""); setCat("বাজার"); setDate(new Date().toISOString().split("T")[0]);
    setLoading(false); setDone(true);
    setTimeout(() => setDone(false), 2500);
    onAdd();
  };

  return (
    <div className="card fade-up" style={{ padding:26 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:"rgba(124,106,247,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>➕</div>
        <div>
          <h3 style={{ fontSize:16, fontWeight:700 }}>নতুন খরচ যোগ করুন</h3>
          <p style={{ fontSize:12, color:"var(--text3)" }}>আজকের খরচ রেকর্ড করুন</p>
        </div>
      </div>
      <div className="form-cols" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, letterSpacing:"1px", textTransform:"uppercase" }}>খরচের বিবরণ</label>
          <input className="inp" placeholder="কিসের জন্য খরচ হলো?" value={desc} onChange={e=>setDesc(e.target.value)} />
        </div>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, letterSpacing:"1px", textTransform:"uppercase" }}>টাকার পরিমাণ (৳)</label>
          <input className="inp" type="number" placeholder="০.০০" value={amount} onChange={e=>setAmount(e.target.value)} min="0" />
        </div>
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, letterSpacing:"1px", textTransform:"uppercase" }}>তারিখ</label>
          <input className="inp" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:10, letterSpacing:"1px", textTransform:"uppercase" }}>বিভাগ</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className="btn" style={{ padding:"7px 13px", borderRadius:20, fontSize:13, background:cat===c.id?c.bg:"rgba(255,255,255,0.04)", color:cat===c.id?c.color:"var(--text3)", border:cat===c.id?`1px solid ${c.color}50`:"1px solid var(--border)", fontWeight:cat===c.id?600:400, transform:cat===c.id?"scale(1.05)":"scale(1)" }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <button className="btn btn-grad" onClick={submit} disabled={loading||!desc||!amount} style={{ width:"100%", padding:"14px", fontSize:15 }}>
            {loading?<><div className="spin"/><span>সংরক্ষণ হচ্ছে...</span></>:done?"✅ সংরক্ষিত!":"💾 খরচ সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   EXPENSE LIST
═══════════════════════════════════════════════ */
const ExpenseList = ({ expenses, onDelete }) => {
  if (!expenses.length) return (
    <div className="card" style={{ padding:48, textAlign:"center" }}>
      <div style={{ fontSize:50, marginBottom:14, opacity:0.25 }}>🧾</div>
      <p style={{ color:"var(--text3)", fontSize:15 }}>এখনো কোনো খরচ নেই</p>
      <p style={{ color:"var(--text3)", fontSize:13, marginTop:4 }}>নতুন খরচ যোগ করুন!</p>
    </div>
  );
  return (
    <div className="card" style={{ overflow:"hidden" }}>
      <div style={{ padding:"16px 22px 12px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", boxShadow:"0 0 8px var(--accent)" }} />
          <span style={{ fontSize:15, fontWeight:600 }}>খরচের তালিকা</span>
        </div>
        <span style={{ fontSize:12, color:"var(--text3)", background:"rgba(255,255,255,0.05)", padding:"3px 10px", borderRadius:20 }}>{expenses.length}টি</span>
      </div>
      <div style={{ maxHeight:420, overflowY:"auto" }}>
        {expenses.map((exp) => {
          const c = CATEGORIES.find(x=>x.id===exp.category)||CATEGORIES[8];
          return (
            <div key={exp.id} style={{ padding:"13px 22px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid var(--border)", transition:"background 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:40, height:40, borderRadius:11, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{c.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:3 }}>{exp.description}</div>
                <div style={{ fontSize:11, color:"var(--text3)", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ background:c.bg, color:c.color, padding:"1px 8px", borderRadius:10 }}>{c.icon} {exp.category}</span>
                  <span>{new Date(exp.date).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:c.color, fontFamily:"'Sora',sans-serif", flexShrink:0 }}>৳{Number(exp.amount).toLocaleString()}</div>
              <button className="btn btn-del" onClick={()=>onDelete(exp.id)} style={{ flexShrink:0 }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════ */
const Analytics = ({ expenses }) => {
  const [period, setPeriod] = useState("monthly");
  const now = new Date();
  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    if (period==="weekly") { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });
  const byCat = {};
  filtered.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+e.amount; });
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const total = sorted.reduce((s,[,v])=>s+v,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:8 }}>
        {[["weekly","সাপ্তাহিক"],["monthly","মাসিক"]].map(([v,l])=>(
          <button key={v} className="btn" onClick={()=>setPeriod(v)} style={{ padding:"9px 20px", borderRadius:10, fontSize:14, background:period===v?"linear-gradient(135deg,#7c6af7,#a78bfa)":"rgba(255,255,255,0.05)", color:period===v?"#fff":"var(--text3)", border:"1px solid var(--border)", fontWeight:period===v?600:400 }}>{l}</button>
        ))}
      </div>
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:22, display:"flex", alignItems:"center", gap:8 }}>📊 বিভাগ অনুযায়ী খরচ</h3>
        {sorted.length===0 ? (
          <div style={{ textAlign:"center", padding:32, color:"var(--text3)" }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.25 }}>📭</div>
            <p>এই সময়ের কোনো তথ্য নেই</p>
          </div>
        ) : sorted.map(([cat,amt])=>{
          const c=CATEGORIES.find(x=>x.id===cat)||CATEGORIES[8];
          const pct=total>0?(amt/total)*100:0;
          return (
            <div key={cat} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:28, height:28, borderRadius:8, background:c.bg, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{c.icon}</span>
                  <span style={{ fontSize:14, color:"var(--text2)" }}>{cat}</span>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--text3)" }}>{pct.toFixed(1)}%</span>
                  <span style={{ fontSize:14, fontWeight:700, color:c.color, fontFamily:"'Sora',sans-serif" }}>৳{amt.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${c.color}60,${c.color})`, borderRadius:3, transition:"width 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
            </div>
          );
        })}
        {total>0&&(
          <div style={{ marginTop:18, paddingTop:18, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, color:"var(--text2)", fontWeight:600 }}>মোট খরচ</span>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:"var(--accent2)" }}>৳{total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   AI ADVISOR
═══════════════════════════════════════════════ */
const AIAdvisor = ({ expenses, userEmail }) => {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fetchAdvice = async () => {
    if (expenses.length===0) { setAdvice("পরামর্শ পেতে অন্তত কিছু খরচ যোগ করুন।"); setDone(true); return; }
    setLoading(true);
    const r = await getAISavingAdvice(expenses, userEmail);
    setAdvice(r); setLoading(false); setDone(true);
  };

  return (
    <div className="card" style={{ padding:26 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22, flexWrap:"wrap", gap:14 }}>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:50, height:50, borderRadius:14, background:"linear-gradient(135deg,rgba(124,106,247,0.2),rgba(167,139,250,0.05))", border:"1px solid rgba(124,106,247,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>🤖</div>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700 }}>AI সঞ্চয় উপদেষ্টা</h3>
            <p style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>Claude AI বিশ্লেষণ করবে</p>
          </div>
        </div>
        <button className="btn btn-grad" onClick={fetchAdvice} disabled={loading} style={{ padding:"10px 20px", fontSize:14, borderRadius:10 }}>
          {loading?<><div className="spin"/><span>বিশ্লেষণ...</span></>:done?"🔄 আবার জিজ্ঞেস করুন":"💡 পরামর্শ নিন"}
        </button>
      </div>
      {!done&&!loading&&(
        <div style={{ textAlign:"center", padding:"38px 20px", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:16 }}>
          <div style={{ fontSize:44, marginBottom:14, animation:"float 3s ease-in-out infinite" }}>🧠</div>
          <p style={{ color:"var(--text2)", fontSize:15, marginBottom:6 }}>AI পরামর্শ নিতে প্রস্তুত?</p>
          <p style={{ color:"var(--text3)", fontSize:13 }}>উপরের বোতামে ক্লিক করুন</p>
        </div>
      )}
      {loading&&(
        <div style={{ textAlign:"center", padding:"38px 20px" }}>
          <div style={{ fontSize:36, marginBottom:14, animation:"pulse 1.5s ease-in-out infinite" }}>⚡</div>
          <p style={{ color:"var(--text2)" }}>বিশ্লেষণ চলছে...</p>
        </div>
      )}
      {done&&!loading&&(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {advice.split("\n").filter(l=>l.trim()).map((line,i)=>(
            <div key={i} className="fade-up" style={{ padding:"14px 18px", background:"rgba(124,106,247,0.06)", border:"1px solid rgba(124,106,247,0.12)", borderLeft:"3px solid var(--accent)", borderRadius:12, animationDelay:`${i*120}ms` }}>
              <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.8 }}>{line}</p>
            </div>
          ))}
          <p style={{ fontSize:11, color:"var(--text3)", textAlign:"right", marginTop:4 }}>⚡ Claude AI দ্বারা পরিচালিত</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
const Dashboard = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(window.innerWidth >= 768);

  const load = useCallback(async () => {
    const { data } = await MockDB.getExpenses(user.id);
    setExpenses(data||[]);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setSideOpen(true); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const del = async (id) => { await MockDB.deleteExpense(id); load(); };

  const now = new Date();
  const monthExp = expenses.filter(e=>{ const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  const totalM = monthExp.reduce((s,e)=>s+e.amount,0);
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate()-7);
  const weekExp = expenses.filter(e=>new Date(e.date)>=weekAgo);
  const totalW = weekExp.reduce((s,e)=>s+e.amount,0);
  const catTot = {}; monthExp.forEach(e=>{ catTot[e.category]=(catTot[e.category]||0)+e.amount; });
  const topC = Object.entries(catTot).sort((a,b)=>b[1]-a[1])[0];
  const topCObj = topC ? CATEGORIES.find(c=>c.id===topC[0]) : null;

  const navs = [
    { id:"dashboard", icon:"🏠", label:"ড্যাশবোর্ড" },
    { id:"expenses", icon:"📝", label:"খরচ যোগ করুন" },
    { id:"analytics", icon:"📊", label:"বিশ্লেষণ" },
    { id:"ai", icon:"🤖", label:"AI উপদেষ্টা" },
  ];

  const goTab = (id) => {
    setTab(id);
    if (window.innerWidth < 768) setSideOpen(false);
  };

  const isMobile = () => window.innerWidth < 768;

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sideOpen && isMobile() && (
        <div className="overlay" onClick={()=>setSideOpen(false)} style={{ display:"block" }} />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${sideOpen?"open":""}`}>
        <div style={{ padding:"6px 8px 20px", borderBottom:"1px solid var(--border)", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,rgba(124,106,247,0.3),rgba(167,139,250,0.1))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💰</div>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:700 }}>অর্থ ব্যবস্থাপক</span>
          </div>
          <div style={{ fontSize:11, color:"var(--text3)", wordBreak:"break-all", paddingLeft:2 }}>{user.email}</div>
        </div>
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:3 }}>
          {navs.map(n=>(
            <button key={n.id} className={`nav-btn ${tab===n.id?"on":""}`} onClick={()=>goTab(n.id)}>
              <div style={{ width:34, height:34, borderRadius:10, background:tab===n.id?"rgba(124,106,247,0.2)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, transition:"background 0.2s" }}>{n.icon}</div>
              <span style={{ flex:1 }}>{n.label}</span>
              {tab===n.id&&<div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", boxShadow:"0 0 8px var(--accent)" }}/>}
            </button>
          ))}
        </nav>
        <button className="btn" onClick={onLogout} style={{ width:"100%", padding:"11px", borderRadius:12, background:"rgba(255,107,107,0.08)", color:"#ff6b6b", border:"1px solid rgba(255,107,107,0.15)", fontSize:14, marginTop:8 }}>
          🚪 লগআউট
        </button>
      </div>

      {/* MAIN */}
      <div className="main-area">
        {/* TOPBAR */}
        <div className="topbar">
          <button onClick={()=>setSideOpen(!sideOpen)} className="btn" style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,0.05)", color:"var(--text2)", border:"1px solid var(--border)", fontSize:16, flexShrink:0 }}>☰</button>
          <div style={{ flex:1 }}>
            <h2 style={{ fontSize:15, fontWeight:700 }}>{navs.find(n=>n.id===tab)?.icon} {navs.find(n=>n.id===tab)?.label}</h2>
            <p className="hide-mobile" style={{ fontSize:11, color:"var(--text3)" }}>{new Date().toLocaleDateString("bn-BD",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,rgba(124,106,247,0.25),rgba(167,139,250,0.1))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👤</div>
        </div>

        {/* PAGE CONTENT */}
        <div className="page">
          {tab==="dashboard" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div className="stat-grid">
                <StatCard icon="📅" label="এই মাসের মোট খরচ" value={totalM} color="#7c6af7" sub={`${monthExp.length}টি লেনদেন`} delay={0}/>
                <StatCard icon="📆" label="এই সপ্তাহের খরচ" value={totalW} color="#00d4aa" sub={`${weekExp.length}টি লেনদেন`} delay={80}/>
                <StatCard icon="🏆" label="সর্বোচ্চ বিভাগ" value={topC?.[1]||0} color={topCObj?.color||"#ffd93d"} sub={topCObj?`${topCObj.icon} ${topCObj.label}`:"তথ্য নেই"} delay={160}/>
                <StatCard icon="💳" label="মোট লেনদেন" value={expenses.length} color="#ff85a1" sub="সকল সময়" delay={240}/>
              </div>
              <ExpenseList expenses={expenses} onDelete={del}/>
            </div>
          )}
          {tab==="expenses" && (
            <div style={{ maxWidth:620 }}>
              <ExpenseForm userId={user.id} onAdd={load}/>
              <div style={{ marginTop:20 }}><ExpenseList expenses={expenses} onDelete={del}/></div>
            </div>
          )}
          {tab==="analytics" && <div style={{ maxWidth:680 }}><Analytics expenses={expenses}/></div>}
          {tab==="ai" && <div style={{ maxWidth:680 }}><AIAdvisor expenses={expenses} userEmail={user.email}/></div>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    MockAuth.getUser().then(({data}) => { setUser(data?.user||null); setChecking(false); });
  }, []);

  if (checking) return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)", gap:20 }}>
      <div style={{ fontSize:40, animation:"float 2s ease-in-out infinite" }}>💰</div>
      <div className="spin" style={{ width:32, height:32, borderWidth:3, borderColor:"rgba(124,106,247,0.2)", borderTopColor:"#7c6af7" }}/>
    </div>
  );

  return (
    <>
      <style>{G}</style>
      {user
        ? <Dashboard user={user} onLogout={async()=>{ await MockAuth.signOut(); setUser(null); }}/>
        : <AuthPage onLogin={u=>setUser(u)}/>
      }
    </>
  );
}
