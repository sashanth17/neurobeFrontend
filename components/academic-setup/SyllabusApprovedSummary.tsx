import { BookOpen, Pencil, ArrowRight } from "lucide-react";
import CourseOutcomesSummary from "@/components/academic-setup/CourseOutcomesSummary";
import UnitTopicsSummary from "@/components/academic-setup/UnitTopicsSummary";
import LabExperimentsSummary from "@/components/academic-setup/LabExperimentsSummary";
import TextbooksSummary from "@/components/academic-setup/TextbooksSummary";

interface SyllabusApprovedSummaryProps {
  courseCode?: string;
  courseTitle?: string;
  theoryHours?: number;
  labHours?: number;
  credits?: number;
  ltpc?: string;
  onRevise?: () => void;
  onProceed?: () => void;
  data?: any
}

const SyllabusApprovedSummary = ({
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  theoryHours = 45,
  labHours = 30,
  credits = 4,
  ltpc = "3 — 0 — 2 — 4",
  onRevise,
  onProceed,
  data
}: SyllabusApprovedSummaryProps) => (
  <div className="space-y-4">
    {/* Status + Actions card */}
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Status: Approved
          </span>
          <h2 className="mt-1 text-xl font-bold text-color1 dark:text-white">
            {courseCode} — {courseTitle}
          </h2>
          <p className="text-sm text-pri mt-1">
            Theory Hours: {theoryHours} | Lab Hours: {labHours} | Credits: {credits}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRevise}
            className="flex items-center bg-grey gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            <Pencil className="h-4 w-4" /> Revise Syllabus
          </button>
          <button
            onClick={onProceed}
            className="flex items-center gap-1.5 rounded-lg bg-color2 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Next: CO-PO Mapping <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
        <button onClick={onProceed} className="flex items-center gap-1 text-sm font-semibold text-color2 hover:underline">
          Next: CO-PO Mapping <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-sm text-pri">Define direct correlations between Course Outcomes and Program Outcomes.</p>
      </div>
    </div>

    {/* Course Details */}
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
          <BookOpen className="h-4.5 w-4.5 text-color2" />
        </div>
        <h3 className="text-lg font-bold text-color dark:text-white">Course Details</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Course Code & Title", value: `${courseCode} — ${courseTitle}` },
          { label: "L-T-P-C Structure", value: ltpc },
          { label: "Theory & Lab Hours", value: `Theory: ${theoryHours}h • Lab: ${labHours}h` },
          { label: "Total Contact Hours", value: `${theoryHours + labHours} Hours` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 bg-sec">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-pri">{item.label}</p>
            <p className="text-sm font-bold text-color dark:text-gray-200">{item.value}</p>
          </div>
        ))}
      </div>
    </div>

    <CourseOutcomesSummary outcomes={data?.outcomes} />
    <UnitTopicsSummary units={data?.units} />
    <LabExperimentsSummary />
    <TextbooksSummary textbook={data?.textbooks} reference={data?.reference_books} />
  </div>
);

export default SyllabusApprovedSummary;
