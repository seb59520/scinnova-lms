import React, { useMemo, useState } from "react";
import { BaseGameProps } from "../lib/gameRegistry";

type Mode = "qcm" | "vrai_faux" | "debug";

type QcmQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

type TfQuestion = {
  id: string;
  prompt: string;
  answer: boolean;
  explanation: string;
};

type DebugQuestion = {
  id: string;
  prompt: string;
  code: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

interface WebSocketQuizGameProps extends BaseGameProps {
  modes?: {
    qcm?: {
      name: string;
      questions: QcmQuestion[];
    };
    vrai_faux?: {
      name: string;
      questions: TfQuestion[];
    };
    debug?: {
      name: string;
      questions: DebugQuestion[];
    };
  };
  scoring?: {
    excellent?: number;
    good?: number;
    messages?: {
      excellent?: string;
      good?: string;
      poor?: string;
    };
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.12)",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Btn({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,.12)",
        background: "#f6f7fb",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.12)", borderRadius: 18, padding: 16, boxShadow: "0 6px 24px rgba(0,0,0,.06)" }}>
      {children}
    </div>
  );
}

export function WebSocketQuizGame({ 
  modes = {},
  scoring = {},
  onScore,
  description,
  instructions 
}: WebSocketQuizGameProps) {
  const [mode, setMode] = useState<Mode>("qcm");

  // Utiliser les questions du JSON ou des valeurs par défaut
  const defaultQcm: QcmQuestion[] = [];
  const defaultTf: TfQuestion[] = [];
  const defaultDebug: DebugQuestion[] = [];

  const qcmQuestions = useMemo(() => {
    const questions = modes.qcm?.questions || defaultQcm;
    return shuffle(questions).slice(0, questions.length);
  }, [modes.qcm?.questions]);

  const tfQuestions = useMemo(() => {
    const questions = modes.vrai_faux?.questions || defaultTf;
    return shuffle(questions).slice(0, questions.length);
  }, [modes.vrai_faux?.questions]);

  const dbgQuestions = useMemo(() => {
    const questions = modes.debug?.questions || defaultDebug;
    return shuffle(questions).slice(0, questions.length);
  }, [modes.debug?.questions]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<null | { ok: boolean; extra?: string }>(null);

  const list = mode === "qcm" ? qcmQuestions : mode === "vrai_faux" ? tfQuestions : dbgQuestions;
  const current = list[idx];

  const total = list.length;

  const excellentThreshold = scoring.excellent ?? 0.8;
  const goodThreshold = scoring.good ?? 0.6;
  const excellentMsg = scoring.messages?.excellent ?? "Excellent : tu maîtrises bien WebSocket.";
  const goodMsg = scoring.messages?.good ?? "Bien : encore quelques points à consolider.";
  const poorMsg = scoring.messages?.poor ?? "À renforcer : refais un tour sur handshake, scalabilité, heartbeat.";

  function reset() {
    setIdx(0);
    setScore(0);
    setAnswered(null);
  }

  function next() {
    setAnswered(null);
    setIdx((i) => i + 1);
  }

  function pickChoice(choiceIndex: number) {
    if (answered || mode !== "qcm") return;
    const q = current as QcmQuestion;
    const ok = choiceIndex === q.answerIndex;
    if (ok) {
      const newScore = score + 1;
      setScore(newScore);
      if (onScore) {
        onScore(newScore, { total, mode: "qcm" });
      }
    }
    setAnswered({ ok, extra: q.explanation });
  }

  function pickTF(value: boolean) {
    if (answered || mode !== "vrai_faux") return;
    const q = current as TfQuestion;
    const ok = value === q.answer;
    if (ok) {
      const newScore = score + 1;
      setScore(newScore);
      if (onScore) {
        onScore(newScore, { total, mode: "vrai_faux" });
      }
    }
    setAnswered({ ok, extra: q.explanation });
  }

  function pickDebug(choiceIndex: number) {
    if (answered || mode !== "debug") return;
    const q = current as DebugQuestion;
    const ok = choiceIndex === q.answerIndex;
    if (ok) {
      const newScore = score + 1;
      setScore(newScore);
      if (onScore) {
        onScore(newScore, { total, mode: "debug" });
      }
    }
    setAnswered({ ok, extra: q.explanation });
  }

  // Reset progress when switching mode
  function switchMode(m: Mode) {
    setMode(m);
    setIdx(0);
    setScore(0);
    setAnswered(null);
  }

  const done = idx >= total || total === 0;

  if (total === 0) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 16, maxWidth: 980, margin: "0 auto" }}>
        <Card>
          <div style={{ color: "#f44336" }}>Aucune question disponible pour ce mode.</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>WebSocket — Auto-test</div>
          <div style={{ opacity: 0.75 }}>Handshakes, temps réel, scalabilité, debug</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {modes.qcm && (
            <ModeButton active={mode === "qcm"} onClick={() => switchMode("qcm")}>
              {modes.qcm.name || "QCM"}
            </ModeButton>
          )}
          {modes.vrai_faux && (
            <ModeButton active={mode === "vrai_faux"} onClick={() => switchMode("vrai_faux")}>
              {modes.vrai_faux.name || "Vrai/Faux"}
            </ModeButton>
          )}
          {modes.debug && (
            <ModeButton active={mode === "debug"} onClick={() => switchMode("debug")}>
              {modes.debug.name || "Debug"}
            </ModeButton>
          )}
        </div>
      </header>

      {description && (
        <div style={{ marginTop: 12, padding: 12, background: "#f6f7fb", borderRadius: 12, fontSize: 14 }}>
          {description}
        </div>
      )}

      {instructions && (
        <div style={{ marginTop: 8, padding: 12, background: "#fff3cd", borderRadius: 12, fontSize: 13, color: "#856404" }}>
          💡 {instructions}
        </div>
      )}

      <div style={{ height: 12 }} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <div style={{ fontWeight: 800 }}>
            {mode === "qcm" ? `Mode ${modes.qcm?.name || "QCM"}` : mode === "vrai_faux" ? `Mode ${modes.vrai_faux?.name || "Vrai/Faux"}` : `Mode ${modes.debug?.name || "Debug"}`}
          </div>
          <div style={{ opacity: 0.8 }}>
            Score: <b>{score}</b> / {total}
          </div>
        </div>

        {done ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Terminé 🎉</div>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              {score >= Math.ceil(total * excellentThreshold) 
                ? excellentMsg 
                : score >= Math.ceil(total * goodThreshold)
                ? goodMsg
                : poorMsg}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn onClick={reset}>Rejouer</Btn>
              {modes.debug && (
                <Btn onClick={() => switchMode("debug")}>Passer en Debug</Btn>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800 }}>Question {idx + 1} / {total}</div>

            {"prompt" in current && (
              <div style={{ marginTop: 10, fontSize: 16 }}>{(current as any).prompt}</div>
            )}

            {mode === "debug" && "code" in current && (
              <pre
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 14,
                  background: "#0b1220",
                  color: "#d7e3ff",
                  overflowX: "auto",
                }}
              >
                {(current as DebugQuestion).code}
              </pre>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {mode === "qcm" &&
                (current as QcmQuestion).choices.map((c, i) => (
                  <Btn key={i} onClick={() => pickChoice(i)} disabled={!!answered}>
                    {c}
                  </Btn>
                ))}

              {mode === "vrai_faux" && (
                <>
                  <Btn onClick={() => pickTF(true)} disabled={!!answered}>Vrai</Btn>
                  <Btn onClick={() => pickTF(false)} disabled={!!answered}>Faux</Btn>
                </>
              )}

              {mode === "debug" &&
                (current as DebugQuestion).choices.map((c, i) => (
                  <Btn key={i} onClick={() => pickDebug(i)} disabled={!!answered}>
                    {c}
                  </Btn>
                ))}
            </div>

            {answered && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: answered.ok ? "#eafaf2" : "#ffecec" }}>
                <div style={{ fontWeight: 900 }}>{answered.ok ? "✅ Correct" : "❌ Incorrect"}</div>
                <div style={{ marginTop: 6, opacity: 0.9 }}>{answered.extra}</div>

                <div style={{ marginTop: 10 }}>
                  <Btn onClick={next}>Suivant</Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
        Astuce : fais jouer en binômes → un répond, l'autre justifie (handshake, proxy, scalabilité).
      </div>
    </div>
  );
}

