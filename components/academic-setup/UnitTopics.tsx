import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { capitalizeFLetter } from "@/utils/function.utils";

interface Topic {
  id: number;
  topicId?: string;
  title: string;
}

interface Unit {
  unitNumber: number;
  title: string;
  hours: number;
  topics: Topic[];
}

interface UnitTopicsProps {
  data?: Unit[];
  onAddTopic?: (
    unitNumber: number,
    body: { topic_code: string; topic_name: string ,learning_sequence:any}
  ) => Promise<void>;
  onDeleteTopic?: any;
  onUpdateHours?: (unitId: number, hours: number) => Promise<void>;
  onUpdateUnitTitle?: (unitId: number, title: string) => Promise<void>;
}

const UnitTopics = ({ data, onAddTopic, onDeleteTopic, onUpdateHours, onUpdateUnitTitle }: UnitTopicsProps) => {
  const [units, setUnits] = useState<Unit[]>(data || []);
  console.log("✌️data --->", data);

  // modal state
  const [modal, setModal] = useState<{
    open: boolean;
    unit_number: number | null;
    unitId: number | null;
  }>({ open: false, unit_number: null, unitId: null });
  const [topicCode, setTopicCode] = useState("");
  const [topicName, setTopicName] = useState("");
  const [learningSequence, setLearningSequence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unitData, setUnitData] = useState("");

  useEffect(() => {
    if (data && data.length > 0) setUnits(data);
  }, [data]);

  const totalHours = units.reduce((sum, u: any) => sum + Number(u.theory_hours ?? u.hours ?? 0), 0);

  const openModal = (unit: any) => {
    setTopicCode("");

    setTopicName("");
    setLearningSequence("");
    setModal({ open: true, unit_number:unit?.unit_number, unitId: unit.id });
    setUnitData(unit);
  };

  const closeModal = () => {
    setModal({ open: false, unit_number: null, unitId: null });
    setTopicCode("");
    setTopicName("");
    setLearningSequence("");
  };

  const handleSubmit = async () => {
    if (!topicName.trim()) return;
    setSubmitting(true);
    try {
      
      if (onAddTopic && modal.unitId != null) {
        await onAddTopic(modal.unitId, {
          topic_code: topicCode.trim(),
          topic_name: capitalizeFLetter(topicName.trim()),
          learning_sequence: Number(learningSequence) || 1,
        });
        closeModal();
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTopic = (unitNumber: number, topicId: number) => {
    onDeleteTopic(topicId);
    setUnits((prev) =>
      prev.map((u) =>
        u.unitNumber === unitNumber
          ? { ...u, topics: u.topics.filter((t) => t.id !== topicId) }
          : u
      )
    );
  };

  const updateHours = (unit: any, hours: number) => {
    setUnits((prev: any) =>
      prev.map((u: any) =>
        u.id === unit.id || (unit.unit_number && u.unit_number === unit.unit_number)
          ? { ...u, theory_hours: hours, hours }
          : u
      )
    );
    if (onUpdateHours && unit.id != null) {
      onUpdateHours(unit.id, hours);
    }
  };

  const updateTitle = (unit: any, title: string) => {
    setUnits((prev: any) =>
      prev.map((u: any) =>
        u.id === unit.id || (unit.unit_number && u.unit_number === unit.unit_number)
          ? { ...u, unit_title: title, title }
          : u
      )
    );
    if (onUpdateUnitTitle && unit.id != null) {
      onUpdateUnitTitle(unit.id, title);
    }
  };

  if (!units || units.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-[#000]">No unit topics available.</p>
      </div>
    );
  }

  return (
    <>
      {/* Add Topic Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#000] dark:text-white">
                Add Topic — Unit {String(modal.unit_number).padStart(2, "0")}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-[#000]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#000]">
                  Topic Code
                </label>
                <input
                  value={topicCode}
                  onChange={(e) => setTopicCode(e.target.value)}
                  placeholder="e.g. 1.6"
                  className="focus:border-color2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#000] outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#000]">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="Enter topic name"
                  className="focus:border-color2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#000] outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              {/* <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#000]">
                  Learning Sequence <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={learningSequence}
                  onChange={(e) => setLearningSequence(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  min="1"
                  className="focus:border-color2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#000] outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div> */}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="text-pri rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !topicName.trim()}
                className="bg-color2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {submitting && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <span className="bg-primary2 text-color2 mt-0.5 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold">
              3
            </span>
            <div>
              <h3 className="text-color1 text-sm font-extrabold uppercase tracking-wide dark:text-white">
                Unit Titles, Hours & Topics
              </h3>
              <p className="mt-0.5 text-xs text-[#000]">
                Curriculum units with lecture topic sequences.
              </p>
            </div>
          </div>
          <span className="self-center whitespace-nowrap text-sm font-bold text-[#000] dark:text-gray-200">
            {units?.length} Units • {totalHours} Total Hours
          </span>
        </div>

        <div className="space-y-4">
          {units.map((unit: any) => (
            <div
              key={unit.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              {/* Unit row */}
              <div className="mb-3 flex items-center gap-3">
                <span className="btn-green whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold text-white">
                  Unit {String(unit.unit_number).padStart(2, "0")}
                </span>
                <input
                  value={unit.unit_title ?? unit.title ?? ""}
                  onChange={(e) => updateTitle(unit, e.target.value)}
                  size={unit.unit_title?.length || unit.title?.length || 1}
                  className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-[#000] outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="text-pri text-sm font-semibold">Hours:</span>
                  <input
                    type="number"
                    min="0"
                    value={Number(unit.theory_hours ?? unit.hours ?? 0)}
                    onChange={(e) =>
                      updateHours(unit, Math.max(0, Number(e.target.value)))
                    }
                    className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-sm font-bold tabular-nums text-[#000] focus:border-color2 focus:ring-1 focus:ring-color2 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Topics header — read-only in Syllabus units view */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-md text-color1 py-1 font-extrabold uppercase tracking-wide dark:text-gray-300">
                  Topics ({unit.topics?.length ?? 0})
                </span>
              </div>

              {/* Topic list — display only */}
              <div className="space-y-2">
                {(!unit.topics || unit.topics.length === 0) ? (
                  <p className="py-2 text-xs text-gray-400 italic">No topics listed for this unit.</p>
                ) : (
                  unit.topics.map((topic: any, index: number) => (
                    <div
                      key={topic.id ?? index}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
                    >
                      <span className="w-8 shrink-0 text-xs font-semibold text-[#000] dark:text-gray-300">
                        {topic.topic_code ?? topic.topicId ?? topic.id}
                      </span>
                      <span className="flex-1 text-sm text-[#000] dark:text-gray-300">
                        {topic.topic_name ?? topic.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {(!units || units.length === 0) && (
            <p className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
              No curriculum units found in this syllabus.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default UnitTopics;
