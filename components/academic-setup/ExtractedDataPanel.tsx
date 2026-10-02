import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  Award,
  Layers,
  BookMarked,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Models from "@/imports/models.import";

interface ExtractedDataPanelProps {
  data: any;
  courseData?: any;
  courseId?: string | number | null;
  versionNumber?: number | null;
  onChangeData?: (updatedData: any) => void;
  onUpdateLTPC?: (values: {
    lecture_hours: number;
    tutorial_hours: number;
    practical_hours: number;
    credits: number;
  }) => void;
}

const BLOOM_LEVELS = [
  { value: "K1", label: "K1 - Remember" },
  { value: "K2", label: "K2 - Understand" },
  { value: "K3", label: "K3 - Apply" },
  { value: "K4", label: "K4 - Analyze" },
  { value: "K5", label: "K5 - Evaluate" },
  { value: "K6", label: "K6 - Create" },
];

const KNOWLEDGE_OPTIONS = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];

const ExtractedDataPanel: React.FC<ExtractedDataPanelProps> = ({
  data,
  courseData,
  courseId,
  versionNumber,
  onChangeData,
  onUpdateLTPC,
}) => {
  const [activeTab, setActiveTab] = useState<
    "units" | "outcomes" | "books" | "labs" | "overview"
  >("units");

  // Keep internal state
  const [activeData, setActiveData] = useState<any>(data || {});

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with incoming data when it changes from outside
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setActiveData(data);
    }
  }, [data]);

  // Clean up auto-save timer
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Accordion state
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Inline editing IDs: string identifier of the entity currently in edit mode
  // e.g. "unit_0", "topic_0_1", "subtopic_0_1_2", "co_0", "textbook_0", "reference_0", "lab_0"
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Inline delete confirmation IDs:
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline "Add New" active flags
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({ unit_number: 1, unit_title: "", theory_hours: 9 });

  const [addingTopicUnitIdx, setAddingTopicUnitIdx] = useState<number | null>(null);
  const [newTopicForm, setNewTopicForm] = useState({
    topic_code: "",
    topic_name: "",
    topic_description: "",
    theory_hours: 1,
    knowledge_level: "Understand",
  });

  const [addingSubtopicKey, setAddingSubtopicKey] = useState<string | null>(null); // "uIdx_tIdx"
  const [newSubtopicForm, setNewSubtopicForm] = useState({
    subtopic_code: "",
    subtopic_name: "",
    theory_hours: 0.5,
    knowledge_level: "Understand",
  });

  const [isAddingCO, setIsAddingCO] = useState(false);
  const [newCOForm, setNewCOForm] = useState({ outcome_code: "CO1", outcome_statement: "", bloom_level: "K2" });

  const [isAddingTextbook, setIsAddingTextbook] = useState(false);
  const [newTextbookForm, setNewTextbookForm] = useState({ title: "", authors: "", publisher: "", edition: "", publication_year: "" });

  const [isAddingReference, setIsAddingReference] = useState(false);
  const [newReferenceForm, setNewReferenceForm] = useState({ title: "", authors: "", publisher: "", edition: "", publication_year: "" });

  const [isAddingLab, setIsAddingLab] = useState(false);
  const [newLabForm, setNewLabForm] = useState({ experiment_number: 1, title: "", description: "", allocated_hours: 2 });

  // -------------------------------------------------------------
  // AUTOMATIC AUTO-SAVE HANDLER
  // -------------------------------------------------------------
  const commitAndAutoSave = useCallback(
    (updatedData: any) => {
      setActiveData(updatedData);
      onChangeData?.(updatedData);

      // Trigger auto-save to backend
      if (courseId && versionNumber) {
        setSaveStatus("saving");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await (Models.syllabus as any).updateFileVersionExtraction(
              courseId,
              versionNumber,
              updatedData
            );
            setSaveStatus("saved");
          } catch (err) {
            console.warn("Auto-save draft error:", err);
            setSaveStatus("idle");
          }
        }, 600); // 600ms debounce
      }
    },
    [courseId, versionNumber, onChangeData]
  );

  // Normalized extraction arrays from activeData
  const units: any[] =
    activeData?.units ||
    activeData?.syllabus_units ||
    activeData?.course_units ||
    [];

  const outcomes: any[] =
    activeData?.outcomes ||
    activeData?.course_outcomes ||
    activeData?.courseOutcomes ||
    [];

  const textbooks: any[] =
    activeData?.textbooks ||
    activeData?.prescribed_textbooks ||
    [];

  const references: any[] =
    activeData?.reference_books ||
    activeData?.references ||
    [];

  const labs: any[] =
    activeData?.laboratory_experiments ||
    activeData?.experiments ||
    activeData?.labs ||
    [];

  // LTPC Values
  const initialL = Number(
    activeData?.lecture_hours ??
      activeData?.lectureHours ??
      courseData?.lecture_hours ??
      3
  );
  const initialT = Number(
    activeData?.tutorial_hours ??
      activeData?.tutorialHours ??
      courseData?.tutorial_hours ??
      0
  );
  const initialP = Number(
    activeData?.practical_hours ??
      activeData?.practicalHours ??
      courseData?.practical_hours ??
      0
  );
  const initialC = Number(
    activeData?.credits ??
      activeData?.total_credits ??
      courseData?.credits ??
      3
  );

  const [ltpc, setLtpc] = useState({
    L: initialL,
    T: initialT,
    P: initialP,
    C: initialC,
  });

  const handleLtpcChange = (field: "L" | "T" | "P" | "C", val: number) => {
    const next = { ...ltpc, [field]: val };
    setLtpc(next);
    onUpdateLTPC?.({
      lecture_hours: next.L,
      tutorial_hours: next.T,
      practical_hours: next.P,
      credits: next.C,
    });
    const nextData = {
      ...activeData,
      lecture_hours: next.L,
      tutorial_hours: next.T,
      practical_hours: next.P,
      credits: next.C,
    };
    commitAndAutoSave(nextData);
  };

  const toggleUnit = (uNum: number) => {
    setExpandedUnits((prev) => ({ ...prev, [uNum]: !prev[uNum] }));
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // -------------------------------------------------------------
  // UNIT CRUD
  // -------------------------------------------------------------
  const handleStartAddUnit = () => {
    setNewUnitForm({
      unit_number: units.length + 1,
      unit_title: "",
      theory_hours: 9,
    });
    setIsAddingUnit(true);
  };

  const handleSaveNewUnit = async () => {
    if (!newUnitForm.unit_title.trim()) return;
    const currentUnits = [...units];
    let createdId: number | undefined = undefined;

    const extId = activeData?.extraction_id || activeData?.id;
    if (courseId && extId) {
      try {
        const res: any = await (Models.syllabus as any).createUnit(courseId, extId, {
          unit_number: Number(newUnitForm.unit_number),
          unit_title: newUnitForm.unit_title.trim(),
          theory_hours: Number(newUnitForm.theory_hours),
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create unit in table:", err);
      }
    }

    currentUnits.push({
      id: createdId,
      unit_number: Number(newUnitForm.unit_number),
      unit_title: newUnitForm.unit_title.trim(),
      theory_hours: Number(newUnitForm.theory_hours),
      topics: [],
    });
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setIsAddingUnit(false);
    setExpandedUnits((prev) => ({ ...prev, [Number(newUnitForm.unit_number)]: true }));
  };

  const handleStartEditUnit = (uIdx: number, unit: any) => {
    setEditingId(`unit_${uIdx}`);
    setEditForm({
      unit_number: unit.unit_number ?? uIdx + 1,
      unit_title: unit.unit_title ?? `Unit ${uIdx + 1}`,
      theory_hours: unit.theory_hours ?? unit.hours ?? 9,
    });
  };

  const handleSaveEditUnit = async (uIdx: number) => {
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    u.unit_number = Number(editForm.unit_number);
    u.unit_title = editForm.unit_title;
    u.theory_hours = Number(editForm.theory_hours);

    if (courseId && u.id) {
      try {
        await (Models.syllabus as any).updateUnit(courseId, u.id, {
          unit_number: u.unit_number,
          unit_title: u.unit_title,
          theory_hours: u.theory_hours,
        });
      } catch (err) {
        console.error("Failed to update unit in table:", err);
      }
    }

    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteUnit = async (uIdx: number) => {
    const currentUnits = [...units];
    const u = currentUnits[uIdx];
    if (courseId && u?.id) {
      try {
        await (Models.syllabus as any).deleteUnit(courseId, u.id);
      } catch (err) {
        console.error("Failed to delete unit from table:", err);
      }
    }
    currentUnits.splice(uIdx, 1);
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // -------------------------------------------------------------
  // TOPIC CRUD
  // -------------------------------------------------------------
  const handleStartAddTopic = (uIdx: number) => {
    const uNum = units[uIdx]?.unit_number ?? uIdx + 1;
    const existingTopics = units[uIdx]?.topics || units[uIdx]?.extracted_topics || [];
    setNewTopicForm({
      topic_code: `${uNum}.${existingTopics.length + 1}`,
      topic_name: "",
      topic_description: "",
      theory_hours: 1,
      knowledge_level: "Understand",
    });
    setAddingTopicUnitIdx(uIdx);
  };

  const handleSaveNewTopic = async (uIdx: number) => {
    if (!newTopicForm.topic_name.trim()) return;
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];

    let createdId: number | undefined = undefined;
    if (courseId && u.id) {
      try {
        const res: any = await (Models.syllabus as any).createTopic(courseId, u.id, {
          topic_code: newTopicForm.topic_code.trim(),
          topic_name: newTopicForm.topic_name.trim(),
          topic_description: newTopicForm.topic_description.trim(),
          knowledge_level: newTopicForm.knowledge_level,
          learning_sequence: currentTopics.length + 1,
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create topic in table:", err);
      }
    }

    currentTopics.push({
      id: createdId,
      topic_code: newTopicForm.topic_code.trim(),
      topic_name: newTopicForm.topic_name.trim(),
      title: newTopicForm.topic_name.trim(),
      topic_description: newTopicForm.topic_description.trim(),
      theory_hours: Number(newTopicForm.theory_hours),
      knowledge_level: newTopicForm.knowledge_level,
      bloomLevel: newTopicForm.knowledge_level,
      subtopics: [],
    });
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setAddingTopicUnitIdx(null);
  };

  const handleStartEditTopic = (uIdx: number, tIdx: number, topic: any) => {
    setEditingId(`topic_${uIdx}_${tIdx}`);
    setEditForm({
      topic_code: topic.topic_code || topic.topicId || "",
      topic_name: topic.topic_name || topic.title || "",
      topic_description: topic.topic_description || topic.description || "",
      theory_hours: topic.theory_hours || topic.hours || 1,
      knowledge_level: topic.knowledge_level || topic.bloomLevel || "Understand",
    });
  };

  const handleSaveEditTopic = async (uIdx: number, tIdx: number) => {
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];
    const t = { ...currentTopics[tIdx] };
    t.topic_code = editForm.topic_code;
    t.topic_name = editForm.topic_name;
    t.title = editForm.topic_name;
    t.topic_description = editForm.topic_description;
    t.theory_hours = Number(editForm.theory_hours);
    t.knowledge_level = editForm.knowledge_level;
    t.bloomLevel = editForm.knowledge_level;

    if (courseId && t.id) {
      try {
        await (Models.syllabus as any).updateTopic(courseId, t.id, {
          topic_code: t.topic_code,
          topic_name: t.topic_name,
          topic_description: t.topic_description,
          knowledge_level: t.knowledge_level,
        });
      } catch (err) {
        console.error("Failed to update topic in table:", err);
      }
    }

    currentTopics[tIdx] = t;
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteTopic = async (uIdx: number, tIdx: number) => {
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];
    const t = currentTopics[tIdx];
    if (courseId && t?.id) {
      try {
        await (Models.syllabus as any).deleteTopic(courseId, t.id);
      } catch (err) {
        console.error("Failed to delete topic from table:", err);
      }
    }
    currentTopics.splice(tIdx, 1);
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // -------------------------------------------------------------
  // SUBTOPIC CRUD
  // -------------------------------------------------------------
  const handleStartAddSubtopic = (uIdx: number, tIdx: number) => {
    const topic = (units[uIdx]?.topics || units[uIdx]?.extracted_topics || [])[tIdx];
    const existingSub = topic?.subtopics || topic?.extracted_subtopics || topic?.sub_topics || [];
    const tCode = topic?.topic_code || topic?.topicId || `${uIdx + 1}.${tIdx + 1}`;
    setNewSubtopicForm({
      subtopic_code: `${tCode}.${existingSub.length + 1}`,
      subtopic_name: "",
      theory_hours: 0.5,
      knowledge_level: "Understand",
    });
    setAddingSubtopicKey(`${uIdx}_${tIdx}`);
    setExpandedTopics((prev) => ({ ...prev, [`${uIdx}_${tIdx}`]: true }));
  };

  const handleSaveNewSubtopic = async (uIdx: number, tIdx: number) => {
    if (!newSubtopicForm.subtopic_name.trim()) return;
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];
    const t = { ...currentTopics[tIdx] };
    const currentSub = [...(t.subtopics || t.extracted_subtopics || t.sub_topics || [])];

    let createdId: number | undefined = undefined;
    if (courseId && t.id) {
      try {
        const res: any = await (Models.syllabus as any).createSubtopic(courseId, t.id, {
          subtopic_code: newSubtopicForm.subtopic_code.trim(),
          subtopic_name: newSubtopicForm.subtopic_name.trim(),
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create subtopic in table:", err);
      }
    }

    currentSub.push({
      id: createdId,
      subtopic_code: newSubtopicForm.subtopic_code.trim(),
      subtopic_name: newSubtopicForm.subtopic_name.trim(),
      title: newSubtopicForm.subtopic_name.trim(),
      theory_hours: Number(newSubtopicForm.theory_hours || 0.5),
      knowledge_level: newSubtopicForm.knowledge_level || "Understand",
    });
    t.subtopics = currentSub;
    currentTopics[tIdx] = t;
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setAddingSubtopicKey(null);
  };

  const handleStartEditSubtopic = (uIdx: number, tIdx: number, sIdx: number, sub: any) => {
    setEditingId(`subtopic_${uIdx}_${tIdx}_${sIdx}`);
    setEditForm({
      subtopic_code: sub.subtopic_code || sub.subtopicId || "",
      subtopic_name: sub.subtopic_name || sub.title || "",
      theory_hours: sub.theory_hours || sub.hours || 0.5,
      knowledge_level: sub.knowledge_level || sub.bloomLevel || "Understand",
    });
  };

  const handleSaveEditSubtopic = async (uIdx: number, tIdx: number, sIdx: number) => {
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];
    const t = { ...currentTopics[tIdx] };
    const currentSub = [...(t.subtopics || t.extracted_subtopics || t.sub_topics || [])];
    const s = { ...currentSub[sIdx] };
    s.subtopic_code = editForm.subtopic_code;
    s.subtopic_name = editForm.subtopic_name;
    s.title = editForm.subtopic_name;
    s.theory_hours = Number(editForm.theory_hours || 0.5);
    s.knowledge_level = editForm.knowledge_level;

    if (courseId && s.id) {
      try {
        await (Models.syllabus as any).updateSubtopic(courseId, s.id, {
          subtopic_code: s.subtopic_code,
          subtopic_name: s.subtopic_name,
        });
      } catch (err) {
        console.error("Failed to update subtopic in table:", err);
      }
    }

    currentSub[sIdx] = s;
    t.subtopics = currentSub;
    currentTopics[tIdx] = t;
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteSubtopic = async (uIdx: number, tIdx: number, sIdx: number) => {
    const currentUnits = [...units];
    const u = { ...currentUnits[uIdx] };
    const currentTopics = [...(u.topics || u.extracted_topics || [])];
    const t = { ...currentTopics[tIdx] };
    const currentSub = [...(t.subtopics || t.extracted_subtopics || t.sub_topics || [])];
    const s = currentSub[sIdx];
    if (courseId && s?.id) {
      try {
        await (Models.syllabus as any).deleteSubtopic(courseId, s.id);
      } catch (err) {
        console.error("Failed to delete subtopic from table:", err);
      }
    }
    currentSub.splice(sIdx, 1);
    t.subtopics = currentSub;
    currentTopics[tIdx] = t;
    u.topics = currentTopics;
    currentUnits[uIdx] = u;
    const next = { ...activeData, units: currentUnits, syllabus_units: currentUnits };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // -------------------------------------------------------------
  // COURSE OUTCOMES (COs) CRUD
  // -------------------------------------------------------------
  const handleStartAddCO = () => {
    setNewCOForm({
      outcome_code: `CO${outcomes.length + 1}`,
      outcome_statement: "",
      bloom_level: "K2",
    });
    setIsAddingCO(true);
  };

  const handleSaveNewCO = async () => {
    if (!newCOForm.outcome_statement.trim()) return;
    const currentCOs = [...outcomes];
    let createdId: number | undefined = undefined;

    const extId = activeData?.extraction_id || activeData?.id;
    if (courseId && extId) {
      try {
        const res: any = await (Models.syllabus as any).createOutcome(courseId, extId, {
          co_code: newCOForm.outcome_code.trim(),
          description: newCOForm.outcome_statement.trim(),
          bloom_level: newCOForm.bloom_level,
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create outcome in table:", err);
      }
    }

    currentCOs.push({
      id: createdId,
      outcome_code: newCOForm.outcome_code.trim(),
      outcome_statement: newCOForm.outcome_statement.trim(),
      statement: newCOForm.outcome_statement.trim(),
      bloom_level: newCOForm.bloom_level,
    });
    const next = { ...activeData, outcomes: currentCOs, course_outcomes: currentCOs };
    commitAndAutoSave(next);
    setIsAddingCO(false);
  };

  const handleStartEditCO = (idx: number, co: any) => {
    setEditingId(`co_${idx}`);
    setEditForm({
      outcome_code: co.outcome_code || co.code || `CO${idx + 1}`,
      outcome_statement: co.outcome_statement || co.statement || co.description || "",
      bloom_level: co.bloom_level || co.knowledge_level || "K2",
    });
  };

  const handleSaveEditCO = async (idx: number) => {
    const currentCOs = [...outcomes];
    const co = { ...currentCOs[idx] };
    co.outcome_code = editForm.outcome_code;
    co.outcome_statement = editForm.outcome_statement;
    co.statement = editForm.outcome_statement;
    co.bloom_level = editForm.bloom_level;

    if (courseId && co.id) {
      try {
        await (Models.syllabus as any).updateOutcome(courseId, co.id, {
          co_code: co.outcome_code,
          description: co.outcome_statement,
          bloom_level: co.bloom_level,
        });
      } catch (err) {
        console.error("Failed to update outcome in table:", err);
      }
    }

    currentCOs[idx] = co;
    const next = { ...activeData, outcomes: currentCOs, course_outcomes: currentCOs };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteCO = async (idx: number) => {
    const currentCOs = [...outcomes];
    const co = currentCOs[idx];
    if (courseId && co?.id) {
      try {
        await (Models.syllabus as any).deleteOutcome(courseId, co.id);
      } catch (err) {
        console.error("Failed to delete outcome from table:", err);
      }
    }
    currentCOs.splice(idx, 1);
    const next = { ...activeData, outcomes: currentCOs, course_outcomes: currentCOs };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // -------------------------------------------------------------
  // TEXTBOOKS & REFERENCES CRUD
  // -------------------------------------------------------------
  const handleStartAddTextbook = () => {
    setNewTextbookForm({ title: "", authors: "", publisher: "", edition: "", publication_year: "" });
    setIsAddingTextbook(true);
  };

  const handleSaveNewTextbook = async () => {
    if (!newTextbookForm.title.trim()) return;
    const current = [...textbooks];
    let createdId: number | undefined = undefined;

    const extId = activeData?.extraction_id || activeData?.id;
    if (courseId && extId) {
      try {
        const res: any = await (Models.syllabus as any).createTextbook(courseId, extId, {
          title: newTextbookForm.title.trim(),
          authors: newTextbookForm.authors.trim(),
          publisher: newTextbookForm.publisher.trim(),
          edition: newTextbookForm.edition.trim(),
          publication_year: newTextbookForm.publication_year ? Number(newTextbookForm.publication_year) : undefined,
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create textbook in table:", err);
      }
    }

    current.push({ id: createdId, ...newTextbookForm });
    const next = { ...activeData, textbooks: current, prescribed_textbooks: current };
    commitAndAutoSave(next);
    setIsAddingTextbook(false);
  };

  const handleStartEditTextbook = (idx: number, b: any) => {
    setEditingId(`textbook_${idx}`);
    setEditForm({
      title: b.title || "",
      authors: Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "",
      publisher: b.publisher || "",
      edition: b.edition || "",
      publication_year: b.publication_year || "",
    });
  };

  const handleSaveEditTextbook = async (idx: number) => {
    const current = [...textbooks];
    current[idx] = { ...current[idx], ...editForm };

    if (courseId && current[idx]?.id) {
      try {
        await (Models.syllabus as any).updateTextbook(courseId, current[idx].id, {
          title: current[idx].title,
          authors: current[idx].authors,
          publisher: current[idx].publisher,
          edition: current[idx].edition,
          publication_year: current[idx].publication_year ? Number(current[idx].publication_year) : undefined,
        });
      } catch (err) {
        console.error("Failed to update textbook in table:", err);
      }
    }

    const next = { ...activeData, textbooks: current, prescribed_textbooks: current };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteTextbook = async (idx: number) => {
    const current = [...textbooks];
    const tb = current[idx];
    if (courseId && tb?.id) {
      try {
        await (Models.syllabus as any).deleteTextbook(courseId, tb.id);
      } catch (err) {
        console.error("Failed to delete textbook from table:", err);
      }
    }
    current.splice(idx, 1);
    const next = { ...activeData, textbooks: current, prescribed_textbooks: current };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // Reference Books
  const handleStartAddReference = () => {
    setNewReferenceForm({ title: "", authors: "", publisher: "", edition: "", publication_year: "" });
    setIsAddingReference(true);
  };

  const handleSaveNewReference = async () => {
    if (!newReferenceForm.title.trim()) return;
    const current = [...references];
    let createdId: number | undefined = undefined;

    const extId = activeData?.extraction_id || activeData?.id;
    if (courseId && extId) {
      try {
        const res: any = await (Models.syllabus as any).createReferenceBook(courseId, extId, {
          title: newReferenceForm.title.trim(),
          authors: newReferenceForm.authors.trim(),
          publisher: newReferenceForm.publisher.trim(),
          edition: newReferenceForm.edition.trim(),
          publication_year: newReferenceForm.publication_year ? Number(newReferenceForm.publication_year) : undefined,
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create reference book in table:", err);
      }
    }

    current.push({ id: createdId, ...newReferenceForm });
    const next = { ...activeData, reference_books: current, references: current };
    commitAndAutoSave(next);
    setIsAddingReference(false);
  };

  const handleStartEditReference = (idx: number, b: any) => {
    setEditingId(`reference_${idx}`);
    setEditForm({
      title: b.title || "",
      authors: Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "",
      publisher: b.publisher || "",
      edition: b.edition || "",
      publication_year: b.publication_year || "",
    });
  };

  const handleSaveEditReference = async (idx: number) => {
    const current = [...references];
    current[idx] = { ...current[idx], ...editForm };

    if (courseId && current[idx]?.id) {
      try {
        await (Models.syllabus as any).updateReferenceBook(courseId, current[idx].id, {
          title: current[idx].title,
          authors: current[idx].authors,
          publisher: current[idx].publisher,
          edition: current[idx].edition,
          publication_year: current[idx].publication_year ? Number(current[idx].publication_year) : undefined,
        });
      } catch (err) {
        console.error("Failed to update reference book in table:", err);
      }
    }

    const next = { ...activeData, reference_books: current, references: current };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteReference = async (idx: number) => {
    const current = [...references];
    const rb = current[idx];
    if (courseId && rb?.id) {
      try {
        await (Models.syllabus as any).deleteReferenceBook(courseId, rb.id);
      } catch (err) {
        console.error("Failed to delete reference book from table:", err);
      }
    }
    current.splice(idx, 1);
    const next = { ...activeData, reference_books: current, references: current };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  // -------------------------------------------------------------
  // LAB EXPERIMENTS CRUD
  // -------------------------------------------------------------
  const handleStartAddLab = () => {
    setNewLabForm({
      experiment_number: labs.length + 1,
      title: "",
      description: "",
      allocated_hours: 2,
    });
    setIsAddingLab(true);
  };

  const handleSaveNewLab = async () => {
    if (!newLabForm.title.trim()) return;
    const current = [...labs];
    let createdId: number | undefined = undefined;

    const extId = activeData?.extraction_id || activeData?.id;
    if (courseId && extId) {
      try {
        const res: any = await (Models.syllabus as any).createExperiment(courseId, extId, {
          experiment_number: Number(newLabForm.experiment_number),
          title: newLabForm.title.trim(),
          description: newLabForm.description.trim(),
          allocated_hours: Number(newLabForm.allocated_hours),
        });
        if (res?.id) createdId = res.id;
      } catch (err) {
        console.error("Failed to create experiment in table:", err);
      }
    }

    current.push({
      id: createdId,
      experiment_number: Number(newLabForm.experiment_number),
      title: newLabForm.title.trim(),
      description: newLabForm.description.trim(),
      allocated_hours: Number(newLabForm.allocated_hours),
    });
    const next = { ...activeData, laboratory_experiments: current, experiments: current };
    commitAndAutoSave(next);
    setIsAddingLab(false);
  };

  const handleStartEditLab = (idx: number, lab: any) => {
    setEditingId(`lab_${idx}`);
    setEditForm({
      experiment_number: lab.experiment_number ?? idx + 1,
      title: lab.title || "",
      description: lab.description || "",
      allocated_hours: lab.allocated_hours || 2,
    });
  };

  const handleSaveEditLab = async (idx: number) => {
    const current = [...labs];
    current[idx] = {
      ...current[idx],
      experiment_number: Number(editForm.experiment_number),
      title: editForm.title,
      description: editForm.description,
      allocated_hours: Number(editForm.allocated_hours),
    };

    if (courseId && current[idx]?.id) {
      try {
        await (Models.syllabus as any).updateExperiment(courseId, current[idx].id, {
          experiment_number: current[idx].experiment_number,
          title: current[idx].title,
          description: current[idx].description,
          allocated_hours: current[idx].allocated_hours,
        });
      } catch (err) {
        console.error("Failed to update experiment in table:", err);
      }
    }

    const next = { ...activeData, laboratory_experiments: current, experiments: current };
    commitAndAutoSave(next);
    setEditingId(null);
  };

  const handleDeleteLab = async (idx: number) => {
    const current = [...labs];
    const lb = current[idx];
    if (courseId && lb?.id) {
      try {
        await (Models.syllabus as any).deleteExperiment(courseId, lb.id);
      } catch (err) {
        console.error("Failed to delete experiment from table:", err);
      }
    }
    current.splice(idx, 1);
    const next = { ...activeData, laboratory_experiments: current, experiments: current };
    commitAndAutoSave(next);
    setDeletingId(null);
  };

  const tabs = [
    {
      id: "units" as const,
      label: "Units & Topics",
      icon: <Layers className="h-4 w-4" />,
      count: units.length,
    },
    {
      id: "outcomes" as const,
      label: "Course Outcomes (COs)",
      icon: <Award className="h-4 w-4" />,
      count: outcomes.length,
    },
    {
      id: "books" as const,
      label: "Textbooks & References",
      icon: <BookMarked className="h-4 w-4" />,
      count: textbooks.length + references.length,
    },
    {
      id: "labs" as const,
      label: "Lab Experiments",
      icon: <FlaskConical className="h-4 w-4" />,
      count: labs.length,
    },
    {
      id: "overview" as const,
      label: "Course Overview",
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* ── Top Bar: Tabs & Live Auto-save Indicator ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 p-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Auto-save Status Pill */}
        <div className="mr-2 flex shrink-0 items-center gap-1.5 text-[11px]">
          {saveStatus === "saving" ? (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <RotateCw className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Auto-saved</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Main Tab Content Body ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* ============================================================== */}
        {/* TAB 1: Units, Topics & Subtopics (DIRECT INLINE CRUD) */}
        {/* ============================================================== */}
        {activeTab === "units" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Curriculum Units, Topics & Subtopics
                </h4>
                <p className="text-xs text-slate-500">
                  {units.length} Units • Click pencil to edit, trash to delete, changes auto-save.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<number, boolean> = {};
                    units.forEach((u, i) => {
                      allOpen[u.unit_number || i + 1] = true;
                    });
                    setExpandedUnits(allOpen);
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleStartAddUnit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Unit</span>
                </button>
              </div>
            </div>

            {/* Inline Add Unit Form */}
            {isAddingUnit && (
              <div className="rounded-xl border-2 border-indigo-500/50 bg-indigo-50/20 p-4 dark:bg-indigo-950/20">
                <h5 className="mb-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  Add New Curriculum Unit
                </h5>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Unit #</label>
                    <input
                      type="number"
                      min="1"
                      value={newUnitForm.unit_number}
                      onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_number: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Unit Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Architectures & Cloud"
                      value={newUnitForm.unit_title}
                      onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hours</label>
                    <input
                      type="number"
                      min="1"
                      value={newUnitForm.theory_hours}
                      onChange={(e) => setNewUnitForm({ ...newUnitForm, theory_hours: Number(e.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingUnit(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewUnit}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Unit</span>
                  </button>
                </div>
              </div>
            )}

            {units.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No units extracted in this version. Click &quot;Add Unit&quot; above to create one.
              </div>
            ) : (
              units.map((unit: any, uIdx: number) => {
                const uNum = unit.unit_number || uIdx + 1;
                const isExpanded = expandedUnits[uNum] ?? false;
                const topics: any[] = unit.topics || unit.extracted_topics || [];
                const hours = unit.theory_hours || unit.hours || 9;

                // Total subtopics across all topics in this unit
                const totalSubtopics = topics.reduce((acc, t) => {
                  const subs = t.subtopics || t.extracted_subtopics || t.sub_topics || [];
                  return acc + subs.length;
                }, 0);

                const isUnitEditing = editingId === `unit_${uIdx}`;
                const isUnitDeleting = deletingId === `unit_${uIdx}`;

                return (
                  <div
                    key={unit.id || uNum}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    {/* Unit Header or Inline Edit Form */}
                    {isUnitEditing ? (
                      <div className="bg-indigo-50/40 p-3 dark:bg-indigo-950/30">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Unit #</label>
                            <input
                              type="number"
                              value={editForm.unit_number}
                              onChange={(e) => setEditForm({ ...editForm, unit_number: Number(e.target.value) })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">Unit Title</label>
                            <input
                              type="text"
                              value={editForm.unit_title}
                              onChange={(e) => setEditForm({ ...editForm, unit_title: e.target.value })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Hours</label>
                            <input
                              type="number"
                              value={editForm.theory_hours}
                              onChange={(e) => setEditForm({ ...editForm, theory_hours: Number(e.target.value) })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditUnit(uIdx)}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                          >
                            <Check className="h-3 w-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    ) : isUnitDeleting ? (
                      /* Inline Delete Confirmation */
                      <div className="flex items-center justify-between bg-rose-50/80 px-4 py-3 dark:bg-rose-950/40">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          Delete Unit {uNum} and its {topics.length} topics?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(uIdx)}
                            className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Unit Header */
                      <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3 dark:bg-slate-800/40">
                        <button
                          type="button"
                          onClick={() => toggleUnit(uNum)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                            {uNum}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {unit.unit_title || `Unit ${uNum}`}
                            </h5>
                            <span className="text-[11px] text-slate-500">
                              {topics.length} Topics • {totalSubtopics} Subtopics • {hours} Hours
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditUnit(uIdx, unit)}
                            title="Edit Unit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(`unit_${uIdx}`)}
                            title="Delete Unit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUnit(uNum)}
                            className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Unit Topics & Subtopics Body */}
                    {isExpanded && (
                      <div className="space-y-3 p-3.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Topics under Unit {uNum}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartAddTopic(uIdx)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Topic</span>
                          </button>
                        </div>

                        {/* Inline Add Topic Form */}
                        {addingTopicUnitIdx === uIdx && (
                          <div className="rounded-xl border border-indigo-400 bg-indigo-50/20 p-3 dark:bg-indigo-950/20">
                            <h6 className="mb-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                              Add Topic under Unit {uNum}
                            </h6>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Code</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1.1"
                                  value={newTopicForm.topic_code}
                                  onChange={(e) => setNewTopicForm({ ...newTopicForm, topic_code: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500">Topic Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Memory Management & Paging"
                                  value={newTopicForm.topic_name}
                                  onChange={(e) => setNewTopicForm({ ...newTopicForm, topic_name: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Hours</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={newTopicForm.theory_hours}
                                  onChange={(e) => setNewTopicForm({ ...newTopicForm, theory_hours: Number(e.target.value) })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setAddingTopicUnitIdx(null)}
                                className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNewTopic(uIdx)}
                                className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                              >
                                <Check className="h-3 w-3" />
                                <span>Save Topic</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {topics.length === 0 ? (
                          <p className="py-3 text-center text-xs text-slate-400 italic">
                            No topics under this unit yet. Click &quot;Add Topic&quot; above.
                          </p>
                        ) : (
                          topics.map((t: any, tIdx: number) => {
                            const topicKey = `${uIdx}_${tIdx}`;
                            const isTopicExpanded = expandedTopics[topicKey] ?? true;
                            const subtopics: any[] =
                              t.subtopics || t.extracted_subtopics || t.sub_topics || [];
                            const tCode = t.topic_code || t.topicId || `${uNum}.${tIdx + 1}`;
                            const tName = t.topic_name || t.title || "Untitled Topic";
                            const tHours = t.theory_hours || t.hours || 1;
                            const tLevel =
                              t.knowledge_level || t.bloomLevel || t.bloom_level || "Understand";

                            const isTopicEditing = editingId === `topic_${uIdx}_${tIdx}`;
                            const isTopicDeleting = deletingId === `topic_${uIdx}_${tIdx}`;

                            return (
                              <div
                                key={t.id || topicKey}
                                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-800/20"
                              >
                                {isTopicEditing ? (
                                  /* Inline Edit Topic Form */
                                  <div className="space-y-2 rounded-lg bg-indigo-50/30 p-2.5 dark:bg-indigo-950/20">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">Topic Code</label>
                                        <input
                                          type="text"
                                          value={editForm.topic_code}
                                          onChange={(e) => setEditForm({ ...editForm, topic_code: e.target.value })}
                                          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>
                                      <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500">Topic Title</label>
                                        <input
                                          type="text"
                                          value={editForm.topic_name}
                                          onChange={(e) => setEditForm({ ...editForm, topic_name: e.target.value })}
                                          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">Hours</label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={editForm.theory_hours}
                                          onChange={(e) => setEditForm({ ...editForm, theory_hours: Number(e.target.value) })}
                                          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">Knowledge Level</label>
                                        <select
                                          value={editForm.knowledge_level}
                                          onChange={(e) => setEditForm({ ...editForm, knowledge_level: e.target.value })}
                                          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                          {KNOWLEDGE_OPTIONS.map((k) => (
                                            <option key={k} value={k}>{k}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500">Description</label>
                                        <input
                                          type="text"
                                          value={editForm.topic_description}
                                          onChange={(e) => setEditForm({ ...editForm, topic_description: e.target.value })}
                                          className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditTopic(uIdx, tIdx)}
                                        className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                                      >
                                        <Check className="h-3 w-3" />
                                        <span>Done</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : isTopicDeleting ? (
                                  /* Inline Delete Confirmation */
                                  <div className="flex items-center justify-between bg-rose-50/80 p-2.5 dark:bg-rose-950/40">
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                      Delete Topic &quot;{tName}&quot;?
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setDeletingId(null)}
                                        className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTopic(uIdx, tIdx)}
                                        className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Topic View Row */
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-1 items-start gap-2.5">
                                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                        {tCode}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {tName}
                                        </p>
                                        {t.topic_description && (
                                          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                                            {t.topic_description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1.5">
                                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                                        {tLevel}
                                      </span>
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {tHours}h
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => handleStartEditTopic(uIdx, tIdx, t)}
                                        title="Edit Topic"
                                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setDeletingId(`topic_${uIdx}_${tIdx}`)}
                                        title="Delete Topic"
                                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* ── SUBTOPICS CONTAINER (NESTED UNDER TOPIC) ── */}
                                <div className="mt-2.5 rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-700/60 dark:bg-slate-900/60">
                                  <div className="flex items-center justify-between pb-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleTopic(topicKey)}
                                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                                    >
                                      {isTopicExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-slate-400" />
                                      )}
                                      <span>
                                        Subtopics ({subtopics.length})
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleStartAddSubtopic(uIdx, tIdx)}
                                      className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span>Add Subtopic</span>
                                    </button>
                                  </div>

                                  {/* Inline Add Subtopic Form */}
                                  {addingSubtopicKey === topicKey && (
                                    <div className="my-2 rounded border border-indigo-300 bg-indigo-50/20 p-2 dark:bg-indigo-950/20">
                                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4">
                                        <div>
                                          <label className="text-[9px] font-bold text-slate-500">Subtopic Code</label>
                                          <input
                                            type="text"
                                            value={newSubtopicForm.subtopic_code}
                                            onChange={(e) => setNewSubtopicForm({ ...newSubtopicForm, subtopic_code: e.target.value })}
                                            className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                          />
                                        </div>
                                        <div className="sm:col-span-2">
                                          <label className="text-[9px] font-bold text-slate-500">Concept / Name</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. Asymptotic Notations Big-O"
                                            value={newSubtopicForm.subtopic_name}
                                            onChange={(e) => setNewSubtopicForm({ ...newSubtopicForm, subtopic_name: e.target.value })}
                                            className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-bold text-slate-500">Hours</label>
                                          <input
                                            type="number"
                                            step="0.25"
                                            value={newSubtopicForm.theory_hours}
                                            onChange={(e) => setNewSubtopicForm({ ...newSubtopicForm, theory_hours: Number(e.target.value) })}
                                            className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="mt-1.5 flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setAddingSubtopicKey(null)}
                                          className="rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveNewSubtopic(uIdx, tIdx)}
                                          className="rounded bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-indigo-700"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {isTopicExpanded && (
                                    <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
                                      {subtopics.length === 0 ? (
                                        <div className="flex items-center justify-between py-1 text-[11px] text-slate-400">
                                          <span>No subtopics defined yet under this topic.</span>
                                          <button
                                            type="button"
                                            onClick={() => handleStartAddSubtopic(uIdx, tIdx)}
                                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                          >
                                            + Add Subtopic
                                          </button>
                                        </div>
                                      ) : (
                                        subtopics.map((sub: any, sIdx: number) => {
                                          const subKey = `subtopic_${uIdx}_${tIdx}_${sIdx}`;
                                          const isSubEditing = editingId === subKey;
                                          const isSubDeleting = deletingId === subKey;
                                          const sCode = sub.subtopic_code || sub.subtopicId || `${tCode}.${sIdx + 1}`;
                                          const sName = sub.subtopic_name || sub.title || `Subtopic ${sIdx + 1}`;
                                          const sHours = sub.theory_hours || sub.hours;
                                          const sLevel = sub.knowledge_level || sub.bloomLevel || "";

                                          return (
                                            <div key={subKey} className="py-1 text-[11px]">
                                              {isSubEditing ? (
                                                <div className="rounded bg-indigo-50/40 p-2 dark:bg-indigo-950/30">
                                                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4">
                                                    <div>
                                                      <label className="text-[9px] font-bold text-slate-500">Code</label>
                                                      <input
                                                        type="text"
                                                        value={editForm.subtopic_code}
                                                        onChange={(e) => setEditForm({ ...editForm, subtopic_code: e.target.value })}
                                                        className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                      />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                      <label className="text-[9px] font-bold text-slate-500">Concept / Title</label>
                                                      <input
                                                        type="text"
                                                        value={editForm.subtopic_name}
                                                        onChange={(e) => setEditForm({ ...editForm, subtopic_name: e.target.value })}
                                                        className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="text-[9px] font-bold text-slate-500">Hours</label>
                                                      <input
                                                        type="number"
                                                        step="0.25"
                                                        value={editForm.theory_hours}
                                                        onChange={(e) => setEditForm({ ...editForm, theory_hours: Number(e.target.value) })}
                                                        className="w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                      />
                                                    </div>
                                                  </div>

                                                  <div className="mt-1 flex items-center justify-end gap-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditingId(null)}
                                                      className="rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                      Cancel
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleSaveEditSubtopic(uIdx, tIdx, sIdx)}
                                                      className="rounded bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-indigo-700"
                                                    >
                                                      Done
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : isSubDeleting ? (
                                                <div className="flex items-center justify-between rounded bg-rose-50/80 p-1.5 dark:bg-rose-950/40">
                                                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                                    Delete &quot;{sName}&quot;?
                                                  </span>
                                                  <div className="flex items-center gap-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => setDeletingId(null)}
                                                      className="rounded border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                                                    >
                                                      Cancel
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteSubtopic(uIdx, tIdx, sIdx)}
                                                      className="rounded bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                                                    >
                                                      Delete
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-center justify-between py-0.5">
                                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <span className="font-mono text-[10px] font-semibold text-slate-500 shrink-0">
                                                      {sCode}
                                                    </span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                                      {sName}
                                                    </span>
                                                  </div>

                                                  <div className="flex shrink-0 items-center gap-1.5">
                                                    {sLevel && (
                                                      <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {sLevel}
                                                      </span>
                                                    )}
                                                    {sHours > 0 && (
                                                      <span className="text-[10px] text-slate-400">
                                                        {sHours}h
                                                      </span>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() => handleStartEditSubtopic(uIdx, tIdx, sIdx, sub)}
                                                      title="Edit Subtopic"
                                                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                                                    >
                                                      <Edit2 className="h-2.5 w-2.5" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setDeletingId(subKey)}
                                                      title="Delete Subtopic"
                                                      className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                                    >
                                                      <Trash2 className="h-2.5 w-2.5" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: Course Outcomes (COs) (DIRECT INLINE CRUD) */}
        {/* ============================================================== */}
        {activeTab === "outcomes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Course Outcomes (COs) & Bloom Taxonomy
                </h4>
                <p className="text-xs text-slate-500">
                  {outcomes.length} Course Outcomes • Inline editing, deleting, and auto-saving enabled
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAddCO}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Outcome</span>
              </button>
            </div>

            {/* Inline Add CO Form */}
            {isAddingCO && (
              <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-50/20 p-4 dark:bg-emerald-950/20">
                <h5 className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Add Course Outcome
                </h5>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Code</label>
                    <input
                      type="text"
                      value={newCOForm.outcome_code}
                      onChange={(e) => setNewCOForm({ ...newCOForm, outcome_code: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Outcome Statement</label>
                    <input
                      type="text"
                      placeholder="Upon completion of this course, students will be able to..."
                      value={newCOForm.outcome_statement}
                      onChange={(e) => setNewCOForm({ ...newCOForm, outcome_statement: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Bloom Level</label>
                    <select
                      value={newCOForm.bloom_level}
                      onChange={(e) => setNewCOForm({ ...newCOForm, bloom_level: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {BLOOM_LEVELS.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCO(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewCO}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Outcome</span>
                  </button>
                </div>
              </div>
            )}

            {outcomes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No course outcomes extracted yet. Click &quot;Add Outcome&quot; above to create one.
              </div>
            ) : (
              outcomes.map((co: any, idx: number) => {
                const code = co.outcome_code || co.code || `CO${idx + 1}`;
                const statement = co.outcome_statement || co.statement || co.description;
                const level = co.bloom_level || co.knowledge_level || "K2";

                const isCoEditing = editingId === `co_${idx}`;
                const isCoDeleting = deletingId === `co_${idx}`;

                return (
                  <div
                    key={co.id || idx}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {isCoEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Code</label>
                            <input
                              type="text"
                              value={editForm.outcome_code}
                              onChange={(e) => setEditForm({ ...editForm, outcome_code: e.target.value })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">Statement</label>
                            <input
                              type="text"
                              value={editForm.outcome_statement}
                              onChange={(e) => setEditForm({ ...editForm, outcome_statement: e.target.value })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Bloom Level</label>
                            <select
                              value={editForm.bloom_level}
                              onChange={(e) => setEditForm({ ...editForm, bloom_level: e.target.value })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                              {BLOOM_LEVELS.map((b) => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditCO(idx)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                          >
                            <Check className="h-3 w-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    ) : isCoDeleting ? (
                      <div className="flex items-center justify-between bg-rose-50/80 p-2 dark:bg-rose-950/40">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          Delete {code}?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCO(idx)}
                            className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                          {code}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                            {statement}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                            {level}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStartEditCO(idx, co)}
                            title="Edit Outcome"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingId(`co_${idx}`)}
                            title="Delete Outcome"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: Textbooks & Reference Books (DIRECT INLINE CRUD) */}
        {/* ============================================================== */}
        {activeTab === "books" && (
          <div className="space-y-6">
            {/* Prescribed Textbooks */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Prescribed Textbooks ({textbooks.length})
                </h4>
                <button
                  type="button"
                  onClick={handleStartAddTextbook}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Textbook</span>
                </button>
              </div>

              {isAddingTextbook && (
                <div className="my-2 rounded-xl border border-indigo-400 bg-indigo-50/20 p-3 dark:bg-indigo-950/20">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Book Title</label>
                      <input
                        type="text"
                        placeholder="Title of textbook"
                        value={newTextbookForm.title}
                        onChange={(e) => setNewTextbookForm({ ...newTextbookForm, title: e.target.value })}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Authors</label>
                      <input
                        type="text"
                        placeholder="Author names"
                        value={newTextbookForm.authors}
                        onChange={(e) => setNewTextbookForm({ ...newTextbookForm, authors: e.target.value })}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTextbook(false)}
                      className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewTextbook}
                      className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                    >
                      Save Textbook
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {textbooks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No textbooks listed.</p>
                ) : (
                  textbooks.map((b: any, bIdx: number) => {
                    const isBEditing = editingId === `textbook_${bIdx}`;
                    const isBDeleting = deletingId === `textbook_${bIdx}`;

                    return (
                      <div
                        key={b.id || bIdx}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        {isBEditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Book Title</label>
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Authors</label>
                                <input
                                  type="text"
                                  value={editForm.authors}
                                  onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditTextbook(bIdx)}
                                className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : isBDeleting ? (
                          <div className="flex items-center justify-between bg-rose-50/80 p-2 dark:bg-rose-950/40">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                              Delete &quot;{b.title}&quot;?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTextbook(bIdx)}
                                className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-slate-900 dark:text-white">{b.title}</p>
                              <p className="mt-1 text-slate-500">
                                Authors: {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "—"}
                              </p>
                              <p className="mt-0.5 text-slate-400 text-[11px]">
                                {b.publisher ? `${b.publisher} • ` : ""}
                                {b.edition ? `${b.edition} • ` : ""}
                                {b.publication_year || ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditTextbook(bIdx, b)}
                                title="Edit Textbook"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(`textbook_${bIdx}`)}
                                title="Delete Textbook"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reference Books */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reference Books ({references.length})
                </h4>
                <button
                  type="button"
                  onClick={handleStartAddReference}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-700 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Reference</span>
                </button>
              </div>

              {isAddingReference && (
                <div className="my-2 rounded-xl border border-slate-400 bg-slate-50/50 p-3 dark:bg-slate-800/40">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Book Title</label>
                      <input
                        type="text"
                        placeholder="Reference book title"
                        value={newReferenceForm.title}
                        onChange={(e) => setNewReferenceForm({ ...newReferenceForm, title: e.target.value })}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Authors</label>
                      <input
                        type="text"
                        placeholder="Author names"
                        value={newReferenceForm.authors}
                        onChange={(e) => setNewReferenceForm({ ...newReferenceForm, authors: e.target.value })}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingReference(false)}
                      className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewReference}
                      className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
                    >
                      Save Reference
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {references.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No reference books listed.</p>
                ) : (
                  references.map((b: any, bIdx: number) => {
                    const isREditing = editingId === `reference_${bIdx}`;
                    const isRDeleting = deletingId === `reference_${bIdx}`;

                    return (
                      <div
                        key={b.id || bIdx}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        {isREditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Book Title</label>
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">Authors</label>
                                <input
                                  type="text"
                                  value={editForm.authors}
                                  onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })}
                                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditReference(bIdx)}
                                className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : isRDeleting ? (
                          <div className="flex items-center justify-between bg-rose-50/80 p-2 dark:bg-rose-950/40">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                              Delete reference &quot;{b.title}&quot;?
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReference(bIdx)}
                                className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-slate-900 dark:text-white">{b.title}</p>
                              <p className="mt-1 text-slate-500">
                                Authors: {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "—"}
                              </p>
                              <p className="mt-0.5 text-slate-400 text-[11px]">
                                {b.publisher ? `${b.publisher} • ` : ""}
                                {b.edition ? `${b.edition} • ` : ""}
                                {b.publication_year || ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditReference(bIdx, b)}
                                title="Edit Reference"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(`reference_${bIdx}`)}
                                title="Delete Reference"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: Laboratory Experiments (DIRECT INLINE CRUD) */}
        {/* ============================================================== */}
        {activeTab === "labs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Laboratory Experiments ({labs.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Practical experiments • Inline editing and auto-save enabled
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAddLab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Experiment</span>
              </button>
            </div>

            {isAddingLab && (
              <div className="rounded-xl border border-indigo-400 bg-indigo-50/20 p-3 dark:bg-indigo-950/20">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Experiment #</label>
                    <input
                      type="number"
                      value={newLabForm.experiment_number}
                      onChange={(e) => setNewLabForm({ ...newLabForm, experiment_number: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Implement Binary Search Tree"
                      value={newLabForm.title}
                      onChange={(e) => setNewLabForm({ ...newLabForm, title: e.target.value })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Hours</label>
                    <input
                      type="number"
                      value={newLabForm.allocated_hours}
                      onChange={(e) => setNewLabForm({ ...newLabForm, allocated_hours: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLab(false)}
                    className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewLab}
                    className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Save Experiment
                  </button>
                </div>
              </div>
            )}

            {labs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                No practical/laboratory experiments listed. Click &quot;Add Experiment&quot; above to create one.
              </div>
            ) : (
              labs.map((lab: any, idx: number) => {
                const isLabEditing = editingId === `lab_${idx}`;
                const isLabDeleting = deletingId === `lab_${idx}`;

                return (
                  <div
                    key={lab.id || idx}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    {isLabEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Exp #</label>
                            <input
                              type="number"
                              value={editForm.experiment_number}
                              onChange={(e) => setEditForm({ ...editForm, experiment_number: Number(e.target.value) })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">Title</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Hours</label>
                            <input
                              type="number"
                              value={editForm.allocated_hours}
                              onChange={(e) => setEditForm({ ...editForm, allocated_hours: Number(e.target.value) })}
                              className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditLab(idx)}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : isLabDeleting ? (
                      <div className="flex items-center justify-between bg-rose-50/80 p-2 dark:bg-rose-950/40">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          Delete &quot;{lab.title}&quot;?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLab(idx)}
                            className="rounded bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {lab.experiment_number || idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {lab.title}
                          </p>
                          {lab.description && (
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                              {lab.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {lab.allocated_hours > 0 && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {lab.allocated_hours} hrs
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEditLab(idx, lab)}
                            title="Edit Experiment"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingId(`lab_${idx}`)}
                            title="Delete Experiment"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: Course Overview & L-T-P-C */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Credits & Allocation (L-T-P-C)
              </h4>
              <p className="text-xs text-slate-500">
                Adjust Lecture, Tutorial, Practical, and Credit distribution. Changes auto-save.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">L (Lecture)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.L}
                  onChange={(e) => handleLtpcChange("L", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">T (Tutorial)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.T}
                  onChange={(e) => handleLtpcChange("T", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-bold text-slate-500">P (Practical)</span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.P}
                  onChange={(e) => handleLtpcChange("P", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1 text-center font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-center dark:border-indigo-800 dark:bg-indigo-950/20">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  C (Credits)
                </span>
                <input
                  type="number"
                  min="0"
                  value={ltpc.C}
                  onChange={(e) => handleLtpcChange("C", Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-indigo-300 bg-white py-1 text-center font-bold text-indigo-700 dark:border-indigo-600 dark:bg-slate-700 dark:text-indigo-300"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-2 dark:bg-slate-800/40">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Contact Hours:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {ltpc.L + ltpc.T + ltpc.P} hrs/week
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course Code:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {courseData?.course_code || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {courseData?.course_title || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Programme:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {courseData?.programme || "B.Tech CSE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regulation:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {courseData?.regulation || "R2021"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataPanel;
