import { useState, useEffect } from "react";
import { Edit, Info, PlusIcon, X } from "lucide-react";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
const toOpt = (v: string | null | undefined) =>
  v ? { value: v, label: v } : null;

const ROLE_OPTS = toOpts([
  "Course Coordinator",
  "Course Instructor",
  "Student",
  "ERP Admin",
]);
const DEPT_OPTS = toOpts([
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Artificial Intelligence",
  "Information Technology",
  "Mechanical Engineering",
]);
const PROG_OPTS = toOpts([
  "B.E. Computer Science and Engineering",
  "B.Tech Electronics & Communication",
  "D.Tech Artificial Intelligence",
  "D.Tech Information Technology",
  "MBA",
]);
const BATCH_OPTS = toOpts([
  "2024-2028",
  "2023-2027",
  "2022-2026",
  "2021-2025",
  "Faculty / Staff",
]);
const STATUS_OPTS = toOpts(["Active", "Inactive", "Locked"]);

const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
};

const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);
  return { visible, closing };
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  renderComponent: any;
}

const CustomSidebar = ({
  open,
  onClose,
  initialData,
  renderComponent,
}: Props) => {
  const isEdit = !!initialData;

  const { visible, closing } = useAnimatedVisibility(open);
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{
          animation: closing
            ? "fadeOut 0.22s ease forwards"
            : "fadeIn 0.22s ease",
        }}
        onClick={onClose}
      />

      {/* Right-side drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
        style={{
          animation: closing
            ? "slideOutRight 0.22s ease forwards"
            : "slideInRight 0.22s ease",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-color2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-200">
              {isEdit ? (
                <Edit className="h-4 w-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#000] dark:text-white">
                {isEdit ? "Edit User" : "Add New User"}
              </h3>
              <p className="mt-0.5 text-xs text-[#000]">
                Fill in user details: role, department, programme and batch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-full border border-gray-400 p-0.5 text-[#000] hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderComponent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="bg-color2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomSidebar;
