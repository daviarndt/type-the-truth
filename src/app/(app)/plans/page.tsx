"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { GUIDED_PATHS } from "@/lib/paths";
import { getAllProgress, type ProgressMap } from "@/lib/db";
import { chapterKey } from "@/lib/books";
import { percentOf } from "@/lib/utils";

export default function PlansPage() {
  const { t, settings } = useApp();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllProgress().then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const lang = settings.uiLanguage;

  if (!loaded) return <div className="page-content" aria-busy="true" />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("plans.title")}</h2>
          <p className="page-subtitle">{t("plans.subtitle")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {GUIDED_PATHS.map((path) => {
          const total = path.items.length;
          const completed = path.items.filter((it) => progress[chapterKey(it.osisId, it.chapterNumber)]).length;
          const percent = percentOf(completed, total);
          const nextItem = path.items.find((it) => !progress[chapterKey(it.osisId, it.chapterNumber)]);

          return (
            <div key={path.slug} className="panel section-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span className="eyebrow">{t("plans.daysEst", { n: path.estimatedDays })}</span>
                    {percent === 100 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> {t("plans.done")}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))", letterSpacing: "-.02em", marginBottom: 4 }}>
                    {lang === "en" ? path.nameEn : path.namePt}
                  </h3>
                  <p style={{ fontSize: ".875rem", color: "hsl(var(--muted))", lineHeight: 1.5 }}>
                    {lang === "en" ? path.descriptionEn : path.descriptionPt}
                  </p>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={12} style={{ color: "hsl(var(--primary))" }} />
                      {t("plans.chapters", { n: total })}
                    </span>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} />
                      {t("plans.minTotal", { n: Math.round(path.estimatedDays * 7) })}
                    </span>
                  </div>
                </div>

                {nextItem && percent < 100 && (
                  <Link href={`/type/${nextItem.osisId}/${nextItem.chapterNumber}`} className="btn-primary" style={{ fontSize: ".8rem", padding: "8px 14px", flexShrink: 0 }}>
                    {completed > 0 ? t("plans.continue") : t("plans.start")}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>

              {completed > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: ".75rem", color: "hsl(var(--muted))" }}>{t("plans.progress")}</span>
                    <span style={{ fontSize: ".75rem", fontWeight: 600, color: "hsl(var(--foreground))", fontVariantNumeric: "tabular-nums" }}>
                      {completed} / {total} — {percent}%
                    </span>
                  </div>
                  <div className="meter">
                    <div className="meter-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
