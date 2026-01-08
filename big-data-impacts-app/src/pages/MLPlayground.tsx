import React, { useState } from "react";
import { LogisticRegressionDemo } from "../components/ml/LogisticRegressionDemo";
import { KMeansDemo } from "../components/ml/KMeansDemo";
import { AnomalyDemo } from "../components/ml/AnomalyDemo";

type Tab = "logreg" | "kmeans" | "anomaly";

export default function MLPlayground() {
  const [tab, setTab] = useState<Tab>("logreg");

  return (
    <div style={layout()}>
      <header style={header()}>
        <div style={{ fontWeight: 900, letterSpacing: 0.4 }}>ML Playground</div>
        <nav style={{ display: "flex", gap: 8 }}>
          <button style={tabBtn(tab === "logreg")} onClick={() => setTab("logreg")}>Régression logistique</button>
          <button style={tabBtn(tab === "kmeans")} onClick={() => setTab("kmeans")}>K-means</button>
          <button style={tabBtn(tab === "anomaly")} onClick={() => setTab("anomaly")}>Anomalies</button>
        </nav>
      </header>

      <main style={{ display: "grid", gap: 14 }}>
        {tab === "logreg" && <LogisticRegressionDemo />}
        {tab === "kmeans" && <KMeansDemo />}
        {tab === "anomaly" && <AnomalyDemo />}
      </main>

      <footer style={{ opacity: 0.65, fontSize: 12 }}>
        Objectif : tester "probabiliste", "segmentation", "alerting" — sans jargon, avec impact décisionnel.
      </footer>
    </div>
  );
}

function layout(): React.CSSProperties {
  return {
    minHeight: "100vh",
    padding: 18,
    background: "radial-gradient(1200px 600px at 20% 0%, rgba(255,200,110,0.12), transparent 60%), #0b0e14",
    color: "white",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  };
}
function header(): React.CSSProperties {
  return {
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(10,12,18,0.72)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  };
}
function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
  };
}

