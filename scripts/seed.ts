/**
 * seed.ts — Dados de referência: traduções, livros, capítulos, conquistas e planos.
 * Rodar: npm run db:seed (idempotente — seguro re-executar)
 *
 * Não inclui os versículos (isso é o seed-bible.ts).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────

const translations = [
  {
    id: "NVI",
    code: "NVI",
    name: "Nova Versão Internacional",
    language: "pt-BR",
    isPublicDomain: false,
    licenseNote: "© Biblica. Uso restrito — apenas para uso pessoal/desenvolvimento local.",
  },
];

// ─────────────────────────────────────────────
// LIVROS DA BÍBLIA (66, ordem canônica)
// ─────────────────────────────────────────────

const books = [
  // Antigo Testamento
  { osisId: "Gen", nameEn: "Genesis", namePt: "Gênesis", abbEn: "Gen", abbPt: "Gn", testament: "OT", orderIndex: 1, totalChapters: 50 },
  { osisId: "Exod", nameEn: "Exodus", namePt: "Êxodo", abbEn: "Exo", abbPt: "Êx", testament: "OT", orderIndex: 2, totalChapters: 40 },
  { osisId: "Lev", nameEn: "Leviticus", namePt: "Levítico", abbEn: "Lev", abbPt: "Lv", testament: "OT", orderIndex: 3, totalChapters: 27 },
  { osisId: "Num", nameEn: "Numbers", namePt: "Números", abbEn: "Num", abbPt: "Nm", testament: "OT", orderIndex: 4, totalChapters: 36 },
  { osisId: "Deut", nameEn: "Deuteronomy", namePt: "Deuteronômio", abbEn: "Deu", abbPt: "Dt", testament: "OT", orderIndex: 5, totalChapters: 34 },
  { osisId: "Josh", nameEn: "Joshua", namePt: "Josué", abbEn: "Jos", abbPt: "Js", testament: "OT", orderIndex: 6, totalChapters: 24 },
  { osisId: "Judg", nameEn: "Judges", namePt: "Juízes", abbEn: "Jdg", abbPt: "Jz", testament: "OT", orderIndex: 7, totalChapters: 21 },
  { osisId: "Ruth", nameEn: "Ruth", namePt: "Rute", abbEn: "Rut", abbPt: "Rt", testament: "OT", orderIndex: 8, totalChapters: 4 },
  { osisId: "1Sam", nameEn: "1 Samuel", namePt: "1 Samuel", abbEn: "1Sa", abbPt: "1Sm", testament: "OT", orderIndex: 9, totalChapters: 31 },
  { osisId: "2Sam", nameEn: "2 Samuel", namePt: "2 Samuel", abbEn: "2Sa", abbPt: "2Sm", testament: "OT", orderIndex: 10, totalChapters: 24 },
  { osisId: "1Kgs", nameEn: "1 Kings", namePt: "1 Reis", abbEn: "1Ki", abbPt: "1Rs", testament: "OT", orderIndex: 11, totalChapters: 22 },
  { osisId: "2Kgs", nameEn: "2 Kings", namePt: "2 Reis", abbEn: "2Ki", abbPt: "2Rs", testament: "OT", orderIndex: 12, totalChapters: 25 },
  { osisId: "1Chr", nameEn: "1 Chronicles", namePt: "1 Crônicas", abbEn: "1Ch", abbPt: "1Cr", testament: "OT", orderIndex: 13, totalChapters: 29 },
  { osisId: "2Chr", nameEn: "2 Chronicles", namePt: "2 Crônicas", abbEn: "2Ch", abbPt: "2Cr", testament: "OT", orderIndex: 14, totalChapters: 36 },
  { osisId: "Ezra", nameEn: "Ezra", namePt: "Esdras", abbEn: "Ezr", abbPt: "Ed", testament: "OT", orderIndex: 15, totalChapters: 10 },
  { osisId: "Neh", nameEn: "Nehemiah", namePt: "Neemias", abbEn: "Neh", abbPt: "Ne", testament: "OT", orderIndex: 16, totalChapters: 13 },
  { osisId: "Esth", nameEn: "Esther", namePt: "Ester", abbEn: "Est", abbPt: "Et", testament: "OT", orderIndex: 17, totalChapters: 10 },
  { osisId: "Job", nameEn: "Job", namePt: "Jó", abbEn: "Job", abbPt: "Jó", testament: "OT", orderIndex: 18, totalChapters: 42 },
  { osisId: "Ps", nameEn: "Psalms", namePt: "Salmos", abbEn: "Psa", abbPt: "Sl", testament: "OT", orderIndex: 19, totalChapters: 150 },
  { osisId: "Prov", nameEn: "Proverbs", namePt: "Provérbios", abbEn: "Pro", abbPt: "Pv", testament: "OT", orderIndex: 20, totalChapters: 31 },
  { osisId: "Eccl", nameEn: "Ecclesiastes", namePt: "Eclesiastes", abbEn: "Ecc", abbPt: "Ec", testament: "OT", orderIndex: 21, totalChapters: 12 },
  { osisId: "Song", nameEn: "Song of Solomon", namePt: "Cânticos", abbEn: "Son", abbPt: "Ct", testament: "OT", orderIndex: 22, totalChapters: 8 },
  { osisId: "Isa", nameEn: "Isaiah", namePt: "Isaías", abbEn: "Isa", abbPt: "Is", testament: "OT", orderIndex: 23, totalChapters: 66 },
  { osisId: "Jer", nameEn: "Jeremiah", namePt: "Jeremias", abbEn: "Jer", abbPt: "Jr", testament: "OT", orderIndex: 24, totalChapters: 52 },
  { osisId: "Lam", nameEn: "Lamentations", namePt: "Lamentações", abbEn: "Lam", abbPt: "Lm", testament: "OT", orderIndex: 25, totalChapters: 5 },
  { osisId: "Ezek", nameEn: "Ezekiel", namePt: "Ezequiel", abbEn: "Ezk", abbPt: "Ez", testament: "OT", orderIndex: 26, totalChapters: 48 },
  { osisId: "Dan", nameEn: "Daniel", namePt: "Daniel", abbEn: "Dan", abbPt: "Dn", testament: "OT", orderIndex: 27, totalChapters: 12 },
  { osisId: "Hos", nameEn: "Hosea", namePt: "Oseias", abbEn: "Hos", abbPt: "Os", testament: "OT", orderIndex: 28, totalChapters: 14 },
  { osisId: "Joel", nameEn: "Joel", namePt: "Joel", abbEn: "Joe", abbPt: "Jl", testament: "OT", orderIndex: 29, totalChapters: 3 },
  { osisId: "Amos", nameEn: "Amos", namePt: "Amós", abbEn: "Amo", abbPt: "Am", testament: "OT", orderIndex: 30, totalChapters: 9 },
  { osisId: "Obad", nameEn: "Obadiah", namePt: "Obadias", abbEn: "Oba", abbPt: "Ob", testament: "OT", orderIndex: 31, totalChapters: 1 },
  { osisId: "Jonah", nameEn: "Jonah", namePt: "Jonas", abbEn: "Jon", abbPt: "Jn", testament: "OT", orderIndex: 32, totalChapters: 4 },
  { osisId: "Mic", nameEn: "Micah", namePt: "Miquéias", abbEn: "Mic", abbPt: "Mq", testament: "OT", orderIndex: 33, totalChapters: 7 },
  { osisId: "Nah", nameEn: "Nahum", namePt: "Naum", abbEn: "Nah", abbPt: "Na", testament: "OT", orderIndex: 34, totalChapters: 3 },
  { osisId: "Hab", nameEn: "Habakkuk", namePt: "Habacuque", abbEn: "Hab", abbPt: "Hc", testament: "OT", orderIndex: 35, totalChapters: 3 },
  { osisId: "Zeph", nameEn: "Zephaniah", namePt: "Sofonias", abbEn: "Zep", abbPt: "Sf", testament: "OT", orderIndex: 36, totalChapters: 3 },
  { osisId: "Hag", nameEn: "Haggai", namePt: "Ageu", abbEn: "Hag", abbPt: "Ag", testament: "OT", orderIndex: 37, totalChapters: 2 },
  { osisId: "Zech", nameEn: "Zechariah", namePt: "Zacarias", abbEn: "Zec", abbPt: "Zc", testament: "OT", orderIndex: 38, totalChapters: 14 },
  { osisId: "Mal", nameEn: "Malachi", namePt: "Malaquias", abbEn: "Mal", abbPt: "Ml", testament: "OT", orderIndex: 39, totalChapters: 4 },
  // Novo Testamento
  { osisId: "Matt", nameEn: "Matthew", namePt: "Mateus", abbEn: "Mat", abbPt: "Mt", testament: "NT", orderIndex: 40, totalChapters: 28 },
  { osisId: "Mark", nameEn: "Mark", namePt: "Marcos", abbEn: "Mar", abbPt: "Mc", testament: "NT", orderIndex: 41, totalChapters: 16 },
  { osisId: "Luke", nameEn: "Luke", namePt: "Lucas", abbEn: "Luk", abbPt: "Lc", testament: "NT", orderIndex: 42, totalChapters: 24 },
  { osisId: "John", nameEn: "John", namePt: "João", abbEn: "Joh", abbPt: "Jo", testament: "NT", orderIndex: 43, totalChapters: 21 },
  { osisId: "Acts", nameEn: "Acts", namePt: "Atos", abbEn: "Act", abbPt: "At", testament: "NT", orderIndex: 44, totalChapters: 28 },
  { osisId: "Rom", nameEn: "Romans", namePt: "Romanos", abbEn: "Rom", abbPt: "Rm", testament: "NT", orderIndex: 45, totalChapters: 16 },
  { osisId: "1Cor", nameEn: "1 Corinthians", namePt: "1 Coríntios", abbEn: "1Co", abbPt: "1Co", testament: "NT", orderIndex: 46, totalChapters: 16 },
  { osisId: "2Cor", nameEn: "2 Corinthians", namePt: "2 Coríntios", abbEn: "2Co", abbPt: "2Co", testament: "NT", orderIndex: 47, totalChapters: 13 },
  { osisId: "Gal", nameEn: "Galatians", namePt: "Gálatas", abbEn: "Gal", abbPt: "Gl", testament: "NT", orderIndex: 48, totalChapters: 6 },
  { osisId: "Eph", nameEn: "Ephesians", namePt: "Efésios", abbEn: "Eph", abbPt: "Ef", testament: "NT", orderIndex: 49, totalChapters: 6 },
  { osisId: "Phil", nameEn: "Philippians", namePt: "Filipenses", abbEn: "Phi", abbPt: "Fp", testament: "NT", orderIndex: 50, totalChapters: 4 },
  { osisId: "Col", nameEn: "Colossians", namePt: "Colossenses", abbEn: "Col", abbPt: "Cl", testament: "NT", orderIndex: 51, totalChapters: 4 },
  { osisId: "1Thess", nameEn: "1 Thessalonians", namePt: "1 Tessalonicenses", abbEn: "1Th", abbPt: "1Ts", testament: "NT", orderIndex: 52, totalChapters: 5 },
  { osisId: "2Thess", nameEn: "2 Thessalonians", namePt: "2 Tessalonicenses", abbEn: "2Th", abbPt: "2Ts", testament: "NT", orderIndex: 53, totalChapters: 3 },
  { osisId: "1Tim", nameEn: "1 Timothy", namePt: "1 Timóteo", abbEn: "1Ti", abbPt: "1Tm", testament: "NT", orderIndex: 54, totalChapters: 6 },
  { osisId: "2Tim", nameEn: "2 Timothy", namePt: "2 Timóteo", abbEn: "2Ti", abbPt: "2Tm", testament: "NT", orderIndex: 55, totalChapters: 4 },
  { osisId: "Titus", nameEn: "Titus", namePt: "Tito", abbEn: "Tit", abbPt: "Tt", testament: "NT", orderIndex: 56, totalChapters: 3 },
  { osisId: "Phlm", nameEn: "Philemon", namePt: "Filemom", abbEn: "Phm", abbPt: "Fm", testament: "NT", orderIndex: 57, totalChapters: 1 },
  { osisId: "Heb", nameEn: "Hebrews", namePt: "Hebreus", abbEn: "Heb", abbPt: "Hb", testament: "NT", orderIndex: 58, totalChapters: 13 },
  { osisId: "Jas", nameEn: "James", namePt: "Tiago", abbEn: "Jam", abbPt: "Tg", testament: "NT", orderIndex: 59, totalChapters: 5 },
  { osisId: "1Pet", nameEn: "1 Peter", namePt: "1 Pedro", abbEn: "1Pe", abbPt: "1Pe", testament: "NT", orderIndex: 60, totalChapters: 5 },
  { osisId: "2Pet", nameEn: "2 Peter", namePt: "2 Pedro", abbEn: "2Pe", abbPt: "2Pe", testament: "NT", orderIndex: 61, totalChapters: 3 },
  { osisId: "1John", nameEn: "1 John", namePt: "1 João", abbEn: "1Jo", abbPt: "1Jo", testament: "NT", orderIndex: 62, totalChapters: 5 },
  { osisId: "2John", nameEn: "2 John", namePt: "2 João", abbEn: "2Jo", abbPt: "2Jo", testament: "NT", orderIndex: 63, totalChapters: 1 },
  { osisId: "3John", nameEn: "3 John", namePt: "3 João", abbEn: "3Jo", abbPt: "3Jo", testament: "NT", orderIndex: 64, totalChapters: 1 },
  { osisId: "Jude", nameEn: "Jude", namePt: "Judas", abbEn: "Jud", abbPt: "Jd", testament: "NT", orderIndex: 65, totalChapters: 1 },
  { osisId: "Rev", nameEn: "Revelation", namePt: "Apocalipse", abbEn: "Rev", abbPt: "Ap", testament: "NT", orderIndex: 66, totalChapters: 22 },
];

// ─────────────────────────────────────────────
// CONQUISTAS
// ─────────────────────────────────────────────

const achievements = [
  { code: "first_session", nameEn: "First Words", namePt: "Primeiras Palavras", descriptionEn: "Complete your very first typing session.", descriptionPt: "Complete sua primeira sessão de digitação.", iconName: "✒️", type: "progress" },
  { code: "first_chapter", nameEn: "Chapter One", namePt: "Primeiro Capítulo", descriptionEn: "Complete your first full chapter.", descriptionPt: "Complete seu primeiro capítulo inteiro.", iconName: "📖", type: "progress", unlockTheme: "parchment" },
  { code: "book_john", nameEn: "Book of John", namePt: "Livro de João", descriptionEn: "Complete all 21 chapters of the Gospel of John.", descriptionPt: "Complete todos os 21 capítulos do Evangelho de João.", iconName: "📜", type: "progress" },
  { code: "gospel_finisher", nameEn: "Gospel Finisher", namePt: "Evangelhos Completos", descriptionEn: "Complete all four Gospels.", descriptionPt: "Complete os quatro Evangelhos: Mateus, Marcos, Lucas e João.", iconName: "✝️", type: "progress" },
  { code: "new_testament", nameEn: "New Testament", namePt: "Novo Testamento", descriptionEn: "Complete every book in the New Testament.", descriptionPt: "Complete todos os livros do Novo Testamento.", iconName: "📕", type: "progress" },
  { code: "old_testament", nameEn: "Old Testament", namePt: "Antigo Testamento", descriptionEn: "Complete every book in the Old Testament.", descriptionPt: "Complete todos os livros do Antigo Testamento.", iconName: "📘", type: "progress" },
  { code: "whole_bible", nameEn: "The Full Journey", namePt: "A Jornada Completa", descriptionEn: "Type through the entire Bible — all 66 books.", descriptionPt: "Digite pela Bíblia inteira — todos os 66 livros.", iconName: "👑", type: "progress" },

  // Consistência (sequência de dias)
  { code: "streak_7", nameEn: "7-Day Rhythm", namePt: "Ritmo de 7 Dias", descriptionEn: "Reach a 7-day streak.", descriptionPt: "Alcance uma sequência de 7 dias.", iconName: "🔥", type: "consistency" },
  { code: "streak_30", nameEn: "30-Day Faithful", namePt: "Fiel por 30 Dias", descriptionEn: "Reach a 30-day streak.", descriptionPt: "Alcance uma sequência de 30 dias.", iconName: "🕯️", type: "consistency" },
  { code: "streak_100", nameEn: "100-Day Devotion", namePt: "Devoção de 100 Dias", descriptionEn: "Reach a 100-day streak.", descriptionPt: "Alcance uma sequência de 100 dias.", iconName: "⭐", type: "consistency" },

  // Precisão
  { code: "sharp_pen", nameEn: "Sharp Pen", namePt: "Pena Afiada", descriptionEn: "Complete 5 sessions with 99%+ accuracy.", descriptionPt: "Complete 5 sessões com 99%+ de precisão.", iconName: "🎯", type: "attention" },

  // Volume (versículos digitados)
  { code: "verses_10", nameEn: "First Steps", namePt: "Primeiros Passos", descriptionEn: "Type 10 verses.", descriptionPt: "Digite 10 versículos.", iconName: "🌱", type: "volume" },
  { code: "verses_50", nameEn: "Taking Root", namePt: "Lançando Raízes", descriptionEn: "Type 50 verses.", descriptionPt: "Digite 50 versículos.", iconName: "🌿", type: "volume" },
  { code: "verses_100", nameEn: "Apprentice", namePt: "Aprendiz", descriptionEn: "Type 100 verses.", descriptionPt: "Digite 100 versículos.", iconName: "✍️", type: "volume" },
  { code: "verses_500", nameEn: "Dedicated Scribe", namePt: "Escriba Dedicado", descriptionEn: "Type 500 verses.", descriptionPt: "Digite 500 versículos.", iconName: "📜", type: "volume" },
  { code: "verses_1000", nameEn: "Scribe", namePt: "Escriba", descriptionEn: "Type 1,000 verses.", descriptionPt: "Digite 1.000 versículos.", iconName: "🖋️", type: "volume" },
  { code: "verses_3000", nameEn: "Journeyman", namePt: "Escriba de Ofício", descriptionEn: "Type 3,000 verses.", descriptionPt: "Digite 3.000 versículos.", iconName: "📖", type: "volume" },
  { code: "verses_5000", nameEn: "Faithful Scribe", namePt: "Escriba Fiel", descriptionEn: "Type 5,000 verses.", descriptionPt: "Digite 5.000 versículos.", iconName: "🕯️", type: "volume" },
  { code: "verses_10000", nameEn: "Chronicler", namePt: "Cronista", descriptionEn: "Type 10,000 verses.", descriptionPt: "Digite 10.000 versículos.", iconName: "📚", type: "volume" },
  { code: "verses_15000", nameEn: "Ancient Scribe", namePt: "Escriba Antigo", descriptionEn: "Type 15,000 verses.", descriptionPt: "Digite 15.000 versículos.", iconName: "🏛️", type: "volume" },
  { code: "verses_20000", nameEn: "Sage", namePt: "Sábio", descriptionEn: "Type 20,000 verses.", descriptionPt: "Digite 20.000 versículos.", iconName: "⭐", type: "volume" },
  { code: "verses_25000", nameEn: "Elder Scribe", namePt: "Escriba Ancião", descriptionEn: "Type 25,000 verses.", descriptionPt: "Digite 25.000 versículos.", iconName: "🌟", type: "volume" },
  { code: "verses_30000", nameEn: "Almost There", namePt: "Quase Lá", descriptionEn: "Type 30,000 verses.", descriptionPt: "Digite 30.000 versículos.", iconName: "💫", type: "volume" },
  { code: "verses_31102", nameEn: "The Full Bible", namePt: "A Bíblia Completa", descriptionEn: "Type all 31,102 verses of the Bible.", descriptionPt: "Digite todos os 31.102 versículos da Bíblia.", iconName: "👑", type: "volume" },
];

// ─────────────────────────────────────────────
// PLANOS GUIADOS
// ─────────────────────────────────────────────

const guidedPaths = [
  {
    slug: "gospel-of-john",
    nameEn: "Gospel of John",
    namePt: "Evangelho de João",
    descriptionEn: "Start your journey with the Gospel of John — 21 chapters of profound truth.",
    descriptionPt: "Comece sua jornada pelo Evangelho de João — 21 capítulos de verdade profunda.",
    estimatedDays: 14,
    items: Array.from({ length: 21 }, (_, i) => ({
      orderIndex: i + 1,
      bookOsisId: "John",
      chapterNumber: i + 1,
    })),
  },
  {
    slug: "psalms-and-proverbs",
    nameEn: "Psalms & Proverbs",
    namePt: "Salmos e Provérbios",
    descriptionEn: "Poetry and wisdom — a journey through the heart of the Old Testament.",
    descriptionPt: "Poesia e sabedoria — uma jornada pelo coração do Antigo Testamento.",
    estimatedDays: 56,
    items: [
      ...Array.from({ length: 150 }, (_, i) => ({ orderIndex: i + 1, bookOsisId: "Ps", chapterNumber: i + 1 })),
      ...Array.from({ length: 31 }, (_, i) => ({ orderIndex: 151 + i, bookOsisId: "Prov", chapterNumber: i + 1 })),
    ],
  },
  {
    slug: "the-gospels",
    nameEn: "The Four Gospels",
    namePt: "Os Quatro Evangelhos",
    descriptionEn: "Matthew, Mark, Luke, and John — the life of Jesus in four voices.",
    descriptionPt: "Mateus, Marcos, Lucas e João — a vida de Jesus em quatro vozes.",
    estimatedDays: 42,
    items: [
      ...Array.from({ length: 28 }, (_, i) => ({ orderIndex: i + 1, bookOsisId: "Matt", chapterNumber: i + 1 })),
      ...Array.from({ length: 16 }, (_, i) => ({ orderIndex: 29 + i, bookOsisId: "Mark", chapterNumber: i + 1 })),
      ...Array.from({ length: 24 }, (_, i) => ({ orderIndex: 45 + i, bookOsisId: "Luke", chapterNumber: i + 1 })),
      ...Array.from({ length: 21 }, (_, i) => ({ orderIndex: 69 + i, bookOsisId: "John", chapterNumber: i + 1 })),
    ],
  },
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding reference data...\n");

  console.log("  → Traduções...");
  for (const t of translations) {
    await prisma.translation.upsert({ where: { id: t.id }, update: t, create: t });
  }
  console.log(`     ✓ ${translations.length} traduções`);

  console.log("  → Livros...");
  for (const b of books) {
    const data = {
      nameEn: b.nameEn,
      namePt: b.namePt,
      abbreviationEn: b.abbEn,
      abbreviationPt: b.abbPt,
      testament: b.testament,
      orderIndex: b.orderIndex,
      totalChapters: b.totalChapters,
    };
    await prisma.book.upsert({
      where: { osisId: b.osisId },
      update: data,
      create: { osisId: b.osisId, ...data },
    });
  }
  console.log(`     ✓ ${books.length} livros`);

  console.log("  → Capítulos...");
  let chapterCount = 0;
  for (const b of books) {
    const book = await prisma.book.findUnique({ where: { osisId: b.osisId } });
    if (!book) continue;
    const existing = await prisma.chapter.count({ where: { bookId: book.id } });
    if (existing < b.totalChapters) {
      await prisma.chapter.createMany({
        data: Array.from({ length: b.totalChapters }, (_, i) => ({
          bookId: book.id,
          chapterNumber: i + 1,
          totalVerses: 0,
        })),
      });
    }
    chapterCount += b.totalChapters;
  }
  console.log(`     ✓ ${chapterCount} capítulos`);

  console.log("  → Conquistas...");
  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { code: a.code }, update: a, create: a });
  }
  console.log(`     ✓ ${achievements.length} conquistas`);

  console.log("  → Planos guiados...");
  for (const path of guidedPaths) {
    const { items, ...pathData } = path;
    const created = await prisma.guidedPath.upsert({
      where: { slug: path.slug },
      update: pathData,
      create: pathData,
    });
    await prisma.guidedPathItem.deleteMany({ where: { pathId: created.id } });
    await prisma.guidedPathItem.createMany({
      data: items.map((item) => ({ ...item, pathId: created.id })),
    });
  }
  console.log(`     ✓ ${guidedPaths.length} planos`);

  console.log("\n✅ Dados de referência prontos.");
  console.log("📖 Próximo passo: npm run db:seed:bible");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
