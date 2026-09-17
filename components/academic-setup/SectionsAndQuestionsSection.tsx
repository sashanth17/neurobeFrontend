import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Settings, Settings2, Sparkles, Trash2, Edit3, Check } from "lucide-react";
import IconPlus from "@/components/Icon/IconPlus";
import { AddQuestionModal, GenerateQuestionsModal } from "@/components/academic-setup/CIAQuestionModals";
import TextInput from "@/components/FormFields/TextInput.component";

export interface CIAQuestion {
  id: string;
  text: string;
  marks: number;
  coTag?: string;
  bloomLevel?: string;
  topic?: string;
}
export interface CIASection {
  id: string;
  title: string;
  totalMarks: number;
  usedMarks: number;
  questions: CIAQuestion[];
}

interface SectionsAndQuestionsSectionProps {
  sections: CIASection[];
  onAddSection: () => void;
  onGenerateQuestions?: (sectionId: string) => void;
  onAddQuestion?: (sectionId: string) => void;
  onSectionSettings?: (sectionId: string) => void;
  onSectionsChange?: (sections: CIASection[]) => void;
}

const SectionsAndQuestionsSection = ({
  sections,
  onAddSection,
  onSectionSettings,
  onSectionsChange,
}: SectionsAndQuestionsSectionProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [settingsOpenFor, setSettingsOpenFor] = useState<string | null>(null);
  // draft values while settings panel is open
  const [settingsDraft, setSettingsDraft] = useState<Record<string, { title: string; totalMarks: number }>>({});

  const openSettings = (section: CIASection) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [section.id]: { title: section.title, totalMarks: section.totalMarks },
    }));
    setSettingsOpenFor(section.id);
    // ensure section is expanded when settings open
    setExpandedSections((prev:any) => new Set([...prev, section.id]));
  };

  const closeSettings = (sectionId: string) => {
    const draft = settingsDraft[sectionId];
    if (draft) {
      const updated = sections.map((s) =>
        s.id === sectionId ? { ...s, title: draft.title, totalMarks: draft.totalMarks } : s,
      );
      onSectionsChange?.(updated);
    }
    setSettingsOpenFor(null);
  };

  const updateDraft = (sectionId: string, field: "title" | "totalMarks", value: string | number) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [field]: value },
    }));
  };
  const [addModal, setAddModal] = useState<{ open: boolean; sectionId: string; sectionTitle: string; qNo: number }>({
    open: false, sectionId: "", sectionTitle: "", qNo: 1,
  });
  const [generateModal, setGenerateModal] = useState<{ open: boolean; sectionId: string; sectionTitle: string; totalMarks: number }>({
    open: false, sectionId: "", sectionTitle: "", totalMarks: 20,
  });

  const openAdd = (section: CIASection) =>
    setAddModal({ open: true, sectionId: section.id, sectionTitle: section.title, qNo: section.questions.length + 1 });

  const openGenerate = (section: CIASection) =>
    setGenerateModal({ open: true, sectionId: section.id, sectionTitle: section.title, totalMarks: section.totalMarks });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddQuestions = (sectionId: string, newQuestions: any[]) => {
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const mapped: CIAQuestion[] = newQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        marks: q.marks,
        coTag: q.coTag ?? q.co,          // GenerateModal uses .co
        bloomLevel: q.bloomLevel ?? q.kl, // GenerateModal uses .kl
        topic: q.topic,
      }));
      const merged = [...s.questions, ...mapped];
      const usedMarks = merged.reduce((sum, q) => sum + q.marks, 0);
      return { ...s, questions: merged, usedMarks };
    });
    onSectionsChange?.(updated);
    setGenerateModal((p) => ({ ...p, open: false }));
  };

  const handleDeleteQuestion = (sectionId: string, questionId: string) => {
    const updated = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const filtered = s.questions.filter((q) => q.id !== questionId);
      return { ...s, questions: filtered, usedMarks: filtered.reduce((sum, q) => sum + q.marks, 0) };
    });
    onSectionsChange?.(updated);
  };

  return (
    <div className="panel mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="section-ti">2. Sections &amp; Questions</h3>
          <p className="mt-0.5 text-xs text-pri">
            Allocate marks per section and compose syllabus-aligned questions.
          </p>
        </div>
        <button type="button" onClick={onAddSection} className="create-btn-sec flex items-center gap-1.5">
          <IconPlus className="h-3.5 w-3.5" /> Add Section
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((section, sIdx) => {
          const isExpanded = expandedSections.has(section.id);
          const isSettingsOpen = settingsOpenFor === section.id;
          const draft = settingsDraft[section.id];
          const isComplete = section.usedMarks >= section.totalMarks;
          const letter = String.fromCharCode(65 + sIdx);
          const qCount = section.questions.length;
          const marksUsed = `${section.usedMarks} / ${section.totalMarks}`;

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-gray-200/70 bg-[#FAF9FF]/40 p-4 md:p-5 space-y-3 dark:border-gray-800 dark:bg-gray-800/30"
            >
              {/* Section Header Bar */}
              <div className={`flex flex-wrap items-center justify-between gap-4 ${isExpanded ? "-mx-4 md:-mx-5 px-4 md:px-5 border-b border-gray-200/80 pb-4 dark:border-gray-800" : ""}`}>
                {/* Left: chevron, letter badge, title, marks pill, settings btn */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="text-gray-400 hover:text-[#000] dark:hover:text-gray-200 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  <span className="h-7 w-7 rounded-full bg-color2 text-white font-bold text-xs md:text-sm flex items-center justify-center shrink-0">
                    {letter}
                  </span>

                  <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
                    {section.title}
                  </h3>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    {section.totalMarks} Marks
                  </span>

                  <button
                    type="button"
                    onClick={() => isSettingsOpen ? closeSettings(section.id) : openSettings(section)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-2xs transition-all ${isSettingsOpen
                        ? "border-color2 bg-color2-l text-color2"
                        : "border-gray-200 bg-white text-[#000] hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="font-bold">Section Settings</span>
                  </button>
                </div>

                {/* Right: questions count, marks used, complete/remaining, delete */}
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                  <span className="font-semibold text-pri dark:text-gray-400">
                    Questions: <strong className="font-bold text-[#000] dark:text-white">{qCount}</strong>
                  </span>

                  <span className="text-gray-300 dark:text-[#000]">|</span>

                  <span className="font-semibold text-pri dark:text-gray-400">
                    Marks Used: <strong className="font-bold text-[#000] dark:text-white">{marksUsed}</strong>
                  </span>

                  {isComplete ? (
                    <span className="flex items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <Check className="h-3.5 w-3.5" /> Complete
                    </span>
                  ) : (
                    <span className="font-bold text-red-500 text-xs md:text-sm">
                      {section.totalMarks - section.usedMarks} Marks Remaining
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const updated = sections.filter((s) => s.id !== section.id);
                      onSectionsChange?.(updated);
                    }}
                    className="text-color1 hover:text-red-500 transition-colors p-1"
                    title="Delete Section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Inline Section Settings panel ── */}
              {isSettingsOpen && draft && (
                <div className="rounded-xl border border-color2/20 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-color2">
                      <Settings2 className="h-3.5 w-3.5" />
                      Section {letter} Settings
                    </span>
                    <button
                      type="button"
                      onClick={() => closeSettings(section.id)}
                      className="text-sm font-semibold text-color2 hover:underline"
                    >
                      Done
                    </button>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <TextInput
                        title="Section Title"
                        value={draft.title}
                        onChange={(e) => updateDraft(section.id, "title", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <TextInput
                        title="Section Marks Allocation"
                        type="number"
                        min={0}
                        value={draft.totalMarks}
                        onChange={(e) => updateDraft(section.id, "totalMarks", Number(e.target.value))}
                        rightIcon={
                          <div className="flex flex-col">
                            <button type="button" onClick={() => updateDraft(section.id, "totalMarks", draft.totalMarks + 1)} className="flex h-5 items-center justify-center text-[10px] text-[#000] hover:text-[#000]">▲</button>
                            <button type="button" onClick={() => updateDraft(section.id, "totalMarks", Math.max(0, draft.totalMarks - 1))} className="flex h-5 items-center justify-center text-[10px] text-[#000] hover:text-[#000]">▼</button>
                          </div>
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Collapsible Questions Body */}
              {isExpanded && (
                <div className="space-y-4 pt-1">
                  {section.questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
                      <p className="text-sm font-semibold text-[#000] dark:text-white">No questions added yet.</p>
                      <p className="mt-0.5 text-xs text-pri">Target for Section {letter} is {section.totalMarks} marks.</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openGenerate(section)}
                          className="inline-flex items-center gap-2 rounded-xl bg-color2 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
                        >
                          <Sparkles className="h-4 w-4 fill-white/20" /> Generate Questions
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdd(section)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <Plus className="h-4 w-4 text-color1" /> Add Question
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Questions List */}
                      <div className="space-y-3.5">
                        {section.questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-xs hover:border-gray-200 transition-all dark:border-gray-800 dark:bg-gray-900 flex items-start justify-between gap-4"
                          >
                            {/* Question Content */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <span className="inline-flex items-center justify-center rounded-lg bg-[#F1F5F9] px-2 py-0.5 text-sm font-bold text-color1 shrink-0 dark:bg-gray-800 dark:text-white">
                                  Q{idx + 1}
                                </span>
                                <p className="text-sm md:text-base font-bold text-[#000] dark:text-white leading-snug">
                                  {q.text}
                                </p>
                              </div>

                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm md:pl-7">
                                {q.coTag && (
                                  <span className="rounded-full bg-purple-100/90 px-2.5 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                    {q.coTag}
                                  </span>
                                )}
                                {q.bloomLevel && (
                                  <span className="rounded-full bg-purple-100/90 px-2.5 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                    {q.bloomLevel}
                                  </span>
                                )}
                                <span className="rounded-full border border-gray-200 bg-gray-50/80 px-3 py-0.5 font-bold text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  {q.marks} Marks
                                </span>
                                {q.topic && (
                                  <>
                                    <span className="text-gray-300 dark:text-[#000] font-light">|</span>
                                    <span className="font-semibold text-pri text-sm dark:text-gray-400">
                                      Topic:{" "}
                                      <span className="font-bold text-color1 dark:text-gray-200">{q.topic}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Question Action Icons */}
                            <div className="flex items-center gap-2 shrink-0 pt-1">
                              <button
                                type="button"
                                className="text-color1 hover:text-[#000] dark:hover:text-gray-200 transition-colors p-1"
                                title="Edit Question"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(section.id, q.id)}
                                className="text-color1 hover:text-red-500 transition-colors p-1"
                                title="Delete Question"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Section Footer Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => openAdd(section)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs md:text-sm font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <Plus className="h-4 w-4 text-color1 dark:text-gray-400" />
                          <span className="font-bold text-color1">Add Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openGenerate(section)}
                          className="inline-flex items-center gap-2 rounded-xl bg-color2 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
                        >
                          <Sparkles className="h-4 w-4 fill-white/20" />
                          <span>Generate More Questions</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
            <p className="text-sm font-semibold text-[#000] dark:text-white">No sections added yet.</p>
            <p className="mt-0.5 text-xs text-pri">Click "Add Section" to get started.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddQuestionModal
        open={addModal.open}
        onClose={() => setAddModal((p) => ({ ...p, open: false }))}
        sectionTitle={addModal.sectionTitle}
        questionNumber={addModal.qNo}
      />
      <GenerateQuestionsModal
        open={generateModal.open}
        onClose={() => setGenerateModal((p) => ({ ...p, open: false }))}
        sectionTitle={generateModal.sectionTitle}
        sectionType="Short Answer Questions"
        targetMarks={generateModal.totalMarks}
        onAddQuestions={(qs) => handleAddQuestions(generateModal.sectionId, qs)}
      />
    </div>
  );
};

export default SectionsAndQuestionsSection;
