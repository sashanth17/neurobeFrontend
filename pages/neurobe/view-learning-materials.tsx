import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Users,
  Edit,
  RefreshCcw,
  Sparkles,
  BookOpen,
  CheckCircle,
  Info,
  ArrowBigRight,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import { useRouter } from "next/router";
import AIGenerateModal from "@/components/common-components/AIGenerateModal";
import TextArea from "@/components/FormFields/TextArea.component";
import CheckboxInput from "@/components/FormFields/CheckBoxInput.component";
import PageHeader from "@/components/common-components/PageHeader";
import AccordiansStyleEditor, {
  MaterialSection,
} from "@/components/common-components/AccordiansStyleEditor";
import KeepFilePrompt from "@/components/academic-setup/KeepFilePrompt";
import { useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";



const ViewLearningMaterials = () => {
  const dispatch = useDispatch();
  const router = useRouter();

   const searchParams = useSearchParams();
    const topic_id = searchParams.get("topic_id");
    const course_id = searchParams.get("course_id");

  const [state, setState] = useSetState({
    activeTab: "unit-1",
    showGenerateModal: false,
    selectedTopic: null as any,
    includeExamples: true,
    includeExercises: true,
    isEditing: false,
    editorValue: "",
    showSavePrompt: false,
    materialData: null as any,
    loading: false,
    courseData: null as any,
  });

  useEffect(() => {
    dispatch(setPageTitle("View Learning Material"));
  }, [dispatch]);

  // ── Get learning material data by topic_id ──
  const get_data = async () => {
    try {
      setState({ loading: true });
      if (!topic_id) return;

      const response = await Models.learning_material.get_topics(topic_id);
      console.log('✌️Material data --->', response);

      setState({ materialData: response });
    } catch (error: any) {
      console.error('✌️Get material error --->', error);
    } finally {
      setState({ loading: false });
    }
  };

  // ── Get course data by course_id ──
  const get_course_data = async () => {
    try {
      if (!course_id) return;

      const response = await Models.course.detail(course_id);
      console.log('✌️Course data --->', response);

      setState({ courseData: response });
    } catch (error: any) {
      console.error('✌️Get course error --->', error);
    }
  };

  useEffect(() => {
    if (topic_id) {
      get_data();
    }
  }, [topic_id]);

  useEffect(() => {
    if (course_id) {
      get_course_data();
    }
  }, [course_id]);

  // ── Parse HTML list content into sections ──
  const parseMarkdownToSections = (content: string): MaterialSection[] => {
    if (!content) return [];

    // Remove HTML tags and decode entities to get plain text
    let text = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    const sections: MaterialSection[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    let currentSection: any = null;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Check if line is a heading (e.g., "1. Conceptual Overview")
      if (/^\d+\.\s+/.test(trimmed)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: trimmed.replace(/^\d+\.\s+/, ''),
          body: '',
          bullets: [],
        };
      } else if (trimmed.startsWith('•') && currentSection) {
        // Parse bullet points
        const bulletText = trimmed.replace(/^•\s+/, '');
        const [label, ...textParts] = bulletText.split(':');
        currentSection.bullets.push({
          label: label.trim() + ':',
          text: textParts.join(':').trim(),
        });
      } else if (trimmed && currentSection && currentSection.bullets.length === 0) {
        // Add to body if no bullets yet
        currentSection.body += (currentSection.body ? ' ' : '') + trimmed;
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  // ── Get sections from materialData ──
  const displaySections = state.materialData?.content_markdown
    ? parseMarkdownToSections(state.materialData.content_markdown)
    : [];

  // ── Handle save content ──
  const handleSaveContent = async () => {
    try {
      setState({ loading: true });
      
      const payload = {
        content_markdown: state.editorValue || state.materialData?.content_markdown,
      };
      console.log('✌️Material updated --->', payload);

      const material_id = state.materialData?.material_id;
      const topic_id = state.materialData?.topic_id;

      if (!material_id || !topic_id) {
        console.error('Missing material_id or topic_id');
        return;
      }

      // Convert plain text editor content back to HTML list format if needed
      let contentToSave = payload.content_markdown;
      
      // If content doesn't already have HTML tags, wrap it in list format
      if (!contentToSave.includes('<ul>') && !contentToSave.includes('<li>')) {
        // Split by numbered items (1., 2., etc.) and wrap in list
        const items = contentToSave.split(/(?=\d+\.\s+)/);
        contentToSave = '<ul><li>' + items.filter(item => item.trim()).join('</li><li>') + '</li></ul>';
      }
      
      const finalPayload = {
        content_markdown: contentToSave,
        status: "approved",  // Auto-approve when saving
      };
      console.log('✌️Final payload --->', finalPayload);

      const response = await Models.learning_material.update_material(topic_id, finalPayload);
      console.log('✌️Material updated --->', response);

      // Refresh material data after save
      await get_data();

      // Update state with new data
      setState({ 
        isEditing: false, 
        showSavePrompt: false,
        final: true,
      });

    } catch (error: any) {
      console.error('✌️Update material error --->', error);
    } finally {
      setState({ loading: false });
    }
  };

  // ── Handle approve material ──
  const handleApproveMaterial = async () => {
    try {
      setState({ loading: true });
      
      const topic_id = state.materialData?.topic_id;

      if (!topic_id) {
        console.error('Missing topic_id');
        return;
      }

      // Call approve API
      const response = await Models.learning_material.approve_material(topic_id);
      console.log('✌️Material approved --->', response);

      // Refresh material data after approve
      await get_data();

      // Update state
      setState({ 
        isEditing: false, 
        showSavePrompt: false,
      });

    } catch (error: any) {
      console.error('✌️Approve material error --->', error);
    } finally {
      setState({ loading: false });
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
        courseOptions={[
          { value: state.courseData?.id, label: `Course: ${state.courseData?.course_code}` },
        ]}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => {
          if (router?.query?.from === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title={`${state.materialData?.topic_code} — ${state.materialData?.topic_name}` || "Learning Material"}
        subtitle={`Institution: <span class="font-bold text-[#000]">${state.courseData?.organization_name || "Organization"}</span>&nbsp;·&nbsp; Admin: <span class="font-bold text-[#000]">${state.courseData?.admin_name || "Admin"}</span>`}
        icon={<Users className="h-5 w-5 text-color2" />}
        // actionBtn3={{
        //   label: "Regenerate",
        //   icon: <RefreshCcw className="h-4 w-4" />,
        //   onClick: () => {},
        // }}
        actionBtn4={
          state.isEditing
            ? undefined
            : {
                label: "Edit Material",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => setState({ isEditing: true }),
              }
        }
        editMode={state.isEditing}
        records={`TOPIC ${state.materialData?.topic_code}` || "TOPIC"}
        subContent1={state.materialData?.status === "approved" ? "Approved" : "AI Generated"}
        subContent2={state.materialData?.status_display || ""}
      />

      {state.showSavePrompt && (
        <KeepFilePrompt
          bg={"bg-light-yellow"}
          border="border-yellow"
          text="text-dark-red"
          icon={<Info className="text-dark-red h-4 w-4" />}
          title="Select a mapping to review the suggested strength and NEURO AI rationale. Accept or edit the suggestion as needed."
          label="Dismiss"
        />
      )}

      <div className="mt-4">
        {displaySections.length > 0 || state.isEditing ? (
          <AccordiansStyleEditor
            title="Learning Material Document"
            topicCountLabel={
              state.isEditing ? "Edit Mode" : "Review Mode (Read-Only Review)"
            }
            finalValue={state.final}
            saveChanges={state.showSavePrompt}
            sections={displaySections}
            icon={<BookOpen className="h-4 w-4" />}
            isEditing={state.isEditing}
            editorValue={state.editorValue || state.materialData?.content_markdown || ""}
            onEditorChange={(val) => setState({ editorValue: val })}
            onSave={() => {
              handleSaveContent();
            }}
            onCancelEdit={() => setState({ isEditing: false, showSavePrompt: false, final: true })}
            onBack={() => router.back()}
            actionBtn1={
              state.materialData?.status === "approved"
                ? undefined
                : {
                    label: "Approve Material",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: () => handleApproveMaterial(),
                  }
            }
            actionBtn2={
              !state.isEditing
                ? {
                    label: "Edit Material",
                    icon: <Edit className="h-4 w-4" />,
                    onClick: () => setState({ isEditing: true }),
                  }
                : undefined
            }

            final={
              state.materialData?.status === "approved"
                ? {
                    label: "Next Question Bank",
                    icon: <ArrowBigRight className="h-4 w-4" />,
                    onClick: () => router.push("/neurobe/mcq-generation/bank"),
                  }
                : {
                    label: "Approve Material",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: () => handleApproveMaterial(),
                  }
            }
            final2={{
              label: "Back to Learning Material",
              icon: null,
              onClick: () => router.back(),
            }}
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Learning Material Generated</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Learning material has not been generated for this topic yet.
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              Back to Learning Materials
            </button>
          </div>
        )}
      </div>

    
    </div>
  );
};

export default PrivateRouter(ViewLearningMaterials);
