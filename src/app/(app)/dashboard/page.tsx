import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { percentOf, TOTAL_BIBLE_VERSES } from "@/lib/utils";
import { ArrowRight, Flame, BookOpen, Hash, BookMarked } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [streak, progress, allBooks, verseSessions, allChaptersOrdered, lastSession] = await Promise.all([
    prisma.streak.findUnique({ where: { userId: user.id } }),
    prisma.userProgress.findMany({
      where: { userId: user.id },
      include: { book: true, chapter: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.book.findMany({ orderBy: { orderIndex: "asc" } }),
    // Inclui sessões em andamento — digitação parcial conta no progresso
    prisma.typingSession.aggregate({
      where: { userId: user.id, status: { in: ["in_progress", "completed"] } },
      _sum: { versesTyped: true },
    }),
    prisma.chapter.findMany({
      include: { book: true },
      orderBy: [{ book: { orderIndex: "asc" } }, { chapterNumber: "asc" }],
    }),
    // Última atividade de digitação (qualquer status) — é daqui que se retoma
    prisma.typingSession.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      select: { chapterId: true },
    }),
  ]);

  const completedChapterIds = new Set(progress.map((p) => p.chapterId));
  const totalCompletedChapters = progress.length;
  const totalChapters = allBooks.reduce((sum, b) => sum + b.totalChapters, 0);
  const totalVersesTyped = verseSessions._sum.versesTyped ?? 0;

  // Retomada: parte do último capítulo digitado (em qualquer livro).
  // Se ele está incompleto → volta exatamente para ele;
  // se está completo → segue para o próximo não concluído a partir dali;
  // sem atividade nenhuma → Gênesis 1.
  const nextChapterData = (() => {
    const toData = (ch: (typeof allChaptersOrdered)[number], resuming: boolean) => ({
      bookOsisId: ch.book.osisId,
      chapterNumber: ch.chapterNumber,
      bookName: ch.book.namePt,
      resuming,
    });

    let startIdx = 0;
    if (lastSession) {
      const lastIdx = allChaptersOrdered.findIndex((ch) => ch.id === lastSession.chapterId);
      if (lastIdx !== -1) {
        if (!completedChapterIds.has(lastSession.chapterId)) {
          return toData(allChaptersOrdered[lastIdx], true);
        }
        startIdx = lastIdx + 1;
      }
    }
    for (let i = startIdx; i < allChaptersOrdered.length; i++) {
      const ch = allChaptersOrdered[i];
      if (!completedChapterIds.has(ch.id)) return toData(ch, false);
    }
    for (let i = 0; i < startIdx; i++) {
      const ch = allChaptersOrdered[i];
      if (!completedChapterIds.has(ch.id)) return toData(ch, false);
    }
    return null;
  })();

  const recentProgress = progress.slice(0, 5);
  const currentStreak = streak?.currentStreak ?? 0;
  const bestStreak = streak?.bestStreak ?? 0;
  const firstName = user.name?.split(" ")[0];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {nextChapterData
              ? firstName
                ? `Sua jornada continua, ${firstName}`
                : "Sua jornada continua"
              : "Bíblia concluída! 🎉"}
          </h2>
          <p className="page-subtitle">
            {nextChapterData
              ? `${nextChapterData.resuming ? "Em andamento" : "Próximo"}: ${nextChapterData.bookName} ${nextChapterData.chapterNumber}`
              : "Você completou toda a Bíblia. Que jornada incrível."}
          </p>
        </div>
        {nextChapterData && (
          <Link href={`/type/${nextChapterData.bookOsisId}/${nextChapterData.chapterNumber}`} className="btn-primary">
            {nextChapterData.resuming ? "Continuar de onde parei" : "Continuar digitando"}
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="dashboard-hero">
        {nextChapterData && (
          <div className="panel typing-card">
            <span className="eyebrow">Sessão de hoje</span>
            <h3 className="panel-title">
              {nextChapterData.bookName} {nextChapterData.chapterNumber}
            </h3>
            <p style={{ color: "hsl(var(--muted))", fontSize: ".875rem", marginTop: 4, marginBottom: 20, lineHeight: 1.5 }}>
              {nextChapterData.resuming
                ? "Você parou no meio deste capítulo — retome de onde estava."
                : "Continue sua jornada — uma sessão de ~7 minutos é suficiente."}
            </p>
            <Link href={`/type/${nextChapterData.bookOsisId}/${nextChapterData.chapterNumber}`} className="btn-primary">
              {nextChapterData.resuming ? "Retomar capítulo" : "Começar agora"}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Sequência & stats */}
        <div className="panel stats-card">
          <span className="eyebrow">Sequência</span>
          <div className="dashboard-streak">
            <div className="streak-ring-sm" aria-label={`${currentStreak} dias de sequência`}>
              <div
                className="streak-ring-track"
                style={{
                  background: `conic-gradient(hsl(var(--gold)) 0 ${Math.min(currentStreak / 30, 1) * 360}deg, hsl(var(--surface-2)) ${Math.min(currentStreak / 30, 1) * 360}deg 360deg)`,
                }}
              >
                <div className="streak-ring-center">
                  <Flame size={14} style={{ color: "hsl(var(--gold))" }} />
                  <strong style={{ fontVariantNumeric: "tabular-nums", fontSize: "1.2rem", lineHeight: 1.2, color: "hsl(var(--foreground))" }}>
                    {currentStreak}
                  </strong>
                  <span style={{ fontSize: ".65rem", color: "hsl(var(--muted))" }}>dias</span>
                </div>
              </div>
            </div>
          </div>
          <div className="kpi-grid">
            <div className="kpi">
              <BookOpen size={14} style={{ color: "hsl(var(--primary))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{totalCompletedChapters}</strong>
              <span>Capítulos</span>
            </div>
            <div className="kpi">
              <Hash size={14} style={{ color: "hsl(var(--primary))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{totalVersesTyped.toLocaleString("pt-BR")}</strong>
              <span>Versículos</span>
            </div>
            <div className="kpi">
              <Flame size={14} style={{ color: "hsl(var(--gold))" }} />
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{bestStreak}</strong>
              <span>Melhor seq.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="panel section-card">
        <div className="section-header">
          <span className="eyebrow">Progresso na Bíblia</span>
          <Link href="/bible-map" style={{ fontSize: ".8rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
            Ver mapa completo →
          </Link>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={12} style={{ color: "hsl(var(--primary))" }} />
                Capítulos
              </span>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                {totalCompletedChapters.toLocaleString("pt-BR")} / {totalChapters.toLocaleString("pt-BR")}
                <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}>
                  {" "}({percentOf(totalCompletedChapters, totalChapters)}%)
                </span>
              </span>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${percentOf(totalCompletedChapters, totalChapters)}%` }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 6 }}>
                <BookMarked size={12} style={{ color: "hsl(var(--gold))" }} />
                Versículos digitados
              </span>
              <span style={{ fontSize: ".75rem", color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                {totalVersesTyped.toLocaleString("pt-BR")} / {TOTAL_BIBLE_VERSES.toLocaleString("pt-BR")}
                <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}>
                  {" "}({percentOf(totalVersesTyped, TOTAL_BIBLE_VERSES)}%)
                </span>
              </span>
            </div>
            <div className="meter">
              <div
                className="meter-fill"
                style={{ width: `${percentOf(totalVersesTyped, TOTAL_BIBLE_VERSES)}%`, background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--primary)))" }}
              />
            </div>
          </div>
        </div>

        {/* Livros em andamento */}
        {allBooks.some((b) => progress.some((p) => p.bookId === b.id)) && (
          <div className="book-progress-list" style={{ marginTop: 20 }}>
            {allBooks
              .filter((b) => progress.some((p) => p.bookId === b.id))
              .slice(0, 4)
              .map((book) => {
                const done = progress.filter((p) => p.bookId === book.id).length;
                return (
                  <div key={book.id} className="book-row">
                    <div className="book-row-info">
                      <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>{book.namePt}</strong>
                      <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                        {done}/{book.totalChapters} cap.
                      </span>
                    </div>
                    <div className="meter">
                      <div className="meter-fill" style={{ width: `${percentOf(done, book.totalChapters)}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Recentes */}
      {recentProgress.length > 0 && (
        <div className="panel section-card">
          <span className="eyebrow">Recentemente digitado</span>
          <div className="recent-list" style={{ marginTop: 12 }}>
            {recentProgress.map((p) => (
              <div key={p.id} className="recent-item">
                <div>
                  <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>
                    {p.book.namePt} {p.chapter.chapterNumber}
                  </strong>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "block", marginTop: 2 }}>
                    {new Date(p.completedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: ".8rem", color: "hsl(var(--muted))", fontVariantNumeric: "tabular-nums" }}>
                  {p.bestWpm && <span>{Math.round(p.bestWpm)} PPM</span>}
                  {p.bestAccuracy && <span>{Math.round(p.bestAccuracy)}%</span>}
                  <Link href={`/type/${p.book.osisId}/${p.chapter.chapterNumber}`} style={{ color: "hsl(var(--primary))", fontSize: ".75rem" }}>
                    Redigitar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
