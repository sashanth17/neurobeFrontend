import { useEffect, useState } from "react";
import { X, Sparkles, BarChart2 } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const UNITS = [
  {
    id: 1,
    label: "Unit 1",
    title: "Physical Layer & Net...",
    fullTitle: "Physical Layer & Network Architectures",
    topics: [
      {
        id: "1.1",
        label: "1.1 Network Models & Layered Architecture",
        subtopics: [
          "OSI 7-Layer Reference Model",
          "TCP/IP 5-Layer Protocol Suite",
          "Layer Functions & Protocol Data Units (PDU)",
        ],
      },
      {
        id: "1.2",
        label: "1.2 Physical Layer & Transmission Media",
        subtopics: [
          "Guided Media: Twisted Pair, Coaxial, Fiber",
          "Unguided Media: Radio, Microwave, Infrared",
        ],
      },
      {
        id: "1.3",
        label: "1.3 Network Topologies & Switching Techniqu...",
        subtopics: [
          "Bus, Star, Ring, Mesh Topologies",
          "Circuit Switching vs Packet Switching",
        ],
      },
      {
        id: "1.4",
        label: "1.4 Network Performance Metrics",
        subtopics: [
          "Bandwidth, Latency, Throughput",
          "Propagation vs Transmission Delay",
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Unit 2",
    title: "Data Link Layer & MA...",
    fullTitle: "Data Link Layer & MAC Protocols",
    topics: [
      {
        id: "2.1",
        label: "2.1 Framing & Error Control",
        subtopics: ["Framing Techniques", "CRC and Hamming Codes"],
      },
      {
        id: "2.2",
        label: "2.2 MAC Protocols",
        subtopics: ["ALOHA, CSMA/CD, CSMA/CA"],
      },
      {
        id: "2.3",
        label: "2.3 Ethernet Standards",
        subtopics: ["IEEE 802.3", "Gigabit Ethernet"],
      },
    ],
  },
  {
    id: 3,
    label: "Unit 3",
    title: "Network Layer & Rout...",
    fullTitle: "Network Layer & Routing Protocols",
    topics: [
      {
        id: "3.1",
        label: "3.1 IPv4 Addressing & Subnet Design",
        subtopics: ["Subnetting", "VLSM", "CIDR"],
      },
      {
        id: "3.2",
        label: "3.2 Routing Algorithms",
        subtopics: ["Dijkstra", "Bellman-Ford"],
      },
    ],
  },
  {
    id: 4,
    label: "Unit 4",
    title: "Transport Layer & Co...",
    fullTitle: "Transport Layer & Congestion Control",
    topics: [
      {
        id: "4.1",
        label: "4.1 TCP Protocol",
        subtopics: ["3-Way Handshake", "Flow Control", "Congestion Control"],
      },
      {
        id: "4.2",
        label: "4.2 UDP Protocol",
        subtopics: ["UDP Characteristics", "Use Cases"],
      },
    ],
  },
  {
    id: 5,
    label: "Unit 5",
    title: "Application Layer & N...",
    fullTitle: "Application Layer & Network Security",
    topics: [
      {
        id: "5.1",
        label: "5.1 Application Protocols",
        subtopics: ["HTTP, DNS, FTP, SMTP"],
      },
      {
        id: "5.2",
        label: "5.2 Network Security",
        subtopics: ["Cryptography", "Firewalls", "VPN"],
      },
    ],
  },
];

const CO_OPTIONS = [
  { value: "CO1", label: "CO1 — Physical Layer & A..." },
  { value: "CO2", label: "CO2 — Data Link Layer" },
  { value: "CO3", label: "CO3 — Network Layer" },
  { value: "CO4", label: "CO4 — Transport Layer" },
  { value: "CO5", label: "CO5 — Application Layer" },
  { value: "CO6", label: "CO6 — Network Security" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "MCQ", label: "Multiple Choice Question..." },
  { value: "Short", label: "Short Answer" },
  { value: "Long", label: "Long Answer" },
  { value: "Fill", label: "Fill in the Blank" },
];

const MARKS_OPTIONS = [
  { value: "1", label: "1 Mark" },
  { value: "2", label: "2 Marks" },
  { value: "5", label: "5 Marks" },
  { value: "10", label: "10 Marks" },
];

const K_LEVELS = [
  { key: "K1", label: "Remember" },
  { key: "K2", label: "Understand" },
  { key: "K3", label: "Apply" },
  { key: "K4", label: "Analyze" },
];

interface GenerateQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  courseCode?: string;
  onSubmit?: (data: any) => void;
}

const GenerateQuestionsModal = ({
  open,
  onClose,
  courseCode = "CS2304 — Computer Networks",
  onSubmit,
}: GenerateQuestionsModalProps) => {
  const [activeUnit, setActiveUnit] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["1.1"]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([
    "OSI 7-Layer Reference Model",
    "TCP/IP 5-Layer Protocol Suite",
    "Layer Functions & Protocol Data Units (PDU)",
  ]);
  const [co, setCo] = useState(CO_OPTIONS[0]);
  const [questionType, setQuestionType] = useState(QUESTION_TYPE_OPTIONS[0]);
  const [marks, setMarks] = useState(MARKS_OPTIONS[1]);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );
  const [kCounts, setKCounts] = useState<Record<string, number>>({
    K1: 2,
    K2: 3,
    K3: 5,
    K4: 0,
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const unit = UNITS[activeUnit];

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
    setSelectedSubtopics([]);
  };

  const toggleSubtopic = (s: string) => {
    setSelectedSubtopics((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const allSubtopics = unit.topics
    .filter((t) => selectedTopics.includes(t.id))
    .flatMap((t) => t.subtopics);

  const selectAllSubtopics = () => setSelectedSubtopics(allSubtopics);

  const adjustK = (key: string, delta: number) => {
    setKCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] ?? 0) + delta),
    }));
  };

  const total = Object.values(kCounts).reduce((a, b) => a + b, 0);

  const handleSubmit = () => {
    const data = {
      unit: unit.fullTitle,
      selectedTopics,
      selectedSubtopics,
      co: co?.value,
      questionType: questionType?.value,
      marks: marks?.value,
      difficulty,
      kCounts,
      total,
    };
    onSubmit?.(data);
    console.log("Generate Questions Data:", data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header - fixed */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-color2 flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#000] dark:text-white">
                Generate Questions
              </h2>
              <span className="rounded-full border border-gray-200 px-3 py-0.5 text-xs font-semibold text-pri">
                {courseCode}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pri mt-0.5 rounded-full border border-gray-500 p-0.5 hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto p-6 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Unit Selection */}
          <p className="mb-2 text-sm font-bold text-[#000] dark:text-white">
            Unit Selection
          </p>
          <div className="mb-5 grid grid-cols-5 gap-2">
            {UNITS.map((u, i) => (
              <button
                key={u.id}
                onClick={() => {
                  setActiveUnit(i);
                  setSelectedTopics([]);
                  setSelectedSubtopics([]);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${
                  i === activeUnit
                    ? "border-color2 bg-color2 text-white"
                    : "border-gray-200 bg-white text-[#000] hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <div className=" text-sm font-bold">{u.label}</div>
                <div
                  className={`mt-0.5 truncate font-normal ${
                    i === activeUnit ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {u.title}
                </div>
              </button>
            ))}
          </div>

          {/* Topics */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[#000] dark:text-white">
              Topics{" "}
              <span className="text-xs font-normal text-[#000]">
                (Select multiple required topics)
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTopics(unit.topics.map((t) => t.id))}
                className="text-color2 text-xs font-semibold hover:underline"
              >
                Select All
              </button>
              <span className="text-xs text-[#000]">
                {selectedTopics.length} Selected
              </span>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {unit.topics.map((t) => {
              const checked = selectedTopics.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    checked
                      ? "border-color2 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-color2 bg-color2" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`truncate text-xs font-semibold ${
                      checked
                        ? "text-color2"
                        : "text-[#000] dark:text-gray-300"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtopics */}
          {selectedTopics.length > 0 && allSubtopics.length > 0 && (
            <div className="mb-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-pri">
                  {
                    unit.topics.find((t) => selectedTopics.includes(t.id))
                      ?.label
                  }{" "}
                  Subtopics
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllSubtopics}
                    className="text-color2 text-xs font-semibold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-xs text-[#000]">
                    {selectedSubtopics.length} Selected
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {allSubtopics.map((s) => {
                  const checked = selectedSubtopics.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubtopic(s)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                        checked
                          ? "border-color2 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-color2 bg-color2"
                            : "border-gray-300"
                        }`}
                      >
                        {checked && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 12 12"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`truncate font-semibold ${
                          checked
                            ? "text-color2"
                            : "text-[#000] dark:text-gray-300"
                        }`}
                      >
                        {s}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CO + Type + Marks */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <CustomSelect
              title="Course Outcome (CO)"
              options={CO_OPTIONS}
              value={co}
              onChange={(v: any) => setCo(v)}
              isSearchable={false}
              isClearable={false}
            />
            <CustomSelect
              title="Question Type"
              options={QUESTION_TYPE_OPTIONS}
              value={questionType}
              onChange={(v: any) => setQuestionType(v)}
              isSearchable={false}
              isClearable={false}
            />
            <CustomSelect
              title="Marks per Question"
              options={MARKS_OPTIONS}
              value={marks}
              onChange={(v: any) => setMarks(v)}
              isSearchable={false}
              isClearable={false}
            />
          </div>

          {/* Difficulty */}
          <p className="mb-2 text-sm font-bold text-[#000] dark:text-white">
            Target Difficulty
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 p-1 dark:border-gray-700">
            {(["Easy", "Medium", "Hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                  difficulty === d
                    ? "bg-color2 text-white shadow"
                    : "text-pri hover:text-[#000]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* K-level counts */}
          <div className="mb-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center gap-2">
              <BarChart2 className="text-color2 h-4 w-4" />
              <p className="text-sm font-bold text-[#000] dark:text-white">
                Knowledge Level-wise Question Count
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {K_LEVELS.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-color2 text-xs font-bold">{key}</span>
                    <span className="text-xs text-[#000]">{label}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => adjustK(key, -1)}
                      className="hover:border-color2 hover:text-color2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-pri"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-[#000] dark:text-gray-200">
                      {kCounts[key]}
                    </span>
                    <button
                      onClick={() => adjustK(key, 1)}
                      className="hover:border-color2 hover:text-color2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-pri"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#000] dark:text-gray-300">
                  Total Questions to Generate:
                </span>
                <span className="rounded-lg border border-gray-300 px-3 py-0.5 text-sm font-bold text-[#000] dark:text-gray-300">
                  {total} Questions
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-pri">
                {K_LEVELS.filter((k) => kCounts[k.key] > 0).map((k, i, arr) => (
                  <span key={k.key}>
                    {k.key}: {kCounts[k.key]}
                    {i < arr.length - 1 ? " + " : ""}
                  </span>
                ))}
                {total > 0 && (
                  <span className="bg-color2 ml-1 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
                    {total} Total
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions - fixed at bottom */}
        </div>
        <div className="flex shrink-0 justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-[#000] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> Generate Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionsModal;
