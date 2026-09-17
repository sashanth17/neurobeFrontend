import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";

interface SubTopic {
  subtopic_code: string;
  subtopic_name: string;
  id: number;
  topic_id: number;
  micro_topics?: any[];
}

interface Topic {
  topic_code: string;
  topic_name: string;
  topic_description: string;
  knowledge_level: string;
  learning_sequence: number;
  id: number;
  unit_id: number;
  suggested_pedagogies?: any[];
  subtopics: SubTopic[];
  dependencies?: any[];
}

interface Unit {
  unit_number: number;
  unit_title: string;
  theory_hours: number;
  lab_hours: number;
  unit_overview?: string;
  id: number;
  syllabus_id: number;
  topics: Topic[];
}

interface UnitTopicsSummaryProps {
  units?: Unit[];
}

const UnitTopicsSummary = ({ units = [] }: UnitTopicsSummaryProps) => {
  const [activeUnit, setActiveUnit] = useState(0);
  const [expandedTopics, setExpandedTopics] = useState<number[]>([]);

  if (!units || units.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-center text-gray-500 dark:text-gray-400">No units available</p>
      </div>
    );
  }

  const totalHours = units.reduce((sum, u) => sum + (u.theory_hours || 0) + (u.lab_hours || 0), 0);
  const unit = units[activeUnit];

  const toggleTopic = (topicId: number) => {
    setExpandedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Parse topic_description to extract metadata
  const parseTopicDescription = (desc: string) => {
    if (!desc) return {};
    const parts: any = {};
    const matches = desc.match(/(\w+):([^|]+)/g);
    if (matches) {
      matches.forEach((match) => {
        const [key, value] = match.split(":");
        parts[key.trim()] = value.trim();
      });
    }
    return parts;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
            <Layers className="text-color2 h-4.5 w-4.5" />
          </div>
          <h3 className="text-lg font-bold text-color dark:text-white">Units & Topics</h3>
        </div>
        <span className="text-sm font-semibold text-[#000] dark:text-gray-300">
          {units.length} Units • {totalHours} Hours
        </span>
      </div>

      {/* Unit cards row */}
      <div className="mb-4 grid grid-cols-5 gap-3">
        {units.map((u, i) => (
          <button
            key={u.id}
            onClick={() => {
              setActiveUnit(i);
              setExpandedTopics([]);
            }}
            className={`rounded-xl border p-3 text-left transition-all ${
              i === activeUnit
                ? "border-color2 bg-purple-50 dark:bg-purple-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${i === activeUnit ? "text-color2" : "text-pri"}`}>
                Unit {u.unit_number}
              </span>
              <span className={`text-xs text-color2 font-semibold`}>
                {(u.theory_hours || 0) + (u.lab_hours || 0)}h
              </span>
            </div>
            <p className={`mt-1 text-xs font-medium leading-snug ${i === activeUnit ? "text-color2" : "text-[#000] dark:text-gray-300"}`}>
              {u.unit_title}
            </p>
          </button>
        ))}
      </div>

      {/* Topics detail */}
      <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-color2">Unit {unit.unit_number}</p>
            <p className="text-lg font-bold text-[#000] dark:text-white">{unit.unit_title}</p>
          </div>
          <span className="rounded-full border border-purple-200 px-3 py-1 text-xs font-semibold text-color2 bg-color2-l">
            {unit.theory_hours}h Theory • {unit.lab_hours}h Lab
          </span>
        </div>
        <p className="mb-3 text-sm font-bold text-color">Topics ({unit.topics.length})</p>
        <div className="space-y-2">
          {unit.topics.map((topic) => {
            const isExpanded = expandedTopics.includes(topic.id);
            const meta = parseTopicDescription(topic.topic_description);

            return (
              <div key={topic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full bg-white dark:bg-gray-900 px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-purple-50 text-xs font-bold text-color2">
                      {topic.topic_code}
                    </span>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-[#000] dark:text-gray-200">{topic.topic_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-gray-600 dark:text-gray-400">
                          {topic.knowledge_level}
                        </span>
                        {/* {meta.hours && (
                          <span className="rounded bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 text-blue-600 dark:text-blue-400 font-semibold">
                            {meta.hours}
                          </span>
                        )} */}
                        {/* {meta.status && (
                          <span className="rounded bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 text-yellow-600 dark:text-yellow-400 text-xs">
                            {meta.status}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>
                  {/* <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  /> */}
                </button>

                {/* Subtopics Expanded */}
                {isExpanded && topic.subtopics.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50 p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Subtopics ({topic.subtopics.length})
                    </p>
                    {topic.subtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 p-2"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                          {subtopic.subtopic_code}
                        </span>
                        <span className="text-sm text-[#000] dark:text-gray-300 flex-1">{subtopic.subtopic_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UnitTopicsSummary;
