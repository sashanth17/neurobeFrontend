import { ChevronLeft, Users } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { setCourseView } from "@/store/courseViewSlice";
import { IRootState } from "@/store";

type CourseBannerProps = {
  courseCode: string;
  courseTitle: string;
  description?: string;
  programme: string;
  batch: string;
  academicYear: string;
  students: string;
  selectedCourse?: { value: string; label: string };
  courseOptions?: { value: string; label: string }[];
  onCourseChange?: (val: any) => void;
  /** Accepted for backward compat — view highlight is driven by Redux, this value is ignored */
  activeView?: string;
  onBack?: () => void;
  onViewChange?: (view: "coordinator" | "instructor") => void;
  toogle?: string;
};

export default function CourseBanner({
  courseCode,
  courseTitle,
  description,
  programme,
  batch,
  academicYear,
  students,
  selectedCourse,
  courseOptions = [],
  onCourseChange,
  onBack,
  onViewChange,
  toogle
}: CourseBannerProps) {
  const dispatch = useDispatch();

  // Redux is the single source of truth for the active view — always starts as "coordinator"
  const activeView = useSelector((state: IRootState) => state.courseView.activeView);

  // Reset to coordinator only once per app session (not on every page navigation)
  useEffect(() => {
    const alreadySet = sessionStorage.getItem("courseViewInitialized");
    if (!alreadySet) {
      dispatch(setCourseView("coordinator"));
      sessionStorage.setItem("courseViewInitialized", "1");
    }
  }, []);

  const handleViewChange = (view: "coordinator" | "instructor") => {
    dispatch(setCourseView(view));
    onViewChange?.(view);
  };
  return (
    <div className="mb-6 mt-2 rounded-2xl bg-color1 px-8 py-5">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-1 text-sm text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Courses
        </button>

        <CustomSelect
          options={courseOptions}
          value={ selectedCourse || null}
          onChange={onCourseChange}
          placeholder={`Course: ${selectedCourse || courseCode}`}
          isSearchable={false}
          isClearable={false}
          className="course-banner-select w-30"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        />
      </div>

      {/* Title Row */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="page-ti text-white pb-3">
            {courseCode} — {courseTitle}
          </h1>
          {description && (
            <p className=" text-sm text-white/60">{description}</p>
          )}
        </div>

        {/* View Toggle */}
        {toogle != "instructor" &&
          <div className="flex shrink-0 items-center border-[0.5px] border-[#fff]/20 rounded-xl  p-1">
            <button
              onClick={() => handleViewChange("coordinator")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeView === "coordinator"
                  ? "bg-primary-custom text-white"
                  : "text-white hover:text-white"
                }`}
            >
              Coordinator View
            </button>
            <button
              onClick={() => handleViewChange("instructor")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeView === "instructor"
                  ? "bg-primary-custom text-white"
                  : "text-white hover:text-white"
                }`}
            >
              Instructor View
            </button>
          </div>
        }
      </div>

      {/* Meta Row */}
      <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-white/70">
        <span>Programme:</span>
        <span className="font-semibold text-white">{programme}</span>
        <span className="mx-2 text-white/30">•</span>
        <span>Batch:</span>
        <span className="font-semibold text-white">{batch}</span>
        <span className="mx-2 text-white/30">•</span>
        <span>Academic Year / Term:</span>
        <span className="font-semibold text-white">{academicYear}</span>
        <span className="mx-2 text-white/30">•</span>
        <Users className="h-4 w-4" />
        <span className="font-semibold text-white">{students}</span>
      </div>
    </div>
  );
}
