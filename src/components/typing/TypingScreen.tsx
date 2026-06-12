"use client";

/**
 * TypingScreen — engine de digitação inspirada no Monkeytype.
 *
 * Arquitetura:
 *  - <textarea> oculto captura todo o input (acentos, ç, IME, mobile).
 *  - O texto é imutável: lista plana de letras + fatias por palavra (criadas 1x).
 *  - O estado de cada letra ('p' pendente | 'c' correta | 'i' incorreta) vive em
 *    refs (fonte da verdade, sem closures desatualizadas) e é commitado ao React
 *    como uma string por palavra — palavras com string igual não re-renderizam
 *    (React.memo), o que mantém capítulos longos (Salmo 119) fluidos.
 *  - Caret pixel-posicionado via offsetTop/offsetLeft da letra atual.
 *  - Progresso salvo em localStorage a cada commit → retomar de onde parou.
 */

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ── Tipos ────────────────────────────────────────────

interface VerseData {
  verseNumber: number;
  text: string;
}

interface TypingScreenProps {
  chapter: { id: string; chapterNumber: number; totalVerses: number };
  bookNamePt: string;
  verses: VerseData[];
  translationId: string;
  nextChapter: { bookOsisId: string; chapterNumber: number } | null;
}

interface Letter {
  char: string;
  /** Prefixo de versículo "[n] " — exibido esmaecido, nunca digitado. */
  skip: boolean;
}

type LetterState = "p" | "c" | "i";

interface UnlockedAchievement {
  namePt: string;
  iconName: string;
}

// ── Construção do capítulo (1x por montagem) ─────────

function buildChapter(verses: VerseData[]) {
  const letters: Letter[] = [];
  const verseEndOffsets: number[] = [];

  verses.forEach((verse, vi) => {
    for (const ch of `[${verse.verseNumber}] `) letters.push({ char: ch, skip: true });
    for (const ch of verse.text) letters.push({ char: ch, skip: false });
    if (vi < verses.length - 1) letters.push({ char: " ", skip: false });
    verseEndOffsets.push(letters.length);
  });

  // Palavras: o espaço fecha a palavra e fica anexado a ela,
  // preservando o mapeamento de índice plano.
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

// ── Persistência local (retomar capítulo) ────────────

interface SavedProgress {
  cursor: number;
  states: string; // string plana, 1 char por letra
  errors: number;
  totalTyped: number;
  elapsedSeconds: number;
}

function storageKey(chapterId: string, translationId: string) {
  return `ttt_progress_${chapterId}_${translationId}`;
}

function loadProgress(chapterId: string, translationId: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(chapterId, translationId));
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  } catch {
    return null;
  }
}

function persistProgress(chapterId: string, translationId: string, data: SavedProgress) {
  try {
    localStorage.setItem(storageKey(chapterId, translationId), JSON.stringify(data));
  } catch {
    /* quota cheia — ignora */
  }
}

function clearProgress(chapterId: string, translationId: string) {
  try {
    localStorage.removeItem(storageKey(chapterId, translationId));
  } catch {
    /* ignora */
  }
}

// ── Helpers ──────────────────────────────────────────

function formatTime(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, "0")}s`;
}

// ── Palavra memoizada ────────────────────────────────

interface WordProps {
  letters: Letter[];
  states: string;
  wordStart: number;
  registerRef: (flatIndex: number, el: HTMLSpanElement | null) => void;
}

const Word = memo(function Word({ letters, states, wordStart, registerRef }: WordProps) {
  return (
    <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
      {letters.map((letter, ci) => {
        const state = states[ci] as LetterState;
        const fi = wordStart + ci;

        let color: string;
        if (letter.skip) {
          color = "hsl(var(--muted-foreground) / 0.45)";
        } else if (state === "c") {
          color = "hsl(var(--foreground))";
        } else if (state === "i") {
          color = "hsl(var(--destructive))";
        } else {
          color = "hsl(var(--muted-foreground))";
        }

        return (
          <span
            key={ci}
            ref={(el) => registerRef(fi, el)}
            style={{
              color,
              background:
                !letter.skip && state === "i" ? "hsl(var(--destructive) / 0.12)" : "transparent",
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
//  Componente principal
// ══════════════════════════════════════════════════════

export function TypingScreen({
  chapter,
  bookNamePt,
  verses,
  translationId,
  nextChapter,
}: TypingScreenProps) {
  const { letters, words, wordStarts, verseEndOffsets, firstTypeable } = useMemo(
    () => buildChapter(verses),
    [verses]
  );
  const totalLetters = letters.length;

  // Estado inicial (restaura do localStorage se houver progresso salvo)
  const initial = useMemo(() => {
    const states: LetterState[] = new Array(totalLetters).fill("p");
    let cursor = firstTypeable;
    for (let i = 0; i < firstTypeable; i++) states[i] = "c";

    if (typeof window !== "undefined") {
      const saved = loadProgress(chapter.id, translationId);
      if (saved && saved.states.length === totalLetters && saved.cursor > firstTypeable) {
        for (let i = 0; i < totalLetters; i++) states[i] = saved.states[i] as LetterState;
        return {
          states,
          cursor: Math.min(saved.cursor, totalLetters),
          errors: saved.errors,
          totalTyped: saved.totalTyped,
          elapsed: saved.elapsedSeconds,
          resumed: true,
        };
      }
    }
    return { states, cursor, errors: 0, totalTyped: 0, elapsed: 0, resumed: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters]);

  // ── Fonte da verdade (refs — imune a closures desatualizadas) ──
  const statesRef = useRef<LetterState[]>(initial.states);
  const cursorRef = useRef(initial.cursor);
  const errorsRef = useRef(initial.errors);
  const totalTypedRef = useRef(initial.totalTyped);
  const startTimeRef = useRef<number | null>(
    initial.elapsed > 0 ? Date.now() - initial.elapsed * 1000 : null
  );
  const statusRef = useRef<"ready" | "typing" | "done">("ready");
  const isComposingRef = useRef(false);

  // ── Estado React (render) ──
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
  const [newAchievements, setNewAchievements] = useState<UnlockedAchievement[]>([]);

  const accuracy = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
  const progress = totalLetters > 0 ? Math.round((cursor / totalLetters) * 100) : 0;
  const completedVerses = verseEndOffsets.filter((end) => cursor >= end).length;
  const chapterTitle = `${bookNamePt} ${chapter.chapterNumber}`;

  // ── Refs DOM ──
  const passageRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const registerRef = useCallback((fi: number, el: HTMLSpanElement | null) => {
    if (el) letterRefs.current.set(fi, el);
    else letterRefs.current.delete(fi);
  }, []);

  // ── Commit: refs → estado React + localStorage ──
  const commit = useCallback(() => {
    const cur = cursorRef.current;
    const errs = errorsRef.current;
    const total = totalTypedRef.current;

    setWordStates(buildWordStates());
    setCursor(cur);
    setErrors(errs);
    setTotalTyped(total);

    let secs = 0;
    if (startTimeRef.current) {
      secs = (Date.now() - startTimeRef.current) / 1000;
      const mins = secs / 60;
      if (mins > 0.01) setWpm(Math.round((total - errs) / 5 / mins));
    }

    if (statusRef.current !== "done" && cur > firstTypeable) {
      persistProgress(chapter.id, translationId, {
        cursor: cur,
        states: statesRef.current.join(""),
        errors: errs,
        totalTyped: total,
        elapsedSeconds: Math.floor(secs),
      });
    }
  }, [buildWordStates, chapter.id, translationId, firstTypeable]);

  // ── Conclusão do capítulo ──
  const finish = useCallback(() => {
    statusRef.current = "done";
    setStatus("done");
    clearProgress(chapter.id, translationId);

    const dur = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const total = totalTypedRef.current;
    const errs = errorsRef.current;
    const mins = dur / 60;
    const finalWpm = mins > 0 ? Math.round((total - errs) / 5 / mins) : 0;
    const finalAccuracy = total > 0 ? Math.round(((total - errs) / total) * 100) : 100;

    setElapsed(dur);
    setWpm(finalWpm);

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId: chapter.id,
        translationId,
        status: "completed",
        wpm: finalWpm,
        accuracy: finalAccuracy,
        durationSeconds: dur,
        versesTyped: verses.length,
        totalVerses: verses.length,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.newAchievements?.length) setNewAchievements(data.newAchievements);
      })
      .catch(() => {
        /* offline — progresso local já está salvo */
      });
  }, [chapter.id, translationId, verses.length]);

  // ── Digitação (processa 1+ caracteres de uma vez) ──
  const processChars = useCallback(
    (text: string) => {
      if (statusRef.current === "done") return;

      if (statusRef.current === "ready") {
        statusRef.current = "typing";
        setStatus("typing");
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        // Marca no servidor que este capítulo está em andamento
        // (alimenta o "Continuar de onde parou" do dashboard)
        fetch("/api/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: chapter.id,
            translationId,
            totalVerses: verses.length,
          }),
        }).catch(() => {});
      }

      const s = statesRef.current;
      let cur = cursorRef.current;

      for (const typed of text) {
        if (cur >= totalLetters) break;
        // Avança automaticamente por prefixos de versículo
        while (cur < totalLetters && letters[cur].skip) {
          s[cur] = "c";
          cur++;
        }
        if (cur >= totalLetters) break;

        s[cur] = typed === letters[cur].char ? "c" : "i";
        if (s[cur] === "i") errorsRef.current++;
        totalTypedRef.current++;
        cur++;

        // Consome prefixos imediatamente após a última letra digitada
        while (cur < totalLetters && letters[cur].skip) {
          s[cur] = "c";
          cur++;
        }
      }

      cursorRef.current = cur;
      commit();
      if (cur >= totalLetters) finish();
    },
    [letters, totalLetters, commit, finish, chapter.id, translationId, verses.length]
  );

  // ── Backspace ──
  const handleBackspace = useCallback(() => {
    if (statusRef.current === "done") return;
    const s = statesRef.current;
    let target = cursorRef.current - 1;

    // Recua por cima de prefixos até a última letra digitável
    while (target >= firstTypeable && letters[target].skip) target--;
    if (target < firstTypeable) return;

    for (let i = target; i < cursorRef.current; i++) s[i] = "p";
    cursorRef.current = target;
    commit();
  }, [letters, firstTypeable, commit]);

  // ── Eventos do textarea oculto ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const onInput = () => {
      if (isComposingRef.current) return;
      const value = ta.value;
      ta.value = "";
      if (value) processChars(value);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (!e.ctrlKey && !e.altKey && !e.metaKey) handleBackspace();
      }
    };
    const onCompositionStart = () => {
      isComposingRef.current = true;
    };
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

  // ── Timer ──
  useEffect(() => {
    if (status !== "typing") return;
    const id = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(id);
  }, [status]);

  // ── Progresso parcial no servidor (a cada versículo completado) ──
  const lastSentVersesRef = useRef(completedVerses);
  useEffect(() => {
    if (status !== "typing") return;
    if (completedVerses <= lastSentVersesRef.current) return;
    lastSentVersesRef.current = completedVerses;
    fetch("/api/sessions/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId: chapter.id,
        translationId,
        versesTyped: completedVerses,
        totalVerses: verses.length,
      }),
    }).catch(() => {});
  }, [completedVerses, status, chapter.id, translationId, verses.length]);

  // ── Caret + scroll da linha ativa ──
  useLayoutEffect(() => {
    const container = passageRef.current;
    if (!container) return;

    const el =
      letterRefs.current.get(Math.min(cursor, totalLetters - 1)) ?? null;
    if (!el) return;

    const atEnd = cursor >= totalLetters;
    const top = el.offsetTop;
    const left = atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
    setCaretPos({ top, left });

    // Mantém a linha ativa visível dentro do contêiner
    const margin = 56;
    if (top + el.offsetHeight > container.scrollTop + container.clientHeight - margin) {
      container.scrollTo({
        top: top - container.clientHeight / 2,
        behavior: "smooth",
      });
    } else if (top < container.scrollTop) {
      container.scrollTo({ top: Math.max(0, top - margin), behavior: "smooth" });
    }
  }, [cursor, totalLetters]);

  // ── Foco ──
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  const focusTextarea = useCallback(() => textareaRef.current?.focus(), []);

  // ── Render ──
  const nextHref = nextChapter
    ? `/type/${nextChapter.bookOsisId}/${nextChapter.chapterNumber}`
    : null;

  return (
    <div className="typing-screen" onClick={focusTextarea}>
      <textarea
        ref={textareaRef}
        aria-label="Campo de digitação"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: "fixed",
          opacity: 0,
          width: 1,
          height: 1,
          top: 0,
          left: 0,
          padding: 0,
          border: "none",
          outline: "none",
          resize: "none",
        }}
      />

      {/* ── Header ── */}
      <header className="typing-header">
        <Link href="/dashboard" className="typing-back-btn" aria-label="Voltar ao dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="typing-chapter-title">
          <span className="typing-eyebrow">Sessão de digitação</span>
          <h1 className="typing-title">{chapterTitle}</h1>
        </div>
        <div className="typing-progress-bar">
          <div className="typing-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div className="typing-content">
        {status === "done" ? (
          <div className="session-complete">
            <svg className="session-complete-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="session-complete-title">Capítulo concluído!</h2>
              <p className="session-complete-sub">{chapterTitle}</p>
            </div>
            <div className="session-complete-stats">
              {[
                { v: `${wpm}`, l: "PPM" },
                { v: `${accuracy}%`, l: "Precisão" },
                { v: formatTime(elapsed), l: "Tempo" },
                { v: `${errors}`, l: "Erros" },
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
                        Conquista desbloqueada
                      </span>
                      <strong style={{ fontSize: ".875rem", color: "hsl(var(--foreground))" }}>{a.namePt}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="session-complete-actions">
              {nextHref && (
                <Link href={nextHref} className="btn-primary">
                  Próximo capítulo →
                </Link>
              )}
              <Link href="/dashboard" className="btn-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "72ch", width: "100%" }}>
            {status === "ready" && (
              <p className="typing-start-hint">
                {initial.resumed
                  ? "Progresso restaurado — continue de onde parou"
                  : "Pressione qualquer tecla para começar"}
              </p>
            )}

            <div
              ref={passageRef}
              className="typing-passage-wrap scripture-text"
              style={{ position: "relative", overflowY: "auto", maxHeight: "60vh" }}
            >
              {/* Caret */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: caretPos.top,
                  left: caretPos.left,
                  width: 2,
                  height: "1.15em",
                  background: "hsl(var(--gold))",
                  borderRadius: 1,
                  pointerEvents: "none",
                  animation: status === "ready" ? "blink 1s ease-in-out infinite" : "none",
                  zIndex: 2,
                  transition: "top 90ms ease, left 90ms ease",
                }}
              />

              {words.map((wordLetters, wi) => (
                <Word
                  key={wi}
                  letters={wordLetters}
                  states={wordStates[wi]}
                  wordStart={wordStarts[wi]}
                  registerRef={registerRef}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      {status !== "done" && (
        <footer className="typing-footer">
          <div className="typing-stats">
            {[
              { v: wpm.toString(), l: "PPM" },
              { v: `${accuracy}%`, l: "Precisão" },
              { v: `${completedVerses}/${verses.length}`, l: "Versículos" },
              { v: formatTime(elapsed), l: "Tempo" },
              { v: errors.toString(), l: "Erros" },
            ].map(({ v, l }) => (
              <div key={l} className="stat-item">
                <span className="stat-value tabular-nums">{v}</span>
                <span className="stat-label">{l}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
