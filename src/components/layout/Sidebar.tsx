"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Map, Trophy, Compass, User, Settings, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/AppProvider";
import { BrandMark } from "./Brand";

const navItems = [
  { href: "/dashboard", icon: BookOpen, key: "nav.continue" },
  { href: "/bible-map", icon: Map, key: "nav.map" },
  { href: "/rewards", icon: Trophy, key: "nav.rewards" },
  { href: "/plans", icon: Compass, key: "nav.plans" },
  { href: "/profile", icon: User, key: "nav.profile" },
  { href: "/settings", icon: Settings, key: "nav.settings" },
] as const;

export function Sidebar({ streakDays = 0 }: { streakDays?: number }) {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark size={40} />
        <div className="brand-text">
          <h1 className="brand-name">Type the Truth</h1>
          <p className="brand-sub">{t("brand.tagline")}</p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="sidebar-nav">
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={cn("nav-item", isActive && "nav-item--active")}>
              <Icon size={18} aria-hidden="true" />
              <span className="nav-label">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="streak-card">
        <div className="streak-card-header">
          <Flame size={13} style={{ color: "hsl(var(--gold))" }} aria-hidden="true" />
          {t("nav.streak")}
        </div>
        <div className="streak-ring-wrap">
          <div
            className="streak-ring"
            style={{
              background: `conic-gradient(hsl(var(--gold)) 0 ${Math.min(streakDays / 30, 1) * 360}deg, hsl(var(--surface-2)) ${Math.min(streakDays / 30, 1) * 360}deg 360deg)`,
            }}
            aria-label={`${streakDays} ${t("common.days")}`}
          >
            <div className="streak-ring-inner">
              <strong className="streak-number tabular-nums">{streakDays}</strong>
              <span className="streak-label">{t("common.days")}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
