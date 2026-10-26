import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const RiskDistributionChart = ({
  lowCount = 0,
  mediumCount = 0,
  highCount = 0,
  coverage = 100,
  loading = false,
}) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const total = lowCount + mediumCount + highCount;

  // Compute percentages that sum nicely to 100%
  const lowPct = total > 0 ? Math.round((lowCount / total) * 100) : 50;
  const medPct = total > 0 ? Math.round((mediumCount / total) * 100) : 35;
  const highPct = total > 0 ? Math.max(0, 100 - lowPct - medPct) : 15;

  useEffect(() => {
    if (loading || !canvasRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartData = total > 0 ? [lowCount, mediumCount, highCount] : [50, 35, 15];

    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [
          {
            data: chartData,
            backgroundColor: ["#0d6efd", "#a52a2a", "#dc3545"],
            hoverBackgroundColor: ["#0b5ed7", "#8b2020", "#bb2d3b"],
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            titleFont: { size: 12, weight: "bold" },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const val = context.parsed || 0;
                const pct = total > 0 ? Math.round((val / total) * 100) : val;
                return total > 0
                  ? ` ${label}: ${val} devices (${pct}%)`
                  : ` ${label}: ${pct}%`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [lowCount, mediumCount, highCount, total, loading]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
        <span className="text-secondary small">Evaluating risk data...</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100 justify-content-between">
      {/* Donut Chart Container with Center Overlay */}
      <div className="d-flex flex-column align-items-center justify-content-center py-2">
        <div
          className="position-relative"
          style={{ width: "165px", height: "165px" }}
        >
          <canvas ref={canvasRef}></canvas>
          <div
            className="position-absolute top-50 start-50 translate-middle text-center"
            style={{ pointerEvents: "none" }}
          >
            <h4 className="fw-bold mb-0 text-dark">{coverage}%</h4>
            <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
              Coverage
            </small>
          </div>
        </div>
      </div>

      {/* Dynamic Legend Matching Screenshot */}
      <div className="mt-3">
        <div className="d-flex justify-content-between align-items-center small mb-2">
          <span className="text-secondary d-flex align-items-center">
            <i
              className="bi bi-circle-fill me-2"
              style={{ color: "#0d6efd", fontSize: "0.55rem" }}
            ></i>
            Low Risk
          </span>
          <span className="fw-bold text-dark">{lowPct}%</span>
        </div>
        <div className="d-flex justify-content-between align-items-center small mb-2">
          <span className="text-secondary d-flex align-items-center">
            <i
              className="bi bi-circle-fill me-2"
              style={{ color: "#a52a2a", fontSize: "0.55rem" }}
            ></i>
            Medium Risk
          </span>
          <span className="fw-bold text-dark">{medPct}%</span>
        </div>
        <div className="d-flex justify-content-between align-items-center small mb-1">
          <span className="text-secondary d-flex align-items-center">
            <i
              className="bi bi-circle-fill me-2"
              style={{ color: "#dc3545", fontSize: "0.55rem" }}
            ></i>
            High Risk
          </span>
          <span className="fw-bold text-dark">{highPct}%</span>
        </div>
      </div>
    </div>
  );
};

export default RiskDistributionChart;
