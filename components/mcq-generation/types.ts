/* ─── MCQ Generation Types & Shared Constants ────────────────────────────── */

export interface CourseItem {
  id: number | string;
  course_id?: number | string;
  code: string;
  course_code?: string;
  title: string;
  course_title?: string;
  programme: string;
  batch: string;
  semester: string | number;
  students_count?: number;
  student_count?: number;
  enrolled_students?: number | string;
  enrolled_students_count?: number;
  enrolled_count?: number;
  role?: string;
  faculty_role?: string;
  role_type?: "coordinator" | "instructor";
  questions_count?: number;
  approved_questions_count?: number;
  drafted_questions_count?: number;
  need_review_questions_count?: number;
  units_count?: number;
}

export interface MCQOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  isCorrect?: boolean;
}

export interface MCQQuestion {
  id: string;
  questionNumber: number;
  code?: string;
  question: string;
  text?: string;
  unit: string;
  topic: string;
  subtopic?: string;
  co: string;
  level: "K1" | "K2" | "K3" | "K4" | "K5" | "K6";
  marks: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "approved" | "drafted" | "need review" | "archived" | "Draft" | "Approved" | "Review" | "Archived";
  options: MCQOption[];
  explanation: string;
}

export interface TopicRow {
  id: string;
  unitId: string | number;
  topicName: string;
  questionCount: number;
}

export const FALLBACK_COURSES: CourseItem[] = [
  {
    id: "c-101",
    code: "CS309",
    course_code: "CS309",
    title: "Computer Networks",
    course_title: "Computer Networks",
    programme: "B.Tech CSE",
    batch: "2024–2028",
    semester: "Semester 5",
    students_count: 64,
    role: "Course Coordinator",
    role_type: "coordinator",
    questions_count: 38,
    approved_questions_count: 28,
    drafted_questions_count: 5,
    need_review_questions_count: 5,
    units_count: 5,
  },
  {
    id: "c-102",
    code: "CS301",
    course_code: "CS301",
    title: "Design and Analysis of Algorithms",
    course_title: "Design and Analysis of Algorithms",
    programme: "B.Tech CSE",
    batch: "2024–2028",
    semester: "Semester 5",
    students_count: 58,
    role: "Course Instructor",
    role_type: "instructor",
    questions_count: 24,
    approved_questions_count: 18,
    drafted_questions_count: 3,
    need_review_questions_count: 3,
    units_count: 5,
  },
];

export const UNITS_CONFIG = [
  { unitId: 1, label: "Unit 1", title: "Unit 1", topics: ["Topic 1.1", "Topic 1.2", "Topic 1.3"] },
  { unitId: 2, label: "Unit 2", title: "Unit 2", topics: ["Topic 2.1", "Topic 2.2", "Topic 2.3"] },
  { unitId: 3, label: "Unit 3", title: "Unit 3", topics: ["Topic 3.1", "Topic 3.2", "Topic 3.3"] },
  { unitId: 4, label: "Unit 4", title: "Unit 4", topics: ["Topic 4.1", "Topic 4.2", "Topic 4.3"] },
  { unitId: 5, label: "Unit 5", title: "Unit 5", topics: ["Topic 5.1", "Topic 5.2", "Topic 5.3"] },
];

export const K_LEVELS = ["K1", "K2", "K3", "K4", "K5", "K6"];
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const newRow = (): TopicRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  unitId: 1,
  topicName: "",
  questionCount: 5,
});

export const normalizeMCQ = (q: any, idx = 0): MCQQuestion => {
  const options: MCQOption[] = (q.options || []).map((o: any, oIdx: number) => {
    const key = (o.key || (oIdx === 0 ? "A" : oIdx === 1 ? "B" : oIdx === 2 ? "C" : "D")) as "A" | "B" | "C" | "D";
    const isCorrect =
      o.isCorrect === true ||
      o.is_correct === true ||
      String(o.is_correct).toLowerCase() === "true" ||
      String(o.isCorrect).toLowerCase() === "true";
    return {
      key,
      text: o.text || o.option || "",
      isCorrect,
    };
  });

  const unitNum = q.unit_number || (q.unit ? String(q.unit).replace(/[^0-9]/g, "") : "") || "1";
  const rawUnit = q.unit_title || q.unit || `Unit ${unitNum}`;
  const cleanUnit = rawUnit.startsWith("Unit") ? rawUnit : `Unit ${unitNum}: ${rawUnit}`;

  return {
    id: String(q.id || `q-${idx}`),
    questionNumber: idx + 1,
    code: q.code || q.question_code || `Q-MCQ-${String(idx + 1).padStart(2, "0")}`,
    question: q.question || q.text || "",
    unit: cleanUnit,
    topic: q.topic || "General Topic",
    subtopic: q.subtopic || "",
    co: q.co || q.course_outcome || `CO${unitNum || "1"}`,
    level: ((q.level || q.knowledge_level || "K2") as string).toUpperCase() as any,
    marks: String(q.marks || "2"),
    difficulty: ((q.difficulty || "Medium") as string).charAt(0).toUpperCase() + ((q.difficulty || "Medium") as string).slice(1).toLowerCase() as any,
    status: (q.status || "drafted") as any,
    options,
    explanation: q.explanation || "",
  };
};
