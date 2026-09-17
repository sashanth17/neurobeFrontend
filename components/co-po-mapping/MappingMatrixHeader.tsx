interface MappingMatrixHeaderProps {
  title?: string;
  version?: string;
  status?: string;
}

const LEGEND = [
  { label: "3 – High", bg: "bg-green-800", text: "text-white", char: "3" },
  { label: "2 – Medium", bg: "bg-blue-700", text: "text-white", char: "2" },
  { label: "1 – Low", bg: "bg-amber-600", text: "text-white", char: "1" },
  { label: "– No Mapping", bg: "bg-gray-300", text: "text-[#000]", char: "–" },
];

const MappingMatrixHeader = ({
  title = "CO1–CO6 × PO1–PO12 Mapping Matrix",
  version = "PO 2025 v1",
  status,
}: MappingMatrixHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
    {/* Title + version badge + status */}
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-sm font-bold text-[#000] dark:text-white">
        {title}
      </h3>
      <span className="text-color2 rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-semibold">
        {version}
      </span>
      {status && (
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
          {status}
        </span>
      )}
    </div>

    {/* Legend */}
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#000]">
      <span className="font-semibold">Mapping Strength:</span>
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1">
          <span
            className={`inline-flex h-2 w-2 items-center justify-center rounded-full text-[10px] font-bold ${l.bg} ${l.text}`}
          >
            {/* {l.char} */}
          </span>
          {l.label}
        </span>
      ))}
      <span className="bg-color2-l text-color2 rounded-md px-2 py-1 font-bold flex items-center gap-1 ">
        {" "}
        <span
          className={`bg-color2 inline-flex h-1.5 w-1.5 items-center justify-center rounded-full text-[10px] font-bold`}
        >
          {" "}
          {""}
        </span>
        AI Suggested
      </span>
    </div>
  </div>
);

export default MappingMatrixHeader;
