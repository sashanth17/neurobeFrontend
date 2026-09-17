import { useState, useEffect } from "react";
import { Check, Tablet, XCircle } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Dropdown } from "@/utils/function.utils";

// ─── Raw Options for Dropdown Utility ─────────────────────────────────────────

const RAW_KNOWLEDGE_LEVELS = [
  { id: "K1 — Remember", name: "K1 — Remember" },
  { id: "K2 — Understand", name: "K2 — Understand" },
  { id: "K3 — Apply", name: "K3 — Apply" },
  { id: "K4 — Analyze", name: "K4 — Analyze" },
  { id: "K5 — Evaluate", name: "K5 — Evaluate" },
  { id: "K6 — Create", name: "K6 — Create" },
];

const RAW_STATUS = [
  { id: "Needs Review", name: "Needs Review" },
  { id: "Approved", name: "Approved" },
];

const DEFAULT_UNITS = [
  { id: 1, unit_number: 1, name: "Unit 1: Network Fundamentals" },
  { id: 2, unit_number: 2, name: "Unit 2: Data Link Layer & Error Control" },
  { id: 3, unit_number: 3, name: "Unit 3: Network Layer & Routing" },
  { id: 4, unit_number: 4, name: "Unit 4: Transport Layer & TCP/UDP" },
  { id: 5, unit_number: 5, name: "Unit 5: Application Layer & Security" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddTopicModalProps {
  open: boolean;
  onClose: () => void;
  defaultUnit?: string;
  activeUnitNumber?: number;
  courseCode?: string;
  courseTitle?: string;
  units?: any[];
  onAdd?: (topic: {
    title: string;
    unit: string;
    unitNumber: number;
    level: string;
    hours: string;
    status: string;
  }) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddTopicModal = ({
  open,
  onClose,
  defaultUnit = "unit-1",
  activeUnitNumber = 1,
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  units = [],
  onAdd,
}: AddTopicModalProps) => {
  // Transform raw options into { value, label } key-value pairs using the Dropdown function
  const rawUnits =
    units && units.length > 0
      ? units.map((u: any, idx: number) => {
          const num = u.unit_number ?? (u.id ?? idx + 1);
          const rawTitle = u.unit_title || u.title || u.name || `Unit ${num}`;
          const displayTitle = rawTitle.toLowerCase().startsWith("unit")
            ? rawTitle
            : `Unit ${num}: ${rawTitle}`;
          return {
            id: num,
            name: displayTitle,
          };
        })
      : DEFAULT_UNITS;

  const unitOptions = Dropdown(rawUnits, "name");
  const knowledgeLevelOptions = Dropdown(RAW_KNOWLEDGE_LEVELS, "name");
  const statusOptions = Dropdown(RAW_STATUS, "name");

  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [topicName, setTopicName] = useState("");
  const [hours, setHours] = useState("1.5");
  const [error, setError] = useState("");

  // Sync state on open
  useEffect(() => {
    if (open) {
      const initialUnitNum =
        activeUnitNumber ||
        (typeof defaultUnit === "string" ? Number(defaultUnit.replace("unit-", "")) : 1) ||
        1;

      const matchedUnit =
        unitOptions.find(
          (opt: any) =>
            opt.value === initialUnitNum ||
            Number(opt.value) === Number(initialUnitNum)
        ) ||
        unitOptions[0] ||
        null;

      const defaultLevel =
        knowledgeLevelOptions.find((opt: any) => opt.value === "K2 — Understand") ||
        knowledgeLevelOptions[1] ||
        knowledgeLevelOptions[0] ||
        null;

      const defaultStatus =
        statusOptions.find((opt: any) => opt.value === "Needs Review") ||
        statusOptions[0] ||
        null;

      setTopicName("");
      setSelectedUnit(matchedUnit);
      setSelectedLevel(defaultLevel);
      setSelectedStatus(defaultStatus);
      setHours("1.5");
      setError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, defaultUnit, activeUnitNumber, units]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = topicName.trim() || "Transmission Impairments & Noise Analysis";

    const unitNum = Number(selectedUnit?.value) || activeUnitNumber || 1;
    const unitLabel = selectedUnit?.label || `Unit ${unitNum}`;

    onAdd?.({
      title: finalTitle,
      unit: unitLabel,
      unitNumber: unitNum,
      level: selectedLevel?.value ? String(selectedLevel.value) : "K2 — Understand",
      hours: hours || "1.5",
      status: selectedStatus?.value ? String(selectedStatus.value) : "Needs Review",
    });
    onClose();
  };

  const displayUnitNum =
    Number(selectedUnit?.value) ||
    activeUnitNumber ||
    1;

  const displayCourseName =
    courseCode && courseTitle
      ? `${courseCode} ${courseTitle}`
      : courseCode || courseTitle || "CS309 Computer Networks";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900 md:rounded-3xl">
        {/* ───────────────── HEADER ───────────────── */}
        <div className="flex items-center justify-between bg-[#191242] px-6 py-4.5 text-white">
          <div className="flex items-center gap-3.5">
            {/* Outlined Tablet Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Tablet className="h-6 w-6 stroke-[1.8]" />
            </div>

            <div>
              <h2 className="text-xl font-bold leading-tight text-white">
                Add Topic
              </h2>
              <p className="mt-0.5 text-xs font-normal text-white/70">
                Unit {displayUnitNum} • {displayCourseName}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/70 transition-colors hover:text-white"
            aria-label="Close"
          >
            <XCircle className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>

        {/* ───────────────── BODY / FORM ───────────────── */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Topic Name */}
            <div>
              <label className="mb-1 block text-sm font-bold text-[#000] dark:text-gray-200">
                Topic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Transmission Impairments & Noise Analysis"
                value={topicName}
                onChange={(e) => {
                  setTopicName(e.target.value);
                  if (error) setError("");
                }}
                className={`h-[38px] w-full rounded-md border bg-white px-3 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all dark:bg-gray-800 dark:text-white ${
                  error
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-[#d1d5db] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] dark:border-gray-700"
                }`}
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>

            {/* Unit and Estimated Hours */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-7">
                <CustomSelect
                  title="Unit"
                  options={unitOptions}
                  value={selectedUnit}
                  onChange={(val) => setSelectedUnit(val)}
                  placeholder="Select Unit"
                  isClearable={false}
                />
              </div>

              <div className="sm:col-span-5">
                <label className="mb-1 block text-sm font-bold text-[#000] dark:text-gray-200">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="1.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="h-[38px] w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Knowledge Level */}
            <div>
              <CustomSelect
                title="Knowledge Level"
                options={knowledgeLevelOptions}
                value={selectedLevel}
                onChange={(val) => setSelectedLevel(val)}
                placeholder="Select Knowledge Level"
                isClearable={false}
              />
            </div>

            {/* Status */}
            <div>
              <CustomSelect
                title="Status"
                options={statusOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                placeholder="Select Status"
                isClearable={false}
              />
            </div>
          </div>

          {/* ───────────────── FOOTER ───────────────── */}
          <div className="mt-6 flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#5C28CA] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#4d20b0] active:scale-[0.98]"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              Save Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopicModal;
