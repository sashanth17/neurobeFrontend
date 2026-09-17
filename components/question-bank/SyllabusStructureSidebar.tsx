import { BookOpen, ChevronDown, ChevronRight, Layers, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface SyllabusSubtopic {
  name: string;
  count: number;
}

export interface SyllabusTopic {
  name: string;
  count: number;
  subtopics?: SyllabusSubtopic[];
}

export interface SyllabusUnit {
  label: string;
  title: string;
  count: number;
  topics: SyllabusTopic[];
}

export interface SyllabusStructureProps {
  open: boolean;
  onClose: () => void;
  courseCode: string;
  totalCount: number;
  units: SyllabusUnit[];
}

const useAnimated = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) { setClosing(false); setVisible(true); }
    else if (visible) {
      setClosing(true);
      const t = setTimeout(() => { setVisible(false); setClosing(false); }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);
  return { visible, closing };
};

const TopicRow = ({ topic }: { topic: SyllabusTopic }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-4 py-2.5 pl-9 hover:bg-gray-50 ${hasSubtopics ? "cursor-pointer" : ""}`}
        onClick={() => hasSubtopics && setExpanded((p) => !p)}
      >
        {hasSubtopics ? (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-[#000] shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-[#000] shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
        )}
        <span className="flex-1 text-sm text-[#000]">{topic.name}</span>
        <span className="text-sm text-pri">{topic.count}</span>
      </div>
      {expanded && hasSubtopics && (
        <div className="divide-y divide-gray-50 bg-gray-50">
          {topic.subtopics!.map((s) => (
            <div key={s.name} className="flex items-center gap-2 px-4 py-2 pl-14">
              <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
              <span className="flex-1 text-sm text-pri">{s.name}</span>
              <span className="text-sm text-[#000]">{s.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UnitRow = ({ unit }: { unit: SyllabusUnit }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
        onClick={() => setExpanded((p) => !p)}
      >
        {expanded
          ? <ChevronDown className="h-4 w-4 text-[#000] shrink-0" />
          : <ChevronRight className="h-4 w-4 text-[#000] shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-[#000] truncate">
          {unit.label}: {unit.title}
        </span>
        <span className="text-sm font-bold text-color2">{unit.count}</span>
      </button>
      {expanded && (
        <div className="divide-y divide-gray-50">
          {unit.topics.map((t) => (
            <TopicRow key={t.name} topic={t} />
          ))}
        </div>
      )}
    </div>
  );
};

const SyllabusStructureSidebar = ({
  open, onClose, courseCode, totalCount, units,
}: SyllabusStructureProps) => {
  const { visible, closing } = useAnimated(open);
  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{ animation: closing ? "fadeOut 0.22s ease forwards" : "fadeIn 0.22s ease" }}
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: closing ? "slideOutRight 0.22s ease forwards" : "slideInRight 0.22s ease" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-color2" />
            <div>
              <h3 className="text-base font-bold text-[#000]">Academic Structure</h3>
              <p className="mt-0.5 text-xs text-[#000]">{courseCode} syllabus hierarchy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-300 p-0.5 text-[#000] hover:text-[#000]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {/* All Course Questions */}
          <div className="flex items-center justify-between rounded-xl bg-[#ede9fe] px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-color2" />
              <span className="text-sm font-semibold text-color2">All Course Questions</span>
            </div>
            <span className="text-sm font-bold text-color2">{totalCount}</span>
          </div>

          {units.map((unit) => (
            <UnitRow key={unit.label} unit={unit} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-color2 underline"
          >
            Reset to All Questions
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default SyllabusStructureSidebar;
