import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown, Sparkles, X } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";
import { EditQuestionModal } from "@/components/question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import { CreateQuestionSetModal } from "@/components/question-bank/CreateQuestionSetModal";

import {
  CourseItem,
  MCQQuestion,
  TopicRow,
  FALLBACK_COURSES,
  UNITS_CONFIG,
  newRow,
  normalizeMCQ,
  MCQStatsBanner,
  MCQStudioWorkspace,
} from "@/components/mcq-generation";

const MCQGenerationStudioPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    courses: [] as CourseItem[],
    selectedCourse: null as CourseItem | null,
    courseUnits: [] as any[],

    topicRows: [newRow()] as TopicRow[],
    breakdown: {
      K1: { easy: 0, medium: 1, hard: 0 },
      K2: { easy: 0, medium: 2, hard: 0 },
      K3: { easy: 0, medium: 1, hard: 0 },
      K4: { easy: 0, medium: 1, hard: 0 },
    } as Record<string, Record<string, number>>,

    marksPerQuestion: "2",
    courseQuestions: [] as MCQQuestion[],
    selectedBannerFilter: "recent" as "recent" | "all" | "approved" | "archived" | "review" | "drafted",
    recentQuestionIds: [] as string[],
    isGeneratingAI: false,
    generationToast: null as null | { type: "success" | "error"; msg: string },

    expandedQuestionIds: [] as string[],
    isEditModalOpen: false,
    editingQuestion: null as MCQQuestion | null,
    viewQuestion: null as MCQQuestion | null,
    isViewModalOpen: false,
    isSetModalOpen: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("AI MCQ Generation Studio"));
    fetchAssignedCourses();
  }, [dispatch]);

  const fetchAssignedCourses = async () => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const body = { faculty_id: user?.id || 1, coordinator_id: user?.id || 1 };
      const res: any = await Models.course.faculty_dashboard_overview(body).catch(() => null);
      const raw = res?.courses || res?.data || res || [];
      let formatted: CourseItem[] = FALLBACK_COURSES;
      if (Array.isArray(raw) && raw.length > 0) {
        formatted = raw.map((c: any, idx: number) => ({
          id: c.id || c.course_id || `c-${idx}`,
          code: c.code || c.course_code || `COURSE${idx}`,
          title: c.title || c.course_title || "Academic Course",
          programme: c.programme || "B.Tech CSE",
          batch: c.batch_name || c.batch || "2024–2028",
          semester: c.semester || c.term || "Semester 5",
          students_count: c.students_count || c.enrolled_students_count || 45,
          role: c.role || "Course Instructor",
          role_type: c.role_type || "instructor",
          questions_count: 20 + idx * 6,
          approved_questions_count: 15 + idx * 4,
          units_count: 5,
        }));
      }
      setState({ courses: formatted });

      // Match target course from query
      const cid = router.query.course_id;
      const matched = cid
        ? formatted.find(
            (c) =>
              String(c.id) === String(cid) ||
              String(c.code).toLowerCase() === String(cid).toLowerCase() ||
              String(c.course_code).toLowerCase() === String(cid).toLowerCase()
          )
        : formatted[0];

      if (matched) {
        setState({ selectedCourse: matched });
        fetchCourseUnits(matched.id);
        fetchQuestions(matched.code || matched.id);
      }
    } catch {
      setState({ courses: FALLBACK_COURSES });
    }
  };

  const fetchQuestions = async (courseKey: string | number) => {
    try {
      const res: any = await Models.mcq.history_questions({ course_id: courseKey }).catch(() => null);
      let rawList: any[] = [];
      if (res) {
        if (Array.isArray(res)) rawList = res;
        else if (res.items && Array.isArray(res.items)) rawList = res.items;
        else if (res.questions && Array.isArray(res.questions)) rawList = res.questions;
        else if (res.data && Array.isArray(res.data)) rawList = res.data;
      }
      const fetched: MCQQuestion[] = rawList.map((item, idx) => normalizeMCQ(item, idx));
      setState({ courseQuestions: fetched });
    } catch (err) {
      console.error("fetchQuestions error:", err);
    }
  };

  const fetchCourseUnits = async (courseId: string | number) => {
    try {
      const res: any = await Models.syllabus.get_units(courseId, { topic_status: "approved" });
      const arr = Array.isArray(res) ? res : res?.units || [];
      if (arr.length > 0) {
        const mapped = arr.map((u: any, idx: number) => ({
          unitId: u.id || idx + 1,
          label: `Unit ${u.unit_number || idx + 1}`,
          title: u.unit_title || u.title || u.name || `Unit ${idx + 1}`,
          topics: u.topics ? u.topics.map((t: any) => t.topic_name || t.title || t.name || t) : ["General Topic"],
        }));
        setState({ courseUnits: mapped });
      } else {
        setState({ courseUnits: UNITS_CONFIG });
      }
    } catch {
      setState({ courseUnits: UNITS_CONFIG });
    }
  };

  const activeUnits = state.courseUnits.length > 0 ? state.courseUnits : UNITS_CONFIG;
  const currentCourseKey = state.selectedCourse?.code || state.selectedCourse?.course_code || "";
  const currentQuestions = state.courseQuestions || [];

  const totalBreakdown: number = Object.values(state.breakdown || {}).reduce<number>(
    (sum: number, diffObj: any) =>
      sum +
      Object.values(diffObj || {}).reduce<number>((s: number, v: any) => s + (Number(v) || 0), 0),
    0
  );
  const totalTopicQuestions = state.topicRows.reduce((s, r) => s + (Number(r.questionCount) || 0), 0);
  const breakdownValid = totalBreakdown === totalTopicQuestions;

  const displayedQuestions = React.useMemo(() => {
    let list = currentQuestions;
    if (state.selectedBannerFilter === "recent") {
      if (state.recentQuestionIds && state.recentQuestionIds.length > 0) {
        list = currentQuestions.filter((q) => state.recentQuestionIds.includes(q.id));
      } else {
        list = currentQuestions.slice(0, 10);
      }
    } else if (state.selectedBannerFilter === "approved") {
      list = currentQuestions.filter((q) => (q.status || "").toLowerCase() === "approved");
    } else if (state.selectedBannerFilter === "archived") {
      list = currentQuestions.filter((q) => (q.status || "").toLowerCase() === "archived");
    } else if (state.selectedBannerFilter === "review") {
      list = currentQuestions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "need review" || s === "review";
      });
    } else if (state.selectedBannerFilter === "drafted") {
      list = currentQuestions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "drafted" || s === "draft";
      });
    }
    return list;
  }, [currentQuestions, state.selectedBannerFilter, state.recentQuestionIds]);

  const addTopicRow = () => setState({ topicRows: [...state.topicRows, newRow()] });
  const removeTopicRow = (id: string) => {
    if (state.topicRows.length === 1) return;
    setState({ topicRows: state.topicRows.filter((r) => r.id !== id) });
  };
  const updateRow = (id: string, patch: Partial<TopicRow>) => {
    setState({
      topicRows: state.topicRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        if (patch.unitId !== undefined) {
          const unit = activeUnits.find((u) => String(u.unitId) === String(patch.unitId));
          updated.topicName = unit?.topics?.[0] || "";
        }
        return updated;
      }),
    });
  };

  const updateBreakdown = (kLevel: string, diff: string, value: number) => {
    setState({
      breakdown: {
        ...state.breakdown,
        [kLevel]: { ...state.breakdown[kLevel], [diff]: Math.max(0, value) },
      },
    });
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setState({ generationToast: { type, msg } });
    setTimeout(() => setState({ generationToast: null }), 5000);
  };

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res: any = await Models.mcq.status(jobId);
        if (res.status === "completed" || res.status === "complete") {
          clearInterval(interval);
          setState({ isGeneratingAI: false });
          if (state.selectedCourse) {
            const courseKey = state.selectedCourse.code || state.selectedCourse.id;
            const existingIds = new Set(currentQuestions.map((q) => q.id));
            const freshRes: any = await Models.mcq
              .history_questions({ course_id: courseKey, limit: 100 })
              .catch(() => null);
            let rawList: any[] = [];
            if (freshRes) {
              if (Array.isArray(freshRes)) rawList = freshRes;
              else if (freshRes.items) rawList = freshRes.items;
              else if (freshRes.questions) rawList = freshRes.questions;
              else if (freshRes.data) rawList = freshRes.data;
            }
            const fetched: MCQQuestion[] = rawList.map((item, idx) => normalizeMCQ(item, idx));
            const newlyCreated = fetched.filter((q) => !existingIds.has(q.id)).map((q) => q.id);
            const recentIds =
              newlyCreated.length > 0 ? newlyCreated : fetched.slice(0, totalTopicQuestions).map((q) => q.id);
            setState({
              courseQuestions: fetched,
              recentQuestionIds: recentIds,
              selectedBannerFilter: "recent",
            });
          }
          showToast("success", "✓ MCQ Generation complete! Showing recently generated questions.");
          setTimeout(() => {
            document.getElementById("questions-section")?.scrollIntoView({ behavior: "smooth" });
          }, 350);
        } else if (res.status === "failed") {
          clearInterval(interval);
          setState({ isGeneratingAI: false });
          showToast("error", "Generation failed. Please try again.");
        }
      } catch {
        clearInterval(interval);
        setState({ isGeneratingAI: false });
        showToast("error", "Lost connection while polling job status.");
      }
    }, 5000);
  };

  const handleGenerateQuestions = async () => {
    if (!state.selectedCourse) return;
    if (!breakdownValid) {
      alert(`Bloom's taxonomy total (${totalBreakdown}) must equal total topic questions (${totalTopicQuestions}).`);
      return;
    }
    if (state.topicRows.some((r) => !r.topicName)) {
      alert("Please select a topic for every row.");
      return;
    }

    setState({ isGeneratingAI: true });

    try {
      const unitMap: Record<string, { unit_number: number; unit_title: string; topics: any[] }> = {};
      state.topicRows.forEach((row) => {
        const uid = String(row.unitId);
        const unit = activeUnits.find((u) => String(u.unitId) === uid);
        if (!unitMap[uid]) {
          unitMap[uid] = {
            unit_number: Number(uid) || 1,
            unit_title: unit?.title || `Unit ${uid}`,
            topics: [],
          };
        }
        unitMap[uid].topics.push({
          topic_id: String(unitMap[uid].topics.length + 1),
          topic_name: row.topicName,
          subtopics: [],
        });
      });

      const filteredBreakdown: Record<string, Record<string, number>> = {};
      Object.entries(state.breakdown).forEach(([k, diffObj]) => {
        const nonZero = Object.entries(diffObj).filter(([, v]) => (Number(v) || 0) > 0);
        if (nonZero.length > 0) filteredBreakdown[k] = Object.fromEntries(nonZero);
      });

      const payload = {
        syllabus: {
          course_id: String(state.selectedCourse?.code || currentCourseKey),
          units: Object.values(unitMap),
        },
        question_count: totalTopicQuestions,
        type: "mcq",
        language: "en",
        include_explanation: true,
        shuffle_options: true,
        distribution_mode: "knowledge_and_difficulty",
        knowledge_difficulty_breakdown: filteredBreakdown,
      };

      const res: any = await Models.mcq.generate(payload).catch((err) => {
        console.error("Generate API Error:", err);
        showToast("error", `Error from server: ${err?.message || "Unknown Error"}`);
        return null;
      });

      const jobId = res?.job_id || res?.data?.job_id || res?.id;
      if (jobId) {
        pollJobStatus(jobId);
      } else {
        setState({ isGeneratingAI: false });
        showToast("error", "Failed to start generation job. No job_id returned.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      setState({ isGeneratingAI: false });
      showToast("error", "Unexpected error during generation.");
    }
  };

  const handleToggleApprove = async (questionId: string) => {
    const question = currentQuestions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "approved" ? "Draft" : "Approved";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      const updated = currentQuestions.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q));
      setState({ courseQuestions: updated });
    } catch {
      showToast("error", "Failed to update question status.");
    }
  };

  const handleToggleArchive = async (questionId: string) => {
    const question = currentQuestions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "archived" ? "Draft" : "Archived";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      const updated = currentQuestions.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q));
      setState({ courseQuestions: updated });
    } catch {
      showToast("error", "Failed to update question status.");
    }
  };

  const handleApproveAll = () => {
    const updated = currentQuestions.map((q) => ({ ...q, status: "approved" as const }));
    setState({ courseQuestions: updated });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await Models.mcq.delete_question(questionId);
      const updated = currentQuestions.filter((q) => q.id !== questionId);
      setState({ courseQuestions: updated });
    } catch {
      showToast("error", "Failed to delete question.");
    }
  };

  const handleToggleExpandOne = (id: string) => {
    const current = state.expandedQuestionIds || [];
    if (current.includes(id)) {
      setState({ expandedQuestionIds: current.filter((qid: string) => qid !== id) });
    } else {
      setState({ expandedQuestionIds: [...current, id] });
    }
  };

  const handleToggleExpandAll = () => {
    const allIds = displayedQuestions.map((q) => q.id);
    const isAll = (state.expandedQuestionIds || []).length === allIds.length && allIds.length > 0;
    setState({ expandedQuestionIds: isAll ? [] : allIds });
  };

  return (
    <div className="min-h-screen pb-14">
      {state.generationToast && (
        <div
          className={`fixed right-5 top-5 z-[9999] flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-semibold animate-in slide-in-from-top-2 ${
            state.generationToast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span className="flex-1">{state.generationToast.msg}</span>
          <button onClick={() => setState({ generationToast: null })} className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/neurobe/mcq-generation")}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Courses</span>
        </button>
        {state.selectedCourse && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Current Course:</span>
            <div className="relative">
              <select
                value={state.selectedCourse.code || state.selectedCourse.id}
                onChange={(e) => {
                  const found = state.courses.find(
                    (c) => String(c.code) === e.target.value || String(c.id) === e.target.value
                  );
                  if (found) {
                    setState({ selectedCourse: found });
                    fetchCourseUnits(found.id);
                    fetchQuestions(found.code || found.id);
                  }
                }}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.code || c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {state.selectedCourse && (
        <>
          <CourseBanner
            courseCode={state.selectedCourse.code || state.selectedCourse.course_code || "CS309"}
            courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || "Course"}
            description="AI MCQ Generation Studio — Build dynamic question sets aligned to your syllabus units and topics."
            programme={state.selectedCourse.programme || "B.Tech CSE"}
            batch={state.selectedCourse.batch || "2024–2028"}
            academicYear={`${state.selectedCourse.semester || "Semester 5"}`}
            students={`${state.selectedCourse.students_count || 45} Students`}
            selectedCourse={state.selectedCourse.code}
            courseOptions={state.courses.map((c) => ({
              value: String(c.code || c.id),
              label: `${c.code} — ${c.title}`,
            }))}
            onCourseChange={(val) => {
              const target = typeof val === "object" ? val?.value : val;
              const found = state.courses.find(
                (c) => String(c.code) === String(target) || String(c.id) === String(target)
              );
              if (found) {
                setState({ selectedCourse: found });
                fetchCourseUnits(found.id);
                fetchQuestions(found.code || found.id);
              }
            }}
            onBack={() => router.push("/neurobe/mcq-generation")}
          />

          <MCQStatsBanner
            questions={currentQuestions}
            selectedFilter={state.selectedBannerFilter}
            onSelectFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
          />

          <MCQStudioWorkspace
            topicRows={state.topicRows}
            activeUnits={activeUnits}
            onAddRow={addTopicRow}
            onRemoveRow={removeTopicRow}
            onUpdateRow={updateRow}
            totalTopicQuestions={totalTopicQuestions}
            breakdown={state.breakdown}
            onUpdateBreakdown={updateBreakdown}
            totalBreakdown={totalBreakdown}
            breakdownValid={breakdownValid}
            marksPerQuestion={state.marksPerQuestion}
            onMarksChange={(marksPerQuestion) => setState({ marksPerQuestion })}
            isGeneratingAI={state.isGeneratingAI}
            onGenerateQuestions={handleGenerateQuestions}
            currentQuestions={currentQuestions}
            displayedQuestions={displayedQuestions}
            selectedBannerFilter={state.selectedBannerFilter}
            onSelectBannerFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
            recentQuestionIds={state.recentQuestionIds}
            expandedQuestionIds={state.expandedQuestionIds}
            onToggleExpandOne={handleToggleExpandOne}
            onToggleExpandAll={handleToggleExpandAll}
            onToggleApprove={handleToggleApprove}
            onToggleArchive={handleToggleArchive}
            onEditQuestion={(q) => setState({ editingQuestion: q, isEditModalOpen: true })}
            onViewQuestion={(q) => setState({ viewQuestion: q, isViewModalOpen: true })}
            onDeleteQuestion={handleDeleteQuestion}
            onApproveAll={handleApproveAll}
            onCreateQuestionSet={() => setState({ isSetModalOpen: true })}
          />

          <EditQuestionModal
            open={state.isEditModalOpen}
            onClose={() => setState({ isEditModalOpen: false, editingQuestion: null })}
            topicLabel={state.selectedCourse ? `${state.selectedCourse.code} — ${state.selectedCourse.title}` : ""}
            code={state.editingQuestion?.code || "Q-MCQ-01"}
            onSave={(updated) => {
              const updatedQuestions = currentQuestions.map((q) =>
                q.id === updated.id
                  ? {
                      ...q,
                      text: updated.text,
                      question: updated.text,
                      options: updated.options,
                      explanation: updated.explanation,
                    }
                  : q
              );
              setState({ courseQuestions: updatedQuestions });
              if (state.selectedCourse) {
                fetchQuestions(state.selectedCourse.code || state.selectedCourse.id);
              }
            }}
            initialData={
              state.editingQuestion
                ? {
                    id: state.editingQuestion.id,
                    question: state.editingQuestion.question || state.editingQuestion.text || "",
                    optionA: state.editingQuestion.options?.[0]?.text || "",
                    optionB: state.editingQuestion.options?.[1]?.text || "",
                    optionC: state.editingQuestion.options?.[2]?.text || "",
                    optionD: state.editingQuestion.options?.[3]?.text || "",
                    correctAnswer: (() => {
                      const opts = state.editingQuestion.options || [];
                      const foundIdx = opts.findIndex((o: any) => o.isCorrect === true || o.is_correct === true);
                      if (foundIdx === 0) return "A";
                      if (foundIdx === 1) return "B";
                      if (foundIdx === 2) return "C";
                      if (foundIdx === 3) return "D";
                      const foundKey = opts.find((o: any) => o.isCorrect || o.is_correct)?.key;
                      return foundKey || "A";
                    })(),
                    explanation: state.editingQuestion.explanation || "",
                    unit: {
                      value: state.editingQuestion.unit || "",
                      label: state.editingQuestion.unit || "Unit",
                    },
                    topic: {
                      value: state.editingQuestion.topic || "",
                      label: state.editingQuestion.topic || "Topic",
                    },
                    subtopic: {
                      value: state.editingQuestion.subtopic || "",
                      label: state.editingQuestion.subtopic || "Subtopic",
                    },
                    co: {
                      value: state.editingQuestion.co || "",
                      label: state.editingQuestion.co || "CO",
                    },
                    knowledge: {
                      value: state.editingQuestion.level || "",
                      label: state.editingQuestion.level || "Knowledge Level",
                    },
                    questionType: { value: "MCQ", label: "MCQ" },
                    marks: state.editingQuestion.marks || "2",
                    difficulty: {
                      value: state.editingQuestion.difficulty || "medium",
                      label: state.editingQuestion.difficulty || "Medium",
                    },
                  }
                : null
            }
          />

          {state.viewQuestion && (
            <ViewQuestionModal
              open={state.isViewModalOpen}
              onClose={() => setState({ isViewModalOpen: false, viewQuestion: null })}
              question={{
                id: state.viewQuestion.id,
                status: state.viewQuestion.status,
                unit: state.viewQuestion.unit,
                topic: state.viewQuestion.topic,
                subtopic: state.viewQuestion.subtopic,
                co: state.viewQuestion.co,
                level: state.viewQuestion.level,
                marks: state.viewQuestion.marks,
                difficulty: state.viewQuestion.difficulty,
                question: state.viewQuestion.question || state.viewQuestion.text || "",
                optionA: state.viewQuestion.options[0]?.text,
                optionB: state.viewQuestion.options[1]?.text,
                optionC: state.viewQuestion.options[2]?.text,
                optionD: state.viewQuestion.options[3]?.text,
                correctAnswer: state.viewQuestion.options.find((o) => o.isCorrect)?.key || "A",
                explanation: state.viewQuestion.explanation,
                course: currentCourseKey,
              }}
            />
          )}

          {state.isSetModalOpen && (
            <CreateQuestionSetModal
              open={state.isSetModalOpen}
              onClose={() => setState({ isSetModalOpen: false })}
              availableQuestions={currentQuestions}
              courseId={state.selectedCourse?.code || state.selectedCourse?.id}
              courseTitle={state.selectedCourse?.title || state.selectedCourse?.course_title}
              units={UNITS_CONFIG.map((u) => ({ unit_number: u.unitId, title: u.title }))}
              onCreated={() => {
                fetchQuestions(state.selectedCourse?.code || state.selectedCourse?.id);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PrivateRouter(MCQGenerationStudioPage);
