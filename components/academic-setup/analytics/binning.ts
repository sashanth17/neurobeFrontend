/**
 * Score Binning and Collision Detection Utilities for Course Analytics
 */

import { ScoreSeriesItem } from "@/services/courseAnalyticsService";

export interface BandConfig {
  min: number;
  max: number;
  step: number;
}

export interface BinnedSeriesResult {
  categories: string[];
  series: {
    name: string;
    id: number;
    data: number[];
  }[];
  // Key: `${bandIndex}_${countValue}` -> list of instance names at that coordinate
  collisionMap: Map<string, string[]>;
}

/**
 * Creates human-readable band labels, e.g. "0-10", "10-20", ... "90-100"
 */
export function generateBands(min: number, max: number, step: number): { labels: string[]; ranges: [number, number][] } {
  const labels: string[] = [];
  const ranges: [number, number][] = [];

  let current = min;
  while (current < max) {
    const next = Math.min(current + step, max);
    labels.push(`${current}-${next}`);
    ranges.push([current, next]);
    current = next;
  }

  if (labels.length === 0) {
    labels.push(`${min}-${max}`);
    ranges.push([min, max]);
  }

  return { labels, ranges };
}

/**
 * Classifies scores into frequency bins and tracks overlaps across instances
 */
export function binStudentScores(
  seriesItems: ScoreSeriesItem[],
  useRawMarks: boolean,
  yAxisMode: "count" | "percent",
  bandConfig: BandConfig
): BinnedSeriesResult {
  const { labels, ranges } = generateBands(bandConfig.min, bandConfig.max, bandConfig.step);

  const seriesResult: { name: string; id: number; data: number[] }[] = [];
  const collisionMap = new Map<string, string[]>();

  for (const item of seriesItems) {
    const values = useRawMarks ? item.student_raw : item.student_percent;
    const totalCount = values.length;
    const counts = new Array(ranges.length).fill(0);

    for (const val of values) {
      if (val === undefined || val === null || isNaN(val)) continue;

      let placed = false;
      for (let i = 0; i < ranges.length; i++) {
        const [low, high] = ranges[i];
        const isLast = i === ranges.length - 1;
        // Upper-bound inclusive for last bucket (e.g. 100 in 90-100)
        if (val >= low && (isLast ? val <= high : val < high)) {
          counts[i]++;
          placed = true;
          break;
        }
      }
      if (!placed && values.length > 0) {
        if (val < ranges[0][0]) counts[0]++;
        else if (val > ranges[ranges.length - 1][1]) counts[ranges.length - 1]++;
      }
    }

    const finalData = counts.map((cnt) => {
      if (yAxisMode === "percent") {
        return totalCount > 0 ? Number(((cnt / totalCount) * 100).toFixed(1)) : 0;
      }
      return cnt;
    });

    seriesResult.push({
      name: item.instance_name || `Section ${item.instance_id}`,
      id: item.instance_id,
      data: finalData,
    });

    // Record coordinates in collisionMap
    finalData.forEach((val, bandIdx) => {
      const coordKey = `${bandIdx}_${val}`;
      const list = collisionMap.get(coordKey) || [];
      list.push(item.instance_name || `Section ${item.instance_id}`);
      collisionMap.set(coordKey, list);
    });
  }

  return {
    categories: labels,
    series: seriesResult,
    collisionMap,
  };
}
