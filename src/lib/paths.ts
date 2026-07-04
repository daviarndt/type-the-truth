// Planos de leitura guiados (estático).

export interface PathItem {
  osisId: string;
  chapterNumber: number;
}

export interface GuidedPathDef {
  slug: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  estimatedDays: number;
  items: PathItem[];
}

function range(osisId: string, count: number): PathItem[] {
  return Array.from({ length: count }, (_, i) => ({ osisId, chapterNumber: i + 1 }));
}

export const GUIDED_PATHS: GuidedPathDef[] = [
  {
    slug: "gospel-of-john",
    nameEn: "Gospel of John",
    namePt: "Evangelho de João",
    descriptionEn: "Start your journey with the Gospel of John — 21 chapters of profound truth.",
    descriptionPt: "Comece sua jornada pelo Evangelho de João — 21 capítulos de verdade profunda.",
    estimatedDays: 14,
    items: range("John", 21),
  },
  {
    slug: "the-gospels",
    nameEn: "The Four Gospels",
    namePt: "Os Quatro Evangelhos",
    descriptionEn: "Matthew, Mark, Luke, and John — the life of Jesus in four voices.",
    descriptionPt: "Mateus, Marcos, Lucas e João — a vida de Jesus em quatro vozes.",
    estimatedDays: 42,
    items: [...range("Matt", 28), ...range("Mark", 16), ...range("Luke", 24), ...range("John", 21)],
  },
  {
    slug: "psalms-and-proverbs",
    nameEn: "Psalms & Proverbs",
    namePt: "Salmos e Provérbios",
    descriptionEn: "Poetry and wisdom — a journey through the heart of the Old Testament.",
    descriptionPt: "Poesia e sabedoria — uma jornada pelo coração do Antigo Testamento.",
    estimatedDays: 56,
    items: [...range("Ps", 150), ...range("Prov", 31)],
  },
];
