import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { percentOf, TOTAL_BIBLE_VERSES } from "@/lib/utils";
import { BookCard } from "./BookCard";

export const metadata = { title: "Mapa Bíblico" };

export default async function BibleMapPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [books, progress, sessions, allChapters] = await Promise.all([
    prisma.book.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.userProgress.findMany({ where: { userId: user.id } }),
    prisma.typingSession.findMany({
      where: { userId: user.id, status: "completed" },
      select: { chapterId: true, versesTyped: true },
    }),
    prisma.chapter.findMany({
      select: { id: true, bookId: true, chapterNumber: true },
      orderBy: { chapterNumber: "asc" },
    }),
  ]);

  const chapterToBook: Record<string, string> = {};
  for (const ch of allChapters) chapterToBook[ch.id] = ch.bookId;

  const versesByBook: Record<string, number> = {};
  for (const s of sessions) {
    const bookId = chapterToBook[s.chapterId];
    if (bookId) versesByBook[bookId] = (versesByBook[bookId] ?? 0) + (s.versesTyped ?? 0);
  }

  const completedChapterIds = new Set(progress.map((p) => p.chapterId));

  const completedByBook = books.map((book) => {
    const bookChapters = allChapters
      .filter((ch) => ch.bookId === book.id)
      .map((ch) => ({ chapterNumber: ch.chapterNumber, completed: completedChapterIds.has(ch.id) }));
    const completed = progress.filter((p) => p.bookId === book.id).length;
    const versesTyped = versesByBook[book.id] ?? 0;
    return { book, completed, versesTyped, percent: percentOf(completed, book.totalChapters), chapters: bookChapters };
  });

  const otBooks = completedByBook.filter((b) => b.book.testament === "OT");
  const ntBooks = completedByBook.filter((b) => b.book.testament === "NT");

  const totalCompleted = progress.length;
  const totalChapters = books.reduce((s, b) => s + b.totalChapters, 0);
  const totalVerses = sessions.reduce((s, sess) => s + (sess.versesTyped ?? 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Mapa Bíblico</h2>
          <p className="page-subtitle">66 livros · 1.189 capítulos · 31.105 versículos</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="panel section-card">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Capítulos concluídos</span>
              <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
                {totalCompleted.toLocaleString("pt-BR")} / {totalChapters.toLocaleString("pt-BR")}
                <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}> — {percentOf(totalCompleted, totalChapters)}%</span>
              </span>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${percentOf(totalCompleted, totalChapters)}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Versículos digitados</span>
              <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
                {totalVerses.toLocaleString("pt-BR")} / {TOTAL_BIBLE_VERSES.toLocaleString("pt-BR")}
                <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}> — {percentOf(totalVerses, TOTAL_BIBLE_VERSES)}%</span>
              </span>
            </div>
            <div className="meter">
              <div
                className="meter-fill"
                style={{ width: `${percentOf(totalVerses, TOTAL_BIBLE_VERSES)}%`, background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" }}
              />
            </div>
          </div>
        </div>
      </div>

      <TestamentSection title="Antigo Testamento" books={otBooks} />
      <TestamentSection title="Novo Testamento" books={ntBooks} />
    </div>
  );
}

interface BookStat {
  book: { id: string; osisId: string; namePt: string; totalChapters: number };
  completed: number;
  versesTyped: number;
  percent: number;
  chapters: { chapterNumber: number; completed: boolean }[];
}

function TestamentSection({ title, books }: { title: string; books: BookStat[] }) {
  return (
    <section className="panel section-card">
      <span className="eyebrow">{title}</span>
      <div className="bible-map-grid" style={{ marginTop: 16 }}>
        {books.map(({ book, completed, versesTyped, percent, chapters }) => (
          <BookCard
            key={book.id}
            bookOsisId={book.osisId}
            bookName={book.namePt}
            totalChapters={book.totalChapters}
            completed={completed}
            versesTyped={versesTyped}
            percent={percent}
            chapters={chapters}
          />
        ))}
      </div>
    </section>
  );
}
