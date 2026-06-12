import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Marca um capítulo como "em andamento" para o usuário.
 * Mantém no máximo 1 sessão in_progress por (usuário, capítulo, tradução) —
 * é ela que alimenta o "Continuar de onde parou" do dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chapterId, translationId, totalVerses } = await req.json();
    if (!chapterId || !translationId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ID determinístico → upsert atômico; evita corrida com o beacon de
    // progresso criando sessões in_progress duplicadas
    const sessionId = `ip_${user.id}_${chapterId}_${translationId}`;
    const session = await prisma.typingSession.upsert({
      where: { id: sessionId },
      update: { startedAt: new Date() },
      create: {
        id: sessionId,
        userId: user.id,
        chapterId,
        translationId,
        status: "in_progress",
        versesTyped: 0,
        totalVerses: totalVerses ?? 0,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
