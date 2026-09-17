import React from "react";

export interface MatrixRowData {
  coCode: string;
  poScores: Record<string, number>;
}

export interface CopoMappingMatrixCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  poHeaders?: string[];
  rows?: MatrixRowData[];
  className?: string;
}

const DEFAULT_PO_HEADERS = [
  "PO01",
  "PO02",
  "PO03",
  "PO04",
  "PO05",
  "PO06",
  "PO07",
  "PO08",
  "PO09",
  "PO10",
  "PO11",
];

const DEFAULT_ROWS: MatrixRowData[] = [
  {
    coCode: "C01",
    poScores: { PO01: 3, PO02: 2, PO05: 1 },
  },
  {
    coCode: "C02",
    poScores: { PO01: 2, PO02: 3, PO03: 2 },
  },
  {
    coCode: "C03",
    poScores: { PO01: 3, PO02: 2, PO03: 3, PO04: 2 },
  },
  {
    coCode: "C04",
    poScores: { PO01: 2, PO03: 2, PO04: 3, PO05: 2 },
  },
  {
    coCode: "C05",
    poScores: { PO02: 2, PO04: 2, PO05: 3, PO06: 2 },
  },
];

const CopoMappingMatrixCard: React.FC<CopoMappingMatrixCardProps> = ({
  title = "CO–PO MAPPING MATRIX",
  subtitle = "Shows how each Course Outcome is mapped to the Program Outcomes.",
  headerStatsText = "5 × 11 Matrix",
  poHeaders = DEFAULT_PO_HEADERS,
  rows = DEFAULT_ROWS,
  className = "",
}) => {
  const renderBadge = (score: number | undefined) => {
    if (score === 3) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f3ff] text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
          3
        </span>
      );
    }
    if (score === 2) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
          2
        </span>
      );
    }
    if (score === 1) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-[#000] dark:bg-gray-800 dark:text-gray-300">
          1
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-gray-300 dark:text-[#000]">
        –
      </span>
    );
  };

  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-4 flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
            <span className="text-md font-bold text-color2 dark:text-purple-400">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-pri dark:text-pri">
              {subtitle}
            </p>
          )}
        </div>

        <span className="text-xs font-mono font-medium text-pri dark:text-pri shrink-0">
          {headerStatsText}
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100 dark:bg-gray-800/40 dark:border-gray-800">
              <th className="py-3.5 px-4 text-xs font-bold text-[#000] dark:text-gray-300 min-w-[130px]">
                Course Outcome
              </th>
              {poHeaders.map((po) => (
                <th
                  key={po}
                  className="py-3.5 px-2 text-center text-xs font-bold text-[#000] dark:text-gray-300 min-w-[48px]"
                >
                  {po}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr
                key={row.coCode}
                className="hover:bg-gray-50/40 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-3.5 px-4 text-sm font-bold text-color2 dark:text-purple-400">
                  {row.coCode}
                </td>
                {poHeaders.map((po) => (
                  <td key={po} className="py-3.5 px-2 text-center">
                    {renderBadge(row.poScores?.[po])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CopoMappingMatrixCard;
