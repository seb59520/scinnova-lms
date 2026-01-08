import React, { useState, useEffect } from "react";
import { transactionDataset, type MLDataset } from "../../data/mlDatasets";

interface DataPoint {
  x: number;
  y: number;
  timestamp: number;
  isAnomaly?: boolean;
  score?: number;
}

export function AnomalyDemo() {
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [threshold, setThreshold] = useState(2.5);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [stats, setStats] = useState({ meanX: 0, meanY: 0, stdX: 0, stdY: 0 });

  const loadDataset = (dataset: MLDataset) => {
    const loadedPoints = dataset.data.map(p => ({
      x: p.x,
      y: p.y,
      timestamp: Date.now() + Math.random() * 1000,
      isAnomaly: p.metadata?.isAnomaly || false,
    }));
    setPoints(loadedPoints);
    if (autoDetect) {
      setTimeout(detectAnomalies, 100);
    }
  };

  useEffect(() => {
    // Générer des données simulées au chargement
    const generateData = () => {
      const newPoints: DataPoint[] = [];
      for (let i = 0; i < 50; i++) {
        const x = 5 + (Math.random() - 0.5) * 2;
        const y = 5 + (Math.random() - 0.5) * 2;
        newPoints.push({ x, y, timestamp: Date.now() + i * 1000 });
      }
      // Ajouter quelques anomalies
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 10;
        const y = Math.random() * 10;
        newPoints.push({ x, y, timestamp: Date.now() + (50 + i) * 1000 });
      }
      setPoints(newPoints);
      if (autoDetect) {
        setTimeout(detectAnomalies, 100);
      }
    };

    if (points.length === 0) {
      generateData();
    }
  }, []);

  const calculateZScore = (value: number, mean: number, std: number) => {
    if (std === 0) return 0;
    return Math.abs((value - mean) / std);
  };

  const detectAnomalies = () => {
    if (points.length === 0) return;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);

    const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;

    const stdX = Math.sqrt(xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0) / xs.length);
    const stdY = Math.sqrt(ys.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0) / ys.length);

    setStats({ meanX, meanY, stdX, stdY });

    const updated = points.map((p) => {
      const zX = calculateZScore(p.x, meanX, stdX);
      const zY = calculateZScore(p.y, meanY, stdY);
      const score = Math.max(zX, zY);
      const isAnomaly = score > threshold;
      return { ...p, isAnomaly, score };
    });

    setPoints(updated);
  };

  useEffect(() => {
    if (autoDetect && points.length > 0) {
      detectAnomalies();
    }
  }, [threshold, autoDetect]);

  const addPoint = (x: number, y: number) => {
    const newPoint: DataPoint = { x, y, timestamp: Date.now() };
    setPoints([...points, newPoint]);
    if (autoDetect) {
      setTimeout(detectAnomalies, 100);
    }
  };

  const normalPoints = points.filter((p) => !p.isAnomaly);
  const anomalyPoints = points.filter((p) => p.isAnomaly);

  return (
    <div style={{ padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>Détection d'anomalies</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Identification automatique : trouver les valeurs aberrantes dans vos données
          </p>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {showExplanation ? "Masquer explication" : "Afficher explication"}
        </button>
      </div>

      {showExplanation && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          background: "rgba(0,0,0,0.3)", 
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>📚 Comment ça marche ?</h3>
          <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 1 : Calcul des statistiques</strong> - Calculez la moyenne (μ) et l'écart-type (σ) pour chaque dimension.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 2 : Z-score</strong> - Pour chaque point, calculez z = |valeur - μ| / σ. 
              Le Z-score mesure combien d'écarts-types le point est éloigné de la moyenne.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 3 : Seuil de détection</strong> - Si le Z-score dépasse le seuil (ex: 2.5), 
              le point est considéré comme anormal.
            </p>
            <p>
              <strong>Résultat :</strong> Les anomalies sont les points qui s'écartent significativement 
              du comportement normal de vos données.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => loadDataset(transactionDataset)}
          style={{
            padding: "10px 16px",
            background: "rgba(100,200,255,0.2)",
            border: "1px solid rgba(100,200,255,0.4)",
            borderRadius: 8,
            color: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          📊 Charger dataset : Transactions bancaires
        </button>
        <button
          onClick={() => {
            setPoints([]);
          }}
          style={{
            padding: "10px 16px",
            background: "rgba(255,100,100,0.2)",
            border: "1px solid rgba(255,100,100,0.4)",
            borderRadius: 8,
            color: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Effacer tout
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 450,
              background: "#1a1d26",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              cursor: "crosshair",
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 10;
              const y = ((e.clientY - rect.top) / rect.height) * 10;
              addPoint(x, y);
            }}
          >
            {/* Zone normale (ellipse approximative) */}
            {points.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `${(stats.meanX / 10) * 100 - 15}%`,
                  top: `${(stats.meanY / 10) * 100 - 15}%`,
                  width: "30%",
                  height: "30%",
                  border: "2px dashed rgba(100,200,255,0.3)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
                title="Zone normale (moyenne ± seuil)"
              />
            )}
            
            {/* Points normaux */}
            {normalPoints.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(p.x / 10) * 100}%`,
                  top: `${(p.y / 10) * 100}%`,
                  width: 10,
                  height: 10,
                  background: "#60a5fa",
                  border: "2px solid #93c5fd",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                title={`Normal - Score: ${p.score?.toFixed(2) || 'N/A'}`}
              />
            ))}
            
            {/* Anomalies */}
            {anomalyPoints.map((p, i) => (
              <div
                key={`anomaly-${i}`}
                style={{
                  position: "absolute",
                  left: `${(p.x / 10) * 100}%`,
                  top: `${(p.y / 10) * 100}%`,
                  width: 16,
                  height: 16,
                  background: "#ef4444",
                  border: "3px solid #fca5a5",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 12px rgba(239,68,68,0.8)",
                  animation: "pulse 2s infinite",
                }}
                title={`⚠️ ANOMALIE - Score: ${p.score?.toFixed(2) || 'N/A'} (seuil: ${threshold.toFixed(1)})`}
              />
            ))}
            
            {/* Légende */}
            <div style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              padding: "8px 12px",
              background: "rgba(0,0,0,0.7)",
              borderRadius: 8,
              fontSize: 11,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, background: "#60a5fa", borderRadius: "50%", border: "1px solid white" }} />
                  <span>Normal</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 12, height: 12, background: "#ef4444", borderRadius: "50%", border: "2px solid white" }} />
                  <span>Anomalie</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
            💡 <strong>Astuce :</strong> Cliquez pour ajouter un point. Les anomalies (rouge) sont détectées automatiquement 
            si elles s'écartent significativement de la moyenne. Ajustez le seuil pour être plus ou moins strict.
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Seuil Z-score</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{threshold.toFixed(1)}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              {threshold < 2 ? "Très strict (beaucoup d'anomalies)" : 
               threshold > 3 ? "Permissif (peu d'anomalies)" : 
               "Équilibré"}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Détection automatique</span>
            </label>
          </div>

          <button
            onClick={detectAnomalies}
            style={{
              width: "100%",
              padding: 14,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            🔍 Détecter anomalies
          </button>

          <div style={{ marginTop: 20, padding: 14, background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, fontWeight: 600 }}>📊 Statistiques</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Total: {points.length}</div>
              <div style={{ marginBottom: 4, color: "#60a5fa" }}>
                Normal: {normalPoints.length} ({points.length > 0 ? Math.round((normalPoints.length / points.length) * 100) : 0}%)
              </div>
              <div style={{ marginBottom: 4, color: "#ef4444" }}>
                Anomalies: {anomalyPoints.length} ({points.length > 0 ? Math.round((anomalyPoints.length / points.length) * 100) : 0}%)
              </div>
            </div>
            {points.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }}>
                <div style={{ marginBottom: 4, opacity: 0.8 }}>Moyenne X: {stats.meanX.toFixed(2)}</div>
                <div style={{ marginBottom: 4, opacity: 0.8 }}>Moyenne Y: {stats.meanY.toFixed(2)}</div>
                <div style={{ marginBottom: 4, opacity: 0.8 }}>Écart-type X: {stats.stdX.toFixed(2)}</div>
                <div style={{ opacity: 0.8 }}>Écart-type Y: {stats.stdY.toFixed(2)}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, padding: 12, background: "rgba(100,200,255,0.1)", borderRadius: 8, border: "1px solid rgba(100,200,255,0.3)" }}>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              <strong>💡 Cas d'usage réel :</strong> Détecter des transactions frauduleuses dans un système bancaire. 
              Les transactions normales forment un cluster, tandis que les montants ou heures suspects sont identifiés comme anomalies.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
