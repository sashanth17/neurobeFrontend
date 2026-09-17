import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Hourglass,
  Check,
  ClipboardCheck,
  Sparkles,
  Save,
  EditIcon,
  GraduationCap,
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
import EditLessonPlanModal, {
  LessonPlanEditData,
} from "@/components/lesson-plan/EditLessonPlanModal";
import ReviewLessonItemModal, {
  ReviewLessonItemData,
} from "@/components/lesson-plan/ReviewLessonItemModal";
import { useRouter } from "next/router";
import { UNIT_TABS } from "@/utils/constant.utils";
import { Alert } from "@mantine/core";
import AIGenerateModal from "@/components/common-components/AIGenerateModal";
import TextArea from "@/components/FormFields/TextArea.component";
import CheckboxInput from "@/components/FormFields/CheckBoxInput.component";
import PageHeader from "@/components/common-components/PageHeader";
import Models from "@/imports/models.import";
import { useSearchParams } from "next/navigation";
import GenericTabsData from "@/components/common-components/GenericTabsData";


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
      status: "Not Generated" | "Approved";
    }[];
  }
> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    totalHours: 9,
    topics: [
      {
        id: "1.1",
        seq: 1,
        title: "Network Models & Layered Architecture",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 1",
        reference: "Data Communications and Networking — Chapter 2",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "1.2",
        seq: 2,
        title: "Physical Layer & Transmission Media",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Approved",
      },
      {
        id: "1.3",
        seq: 3,
        title: "Network Topologies & Switching Techniques",
        level: "K2",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 8",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "1.4",
        seq: 4,
        title: "Network Performance Metrics",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 1",
        reference: "Computer Networks: A Systems Approach — Chapter 1",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    totalHours: 7,
    topics: [
      {
        id: "2.1",
        seq: 1,
        title: "Framing & Error Detection",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 10",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "2.2",
        seq: 2,
        title: "Flow Control Protocols",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 11",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
      {
        id: "2.3",
        seq: 3,
        title: "MAC Protocols & CSMA/CD",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 4",
        reference: "Computer Networking: A Top-Down Approach — Chapter 5",
        pedagogy: "Simulation Lab",
        status: "Not Generated",
      },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    totalHours: 10,
    topics: [
      {
        id: "3.1",
        seq: 1,
        title: "IP Addressing & Subnetting",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Hands-on Lab",
        status: "Not Generated",
      },
      {
        id: "3.2",
        seq: 2,
        title: "Routing Algorithms",
        level: "K4",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Data Communications and Networking — Chapter 14",
        pedagogy: "Case Study Analysis",
        status: "Not Generated",
      },
      {
        id: "3.3",
        seq: 3,
        title: "IPv6 & Transition Mechanisms",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Flipped Classroom",
        status: "Not Generated",
      },
      {
        id: "3.4",
        seq: 4,
        title: "ICMP & Network Diagnostics",
        level: "K3",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 4",
        reference: "Computer Networks: A Systems Approach — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Not Generated",
      },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & TCP/UDP",
    totalHours: 8,
    topics: [
      {
        id: "4.1",
        seq: 1,
        title: "TCP Connection Management",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Computer Networks — Chapter 6",
        pedagogy: "Demonstration",
        status: "Not Generated",
      },
      {
        id: "4.2",
        seq: 2,
        title: "UDP & Real-time Applications",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Data Communications and Networking — Chapter 23",
        pedagogy: "Comparative Analysis",
        status: "Not Generated",
      },
      {
        id: "4.3",
        seq: 3,
        title: "Congestion Control Mechanisms",
        level: "K4",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 6",
        reference: "Computer Networking: A Top-Down Approach — Chapter 3",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Security",
    totalHours: 7,
    topics: [
      {
        id: "5.1",
        seq: 1,
        title: "DNS & HTTP Protocols",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Computer Networks — Chapter 7",
        pedagogy: "Interactive Demo",
        status: "Not Generated",
      },
      {
        id: "5.2",
        seq: 2,
        title: "Email & FTP Protocols",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Data Communications and Networking — Chapter 26",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "5.3",
        seq: 3,
        title: "Network Security Fundamentals",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 8",
        reference: "Computer Networking: A Top-Down Approach — Chapter 8",
        pedagogy: "Guest Lecture",
        status: "Not Generated",
      },
    ],
  },
};

const totalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const totalUnits = UNIT_TABS.length;
const totalRecs = Object.values(RAW_UNIT_DATA).reduce(
  (s, u) => s + u.topics.length,
  0
);

const LearningMeterials = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");

  const [state, setState] = useSetState({
    search: "",
    unitFilter: "all",
    statusFilter: "all",
    loading: false,
    activeTab: "",
    activeBannerTab: "coordinator",
    materialInstructions: "",
    includeExamples: true,
    includeExercises: true,
    generateLoading: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Lesson Plan"));
    coordinator_course_data();

  }, [dispatch]);

  useEffect(() => {
    course_data();
  }, [course_id]);

  const material_data = async (syllabus_id, unit) => {
    try {
      console.log('✌️syllabus_id,unit --->', syllabus_id, unit);

      const res: any = await Models.learning_material.detail(syllabus_id, unit);

      console.log('material_data --->', res);



      const matrix = [
        {
          key: "approve-topics",
          label: "Approved Topics",
          count: res?.metrics?.approved_topics?.display,
          subLabel: "Approved topics count",
          icon: <Check className="h-5 w-5" />,
        },
        {
          key: "approved-material-hours",
          label: "Approved Materials",
          subLabel: "Approved Material Count",
          count: res?.metrics?.approved_materials?.display,

          icon: <Hourglass className="h-5 w-5" />,
        },
      ]

      console.log('✌️matrix --->', matrix);

      setState({ material_data: res, matrix: matrix });

    } catch (error) {
      console.log("error", error);
    }
  };
  console.log('✌️activeTab --->', state.activeTab);

  const course_data = async () => {
    try {
      const res: any = await Models.course.detail(48);
      console.log('course_data --->', res);

      // setState({ courseData: res });
      setState({ courseData: res, activeTab: `unit-${res?.latest_syllabus?.units?.[0]?.unit_number}` });


      material_data(res?.latest_syllabus?.id, res?.latest_syllabus?.units?.[0]?.unit_number);

      console.log("course detail →", res);
    } catch (error) {
      console.log("error", error);
    }
  };

  const coordinator_course_data = async () => {
    try {
      const user = localStorage.getItem("user");
      const u = JSON.parse(user);
      const body = {
        coordinator_id: u?.id,
      };
      const res = await Models.course.list(body);
      const dropdown = Dropdown(res, "course_code");
      // setState({ courseData: res });
      console.log("coordinator_course_data detail →", dropdown);
      setState({ course_list: dropdown });
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
            unit.topics.filter((t) => t.status === "Approved").map((t) => t.id)
          ),
        ])
      )
  );




  // ── Pre-generate: topics list for the accordion (level + hours badges only) ──
  const buildInitialTopics = () => {
    if (!state?.material_data?.selected_unit?.topics) return [];
    return state?.material_data?.selected_unit?.topics.map((topic: any) => ({
      id: topic.topic_id,
      title: `${topic.topic_code} — ${topic.topic_name}`,
      collapsedBadge: [
        {
          label: topic.status_display,
          className: `${
            topic.status_badge === "warning"
              ? "bg-yellow-100 text-yellow-700 font-bold"
              : topic.status_badge === "neutral"
              ? "bg-gray-200 text-gray-600 font-bold"
              : topic.status_badge === "success"
              ? "bg-green-100 text-green-700 font-bold"
              : "bg-gray-200 text-gray-600 font-bold"
          }`,
        },
      ],
      actions: [
        {
          key: "action",
          label: topic.action_label || "Generate Material",
          icon: <Sparkles className="h-3 w-3" />,
          asTag: false,
          className: topic.status === "Approved" 
            ? "bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6 py-2 flex items-center gap-2 transition-colors"
            : topic.status === "Review Required"
            ? "bg-orange-600 text-white hover:bg-orange-700 rounded-full px-6 py-2 flex items-center gap-2 transition-colors"
            : "bg-purple-600 text-white hover:bg-purple-700 rounded-full px-6 py-2 flex items-center gap-2 transition-colors",
          onClick: (topicData: any) => {
            // Check if action is "view" - redirect to view-learning-material
            if (topicData?.action === "view") {
              const course_id = state.courseData?.id;
              router.push(`/neurobe/view-learning-materials?topic_id=${topicData.id}&course_id=${course_id}`);
            } else {
              // Otherwise open the generate modal
              setState({ showGenerateModal: true, selectedTopic: topicData });
            }
          },
        },
      ],
      action: topic.action,
      items: [],
    }));
  };

  // ── Generated: flat table columns matching the screenshot ──
  const lessonPlanColumns = [
    {
      accessor: "seq",
      title: "SEQ",
      render: ({ seq }: any) => (
        <span className="text-color2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold">
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
        <span className="text-color2 text-xs font-semibold">{pedagogy}</span>
      ),
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({
        status,
        id,
        seq,
        title,
        level,
        hours,
        textbook,
        reference,
        pedagogy,
      }: any) => {
        const isReviewed =
          status === "Reviewed" ||
          (reviewedMap[state.activeTab]?.has(id) ?? false);

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
                  id,
                  seq,
                  title,
                  level,
                  hours,
                  textbook,
                  reference,
                  pedagogy,
                  unitLabel: raw?.title ?? "",
                },
              })
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 transition-colors hover:border-orange-400 hover:bg-orange-100"
          >
            • Need Review
          </button>
        );
      },
    },
    {
      accessor: "id",
      title: "EDIT",
      render: ({
        title,
        id,
        seq,
        level,
        hours,
        textbook,
        reference,
        pedagogy,
        status,
      }: any) => (
        <button
          type="button"
          onClick={() =>
            setEditModal({
              open: true,
              data: {
                id,
                seq,
                title,
                level,
                hours,
                textbook,
                reference,
                pedagogy,
                status,
                unitLabel: raw?.title ?? "",
              },
            })
          }
          className="hover:text-color2 text-pri flex items-center gap-1 text-xs font-semibold"
        >
          <EditIcon className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];
  const generate = async () => {
    try {
      setState({ generateLoading: true });

      const payload = {
        instructions: state.materialInstructions || "",
        include_examples: state.includeExamples !== undefined ? state.includeExamples : true,
        include_exercises: state.includeExercises !== undefined ? state.includeExercises : true,
      };
      console.log('✌️payload --->', payload);


      const response = await Models.learning_material.generate(
        state.selectedTopic?.id,
        payload
      );

      console.log('✌️Generate response --->', response);

      Success("Learning material generation initiated successfully!");

      // Navigate to view-learning-material with topic_id
      const topic_id = state.selectedTopic?.id;
      if (topic_id && response) {
        const course_id = state.courseData?.id;

        router.push(`/neurobe/view-learning-materials?topic_id=${topic_id}&course_id=${course_id}`);
      }

      // Reset form and close modal
      setState({
        showGenerateModal: false,
        selectedTopic: null,
        materialInstructions: "",
        includeExamples: true,
        includeExercises: true,
      });

      // Refresh material data
      const syllabus_id = state.courseData?.latest_syllabus?.id;
      const unit = state.activeTab?.split("-")[1] || "1";
      if (syllabus_id) {
        await material_data(syllabus_id, unit);
      }

    } catch (error: any) {
      // console.error('✌️Generate error --->', error);
      const errorMsg = error?.message || "Failed to generate learning material";
      // Error toast would be shown here
    } finally {
      setState({ generateLoading: false });
    }
  }

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
        title="Learning Materials"
        records={`${state.courseData?.course_code} - ${state.courseData?.course_title}`}
        subtitle={`Generate, review, edit, and approve learning materials for approved course topics.`}
        icon={<GraduationCap className="text-color2 h-5 w-5" />}
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
        title="Learning Material List"
        label={`${totalUnits} Units`}
        subLabel={`${totalTopics} Topics`}
      />

      <div className="mt-4">
        <GenericTabsData
          tabs={
            state?.courseData?.latest_syllabus?.units?.map((unit: any) => ({
              key: `unit-${unit.unit_number}`,
              label: `${unit.unit_number}`,
            })) || []
          }
          activeKey={state.activeTab}
          onChange={(unit) => {
            setState({ activeTab: unit as string });
            // Extract unit number from key (e.g., "unit-1" -> 1)
            const unitNumber = parseInt((unit as string).split('-')[1], 10);
            material_data(state?.courseData?.latest_syllabus?.id, unitNumber);
          }}
        />

        {state.recommendationsGenerated ? (
          /* ── Generated: flat table with header ── */
          <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {/* dark header */}
            <div className="flex items-center justify-between bg-[#111238] px-4 py-3 text-white">
              <div>
                <h3 className="text-lg font-bold">{state?.material_data?.selected_unit?.unit_title}</h3>
                <p className="mt-0.5 text-sm text-white/70">
                  Learning materials for approved topics
                </p>
              </div>
              <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
                {state?.material_data?.selected_unit?.approved_topics_count} Topics
              </span>
            </div>
            <TableComponent
              records={state?.material_data?.selected_unit?.topics?.map((topic: any) => ({
                id: topic.topic_id,
                seq: topic.topic_code,
                title: topic.topic_name,
                status: topic.status_display,
                status_badge: topic.status_badge,
                action: topic.action,
                action_label: topic.action_label,
              })) ?? []}
              columns={lessonPlanColumns}
            />
          </div>
        ) : (
          /* ── Pre-generate: accordion with status badges ── */
          <AccordiansStyle
            expandable={false}
            topics={buildInitialTopics()}
            title={state?.material_data?.selected_unit?.unit_title}
            subtitle={`${state?.material_data?.selected_unit?.approved_topics_count} Approved Topics`}
            footerContent={
              <>
                <Sparkles className="h-4 w-4" /> NEURO AI will generate learning materials including concepts, examples, and exercises.
              </>
            }
            btnOnClick={(data: any) => {
              console.log("btnOnClick disabled - actions handle routing");
            }}
          />
        )}
      </div>
      <AIGenerateModal
        subtitle={
          state.selectedTopic?.title?.replace(/^Topic [\d.]+ — /, "") ?? ""
        }
        title="Generate Learning Material"
        onClose={() =>
          setState({ showGenerateModal: false, selectedTopic: null })
        }
        open={state.showGenerateModal}
        actionLoading={state.generateLoading}
        onAction={generate}
        actionIcon={<Sparkles className="h-4 w-4" />}
        actionLabel="Generate with NEURO AI"
        render={() => (
          <div className="space-y-5 bg-white p-5">
            {/* Selected Topic */}
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-color2 mb-2 text-xs font-bold uppercase tracking-wide">
                Selected Topic
              </p>
              <div className="flex items-center gap-3">
                <span className="text-color2 rounded-lg bg-purple-100 px-3 py-1 text-sm font-bold">
                  Topic {state.selectedTopic?.topic_code}
                </span>
                <span className="text-base font-semibold text-[#000]">
                  {state.selectedTopic?.title?.replace(/^Topic [\d.]+ — /, "")}
                </span>
              </div>
            </div>

            {/* Textarea */}
            <TextArea
              title="Material Instructions"
              name="materialInstructions"
              placeholder="Explain this topic clearly for engineering students."
              value={state.materialInstructions}
              onChange={(e) => setState({ materialInstructions: e.target.value })}
              rows={5}
            />

            {/* Checkboxes */}
            <div className="space-y-3">
              <CheckboxInput
                checked={state.includeExamples ?? true}
                onChange={(v) => setState({ includeExamples: v })}
                label="Include Examples"
                labelStyle="text-sm font-semibold text-[#000]"
              />
              <CheckboxInput
                checked={state.includeExercises ?? true}
                onChange={(v) => setState({ includeExercises: v })}
                label="Include Exercises"
                labelStyle="text-sm font-semibold text-[#000]"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PrivateRouter(LearningMeterials);
