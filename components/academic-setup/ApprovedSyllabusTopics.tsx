import { useState } from "react";
import { Info, Pencil, ChevronDown } from "lucide-react";

interface Subtopic {
  id: string;
  title: string;
  hours: number;
  level: string;
  status: "Approved" | "Needs Review";
}
interface Topic { id: number; title: string; subtopics?: Subtopic[]; }
interface Unit { id: number; label: string; title: string; hours: number; topics: Topic[]; }

const UNITS: Unit[] = [
  { id: 1, label: "Unit 1", title: "Physical Layer & Network Architectures", hours: 9, topics: [
    { id: 1, title: "Layered Network Architecture: OSI Model vs TCP/IP Protocol Stack", subtopics: [
      { id: "1.1", title: "Network Models & Layered Architecture", hours: 2, level: "K2", status: "Approved" },
      { id: "1.2", title: "Physical Layer & Transmission Media", hours: 2, level: "K2", status: "Needs Review" },
    ]},
    { id: 2, title: "Physical Media: Guided (Twisted Pair, Coaxial, Fiber Optics) and Unguided Transmission", subtopics: [
      { id: "2.1", title: "Network Topologies & Switching Techniques", hours: 2.5, level: "K2", status: "Needs Review" },
      { id: "2.2", title: "Network Performance Metrics", hours: 2.5, level: "K3", status: "Needs Review" },
    ]},
    { id: 3, title: "Signal Encoding, Digital Transmission, and Multiplexing (FDM, TDM, WDM)", subtopics: [
      { id: "3.1", title: "Signal Encoding Techniques", hours: 2, level: "K2", status: "Approved" },
    ]},
    { id: 4, title: "Network Topologies, Performance Metrics: Bandwidth, Latency, Throughput, and Jitter", subtopics: [
      { id: "4.1", title: "Bandwidth & Latency Analysis", hours: 1.5, level: "K3", status: "Approved" },
    ]},
    { id: 5, title: "Packet Switching vs Circuit Switching Principles", subtopics: [
      { id: "5.1", title: "Switching Techniques Comparison", hours: 1, level: "K2", status: "Needs Review" },
    ]},
  ]},
  { id: 2, label: "Unit 2", title: "Data Link Layer & MAC Protocols", hours: 9, topics: [
    { id: 1, title: "Framing, Flow Control, and Error Control Mechanisms", subtopics: [
      { id: "1.1", title: "Framing & Error Detection", hours: 2, level: "K2", status: "Approved" },
    ]},
    { id: 2, title: "HDLC and PPP Protocols", subtopics: [
      { id: "2.1", title: "HDLC Frame Structure", hours: 2, level: "K2", status: "Needs Review" },
    ]},
    { id: 3, title: "Multiple Access Protocols: ALOHA, CSMA/CD, CSMA/CA", subtopics: [
      { id: "3.1", title: "ALOHA & CSMA Variants", hours: 2.5, level: "K3", status: "Approved" },
    ]},
    { id: 4, title: "IEEE 802.3 Ethernet Standards and Gigabit Ethernet", subtopics: [
      { id: "4.1", title: "Ethernet Standards Overview", hours: 2.5, level: "K2", status: "Needs Review" },
    ]},
  ]},
  { id: 3, label: "Unit 3", title: "Network Layer & Routing Protocols", hours: 10, topics: [
    { id: 1, title: "IPv4 Addressing, Subnetting, and CIDR", subtopics: [
      { id: "1.1", title: "IPv4 Subnetting & CIDR", hours: 3, level: "K3", status: "Approved" },
    ]},
    { id: 2, title: "Routing Algorithms: Dijkstra, Bellman-Ford", subtopics: [
      { id: "2.1", title: "Dijkstra & Bellman-Ford", hours: 2.5, level: "K3", status: "Needs Review" },
    ]},
    { id: 3, title: "Routing Protocols: RIP, OSPF, BGP", subtopics: [
      { id: "3.1", title: "RIP, OSPF & BGP Overview", hours: 2.5, level: "K2", status: "Approved" },
    ]},
    { id: 4, title: "IPv6 Addressing and Transition Mechanisms", subtopics: [
      { id: "4.1", title: "IPv6 & Transition Strategies", hours: 2, level: "K2", status: "Needs Review" },
    ]},
  ]},
  { id: 4, label: "Unit 4", title: "Transport Layer & Congestion Control", hours: 9, topics: [
    { id: 1, title: "TCP: Connection Establishment, Flow Control, Congestion Control", subtopics: [
      { id: "1.1", title: "TCP Handshake & Flow Control", hours: 3, level: "K3", status: "Approved" },
    ]},
    { id: 2, title: "UDP: Characteristics and Use Cases", subtopics: [
      { id: "2.1", title: "UDP Use Cases", hours: 2, level: "K2", status: "Needs Review" },
    ]},
    { id: 3, title: "Socket Programming Basics", subtopics: [
      { id: "3.1", title: "Socket API & Programming", hours: 4, level: "K3", status: "Approved" },
    ]},
  ]},
  { id: 5, label: "Unit 5", title: "Application Layer & Network Security", hours: 8, topics: [
    { id: 1, title: "HTTP, HTTPS, DNS, FTP, SMTP Protocols", subtopics: [
      { id: "1.1", title: "Application Layer Protocols", hours: 3, level: "K2", status: "Approved" },
    ]},
    { id: 2, title: "Cryptography: Symmetric, Asymmetric, and Hash Functions", subtopics: [
      { id: "2.1", title: "Cryptographic Techniques", hours: 3, level: "K3", status: "Needs Review" },
    ]},
    { id: 3, title: "Firewalls, IDS, and VPN Technologies", subtopics: [
      { id: "3.1", title: "Firewalls & VPN", hours: 2, level: "K2", status: "Approved" },
    ]},
  ]},
];

interface ApprovedSyllabusTopicsProps {
  courseCode?: string;
}

const ApprovedSyllabusTopics = ({ courseCode = "CS309" }: ApprovedSyllabusTopicsProps) => {
  const [activeUnit, setActiveUnit] = useState<number | "all">(1);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (key: string) =>
    setOpenTopics((prev) => ({ ...prev, [key]: !prev[key] }));

  const visibleUnits = activeUnit === "all" ? UNITS : UNITS.filter((u) => u.id === activeUnit);

  return (
    <div className=" mb-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#000] dark:text-white">Topics from Approved Syllabus</h3>
        <span className="text-sm font-semibold text-pri">{courseCode} Syllabus</span>
      </div>

      {/* Unit tabs */}
      <div className="mb-4 flex items-center gap-2 panel rounded-md px-1 py-1">
        <button
            onClick={() => setActiveUnit("all")}

          className={`rounded-lg border bg-sec-dark px-4 py-1 text-sm font-bold transition-all`}
        >
          All Units
        </button>
        {UNITS.map((u) => (
          <button
            key={u.id}
            onClick={() => setActiveUnit(u.id)}
            className={`rounded-lg px-4 py-1 text-sm font-medium transition-all ${
              activeUnit === u.id
                ? "bg-color2 text-white"
                : "text-pri hover:text-[#000] dark:text-gray-400"
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* Unit sections */}
      <div className="space-y-4">
        {visibleUnits.map((unit) => (
          <div key={unit.id} className="overflow-hidden  rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Unit header */}
            <div className="flex items-center justify-between bg-[#0f1117] px-5 py-4">
              <span className="text-sm font-bold text-white">Unit {unit.id} — {unit.title}</span>
              <span className="rounded-full bg-gray-700 px-3 py-0.5 text-xs font-semibold text-gray-200">{unit.hours} Hours</span>
            </div>

            {/* Topics */}
            <div className="bg-white p-4 dark:bg-gray-900">
              <div className="mb-3 space-y-2">
                {unit.topics.map((topic) => {
                  const key = `${unit.id}-${topic.id}`;
                  const isOpen = !!openTopics[key];
                  return (
                  <div key={topic.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    {/* Topic row — clickable accordion header */}
                    <button
                      onClick={() => toggleTopic(key)}
                      className="w-full flex items-center gap-3 bg-grey px-5 py-3 text-left"
                    >
                      <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-light-blue">
                        <span className="text-sm font-semibold text-primary">{topic.id}</span>
                      </div>
                      <span className="flex-1 text-sm text-[#000] font-medium dark:text-gray-300">{topic.title}</span>
                      <ChevronDown className={`h-4 w-4 text-[#000] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Subtopics */}
                    {isOpen && topic.subtopics && topic.subtopics.length > 0 && (
                      <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700 ml-16 border-l-2 border-l-primary">
                        {topic.subtopics.map((sub) => (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between px-5 py-3 ${
                              sub.status === "Needs Review" ? "border-l-4 border-amber-400" : "border-l-4 border-transparent"
                            }`}
                          >
                            <span className="text-sm font-medium text-[#000] dark:text-gray-200">
                              Topic {sub.id} — {sub.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-[#000]">Hours: <span className="font-semibold text-[#000]">{sub.hours}</span></span>
                              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">{sub.level}</span>
                              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                                sub.status === "Approved"
                                  ? "border-green-400 text-green-600"
                                  : "border-amber-400 text-amber-500"
                              }`}>{sub.status}</span>
                              <button className="text-gray-400 hover:text-[#000]">
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              {/* Footer hint */}
              <div className="flex items-center gap-2 bg-color2-l rounded-xl border border-gray-200 px-5 py-3 dark:border-gray-700">
                <Info className="h-4 w-4 shrink-0 text-color2" />
                <span className="text-xs font-medium text-color2">
                  NEURO AI will use these approved syllabus topics to create a Unit → Topic → Subtopics structure.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovedSyllabusTopics;
