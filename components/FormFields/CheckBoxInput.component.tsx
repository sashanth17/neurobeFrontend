import React from "react";

interface InputProps {
  type?: "checkbox" | "radio"; // Added type prop
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  name?: string;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  labelStyle?: string;
}

const CheckboxInput: React.FC<InputProps> = ({
  type = "checkbox", // default is checkbox
  checked,
  onChange,
  label,
  name,
  className = "",
  error,
  required,
  disabled,
  labelStyle,
}) => {
  return (
    <div className={` ${className}`}>
      <label className="flex cursor-pointer items-center">
        <input
          type={type} // can be checkbox or radio
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          name={name}
          required={required}
          disabled={disabled}
          className={`form-${type} accent-[#5C28CA] ${
            error ? "border-red-500" : ""
          }`}
        />
        <span
          className={`ml-1 text-[#000] ${labelStyle || "text-sm font-medium"}`}
        >
          {label}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default CheckboxInput;
