import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Users, Loader2 } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import { Success, Failure } from "@/utils/function.utils";
import Models from "@/imports/models.import";

interface BulkEnrollmentUploadModalProps {
  open: boolean;
  onClose: () => void;
  courseInstanceId?: number;
  courseId?: number;
  courseName?: string;
  onSuccess?: () => void;
}

interface RowValidationResult {
  register_number: string;
  student_name?: string;
  department_name?: string;
  status: "valid" | "already_enrolled" | "does_not_exist" | string;
  message: string;
}

export const BulkEnrollmentUploadModal: React.FC<BulkEnrollmentUploadModalProps> = ({
  open,
  onClose,
  courseInstanceId,
  courseId,
  courseName,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [validating, setValidating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [validationResults, setValidationResults] = useState<RowValidationResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    valid: 0,
    alreadyEnrolled: 0,
    doesNotExist: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setStep("upload");
    setValidating(false);
    setEnrolling(false);
    setValidationResults([]);
    setSummary({ total: 0, valid: 0, alreadyEnrolled: 0, doesNotExist: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls" || ext === "csv") {
        setSelectedFile(file);
      } else {
        Failure("Please upload an Excel (.xlsx, .xls) or CSV (.csv) file");
      }
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      Failure("Please select a file to validate");
      return;
    }
    if (!courseInstanceId && !courseId) {
      Failure("Course instance not identified");
      return;
    }

    try {
      setValidating(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (courseInstanceId) formData.append("course_instance_id", String(courseInstanceId));
      if (courseId) formData.append("course_id", String(courseId));

      const res: any = await Models.course_enrollment.validateBulkUpload(formData);
      const rows: RowValidationResult[] = res?.row_results || [];

      let validCount = 0;
      let alreadyEnrolledCount = 0;
      let notFoundCount = 0;

      rows.forEach((r) => {
        if (r.status === "valid") validCount++;
        else if (r.status === "already_enrolled") alreadyEnrolledCount++;
        else if (r.status === "does_not_exist") notFoundCount++;
      });

      setValidationResults(rows);
      setSummary({
        total: rows.length,
        valid: validCount,
        alreadyEnrolled: alreadyEnrolledCount,
        doesNotExist: notFoundCount,
      });
      setStep("results");
    } catch (err: any) {
      console.error("Validation error:", err);
      Failure(typeof err === "string" ? err : err?.message || "Failed to validate file");
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedFile) return;

    try {
      setEnrolling(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (courseInstanceId) formData.append("course_instance_id", String(courseInstanceId));
      if (courseId) formData.append("course_id", String(courseId));

      const res: any = await Models.course_enrollment.bulkUpload(formData);
      const enrolledCount = res?.enrolled_count ?? summary.valid;
      Success(`Successfully enrolled ${enrolledCount} students!`);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      Failure(typeof err === "string" ? err : err?.message || "Failed to enroll students");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <ModalShell
      title={step === "upload" ? "Bulk Student Enrollment" : "Enrollment Validation Results"}
      subtitle={courseName ? `Course: ${courseName}` : "Upload register numbers to validate and enroll"}
      icon={<FileSpreadsheet className="h-4 w-4 text-color2" />}
      open={open}
      onClose={handleClose}
    >
      <div className="space-y-4">
        {step === "upload" ? (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                isDragging
                  ? "border-color2 bg-color2-l/20"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-gray-300 hover:border-color2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-color2 dark:bg-purple-950/40">
                <Upload className="h-6 w-6" />
              </div>

              {selectedFile ? (
                <div className="mt-3">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[#000] dark:text-white">
                    Click to browse or drag and drop Excel/CSV file
                  </p>
                  <p className="mt-1 text-xs text-pri">
                    Supports .xlsx, .xls, .csv (at most 60 student enrollments per file)
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
              <p className="font-bold mb-1">Expected Format:</p>
              <p>
                The file must include a column containing student register numbers with header{" "}
                <code className="bg-white/80 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-semibold">register_number</code> or{" "}
                <code className="bg-white/80 dark:bg-black/30 px-1 py-0.5 rounded font-mono font-semibold">student_id</code>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidate}
                disabled={!selectedFile || validating}
                className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validating Roster...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Validate Roster</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Results View */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-center dark:border-gray-700 dark:bg-gray-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Rows</span>
                <p className="text-lg font-extrabold text-[#000] dark:text-white">{summary.total}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Ready to Enroll</span>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{summary.valid}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-center dark:border-amber-800 dark:bg-amber-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Already Enrolled</span>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{summary.alreadyEnrolled}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5 text-center dark:border-red-800 dark:bg-red-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">Not Found</span>
                <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{summary.doesNotExist}</p>
              </div>
            </div>

            {/* Validation Table */}
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-2 font-bold text-[#000] dark:text-gray-200">#</th>
                    <th className="px-3 py-2 font-bold text-[#000] dark:text-gray-200">Register Number</th>
                    <th className="px-3 py-2 font-bold text-[#000] dark:text-gray-200">Student Name</th>
                    <th className="px-3 py-2 font-bold text-[#000] dark:text-gray-200">Validation Status</th>
                    <th className="px-3 py-2 font-bold text-[#000] dark:text-gray-200">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {validationResults.map((row, idx) => {
                    const isValid = row.status === "valid";
                    const isEnrolled = row.status === "already_enrolled";
                    return (
                      <tr
                        key={`${row.register_number}-${idx}`}
                        className={
                          isValid
                            ? "hover:bg-emerald-50/40"
                            : isEnrolled
                            ? "bg-amber-50/20 hover:bg-amber-50/40"
                            : "bg-red-50/20 hover:bg-red-50/40"
                        }
                      >
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-[#000] dark:text-white font-mono">
                          {row.register_number}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#000] dark:text-gray-300">
                          {row.student_name || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {isValid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Valid
                            </span>
                          ) : isEnrolled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3" /> Already Enrolled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              <XCircle className="h-3 w-3" /> Does Not Exist
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {row.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="flex items-center gap-1 text-xs font-semibold text-color2 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Upload
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEnrollment}
                  disabled={summary.valid === 0 || enrolling}
                  className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Confirm & Enroll ({summary.valid} Students)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};
