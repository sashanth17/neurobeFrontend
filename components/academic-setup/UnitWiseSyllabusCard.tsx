import React from "react";
import UnitSyllabusCardItem, {
  UnitSyllabusCardItemProps,
} from "./UnitSyllabusCardItem";

export interface UnitWiseSyllabusCardProps {
  title?: string;
  headerStatsText?: string;
  units?: UnitSyllabusCardItemProps[];
  onHierarchyClick?: (unitNumber: number | string) => void;
  className?: string;
}

const DEFAULT_UNITS: UnitSyllabusCardItemProps[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    unitTitle: "Introduction & Physical Layer",
    hoursText: "9 Hours",
    topicsCountText: "7 Topics",
    topics: [
      { code: "1.1", title: "Fundamentals of Computer Networks and Data Communication" },
      { code: "1.2", title: "Network Architecture, Components and Communication Models" },
      { code: "1.3", title: "Layered Network Architecture and Protocol Design Principles" },
      { code: "1.4", title: "OSI Reference Model and Functions of Individual Layers" },
      { code: "1.5", title: "TCP/IP Reference Model and Comparison with the OSI Model" },
      { code: "1.6", title: "Physical Layer Concepts, Signals and Data Transmission Fundamentals" },
      { code: "1.7", title: "Guided and Unguided Transmission Media for Computer Networks" },
    ],
  },
  {
    id: "unit-2",
    unitNumber: 2,
    unitTitle: "Data Link Layer & MAC Sublayer",
    hoursText: "9 Hours",
    topicsCountText: "7 Topics",
    topics: [
      { code: "2.1", title: "Data Link Layer Services and Frame Organization" },
      { code: "2.2", title: "Framing Methods and Data Link Control Mechanisms" },
      { code: "2.3", title: "Error Detection Techniques using Parity, Checksum and CRC" },
      { code: "2.4", title: "Error Correction Methods and Reliable Data Transmission" },
      { code: "2.5", title: "Flow Control and Automatic Repeat Request Protocols" },
      { code: "2.6", title: "Medium Access Control Techniques for Shared Communication Channels" },
      { code: "2.7", title: "Ethernet Architecture, Frame Format and MAC Addressing" },
    ],
  },
];

const UnitWiseSyllabusCard: React.FC<UnitWiseSyllabusCardProps> = ({
  title = "UNIT-WISE SYLLABUS",
  headerStatsText = "5 Units · 35 Ordered Topics",
  units = DEFAULT_UNITS,
  onHierarchyClick,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="text-md font-bold">{title}</span>


        </div>
        <span className="text-xs font-semibold text-pri dark:text-gray-400">
          {headerStatsText}
        </span>
      </div>

      {/* Units List using UnitSyllabusCardItem inner sub-component */}
      <div className="space-y-4">
        {units.map((unit) => (
          <UnitSyllabusCardItem
            key={unit.id || unit.unitNumber}
            unitNumber={unit.unitNumber}
            unitTitle={unit.unitTitle}
            hoursText={unit.hoursText}
            topicsCountText={unit.topicsCountText}
            topics={unit.topics}
            onHierarchyClick={() =>
              onHierarchyClick && onHierarchyClick(unit.unitNumber)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default UnitWiseSyllabusCard;
