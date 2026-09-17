import React, { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export interface SubtopicData {
  code: string;
  title: string;
}

export interface MainTopicData {
  code: string;
  title: string;
  description?: string;
  hoursText: string;
  levelText: string;
  subtopics?: SubtopicData[];
}

export interface UnitTopicData {
  id: string;
  unitNumber: number;
  unitCodeText: string;
  title: string;
  hoursText: string;
  topicsCountText: string;
  topics: MainTopicData[];
}

export interface CourseTopicsCardProps {
  units?: UnitTopicData[];
  className?: string;
}

const DEFAULT_UNITS: UnitTopicData[] = [
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
        description:
          "Introduces basic data communication concepts, network purpose, components and network classifications.",
        hoursText: "2 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "1.1.1", title: "Data Communication and Network Fundamentals" },
          { code: "1.1.2", title: "Network Components and Communication Links" },
          { code: "1.1.3", title: "LAN, MAN and WAN Concepts" },
        ],
      },
      {
        code: "1.2",
        title: "Network Architecture and Layered Communication",
        description:
          "Explains layered architecture, network services, protocols and interfaces used for structured communication.",
        hoursText: "2 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "1.2.1", title: "Layered Network Architecture" },
          { code: "1.2.2", title: "Protocols, Services and Interfaces" },
          { code: "1.2.3", title: "Benefits of Layered Communication" },
        ],
      },
      {
        code: "1.3",
        title: "OSI and TCP/IP Reference Models",
        description:
          "Studies standard reference models and functions of networking layers.",
        hoursText: "3 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "1.3.1", title: "OSI Reference Model and Layer Functions" },
          { code: "1.3.2", title: "TCP/IP Reference Model and Protocol Suite" },
          { code: "1.3.3", title: "Comparison of OSI and TCP/IP Models" },
        ],
      },
      {
        code: "1.4",
        title: "Physical Layer and Transmission Media",
        description:
          "Covers physical transmission concepts and communication media used in computer networks.",
        hoursText: "2 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "1.4.1", title: "Signals and Data Transmission Fundamentals" },
          { code: "1.4.2", title: "Guided Transmission Media" },
          { code: "1.4.3", title: "Unguided Transmission Media" },
        ],
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
        description:
          "Examines framing, error detection mechanisms, and sliding window flow control protocols.",
        hoursText: "2 Hours",
        levelText: "Knowledge Level: K3",
        subtopics: [
          { code: "2.1.1", title: "Framing Methods & Character/Bit Stuffing" },
          { code: "2.1.2", title: "CRC & Checksum Error Control Algorithms" },
          {
            code: "2.1.3",
            title:
              "Sliding Window Protocols (Stop-and-Wait, Go-Back-N, Selective Repeat)",
          },
        ],
      },
      {
        code: "2.2",
        title: "Medium Access Control & Ethernet",
        description:
          "Covers random access protocols, collision handling, and Ethernet standards.",
        hoursText: "3 Hours",
        levelText: "Knowledge Level: K3",
        subtopics: [
          { code: "2.2.1", title: "ALOHA and CSMA/CD Protocol Mechanics" },
          { code: "2.2.2", title: "Binary Exponential Backoff Algorithm" },
          { code: "2.2.3", title: "IEEE 802.3 Frame Format and Fast/Gigabit Ethernet" },
        ],
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
        description: "IP addressing structures, VLSM, CIDR, and IPv6 transition.",
        hoursText: "3 Hours",
        levelText: "Knowledge Level: K3",
        subtopics: [
          { code: "3.1.1", title: "Classful vs Classless Inter-Domain Routing (CIDR)" },
          { code: "3.1.2", title: "Variable Length Subnet Masking (VLSM)" },
        ],
      },
      {
        code: "3.2",
        title: "Routing Algorithms & Protocols",
        description: "Distance Vector, Link State, RIP, OSPF, and BGP protocols.",
        hoursText: "4 Hours",
        levelText: "Knowledge Level: K4",
        subtopics: [
          { code: "3.2.1", title: "Distance Vector vs Link State Routing" },
          { code: "3.2.2", title: "RIP, OSPF and BGP Operation Mechanics" },
        ],
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
        description: "TCP three-way handshake, sliding window, and congestion control.",
        hoursText: "4 Hours",
        levelText: "Knowledge Level: K3",
        subtopics: [
          { code: "4.1.1", title: "Three-Way Handshake & Connection Termination" },
          { code: "4.1.2", title: "TCP Sliding Window & Congestion Control" },
        ],
      },
      {
        code: "4.2",
        title: "UDP & Socket Programming",
        description: "UDP datagram communication and socket programming basics.",
        hoursText: "3 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "4.2.1", title: "Connectionless UDP Transmission" },
          { code: "4.2.2", title: "Socket API Fundamentals" },
        ],
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
        description: "DNS resolution, HTTP/HTTPS operations, and email protocols.",
        hoursText: "4 Hours",
        levelText: "Knowledge Level: K2",
        subtopics: [
          { code: "5.1.1", title: "Domain Name System (DNS) Architecture" },
          { code: "5.1.2", title: "HTTP/HTTPS Request-Response Mechanics" },
        ],
      },
      {
        code: "5.2",
        title: "Network Management & Security",
        description: "Encryption basics, firewalls, and VPN technologies.",
        hoursText: "4 Hours",
        levelText: "Knowledge Level: K3",
        subtopics: [
          { code: "5.2.1", title: "Symmetric & Asymmetric Encryption Overview" },
          { code: "5.2.2", title: "Firewalls and Virtual Private Networks (VPN)" },
        ],
      },
    ],
  },
];

const CourseTopicsCard: React.FC<CourseTopicsCardProps> = ({
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
          (topic.description && topic.description.toLowerCase().includes(q));
        const subMatches = topic.subtopics?.some(
          (sub) =>
            sub.title.toLowerCase().includes(q) ||
            sub.code.toLowerCase().includes(q)
        );
        return topicMatches || subMatches;
      });

      if (unitMatches || matchingTopics.length > 0) {
        return {
          ...unit,
          topics: unitMatches ? unit.topics : matchingTopics,
        };
      }
      return null;
    })
    .filter(Boolean) as UnitTopicData[];

  return (
    <div className={`space-y-4 ${className} panel p-5`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-1 px-1">
        {/* Left Stats Bar */}
        <div className="flex items-center gap-2 text-sm font-bold text-[#1e1b4b] dark:text-white">
          <span >5 Units</span>
          <span className="text-gray-300 dark:text-[#000]">•</span>
          <span className="text-color2 font-bold">20 Main Topics</span>
          <span className="text-gray-300 dark:text-[#000]">•</span>
          <span>70 Child Topics</span>
        </div>

        {/* Right Search + Expand/Collapse */}
        <div className="flex items-center gap-4">
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
                <div className=" space-y-3 p-2">
                  {unit.topics.map((topic) => (
                    <div
                      key={topic.code}
                      className="rounded-2xl border border-gray-300 bg-white p-4.5 sm:p-5 dark:border-gray-800 dark:bg-gray-800/40 shadow-2xs"
                    >
                      {/* Main Topic Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                            {topic.code}
                          </span>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-[#000] dark:text-white leading-snug">
                              {topic.title}
                            </h4>
                            {topic.description && (
                              <p className="mt-1.5 text-xs sm:text-sm text-pri dark:text-gray-400 leading-relaxed">
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-[#000] dark:bg-gray-800 dark:text-gray-300">
                            {topic.hoursText}
                          </span>
                          <span className="rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                            {topic.levelText}
                          </span>
                        </div>
                      </div>

                      {/* Subtopics List */}
                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-gray-100/80 dark:border-gray-800 space-y-2.5">
                          {topic.subtopics.map((sub) => (
                            <div
                              key={sub.code}
                              className="flex items-center gap-3 pl-2 text-xs sm:text-sm text-[#000] dark:text-gray-300"
                            >
                              <svg
                                className="h-3.5 w-3.5 text-pri dark:text-[#000] shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5v6a2 2 0 002 2h6"
                                />
                              </svg>
                              <span className="font-bold text-[#000] dark:text-gray-200 min-w-[36px]">
                                {sub.code}
                              </span>
                              <span className="font-medium text-[#000] dark:text-gray-300">
                                {sub.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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

export default CourseTopicsCard;
