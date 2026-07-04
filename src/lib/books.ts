// Metadados dos 66 livros da Bíblia (estático — sem banco de dados).
// A ordem do array é a ordem canônica.

export interface BookMeta {
  osisId: string;
  nameEn: string;
  namePt: string;
  abbreviationPt: string;
  testament: "OT" | "NT";
  totalChapters: number;
}

export const BOOKS: BookMeta[] = [
  { osisId: "Gen", nameEn: "Genesis", namePt: "Gênesis", abbreviationPt: "Gn", testament: "OT", totalChapters: 50 },
  { osisId: "Exod", nameEn: "Exodus", namePt: "Êxodo", abbreviationPt: "Êx", testament: "OT", totalChapters: 40 },
  { osisId: "Lev", nameEn: "Leviticus", namePt: "Levítico", abbreviationPt: "Lv", testament: "OT", totalChapters: 27 },
  { osisId: "Num", nameEn: "Numbers", namePt: "Números", abbreviationPt: "Nm", testament: "OT", totalChapters: 36 },
  { osisId: "Deut", nameEn: "Deuteronomy", namePt: "Deuteronômio", abbreviationPt: "Dt", testament: "OT", totalChapters: 34 },
  { osisId: "Josh", nameEn: "Joshua", namePt: "Josué", abbreviationPt: "Js", testament: "OT", totalChapters: 24 },
  { osisId: "Judg", nameEn: "Judges", namePt: "Juízes", abbreviationPt: "Jz", testament: "OT", totalChapters: 21 },
  { osisId: "Ruth", nameEn: "Ruth", namePt: "Rute", abbreviationPt: "Rt", testament: "OT", totalChapters: 4 },
  { osisId: "1Sam", nameEn: "1 Samuel", namePt: "1 Samuel", abbreviationPt: "1Sm", testament: "OT", totalChapters: 31 },
  { osisId: "2Sam", nameEn: "2 Samuel", namePt: "2 Samuel", abbreviationPt: "2Sm", testament: "OT", totalChapters: 24 },
  { osisId: "1Kgs", nameEn: "1 Kings", namePt: "1 Reis", abbreviationPt: "1Rs", testament: "OT", totalChapters: 22 },
  { osisId: "2Kgs", nameEn: "2 Kings", namePt: "2 Reis", abbreviationPt: "2Rs", testament: "OT", totalChapters: 25 },
  { osisId: "1Chr", nameEn: "1 Chronicles", namePt: "1 Crônicas", abbreviationPt: "1Cr", testament: "OT", totalChapters: 29 },
  { osisId: "2Chr", nameEn: "2 Chronicles", namePt: "2 Crônicas", abbreviationPt: "2Cr", testament: "OT", totalChapters: 36 },
  { osisId: "Ezra", nameEn: "Ezra", namePt: "Esdras", abbreviationPt: "Ed", testament: "OT", totalChapters: 10 },
  { osisId: "Neh", nameEn: "Nehemiah", namePt: "Neemias", abbreviationPt: "Ne", testament: "OT", totalChapters: 13 },
  { osisId: "Esth", nameEn: "Esther", namePt: "Ester", abbreviationPt: "Et", testament: "OT", totalChapters: 10 },
  { osisId: "Job", nameEn: "Job", namePt: "Jó", abbreviationPt: "Jó", testament: "OT", totalChapters: 42 },
  { osisId: "Ps", nameEn: "Psalms", namePt: "Salmos", abbreviationPt: "Sl", testament: "OT", totalChapters: 150 },
  { osisId: "Prov", nameEn: "Proverbs", namePt: "Provérbios", abbreviationPt: "Pv", testament: "OT", totalChapters: 31 },
  { osisId: "Eccl", nameEn: "Ecclesiastes", namePt: "Eclesiastes", abbreviationPt: "Ec", testament: "OT", totalChapters: 12 },
  { osisId: "Song", nameEn: "Song of Solomon", namePt: "Cânticos", abbreviationPt: "Ct", testament: "OT", totalChapters: 8 },
  { osisId: "Isa", nameEn: "Isaiah", namePt: "Isaías", abbreviationPt: "Is", testament: "OT", totalChapters: 66 },
  { osisId: "Jer", nameEn: "Jeremiah", namePt: "Jeremias", abbreviationPt: "Jr", testament: "OT", totalChapters: 52 },
  { osisId: "Lam", nameEn: "Lamentations", namePt: "Lamentações", abbreviationPt: "Lm", testament: "OT", totalChapters: 5 },
  { osisId: "Ezek", nameEn: "Ezekiel", namePt: "Ezequiel", abbreviationPt: "Ez", testament: "OT", totalChapters: 48 },
  { osisId: "Dan", nameEn: "Daniel", namePt: "Daniel", abbreviationPt: "Dn", testament: "OT", totalChapters: 12 },
  { osisId: "Hos", nameEn: "Hosea", namePt: "Oseias", abbreviationPt: "Os", testament: "OT", totalChapters: 14 },
  { osisId: "Joel", nameEn: "Joel", namePt: "Joel", abbreviationPt: "Jl", testament: "OT", totalChapters: 3 },
  { osisId: "Amos", nameEn: "Amos", namePt: "Amós", abbreviationPt: "Am", testament: "OT", totalChapters: 9 },
  { osisId: "Obad", nameEn: "Obadiah", namePt: "Obadias", abbreviationPt: "Ob", testament: "OT", totalChapters: 1 },
  { osisId: "Jonah", nameEn: "Jonah", namePt: "Jonas", abbreviationPt: "Jn", testament: "OT", totalChapters: 4 },
  { osisId: "Mic", nameEn: "Micah", namePt: "Miquéias", abbreviationPt: "Mq", testament: "OT", totalChapters: 7 },
  { osisId: "Nah", nameEn: "Nahum", namePt: "Naum", abbreviationPt: "Na", testament: "OT", totalChapters: 3 },
  { osisId: "Hab", nameEn: "Habakkuk", namePt: "Habacuque", abbreviationPt: "Hc", testament: "OT", totalChapters: 3 },
  { osisId: "Zeph", nameEn: "Zephaniah", namePt: "Sofonias", abbreviationPt: "Sf", testament: "OT", totalChapters: 3 },
  { osisId: "Hag", nameEn: "Haggai", namePt: "Ageu", abbreviationPt: "Ag", testament: "OT", totalChapters: 2 },
  { osisId: "Zech", nameEn: "Zechariah", namePt: "Zacarias", abbreviationPt: "Zc", testament: "OT", totalChapters: 14 },
  { osisId: "Mal", nameEn: "Malachi", namePt: "Malaquias", abbreviationPt: "Ml", testament: "OT", totalChapters: 4 },
  { osisId: "Matt", nameEn: "Matthew", namePt: "Mateus", abbreviationPt: "Mt", testament: "NT", totalChapters: 28 },
  { osisId: "Mark", nameEn: "Mark", namePt: "Marcos", abbreviationPt: "Mc", testament: "NT", totalChapters: 16 },
  { osisId: "Luke", nameEn: "Luke", namePt: "Lucas", abbreviationPt: "Lc", testament: "NT", totalChapters: 24 },
  { osisId: "John", nameEn: "John", namePt: "João", abbreviationPt: "Jo", testament: "NT", totalChapters: 21 },
  { osisId: "Acts", nameEn: "Acts", namePt: "Atos", abbreviationPt: "At", testament: "NT", totalChapters: 28 },
  { osisId: "Rom", nameEn: "Romans", namePt: "Romanos", abbreviationPt: "Rm", testament: "NT", totalChapters: 16 },
  { osisId: "1Cor", nameEn: "1 Corinthians", namePt: "1 Coríntios", abbreviationPt: "1Co", testament: "NT", totalChapters: 16 },
  { osisId: "2Cor", nameEn: "2 Corinthians", namePt: "2 Coríntios", abbreviationPt: "2Co", testament: "NT", totalChapters: 13 },
  { osisId: "Gal", nameEn: "Galatians", namePt: "Gálatas", abbreviationPt: "Gl", testament: "NT", totalChapters: 6 },
  { osisId: "Eph", nameEn: "Ephesians", namePt: "Efésios", abbreviationPt: "Ef", testament: "NT", totalChapters: 6 },
  { osisId: "Phil", nameEn: "Philippians", namePt: "Filipenses", abbreviationPt: "Fp", testament: "NT", totalChapters: 4 },
  { osisId: "Col", nameEn: "Colossians", namePt: "Colossenses", abbreviationPt: "Cl", testament: "NT", totalChapters: 4 },
  { osisId: "1Thess", nameEn: "1 Thessalonians", namePt: "1 Tessalonicenses", abbreviationPt: "1Ts", testament: "NT", totalChapters: 5 },
  { osisId: "2Thess", nameEn: "2 Thessalonians", namePt: "2 Tessalonicenses", abbreviationPt: "2Ts", testament: "NT", totalChapters: 3 },
  { osisId: "1Tim", nameEn: "1 Timothy", namePt: "1 Timóteo", abbreviationPt: "1Tm", testament: "NT", totalChapters: 6 },
  { osisId: "2Tim", nameEn: "2 Timothy", namePt: "2 Timóteo", abbreviationPt: "2Tm", testament: "NT", totalChapters: 4 },
  { osisId: "Titus", nameEn: "Titus", namePt: "Tito", abbreviationPt: "Tt", testament: "NT", totalChapters: 3 },
  { osisId: "Phlm", nameEn: "Philemon", namePt: "Filemom", abbreviationPt: "Fm", testament: "NT", totalChapters: 1 },
  { osisId: "Heb", nameEn: "Hebrews", namePt: "Hebreus", abbreviationPt: "Hb", testament: "NT", totalChapters: 13 },
  { osisId: "Jas", nameEn: "James", namePt: "Tiago", abbreviationPt: "Tg", testament: "NT", totalChapters: 5 },
  { osisId: "1Pet", nameEn: "1 Peter", namePt: "1 Pedro", abbreviationPt: "1Pe", testament: "NT", totalChapters: 5 },
  { osisId: "2Pet", nameEn: "2 Peter", namePt: "2 Pedro", abbreviationPt: "2Pe", testament: "NT", totalChapters: 3 },
  { osisId: "1John", nameEn: "1 John", namePt: "1 João", abbreviationPt: "1Jo", testament: "NT", totalChapters: 5 },
  { osisId: "2John", nameEn: "2 John", namePt: "2 João", abbreviationPt: "2Jo", testament: "NT", totalChapters: 1 },
  { osisId: "3John", nameEn: "3 John", namePt: "3 João", abbreviationPt: "3Jo", testament: "NT", totalChapters: 1 },
  { osisId: "Jude", nameEn: "Jude", namePt: "Judas", abbreviationPt: "Jd", testament: "NT", totalChapters: 1 },
  { osisId: "Rev", nameEn: "Revelation", namePt: "Apocalipse", abbreviationPt: "Ap", testament: "NT", totalChapters: 22 },
];

export const TOTAL_CHAPTERS = 1189;
export const TOTAL_VERSES = 31105;

const bookByOsis = new Map(BOOKS.map((b) => [b.osisId, b]));
export function getBook(osisId: string): BookMeta | undefined {
  return bookByOsis.get(osisId);
}

/** Nome do livro conforme o idioma da interface. */
export function bookName(book: BookMeta, lang: "pt-BR" | "en"): string {
  return lang === "en" ? book.nameEn : book.namePt;
}

export interface ChapterRef {
  osisId: string;
  chapterNumber: number;
  book: BookMeta;
}

/** Lista ordenada de TODOS os capítulos da Bíblia (para "próximo capítulo"). */
export const ALL_CHAPTERS: ChapterRef[] = BOOKS.flatMap((book) =>
  Array.from({ length: book.totalChapters }, (_, i) => ({
    osisId: book.osisId,
    chapterNumber: i + 1,
    book,
  }))
);

export function chapterKey(osisId: string, chapterNumber: number): string {
  return `${osisId}_${chapterNumber}`;
}
