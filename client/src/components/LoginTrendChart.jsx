import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const LoginTrendChart = ({ data = [], loading = false, timeframe = 7 }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (loading || !canvasRef.current || !data || data.length === 0) {
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

    const labels = data.map((d) => {
      // Format date for display: e.g. "Oct 24"
      try {
        const parts = d.date.split("-");
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        return d.date;
      } catch {
        return d.date;
      }
    });

    const successData = data.map((d) => d.successful || 0);
    const failedData = data.map((d) => d.failed || 0);

    // Create subtle gradient fills
    const successGradient = ctx.createLinearGradient(0, 0, 0, 220);
    successGradient.addColorStop(0, "rgba(13, 110, 253, 0.22)");
    successGradient.addColorStop(1, "rgba(13, 110, 253, 0.01)");

    const failedGradient = ctx.createLinearGradient(0, 0, 0, 220);
    failedGradient.addColorStop(0, "rgba(220, 53, 69, 0.22)");
    failedGradient.addColorStop(1, "rgba(220, 53, 69, 0.01)");

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Successful Logins",
            data: successData,
            borderColor: "#0d6efd",
            backgroundColor: successGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: timeframe === 30 ? 2 : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#0d6efd",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
          },
          {
            label: "Failed Logins",
            data: failedData,
            borderColor: "#dc3545",
            backgroundColor: failedGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: timeframe === 30 ? 2 : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#dc3545",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: "easeOutQuart",
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              font: {
                size: 11,
                weight: "500",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            titleFont: { size: 12, weight: "bold" },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterBody: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => sum + (item.raw || 0), 0);
                return `Total Logins: ${total}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 10 },
              color: "#6c757d",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: timeframe === 30 ? 10 : 7,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: { size: 10 },
              color: "#6c757d",
              precision: 0,
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
  }, [data, loading, timeframe]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
        <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
        <span className="text-secondary small">Loading login trend metrics...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4 text-muted">
        <i className="bi bi-bar-chart fs-3 mb-1"></i>
        <span className="small">No login data recorded for this timeframe.</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default LoginTrendChart;
