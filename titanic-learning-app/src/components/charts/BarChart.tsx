import './BarChart.css';

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  xLabel?: string;
  yLabel?: string;
}

export function BarChart({ data, title, xLabel, yLabel }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        <div className="chart-y-axis">
          {yLabel && <span className="axis-label">{yLabel}</span>}
        </div>
        <div className="chart-main">
          <div className="bars">
            {data.map((item, index) => (
              <div key={index} className="bar-item">
                <div className="bar-wrapper">
                  <div
                    className="bar"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  >
                    <span className="bar-value">{item.value.toFixed(1)}%</span>
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
