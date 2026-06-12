import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TypingScreen } from "@/components/typing/TypingScreen";

interface PageProps {
  params: { book: string; chapter: string };
}

export async function generateMetadata({ params }: PageProps) {
  const bookData = await prisma.book.findUnique({ where: { osisId: params.book } });
  if (!bookData) return { title: "Capítulo" };
  return { title: `${bookData.namePt} ${params.chapter}` };
}

export default async function TypingPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const chapterNumber = parseInt(params.chapter, 10);
  if (isNaN(chapterNumber)) notFound();

  const bookData = await prisma.book.findUnique({ where: { osisId: params.book } });
  if (!bookData) notFound();

  const chapterData = await prisma.chapter.findUnique({
    where: {
      bookId_chapterNumber: { bookId: bookData.id, chapterNumber },
    },
  });
  if (!chapterData) notFound();

  const prefs = await prisma.userPreferences.findUnique({ where: { userId: user.id } });
  const translationId = prefs?.preferredTranslationId ?? "NVI";

  const verses = await prisma.verse.findMany({
    where: { chapterId: chapterData.id, translationId },
    orderBy: { verseNumber: "asc" },
    select: { verseNumber: true, text: true },
  });
  if (verses.length === 0) notFound();

  // Próximo capítulo (CTA da tela de conclusão)
  let nextChapter: { bookOsisId: string; chapterNumber: number } | null = null;
  if (chapterNumber < bookData.totalChapters) {
    nextChapter = { bookOsisId: params.book, chapterNumber: chapterNumber + 1 };
  } else {
    const nextBook = await prisma.book.findFirst({
      where: { orderIndex: { gt: bookData.orderIndex } },
      orderBy: { orderIndex: "asc" },
    });
    if (nextBook) nextChapter = { bookOsisId: nextBook.osisId, chapterNumber: 1 };
  }

  return (
    <TypingScreen
      chapter={{
        id: chapterData.id,
        chapterNumber,
        totalVerses: chapterData.totalVerses,
      }}
      bookNamePt={bookData.namePt}
      verses={verses}
      translationId={translationId}
      nextChapter={nextChapter}
    />
  );
}
