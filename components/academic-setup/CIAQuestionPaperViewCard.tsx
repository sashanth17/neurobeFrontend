import React from "react";

export interface PartAQuestion {
  id: string;
  qNo: string;
  question: string;
  coTag: string;
  marks: string;
}

export interface PartBQuestionPair {
  id: string;
  qNoA: string;
  questionA: string;
  coTagA: string;
  marksA: string;
  qNoB: string;
  questionB: string;
  coTagB: string;
  marksB: string;
}

export interface CIAQuestionPaperViewCardProps {
  department?: string;
  assessmentTitle?: string;
  courseCodeTitle?: string;
  programme?: string;
  semester?: string;
  academicYear?: string;
  maxMarks?: string | number;
  duration?: string;
  date?: string;
  noteText?: string;
  partAQuestions?: PartAQuestion[];
  partBQuestions?: PartBQuestionPair[];
  approvalFooterText?: string;
}

const DEFAULT_PART_A: PartAQuestion[] = [
  {
    id: "q1",
    qNo: "1.",
    question:
      "State two differences between the OSI reference model and the TCP/IP protocol architecture.",
    coTag: "CO1 • K2",
    marks: "2 Marks",
  },
  {
    id: "q2",
    qNo: "2.",
    question:
      "Explain the purpose of bit stuffing in High-Level Data Link Control (HDLC) framing.",
    coTag: "CO2 • K2",
    marks: "2 Marks",
  },
  {
    id: "q3",
    qNo: "3.",
    question:
      "What is the function of the Cyclic Redundancy Check (CRC) in data link frame verification?",
    coTag: "CO2 • K2",
    marks: "2 Marks",
  },
  {
    id: "q4",
    qNo: "4.",
    question:
      "Explain the significance of the subnet mask in IPv4 addressing and CIDR notation.",
    coTag: "CO3 • K2",
    marks: "2 Marks",
  },
  {
    id: "q5",
    qNo: "5.",
    question:
      "Why does standard CSMA/CD Ethernet require a minimum frame size specification?",
    coTag: "CO2 • K2",
    marks: "2 Marks",
  },
];

const DEFAULT_PART_B: PartBQuestionPair[] = [
  {
    id: "q6",
    qNoA: "6. (a)",
    questionA:
      "Explain the 7–layer architecture of the OSI Reference Model and describe the primary function of each layer with suitable sketches.",
    coTagA: "CO1 • K2",
    marksA: "8 Marks",
    qNoB: "6. (b)",
    questionB:
      "Compare Guided Transmission Media (Twisted Pair, Coaxial Cable, Optical Fiber) based on bandwidth, propagation speed, attenuation, and electromagnetic noise immunity.",
    coTagB: "CO1 • K4",
    marksB: "8 Marks",
  },
  {
    id: "q7",
    qNoA: "7. (a)",
    questionA:
      "A bit stream 1101011011 is transmitted using standard CRC polynomial error detection. The generator polynomial is G(x) = x⁴ + x + 1. Calculate the transmitted codeword with appended FCS check bits and verify that no error occurred at the receiver.",
    coTagA: "CO2 • K3",
    marksA: "8 Marks",
    qNoB: "7. (b)",
    questionB:
      "Describe the operational mechanisms of Go-Back-N and Selective Repeat ARQ sliding window protocols with sequence diagrams, window size constraints, and buffer requirements.",
    coTagB: "CO2 • K3",
    marksB: "8 Marks",
  },
  {
    id: "q8",
    qNoA: "8. (a)",
    questionA:
      "An organization is assigned the network address block 192.168.100.0/24. Design four distinct subnets with host capacities of 60, 30, 14, and 14 hosts using Variable Length Subnet Masking (VLSM), specifying network ID, broadcast address, subnet mask, and usable host IP ranges for each subnet.",
    coTagA: "CO3 • K3",
    marksA: "8 Marks",
    qNoB: "8. (b)",
    questionB:
      "Demonstrate Dijkstra's Shortest Path Link-State routing algorithm for a sample 6–node network topology and construct the step-by-step routing forwarding table for the source node.",
    coTagB: "CO3 • K4",
    marksB: "8 Marks",
  },
  {
    id: "q9",
    qNoA: "9. (a)",
    questionA:
      "Explain the TCP 3–way handshake process for connection establishment and connection termination with detailed TCP segment sequence diagrams and flag transitions.",
    coTagA: "CO4 • K2",
    marksA: "8 Marks",
    qNoB: "9. (b)",
    questionB:
      "Discuss the TCP congestion control mechanisms including Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery with AIMD congestion window behavior curves.",
    coTagB: "CO4 • K3",
    marksB: "8 Marks",
  },
  {
    id: "q10",
    qNoA: "10. (a)",
    questionA:
      "Describe the hierarchical architecture of the Domain Name System (DNS), detailing root name servers, TLD servers, authoritative servers, and recursive vs iterative DNS query resolution.",
    coTagA: "CO5 • K2",
    marksA: "8 Marks",
    qNoB: "10. (b)",
    questionB:
      "Explain the working principle of the File Transfer Protocol (FTP) and contrast its dual-channel (control on port 21 vs data on port 20) architecture with HTTP persistent and non-persistent connections.",
    coTagB: "CO5 • K3",
    marksB: "8 Marks",
  },
];

const CIAQuestionPaperViewCard: React.FC<CIAQuestionPaperViewCardProps> = ({
  department = "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
  assessmentTitle = "CONTINUOUS INTERNAL ASSESSMENT – I",
  courseCodeTitle = "CS309 – Computer Networks",
  programme = "B.Tech Computer Science and Engineering",
  semester = "Semester 3",
  academicYear = "2026–2027 (Batch A)",
  maxMarks = "50",
  duration = "90 Minutes",
  date = "28 Aug 2026",
  noteText = "Note: Answer ALL questions in Part A and Part B according to the instructions provided. Draw neat diagrams wherever necessary.",
  partAQuestions = DEFAULT_PART_A,
  partBQuestions = DEFAULT_PART_B,
  approvalFooterText = "Approved on 25 Aug 2026 by Course Coordinator (Dr. Arun Kumar) - CONTINUOUS INTERNAL ASSESSMENT - I",
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 1. Header Titles */}
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold uppercase tracking-wide text-[#000] dark:text-white sm:text-xl">
          {department}
        </h2>
        <h3 className="mt-1 text-base font-bold uppercase tracking-wider text-[#000] dark:text-gray-200">
          {assessmentTitle}
        </h3>
      </div>

      {/* 2. Metadata Grid */}
      <div className="space-y-3.5 pb-5 border-b border-gray-200/80 dark:border-gray-700 text-sm text-[#000] dark:text-gray-300">
        {/* Row 1 */}
        <div className="flex flex-row justify-between gap-4 print-row-1">
          <div className="w-1/2 print-col-left">
            <span className="font-bold text-[#000] dark:text-white">
              Course:{" "}
            </span>
            <span className="font-medium">{courseCodeTitle}</span>
          </div>
          <div className="w-[45%] print-col-right">
            <span className="font-bold text-[#000] dark:text-white">
              Programme:{" "}
            </span>
            <span className="font-medium">
              B.Tech Computer Science and{" "}
              <br className="hidden md:inline" />
              Engineering
            </span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-row justify-between gap-4 print-row-2">
          <div className="w-1/2 print-col-left">
            <span className="font-bold text-[#000] dark:text-white">
              Semester:{" "}
            </span>
            <span className="font-medium">{semester}</span>
          </div>
          <div className="w-[45%] print-col-right">
            <span className="font-bold text-[#000] dark:text-white">
              Academic Year:{" "}
            </span>
            <span className="font-medium">{academicYear}</span>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-row justify-between items-center gap-4 print-row-3">
          <div>
            <span className="font-bold text-[#000] dark:text-white">
              Max. Marks:{" "}
            </span>
            <span className="font-medium">{maxMarks}</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-[#000] dark:text-white">
              Duration:{" "}
            </span>
            <span className="font-medium">{duration}</span>
          </div>
          <div className="text-right print-date-right">
            <span className="font-bold text-[#000] dark:text-white">
              Date:{" "}
            </span>
            <span className="font-medium">{date}</span>
          </div>
        </div>
      </div>

      {/* 3. Note Box */}
      <div className="my-6 rounded-xl border border-gray-100 bg-[#F8FAFC] p-4 text-xs sm:text-sm text-[#000] dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
        <p className="leading-relaxed">
          <strong className="font-bold text-[#000] dark:text-white">
            Note:{" "}
          </strong>
          {noteText.replace(/^Note:\s*/i, "")}
        </p>
      </div>

      {/* 4. PART A Section */}
      <div className="mt-8 space-y-4">
        {/* Part A Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
          <h4 className="text-base font-bold text-[#000] dark:text-white">
            PART A
          </h4>
          <span className="text-sm font-bold text-[#000] dark:text-white">
            Answer ALL Questions (5 x 2 = 10 Marks)
          </span>
        </div>

        {/* Part A List */}
        <div className="space-y-4 pt-1">
          {partAQuestions.map((q) => (
            <div
              key={q.id}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-sm text-[#000] dark:text-gray-200 print-avoid-break"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 shrink-0 font-bold text-[#000] dark:text-white">
                  {q.qNo}
                </span>
                <p className="leading-relaxed font-medium">{q.question}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4 self-end sm:self-start">
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#000] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {q.coTag}
                </span>
                <span className="w-16 text-right font-bold text-[#000] dark:text-white">
                  {q.marks}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PART B Section */}
      <div className="mt-10 space-y-6">
        {/* Part B Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
          <h4 className="text-base font-bold text-[#000] dark:text-white">
            PART B
          </h4>
          <span className="text-sm font-bold text-[#000] dark:text-white">
            Answer ALL Questions (Either / Or Pattern) (5 x 8 = 40 Marks)
          </span>
        </div>

        {/* Part B List */}
        <div className="space-y-6 pt-1">
          {partBQuestions.map((pair) => (
            <div key={pair.id} className="space-y-5 print-avoid-break">
              {/* Question A */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-sm text-[#000] dark:text-gray-200">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-10 shrink-0 font-bold text-[#000] dark:text-white">
                    {pair.qNoA}
                  </span>
                  <p className="leading-relaxed font-medium">
                    {pair.questionA}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4 self-end sm:self-start">
                  <span className="inline-flex items-center rounded-md border border-gray-200 bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#000] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {pair.coTagA}
                  </span>
                  <span className="w-16 text-right font-bold text-[#000] dark:text-white">
                    {pair.marksA}
                  </span>
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
                <span className="absolute bg-white dark:bg-gray-800 px-4 text-xs font-semibold text-[#000] dark:text-pri tracking-widest">
                  — OR —
                </span>
              </div>

              {/* Question B */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-sm text-[#000] dark:text-gray-200">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-10 shrink-0 font-bold text-[#000] dark:text-white">
                    {pair.qNoB}
                  </span>
                  <p className="leading-relaxed font-medium">
                    {pair.questionB}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4 self-end sm:self-start">
                  <span className="inline-flex items-center rounded-md border border-gray-200 bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#000] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {pair.coTagB}
                  </span>
                  <span className="w-16 text-right font-bold text-[#000] dark:text-white">
                    {pair.marksB}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Footer Section */}
      <div className="mt-8 border-t border-gray-200 pt-5 text-center dark:border-gray-700 space-y-1.5 print-avoid-break">
        <p className="text-sm font-bold uppercase tracking-widest text-[#000] dark:text-white">
          *** End of Question Paper ***
        </p>
        <p className="text-sm font-medium text-pri dark:text-gray-400">
          {approvalFooterText}
        </p>
      </div>
    </div>
  );
};

export default CIAQuestionPaperViewCard;
