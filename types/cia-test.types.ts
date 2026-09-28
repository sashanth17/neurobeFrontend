export interface CourseInstanceOption {
  id: number;
  instance_name?: string;
  name?: string;
  section?: string;
  instructor_name?: string;
  faculty_name?: string;
  enrolled_students_count?: number;
  students_count?: number;
  status?: string;
}

export interface CIATestAssignedInstance {
  instance_id: number;
  instance_name: string;
  enrolled_students_count: number;
}

export interface CIATestItem {
  id: number;
  organization_id?: number;
  course_id: number;
  course_code: string;
  test_name: string;
  test_code: string;
  test_type: 'CIA' | 'MODEL' | 'RETEST' | 'QUIZ' | 'ASSIGNMENT' | string;
  branch: string;
  academic_year: string;
  year: number;
  semester: number;
  test_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  max_marks: number;
  question_paper_template_id?: number | null;
  question_paper_id?: number | null;
  question_paper_file_url?: string | null;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Completed' | 'Archived' | string;
  is_archived: boolean;
  archived_at?: string | null;
  archived_by_id?: number | null;
  created_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
  assigned_instances_count?: number;
  total_students_enrolled?: number;
  has_template?: boolean;
  has_question_paper?: boolean;
  assigned_instances?: CIATestAssignedInstance[];
}

export interface CreateCIATestPayload {
  test_name: string;
  test_code: string;
  test_type: string;
  branch: string;
  academic_year: string;
  year: number;
  semester: number;
  test_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  max_marks: number;
  question_paper_template_id?: number | null;
  question_paper_id?: number | null;
  question_paper_file_url?: string | null;
  course_instance_ids: number[];
}

export interface UpdateCIATestPayload {
  test_name?: string;
  test_code?: string;
  test_type?: string;
  branch?: string;
  academic_year?: string;
  year?: number;
  semester?: number;
  test_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  max_marks?: number;
  status?: string;
}

// ============================================================================
// QUESTION PAPER TEMPLATE TYPES
// ============================================================================

export interface TemplateQuestion {
  id?: number;
  question_number: number;
  max_marks: number;
  actual_question_id?: number | null;
}

export interface TemplateSection {
  id?: number;
  section_order: number;
  section_name: string;
  section_title: string;
  allocated_marks: number;
  questions: TemplateQuestion[];
}

export interface QuestionPaperTemplate {
  id: number;
  course_id: number;
  course_code?: string;
  template_name: string;
  total_maximum_marks: number;
  status: 'drafted' | 'build' | 'underreview' | 'verified' | string;
  description?: string;
  is_editable?: boolean;
  is_deletable?: boolean;
  assigned_tests_count?: number;
  sections?: TemplateSection[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateTemplatePayload {
  template_name: string;
  total_maximum_marks: number;
  status: string;
  description?: string;
  sections: {
    section_order: number;
    section_name: string;
    section_title: string;
    allocated_marks: number;
    questions: {
      question_number: number;
      max_marks: number;
      actual_question_id?: number | null;
    }[];
  }[];
}

export interface UpdateTemplatePayload {
  template_name?: string;
  total_maximum_marks?: number;
  status?: string;
  description?: string;
    sections?: {
    section_order: number;
    section_name: string;
    section_title: string;
    allocated_marks: number;
    questions: {
      question_number: number;
      max_marks: number;
      actual_question_id?: number | null;
    }[];
  }[];
}

export interface DiagramRenderRequest {
  diagram_spec: Record<string, any>;
  course_code?: string;
  upload_to_minio?: boolean;
  theme?: 'academic' | 'blueprint' | 'vibrant' | string;
}

export interface DiagramRenderResponse {
  status: 'success' | 'error' | string;
  engine_used: 'civil_structural' | 'process_flow' | 'circuit_logic' | 'scientific_template' | 'vector_geometry' | string;
  diagram_type: string;
  svg_content: string;
  data_uri: string;
  diagram_url?: string | null;
  width: number;
  height: number;
  diagram_spec: Record<string, any>;
}

export interface SubQuestionItem {
  sub_label: string;
  text?: string;
  sub_text?: string;
  marks: number;
}

export interface ChoiceOption {
  text: string;
  marks: number;
  sub_questions?: SubQuestionItem[];
  diagram_url?: string | null;
}

export interface CandidateQuestion {
  id: number;
  course_id?: number;
  template_id?: number;
  origin?: 'ai_generated' | 'manual' | string;
  question_text: string;
  max_marks: number;
  course_outcome?: string;
  co_level?: string;
  bloom_level?: string;
  knowledge_level?: string;
  question_type?: 'DIRECT' | 'SUB_QUESTIONS' | 'EITHER_OR' | 'direct' | 'sub_questions' | 'either_or' | string;
  sub_questions?: SubQuestionItem[];
  option_a?: ChoiceOption;
  option_b?: ChoiceOption;
  either_or_content?: {
    option_a: ChoiceOption;
    option_b: ChoiceOption;
  } | null;
  diagram_url?: string | null;
  diagram_file_name?: string | null;
  diagram_spec?: Record<string, any> | null;
  group_tag?: string | null;
  tags?: string[];
  topic_tags?: string[];
  knowledge_level_tag?: string;
  co_tag?: string;
  is_assigned?: boolean;
  status?: 'candidate' | 'shortlisted' | 'assigned' | 'archived' | string;
  assigned_slot_id?: number | null;
  assigned_slot_info?: {
    slot_id?: number;
    section_name?: string;
    section_title?: string;
    question_number?: number;
  } | null;
  topics?: string[];
  topic_names?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionFilterParams {
  search?: string;
  status?: 'candidate' | 'shortlisted' | 'assigned' | 'archived' | 'all' | string;
  max_marks?: number;
  co_level?: string;
  knowledge_level?: string;
  group_tag?: string;
  topic_id?: number;
  is_assigned?: boolean;
  question_type?: string;
  group_by?: 'group_tag' | 'knowledge_level' | 'topic' | 'marks' | 'question_type' | 'status' | string;
}

export interface QuestionGroupItem {
  key: string;
  label: string;
  count: number;
  questions: CandidateQuestion[];
}

export interface QuestionPoolFilterResponse {
  total: number;
  group_by?: string | null;
  groups?: QuestionGroupItem[] | null;
  questions?: CandidateQuestion[] | null;
  available_group_tags: string[];
  available_knowledge_levels: string[];
  available_topics: Array<{ id: number; name: string }> | string[];
}

export interface SingleTagRequest {
  group_tag?: string | null;
  tags?: string[];
}

export interface BulkTagRequest {
  question_ids: number[];
  group_tag?: string | null;
  tags?: string[];
  add_tags?: boolean;
}

export interface AIQuestionGenerateRequest {
  topic_ids: number[];
  subtopic_ids?: number[];
  topic_names?: string[];
  subtopic_names?: string[];
  co_level?: string;
  knowledge_level?: string;
  max_marks: number;
  question_type?: 'direct' | 'sub_questions' | 'either_or' | string;
  num_questions: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  custom_instructions?: string;
  has_sub_questions?: boolean;
  num_sub_questions?: number;
  sub_question_marks?: number[];
  is_either_or?: boolean;
  option_b_sub_question_marks?: number[];
  include_diagram?: boolean;
  diagram_type?: 'beam' | 'truss' | 'logic_circuit' | 'flowchart' | 'geometry' | 'auto' | string;
}

export interface SlotAssignedQuestion {
  id: number;
  question_text: string;
  max_marks: number;
  course_outcome?: string;
  bloom_level?: string;
  sub_questions?: SubQuestionItem[];
  option_a?: ChoiceOption;
  option_b?: ChoiceOption;
  diagram_url?: string | null;
}

export interface BlueprintSlot {
  id?: number;
  section_id?: number;
  section_name: string;
  section_title: string;
  section_order?: number;
  question_number: number;
  max_marks: number;
  actual_question_id?: number | null;
  assigned_question?: SlotAssignedQuestion | null;
}

export interface SyllabusTopicItem {
  id: number;
  topic_name: string;
  unit_id?: number;
  unit_number?: number;
  unit_title?: string;
}

export interface AiGenerationJobPayload {
  topic_ids: number[];
  subtopic_ids?: number[];
  topic_names?: string[];
  co_level?: string;
  knowledge_level?: string;
  max_marks: number;
  num_questions: number; // Cap: 1 to 20
  has_sub_questions?: boolean;
  num_sub_questions?: number | null;
  sub_question_marks?: number[] | null;
  is_either_or?: boolean;
  option_b_sub_question_marks?: number[] | null;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  custom_instructions?: string | null;
  include_diagram?: boolean;
  diagram_type?: 'beam' | 'truss' | 'logic_circuit' | 'flowchart' | 'geometry' | 'auto' | string;
  // Backward compatible aliases
  course_outcome?: string;
  bloom_level?: string;
  topics?: string[];
  additional_instructions?: string;
}

export interface JobState {
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | string;
  progress?: number;
  total_generated?: number;
  question_ids?: number[];
  error?: string;
  message?: string;
}

export interface JobStatusResponse {
  job_id: string;
  state: JobState;
}

export interface ExamPaperPreviewQuestion {
  slot_id: number;
  question_number: number;
  allocated_marks?: number;
  max_marks: number;
  actual_question_id?: number | null;
  course_outcome?: string;
  co_level?: string;
  bloom_level?: string;
  knowledge_level?: string;
  question_text?: string;
  sub_questions?: SubQuestionItem[];
  option_a?: ChoiceOption;
  option_b?: ChoiceOption;
  either_or_content?: { option_a: ChoiceOption; option_b: ChoiceOption } | null;
  diagram_url?: string | null;
  diagram_spec?: Record<string, any> | null;
  is_assigned: boolean;
  // The nested question object returned from preview endpoint
  question?: CandidateQuestion | null;
}

export interface ExamPaperPreviewSection {
  section_order: number;
  section_name: string;
  section_title: string;
  allocated_marks: number;
  questions: ExamPaperPreviewQuestion[];
}

export interface ExamPaperPreviewData {
  institution_name?: string;
  institution_subtext?: string;
  course_code: string;
  course_title: string;
  template_name: string;
  total_maximum_marks: number;
  duration_minutes?: number;
  branch?: string;
  semester?: number | string;
  academic_year?: string;
  instructions?: string[];
  sections: ExamPaperPreviewSection[];
}
