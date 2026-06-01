import fs from "fs";
import path from "path";

const roots = ["src", "app"];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") walk(p);
    else if (/\.(jsx|js)$/.test(ent.name)) {
      let c = fs.readFileSync(p, "utf8");
      const o = c;
      c = c.replace(/fontFamily:\s*["']Syne,\s*sans-serif["'],\s*/g, "");
      c = c.replace(/,\s*fontFamily:\s*["']Syne,\s*sans-serif["']/g, "");
      c = c.replace(/fontFamily:\s*["']Syne,\s*sans-serif["']/g, "");
      c = c.replace(/<div className="emoji">[^<]*<\/div>\s*/g, "");
      c = c.replace(/linear-gradient\(135deg,\s*var\(--accent\),\s*var\(--accent2\)\)/g, "var(--accent)");
      c = c.replace(/linear-gradient\(135deg,\s*var\(--accent\),\s*#8b5cf6\)/g, "var(--accent)");
      c = c.replace(/linear-gradient\(135deg,#6c3ff5,#8b82ff\)/g, "var(--accent)");
      c = c.replace(/#6c63ff/g, "var(--accent)");
      c = c.replace(/#8b5cf6/g, "var(--accent-hover)");
      c = c.replace(/#a78bfa/g, "var(--accent)");
      if (c !== o) {
        fs.writeFileSync(p, c);
        console.log("updated", p);
      }
    }
  }
}

for (const r of roots) {
  if (fs.existsSync(r)) walk(r);
}
