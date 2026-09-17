import React, { useState } from "react";
import MappingRationaleItem, {
  PoRationaleItem,
} from "./MappingRationaleItem";
import ProgramOutcomeAccordionItem from "./ProgramOutcomeAccordionItem";

export interface CoMappingItemData {
  id: string;
  coCode: string;
  statement: string;
  mappedCountText: string;
  poItems: PoRationaleItem[];
}

export interface ProgramOutcomeItemData {
  id: string;
  poCode: string;
  poTitle: string;
  description: string;
}

export interface MappingRationaleCardProps {
  title?: string;
  subtitle?: string;
  headerStatsText?: string;
  items?: (CoMappingItemData | ProgramOutcomeItemData)[];
  className?: string;
}

const DEFAULT_CO_ITEMS: CoMappingItemData[] = [
  {
    id: "co1",
    coCode: "CO1",
    statement:
      "Understand network architectures, reference models and physical-layer fundamentals.",
    mappedCountText: "3 mapped outcomes",
    poItems: [
      {
        id: "po1-1",
        poCode: "PO1",
        poTitle: "Engineering Knowledge",
        strengthText: "Strength: 3 (High)",
        strengthBadgeClass:
          "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
        rationale:
          "The outcome requires students to apply core engineering and computing knowledge to understand network architectures and protocol models.",
      },
      {
        id: "po1-2",
        poCode: "PO2",
        poTitle: "Problem Analysis",
        strengthText: "Strength: 2 (Medium)",
        strengthBadgeClass:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
        rationale:
          "Students interpret and compare networking models and communication structures using engineering principles.",
      },
      {
        id: "po1-5",
        poCode: "PO5",
        poTitle: "Modern Tool Usage",
        strengthText: "Strength: 1 (Low)",
        strengthBadgeClass:
          "bg-gray-100 text-[#000] dark:bg-gray-800 dark:text-gray-300",
        rationale:
          "Students examine packet structures and basic physical transmission concepts using simulation tools and network diagnostic utilities.",
      },
    ],
  },
  {
    id: "co2",
    coCode: "CO2",
    statement:
      "Analyze data-link protocols, framing, error control and medium-access techniques.",
    mappedCountText: "3 mapped outcomes",
    poItems: [
      {
        id: "po2-1",
        poCode: "PO1",
        poTitle: "Engineering Knowledge",
        strengthText: "Strength: 3 (High)",
        strengthBadgeClass:
          "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
        rationale:
          "Outcome requires analytical evaluation of error detection and flow control algorithms at the data link layer.",
      },
      {
        id: "po2-2",
        poCode: "PO2",
        poTitle: "Problem Analysis",
        strengthText: "Strength: 3 (High)",
        strengthBadgeClass:
          "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
        rationale:
          "Students analyze framing methods and error correction techniques for efficient transmission.",
      },
    ],
  },
  {
    id: "co3",
    coCode: "CO3",
    statement: "Apply IP addressing, subnetting and routing concepts.",
    mappedCountText: "4 mapped outcomes",
    poItems: [
      {
        id: "po3-1",
        poCode: "PO1",
        poTitle: "Engineering Knowledge",
        strengthText: "Strength: 3 (High)",
        strengthBadgeClass:
          "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
        rationale:
          "Application of IPv4 subnetting formulas and routing algorithm mechanics.",
      },
    ],
  },
  {
    id: "co4",
    coCode: "CO4",
    statement: "Explain transport-layer protocols and mechanisms.",
    mappedCountText: "4 mapped outcomes",
    poItems: [
      {
        id: "co4-1",
        poCode: "PO1",
        poTitle: "Engineering Knowledge",
        strengthText: "Strength: 2 (Medium)",
        strengthBadgeClass:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
        rationale:
          "Understanding end-to-end transport mechanics, TCP congestion control, and UDP socket communication.",
      },
    ],
  },
  {
    id: "co5",
    coCode: "CO5",
    statement: "Explain application-layer protocols and services.",
    mappedCountText: "4 mapped outcomes",
    poItems: [
      {
        id: "co5-1",
        poCode: "PO1",
        poTitle: "Engineering Knowledge",
        strengthText: "Strength: 2 (Medium)",
        strengthBadgeClass:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
        rationale:
          "Explanations of client-server architectures, DNS resolution, and HTTP protocol operations.",
      },
    ],
  },
];

const MappingRationaleCard: React.FC<MappingRationaleCardProps> = ({
  title = "MAPPING RATIONALE",
  subtitle = "Why each Course Outcome is mapped to the selected Program Outcomes.",
  headerStatsText = "5 Outcome Rationales",
  items = DEFAULT_CO_ITEMS,
  className = "",
}) => {
  // Initially all accordion items closed
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-4 flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
            <span className="text-md font-bold">{title}</span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-pri dark:text-pri">
              {subtitle}
            </p>
          )}
        </div>

        <span className="text-xs font-mono font-medium text-pri dark:text-pri shrink-0">
          {headerStatsText}
        </span>
      </div>

      {/* Accordion Items List */}
      <div className="space-y-3">
        {items.map((item: any) => {
          // If item is a Program Outcome item
          if (item.description || (item.poTitle && !item.statement)) {
            return (
              <ProgramOutcomeAccordionItem
                key={item.id || item.poCode}
                poCode={item.poCode}
                poTitle={item.poTitle}
                description={item.description}
                isOpen={Boolean(openIds[item.id || item.poCode])}
                onToggle={() => toggleItem(item.id || item.poCode)}
              />
            );
          }

          // Otherwise render MappingRationaleItem
          return (
            <MappingRationaleItem
              key={item.id || item.coCode}
              coCode={item.coCode}
              statement={item.statement}
              mappedCountText={item.mappedCountText}
              poItems={item.poItems}
              isOpen={Boolean(openIds[item.id || item.coCode])}
              onToggle={() => toggleItem(item.id || item.coCode)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MappingRationaleCard;
