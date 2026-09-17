import React from "react";
import { IconType } from "react-icons";
import { FiHome } from "react-icons/fi";
import { MdHome, MdOutlineDashboard } from "react-icons/md";
import { FaBeer } from "react-icons/fa";
import { IoIosHome } from "react-icons/io";

interface CustomIconProps {
  name: string;
  iconModule: string; // e.g., "Feather"
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// ✅ Use IconType directly — it's the right type for react-icons
const iconModules: Record<string, Record<string, IconType>> = {
  Feather: {
    home: FiHome,
  },
  MaterialIcons: {
    home: MdHome,
    dashboard: MdOutlineDashboard,
  },
  FontAwesome: {
    beer: FaBeer,
  },
  Ion: {
    home: IoIosHome,
  },
};

const CustomIcon: React.FC<CustomIconProps> = ({
  name,
  iconModule,
  size = 24,
  color = "#000",
  style,
  onClick,
}) => {
  const Module = iconModules[iconModule];
  const IconComponent = Module ? Module[name] : null;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in module "${iconModule}"`);
    return null;
  }

  // ✅ Cast to React.ElementType to satisfy TS
  const Component = IconComponent as React.ElementType;

  return <Component size={size} color={color} style={style} onClick={onClick} />;
};

export default CustomIcon;


// usage----------
 
// <CustomIcon iconModule="Feather" name="home" size={20} color="blue" />
// <CustomIcon iconModule="FontAwesome" name="beer" size={30} color="gold" />
// <CustomIcon iconModule="MaterialIcons" name="dashboard" />
