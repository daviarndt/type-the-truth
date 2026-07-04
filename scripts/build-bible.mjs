/**
 * build-bible.mjs — Gera os arquivos estáticos da Bíblia a partir de
 * scripts/data/pt_nvi.json, um JSON por livro em public/bible/{osisId}.json.
 *
 * Formato de saída: array de capítulos, cada um array de versículos (strings).
 *   public/bible/John.json → [ ["v1","v2",...], ["v1",...], ... ]
 *
 * Rodar: npm run build:bible
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ABBREV_TO_OSIS = {
  gn: "Gen", ex: "Exod", lv: "Lev", nm: "Num", dt: "Deut",
  js: "Josh", jz: "Judg", rt: "Ruth", "1sm": "1Sam", "2sm": "2Sam",
  "1rs": "1Kgs", "2rs": "2Kgs", "1cr": "1Chr", "2cr": "2Chr",
  ed: "Ezra", ne: "Neh", et: "Esth", "jó": "Job", sl: "Ps",
  pv: "Prov", ec: "Eccl", ct: "Song", is: "Isa", jr: "Jer",
  lm: "Lam", ez: "Ezek", dn: "Dan", os: "Hos", jl: "Joel",
  am: "Amos", ob: "Obad", jn: "Jonah", mq: "Mic", na: "Nah",
  hc: "Hab", sf: "Zeph", ag: "Hag", zc: "Zech", ml: "Mal",
  mt: "Matt", mc: "Mark", lc: "Luke", jo: "John", atos: "Acts",
  rm: "Rom", "1co": "1Cor", "2co": "2Cor", gl: "Gal", ef: "Eph",
  fp: "Phil", cl: "Col", "1ts": "1Thess", "2ts": "2Thess",
  "1tm": "1Tim", "2tm": "2Tim", tt: "Titus", fm: "Phlm", hb: "Heb",
  tg: "Jas", "1pe": "1Pet", "2pe": "2Pet", "1jo": "1John",
  "2jo": "2John", "3jo": "3John", jd: "Jude", ap: "Rev",
};

const raw = readFileSync(join(ROOT, "scripts/data/pt_nvi.json"), "utf-8").replace(/^﻿/, "");
const books = JSON.parse(raw);

const outDir = join(ROOT, "public/bible");
mkdirSync(outDir, { recursive: true });

let totalVerses = 0;
let count = 0;
for (const book of books) {
  const osis = ABBREV_TO_OSIS[book.abbrev];
  if (!osis) {
    console.warn(`abbrev desconhecida: ${book.abbrev}`);
    continue;
  }
  const chapters = book.chapters.map((verses) => verses.map((v) => v.trim()));
  totalVerses += chapters.reduce((s, c) => s + c.length, 0);
  writeFileSync(join(outDir, `${osis}.json`), JSON.stringify(chapters));
  count++;
}

console.log(`✅ ${count} livros, ${totalVerses.toLocaleString("pt-BR")} versículos → public/bible/`);
