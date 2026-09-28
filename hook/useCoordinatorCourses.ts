import { useState, useEffect, useCallback } from "react";
import Models from "@/imports/models.import";
import useDebounce from "@/hook/useDebounce";

export interface CoordinatorCourse {
  id: number;
  course_code?: string;
  code?: string;
  course_title?: string;
  title?: string;
  name?: string;
  department_name?: string;
  department?: string;
  programme?: string;
  degree?: string;
  year?: number;
  semester?: number | string;
  academic_year?: string;
  batch?: string;
  sections_count?: number;
  total_sections?: number;
  instances_count?: number;
  enrolled_students_count?: number;
  total_students?: number;
  active_tests_count?: number;
  total_questions_count?: number;
  syllabus_status?: string;
  role_type?: string;
  faculty_role?: string;
  role?: string;
  [key: string]: any;
}

export const useCoordinatorCourses = () => {
  const [courses, setCourses] = useState<CoordinatorCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let userId = 1;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u?.id) userId = u.id;
        }
      } catch (e) {
        console.error("Error reading user from localStorage:", e);
      }

      const body: any = {
        faculty_id: userId,
        coordinator_id: userId,
      };

      if (selectedSemester && selectedSemester !== "all") {
        body.semester = selectedSemester;
      }
      if (debouncedSearch && debouncedSearch.trim() !== "") {
        body.search = debouncedSearch.trim();
      }

      const res: any = await Models.course.faculty_dashboard_overview(body);
      const rawCourses: any[] = res?.courses || (Array.isArray(res) ? res : []);

      // Filter for coordinator role
      const coordOnly = rawCourses.filter((c: any) => {
        const roleType =
          c.role_type ||
          ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
            ? "coordinator"
            : "");
        return roleType === "coordinator";
      });

      // If coordinator filtering returns results, use it; otherwise fallback to raw courses (in case role is generic)
      const finalCourses = coordOnly.length > 0 ? coordOnly : rawCourses;
      setCourses(finalCourses);
    } catch (err: any) {
      console.error("Failed to load coordinator courses:", err);
      setError(err?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSemester]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    search,
    setSearch,
    selectedSemester,
    setSelectedSemester,
    error,
    refresh: fetchCourses,
  };
};

export default useCoordinatorCourses;
