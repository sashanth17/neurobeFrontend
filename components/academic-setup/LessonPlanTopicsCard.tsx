import React, { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export interface LessonPlanTopicItem {
  code: string;
  title: string;
  description?: string;
  bloomLevel: string;
  hoursText: string;
  pedagogy: string[];
  textbook?: string;
  referenceBook?: string;
}

export interface LessonPlanUnitData {
  id: string;
  unitNumber: number;
  unitCodeText: string;
  title: string;
  hoursText: string;
  topicsCountText: string;
  topics: LessonPlanTopicItem[];
}

export interface LessonPlanTopicsCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  units?: LessonPlanUnitData[];
  className?: string;
}

const DEFAULT_UNITS: LessonPlanUnitData[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    unitCodeText: "Unit 1",
    title: "Introduction & Physical Layer",
    hoursText: "9 Hours",
    topicsCountText: "4 Main Topics",
    topics: [
      {
        code: "1.1",
        title: "Fundamentals of Computer Networks",
        bloomLevel: "K2",
        hoursText: "2 Hours",
        pedagogy: ["Lecture", "Concept Mapping", "Group Discussion"],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Data Communications and Networking — Forouzan",
      },
      {
        code: "1.2",
        title: "Network Architecture and Layered Communication",
        bloomLevel: "K2",
        hoursText: "2 Hours",
        pedagogy: [
          "Interactive Lecture",
          "Concept Mapping",
          "Comparative Discussion",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Data Communications and Networking — Forouzan",
      },
      {
        code: "1.3",
        title: "OSI and TCP/IP Reference Models",
        bloomLevel: "K2",
        hoursText: "3 Hours",
        pedagogy: [
          "Diagrammatic Walkthrough",
          "Comparative Analysis",
          "Peer Instruction",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Internetworking with TCP/IP — Douglas Comer",
      },
      {
        code: "1.4",
        title: "Physical Layer and Transmission Media",
        bloomLevel: "K2",
        hoursText: "2 Hours",
        pedagogy: ["Demonstration", "Lecture", "Discussion"],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Data Communications and Networking — Forouzan",
      },
    ],
  },
  {
    id: "unit-2",
    unitNumber: 2,
    unitCodeText: "Unit 2",
    title: "Data Link Layer & MAC Sublayer",
    hoursText: "9 Hours",
    topicsCountText: "4 Main Topics",
    topics: [
      {
        code: "2.1",
        title: "Data Link Layer Design & Framing",
        bloomLevel: "K3",
        hoursText: "2 Hours",
        pedagogy: [
          "Interactive Lecture",
          "Problem Solving",
          "Simulation Lab",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Data Communications and Networking — Forouzan",
      },
      {
        code: "2.2",
        title: "Medium Access Control & Ethernet",
        bloomLevel: "K3",
        hoursText: "3 Hours",
        pedagogy: [
          "Case Study",
          "Group Discussion",
          "Protocol Animation",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "IEEE 802.3 Standard Documents",
      },
    ],
  },
  {
    id: "unit-3",
    unitNumber: 3,
    unitCodeText: "Unit 3",
    title: "Network Layer & Routing",
    hoursText: "9 Hours",
    topicsCountText: "4 Main Topics",
    topics: [
      {
        code: "3.1",
        title: "IPv4/IPv6 Addressing & Subnetting",
        bloomLevel: "K3",
        hoursText: "3 Hours",
        pedagogy: [
          "Subnet Workshop",
          "Interactive Quiz",
          "Guided Problem Solving",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "TCP/IP Illustrated, Vol. 1 — W. Richard Stevens",
      },
      {
        code: "3.2",
        title: "Routing Algorithms & Protocols",
        bloomLevel: "K4",
        hoursText: "4 Hours",
        pedagogy: [
          "Algorithm Walkthrough",
          "Packet Tracer Demo",
          "Comparative Analysis",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "Routing TCP/IP, Vol. 1 — Jeff Doyle",
      },
    ],
  },
  {
    id: "unit-4",
    unitNumber: 4,
    unitCodeText: "Unit 4",
    title: "Transport Layer Protocols",
    hoursText: "9 Hours",
    topicsCountText: "4 Main Topics",
    topics: [
      {
        code: "4.1",
        title: "TCP Connection Management & Flow Control",
        bloomLevel: "K3",
        hoursText: "4 Hours",
        pedagogy: [
          "Wireshark Lab",
          "Interactive Lecture",
          "Handshake Role Play",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "TCP/IP Illustrated, Vol. 1 — W. Richard Stevens",
      },
      {
        code: "4.2",
        title: "UDP & Socket Programming",
        bloomLevel: "K3",
        hoursText: "3 Hours",
        pedagogy: [
          "Live Coding Demo",
          "Peer Code Review",
          "Lab Assignment",
        ],
        textbook: "Unix Network Programming — W. Richard Stevens",
        referenceBook: "Computer Networks — Tanenbaum & Wetherall",
      },
    ],
  },
  {
    id: "unit-5",
    unitNumber: 5,
    unitCodeText: "Unit 5",
    title: "Application Layer",
    hoursText: "9 Hours",
    topicsCountText: "4 Main Topics",
    topics: [
      {
        code: "5.1",
        title: "Application Protocols",
        bloomLevel: "K2",
        hoursText: "4 Hours",
        pedagogy: [
          "Protocol Inspection",
          "Concept Mapping",
          "Interactive Lecture",
        ],
        textbook: "Computer Networks — Tanenbaum & Wetherall",
        referenceBook: "HTTP: The Definitive Guide — David Gourley",
      },
      {
        code: "5.2",
        title: "Network Management & Security",
        bloomLevel: "K3",
        hoursText: "4 Hours",
        pedagogy: [
          "Security Case Study",
          "Demonstration",
          "Group Discussion",
        ],
        textbook: "Cryptography and Network Security — William Stallings",
        referenceBook: "Computer Networks — Tanenbaum & Wetherall",
      },
    ],
  },
];

const LessonPlanTopicsCard: React.FC<LessonPlanTopicsCardProps> = ({
  title = "LESSON PLAN OF TOPICS",
  subtitle = "Prescribed teaching methods, textbooks and reference books for each topic.",
  headerStatsText = "5 Units • 20 Main Topics",
  units = DEFAULT_UNITS,
  className = "",
}) => {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUnit = (id: string) => {
    setOpenUnits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allOpened: Record<string, boolean> = {};
    units.forEach((u) => {
      allOpened[u.id] = true;
    });
    setOpenUnits(allOpened);
  };

  const handleCollapseAll = () => {
    setOpenUnits({});
  };

  const filteredUnits = units
    .map((unit) => {
      if (!searchQuery.trim()) return unit;
      const q = searchQuery.toLowerCase();
      const unitMatches =
        unit.title.toLowerCase().includes(q) ||
        unit.unitCodeText.toLowerCase().includes(q);

      const matchingTopics = unit.topics.filter((topic) => {
        const topicMatches =
          topic.title.toLowerCase().includes(q) ||
          topic.code.toLowerCase().includes(q) ||
          topic.bloomLevel.toLowerCase().includes(q) ||
          (topic.description && topic.description.toLowerCase().includes(q)) ||
          (topic.textbook && topic.textbook.toLowerCase().includes(q)) ||
          (topic.referenceBook && topic.referenceBook.toLowerCase().includes(q));
        const approachMatches = topic.pedagogy?.some((app) =>
          app.toLowerCase().includes(q)
        );
        return topicMatches || approachMatches;
      });

      if (unitMatches || matchingTopics.length > 0) {
        return {
          ...unit,
          topics: unitMatches ? unit.topics : matchingTopics,
        };
      }
      return null;
    })
    .filter(Boolean) as LessonPlanUnitData[];

  return (
    <div className={`space-y-4 ${className} panel p-5`}>
      {/* Top Heading Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed] shrink-0" />
            <span className="font-bold text-[#1e1b4b] dark:text-white">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-pri dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {headerStatsText && (
          <span className="text-xs sm:text-sm font-bold text-[#1e1b4b] dark:text-white shrink-0">
            {headerStatsText}
          </span>
        )}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1 px-1">
        <div className="relative flex items-center w-64 sm:w-72">
          <Search className="absolute left-3.5 h-4 w-4 text-[#000] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm rounded-xl border border-gray-200/90 bg-white shadow-2xs outline-none transition-all focus:border-[#7c3aed] dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center font-bold gap-2 text-xs sm:text-sm shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-pri hover:text-color2 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-300 dark:text-[#000]">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="text-color2 font-bold hover:underline transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion Units List */}
      <div className="space-y-3">
        {filteredUnits.map((unit) => {
          const isOpen = Boolean(openUnits[unit.id] || searchQuery.trim());
          return (
            <div
              key={unit.id}
              className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden transition-all"
            >
              {/* Unit Accordion Bar */}
              <button
                type="button"
                onClick={() => toggleUnit(unit.id)}
                className={`w-full flex items-center justify-between gap-4 p-4 sm:px-5 text-left outline-none transition-colors ${isOpen
                    ? "bg-[#fcfaff] border-b border-gray-100 dark:bg-purple-950/20 dark:border-gray-800"
                    : "hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-color2 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#000] shrink-0" />
                  )}

                  <div className="flex items-center gap-3 text-sm sm:text-base font-bold truncate">
                    <span className="text-color2 font-bold shrink-0">
                      {unit.unitCodeText}
                    </span>
                    <span className="text-gray-200 dark:text-[#000] shrink-0">
                      |
                    </span>
                    <span className="text-[#000] dark:text-white font-bold truncate">
                      {unit.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0">
                  <span className="text-pri font-medium">{unit.hoursText}</span>
                  <span className="text-pri dark:text-[#000]">•</span>
                  <span className="text-color2">{unit.topicsCountText}</span>
                </div>
              </button>

              {/* Expanded Unit Content */}
              {isOpen && (
                <div className="space-y-3 p-2">
                  {unit.topics.map((topic) => (
                    <div
                      key={topic.code}
                      className="rounded-2xl border border-gray-300 bg-white p-4.5 sm:p-5 dark:border-gray-800 dark:bg-gray-800/40 shadow-2xs space-y-3"
                    >
                      {/* Main Topic Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                            {topic.code}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-[#000] dark:text-white leading-snug">
                            {topic.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-[#000] dark:bg-gray-800 dark:text-gray-300">
                            {topic.hoursText}
                          </span>
                          <span className="rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                            {topic.bloomLevel.startsWith("Knowledge")
                              ? topic.bloomLevel
                              : `Knowledge Level: ${topic.bloomLevel}`}
                          </span>
                        </div>
                      </div>

                      {/* PEDAGOGY section */}
                      {topic.pedagogy && topic.pedagogy.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1.5">
                            PEDAGOGY
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {topic.pedagogy.map((method, idx) => (
                              <span
                                key={idx}
                                className="rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:bg-gray-800 dark:text-gray-200"
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TEXTBOOK & REFERENCE BOOK section */}
                      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topic.textbook && (
                          <div>
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1">
                              TEXTBOOK
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-[#1e1b4b] dark:text-white leading-snug">
                              {topic.textbook}
                            </p>
                          </div>
                        )}

                        {topic.referenceBook && (
                          <div>
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-pri dark:text-gray-400 mb-1">
                              REFERENCE BOOK
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-[#1e1b4b] dark:text-white leading-snug">
                              {topic.referenceBook}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonPlanTopicsCard;
