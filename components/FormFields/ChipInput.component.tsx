import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface ChipInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  title?: string;
  error?: string;
  required?: boolean;
}

const ChipInput: React.FC<ChipInputProps> = ({
  value = [],
  onChange,
  placeholder = "Type and press Enter",
  title,
  error,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="w-full">
      {title && (
        <label className="mb-2 block text-sm font-medium text-[#000]">
          {title}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      
      <div
        className={`min-h-[42px] rounded-lg border ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500`}
      >
        <div className="flex flex-wrap gap-2">
          {value.map((chip, index) => (
            <div
              key={index}
              className="flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={() => removeChip(index)}
                className="rounded-full hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] border-none bg-transparent px-2 py-1 text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {value.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default ChipInput;
