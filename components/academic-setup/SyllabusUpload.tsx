import { useRef, useState } from "react";
import { CloudUpload, File, Trash2 } from "lucide-react";

interface SyllabusUploadProps {
  onFileSelect?: (file: File | null) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SyllabusUpload = ({ onFileSelect }: SyllabusUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    onFileSelect?.(f);
  };

  const handleRemove = () => {
    setFile(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  return (
    <div className=" mb-5  border-gray-300  dark:border-gray-600 rounded-xl">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center border-dashed justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
          dragging
            ? "border-primary bg-purple-50 dark:bg-purple-900/10"
            : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20">
          <CloudUpload className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm font-semibold text-[#000] dark:text-gray-200">
          Drag & drop your syllabus document here, or{" "}
          <span
            className="cursor-pointer text-primary underline"
            onClick={() => inputRef.current?.click()}
          >
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-[#000]">Supported formats: PDF, DOCX, DOC</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {/* File Preview */}
      {file && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
              <File className="h-5 w-5 text-[#000]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000] dark:text-gray-200">{file.name}</p>
              <div className="flex items-center gap-2 text-xs text-[#000]">
                <span>{formatSize(file.size)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-600 font-medium">Ready for AI Extraction</span>
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SyllabusUpload;
