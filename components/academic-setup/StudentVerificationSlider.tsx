import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StudentVerificationCard, {
  StudentVerificationStatus,
} from "./StudentVerificationCard";

export interface StudentRecord {
  id: string;
  name: string;
  registerNo: string;
  marks: string;
  status: StudentVerificationStatus;
}

export interface StudentVerificationSliderProps {
  students?: StudentRecord[];
  selectedId?: string;
  onSelectStudent?: (student: StudentRecord) => void;
  className?: string;
}

const DEFAULT_STUDENTS: StudentRecord[] = [
  {
    id: "1",
    name: "Sanjay Murugan",
    registerNo: "24CS1041",
    marks: "45 / 50",
    status: "needs_review",
  },
  {
    id: "2",
    name: "Kavin Raj",
    registerNo: "24CS1042",
    marks: "42 / 50",
    status: "ready_to_verify",
  },
  {
    id: "3",
    name: "Harini Ramesh",
    registerNo: "24CS1043",
    marks: "44 / 50",
    status: "verified",
  },
  {
    id: "4",
    name: "Deepika Sundaram",
    registerNo: "24CS1044",
    marks: "43.5 / 50",
    status: "needs_review",
  },
  {
    id: "5",
    name: "Arun Balaji",
    registerNo: "24CS1045",
    marks: "44.5 / 50",
    status: "verified",
  },
  {
    id: "6",
    name: "Pavithra S",
    registerNo: "24CS1046",
    marks: "48 / 50",
    status: "verified",
  },
  {
    id: "7",
    name: "Vikram R",
    registerNo: "24CS1047",
    marks: "41 / 50",
    status: "needs_review",
  },
];

export const StudentVerificationSlider: React.FC<
  StudentVerificationSliderProps
> = ({
  students = DEFAULT_STUDENTS,
  selectedId = "1",
  onSelectStudent,
  className = "",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(selectedId);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = (student: StudentRecord) => {
    setActiveId(student.id);
    if (onSelectStudent) {
      onSelectStudent(student);
    }
  };

  return (
    <div className={`relative flex items-center w-full gap-2 py-3 ${className}`}>
      {/* Left Navigation Arrow */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll Left"
        className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-xs transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="flex flex-1 items-center gap-3 overflow-x-auto scroll-smooth px-1 py-1 [&::-webkit-scrollbar]:hidden"
      >
        {students.map((student) => (
          <StudentVerificationCard
            key={student.id}
            id={student.id}
            name={student.name}
            registerNo={student.registerNo}
            marks={student.marks}
            status={student.status}
            selected={student.id === activeId}
            onClick={() => handleCardClick(student)}
          />
        ))}
      </div>

      {/* Right Navigation Arrow */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll Right"
        className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-xs transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800"
      >
        <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>
    </div>
  );
};

export default StudentVerificationSlider;
