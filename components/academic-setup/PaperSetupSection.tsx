import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

interface PaperSetupSectionProps {
  paperName: string;
  totalMarks: string;
  course: any;
  courseOptions: { value: string; label: string }[];
  step?: string;
  onChange: (field: string, value: any) => void;
}

const PaperSetupSection = ({
  paperName,
  totalMarks,
  course,
  courseOptions,
  step = "Step 1 of 3",
  onChange,
}: PaperSetupSectionProps) => {
  return (
    <div className="panel mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="section-ti">1. Paper Setup</h3>
          <p className="mt-0.5 text-sm text-pri">
            General examination details and total marks configuration.
          </p>
        </div>
        <span className="rounded-full bg-color2-l px-3 py-1 text-xs font-semibold text-color2">
          {step}
        </span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextInput
          title="CIA Paper Name"
          required
          placeholder="e.g. CIA-3 Question Paper"
          value={paperName}
          onChange={(e) => onChange("paperName", e.target.value)}
        />
        <TextInput
          title="Total Marks"
          required
          type="number"
          placeholder="100"
          value={totalMarks}
          onChange={(e) => onChange("totalMarks", e.target.value)}
        />
        <CustomSelect
          title="Course"
          required
          options={courseOptions}
          value={course}
          onChange={(v) => onChange("course", v)}
          placeholder="CS309 — Computer Networks"
        />
      </div>
    </div>
  );
};

export default PaperSetupSection;
