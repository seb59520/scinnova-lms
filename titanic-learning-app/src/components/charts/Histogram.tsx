import './Histogram.css';

interface HistogramProps {
  data: number[];
  title: string;
  xLabel?: string;
  yLabel?: string;
  bins?: number;
}

export function Histogram({ data, title, xLabel, yLabel, bins = 10 }: HistogramProps) {
  if (data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  const binCounts = new Array(bins).fill(0);

  data.forEach(value => {
    let binIndex = Math.floor((value - min) / binWidth);
    if (binIndex === bins) binIndex = bins - 1;
    binCounts[binIndex]++;
  });

  const maxCount = Math.max(...binCounts, 1);
  const binData = binCounts.map((count, index) => ({
    label: `${(min + index * binWidth).toFixed(0)}-${(min + (index + 1) * binWidth).toFixed(0)}`,
    value: count,
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        <div className="chart-y-axis">
          {yLabel && <span className="axis-label">{yLabel}</span>}
        </div>
        <div className="chart-main">
          <div className="bars">
            {binData.map((item, index) => (
              <div key={index} className="bar-item">
                <div className="bar-wrapper">
                  <div
                    className="bar"
                    style={{ height: `${(item.value / maxCount) * 100}%` }}
                  >
                    <span className="bar-value">{item.value}</span>
                  </div>
                </div>
                <div className="bar-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {xLabel && <div className="chart-x-axis">
        <span className="axis-label">{xLabel}</span>
      </div>}
    </div>
  );
}
