import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BinnedSeriesResult } from "./binning";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type ChartType =
  | "line"
  | "spline"
  | "bar"
  | "histogram"
  | "scatter"
  | "bubble"
  | "radar"
  | "pie";

interface ScoreChartProps {
  binnedData: BinnedSeriesResult;
  chartType: ChartType;
  yAxisMode: "count" | "percent";
  xAxisTitle?: string;
  height?: number;
}

const PALETTE = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#64748B", // Slate
];

const ScoreChart: React.FC<ScoreChartProps> = ({
  binnedData,
  chartType,
  yAxisMode,
  xAxisTitle = "Score Bands",
  height = 420,
}) => {
  const [selectedPieInstanceId, setSelectedPieInstanceId] = useState<number | null>(null);

  // If Pie chart is selected, pick active instance
  const activePieSeries = useMemo(() => {
    if (binnedData.series.length === 0) return null;
    if (selectedPieInstanceId !== null) {
      return (
        binnedData.series.find((s) => s.id === selectedPieInstanceId) ||
        binnedData.series[0]
      );
    }
    return binnedData.series[0];
  }, [binnedData.series, selectedPieInstanceId]);

  const apexConfig = useMemo(() => {
    const isPie = chartType === "pie";
    const isStacked = chartType === "histogram";
    const isRadar = chartType === "radar";
    const isScatter = chartType === "scatter";
    const isBubble = chartType === "bubble";

    if (isPie && activePieSeries) {
      return {
        series: activePieSeries.data,
        options: {
          chart: {
            type: "pie" as const,
            toolbar: { show: true },
          },
          labels: binnedData.categories,
          colors: PALETTE,
          legend: {
            position: "bottom" as const,
            labels: { colors: "#64748B" },
          },
          tooltip: {
            y: {
              formatter: (val: number) =>
                yAxisMode === "percent" ? `${val}% of class` : `${val} students`,
            },
          },
        },
      };
    }

    // Transform series for bubble or scatter
    let apexSeries: any[] = binnedData.series;

    if (isBubble) {
      apexSeries = binnedData.series.map((s) => ({
        name: s.name,
        data: s.data.map((val, idx) => ({
          x: binnedData.categories[idx],
          y: val,
          z: Math.max(val * 4, 6), // bubble size
        })),
      }));
    } else if (isScatter) {
      apexSeries = binnedData.series.map((s) => ({
        name: s.name,
        data: s.data.map((val, idx) => ({
          x: binnedData.categories[idx],
          y: val,
        })),
      }));
    }

    const options: any = {
      chart: {
        type:
          chartType === "spline"
            ? "line"
            : chartType === "histogram"
            ? "bar"
            : chartType,
        stacked: isStacked,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
        },
      },
      stroke: {
        curve: chartType === "spline" ? "smooth" : "straight",
        width: chartType === "bar" || chartType === "histogram" ? 0 : 3,
      },
      colors: PALETTE.slice(0, binnedData.series.length),
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: isStacked ? "95%" : "60%",
          borderRadius: isStacked ? 0 : 4,
        },
        bubble: {
          minBubbleRadius: 5,
          maxBubbleRadius: 28,
        },
      },
      markers: {
        size: isScatter ? 8 : 5,
        strokeWidth: 2,
        hover: { size: 9 },
      },
      xaxis: {
        categories: isBubble || isScatter ? undefined : binnedData.categories,
        title: {
          text: xAxisTitle,
          style: { fontSize: "12px", fontWeight: 600, color: "#64748B" },
        },
        labels: {
          style: { colors: "#64748B", fontSize: "11px", fontWeight: 500 },
        },
      },
      yaxis: {
        title: {
          text: yAxisMode === "percent" ? "% of Students in Class" : "Number of Students",
          style: { fontSize: "12px", fontWeight: 600, color: "#64748B" },
        },
        labels: {
          formatter: (val: number) => (yAxisMode === "percent" ? `${val}%` : `${Math.round(val)}`),
          style: { colors: "#64748B", fontSize: "11px" },
        },
        min: 0,
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        labels: { colors: "#475569" },
        markers: { radius: 12 },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 4,
      },
      // Collision / Overlapping points custom tooltip
      tooltip: {
        shared: !isScatter && !isBubble,
        intersect: isScatter || isBubble,
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          const bandLabel = binnedData.categories[dataPointIndex] || "";
          const coordKey = `${dataPointIndex}_${series[seriesIndex]?.[dataPointIndex] ?? 0}`;
          const overlappingInstances = binnedData.collisionMap.get(coordKey) || [];

          let itemsHtml = "";
          if (isScatter || isBubble) {
            const currentInst = w.config.series[seriesIndex]?.name;
            const curVal = series[seriesIndex]?.[dataPointIndex] ?? 0;
            const collisionCount = overlappingInstances.length;

            itemsHtml = `
              <div class="px-3 py-2 text-xs">
                <div class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between gap-4">
                  <span>Band: <span class="text-indigo-600">${bandLabel}</span></span>
                  <span class="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">${curVal} ${yAxisMode === "percent" ? "%" : "students"}</span>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${w.config.colors[seriesIndex]}"></span>
                    <span>${currentInst}</span>
                  </div>
                  ${
                    collisionCount > 1
                      ? `
                    <div class="mt-2 pt-1 border-t border-slate-100">
                      <p class="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                        ⚠️ ${collisionCount} Instances at this point:
                      </p>
                      <ul class="list-disc list-inside text-[11px] text-slate-600 pl-1 mt-0.5">
                        ${overlappingInstances.map((name) => `<li>${name}</li>`).join("")}
                      </ul>
                    </div>`
                      : ""
                  }
                </div>
              </div>
            `;
          } else {
            // Shared multi-series tooltip
            const rows = w.config.series
              .map((s: any, idx: number) => {
                const val = series[idx]?.[dataPointIndex];
                if (val === undefined || val === null) return "";
                return `
                  <div class="flex items-center justify-between gap-3 text-xs py-0.5">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${w.config.colors[idx]}"></span>
                      <span class="font-medium text-slate-700">${s.name}</span>
                    </div>
                    <span class="font-mono font-bold text-slate-900">${val} ${yAxisMode === "percent" ? "%" : ""}</span>
                  </div>
                `;
              })
              .join("");

            itemsHtml = `
              <div class="px-3 py-2 text-xs">
                <div class="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                  Band: <span class="text-indigo-600">${bandLabel}</span>
                </div>
                <div class="space-y-0.5">
                  ${rows}
                </div>
              </div>
            `;
          }

          return `<div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-200">${itemsHtml}</div>`;
        },
      },
    };

    return {
      series: apexSeries,
      options,
    };
  }, [binnedData, chartType, yAxisMode, xAxisTitle, activePieSeries]);

  if (binnedData.series.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
        No marks data available for selected tests and instances.
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Pie instance picker if Pie chart is active and multiple instances exist */}
      {chartType === "pie" && binnedData.series.length > 1 && (
        <div className="mb-3 flex items-center justify-end gap-2 text-xs">
          <span className="font-semibold text-slate-500">Instance View:</span>
          <select
            value={activePieSeries?.id}
            onChange={(e) => setSelectedPieInstanceId(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            {binnedData.series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="w-full">
        {typeof window !== "undefined" && (
          <Chart
            options={apexConfig.options}
            series={apexConfig.series}
            type={
              chartType === "spline"
                ? "line"
                : chartType === "histogram"
                ? "bar"
                : (chartType as any)
            }
            height={height}
          />
        )}
      </div>
    </div>
  );
};

export default ScoreChart;
