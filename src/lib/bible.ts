// Carregamento dos versículos a partir dos arquivos estáticos public/bible/{osisId}.json.
// Cada arquivo é um array de capítulos; cada capítulo é um array de versículos (strings).

export interface Verse {
  verseNumber: number;
  text: string;
}

const cache = new Map<string, string[][]>();

async function loadBook(osisId: string): Promise<string[][]> {
  const cached = cache.get(osisId);
  if (cached) return cached;
  const res = await fetch(`${basePath()}/bible/${osisId}.json`);
  if (!res.ok) throw new Error(`Falha ao carregar ${osisId} (${res.status})`);
  const data = (await res.json()) as string[][];
  cache.set(osisId, data);
  return data;
}

/** Ajusta para funcionar sob subdiretório (ex.: GitHub Pages project site). */
function basePath(): string {
  if (typeof window === "undefined") return "";
  return "";
}

export async function getChapter(osisId: string, chapterNumber: number): Promise<Verse[]> {
  const book = await loadBook(osisId);
  const chapter = book[chapterNumber - 1];
  if (!chapter) return [];
  return chapter.map((text, i) => ({ verseNumber: i + 1, text }));
}

export async function getChapterVerseCount(osisId: string, chapterNumber: number): Promise<number> {
  const book = await loadBook(osisId);
  return book[chapterNumber - 1]?.length ?? 0;
}
