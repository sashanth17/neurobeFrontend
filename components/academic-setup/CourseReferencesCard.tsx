import React from "react";
import {
  FileText,
  GitBranch,
  Layers,
  GraduationCap,
  Calendar,
  BookOpen,
  HelpCircle,
  FileCode,
  CheckCircle2,
} from "lucide-react";

export interface ReferenceItem {
  id: string;
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  isActive?: boolean;
  isCompleted?: boolean;
  category?: "course" | "assessment";
  onClick?: () => void;
}

export interface CourseReferencesCardProps {
  title?: string;
  availableCountText?: string;
  items?: ReferenceItem[];
  assessmentItems?: ReferenceItem[];
  onItemClick?: (item: ReferenceItem) => void;
  className?: string;
}

const DEFAULT_COURSE_ITEMS: ReferenceItem[] = [
  {
    id: "syllabus",
    icon: <FileText className="h-5 w-5 text-white" />,
    title: "Syllabus",
    subtitle: "5 Units • CO1-CO6",
    isActive: true,
    isCompleted: true,
    category: "course",
  },
  {
    id: "copo",
    icon: <GitBranch className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "CO-PO Mapping",
    subtitle: "11 Program Outcomes",
    isCompleted: true,
    category: "course",
  },
  {
    id: "topics",
    icon: <Layers className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "Topics",
    subtitle: "5 Units • 20 Main Topics",
    isCompleted: true,
    category: "course",
  },
  {
    id: "pedagogy",
    icon: <GraduationCap className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "Pedagogy",
    subtitle: "Teaching Approaches",
    isCompleted: true,
    category: "course",
  },
  {
    id: "lesson-plan",
    icon: <Calendar className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "Lesson Plan",
    subtitle: "Course Delivery Plan",
    isCompleted: true,
    category: "course",
  },
  {
    id: "learning-materials",
    icon: <BookOpen className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "Learning Materials",
    subtitle: "6 Approved Materials",
    isCompleted: true,
    category: "course",
  },
];

const DEFAULT_ASSESSMENT_ITEMS: ReferenceItem[] = [
  {
    id: "question-bank",
    icon: <HelpCircle className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "Question Bank",
    subtitle: "12 Approved Questions",
    isCompleted: true,
    category: "assessment",
  },
  {
    id: "cia-papers",
    icon: <FileCode className="h-5 w-5 text-pri dark:text-gray-400" />,
    title: "CIA Question Papers",
    subtitle: "3 Approved Papers",
    isCompleted: true,
    category: "assessment",
  },
];

const CourseReferencesCard: React.FC<CourseReferencesCardProps> = ({
  title = "COURSE REFERENCES",
  availableCountText = "8 Available References",
  items = DEFAULT_COURSE_ITEMS,
  assessmentItems = DEFAULT_ASSESSMENT_ITEMS,
  onItemClick,
  className = "",
}) => {
  const renderItem = (item: ReferenceItem) => {
    const isSelected = item.isActive;

    return (
      <div
        key={item.id}
        onClick={() => {
          if (item.onClick) item.onClick();
          if (onItemClick) onItemClick(item);
        }}
        className={`flex cursor-pointer items-center justify-between rounded-2xl p-3 transition ${isSelected
          ? "border-2 border-[#7c3aed] bg-[#f5f3ff] dark:border-purple-600 dark:bg-purple-950/40 shadow-sm"
          : "border border-gray-200/90 bg-white dark:border-gray-800 dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700"
          }`}
      >
        <div className="flex items-center gap-3.5">
          {/* Icon Box */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${isSelected
              ? "bg-[#7c3aed] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-700/60"
              }`}
          >
            {item.icon}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h4 className="text-sm font-bold text-[#000] dark:text-white leading-tight">
              {item.title}
            </h4>
            <p className="mt-0.5 text-xs font-semibold text-pri dark:text-gray-400">
              {item.subtitle}
            </p>
          </div>
        </div>

        {/* Right Status Checkmark */}
        {item.isCompleted !== false && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-xs font-semibold text-pri dark:text-pri">
          {availableCountText}
        </p>
      </div>

      {/* Main Course References */}
      <div className="space-y-3">
        {items.map(renderItem)}
      </div>

      {/* Assessment References Header */}
      {assessmentItems && assessmentItems.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#000] dark:text-pri">
            ASSESSMENT REFERENCES
          </p>
          <div className="space-y-3">
            {assessmentItems.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReferencesCard;
