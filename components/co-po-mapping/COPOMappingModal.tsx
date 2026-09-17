import { useEffect, useState } from "react";
import { X, Pencil, CheckCircle, Cpu } from "lucide-react";

const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
};

const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);
  return { visible, closing };
};

const PO_DESCRIPTIONS: Record<string, string> = {
  PO1: "Engineering Knowledge — Apply knowledge of mathematics, science, engineering fundamentals, and computer science specialization to the solution of complex engineering problems.",
  PO2: "Problem Analysis — Identify, formulate, research literature, and analyze complex engineering problems reaching substantiated conclusions.",
  PO3: "Design/Development of Solutions — Design solutions for complex engineering problems and design system components or processes.",
  PO4: "Conduct Investigations of Complex Problems — Use research-based knowledge and methods including design of experiments.",
  PO5: "Modern Tool Usage — Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.",
  PO6: "The Engineer and Society — Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural issues.",
  PO7: "Environment and Sustainability — Understand the impact of professional engineering solutions in societal and environmental contexts.",
  PO8: "Ethics — Apply ethical principles and commit to professional ethics and responsibilities.",
  PO9: "Individual and Team Work — Function effectively as an individual, and as a member or leader in diverse teams.",
  PO10: "Communication — Communicate effectively on complex engineering activities with the engineering community and society at large.",
  PO11: "Project Management and Finance — Demonstrate knowledge and understanding of engineering and management principles.",
  PO12: "Life-long Learning — Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.",
  PSO1: "Apply core computing concepts to design and develop efficient software systems and applications.",
  PSO2: "Utilize modern tools, frameworks, and methodologies to solve real-world computing problems.",
};

const SCORE_CONFIG: Record<
  number,
  { label: string; bg: string; desc: string }
> = {
  3: { label: "Mapping Strength: 3", bg: "bg-green-800", desc: "High" },
  2: { label: "Mapping Strength: 2", bg: "bg-blue-700", desc: "Medium" },
  1: { label: "Mapping Strength: 1", bg: "bg-amber-600", desc: "Low" },
  0: { label: "No Mapping", bg: "bg-gray-300", desc: "No Mapping" },
};

const AI_RATIONALE: Record<string, string> = {
  PO1: "Applies foundational engineering and mathematical principles to layered network architectures, framing protocols, error detection (CRC), and transmission mediums.",
  PO2: "Requires systematic analysis of network topologies, protocol behaviors, and failure scenarios to derive substantiated engineering conclusions.",
  PO3: "Involves designing network components, subnetting schemes, and protocol stacks to address complex connectivity requirements.",
  PO4: "Demands experimental investigation of network performance metrics, packet loss, and latency under varying conditions.",
  PO5: "Utilizes simulation tools, network analyzers, and modern protocol frameworks to model and evaluate network behavior.",
  PO6: "Considers societal implications of network design decisions including privacy, accessibility, and regulatory compliance.",
  PO7: "Evaluates environmental impact of network infrastructure deployment and promotes sustainable networking practices.",
  PO8: "Addresses ethical responsibilities in network security, data privacy, and responsible use of communication systems.",
  PO9: "Collaborative network design projects require effective teamwork, role distribution, and leadership in technical environments.",
  PO10: "Communicates network design specifications, performance reports, and technical documentation to diverse stakeholders.",
  PO11: "Applies project management principles to plan, budget, and execute network infrastructure deployment projects.",
  PO12: "Encourages continuous learning to keep pace with evolving networking standards, protocols, and technologies.",
  PSO1: "Directly applies core computing and networking concepts to design robust and efficient communication systems.",
  PSO2: "Leverages modern networking tools, simulators, and frameworks to solve real-world connectivity and performance challenges.",
};

interface COPOMappingModalProps {
  open: boolean;
  onClose: () => void;
  coCode: string;
  coDescription: string;
  bloomLevel?: string;
  coTitle?: string;
  poKey: string;
  poTitle?: string;
  poDescription?: string;
  score: number;
  strengthLabel?: string;
  justification?: string | null;
  suggestedBy?: string;
  isAiSuggested?: boolean;
  status?: string;
  loading?: boolean;
  fetching?: boolean;
  onUpdate: (data: {
    co_code: string;
    target_code: string;
    correlation_level: number;
    justification: string;
    status: string;
  }) => void;
  onAccept: (data: {
    co_code: string;
    target_code: string;
  }) => void;
}

const COPOMappingModal = ({
  open,
  onClose,
  coCode,
  coDescription,
  coTitle,
  bloomLevel,
  poKey,
  poTitle,
  poDescription,
  score,
  strengthLabel,
  justification,
  suggestedBy,
  isAiSuggested = true,
  status,
  loading = false,
  fetching = false,
  onUpdate,
  onAccept,
}: COPOMappingModalProps) => {
  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  const [editableScore, setEditableScore] = useState<number>(score);
  const [editableJustification, setEditableJustification] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setEditableScore(score);
    setEditableJustification(
      justification || AI_RATIONALE[poKey] || "Empirical packet capture analysis and latency profiling using Wireshark lab simulations."
    );
  }, [score, justification, poKey]);

  useEffect(() => {
    setIsEditing(false);
  }, [open]);

  if (!visible) return null;

  const scoreConf = SCORE_CONFIG[editableScore] ?? SCORE_CONFIG[0];
  const poDesc = poDescription || PO_DESCRIPTIONS[poKey] || "";
  const poHeading = poTitle || (poKey.startsWith("PSO") ? "Program Specific Outcome" : "Engineering Knowledge");
  const rationale = editableJustification || justification || AI_RATIONALE[poKey] || "AI rationale not available for this mapping.";
  const displayStrengthLabel = isEditing ? scoreConf.label : (strengthLabel || scoreConf.label);
  const isAccepted = status?.toLowerCase() === "accepted";

  const handleUpdate = () => {
    onUpdate({
      co_code: coCode,
      target_code: poKey,
      correlation_level: editableScore,
      justification: editableJustification || rationale,
      status: "modified",
    });
  };

  const handleAccept = () => {
    onAccept({
      co_code: coCode,
      target_code: poKey,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        animation: closing
          ? "fadeOut 0.22s ease forwards"
          : "fadeIn 0.22s ease",
      }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl dark:bg-gray-900"
        style={{
          animation: closing
            ? "slideDown 0.22s ease forwards"
            : "slideUp 0.22s ease",
        }}
      >
        {/* Header */}
        <div className="bg-color1 flex items-start justify-between rounded-t-lg px-5 py-4">
          <div>
            <div className="flex items-center gap-2 pb-2">
              <span className="rounded-md bg-white/10 p-1 px-2 font-semibold text-white/90 text-xs">
                {coCode} × {poKey}
              </span>
              <span className="text-xs text-white/80">Mapping Details</span>
              {status && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    status === "accepted"
                      ? "bg-green-500/20 text-green-300 border border-green-400/30"
                      : status === "modified"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {status}
                </span>
              )}
            </div>
            <h3 className="section-ti !text-[#fff]">
              CO–PO Mapping Review
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {fetching && (
              <span className="flex items-center gap-1.5 text-xs text-white/80 animate-pulse">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Loading...</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="mt-0.5 rounded-full border border-white/40 p-0.5 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 max-h-[75vh] overflow-y-auto">
          {/* CO Section */}
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2">
              <span className="bg-color2-l text-color2 rounded px-2 py-0.5 text-xs font-bold">
                {coCode}
              </span>
              {bloomLevel && (
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  {bloomLevel}
                </span>
              )}
              <span className="text-sm font-bold text-[#000] dark:text-white">
                {coTitle || "Course Outcome"}
              </span>
            </div>
            <p className="pt-2 text-xs text-pri dark:text-white/70">
              {coDescription}
            </p>
          </div>

          {/* PO Section */}
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-[#000] px-2 py-0.5 text-xs font-bold text-white">
                {poKey}
              </span>
              <span className="text-sm font-bold text-[#000] dark:text-white">
                {poHeading}
              </span>
            </div>
            <p className="text-xs pt-2 text-pri dark:text-white/70">{poDesc}</p>
          </div>

          {/* Mapping Strength */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-bold text-[#000] dark:text-white">
                Suggested Mapping Value:
              </span>
              <span className="text-color2 text-sm font-bold">
                Value: {editableScore > 0 ? editableScore : "–"}
              </span>
            </div>

            <div
              className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                editableScore > 0
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${scoreConf.bg}`}
                >
                  {editableScore > 0 ? editableScore : "–"}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#000] dark:text-white">
                    {displayStrengthLabel}
                  </p>
                  {isAiSuggested && (
                    <p className="text-color2 text-[10px] font-medium">Suggested by {suggestedBy || "NEURO AI"}</p>
                  )}
                </div>
              </div>

              {/* Editable score selector: displayed when isEditing is true */}
              {isEditing && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[11px] font-medium text-gray-500 px-1">Select:</span>
                  {[3, 2, 1, 0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditableScore(s)}
                      className={`h-7 px-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        editableScore === s
                          ? SCORE_CONFIG[s].bg + " text-white shadow-sm ring-2 ring-color2 scale-105"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                      title={`Set strength: ${s}`}
                    >
                      {s === 0 ? "– None" : s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-1.5 flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="text-color2 h-3.5 w-3.5" />
              <span className="text-color2 text-sm font-bold">
                NEURO AI Rationale
              </span>
            </div>
            {isEditing && (
              <span className="text-[10px] text-gray-500 font-medium">(Editable)</span>
            )}
          </div>

          {/* AI Rationale */}
          <div className="bg-color2-l rounded-xl p-3">
            {isEditing ? (
              <textarea
                value={editableJustification}
                onChange={(e) => setEditableJustification(e.target.value)}
                placeholder="Enter justification for this mapping..."
                className="w-full text-xs leading-relaxed bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-[#000] dark:text-white focus:outline-none focus:ring-1 focus:ring-color2 resize-none h-20"
              />
            ) : (
              <p className="text-xs leading-relaxed text-[#000] dark:text-white/80">
                {rationale}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center ${
            isAccepted && !isEditing ? "justify-end" : "justify-between"
          } border-t border-gray-100 px-5 py-3 dark:border-gray-700 mt-2`}
        >
          {isEditing ? (
            <button
              onClick={() => {
                setIsEditing(false);
                setEditableScore(score);
              }}
              className="create-btn-sec text-xs"
              type="button"
            >
              Cancel Edit
            </button>
          ) : !isAccepted ? (
            <button
              onClick={() => setIsEditing(true)}
              className="create-btn-sec text-xs"
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Mapping
            </button>
          ) : null}

          {isEditing ? (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="create-btn text-xs disabled:opacity-50"
              type="button"
            >
              {loading ? (
                <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Update mapping
            </button>
          ) : isAccepted ? (
            <button
              disabled
              className="create-btn text-xs !bg-green-600 cursor-default opacity-95"
              type="button"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Accepted
            </button>
          ) : (
            <button
              onClick={handleAccept}
              disabled={loading}
              className="create-btn text-xs disabled:opacity-50"
              type="button"
            >
              {loading ? (
                <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              Accept Mapping
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default COPOMappingModal;
