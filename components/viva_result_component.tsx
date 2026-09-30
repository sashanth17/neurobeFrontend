import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  MessageSquare,
  Download,
  ChevronLeft,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TopicAnalysisItem {
  topic: string;
  understanding_level: "strong" | "moderate" | "weak" | string;
  depth?: string;
  mcq_interview_consistency?: string;
  feedback?: string;
  knowledge_gaps: string[];
  misconceptions: string[];
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
}

export interface VivaReportData {
  final_summary?: string;
  key_strengths?: string[];
  priority_improvement_areas?: string[];
  topic_analysis?: TopicAnalysisItem[];
  session_metrics?: {
    total_questions_asked?: number;
    total_answered_correctly?: number;
    total_topics?: number;
    mcq_score_pct?: number;
    viva_score?: number;
  };
  reasoning_profile?: {
    summary?: string;
    reasoning_depth?: string;
  };
  assessment_summary?: {
    summary?: string;
    overall_understanding?: "strong" | "moderate" | "weak" | string;
    communication_skills?: {
      confidence?: string;
      articulation?: string;
    };
  };
  dialogue_history?: Array<{
    id?: string | number;
    role?: string;
    speaker?: string;
    sender?: string;
    content?: string;
    text?: string;
    timestamp?: string;
    evaluation?: {
      accuracy?: number;
      reasoning?: string;
    };
  }>;
}

export interface VivaResultComponentProps {
  report: VivaReportData | any;
  loading?: boolean;
  handleRetake?: () => void;
  onBackToDashboard?: () => void;
  testDetails?: {
    title?: string;
    secure_code?: string;
    passcode?: string;
    test_id?: string;
    topics?: string[];
  };
  studentEmail?: string;
  dialogueMessages?: any[];
  mode?: "dark" | "adaptive";
  showHeaderCard?: boolean;
  showFooterActions?: boolean;
  detailedReviewSlot?: React.ReactNode;
  children?: React.ReactNode;
}

// Helper to concatenate CSS class strings
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const VivaResultComponent: React.FC<VivaResultComponentProps> = ({
  report: propReport,
  loading = false,
  handleRetake: propHandleRetake,
  onBackToDashboard,
  testDetails,
  studentEmail,
  dialogueMessages,
  showFooterActions = false,
  detailedReviewSlot,
  children,
}) => {
  const handleRetake = propHandleRetake || onBackToDashboard || (() => {});

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] py-16">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface font-mono animate-pulse">Synthesizing your assessment report...</p>
      </div>
    );
  }

  // Normalize report
  let report: any = propReport;
  if (typeof report === "string") {
    try {
      report = JSON.parse(report);
    } catch {
      report = null;
    }
  }
  if (report && typeof report === "object" && report.report) {
    report = report.report;
  }

  if (!report) return null;

  if (!report.assessment_summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] p-6 text-center">
        <h2 className="text-xl text-error font-bold mb-4">Report format invalid or unavailable</h2>
        <pre className="bg-surface/10 p-4 rounded-xl text-surface/70 text-xs overflow-auto max-w-2xl w-full text-left font-mono">
          {JSON.stringify(report, null, 2)}
        </pre>
        <button
          type="button"
          onClick={handleRetake}
          className="mt-8 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-full transition-all cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const {
    session_metrics,
    assessment_summary,
    reasoning_profile,
    key_strengths = [],
    priority_improvement_areas = [],
    final_summary,
  } = report;

  // Safe topic analysis normalization
  const rawTopics = Array.isArray(report.topic_analysis) ? report.topic_analysis : [];
  const topic_analysis: TopicAnalysisItem[] = rawTopics.map((t: any) => ({
    topic: t.topic || "Core Subject Mechanics",
    understanding_level: t.understanding_level || "moderate",
    depth: t.depth || "Standard",
    mcq_interview_consistency: t.mcq_interview_consistency || "High",
    feedback: t.feedback || "",
    knowledge_gaps: Array.isArray(t.knowledge_gaps) ? t.knowledge_gaps : [],
    misconceptions: Array.isArray(t.misconceptions) ? t.misconceptions : [],
    mcq_questions_asked: t.mcq_questions_asked,
    mcq_questions_correct: t.mcq_questions_correct,
  }));

  // Normalized dialogue messages
  const rawMessages = dialogueMessages || report.dialogue_history || [];
  const messagesList = Array.isArray(rawMessages)
    ? rawMessages
        .map((msg: any, idx: number) => {
          const role = (msg.role || msg.speaker || msg.sender || "").toLowerCase();
          if (role === "system") return null;
          const isAi = role === "ai" || role === "assistant" || role === "examiner";
          const text = msg.text || msg.content || "";
          if (!text) return null;
          return {
            id: msg.id ?? idx,
            isAi,
            text,
            timestamp: msg.timestamp || "",
            evaluation: msg.evaluation,
          };
        })
        .filter(Boolean)
    : [];

  const getUnderstandingColor = (level?: string) => {
    switch ((level || "").toLowerCase()) {
      case "strong":
        return "text-success border-success/30 bg-success/10";
      case "moderate":
        return "text-accent border-accent/30 bg-accent/10";
      case "weak":
        return "text-error border-error/30 bg-error/10";
      default:
        return "text-muted border-muted/30 bg-muted/10";
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="mb-8">
        <span className="font-mono text-accent text-sm tracking-widest uppercase mb-2 block">
          Step 03 — Final Assessment
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-surface">
          Interview Report
        </h1>
        {testDetails?.title && (
          <p className="text-surface/60 text-xs sm:text-sm mt-1">
            {testDetails.title}
            {studentEmail ? ` • Candidate: ${studentEmail}` : ""}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {session_metrics && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 text-surface">
                MCQ Summary
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface/80">Total Questions Correct</span>
                  <p className="text-3xl font-mono">
                    <span className="text-success font-bold">
                      {session_metrics.total_answered_correctly ?? 0}
                    </span>
                    <span className="text-surface/30 mx-2">/</span>
                    <span className="text-surface/60 text-xl">
                      {session_metrics.total_questions_asked ?? 0}
                    </span>
                  </p>
                </div>

                {Boolean(session_metrics.total_topics) && (
                  <div className="flex justify-between items-center border-t border-surface/5 pt-3">
                    <span className="text-sm text-surface/80">Total Topics Evaluated</span>
                    <p className="text-xl font-mono text-accent font-medium">
                      {session_metrics.total_topics}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {assessment_summary && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 text-surface">
                Overall Understanding
              </h3>
              <div className="mb-4">
                <span
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border",
                    getUnderstandingColor(assessment_summary.overall_understanding)
                  )}
                >
                  {(assessment_summary.overall_understanding || "Standard").replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-surface/80 text-sm leading-relaxed">{assessment_summary.summary}</p>
            </div>
          )}

          {assessment_summary?.communication_skills && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 text-surface">
                Communication Skills
              </h3>
              <div className="space-y-4">
                {assessment_summary.communication_skills.articulation && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-1">
                      Articulation
                    </h4>
                    <p className="text-surface/80 text-sm leading-relaxed">
                      {assessment_summary.communication_skills.articulation}
                    </p>
                  </div>
                )}
                {assessment_summary.communication_skills.confidence && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-success mb-1">
                      Confidence
                    </h4>
                    <p className="text-surface/80 text-sm leading-relaxed">
                      {assessment_summary.communication_skills.confidence}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {reasoning_profile && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 text-surface">
                Reasoning Profile
              </h3>
              <div className="mb-4">
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border text-accent border-accent/30 bg-accent/10">
                  Depth: {reasoning_profile.reasoning_depth || "Standard"}
                </span>
              </div>
              <p className="text-surface/80 text-sm leading-relaxed">{reasoning_profile.summary}</p>
            </div>
          )}

          {key_strengths && key_strengths.length > 0 && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 flex items-center gap-2 text-surface">
                <CheckCircle2 className="w-5 h-5 text-success" /> Key Strengths
              </h3>
              <ul className="space-y-3">
                {key_strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-surface/80 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {priority_improvement_areas && priority_improvement_areas.length > 0 && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 flex items-center gap-2 text-surface">
                <AlertTriangle className="w-5 h-5 text-error" /> Priority Improvements
              </h3>
              <ul className="space-y-3">
                {priority_improvement_areas.map((p: string, i: number) => (
                  <li key={i} className="text-sm text-surface/80 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Topic Breakdown */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {final_summary && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6 mb-6">
              <h3 className="font-serif text-xl mb-3 flex items-center gap-2 text-surface">
                <Target className="w-5 h-5 text-accent" /> Final Conclusion
              </h3>
              <p className="text-surface/90 italic font-serif text-lg leading-relaxed">
                "{final_summary}"
              </p>
            </div>
          )}

          <h3 className="font-serif text-2xl text-surface mb-6 border-b border-surface/10 pb-2">
            Topic Analysis
          </h3>

          <div className="space-y-6 lg:max-h-[60vh] lg:overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface/20 scrollbar-track-transparent">
            {topic_analysis.map((topic, idx) => (
              <div
                key={idx}
                className="bg-surface/5 border border-surface/10 rounded-2xl p-6 relative overflow-hidden group hover:border-surface/20 transition-colors"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                <h4 className="text-xl font-medium mb-3 text-surface">{topic.topic}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border",
                      getUnderstandingColor(topic.understanding_level)
                    )}
                  >
                    Level: {topic.understanding_level.replace(/_/g, " ")}
                  </span>
                  <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-surface/60 border-surface/20 bg-surface/10">
                    Depth: {topic.depth}
                  </span>
                  <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-surface/60 border-surface/20 bg-surface/10">
                    Consistency: {topic.mcq_interview_consistency.replace(/_/g, " ")}
                  </span>
                  {topic.mcq_questions_asked !== undefined && (
                    <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-success/70 border-success/20 bg-success/5">
                      MCQ: {topic.mcq_questions_correct} / {topic.mcq_questions_asked} Correct
                    </span>
                  )}
                </div>
                <p className="text-sm text-surface/80 mb-6 leading-relaxed">{topic.feedback}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topic.knowledge_gaps.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-error mb-2">Knowledge Gaps</h5>
                      <ul className="space-y-2">
                        {topic.knowledge_gaps.map((g, i) => (
                          <li key={i} className="text-xs text-surface/70 flex items-start gap-1.5">
                            <span className="text-error mt-0.5">•</span> {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {topic.misconceptions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-accent mb-2">Misconceptions</h5>
                      <ul className="space-y-2">
                        {topic.misconceptions.map((m, i) => (
                          <li key={i} className="text-xs text-surface/70 flex items-start gap-1.5">
                            <span className="text-accent mt-0.5">•</span> {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dialogue History Transcript (if messages exist) */}
          {messagesList.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="font-serif text-2xl text-surface border-b border-surface/10 pb-2 flex items-center justify-between">
                <span>Viva Voce Dialogue History</span>
                <MessageSquare className="h-5 w-5 text-accent" />
              </h3>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface/20 scrollbar-track-transparent">
                {messagesList.map((msg: any) => {
                  const isAi = msg.isAi;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-2xl p-4 text-xs leading-relaxed border transition-colors",
                        isAi
                          ? "bg-surface/5 border-surface/10 text-surface/90"
                          : "bg-accent/10 border-accent/30 text-surface ml-4"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold opacity-75">
                        <span className={isAi ? "text-accent font-semibold" : "text-success font-semibold"}>
                          {isAi ? "AI Examiner Question" : "Candidate Response"}
                        </span>
                        {msg.timestamp && <span className="text-surface/50">{msg.timestamp}</span>}
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>

                      {msg.evaluation && typeof msg.evaluation.accuracy === "number" && (
                        <div
                          className={cn(
                            "mt-2 rounded-xl p-2.5 text-[11px] border font-medium",
                            msg.evaluation.accuracy >= 0.6
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-error/10 border-error/30 text-error"
                          )}
                        >
                          Accuracy: {Math.round(msg.evaluation.accuracy * 100)}%
                          {msg.evaluation.reasoning ? ` — ${msg.evaluation.reasoning}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Question Review Slot */}
          {detailedReviewSlot}
          {children}
        </div>
      </div>

      {/* Footer Actions */}
      {showFooterActions && (
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 border-t border-surface/10 pt-8">
          <button
            type="button"
            onClick={handleRetake}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium bg-surface/10 hover:bg-surface/20 border border-surface/20 text-surface transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium bg-accent hover:bg-accent/90 text-white transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download & Save Report</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const viva_result_component = VivaResultComponent;
export default VivaResultComponent;
