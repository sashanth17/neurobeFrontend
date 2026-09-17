import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { useSetState } from "@/utils/function.utils";

interface Option { value: string; label: string; }

const UNIT_OPTIONS: Option[] = [
  { value: "all", label: "All Units" },
  { value: "unit-1", label: "Unit 1" },
  { value: "unit-2", label: "Unit 2" },
  { value: "unit-3", label: "Unit 3" },
  { value: "unit-4", label: "Unit 4" },
  { value: "unit-5", label: "Unit 5" },
];

const TOPIC_OPTIONS: Option[] = [
  { value: "all", label: "All Topics" },
  { value: "network-models", label: "Network Models" },
  { value: "physical-layer", label: "Physical Layer" },
];

const SUBTOPIC_OPTIONS: Option[] = [
  { value: "all", label: "All Subtopics" },
  { value: "osi-model", label: "OSI Model" },
  { value: "tcp-ip", label: "TCP/IP" },
];

const CO_OPTIONS: Option[] = [
  { value: "all", label: "All COs" },
  { value: "co1", label: "CO1" },
  { value: "co2", label: "CO2" },
  { value: "co3", label: "CO3" },
];

const LEVEL_OPTIONS: Option[] = [
  { value: "all", label: "All Levels" },
  { value: "k1", label: "K1" },
  { value: "k2", label: "K2" },
  { value: "k3", label: "K3" },
  { value: "k4", label: "K4" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "all", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
];

const DIFFICULTY_OPTIONS: Option[] = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export interface FilterValues {
  search: string;
  unit: Option | null;
  topic: Option | null;
  subtopic: Option | null;
  courseOutcome: Option | null;
  knowledgeLevel: Option | null;
  status: Option | null;
  difficulty: Option | null;
}

const EMPTY: FilterValues = {
  search: "",
  unit: null,
  topic: null,
  subtopic: null,
  courseOutcome: null,
  knowledgeLevel: null,
  status: null,
  difficulty: null,
};

interface Props {
  onApply: (filters: FilterValues) => void;
  question?: boolean
}

const QuestionBankFilter = ({ onApply, question }: Props) => {
  const [state, setState] = useSetState({ ...EMPTY, showFilters: false, appliedFilters: null as FilterValues | null });

  const handleApply = () => {
    const filters: FilterValues = {
      search: state.search,
      unit: state.unit,
      topic: state.topic,
      subtopic: state.subtopic,
      courseOutcome: state.courseOutcome,
      knowledgeLevel: state.knowledgeLevel,
      status: state.status,
      difficulty: state.difficulty,
    };
    setState({ appliedFilters: filters });
    onApply(filters);
  };

  const handleClear = () => {
    setState({ ...EMPTY, showFilters: false, appliedFilters: null });
    onApply({ ...EMPTY });
  };

  const removeChip = (key: keyof FilterValues) => {
    const updated = { ...state.appliedFilters!, [key]: null } as FilterValues;
    setState({ [key]: null, appliedFilters: updated });
    onApply(updated);
  };

  const activeChips = state.appliedFilters
    ? (Object.entries(state.appliedFilters) as [keyof FilterValues, any][]).filter(
      ([k, v]) => k !== "search" && k !== "unit" && v && v.value !== "all"
    )
    : [];

  return (
    <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Search row */}
      <div className={`flex items-center ${question ? "gap-3" : "gap-20"}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#000]" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            placeholder="Search by question, topic, subtopic, or Question ID..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-color2 focus:ring-1 focus:ring-color2"
          />
        </div>
        {question ?
          <>
            <CustomSelect
              options={UNIT_OPTIONS}
              value={state.unit}
              onChange={(v) => setState({ unit: v })}
              placeholder="All Units"
              isSearchable={false}
              isClearable={false}
              className="w-40"
            />

            <button
              type="button"
              onClick={() => setState({ showFilters: !state.showFilters })}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${state.showFilters
                ? "border-color2 bg-purple-50 text-color2"
                : "border-gray-200 text-[#000] hover:border-color2 hover:text-color2"
                }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </>
          :
          <span>Showing 4 test(s)</span>
        }
      </div>

      {/* Filter panel */}
      {state.showFilters && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Topic</p>
              <CustomSelect options={TOPIC_OPTIONS} value={state.topic} onChange={(v) => setState({ topic: v })} placeholder="All Topics" isClearable={false} isSearchable={false} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Subtopic</p>
              <CustomSelect options={SUBTOPIC_OPTIONS} value={state.subtopic} onChange={(v) => setState({ subtopic: v })} placeholder="All Subtopics" isClearable={false} isSearchable={false} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Course Outcome</p>
              <CustomSelect options={CO_OPTIONS} value={state.courseOutcome} onChange={(v) => setState({ courseOutcome: v })} placeholder="All COs" isClearable={false} isSearchable={false} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Knowledge Level</p>
              <CustomSelect options={LEVEL_OPTIONS} value={state.knowledgeLevel} onChange={(v) => setState({ knowledgeLevel: v })} placeholder="All Levels" isClearable={false} isSearchable={false} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Status</p>
              <CustomSelect options={STATUS_OPTIONS} value={state.status} onChange={(v) => setState({ status: v })} placeholder="All Statuses" isClearable={false} isSearchable={false} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#000]">Difficulty</p>
              <CustomSelect options={DIFFICULTY_OPTIONS} value={state.difficulty} onChange={(v) => setState({ difficulty: v })} placeholder="All Difficulties" isClearable={false} isSearchable={false} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {activeChips.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map(([key, val]) => (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-color2"
                  >
                    {val.label}
                    <button type="button" onClick={() => removeChip(key)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#000]">Select criteria to refine results</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-[#000] hover:bg-gray-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-full bg-[#111238] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankFilter;
