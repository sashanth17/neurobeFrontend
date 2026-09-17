import GenericTabs from "@/components/common-components/GenericTabs";

interface PedagogyUnitTabsProps {
  activeUnit?: number;
  onUnitChange?: (unit: number) => void;
  unitCounts?: Record<number, number>;
  totalUnits?: number;
  rightContent?: React.ReactNode;
}

const PedagogyUnitTabs = ({
  activeUnit = 1,
  onUnitChange,
  unitCounts = {},
  totalUnits = 5,
  rightContent,
}: PedagogyUnitTabsProps) => {
  const tabs = Array.from({ length: totalUnits }, (_, i) => {
    const id = i + 1;
    return {
      key: id,
      label: `Unit ${id}`,
      count: unitCounts[id],
    };
  });

  return (
    <GenericTabs
      tabs={tabs}
      activeKey={activeUnit}
      onChange={(key) => onUnitChange?.(Number(key))}
      rightContent={rightContent}
    />
  );
};

export default PedagogyUnitTabs;
