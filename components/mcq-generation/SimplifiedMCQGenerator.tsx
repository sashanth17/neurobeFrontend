import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Calculator,
  Briefcase,
  Code2,
  HelpCircle,
  RotateCcw,
  CheckSquare,
  Square,
  Minus,
  Plus,
} from "lucide-react";
import { PEDAGOGICAL_PRESETS } from "./types";

export interface SubtopicItem {
  id?: string;
  code?: string;
  title: string;
}

export interface TopicItem {
  id?: string;
  code?: string;
  title: string;
  subtopics?: SubtopicItem[];
}

export interface HierarchyUnitItem {
  unit_number: number;
  unit_title: string;
  topics: TopicItem[];
}

export interface SimplifiedMCQGeneratorProps {
  courseCode: string;
  courseTitle: string;
  hierarchyUnits: HierarchyUnitItem[];
  loadingHierarchy?: boolean;
  onGenerate: (payload: {
    selectedUnits: HierarchyUnitItem[];
    bloomCounts: Record<string, number>;
    totalQuestions: number;
    activePresetId: string | null;
    activePresetDescription: string;
    includeExplanation: boolean;
    shuffleOptions: boolean;
    enableBreakdown?: boolean;
    difficultyBreakdown?: Record<string, { easy: number; medium: number; hard: number }>;
  }) => Promise<void>;
  isGeneratingAI: boolean;
}

const BLOOM_LEVELS = [
  {
    level: "K1",
    label: "K1 – Remembering",
    shortName: "Remembering",
    verbs: "Recall facts, definitions & terms",
    color: "indigo",
  },
  {
    level: "K2",
    label: "K2 – Understanding",
    shortName: "Understanding",
    verbs: "Explain concepts, summarize & classify",
    color: "blue",
  },
  {
    level: "K3",
    label: "K3 – Applying",
    shortName: "Applying",
    verbs: "Solve problems, calculate & demonstrate",
    color: "emerald",
  },
  {
    level: "K4",
    label: "K4 – Analyzing",
    shortName: "Analyzing",
    verbs: "Differentiate, compare & draw links",
    color: "amber",
  },
  {
    level: "K5",
    label: "K5 – Evaluating",
    shortName: "Evaluating",
    verbs: "Assess, justify, critique & validate",
    color: "orange",
  },
  {
    level: "K6",
    label: "K6 – Creating",
    shortName: "Creating",
    verbs: "Design, construct & formulate solutions",
    color: "purple",
  },
];

export const SimplifiedMCQGenerator: React.FC<SimplifiedMCQGeneratorProps> = ({
  courseCode,
  courseTitle,
  hierarchyUnits,
  loadingHierarchy = false,
  onGenerate,
  isGeneratingAI,
}) => {
  // Topic search term
  const [topicSearch, setTopicSearch] = useState("");

  // Accordion state for units
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>(() => {
    // Default open first 2 units
    return { 1: true, 2: true };
  });

  // Selected topics & subtopics tracked by unique keys
  // Key format: "u{unit_number}-t{topicIndex}" and "u{unit_number}-t{topicIndex}-s{subtopicIndex}"
  const [selectedTopicKeys, setSelectedTopicKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Default select all topics & subtopics of first unit if available
    if (hierarchyUnits && hierarchyUnits.length > 0) {
      const u1 = hierarchyUnits[0];
      (u1.topics || []).forEach((t, tIdx) => {
        initial.add(`u${u1.unit_number}-t${tIdx}`);
        (t.subtopics || []).forEach((_, sIdx) => {
          initial.add(`u${u1.unit_number}-t${tIdx}-s${sIdx}`);
        });
      });
    }
    return initial;
  });

  // Bloom's Stratification (1D) counts: K1..K6
  const [bloomCounts, setBloomCounts] = useState<Record<string, number>>({
    K1: 2,
    K2: 2,
    K3: 1,
    K4: 0,
    K5: 0,
    K6: 0,
  });

  // Question Breakdown by difficulty toggle (Easy / Medium / Hard)
  const [enableBreakdown, setEnableBreakdown] = useState<boolean>(false);

  // Difficulty breakdown state per knowledge level
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<
    Record<string, { easy: number; medium: number; hard: number }>
  >({
    K1: { easy: 2, medium: 0, hard: 0 },
    K2: { easy: 1, medium: 1, hard: 0 },
    K3: { easy: 0, medium: 1, hard: 0 },
    K4: { easy: 0, medium: 0, hard: 0 },
    K5: { easy: 0, medium: 0, hard: 0 },
    K6: { easy: 0, medium: 0, hard: 0 },
  });

  // Automatically select first unit topics when hierarchyUnits are loaded/updated
  useEffect(() => {
    if (hierarchyUnits && hierarchyUnits.length > 0) {
      setSelectedTopicKeys((prev) => {
        // If selection is empty or has keys not present in current hierarchyUnits, reinitialize
        const validKeyExists = Array.from(prev).some((k) => {
          const match = k.match(/^u(\d+)-t(\d+)$/);
          if (!match) return false;
          const uNum = Number(match[1]);
          const tIdx = Number(match[2]);
          const u = hierarchyUnits.find((unit) => unit.unit_number === uNum);
          return u && u.topics && u.topics[tIdx];
        });

        if (!validKeyExists || prev.size === 0) {
          const initial = new Set<string>();
          const u1 = hierarchyUnits[0];
          (u1.topics || []).forEach((t, tIdx) => {
            initial.add(`u${u1.unit_number}-t${tIdx}`);
            (t.subtopics || []).forEach((_, sIdx) => {
              initial.add(`u${u1.unit_number}-t${tIdx}-s${sIdx}`);
            });
          });
          return initial;
        }
        return prev;
      });
    }
  }, [hierarchyUnits]);

  // Pedagogical Focus: exactly the 4 presets
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Settings
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Total questions count derived from either difficulty breakdown or Bloom's levels
  const totalQuestions = useMemo(() => {
    if (enableBreakdown) {
      return Object.values(difficultyBreakdown).reduce(
        (acc, diff) => acc + (diff.easy || 0) + (diff.medium || 0) + (diff.hard || 0),
        0
      );
    }
    return Object.values(bloomCounts).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [enableBreakdown, difficultyBreakdown, bloomCounts]);

  // Topic Selection Helpers
  const toggleUnitAccordion = (uNum: number) => {
    setExpandedUnits((prev) => ({ ...prev, [uNum]: !prev[uNum] }));
  };

  const handleToggleTopic = (uNum: number, tIdx: number, topic: TopicItem) => {
    const tKey = `u${uNum}-t${tIdx}`;
    const next = new Set(selectedTopicKeys);
    const isCurrentlySelected = next.has(tKey);

    if (isCurrentlySelected) {
      // Deselect topic and all its subtopics
      next.delete(tKey);
      (topic.subtopics || []).forEach((_, sIdx) => {
        next.delete(`u${uNum}-t${tIdx}-s${sIdx}`);
      });
    } else {
      // Select topic and all its subtopics
      next.add(tKey);
      (topic.subtopics || []).forEach((_, sIdx) => {
        next.add(`u${uNum}-t${tIdx}-s${sIdx}`);
      });
    }

    setSelectedTopicKeys(next);
  };

  const handleToggleSubtopic = (uNum: number, tIdx: number, sIdx: number) => {
    const sKey = `u${uNum}-t${tIdx}-s${sIdx}`;
    const tKey = `u${uNum}-t${tIdx}`;
    const next = new Set(selectedTopicKeys);

    if (next.has(sKey)) {
      next.delete(sKey);
    } else {
      next.add(sKey);
      // Ensure parent topic is checked
      next.add(tKey);
    }

    setSelectedTopicKeys(next);
  };

  const handleToggleUnitAll = (unit: HierarchyUnitItem) => {
    const next = new Set(selectedTopicKeys);
    // Check if all topics in this unit are currently selected
    const allSelected = (unit.topics || []).every((_, tIdx) =>
      next.has(`u${unit.unit_number}-t${tIdx}`)
    );

    (unit.topics || []).forEach((t, tIdx) => {
      const tKey = `u${unit.unit_number}-t${tIdx}`;
      if (allSelected) {
        next.delete(tKey);
        (t.subtopics || []).forEach((_, sIdx) => {
          next.delete(`u${unit.unit_number}-t${tIdx}-s${sIdx}`);
        });
      } else {
        next.add(tKey);
        (t.subtopics || []).forEach((_, sIdx) => {
          next.add(`u${unit.unit_number}-t${tIdx}-s${sIdx}`);
        });
      }
    });

    setSelectedTopicKeys(next);
  };

  const handleSelectAllAll = () => {
    const next = new Set<string>();
    hierarchyUnits.forEach((u) => {
      (u.topics || []).forEach((t, tIdx) => {
        next.add(`u${u.unit_number}-t${tIdx}`);
        (t.subtopics || []).forEach((_, sIdx) => {
          next.add(`u${u.unit_number}-t${tIdx}-s${sIdx}`);
        });
      });
    });
    setSelectedTopicKeys(next);
  };

  const handleDeselectAllAll = () => {
    setSelectedTopicKeys(new Set());
  };

  // Bloom's Count Helpers
  const updateBloomCount = (level: string, delta: number) => {
    setBloomCounts((prev) => {
      const current = prev[level] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [level]: nextVal };
    });
  };

  const setBloomExact = (level: string, val: number) => {
    setBloomCounts((prev) => ({
      ...prev,
      [level]: Math.max(0, val),
    }));
  };

  // Difficulty Breakdown Helpers (Easy / Medium / Hard)
  const updateDifficultyCount = (level: string, diff: "easy" | "medium" | "hard", delta: number) => {
    setDifficultyBreakdown((prev) => {
      const current = prev[level] || { easy: 0, medium: 0, hard: 0 };
      const nextVal = Math.max(0, (current[diff] || 0) + delta);
      const updatedLevel = { ...current, [diff]: nextVal };
      const nextBreakdown = { ...prev, [level]: updatedLevel };

      // Sync bloomCounts[level] with the new level total
      const newLevelTotal = updatedLevel.easy + updatedLevel.medium + updatedLevel.hard;
      setBloomCounts((bPrev) => ({ ...bPrev, [level]: newLevelTotal }));

      return nextBreakdown;
    });
  };

  const setDifficultyExact = (level: string, diff: "easy" | "medium" | "hard", val: number) => {
    const cleanVal = Math.max(0, Math.min(50, isNaN(val) ? 0 : val));
    setDifficultyBreakdown((prev) => {
      const current = prev[level] || { easy: 0, medium: 0, hard: 0 };
      const updatedLevel = { ...current, [diff]: cleanVal };
      const nextBreakdown = { ...prev, [level]: updatedLevel };

      // Sync bloomCounts[level] with the new level total
      const newLevelTotal = updatedLevel.easy + updatedLevel.medium + updatedLevel.hard;
      setBloomCounts((bPrev) => ({ ...bPrev, [level]: newLevelTotal }));

      return nextBreakdown;
    });
  };

  const toggleBreakdown = () => {
    const nextState = !enableBreakdown;
    setEnableBreakdown(nextState);
    if (nextState) {
      // Synchronize difficulty breakdown so it matches the current bloomCounts
      setDifficultyBreakdown((prev) => {
        const updated = { ...prev };
        BLOOM_LEVELS.forEach((bl) => {
          const total = bloomCounts[bl.level] || 0;
          const currentTotal =
            (updated[bl.level]?.easy || 0) +
            (updated[bl.level]?.medium || 0) +
            (updated[bl.level]?.hard || 0);

          if (currentTotal !== total) {
            if (bl.level === "K1") {
              updated[bl.level] = { easy: total, medium: 0, hard: 0 };
            } else if (bl.level === "K2") {
              const med = Math.floor(total / 2);
              updated[bl.level] = { easy: total - med, medium: med, hard: 0 };
            } else if (bl.level === "K3") {
              const easy = Math.floor(total / 3);
              const hard = Math.floor(total / 3);
              updated[bl.level] = { easy, medium: total - easy - hard, hard };
            } else if (bl.level === "K4") {
              const hard = Math.floor(total / 2);
              updated[bl.level] = { easy: 0, medium: total - hard, hard };
            } else {
              updated[bl.level] = { easy: 0, medium: 0, hard: total };
            }
          }
        });
        return updated;
      });
    }
  };

  const applyPreset = (preset: "balanced" | "foundational" | "advanced" | "reset") => {
    let nextBloom = { K1: 2, K2: 3, K3: 2, K4: 1, K5: 0, K6: 0 };
    let nextDiff = {
      K1: { easy: 2, medium: 0, hard: 0 },
      K2: { easy: 1, medium: 2, hard: 0 },
      K3: { easy: 0, medium: 2, hard: 0 },
      K4: { easy: 0, medium: 0, hard: 1 },
      K5: { easy: 0, medium: 0, hard: 0 },
      K6: { easy: 0, medium: 0, hard: 0 },
    };

    if (preset === "reset") {
      nextBloom = { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 };
      nextDiff = {
        K1: { easy: 0, medium: 0, hard: 0 },
        K2: { easy: 0, medium: 0, hard: 0 },
        K3: { easy: 0, medium: 0, hard: 0 },
        K4: { easy: 0, medium: 0, hard: 0 },
        K5: { easy: 0, medium: 0, hard: 0 },
        K6: { easy: 0, medium: 0, hard: 0 },
      };
    } else if (preset === "foundational") {
      nextBloom = { K1: 3, K2: 3, K3: 0, K4: 0, K5: 0, K6: 0 };
      nextDiff = {
        K1: { easy: 2, medium: 1, hard: 0 },
        K2: { easy: 1, medium: 2, hard: 0 },
        K3: { easy: 0, medium: 0, hard: 0 },
        K4: { easy: 0, medium: 0, hard: 0 },
        K5: { easy: 0, medium: 0, hard: 0 },
        K6: { easy: 0, medium: 0, hard: 0 },
      };
    } else if (preset === "advanced") {
      nextBloom = { K1: 0, K2: 1, K3: 3, K4: 3, K5: 1, K6: 0 };
      nextDiff = {
        K1: { easy: 0, medium: 0, hard: 0 },
        K2: { easy: 0, medium: 1, hard: 0 },
        K3: { easy: 0, medium: 2, hard: 1 },
        K4: { easy: 0, medium: 1, hard: 2 },
        K5: { easy: 0, medium: 0, hard: 1 },
        K6: { easy: 0, medium: 0, hard: 0 },
      };
    }

    setBloomCounts(nextBloom);
    setDifficultyBreakdown(nextDiff);
  };

  // Build the filtered selected units for payload
  const buildSelectedUnitsPayload = (): HierarchyUnitItem[] => {
    const selectedUnits: HierarchyUnitItem[] = [];

    hierarchyUnits.forEach((u) => {
      const matchedTopics: TopicItem[] = [];

      (u.topics || []).forEach((t, tIdx) => {
        const isTopicSelected = selectedTopicKeys.has(`u${u.unit_number}-t${tIdx}`);

        // Filter subtopics that are selected
        const matchedSubtopics = (t.subtopics || []).filter((_, sIdx) =>
          selectedTopicKeys.has(`u${u.unit_number}-t${tIdx}-s${sIdx}`)
        );

        if (isTopicSelected || matchedSubtopics.length > 0) {
          matchedTopics.push({
            id: t.id || String(tIdx + 1),
            code: t.code || `${u.unit_number}.${tIdx + 1}`,
            title: t.title,
            subtopics: matchedSubtopics.map((st, sIdx) => ({
              id: st.id || String(sIdx + 1),
              code: st.code || `${u.unit_number}.${tIdx + 1}.${sIdx + 1}`,
              title: st.title,
            })),
          });
        }
      });

      if (matchedTopics.length > 0) {
        selectedUnits.push({
          unit_number: u.unit_number,
          unit_title: u.unit_title,
          topics: matchedTopics,
        });
      }
    });

    return selectedUnits;
  };

  const selectedUnitsPayload = useMemo(buildSelectedUnitsPayload, [hierarchyUnits, selectedTopicKeys]);

  const totalSelectedTopicsCount = selectedUnitsPayload.reduce(
    (acc, u) => acc + (u.topics?.length || 0),
    0
  );

  const totalSelectedSubtopicsCount = selectedUnitsPayload.reduce(
    (acc, u) => acc + (u.topics || []).reduce((s, t) => s + (t.subtopics?.length || 0), 0),
    0
  );

  // Validate form
  const canGenerate = totalQuestions > 0 && totalSelectedTopicsCount > 0 && !isGeneratingAI;

  const handleGenerateClick = () => {
    if (!canGenerate) return;

    const preset = PEDAGOGICAL_PRESETS.find((p) => p.id === activePresetId);
    onGenerate({
      selectedUnits: selectedUnitsPayload,
      bloomCounts,
      totalQuestions,
      activePresetId,
      activePresetDescription: preset ? preset.description : "",
      includeExplanation,
      shuffleOptions,
      enableBreakdown,
      difficultyBreakdown,
    });
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "Calculator":
        return <Calculator className="h-4 w-4" />;
      case "Briefcase":
        return <Briefcase className="h-4 w-4" />;
      case "Code2":
        return <Code2 className="h-4 w-4" />;
      case "BookOpen":
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: Topics & Subtopics Selection ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Step 1
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Select Topics & Subtopics
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Populated from active Topic Hierarchy version data. Choose the scope for question generation.
              </p>
            </div>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {totalSelectedTopicsCount} Topics • {totalSelectedSubtopicsCount} Subtopics Selected
            </span>
            <button
              type="button"
              onClick={handleSelectAllAll}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAllAll}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics or subtopics in syllabus..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800/60 dark:text-white"
            />
          </div>

          {loadingHierarchy ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading topic hierarchy...</div>
          ) : hierarchyUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
              No topics found. Please ensure topic hierarchy or syllabus extraction is active for this course.
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {hierarchyUnits.map((u) => {
                const isExpanded = expandedUnits[u.unit_number] ?? true;
                const unitTopics = u.topics || [];
                const filteredTopics = unitTopics.filter((t) => {
                  if (!topicSearch) return true;
                  const term = topicSearch.toLowerCase();
                  const matchTopic = t.title.toLowerCase().includes(term);
                  const matchSub = (t.subtopics || []).some((st) => st.title.toLowerCase().includes(term));
                  return matchTopic || matchSub;
                });

                if (filteredTopics.length === 0 && topicSearch) return null;

                const allInUnitSelected =
                  unitTopics.length > 0 &&
                  unitTopics.every((_, tIdx) => selectedTopicKeys.has(`u${u.unit_number}-t${tIdx}`));

                const someInUnitSelected =
                  !allInUnitSelected &&
                  unitTopics.some((_, tIdx) => selectedTopicKeys.has(`u${u.unit_number}-t${tIdx}`));

                const selectedInUnitCount = unitTopics.filter((_, tIdx) =>
                  selectedTopicKeys.has(`u${u.unit_number}-t${tIdx}`)
                ).length;

                return (
                  <div
                    key={u.unit_number}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs dark:border-gray-700/80 dark:bg-gray-800/60"
                  >
                    {/* Unit Accordion Bar */}
                    <div className="flex items-center justify-between bg-gray-50/80 px-4 py-2.5 dark:bg-gray-800">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={allInUnitSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someInUnitSelected;
                          }}
                          onChange={() => handleToggleUnitAll(u)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => toggleUnitAccordion(u.unit_number)}
                          className="flex items-center gap-2 text-left font-bold text-xs text-gray-900 dark:text-white"
                        >
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            Unit {u.unit_number}
                          </span>
                          <span>{u.unit_title}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          {selectedInUnitCount} / {unitTopics.length} Topics
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleUnitAccordion(u.unit_number)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Unit Topics Grid */}
                    {isExpanded && (
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-white dark:bg-gray-900/30">
                        {filteredTopics.map((topic) => {
                          const origTIdx = unitTopics.findIndex((t) => t.title === topic.title);
                          const tIdx = origTIdx >= 0 ? origTIdx : 0;
                          const tKey = `u${u.unit_number}-t${tIdx}`;
                          const isTopicChecked = selectedTopicKeys.has(tKey);
                          const subtopics = topic.subtopics || [];

                          return (
                            <div
                              key={tKey}
                              className={`rounded-xl border p-2.5 transition-colors ${
                                isTopicChecked
                                  ? "border-purple-200 bg-purple-50/30 dark:border-purple-900/50 dark:bg-purple-950/20"
                                  : "border-gray-200/70 bg-gray-50/30 dark:border-gray-700/60 dark:bg-gray-800/30"
                              }`}
                            >
                              {/* Topic Checkbox + Title */}
                              <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isTopicChecked}
                                  onChange={() => handleToggleTopic(u.unit_number, tIdx, topic)}
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <div className="flex-1 text-xs">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {topic.title}
                                  </span>
                                </div>
                              </label>

                              {/* Nested Subtopics */}
                              {subtopics.length > 0 && (
                                <div className="ml-6 mt-2 space-y-1.5 border-l-2 border-purple-200 pl-2.5 dark:border-purple-800/60">
                                  {subtopics.map((st, sIdx) => {
                                    const sKey = `u${u.unit_number}-t${tIdx}-s${sIdx}`;
                                    const isSubChecked = selectedTopicKeys.has(sKey);
                                    return (
                                      <label
                                        key={sKey}
                                        className="flex items-start gap-2 cursor-pointer text-[11px] text-gray-600 dark:text-gray-300"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSubChecked}
                                          onChange={() => handleToggleSubtopic(u.unit_number, tIdx, sIdx)}
                                          className="mt-0.5 h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="leading-tight">{st.title}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Knowledge Levels (Bloom's Stratification 1D) ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Step 2
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Knowledge Levels (Bloom's Taxonomy)
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Specify question counts for each Bloom's level. The sum determines the total questions generated.
              </p>
            </div>
          </div>

          {/* Controls: Breakdown Toggle & Preset Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Question Breakdown Toggle Button */}
            <div className="flex items-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/50 px-3 py-1.5 dark:border-purple-800/60 dark:bg-purple-950/30">
              <button
                type="button"
                role="switch"
                aria-checked={enableBreakdown}
                onClick={toggleBreakdown}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableBreakdown ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enableBreakdown ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <label
                onClick={toggleBreakdown}
                className="cursor-pointer select-none text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5"
              >
                Question Breakdown
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    enableBreakdown
                      ? "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {enableBreakdown ? "ON" : "OFF"}
                </span>
              </label>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset("balanced")}
                className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
              >
                Balanced (K1–K4)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("foundational")}
                className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
              >
                Foundational (K1–K2)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("advanced")}
                className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
              >
                Advanced (K3–K6)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("reset")}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* 6 Cards Grid for K1..K6 */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {BLOOM_LEVELS.map((bl) => {
              const count = bloomCounts[bl.level] || 0;
              const isFilled = count > 0;
              const diff = difficultyBreakdown[bl.level] || { easy: 0, medium: 0, hard: 0 };

              return (
                <div
                  key={bl.level}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    isFilled
                      ? "border-purple-500 bg-purple-50/40 shadow-xs ring-1 ring-purple-500/20 dark:border-purple-500 dark:bg-purple-950/20"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {bl.level}
                      </span>
                      {isFilled && (
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          {count} Qs
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-900 dark:text-white">
                      {bl.shortName}
                    </div>
                    {!enableBreakdown && (
                      <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                        {bl.verbs}
                      </p>
                    )}
                  </div>

                  {!enableBreakdown ? (
                    /* Standard Stepper Input */
                    <div className="mt-3 flex items-center justify-between gap-1 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                      <button
                        type="button"
                        onClick={() => updateBloomCount(bl.level, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition dark:bg-gray-700 dark:text-gray-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={count}
                        onChange={(e) => setBloomExact(bl.level, parseInt(e.target.value) || 0)}
                        className="w-12 rounded-lg border border-gray-200 bg-gray-50 py-1 text-center text-xs font-extrabold text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => updateBloomCount(bl.level, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition dark:bg-gray-700 dark:text-gray-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    /* Difficulty Breakdown Inputs (Easy / Medium / Hard) */
                    <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5">
                      {/* Easy */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Easy
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "easy", -1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={diff.easy}
                            onChange={(e) => setDifficultyExact(bl.level, "easy", parseInt(e.target.value) || 0)}
                            className="w-8 rounded border border-gray-200 bg-gray-50 py-0.5 text-center text-[11px] font-bold text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "easy", 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          Med
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "medium", -1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={diff.medium}
                            onChange={(e) => setDifficultyExact(bl.level, "medium", parseInt(e.target.value) || 0)}
                            className="w-8 rounded border border-gray-200 bg-gray-50 py-0.5 text-center text-[11px] font-bold text-gray-900 focus:border-amber-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "medium", 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                          Hard
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "hard", -1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={diff.hard}
                            onChange={(e) => setDifficultyExact(bl.level, "hard", parseInt(e.target.value) || 0)}
                            className="w-8 rounded border border-gray-200 bg-gray-50 py-0.5 text-center text-[11px] font-bold text-gray-900 focus:border-rose-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => updateDifficultyCount(bl.level, "hard", 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 text-xs font-bold dark:bg-gray-700 dark:text-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Pedagogical Focus & Question Style (Just the 4 options) ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Step 3 (Optional)
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Pedagogical Focus & Question Style
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose one of the 4 specialized problem orientations for the generated questions.
              </p>
            </div>
          </div>

          {activePresetId && (
            <button
              type="button"
              onClick={() => setActivePresetId(null)}
              className="text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            >
              Reset Style
            </button>
          )}
        </div>

        {/* 4 Options Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PEDAGOGICAL_PRESETS.map((p) => {
              const isSelected = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePresetId(isSelected ? null : p.id)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500 dark:border-amber-500 dark:bg-amber-950/40"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="mb-2 flex w-full items-center justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {getPresetIcon(p.iconName)}
                    </div>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{p.label}</span>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Generation Action Bar ── */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-purple-50/80 p-5 shadow-sm dark:border-gray-800 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Summary Metrics */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Total Questions to Generate:
              </span>
              <span className="rounded-xl bg-purple-600 px-3 py-1 text-sm font-extrabold text-white shadow-xs">
                {totalQuestions} Questions
              </span>
              {totalQuestions > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300">
                  {Object.entries(bloomCounts)
                    .filter(([, c]) => c > 0)
                    .map(([k, c]) => (
                      <span
                        key={k}
                        className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold dark:bg-purple-900/60"
                      >
                        {k}: {c}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Scope: <strong>{totalSelectedTopicsCount} Topics</strong> & <strong>{totalSelectedSubtopicsCount} Subtopics</strong> across {selectedUnitsPayload.length} Units
              </span>
              <span>•</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExplanation}
                  onChange={(e) => setIncludeExplanation(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                />
                <span>Include Explanations</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                />
                <span>Shuffle Options</span>
              </label>
            </div>
          </div>

          {/* Right: Generate Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerateClick}
              className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-md transition-all ${
                canGenerate
                  ? "bg-purple-600 hover:bg-purple-700 active:scale-[0.98] shadow-purple-600/30"
                  : "bg-gray-300 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              {isGeneratingAI ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Generating AI Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate {totalQuestions} Questions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation hint if disabled */}
        {!canGenerate && (
          <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {totalQuestions === 0
              ? "⚠ Set at least 1 question in the Bloom's levels (Step 2) to generate."
              : totalSelectedTopicsCount === 0
              ? "⚠ Select at least 1 topic or subtopic (Step 1) to generate."
              : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedMCQGenerator;
