import React, { useState } from "react";
import { creditDataset, type MLDataset } from "../../data/mlDatasets";

interface DataPoint {
  x: number;
  y: number;
  label: number;
}

export function LogisticRegressionDemo() {
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [predictions, setPredictions] = useState<{ x: number; y: number; prob: number }[]>([]);
  const [weights, setWeights] = useState({ w0: 0, w1: 0, w2: 0 });
  const [learningRate, setLearningRate] = useState(0.1);
  const [iterations, setIterations] = useState(100);
  const [showExplanation, setShowExplanation] = useState(true);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const loadDataset = (dataset: MLDataset) => {
    const loadedPoints = dataset.data
      .filter(p => p.label !== undefined)
      .map(p => ({ x: p.x, y: p.y, label: p.label! }));
    setPoints(loadedPoints);
    setPredictions([]);
    setWeights({ w0: 0, w1: 0, w2: 0 });
  };

  const addPoint = (x: number, y: number, label: number) => {
    setPoints([...points, { x, y, label }]);
  };

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  const train = () => {
    if (points.length === 0) return;

    setCurrentStep(1);
    let w0 = weights.w0;
    let w1 = weights.w1;
    let w2 = weights.w2;

    // Simulation de l'entraînement avec feedback visuel
    const trainStep = (iter: number) => {
      if (iter >= iterations) {
        setWeights({ w0, w1, w2 });
        generatePredictions(w0, w1, w2);
        setCurrentStep(null);
        return;
      }

      points.forEach((p) => {
        const z = w0 + w1 * p.x + w2 * p.y;
        const pred = sigmoid(z);
        const error = p.label - pred;
        w0 += learningRate * error;
        w1 += learningRate * error * p.x;
        w2 += learningRate * error * p.y;
      });

      if (iter % 10 === 0) {
        setWeights({ w0, w1, w2 });
        generatePredictions(w0, w1, w2);
      }

      setCurrentStep(iter + 1);
      setTimeout(() => trainStep(iter + 1), 10);
    };

    trainStep(0);
  };

  const generatePredictions = (w0: number, w1: number, w2: number) => {
    const grid: { x: number; y: number; prob: number }[] = [];
    for (let x = 0; x <= 10; x += 0.5) {
      for (let y = 0; y <= 10; y += 0.5) {
        const z = w0 + w1 * x + w2 * y;
        const prob = sigmoid(z);
        grid.push({ x, y, prob });
      }
    }
    setPredictions(grid);
  };

  const calculateAccuracy = () => {
    if (points.length === 0 || predictions.length === 0) return 0;
    let correct = 0;
    points.forEach((p) => {
      const z = weights.w0 + weights.w1 * p.x + weights.w2 * p.y;
      const prob = sigmoid(z);
      const predicted = prob > 0.5 ? 1 : 0;
      if (predicted === p.label) correct++;
    });
    return Math.round((correct / points.length) * 100);
  };

  return (
    <div style={{ padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>Régression logistique</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Classification probabiliste : prédire la probabilité qu'un point appartienne à une classe
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
              <strong>Étape 1 :</strong> La régression logistique utilise la fonction <strong>sigmoid</strong> pour transformer 
              une combinaison linéaire (z = w₀ + w₁x + w₂y) en probabilité entre 0 et 1.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 2 :</strong> Pendant l'entraînement, le modèle ajuste les poids (w₀, w₁, w₂) pour minimiser l'erreur 
              entre les prédictions et les vraies classes.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 3 :</strong> Le taux d'apprentissage contrôle la vitesse d'ajustement. Trop élevé = instable, 
              trop faible = lent.
            </p>
            <p>
              <strong>Résultat :</strong> Le modèle apprend une frontière de décision qui sépare les deux classes avec 
              une probabilité de classification.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => loadDataset(creditDataset)}
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
          📊 Charger dataset : Prédiction de crédit
        </button>
        <button
          onClick={() => {
            setPoints([]);
            setPredictions([]);
            setWeights({ w0: 0, w1: 0, w2: 0 });
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
              const label = e.shiftKey ? 1 : 0;
              addPoint(x, y, label);
            }}
          >
            {/* Grille de probabilités */}
            {predictions.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(p.x / 10) * 100}%`,
                  top: `${(p.y / 10) * 100}%`,
                  width: 4,
                  height: 4,
                  background: `rgba(255, ${255 * (1 - p.prob)}, ${255 * (1 - p.prob)}, 0.6)`,
                  borderRadius: "50%",
                }}
              />
            ))}
            {/* Points de données */}
            {points.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(p.x / 10) * 100}%`,
                  top: `${(p.y / 10) * 100}%`,
                  width: 14,
                  height: 14,
                  background: p.label === 1 ? "#4ade80" : "#f87171",
                  border: "2px solid white",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                }}
                title={`Classe ${p.label} - (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}
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
                  <div style={{ width: 10, height: 10, background: "#f87171", borderRadius: "50%", border: "1px solid white" }} />
                  <span>Classe 0</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, background: "#4ade80", borderRadius: "50%", border: "1px solid white" }} />
                  <span>Classe 1</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
            💡 <strong>Astuce :</strong> Clic gauche = classe 0 (rouge), Maj+Clic = classe 1 (vert). 
            La couleur de fond montre la probabilité prédite (rouge = classe 0 probable, vert = classe 1 probable).
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Taux d'apprentissage</label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{learningRate.toFixed(2)}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Plus élevé = apprentissage rapide mais instable
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Itérations</label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{iterations}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Plus d'itérations = meilleure précision (mais plus lent)
            </div>
          </div>

          <button
            onClick={train}
            disabled={points.length === 0 || currentStep !== null}
            style={{
              width: "100%",
              padding: 14,
              background: currentStep !== null ? "rgba(100,100,100,0.3)" : "rgba(100,200,255,0.3)",
              border: "1px solid rgba(100,200,255,0.5)",
              borderRadius: 8,
              color: "white",
              cursor: points.length === 0 || currentStep !== null ? "not-allowed" : "pointer",
              opacity: points.length === 0 || currentStep !== null ? 0.5 : 1,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            {currentStep !== null ? `Entraînement... ${currentStep}/${iterations}` : "🚀 Entraîner le modèle"}
          </button>

          <div style={{ marginTop: 20, padding: 14, background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, fontWeight: 600 }}>📊 Métriques du modèle</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Précision: <strong style={{ color: "#4ade80" }}>{calculateAccuracy()}%</strong></div>
              <div style={{ marginBottom: 4 }}>Points: {points.length}</div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ marginBottom: 6, fontWeight: 600 }}>Poids du modèle :</div>
              <div style={{ fontFamily: "monospace", fontSize: 10 }}>
                w₀ (biais): {weights.w0.toFixed(3)}
                <br />
                w₁ (x): {weights.w1.toFixed(3)}
                <br />
                w₂ (y): {weights.w2.toFixed(3)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 12, background: "rgba(100,200,255,0.1)", borderRadius: 8, border: "1px solid rgba(100,200,255,0.3)" }}>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              <strong>💡 Cas d'usage réel :</strong> Prédire si un client obtiendra un crédit basé sur son revenu et son score de crédit.
              Le modèle apprend automatiquement la frontière optimale entre "crédit accordé" et "crédit refusé".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
