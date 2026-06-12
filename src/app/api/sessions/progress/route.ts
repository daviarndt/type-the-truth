import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Atualiza o progresso parcial (versículos digitados) da sessão em andamento.
 * Chamado pela tela de digitação a cada versículo completado, para que
 * dashboard/perfil/mapa reflitam a digitação mesmo sem concluir o capítulo.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chapterId, translationId, versesTyped, totalVerses } = await req.json();
    if (!chapterId || !translationId || typeof versesTyped !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Mesmo ID determinístico do /start → upsert atômico, sem duplicatas
    const sessionId = `ip_${user.id}_${chapterId}_${translationId}`;
    const existing = await prisma.typingSession.findUnique({ where: { id: sessionId } });

    const session = await prisma.typingSession.upsert({
      where: { id: sessionId },
      update: {
        // Nunca regride (backspace sobre o fim de um versículo não desconta)
        versesTyped: Math.max(versesTyped, existing?.versesTyped ?? 0),
        startedAt: new Date(),
      },
      create: {
        id: sessionId,
        userId: user.id,
        chapterId,
        translationId,
        status: "in_progress",
        versesTyped,
        totalVerses: totalVerses ?? 0,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
