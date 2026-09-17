import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Hourglass,
  Check,
  ClipboardCheck,
  Sparkles,
  Save,
  EditIcon,
  ClipboardList,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Dropdown, Success, useSetState } from "@/utils/function.utils";
import TableComponent from "@/components/common-components/TableComponent";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StepHeader from "@/components/academic-setup/StepHeader";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import TableTitle from "@/components/common-components/TableTitle";
import GenericTabs from "@/components/common-components/GenericTabs";
import AccordiansStyle from "@/components/common-components/AccordiansStyle";
import PageFooter from "@/components/common-components/PageFooter";
import GenerateLessonPlanModal from "@/components/lesson-plan/GenerateLessonPlanModal";
import EditLessonPlanModal, { LessonPlanEditData } from "@/components/lesson-plan/EditLessonPlanModal";
import ReviewLessonItemModal, { ReviewLessonItemData } from "@/components/lesson-plan/ReviewLessonItemModal";
import { useRouter } from "next/router";
import { UNIT_TABS } from "@/utils/constant.utils";
import PageHeader from "@/components/common-components/PageHeader";
import { useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";
import GenericTabsData from "@/components/common-components/GenericTabsData";

const MOCK_LESSON_PLANS = [
  {
    id: 1,
    sessionNo: 1,
    unit: "Unit I",
    topic: "Introduction to Stacks & LIFO Principle",
    plannedDate: "2026-08-05",
    actualDate: "2026-08-05",
    pedagogy: "Chalk & Board + Animation",
    coMapped: "CO1",
    status: "Completed",
  },
  {
    id: 2,
    sessionNo: 2,
    unit: "Unit I",
    topic: "Array Implementation of Stacks & Operations",
    plannedDate: "2026-08-07",
    actualDate: "2026-08-07",
    pedagogy: "Live Coding Walkthrough",
    coMapped: "CO1",
    status: "Completed",
  },
  {
    id: 3,
    sessionNo: 3,
    unit: "Unit I",
    topic: "Infix to Postfix Expression Conversion Algorithm",
    plannedDate: "2026-08-10",
    actualDate: "2026-08-12",
    pedagogy: "Problem Solving Workshop",
    coMapped: "CO1",
    status: "Completed",
  },
  {
    id: 4,
    sessionNo: 4,
    unit: "Unit II",
    topic: "Binary Search Trees: Insertion & Search",
    plannedDate: "2026-08-14",
    actualDate: "-",
    pedagogy: "Interactive Visualizer",
    coMapped: "CO2",
    status: "In Progress",
  },
  {
    id: 5,
    sessionNo: 5,
    unit: "Unit II",
    topic: "Tree Deletion & AVL Tree Balancing",
    plannedDate: "2026-08-17",
    actualDate: "-",
    pedagogy: "Flipped Classroom",
    coMapped: "CO2",
    status: "Scheduled",
  },
];

const UNIT_OPTIONS = [
  { value: "all", label: "All Units" },
  { value: "Unit I", label: "Unit I - Stacks & Queues" },
  { value: "Unit II", label: "Unit II - Trees" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Completed", label: "Completed" },
  { value: "In Progress", label: "In Progress" },
  { value: "Scheduled", label: "Scheduled" },
];

const STAT_TABS = [
  {
    key: "total-topics",
    label: " Total Topics",
    count: 22,
    subLabel: "Approved curriculum count",
    icon: <Check className="h-5 w-5" />,
  },
  {
    key: "total-hours",
    label: "Total Hours",
    subLabel: "Allocated semester teaching time",
    count: 45,
    icon: <Hourglass className="h-5 w-5" />,
  },
  {
    key: "reviewed",
    label: "Reviewed",
    subLabel: "Lesson Plan Review",
    count: 3,
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
];

const RAW_UNIT_DATA: Record<
  string,
  {
    title: string;
    totalHours: number;
    topics: {
      id: string;
      seq: number;
      title: string;
      level: string;
      hours: string;
      textbook: string;
      reference: string;
      pedagogy: string;
      status: "Reviewed" | "Needs Review";
    }[];
  }
> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    totalHours: 9,
    topics: [
      {
        id: "1.1", seq: 1,
        title: "Network Models & Layered Architecture",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 1",
        reference: "Data Communications and Networking — Chapter 2",
        pedagogy: "Concept Exploration",
        status: "Reviewed",
      },
      {
        id: "1.2", seq: 2,
        title: "Physical Layer & Transmission Media",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Needs Review",
      },
      {
        id: "1.3", seq: 3,
        title: "Network Topologies & Switching Techniques",
        level: "K2", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 8",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "1.4", seq: 4,
        title: "Network Performance Metrics",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 1",
        reference: "Computer Networks: A Systems Approach — Chapter 1",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    totalHours: 7,
    topics: [
      {
        id: "2.1", seq: 1,
        title: "Framing & Error Detection",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 10",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "2.2", seq: 2,
        title: "Flow Control Protocols",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 11",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
      {
        id: "2.3", seq: 3,
        title: "MAC Protocols & CSMA/CD",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 4",
        reference: "Computer Networking: A Top-Down Approach — Chapter 5",
        pedagogy: "Simulation Lab",
        status: "Needs Review",
      },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    totalHours: 10,
    topics: [
      {
        id: "3.1", seq: 1,
        title: "IP Addressing & Subnetting",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Hands-on Lab",
        status: "Needs Review",
      },
      {
        id: "3.2", seq: 2,
        title: "Routing Algorithms",
        level: "K4", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Data Communications and Networking — Chapter 14",
        pedagogy: "Case Study Analysis",
        status: "Needs Review",
      },
      {
        id: "3.3", seq: 3,
        title: "IPv6 & Transition Mechanisms",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Flipped Classroom",
        status: "Needs Review",
      },
      {
        id: "3.4", seq: 4,
        title: "ICMP & Network Diagnostics",
        level: "K3", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 4",
        reference: "Computer Networks: A Systems Approach — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Needs Review",
      },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & TCP/UDP",
    totalHours: 8,
    topics: [
      {
        id: "4.1", seq: 1,
        title: "TCP Connection Management",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Computer Networks — Chapter 6",
        pedagogy: "Demonstration",
        status: "Needs Review",
      },
      {
        id: "4.2", seq: 2,
        title: "UDP & Real-time Applications",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Data Communications and Networking — Chapter 23",
        pedagogy: "Comparative Analysis",
        status: "Needs Review",
      },
      {
        id: "4.3", seq: 3,
        title: "Congestion Control Mechanisms",
        level: "K4", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 6",
        reference: "Computer Networking: A Top-Down Approach — Chapter 3",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Security",
    totalHours: 7,
    topics: [
      {
        id: "5.1", seq: 1,
        title: "DNS & HTTP Protocols",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Computer Networks — Chapter 7",
        pedagogy: "Interactive Demo",
        status: "Needs Review",
      },
      {
        id: "5.2", seq: 2,
        title: "Email & FTP Protocols",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Data Communications and Networking — Chapter 26",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "5.3", seq: 3,
        title: "Network Security Fundamentals",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 8",
        reference: "Computer Networking: A Top-Down Approach — Chapter 8",
        pedagogy: "Guest Lecture",
        status: "Needs Review",
      },
    ],
  },
};



const totalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const totalUnits = UNIT_TABS.length;
const totalRecs = Object.values(RAW_UNIT_DATA).reduce(
  (s, u) => s + u.topics.length,
  0,
);

const LessonPlan = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");
  console.log("course_id", course_id)

  const [state, setState] = useSetState({
    search: "",
    unitFilter: "all",
    statusFilter: "all",
    loading: false,
    activeTab: "unit-1",
    activeBannerTab: "coordinator",
    lession_data: null,
    matrix: [],
    generateLoading: false,
    generatedResponse: null,
  });

  useEffect(() => {
    dispatch(setPageTitle("Lesson Plan"));
  }, [dispatch]);

  useEffect(() => {
    course_data()
    coordinator_course_data()
  }, [course_id]);

  const lession_data = async (syllabus_id,unit) => {
    try {

      const res: any = await Models.lession_plan.detail(syllabus_id, unit);
      const data = [{
        key: "total-topics",
        label: " Total Topics",
        count: res?.metrics?.topics?.value,
        subLabel: "Approved curriculum count",
        icon: <Check className="h-5 w-5" />,
      },
      {
        key: "total-hours",
        label: "Total Hours",
        subLabel: "Allocated semester teaching time",
        count: res?.metrics?.contact_hours?.value,

        icon: <Hourglass className="h-5 w-5" />,
      },
      {
        key: "reviewed",
        label: "Reviewed",
        subLabel: "Lesson Plan Review",
        count: res?.metrics?.lesson_plan_review?.reviewed_count,

        icon: <ClipboardCheck className="h-5 w-5" />,
      }]
      setState({ lession_data: res, matrix: data });

    } catch (error) {
      console.log("error", error);
    }
  };

  const course_data = async () => {
    try {
      const res: any = await Models.course.detail(course_id);
      setState({ courseData: res });
      console.log("course detail →", res);
      lession_data(res?.latest_syllabus?.id,1)

    } catch (error) {
      console.log("error", error);
    }
  };
 

  const coordinator_course_data = async () => {
    try {
      const user = localStorage.getItem("user")
      const u = JSON.parse(user);
      const body = {
        coordinator_id: u?.id
      }
      const res = await Models.course.list(body);
      const dropdown = Dropdown(res, "course_code")
      // setState({ courseData: res });
      console.log("coordinator_course_data detail →", dropdown);
      setState({ course_list: dropdown })
    } catch (error) {
      console.log("error", error);
    }
  };


  const raw = RAW_UNIT_DATA[state.activeTab];

  // modal state
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: LessonPlanEditData | null;
  }>({ open: false, data: null });

  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    data: ReviewLessonItemData | null;
    unitKey: string;
    topicId: string;
  }>({ open: false, data: null, unitKey: "", topicId: "" });

  const [generateModal, setGenerateModal] = useState(false);

  // ── Per-unit reviewed topic tracking ──────────────────────────────────────
  // Pre-seed with topics that already have status "Reviewed" in RAW_UNIT_DATA
  const [reviewedMap, setReviewedMap] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.entries(RAW_UNIT_DATA).map(([unitKey, unit]) => [
          unitKey,
          new Set(
            unit.topics
              .filter((t) => t.status === "Reviewed")
              .map((t) => t.id),
          ),
        ]),
      ),
  );

  const totalTopicCount = Object.values(RAW_UNIT_DATA).reduce(
    (s, u) => s + u.topics.length,
    0,
  );
  const totalReviewedCount = Object.values(reviewedMap).reduce(
    (s, set) => s + set.size,
    0,
  );
  const allReviewed = totalReviewedCount >= totalTopicCount;

  const markReviewed = (unitKey: string, topicId: string) => {
    setReviewedMap((prev) => {
      const next = new Set<string>(prev[unitKey] ?? new Set<string>());
      next.add(topicId);
      return { ...prev, [unitKey]: next };
    });
  };

  // ── Pre-generate: topics list for the accordion (level + hours badges only) ──
  const buildInitialTopics = () => {
    if (!state?.lession_data?.selected_unit?.sessions) return [];
    return state?.lession_data?.selected_unit?.sessions.map((session: any) => ({
      id: session.slot_id,
      title: `Topic ${session.topic_code} — ${session.topic_name}`,
      collapsedBadge: [
        { label: `Knowledge Level ${session.level}`, className: "bg-color2-l text-color2 font-bold" },
        { label: session.hours_display, className: "bg-gray-200 text-pri font-bold" },
      ],
      items: [],
    }));
  };

  // ── Generated: flat table columns matching the screenshot ──
  const lessonPlanColumns = [
    {
      accessor: "seq",
      title: "SEQ",
      render: ({ seq }: any) => (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-color2">
          {String(seq).padStart(2, "0")}
        </span>
      ),
    },
    {
      accessor: "title",
      title: "TOPIC",
      render: ({ title, id }: any) => (
        <div>
          <p className="font-semibold text-[#000] dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs text-[#000]">Topic {id}</p>
        </div>
      ),
    },
    {
      accessor: "level",
      title: "LEVEL",
      render: ({ level }: any) => (
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-[#000]">
          {level}
        </span>
      ),
    },
    {
      accessor: "textbook",
      title: "BOOKS & REFERENCES",
      render: ({ textbook, reference }: any) => (
        <div className="min-w-0">
          <p className="text-xs text-[#000]">
            <span className="font-semibold">Textbook:</span> {textbook}
          </p>
          <p className="mt-0.5 text-xs text-[#000]">
            <span className="font-semibold">Reference:</span> {reference}
          </p>
        </div>
      ),
    },
    {
      accessor: "hours",
      title: "HOURS",
      render: ({ hours }: any) => (
        <span className="text-xs font-semibold text-[#000]">{hours}</span>
      ),
    },
    {
      accessor: "pedagogy",
      title: "PEDAGOGY",
      render: ({ pedagogy }: any) => (
        <span className="text-xs font-semibold text-color2">{pedagogy}</span>
      ),
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({ status, id, seq, title, level, hours, textbook, reference, pedagogy }: any) => {
        const isReviewed =
          status === "Reviewed" || (reviewedMap[state.activeTab]?.has(id) ?? false);

        return isReviewed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Reviewed <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              setReviewModal({
                open: true,
                unitKey: state.activeTab,
                topicId: id,
                data: {
                  id, seq, title, level, hours, textbook, reference, pedagogy,
                  unitLabel: raw?.title ?? "",
                },
              })
            }
            className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:border-orange-400 hover:bg-orange-100 transition-colors cursor-pointer"
          >
            • Needs Review
          </button>
        );
      },
    },
    {
      accessor: "id",
      title: "EDIT",
      render: ({ title, id, seq, level, hours, textbook, reference, pedagogy, status }: any) => (
        <button
          type="button"
          onClick={() =>
            setEditModal({
              open: true,
              data: {
                id, seq, title, level, hours, textbook, reference, pedagogy, status,
                unitLabel: raw?.title ?? "",
              },
            })
          }
          className="flex items-center gap-1 text-xs font-semibold text-pri hover:text-color2"
        >
          <EditIcon className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];

  const generateLessionPlan = async () => {
    try {
      setState({ generateLoading: true });
      
      // Poll until status is "complete" (infinite polling until complete)
      let pollAttempt = 0;
      const pollInterval = 2000; // 2 seconds
      
      const pollJob = async () => {
        try {
          const res: any = await Models.lession_plan.generate_teating_timeline(
            state.courseData?.latest_syllabus?.id
          );
          
          console.log('Poll response:', res);
          
          // Check if status is "complete" in the response
          const status = res?.status || res?.result?.status || "";
          const isComplete = status.toLowerCase() === "complete";
          
          if (isComplete) {
            // Job completed - store the response and show modal
            console.log("Lesson plan generation completed!");
            setState({ 
              generatedResponse: res,
              generateLoading: false,
              recommendationsGenerated: false  // Keep accordion view until user reviews
            });
            setGenerateModal(true);
          } else {
            // Keep polling indefinitely until complete
            pollAttempt++;
            console.log(`Status: ${status}, polling... (attempt ${pollAttempt})`);
            setTimeout(pollJob, pollInterval);
          }
        } catch (error) {
          console.log("Poll error:", error);
          // Retry even on error
          pollAttempt++;
          setTimeout(pollJob, pollInterval);
        }
      };
      
      // Start polling
      pollJob();
      
    } catch (error) {
      console.log("Generate error:", error);
      setState({ generateLoading: false });
    }
  };

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode={state.courseData?.course_code || ""}
        courseTitle={state.courseData?.course_title || ""}
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme={state.courseData?.programme || ""}
        batch={state.courseData?.batch_name || ""}
        academicYear={state.courseData?.academic_year || ""}
        students={`${state.courseData?.students_count ?? 0} Students`}
        selectedCourse={state.courseData?.course_code || ""}
        courseOptions={state.course_list}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="Lesson Plan"
        records={`${state.courseData?.course_code} - ${state.courseData?.course_title}`}
        subtitle={`Create a teaching plan using the approved topics, books, hours, and pedagogies.`}
        icon={<ClipboardList className="h-5 w-5 text-color2" />}

      />


      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {state.matrix?.map((tab) => (
          <StatTabCard
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            subLabel={tab.subLabel}
            count={tab.count}
            active={state.activeTab === tab.key}
          />
        ))}
      </div>

      <TableTitle
        title="Approved topcis"
        label={`${state?.lession_data?.unit_tabs?.length} Units`}
        subLabel={`${state?.lession_data?.selected_unit?.topics_count} Topics`}
      />

      <div className="mt-4">
        <GenericTabsData
          tabs={
            state?.lession_data?.unit_tabs?.map((unit: any) => ({
              key: `unit-${unit.unit_number}`,
              label: `${unit.unit_number}`,
            })) || []
          }
          activeKey={state.activeTab}
          onChange={(unit) => {
            setState({ activeTab: unit as string });
            // Extract unit number from key (e.g., "unit-1" -> 1)
            const unitNumber = parseInt((unit as string).split('-')[1], 10);
            lession_data(state?.courseData?.latest_syllabus?.id, unitNumber);
          }}
        />

        {!state.recommendationsGenerated ? (

           <AccordiansStyle
            expandable={false}
            topics={buildInitialTopics()}
            title={state?.lession_data?.selected_unit?.unit_title}
            subtitle={state?.lession_data?.selected_unit?.subtitle}
            topicCount={state?.lession_data?.selected_unit?.topics_count}
            footerContent={
              <>
                <Sparkles className="h-4 w-4" /> NEURO AI will sequence all topics,
                assign textbook chapters, calibrate session hours, and
                link pedagogy methods.
              </>
            }
          />
          /* ── Generated: flat table with header ── */
          
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 mb-5">
            {/* dark header */}
            <div className="flex items-center justify-between bg-[#111238] px-4 py-3 text-white">
              <div>
                <h3 className="text-lg font-bold">{state?.lession_data?.selected_unit?.unit_title}</h3>
                <p className="mt-0.5 text-sm text-white/70">
                  {state?.lession_data?.selected_unit?.subtitle}
                </p>
              </div>
              <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
                {state?.lession_data?.selected_unit?.hours_badge}
              </span>
            </div>
            <TableComponent
              records={state?.lession_data?.selected_unit?.sessions?.map((session: any) => ({
                id: session.slot_id,
                seq: session.seq,
                title: session.topic_name,
                level: session.level,
                textbook: session.textbook,
                reference: session.reference_book,
                hours: session.hours_display,
                pedagogy: session.pedagogy,
                status: session.status_display,
                status_badge: session.status_badge,
              })) ?? []}
              columns={lessonPlanColumns}
            />
          </div>
          /* ── Pre-generate: accordion with level/hours badges ── */
         
        )}
      </div>

      {state.recommendationsGenerated ? (
        <PageFooter
          content1={`Reviewed: ${totalReviewedCount}/${state?.lession_data?.selected_unit?.topics_count} Topics`}
          // content2="Course: CS309 — Computer Networks"
            content2={`Course: ${state.courseData?.course_code} - ${state.courseData?.course_title}`}
          batch
          actionBtn1={
            state.lessonApproved
              ? {
                label: "Next:Learning Material",
                icon: <Check className="h-4 w-4" />,
                onClick: () => router.push("/neurobe/learning-materials"),
                className: "create-btn",
              }
              : {
                label: "Approve Lesson Plan Review",
                icon: <Check className="h-4 w-4" />,
                onClick: async () => {
                  try {
                    await Models.lession_plan.approve(state.courseData?.latest_syllabus?.id);
                    Success("Lesson plan review completed successfully");
                    setState({ lessonApproved: true });
                  } catch (error) {
                    console.log("Approve error:", error);
                  }
                },
                // disabled: !allReviewed,
              }
          }
          actionBtn2={{
            label: "Save Draft",
            icon: <Save className="h-4 w-4" />,
            onClick: async () => {
              try {
                const res:any=await Models.lession_plan.draft(state.courseData?.latest_syllabus?.id);
                console.log("res",res)
                Success(res?.message);
              } catch (error) {
                console.log("Draft save error:", error);
              }
            },
          }}
        />
      ) : (
        <PageFooter
          content1="Ready to synthesize the 22-session Lesson Plan?"
          actionBtn1={{
            label: state.generateLoading ? "Generating..." : "Generate Lesson Plan with NEURO AI",
            icon: state.generateLoading ? null : <Sparkles className="h-4 w-4" />,
            onClick: () => generateLessionPlan(),
            className: "create-btn",
            disabled: state.generateLoading,
          }}
        />
      )}

      <GenerateLessonPlanModal
        open={generateModal}
        onClose={() => setGenerateModal(false)}
        courseLabel={`${state.courseData?.course_code} — ${state.courseData?.course_title}`}
        stats={{ 
          topics: state.generatedResponse?.result?.total_topics ?? 22, 
          units: state.generatedResponse?.result?.total_units ?? 5, 
          hours: state.generatedResponse?.result?.total_hours ?? 45 
        }}
        response={state.generatedResponse}
        onReview={() => {
          setState({ recommendationsGenerated: true });
          setGenerateModal(false);
          course_data();
        }}
      />

      <EditLessonPlanModal
        open={editModal.open}
        onClose={() => setEditModal((p) => ({ ...p, open: false }))}
        data={editModal.data}
        onSave={async (updated) => {
          try {
            await Models.lession_plan.update_topics(updated.id, {
              topic_name: updated.title,
              seq: updated.seq,
              level: updated.level,
              hours: updated.hours.replace(" Hours", ""),
              status: updated.status,
              textbook: updated.textbook,
              reference_book: updated.reference,
              pedagogy: updated.pedagogy,
            });
            Success("Lesson plan item updated successfully!");
            // Refresh the data
            lession_data(state?.courseData?.latest_syllabus?.id, parseInt(state.activeTab.split('-')[1], 10));
          } catch (error) {
            console.log("Update topic error:", error);
          }
        }}
      />

      <ReviewLessonItemModal
        open={reviewModal.open}
        onClose={() => setReviewModal((p) => ({ ...p, open: false }))}
        data={reviewModal.data}
        onAccept={() => markReviewed(reviewModal.unitKey, reviewModal.topicId)}
      />
    </div>
  );
};

export default PrivateRouter(LessonPlan);
