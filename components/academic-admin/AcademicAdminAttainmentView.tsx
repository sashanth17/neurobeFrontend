import React, { useState, useEffect } from "react";
import {
  academicAdminService,
  DepartmentAttainmentSummary,
  CourseAttainmentSummaryItem,
  ClassInstanceAttainmentItem,
} from "@/services/academicAdminAnalytics.service";
import CourseAttainmentReport from "@/components/academic-setup/CourseAttainmentReport";

interface AcademicAdminAttainmentViewProps {
  initialDepartmentCode?: string;
  initialCourseCode?: string;
}

export const AcademicAdminAttainmentView: React.FC<
  AcademicAdminAttainmentViewProps
> = ({ initialDepartmentCode = "CSE", initialCourseCode }) => {
  const [selectedBatch, setSelectedBatch] = useState<string>("2025-2026");
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartmentCode);

  // Dynamic filter lists loaded via API
  const [departments, setDepartments] = useState<{ id: number; code: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number | string; name: string }[]>([]);

  // Load filter options dynamically on mount
  useEffect(() => {
    let isMounted = true;
    academicAdminService.getFilters().then((res) => {
      if (!isMounted) return;
      if (res?.departments && res.departments.length > 0) {
        setDepartments(res.departments);
        if (!initialDepartmentCode) {
          setSelectedDept(res.departments[0].code);
        }
      }
      if (res?.batches && res.batches.length > 0) {
        setBatches(res.batches.map((b) => ({ id: b.id, name: b.name })));
        setSelectedBatch(res.batches[0].name);
      } else if (res?.academic_years && res.academic_years.length > 0) {
        setBatches(res.academic_years.map((y) => ({ id: y.year, name: y.year })));
        setSelectedBatch(res.academic_years[0].year);
      }
    }).catch((err) => {
      console.error("Failed to load filter options from API:", err);
    });
    return () => {
      isMounted = false;
    };
  }, [initialDepartmentCode]);

  // Deep drilldown selection: Course and Instance
  const [selectedCourse, setSelectedCourse] =
    useState<CourseAttainmentSummaryItem | null>(null);
  const [selectedInstance, setSelectedInstance] =
    useState<ClassInstanceAttainmentItem | null>(null);

  const [attainmentData, setAttainmentData] =
    useState<DepartmentAttainmentSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load department attainment summary
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    academicAdminService
      .getDepartmentCourseAttainment(selectedDept, selectedBatch)
      .then((res) => {
        if (isMounted) {
          setAttainmentData(res);
          setLoading(false);

          // If initial course was requested, auto-select it
          if (initialCourseCode) {
            const matched = res.courses.find(
              (c) => c.course_code.toLowerCase() === initialCourseCode.toLowerCase()
            );
            if (matched) {
              setSelectedCourse(matched);
              if (matched.instances && matched.instances.length > 0) {
                setSelectedInstance(matched.instances[0]);
              }
            }
          }
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDept, selectedBatch, initialCourseCode]);

  // When changing department, reset course & instance selection
  const handleDeptChange = (newDept: string) => {
    setSelectedDept(newDept);
    setSelectedCourse(null);
    setSelectedInstance(null);
  };

  // Back to Department Courses view
  const handleBackToAllCourses = () => {
    setSelectedCourse(null);
    setSelectedInstance(null);
  };

  if (loading || !attainmentData) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading Department CO-PO Attainment...</p>
      </div>
    );
  }

  // Calculate department overall average attainment
  const deptAverageAttainment =
    attainmentData.courses.length > 0
      ? (
          attainmentData.courses.reduce(
            (acc, c) => acc + c.average_copo_attainment_pct,
            0
          ) / attainmentData.courses.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* -- Top Filters Bar -- */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">
                Outcome Based Education (OBE)
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                Course Outcome & Program Outcome (CO-PO / PSO) Attainment
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select Batch and Department to view all courses average attainment, or pick a specific course classroom for deep attainment reports.
            </p>
          </div>

          {/* Department and Batch Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Filter (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Batch:</span>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                {batches.map((b) => (
                  <option key={String(b.id)} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (Populated via API) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Course:</span>
              <select
                value={selectedCourse ? selectedCourse.course_code : "ALL"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "ALL") {
                    setSelectedCourse(null);
                    setSelectedInstance(null);
                  } else {
                    const matched = attainmentData.courses.find((c) => c.course_code === val);
                    setSelectedCourse(matched || null);
                    if (matched && matched.instances && matched.instances.length > 0) {
                      setSelectedInstance(matched.instances[0]);
                    } else {
                      setSelectedInstance(null);
                    }
                  }
                }}
                className="form-select text-xs py-1.5 px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value="ALL">All Courses (Department Average)</option>
                {attainmentData.courses.map((c) => (
                  <option key={c.course_id} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Instance Filter */}
            {selectedCourse && (
              <div className="flex items-center gap-1.5 text-xs animate-fadeIn">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Classroom:</span>
                <select
                  value={selectedInstance ? String(selectedInstance.instance_id) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = selectedCourse.instances.find(
                      (inst) => String(inst.instance_id) === val
                    );
                    setSelectedInstance(matched || null);
                  }}
                  className="form-select text-xs py-1.5 px-3 rounded-lg border-primary/50 dark:border-primary/50 bg-primary/5 dark:bg-primary/10 text-primary font-bold"
                >
                  {selectedCourse.instances.map((inst) => (
                    <option key={inst.instance_id} value={String(inst.instance_id)}>
                      {inst.instance_name} ({inst.instructor_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb Path when Deep in Class Instance */}
        {selectedCourse && selectedInstance && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <button
                onClick={handleBackToAllCourses}
                className="hover:text-primary font-semibold text-primary transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{selectedDept} All Courses</span>
              </button>
              <span>/</span>
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {selectedCourse.course_code} - {selectedCourse.course_title}
              </span>
              <span>/</span>
              <span className="font-extrabold text-primary px-2 py-0.5 rounded bg-primary/10">
                {selectedInstance.instance_name}
              </span>
            </div>

            <button
              onClick={handleBackToAllCourses}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back to All Courses
            </button>
          </div>
        )}
      </div>

      {/* -- VIEW 1: Batch & Department alone given (All courses average CO-PO shown) -- */}
      {!selectedCourse && (
        <div className="space-y-6">
          {/* Department Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Department</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {attainmentData.department_name} ({attainmentData.department_code})
              </div>
              <span className="text-[11px] text-gray-400">Batch: {attainmentData.academic_year}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Department Average Attainment</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {deptAverageAttainment}%
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Level 2.5 / 3.0 (Target Met)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Evaluated Courses</span>
              <div className="text-2xl font-bold text-primary mt-1">
                {attainmentData.courses.length} Courses
              </div>
              <span className="text-[11px] text-gray-400">Across All Running Semesters</span>
            </div>
          </div>

          {/* All Courses Table */}
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  All Courses Average CO-PO Attainment for {attainmentData.department_code}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click any classroom instance to inspect its exact class CO/PO attainment matrix and calculations.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-3 text-center">Semester</th>
                    <th className="py-3 px-3 text-center">Enrolled</th>
                    <th className="py-3 px-4 text-center">Avg CO-PO Attainment</th>
                    <th className="py-3 px-4 text-center">OBE Attainment Level</th>
                    <th className="py-3 px-4 text-right">Available Classroom Instances</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {attainmentData.courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        No courses found for department {attainmentData.department_code} in batch {attainmentData.academic_year}.
                      </td>
                    </tr>
                  ) : (
                    attainmentData.courses.map((course) => (
                      <tr
                        key={course.course_id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-primary">
                          {course.course_code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {course.course_title}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-gray-500">
                          Sem {course.semester}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-gray-500">
                          {course.total_enrolled_students}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {course.average_copo_attainment_pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Level {course.attainment_level} / 3.0
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {course.instances.map((inst) => (
                              <button
                                key={inst.instance_id}
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setSelectedInstance(inst);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-primary text-gray-700 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-primary transition-all shadow-sm"
                                title={`View ${inst.instance_name} (${inst.instructor_name})`}
                              >
                                {inst.instance_name}
                              </button>
                            ))}
                          </div>
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

      {/* -- VIEW 2: Exact Course & Instance / Class Chosen (Notation like course-instance/[instanceId].tsx) -- */}
      {selectedCourse && selectedInstance && (
        <div className="space-y-6 animate-fadeIn">
          {/* Class Header Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-white">
                  {selectedCourse.course_code}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedCourse.course_title}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Classroom Instance: <strong>{selectedInstance.instance_name}</strong>  -  Assigned Instructor: <strong>{selectedInstance.instructor_name}</strong>  -  Students: <strong>{selectedInstance.student_count}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-medium">Class Average Attainment</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {selectedInstance.average_attainment_pct}%
                </span>
              </div>

              <button
                onClick={handleBackToAllCourses}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back to Courses
              </button>
            </div>
          </div>

          {/* Embedded Course Attainment Report matching course-instance/[instanceId].tsx notation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <CourseAttainmentReport
              courseId={String(selectedCourse.course_id)}
              offeringId={String(selectedInstance.instance_id)}
              courseMetadata={{
                course_code: selectedCourse.course_code,
                course_title: selectedCourse.course_title,
                instance_name: selectedInstance.instance_name,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicAdminAttainmentView;
