import React, { useMemo, useState, useEffect } from "react";
import { BaseGameProps } from '../lib/gameRegistry';

/**
 * Mini-jeu React — Comparer les paradigmes d'API
 * - Quiz (QCM)
 * - Drag & Drop (match cas d'usage -> paradigme)
 * - Classement (ordre performance)
 *
 * ✅ Sans dépendances externes
 * ✅ Responsive
 */

type ParadigmKey = "REST" | "GraphQL" | "SOAP" | "gRPC" | "WebSocket" | "Event-Driven";

type Paradigm = {
  key: ParadigmKey;
  label: string;
  latency: "faible" | "moyenne" | "élevée" | "asynchrone";
  bandwidth: "optimisée" | "moyenne" | "lourde" | "continue" | "massive";
  scalability: "excellente" | "bonne" | "moyenne";
  complexity: "faible" | "moyenne" | "élevée";
  bestFor: string[];
};

type UseCase = {
  id: string;
  label: string;
  answer: ParadigmKey;
  hint?: string;
};

type RankingKind = "latence" | "reseau" | "scalabilite";

interface ApiParadigmsGameProps extends BaseGameProps {
  paradigms?: Paradigm[];
  useCases?: UseCase[];
  rankings?: Record<RankingKind, { title: string; instruction: string; correctOrder: ParadigmKey[] }>;
}

// Valeurs par défaut (utilisées si non fournies dans les props)
const DEFAULT_PARADIGMS: Paradigm[] = [
  {
    key: "REST",
    label: "REST",
    latency: "moyenne",
    bandwidth: "moyenne",
    scalability: "bonne",
    complexity: "faible",
    bestFor: ["CRUD simple", "API web classiques", "back-office"],
  },
  {
    key: "GraphQL",
    label: "GraphQL",
    latency: "faible",
    bandwidth: "optimisée",
    scalability: "moyenne",
    complexity: "élevée",
    bestFor: ["Frontend riche", "Mobile", "données ciblées"],
  },
  {
    key: "SOAP",
    label: "SOAP",
    latency: "élevée",
    bandwidth: "lourde",
    scalability: "moyenne",
    complexity: "élevée",
    bestFor: ["Legacy", "Banque/assurance", "contrats stricts"],
  },
  {
    key: "gRPC",
    label: "gRPC",
    latency: "faible",
    bandwidth: "optimisée",
    scalability: "excellente",
    complexity: "élevée",
    bestFor: ["Microservices", "inter-services", "binaire performant"],
  },
  {
    key: "WebSocket",
    label: "WebSocket",
    latency: "faible",
    bandwidth: "continue",
    scalability: "moyenne",
    complexity: "moyenne",
    bestFor: ["Temps réel", "chat", "jeux", "IoT"],
  },
  {
    key: "Event-Driven",
    label: "Event-Driven (Kafka/MQ)",
    latency: "asynchrone",
    bandwidth: "massive",
    scalability: "excellente",
    complexity: "élevée",
    bestFor: ["Big Data", "streaming", "SI distribué"],
  },
];

const DEFAULT_USE_CASES: UseCase[] = [
  { id: "uc1", label: "Créer / modifier / supprimer des ressources (CRUD) dans une API web", answer: "REST", hint: "Simple, standard, HTTP, ressources" },
  { id: "uc2", label: "App mobile qui doit éviter de sur-récupérer des données (overfetching)", answer: "GraphQL", hint: "Le client choisit les champs" },
  { id: "uc3", label: "Système bancaire legacy avec contrats stricts et XML", answer: "SOAP", hint: "WSDL, XML, historique enterprise" },
  { id: "uc4", label: "Microservices internes très performants (latence basse, binaire)", answer: "gRPC", hint: "Protobuf + streaming" },
  { id: "uc5", label: "Chat temps réel / notifications live", answer: "WebSocket", hint: "Connexion persistante" },
  { id: "uc6", label: "Pipeline SI distribué, événements, streaming de données à grande échelle", answer: "Event-Driven", hint: "Asynchrone + brokers" },
];

const DEFAULT_RANKINGS: Record<RankingKind, { title: string; instruction: string; correctOrder: ParadigmKey[] }> = {
  latence: {
    title: "Classement ⚡ Latence",
    instruction: "Mets les paradigmes du plus rapide au plus lent (≈ support de cours).",
    correctOrder: ["gRPC", "WebSocket", "GraphQL", "REST", "SOAP"],
  },
  reseau: {
    title: "Classement 📦 Consommation réseau",
    instruction: "Du plus optimisé (le plus \"léger\") au plus verbeux/lourd.",
    correctOrder: ["gRPC", "GraphQL", "REST", "SOAP"],
  },
  scalabilite: {
    title: "Classement 📈 Scalabilité",
    instruction: "Du plus scalable au moins scalable (≈ support de cours).",
    correctOrder: ["Event-Driven", "gRPC", "REST", "GraphQL", "SOAP"],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pillColor(key: ParadigmKey) {
  const map: Record<ParadigmKey, string> = {
    REST: "#e8f0ff",
    GraphQL: "#eafaf2",
    SOAP: "#ffecec",
    gRPC: "#eef3ff",
    WebSocket: "#f3f0ff",
    "Event-Driven": "#fff7e6",
  };
  return map[key];
}

function scoreLabel(score: number, max: number) {
  const pct = max === 0 ? 0 : Math.round((score / max) * 100);
  if (pct >= 90) return `Excellent (${pct}%)`;
  if (pct >= 70) return `Bien (${pct}%)`;
  if (pct >= 50) return `Correct (${pct}%)`;
  return `À renforcer (${pct}%)`;
}

type Tab = "quiz" | "dragdrop" | "ranking" | "support";

export function ApiParadigmsGame({ 
  paradigms = DEFAULT_PARADIGMS, 
  useCases = DEFAULT_USE_CASES, 
  rankings = DEFAULT_RANKINGS,
  onScore,
  description,
  instructions 
}: ApiParadigmsGameProps) {
  const [tab, setTab] = useState<Tab>("quiz");

  // ---------- QUIZ ----------
  const quizQuestions = useMemo(() => shuffle(useCases).slice(0, 6), [useCases]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<null | { ok: boolean; pick: ParadigmKey }>(null);

  const currentQuiz = quizQuestions[quizIndex];

  // ---------- DRAG & DROP ----------
  const [ddCases, setDdCases] = useState(() => shuffle(useCases));
  const [ddAssignments, setDdAssignments] = useState<Record<string, ParadigmKey | null>>(() =>
    Object.fromEntries(useCases.map((u) => [u.id, null]))
  );
  const [ddDragged, setDdDragged] = useState<ParadigmKey | null>(null);
  const [ddChecked, setDdChecked] = useState(false);

  // ---------- RANKING ----------
  const [rankingKind, setRankingKind] = useState<RankingKind>("latence");
  const [rankList, setRankList] = useState<ParadigmKey[]>(() => shuffle(rankings.latence.correctOrder));
  const [rankChecked, setRankChecked] = useState(false);

  useEffect(() => {
    setRankList(shuffle(rankings[rankingKind].correctOrder));
    setRankChecked(false);
  }, [rankingKind, rankings]);

  // ---------- UI helpers ----------
  const paradigmOptions = useMemo(() => paradigms.map((p) => p.key), [paradigms]);
  const paradigmLabel = (k: ParadigmKey) => paradigms.find((p) => p.key === k)?.label ?? k;

  // ---------- Actions ----------
  function resetQuiz() {
    window.location.reload();
  }

  function answerQuiz(pick: ParadigmKey) {
    if (!currentQuiz || quizAnswered) return;
    const ok = pick === currentQuiz.answer;
    setQuizAnswered({ ok, pick });
    if (ok) {
      const newScore = quizScore + 1;
      setQuizScore(newScore);
      onScore?.(newScore, { mode: 'quiz', total: quizQuestions.length });
    }
  }

  function nextQuiz() {
    setQuizAnswered(null);
    const nextIndex = Math.min(quizIndex + 1, quizQuestions.length);
    setQuizIndex(nextIndex);
    
    // Si terminé, envoyer le score final
    if (nextIndex >= quizQuestions.length) {
      onScore?.(quizScore, { mode: 'quiz', total: quizQuestions.length, completed: true });
    }
  }

  function ddDropOnCase(caseId: string) {
    if (!ddDragged) return;
    setDdAssignments((prev) => ({ ...prev, [caseId]: ddDragged }));
    setDdDragged(null);
  }

  function ddClearCase(caseId: string) {
    setDdAssignments((prev) => ({ ...prev, [caseId]: null }));
  }

  function ddCheck() {
    setDdChecked(true);
    const score = useCases.filter(u => ddAssignments[u.id] === u.answer).length;
    onScore?.(score, { mode: 'dragdrop', total: useCases.length });
  }

  function ddReset() {
    setDdCases(shuffle(useCases));
    setDdAssignments(Object.fromEntries(useCases.map((u) => [u.id, null])));
    setDdChecked(false);
    setDdDragged(null);
  }

  function rankMove(index: number, dir: -1 | 1) {
    setRankList((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function rankCheck() {
    setRankChecked(true);
    const correct = rankings[rankingKind].correctOrder;
    const score = rankList.filter((k, idx) => k === correct[idx]).length;
    onScore?.(score, { mode: 'ranking', kind: rankingKind, total: correct.length });
  }

  function rankReset() {
    setRankList(shuffle(rankings[rankingKind].correctOrder));
    setRankChecked(false);
  }

  // ---------- Scores ----------
  const ddScore = useMemo(() => {
    const total = useCases.length;
    let ok = 0;
    for (const u of useCases) {
      if (ddAssignments[u.id] === u.answer) ok++;
    }
    return { ok, total };
  }, [ddAssignments, useCases]);

  const rankScore = useMemo(() => {
    const correct = rankings[rankingKind].correctOrder;
    const total = correct.length;
    let ok = 0;
    for (let i = 0; i < total; i++) if (rankList[i] === correct[i]) ok++;
    return { ok, total };
  }, [rankList, rankingKind, rankings]);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {(description || instructions) && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f6f7fb", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }}>
          {description && <p style={{ margin: 0, marginBottom: instructions ? 8 : 0, fontWeight: 600 }}>{description}</p>}
          {instructions && <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>{instructions}</p>}
        </div>
      )}
      
      <header style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Mini-jeu — Paradigmes d'API</div>
          <div style={{ opacity: 0.75 }}>Comparer performances & usages (niveau intermédiaire)</div>
        </div>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")}>Quiz</TabBtn>
          <TabBtn active={tab === "dragdrop"} onClick={() => setTab("dragdrop")}>Drag & Drop</TabBtn>
          <TabBtn active={tab === "ranking"} onClick={() => setTab("ranking")}>Classement</TabBtn>
          <TabBtn active={tab === "support"} onClick={() => setTab("support")}>Support</TabBtn>
        </nav>
      </header>

      <div style={{ height: 12 }} />

      {tab === "quiz" && (
        <Card>
          <h2 style={{ margin: 0 }}>Mode Quiz</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Choisis le paradigme le plus adapté au contexte. (Score: <b>{quizScore}</b> / {quizQuestions.length})
          </p>

          {quizIndex >= quizQuestions.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Terminé 🎉</div>
              <div style={{ marginTop: 6 }}>{scoreLabel(quizScore, quizQuestions.length)}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn onClick={resetQuiz}>Rejouer</Btn>
                <Btn variant="ghost" onClick={() => setTab("dragdrop")}>Passer au Drag & Drop</Btn>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700 }}>Question {quizIndex + 1} / {quizQuestions.length}</div>
              <div style={{ marginTop: 10, fontSize: 16 }}>{currentQuiz.label}</div>

              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                {paradigmOptions.map((k) => (
                  <Btn
                    key={k}
                    onClick={() => answerQuiz(k)}
                    disabled={!!quizAnswered}
                    style={{ background: pillColor(k) }}
                  >
                    {paradigmLabel(k)}
                  </Btn>
                ))}
              </div>

              {quizAnswered && (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: quizAnswered.ok ? "#eafaf2" : "#ffecec" }}>
                  {quizAnswered.ok ? (
                    <div><b>✅ Correct.</b> {paradigmLabel(currentQuiz.answer)} est le meilleur choix ici.</div>
                  ) : (
                    <div>
                      <b>❌ Pas tout à fait.</b> Tu as choisi {paradigmLabel(quizAnswered.pick)}.
                      <div style={{ marginTop: 6 }}>
                        Réponse : <b>{paradigmLabel(currentQuiz.answer)}</b>
                        {currentQuiz.hint ? <span style={{ opacity: 0.85 }}> — {currentQuiz.hint}</span> : null}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <Btn onClick={nextQuiz}>Suivant</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {tab === "dragdrop" && (
        <Card>
          <h2 style={{ margin: 0 }}>Mode Drag & Drop</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Fais glisser un paradigme sur un cas d'usage.
            {ddChecked && (
              <span>
                {" "}Score: <b>{ddScore.ok}</b> / {ddScore.total} ({scoreLabel(ddScore.ok, ddScore.total)})
              </span>
            )}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Paradigmes (à glisser)</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {paradigmOptions.map((k) => (
                  <div
                    key={k}
                    draggable
                    onDragStart={() => setDdDragged(k)}
                    onDragEnd={() => setDdDragged(null)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 999,
                      background: pillColor(k),
                      border: ddDragged === k ? "2px solid #111" : "1px solid rgba(0,0,0,.12)",
                      cursor: "grab",
                      userSelect: "none",
                      fontWeight: 700,
                    }}
                    title="Glisser-déposer"
                  >
                    {paradigmLabel(k)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Cas d'usage (zones de dépôt)</div>
              <div style={{ display: "grid", gap: 10 }}>
                {ddCases.map((u) => {
                  const assigned = ddAssignments[u.id];
                  const ok = assigned === u.answer;
                  const show = ddChecked && assigned != null;
                  return (
                    <div
                      key={u.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => ddDropOnCase(u.id)}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,.12)",
                        background: "#fff",
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.label}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ opacity: 0.7 }}>Réponse posée :</span>
                          {assigned ? (
                            <span style={{ padding: "6px 10px", borderRadius: 999, background: pillColor(assigned), fontWeight: 700 }}>
                              {paradigmLabel(assigned)}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.6 }}>— aucune —</span>
                          )}
                          {show && (
                            <span style={{ fontWeight: 800, color: ok ? "#0b6b3a" : "#9b1c1c" }}>
                              {ok ? "✅" : "❌"}
                            </span>
                          )}
                          {ddChecked && !ok && (
                            <span style={{ opacity: 0.8 }}>
                              → attendu : <b>{paradigmLabel(u.answer)}</b>
                              {u.hint ? <span style={{ opacity: 0.85 }}> ({u.hint})</span> : null}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="ghost" onClick={() => ddClearCase(u.id)} disabled={!assigned}>Effacer</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn onClick={ddCheck}>Corriger</Btn>
                <Btn variant="ghost" onClick={ddReset}>Réinitialiser</Btn>
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "ranking" && (
        <Card>
          <h2 style={{ margin: 0 }}>Mode Classement</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            {rankings[rankingKind].instruction}
            {rankChecked && (
              <span>
                {" "}Score: <b>{rankScore.ok}</b> / {rankScore.total} ({scoreLabel(rankScore.ok, rankScore.total)})
              </span>
            )}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <Btn variant={rankingKind === "latence" ? "solid" : "ghost"} onClick={() => setRankingKind("latence")}>
              ⚡ Latence
            </Btn>
            <Btn variant={rankingKind === "reseau" ? "solid" : "ghost"} onClick={() => setRankingKind("reseau")}>
              📦 Réseau
            </Btn>
            <Btn variant={rankingKind === "scalabilite" ? "solid" : "ghost"} onClick={() => setRankingKind("scalabilite")}>
              📈 Scalabilité
            </Btn>
          </div>

          <div style={{ marginTop: 12, fontWeight: 800 }}>{rankings[rankingKind].title}</div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {rankList.map((k, idx) => {
              const correct = rankings[rankingKind].correctOrder[idx];
              const ok = k === correct;
              return (
                <div
                  key={`${k}-${idx}`}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,.12)",
                    background: "#fff",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: 34, textAlign: "center", fontWeight: 800, opacity: 0.7 }}>{idx + 1}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: pillColor(k), fontWeight: 800 }}>
                      {paradigmLabel(k)}
                    </span>
                    {rankChecked && (
                      <span style={{ fontWeight: 900, color: ok ? "#0b6b3a" : "#9b1c1c" }}>
                        {ok ? "✅" : "❌"}
                      </span>
                    )}
                    {rankChecked && !ok && (
                      <span style={{ opacity: 0.8 }}>
                        attendu : <b>{paradigmLabel(correct)}</b>
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" onClick={() => rankMove(idx, -1)} disabled={idx === 0}>↑</Btn>
                    <Btn variant="ghost" onClick={() => rankMove(idx, 1)} disabled={idx === rankList.length - 1}>↓</Btn>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn onClick={rankCheck}>Corriger</Btn>
            <Btn variant="ghost" onClick={rankReset}>Mélanger</Btn>
          </div>
        </Card>
      )}

      {tab === "support" && (
        <Card>
          <h2 style={{ margin: 0 }}>Support (révision rapide)</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Message clé : <b>pas "la meilleure API"</b>, mais <b>le bon compromis</b> selon le contexte.
          </p>

          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {["Paradigme", "Latence", "Bande passante", "Scalabilité", "Complexité", "Cas d'usage"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paradigms.map((p) => (
                  <tr key={p.key}>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                      <span style={{ padding: "6px 10px", borderRadius: 999, background: pillColor(p.key), fontWeight: 800 }}>
                        {p.label}
                      </span>
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{p.latency}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{p.bandwidth}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{p.scalability}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{p.complexity}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", opacity: 0.9 }}>
                      {p.bestFor.join(" • ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "#f6f7fb", border: "1px solid rgba(0,0,0,.08)" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Raccourcis à mémoriser</div>
            <div style={{ display: "grid", gap: 6 }}>
              <div><b>CRUD</b> → REST</div>
              <div><b>Mobile / Front riche</b> → GraphQL</div>
              <div><b>Microservices perf</b> → gRPC</div>
              <div><b>Temps réel</b> → WebSocket</div>
              <div><b>Legacy critique</b> → SOAP</div>
              <div><b>Streaming / SI massif</b> → Event-Driven</div>
            </div>
          </div>
        </Card>
      )}

      <footer style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
        Astuce formateur : lance d'abord "Support", puis "Quiz", et termine par "Drag & Drop" en groupe.
      </footer>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.12)",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
        fontWeight: 800,
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

function Btn({
  children,
  onClick,
  disabled,
  variant = "solid",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: variant === "ghost" ? "1px solid rgba(0,0,0,.12)" : "1px solid rgba(0,0,0,.12)",
    background: variant === "ghost" ? "#fff" : "#f6f7fb",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 800,
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...style }}>
      {children}
    </button>
  );
}

