import { useState, useEffect } from "react";
import { Check, BookOpen, XCircle, RefreshCw } from "lucide-react";
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
  { id: "Approved", name: "Approved" },
  { id: "Needs Review", name: "Needs Review" },
];

const DEFAULT_UNITS = [
  { id: 2, unit_id: 2, unit_number: 1, name: "Unit 1: Network Fundamentals" },
  { id: 3, unit_id: 3, unit_number: 2, name: "Unit 2: Data Link Layer & Error Control" },
  { id: 4, unit_id: 4, unit_number: 3, name: "Unit 3: Network Layer & Routing" },
  { id: 5, unit_id: 5, unit_number: 4, name: "Unit 4: Transport Layer & TCP/UDP" },
  { id: 6, unit_id: 6, unit_number: 5, name: "Unit 5: Application Layer & Security" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditTopicModalProps {
  open: boolean;
  onClose: () => void;
  topic?: any;
  defaultUnit?: string;
  activeUnitNumber?: number;
  courseCode?: string;
  courseTitle?: string;
  units?: any[];
  initialStatus?: "Approved" | "Needs Review";
  loading?: boolean;
  onUpdate?: (payload: {
    topic_id: any;
    parent_topic_id?: any;
    is_subtopic?: boolean;
    subtopic_id?: any;
    subtopic_code?: string;
    micro_topics?: any[];
    topic_name: string;
    unit_id: number;
    estimated_hours: number;
    knowledge_level: string;
    status: string;
  }) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditTopicModal = ({
  open,
  onClose,
  topic,
  defaultUnit = "unit-1",
  activeUnitNumber = 1,
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  units = [],
  initialStatus = "Approved",
  loading = false,
  onUpdate,
}: EditTopicModalProps) => {
  // Transform raw options into { value, label } key-value pairs using the Dropdown utility
  const rawUnits =
    units && units.length > 0
      ? units.map((u: any, idx: number) => {
          const num = u.unit_number ?? (u.id ?? idx + 1);
          const fallbackDefault = DEFAULT_UNITS.find((d: any) => d.unit_number === num);
          const realId =
            u.unit_id ||
            u.id ||
            fallbackDefault?.unit_id ||
            fallbackDefault?.id ||
            (num === 1 ? 2 : num + 1);
          const rawTitle = u.unit_title || u.title || u.name || `Unit ${num}`;
          const displayTitle = rawTitle.toLowerCase().startsWith("unit")
            ? rawTitle
            : `Unit ${num}: ${rawTitle}`;
          return {
            id: realId,
            unit_id: realId,
            unit_number: num,
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
  const [hours, setHours] = useState("2");
  const [error, setError] = useState("");

  // Clean raw topic/subtopic name by stripping leading "Topic/Subtopic X.Y — "
  const getCleanTopicName = (t: any) => {
    const raw = t?.subtopic_name || t?.topic_name || t?.title || "";
    return raw.replace(/^(Topic|Subtopic)?\s*[\d.]+\s*[—–-]\s*/i, "").trim() || raw;
  };

  // Sync state on open or topic change
  useEffect(() => {
    if (open) {
      const cleanName = getCleanTopicName(topic) || "Physical Layer & Transmission Media";

      const parsedDefault = typeof defaultUnit === "string" ? Number(defaultUnit.replace("unit-", "")) : 1;
      const targetUnitId = topic?.unit_id;
      const targetUnitNum = topic?.unit_number ?? activeUnitNumber ?? parsedDefault ?? 1;

      // 1. Match by real database unit_id
      let matchedUnit = targetUnitId
        ? unitOptions.find(
            (opt: any) => opt.value === targetUnitId || Number(opt.value) === Number(targetUnitId)
          )
        : null;

      // 2. If not matched, match by unit_number
      if (!matchedUnit) {
        matchedUnit = unitOptions.find((opt: any) => {
          const rawItem = rawUnits.find((ru: any) => ru.id === opt.value || ru.unit_id === opt.value);
          return (
            rawItem?.unit_number === targetUnitNum ||
            Number(rawItem?.unit_number) === Number(targetUnitNum)
          );
        });
      }

      // 3. Fallback to first available option
      if (!matchedUnit) {
        matchedUnit = unitOptions[0] || null;
      }

      // Match Knowledge Level
      const rawKLevel = String(topic?.knowledge_level || topic?.level || "K2").toUpperCase();
      const matchedLevel =
        knowledgeLevelOptions.find((opt: any) => {
          const optVal = String(opt.value).toUpperCase();
          if (rawKLevel.includes("K1") || rawKLevel === "1") return optVal.includes("K1");
          if (rawKLevel.includes("K2") || rawKLevel === "2") return optVal.includes("K2");
          if (rawKLevel.includes("K3") || rawKLevel === "3") return optVal.includes("K3");
          if (rawKLevel.includes("K4") || rawKLevel === "4") return optVal.includes("K4");
          if (rawKLevel.includes("K5") || rawKLevel === "5") return optVal.includes("K5");
          if (rawKLevel.includes("K6") || rawKLevel === "6") return optVal.includes("K6");
          return optVal === rawKLevel;
        }) ||
        knowledgeLevelOptions.find((opt: any) => opt.value === "K2 — Understand") ||
        knowledgeLevelOptions[1] ||
        knowledgeLevelOptions[0] ||
        null;

      // Pre-select status ("Approved" by default as in screenshot)
      const targetStatus =
        initialStatus ??
        (topic?.status === "Needs Review" ? "Needs Review" : "Approved");
      const matchedStatus =
        statusOptions.find((opt: any) => opt.value === targetStatus) ||
        statusOptions[0] ||
        null;

      const initHours =
        topic?.estimated_hours ??
        topic?.theory_hours ??
        topic?.hours ??
        2;

      setTopicName(cleanName);
      setSelectedUnit(matchedUnit);
      setSelectedLevel(matchedLevel);
      setSelectedStatus(matchedStatus);
      setHours(String(initHours));
      setError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, topic, defaultUnit, activeUnitNumber, initialStatus, units]);

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
    const finalTitle = topicName.trim() || getCleanTopicName(topic) || "Physical Layer & Transmission Media";

    const selectedRaw = rawUnits.find(
      (ru: any) => ru.id === selectedUnit?.value || ru.unit_id === selectedUnit?.value
    );
    const resolvedUnitId =
      Number(selectedUnit?.value) ||
      selectedRaw?.unit_id ||
      selectedRaw?.id ||
      topic?.unit_id ||
      (activeUnitNumber === 1 ? 2 : activeUnitNumber + 1);

    onUpdate?.({
      topic_id: topic?.id || topic?.topic_id || topic?.topic_code || 1,
      parent_topic_id: topic?.parent_topic_id,
      is_subtopic: Boolean(topic?.is_subtopic),
      subtopic_id: topic?.subtopic_id || topic?.id,
      subtopic_code: topic?.subtopic_code,
      micro_topics: topic?.micro_topics,
      topic_name: finalTitle,
      unit_id: resolvedUnitId,
      estimated_hours: parseFloat(hours) || 2.0,
      knowledge_level: selectedLevel?.value ? String(selectedLevel.value) : "K2 — Understand",
      status: selectedStatus?.value ? String(selectedStatus.value) : "Approved",
    });
  };

  const selectedRawItem = rawUnits.find(
    (ru: any) => ru.id === selectedUnit?.value || ru.unit_id === selectedUnit?.value
  );
  const displayUnitNum =
    selectedRawItem?.unit_number ||
    topic?.unit_number ||
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
            {/* Outlined BookOpen Icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <BookOpen className="h-6 w-6 stroke-[1.8]" />
            </div>

            <div>
              <h2 className="text-xl font-bold leading-tight text-white">
                {topic?.is_subtopic ? "Edit Subtopic" : "Edit Topic"}
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
            {/* Topic / Subtopic Name */}
            <div>
              <label className="mb-1 block text-sm font-bold text-[#000] dark:text-gray-200">
                {topic?.is_subtopic ? "Subtopic Name" : "Topic Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Physical Layer & Transmission Media"
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
                  placeholder="2"
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
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 stroke-[2.5]" />
              )}
              {selectedStatus?.value === "Needs Review"
                ? (topic?.is_subtopic ? "Update Subtopic" : "Update Topic")
                : (topic?.is_subtopic ? "Approval Subtopic" : "Approval Topic")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTopicModal;
