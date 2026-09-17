import React from "react";
import { Loader } from "@mantine/core";
import IconLoader from "../Icon/IconLoader";

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

const PrimaryButton: React.FC<CustomButtonProps> = ({
  text,
  loading = false,
  className,
  children,
  disabled,
  icon,
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-dblue px-4 py-2 font-medium text-white shadow hover:bg-dblue disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <>
          {icon && icon}
          {text || children}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;
