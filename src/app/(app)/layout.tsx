"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { getStreak } from "@/lib/db";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    getStreak().then((s) => setStreakDays(s.currentStreak));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar streakDays={streakDays} />
      <main className="app-main">{children}</main>
    </div>
  );
}
