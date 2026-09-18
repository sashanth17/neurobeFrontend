import { useState, useEffect, useRef } from "react";
import { Check, Edit, PlusIcon, Search, Users, X, Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Failure, Success, useSetState, getOrganizationId } from "@/utils/function.utils";
import Models from "@/imports/models.import";
import { ROLES } from "@/utils/constant.utils";
import PDFUploadDropzone from "./PDFUploadDropzone";

// ─── Body scroll lock ─────────────────────────────────────────────────────────
const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);
};

// ─── Animated visibility hook (delays unmount for closing animation) ────────
const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const ALL_INSTRUCTORS = ["Arun Kumar", "Priya Selvam", "Sanjay Murugan", "Vignesh Kumar", "Deepa Nair", "Dr. Senthil Nathan"];


  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => { setVisible(false); setClosing(false); }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);

  return { visible, closing };
};

// ─── Shared modal shell ───────────────────────────────────────────────────────
interface ModalShellProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: any;
  code?: string
}

export const ModalShell = ({
  title,
  subtitle,
  open,
  onClose,
  children,
  icon,
  code
}: ModalShellProps) => {
  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ animation: closing ? "fadeOut 0.22s ease forwards" : "fadeIn 0.22s ease" }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: closing ? "slideDown 0.22s ease forwards" : "slideUp 0.22s ease" }}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className='flex items-center gap-2'>
            {icon && (
              <div className="text-color2 w-fit rounded-md bg-gray-200 p-2">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className=" text-base font-semibold text-[#000] dark:text-white">
                  {title}
                </h3>
                {code &&
                  <div className="text-color2 w-fit rounded-md  px-3 py-1 bg-color2-l text-xs font-semibold text-color2">
                    {code}
                  </div>
                }
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-[#000]">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pri mt-0.5 rounded-full border border-gray-500 p-0.5 hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const ModalFooter = ({
  onClose,
  submitLabel,
}: {
  onClose: () => void;
  submitLabel: string;
}) => (
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
      className="bg-color2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      {submitLabel}
    </button>
  </div>
);

// ─── Option helpers ───────────────────────────────────────────────────────────
const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
const toOpt = (v: string | null | undefined) =>
  v ? { value: v, label: v } : null;

const DEPT_OPTS = toOpts([
  "CS - Computer Science",
  "EC - Electronics",
  "AI - Artificial Intelligence",
  "ME - Mechanical",
  "CE - Civil",
]);
const STATUS_OPTS = toOpts(["Active", "Inactive"]);
const PROG_OPTS = toOpts(["BTECH-CSE", "BTECH-ECE", "MTECH-AI", "MBA"]);
const TYPE_OPTS = toOpts(["UG", "PG", "Diploma", "PhD"]);
const BATCH_STATUS_OPTS = toOpts(["Active", "Inactive"]);

// ─── UPLOAD INSTRUCTORS MODAL ─────────────────────────────────────────────────
interface UploadInstructorsModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number | string;
  courseTitle?: string;
  onImportComplete?: () => void;
}

const UploadInstructorsModal = ({
  open,
  onClose,
  courseId,
  courseTitle,
  onImportComplete,
}: UploadInstructorsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useSetState({
    step: 1 as 1 | 2 | 3 | 4,
    selectedFile: null as File | null,
    isDownloading: false,
    isValidating: false,
    isImporting: false,
    validationResult: null as any,
    importResult: null as any,
    dragActive: false,
  });

  useEffect(() => {
    if (open) {
      setState({
        step: 1,
        selectedFile: null,
        isDownloading: false,
        isValidating: false,
        isImporting: false,
        validationResult: null,
        importResult: null,
        dragActive: false,
      });
    }
  }, [open]);

  const handleDownloadTemplate = async () => {
    try {
      setState({ isDownloading: true });
      const response: any = await Models.faculty.downloadInstructorTemplate('xlsx');
      let filename = 'instructor_import_template.xlsx';
      const disposition = response?.headers?.['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"])?([^;\r\n"']*)['"]?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim());
      }
      const blobData =
        response?.data instanceof Blob
          ? response.data
          : response instanceof Blob
            ? response
            : new Blob([response?.data || response], {
              type: response?.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      Success('Template downloaded');
    } catch (err: any) {
      Failure(typeof err === 'string' ? err : err?.message || 'Failed to download template');
    } finally {
      setState({ isDownloading: false });
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      Failure('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setState({ selectedFile: file, step: 2 });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState({ dragActive: false });
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleValidate = async () => {
    if (!state.selectedFile) return;
    try {
      setState({ isValidating: true });
      const result = await Models.faculty.validateInstructorImport(state.selectedFile, courseId);
      setState({ validationResult: result, step: 3, isValidating: false });
    } catch (err: any) {
      Failure(typeof err === 'string' ? err : err?.message || 'Validation failed');
      setState({ isValidating: false });
    }
  };

  const handleImport = async () => {
    if (!state.selectedFile) return;
    try {
      setState({ isImporting: true });
      const result = await Models.faculty.importInstructors(state.selectedFile, courseId);
      setState({ importResult: result, step: 4, isImporting: false });
      Success('Instructors imported successfully');
      onImportComplete?.();
    } catch (err: any) {
      Failure(typeof err === 'string' ? err : err?.message || 'Import failed');
      setState({ isImporting: false });
    }
  };

  const handleReset = () => {
    setState({
      step: 1,
      selectedFile: null,
      validationResult: null,
      importResult: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!open) return null;

  const validRows = state.validationResult?.valid || state.validationResult?.valid_rows || [];
  const invalidRows = state.validationResult?.invalid || state.validationResult?.invalid_rows || state.validationResult?.errors || [];
  const totalValid = typeof state.validationResult?.valid_count === 'number' ? state.validationResult.valid_count : validRows.length;
  const totalInvalid = typeof state.validationResult?.invalid_count === 'number' ? state.validationResult.invalid_count : invalidRows.length;

  const STEP_LABELS = ['Upload File', 'Validate', 'Review', 'Complete'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Upload Instructors</h3>
              {courseTitle && <p className="text-xs text-gray-500">{courseTitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = state.step === stepNum;
              const isDone = state.step > stepNum;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-color2 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                    {isDone ? <Check className="h-3 w-3" /> : stepNum}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-color2' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
                  {i < 3 && <div className={`mx-2 h-px w-8 ${isDone ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {/* Step 1: Download template + Upload file */}
          {state.step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <Download className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Step 1: Download Template</p>
                    <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/70">Download the Excel template, fill in employee numbers, then upload it below.</p>
                    <button
                      onClick={handleDownloadTemplate}
                      disabled={state.isDownloading}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {state.isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      {state.isDownloading ? 'Downloading…' : 'Download Template'}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${state.dragActive
                  ? 'border-color2 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50'
                  }`}
                onDragOver={(e) => { e.preventDefault(); setState({ dragActive: true }); }}
                onDragLeave={() => setState({ dragActive: false })}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Drop your filled template here</p>
                <p className="mt-1 text-xs text-gray-500">or click to browse — .xlsx, .xls, .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          {/* Step 2: File selected, ready to validate */}
          {state.step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{state.selectedFile?.name}</p>
                  <p className="text-xs text-blue-600/70">{((state.selectedFile?.size || 0) / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={handleReset} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-100 hover:text-red-500 dark:hover:bg-blue-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Change File
                </button>
                <button
                  onClick={handleValidate}
                  disabled={state.isValidating}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-color2 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {state.isValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {state.isValidating ? 'Validating…' : 'Validate'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Validation results */}
          {state.step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                  <CheckCircle className="mx-auto h-6 w-6 text-emerald-600" />
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalValid}</p>
                  <p className="text-xs text-emerald-600/70">Valid Records</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
                  <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{totalInvalid}</p>
                  <p className="text-xs text-red-500/70">Invalid Records</p>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-3 dark:border-red-800 dark:bg-red-900/10">
                  <p className="mb-2 text-xs font-bold text-red-700 dark:text-red-400">Issues Found:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {invalidRows.map((row: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-600/90 dark:text-red-400/80">
                        <span className="font-semibold">Row {row.row || row.row_number || idx + 1}:</span> {row.error || row.message || row.reason || JSON.stringify(row)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalValid > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Re-upload
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={state.isImporting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {state.isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {state.isImporting ? 'Importing…' : `Import ${totalValid} Instructor${totalValid !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}

              {totalValid === 0 && (
                <button
                  onClick={handleReset}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Re-upload
                </button>
              )}
            </div>
          )}

          {/* Step 4: Import complete */}
          {state.step === 4 && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Import Complete!</h4>
              <p className="mt-1 text-sm text-gray-500">
                {state.importResult?.imported_count ?? state.importResult?.count ?? totalValid} instructor(s) have been assigned to this course.
              </p>
              <button
                onClick={onClose}
                className="mt-5 rounded-lg bg-color2 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CREATE / EDIT COURSE MODAL ───────────────────────────────────────────────
export interface CourseFormData {
  course_code: string;
  course_title: string;
  status: string;
  is_active: boolean;
  coordinator_id?: number | null;
  instructor_ids?: number[];
}

interface CourseModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: CourseFormData) => void;
  submitting?: boolean;
  departmentOptions?: { value: number | string; label: string }[];
}

export const CreateCourseModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
}: CourseModalProps) => {
  const isEdit = !!initialData;

  const [state, setState] = useSetState({
    code: "",
    title: "",
    status: { value: "Active", label: "Active" } as any,
    coordinator: null as any,
    instructors: [] as any[],
    facultyOptions: [] as any[],
    selectedInstructorToAdd: null as any,
    showUploadModal: false,
  });

  useEffect(() => {
    if (open) {
      // Load faculties for coordinator and instructor dropdowns using dedicated endpoint
      Models.faculty
        .dropdown()
        .then((faculties: any[]) => {
          const opts = (faculties || []).map((f: any) => {
            const facultyId = f.id ?? f.faculty_id;
            const name =
              f.name ||
              `${f.first_name || ""} ${f.last_name || ""}`.trim() ||
              `Faculty #${facultyId}`;
            const secondary = f.register_number || f.email;
            const label = secondary ? `${name} (${secondary})` : name;
            return {
              value: facultyId,
              label,
              id: facultyId,
              faculty_id: facultyId,
              name,
              email: f.email,
              register_number: f.register_number,
              department_id: f.department_id,
              role: f.role,
            };
          });
          setState({ facultyOptions: opts });
        })
        .catch((err) => console.error("Failed to load faculties dropdown", err));

      if (initialData) {
        setState({
          code: initialData.course_code || initialData.code || "",
          title: initialData.course_title || initialData.title || "",
          status: initialData.status
            ? { value: initialData.status, label: initialData.status }
            : { value: "Active", label: "Active" },
          coordinator: null,
          instructors: [],
          selectedInstructorToAdd: null,
        });

        if (initialData.id) {
          Models.faculty
            .getCourseAssignments(initialData.id)
            .then((res: any) => {
              let coordObj = null;
              const coordFacultyId = res?.coordinator?.faculty_id ?? res?.coordinator?.id ?? null;
              if (res?.coordinator) {
                const coord = res.coordinator;
                const facultyId = coordFacultyId;
                const name = coord.name || `Faculty #${facultyId}`;
                const secondary = coord.register_number || coord.email;
                const label = secondary ? `${name} (${secondary})` : name;
                coordObj = {
                  value: facultyId,
                  label,
                  id: facultyId,
                  faculty_id: facultyId,
                  name,
                  email: coord.email,
                  register_number: coord.register_number,
                  role: coord.role,
                };
              }
              const instructorsList = Array.isArray(res?.instructors)
                ? res.instructors
                  .filter((ins: any) => {
                    const fId = ins.faculty_id ?? ins.id;
                    return !coordFacultyId || fId !== coordFacultyId;
                  })
                  .map((ins: any) => {
                    const facultyId = ins.faculty_id ?? ins.id;
                    const name = ins.name || `Faculty #${facultyId}`;
                    const secondary = ins.register_number || ins.email;
                    const label = secondary ? `${name} (${secondary})` : name;
                    return {
                      value: facultyId,
                      label,
                      id: facultyId,
                      faculty_id: facultyId,
                      name,
                      email: ins.email,
                      register_number: ins.register_number,
                      role: ins.role,
                    };
                  })
                : [];
              setState({
                coordinator: coordObj,
                instructors: instructorsList,
              });
            })
            .catch((err) =>
              console.error("Failed to load assignments for course", err)
            );
        }
      } else {
        setState({
          code: "",
          title: "",
          status: { value: "Active", label: "Active" },
          coordinator: null,
          instructors: [],
          selectedInstructorToAdd: null,
        });
      }
    }
  }, [open, initialData]);

  const handleCoordinatorChange = (v: any) => {
    setState({
      coordinator: v,
      instructors: v
        ? state.instructors.filter((ins: any) => ins.value !== v.value)
        : state.instructors,
    });
  };

  const handleAddInstructor = (opt: any) => {
    if (!opt?.value) return;
    if (state.coordinator && opt.value === state.coordinator.value) return;
    const exists = state.instructors.some((i: any) => i.value === opt.value);
    if (!exists) {
      setState({
        instructors: [...state.instructors, opt],
        selectedInstructorToAdd: null,
      });
    } else {
      setState({ selectedInstructorToAdd: null });
    }
  };

  const handleRemoveInstructor = (val: number | string) => {
    setState({
      instructors: state.instructors.filter((i: any) => i.value !== val),
    });
  };

  const handleClearCoordinator = () => {
    setState({ coordinator: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.code.trim()) {
      Failure("Please enter course code");
      return;
    }
    if (!state.title.trim()) {
      Failure("Please enter course title");
      return;
    }

    const payload: CourseFormData = {
      course_code: state.code.trim(),
      course_title: state.title.trim(),
      status: state.status?.value || "Active",
      is_active: (state.status?.value || "Active").toLowerCase() === "active",
      coordinator_id: state.coordinator?.value
        ? Number(state.coordinator.value)
        : null,
      instructor_ids: state.instructors
        .map((i: any) => Number(i.value))
        .filter((id) => Boolean(id) && (!state.coordinator || id !== Number(state.coordinator.value))),
    };

    onSubmit(payload);
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Course" : "Create New Course"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Course Code"
              required
              placeholder="e.g. CS301"
              value={state.code}
              onChange={(e) => setState({ code: e.target.value })}
            />
            <TextInput
              title="Course Title"
              required
              placeholder="e.g. Data Structures"
              value={state.title}
              onChange={(e) => setState({ title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              title="Status"
              options={STATUS_OPTS}
              value={state.status}
              onChange={(v) => setState({ status: v })}
            />
          </div>

          {/* ── COURSE COORDINATOR SECTION (Strictly 1 allowed) ── */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-[#000] dark:text-white">
                Course Coordinator{" "}
                <span className="text-xs font-normal text-gray-500">
                  (Single coordinator)
                </span>
              </label>
              {state.coordinator && (
                <button
                  type="button"
                  onClick={handleClearCoordinator}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Remove Coordinator
                </button>
              )}
            </div>
            <CustomSelect
              options={state.facultyOptions}
              value={state.coordinator}
              onChange={handleCoordinatorChange}
              isClearable
            />
            {state.coordinator && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-2 text-xs dark:border-purple-800 dark:bg-purple-900/20">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-color2 text-[10px] font-bold text-white">
                    {(state.coordinator.label || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-color2">
                      {state.coordinator.label}
                    </span>
                  </div>
                </div>
                <span className="rounded bg-color2 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Coordinator
                </span>
              </div>
            )}
          </div>

          {/* ── COURSE INSTRUCTORS SECTION (Multiple allowed) ── */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-[#000] dark:text-white">
                Course Instructors{" "}
                <span className="text-xs font-normal text-gray-500">
                  (Multiple instructors allowed)
                </span>
              </label>
              {isEdit && initialData?.id && (
                <button
                  type="button"
                  onClick={() => setState({ showUploadModal: true })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                >
                  <Upload className="h-3 w-3" />
                  Upload Instructors
                </button>
              )}
            </div>
            <CustomSelect
              options={state.facultyOptions.filter(
                (f: any) =>
                  (!state.coordinator || f.value !== state.coordinator.value) &&
                  !state.instructors.some((i: any) => i.value === f.value)
              )}
              value={state.selectedInstructorToAdd}
              onChange={handleAddInstructor}
            />

            {state.instructors.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {state.instructors.map((ins: any) => (
                  <span
                    key={ins.value}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>{ins.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstructor(ins.value)}
                      className="ml-1 rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-red-500"
                      title="Remove instructor"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                No instructors assigned yet. Select faculty from the dropdown
                above to assign instructors.
              </p>
            )}
          </div>

          {/* Upload Instructors Modal */}
          {isEdit && initialData?.id && (
            <UploadInstructorsModal
              open={state.showUploadModal}
              onClose={() => setState({ showUploadModal: false })}
              courseId={initialData.id}
              courseTitle={initialData.course_title || initialData.title || state.title}
              onImportComplete={() => {
                // Reload instructors after import
                Models.faculty
                  .getCourseAssignments(initialData.id)
                  .then((res: any) => {
                    const coordFacultyId = res?.coordinator?.faculty_id ?? res?.coordinator?.id ?? null;
                    const instructorsList = Array.isArray(res?.instructors)
                      ? res.instructors
                        .filter((ins: any) => {
                          const fId = ins.faculty_id ?? ins.id;
                          return !coordFacultyId || fId !== coordFacultyId;
                        })
                        .map((ins: any) => {
                          const facultyId = ins.faculty_id ?? ins.id;
                          const name = ins.name || `Faculty #${facultyId}`;
                          const secondary = ins.register_number || ins.email;
                          const label = secondary ? `${name} (${secondary})` : name;
                          return {
                            value: facultyId,
                            label,
                            id: facultyId,
                            faculty_id: facultyId,
                            name,
                            email: ins.email,
                            register_number: ins.register_number,
                            role: ins.role,
                          };
                        })
                      : [];
                    setState({ instructors: instructorsList });
                  })
                  .catch(() => { });
              }}
            />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Course" : "Create Course"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT DEPARTMENT MODAL ──────────────────────────────────────────
export interface DepartmentFormData {
  department_name: string;
  department_short_name: string;
  status: string;
}

interface DeptModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: DepartmentFormData) => void;
  submitting?: boolean;
}

export const CreateDepartmentModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
}: DeptModalProps) => {
  console.log("initialData", initialData)
  const isEdit = !!initialData;
  const [state, setState] = useSetState({
    code: "",
    name: "",
    status: { value: "Active", label: "Active" } as any,
  });

  useEffect(() => {
    if (initialData) {
      setState({
        code: initialData.department_short_name ?? initialData.code ?? "",
        name: initialData.department_name ?? initialData.name ?? "",
        status: toOpt(initialData.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
      });
    } else {
      setState({ code: "", name: "", status: { value: "Active", label: "Active" } });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name?.trim()) {
      Failure("Please enter department name");
      return;
    }
    if (!state.code?.trim()) {
      Failure("Please enter department short name / code");
      return;
    }

    onSubmit({
      department_name: state.name.trim(),
      department_short_name: state.code.trim(),
      status: (state.status?.value ?? "Active").toLowerCase(),
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Department" : "Create New Department"}
      icon={isEdit ? <Edit className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <TextInput
            title="Department Name"
            required
            placeholder="e.g. Computer Science & Engineering"
            value={state.name}
            onChange={(e) => setState({ name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Department Code"
              required
              placeholder="e.g. CSE"
              value={state.code}
              onChange={(e) => setState({ code: e.target.value })}
            />
            <CustomSelect
              title="Status"
              options={STATUS_OPTS}
              value={state.status}
              onChange={(v) => setState({ status: v })}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Department" : "Create Department"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT PROGRAMME MODAL ───────────────────────────────────────────
export interface ProgrammeFormData {
  programme_name: string;
  short_name: string;
  degree_level: string;
  status: string;
}

interface ProgModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: ProgrammeFormData) => void;
  submitting?: boolean;
}

export const CreateProgrammeModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
}: ProgModalProps) => {
  const isEdit = !!initialData;

  const [state, setState] = useSetState({
    name: "",
    short_name: "",
    degree_level: { value: "UG", label: "UG" } as any,
    status: { value: "Active", label: "Active" } as any,
  });

  useEffect(() => {
    if (initialData) {
      setState({
        name: initialData.programme_name ?? initialData.name ?? "",
        short_name: initialData.short_name ?? initialData.code ?? "",
        degree_level: toOpt(initialData.degree_level ?? initialData.type ?? "UG"),
        status: toOpt(initialData.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
      });
    } else {
      setState({
        name: "",
        short_name: "",
        degree_level: { value: "UG", label: "UG" },
        status: { value: "Active", label: "Active" },
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) {
      Failure("Please enter programme name");
      return;
    }
    if (!state.short_name.trim()) {
      Failure("Please enter short name");
      return;
    }

    onSubmit({
      programme_name: state.name.trim(),
      short_name: state.short_name.trim(),
      degree_level: state.degree_level?.value || "UG",
      status: state.status?.value || "Active",
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Programme" : "Create New Programme"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <TextInput
          title="Programme Name"
          required
          placeholder="e.g. B.Tech Computer Science"
          value={state.name}
          onChange={(e) => setState({ name: e.target.value })}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <TextInput
            title="Short Name"
            required
            placeholder="e.g. BTECH-CSE"
            value={state.short_name}
            onChange={(e) => setState({ short_name: e.target.value })}
          />
          <CustomSelect
            title="Degree Level"
            required
            options={TYPE_OPTS}
            value={state.degree_level}
            onChange={(v) => setState({ degree_level: v })}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <CustomSelect
            title="Status"
            options={STATUS_OPTS}
            value={state.status}
            onChange={(v) => setState({ status: v })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Programme" : "Create Programme"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT BATCH MODAL ────────────────────────────────────────────────
export interface BatchFormData {
  name: string;
  start_year: number;
  end_year: number;
  status: string;
  is_active: boolean;
}

interface BatchModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: BatchFormData) => void;
  submitting?: boolean;
  programmeOptions?: { value: number | string; label: string }[];
}

export const CreateBatchModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
}: BatchModalProps) => {
  const isEdit = !!initialData;

  const [state, setState] = useSetState({
    name: "",
    start_year: "",
    end_year: "",
    status: null as any,
  });

  useEffect(() => {
    if (initialData) {
      setState({
        name: initialData.name ?? initialData.batch ?? "",
        start_year: String(initialData.start_year ?? initialData.startYear ?? ""),
        end_year: String(initialData.end_year ?? initialData.endYear ?? ""),
        status: toOpt(initialData.status),
      });
    } else {
      setState({
        name: "",
        start_year: "",
        end_year: "",
        status: null,
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) {
      Failure("Please enter batch name");
      return;
    }
    if (!state.start_year) {
      Failure("Please enter start year");
      return;
    }
    if (!state.end_year) {
      Failure("Please enter end year");
      return;
    }

    onSubmit({
      name: state.name.trim(),
      start_year: Number(state.start_year) || 0,
      end_year: Number(state.end_year) || 0,
      status: state.status?.value || "Draft",
      is_active: (state.status?.value || "Draft").toLowerCase() === "active",
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Batch" : "Create New Batch"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            title="Batch Name"
            required
            placeholder="e.g. Batch 2024-2028"
            value={state.name}
            onChange={(e) => setState({ name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Start Year"
              required
              type="number"
              placeholder="e.g. 2024"
              value={state.start_year}
              onChange={(e) => setState({ start_year: e.target.value })}
            />
            <TextInput
              title="End Year"
              required
              type="number"
              placeholder="e.g. 2028"
              value={state.end_year}
              onChange={(e) => setState({ end_year: e.target.value })}
            />
          </div>
          <CustomSelect
            title="Status"
            options={BATCH_STATUS_OPTS}
            value={state.status}
            onChange={(v) => setState({ status: v })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Batch" : "Create Batch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT PSO MODAL ──────────────────────────────────────────────────
interface PSOModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
}

// export const CreatePSOModal = ({
//   open,
//   onClose,
//   initialData,
// }: PSOModalProps) => {
//   const isEdit = !!initialData;
//   const [state, setState] = useSetState({
//     code: "",
//     programme: null as any,
//     description: "",
//     status: null as any,
//     version: "",
//   });

//   useEffect(() => {
//     if (initialData) {
//       setState({
//         code: initialData.code ?? "",
//         programme: toOpt(initialData.programme),
//         description: initialData.description ?? "",
//         status: toOpt(initialData.status),
//         version: initialData.version ?? "",
//       });
//     } else {
//       setState({
//         code: "",
//         programme: null,
//         description: "",
//         status: null,
//         version: "",
//       });
//     }
//   }, [initialData, open]);

//   return (
//     <ModalShell
//       title={isEdit ? "Edit PSO" : "Create New PSO"}
//       icon={
//         isEdit ? (
//           <Edit className="h-3.5 w-3.5" />
//         ) : (
//           <PlusIcon className="h-3.5 w-3.5" />
//         )
//       }
//       open={open}
//       onClose={onClose}
//     >
//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           onClose();
//         }}
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <TextInput
//             title="PSO Code"
//             required
//             placeholder="e.g. PSO1"
//             value={state.code}
//             onChange={(e) => setState({ code: e.target.value })}
//           />
//           <CustomSelect
//             title="Programme"
//             required
//             options={PROG_OPTS}
//             value={state.programme}
//             onChange={(v) => setState({ programme: v })}
//           />
//         </div>
//         <div className="mt-4">
//           <TextArea
//             title="Description"
//             required
//             rows={3}
//             placeholder="e.g. Apply knowledge of computing..."
//             value={state.description}
//             onChange={(e) => setState({ description: e.target.value })}
//           />
//         </div>
//         <div className="mt-3 grid grid-cols-2 gap-4">
//           <TextInput
//             title="Version"
//             required
//             placeholder="e.g. v1.04"
//             value={state.version}
//             onChange={(e) => setState({ version: e.target.value })}
//           />
//           <CustomSelect
//             title="Status"
//             options={STATUS_OPTS}
//             value={state.status}
//             onChange={(v) => setState({ status: v })}
//           />
//         </div>
//         <ModalFooter
//           onClose={onClose}
//           submitLabel={isEdit ? "Update PSO" : "Create PSO"}
//         />
//       </form>
//     </ModalShell>
//   );
// };

// ─── ENROLL STUDENTS MODAL ────────────────────────────────────────────────────

export interface EnrollableStudent {
  id: string | number;
  regNo: string;
  name: string;
  programme: string;
  batch: string;
  email: string;
}

interface EnrollStudentsModalProps {
  open: boolean;
  onClose: () => void;
  courseCode?: string;
  courseTitle?: string;
  availableStudents?: EnrollableStudent[];
  onEnroll?: (selected: EnrollableStudent[]) => void;
}

export const EnrollStudentsModal = ({
  open,
  onClose,
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  availableStudents = [],
  onEnroll,
}: EnrollStudentsModalProps) => {
  const [state, setState] = useSetState({
    search: "",
    selectedIds: new Set<string | number>(),
  });

  useEffect(() => {
    if (!open) {
      setState({
        search: "",
        selectedIds: new Set(),
      });
    }
  }, [open]);

  const filtered = availableStudents.filter((s) => {
    const q = state.search.toLowerCase();
    return (
      !q ||
      s.regNo.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string | number) => {
    const next = new Set(state.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setState({ selectedIds: next });
  };

  const handleEnroll = () => {
    const selected = availableStudents.filter((s) => state.selectedIds.has(s.id));
    onEnroll?.(selected);
    onClose();
  };

  const count = state.selectedIds.size;

  return (
    <ModalShell
      title="Enroll Students"
      subtitle={`Select existing students to add to ${courseCode} — ${courseTitle}.`}
      icon={<Users className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#000]" />
        <input
          type="text"
          placeholder="Search students..."
          value={state.search}
          onChange={(e) => setState({ search: e.target.value })}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* List label */}
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#000]">
        Available Students ({filtered.length})
      </p>

      {/* Student list */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#000]">No students found.</p>
        ) : (
          filtered.map((student) => {
            const isSelected = state.selectedIds.has(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => toggle(student.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${isSelected
                  ? "border-color2 bg-color2-l"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                {/* checkbox */}
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${isSelected ? "border-color2 bg-color2" : "border-gray-300"
                    }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </span>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-color2" : "text-[#000] dark:text-white"}`}>
                    {student.regNo} — {student.name}
                  </p>
                  <p className="text-xs text-[#000]">
                    {student.programme} • Batch {student.batch}
                  </p>
                  <p className="text-xs text-[#000]">{student.email}</p>
                </div>

                {isSelected && (
                  <span className="shrink-0 rounded-full bg-color2-l px-2.5 py-0.5 text-xs font-semibold text-color2">
                    Selected
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-color2">
          {count > 0 ? `${count} student${count > 1 ? "s" : ""} selected` : ""}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={count === 0}
            onClick={handleEnroll}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${count === 0
              ? "cursor-not-allowed bg-color2/40"
              : "bg-color2 hover:opacity-90"
              }`}
          >
            Enroll {count > 0 ? `${count} Student${count > 1 ? "s" : ""}` : "Student"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── CREATE / EDIT PSO MODAL ──────────────────────────────────────────
export interface PSOFormData {
  organization_id: number;
  pso_code: string;
  description: string;
  version: string;
  programme_id: number;
  department_id: number;
  status: string;
  is_active: boolean;
}

interface PSOModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: PSOFormData) => void;
  submitting?: boolean;
  departmentOptions?: { value: any; label: string }[];
  programmeOptions?: { value: any; label: string }[];
}

export const CreatePSOModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  departmentOptions = [],
  programmeOptions = [],
}: PSOModalProps) => {
  const isEdit = !!initialData;
  const [state, setState] = useSetState({
    pso_code: "",
    description: "",
    version: "v1.0",
    programme: null as any,
    department: null as any,
    status: { value: "Active", label: "Active" } as any,
  });

  useEffect(() => {
    if (initialData) {
      const progVal = initialData.programme_id ?? initialData.programme;
      const deptVal = initialData.department_id ?? initialData.department;
      const matchedProg = programmeOptions.find((p) => String(p.value) === String(progVal));
      const matchedDept = departmentOptions.find((d) => String(d.value) === String(deptVal));

      setState({
        pso_code: initialData.pso_code ?? initialData.code ?? "",
        description: initialData.description ?? "",
        version: initialData.version ?? "v1.0",
        programme: progVal ? { value: progVal, label: matchedProg?.label || initialData.programme_name || String(progVal) } : null,
        department: deptVal ? { value: deptVal, label: matchedDept?.label || initialData.department_name || String(deptVal) } : null,
        status: toOpt(initialData.status?.toLowerCase() === "inactive" || initialData.is_active === false ? "Inactive" : "Active"),
      });
    } else {
      setState({
        pso_code: "",
        description: "",
        version: "v1.0",
        programme: null,
        department: null,
        status: { value: "Active", label: "Active" },
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.pso_code?.trim()) {
      Failure("Please enter PSO Code");
      return;
    }
    if (!state.description?.trim()) {
      Failure("Please enter PSO Description");
      return;
    }

    const payload: PSOFormData = {
      organization_id: getOrganizationId(),
      pso_code: state.pso_code.trim(),
      description: state.description.trim(),
      version: state.version || "v1.0",
      programme_id: Number(state.programme?.value || 0),
      department_id: Number(state.department?.value || 0),
      status: state.status?.value || "Active",
      is_active: (state.status?.value || "Active") === "Active",
    };

    onSubmit(payload);
  };

  return (
    <ModalShell
      title={isEdit ? "Edit PSO" : "Add Programme Specific Outcome (PSO)"}
      icon={isEdit ? <Edit className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            title="PSO Code"
            required
            placeholder="e.g. PSO1"
            value={state.pso_code}
            onChange={(e) => setState({ pso_code: e.target.value })}
          />

          <TextInput
            title="Version"
            placeholder="v1.0"
            value={state.version}
            onChange={(e) => setState({ version: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            title="Academic Programme"
            required
            options={programmeOptions}
            value={state.programme}
            onChange={(v) => setState({ programme: v })}
            placeholder="Select Programme"
          />

          <CustomSelect
            title="Department"
            required
            options={departmentOptions}
            value={state.department}
            onChange={(v) => setState({ department: v })}
            placeholder="Select Department"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#000] dark:text-gray-200">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            className="form-textarea w-full rounded-lg border border-gray-200 p-2.5 text-xs text-[#000] focus:border-color2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Enter detailed outcome description..."
            value={state.description}
            onChange={(e) => setState({ description: e.target.value })}
          />
        </div>

        <CustomSelect
          title="Status"
          options={STATUS_OPTS}
          value={state.status}
          onChange={(v) => setState({ status: v })}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEdit ? "Update PSO" : "Create PSO"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

