import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  Printer,
  FileDown,
  CheckCircle2,
  Bookmark,
  Sparkles,
  RotateCw,
  Award,
  BookMarked,
  Presentation,
  Check,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";

const InsCourseArtifacts = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("course_id");
  const codeParam = searchParams.get("code");
  const fromParam = searchParams.get("from");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "syllabus" | "outcomes" | "copo" | "pedagogy" | "lesson-plan" | "books"
  >("syllabus");

  // Master Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [syllabusData, setSyllabusData] = useState<any>(null);
  const [copoData, setCopoData] = useState<any>(null);
  const [pedagogyUnits, setPedagogyUnits] = useState<any[]>([]);
  const [lessonPlanSessions, setLessonPlanSessions] = useState<any[]>([]);
  const [selectedUnitNum, setSelectedUnitNum] = useState<number>(1);

  useEffect(() => {
    dispatch(setPageTitle("Course Artifacts & Curriculum Portfolio"));
  }, [dispatch]);

  /** Load all relational course artifacts */
  const loadCourseArtifacts = useCallback(async () => {
    if (!courseIdParam) return;
    try {
      setLoading(true);

      // 1. Fetch Course Detail
      const cRes: any = await Models.course.detail(courseIdParam).catch(() => null);
      if (cRes) setCourseData(cRes);

      const sid =
        cRes?.syllabus_id ||
        cRes?.latest_syllabus?.id ||
        courseIdParam;

      // 2. Fetch Master Syllabus (Units, Outcomes, Textbooks, References)
      const sRes: any = await Models.syllabus.detail(sid).catch(() => null);
      if (sRes) setSyllabusData(sRes);

      // 3. Fetch CO-PO Mapping Matrix
      const copoRes: any = await Models.copo.copo_map(sid).catch(() => null);
      if (copoRes) setCopoData(copoRes);

      // 4. Fetch Active Pedagogy Data for Unit 1
      const pedRes: any = await Models.pedagogy.unit_detail(sid, 1).catch(() => null);
      if (pedRes) {
        setPedagogyUnits(pedRes?.selected_unit?.topics || pedRes?.topics || []);
      }

      // 5. Fetch Active Lesson Plan Sessions for Unit 1
      const lpRes: any = await Models.lession_plan.detail(sid, 1).catch(() => null);
      if (lpRes) {
        setLessonPlanSessions(lpRes?.selected_unit?.sessions || []);
      }
    } catch (err: any) {
      console.warn("Failed to load course artifacts:", err);
      Failure(getErrorMessage(err, "Failed to load course artifacts"));
    } finally {
      setLoading(false);
    }
  }, [courseIdParam]);

  useEffect(() => {
    loadCourseArtifacts();
  }, [loadCourseArtifacts]);

  /** Switch unit for pedagogy and lesson plan review */
  const handleUnitChange = async (uNum: number) => {
    setSelectedUnitNum(uNum);
    const sid =
      courseData?.syllabus_id ||
      courseData?.latest_syllabus?.id ||
      courseIdParam;
    if (!sid) return;

    try {
      if (activeTab === "pedagogy") {
        const pedRes: any = await Models.pedagogy.unit_detail(sid, uNum).catch(() => null);
        if (pedRes) {
          setPedagogyUnits(pedRes?.selected_unit?.topics || pedRes?.topics || []);
        }
      } else if (activeTab === "lesson-plan") {
        const lpRes: any = await Models.lession_plan.detail(sid, uNum).catch(() => null);
        if (lpRes) {
          setLessonPlanSessions(lpRes?.selected_unit?.sessions || []);
        }
      }
    } catch {}
  };

  // Normalized values
  const units: any[] = syllabusData?.units || [];
  const outcomes: any[] = syllabusData?.outcomes || syllabusData?.course_outcomes || [];
  const textbooks: any[] = syllabusData?.textbooks || [];
  const references: any[] = syllabusData?.reference_books || [];

  const programOutcomes: any[] =
    copoData?.program_outcomes ||
    Array.from({ length: 12 }, (_, i) => ({
      code: `PO${i + 1}`,
      title: `Program Outcome ${i + 1}`,
    }));

  const matrix: Record<string, any> = copoData?.matrix || {};
  const poAverages: Record<string, any> = copoData?.po_averages || {};

  return (
    <div className="min-h-screen pb-16">
      {/* ── Top Course Banner ── */}
      <CourseBanner
        courseCode={courseData?.course_code || codeParam || "Course"}
        courseTitle={courseData?.course_title || "Course Artifacts"}
        description="Instructor & Department Course Artifacts Portfolio — Complete approved syllabus, learning outcomes, curriculum mapping, teaching methodologies, and lecture plans."
        programme={courseData?.programme || "B.Tech CSE"}
        batch={courseData?.batch_name || courseData?.academic_year || "Batch 2023-2027"}
        academicYear={courseData?.academic_year || "2026-2027"}
        students={String(courseData?.students_count || courseData?.student_count || 0)}
        onBack={() => {
          if (fromParam === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
      />

      {/* ── Artifact Header Controls & Print Bar ── */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Course Academic Dossier
            </h3>
            <p className="text-xs text-slate-500">
              Verified curriculum portfolio ready for BoS compliance and classroom delivery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              Success("Generating complete course dossier PDF...");
              window.print();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Export Portfolio</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Overview ── */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Curriculum Units</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {units.length || 5} Units
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Course Outcomes</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {outcomes.length || 5} COs
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Lecture Hours</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {syllabusData?.total_theory_hours || 45} Hours
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">L-T-P-C Credits</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {syllabusData?.lecture_hours ?? 3}-{syllabusData?.tutorial_hours ?? 0}-
                {syllabusData?.practical_hours ?? 0} &bull; {syllabusData?.credits ?? 3} C
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Artifact Navigation Tabs ── */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
        {[
          { key: "syllabus", label: "Syllabus & Units", icon: <BookOpen className="h-4 w-4" /> },
          { key: "outcomes", label: "Course Outcomes", icon: <Award className="h-4 w-4" /> },
          { key: "copo", label: "CO–PO Mapping", icon: <GraduationCap className="h-4 w-4" /> },
          { key: "pedagogy", label: "Pedagogy Strategies", icon: <Presentation className="h-4 w-4" /> },
          { key: "lesson-plan", label: "Lesson Plan Schedule", icon: <Calendar className="h-4 w-4" /> },
          { key: "books", label: "Books & References", icon: <BookMarked className="h-4 w-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                if (tab.key === "pedagogy" || tab.key === "lesson-plan") {
                  handleUnitChange(selectedUnitNum);
                }
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content Panes ── */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-xs text-slate-400">
            <RotateCw className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
            Loading course artifacts portfolio...
          </div>
        ) : (
          <>
            {/* 1. SYLLABUS & UNITS */}
            {activeTab === "syllabus" && (
              <div className="space-y-4">
                {units.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                    No syllabus units found.
                  </div>
                ) : (
                  units.map((unit: any, uIdx: number) => {
                    const uNum = unit.unit_number ?? uIdx + 1;
                    const uTitle = unit.unit_title ?? `Unit ${uNum}`;
                    const uHours = unit.theory_hours ?? unit.hours ?? 9;
                    const uTopics = unit.topics || unit.extracted_topics || [];

                    return (
                      <div
                        key={unit.id || uIdx}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              UNIT {uNum}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {uTitle}
                            </h4>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {uHours} Theory Hours &bull; {uTopics.length} Topics
                          </span>
                        </div>

                        {/* Topics List */}
                        <div className="mt-4 space-y-2.5">
                          {uTopics.map((topic: any, tIdx: number) => {
                            const tCode = topic.topic_code || `${uNum}.${tIdx + 1}`;
                            const tName = topic.topic_name || topic.title || `Topic ${tIdx + 1}`;
                            const subtopics = topic.subtopics || topic.sub_topics || [];

                            return (
                              <div
                                key={topic.id || tIdx}
                                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                      {tCode}
                                    </span>
                                    <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                      {tName}
                                    </h5>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-xs dark:bg-slate-700 dark:text-slate-300">
                                      {topic.knowledge_level || topic.bloom_level || "Understand"}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {topic.theory_hours || 1} hr
                                    </span>
                                  </div>
                                </div>

                                {topic.topic_description && (
                                  <p className="mt-2 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                                    {topic.topic_description}
                                  </p>
                                )}

                                {subtopics.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8">
                                    {subtopics.map((sub: any, sIdx: number) => (
                                      <span
                                        key={sub.id || sIdx}
                                        className="rounded-md border border-slate-200/80 bg-white px-2 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                      >
                                        &bull; {sub.subtopic_name || sub.title || sub.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. COURSE OUTCOMES */}
            {activeTab === "outcomes" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Course Outcomes (COs)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Measurable student learning competencies upon course completion
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {outcomes.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No course outcomes defined yet.
                    </div>
                  ) : (
                    outcomes.map((co: any, idx: number) => {
                      const code = co.outcome_code || co.co_code || co.code || `CO${idx + 1}`;
                      const stmt =
                        co.outcome_statement || co.statement || co.description || "";
                      const bloom = co.bloom_level || co.knowledge_level || "K2";

                      return (
                        <div
                          key={co.id || idx}
                          className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {code}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 leading-relaxed dark:text-slate-200">
                              {stmt}
                            </p>
                            <span className="mt-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              Taxonomy Level: {bloom}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. CO–PO MAPPING MATRIX */}
            {activeTab === "copo" && (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    CO–PO & CO–PSO Articulation Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Correlation levels: 3 = High, 2 = Medium, 1 = Low, &mdash; = No Correlation
                  </p>
                </div>

                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                        <th className="p-3 font-bold text-slate-700 dark:text-slate-300">
                          Course Outcome
                        </th>
                        {programOutcomes.map((po: any) => (
                          <th
                            key={po.code}
                            className="p-3 text-center font-bold text-slate-700 dark:text-slate-300"
                            title={po.title}
                          >
                            {po.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {Object.keys(matrix).length === 0 ? (
                        <tr>
                          <td
                            colSpan={programOutcomes.length + 1}
                            className="py-12 text-center text-xs text-slate-400"
                          >
                            No CO–PO correlation matrix data found.
                          </td>
                        </tr>
                      ) : (
                        Object.keys(matrix).map((coCode) => {
                          const poRow = matrix[coCode] || {};
                          return (
                            <tr
                              key={coCode}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                            >
                              <td className="p-3 font-bold text-indigo-700 dark:text-indigo-400">
                                {coCode}
                              </td>
                              {programOutcomes.map((po: any) => {
                                const rawVal = poRow[po.code];
                                const score =
                                  typeof rawVal === "object"
                                    ? rawVal?.correlation_level
                                    : rawVal;

                                return (
                                  <td key={po.code} className="p-3 text-center">
                                    {score && Number(score) > 0 ? (
                                      <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-bold ${
                                          Number(score) === 3
                                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                            : Number(score) === 2
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                      >
                                        {score}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">&mdash;</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* PO Averages Footer */}
                    {Object.keys(poAverages).length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-700 dark:bg-slate-800/80">
                          <td className="p-3 text-slate-900 dark:text-white">PO Average</td>
                          {programOutcomes.map((po: any) => (
                            <td
                              key={po.code}
                              className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400"
                            >
                              {poAverages[po.code] ? Number(poAverages[po.code]).toFixed(1) : "&mdash;"}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* 4. PEDAGOGY STRATEGIES */}
            {activeTab === "pedagogy" && (
              <div className="space-y-4">
                {/* Unit Selector Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5].map((uNum) => (
                    <button
                      key={uNum}
                      type="button"
                      onClick={() => handleUnitChange(uNum)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        selectedUnitNum === uNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Unit {uNum}
                    </button>
                  ))}
                </div>

                {pedagogyUnits.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                    No pedagogy strategies mapped for Unit {selectedUnitNum}.
                  </div>
                ) : (
                  pedagogyUnits.map((topic: any, tIdx: number) => {
                    const peds = topic.suggested_pedagogies || [];
                    const tCode = topic.topic_code || `${selectedUnitNum}.${tIdx + 1}`;
                    const tName = topic.topic_name || topic.title || `Topic ${tIdx + 1}`;

                    return (
                      <div
                        key={topic.id || tIdx}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            {tCode}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {tName}
                          </h4>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {peds.map((p: any) => (
                            <div
                              key={p.id}
                              className={`rounded-xl border p-3.5 ${
                                p.is_selected
                                  ? "border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/20"
                                  : "border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                  {p.pedagogy_name || p.strategy_name || p.title}
                                </h5>
                                {p.is_selected && (
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <Check className="h-2.5 w-2.5" /> Selected
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                                {p.methodology || p.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 5. LESSON PLAN SCHEDULE */}
            {activeTab === "lesson-plan" && (
              <div className="space-y-4">
                {/* Unit Selector Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5].map((uNum) => (
                    <button
                      key={uNum}
                      type="button"
                      onClick={() => handleUnitChange(uNum)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        selectedUnitNum === uNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Unit {uNum}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
                    <h3 className="text-base font-bold">
                      Unit {selectedUnitNum} Teaching Schedule
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Session-by-session instructional plan and textbook mappings
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          <th className="p-3 font-bold w-12 text-center">SEQ</th>
                          <th className="p-3 font-bold">TOPIC / SUBTOPIC</th>
                          <th className="p-3 font-bold text-center">LEVEL</th>
                          <th className="p-3 font-bold">BOOKS & REFERENCES</th>
                          <th className="p-3 font-bold text-center">HOURS</th>
                          <th className="p-3 font-bold">PEDAGOGY</th>
                          <th className="p-3 font-bold text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lessonPlanSessions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                              No lesson plan sessions recorded for Unit {selectedUnitNum}.
                            </td>
                          </tr>
                        ) : (
                          lessonPlanSessions.map((session: any, idx: number) => (
                            <tr
                              key={session.id || session.slot_id || idx}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                            >
                              <td className="p-3 text-center">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                  {String(session.seq || idx + 1).padStart(2, "0")}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                {session.topic_name || session.title}
                                {session.subtopic && (
                                  <p className="text-[11px] font-normal text-slate-500">
                                    {session.subtopic}
                                  </p>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {session.level || "K2"}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {session.textbook || session.reference_book || "&mdash;"}
                              </td>
                              <td className="p-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                {session.hours || 1} hr
                              </td>
                              <td className="p-3 text-indigo-600 font-semibold dark:text-indigo-400">
                                {session.pedagogy || "Interactive Lecture"}
                              </td>
                              <td className="p-3 text-center">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  <Check className="h-2.5 w-2.5" /> Approved
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BOOKS & REFERENCES */}
            {activeTab === "books" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Textbooks */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Prescribed Textbooks
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {textbooks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No prescribed textbooks recorded.
                      </div>
                    ) : (
                      textbooks.map((tb: any, idx: number) => (
                        <div
                          key={tb.id || idx}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {tb.title}
                          </h4>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {tb.authors}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                            {tb.publisher && <span>Publisher: {tb.publisher}</span>}
                            {tb.edition && <span>&bull; Edition: {tb.edition}</span>}
                            {tb.publication_year && <span>&bull; Year: {tb.publication_year}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Reference Books */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Reference Books & Materials
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {references.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No reference books recorded.
                      </div>
                    ) : (
                      references.map((rb: any, idx: number) => (
                        <div
                          key={rb.id || idx}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {rb.title}
                          </h4>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {rb.authors}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                            {rb.publisher && <span>Publisher: {rb.publisher}</span>}
                            {rb.edition && <span>&bull; Edition: {rb.edition}</span>}
                            {rb.publication_year && <span>&bull; Year: {rb.publication_year}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(InsCourseArtifacts);
