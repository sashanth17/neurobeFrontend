import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import {
  ArrowLeft,
  BookOpen,
  FileCode,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import Models from "@/imports/models.import";
import useCiaTests from "@/hook/useCiaTests";
import useCiaTemplates from "@/hook/useCiaTemplates";
import CiaTestsHeader from "@/components/cia-tests/CiaTestsHeader";
import CiaTestsTabs from "@/components/cia-tests/CiaTestsTabs";
import CiaTestList from "@/components/cia-tests/CiaTestList";
import CreateCiaTestModal from "@/components/cia-tests/modal/CreateCiaTestModal";
import { CourseQuestionBankTab } from "@/components/question-bank/CourseQuestionBankTab";
import TemplateList from "@/components/cia-tests/templates/TemplateList";

const CourseQuestionBankPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { courseId, code, title } = router.query;

  const validCourseId = Array.isArray(courseId) ? courseId[0] : courseId || "";
  const [courseInfo, setCourseInfo] = useState<{
    code: string;
    title: string;
    department?: string;
    programme?: string;
    semester?: string | number;
  }>({
    code: (Array.isArray(code) ? code[0] : code) || "CS301",
    title: (Array.isArray(title) ? title[0] : title) || "Course Assessments & Question Bank",
  });

  const [activeMainTab, setActiveMainTab] = useState<"cia-tests" | "question-bank" | "blueprints">("cia-tests");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Hook for CIA Tests data & actions
  const {
    activeTab,
    setActiveTab,
    activeTests,
    archivedTests,
    filteredTests,
    loading: ciaLoading,
    actionLoadingId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: refreshCiaTests,
    handleArchive,
    handleUnarchive,
    handleDelete,
  } = useCiaTests(validCourseId);

  // Hook for Question Paper Templates
  const {
    templates,
    loading: templatesLoading,
    actionLoadingId: templateActionLoadingId,
    statusFilter: templateStatusFilter,
    setStatusFilter: setTemplateStatusFilter,
    handleDeleteTemplate,
    handleCreateTemplate,
    handleUpdateTemplate,
  } = useCiaTemplates(validCourseId);

  // Load course details if query params weren't complete
  useEffect(() => {
    if (!validCourseId) return;
    const fetchCourseDetails = async () => {
      try {
        const fetchFn = Models.course?.detail || Models.course?.details;
        const res: any = fetchFn ? await fetchFn(validCourseId).catch(() => null) : null;
        if (res) {
          setCourseInfo((prev) => ({
            ...prev,
            code: res.course_code || res.code || prev.code,
            title: res.course_title || res.title || res.name || prev.title,
            department: res.department?.name || res.department_name,
            programme: res.programme?.name || res.programme,
            semester: res.semester,
          }));
        }
      } catch (e) {
        console.error("Failed to load course details:", e);
      }
    };

    fetchCourseDetails();
  }, [validCourseId]);

  useEffect(() => {
    dispatch(setPageTitle(`${courseInfo.code} — Question Bank & Assessments`));
  }, [dispatch, courseInfo.code]);

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push("/neurobe/question-bank")}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Coordinator Courses</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Question Bank</span>
          <span>/</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {courseInfo.code}
          </span>
        </div>
      </div>

      {/* Main Top Workspace Tabs */}
      <div className="mb-6 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
        <button
          onClick={() => setActiveMainTab("cia-tests")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeMainTab === "cia-tests"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>CIA Assessments</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            {activeTests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("question-bank")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeMainTab === "question-bank"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Question Bank & Sets</span>
        </button>

        <button
          onClick={() => setActiveMainTab("blueprints")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeMainTab === "blueprints"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Blueprints & Templates</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            {templates.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: CIA Assessments */}
      {activeMainTab === "cia-tests" && (
        <div>
          {/* Header with quick stats & Create CTA */}
          <CiaTestsHeader
            courseCode={courseInfo.code}
            courseTitle={courseInfo.title}
            activeCount={activeTests.length}
            archivedCount={archivedTests.length}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />

          {/* Active vs Archived Subtabs and search */}
          <CiaTestsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeCount={activeTests.length}
            archivedCount={archivedTests.length}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* List of CIA Tests */}
          <CiaTestList
            tests={filteredTests}
            loading={ciaLoading}
            isArchivedView={activeTab === "archived"}
            actionLoadingId={actionLoadingId}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />
        </div>
      )}

      {/* TAB CONTENT 2: Question Bank Sets */}
      {activeMainTab === "question-bank" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <CourseQuestionBankTab
            courseKey={String(validCourseId)}
            courseTitle={courseInfo.title}
            courseQuestions={[]}
            courseUnits={[]}
          />
        </div>
      )}

      {/* TAB CONTENT 3: Blueprints & Templates */}
      {activeMainTab === "blueprints" && (
        <TemplateList
          courseCode={courseInfo.code}
          templates={templates}
          loading={templatesLoading}
          actionLoadingId={templateActionLoadingId}
          statusFilter={templateStatusFilter}
          onStatusFilterChange={setTemplateStatusFilter}
          onDeleteTemplate={handleDeleteTemplate}
          onCreateTemplate={handleCreateTemplate}
          onUpdateTemplate={handleUpdateTemplate}
        />
      )}

      {/* Creation Modal */}
      <CreateCiaTestModal
        isOpen={isCreateModalOpen}
        courseId={validCourseId}
        courseCode={courseInfo.code}
        courseTitle={courseInfo.title}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refreshCiaTests();
        }}
      />
    </div>
  );
};

export default PrivateRouter(CourseQuestionBankPage);
