import { notFound } from "next/navigation";
import { ALL_CHAPTERS, getBook } from "@/lib/books";
import { TypingScreen } from "@/components/typing/TypingScreen";

interface PageProps {
  params: { book: string; chapter: string };
}

// Pré-gera todas as combinações livro/capítulo para o export estático.
export function generateStaticParams() {
  return ALL_CHAPTERS.map((c) => ({ book: c.osisId, chapter: String(c.chapterNumber) }));
}

export function generateMetadata({ params }: PageProps) {
  const book = getBook(params.book);
  if (!book) return { title: "Capítulo" };
  return { title: `${book.namePt} ${params.chapter}` };
}

export default function TypingPage({ params }: PageProps) {
  const book = getBook(params.book);
  const chapterNumber = parseInt(params.chapter, 10);
  if (!book || isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > book.totalChapters) {
    notFound();
  }

  return <TypingScreen osisId={params.book} chapterNumber={chapterNumber} />;
}
