import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Lock,
  Loader2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";

export interface SyllabusTopicItem {
  topic_id: number;
  topic_code: string;
  topic_name: string;
  knowledge_level?: string;
  learning_sequence: number;
  unit_id: number;
  unit_number: number;
  unit_title: string;
  theory_hours: number;
  is_completed: boolean;
  completed_time: number;
  completed_at?: string;
  marked_by_id?: number;
  marked_by_name?: string;
  notes?: string;
}

interface UpdateSyllabusCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string | number;
  creatorId?: number | null;
  creatorName?: string;
  currentUser?: any;
  isCreator: boolean;
  onCompletionUpdated?: () => void;
}

const PRESET_MINUTES = [30, 45, 50, 60, 90];

export default function UpdateSyllabusCompletionModal({
  isOpen,
  onClose,
  instanceId,
  creatorId,
  creatorName,
  currentUser,
  isCreator,
  onCompletionUpdated,
}: UpdateSyllabusCompletionModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [topics, setTopics] = useState<SyllabusTopicItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | "">("");
  const [completedMinutes, setCompletedMinutes] = useState<number | "">(50);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");

  // Fetch topics and their completion status
  const fetchTopics = async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const res = await Models.course_instance.getSyllabusTopics(instanceId);
      if (res && res.topics) {
        setTopics(res.topics);
        // Pre-select first incomplete topic if available
        const firstPending = res.topics.find((t: SyllabusTopicItem) => !t.is_completed);
        if (firstPending) {
          setSelectedTopicId(firstPending.topic_id);
          setCompletedMinutes(firstPending.completed_time > 0 ? firstPending.completed_time : 50);
        } else if (res.topics.length > 0) {
          setSelectedTopicId(res.topics[0].topic_id);
          setCompletedMinutes(res.topics[0].completed_time > 0 ? res.topics[0].completed_time : 50);
        }
      }
    } catch (err) {
      console.error("Failed to load syllabus topics:", err);
      Failure(getErrorMessage(err, "Failed to load syllabus topics"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen, instanceId]);

  // Selected topic details
  const selectedTopic = useMemo(() => {
    return topics.find((t) => t.topic_id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // When selected topic changes, set default minutes
  const handleTopicChange = (topicId: number) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t.topic_id === topicId);
    if (found) {
      setCompletedMinutes(found.completed_time > 0 ? found.completed_time : 50);
      setNotes(found.notes || "");
    }
  };

  // Submit completion update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) {
      Failure(
        `Action Restricted: Strictly allowed only for the creator of this classroom (${creatorName || "Faculty"}).`
      );
      return;
    }

    if (!selectedTopicId) {
      Failure("Please select a syllabus topic.");
      return;
    }

    const minutesNum = Number(completedMinutes);
    if (isNaN(minutesNum) || minutesNum <= 0) {
      Failure("Please enter valid minutes taken to complete (greater than 0).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        topic_id: Number(selectedTopicId),
        completed_time: minutesNum,
        is_completed: true,
        notes: notes.trim() || undefined,
      };

      await Models.course_instance.updateSyllabusCompletion(instanceId, payload);
      Success("Syllabus completion marked successfully!");
      await fetchTopics();
      if (onCompletionUpdated) {
        onCompletionUpdated();
      }
    } catch (err: any) {
      console.error("Failed to update syllabus completion:", err);
      Failure(getErrorMessage(err, "Failed to update syllabus completion"));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered topics for the table
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.topic_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.unit_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "COMPLETED" && t.is_completed) ||
        (statusFilter === "PENDING" && !t.is_completed);
      return matchSearch && matchStatus;
    });
  }, [topics, searchTerm, statusFilter]);

  // Current logged in user full name
  const currentUserName = useMemo(() => {
    if (!currentUser) return "Faculty";
    const name = `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim();
    return name || currentUser.username || currentUser.email || "Faculty";
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-violet-50/50 via-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Update Syllabus Completion Status
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mark topic coverage duration (minutes) for Classroom #{instanceId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Creator Authorization Banner */}
        <div className="px-6 pt-4">
          {isCreator ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                <strong className="font-semibold">Creator Access Confirmed:</strong> You created this classroom instance and are authorized to update syllabus completion.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Strict Restriction Active:</strong> Marking syllabus completion is restricted exclusively to the classroom creator (
                <span className="font-medium underline">{creatorName || `User #${creatorId}`}</span>
                ). You can view the logged progress below in read-only mode.
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
              <p className="text-sm">Loading syllabus topics for classroom...</p>
            </div>
          ) : (
            <>
              {/* Form Section */}
              <form
                onSubmit={handleSubmit}
                className="bg-gray-50/80 dark:bg-gray-900/60 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/80 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                      Select Topic <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => handleTopicChange(Number(e.target.value))}
                      disabled={!isCreator || submitting}
                      className="w-full text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        -- Choose a topic from syllabus --
                      </option>
                      {topics.map((t) => (
                        <option key={t.topic_id} value={t.topic_id}>
                          {t.unit_number ? `Unit ${t.unit_number}: ` : ""}
                          {t.topic_code} - {t.topic_name} {t.is_completed ? `(✓ Done - ${t.completed_time}m)` : "(Pending)"}
                        </option>
                      ))}
                    </select>
                    {selectedTopic && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Unit: {selectedTopic.unit_title} | Bloom&apos;s Level:{" "}
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          {selectedTopic.knowledge_level || "K1/K2"}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Minutes Taken */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        Minutes Taken to Complete <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-gray-400">
                        (e.g., 50 min lecture)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={completedMinutes}
                        onChange={(e) =>
                          setCompletedMinutes(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        disabled={!isCreator || submitting}
                        placeholder="50"
                        className="flex-1 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                      />
                      {/* Presets */}
                      <div className="flex items-center gap-1">
                        {PRESET_MINUTES.map((m) => (
                          <button
                            type="button"
                            key={m}
                            disabled={!isCreator || submitting}
                            onClick={() => setCompletedMinutes(m)}
                            className={`px-2 py-2 text-xs rounded-lg font-medium transition ${
                              completedMinutes === m
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                            } disabled:opacity-50`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Lecture Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Topic Coverage Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!isCreator || submitting}
                    placeholder="e.g., Covered theorems 1-3 with classroom examples and numerical exercise"
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3.5 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                  />
                </div>

                {/* Action Buttons & Marked By Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700/80">
                  {/* Marked By Button / Badge */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Marked By:
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 shadow-sm cursor-default"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {currentUserName} (Creator)
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isCreator || submitting || !selectedTopicId}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Complete Topic
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Topics Completion Overview & Audit Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    All Topics for this Classroom ({topics.filter((t) => t.is_completed).length}/
                    {topics.length} Completed)
                  </h3>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search topic..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-gray-700 dark:text-gray-200"
                    >
                      <option value="ALL">All Status</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Topic</th>
                        <th className="px-3 py-2.5">Unit</th>
                        <th className="px-3 py-2.5">K-Level</th>
                        <th className="px-3 py-2.5">Time Spent</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Marked By</th>
                        {isCreator && <th className="px-3 py-2.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/40">
                      {filteredTopics.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                            No topics match your filter
                          </td>
                        </tr>
                      ) : (
                        filteredTopics.map((t) => (
                          <tr
                            key={t.topic_id}
                            className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition ${
                              selectedTopicId === t.topic_id ? "bg-violet-50/40 dark:bg-violet-950/20" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                              <span className="font-mono text-gray-400 mr-1.5">{t.topic_code}</span>
                              {t.topic_name}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                              Unit {t.unit_number}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {t.knowledge_level || "K1"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {t.is_completed ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <Clock className="w-3 h-3" />
                                  {t.completed_time} mins
                                </span>
                              ) : (
                                <span className="text-gray-400 font-normal">--</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {t.is_completed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {t.marked_by_name || (t.is_completed ? "Faculty" : "--")}
                            </td>
                            {isCreator && (
                              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleTopicChange(t.topic_id)}
                                  className="text-violet-600 hover:text-violet-800 dark:text-violet-400 font-semibold hover:underline"
                                >
                                  {t.is_completed ? "Update" : "Select"}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Topic completion durations directly inform classroom velocity and accreditation compliance.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
