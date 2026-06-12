import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { percentOf } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { EnrollButton } from "./EnrollButton";

export const metadata = { title: "Planos de Leitura" };

export default async function PlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [paths, enrollments, completedProgress, books, chapterIds] = await Promise.all([
    prisma.guidedPath.findMany({
      where: { isActive: true },
      include: { items: { orderBy: { orderIndex: "asc" } } },
      orderBy: { estimatedDays: "asc" },
    }),
    prisma.guidedPathEnrollment.findMany({ where: { userId: user.id } }),
    prisma.userProgress.findMany({
      where: { userId: user.id },
      select: { chapterId: true },
    }),
    prisma.book.findMany({ select: { id: true, osisId: true } }),
    prisma.chapter.findMany({
      select: { id: true, bookId: true, chapterNumber: true },
    }),
  ]);

  const completedChapterIds = new Set(completedProgress.map((p) => p.chapterId));
  const bookByOsisId = new Map(books.map((b) => [b.osisId, b.id]));
  const chapterIdMap = new Map(chapterIds.map((ch) => [`${ch.bookId}_${ch.chapterNumber}`, ch.id]));
  const enrollmentByPathId = new Map(enrollments.map((e) => [e.pathId, e]));

  const pathsWithProgress = paths.map((path) => {
    const enrollment = enrollmentByPathId.get(path.id);
    const totalItems = path.items.length;
    const completedItems = path.items.filter((item) => {
      const bookId = bookByOsisId.get(item.bookOsisId);
      if (!bookId) return false;
      const chapterId = chapterIdMap.get(`${bookId}_${item.chapterNumber}`);
      return chapterId ? completedChapterIds.has(chapterId) : false;
    }).length;
    const percent = percentOf(completedItems, totalItems);

    const nextItem = path.items.find((item) => {
      const bookId = bookByOsisId.get(item.bookOsisId);
      if (!bookId) return false;
      const chapterId = chapterIdMap.get(`${bookId}_${item.chapterNumber}`);
      return chapterId ? !completedChapterIds.has(chapterId) : true;
    });

    return { path, enrollment, totalItems, completedItems, percent, nextItem };
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Planos de Leitura</h2>
          <p className="page-subtitle">Roteiros guiados para sua jornada bíblica</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {pathsWithProgress.map(({ path, enrollment, totalItems, completedItems, percent, nextItem }) => (
          <div key={path.id} className="panel section-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="eyebrow">{path.estimatedDays} dias estimados</span>
                  {percent === 100 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> Concluído
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))", letterSpacing: "-.02em", marginBottom: 4 }}>
                  {path.namePt}
                </h3>
                <p style={{ fontSize: ".875rem", color: "hsl(var(--muted))", lineHeight: 1.5 }}>
                  {path.descriptionPt}
                </p>

                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 4 }}>
                    <BookOpen size={12} style={{ color: "hsl(var(--primary))" }} />
                    {totalItems} capítulos
                  </span>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} />
                    ~{Math.round(path.estimatedDays * 7)} min total
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                {nextItem && percent < 100 ? (
                  <Link
                    href={`/type/${nextItem.bookOsisId}/${nextItem.chapterNumber}`}
                    className="btn-primary"
                    style={{ fontSize: ".8rem", padding: "8px 14px" }}
                  >
                    {enrollment ? "Continuar" : "Começar"}
                    <ArrowRight size={14} />
                  </Link>
                ) : percent === 100 ? (
                  <span style={{ fontSize: ".8rem", color: "hsl(var(--primary))", fontWeight: 600 }}>✓ Completo</span>
                ) : null}
                {!enrollment && percent < 100 && <EnrollButton pathId={path.id} />}
              </div>
            </div>

            {(enrollment || completedItems > 0) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>Progresso no plano</span>
                  <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
                    {completedItems} / {totalItems} cap.
                    <span style={{ color: "hsl(var(--muted))", fontWeight: 400 }}> — {percent}%</span>
                  </span>
                </div>
                <div className="meter">
                  <div className="meter-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
