// i18n 一致性检查：找出「被使用但未定义」以及「已定义但未被引用」的文案 key
// 用法：node scripts/check-i18n.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const APP = path.join(ROOT, "src/App.jsx");

const src = fs.readFileSync(APP, "utf8");
const startIdx = src.indexOf("const TEXT = {");
const endIdx = src.indexOf("\n};", startIdx);
const textBlock = src.slice(startIdx, endIdx + 3);

// 解析各语言分区的 key
const lines = textBlock.split("\n");
const sections = new Map();
let current = null;
for (const rawLine of lines) {
  const line = rawLine.replace(/\r$/, "");
  const sec = line.match(/^  ("?[\w-]+"?):\s*\{$/);
  if (sec) {
    current = sec[1].replace(/"/g, "");
    sections.set(current, new Set());
    continue;
  }
  if (!current) continue;
  const key = line.match(/^    (\w+):/);
  if (key) sections.get(current).add(key[1]);
}

console.log("语言分区: " + [...sections].map(([n, s]) => `${n}(${s.size})`).join(", "));

// 收集所有源码中出现的 t.<key> 引用
const used = new Set();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.jsx?$/.test(entry.name)) continue;
    const text = fs.readFileSync(p, "utf8");
    // 排除 lambda 参数误报，例如 todos.find((t) => t.id === timerTaskId)
    for (const m of text.matchAll(/\bt\??\.(\w+)/g)) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 5);
      if (after.startsWith(" ===") || after.startsWith(" !==") || after.startsWith(" ==")) continue;
      used.add(m[1]);
    }
  }
}
walk(path.join(ROOT, "src"));

const names = [...sections.keys()];
const missingIn = new Map();
for (const name of names) {
  const missing = [...used].filter((k) => !sections.get(name).has(k)).sort();
  missingIn.set(name, missing);
}

console.log("\n=== 被使用但未定义（会导致界面显示 undefined）===");
let anyMissing = false;
for (const [name, missing] of missingIn) {
  console.log(`[${name}] ${missing.length} 个: ${missing.join(", ") || "无"}`);
  if (missing.length) anyMissing = true;
}

console.log("\n=== 已定义但未被引用 ===");
for (const [name, keys] of sections) {
  const unused = [...keys].filter((k) => !used.has(k)).sort();
  console.log(`[${name}] ${unused.length} 个: ${unused.join(", ") || "无"}`);
}

// 各语言 key 集合差异
if (names.length === 2) {
  const [a, b] = names;
  const onlyA = [...sections.get(a)].filter((k) => !sections.get(b).has(k));
  const onlyB = [...sections.get(b)].filter((k) => !sections.get(a).has(k));
  console.log(`\n=== key 集合差异 ===\n仅 ${a}: ${onlyA.join(", ") || "无"}\n仅 ${b}: ${onlyB.join(", ") || "无"}`);
}

process.exit(anyMissing ? 1 : 0);
