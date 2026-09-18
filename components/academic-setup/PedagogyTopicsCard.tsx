import React, { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export interface PedagogyTopicItem {
  code: string;
  title: string;
  description?: string;
  bloomLevel: string;
  hoursText: string;
  teachingApproaches: string[];
}

export interface PedagogyUnitData {
  id: string;
  unitNumber: number;
  unitCodeText: string;
  title: string;
  hoursText: string;
  topicsCountText: string;
  topics: PedagogyTopicItem[];
}

export interface PedagogyTopicsCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  units?: PedagogyUnitData[];
  className?: string;
}

const PedagogyTopicsCard: React.FC<PedagogyTopicsCardProps> = ({
  title = "TEACHING APPROACHES OF TOPICS",
  subtitle = "Approved teaching methods for each topic in the course.",
  headerStatsText,
  units = [],
  className = "",
}) => {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUnit = (id: string) => {
    setOpenUnits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allOpened: Record<string, boolean> = {};
    units.forEach((u) => {
      allOpened[u.id] = true;
    });
    setOpenUnits(allOpened);
  };

  const handleCollapseAll = () => {
    setOpenUnits({});
  };

  const filteredUnits = units
    .map((unit) => {
      if (!searchQuery.trim()) return unit;
      const q = searchQuery.toLowerCase();
      const unitMatches =
        unit.title.toLowerCase().includes(q) ||
        unit.unitCodeText.toLowerCase().includes(q);

      const matchingTopics = unit.topics.filter((topic) => {
        const topicMatches =
          topic.title.toLowerCase().includes(q) ||
          topic.code.toLowerCase().includes(q) ||
          topic.bloomLevel.toLowerCase().includes(q) ||
          (topic.description && topic.description.toLowerCase().includes(q));
        const approachMatches = topic.teachingApproaches?.some((app) =>
          app.toLowerCase().includes(q)
        );
        return topicMatches || approachMatches;
      });

      if (unitMatches || matchingTopics.length > 0) {
        return {
          ...unit,
          topics: unitMatches ? unit.topics : matchingTopics,
        };
      }
      return null;
    })
    .filter(Boolean) as PedagogyUnitData[];

  return (
    <div className={`space-y-4 ${className} panel p-5`}>
      {/* Top Heading Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shrink-0" />
            <span className="font-bold text-[#1e1b4b] dark:text-white">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-pri dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <span className="text-xs sm:text-sm font-bold text-[#1e1b4b] dark:text-white shrink-0">
          {headerStatsText || `${units.length} Unit${units.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Toolbar Controls: Search Box + Expand / Collapse */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1 px-1">
        <div className="relative flex items-center w-64 sm:w-72">
          <Search className="absolute left-3.5 h-4 w-4 text-[#000] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white shadow-2xs outline-none transition-all focus:border-[#7c3aed] dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center font-bold gap-2 text-xs sm:text-sm shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-pri hover:text-color2 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-300 dark:text-[#000]">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="text-color2 font-bold hover:underline transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion Units List */}
      <div className="space-y-3">
        {filteredUnits.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No approved pedagogy suggestions available for this course.
          </div>
        ) : (
          filteredUnits.map((unit) => {
          const isOpen = Boolean(openUnits[unit.id] || searchQuery.trim());
          return (
            <div
              key={unit.id}
              className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden transition-all"
            >
              {/* Unit Accordion Bar */}
              <button
                type="button"
                onClick={() => toggleUnit(unit.id)}
                className={`w-full flex items-center justify-between gap-4 p-4 sm:px-5 text-left outline-none transition-colors ${isOpen
                    ? "bg-[#fcfaff] border-b border-gray-100 dark:bg-purple-950/20 dark:border-gray-800"
                    : "hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-color2 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#000] shrink-0" />
                  )}

                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold truncate">
                    <span className="text-color2 font-bold shrink-0">
                      {unit.unitCodeText}
                    </span>
                    <span className="text-gray-200 dark:text-[#000] shrink-0">
                      |
                    </span>
                    <span className="text-[#000] dark:text-white font-bold truncate">
                      {unit.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0">
                  <span className="text-pri font-medium">{unit.hoursText}</span>
                  <span className="text-pri dark:text-[#000]">•</span>
                  <span className="text-color2">{unit.topicsCountText}</span>
                </div>
              </button>

              {/* Expanded Unit Content */}
              {isOpen && (
                <div className="space-y-3 p-2">
                  {unit.topics.map((topic) => (
                    <div
                      key={topic.code}
                      className="rounded-2xl border border-gray-300 bg-white p-4.5 sm:p-5 dark:border-gray-800 dark:bg-gray-800/40 shadow-2xs"
                    >
                      {/* Main Topic Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                            {topic.code}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-[#000] dark:text-white leading-snug">
                            {topic.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-[#000] dark:bg-gray-800 dark:text-gray-300">
                            {topic.hoursText}
                          </span>
                          <span className="rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                            {topic.bloomLevel.startsWith("Knowledge")
                              ? topic.bloomLevel
                              : `Knowledge Level: ${topic.bloomLevel}`}
                          </span>
                        </div>
                      </div>

                      {/* Teaching Approaches List */}
                      {topic.teachingApproaches &&
                        topic.teachingApproaches.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-gray-100/80 dark:border-gray-800">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-pri mb-2">
                              TEACHING APPROACHES
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {topic.teachingApproaches.map((approach, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg bg-[#f5f3ff] px-3 py-1.5 text-xs font-semibold text-[#000] border border-purple-100/60 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-300"
                                >
                                  {approach}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PedagogyTopicsCard;
