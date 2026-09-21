import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import CourseOutcomes from "@/components/academic-setup/CourseOutcomes";
import UnitTopics from "@/components/academic-setup/UnitTopics";
import PrescribedTextbooks from "@/components/academic-setup/PrescribedTextbooks";

const TABS = [
  "All Fields",
  "Course Details",
  "COs & Knowledge Levels",
  "Units & Topics",
  "Prescribed Textbooks",
];

const ExtractedDataPanel = (props: any) => {
  const {
    data,
    courseData,
    onAddTopic,
    onDeleteTopic,
    handleAddTextbook,
    onDeleteTextbook,
    handleAddReference,
    onDeleteReference,
    handleSaveOutcome,
    handleAcceptOutcome,
    handleKnowledgeLevelChange,
    onUpdateUnitHours,
    onUpdateUnitTitle,
    onUpdateLTPC,
    syllabusId,
  } = props;

  const [activeTab, setActiveTab] = useState("All Fields");

  // Initial values extracted from jobData or courseData
  const getInitL = () => String(data?.lectureHours ?? data?.lecture_hours ?? data?.course_data?.lecture_hours ?? courseData?.latest_syllabus?.lecture_hours ?? courseData?.lecture_hours ?? 3);
  const getInitT = () => String(data?.tutorialHours ?? data?.tutorial_hours ?? data?.course_data?.tutorial_hours ?? courseData?.latest_syllabus?.tutorial_hours ?? courseData?.tutorial_hours ?? 0);
  const getInitP = () => String(data?.practicalHours ?? data?.practical_hours ?? data?.course_data?.practical_hours ?? courseData?.latest_syllabus?.practical_hours ?? courseData?.practical_hours ?? 0);
  const getInitC = () => String(courseData?.credits ?? courseData?.latest_syllabus?.credits ?? data?.credits ?? 4);

  const [L, setL] = useState(getInitL);
  const [T, setT] = useState(getInitT);
  const [P, setP] = useState(getInitP);
  const [C, setC] = useState(getInitC);

  useEffect(() => {
    setL(getInitL());
    setT(getInitT());
    setP(getInitP());
    setC(getInitC());
  }, [data, courseData]);

  const handleLChange = (val: string) => {
    setL(val);
    const numVal = parseFloat(val) || 0;
    onUpdateLTPC?.({
      lecture_hours: numVal,
      tutorial_hours: parseFloat(T) || 0,
      practical_hours: parseFloat(P) || 0,
    });
  };

  const handleTChange = (val: string) => {
    setT(val);
    const numVal = parseFloat(val) || 0;
    onUpdateLTPC?.({
      lecture_hours: parseFloat(L) || 0,
      tutorial_hours: numVal,
      practical_hours: parseFloat(P) || 0,
    });
  };

  const handlePChange = (val: string) => {
    setP(val);
    const numVal = parseFloat(val) || 0;
    onUpdateLTPC?.({
      lecture_hours: parseFloat(L) || 0,
      tutorial_hours: parseFloat(T) || 0,
      practical_hours: numVal,
    });
  };

  const lNum = parseFloat(L) || 0;
  const tNum = parseFloat(T) || 0;
  const pNum = parseFloat(P) || 0;
  const theoryHoursDisplay = (lNum + tNum) > 0 ? (lNum + tNum) * 15 : (courseData?.latest_syllabus?.total_theory_hours ?? data?.total_theory_hours ?? 45);
  const labHoursDisplay = pNum > 0 ? pNum * 15 : (courseData?.latest_syllabus?.total_lab_hours ?? data?.total_lab_hours ?? 0);
  const totalContactDisplay = theoryHoursDisplay + labHoursDisplay;

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = {
    "Course Details": useRef<HTMLDivElement>(null),
    "COs & Knowledge Levels": useRef<HTMLDivElement>(null),
    "Units & Topics": useRef<HTMLDivElement>(null),
    "Prescribed Textbooks": useRef<HTMLDivElement>(null),
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "All Fields") {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const ref = sectionRefs[tab as keyof typeof sectionRefs];
    if (ref?.current && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const sectionTop = ref.current.getBoundingClientRect().top;
      const offset =
        scrollRef.current.scrollTop + (sectionTop - containerTop) - 8;
      scrollRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const courseCodeDisplay = courseData?.course_code || data?.courseCode || data?.course_code || "";
  const courseTitleDisplay = courseData?.course_title || data?.courseName || data?.course_title || "";

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-primary-custom text-white"
                : "border border-gray-200 bg-white text-[#000] hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Textbooks accept row */}
      <div className="text-pri mb-3 flex items-center gap-2 text-sm">
        <span>Textbooks:</span>
        <button className="bg-primary2 text-color2 hover:bg-color2/20 flex items-center gap-1 rounded-md px-3 py-1 font-semibold">
          <CheckCircle2 className="h-4 w-4" /> Accept All Inferred Levels
        </button>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Section 1 — Course Identification & L-T-P-C Structure */}
        <div
          ref={sectionRefs["Course Details"]}
          className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-primary2 text-color2 flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold dark:bg-gray-100 dark:text-[#000]">
                1
              </span>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#000] dark:text-white">
                Course Identification & L-T-P-C Structure
              </h3>
            </div>
            <span className="text-xs text-color2 font-medium">
              L, T, P are editable (extracted from syllabus)
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-pri block text-xs font-semibold">
                  Course Code:
                </label>
                <span className="text-[10px] text-gray-400 font-medium">From Course Table</span>
              </div>
              <input
                value={courseCodeDisplay}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100/80 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-pri block text-xs font-semibold">
                  Course Title:
                </label>
                <span className="text-[10px] text-gray-400 font-medium">From Course Table</span>
              </div>
              <input
                disabled
                value={courseTitleDisplay}
                className="w-full rounded-lg border border-gray-200 bg-gray-100/80 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-3">
            <div>
              <label className="text-pri mb-1 block text-xs font-semibold">Lecture (L):</label>
              <input
                type="number"
                min="0"
                step="1"
                value={L}
                onChange={(e) => handleLChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-color2 focus:ring-1 focus:ring-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-pri mb-1 block text-xs font-semibold">Tutorial (T):</label>
              <input
                type="number"
                min="0"
                step="1"
                value={T}
                onChange={(e) => handleTChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-color2 focus:ring-1 focus:ring-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-pri mb-1 block text-xs font-semibold">Practical (P):</label>
              <input
                type="number"
                min="0"
                step="1"
                value={P}
                onChange={(e) => handlePChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-color2 focus:ring-1 focus:ring-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-pri block text-xs font-semibold">Credits (C):</label>
                <span className="text-[10px] text-gray-400 font-medium">Locked</span>
              </div>
              <input
                disabled
                value={C}
                className="w-full rounded-lg border border-gray-200 bg-gray-100/80 px-3 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400"
              />
            </div>
          </div>

          <div className="text-pri flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            <span>
              Theory Hours:{" "}
              <strong className="text-[#000] dark:text-gray-200">
                {theoryHoursDisplay} hrs
              </strong>
              &nbsp; • &nbsp; Lab Hours:{" "}
              <strong className="text-[#000] dark:text-gray-200">
                {labHoursDisplay} hrs
              </strong>
            </span>
            <span className="text-md text-color2 font-bold">
              Total Contact: {totalContactDisplay} hrs
            </span>
          </div>
        </div>

        {/* Section 2 — Course Outcomes */}
        <div ref={sectionRefs["COs & Knowledge Levels"]}>
          <CourseOutcomes 
            outcomes={data?.outcomes}
            onSaveOutcome={handleSaveOutcome}
            onAcceptOutcome={handleAcceptOutcome}
            onKnowledgeLevelChange={handleKnowledgeLevelChange}
          />
        </div>

        {/* Section 3 — Unit Titles, Hours & Topics */}
        <div ref={sectionRefs["Units & Topics"]}>
          <UnitTopics
            data={data?.units}
            onAddTopic={onAddTopic}
            onDeleteTopic={onDeleteTopic}
            onUpdateHours={onUpdateUnitHours}
            onUpdateUnitTitle={onUpdateUnitTitle}
          />
        </div>

        {/* Section 4 — Prescribed Textbooks */}
        <div ref={sectionRefs["Prescribed Textbooks"]}>
          <PrescribedTextbooks
            textBooks={data?.textbooks}
            reference={data?.reference_books}
            onDeleteBook={onDeleteTextbook}
            onAddBook={handleAddTextbook}
            syllabusId={syllabusId}
            onAddReference={handleAddReference}
            onDeleteReference={onDeleteReference}
          />
        </div>
      </div>
    </div>
  );
};

export default ExtractedDataPanel;
