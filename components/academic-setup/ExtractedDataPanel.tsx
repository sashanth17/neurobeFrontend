import React, { useState } from "react";
import {
  BookOpen,
  Award,
  Layers,
  BookMarked,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

interface ExtractedDataPanelProps {
  data: any;
  courseData?: any;
  onUpdateLTPC?: (values: {
    lecture_hours: number;
    tutorial_hours: number;
    practical_hours: number;
    credits: number;
  }) => void;
}

const ExtractedDataPanel: React.FC<ExtractedDataPanelProps> = ({
  data,
  courseData,
  onUpdateLTPC,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "outcomes" | "units" | "books" | "labs"
  >("units");

  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
  });

  // Extract units list
  const rawUnits: any[] =
    data?.units ||
    data?.syllabus_units ||
    data?.course_units ||
    data?.curriculum_units ||
    [];

  // Extract outcomes (COs)
  const rawOutcomes: any[] =
    data?.outcomes ||
    data?.course_outcomes ||
    data?.courseOutcomes ||
    [];

  // Extract textbooks and references
  const rawTextbooks: any[] =
    data?.textbooks ||
    data?.prescribed_textbooks ||
    [];

  const rawReferences: any[] =
    data?.reference_books ||
    data?.references ||
    [];

  // Extract laboratory experiments
  const rawLabs: any[] =
    data?.laboratory_experiments ||
    data?.experiments ||
    data?.labs ||
    [];

  // LTPC Values
  const initialL = Number(
    data?.lecture_hours ??
      data?.lectureHours ??
      courseData?.lecture_hours ??
      3
  );
  const initialT = Number(
    data?.tutorial_hours ??
      data?.tutorialHours ??
      courseData?.tutorial_hours ??
      0
  );
  const initialP = Number(
    data?.practical_hours ??
      data?.practicalHours ??
      courseData?.practical_hours ??
      0
  );
  const initialC = Number(
    data?.credits ??
      data?.total_credits ??
      courseData?.credits ??
      3
  );

  const [ltpc, setLtpc] = useState({
    L: initialL,
    T: initialT,
    P: initialP,
    C: initialC,
  });

  const handleLtpcChange = (field: "L" | "T" | "P" | "C", val: number) => {
    const next = { ...ltpc, [field]: val };
    setLtpc(next);
    onUpdateLTPC?.({
      lecture_hours: next.L,
      tutorial_hours: next.T,
      practical_hours: next.P,
      credits: next.C,
    });
  };

  const toggleUnit = (uNum: number) => {
    setExpandedUnits((prev) => ({ ...prev, [uNum]: !prev[uNum] }));
  };

  const tabs = [
    {
      id: "units" as const,
      label: "Units & Topics",
      icon: <Layers className="h-4 w-4" />,
      count: rawUnits.length,
    },
    {
      id: "outcomes" as const,
      label: "Course Outcomes (COs)",
      icon: <Award className="h-4 w-4" />,
      count: rawOutcomes.length,
    },
    {
      id: "books" as const,
      label: "Textbooks & References",
      icon: <BookMarked className="h-4 w-4" />,
      count: rawTextbooks.length + rawReferences.length,
    },
    {
      id: "labs" as const,
      label: "Lab Experiments",
      icon: <FlaskConical className="h-4 w-4" />,
      count: rawLabs.length,
    },
    {
      id: "overview" as const,
      label: "Course Overview",
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 bg-slate-50/70 p-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                isActive
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: Units & Topics */}
        {activeTab === "units" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Curriculum Units & Extracted Topics
                </h4>
                <p className="text-xs text-slate-500">
                  {rawUnits.length} Units extracted from syllabus document
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const allOpen: Record<number, boolean> = {};
                  rawUnits.forEach((u, i) => {
                    allOpen[u.unit_number || i + 1] = true;
                  });
                  setExpandedUnits(allOpen);
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Expand All
              </button>
            </div>

            {rawUnits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No units extracted in this version yet.
              </div>
            ) : (
              rawUnits.map((unit: any, uIdx: number) => {
                const uNum = unit.unit_number || uIdx + 1;
                const isExpanded = expandedUnits[uNum] ?? false;
                const topics: any[] = unit.topics || unit.extracted_topics || [];
                const hours = unit.theory_hours || unit.hours || 9;

                return (
                  <div
                    key={unit.id || uNum}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    {/* Unit Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleUnit(uNum)}
                      className="flex w-full items-center justify-between bg-slate-50/80 px-4 py-3 text-left transition-colors hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                          {uNum}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {unit.unit_title || `Unit ${uNum}`}
                          </h5>
                          <span className="text-[11px] text-slate-500">
                            {topics.length} Topics • {hours} Hours
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Unit Topics List */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 p-3 dark:divide-slate-800">
                        {topics.length === 0 ? (
                          <p className="py-2 text-center text-xs text-slate-400">
                            No topics under this unit
                          </p>
                        ) : (
                          topics.map((t: any, tIdx: number) => (
                            <div
                              key={t.id || tIdx}
                              className="flex items-start justify-between py-2 text-xs"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                  {t.topic_code || `${uNum}.${tIdx + 1}`}
                                </span>
                                <div>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">
                                    {t.topic_name || t.title}
                                  </p>
                                  {t.topic_description && (
                                    <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                                      {t.topic_description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 pl-2">
                                {t.knowledge_level && (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    {t.knowledge_level}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400">
                                  {t.theory_hours || t.hours || 1}h
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Course Outcomes (COs) */}
        {activeTab === "outcomes" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Outcomes (COs) & Bloom Taxonomy Levels
              </h4>
              <p className="text-xs text-slate-500">
                Outcomes defined for this course mapping to Programme Outcomes (POs)
              </p>
            </div>

            {rawOutcomes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No course outcomes extracted yet.
              </div>
            ) : (
              rawOutcomes.map((co: any, idx: number) => {
                const code = co.outcome_code || co.code || `CO${idx + 1}`;
                const statement = co.outcome_statement || co.statement || co.description;
                const level = co.bloom_level || co.knowledge_level || "K2";

                return (
                  <div
                    key={co.id || idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                      {code}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {statement}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                        {level}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: Textbooks & Reference Books */}
        {activeTab === "books" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Prescribed Textbooks ({rawTextbooks.length})
              </h4>
              <div className="mt-3 space-y-2">
                {rawTextbooks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No textbooks listed.</p>
                ) : (
                  rawTextbooks.map((b: any, bIdx: number) => (
                    <div
                      key={b.id || bIdx}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">
                        {b.title}
                      </p>
                      <p className="mt-1 text-slate-500">
                        Authors:{" "}
                        {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "—"}
                      </p>
                      <p className="mt-0.5 text-slate-400 text-[11px]">
                        {b.publisher ? `${b.publisher} • ` : ""}
                        {b.edition ? `${b.edition} • ` : ""}
                        {b.publication_year || ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Reference Books ({rawReferences.length})
              </h4>
              <div className="mt-3 space-y-2">
                {rawReferences.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No reference books listed.</p>
                ) : (
                  rawReferences.map((b: any, bIdx: number) => (
                    <div
                      key={b.id || bIdx}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">
                        {b.title}
                      </p>
                      <p className="mt-1 text-slate-500">
                        Authors:{" "}
                        {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "—"}
                      </p>
                      <p className="mt-0.5 text-slate-400 text-[11px]">
                        {b.publisher ? `${b.publisher} • ` : ""}
                        {b.edition ? `${b.edition} • ` : ""}
                        {b.publication_year || ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Laboratory Experiments */}
        {activeTab === "labs" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Laboratory Experiments ({rawLabs.length})
              </h4>
              <p className="text-xs text-slate-500">
                Practical laboratory components extracted from syllabus
              </p>
            </div>

            {rawLabs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No practical/laboratory experiments for this course.
              </div>
            ) : (
              rawLabs.map((lab: any, idx: number) => (
                <div
                  key={lab.id || idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-bold text-xs text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                    {lab.experiment_number || idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {lab.title}
                    </p>
                    {lab.description && (
                      <p className="mt-1 text-xs text-slate-500">{lab.description}</p>
                    )}
                  </div>
                  {lab.allocated_hours > 0 && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {lab.allocated_hours} hrs
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: Course Overview & L-T-P-C */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Credits & Allocation (L-T-P-C)
              </h4>
              <p className="text-xs text-slate-500">
                Adjust Lecture, Tutorial, Practical, and Credit distribution
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">L (Lecture)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.L}
                  onChange={(e) => handleLtpcChange("L", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">T (Tutorial)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.T}
                  onChange={(e) => handleLtpcChange("T", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">P (Practical)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.P}
                  onChange={(e) => handleLtpcChange("P", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-center dark:border-indigo-800 dark:bg-indigo-950/20">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  C (Credits)
                </span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.C}
                  onChange={(e) => handleLtpcChange("C", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-300 bg-white py-1 text-center font-bold text-indigo-700 dark:border-indigo-600 dark:bg-slate-700 dark:text-indigo-300"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-2 dark:bg-slate-800/40">
              <div className="flex justify-between">
                <span className="text-slate-500">Course Code:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {courseData?.course_code || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {courseData?.course_title || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Programme:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {courseData?.programme || "B.Tech CSE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regulation:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {courseData?.regulation || "R2021"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataPanel;
