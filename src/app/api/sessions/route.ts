import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { updateStreak } from "@/lib/streak";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      chapterId,
      translationId,
      status,
      wpm,
      accuracy,
      durationSeconds,
      versesTyped,
      totalVerses,
    } = body;

    if (!chapterId || !translationId || typeof totalVerses !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const session = await prisma.typingSession.create({
      data: {
        userId: user.id,
        chapterId,
        translationId,
        status,
        wpm,
        accuracy,
        durationSeconds,
        versesTyped,
        totalVerses,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    if (status !== "completed") {
      return NextResponse.json({ session });
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });
    if (!chapter) {
      return NextResponse.json({ session });
    }

    // Progresso do capítulo — mantém melhor PPM/precisão
    const existing = await prisma.userProgress.findUnique({
      where: {
        userId_chapterId_translationId: {
          userId: user.id,
          chapterId,
          translationId,
        },
      },
    });
    await prisma.userProgress.upsert({
      where: {
        userId_chapterId_translationId: {
          userId: user.id,
          chapterId,
          translationId,
        },
      },
      update: {
        bestWpm: Math.max(wpm ?? 0, existing?.bestWpm ?? 0) || null,
        bestAccuracy: Math.max(accuracy ?? 0, existing?.bestAccuracy ?? 0) || null,
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        bookId: chapter.bookId,
        chapterId,
        translationId,
        bestWpm: wpm,
        bestAccuracy: accuracy,
      },
    });

    const streak = await updateStreak(user.id);
    const newAchievements = await checkAndAwardAchievements(user.id);

    return NextResponse.json({ session, streak, newAchievements });
  } catch (error) {
    console.error("Session save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
