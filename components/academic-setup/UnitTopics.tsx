import { useState, useEffect } from "react";
import { Trash2, Plus, X } from "lucide-react";
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
}

const UnitTopics = ({ data, onAddTopic, onDeleteTopic }: UnitTopicsProps) => {
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

  const totalHours = units.reduce((sum, u) => sum + (u.hours || 0), 0);

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

  const updateHours = (unitNumber: number, hours: number) => {
    setUnits((prev) =>
      prev.map((u) => (u.unitNumber === unitNumber ? { ...u, hours } : u))
    );
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
                  value={unit.unit_title}
                  onChange={(e) =>
                    setUnits((prev) =>
                      prev.map((u: any) =>
                        u.unit_number === unit.unit_number
                          ? { ...u, title: e.target.value }
                          : u
                      )
                    )
                  }
                  size={unit.unit_title?.length || 1}
                  className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-[#000] outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="text-pri text-sm">Hours:</span>
                  <input
                    disabled
                    type="number"
                    value={
                      unit.theory_hours + unit?.syllabus_id + unit?.lab_hours
                    }
                    onChange={(e) =>
                      updateHours(unit.unitNumber, Number(e.target.value))
                    }
                    className="w-14 rounded-lg border border-gray-200 py-1.5 text-center text-sm font-bold tabular-nums text-[#000] [appearance:textfield] dark:border-gray-600 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Topics header */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-md text-color1 py-1 font-extrabold uppercase tracking-wide dark:text-gray-300">
                  Topics ({unit.topics?.length ?? 0})
                </span>
                <button
                  onClick={() => openModal( unit)}
                  className="text-green flex items-center gap-1 text-sm font-semibold hover:text-green-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Topic
                </button>
              </div>

              {/* Topic list */}
              <div className="space-y-2">
                {unit.topics?.map((topic, index) => (
                  <div
                    key={topic.id ?? index}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
                  >
                    <span className="w-8 shrink-0 text-xs font-semibold text-[#000]">
                      {topic.topic_code ?? topic.id}
                    </span>
                    <span className="flex-1 text-sm text-[#000] dark:text-gray-300">
                      {topic.topic_name}
                    </span>
                    <button
                      onClick={() => deleteTopic(unit.unitNumber, topic.id)}
                      className="text-color1 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default UnitTopics;
