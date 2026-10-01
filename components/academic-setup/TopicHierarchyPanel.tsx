import React, { useState, useEffect } from "react";
import {
  BookOpen,
  EditIcon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import GenericTabs from "@/components/common-components/GenericTabs";
import AccordiansStyle from "@/components/common-components/AccordiansStyle";
import AddTopicModal from "@/components/academic-setup/AddTopicModal";
import AddSubtopicModal from "@/components/academic-setup/AddSubtopicModal";
import EditTopicModal from "@/components/academic-setup/EditTopicModal";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import Models from "@/imports/models.import";

interface TopicHierarchyPanelProps {
  courseId?: string | number;
  syllabusId?: string | number;
  initialUnits?: any[];
  onAddTopic?: (unitNumber: number, body: any) => Promise<void>;
  onDeleteTopic?: (topicId: number) => Promise<void>;
  onUpdateHours?: (unitId: number, hours: number) => Promise<void>;
  onUpdateUnitTitle?: (unitId: number, title: string) => Promise<void>;
}

const TopicHierarchyPanel: React.FC<TopicHierarchyPanelProps> = ({
  courseId,
  syllabusId,
  initialUnits,
  onAddTopic,
  onDeleteTopic,
  onUpdateHours,
  onUpdateUnitTitle,
}) => {
  const [activeTab, setActiveTab] = useState("unit-1");
  const [activeUnitNumber, setActiveUnitNumber] = useState(1);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [unitDetailsMap, setUnitDetailsMap] = useState<Record<number, any>>({});
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals state
  const [addTopicModal, setAddTopicModal] = useState(false);
  const [addSubtopicModal, setAddSubtopicModal] = useState(false);
  const [selectedTopicForSubtopic, setSelectedTopicForSubtopic] = useState<any>(null);
  const [editTopicModal, setEditTopicModal] = useState(false);
  const [selectedTopicToEdit, setSelectedTopicToEdit] = useState<any>(null);
  const [editModalInitialStatus, setEditModalInitialStatus] = useState<"Approved" | "Needs Review">("Approved");
  const [approvedMap, setApprovedMap] = useState<Record<string, Set<string>>>({});

  // 1. Initialize or fetch units list
  useEffect(() => {
    if (initialUnits && initialUnits.length > 0) {
      const formatted = initialUnits.map((u: any, idx: number) => {
        const uNum = u.unit_number || u.unitNumber || idx + 1;
        const topicsCount = Array.isArray(u.topics) ? u.topics.length : 0;
        return {
          id: u.id || u.unit_id || idx + 1,
          unit_number: uNum,
          unit_title: u.unit_title || u.title || `Unit ${uNum}`,
          hours: u.theory_hours ?? u.hours ?? 9,
          topics_count: topicsCount,
          topics: u.topics || [],
        };
      });
      setUnitsList(formatted);
      // Preload unitDetailsMap from initial units
      const initialMap: Record<number, any> = {};
      formatted.forEach((u: any) => {
        initialMap[u.unit_number] = {
          selected_unit: {
            id: u.id,
            unit_number: u.unit_number,
            unit_title: u.unit_title,
            topics: u.topics || [],
          },
          topics: u.topics || [],
        };
      });
      setUnitDetailsMap(initialMap);
    }
  }, [initialUnits]);

  // If syllabusId is present, fetch units and unit details from API
  useEffect(() => {
    if (syllabusId) {
      fetchUnitsFromApi(syllabusId);
    }
  }, [syllabusId]);

  const fetchUnitsFromApi = async (sid: string | number) => {
    try {
      setLoadingUnits(true);
      const res: any = await Models.topics.units(sid);
      const fetched = res?.units || (Array.isArray(res) ? res : []);
      if (fetched.length > 0) {
        setUnitsList(fetched);
        // Load details for current active unit
        fetchUnitDetailFromApi(sid, activeUnitNumber);
      }
    } catch (err) {
      console.warn("Could not fetch units from API, using local extraction data:", err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchUnitDetailFromApi = async (sid: string | number, uNum: number) => {
    try {
      setLoadingDetail(true);
      const res: any = await Models.topics.unit_detail(sid, uNum);
      if (res) {
        setUnitDetailsMap((prev) => ({
          ...prev,
          [uNum]: res,
        }));
      }
    } catch (err) {
      console.warn(`Could not fetch unit ${uNum} detail from API:`, err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    const num = parseInt(tabKey.replace("unit-", ""), 10) || 1;
    setActiveUnitNumber(num);
    if (syllabusId && !unitDetailsMap[num]?.topics?.length && !unitDetailsMap[num]?.selected_unit?.topics?.length) {
      fetchUnitDetailFromApi(syllabusId, num);
    }
  };

  // Build tabs for GenericTabs
  const currentUnits = unitsList.length > 0
    ? unitsList
    : [1, 2, 3, 4, 5].map((n) => ({
        id: n,
        unit_number: n,
        unit_title: `Unit ${n}`,
        topics_count: 0,
      }));

  const unitTabs = currentUnits.map((u: any) => {
    const num = u.unit_number || 1;
    const detail = unitDetailsMap[num];
    const topicsArr = detail?.selected_unit?.topics || detail?.topics || u.topics || [];
    return {
      id: `unit-${num}`,
      label: `Unit ${num}`,
      count: topicsArr.length || u.topics_count || 0,
    };
  });

  // Current active unit & its topics
  const activeUnitFromList = currentUnits.find((u: any) => u.unit_number === activeUnitNumber);
  const activeDetail = unitDetailsMap[activeUnitNumber];
  const activeUnitTopics =
    activeDetail?.selected_unit?.topics ||
    activeDetail?.topics ||
    activeUnitFromList?.topics ||
    [];

  const currentUnitTitle =
    activeDetail?.selected_unit?.unit_title ||
    activeUnitFromList?.unit_title ||
    `Unit ${activeUnitNumber}`;

  // Helper to open edit topic modal
  const openEditTopicModal = (topic: any, initialStatus: "Approved" | "Needs Review" = "Approved") => {
    setSelectedTopicToEdit(topic);
    setEditModalInitialStatus(initialStatus);
    setEditTopicModal(true);
  };

  // Helper to open add subtopic modal
  const openAddSubtopicModal = (topic: any) => {
    setSelectedTopicForSubtopic(topic);
    setAddSubtopicModal(true);
  };

  // Delete topic
  const handleDeleteTopic = async (topic: any) => {
    const topicId = topic.id;
    try {
      if (onDeleteTopic) {
        await onDeleteTopic(topicId);
      } else if (syllabusId) {
        await Models.topics.delete_topic(topicId);
      }
      // Update local state
      setUnitDetailsMap((prev) => {
        const uData = prev[activeUnitNumber];
        if (!uData) return prev;
        const currentT = uData?.selected_unit?.topics || uData?.topics || [];
        const filtered = currentT.filter((t: any) => t.id !== topicId && t.topic_code !== topicId);
        return {
          ...prev,
          [activeUnitNumber]: {
            ...uData,
            topics: filtered,
            selected_unit: uData.selected_unit ? { ...uData.selected_unit, topics: filtered } : undefined,
          },
        };
      });
      Success("Topic deleted successfully");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete topic"));
    }
  };

  // Delete subtopic
  const handleDeleteSubtopic = async (parentTopic: any, subtopicId: any) => {
    try {
      if (syllabusId) {
        await Models.topics.delete_subtopic(parentTopic.id, subtopicId);
      }
      // Update local state
      setUnitDetailsMap((prev) => {
        const uData = prev[activeUnitNumber];
        if (!uData) return prev;
        const currentT = uData?.selected_unit?.topics || uData?.topics || [];
        const updated = currentT.map((t: any) => {
          if (t.id === parentTopic.id) {
            const subs = (t.subtopics || []).filter((s: any) => s.id !== subtopicId);
            return { ...t, subtopics: subs };
          }
          return t;
        });
        return {
          ...prev,
          [activeUnitNumber]: {
            ...uData,
            topics: updated,
            selected_unit: uData.selected_unit ? { ...uData.selected_unit, topics: updated } : undefined,
          },
        };
      });
      Success("Subtopic deleted successfully");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete subtopic"));
    }
  };

  // Build accordion format for topics
  const accordionTopics = activeUnitTopics.map((topic: any, tIdx: number) => {
    const topicId = topic.id || topic.topic_code || tIdx + 1;
    const topicName = topic.topic_name || topic.title || `Topic ${tIdx + 1}`;
    const displayTitle = topic.topic_code && !topicName.startsWith(topic.topic_code)
      ? `${topic.topic_code} — ${topicName}`
      : topicName;

    const rawHours = topic.estimated_hours ?? topic.theory_hours ?? topic.hours ?? 2;
    const displayHours = typeof rawHours === "number" ? rawHours : parseFloat(String(rawHours).replace(/[^0-9.]/g, "")) || 2;
    const rawKLevel = topic.knowledge_level || topic.level || "K2";
    const kLevelTag = String(rawKLevel).toUpperCase().startsWith("K") ? String(rawKLevel).split(" ")[0] : `K${rawKLevel}`;

    const subtopicsList = Array.isArray(topic.subtopics) && topic.subtopics.length > 0
      ? topic.subtopics
      : Array.isArray(topic.extracted_subtopics) && topic.extracted_subtopics.length > 0
        ? topic.extracted_subtopics
        : [];

    const items = subtopicsList.map((sub: any, sIdx: number) => {
      const subId = String(sub.id || `${topicId}.${sIdx + 1}`);
      const subTitle = sub.subtopic_name || sub.title || sub.name || `Subtopic ${subId}`;
      const subHours = sub.hours || sub.theory_hours || "1";
      const subLevel = sub.knowledge_level || sub.level || "K2";
      return {
        id: subId,
        index: sIdx + 1,
        title: subTitle,
        highlighted: false,
        actions: [
          {
            key: "level",
            label: String(subLevel).toUpperCase().startsWith("K") ? String(subLevel).toUpperCase() : `K${subLevel}`,
            asTag: true as const,
            className: "rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600",
          },
          {
            key: "hours",
            label: String(subHours).toLowerCase().includes("h") ? `${subHours}` : `${subHours}h`,
            asTag: true as const,
            className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700",
          },
          {
            key: "delete_sub",
            label: "",
            icon: <Trash2 className="h-3 w-3 text-red-500" />,
            className: "p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer",
            onClick: () => handleDeleteSubtopic(topic, sub.id),
          },
        ],
      };
    });

    return {
      id: `topic-${topicId}`,
      title: displayTitle,
      collapsedBadge: [
        { label: `Level ${kLevelTag}`, className: "bg-indigo-50 text-indigo-700 font-bold" },
        { label: `${displayHours} Hours`, className: "bg-gray-200 text-gray-700 font-bold" },
        ...(items.length > 0 ? [{ label: `${items.length} Subtopics`, className: "bg-emerald-50 text-emerald-700 font-semibold" }] : []),
      ],
      actions: [
        {
          key: "add_subtopic",
          label: "Add Subtopic",
          icon: <Plus className="h-3 w-3 text-indigo-600" />,
          className: "flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer shadow-xs",
          onClick: () => openAddSubtopicModal(topic),
        },
        {
          key: "edit",
          label: "",
          icon: <EditIcon className="h-3.5 w-3.5" />,
          className: "flex items-center rounded border border-gray-300 bg-white p-1 text-gray-500 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer shadow-xs",
          onClick: () => openEditTopicModal(topic, "Approved"),
        },
        {
          key: "delete",
          label: "",
          icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />,
          className: "flex items-center rounded border border-red-200 bg-red-50/60 p-1 text-red-500 hover:border-red-400 hover:bg-red-100 cursor-pointer shadow-xs",
          onClick: () => handleDeleteTopic(topic),
        },
      ],
      items,
    };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* ── Section Header ── */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Unit Titles, Hours & Topic Hierarchy
            </h3>
            <p className="text-xs text-gray-500">
              Structured Unit → Topic → Subtopics curriculum breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddTopicModal(true)}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Topic
          </button>
        </div>
      </div>

      {/* ── Unit Tabs ── */}
      <div className="mb-3">
        <GenericTabs
          tabs={unitTabs}
          activeKey={activeTab}
          onChange={(key) => handleTabChange(key)}
          rightContent={
            loadingUnits || loadingDetail ? (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading units...
              </div>
            ) : null
          }
        />
      </div>

      {/* ── Topic Accordion Tree ── */}
      <AccordiansStyle
        loading={loadingDetail}
        loadingMessage="Loading unit hierarchy..."
        expandable={true}
        topics={accordionTopics}
        title={currentUnitTitle}
        subtitle={`${accordionTopics.length} Topics in this unit. Click any topic to expand and view subtopics.`}
        topicCount={accordionTopics.length}
        onAddTopic={() => setAddTopicModal(true)}
        onAddTopicLabel="Add Topic"
        expandedSectionLabel={
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Subtopics Breakdown
          </span>
        }
        footerContent={
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> NEURO AI extracted and mapped topics with Knowledge Levels and Contact Hours.
          </span>
        }
      />

      {/* ── Add Topic Modal ── */}
      {addTopicModal && (
        <AddTopicModal
          open={addTopicModal}
          onClose={() => setAddTopicModal(false)}
          defaultUnit={activeTab}
          activeUnitNumber={activeUnitNumber}
          units={unitsList}
          onAdd={async (topicData: any) => {
            try {
              const currentUnitDbId = activeDetail?.selected_unit?.id || activeUnitFromList?.id || activeUnitNumber;
              const payload = {
                topic_code: `T${activeUnitNumber}.${accordionTopics.length + 1}`,
                topic_name: topicData.title,
                learning_sequence: accordionTopics.length + 1,
                estimated_hours: parseFloat(topicData.hours) || 2,
                knowledge_level: topicData.level || "K2",
              };

              if (onAddTopic) {
                await onAddTopic(currentUnitDbId, payload);
              } else if (syllabusId) {
                await Models.topics.create(currentUnitDbId, payload);
              }

              // Update local state
              const newTopic = {
                id: Date.now(),
                ...payload,
                subtopics: [],
              };
              setUnitDetailsMap((prev) => {
                const uData = prev[activeUnitNumber] || {};
                const existing = uData?.selected_unit?.topics || uData?.topics || [];
                const updated = [...existing, newTopic];
                return {
                  ...prev,
                  [activeUnitNumber]: {
                    ...uData,
                    topics: updated,
                    selected_unit: { ...(uData.selected_unit || {}), topics: updated },
                  },
                };
              });

              Success("Topic added successfully");
              setAddTopicModal(false);
            } catch (err: any) {
              Failure(getErrorMessage(err, "Failed to add topic"));
            }
          }}
        />
      )}

      {/* ── Add Subtopic Modal ── */}
      {addSubtopicModal && selectedTopicForSubtopic && (
        <AddSubtopicModal
          open={addSubtopicModal}
          onClose={() => {
            setAddSubtopicModal(false);
            setSelectedTopicForSubtopic(null);
          }}
          parentTopic={selectedTopicForSubtopic}
          onAdd={async (subPayload: any) => {
            try {
              if (syllabusId && selectedTopicForSubtopic?.id) {
                await Models.topics.add_subtopic(selectedTopicForSubtopic.id, subPayload);
              }

              // Update local state
              setUnitDetailsMap((prev) => {
                const uData = prev[activeUnitNumber];
                if (!uData) return prev;
                const currentT = uData?.selected_unit?.topics || uData?.topics || [];
                const updated = currentT.map((t: any) => {
                  if (t.id === selectedTopicForSubtopic.id) {
                    const existingSubs = t.subtopics || [];
                    return {
                      ...t,
                      subtopics: [...existingSubs, { id: Date.now(), ...subPayload }],
                    };
                  }
                  return t;
                });
                return {
                  ...prev,
                  [activeUnitNumber]: {
                    ...uData,
                    topics: updated,
                    selected_unit: uData.selected_unit ? { ...uData.selected_unit, topics: updated } : undefined,
                  },
                };
              });

              Success("Subtopic added successfully");
              setAddSubtopicModal(false);
              setSelectedTopicForSubtopic(null);
            } catch (err: any) {
              Failure(getErrorMessage(err, "Failed to add subtopic"));
            }
          }}
        />
      )}

      {/* ── Edit Topic Modal ── */}
      {editTopicModal && selectedTopicToEdit && (
        <EditTopicModal
          open={editTopicModal}
          onClose={() => {
            setEditTopicModal(false);
            setSelectedTopicToEdit(null);
          }}
          topic={selectedTopicToEdit}
          units={unitsList}
          defaultUnit={activeTab}
          activeUnitNumber={activeUnitNumber}
          initialStatus={editModalInitialStatus}
          onUpdate={async (editPayload: any) => {
            try {
              if (syllabusId && selectedTopicToEdit?.id) {
                await Models.topics.update(selectedTopicToEdit.id, {
                  topic_name: editPayload.topic_name,
                  estimated_hours: editPayload.estimated_hours,
                  knowledge_level: editPayload.knowledge_level,
                  status: editPayload.status,
                });
              }

              // Update local state
              setUnitDetailsMap((prev) => {
                const uData = prev[activeUnitNumber];
                if (!uData) return prev;
                const currentT = uData?.selected_unit?.topics || uData?.topics || [];
                const updated = currentT.map((t: any) => {
                  if (t.id === selectedTopicToEdit.id) {
                    return {
                      ...t,
                      topic_name: editPayload.topic_name,
                      title: editPayload.topic_name,
                      estimated_hours: editPayload.estimated_hours,
                      hours: editPayload.estimated_hours,
                      knowledge_level: editPayload.knowledge_level,
                      level: editPayload.knowledge_level,
                      status: editPayload.status,
                    };
                  }
                  return t;
                });
                return {
                  ...prev,
                  [activeUnitNumber]: {
                    ...uData,
                    topics: updated,
                    selected_unit: uData.selected_unit ? { ...uData.selected_unit, topics: updated } : undefined,
                  },
                };
              });

              Success("Topic updated successfully");
              setEditTopicModal(false);
              setSelectedTopicToEdit(null);
            } catch (err: any) {
              Failure(getErrorMessage(err, "Failed to update topic"));
            }
          }}
        />
      )}
    </div>
  );
};

export default TopicHierarchyPanel;
