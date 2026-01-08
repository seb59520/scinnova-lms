import React, { useState } from "react";
import { customerSegmentationDataset, type MLDataset } from "../../data/mlDatasets";

interface Point {
  x: number;
  y: number;
  cluster?: number;
}

export function KMeansDemo() {
  const [points, setPoints] = useState<Point[]>([]);
  const [centroids, setCentroids] = useState<Point[]>([]);
  const [k, setK] = useState(3);
  const [iterations, setIterations] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  const loadDataset = (dataset: MLDataset) => {
    const loadedPoints = dataset.data.map(p => ({ x: p.x, y: p.y }));
    setPoints(loadedPoints);
    setCentroids([]);
    setIterations(0);
  };

  const addPoint = (x: number, y: number) => {
    setPoints([...points, { x, y }]);
  };

  const initializeCentroids = () => {
    if (points.length === 0) return;
    const newCentroids: Point[] = [];
    for (let i = 0; i < k; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      newCentroids.push({ x: randomPoint.x, y: randomPoint.y, cluster: i });
    }
    setCentroids(newCentroids);
    setIterations(0);
  };

  const distance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const assignClusters = () => {
    if (centroids.length === 0) return points;
    return points.map((p) => {
      let minDist = Infinity;
      let cluster = 0;
      centroids.forEach((c, idx) => {
        const dist = distance(p, c);
        if (dist < minDist) {
          minDist = dist;
          cluster = idx;
        }
      });
      return { ...p, cluster };
    });
  };

  const updateCentroids = (assignedPoints: Point[]) => {
    const newCentroids: Point[] = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = assignedPoints.filter((p) => p.cluster === i);
      if (clusterPoints.length > 0) {
        const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
        const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
        newCentroids.push({ x: avgX, y: avgY, cluster: i });
      } else {
        newCentroids.push(centroids[i] || { x: 0, y: 0, cluster: i });
      }
    }
    return newCentroids;
  };

  const calculateInertia = () => {
    if (centroids.length === 0) return 0;
    let total = 0;
    points.forEach((p) => {
      if (p.cluster !== undefined && centroids[p.cluster]) {
        total += Math.pow(distance(p, centroids[p.cluster]), 2);
      }
    });
    return total.toFixed(2);
  };

  const step = () => {
    if (centroids.length === 0) {
      initializeCentroids();
      return;
    }
    
    setIsTraining(true);
    setTimeout(() => {
      const assigned = assignClusters();
      const newCentroids = updateCentroids(assigned);
      const hasConverged = centroids.every((c, i) => 
        newCentroids[i] && 
        Math.abs(c.x - newCentroids[i].x) < 0.01 && 
        Math.abs(c.y - newCentroids[i].y) < 0.01
      );
      
      setPoints(assigned);
      setCentroids(newCentroids);
      setIterations(iterations + 1);
      setIsTraining(false);
      
      if (hasConverged && iterations > 0) {
        // Le modèle a convergé
      }
    }, 100);
  };

  const colors = ["#4ade80", "#60a5fa", "#f87171", "#fbbf24", "#a78bfa", "#fb7185"];

  return (
    <div style={{ padding: 20, background: "rgba(255,255,255,0.05)", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>K-means Clustering</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            Segmentation non supervisée : regrouper des données similaires en clusters
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
              <strong>Étape 1 : Initialisation</strong> - Placez K centroïdes (centres) aléatoirement parmi les points.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 2 : Attribution</strong> - Chaque point est assigné au centroïde le plus proche (distance euclidienne).
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>Étape 3 : Mise à jour</strong> - Les centroïdes sont déplacés au centre (moyenne) de leurs points assignés.
            </p>
            <p>
              <strong>Résultat :</strong> Répétez les étapes 2-3 jusqu'à convergence. Les clusters émergent naturellement des données !
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => loadDataset(customerSegmentationDataset)}
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
          📊 Charger dataset : Segmentation clients
        </button>
        <button
          onClick={() => {
            setPoints([]);
            setCentroids([]);
            setIterations(0);
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
            {/* Points de données */}
            {points.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(p.x / 10) * 100}%`,
                  top: `${(p.y / 10) * 100}%`,
                  width: 10,
                  height: 10,
                  background: p.cluster !== undefined ? colors[p.cluster % colors.length] : "#888",
                  border: "2px solid white",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                }}
                title={`Point (${p.x.toFixed(1)}, ${p.y.toFixed(1)})${p.cluster !== undefined ? ` - Cluster ${p.cluster}` : ''}`}
              />
            ))}
            {/* Centroïdes */}
            {centroids.map((c, i) => (
              <div
                key={`centroid-${i}`}
                style={{
                  position: "absolute",
                  left: `${(c.x / 10) * 100}%`,
                  top: `${(c.y / 10) * 100}%`,
                  width: 20,
                  height: 20,
                  background: colors[i % colors.length],
                  border: "3px solid white",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 12px rgba(255,255,255,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "white",
                }}
                title={`Centroïde ${i} - (${c.x.toFixed(2)}, ${c.y.toFixed(2)})`}
              >
                {i}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
            💡 <strong>Astuce :</strong> Cliquez pour ajouter des points. Les centroïdes (cercles numérotés) représentent le centre de chaque cluster.
            Les points de la même couleur appartiennent au même cluster.
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Nombre de clusters (K)</label>
            <input
              type="range"
              min="2"
              max="6"
              value={k}
              onChange={(e) => {
                setK(parseInt(e.target.value));
                setCentroids([]);
                setIterations(0);
              }}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{k}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              Choisissez le nombre de groupes à identifier dans vos données
            </div>
          </div>

          <button
            onClick={initializeCentroids}
            disabled={points.length === 0}
            style={{
              width: "100%",
              padding: 12,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
              cursor: points.length === 0 ? "not-allowed" : "pointer",
              opacity: points.length === 0 ? 0.5 : 1,
              marginBottom: 8,
            }}
          >
            🎯 Initialiser centroïdes
          </button>

          <button
            onClick={step}
            disabled={points.length === 0 || centroids.length === 0 || isTraining}
            style={{
              width: "100%",
              padding: 14,
              background: isTraining ? "rgba(100,100,100,0.3)" : "rgba(100,200,255,0.3)",
              border: "1px solid rgba(100,200,255,0.5)",
              borderRadius: 8,
              color: "white",
              cursor: points.length === 0 || centroids.length === 0 || isTraining ? "not-allowed" : "pointer",
              opacity: points.length === 0 || centroids.length === 0 || isTraining ? 0.5 : 1,
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {isTraining ? "⏳ Traitement..." : `🔄 Itérer (${iterations})`}
          </button>

          <div style={{ marginTop: 20, padding: 14, background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, fontWeight: 600 }}>📊 Métriques</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Points: {points.length}</div>
              <div style={{ marginBottom: 4 }}>Centroïdes: {centroids.length}</div>
              <div style={{ marginBottom: 4 }}>Itérations: {iterations}</div>
              {centroids.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ marginBottom: 4 }}>Inertie: {calculateInertia()}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                    (Plus bas = meilleur regroupement)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 12, background: "rgba(100,200,255,0.1)", borderRadius: 8, border: "1px solid rgba(100,200,255,0.3)" }}>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              <strong>💡 Cas d'usage réel :</strong> Segmenter vos clients e-commerce en groupes (occasionnels, réguliers, VIP) 
              basé sur leur fréquence d'achat et montant moyen. Chaque cluster peut recevoir des offres personnalisées !
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
