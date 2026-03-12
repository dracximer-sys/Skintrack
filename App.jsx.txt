import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ══════════════════════════════════════════════════════════════
//  ⚙️  KONFIGURASI SUPABASE — ganti dengan milikmu
// ══════════════════════════════════════════════════════════════
const SUPABASE_URL    = "https://faigdhnwkkjukhzkfbch.supabase.co";
const SUPABASE_ANON   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaWdkaG53a2tqdWtoemtmYmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzUzNDMsImV4cCI6MjA4ODkxMTM0M30.fs28K07mvpd70s818K-wDcFwZxpekgI9x5f61TRAiQ4";
// ══════════════════════════════════════════════════════════════

// ─── Supabase mini-client (no npm needed) ─────────────────────
const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
  url: (table, qs = "") => `${SUPABASE_URL}/rest/v1/${table}${qs}`,
  async get(table, qs = "")  { const r = await fetch(sb.url(table, qs), { headers: { ...sb.headers, "Accept": "application/json" } }); return r.json(); },
  async post(table, body)    { const r = await fetch(sb.url(table), { method: "POST", headers: { ...sb.headers, "Prefer": "return=representation" }, body: JSON.stringify(body) }); return r.json(); },
  async patch(table, qs, body){ const r = await fetch(sb.url(table, qs), { method: "PATCH", headers: { ...sb.headers, "Prefer": "return=representation" }, body: JSON.stringify(body) }); return r.json(); },
  async delete(table, qs)    { await fetch(sb.url(table, qs), { method: "DELETE", headers: sb.headers }); },
  async upsert(table, body)  { const r = await fetch(sb.url(table), { method: "POST", headers: { ...sb.headers, "Prefer": "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(body) }); return r.json(); },
};

// ─── Device user_id (persisted locally, never changes) ───────
function getOrCreateUserId() {
  let id = localStorage.getItem("sk_uid");
  if (!id) { id = "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("sk_uid", id); }
  return id;
}
const USER_ID = getOrCreateUserId();

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = ["Cleanser","Toner","Serum","Moisturizer","Sunscreen","Eye Cream","Exfoliant","Mask","Oil","Mist","Other"];
const ROUTINES   = ["morning","night","both","interval"];
const ROUTINE_LABELS = { morning:"☀️ Morning", night:"🌙 Night", both:"☀️🌙 Both", interval:"🔁 Interval" };
const FREQ_OPTIONS   = [1,2,3,4,5,6,7,10,14,21,28];
const MONTH_NAMES    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_ID       = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_ID         = ["Minggu","Senin","Selasa","Rabu","Kamis","Jum'at","Sabtu"];

const CAT_COLORS = {
  Cleanser:"#6EE7D0", Toner:"#A5B4FC", Serum:"#FCA5A5", Moisturizer:"#86EFAC",
  Sunscreen:"#FDE68A", "Eye Cream":"#C4B5FD", Exfoliant:"#FDA4AF", Mask:"#93C5FD",
  Oil:"#FCD34D", Mist:"#6EE7B7", Other:"#D1D5DB"
};
const CAT_EMOJI = { Cleanser:"🧼", Toner:"💦", Serum:"💧", Moisturizer:"🧴", Sunscreen:"☀️", "Eye Cream":"👁️", Exfoliant:"✨", Mask:"🫧", Oil:"💛", Mist:"🌫️", Other:"🌸" };
const ICON_PATHS = {
  plus:"M12 5v14M5 12h14", check:"M5 13l4 4L19 7", x:"M6 18L18 6M6 6l12 12",
  sun:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon:"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  chart:"M18 20V10M12 20V4M6 20v-6",
  list:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  shop:"M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  repeat:"M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
  tag:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  chevdown:"M6 9l6 6 6-6", chevup:"M18 15l-6-6-6 6",
  cloud:"M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  wifi:"M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01",
  alert:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
};

// ─── Utility ─────────────────────────────────────────────────
const todayISO    = () => new Date().toISOString().split("T")[0];
const monthKey    = (d) => d.slice(0, 7);
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const pad         = (n) => String(n).padStart(2, "0");
const fmtRp       = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const diffDays    = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmtDate     = (d) => { const [y,m,dd] = d.split("-"); return `${dd} ${MONTH_NAMES[+m-1]} ${y}`; };
const isConfigured = () => !SUPABASE_URL.includes("XXXXX") && !SUPABASE_ANON.includes("XXXXX");

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

// ─── Live Clock ───────────────────────────────────────────────
function LiveClock({ C }) {
  const now = useLiveClock();
  const h = now.getHours();
  const tod = h<6?{l:"Dini Hari",i:"🌙"}:h<11?{l:"Pagi",i:"🌅"}:h<15?{l:"Siang",i:"☀️"}:h<18?{l:"Sore",i:"🌤️"}:h<21?{l:"Petang",i:"🌆"}:{l:"Malam",i:"🌙"};
  return (
    <div style={{ margin:"14px 18px 0", background:`linear-gradient(120deg,${C.accent}1a,${C.teal}14)`, border:`1px solid ${C.accent}30`, borderRadius:16, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
          <span style={{ fontSize:14 }}>{tod.i}</span>
          <span style={{ fontSize:11, fontWeight:700, color:C.accent, letterSpacing:"0.06em", textTransform:"uppercase" }}>{tod.l}</span>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{DAY_ID[now.getDay()]}</div>
        <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{now.getDate()} {MONTH_ID[now.getMonth()]} {now.getFullYear()}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:32, fontWeight:700, color:C.accent, lineHeight:1, letterSpacing:"0.02em" }}>{pad(h)}:{pad(now.getMinutes())}</div>
        <div style={{ fontSize:12, color:C.sub, marginTop:2, letterSpacing:"0.04em" }}>:{pad(now.getSeconds())}</div>
      </div>
    </div>
  );
}

// ─── Sync Status Badge ────────────────────────────────────────
function SyncBadge({ status, C }) {
  const cfg = {
    syncing: { color:"#fbbf24", label:"Menyimpan...", icon:"cloud" },
    synced:  { color:C.teal,   label:"Tersimpan ✓",  icon:"cloud" },
    error:   { color:C.rose,   label:"Gagal sync",   icon:"alert" },
    offline: { color:C.sub,    label:"Offline",       icon:"wifi"  },
    idle:    { color:C.sub,    label:"",              icon:"cloud" },
  }[status] || { color:C.sub, label:"", icon:"cloud" };
  if (status === "idle" || status === "synced") return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:cfg.color, fontWeight:600, background:cfg.color+"18", border:`1px solid ${cfg.color}44`, borderRadius:99, padding:"3px 10px" }}>
      <Icon name={cfg.icon} size={11} />{cfg.label}
    </span>
  );
}

// ─── Setup Banner ─────────────────────────────────────────────
function SetupBanner({ C }) {
  return (
    <div style={{ margin:"14px 18px 0", background:"#fbbf2418", border:"1px solid #fbbf2455", borderRadius:14, padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:18 }}>⚙️</span>
        <span style={{ fontWeight:700, fontSize:14, color:"#fbbf24" }}>Supabase belum dikonfigurasi</span>
      </div>
      <div style={{ fontSize:12, color:C.sub, lineHeight:1.7 }}>
        Untuk menyimpan data ke cloud, edit baris ini di kode:<br/>
        <code style={{ background:C.card2, borderRadius:6, padding:"2px 6px", fontSize:11, color:C.accent }}>SUPABASE_URL</code> dan{" "}
        <code style={{ background:C.card2, borderRadius:6, padding:"2px 6px", fontSize:11, color:C.accent }}>SUPABASE_ANON</code><br/>
        <br/>
        Sementara ini data tersimpan di <b style={{ color:C.text }}>localStorage</b> (local).
      </div>
    </div>
  );
}

function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={ICON_PATHS[name]||""}/></svg>;
}
function Pill({ label, color }) {
  return <span style={{ background:color+"33", color, border:`1px solid ${color}55`, borderRadius:99, padding:"2px 9px", fontSize:11, fontWeight:600, letterSpacing:"0.03em", whiteSpace:"nowrap" }}>{label}</span>;
}
function ProgressBar({ pct, color="#A5B4FC", dark }) {
  return <div style={{ background:dark?"#ffffff18":"#00000010", borderRadius:99, height:8, overflow:"hidden", flex:1 }}><div style={{ width:`${Math.min(100,Math.max(0,pct))}%`, background:color, height:"100%", borderRadius:99, transition:"width 0.6s cubic-bezier(.4,0,.2,1)" }}/></div>;
}
function Modal({ open, onClose, title, children, dark, C }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"#00000077",backdropFilter:"blur(8px)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:dark?"#1a1a2e":"#fff", borderRadius:"24px 24px 0 0", padding:"20px 20px 40px", width:"100%", maxWidth:500, boxShadow:"0 -8px 60px #0006", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ width:40,height:4,background:C.border,borderRadius:99,margin:"0 auto 20px",opacity:0.5 }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:700,color:C.text,fontFamily:"'Playfair Display',Georgia,serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background:C.card2,border:"none",cursor:"pointer",color:C.sub,padding:6,borderRadius:10 }}><Icon name="x" size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function RoutineSection({ title, prods, slot, todayStr, isLogged, toggleLog, streakFor, S, C }) {
  return (
    <div>
      <div style={S.sectionTitle}>{title}</div>
      <div style={S.card}>
        {prods.map((p, i) => {
          const color=CAT_COLORS[p.category]||C.accent, checked=isLogged(p.id,todayStr,slot), streak=streakFor(p.id,slot);
          return (
            <div key={p.id} style={{ ...S.productRow, borderBottom:i===prods.length-1?"none":S.productRow.borderBottom }}>
              <div style={S.checkBox(checked,color)} className="press" onClick={()=>toggleLog(p.id,todayStr,slot)}>{checked&&<Icon name="check" size={14}/>}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,fontSize:14,color:checked?C.sub:C.text,textDecoration:checked?"line-through":"none" }}>{p.name}</div>
                <div style={{ marginTop:3 }}><Pill label={p.category} color={color}/></div>
              </div>
              {streak>0&&<span style={{ fontSize:11,color:C.accent,fontWeight:700 }}>🔥{streak}d</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function SkinTrack() {
  const prefersDark = typeof window!=="undefined"&&window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const [dark, setDark] = useLocalStorage("sk_dark", prefersDark);
  const [tab,  setTab]  = useState("tracker");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error | offline

  // ── Data state ───────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [logs,      setLogs]      = useState({});  // { "date__pid__slot": true }
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── Offline fallback (localStorage) ─────────────────────────
  const [lsProducts,  setLsProducts]  = useLocalStorage("sk_products",  []);
  const [lsLogs,      setLsLogs]      = useLocalStorage("sk_logs",       {});
  const [lsPurchases, setLsPurchases] = useLocalStorage("sk_purchases",  []);

  const configured = isConfigured();

  // ── Sync indicator helper ────────────────────────────────────
  const syncTimer = useRef(null);
  const showSync = (s) => {
    setSyncStatus(s);
    if (s === "synced") { clearTimeout(syncTimer.current); syncTimer.current = setTimeout(() => setSyncStatus("idle"), 2500); }
  };

  // ── LOAD data on mount ───────────────────────────────────────
  useEffect(() => {
    if (!configured) {
      setProducts(lsProducts); setLogs(lsLogs); setPurchases(lsPurchases);
      setLoading(false); return;
    }
    (async () => {
      try {
        const [prods, logRows, purchRows] = await Promise.all([
          sb.get("products",  `?user_id=eq.${USER_ID}&order=created_at.asc`),
          sb.get("usage_logs",`?user_id=eq.${USER_ID}`),
          sb.get("purchases", `?user_id=eq.${USER_ID}&order=date.desc`),
        ]);
        setProducts(Array.isArray(prods) ? prods : []);
        // rebuild logs map from rows
        const logMap = {};
        if (Array.isArray(logRows)) logRows.forEach(r => { if (r.used) logMap[`${r.date}__${r.product_id}__${r.slot}`] = true; });
        setLogs(logMap);
        setPurchases(Array.isArray(purchRows) ? purchRows : []);
        showSync("synced");
      } catch { setSyncStatus("offline"); setProducts(lsProducts); setLogs(lsLogs); setPurchases(lsPurchases); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Theme & Styles ───────────────────────────────────────────
  const C = {
    bg:dark?"#0d0d1a":"#f7f5ff", card:dark?"#171727":"#ffffff", card2:dark?"#1e1e32":"#f2efff",
    border:dark?"#2a2a4a":"#e4dfff", text:dark?"#e2d9f3":"#1e1b4b", sub:dark?"#8878b0":"#7c6fa0",
    accent:"#a78bfa", teal:"#5eead4", rose:"#fb7185", green:"#86efac",
    nav:dark?"#12121f":"#ffffff", line:dark?"#2a2a4a":"#ede9ff",
  };
  const S = {
    app:{ minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",transition:"background 0.3s,color 0.3s",paddingBottom:90 },
    card:{ background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"16px",marginBottom:12 },
    label:{ fontSize:11,fontWeight:700,color:C.sub,display:"block",marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase" },
    input:{ width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:14 },
    select:{ width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:14,appearance:"none" },
    btn:(bg="#a78bfa")=>({ background:bg,color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",width:"100%",marginTop:4 }),
    btnSm:(bg=C.card2,col=C.sub)=>({ background:bg,color:col,border:"none",borderRadius:10,padding:"6px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600 }),
    sectionTitle:{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:C.text,margin:"20px 0 10px",display:"flex",alignItems:"center",gap:6 },
    productRow:{ display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`1px solid ${C.border}` },
    nav:{ position:"fixed",bottom:0,left:0,right:0,background:C.nav,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 14px",zIndex:50 },
    navBtn:(a)=>({ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:a?C.accent:C.sub,fontWeight:a?700:400,fontSize:10.5,padding:"0 12px" }),
    fab:{ position:"fixed",bottom:82,right:20,background:"linear-gradient(135deg,#a78bfa,#818cf8)",border:"none",borderRadius:99,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 8px 24px #a78bfa55",color:"#fff",zIndex:60 },
    checkBox:(checked,color)=>({ width:30,height:30,borderRadius:9,border:`2px solid ${checked?color:C.border}`,background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.18s",flexShrink:0,color:"#fff" }),
  };

  // ── Product helpers ──────────────────────────────────────────
  const getProd      = id => products.find(p => p.id === id);
  const getProdName  = id => getProd(id)?.name || "Unknown";
  const getProdColor = id => CAT_COLORS[getProd(id)?.category] || "#a78bfa";

  // ── PRODUCTS CRUD ────────────────────────────────────────────
  const emptyProdForm = { name:"", category:"Cleanser", routine:"morning", freq:3 };
  const [prodForm,   setProdForm]   = useState(emptyProdForm);
  const [editProd,   setEditProd]   = useState(null);
  const [showAddProd,setShowAddProd]= useState(false);

  const openAddProd  = () => { setProdForm(emptyProdForm); setEditProd(null); setShowAddProd(true); };
  const openEditProd = p  => { setProdForm({ name:p.name,category:p.category,routine:p.routine,freq:p.freq||3 }); setEditProd(p); setShowAddProd(true); };

  const saveProd = async () => {
    if (!prodForm.name.trim()) return;
    showSync("syncing");
    try {
      if (editProd) {
        if (configured) await sb.patch("products",`?id=eq.${editProd.id}`,{ name:prodForm.name,category:prodForm.category,routine:prodForm.routine,freq:prodForm.freq });
        setProducts(ps => ps.map(p => p.id===editProd.id?{...p,...prodForm}:p));
      } else {
        const newProd = { user_id:USER_ID, name:prodForm.name, category:prodForm.category, routine:prodForm.routine, freq:prodForm.freq };
        if (configured) {
          const res = await sb.post("products", newProd);
          setProducts(ps => [...ps, Array.isArray(res)?res[0]:res]);
        } else {
          setProducts(ps => [...ps, { ...newProd, id:Date.now().toString(), created_at:new Date().toISOString() }]);
        }
      }
      if (!configured) setLsProducts(products);
      showSync("synced");
    } catch { showSync("error"); }
    setShowAddProd(false);
  };

  const deleteProd = async id => {
    showSync("syncing");
    try {
      if (configured) await sb.delete("products",`?id=eq.${id}`);
      setProducts(ps => ps.filter(p => p.id!==id));
      showSync("synced");
    } catch { showSync("error"); }
  };

  // ── TRACKER ──────────────────────────────────────────────────
  const todayStr = todayISO();
  const toggleLog = async (productId, date, slot) => {
    const key  = `${date}__${productId}__${slot}`;
    const used = !logs[key];
    setLogs(l => ({ ...l, [key]: used }));
    if (!configured) { setLsLogs(prev => ({ ...prev, [key]: used })); return; }
    showSync("syncing");
    try {
      await sb.upsert("usage_logs", { user_id:USER_ID, product_id:productId, date, slot, used });
      showSync("synced");
    } catch { showSync("error"); }
  };

  const isLogged = useCallback((productId, date, slot) => !!logs[`${date}__${productId}__${slot}`], [logs]);

  const isDueToday = useCallback(p => {
    if (p.routine!=="interval") return true;
    const freq=p.freq||3;
    const all=Object.keys(logs).filter(k=>k.includes(`__${p.id}__interval`)&&logs[k]).map(k=>k.split("__")[0]).sort();
    if (!all.length) return true;
    return diffDays(all[all.length-1],todayStr)>=freq;
  },[logs,todayStr]);

  const nextDueLabel = useCallback(p => {
    if (p.routine!=="interval") return null;
    const freq=p.freq||3;
    const all=Object.keys(logs).filter(k=>k.includes(`__${p.id}__interval`)&&logs[k]).map(k=>k.split("__")[0]).sort();
    if (!all.length) return "Due today";
    const days=diffDays(all[all.length-1],todayStr);
    if (days>=freq) return "Due today";
    const rem=freq-days; return rem===1?"Due tomorrow":`Due in ${rem} days`;
  },[logs,todayStr]);

  const streakFor = useCallback((pid, slot) => {
    let streak=0, d=new Date();
    for (let i=0;i<365;i++) { if (isLogged(pid,d.toISOString().split("T")[0],slot)){streak++;d.setDate(d.getDate()-1);}else break; }
    return streak;
  },[isLogged]);

  const morningProds  = products.filter(p=>p.routine==="morning"||p.routine==="both");
  const nightProds    = products.filter(p=>p.routine==="night"||p.routine==="both");
  const intervalProds = products.filter(p=>p.routine==="interval");
  const totalToday = morningProds.length+nightProds.length+intervalProds.filter(p=>isDueToday(p)).length;
  const doneToday  = [...morningProds.map(p=>isLogged(p.id,todayStr,"morning")?1:0),...nightProds.map(p=>isLogged(p.id,todayStr,"night")?1:0),...intervalProds.filter(p=>isDueToday(p)).map(p=>isLogged(p.id,todayStr,"interval")?1:0)].reduce((a,b)=>a+b,0);
  const todayPct   = totalToday?Math.round((doneToday/totalToday)*100):0;

  // ── REPORT ───────────────────────────────────────────────────
  const [reportMonth,setReportMonth] = useState(monthKey(todayISO()));
  const [ry,rm] = reportMonth.split("-").map(Number);
  const totalDays=daysInMonth(ry,rm), reportLabel=`${MONTH_NAMES[rm-1]} ${ry}`;
  const shiftMonth = d => { const dt=new Date(`${reportMonth}-01`); dt.setMonth(dt.getMonth()+d); setReportMonth(monthKey(dt.toISOString())); };

  const productReport = useMemo(()=>products.map(p=>{
    if (p.routine==="interval"){
      const freq=p.freq||3, possible=Math.max(1,Math.floor(totalDays/freq));
      let used=0; for(let d=1;d<=totalDays;d++){if(logs[`${ry}-${pad(rm)}-${pad(d)}__${p.id}__interval`])used++;}
      return{...p,used,possible,pct:Math.min(100,Math.round((used/possible)*100))};
    }
    const routines=p.routine==="both"?["morning","night"]:[p.routine]; let used=0;
    routines.forEach(r=>{for(let d=1;d<=totalDays;d++){if(logs[`${ry}-${pad(rm)}-${pad(d)}__${p.id}__${r}`])used++;}});
    const possible=routines.length*totalDays;
    return{...p,used,possible,pct:Math.round((used/Math.max(1,possible))*100)};
  }),[products,logs,ry,rm,totalDays]);
  const overallPct=productReport.length?Math.round(productReport.reduce((a,p)=>a+p.pct,0)/productReport.length):0;

  // ── PURCHASES ────────────────────────────────────────────────
  const [purchMonth,setPurchMonth]     = useState(monthKey(todayISO()));
  const [expandedProd,setExpandedProd] = useState(null);
  const [showAddPurch,setShowAddPurch] = useState(false);
  const [editPurch,setEditPurch]       = useState(null);
  const emptyPurchForm = { productId:"",date:todayStr,price:"",qty:1,shop:"",note:"" };
  const [purchForm,setPurchForm] = useState(emptyPurchForm);

  const [py,pm] = purchMonth.split("-").map(Number);
  const purchMonthLabel=`${MONTH_NAMES[pm-1]} ${py}`;
  const shiftPurchMonth = d=>{ const dt=new Date(`${purchMonth}-01`); dt.setMonth(dt.getMonth()+d); setPurchMonth(monthKey(dt.toISOString())); };

  const getLastPurchaseData = pid => [...purchases].filter(p=>p.productId===pid||p.product_id===pid).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;

  const handlePurchProductChange = pid => {
    if (!pid){setPurchForm(f=>({...f,productId:"",price:"",shop:"",note:""}));return;}
    const last=getLastPurchaseData(pid);
    setPurchForm(f=>({...f,productId:pid,price:last?last.price:"",shop:last?last.shop:"",note:"",qty:1}));
  };

  const openAddPurch = (prePid=null)=>{
    setEditPurch(null);
    if(prePid){const last=getLastPurchaseData(prePid); setPurchForm({productId:prePid,date:todayStr,price:last?last.price:"",qty:1,shop:last?last.shop:"",note:""});}
    else setPurchForm(emptyPurchForm);
    setShowAddPurch(true);
  };
  const openEditPurch = item=>{ setPurchForm({productId:item.productId||item.product_id,date:item.date,price:item.price,qty:item.qty,shop:item.shop,note:item.note||""}); setEditPurch(item); setShowAddPurch(true); };

  const savePurch = async()=>{
    if(!purchForm.productId||!purchForm.price) return;
    showSync("syncing");
    const entry = { user_id:USER_ID, product_id:purchForm.productId, productId:purchForm.productId, date:purchForm.date, price:Number(purchForm.price), qty:Number(purchForm.qty)||1, shop:purchForm.shop, note:purchForm.note };
    try {
      if(editPurch){
        if(configured) await sb.patch("purchases",`?id=eq.${editPurch.id}`,{ date:entry.date,price:entry.price,qty:entry.qty,shop:entry.shop,note:entry.note });
        setPurchases(ps=>ps.map(p=>p.id===editPurch.id?{...p,...entry}:p));
      } else {
        if(configured){ const res=await sb.post("purchases",{...entry,product_id:entry.productId}); setPurchases(ps=>[...ps,{...(Array.isArray(res)?res[0]:res),productId:entry.productId}]); }
        else setPurchases(ps=>[...ps,{...entry,id:Date.now().toString()}]);
      }
      showSync("synced");
    } catch{showSync("error");}
    setShowAddPurch(false);
  };

  const deletePurch = async id=>{
    showSync("syncing");
    try{ if(configured) await sb.delete("purchases",`?id=eq.${id}`); setPurchases(ps=>ps.filter(p=>p.id!==id)); showSync("synced"); }
    catch{showSync("error");}
  };

  const purchasesThisMonth = purchases.filter(p=>p.date.startsWith(purchMonth));
  const totalSpentMonth = purchasesThisMonth.reduce((a,p)=>a+p.price*p.qty,0);
  const totalSpentAll   = purchases.reduce((a,p)=>a+p.price*p.qty,0);

  const groupedThisMonth = useMemo(()=>{
    const map={};
    purchasesThisMonth.forEach(item=>{
      const pid=item.productId||item.product_id;
      if(!map[pid]) map[pid]={totalQty:0,totalSpent:0,entries:[]};
      map[pid].totalQty+=item.qty||1; map[pid].totalSpent+=item.price*(item.qty||1); map[pid].entries.push(item);
    });
    Object.values(map).forEach(g=>g.entries.sort((a,b)=>b.date.localeCompare(a.date)));
    return map;
  },[purchasesThisMonth]);
  const sortedGroupKeys=Object.keys(groupedThisMonth).sort((a,b)=>groupedThisMonth[b].totalSpent-groupedThisMonth[a].totalSpent);

  const spendByProduct=useMemo(()=>{ const map={}; purchases.forEach(p=>{ const pid=p.productId||p.product_id; map[pid]=(map[pid]||0)+p.price*p.qty; }); return map; },[purchases]);
  const last6Months=useMemo(()=>{ const res=[],d=new Date(); for(let i=5;i>=0;i--){ const dt=new Date(d.getFullYear(),d.getMonth()-i,1),mk=monthKey(dt.toISOString()); res.push({mk,label:MONTH_NAMES[dt.getMonth()],val:purchases.filter(p=>p.date.startsWith(mk)).reduce((a,p)=>a+p.price*p.qty,0)}); } return res; },[purchases]);
  const maxBarVal=Math.max(...last6Months.map(m=>m.val),1);

  // ── Loading screen ───────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh",background:dark?"#0d0d1a":"#f7f5ff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12 }}>
      <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:700,color:"#a78bfa" }}>SkinTrack</div>
      <div style={{ fontSize:13,color:dark?"#8878b0":"#7c6fa0" }}>Memuat data{configured?" dari Supabase":""}...</div>
      <div style={{ width:40,height:4,borderRadius:99,background:"#a78bfa",animation:"pulse 1s infinite alternate",marginTop:4 }}/>
      <style>{"@keyframes pulse{from{opacity:0.3}to{opacity:1}}"}</style>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');
        *{box-sizing:border-box;} body{margin:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px;}
        .press:active{transform:scale(0.92);transition:transform 0.1s;}
        @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fi{animation:fi 0.28s ease both;}
        .hl:hover{transform:translateY(-1px);transition:transform 0.18s;}
        @keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:800px}} .slide-down{animation:slideDown 0.3s ease both;overflow:hidden;}
        input::placeholder{color:${C.sub};opacity:0.7;}
        select option{background:${dark?"#1a1a2e":"#fff"};color:${C.text};}
      `}</style>
      <div style={S.app}>

        {/* HEADER */}
        <div style={{ padding:"20px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:700,color:C.accent,letterSpacing:"-0.5px" }}>SkinTrack</div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:2 }}>
              <div style={{ fontSize:11,color:C.sub,fontWeight:500,letterSpacing:"0.14em",textTransform:"uppercase" }}>Skincare Routine Tracker</div>
              {configured
                ? <span style={{ fontSize:10,color:C.teal,fontWeight:700,background:C.teal+"18",border:`1px solid ${C.teal}44`,borderRadius:99,padding:"1px 7px" }}>☁️ Cloud</span>
                : <span style={{ fontSize:10,color:"#fbbf24",fontWeight:700,background:"#fbbf2418",border:`1px solid #fbbf2444`,borderRadius:99,padding:"1px 7px" }}>💾 Local</span>
              }
              <SyncBadge status={syncStatus} C={C}/>
            </div>
          </div>
          <button onClick={()=>setDark(d=>!d)} style={{ background:C.card2,border:`1px solid ${C.border}`,borderRadius:99,padding:"7px 14px",cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600 }}>
            {dark?<><Icon name="sun" size={13}/> Light</>:<><Icon name="moon" size={13}/> Dark</>}
          </button>
        </div>

        {!configured && <SetupBanner C={C}/>}
        {tab==="tracker" && <LiveClock C={C}/>}

        {/* ══ TRACKER ═══════════════════════════════════════ */}
        {tab==="tracker"&&(
          <div style={{ padding:"0 16px" }} className="fi">
            <div style={{ ...S.card,background:`linear-gradient(135deg,${C.accent}20,${C.teal}15)`,border:`1px solid ${C.accent}44`,marginTop:14,display:"flex",alignItems:"center",gap:16 }}>
              <div style={{ position:"relative",width:72,height:72,flexShrink:0 }}>
                <svg width={72} height={72}>
                  <circle cx={36} cy={36} r={30} fill="none" stroke={C.accent+"30"} strokeWidth={5}/>
                  <circle cx={36} cy={36} r={30} fill="none" stroke={C.accent} strokeWidth={5} strokeDasharray={`${(todayPct/100)*188.5} 188.5`} strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition:"stroke-dasharray 0.7s" }}/>
                </svg>
                <span style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:C.accent }}>{todayPct}%</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:12,color:C.sub,textTransform:"uppercase",letterSpacing:"0.08em" }}>Today's Progress</div>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:700,color:C.text,lineHeight:1.1 }}>{doneToday}<span style={{ fontSize:14,color:C.sub,fontWeight:500 }}>/{totalToday} done</span></div>
                <div style={{ marginTop:8 }}><ProgressBar pct={todayPct} color={C.accent} dark={dark}/></div>
              </div>
            </div>
            {morningProds.length>0&&<RoutineSection title="☀️ Morning Routine" prods={morningProds} slot="morning" todayStr={todayStr} isLogged={isLogged} toggleLog={toggleLog} streakFor={streakFor} S={S} C={C}/>}
            {nightProds.length>0&&<RoutineSection title="🌙 Night Routine" prods={nightProds} slot="night" todayStr={todayStr} isLogged={isLogged} toggleLog={toggleLog} streakFor={streakFor} S={S} C={C}/>}
            {intervalProds.length>0&&(
              <div>
                <div style={S.sectionTitle}><Icon name="repeat" size={15}/> Interval Routine</div>
                <div style={S.card}>
                  {intervalProds.map((p,i)=>{
                    const color=CAT_COLORS[p.category]||C.accent,due=isDueToday(p),checked=isLogged(p.id,todayStr,"interval"),streak=streakFor(p.id,"interval");
                    return(
                      <div key={p.id} style={{ ...S.productRow,borderBottom:i===intervalProds.length-1?"none":S.productRow.borderBottom,opacity:(!due&&!checked)?0.5:1 }}>
                        <div style={S.checkBox(checked,color)} className="press" onClick={()=>due&&toggleLog(p.id,todayStr,"interval")}>{checked&&<Icon name="check" size={14}/>}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600,fontSize:14,color:checked?C.sub:C.text,textDecoration:checked?"line-through":"none" }}>{p.name}</div>
                          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:3 }}>
                            <Pill label={p.category} color={color}/><Pill label={`Every ${p.freq||3}d`} color={C.teal}/>
                            <span style={{ fontSize:11,color:due?"#86efac":C.sub,fontWeight:600 }}>{nextDueLabel(p)}</span>
                          </div>
                        </div>
                        {streak>0&&<span style={{ fontSize:11,color:C.accent,fontWeight:700 }}>🔥{streak}x</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {products.length===0&&<div style={{ textAlign:"center",padding:"60px 20px",color:C.sub }}><div style={{ fontSize:44,marginBottom:12 }}>🧴</div><div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,color:C.text,marginBottom:6 }}>No products yet</div><div style={{ fontSize:13 }}>Add your first skincare product to start tracking.</div></div>}
          </div>
        )}

        {/* ══ PRODUCTS ══════════════════════════════════════ */}
        {tab==="products"&&(
          <div style={{ padding:"0 16px" }} className="fi">
            <div style={S.sectionTitle}><Icon name="list" size={15}/> My Products <span style={{ fontFamily:"inherit",fontSize:12,color:C.sub,fontWeight:400 }}>({products.length})</span></div>
            {products.length===0&&<div style={{ textAlign:"center",padding:"60px 20px",color:C.sub }}><div style={{ fontSize:44 }}>✨</div><div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,color:C.text,margin:"12px 0 6px" }}>Build your routine</div><div style={{ fontSize:13 }}>Tap + to add your skincare products.</div></div>}
            {products.map(p=>{
              const color=CAT_COLORS[p.category]||C.accent;
              return(
                <div key={p.id} className="hl" style={{ ...S.card,display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:44,height:44,borderRadius:14,background:color+"28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{CAT_EMOJI[p.category]||"🌸"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:14,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.name}</div>
                    <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginTop:4 }}>
                      <Pill label={p.category} color={color}/><Pill label={ROUTINE_LABELS[p.routine]} color={C.accent}/>
                      {p.routine==="interval"&&<Pill label={`Every ${p.freq||3} days`} color={C.teal}/>}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>openEditProd(p)} style={S.btnSm(C.card2,C.sub)}><Icon name="edit" size={14}/></button>
                    <button onClick={()=>deleteProd(p.id)} style={S.btnSm("#fb718522","#fb7185")}><Icon name="trash" size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PURCHASES ═════════════════════════════════════ */}
        {tab==="purchases"&&(
          <div style={{ padding:"0 16px" }} className="fi">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18 }}>
              <div style={{ ...S.card,background:`linear-gradient(135deg,${C.accent}22,${C.teal}15)`,border:`1px solid ${C.accent}44` }}>
                <div style={{ fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>Total Spent</div>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:C.accent,marginTop:4,wordBreak:"break-all" }}>{fmtRp(totalSpentAll)}</div>
                <div style={{ fontSize:11,color:C.sub,marginTop:2 }}>all time · {purchases.length} item</div>
              </div>
              <div style={{ ...S.card,background:`linear-gradient(135deg,${C.teal}22,${C.accent}15)`,border:`1px solid ${C.teal}44` }}>
                <div style={{ fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>This Month</div>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:C.teal,marginTop:4,wordBreak:"break-all" }}>{fmtRp(totalSpentMonth)}</div>
                <div style={{ fontSize:11,color:C.sub,marginTop:2 }}>{purchMonthLabel} · {purchasesThisMonth.length} item</div>
              </div>
            </div>
            {purchases.length>0&&(<><div style={S.sectionTitle}><Icon name="chart" size={15}/> Monthly Spending</div><div style={S.card}><div style={{ display:"flex",alignItems:"flex-end",gap:6,height:88,justifyContent:"space-between" }}>{last6Months.map(m=>(<div key={m.mk} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}><div style={{ fontSize:9,color:C.sub,fontWeight:600,textAlign:"center" }}>{m.val>0?(m.val>=1000000?`${(m.val/1000000).toFixed(1)}M`:`${(m.val/1000).toFixed(0)}K`):""}</div><div style={{ width:"100%",background:m.mk===purchMonth?C.accent:C.accent+"55",borderRadius:"5px 5px 0 0",height:`${Math.max(4,(m.val/maxBarVal)*56)}px`,transition:"height 0.5s",minHeight:4 }}/><div style={{ fontSize:10,color:m.mk===purchMonth?C.accent:C.sub,fontWeight:600 }}>{m.label}</div></div>))}</div></div></>)}
            {purchases.length>0&&Object.keys(spendByProduct).length>0&&(<><div style={S.sectionTitle}><Icon name="tag" size={15}/> Spend by Product</div><div style={S.card}>{Object.entries(spendByProduct).sort((a,b)=>b[1]-a[1]).map(([pid,total],i,arr)=>{ const color=getProdColor(pid),pct=Math.round((total/totalSpentAll)*100); return(<div key={pid} style={{ marginBottom:i===arr.length-1?0:14 }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{getProdName(pid)}</span><span style={{ fontWeight:700,fontSize:13,color,flexShrink:0,marginLeft:8 }}>{fmtRp(total)}</span></div><div style={{ display:"flex",alignItems:"center",gap:8 }}><ProgressBar pct={pct} color={color} dark={dark}/><span style={{ fontSize:11,color:C.sub,whiteSpace:"nowrap" }}>{pct}%</span></div></div>);})}</div></>)}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={S.sectionTitle}><Icon name="calendar" size={15}/> Purchase History</div>
              <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                <button onClick={()=>shiftPurchMonth(-1)} style={{ ...S.btnSm(C.card2,C.text),border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 10px",fontSize:14 }}>‹</button>
                <span style={{ fontSize:12,fontWeight:600,color:C.sub }}>{purchMonthLabel}</span>
                <button onClick={()=>shiftPurchMonth(1)} style={{ ...S.btnSm(C.card2,C.text),border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 10px",fontSize:14 }}>›</button>
              </div>
            </div>
            {sortedGroupKeys.length===0&&<div style={{ textAlign:"center",padding:"30px 20px",color:C.sub,fontSize:13 }}>{purchases.length===0?"Tap + to log your first skincare purchase.":`No purchases in ${purchMonthLabel}.`}</div>}
            {sortedGroupKeys.map(pid=>{
              const group=groupedThisMonth[pid],prod=getProd(pid),color=getProdColor(pid),isExpanded=expandedProd===pid;
              return(
                <div key={pid} style={{ ...S.card,padding:0,overflow:"hidden",marginBottom:12 }}>
                  <div onClick={()=>setExpandedProd(isExpanded?null:pid)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",userSelect:"none" }}>
                    <div style={{ width:44,height:44,borderRadius:13,background:color+"28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{CAT_EMOJI[prod?.category]||"🛒"}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:14,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{getProdName(pid)}</div>
                      <div style={{ display:"flex",gap:8,marginTop:3,alignItems:"center",flexWrap:"wrap" }}><span style={{ fontSize:12,color:C.sub }}>{group.entries.length}x beli · total qty {group.totalQty}</span><Pill label={`${group.entries.length} transaksi`} color={color}/></div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontWeight:700,fontSize:15,color }}>{fmtRp(group.totalSpent)}</div>
                      <div style={{ fontSize:11,color:C.sub,marginTop:2,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3 }}>{isExpanded?"Sembunyikan":"Detail"}<Icon name={isExpanded?"chevup":"chevdown"} size={12}/></div>
                    </div>
                  </div>
                  {isExpanded&&(
                    <div className="slide-down">
                      <div style={{ padding:"0 16px 10px" }}>
                        <button onClick={e=>{e.stopPropagation();openAddPurch(pid);}} style={{ background:color+"22",border:`1px solid ${color}55`,color,borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}><Icon name="plus" size={13}/> Repurchase</button>
                      </div>
                      <div style={{ padding:"0 16px 14px" }}>
                        {group.entries.map((item,idx)=>(
                          <div key={item.id} style={{ display:"flex",gap:0,position:"relative" }}>
                            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:28,flexShrink:0 }}>
                              <div style={{ width:10,height:10,borderRadius:"50%",background:color,marginTop:14,flexShrink:0,border:`2px solid ${C.card}`,zIndex:1 }}/>
                              {idx<group.entries.length-1&&<div style={{ width:2,flex:1,background:C.line,marginTop:2 }}/>}
                            </div>
                            <div style={{ flex:1,paddingBottom:idx<group.entries.length-1?14:0,paddingLeft:8 }}>
                              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
                                <div>
                                  <div style={{ fontWeight:700,fontSize:13,color:C.text }}>{fmtDate(item.date)}</div>
                                  <div style={{ fontSize:12,color:C.sub,marginTop:1 }}>{item.shop&&<span>{item.shop} · </span>}qty {item.qty||1}{item.qty>1&&<span> ({fmtRp(item.price)}/pcs)</span>}</div>
                                  {item.note&&<div style={{ fontSize:11,color:C.sub,marginTop:2,fontStyle:"italic" }}>"{item.note}"</div>}
                                </div>
                                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                                  <div style={{ fontWeight:700,fontSize:13,color }}>{fmtRp(item.price*item.qty)}</div>
                                  <div style={{ display:"flex",gap:4 }}>
                                    <button onClick={e=>{e.stopPropagation();openEditPurch(item);}} style={S.btnSm(C.card2,C.sub)}><Icon name="edit" size={12}/></button>
                                    <button onClick={e=>{e.stopPropagation();deletePurch(item.id);}} style={S.btnSm("#fb718522","#fb7185")}><Icon name="trash" size={12}/></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ REPORT ════════════════════════════════════════ */}
        {tab==="report"&&(
          <div style={{ padding:"0 16px" }} className="fi">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:18 }}>
              <button onClick={()=>shiftMonth(-1)} style={{ ...S.btnSm(C.card2,C.text),border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 14px",fontSize:18 }}>‹</button>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:19,fontWeight:700,color:C.text }}>{reportLabel}</div>
              <button onClick={()=>shiftMonth(1)} style={{ ...S.btnSm(C.card2,C.text),border:`1px solid ${C.border}`,borderRadius:12,padding:"8px 14px",fontSize:18 }}>›</button>
            </div>
            <div style={{ ...S.card,background:`linear-gradient(135deg,${C.accent}22,${C.teal}15)`,border:`1px solid ${C.accent}44`,marginTop:14,textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:52,fontWeight:700,color:C.accent,lineHeight:1 }}>{overallPct}<span style={{ fontSize:20 }}>%</span></div>
              <div style={{ fontSize:12,color:C.sub,marginTop:4 }}>Overall Consistency — {reportLabel}</div>
              <div style={{ marginTop:12 }}><ProgressBar pct={overallPct} color={C.accent} dark={dark}/></div>
            </div>
            {productReport.length===0?<div style={{ textAlign:"center",padding:"40px 20px",color:C.sub,fontSize:13 }}>Add products and track them to see your report.</div>:(
              <>
                <div style={S.sectionTitle}><Icon name="chart" size={15}/> Product Usage</div>
                <div style={S.card}>{[...productReport].sort((a,b)=>b.pct-a.pct).map((p,i,arr)=>{ const color=CAT_COLORS[p.category]||C.accent; return(<div key={p.id} style={{ marginBottom:i===arr.length-1?0:16 }}><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center" }}><div style={{ display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0 }}><span style={{ fontSize:16 }}>{CAT_EMOJI[p.category]||"🌸"}</span><span style={{ fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</span>{p.routine==="interval"&&<Pill label={`/${p.freq||3}d`} color={C.teal}/>}</div><span style={{ fontWeight:700,fontSize:13,color:p.pct>=80?color:p.pct>=50?C.accent:C.rose,flexShrink:0,marginLeft:8 }}>{p.pct}%</span></div><div style={{ display:"flex",alignItems:"center",gap:8 }}><ProgressBar pct={p.pct} color={p.pct>=80?color:p.pct>=50?C.accent:C.rose} dark={dark}/><span style={{ fontSize:11,color:C.sub,whiteSpace:"nowrap" }}>{p.used}/{p.possible}{p.routine==="interval"?"x":"d"}</span></div></div>); })}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
                  {[{label:"Best Product",item:[...productReport].sort((a,b)=>b.pct-a.pct)[0],icon:"⭐",sub:"highest consistency"},{label:"Needs Attention",item:[...productReport].sort((a,b)=>a.pct-b.pct)[0],icon:"💡",sub:"lowest consistency"}].map(c=>(
                    <div key={c.label} style={{ ...S.card,textAlign:"center",padding:"14px 12px" }}>
                      <div style={{ fontSize:22 }}>{c.icon}</div>
                      <div style={{ fontSize:10.5,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4 }}>{c.label}</div>
                      <div style={{ fontWeight:700,fontSize:13,color:C.text,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.item?.name||"—"}</div>
                      <div style={{ fontSize:11,color:C.sub }}>{c.item?`${c.item.pct}% consistency`:""}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* FAB */}
        <button style={S.fab} className="press" onClick={tab==="purchases"?()=>openAddPurch():openAddProd}><Icon name="plus" size={22}/></button>

        {/* NAV */}
        <nav style={S.nav}>
          {[{id:"tracker",icon:"home",label:"Tracker"},{id:"products",icon:"list",label:"Products"},{id:"purchases",icon:"shop",label:"Purchases"},{id:"report",icon:"chart",label:"Report"}].map(n=>(
            <button key={n.id} style={S.navBtn(tab===n.id)} onClick={()=>setTab(n.id)}><Icon name={n.icon} size={tab===n.id?22:20}/>{n.label}</button>
          ))}
        </nav>
      </div>

      {/* MODAL: Product */}
      <Modal open={showAddProd} onClose={()=>setShowAddProd(false)} title={editProd?"Edit Product":"Add Product"} dark={dark} C={C}>
        <label style={S.label}>Product Name</label>
        <input style={S.input} placeholder="e.g. Some By Mi AHA BHA PHA Toner" value={prodForm.name} onChange={e=>setProdForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveProd()}/>
        <label style={S.label}>Category</label>
        <select style={S.select} value={prodForm.category} onChange={e=>setProdForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
        <label style={S.label}>Routine Type</label>
        <select style={S.select} value={prodForm.routine} onChange={e=>setProdForm(f=>({...f,routine:e.target.value}))}>{ROUTINES.map(r=><option key={r} value={r}>{ROUTINE_LABELS[r]}</option>)}</select>
        {prodForm.routine==="interval"&&(<><label style={S.label}>Use Every (days)</label><select style={S.select} value={prodForm.freq} onChange={e=>setProdForm(f=>({...f,freq:Number(e.target.value)}))}>{FREQ_OPTIONS.map(n=><option key={n} value={n}>Every {n} {n===1?"day":"days"}</option>)}</select><div style={{ background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:12,color:C.sub,marginBottom:14 }}>💡 Produk ini akan muncul sebagai <b style={{ color:C.teal }}>due</b> setiap {prodForm.freq} hari sekali setelah pemakaian terakhir.</div></>)}
        <button style={S.btn()} onClick={saveProd}>{editProd?"Save Changes":"Add Product"}</button>
      </Modal>

      {/* MODAL: Purchase */}
      <Modal open={showAddPurch} onClose={()=>setShowAddPurch(false)} title={editPurch?"Edit Purchase":"Log Purchase"} dark={dark} C={C}>
        {products.length===0&&<div style={{ fontSize:13,color:C.rose,marginBottom:14 }}>Tambahkan produk dulu sebelum mencatat pembelian.</div>}
        <label style={S.label}>Product</label>
        <select style={S.select} value={purchForm.productId} onChange={e=>editPurch?setPurchForm(f=>({...f,productId:e.target.value})):handlePurchProductChange(e.target.value)}>
          <option value="">— pilih produk —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {!editPurch&&purchForm.productId&&getLastPurchaseData(purchForm.productId)&&(
          <div style={{ background:C.teal+"18",border:`1px solid ${C.teal}44`,borderRadius:10,padding:"8px 12px",fontSize:12,color:C.sub,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:14 }}>✨</span><span>Data diisi dari pembelian terakhir — ubah jika berbeda</span>
          </div>
        )}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div><label style={S.label}>Harga (Rp)</label><input style={S.input} type="number" placeholder="85000" value={purchForm.price} onChange={e=>setPurchForm(f=>({...f,price:e.target.value}))}/></div>
          <div><label style={S.label}>Qty</label><input style={S.input} type="number" min={1} placeholder="1" value={purchForm.qty} onChange={e=>setPurchForm(f=>({...f,qty:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Tanggal Beli</label>
        <input style={S.input} type="date" value={purchForm.date} onChange={e=>setPurchForm(f=>({...f,date:e.target.value}))}/>
        <label style={S.label}>Toko / Platform</label>
        <input style={S.input} placeholder="e.g. Shopee, Guardian, Sociolla" value={purchForm.shop} onChange={e=>setPurchForm(f=>({...f,shop:e.target.value}))}/>
        <label style={S.label}>Notes (opsional)</label>
        <input style={S.input} placeholder="e.g. promo 50%, new packaging" value={purchForm.note} onChange={e=>setPurchForm(f=>({...f,note:e.target.value}))}/>
        {purchForm.productId&&purchForm.price&&<div style={{ background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.sub,marginBottom:14 }}>Total: <b style={{ color:C.accent }}>{fmtRp(Number(purchForm.price)*(Number(purchForm.qty)||1))}</b></div>}
        <button style={S.btn()} onClick={savePurch}>{editPurch?"Save Changes":"Log Purchase"}</button>
      </Modal>
    </>
  );
}
