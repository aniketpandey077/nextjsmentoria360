import fs from "fs";
import path from "path";

const replacements = [
  [/<h2>📦 Batches<\/h2>/g, "<h2>Batches</h2>"],
  [/<h2>🧪 Tests[^<]*<\/h2>/g, "<h2>Tests &amp; Quizzes</h2>"],
  [/<h2>📚 Study Materials<\/h2>/g, "<h2>Study Materials</h2>"],
  [/<h2>📋 Homework<\/h2>/g, "<h2>Homework</h2>"],
  [/<h2>📢 Announcements<\/h2>/g, "<h2>Announcements</h2>"],
  [/<h2>💳[^<]*<\/h2>/g, (m) => m.replace(/💳\s*/, "")],
  [/<h2>💰 My Fees<\/h2>/g, "<h2>My Fees</h2>"],
  [/<h2>⭐ Reviews Overview<\/h2>/g, "<h2>Reviews Overview</h2>"],
  [/<h2>👥 All Users<\/h2>/g, "<h2>All Users</h2>"],
  [/<h2>🚀 Platform Overview<\/h2>/g, "<h2>Platform Overview</h2>"],
  [/Welcome, ([^!]+)! 👋/g, "Welcome, $1"],
  [/🔍 Find &amp; Join a Coaching/g, "Find &amp; Join a Coaching"],
  [/📌 Select a coaching/g, "Select a coaching"],
  [/const TYPE_ICON\s*=\s*\{[^}]+\};/g, 'const TYPE_ICON = { PDF: "PDF", "Video Link": "Video", Notes: "Notes", Assignment: "Assignment", Other: "File" };'],
  [/const METHOD_ICONS\s*=\s*\{[^}]+\};/g, 'const METHOD_ICONS = { upi: "UPI", qr: "QR", bank: "Bank", paytm: "Paytm", other: "Other" };'],
  [/icon: "💳"/g, 'icon: "UPI"'],
  [/icon: "📷"/g, 'icon: "QR"'],
  [/icon: "🏦"/g, 'icon: "Bank"'],
  [/icon: "📱"/g, 'icon: "Pay"'],
  [/icon: "💰"/g, 'icon: "Other"'],
  [/<span className="search-icon">🔍<\/span>/g, '<span className="search-icon" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></span>'],
  [/📍 /g, ""],
  [/📞 /g, ""],
  [/📚 /g, ""],
  [/🕐 /g, ""],
  [/⭐ /g, ""],
  [/📅 /g, ""],
  [/💺 /g, ""],
  [/🆓 Free/g, "Free"],
  [/💰 /g, "₹"],
  [/📲 /g, ""],
  [/🏦 /g, ""],
  [/💵/g, ""],
  [/👨‍🏫 /g, ""],
  [/🏫 /g, ""],
  [/🧾 /g, ""],
  [/🖨️ /g, ""],
  [/🔄 /g, ""],
  [/⚠️ /g, ""],
  [/OVERDUE/g, "OVERDUE"],
  [/"📲 UPI"/g, '"UPI"'],
  [/"🏦 Bank Transfer"/g, '"Bank Transfer"'],
  [/"💵 Cash"/g, '"Cash"'],
  [/"💳 Pay"/g, '"Pay"'],
  [/"📝 Theory"/g, '"Theory"'],
  [/"🔘 MCQ"/g, '"MCQ"'],
  [/\{ key: "upi",\s*label: "📲 UPI" \}/g, '{ key: "upi", label: "UPI" }'],
  [/\{ key: "bank",\s*label: "🏦 Bank Transfer" \}/g, '{ key: "bank", label: "Bank Transfer" }'],
  [/\{ key: "cash",\s*label: "💵 Cash" \}/g, '{ key: "cash", label: "Cash" }'],
  [/<div style=\{\{ fontSize: (40|48|56|72)[^}]*\}\}>[^<]*<\/div>\s*/g, ""],
  [/fontSize: 48, marginBottom: 12 \}\}>⭐<\/div>/g, ""],
];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") walk(p);
    else if (/\.(jsx|js)$/.test(ent.name)) {
      let c = fs.readFileSync(p, "utf8");
      const o = c;
      for (const [from, to] of replacements) {
        c = typeof to === "function" ? c.replace(from, to) : c.replace(from, to);
      }
      if (c !== o) {
        fs.writeFileSync(p, c);
        console.log("updated", p);
      }
    }
  }
}

walk("src");
