import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import { setPageTitle } from "@/store/themeConfigSlice";
import TeachingLearningEffectivenessView from "@/components/academic-admin/TeachingLearningEffectivenessView";
import AcademicAdminAttainmentView from "@/components/academic-admin/AcademicAdminAttainmentView";
import PrincipalPerformanceView from "@/components/academic-admin/PrincipalPerformanceView";

type AcademicTab = "mcq" | "cia" | "attainment" | "performance";

const AcademicAdminPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Active tab state: "mcq" | "cia" | "attainment"
  const [activeTab, setActiveTab] = useState<AcademicTab>("cia");

  // Cross-tab drilldown hints
  const [attainmentDept, setAttainmentDept] = useState<string>("CSE");
  const [attainmentCourse, setAttainmentCourse] = useState<string | undefined>(undefined);

  // Set page title
  useEffect(() => {
    dispatch(setPageTitle("Academic Administrator Dashboard | Neurobe"));
  }, [dispatch]);

  // Synchronize active tab from URL query
  useEffect(() => {
    if (!router.isReady) return;
    const tabParam = router.query.tab as string;
    if (tabParam === "mcq" || tabParam === "cia" || tabParam === "attainment" || tabParam === "performance") {
      setActiveTab(tabParam);
    }
  }, [router.isReady, router.query.tab]);

  // Handle Tab Switch
  const handleTabChange = (newTab: AcademicTab) => {
    setActiveTab(newTab);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: newTab },
      },
      undefined,
      { shallow: true }
    );
  };

  // Callback from Teaching-Learning to jump to Attainment for a specific department/course
  const handleDrilldownToAttainment = (deptCode: string, courseCode?: string) => {
    setAttainmentDept(deptCode);
    setAttainmentCourse(courseCode);
    handleTabChange("attainment");
  };

  return (
    <>
      <Head>
        <title>Academic Administrator Dashboard | Neurobe</title>
      </Head>

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* ── Top Navigation Bar: 3 Main Buttons ── */}
        <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
              Academic Administrator Workspace
            </span>
            <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-0.5">
              {activeTab === "mcq" && "MCQ Teaching Learning Effectiveness"}
              {activeTab === "cia" && "CIA Teaching Learning Effectiveness"}
              {activeTab === "attainment" && "CO-PO Attainment Analysis"}
              {activeTab === "performance" && "Faculty & Classroom Performance Analytics"}
            </h1>
          </div>

          {/* 3 Nav Buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex-wrap gap-1">
            {/* 1. MCQ Teaching Learning Effectiveness */}
            <button
              type="button"
              onClick={() => handleTabChange("mcq")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                activeTab === "mcq"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-md scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l2 2 4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 2v4M21 4h-4" />
              </svg>
              <span>MCQ Teaching Learning Effectiveness</span>
            </button>

            {/* 2. CIA Teaching Learning Effectiveness */}
            <button
              type="button"
              onClick={() => handleTabChange("cia")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                activeTab === "cia"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-md scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 20V10M12 20V4M6 20v-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18" />
              </svg>
              <span>CIA Teaching Learning Effectiveness</span>
            </button>

            {/* 3. Attainment */}
            <button
              type="button"
              onClick={() => handleTabChange("attainment")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                activeTab === "attainment"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-md scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-2 5l9-11h-7l2-5l-9 11h7z" />
              </svg>
              <span>Attainment</span>
            </button>

            {/* 4. Faculty & Classroom Performance Analytics */}
            <button
              type="button"
              onClick={() => handleTabChange("performance")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                activeTab === "performance"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-md scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Faculty & Class Performance</span>
            </button>
          </div>
        </div>

        {/* ── Active View Rendering ── */}
        <div className="transition-opacity duration-300">
          {activeTab === "mcq" && (
            <TeachingLearningEffectivenessView
              key="mcq-view"
              type="mcq"
            />
          )}

          {activeTab === "cia" && (
            <TeachingLearningEffectivenessView
              key="cia-view"
              type="cia"
              onDrilldownToAttainment={handleDrilldownToAttainment}
            />
          )}

          {activeTab === "attainment" && (
            <AcademicAdminAttainmentView
              key={`attainment-${attainmentDept}-${attainmentCourse || "all"}`}
              initialDepartmentCode={attainmentDept}
              initialCourseCode={attainmentCourse}
            />
          )}

          {activeTab === "performance" && (
            <PrincipalPerformanceView
              key="principal-performance-view"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AcademicAdminPage;
