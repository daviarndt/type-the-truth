import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathId } = await req.json();
    if (!pathId) {
      return NextResponse.json({ error: "pathId is required" }, { status: 400 });
    }

    const enrollment = await prisma.guidedPathEnrollment.upsert({
      where: { userId_pathId: { userId: user.id, pathId } },
      update: {},
      create: { userId: user.id, pathId },
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
