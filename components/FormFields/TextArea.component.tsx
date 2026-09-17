import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  title?: string;
  error?: string;
  className?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconOnclick?: any;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder,
  title,
  name,
  required,
  className = "",
  error,
  icon,
  rightIcon,
  rightIconOnclick,
  rows = 4,
  ...rest
}) => {
  return (
    <div className="w-full">
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
          <span className="absolute left-3 top-3 text-[#000] pointer-events-none">
            {icon}
          </span>
        )}

        <textarea
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          required={required}
          rows={rows}
          className={`form-textarea w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-primary resize-none ${
            error ? "border-red-500" : "border-gray-300"
          } ${icon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${className}`}
          {...rest}
        />

        {rightIcon && (
          <span
            className="absolute right-3 top-3 text-[#000] cursor-pointer"
            onClick={() => rightIconOnclick?.()}
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

export default TextArea;
