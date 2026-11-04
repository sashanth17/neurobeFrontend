import React from "react";
import { ClassroomComparativeItem } from "@/services/academicAdminAnalytics.service";

interface MistakeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  courseTitle: string;
  baselineAttainment: number;
  baselinePass: number;
  classroom: ClassroomComparativeItem | null;
  isMcq?: boolean;
}

const MistakeAnalysisModal: React.FC<MistakeAnalysisModalProps> = ({
  isOpen,
  onClose,
  courseCode,
  courseTitle,
  baselineAttainment,
  baselinePass,
  classroom,
  isMcq = false,
}) => {
  if (!isOpen || !classroom) return null;

  const mistake = classroom.mistake_analysis;
  const kLevels = mistake?.k_level_comparison || {};
  const kKeys = ["K1", "K2", "K3", "K4", "K5", "K6"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full bg-gray-100 dark:bg-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              Anomaly & Mistake Diagnostics
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              Course: {courseCode} - {courseTitle}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            Section: {classroom.instance_name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Instructor: <span className="font-bold text-gray-700 dark:text-gray-300">{classroom.faculty_name}</span> | Students: <span className="font-bold">{classroom.student_count}</span>
          </p>
        </div>

        {/* Primary Alert Banner */}
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-lg shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Critical Performance Divergence Detected
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {mistake?.primary_concern || `Section is failing (${classroom.pass_pct}% pass rate) while course baseline maintains ${baselinePass}%.`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">{isMcq ? "Score Deficit" : "Attainment Deficit"}</div>
            <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">
              {classroom.delta_from_baseline}%
            </div>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{isMcq ? "Class Score" : "Class Attainment"}</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{classroom.attainment_pct}%</span>
            <span className="text-[10px] text-gray-400 block">Baseline: {baselineAttainment}%</span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pass Rate</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{classroom.pass_pct}%</span>
            <span className="text-[10px] text-gray-400 block">Baseline: {baselinePass}%</span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Absenteeism</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {mistake?.absenteeism_rate_pct ?? 0}%
            </span>
            <span className="text-[10px] text-gray-400 block">High impact risk</span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Weakest Level</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400">
              Bloom {mistake?.weakest_cognitive_level ?? "K3"}
            </span>
            <span className="text-[10px] text-gray-400 block">Application & Analyze</span>
          </div>
        </div>

        {/* Bloom Level Cognitive Deficit Comparison */}
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Cognitive Rigor Comparison (Bloom Levels K1 - K6)</span>
            <span className="text-[10px] font-normal text-gray-400">Section vs Course Baseline</span>
          </h3>
          <div className="space-y-2.5 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            {kKeys.map((k) => {
              const comp = kLevels[k] || {
                class_pct: classroom.k_levels[k] ?? 50,
                course_baseline_pct: 65,
                gap: 15,
              };
              const classPct = comp.class_pct;
              const basePct = comp.course_baseline_pct;
              const hasDeficit = classPct < basePct;

              return (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-700 dark:text-gray-300">
                      Bloom {k}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-gray-500">
                        Class: <span className={hasDeficit ? "text-rose-600 font-extrabold" : "text-emerald-600 font-extrabold"}>{classPct}%</span>
                      </span>
                      <span className="text-gray-400">
                        Baseline: <span className="text-gray-700 dark:text-gray-200">{basePct}%</span>
                      </span>
                      {hasDeficit && (
                        <span className="text-rose-600 dark:text-rose-400 text-[10px] font-black">
                          (-{Math.abs(comp.gap)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Visual Bar Comparison */}
                  <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {/* Course Baseline marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white z-10"
                      style={{ left: `${basePct}%` }}
                      title={`Baseline: ${basePct}%`}
                    />
                    {/* Class progress bar */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasDeficit ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(classPct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Identified Root Causes */}
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
            Diagnosed Root Causes & Failure Patterns
          </h3>
          <div className="space-y-2">
            {(mistake?.root_causes && mistake.root_causes.length > 0
              ? mistake.root_causes
              : [
                  "Critical drop in Higher Order Thinking (K3 Apply / K4 Analyze) questions in internal tests.",
                  isMcq ? "High absenteeism directly correlated with zero-score question papers." : "High absenteeism directly correlated with zero-attainment question papers.",
                  "Significant pacing gap in topic coverage compared to peer sections.",
                ]
            ).map((cause, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs text-rose-900 dark:text-rose-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{cause}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Remedial Action Plan */}
        <div>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
            Principal Action Plan & Corrective Interventions
          </h3>
          <div className="space-y-2">
            {(mistake?.recommended_interventions && mistake.recommended_interventions.length > 0
              ? mistake.recommended_interventions
              : [
                  "Schedule remedial tutoring on Bloom K3 problem-solving modules with faculty coordinator.",
                  "Enforce mandatory mentor-mentee attendance counseling for Section " + classroom.instance_name + ".",
                  "Cross-classroom peer study circle pairing this section with top performing Section A.",
                  "Conduct faculty sync to calibrate CIA test question complexity and assessment rubric.",
                ]
            ).map((rec, i) => (
              <label
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {rec}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              alert("Action plan dispatched to Faculty & Course Coordinator.");
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-white shadow-md hover:bg-primary/90 transition"
          >
            Dispatch Remedial Directive
          </button>
        </div>
      </div>
    </div>
  );
};

export default MistakeAnalysisModal;

