import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  error?: string;
  className?: string;
  icon?: React.ReactNode; 
  rightIcon?: React.ReactNode;
  rightIconOnlick?: any;
  rightIconOnClick?: any;
  parentClassName?: any;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  type = "text",
  title,
  name,
  required,
  className = "",
  error,
  icon,
  rightIcon,
  rightIconOnlick,
  rightIconOnClick,
  parentClassName = "",
  ...rest
}) => {
  const handleRightIconClick = () => {
    if (typeof rightIconOnlick === "function") {
      rightIconOnlick();
    } else if (typeof rightIconOnClick === "function") {
      rightIconOnClick();
    }
  };

  return (
    <div className={`${parentClassName  || "w-full"}`}>
      {title && (
        <label
          htmlFor={name}
          className="block text-sm font-bold text-[#000] mb-1"
        >
          {title} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000] pointer-events-none">
            {icon}
          </span>
        )}

        <input
          id={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          name={name}
          className={`form-input w-full rounded-md border px-3 py-2 outline-none focus:ring-[0.2px] focus:ring-[#7c3aed] ${
            error ? "border-red-500" : "border-gray-300"
          } ${icon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${
            rest.disabled ? "bg-gray-100 text-[#000] cursor-not-allowed" : ""
          } ${className || 'w-full'}`}
          {...rest}
        />

        {rightIcon && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000] cursor-pointer"
            onClick={handleRightIconClick}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default TextInput;
