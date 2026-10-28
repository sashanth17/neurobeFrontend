import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import { setPageTitle } from "@/store/themeConfigSlice";
import {
  academicAdminService,
  AcademicFiltersResponse,
  AcademicKpiSummary,
  BloomDistributionResponse,
  PassPercentagesResponse,
  DepartmentBloomComparisonResponse,
  CoursesMatrixResponse,
  McqAnalyticsResponse,
  MOCK_FILTERS,
  MOCK_KPI_SUMMARY,
  MOCK_BLOOM_DISTRIBUTION,
  MOCK_PASS_PERCENTAGES,
  MOCK_DEPARTMENT_BLOOM_COMPARISON,
  MOCK_COURSES_BY_DEPT,
  MOCK_MCQ_ANALYTICS_BY_DEPT,
} from "@/services/academicAdminAnalytics.service";
import AcademicAdminHeader from "@/components/academic-admin/AcademicAdminHeader";
import CollegeOverviewView from "@/components/academic-admin/CollegeOverviewView";
import DepartmentDrilldownView from "@/components/academic-admin/DepartmentDrilldownView";
import CourseMcqPerformanceView from "@/components/academic-admin/CourseMcqPerformanceView";

const AcademicAdminPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Navigation State
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(1);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>("Computer Science and Engineering");

  // Filters State
  const [filters, setFilters] = useState<AcademicFiltersResponse>(MOCK_FILTERS);
  const [selectedYear, setSelectedYear] = useState<string>("2025-2026");
  const [selectedScope, setSelectedScope] = useState<string>("COMBINED");
  const [selectedDepartmentIdsForLevel2, setSelectedDepartmentIdsForLevel2] = useState<number[]>([]);

  // Analytics Data State
  const [kpiSummary, setKpiSummary] = useState<AcademicKpiSummary>(MOCK_KPI_SUMMARY);
  const [bloomDistribution, setBloomDistribution] = useState<BloomDistributionResponse>(MOCK_BLOOM_DISTRIBUTION);
  const [passPercentages, setPassPercentages] = useState<PassPercentagesResponse>(MOCK_PASS_PERCENTAGES);
  const [deptBloomComparison, setDeptBloomComparison] = useState<DepartmentBloomComparisonResponse>(MOCK_DEPARTMENT_BLOOM_COMPARISON);
  const [coursesData, setCoursesData] = useState<CoursesMatrixResponse>(MOCK_COURSES_BY_DEPT[1]);
  const [mcqData, setMcqData] = useState<McqAnalyticsResponse>(MOCK_MCQ_ANALYTICS_BY_DEPT[1]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync title
  useEffect(() => {
    dispatch(setPageTitle("Academic Administrator Analytics"));
  }, [dispatch]);

  // Load initial filters
  useEffect(() => {
    const loadFilters = async () => {
      const data = await academicAdminService.getFilters();
      setFilters(data);
      const latest = data.academic_years.find((y) => y.is_latest)?.year || data.academic_years[0]?.year;
      if (latest && !router.query.year) {
        setSelectedYear(latest);
      }
    };
    loadFilters();
  }, [router.query.year]);

  // Sync state from URL query parameters
  useEffect(() => {
    if (!router.isReady) return;

    const queryLevel = Number(router.query.level);
    if (queryLevel === 1 || queryLevel === 2 || queryLevel === 3) {
      setLevel(queryLevel);
    }

    if (router.query.dept) {
      const deptId = Number(router.query.dept);
      if (!isNaN(deptId)) {
        setSelectedDepartmentId(deptId);
        const match = filters.departments.find((d) => d.id === deptId);
        if (match) setSelectedDepartmentName(match.name);
      }
    }

    if (router.query.year && typeof router.query.year === "string") {
      setSelectedYear(router.query.year);
    }

    if (router.query.scope && typeof router.query.scope === "string") {
      setSelectedScope(router.query.scope);
    }
  }, [router.isReady, router.query, filters.departments]);

  // Fetch Level 1 data
  const loadLevel1Data = useCallback(async (year: string) => {
    setIsLoading(true);
    try {
      const [kpi, bloom, passes] = await Promise.all([
        academicAdminService.getKpiSummary(1, year),
        academicAdminService.getBloomDistribution(1, year),
        academicAdminService.getPassPercentages(1, year),
      ]);
      setKpiSummary(kpi);
      setBloomDistribution(bloom);
      setPassPercentages(passes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Level 2 data
  const loadLevel2Data = useCallback(async (year: string, deptIds?: number[], scope = "COMBINED") => {
    setIsLoading(true);
    try {
      const data = await academicAdminService.getDepartmentBloomComparison(1, year, deptIds, scope);
      setDeptBloomComparison(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Level 3 data
  const loadLevel3Data = useCallback(async (deptId: number, year: string) => {
    setIsLoading(true);
    try {
      const [courses, mcq] = await Promise.all([
        academicAdminService.getCoursesMatrix(deptId, year),
        academicAdminService.getMcqAnalytics(deptId, year),
      ]);
      setCoursesData(courses);
      setMcqData(mcq);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger loads based on active level and filters
  useEffect(() => {
    if (level === 1) {
      loadLevel1Data(selectedYear);
    } else if (level === 2) {
      loadLevel2Data(selectedYear, selectedDepartmentIdsForLevel2, selectedScope);
    } else if (level === 3) {
      loadLevel3Data(selectedDepartmentId, selectedYear);
    }
  }, [
    level,
    selectedYear,
    selectedScope,
    selectedDepartmentIdsForLevel2,
    selectedDepartmentId,
    loadLevel1Data,
    loadLevel2Data,
    loadLevel3Data,
  ]);

  // Navigate level handler with URL sync
  const handleNavigateLevel = (targetLevel: 1 | 2 | 3, deptId?: number) => {
    setLevel(targetLevel);
    const query: Record<string, any> = {
      level: targetLevel,
      year: selectedYear,
    };

    if (deptId !== undefined) {
      setSelectedDepartmentId(deptId);
      query.dept = deptId;
      const deptMatch = filters.departments.find((d) => d.id === deptId);
      if (deptMatch) setSelectedDepartmentName(deptMatch.name);
    }

    if (selectedScope) {
      query.scope = selectedScope;
    }

    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  // Level 1 -> Level 2 transition
  const handleDrilldownToLevel2 = (options?: { departmentId?: number; focus?: "bloom" | "exams" }) => {
    if (options?.departmentId) {
      setSelectedDepartmentIdsForLevel2([options.departmentId]);
    } else {
      setSelectedDepartmentIdsForLevel2([]);
    }
    handleNavigateLevel(2);
  };

  // Level 1 or 2 -> Level 3 transition
  const handleDrilldownToLevel3 = (deptId: number, deptName: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedDepartmentName(deptName);
    handleNavigateLevel(3, deptId);
  };

  // Toggle department chip in Level 2
  const handleToggleDepartment = (deptId: number) => {
    setSelectedDepartmentIdsForLevel2((prev) => {
      if (prev.includes(deptId)) {
        return prev.filter((id) => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  return (
    <>
      <Head>
        <title>Academic Administrator Analytics | Neurobe</title>
      </Head>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Top Header & Breadcrumbs & Global Filters */}
        <AcademicAdminHeader
          level={level}
          onNavigateLevel={handleNavigateLevel}
          selectedDepartmentName={selectedDepartmentName}
          selectedDepartmentId={selectedDepartmentId}
          academicYears={filters.academic_years}
          selectedYear={selectedYear}
          onYearChange={(year) => {
            setSelectedYear(year);
            router.push(
              { pathname: router.pathname, query: { ...router.query, year } },
              undefined,
              { shallow: true }
            );
          }}
          examScopes={filters.exam_scopes}
          selectedScope={selectedScope}
          onScopeChange={(scope) => {
            setSelectedScope(scope);
            router.push(
              { pathname: router.pathname, query: { ...router.query, scope } },
              undefined,
              { shallow: true }
            );
          }}
          onRefresh={() => {
            if (level === 1) loadLevel1Data(selectedYear);
            else if (level === 2) loadLevel2Data(selectedYear, selectedDepartmentIdsForLevel2, selectedScope);
            else if (level === 3) loadLevel3Data(selectedDepartmentId, selectedYear);
          }}
          isLoading={isLoading}
        />

        {/* Level Views with Animated Transitions */}
        <div className="transition-opacity duration-300">
          {level === 1 && (
            <CollegeOverviewView
              kpi={kpiSummary}
              bloom={bloomDistribution}
              passPercentages={passPercentages}
              onDrilldownToLevel2={handleDrilldownToLevel2}
              onDrilldownToLevel3={handleDrilldownToLevel3}
            />
          )}

          {level === 2 && (
            <DepartmentDrilldownView
              data={deptBloomComparison}
              allDepartments={filters.departments}
              selectedDepartmentIds={selectedDepartmentIdsForLevel2}
              onToggleDepartment={handleToggleDepartment}
              onSelectAllDepartments={() => setSelectedDepartmentIdsForLevel2([])}
              onDrilldownToLevel3={handleDrilldownToLevel3}
              onBackToLevel1={() => handleNavigateLevel(1)}
            />
          )}

          {level === 3 && (
            <CourseMcqPerformanceView
              coursesData={coursesData}
              mcqData={mcqData}
              onBackToLevel2={() => handleNavigateLevel(2)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AcademicAdminPage;
