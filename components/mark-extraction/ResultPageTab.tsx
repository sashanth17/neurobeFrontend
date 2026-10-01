import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileSpreadsheet, Loader2, CheckCircle2, RefreshCw, Search, 
  Users, Award, TrendingUp, AlertCircle, ShieldCheck, Eye, 
  Unlock, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, 
  ChevronRight, X, FileText, ArrowRight, Layers
} from 'lucide-react';
import { 
  MarkExtractionService, 
  VerifiedMarksResponse, 
  VerifiedMarkStudent,
  VerifiedMarkQuestion
} from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';
import instance from '@/utils/axios.utils';
import * as XLSX from 'xlsx';

interface ResultPageTabProps {
  ciaTestId: number;
  instanceId?: string;
  onGoToExtractedView?: () => void;
  onRefreshCiaTests?: () => void;
}

export default function ResultPageTab({ 
  ciaTestId, 
  instanceId, 
  onGoToExtractedView,
  onRefreshCiaTests 
}: ResultPageTabProps) {
  const [results, setResults] = useState<VerifiedMarksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Pagination State ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // ── Answer Sheet Modal Viewer State ─────────────────────────────────────────
  const [viewingStudent, setViewingStudent] = useState<VerifiedMarkStudent | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // ── In-place Editing State inside Result Modal ───────────────────────────────
  const [isEditingStudent, setIsEditingStudent] = useState<boolean>(false);
  const [editedMarks, setEditedMarks] = useState<Record<string, number>>({});
  const [isSavingMarks, setIsSavingMarks] = useState<boolean>(false);

  // ── Unlock Confirmation Dialog State ────────────────────────────────────────
  const [studentToUnlock, setStudentToUnlock] = useState<VerifiedMarkStudent | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  // ── Fetch Verified Marks ────────────────────────────────────────────────────
  const fetchVerifiedMarks = useCallback(async () => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) return;
    setIsLoading(true);
    try {
      const data = await MarkExtractionService.getVerifiedMarks(ciaTestId);
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch verified marks", error);
    } finally {
      setIsLoading(false);
    }
  }, [ciaTestId]);

  useEffect(() => {
    fetchVerifiedMarks();
  }, [fetchVerifiedMarks]);

  // Fallback: fetch enrollment count if instanceId is provided and backend did not supply it
  useEffect(() => {
    if (!instanceId) return;
    instance()
      .get(`course-enrollments/?course_instance_id=${instanceId}`)
      .then((res: any) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? []);
        if (list && list.length > 0) {
          setEnrolledCount(list.length);
        }
      })
      .catch((err) => console.error("Failed to load enrollment count", err));
  }, [instanceId]);

  const verifiedStudents = useMemo(() => results?.verified_students || [], [results]);
  const totalEnrolled = (results?.total_enrolled && results.total_enrolled > 0) 
    ? results.total_enrolled 
    : enrolledCount;
  const totalVerified = verifiedStudents.length;
  const pctVerified = totalEnrolled > 0 ? Math.min(100, Math.round((totalVerified / totalEnrolled) * 100)) : (totalVerified > 0 ? 100 : 0);

  // Extract dynamic question keys for the table header (parent questions only, naturally sorted)
  const questionKeys = useMemo(() => {
    if (verifiedStudents.length === 0) return [];
    const keysSet = new Set<string>();
    verifiedStudents.forEach(st => {
      (st.question_marks || []).forEach(qm => {
        if (!qm.q_no) return;
        const match = qm.q_no.match(/^(Q\d+)/i);
        const parentKey = match ? match[1].toUpperCase() : qm.q_no.toUpperCase();
        keysSet.add(parentKey);
      });
    });
    // Sort question keys naturally (e.g. Q1, Q2, ..., Q9, Q10, Q11, etc.)
    return Array.from(keysSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [verifiedStudents]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return verifiedStudents;
    const q = searchQuery.toLowerCase().trim();
    return verifiedStudents.filter(
      st =>
        (st.student_name || '').toLowerCase().includes(q) ||
        (st.register_number || '').toLowerCase().includes(q)
    );
  }, [verifiedStudents, searchQuery]);

  // Reset pagination to page 1 on search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Paginated students slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Performance calculations
  const maxMark = verifiedStudents[0]?.max_mark || 50;
  const avgMark = totalVerified > 0 
    ? (verifiedStudents.reduce((sum, s) => sum + (Number(s.total_mark) || 0), 0) / totalVerified).toFixed(1)
    : '0.0';
  const highestMark = totalVerified > 0 
    ? Math.max(...verifiedStudents.map(s => Number(s.total_mark) || 0))
    : 0;

  // ── Open Answer Sheet Viewer Modal ──────────────────────────────────────────
  const handleOpenSheetViewer = (student: VerifiedMarkStudent, startEditing = false) => {
    setViewingStudent(student);
    const pages = Array.isArray(student.source_pages) && student.source_pages.length > 0
      ? student.source_pages.filter(p => typeof p === 'number' && p > 0)
      : [1];
    setViewerPage(pages[0] || 1);
    setZoomLevel(1);
    setRotation(0);
    setImageError(false);
    setIsImageLoading(true);
    setIsEditingStudent(startEditing);

    const initialMarks: Record<string, number> = {};
    (student.question_marks || []).forEach(qm => {
      if (!qm.q_no) return;
      const match = qm.q_no.match(/^(Q\d+)/i);
      const parentKey = match ? match[1].toUpperCase() : qm.q_no.toUpperCase();
      const existing = initialMarks[parentKey];
      if (existing === undefined || qm.mark > existing) {
        initialMarks[parentKey] = qm.mark;
      }
    });
    setEditedMarks(initialMarks);
  };

  const handleCloseSheetViewer = () => {
    setViewingStudent(null);
    setIsEditingStudent(false);
  };

  // ── In-place Save & Re-Lock Marks ─────────────────────────────────────────
  const handleSaveEditedMarks = async () => {
    if (!viewingStudent) return;
    setIsSavingMarks(true);
    try {
      const marksPayload = Object.entries(editedMarks).map(([q_no, mark]) => ({
        q_no,
        question_key: q_no,
        mark: Number(mark) || 0,
        obtained_marks: Number(mark) || 0,
      }));
      const newTotal = Object.values(editedMarks).reduce((acc, v) => acc + (Number(v) || 0), 0);
      const roundedTotal = Math.round(newTotal * 100) / 100;

      await MarkExtractionService.updateConfirmedMarks(ciaTestId, viewingStudent.register_number, {
        marks: marksPayload,
        final_total_mark: roundedTotal,
      });

      const updatedQuestions = canonicalViewingQuestions.map(qm => ({
        ...qm,
        mark: editedMarks[qm.q_no] !== undefined ? editedMarks[qm.q_no] : qm.mark,
      }));
      const updatedStudent: VerifiedMarkStudent = {
        ...viewingStudent,
        question_marks: updatedQuestions,
        total_mark: roundedTotal,
      };

      setViewingStudent(updatedStudent);
      setResults(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          verified_students: prev.verified_students.map(s =>
            s.register_number === viewingStudent.register_number ? updatedStudent : s
          ),
        };
      });

      setIsEditingStudent(false);
      Success(`Marks updated & re-locked for ${viewingStudent.student_name || viewingStudent.register_number}`);
    } catch (err: any) {
      console.error("Failed to save edited marks", err);
      Failure(err?.response?.data?.detail || "Failed to update marks");
    } finally {
      setIsSavingMarks(false);
    }
  };

  // ── Remove from Final Result (Unlock without page reload) ─────────────────
  const handleRemoveFromFinalResults = async (student: VerifiedMarkStudent) => {
    setIsUnlocking(true);
    try {
      await MarkExtractionService.unlockConfirmedMarks(ciaTestId, student.register_number);
      Success(`Student ${student.student_name || student.register_number} unlocked and removed from final results.`);

      setResults(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          verified_students: prev.verified_students.filter(
            s => s.register_number !== student.register_number
          ),
        };
      });
      setStudentToUnlock(null);
      if (viewingStudent?.register_number === student.register_number) {
        setViewingStudent(null);
        setIsEditingStudent(false);
      }
    } catch (err: any) {
      console.error("Failed to unlock student marks", err);
      Failure(err?.response?.data?.detail || "Failed to unlock student marks.");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Download Excel Report
  const handleDownloadExcel = () => {
    if (verifiedStudents.length === 0) {
      alert("No verified students available to download.");
      return;
    }

    const excelData = verifiedStudents.map((student: VerifiedMarkStudent, index: number) => {
      const rowData: Record<string, any> = {
        "S.No": index + 1,
        "Register Number": student.register_number,
        "Student Name": student.student_name,
      };

      // Add each question mark
      const markMap = new Map<string, number>();
      (student.question_marks || []).forEach(m => {
        if (!m.q_no) return;
        const match = m.q_no.match(/^(Q\d+)/i);
        const parentKey = match ? match[1].toUpperCase() : m.q_no.toUpperCase();
        const existing = markMap.get(parentKey);
        if (existing === undefined || m.mark > existing) {
          markMap.set(parentKey, m.mark);
        }
      });
      questionKeys.forEach((key) => {
        rowData[key] = markMap.has(key) ? markMap.get(key) : 0;
      });

      // Section Totals if present
      if (student.section_totals) {
        Object.entries(student.section_totals).forEach(([sec, tot]) => {
          rowData[`${sec} Total`] = tot;
        });
      }

      // Total and Max mark
      rowData["Total Marks"] = student.total_mark;
      rowData["Max Marks"] = student.max_mark || maxMark;
      rowData["Percentage (%)"] = student.max_mark 
        ? Math.round(((student.total_mark / student.max_mark) * 100) * 10) / 10 
        : Math.round(((student.total_mark / maxMark) * 100) * 10) / 10;
      rowData["Status"] = "VERIFIED";

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Marks");

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CIA_${ciaTestId}_Verified_Marks_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Resolve image URL for viewing student: prioritize direct batch_id image route
  const activeImageUrl = useMemo(() => {
    if (!viewingStudent) return '';
    if (viewingStudent.batch_id) {
      return MarkExtractionService.buildImageUrl(viewingStudent.batch_id, viewerPage);
    }
    const base = viewingStudent.image_base_url || results?.image_base_url;
    return MarkExtractionService.resolvePageImageUrl(base, viewerPage);
  }, [viewingStudent, results?.image_base_url, viewerPage]);

  // Reset loading and error flags whenever the active image URL changes
  useEffect(() => {
    if (activeImageUrl) {
      setIsImageLoading(true);
      setImageError(false);
    }
  }, [activeImageUrl]);

  const viewingPagesList = useMemo(() => {
    if (!viewingStudent?.source_pages || viewingStudent.source_pages.length === 0) {
      return [viewerPage || 1];
    }
    return viewingStudent.source_pages.filter(p => typeof p === 'number' && p > 0);
  }, [viewingStudent, viewerPage]);

  // Section checks: suppress unwanted/artificial subsections
  const hasRealSectionTotals = useMemo(() => {
    if (!viewingStudent?.section_totals) return false;
    const validKeys = Object.keys(viewingStudent.section_totals).filter(
      k => k && k.trim() !== '' && !['general', 'none', 'default'].includes(k.trim().toLowerCase())
    );
    return validKeys.length > 0;
  }, [viewingStudent?.section_totals]);

  const hasDistinctSections = useMemo(() => {
    if (!viewingStudent?.question_marks) return false;
    return viewingStudent.question_marks.some(
      qm => qm.section && qm.section.trim() !== '' && !['general', 'none', 'default'].includes(qm.section.trim().toLowerCase())
    );
  }, [viewingStudent?.question_marks]);

  // Canonicalize & naturally sort viewing questions: merge subquestions (Q11B -> Q11)
  const canonicalViewingQuestions = useMemo(() => {
    if (!viewingStudent?.question_marks) return [];
    const map = new Map<string, { q_no: string; mark: number; max_mark: number; section: string }>();
    viewingStudent.question_marks.forEach(qm => {
      if (!qm.q_no) return;
      const match = qm.q_no.match(/^(Q\d+)/i);
      const parentKey = match ? match[1].toUpperCase() : qm.q_no.toUpperCase();
      const existing = map.get(parentKey);
      if (!existing) {
        map.set(parentKey, {
          q_no: parentKey,
          mark: Number(qm.mark) || 0,
          max_mark: Number(qm.max_mark) || 0,
          section: qm.section || '',
        });
      } else {
        const bestMark = (Number(qm.mark) || 0) > existing.mark ? Number(qm.mark) : existing.mark;
        const bestMax = (Number(qm.max_mark) || 0) > existing.max_mark ? Number(qm.max_mark) : existing.max_mark;
        map.set(parentKey, {
          ...existing,
          mark: bestMark,
          max_mark: bestMax,
          section: existing.section || qm.section || '',
        });
      }
    });

    // Natural numerical sort: Q1, Q2, ..., Q9, Q10, Q11, ...
    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.q_no.replace(/\D/g, ''), 10);
      const numB = parseInt(b.q_no.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.q_no.localeCompare(b.q_no);
    });
  }, [viewingStudent?.question_marks]);

  const editedGrandTotal = useMemo(() => {
    if (!isEditingStudent) {
      if (canonicalViewingQuestions.length > 0) {
        return Math.round(canonicalViewingQuestions.reduce((sum, q) => sum + (Number(q.mark) || 0), 0) * 100) / 100;
      }
      return viewingStudent?.total_mark ?? 0;
    }
    const sum = Object.values(editedMarks).reduce((acc, v) => acc + (Number(v) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [isEditingStudent, canonicalViewingQuestions, editedMarks, viewingStudent]);

  return (
    <div className="h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-gray-50/70 dark:bg-gray-900">
      
      {/* ── 1. Top Summary Banner (Verified vs Out of Enrollment) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        
        {/* Card 1: Verified Out of Enrollments */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Verified / Enrolled
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {totalVerified}
              </span>
              <span className="text-sm font-semibold text-gray-400">
                / {totalEnrolled > 0 ? `${totalEnrolled} Enrolled` : 'Total'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${pctVerified}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1.5">
              <span>{pctVerified}% Verified</span>
              <span>{totalEnrolled > totalVerified ? `${totalEnrolled - totalVerified} Remaining` : 'Completed'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Enrolled Roster */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Class Enrollments
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {totalEnrolled > 0 ? totalEnrolled : '—'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Registered students in this course instance
            </p>
          </div>
        </div>

        {/* Card 3: Class Average */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Class Average
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {avgMark}
              </span>
              <span className="text-sm font-semibold text-gray-400">
                / {maxMark}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Average across all {totalVerified} verified submissions
            </p>
          </div>
        </div>

        {/* Card 4: Top Score */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Highest Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {highestMark}
              </span>
              <span className="text-sm font-semibold text-gray-400">
                / {maxMark}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Maximum mark obtained by a student
            </p>
          </div>
        </div>

      </div>

      {/* ── 2. Controls & Actions Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search verified student or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-2xs"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchVerifiedMarks}
            disabled={isLoading}
            title="Refresh verified results"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-600' : ''}`} />
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onGoToExtractedView && (
            <button
              type="button"
              onClick={onGoToExtractedView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition shadow-2xs cursor-pointer"
            >
              <span>Go to Extracted View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Download Excel Report */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={verifiedStudents.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-2xs ${
              verifiedStudents.length > 0
                ? 'bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel Report ({totalVerified})</span>
          </button>
        </div>
      </div>

      {/* ── 3. Main Results Table with Pagination ─────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col shadow-xs min-h-[380px]">
        {isLoading && !results ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Loading verified student results...
            </p>
          </div>
        ) : verifiedStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-750 flex items-center justify-center mb-3 text-gray-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              No Verified Students Yet
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mb-4">
              Students verified and locked in the &ldquo;Extracted View&rdquo; tab will automatically be published and displayed here with their finalized marks.
            </p>
            <button
              type="button"
              onClick={fetchVerifiedMarks}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Again</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-100 dark:divide-gray-750">
                <thead className="bg-gray-50/90 dark:bg-gray-750 sticky top-0 z-10 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Register Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    {/* Dynamic Question Columns */}
                    {questionKeys.map((key) => (
                      <th key={key} className="py-3 px-3 text-center">
                        {key}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Total Marks</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    {/* Action Column in the right corner */}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6 + questionKeys.length} className="py-12 text-center text-xs text-gray-400">
                        No verified students match &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st, idx) => {
                      const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;
                      const markMap = new Map<string, number>();
                      (st.question_marks || []).forEach(m => {
                        if (!m.q_no) return;
                        const match = m.q_no.match(/^(Q\d+)/i);
                        const parentKey = match ? match[1].toUpperCase() : m.q_no.toUpperCase();
                        const existing = markMap.get(parentKey);
                        if (existing === undefined || m.mark > existing) {
                          markMap.set(parentKey, m.mark);
                        }
                      });
                      const stMax = st.max_mark || maxMark;
                      const pct = stMax > 0 ? Math.round((st.total_mark / stMax) * 100) : 0;

                      return (
                        <tr 
                          key={st.register_number || idx} 
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-gray-400">
                            {absoluteIndex}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-violet-700 dark:text-violet-400 whitespace-nowrap">
                            {st.register_number || '—'}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {st.student_name || '—'}
                          </td>
                          {/* Dynamic Question Marks */}
                          {questionKeys.map((qKey) => (
                            <td key={qKey} className="py-3 px-3 text-center font-mono font-medium text-gray-700 dark:text-gray-300">
                              {markMap.has(qKey) ? markMap.get(qKey) : '—'}
                            </td>
                          ))}
                          {/* Total Marks */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                              {st.total_mark}
                            </span>
                            <span className="text-gray-400 font-mono text-xs ml-1">
                              / {stMax}
                            </span>
                            <span className="ml-2 text-[10px] font-semibold text-gray-400">
                              ({pct}%)
                            </span>
                          </td>
                          {/* Status Chip */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                              Verified
                            </span>
                          </td>
                          {/* Right Corner Action Buttons */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* View Answer Sheet Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenSheetViewer(st)}
                                title="View Answer Sheet & Marks"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60 border border-violet-200/80 dark:border-violet-800/80 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              {/* Unlock Button */}
                              <button
                                type="button"
                                onClick={() => setStudentToUnlock(st)}
                                title="Unlock student to edit marks"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:text-gray-400 dark:hover:text-amber-300 border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60 transition cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── 4. Bottom Pagination Controls ─────────────────────────────────── */}
            <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-750/50 border-t border-gray-100 dark:divide-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <span>
                  Showing{' '}
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {filteredStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {Math.min(currentPage * pageSize, filteredStudents.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {filteredStudents.length}
                  </strong>{' '}
                  students
                </span>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-gray-400">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Pagination Next / Prev Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = Math.min(totalPages, currentPage - 2 + i);
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          currentPage === pageNum
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-gray-400 px-1">…</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── 5. Answer Sheet & Result Viewer Modal ───────────────────────────────── */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {viewingStudent.student_name || 'Student Answer Sheet'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                      {viewingStudent.register_number}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Final Approved Answer Sheet & Question Mark Verification
                  </p>
                </div>
              </div>

              {/* Header Right: Score Badge & Actions */}
              <div className="flex items-center gap-3">
                {/* Total Marks Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total:</span>
                  <span className="font-mono font-black text-base text-gray-900 dark:text-white">
                    {viewingStudent.total_mark}
                  </span>
                  <span className="font-mono text-xs text-gray-400">
                    / {viewingStudent.max_mark || maxMark}
                  </span>
                </div>

                {/* Unlock to Edit Action */}
                <button
                  type="button"
                  onClick={() => setStudentToUnlock(viewingStudent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition shadow-2xs cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock to Edit</span>
                </button>

                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={handleCloseSheetViewer}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-750 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split 2-Panel Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-gray-100 dark:bg-gray-900">
              
              {/* ── Left Pane: Answer Sheet Image Viewer (8 cols) ───────────── */}
              <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-750 h-full overflow-hidden">
                
                {/* Image Toolbar */}
                <div className="px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 text-xs">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">Page:</span>
                    <div className="flex items-center gap-1">
                      {viewingPagesList.map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setViewerPage(pageNum);
                            setIsImageLoading(true);
                            setImageError(false);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            viewerPage === pageNum
                              ? 'bg-violet-600 text-white shadow-2xs'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom & Rotation Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.2))}
                      title="Zoom Out"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400 px-1 font-semibold">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))}
                      title="Zoom In"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      title="Reset Zoom"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition ml-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      title="Rotate 90°"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Image Viewport */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-gray-900/10 dark:bg-black/30">
                  {isImageLoading && !imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-2" />
                      <span className="text-xs font-medium text-gray-500">Loading page image...</span>
                    </div>
                  )}

                  {imageError || !activeImageUrl ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                      <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Unable to load page {viewerPage} image
                      </p>
                      <p className="text-xs text-gray-400 max-w-xs mt-1">
                        The scan file may have been moved or the image service is temporarily unreachable.
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="transition-transform duration-150 shadow-xl rounded-lg overflow-hidden bg-white max-w-full"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImageUrl}
                        alt={`Answer sheet page ${viewerPage}`}
                        onLoad={() => setIsImageLoading(false)}
                        onError={() => {
                          setIsImageLoading(false);
                          setImageError(true);
                        }}
                        className="max-h-[70vh] object-contain rounded-lg block"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Pane: Marks Breakdown & In-Place Editing (4 cols) ────── */}
              <div className="lg:col-span-4 flex flex-col bg-white dark:bg-gray-850 h-full overflow-hidden">
                
                {/* Pane Title / Editing Header */}
                {isEditingStudent ? (
                  <div className="p-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Editing Mode (Unlocked)
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      Live Total
                    </span>
                  </div>
                ) : (
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-violet-600" />
                      <span>Verified Marks Breakdown</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingStudent(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock to Edit</span>
                    </button>
                  </div>
                )}

                {/* Scrollable Questions and Sections */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Subsection Totals Banner (Only displayed if template has genuine named sections) */}
                  {hasRealSectionTotals && viewingStudent.section_totals && (
                    <div className="p-3 bg-violet-50/70 dark:bg-violet-950/40 rounded-xl border border-violet-200/80 dark:border-violet-800/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                        Subsection Totals
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(viewingStudent.section_totals).map(([sectionName, subTotal]) => (
                          <div 
                            key={sectionName} 
                            className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-violet-150 dark:border-violet-900/60 flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {sectionName}
                            </span>
                            <span className="font-mono font-black text-xs text-violet-700 dark:text-violet-300">
                              {subTotal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Question Marks Table */}
                  <div className="border border-gray-200 dark:border-gray-750 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Q.No</th>
                          {hasDistinctSections && <th className="py-2.5 px-2">Section</th>}
                          <th className="py-2.5 px-3 text-right">Awarded Mark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800 font-mono">
                        {(canonicalViewingQuestions || []).map((qm, i) => (
                          <tr key={qm.q_no || i} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                            <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                              {qm.q_no}
                            </td>
                            {hasDistinctSections && (
                              <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 text-[11px]">
                                {qm.section || '—'}
                              </td>
                            )}
                            <td className="py-2 px-3 text-right">
                              {isEditingStudent ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min={0}
                                  max={qm.max_mark || 100}
                                  value={editedMarks[qm.q_no] ?? qm.mark}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setEditedMarks(prev => ({
                                      ...prev,
                                      [qm.q_no]: isNaN(val) ? 0 : val
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 text-right font-mono font-black text-sm rounded-lg border border-violet-400 dark:border-violet-600 bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                              ) : (
                                <span className="font-black text-violet-700 dark:text-violet-400 text-sm">
                                  {qm.mark}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Final Total Summary Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {isEditingStudent ? "Calculated Grand Total" : "Grand Total"}
                      </span>
                      <p className="text-[11px] text-gray-400">Sum of all awarded marks</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-gray-900 dark:text-white">
                        {editedGrandTotal}{' '}
                        <span className="text-xs font-normal text-gray-400">
                          / {viewingStudent.max_mark || maxMark}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Helpful Note about Editing */}
                  {isEditingStudent ? (
                    <div className="p-3 bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/80 rounded-xl text-xs text-violet-800 dark:text-violet-300 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-violet-600" />
                        <span>Editing in Place</span>
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Verify against the physical sheet on the left. Click <strong>&ldquo;Save &amp; Re-Lock&rdquo;</strong> to persist changes immediately to the final result, or <strong>&ldquo;Remove from Final&rdquo;</strong> to send back to review.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Need to make changes?</span>
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Click <strong className="font-bold">&ldquo;Unlock to Edit&rdquo;</strong> to modify individual marks directly without leaving this page.
                      </p>
                    </div>
                  )}

                </div>

                {/* Modal Footer with Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800 flex items-center justify-between gap-3">
                  {isEditingStudent ? (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromFinalResults(viewingStudent)}
                          disabled={isUnlocking || isSavingMarks}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition cursor-pointer disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Remove from Final</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingStudent(false)}
                          disabled={isSavingMarks}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveEditedMarks}
                        disabled={isSavingMarks}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {isSavingMarks ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save &amp; Re-Lock</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditingStudent(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock This Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCloseSheetViewer}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white transition cursor-pointer"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── 6. Unlock Confirmation Dialog ─────────────────────────────────────── */}
      {studentToUnlock && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Unlock Student Marks?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Are you sure you want to unlock{' '}
                  <strong className="text-gray-800 dark:text-gray-200">
                    {studentToUnlock.student_name || studentToUnlock.register_number}
                  </strong>
                  ?
                </p>
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
                  <p>• Removes this record from the verified results list immediately.</p>
                  <p>• Unlocks question inputs in Extracted View for mark corrections.</p>
                  <p>• Can be re-verified and republished at any time.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToUnlock(null)}
                disabled={isUnlocking}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = studentToUnlock;
                  setStudentToUnlock(null);
                  handleOpenSheetViewer(target, true);
                }}
                disabled={isUnlocking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Edit Marks in Place</span>
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFromFinalResults(studentToUnlock)}
                disabled={isUnlocking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Remove from Final</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
