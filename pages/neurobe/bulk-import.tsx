import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, getOrganizationId } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import {
  FileText,
  XCircle,
  ArrowRight,
  CheckCircle,
  Upload,
  Check,
  RotateCcw,
  Library,
  Users,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import * as XLSX from "xlsx";

import BulkImportBanner from "@/components/bulk-import/BulkImportBanner";
import ImportProgressStepper from "@/components/bulk-import/ImportProgressStepper";
import DownloadTemplate from "@/components/bulk-import/DownloadTemplate";
import FileUploadDropzone from "@/components/bulk-import/FileUploadDropzone";
import TableComponent from "@/components/common-components/TableComponent";
import Models from "@/imports/models.import";

type ImportType = "user" | "course";

const STEP_STATUS_LABELS: Record<number, string> = {
  1: "Awaiting Upload",
  2: "Validating",
  3: "Reviewing Results",
  4: "Import Complete",
};

const BulkImport = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const reImportInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useSetState({
    importType: "user" as ImportType,
    currentStep: 1,
    selectedFile: null as File | null,
    parsedExcelRows: [] as any[],
    isDownloading: false,
    loading: false,
    isImporting: false,
    isImportCompleted: false,
    skipInvalid: true,
    UserValidationList: null as any,
    CourseValidationList: null as any,
    lastImportedCount: 0,
    lastSkippedCount: 0,
    lastImportType: "user" as ImportType,
    default_password: "",
    showPassword: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Bulk Import"));
  }, []);

  const parseUploadedFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      return rows;
    } catch (err) {
      console.error("Error reading Excel/CSV file:", err);
      return [];
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (file) {
      const rows = await parseUploadedFile(file);
      setState({
        selectedFile: file,
        parsedExcelRows: rows,
        currentStep: 2,
        isImportCompleted: false,
        UserValidationList: null,
        CourseValidationList: null,
      });
    } else {
      setState({
        selectedFile: null,
        default_password:"",
        parsedExcelRows: [],
        currentStep: 1,
        isImportCompleted: false,
        UserValidationList: null,
        CourseValidationList: null,
      });
    }
  };

  const handleReImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    e.target.value = "";
  };

  console.log("selectedFile", state.selectedFile);

  const handleDownload = () => {
    if (state.importType === "user") {
      UserTemplate();
    } else {
      CourseTemplate();
    }
  };

  // API integrations

  const UserTemplate = async () => {
    try {
      setState({ isDownloading: true });
      const response: any = await Models.user_import.downloadTemplate();
      setState({ userTemplate: response });

      let filename = "users_bulk_import_template.csv";
      const disposition = response?.headers?.["content-disposition"];
      if (disposition) {
        const filenameMatch = disposition.match(
          /filename\*?=['"]?(?:UTF-\d['"])?([^;\r\n"']*)['"]?/i
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].trim());
        }
      }

      const blobData =
        response?.data instanceof Blob
          ? response.data
          : response instanceof Blob
          ? response
          : new Blob([response?.data || response], {
              type: response?.headers?.["content-type"] || "text/csv;charset=utf-8;",
            });

      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Success("User template downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading user template:", error);
      Failure(typeof error === "string" ? error : "Failed to download user template");
    } finally {
      setState({ isDownloading: false });
    }
  };

  const CourseTemplate = async () => {
    try {
      setState({ isDownloading: true });
      const response: any = await Models.course_import.downloadTemplate();
      setState({ courseTemplate: response });

      let filename = "courses_bulk_import_template.csv";
      const disposition = response?.headers?.["content-disposition"];
      if (disposition) {
        const filenameMatch = disposition.match(
          /filename\*?=['"]?(?:UTF-\d['"])?([^;\r\n"']*)['"]?/i
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].trim());
        }
      }

      const blobData =
        response?.data instanceof Blob
          ? response.data
          : response instanceof Blob
          ? response
          : new Blob([response?.data || response], {
              type: response?.headers?.["content-type"] || "text/csv;charset=utf-8;",
            });

      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Success("Course template downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading course template:", error);
      Failure(typeof error === "string" ? error : "Failed to download course template");
    } finally {
      setState({ isDownloading: false });
    }
  };

  const handleCancel = () => {
    setState({
      selectedFile: null,
      default_password: "",
      parsedExcelRows: [],
      currentStep: 1,
      isImportCompleted: false,
      UserValidationList: null,
      CourseValidationList: null,
      loading: false,
      isImporting: false,
      lastImportedCount: 0,
      lastSkippedCount: 0,
    });
  };

  const validateFile = async () => {
    try {
      if (state.selectedFile) {
        setState({ loading: true });

        if (!state.parsedExcelRows || state.parsedExcelRows.length === 0) {
          const rows = await parseUploadedFile(state.selectedFile);
          if (rows.length > 0) {
            setState({ parsedExcelRows: rows });
          }
        }

        const orgId = getOrganizationId();
        if (state.importType === "user") {
          const response: any = await Models.user_import.validate(
            state.selectedFile,
            orgId,
            state.default_password
          );
          Success("User validation completed");
          setState({
            UserValidationList: response,
            currentStep: 3,
            loading: false,
          });
          console.log("response", response);
        } else {
          const response: any = await Models.course_import.validate(
            state.selectedFile,
            orgId,
            state.default_password
          );
          Success("Course validation completed");
          setState({
            CourseValidationList: response,
            currentStep: 3,
            loading: false,
          });
          console.log("response", response);
        }
      } else {
        Failure("Please select a file to validate");
      }
    } catch (error: any) {
      console.log("error", error);
      setState({ loading: false });
      Failure(typeof error === "string" ? error : error?.message || "Validation failed");
    }
  };

  const rawValidationData =
    state.importType === "user"
      ? state.UserValidationList
      : state.CourseValidationList;

  const validationData = rawValidationData?.data || rawValidationData;

  const totalRows = validationData?.total_rows ?? 0;
  const validRows = validationData?.valid_rows_count ?? 0;
  const invalidRows =
    validationData?.invalid_rows_count ??
    (validationData?.errors?.length ?? 0);

  const importFile = async () => {
    try {
      if (state.selectedFile) {
        setState({ isImporting: true });
        const orgId = getOrganizationId();
        const currentType = state.importType;
        const currentValid = validRows;
        const currentInvalid = invalidRows;
        const default_password = state.default_password;

        if (state.importType === "user") {
          const response: any = await Models.user_import.import(state.selectedFile, orgId, default_password);
          Success("Users imported successfully");
          const finalImported =
            response?.data?.imported_count ?? response?.imported_count ?? currentValid;
          const finalSkipped =
            response?.data?.skipped_count ?? response?.skipped_count ?? currentInvalid;

          setState({
            isImporting: false,
            currentStep: 4,
            isImportCompleted: true,
            selectedFile: null,
            default_password:"",
            lastImportedCount: finalImported,
            lastSkippedCount: finalSkipped,
            lastImportType: currentType,
          });
          console.log("response", response);
        } else {
          const response: any = await Models.course_import.import(state.selectedFile, orgId, default_password);
          Success("Courses imported successfully");
          const finalImported =
            response?.data?.imported_count ?? response?.imported_count ?? currentValid;
          const finalSkipped =
            response?.data?.skipped_count ?? response?.skipped_count ?? currentInvalid;

          setState({
            isImporting: false,
            currentStep: 4,
            isImportCompleted: true,
            selectedFile: null,
            default_password:"",
            lastImportedCount: finalImported,
            lastSkippedCount: finalSkipped,
            lastImportType: currentType,
          });
          console.log("response", response);
        }
      } else {
        Failure("Please select a file");
      }
    } catch (error: any) {
      console.log("error", error);
      setState({ isImporting: false });
      Failure(typeof error === "string" ? error : error?.message || "Import failed");
    }
  };

  const findVal = (rowObj: any, ...keys: string[]) => {
    if (!rowObj || typeof rowObj !== "object") return undefined;
    for (const k of keys) {
      if (
        rowObj[k] !== undefined &&
        rowObj[k] !== null &&
        String(rowObj[k]).trim() !== ""
      ) {
        return rowObj[k];
      }
    }
    const cleanKeys = keys.map((k) => k.toLowerCase().replace(/[\s_\-]/g, ""));
    for (const objK of Object.keys(rowObj)) {
      const cleanObjK = objK.toLowerCase().replace(/[\s_\-]/g, "");
      if (cleanKeys.includes(cleanObjK)) {
        if (
          rowObj[objK] !== undefined &&
          rowObj[objK] !== null &&
          String(rowObj[objK]).trim() !== ""
        ) {
          return rowObj[objK];
        }
      }
    }
    return undefined;
  };

  const extractCourseDetails = (rowObj: any) => {
    if (!rowObj || typeof rowObj !== "object") {
      return {
        courseCode: "",
        courseTitle: "",
        ltpc: "—",
        theoryHours: "—",
        labHours: "—",
      };
    }

    const courseCode =
      findVal(
        rowObj,
        "Course Code",
        "course_code",
        "code",
        "CourseCode",
        "course",
        "subject_code"
      ) || "";

    const courseTitle =
      findVal(
        rowObj,
        "Course Title",
        "course_title",
        "title",
        "CourseTitle",
        "Course Name",
        "course_name",
        "name",
        "subject_name"
      ) || "";

    let ltpc = findVal(
      rowObj,
      "L-T-P-C",
      "ltpc",
      "LTPC",
      "L-T-P-C-",
      "l_t_p_c",
      "ltp_c"
    );
    const lVal = findVal(rowObj, "L", "lecture", "lecture_hours", "lectures");
    const tVal = findVal(rowObj, "T", "tutorial", "tutorial_hours", "tutorials");
    const pVal = findVal(rowObj, "P", "practical", "practical_hours", "practicals", "lab");
    const cVal = findVal(rowObj, "C", "credits", "credit", "total_credits");

    if (!ltpc && (lVal !== undefined || pVal !== undefined || cVal !== undefined)) {
      const l = lVal !== undefined ? Number(lVal) || 0 : 0;
      const t = tVal !== undefined ? Number(tVal) || 0 : 0;
      const p = pVal !== undefined ? Number(pVal) || 0 : 0;
      const c =
        cVal !== undefined ? Number(cVal) || 0 : l + t + Math.floor(p / 2);
      ltpc = `${l}-${t}-${p}-${c}`;
    }

    let theoryHours = findVal(
      rowObj,
      "Theory Hours",
      "theory_hours",
      "THEORY HOURS",
      "theory",
      "total_theory_hours",
      "theory_hour"
    );
    if (theoryHours === undefined || theoryHours === null || theoryHours === "") {
      if (lVal !== undefined) {
        theoryHours = (Number(lVal) || 0) * 15;
      } else if (ltpc && typeof ltpc === "string" && ltpc.includes("-")) {
        const parts = ltpc.split("-");
        theoryHours = (Number(parts[0]) || 0) * 15;
      }
    }

    let labHours = findVal(
      rowObj,
      "Lab Hours",
      "lab_hours",
      "LAB HOURS",
      "lab",
      "total_lab_hours",
      "lab_hour"
    );
    if (labHours === undefined || labHours === null || labHours === "") {
      if (pVal !== undefined) {
        labHours = (Number(pVal) || 0) * 15;
      } else if (ltpc && typeof ltpc === "string" && ltpc.includes("-")) {
        const parts = ltpc.split("-");
        labHours = (Number(parts[2]) || 0) * 15;
      }
    }

    return {
      courseCode: String(courseCode || "").trim(),
      courseTitle: String(courseTitle || "").trim(),
      ltpc: String(ltpc || "—").trim(),
      theoryHours:
        theoryHours !== undefined && theoryHours !== null && theoryHours !== ""
          ? theoryHours
          : "—",
      labHours:
        labHours !== undefined && labHours !== null && labHours !== ""
          ? labHours
          : "—",
    };
  };

  const formatLtpc = (item: any) => {
    if (!item) return "—";
    if (item.ltpc) return item.ltpc;
    const l = item.l ?? item.lecture_hours;
    const t = item.t ?? item.tutorial_hours ?? 0;
    const p = item.p ?? item.practical_hours ?? 0;
    const c = item.c ?? item.credits ?? 0;
    if (l !== undefined && l !== null && l !== "") {
      return `${l}-${t}-${p}-${c}`;
    }
    return "—";
  };

  const getSuggestedCorrection = (
    field: string,
    errorMsg: string,
    isCourse = false
  ) => {
    if (!errorMsg) return "—";
    const lowerField = (field || "").toLowerCase();
    const lowerErr = (errorMsg || "").toLowerCase();

    if (isCourse || lowerField.includes("course")) {
      if (
        lowerErr.includes("already exist") ||
        lowerErr.includes("duplicate") ||
        (lowerField.includes("code") && lowerErr.includes("exist"))
      ) {
        return "Enter a unique course code or enable update mode.";
      }
      if (lowerErr.includes("title") || lowerField.includes("title")) {
        return "Enter a valid Course Title";
      }
      if (
        lowerErr.includes("credit") ||
        lowerErr.includes("ltpc") ||
        lowerField.includes("credit")
      ) {
        return "Verify L-T-P-C values and total credits";
      }
      if (lowerErr.includes("department")) {
        return "Select a Department associated with this organization";
      }
      if (lowerErr.includes("hour")) {
        return "Verify Theory and Lab hours";
      }
      return "Enter a unique course code or enable update mode.";
    }

    if (lowerErr.includes("email") || lowerField === "email") {
      return "Enter a valid institutional email";
    }
    if (
      lowerErr.includes("register") ||
      lowerField.includes("register") ||
      lowerField === "reg_no" ||
      lowerField === "register_number"
    ) {
      return "Enter a unique register number";
    }
    if (
      lowerErr.includes("first name") ||
      lowerField === "first_name" ||
      lowerField === "firstname"
    ) {
      return "Enter First Name";
    }
    if (
      lowerErr.includes("last name") ||
      lowerField === "last_name" ||
      lowerField === "lastname"
    ) {
      return "Enter Last Name";
    }
    if (lowerField === "department" || lowerErr.includes("department")) {
      return "Select a Department associated with this organization";
    }
    if (lowerField === "programme" || lowerErr.includes("programme")) {
      return "Select a Programme associated with the selected Department";
    }
    if (lowerField === "batch" || lowerErr.includes("batch")) {
      return "Select a Batch associated with this organization";
    }
    if (lowerErr.includes("required") || lowerErr.includes("missing")) {
      return `Provide the required ${field || "field"}`;
    }
    if (lowerErr.includes("duplicate")) {
      return `Enter a unique ${field || "value"}`;
    }
    if (lowerErr.includes("not found")) {
      return `Select a ${field || "record"} associated with this organization`;
    }
    return `Check and correct ${field || "row data"}`;
  };

  const deriveNameFromIdentifier = (identifier: string) => {
    if (!identifier || typeof identifier !== "string") return "";
    if (identifier.includes("@")) {
      const localPart = identifier.split("@")[0];
      const words = localPart.split(/[._-]+/).filter(Boolean);
      if (words.length > 0) {
        return words
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ");
      }
    }
    return identifier;
  };

  const extractSuggestion = (
    errObj: any,
    defaultField: string = "",
    defaultErrMsg: string = "",
    isCourse: boolean = false
  ): string => {
    if (!errObj) return "—";

    const raw =
      errObj.suggestion ??
      errObj.suggestions ??
      errObj.suggested_correction ??
      errObj.suggestedCorrection;

    if (raw !== undefined && raw !== null) {
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.filter(Boolean).join(", ");
      }
      if (typeof raw === "string" && raw.trim() !== "") {
        return raw.trim();
      }
      if (typeof raw === "object") {
        const vals = Object.values(raw).filter(Boolean);
        if (vals.length > 0) return vals.join(", ");
      }
    }

    if (defaultErrMsg) {
      return getSuggestedCorrection(defaultField || errObj.field || "", defaultErrMsg, isCourse);
    }

    return "—";
  };

  const validationRecords = (() => {
    if (!validationData) return [];

    const isCourse = state.importType === "course";
    const records: any[] = [];
    const errorRowsSet = new Set<number>();

    // ── CASE 1: Parse Course rows directly from uploaded Excel sheet ──────────
    if (isCourse && Array.isArray(state.parsedExcelRows) && state.parsedExcelRows.length > 0) {
      const errorByRowNum = new Map<number, any>();
      const errorByCode = new Map<string, any>();

      if (Array.isArray(validationData.errors)) {
        validationData.errors.forEach((err: any) => {
          const r = Number(err.row);
          if (!isNaN(r)) errorByRowNum.set(r, err);
          const code = String(
            err.course_code || err.code || err.identifier || ""
          )
            .trim()
            .toLowerCase();
          if (code) errorByCode.set(code, err);
        });
      }

      const hasRowOne = errorByRowNum.has(1);

      state.parsedExcelRows.forEach((excelRow: any, idx: number) => {
        const displayRowNum = idx + 1;
        const details = extractCourseDetails(excelRow);

        let rowError =
          errorByRowNum.get(displayRowNum) ||
          (!hasRowOne ? errorByRowNum.get(displayRowNum + 1) : null);

        if (!rowError && details.courseCode) {
          rowError = errorByCode.get(details.courseCode.toLowerCase());
        }

        const isError = Boolean(rowError);
        const errorMsg = rowError?.error || "";
        const isDuplicate = Boolean(
          errorMsg.toLowerCase().includes("duplicate") ||
            errorMsg.toLowerCase().includes("already exist")
        );

        const suggestionVal = isError
          ? extractSuggestion(
              rowError,
              rowError?.field || "course_code",
              errorMsg,
              true
            )
          : "—";

        records.push({
          id: `excel-course-${idx}`,
          row: displayRowNum,
          rowNumber: `Row ${displayRowNum}`,
          courseCode:
            details.courseCode || rowError?.course_code || rowError?.code || "—",
          courseTitle:
            details.courseTitle ||
            rowError?.course_title ||
            rowError?.title ||
            "—",
          ltpc: details.ltpc,
          theoryHours: details.theoryHours,
          labHours: details.labHours,
          isDuplicate,
          error: errorMsg,
          suggestion: suggestionVal,
          suggestedCorrection: suggestionVal,
          status: isError ? "Error" : "Valid",
        });
      });

      return records;
    }

    // ── CASE 2: Parse User rows directly from uploaded Excel sheet ────────────
    if (!isCourse && Array.isArray(state.parsedExcelRows) && state.parsedExcelRows.length > 0) {
      const errorByRowNum = new Map<number, any>();
      const errorByIdentifier = new Map<string, any>();

      if (Array.isArray(validationData.errors)) {
        validationData.errors.forEach((err: any) => {
          const r = Number(err.row);
          if (!isNaN(r)) errorByRowNum.set(r, err);
          const idStr = String(err.identifier || err.email || "")
            .trim()
            .toLowerCase();
          if (idStr) errorByIdentifier.set(idStr, err);
        });
      }

      const hasRowOne = errorByRowNum.has(1);

      state.parsedExcelRows.forEach((excelRow: any, idx: number) => {
        const displayRowNum = idx + 1;
        const email =
          findVal(excelRow, "Email", "email", "institutional_email") || "";
        const regNo =
          findVal(
            excelRow,
            "Register Number",
            "register_number",
            "reg_no",
            "regNo"
          ) || "";
        const fName =
          findVal(excelRow, "First Name", "first_name", "firstname", "name") ||
          "";
        const lName =
          findVal(excelRow, "Last Name", "last_name", "lastname") || "";
        const explicitName = `${fName} ${lName}`.trim();
        const displayName = explicitName || deriveNameFromIdentifier(email);

        let rowError =
          errorByRowNum.get(displayRowNum) ||
          (!hasRowOne ? errorByRowNum.get(displayRowNum + 1) : null);

        if (!rowError && email) {
          rowError = errorByIdentifier.get(email.toLowerCase());
        }

        const isError = Boolean(rowError);
        const errorMsg = rowError?.error || "";
        const suggestionVal = isError
          ? extractSuggestion(rowError, rowError?.field || "", errorMsg, false)
          : "—";

        records.push({
          id: `excel-user-${idx}`,
          row: displayRowNum,
          rowNumber: `Row ${displayRowNum}`,
          field: rowError?.field || "—",
          identifier: email || "—",
          name: displayName,
          regNo: regNo || "",
          error: errorMsg,
          suggestion: suggestionVal,
          suggestedCorrection: suggestionVal,
          status: isError ? "Error" : "Valid",
        });
      });

      return records;
    }

    // ── CASE 3: Fallback from API validation response (preview & errors) ──────
    const previewMap = new Map<number, any>();
    if (Array.isArray(validationData.preview)) {
      validationData.preview.forEach((item: any, idx: number) => {
        const rowNum = Number(item.row) || idx + 1;
        previewMap.set(rowNum, item);
      });
    }

    if (Array.isArray(validationData.errors)) {
      validationData.errors.forEach((err: any, idx: number) => {
        const rowNum = Number(err.row) || idx + 1;
        errorRowsSet.add(rowNum);
        const prev = previewMap.get(rowNum) || {};

        if (isCourse) {
          const errDetails = extractCourseDetails(err);
          const prevDetails = extractCourseDetails(prev);

          const courseCode =
            errDetails.courseCode ||
            prevDetails.courseCode ||
            err.course_code ||
            err.code ||
            err.identifier ||
            prev.course_code ||
            prev.code ||
            "—";
          const courseTitle =
            errDetails.courseTitle ||
            prevDetails.courseTitle ||
            err.course_title ||
            err.title ||
            err.name ||
            prev.course_title ||
            prev.title ||
            "—";
          const ltpc =
            errDetails.ltpc !== "—"
              ? errDetails.ltpc
              : prevDetails.ltpc !== "—"
              ? prevDetails.ltpc
              : formatLtpc(err) !== "—"
              ? formatLtpc(err)
              : formatLtpc(prev);
          const theoryHours =
            errDetails.theoryHours !== "—"
              ? errDetails.theoryHours
              : prevDetails.theoryHours !== "—"
              ? prevDetails.theoryHours
              : err.theory_hours ??
                err.total_theory_hours ??
                err.theory ??
                prev.theory_hours ??
                prev.total_theory_hours ??
                prev.theory ??
                0;
          const labHours =
            errDetails.labHours !== "—"
              ? errDetails.labHours
              : prevDetails.labHours !== "—"
              ? prevDetails.labHours
              : err.lab_hours ??
                err.total_lab_hours ??
                err.lab ??
                prev.lab_hours ??
                prev.total_lab_hours ??
                prev.lab ??
                0;
          const isDuplicate = Boolean(
            (err.error || "").toLowerCase().includes("duplicate") ||
              (err.error || "").toLowerCase().includes("already exist")
          );

          const suggestionVal = extractSuggestion(
            err,
            err.field || "course_code",
            err.error,
            true
          );

          records.push({
            id: `err-${idx}`,
            row: rowNum,
            rowNumber: `Row ${rowNum}`,
            courseCode,
            courseTitle,
            ltpc,
            theoryHours,
            labHours,
            isDuplicate,
            error: err.error,
            suggestion: suggestionVal,
            suggestedCorrection: suggestionVal,
            status: "Error",
          });
        } else {
          const explicitName =
            err.name ||
            (err.first_name
              ? `${err.first_name} ${err.last_name || ""}`.trim()
              : "");
          const rawIdentifier = err.identifier || err.email || "";
          const displayName =
            explicitName || deriveNameFromIdentifier(rawIdentifier);

          const suggestionVal = extractSuggestion(
            err,
            err.field || "",
            err.error,
            false
          );

          records.push({
            id: `err-${idx}`,
            row: rowNum,
            rowNumber: `Row ${rowNum}`,
            field: err.field || "—",
            identifier: rawIdentifier || "—",
            name: displayName,
            regNo: err.reg_no || err.regNo || err.register_number || "",
            error: err.error,
            suggestion: suggestionVal,
            suggestedCorrection: suggestionVal,
            status: "Error",
          });
        }
      });
    }

    if (Array.isArray(validationData.preview)) {
      validationData.preview.forEach((item: any, idx: number) => {
        const rowNum = Number(item.row) || idx + 1;
        if (!errorRowsSet.has(rowNum)) {
          if (isCourse) {
            const details = extractCourseDetails(item);
            records.push({
              id: `prev-${idx}`,
              row: rowNum,
              rowNumber: `Row ${rowNum}`,
              courseCode:
                details.courseCode ||
                item.course_code ||
                item.code ||
                item.identifier ||
                "—",
              courseTitle:
                details.courseTitle ||
                item.course_title ||
                item.title ||
                item.name ||
                "—",
              ltpc: details.ltpc !== "—" ? details.ltpc : formatLtpc(item),
              theoryHours:
                details.theoryHours !== "—"
                  ? details.theoryHours
                  : item.theory_hours ??
                    item.total_theory_hours ??
                    item.theory ??
                    0,
              labHours:
                details.labHours !== "—"
                  ? details.labHours
                  : item.lab_hours ?? item.total_lab_hours ?? item.lab ?? 0,
              isDuplicate: false,
              error: "",
              suggestion: "—",
              suggestedCorrection: "—",
              status: "Valid",
            });
          } else {
            const explicitName =
              item.name ||
              (item.first_name
                ? `${item.first_name} ${item.last_name || ""}`.trim()
                : "");
            const rawIdentifier = item.email || item.identifier || "";
            const displayName =
              explicitName || deriveNameFromIdentifier(rawIdentifier);

            records.push({
              id: `prev-${idx}`,
              row: rowNum,
              rowNumber: `Row ${rowNum}`,
              field: "—",
              identifier: rawIdentifier || "—",
              name: displayName,
              regNo: item.reg_no || item.regNo || item.register_number || "",
              error: "",
              suggestion: "—",
              suggestedCorrection: "—",
              status: "Valid",
            });
          }
        }
      });
    }

    records.sort((a, b) => (Number(a.row) || 0) - (Number(b.row) || 0));
    return records;
  })();

  const userValidationColumns = [
    {
      accessor: "rowNumber",
      title: "ROW NUMBER",
      render: ({ rowNumber }: any) => (
        <span className="font-semibold text-gray-800 dark:text-white text-sm">
          {rowNumber}
        </span>
      ),
    },
    {
      accessor: "field",
      title: "FIELD",
      render: ({ field }: any) =>
        field && field !== "—" ? (
          <span className="inline-block rounded-md border border-gray-200 bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold capitalize text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {field.replace(/_/g, " ")}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      accessor: "identifier",
      title: "USER DETAILS",
      render: ({ identifier, name, regNo }: any) => {
        const hasSecondary =
          identifier &&
          identifier !== "—" &&
          name &&
          name !== "—" &&
          identifier.toLowerCase() !== name.toLowerCase();

        return (
          <div className="flex flex-col py-0.5">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {name || identifier || "—"}
              {regNo ? (
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  {" "}
                  • {regNo}
                </span>
              ) : null}
            </span>
            {hasSecondary && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {identifier}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessor: "error",
      title: "ERROR",
      render: ({ error }: any) =>
        error ? (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-normal leading-relaxed text-red-500">
              {error}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      accessor: "suggestion",
      title: "SUGGESTED CORRECTION",
      render: ({ suggestion, suggestedCorrection }: any) => {
        const val = suggestion || suggestedCorrection;
        return val && val !== "—" ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {val}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({ status }: any) =>
        status === "Valid" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-white px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-600 dark:bg-gray-800 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Valid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400 bg-white px-3 py-0.5 text-xs font-semibold text-red-500 dark:border-red-600 dark:bg-gray-800 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Error
          </span>
        ),
    },
  ];

  const courseValidationColumns = [
    {
      accessor: "rowNumber",
      title: "ROW NO",
      render: ({ rowNumber }: any) => (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {rowNumber}
        </span>
      ),
    },
    {
      accessor: "courseCode",
      title: "COURSE CODE",
      render: ({ courseCode, isDuplicate }: any) => (
        <div className="flex flex-col items-start py-0.5">
          <span className="inline-block rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {courseCode || "—"}
          </span>
          {isDuplicate && (
            <span className="mt-0.5 text-[10px] font-semibold text-red-500">
              Duplicate
            </span>
          )}
        </div>
      ),
    },
    {
      accessor: "courseTitle",
      title: "COURSE TITLE",
      render: ({ courseTitle }: any) => (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {courseTitle || "—"}
        </span>
      ),
    },
    {
      accessor: "ltpc",
      title: "L-T-P-C",
      render: ({ ltpc }: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {ltpc || "—"}
        </span>
      ),
    },
    {
      accessor: "theoryHours",
      title: "THEORY HOURS",
      render: ({ theoryHours }: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {theoryHours !== undefined && theoryHours !== null ? theoryHours : "—"}
        </span>
      ),
    },
    {
      accessor: "labHours",
      title: "LAB HOURS",
      render: ({ labHours }: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {labHours !== undefined && labHours !== null ? labHours : "—"}
        </span>
      ),
    },
    {
      accessor: "error",
      title: "ERROR",
      render: ({ error }: any) =>
        error ? (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-normal leading-relaxed text-red-500">
              {error}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      accessor: "suggestion",
      title: "SUGGESTED CORRECTION",
      render: ({ suggestion, suggestedCorrection, error }: any) => {
        const val = suggestion || suggestedCorrection;
        return error && val && val !== "—" ? (
          <div className="max-w-xs rounded-lg bg-gray-50 p-2 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {val}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({ status }: any) =>
        status === "Valid" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-white px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-600 dark:bg-gray-800 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Valid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400 bg-white px-3 py-0.5 text-xs font-semibold text-red-500 dark:border-red-600 dark:bg-gray-800 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Error
          </span>
        ),
    },
  ];

  const validationColumns =
    state.importType === "course"
      ? courseValidationColumns
      : userValidationColumns;

  return (
    <div className="min-h-screen">
      {/* Banner — import type toggle */}
      <BulkImportBanner
        importType={state.importType}
        onTypeChange={(type) =>
          setState({
            importType: type,
            currentStep: 1,
            selectedFile: null,
            default_password:"",
            parsedExcelRows: [],
            UserValidationList: null,
            CourseValidationList: null,
          })
        }
      />

      {/* Progress stepper */}
      <ImportProgressStepper
        currentStep={state.currentStep}
        statusLabel={STEP_STATUS_LABELS[state.currentStep]}
      />

      {/* Hidden file input for Re-importing corrected sheet */}
      <input
        ref={reImportInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleReImportFileChange}
      />

      {/* Step 4: Import Complete Screen (matches attached screenshot) */}
      {state.currentStep === 4 ? (
        <div className="panel flex flex-col items-center justify-center py-16 px-6 text-center shadow-sm rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          {/* Green check circular badge */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f8ee] dark:bg-green-900/30 mb-4">
            <Check className="h-7 w-7 text-[#12b76a] dark:text-green-400 stroke-[2.5]" />
          </div>

          {/* Heading */}
          <h3 className="text-2xl font-bold text-[#101828] dark:text-white">
            Import Complete
          </h3>

          {/* Green success text */}
          <p className="mt-2 text-base font-semibold text-[#039855] dark:text-green-400">
            {state.lastImportedCount}{" "}
            {state.lastImportType === "course" ? "courses" : "users"} imported successfully.
          </p>

          {/* Skipped / Error text */}
          {state.lastSkippedCount > 0 && (
            <p className="mt-1 text-sm text-[#667085] dark:text-gray-400">
              {state.lastSkippedCount} rows were not imported due to validation errors.
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                if (state.lastImportType === "course") {
                  router.push("/neurobe/academic-setup?tab=courses");
                } else {
                  router.push("/neurobe/user-list");
                }
              }}
              className="create-btn"
            >
              {state.lastImportType === "course" ? (
                <Library className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span>
                {state.lastImportType === "course" ? "View Courses" : "View Users"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="create-btn-sec"
            >
              <RotateCcw className="h-4 w-4 text-[#344054] dark:text-gray-300" />
              <span>Return to Bulk Import</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Two-column content area */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Download template */}
            <div className="panel px-6 py-6">
              <DownloadTemplate
                importType={state.importType}
                onDownload={handleDownload}
                loading={state.isDownloading}
              />
            </div>

            {/* File upload */}
            <div className="panel flex flex-col justify-between px-6 py-6">
              <FileUploadDropzone
                onFileSelect={handleFileSelect}
                Validate={validateFile}
                loading={state.loading}
                file={state.selectedFile}
              />

              {state.importType === "user" && (
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <Lock className="h-3.5 w-3.5 text-color2" />
                      <span>Default Password for Users</span>
                    </label>
                    <span className="text-[11px] font-medium text-gray-400">Fallback</span>
                  </div>
                  <div className="relative">
                    <input
                      type={state.showPassword ? "text" : "password"}
                      value={state.default_password || ""}
                      onChange={(e) => setState({ default_password: e.target.value })}
                      placeholder="Enter default password (e.g. Welcome@123)"
                      className="form-input h-9 pr-9 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setState({ showPassword: !state.showPassword })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {state.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    If any user in the sheet does not have a password, this password will be set as their default.
                  </p>
                </div>
              )}
            </div>
          </div>

          {state.loading && (
            <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-color2 border-t-transparent" />
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Validating {state.importType === "user" ? "users" : "courses"} data...
              </p>
              <p className="text-xs text-gray-400">Please wait while rows are checked</p>
            </div>
          )}

          {validationData && !state.loading && (
            <>
              {/* Summary Cards */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
                <div className="flex flex-col justify-between space-y-2 rounded-2xl border border-gray-200 bg-white p-5 text-[#000] shadow-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Total Rows
                  </p>
                  <span className="text-3xl font-bold text-[#000] dark:text-white">
                    {totalRows}
                  </span>
                  <p className="text-xs text-gray-400">Rows in Uploaded File</p>
                </div>

                <div className="flex flex-col justify-between space-y-2 rounded-2xl border border-gray-200 bg-white p-5 text-[#000] shadow-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Ready to Move
                  </p>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {validRows}
                  </span>
                  <p className="text-xs text-gray-400">Ready for import</p>
                </div>

                <div className="flex flex-col justify-between space-y-2 rounded-2xl border border-gray-200 bg-white p-5 text-[#000] shadow-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                    Rows with error
                  </p>
                  <span className="text-3xl font-bold text-red-500 dark:text-red-400">
                    {invalidRows}
                  </span>
                  <p className="text-xs text-gray-400">Require Corrections</p>
                </div>
              </div>

              {/* Validation Results Table matching attached screenshot */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    <h3 className="section-ti">
                      Validation Results
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Showing {validationRecords.length} of {validationRecords.length}{" "}
                    {state.importType === "course" ? "courses" : "rows"}
                  </span>
                </div>

                {/* Table */}
                <TableComponent
                  records={validationRecords}
                  columns={validationColumns}
                  loading={state.loading}
                  pageSize={10}
                  showPagination={validationRecords.length > 10}
                  paginationLabel={state.importType === "course" ? "courses" : "rows"}
                  noRecordsText="No validation records found"
                />

                {/* Default Password bar for User Import */}
                {state.importType === "user" && (
                  <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-3.5 dark:border-gray-700 dark:bg-gray-800/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-color2-l/60 dark:bg-color2/20">
                          <Lock className="h-4 w-4 text-color2" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Default Password for Imported Users
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Set as default for any user in the sheet without a password
                          </p>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <input
                          type={state.showPassword ? "text" : "password"}
                          value={state.default_password || ""}
                          onChange={(e) => setState({ default_password: e.target.value })}
                          placeholder="Enter default password (e.g. Welcome@123)"
                          className="form-input h-9 pr-9 text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setState({ showPassword: !state.showPassword })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {state.showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                  {validRows > 0 ? (
                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={state.skipInvalid}
                        onChange={(e) => setState({ skipInvalid: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 accent-[#7c3aed] text-color2 focus:ring-color2"
                      />
                      <span>
                        Skip invalid rows ({invalidRows}) and import valid{" "}
                        {state.importType === "user" ? "users" : "courses"} ({validRows}) only
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>
                        All {invalidRows} rows contain validation errors. Please re-import a corrected file.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>

                    {invalidRows > 0 && (
                      <button
                        type="button"
                        onClick={() => reImportInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg border border-color2 bg-color2-l/40 px-4 py-2 text-sm font-semibold text-color2 hover:bg-color2-l transition-all dark:border-color2 dark:bg-color2/20 dark:text-white"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Re-import Corrected Excel Sheet</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={importFile}
                      disabled={
                        validRows === 0 ||
                        (!state.skipInvalid && invalidRows > 0) ||
                        state.isImporting
                      }
                      className="flex items-center gap-2 rounded-lg bg-color2 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        {state.isImporting
                          ? "Importing..."
                          : `Import Valid ${
                              state.importType === "user" ? "Users" : "Courses"
                            } (${validRows})`}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PrivateRouter(BulkImport);
