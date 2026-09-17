import { useState } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));

const IMPORT_TYPE_OPTS = toOpts(["Faculty / Staff", "Students", "All Users"]);

interface Props {
  open: boolean;
  onClose: () => void;
}

const BulkImportModal = ({ open, onClose }: Props) => {
  const [form, setForm] = useState({ importType: null as any });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  return (
    <ModalShell
      title="Bulk Import Users"
      subtitle="Upload a CSV or Excel file to import multiple users at once."
      icon={<Upload className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form
        id="bulk-form"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className="space-y-4">
          <CustomSelect
            title="Import Type"
            required
            options={IMPORT_TYPE_OPTS}
            value={form.importType}
            onChange={(v) => set("importType", v)}
            placeholder="Select user type to import"
          />

          {/* Drop zone */}
          <div>
            <label className="mb-1 block text-sm font-bold text-[#000]">
              Upload File <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
                dragging
                  ? "border-color2 bg-[#ede9fe]/40"
                  : "border-[#ae8ff1] bg-gray-50 hover:border-[#7c3aed] hover:bg-[#ede9fe]/20"
              }`}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="text-color2 h-8 w-8" />
                  <div>
                    <p className="text-sm font-semibold text-[#000]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#000]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-2 text-[#000] hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-medium text-[#000]">
                    Drag & drop your file here
                  </p>
                  <p className="mt-0.5 text-xs text-[#000]">
                    or click to browse
                  </p>
                  <p className="mt-1 text-xs text-[#000]">
                    Supports .csv, .xlsx — max 5MB
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFile}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-color2" />
              <p className="text-xs font-medium text-[#000]">
                Download import template
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-color2 hover:underline"
            >
              Download CSV
            </button>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700">
              Ensure your file follows the template format. Duplicate emails
              will be skipped. All imported users will receive a welcome email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            // disabled={!file}
            className="bg-color2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Import Users
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default BulkImportModal;
