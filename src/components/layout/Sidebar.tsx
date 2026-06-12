"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Map,
  Trophy,
  Compass,
  User,
  Settings,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./Brand";

const navItems = [
  { href: "/dashboard", icon: BookOpen, label: "Continuar" },
  { href: "/bible-map", icon: Map, label: "Mapa Bíblico" },
  { href: "/rewards", icon: Trophy, label: "Conquistas" },
  { href: "/plans", icon: Compass, label: "Planos" },
  { href: "/profile", icon: User, label: "Perfil" },
  { href: "/settings", icon: Settings, label: "Configurações" },
] as const;

interface SidebarProps {
  streakDays?: number;
}

export function Sidebar({ streakDays = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <BrandMark size={40} />
        <div className="brand-text">
          <h1 className="brand-name">Type the Truth</h1>
          <p className="brand-sub">Sua jornada pelas Escrituras</p>
        </div>
      </div>

      {/* Navegação */}
      <nav aria-label="Navegação principal" className="sidebar-nav">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn("nav-item", isActive && "nav-item--active")}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sequência */}
      <div className="streak-card">
        <div className="streak-card-header">
          <Flame size={13} style={{ color: "hsl(var(--gold))" }} aria-hidden="true" />
          Sequência
        </div>
        <div className="streak-ring-wrap">
          <div
            className="streak-ring"
            style={{
              background: `conic-gradient(hsl(var(--gold)) 0 ${Math.min(streakDays / 30, 1) * 360}deg, hsl(var(--surface-2)) ${Math.min(streakDays / 30, 1) * 360}deg 360deg)`,
            }}
            aria-label={`${streakDays} dias de sequência`}
          >
            <div className="streak-ring-inner">
              <strong className="streak-number tabular-nums">{streakDays}</strong>
              <span className="streak-label">dias</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
