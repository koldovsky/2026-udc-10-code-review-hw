#!/usr/bin/env node
// Task B sanity check: review-runs/ vs docs/review-scorecard.md.
// Static, no dependencies, reads nothing outside the repo (never the answer key).
//
//   node scripts/check-scorecard.mjs [--root <dir>] [--task-c] [--strict]
//
// Errors (exit 1): missing/empty run files, quote not found in its PR's run file, totals that
// don't add up, precision/recall that don't follow from the stated counts, queued diff left in app/.
// Warnings: unfilled placeholders, run file that doesn't look like reviewer output, short quotes.
// --strict turns warnings into errors. --task-c also requires the "до / після" table.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const rootArg = args.indexOf("--root");
const ROOT = resolve(rootArg >= 0 ? args[rootArg + 1] : join(dirname(fileURLToPath(import.meta.url)), ".."));
const TASK_C = flag("--task-c");
const STRICT = flag("--strict");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

// --- text helpers -------------------------------------------------------------

/** Make reviewer output and quotes comparable: markdown noise, quotes, dashes, whitespace. */
function normalize(s) {
  return s
    .replace(/[`*_]/g, "")
    .replace(/[“”„‟«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const NONE = new Set(["", "—", "-", "–", "немає", "нема", "none", "n/a"]);

function splitIds(cell) {
  return cell
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter((x) => !NONE.has(x.toLowerCase()));
}

function splitItems(cell) {
  return cell
    .split(";")
    .map((x) => x.trim())
    .filter((x) => !NONE.has(x.toLowerCase()));
}

const hasPlaceholder = (s) => /<\s*(…|\.\.\.)\s*>|<[^>]*(…|\.\.\.)[^>]*>/.test(s);

function toNumber(s) {
  return Number(String(s).replace(",", "."));
}

/** Parse "0.71", "71%", "5/7", "5/7 = 0.71", "71,4 %" into a 0..1 number; null = n/a; NaN = unparseable. */
function parseRatio(text) {
  const t = text.trim();
  if (NONE.has(t.toLowerCase()) || /^n\/a\b/i.test(t)) return null;
  const pct = t.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pct) return toNumber(pct[1]) / 100;
  const eq = t.match(/=\s*(\d+(?:[.,]\d+)?)\s*$/);
  if (eq) return toNumber(eq[1]);
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)/);
  if (frac) return Number(frac[2]) === 0 ? NaN : Number(frac[1]) / Number(frac[2]);
  const dec = t.match(/^(\d+(?:[.,]\d+)?)/);
  return dec ? toNumber(dec[1]) : NaN;
}

function close(a, b) {
  return Math.abs(a - b) <= 0.0101; // rounding to 2 decimals / whole percent
}

function ratio(num, den) {
  return den === 0 ? null : num / den;
}

function sectionBody(md, headingRe) {
  const m = md.match(headingRe);
  if (!m) return null;
  const start = m.index + m[0].length;
  const rest = md.slice(start);
  const next = rest.search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next);
}

function tableRows(body) {
  return body
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));
}

// --- 1. review-runs -----------------------------------------------------------

const runs = {};
for (let n = 1; n <= 6; n++) {
  const rel = `review-runs/pr-${n}.md`;
  if (!existsSync(join(ROOT, rel))) {
    err(`${rel}: файл відсутній`);
    continue;
  }
  const text = read(rel);
  runs[n] = text;
  if (text.trim().length < 300) err(`${rel}: майже порожній (${text.trim().length} символів) — це не схоже на дослівний вихід`);
  if (hasPlaceholder(text)) warn(`${rel}: містить заглушку <…>`);
  if (!/##\s*Вердикт/i.test(text)) warn(`${rel}: немає розділу «Вердикт» — вихід не за форматом review/prompt.md чи відредагований?`);
  if (!/##\s*Знахідки/i.test(text)) warn(`${rel}: немає розділу «Знахідки»`);
}
if (existsSync(join(ROOT, "review-runs"))) {
  const extra = readdirSync(join(ROOT, "review-runs")).filter((f) => !/^pr-[1-6]\.md$/.test(f) && f !== "round2");
  if (extra.length) warn(`review-runs/: зайві файли: ${extra.join(", ")}`);
}

// --- 2. scorecard -------------------------------------------------------------

const SC = "docs/review-scorecard.md";
if (!existsSync(join(ROOT, SC))) {
  err(`${SC}: файл відсутній`);
  finish();
}
const sc = read(SC).replace(/<!--[\s\S]*?-->/g, ""); // the conventions comment is not content

const body1 = sectionBody(sc, /^## Прогін 1[^\n]*\n/m);
if (body1 === null) {
  err(`${SC}: немає розділу «Прогін 1»`);
  finish();
}

const rows = tableRows(body1).filter((cells) => /^PR-?\d$/i.test(cells[0] ?? ""));
const seen = new Set();
const sums = { tp: 0, fn: 0, fp: 0 };

for (const cells of rows) {
  const n = Number(cells[0].match(/\d/)[0]);
  const label = `PR-${n}`;
  if (cells.length < 5) {
    err(`${SC} ${label}: у рядку лише ${cells.length} комірок (потрібно щонайменше 5; чи немає «|» усередині комірки?)`);
    continue;
  }
  if (seen.has(n)) err(`${SC} ${label}: рядок повторюється`);
  seen.add(n);
  if (n < 1 || n > 6) {
    err(`${SC}: PR-${n} — поза діапазоном 1–6`);
    continue;
  }
  const [, foundC, quoteC, missedC, fpC] = cells;
  if ([foundC, quoteC, missedC, fpC].some(hasPlaceholder)) {
    warn(`${SC} ${label}: рядок не заповнено (є заглушка <…>)`);
    continue;
  }

  const found = splitIds(foundC);
  const missed = splitIds(missedC);
  const fps = splitItems(fpC);
  sums.tp += found.length;
  sums.fn += missed.length;
  sums.fp += fps.length;

  const quotes = [...quoteC.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
  if (found.length > 0 && quotes.length === 0) err(`${SC} ${label}: є «Знайдено», але немає цитат у «…»`);
  else if (quotes.length < found.length) {
    warn(`${SC} ${label}: ${found.length} знайдених, але лише ${quotes.length} цитат — кожне «знайдено» має мати цитату`);
  }
  if (found.length === 0 && quotes.length > 0) warn(`${SC} ${label}: цитати є, а «Знайдено» порожнє`);

  const run = runs[n];
  for (const q of quotes) {
    if (run === undefined) continue; // already reported as missing file
    const pieces = q.split(/…|\.{3}/).map(normalize).filter(Boolean);
    if (pieces.length === 0) continue;
    if (pieces.join("").length < 12) warn(`${SC} ${label}: цитата «${q}» надто коротка, щоб щось доводити`);
    const hay = normalize(run);
    const missing = pieces.find((p) => !hay.includes(p));
    if (missing !== undefined) {
      const elsewhere = Object.entries(runs).find(([k, t]) => Number(k) !== n && normalize(t).includes(missing));
      err(
        `${SC} ${label}: цитати «${q.length > 70 ? q.slice(0, 70) + "…" : q}» немає в review-runs/pr-${n}.md` +
          (elsewhere ? ` (є в pr-${elsewhere[0]}.md — переплутали PR?)` : "")
      );
    }
  }
}
for (let n = 1; n <= 6; n++) if (!seen.has(n)) err(`${SC}: немає рядка PR-${n} у таблиці «Прогін 1»`);

// --- 3. totals, precision, recall --------------------------------------------

const totals = body1.match(/\*{0,2}Разом:?\*{0,2}\s*:?\s*TP\s*=\s*(\d+)\s*,\s*FN\s*=\s*(\d+)\s*,\s*FP\s*=\s*(\d+)/i);
let T = null;
if (!totals) {
  warn(`${SC}: немає рядка «Разом: TP = …, FN = …, FP = …» (чи ще не заповнено)`);
} else {
  T = { tp: Number(totals[1]), fn: Number(totals[2]), fp: Number(totals[3]) };
  if (rows.length === 6 && !rows.some((c) => c.some(hasPlaceholder))) {
    for (const k of ["tp", "fn", "fp"]) {
      if (T[k] !== sums[k]) err(`${SC}: Разом ${k.toUpperCase()} = ${T[k]}, а за рядками таблиці ${sums[k]}`);
    }
  }
}

function checkRatio(text, label, expected) {
  if (text === undefined) return;
  const v = parseRatio(text);
  if (Number.isNaN(v)) return err(`${SC}: ${label} — не вдалося прочитати значення «${text.trim()}»`);
  if (v === null && expected !== null) return warn(`${SC}: ${label} = n/a, хоча його можна порахувати (${expected.toFixed(2)})`);
  if (v !== null && expected === null) return err(`${SC}: ${label} = «${text.trim()}», але знаменник дорівнює нулю`);
  if (v !== null && !close(v, expected)) {
    err(`${SC}: ${label} = «${text.trim()}», а з наведених TP/FN/FP виходить ${expected.toFixed(2)}`);
  }
}

if (T) {
  const prec = body1.match(/Precision\*{0,2}\s*=\s*([^·\n]+)/i)?.[1];
  const rec = body1.match(/Recall\*{0,2}\s*=\s*([^·\n]+)/i)?.[1];
  if (prec === undefined || hasPlaceholder(prec)) warn(`${SC}: Precision не заповнено`);
  else checkRatio(prec, "Precision (загалом)", ratio(T.tp, T.tp + T.fp));
  if (rec === undefined || hasPlaceholder(rec)) warn(`${SC}: Recall не заповнено`);
  else checkRatio(rec, "Recall (загалом)", ratio(T.tp, T.tp + T.fn));
}

// Slice table: | Зріз | TP | FN | FP | Precision | Recall |
const sliceRows = tableRows(body1).filter((c) => c.length >= 6 && /^(Усі|Critical|Позначені)/i.test(c[0]));
const sliceSeen = new Set();
for (const [name, tp, fn, fp, p, r] of sliceRows) {
  sliceSeen.add(name.split(/[\s/]/)[0].toLowerCase());
  if ([tp, fn, fp, p, r].some(hasPlaceholder)) {
    warn(`${SC}: зріз «${name}» не заповнено`);
    continue;
  }
  const n = { tp: Number(tp), fn: Number(fn) };
  const fpIsNa = NONE.has(fp.trim().toLowerCase()) || /^n\/a/i.test(fp.trim());
  if (!Number.isInteger(n.tp) || !Number.isInteger(n.fn)) {
    err(`${SC}: зріз «${name}» — TP/FN мають бути цілими числами`);
    continue;
  }
  if (T) {
    if (n.tp > T.tp) err(`${SC}: зріз «${name}» має TP = ${n.tp} > загальних ${T.tp}`);
    if (n.fn > T.fn) err(`${SC}: зріз «${name}» має FN = ${n.fn} > загальних ${T.fn}`);
    if (/^Усі/i.test(name) && (n.tp !== T.tp || n.fn !== T.fn)) err(`${SC}: зріз «Усі дефекти» не збігається з рядком «Разом»`);
  }
  checkRatio(r, `Recall (${name})`, ratio(n.tp, n.tp + n.fn));
  if (fpIsNa) {
    if (!/^n\/a/i.test(p.trim()) && !NONE.has(p.trim().toLowerCase())) err(`${SC}: зріз «${name}» — FP = n/a, тож і Precision має бути n/a`);
  } else {
    const f = Number(fp);
    if (!Number.isInteger(f)) err(`${SC}: зріз «${name}» — FP має бути цілим числом або n/a`);
    else {
      if (T && f > T.fp) err(`${SC}: зріз «${name}» має FP = ${f} > загальних ${T.fp}`);
      checkRatio(p, `Precision (${name})`, ratio(n.tp, n.tp + f));
    }
  }
}
for (const need of ["усі", "critical", "позначені"]) {
  if (!sliceSeen.has(need) && T) warn(`${SC}: у таблиці зрізів немає рядка «${need}…»`);
}

// --- 4. cost, Task C ----------------------------------------------------------

if (!/Вартість:?\*{0,2}[^\n]*\d/.test(body1) && !hasPlaceholder(body1)) warn(`${SC}: не вказано вартість (час / токени)`);

if (TASK_C) {
  const c = sectionBody(sc, /^## Прогін 2[^\n]*\n/m);
  if (c === null) err(`${SC}: немає розділу «Прогін 2 (Task C) — до / після»`);
  else {
    const data = tableRows(c).slice(1);
    if (data.length === 0 || data.some((r) => r.some(hasPlaceholder))) err(`${SC}: таблицю «до / після» не заповнено`);
    // Any row of the form | name | TP | FN | FP | Precision | Recall | in this section must add up.
    for (const [name, tp, fn, fp, p, r] of tableRows(c).filter((x) => x.length >= 6 && [1, 2, 3].every((i) => /^\d+$/.test(x[i])))) {
      const [a, b, f] = [tp, fn, fp].map(Number);
      checkRatio(p, `Precision (прогін 2: ${name})`, ratio(a, a + f));
      checkRatio(r, `Recall (прогін 2: ${name})`, ratio(a, a + b));
    }
  }
  const chg = sectionBody(sc, /^## Що змінили[^\n]*\n/m);
  if (chg === null || hasPlaceholder(chg)) err(`${SC}: розділ «Що змінили (Task C)» не заповнено`);
}

// --- 5. hygiene ---------------------------------------------------------------

try {
  const dirty = execFileSync("git", ["status", "--short", "--", "app"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  if (dirty) err(`app/ має незакомічені зміни — засіяний диф не відкотили?\n${dirty}`);
} catch {
  /* not a git repo (e.g. --root pointing to a fixture) — skip */
}
if (existsSync(join(ROOT, "nul"))) err("у корені є файл «nul» (створений `>nul` у Git Bash) — видаліть його");
if (existsSync(join(ROOT, ".github", "workflows"))) warn(".github/workflows/ існує — для Task D файл має лежати в pipeline/");

finish();

function finish() {
  for (const w of warnings) console.log(`⚠️  ${w}`);
  for (const e of errors) console.log(`❌ ${e}`);
  const failed = errors.length > 0 || (STRICT && warnings.length > 0);
  console.log(
    failed
      ? `\nНе пройдено: ${errors.length} помилок, ${warnings.length} попереджень${STRICT ? " (--strict)" : ""}.`
      : `\n✅ Перевірка пройдена (${warnings.length} попереджень).`
  );
  process.exit(failed ? 1 : 0);
}
