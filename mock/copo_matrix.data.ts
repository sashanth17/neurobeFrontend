export interface ProgramOutcome {
  code: string;
  title: string;
  description: string;
}

export interface CourseOutcome {
  id: number;
  co_code: string;
  bloom_level: string;
  description: string;
}

export interface MappingCell {
  correlation_level: number;
  strength_label: string;
  is_ai_suggested: boolean;
  justification: string | null;
  status: string;
  mapping_id: number | null;
}

export interface COPOMatrixResponse {
  syllabus_id: number;
  course_id: number;
  po_version: string;
  mapping_status: string;
  summary: {
    course_outcomes_count: number;
    program_outcomes_count: number;
    ai_suggestions_count: number;
    mappings_need_review_count: number;
  };
  program_outcomes: ProgramOutcome[];
  course_outcomes: CourseOutcome[];
  matrix: Record<string, Record<string, MappingCell>>;
}

export const DEFAULT_COPO_MATRIX: COPOMatrixResponse = {
  syllabus_id: 1,
  course_id: 59,
  po_version: "PO 2025 v1",
  mapping_status: "Review Required",
  summary: {
    course_outcomes_count: 6,
    program_outcomes_count: 12,
    ai_suggestions_count: 56,
    mappings_need_review_count: 56,
  },
  program_outcomes: [
    {
      code: "PO1",
      title: "Engineering Knowledge",
      description:
        "Apply the knowledge of mathematics, natural science, computing, and engineering fundamentals to the solution of complex engineering problems.",
    },
    {
      code: "PO2",
      title: "Problem Analysis",
      description:
        "Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions.",
    },
    {
      code: "PO3",
      title: "Design/Development of Solutions",
      description:
        "Design creative solutions for complex engineering problems and design system components or processes that meet specified needs with consideration for public health, safety, cultural, societal, and environmental factors.",
    },
    {
      code: "PO4",
      title: "Conduct Investigations of Complex Problems",
      description:
        "Conduct investigations of complex engineering problems using research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of information to provide valid conclusions.",
    },
    {
      code: "PO5",
      title: "Modern Tool Usage",
      description:
        "Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools, including prediction and modeling to complex engineering activities.",
    },
    {
      code: "PO6",
      title: "The Engineer and Society",
      description:
        "Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural issues and consequent responsibilities relevant to professional engineering practice.",
    },
    {
      code: "PO7",
      title: "Environment and Sustainability",
      description:
        "Understand the impact of professional engineering solutions in societal and environmental contexts and demonstrate knowledge of and need for sustainable development.",
    },
    {
      code: "PO8",
      title: "Ethics",
      description:
        "Apply ethical principles and commit to professional ethics, responsibilities, and norms of engineering practice.",
    },
    {
      code: "PO9",
      title: "Individual and Team Work",
      description:
        "Function effectively as an individual, and as a member or leader in diverse and multidisciplinary teams.",
    },
    {
      code: "PO10",
      title: "Communication",
      description:
        "Communicate effectively and inclusively within the engineering community and with society at large, comprehending and writing effective reports, design documentation, and making effective presentations.",
    },
    {
      code: "PO11",
      title: "Project Management and Finance",
      description:
        "Demonstrate knowledge and understanding of engineering management principles and economic decision-making and apply these to manage projects in multidisciplinary environments.",
    },
    {
      code: "PO12",
      title: "Life-Long Learning",
      description:
        "Recognize the need for, and have the preparation and ability to engage in independent and lifelong learning in the broadest context of technological change.",
    },
  ],
  course_outcomes: [
    {
      id: 1,
      co_code: "CO1",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO1",
    },
    {
      id: 2,
      co_code: "CO2",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO2",
    },
    {
      id: 3,
      co_code: "CO3",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO3",
    },
    {
      id: 4,
      co_code: "CO4",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO4",
    },
    {
      id: 5,
      co_code: "CO5",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO5",
    },
    {
      id: 6,
      co_code: "CO6",
      bloom_level: "K3: Apply",
      description: "Outcome statement for CO6",
    },
  ],
  matrix: {
    CO1: {
      PO1: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Direct application of foundational computing and engineering principles to understand physical transmission and layered abstractions.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Formulate and analyze protocol architectures and performance trade-offs across network layers.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Assists in conceptual network topology design and architectural modularization.",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Basic empirical investigation through packet capture and physical link diagnostic exercises.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Use modern network protocol analyzers like Wireshark to observe frame encodings and packet handshakes.",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Document protocol stack interactions and present layered network diagrams.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Fundamental understanding of OSI/TCP-IP models enables lifelong learning of evolving network standards.",
        status: "suggested",
        mapping_id: null,
      },
    },
    CO2: {
      PO1: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Application of mathematical algorithms (CRC, Hamming code, parity) and engineering principles for reliable framing.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Formulation and mathematical analysis of collision domains, channel utilization, and error detection efficiencies.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Design framing mechanisms and MAC protocol parameters for shared communication channels.",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Experimental testing and simulations of CSMA/CD, CSMA/CA throughput under varying network traffic.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Use network simulation tools (e.g. Cisco Packet Tracer, NS-3) to simulate data link layer operations.",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Collaborative lab exercises conducting frame analysis and collision rate measurement.",
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Technical lab reporting on framing overhead and protocol efficiency metrics.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Provides foundation for emerging wireless standards (Wi-Fi 7, 5G NR MAC) and lifelong adaptability.",
        status: "suggested",
        mapping_id: null,
      },
    },
    CO3: {
      PO1: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Deep engineering knowledge of binary mathematics, subnet masks, hierarchical addressing, and shortest path graph algorithms.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Rigorous problem analysis to divide address spaces (VLSM/CIDR) and optimize routing tables without routing loops.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Design and implement scalable hierarchical network architectures and routing topologies (OSPF, BGP).",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Investigate routing convergence times, link failure scenarios, and router buffer behaviors.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Configure and test real/virtual Cisco/Juniper routers, routing daemons, and automated topology generators.",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Consider socio-economic impact of Internet connectivity, universal addressing, and IPv4 address depletion.",
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Green routing algorithms and energy-efficient data routing across enterprise networks.",
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Team-based network engineering project configuring multi-subnet inter-VLAN routing.",
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Produce structured IP address allocation schemes and subnetting documentation.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Evaluate cost vs. performance when selecting routing hardware and IP allocation plans.",
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Critical foundation for ongoing developments in software-defined networking (SDN) and cloud routing.",
        status: "suggested",
        mapping_id: null,
      },
    },
    CO4: {
      PO1: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Apply engineering principles of state machines, sliding window mechanisms, and cumulative acknowledgments.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Analyze congestion window dynamics, packet loss recovery strategies, and fairness in bandwidth allocation.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Design socket-based reliable or low-latency end-to-end transport channels tailored to application requirements.",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Investigate jitter, round-trip time variations, and TCP Tahoe/Reno/CUBIC throughput under synthetic latency.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Utilize socket programming APIs (Python, C++) and network benchmarking tools (iperf, tcpdump).",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Pair programming in implementing multi-threaded client-server socket communication.",
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Summarize comparative performance tradeoffs between connection-oriented and datagram transports.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Enables lifelong ability to understand new transport protocols (e.g. QUIC, HTTP/3).",
        status: "suggested",
        mapping_id: null,
      },
    },
    CO5: {
      PO1: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Apply knowledge of application protocols, request/response paradigms, and RPC systems.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Analyze system bottlenecks, caching latencies, and message queuing in distributed application designs.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Design scalable, fault-tolerant web/email applications and RESTful/microservices architectures.",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Investigate DNS resolution times, HTTP/2 multiplexing performance, and server load distributions.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Use modern developer tooling: curl, Postman, web servers (NGINX), and mail servers.",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Impact of global web infrastructure, digital inclusion, and electronic commerce on societal well-being.",
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Assess cloud server carbon footprints and optimize energy-efficient HTTP caching strategies.",
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Ethical data handling, privacy compliance (GDPR), and responsible spam prevention (SPF/DKIM).",
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Collaborate in mini-project teams developing integrated full-stack client-server network applications.",
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Document API endpoints, payload contracts, and user-facing application architecture specifications.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Prepares students for continuous evolution of cloud architectures, edge computing, and web technologies.",
        status: "suggested",
        mapping_id: null,
      },
    },
    CO6: {
      PO1: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Apply cryptographic fundamentals, symmetric/asymmetric encryption, hashing, and digital certificate verification.",
        status: "suggested",
        mapping_id: null,
      },
      PO2: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Analyze attack vectors: man-in-the-middle, ARP spoofing, replay attacks, and firewall traversal weaknesses.",
        status: "suggested",
        mapping_id: null,
      },
      PO3: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Design defense-in-depth secure network communication pipelines using TLS/SSL, IPsec, and VPNs.",
        status: "suggested",
        mapping_id: null,
      },
      PO4: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Perform penetration testing and vulnerability assessments using security auditing frameworks.",
        status: "suggested",
        mapping_id: null,
      },
      PO5: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Utilize security tooling such as Wireshark SSL decryptors, Nmap, OpenSSL, and Metasploit.",
        status: "suggested",
        mapping_id: null,
      },
      PO6: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Evaluate legal requirements, cyber law adherence, and societal risks of critical infrastructure cyberattacks.",
        status: "suggested",
        mapping_id: null,
      },
      PO7: {
        correlation_level: 0,
        strength_label: "- No Mapping",
        is_ai_suggested: false,
        justification: null,
        status: "suggested",
        mapping_id: null,
      },
      PO8: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Strict adherence to white-hat ethical hacking principles, non-disclosure policies, and user privacy protection.",
        status: "suggested",
        mapping_id: null,
      },
      PO9: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Operate in red-team / blue-team exercise groups to simulate attacks and defense responses.",
        status: "suggested",
        mapping_id: null,
      },
      PO10: {
        correlation_level: 2,
        strength_label: "2 - Medium",
        is_ai_suggested: true,
        justification:
          "Formulate incident response reports, security compliance audits, and mitigation whitepapers.",
        status: "suggested",
        mapping_id: null,
      },
      PO11: {
        correlation_level: 1,
        strength_label: "1 - Low",
        is_ai_suggested: true,
        justification:
          "Assess cost-benefit tradeoffs in enterprise cybersecurity investments and risk insurance.",
        status: "suggested",
        mapping_id: null,
      },
      PO12: {
        correlation_level: 3,
        strength_label: "3 - High",
        is_ai_suggested: true,
        justification:
          "Continuous adaptation required for zero-day threat landscapes, quantum-safe cryptography, and AI-driven attacks.",
        status: "suggested",
        mapping_id: null,
      },
    },
  },
};
