import React, { useState } from "react";
import { ChevronDown, ChevronRight, Search, Eye, CheckCircle } from "lucide-react";

export interface LearningMaterialContentSection {
  title: string;
  items?: string[];
}

export interface LearningMaterialExample {
  title: string;
  steps: string[];
}

export interface LearningMaterialReference {
  title: string;
  author: string;
}

export interface LearningMaterialDetails {
  overview?: string;
  learningContent?: LearningMaterialContentSection[];
  example?: LearningMaterialExample;
  exercises?: string[];
  references?: LearningMaterialReference[];
  approvedBy?: string;
  approvedDate?: string;
}

export interface MaterialItem {
  id: string;
  topicCode: string;
  topicTitle: string;
  materialTitle: string;
  versionText?: string;
  approvedDateText?: string;
  fileUrl?: string;
  details?: LearningMaterialDetails;
}

export interface UnitLearningMaterialData {
  id: string;
  unitNumber: number;
  unitCodeText: string;
  title: string;
  materialsCountText: string;
  materials: MaterialItem[];
}

export interface LearningMaterialsCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  units?: UnitLearningMaterialData[];
  onViewMaterial?: (material: MaterialItem) => void;
  className?: string;
}

const DEFAULT_UNITS: UnitLearningMaterialData[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    unitCodeText: "UNIT 1",
    title: "Introduction & Physical Layer",
    materialsCountText: "2 Approved Materials",
    materials: [
      {
        id: "mat-1.3",
        topicCode: "1.3",
        topicTitle: "OSI and TCP/IP Reference Models",
        materialTitle: "OSI and TCP/IP Architecture Notes",
        versionText: "v1.0",
        approvedDateText: "Approved 26 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "26 Aug 2026",
          overview:
            "Introduction to layered network architecture, peer-to-peer communication models, protocol encapsulation hierarchies, and comparison of standard reference models.",
          learningContent: [
            {
              title: "Layered Network Architecture",
              items: [
                "Communication functions are systematically partitioned into discrete horizontal layers to reduce design complexity and promote vendor interoperability.",
                "Each layer provides specific services to the layer directly above it while hiding internal implementation mechanics and hardware dependencies.",
                "Peer entities across communicating network nodes exchange Protocol Data Units (PDUs) conforming to layer-specific protocol rules, with headers prepended during encapsulation.",
              ],
            },
            {
              title: "OSI Reference Model",
              items: [
                "Physical Layer (Layer 1): Transmits unstructured raw bit streams over physical transmission media; governs electrical, optical, and mechanical specifications.",
                "Data Link Layer (Layer 2): Organizes bits into frames, provides physical MAC addressing, flow control, and CRC error detection over single-hop links.",
                "Network Layer (Layer 3): Manages end-to-end packet delivery across intermediate subnet routers using logical IPv4/IPv6 addressing.",
                "Transport Layer (Layer 4): Delivers process-to-process communication, port multiplexing, segmentation, and end-to-end reliability (TCP) or lightweight delivery (UDP).",
                "Session Layer (Layer 5): Establishes, maintains, coordinates, and synchronizes dialogues between communicating applications.",
                "Presentation Layer (Layer 6): Handles data representation, character formatting, TLS cryptographic encryption, and data compression.",
                "Application Layer (Layer 7): Provides direct interface to user network applications including HTTP, DNS, SMTP, and SSH.",
              ],
            },
            {
              title: "TCP/IP Reference Model",
              items: [
                "Network Access Layer: Combines Physical and Data Link functions; interfaces directly with host hardware and physical transmission media.",
                "Internet Layer: Hosts the Internet Protocol (IPv4/IPv6, ICMP, ARP) providing connectionless best-effort packet delivery across internetworks.",
                "Transport Layer: Implements end-to-end transport protocols (TCP for connection-oriented byte streams, UDP for connectionless datagrams).",
                "Application Layer: Combines OSI's top three layers, supporting direct-to-protocol services like DNS, HTTP/HTTPS, FTP, and SMTP.",
              ],
            },
            {
              title: "OSI and TCP/IP Comparison",
              items: [
                "Layer Hierarchy: OSI defines 7 conceptual layers; TCP/IP utilizes 4 practical functional layers.",
                "Design Philosophy: OSI clearly distinguishes between services, interfaces, and protocols; TCP/IP was engineered around actual working protocols.",
                "Network Service Support: OSI supports both connection-oriented and connectionless network services; TCP/IP strictly enforces connectionless IP at the network layer with reliability delegated to the transport layer.",
                "Industry Adoption: TCP/IP is the ubiquitous operational standard powering the global Internet, while OSI serves as the primary pedagogical reference model.",
              ],
            },
          ],
          example: {
            title: "Web Request Layer Encapsulation Trace (Browser to Wire)",
            steps: [
              "Application Layer: Web browser initiates HTTP GET /index.html request (Application Data Payload).",
              "Transport Layer: Appends TCP header with Source Port (e.g., 52140), Destination Port 80/443, and Sequence Numbers (TCP Segment).",
              "Network Layer: Appends IPv4 header with Source IP (192.168.1.50) and Destination IP (93.184.216.34) (IP Packet).",
              "Data Link Layer: Appends Ethernet Header with Source MAC, Default Gateway MAC, and 32-bit CRC trailer (Ethernet Frame).",
              "Physical Layer: Frame is modulated into electrical voltage pulses or optical light signals for transmission onto the physical medium.",
            ],
          },
          exercises: [
            "Compare the OSI and TCP/IP reference models with respect to layering, protocol independence, and practical Internet implementation.",
            "Identify the specific OSI layer responsible for packet routing across heterogeneous networks.",
            "Explain the function of the Transport Layer and contrast TCP connection-oriented delivery with UDP datagram service.",
          ],
          references: [
            {
              title: "Computer Networks",
              author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
            },
            {
              title: "Data Communications and Networking",
              author: "Behrouz A. Forouzan (5th Edition)",
            },
            {
              title: "Computer Networking: A Top-Down Approach",
              author: "James F. Kurose & Keith W. Ross",
            },
          ],
        },
      },
      {
        id: "mat-1.4",
        topicCode: "1.4",
        topicTitle: "Physical Layer and Transmission Media",
        materialTitle: "Transmission Media and Signal Fundamentals",
        versionText: "v1.0",
        approvedDateText: "Approved 26 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "26 Aug 2026",
          overview:
            "Explores physical transmission media, guided copper and fiber optic links, wireless channel propagation characteristics, and digital signal modulation techniques.",
          learningContent: [
            {
              title: "Guided Transmission Media",
              items: [
                "Twisted Pair Cables (UTP/STP Cat 5e/6a): Shielded and unshielded copper pairs used for Ethernet LAN connections.",
                "Coaxial Cables: Broadband transmission with central copper conductor surrounded by insulating layer and braided shield.",
                "Fiber Optic Cables (Single-mode & Multi-mode): High-speed data transmission using total internal reflection of light pulses.",
              ],
            },
            {
              title: "Unguided Wireless Communication",
              items: [
                "Radio Transmission: Omnidirectional wireless waves suitable for cellular and Wi-Fi access points.",
                "Microwave Links: Line-of-sight high-frequency radio links for long-distance point-to-point backhaul.",
                "Infrared & Satellite Communications: Short-range line-of-sight and geostationary orbital transponders.",
              ],
            },
          ],
          example: {
            title: "Optical Fiber Total Internal Reflection & Attenuation Calculation",
            steps: [
              "Core/Cladding Interface: Light enters core with refractive index n1 > n2 cladding.",
              "Critical Angle: Angle of incidence exceeds critical angle θc = arcsin(n2/n1), causing 100% internal reflection.",
              "Attenuation Loss: Signal experiences 0.2 dB/km attenuation at 1550nm wavelength over 50km link.",
            ],
          },
          exercises: [
            "Calculate Nyquist maximum bit rate over a 4kHz bandwidth noiseless channel with 4-level signaling.",
            "Differentiate between single-mode and multi-mode optical fibers.",
            "Explain Manchester encoding clock synchronization advantages over NRZ-L.",
          ],
          references: [
            {
              title: "Computer Networks",
              author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
            },
            {
              title: "Data Communications and Networking",
              author: "Behrouz A. Forouzan (5th Edition)",
            },
          ],
        },
      },
    ],
  },
  {
    id: "unit-2",
    unitNumber: 2,
    unitCodeText: "UNIT 2",
    title: "Data Link Layer & MAC Sublayer",
    materialsCountText: "1 Approved Material",
    materials: [
      {
        id: "mat-2.1",
        topicCode: "2.1",
        topicTitle: "Data Link Layer Design & Framing",
        materialTitle: "Data Link Protocols and Framing Guide",
        versionText: "v1.0",
        approvedDateText: "Approved 27 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "27 Aug 2026",
          overview:
            "Covers data link layer framing techniques, byte and bit stuffing algorithms, CRC polynomial division error detection, and sliding window flow control.",
          learningContent: [
            {
              title: "Framing & Character/Bit Stuffing",
              items: [
                "Byte-Count Framing: Demarcates frames using character count field in frame header.",
                "Byte Stuffing: Inserts ESC escape bytes before payload flag occurrences in character-oriented protocols.",
                "Bit Stuffing: Inserts 0 bit after five consecutive 1 bits in HDLC frame flags (01111110).",
              ],
            },
            {
              title: "Error Detection & Flow Control",
              items: [
                "Cyclic Redundancy Check (CRC-32): Uses modulo-2 polynomial division to generate checksum trailers.",
                "Sliding Window ARQ: Governs sender and receiver window sizes in Stop-and-Wait, Go-Back-N, and Selective Repeat protocols.",
              ],
            },
          ],
          example: {
            title: "CRC-16 Polynomial Division & Frame Trailer Generation",
            steps: [
              "Data Polynomial: Frame data bits D = 1101011011 appended with r=4 zero bits.",
              "Divisor Generator: Generator polynomial G(x) = x^4 + x + 1 (10011).",
              "Modulo-2 Division: XOR division yields 4-bit remainder R = 1110.",
              "Transmitted Frame: Append remainder R to data D yielding frame 11010110111110.",
            ],
          },
          exercises: [
            "Perform bit stuffing on data bit sequence 0111111111110.",
            "Compute CRC remainder for data 1101011011 using generator polynomial G(x) = x^4 + x + 1.",
            "Contrast Go-Back-N and Selective Repeat sender and receiver window sizes.",
          ],
          references: [
            {
              title: "Computer Networks",
              author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
            },
          ],
        },
      },
    ],
  },
  {
    id: "unit-3",
    unitNumber: 3,
    unitCodeText: "UNIT 3",
    title: "Network Layer & Routing",
    materialsCountText: "1 Approved Material",
    materials: [
      {
        id: "mat-3.1",
        topicCode: "3.1",
        topicTitle: "IPv4/IPv6 Addressing & Subnetting",
        materialTitle: "IP Subnetting & CIDR Lecture Slides",
        versionText: "v1.0",
        approvedDateText: "Approved 28 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "28 Aug 2026",
          overview:
            "In-depth study of network layer logical addressing, IPv4 classful vs CIDR subnetting, VLSM allocation algorithms, and IPv6 header structure.",
          learningContent: [
            {
              title: "IPv4 Addressing & CIDR Notation",
              items: [
                "32-bit dotted-decimal IP addresses partitioned into Network ID and Host ID.",
                "Classless Inter-Domain Routing (CIDR) uses variable prefix lengths /24 to /30.",
              ],
            },
            {
              title: "Variable Length Subnet Masking (VLSM)",
              items: [
                "Custom network subnetting based on specific host count requirements per department.",
                "Minimizes wasted IP address space in enterprise router networks.",
              ],
            },
          ],
          example: {
            title: "Enterprise Network VLSM Subnet Breakdown",
            steps: [
              "Base Address: 192.168.10.0/24 subnetted for 4 engineering departments.",
              "Department A (50 hosts): Subnet 192.168.10.0/26 (Host Range: .1 to .62).",
              "Department B (30 hosts): Subnet 192.168.10.64/27 (Host Range: .65 to .94).",
              "Point-to-Point Router Link (2 hosts): Subnet 192.168.10.96/30.",
            ],
          },
          exercises: [
            "Given IP 192.168.10.0/24, design 4 subnets accommodating 50, 30, 10, and 10 hosts.",
            "Identify network ID, broadcast address, and usable host range for 172.16.45.100/20.",
          ],
          references: [
            {
              title: "Computer Networking: A Top-Down Approach",
              author: "James F. Kurose & Keith W. Ross",
            },
          ],
        },
      },
    ],
  },
  {
    id: "unit-4",
    unitNumber: 4,
    unitCodeText: "UNIT 4",
    title: "Transport Layer Protocols",
    materialsCountText: "1 Approved Material",
    materials: [
      {
        id: "mat-4.1",
        topicCode: "4.1",
        topicTitle: "TCP Connection Management & Flow Control",
        materialTitle: "TCP Flow & Congestion Control Lab Manual",
        versionText: "v1.0",
        approvedDateText: "Approved 29 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "29 Aug 2026",
          overview:
            "Hands-on guide for Wireshark TCP 3-way handshake packet analysis, Reno/Tahoe congestion control algorithms, and window scaling.",
          learningContent: [
            {
              title: "TCP Connection Establishment & Teardown",
              items: [
                "3-Way Handshake: SYN -> SYN-ACK -> ACK establishes sequence numbers and socket buffers.",
                "Connection Teardown: 4-way FIN exchange gracefully terminates bidirectional stream.",
              ],
            },
            {
              title: "Congestion Control Algorithms",
              items: [
                "Slow Start: Congestion window (cwnd) doubles every RTT until ssthresh.",
                "Congestion Avoidance: Linear cwnd increase by 1 MSS per RTT.",
                "Fast Retransmit & Recovery: Triggered upon 3 duplicate ACKs without waiting for timeout.",
              ],
            },
          ],
          example: {
            title: "Wireshark Packet Trace of TCP 3-Way Handshake",
            steps: [
              "Packet 1: Client -> Server [SYN] Seq=0 Win=64240 MSS=1460.",
              "Packet 2: Server -> Client [SYN, ACK] Seq=0 Ack=1 Win=65535 MSS=1460.",
              "Packet 3: Client -> Server [ACK] Seq=1 Ack=1 Win=64240.",
            ],
          },
          exercises: [
            "Trace Congestion Window (cwnd) evolution during Slow Start and Fast Recovery across 10 RTTs.",
            "Differentiate TCP flow control (Receiver Window) from congestion control (Congestion Window).",
          ],
          references: [
            {
              title: "TCP/IP Illustrated, Vol. 1",
              author: "W. Richard Stevens",
            },
          ],
        },
      },
    ],
  },
  {
    id: "unit-5",
    unitNumber: 5,
    unitCodeText: "UNIT 5",
    title: "Application Layer",
    materialsCountText: "1 Approved Material",
    materials: [
      {
        id: "mat-5.1",
        topicCode: "5.1",
        topicTitle: "Application Protocols",
        materialTitle: "DNS, HTTP/HTTPS Protocol Specifications",
        versionText: "v1.0",
        approvedDateText: "Approved 30 Aug 2026",
        details: {
          approvedBy: "Dr. Arun Kumar",
          approvedDate: "30 Aug 2026",
          overview:
            "Examines client-server and P2P architectures, DNS domain resolution hierarchy, HTTP 1.1/2/3 request-response mechanics, and TLS encryption.",
          learningContent: [
            {
              title: "Domain Name System (DNS) Architecture",
              items: [
                "Distributed hierarchical database: Root DNS -> TLD DNS -> Authoritative DNS.",
                "Recursive vs Iterative name resolution mechanics.",
              ],
            },
            {
              title: "HTTP/HTTPS Operations",
              items: [
                "HTTP Methods: GET, POST, PUT, DELETE, HEAD.",
                "TLS 1.3 Handshake: Symmetric session key exchange via Diffie-Hellman.",
              ],
            },
          ],
          example: {
            title: "Browser HTTP GET Request & Packet Exchange Trace",
            steps: [
              "DNS Lookup: Browser queries local resolver for www.example.com IP.",
              "TCP Connect: 3-way handshake established on port 443.",
              "TLS Handshake: Key exchange and certificate validation.",
              "HTTP GET: Request Sent -> Server responds with 200 OK + HTML payload.",
            ],
          },
          exercises: [
            "Draw the step-by-step iterative DNS lookup sequence for www.example.com.",
            "Explain HTTP/2 multiplexing and how it solves head-of-line blocking in HTTP/1.1.",
          ],
          references: [
            {
              title: "HTTP: The Definitive Guide",
              author: "David Gourley & Brian Totty",
            },
          ],
        },
      },
    ],
  },
];

const FALLBACK_DETAILS: LearningMaterialDetails = {
  approvedBy: "Dr. Arun Kumar",
  approvedDate: "26 Aug 2026",
  overview:
    "Comprehensive study guide and approved lecture material covering fundamental principles, protocol mechanics, practical examples, and revision exercises.",
  learningContent: [
    {
      title: "Core Concepts & Fundamentals",
      items: [
        "Detailed analysis of underlying protocol mechanisms and system specifications.",
        "Engineering design principles and architectural trade-offs.",
      ],
    },
  ],
  example: {
    title: "Practical System Trace & Walkthrough",
    steps: [
      "Step 1: System initialization and environment configuration.",
      "Step 2: Execution trace and signal processing.",
      "Step 3: Verification and output logging.",
    ],
  },
  exercises: [
    "Explain the primary objectives and operational principles of this topic.",
    "Solve the analytical practice problems for this module.",
  ],
  references: [
    {
      title: "Computer Networks",
      author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
    },
  ],
};

const LearningMaterialsCard: React.FC<LearningMaterialsCardProps> = ({
  title = "LEARNING MATERIALS OF TOPICS",
  subtitle = "Approved lecture slides, notes and reference study guides.",
  headerStatsText = "5 Units • 6 Approved Materials",
  units = DEFAULT_UNITS,
  onViewMaterial,
  className = "",
}) => {
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({
    "unit-1": true,
  });
  const [openMaterials, setOpenMaterials] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleUnit = (id: string) => {
    setOpenUnits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMaterial = (id: string, mat: MaterialItem) => {
    setOpenMaterials((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    onViewMaterial?.(mat);
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

      const matchingMaterials = unit.materials.filter((mat) => {
        return (
          mat.topicTitle.toLowerCase().includes(q) ||
          mat.topicCode.toLowerCase().includes(q) ||
          mat.materialTitle.toLowerCase().includes(q)
        );
      });

      if (unitMatches || matchingMaterials.length > 0) {
        return {
          ...unit,
          materials: unitMatches ? unit.materials : matchingMaterials,
        };
      }
      return null;
    })
    .filter(Boolean) as UnitLearningMaterialData[];

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
                    <span className="text-[#000] dark:text-white font-bold truncate">
                      {unit.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0">
                  <span className="text-color2 font-bold">
                    {unit.materialsCountText}
                  </span>
                </div>
              </button>

              {/* Expanded Unit Content */}
              {isOpen && (
                <div className="space-y-3 p-3">
                  {unit.materials.map((mat) => {
                    const isMatOpen = Boolean(openMaterials[mat.id]);
                    const details = mat.details || FALLBACK_DETAILS;

                    if (isMatOpen) {
                      return (
                        <div
                          key={mat.id}
                          className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-5"
                        >
                          {/* Expanded Top Header */}
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 text-xs font-bold text-color2">
                                <span className="font-bold text-color2 text-sm">{mat.topicCode}</span>
                                <span>•</span>
                                <span className="font-bold text-color2 text-sm">{mat.topicTitle}</span>
                              </div>
                              <h3 className="mt-1 text-lg sm:text-xl font-bold text-[#1e1b4b] dark:text-white leading-snug">
                                {mat.materialTitle}
                              </h3>
                              <p className="mt-1 text-sm text-pri dark:text-pri">
                                {mat.versionText || "v1.0"} • {mat.approvedDateText || "Approved 26 Aug 2026"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleMaterial(mat.id, mat)}
                              className="rounded-full bg-[#7c3aed] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-purple-700 transition-colors shrink-0"
                            >
                              Hide Material
                            </button>
                          </div>

                          {/* Purple Banner Box */}
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-[#fbf9ff] p-3.5 text-xs font-medium dark:border-purple-950 dark:bg-purple-950/20">
                            <div className="flex items-center gap-2 text-color2 font-bold">
                              <CheckCircle className="h-4 w-4 shrink-0 font-bold" />
                              <span className="font-bold text-pri text-md">
                                Topic: {mat.topicCode} {mat.topicTitle}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="">{mat.versionText || "v1.0"}</span>
                            </div>

                            <div className="flex items-center gap-4 text-pri dark:text-gray-400">
                              <span>
                                Approved by:{" "}
                                <strong className="text-[#000] dark:text-gray-200 font-bold">
                                  {details.approvedBy || "Dr. Arun Kumar"}
                                </strong>
                              </span>
                              <span className="text-pri">
                                Approved on:{" "}
                                <strong className="text-[#000] dark:text-gray-200 font-bold">
                                  {details.approvedDate || "26 Aug 2026"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          {/* OVERVIEW Section */}
                          {details.overview && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-color2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                <span className="text-color2 font-bold text-sm">OVERVIEW</span>
                              </div>
                              <p className="text-xs sm:text-sm text-[#000] dark:text-gray-300 leading-relaxed">
                                {details.overview}
                              </p>
                            </div>
                          )}

                          {/* LEARNING CONTENT Section */}
                          {details.learningContent &&
                            details.learningContent.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-color2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                  <span className="text-color2 font-bold text-sm">LEARNING CONTENT</span>
                                </div>

                                <div className="space-y-4 pl-1">
                                  {details.learningContent.map(
                                    (section, idx) => (
                                      <div key={idx} className="space-y-2">
                                        <h5 className="text-sm font-bold text-[#1e1b4b] dark:text-white">
                                          {idx + 1}. {section.title}
                                        </h5>
                                        {section.items && (
                                          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#000] dark:text-gray-300 leading-relaxed">
                                            {section.items.map(
                                              (item, itemIdx) => (
                                                <li key={itemIdx}>{item}</li>
                                              )
                                            )}
                                          </ul>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* EXAMPLE Section */}
                          {details.example && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-color2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                <span className="text-color2 font-bold text-sm">EXAMPLE</span>
                              </div>

                              <div className="rounded-2xl border border-purple-100/80 bg-[#fbfbfe] p-4.5 sm:p-5 dark:border-gray-800 dark:bg-gray-800/50 space-y-3">
                                <h5 className="text-xs sm:text-sm font-bold text-color2">
                                  {details.example.title}
                                </h5>
                                <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-[#000] dark:text-gray-300 leading-relaxed">
                                  {details.example.steps.map(
                                    (step, stepIdx) => (
                                      <li key={stepIdx}>{step}</li>
                                    )
                                  )}
                                </ol>
                              </div>
                            </div>
                          )}

                          {/* EXERCISES Section */}
                          {details.exercises &&
                            details.exercises.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-color2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                  <span className="text-color2 font-bold text-sm">EXERCISES</span>
                                </div>

                                <div className="rounded-2xl border border-gray-200/90 bg-white p-4.5 sm:p-5 dark:border-gray-800 dark:bg-gray-800/40">
                                  <ol className="list-decimal pl-5 space-y-2.5 text-xs sm:text-sm text-[#000] dark:text-gray-300 leading-relaxed">
                                    {details.exercises.map((ex, exIdx) => (
                                      <li key={exIdx}>{ex}</li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}

                          {/* REFERENCES Section */}
                          {details.references &&
                            details.references.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-color2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
                                  <span className="text-color2 font-bold text-sm">REFERENCES</span>
                                </div>

                                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#000] dark:text-gray-300">
                                  {details.references.map(
                                    (ref, refIdx) => (
                                      <li key={refIdx}>
                                        <strong className="text-[#000] dark:text-white font-bold">
                                          {ref.title}:
                                        </strong>{" "}
                                        <span>{ref.author}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={mat.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200/90 bg-white p-4 dark:border-gray-800 dark:bg-gray-800/40 shadow-2xs"
                      >
                        {/* Left side: Topic Code Badge + Topic Title + Material Title */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-pri dark:text-gray-400">
                            <span className="rounded-md bg-[#f5f3ff] px-2 py-0.5 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                              {mat.topicCode}
                            </span>
                            <span className="truncate">{mat.topicTitle}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-[#1e1b4b] dark:text-white truncate">
                            {mat.materialTitle}
                          </h4>
                        </div>

                        {/* Right side: Version + Approved Date + View Material Button */}
                        <div className="flex flex-wrap items-center gap-4 shrink-0">
                          <div className="text-xs font-medium text-pri dark:text-pri">
                            {mat.versionText || "v1.0"} • {mat.approvedDateText || "Approved 26 Aug 2026"}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMaterial(mat.id, mat)}
                            className="flex items-center gap-1.5 rounded-xl border border-[#7c3aed] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-color2 hover:bg-purple-50 transition-colors dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-950/40"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Material</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningMaterialsCard;
