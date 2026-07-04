"use client";

/**
 * TypingScreen — engine de digitação (site 100% client-side).
 *  - Busca o capítulo em /bible/{osis}.json e monta a lista de letras.
 *  - Estado autoritativo em refs; render memoizado por palavra (React.memo).
 *  - Progresso salvo no IndexedDB (retomar) e, ao concluir, grava sessão,
 *    progresso, sequência e conquistas.
 *  - QoL: seletor de capítulo, reiniciar (Tab→Enter), Esc para sair,
 *    indicador "salvo", som de teclado e escala de fonte.
 */

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { ChapterPicker } from "@/components/ChapterPicker";
import { getChapter, type Verse } from "@/lib/bible";
import { ALL_CHAPTERS, bookName, chapterKey, getBook } from "@/lib/books";
import {
  upsertProgress, addSession, getStreak, saveStreak, clearResume, getResume, setResume,
  getAllProgress, getAllSessions, getAllResume, getUnlockedAchievements, unlockAchievement,
  type ResumeState,
} from "@/lib/db";
import { bumpStreak } from "@/lib/streak";
import { evaluateAchievements, getAchievement } from "@/lib/achievements";
import { totalVersesTyped } from "@/lib/stats";
import { playKeySound } from "@/lib/keysound";

interface Props {
  osisId: string;
  chapterNumber: number;
}

interface Letter {
  char: string;
  skip: boolean;
}
type LetterState = "p" | "c" | "i";

interface UnlockedAch {
  namePt: string;
  nameEn: string;
  iconName: string;
}

// ── Construção do capítulo ───────────────────────────
function buildChapter(verses: Verse[]) {
  const letters: Letter[] = [];
  const verseEndOffsets: number[] = [];
  verses.forEach((verse, vi) => {
    for (const ch of `[${verse.verseNumber}] `) letters.push({ char: ch, skip: true });
    for (const ch of verse.text) letters.push({ char: ch, skip: false });
    if (vi < verses.length - 1) letters.push({ char: " ", skip: false });
    verseEndOffsets.push(letters.length);
  });

  const words: Letter[][] = [];
  const wordStarts: number[] = [];
  let current: Letter[] = [];
  let start = 0;
  letters.forEach((letter, i) => {
    if (current.length === 0) start = i;
    current.push(letter);
    if (letter.char === " ") {
      words.push(current);
      wordStarts.push(start);
      current = [];
    }
  });
  if (current.length > 0) {
    words.push(current);
    wordStarts.push(start);
  }

  let firstTypeable = 0;
  while (firstTypeable < letters.length && letters[firstTypeable].skip) firstTypeable++;
  return { letters, words, wordStarts, verseEndOffsets, firstTypeable };
}

function formatTime(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, "0")}s`;
}

// ── Palavra memoizada ────────────────────────────────
const Word = memo(function Word({
  letters, states, wordStart, registerRef,
}: {
  letters: Letter[]; states: string; wordStart: number; registerRef: (fi: number, el: HTMLSpanElement | null) => void;
}) {
  return (
    <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
      {letters.map((letter, ci) => {
        const state = states[ci] as LetterState;
        const fi = wordStart + ci;
        let color: string;
        if (letter.skip) color = "hsl(var(--muted-foreground) / 0.45)";
        else if (state === "c") color = "hsl(var(--foreground))";
        else if (state === "i") color = "hsl(var(--destructive))";
        else color = "hsl(var(--muted-foreground))";
        return (
          <span
            key={ci}
            ref={(el) => registerRef(fi, el)}
            style={{
              color,
              background: !letter.skip && state === "i" ? "hsl(var(--destructive) / 0.12)" : "transparent",
              borderRadius: state === "i" ? 2 : 0,
              fontSize: letter.skip ? "0.8em" : undefined,
            }}
          >
            {letter.char === " " ? "\u00A0" : letter.char}
          </span>
        );
      })}
    </span>
  );
});

// ══════════════════════════════════════════════════════
//  Wrapper de carregamento
// ══════════════════════════════════════════════════════
export function TypingScreen({ osisId, chapterNumber }: Props) {
  const { t } = useApp();
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [initialResume, setInitialResume] = useState<ResumeState | null>(null);

  useEffect(() => {
    let active = true;
    setVerses(null);
    const key = chapterKey(osisId, chapterNumber);
    Promise.all([getChapter(osisId, chapterNumber), getResume(key)]).then(([v, r]) => {
      if (!active) return;
      setInitialResume(r ?? null);
      setVerses(v);
    });
    return () => {
      active = false;
    };
  }, [osisId, chapterNumber]);

  if (!verses) {
    return (
      <div className="typing-screen" style={{ placeItems: "center", display: "grid" }}>
        <p style={{ color: "hsl(var(--muted))" }}>…</p>
      </div>
    );
  }

  return (
    <TypingEngine
      key={chapterKey(osisId, chapterNumber)}
      osisId={osisId}
      chapterNumber={chapterNumber}
      verses={verses}
      initialResume={initialResume}
      t={t}
    />
  );
}

// ══════════════════════════════════════════════════════
//  Engine
// ══════════════════════════════════════════════════════
function TypingEngine({
  osisId, chapterNumber, verses, initialResume, t,
}: {
  osisId: string; chapterNumber: number; verses: Verse[]; initialResume: ResumeState | null;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const router = useRouter();
  const { settings } = useApp();
  const { letters, words, wordStarts, verseEndOffsets, firstTypeable } = useMemo(() => buildChapter(verses), [verses]);
  const totalLetters = letters.length;
  const key = chapterKey(osisId, chapterNumber);
  const book = getBook(osisId)!;
  const chapterTitle = `${bookName(book, settings.uiLanguage)} ${chapterNumber}`;

  const nextChapter = useMemo(() => {
    const idx = ALL_CHAPTERS.findIndex((c) => c.osisId === osisId && c.chapterNumber === chapterNumber);
    return idx >= 0 && idx + 1 < ALL_CHAPTERS.length ? ALL_CHAPTERS[idx + 1] : null;
  }, [osisId, chapterNumber]);

  // Estado inicial (aplica retomada)
  const initial = useMemo(() => {
    const states: LetterState[] = new Array(totalLetters).fill("p");
    for (let i = 0; i < firstTypeable; i++) states[i] = "c";
    if (initialResume && initialResume.states.length === totalLetters && initialResume.cursor > firstTypeable) {
      for (let i = 0; i < totalLetters; i++) states[i] = initialResume.states[i] as LetterState;
      return {
        states,
        cursor: Math.min(initialResume.cursor, totalLetters),
        errors: initialResume.errors,
        totalTyped: initialResume.totalTyped,
        elapsed: initialResume.elapsedSeconds,
        resumed: true,
      };
    }
    return { states, cursor: firstTypeable, errors: 0, totalTyped: 0, elapsed: 0, resumed: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLetters]);

  const statesRef = useRef<LetterState[]>(initial.states);
  const cursorRef = useRef(initial.cursor);
  const errorsRef = useRef(initial.errors);
  const totalTypedRef = useRef(initial.totalTyped);
  const startTimeRef = useRef<number | null>(initial.elapsed > 0 ? Date.now() - initial.elapsed * 1000 : null);
  const statusRef = useRef<"ready" | "typing" | "done">("ready");
  const isComposingRef = useRef(false);
  const markedLastRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildWordStates = useCallback(() => {
    const s = statesRef.current;
    return words.map((w, wi) => {
      const start = wordStarts[wi];
      let str = "";
      for (let i = 0; i < w.length; i++) str += s[start + i];
      return str;
    });
  }, [words, wordStarts]);

  const [wordStates, setWordStates] = useState<string[]>(buildWordStates);
  const [cursor, setCursor] = useState(initial.cursor);
  const [status, setStatus] = useState<"ready" | "typing" | "done">("ready");
  const [errors, setErrors] = useState(initial.errors);
  const [totalTyped, setTotalTyped] = useState(initial.totalTyped);
  const [wpm, setWpm] = useState(0);
  const [elapsed, setElapsed] = useState(initial.elapsed);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [newAchievements, setNewAchievements] = useState<UnlockedAch[]>([]);
  const [savedTick, setSavedTick] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tabArmed, setTabArmed] = useState(false);

  const accuracy = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
  const progress = totalLetters > 0 ? Math.round((cursor / totalLetters) * 100) : 0;
  const completedVerses = verseEndOffsets.filter((end) => cursor >= end).length;

  const passageRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const registerRef = useCallback((fi: number, el: HTMLSpanElement | null) => {
    if (el) letterRefs.current.set(fi, el);
    else letterRefs.current.delete(fi);
  }, []);

  // ── Persistência do rascunho (debounced) ──
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (statusRef.current === "done" || cursorRef.current <= firstTypeable) return;
      const secs = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
      await setResume({
        chapterKey: key,
        cursor: cursorRef.current,
        states: statesRef.current.join(""),
        errors: errorsRef.current,
        totalTyped: totalTypedRef.current,
        elapsedSeconds: Math.floor(secs),
        versesTyped: verseEndOffsets.filter((e) => cursorRef.current >= e).length,
        updatedAt: Date.now(),
      });
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1200);
    }, 700);
  }, [key, firstTypeable, verseEndOffsets]);

  const commit = useCallback(() => {
    setWordStates(buildWordStates());
    setCursor(cursorRef.current);
    setErrors(errorsRef.current);
    setTotalTyped(totalTypedRef.current);
    if (startTimeRef.current) {
      const mins = (Date.now() - startTimeRef.current) / 1000 / 60;
      if (mins > 0.01) setWpm(Math.round((totalTypedRef.current - errorsRef.current) / 5 / mins));
    }
    scheduleSave();
  }, [buildWordStates, scheduleSave]);

  // ── Conclusão ──
  const finish = useCallback(async () => {
    statusRef.current = "done";
    setStatus("done");
    const dur = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const total = totalTypedRef.current;
    const errs = errorsRef.current;
    const mins = dur / 60;
    const finalWpm = mins > 0 ? Math.round((total - errs) / 5 / mins) : 0;
    const finalAccuracy = total > 0 ? Math.round(((total - errs) / total) * 100) : 100;
    setElapsed(dur);
    setWpm(finalWpm);

    const now = Date.now();
    await upsertProgress({ osisId, chapterNumber, completedAt: now, bestWpm: finalWpm, bestAccuracy: finalAccuracy, versesTyped: verses.length });
    await addSession({ osisId, chapterNumber, wpm: finalWpm, accuracy: finalAccuracy, durationSeconds: dur, versesTyped: verses.length, completedAt: now });
    const streak = await getStreak();
    const newStreak = bumpStreak(streak);
    await saveStreak(newStreak);
    await clearResume(key);

    // Avalia conquistas
    const [progress, sessions, resume, already] = await Promise.all([
      getAllProgress(), getAllSessions(), getAllResume(), getUnlockedAchievements(),
    ]);
    const satisfied = evaluateAchievements({ progress, sessions, streak: newStreak, totalVersesTyped: totalVersesTyped(progress, resume) });
    const fresh: UnlockedAch[] = [];
    for (const code of satisfied) {
      if (already[code]) continue;
      await unlockAchievement(code, now);
      const def = getAchievement(code);
      if (def) fresh.push({ namePt: def.namePt, nameEn: def.nameEn, iconName: def.iconName });
    }
    setNewAchievements(fresh);
  }, [osisId, chapterNumber, verses.length, key]);

  // ── Digitação ──
  const processChars = useCallback((text: string) => {
    if (statusRef.current === "done") return;
    if (statusRef.current === "ready") {
      statusRef.current = "typing";
      setStatus("typing");
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      if (!markedLastRef.current) {
        markedLastRef.current = true;
        // Marca como "último capítulo aberto" (retomada no dashboard)
        import("@/lib/db").then(({ saveSettings }) => saveSettings({ lastChapterKey: key }));
      }
    }
    const s = statesRef.current;
    let cur = cursorRef.current;
    for (const typed of text) {
      if (cur >= totalLetters) break;
      while (cur < totalLetters && letters[cur].skip) { s[cur] = "c"; cur++; }
      if (cur >= totalLetters) break;
      s[cur] = typed === letters[cur].char ? "c" : "i";
      if (s[cur] === "i") errorsRef.current++;
      totalTypedRef.current++;
      cur++;
      while (cur < totalLetters && letters[cur].skip) { s[cur] = "c"; cur++; }
    }
    cursorRef.current = cur;
    playKeySound(settings.keySound);
    commit();
    if (cur >= totalLetters) finish();
  }, [letters, totalLetters, commit, finish, key, settings.keySound]);

  const handleBackspace = useCallback(() => {
    if (statusRef.current === "done") return;
    const s = statesRef.current;
    let target = cursorRef.current - 1;
    while (target >= firstTypeable && letters[target].skip) target--;
    if (target < firstTypeable) return;
    for (let i = target; i < cursorRef.current; i++) s[i] = "p";
    cursorRef.current = target;
    commit();
  }, [letters, firstTypeable, commit]);

  // ── Reiniciar capítulo ──
  const restart = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await clearResume(key);
    const states: LetterState[] = new Array(totalLetters).fill("p");
    for (let i = 0; i < firstTypeable; i++) states[i] = "c";
    statesRef.current = states;
    cursorRef.current = firstTypeable;
    errorsRef.current = 0;
    totalTypedRef.current = 0;
    startTimeRef.current = null;
    statusRef.current = "ready";
    markedLastRef.current = false;
    setWordStates(buildWordStates());
    setCursor(firstTypeable);
    setErrors(0);
    setTotalTyped(0);
    setWpm(0);
    setElapsed(0);
    setStatus("ready");
    setNewAchievements([]);
    setTabArmed(false);
    textareaRef.current?.focus();
  }, [key, totalLetters, firstTypeable, buildWordStates]);

  // ── Textarea oculto ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const onInput = () => {
      if (isComposingRef.current) return;
      const v = ta.value;
      ta.value = "";
      if (v) processChars(v);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (!e.ctrlKey && !e.altKey && !e.metaKey) handleBackspace();
      }
    };
    const onCompositionStart = () => { isComposingRef.current = true; };
    const onCompositionEnd = (e: CompositionEvent) => {
      isComposingRef.current = false;
      ta.value = "";
      if (e.data) processChars(e.data);
    };
    ta.addEventListener("input", onInput);
    ta.addEventListener("keydown", onKeyDown);
    ta.addEventListener("compositionstart", onCompositionStart);
    ta.addEventListener("compositionend", onCompositionEnd);
    return () => {
      ta.removeEventListener("input", onInput);
      ta.removeEventListener("keydown", onKeyDown);
      ta.removeEventListener("compositionstart", onCompositionStart);
      ta.removeEventListener("compositionend", onCompositionEnd);
    };
  }, [processChars, handleBackspace]);

  // ── Atalhos globais: Esc (sair), Tab→Enter (reiniciar) ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/dashboard");
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        setTabArmed(true);
        return;
      }
      if (tabArmed && e.key === "Enter") {
        e.preventDefault();
        restart();
        return;
      }
      if (tabArmed && e.key !== "Enter") setTabArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, restart, tabArmed]);

  // ── Timer ──
  useEffect(() => {
    if (status !== "typing") return;
    const id = setInterval(() => {
      if (startTimeRef.current) setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [status]);

  // ── Caret + scroll ──
  useLayoutEffect(() => {
    const container = passageRef.current;
    if (!container) return;
    const el = letterRefs.current.get(Math.min(cursor, totalLetters - 1)) ?? null;
    if (!el) return;
    const atEnd = cursor >= totalLetters;
    const top = el.offsetTop;
    const left = atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
    setCaretPos({ top, left });
    const margin = 56;
    if (top + el.offsetHeight > container.scrollTop + container.clientHeight - margin) {
      container.scrollTo({ top: top - container.clientHeight / 2, behavior: "smooth" });
    } else if (top < container.scrollTop) {
      container.scrollTo({ top: Math.max(0, top - margin), behavior: "smooth" });
    }
  }, [cursor, totalLetters]);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  const focusTextarea = useCallback(() => textareaRef.current?.focus(), []);

  const nextHref = nextChapter ? `/type/${nextChapter.osisId}/${nextChapter.chapterNumber}` : null;

  return (
    <div className="typing-screen" onClick={focusTextarea}>
      <textarea
        ref={textareaRef}
        aria-label="Campo de digitação"
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        style={{ position: "fixed", opacity: 0, width: 1, height: 1, top: 0, left: 0, padding: 0, border: "none", outline: "none", resize: "none" }}
      />

      <header className="typing-header">
        <Link href="/dashboard" className="typing-back-btn" aria-label={t("common.back")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="typing-chapter-title">
          <span className="typing-eyebrow">{t("typing.session")}</span>
          <h1 className="typing-title">{chapterTitle}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {savedTick && <span className="saved-indicator">✓ {t("typing.saved")}</span>}
          <button
            className="typing-icon-btn"
            title={t("typing.pickChapter")}
            aria-label={t("typing.pickChapter")}
            onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
          >
            <Compass size={16} />
          </button>
        </div>
        <div className="typing-progress-bar">
          <div className="typing-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="typing-content">
        {status === "done" ? (
          <div className="session-complete">
            <svg className="session-complete-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="session-complete-title">{t("typing.chapterDone")}</h2>
              <p className="session-complete-sub">{chapterTitle}</p>
            </div>
            <div className="session-complete-stats">
              {[
                { v: `${wpm}`, l: t("typing.wpm") },
                { v: `${accuracy}%`, l: t("typing.accuracy") },
                { v: formatTime(elapsed), l: t("typing.time") },
                { v: `${errors}`, l: t("typing.errors") },
              ].map(({ v, l }) => (
                <div key={l} className="complete-stat">
                  <strong>{v}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>

            {newAchievements.length > 0 && (
              <div className="unlocked-achievements">
                {newAchievements.map((a) => (
                  <div key={a.namePt} className="unlocked-achievement">
                    <span style={{ fontSize: "1.25rem" }}>{a.iconName}</span>
                    <div>
                      <span style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".06em", color: "hsl(var(--gold))", fontWeight: 700, display: "block" }}>
                        {t("typing.unlocked")}
                      </span>
                      <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>
                        {settings.uiLanguage === "en" ? a.nameEn : a.namePt}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="session-complete-actions">
              <button className="btn-secondary" onClick={restart}>↻ {t("typing.restart")}</button>
              {nextHref && <Link href={nextHref} className="btn-primary">{t("typing.nextChapter")}</Link>}
              <Link href="/dashboard" className="btn-secondary">{t("typing.dashboard")}</Link>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "72ch", width: "100%" }}>
            {status === "ready" && (
              <p className="typing-start-hint">
                {initial.resumed ? t("typing.resumeHint") : t("typing.startHint")}
              </p>
            )}

            <div ref={passageRef} className="typing-passage-wrap scripture-text" style={{ position: "relative", overflowY: "auto", maxHeight: "60vh" }}>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute", top: caretPos.top, left: caretPos.left, width: 2, height: "1.15em",
                  background: "hsl(var(--gold))", borderRadius: 1, pointerEvents: "none",
                  animation: status === "ready" ? "blink 1s ease-in-out infinite" : "none",
                  zIndex: 2, transition: "top 90ms ease, left 90ms ease",
                }}
              />
              {words.map((wl, wi) => (
                <Word key={wi} letters={wl} states={wordStates[wi]} wordStart={wordStarts[wi]} registerRef={registerRef} />
              ))}
            </div>

            <p className="typing-shortcut-hints">
              <kbd>Tab</kbd> {t("typing.restartHint")} · <kbd>Esc</kbd> {t("typing.exitHint")}
            </p>
          </div>
        )}
      </div>

      {status !== "done" && (
        <footer className="typing-footer">
          <div className="typing-stats">
            {[
              { v: wpm.toString(), l: t("typing.wpm") },
              { v: `${accuracy}%`, l: t("typing.accuracy") },
              { v: `${completedVerses}/${verses.length}`, l: t("common.verses") },
              { v: formatTime(elapsed), l: t("typing.time") },
              { v: errors.toString(), l: t("typing.errors") },
            ].map(({ v, l }) => (
              <div key={l} className="stat-item">
                <span className="stat-value tabular-nums">{v}</span>
                <span className="stat-label">{l}</span>
              </div>
            ))}
          </div>
        </footer>
      )}

      {tabArmed && status !== "done" && (
        <div className="restart-overlay" onClick={() => setTabArmed(false)}>
          <div className="restart-prompt">
            <strong>{t("typing.restart")}?</strong>
            <span><kbd>Enter</kbd> {t("picker.go")} · <kbd>Esc</kbd> {t("common.back")}</span>
          </div>
        </div>
      )}

      {pickerOpen && <ChapterPicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
