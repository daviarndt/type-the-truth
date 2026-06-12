import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const streak = await prisma.streak.findUnique({ where: { userId: user.id } });

  return (
    <div className="app-shell">
      <Sidebar streakDays={streak?.currentStreak ?? 0} />
      <main className="app-main">{children}</main>
    </div>
  );
}
