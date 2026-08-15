#!/usr/bin/env node
/**
 * Markdown → 精美 HTML 转换脚本
 *
 * 用法:
 *   node md-to-html.mjs <输入.md> [输出.html]
 *
 * 特性:
 *   - 自动生成目录（TOC），标题锚点可点击跳转
 *   - 内联 CSS，单文件、离线可用、响应式、打印友好
 *   - 默认输出到输入文件同目录（扩展名 .html）
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.join(__dirname, "..", "assets", "style.css");

const input = process.argv[2];
if (!input) {
  console.error("用法: node md-to-html.mjs <输入.md> [输出.html]");
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : inputPath.replace(/\.md$/i, ".html");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- 解析 Markdown 标题，用于 TOC 与锚点 ----
function extractHeadings(md) {
  const headings = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (m) headings.push({ level: m[1].length, text: m[2].trim() });
  }
  headings.forEach((h, i) => (h.id = `sec-${i}`));
  return headings;
}

// ---- 生成嵌套 TOC ----
function buildTocHtml(headings) {
  if (headings.length <= 1) return "";
  const lines = ['<nav class="toc"><p class="toc-title">📑 目录</p><ol>'];
  let lastLevel = 1;
  for (const h of headings) {
    const first = h.level === lastLevel;
    while (h.level > lastLevel) {
      lines.push("<ol>");
      lastLevel++;
    }
    while (h.level < lastLevel) {
      lines.push("</ol></li>");
      lastLevel--;
    }
    if (!first && h.level === lastLevel) lines.push("</li>");
    lines.push(`<li><a href="#${h.id}">${escapeHtml(h.text)}</a>`);
  }
  while (lastLevel > 1) {
    lines.push("</ol></li>");
    lastLevel--;
  }
  lines.push("</li></ol></nav>");
  return lines.join("\n");
}

// ---- 数字解析：去掉 %、亿、万、元 等单位 ----
function parseNum(s) {
  if (s == null) return 0;
  const cleaned = String(s).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

// ---- 去 HTML 标签取纯文本 ----
function stripHtml(h) {
  return h.replace(/<[^>]*>/g, "").trim();
}

// ---- 生成横向条形图（内联 SVG，离线可用） ----
const CHART_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#dc2626"];

function generateBarChart({ title, categories, values, color }) {
  if (!categories.length || values.length < 2) return "";
  const padL = 100,
    padR = 80,
    padT = 10,
    padB = 22;
  const barH = 20,
    gap = 12,
    rowH = barH + gap;
  const chartW = 720;
  const chartH = padT + padB + rowH * categories.length;
  const maxV = Math.max(...values.map((v) => Math.abs(v)), 1);
  const innerW = chartW - padL - padR;
  let grid = "";
  for (let g = 0; g <= 4; g++) {
    const gx = padL + (g / 4) * innerW;
    grid += `<line x1="${gx}" y1="${padT}" x2="${gx}" y2="${chartH - padB}" stroke="#eceff4" stroke-width="1"/>`;
  }
  let bars = "";
  categories.forEach((cat, i) => {
    const y = padT + i * rowH;
    const v = values[i] || 0;
    const w = Math.max((Math.abs(v) / maxV) * innerW, 2);
    bars += `<rect x="${padL}" y="${y}" width="${w}" height="${barH}" rx="4" fill="${color}"/>`;
    bars += `<text x="${padL - 8}" y="${y + barH - 5}" text-anchor="end" class="cat-label">${escapeHtml(cat)}</text>`;
    bars += `<text x="${padL + w + 8}" y="${y + barH - 5}" class="val-label">${escapeHtml(String(values[i]))}</text>`;
  });
  return (
    `<figure class="chart"><figcaption>📊 ${escapeHtml(title)}</figcaption>` +
    `<svg viewBox="0 0 ${chartW} ${chartH}" xmlns="http://www.w3.org/2000/svg">${grid}${bars}</svg></figure>`
  );
}

// ---- 主流程 ----
async function main() {
  const md = await readFile(inputPath, "utf-8");
  const headings = extractHeadings(md);

  // 标题：取第一个一级标题，否则用文件名
  const h1 = headings.find((h) => h.level === 1);
  const title = h1
    ? h1.text
    : path.basename(inputPath, path.extname(inputPath));

  // 自定义渲染器：锚点 id + 关键内容强调 + 表格图表化
  let idx = 0;
  const renderer = {
    heading({ tokens, depth }) {
      const id = headings[idx]?.id ?? `sec-${idx}`;
      idx++;
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
    },
    // 关键段落 → 强调卡片
    paragraph({ tokens }) {
      const html = this.parser.parseInline(tokens);
      const plain = stripHtml(html);
      if (
        /^(结论|最关键|最大不确定性|⚠️|重要|提示|注意|建议|风险)/.test(plain)
      ) {
        const warn = /(风险|⚠️|注意|❌)/.test(plain);
        return `<div class="callout ${warn ? "callout-warn" : "callout-key"}">${html}</div>`;
      }
      return `<p>${html}</p>`;
    },
    // 关键列表项 → 强调
    listitem({ tokens }) {
      // tokens 可能含嵌套 list（如 `- a\n  - b`），parseInline 无法处理 list 类型
      // 拆开：非 list 的 inline token 用 parseInline，嵌套 list 递归调用 this.list()
      const inline = [];
      let nested = "";
      for (const t of tokens) {
        if (t.type === "list") {
          nested += this.list(t);
        } else {
          inline.push(t);
        }
      }
      const html = this.parser.parseInline(inline);
      const plain = stripHtml(html);
      let cls = "";
      if (/^(结论|最关键|最大不确定性|⚠️|✅|❌)/.test(plain)) {
        cls = /(⚠️|❌|风险)/.test(plain)
          ? ' class="li-warn"'
          : ' class="li-key"';
      }
      return `<li${cls}>${html}${nested}</li>`;
    },
    // 表格 → 内联 SVG 图表 + 表格
    table({ header, rows }) {
      // marked v15 单元格是对象 { text, tokens, header, align }
      // HTML 用 parseInline(tokens) 渲染内联标记（加粗等）；纯文本用 .text 供图表解析
      const cellsHtml = (arr) =>
        arr.map((c) => this.parser.parseInline(c.tokens));
      const cellsText = (arr) => arr.map((c) => c.text || "");
      const headerHtml = cellsHtml(header);
      const headerTexts = cellsText(header);
      const rowsHtml = rows.map((r) => cellsHtml(r));
      const rowsTexts = rows.map((r) => cellsText(r));
      // 识别数值列（从第 2 列起，且至少 2 行有值）
      const numericCols = [];
      for (let c = 1; c < headerTexts.length; c++) {
        const vals = rowsTexts
          .map((r) => r[c])
          .filter((v) => v && v.trim() !== "");
        if (
          vals.length >= 2 &&
          vals.every((v) => /^[-+]?[0-9.,%亿万元 元]+$/.test(v.trim()))
        ) {
          numericCols.push(c);
        }
      }
      let html =
        "<table><thead><tr>" +
        headerHtml.map((h) => `<th>${h}</th>`).join("") +
        "</tr></thead><tbody>";
      for (const r of rowsHtml) {
        html += "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table>";
      const categories = rowsTexts.map((r, i) => r[0] || `行${i + 1}`);
      let charts = "";
      numericCols.slice(0, 4).forEach((c, i) => {
        charts += generateBarChart({
          title: headerTexts[c] + " 对比",
          categories,
          values: rowsTexts.map((r) => parseNum(r[c])),
          color: CHART_COLORS[i % CHART_COLORS.length],
        });
      });
      return charts + html;
    },
  };
  marked.use({ renderer, gfm: true, breaks: true });

  const bodyHtml = marked.parse(md);
  const css = await readFile(CSS_PATH, "utf-8");
  const dateStr = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
</head>
<body>
  <header class="doc-header">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">转换于 ${dateStr} · 由 md-to-html 生成</div>
  </header>
  <main class="doc-content">
    ${buildTocHtml(headings)}
    ${bodyHtml}
  </main>
  <footer class="doc-footer">Generated with md-to-html skill</footer>
</body>
</html>
`;

  await writeFile(outputPath, html, "utf-8");
  console.log(`✅ 已生成: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ 转换失败:", err.message);
  console.error(
    "提示: 请先执行 cd .github/skills/md-to-html/scripts && npm install",
  );
  process.exit(1);
});
