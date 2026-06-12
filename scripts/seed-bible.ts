/**
 * seed-bible.ts — Carrega os versículos a partir de scripts/data/pt_nvi.json.
 *
 * Formato do arquivo (array de 66 livros, ordem canônica):
 *   [ { "abbrev": "gn", "chapters": [ ["v1", "v2", ...], [...] ] }, ... ]
 *
 * Rodar: npm run db:seed:bible (idempotente — apaga e recria os versículos da tradução)
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const TRANSLATION_ID = "NVI";

// abbrev do arquivo → OSIS ID usado no banco
const ABBREV_TO_OSIS: Record<string, string> = {
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

interface SourceBook {
  abbrev: string;
  chapters: string[][];
}

async function main() {
  console.log("📖 Seeding Bible content...\n");

  const filePath = path.join(__dirname, "data", "pt_nvi.json");
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, "");
  const sourceBooks: SourceBook[] = JSON.parse(raw);

  // Recria do zero para garantir consistência (idempotente)
  const deleted = await prisma.verse.deleteMany({ where: { translationId: TRANSLATION_ID } });
  if (deleted.count > 0) console.log(`  → ${deleted.count} versículos antigos removidos`);

  let totalVerses = 0;
  let bookCount = 0;

  for (const source of sourceBooks) {
    const osisId = ABBREV_TO_OSIS[source.abbrev];
    if (!osisId) {
      console.warn(`  ⚠️  abbrev desconhecida: "${source.abbrev}" — pulando`);
      continue;
    }

    const book = await prisma.book.findUnique({
      where: { osisId },
      include: { chapters: true },
    });
    if (!book) {
      console.warn(`  ⚠️  Livro não encontrado no banco: ${osisId}`);
      continue;
    }

    const chapterByNumber = new Map(book.chapters.map((c) => [c.chapterNumber, c]));

    for (let ci = 0; ci < source.chapters.length; ci++) {
      const chapterNumber = ci + 1;
      const chapter = chapterByNumber.get(chapterNumber);
      if (!chapter) {
        console.warn(`  ⚠️  Capítulo não encontrado: ${osisId} ${chapterNumber}`);
        continue;
      }

      const verses = source.chapters[ci];
      await prisma.verse.createMany({
        data: verses.map((text, vi) => ({
          chapterId: chapter.id,
          translationId: TRANSLATION_ID,
          verseNumber: vi + 1,
          text: text.trim(),
        })),
      });
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { totalVerses: verses.length },
      });
      totalVerses += verses.length;
    }

    bookCount++;
    process.stdout.write(`\r  → ${bookCount}/66 livros (${totalVerses.toLocaleString("pt-BR")} versículos)`);
  }

  console.log(`\n\n✅ ${TRANSLATION_ID}: ${totalVerses.toLocaleString("pt-BR")} versículos em ${bookCount} livros.`);
}

main()
  .catch((e) => {
    console.error("❌ Bible seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
