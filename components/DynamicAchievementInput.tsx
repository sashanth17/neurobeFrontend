import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { capitalizeFLetter } from "@/utils/function.utils";
import TextArea from "./FormFields/TextArea.component";

export default function DynamicAchievementInput({
  defaultValue = [],
  onChange,
  title = "",
  required = false,
  placeholder = "Enter achievement",
  cols = 3,
  grid=true
}) {
  const [items, setItems] = useState<{ achievement: string }[]>([{ achievement: "" }]);

  useEffect(() => {
    if (defaultValue?.length > 0) setItems(defaultValue);
  }, []);

  const handleChange = (index, value) => {
    const updated = [...items];
    updated[index] = { achievement: capitalizeFLetter(value) };
    setItems(updated);
    onChange && onChange(updated);
  };

  const addItem = () => {
    const updated = [...items, { achievement: "" }];
    setItems(updated);
    onChange && onChange(updated);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onChange && onChange(updated);
  };

  return (
    <div>
      {title && (
        <label className="mb-2 block text-sm font-bold text-[#000]">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`${grid ? "grid" : ""} gap-2`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {items.map((item, index) => (
          <div key={index} className="flex items-center rounded-lg bg-white">
            <TextArea
            rows={3}
              value={item.achievement}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 text-sm outline-none"
            />
            {items.length > 1 && (
              <Trash2
                size={13}
                className="ml-2 shrink-0 cursor-pointer text-red-400 hover:text-red-600"
                onClick={() => removeItem(index)}
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 flex items-center gap-1 rounded-lg border border-blue-500 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
      >
        <Plus size={14} />
        Add
      </button>
    </div>
  );
}
