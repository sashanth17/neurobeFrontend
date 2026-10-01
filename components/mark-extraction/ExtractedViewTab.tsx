import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, Check, AlertTriangle, Save, Loader2, Info, 
  CheckCircle, AlertCircle, Lock, Search, RotateCw, Maximize2, 
  Sparkles, User, ShieldCheck, RefreshCw
} from 'lucide-react';
import { 
  MarkExtractionService, 
  LatestExtractionResults, 
  StudentMarks, 
  QuestionMark 
} from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';

export default function ExtractedViewTab({ ciaTestId }: { ciaTestId: number }) {
  const [results, setResults] = useState<LatestExtractionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AUTO_MAPPED' | 'NEEDS_REVIEW' | 'UNMAPPED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentMarks | null>(null);
  
  // Image Viewer State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitToBox, setFitToBox] = useState(true);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    fetchResults();
  }, [ciaTestId]);

  const fetchResults = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await MarkExtractionService.getLatestExtractionResults(ciaTestId);
      setResults(data);
      if (data.students && data.students.length > 0) {
        if (selectedStudent) {
          const current = data.students.find((s: StudentMarks) => s.student_marks_id === selectedStudent.student_marks_id);
          if (current) {
            setSelectedStudent(current);
            return;
          }
        }
        // Auto-select first student that matches
        const firstMatch = data.students.find((s: StudentMarks) => s.mapping_status === 'AUTO_MAPPED') || data.students[0];
        setSelectedStudent(firstMatch);
        if (firstMatch && firstMatch.source_pages && firstMatch.source_pages.length > 0) {
          setActivePage(firstMatch.source_pages[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch extraction results", error);
      setLoadError("Unable to load extracted marks. Check that the course service is running, then refresh this view.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (questionKey: string, newValue: number) => {
    if (!selectedStudent) return;
    
    const validVal = isNaN(newValue) ? 0 : newValue;
    const updatedMarks = selectedStudent.marks.map(m => 
      m.question_key === questionKey ? { ...m, final_mark: validVal, status: 'VERIFIED' } : m
    );
    
    // Auto-recalculate total
    const newTotal = updatedMarks.reduce((sum, m) => sum + (Number(m.final_mark) || 0), 0);
    const mismatch = Math.abs(newTotal - (selectedStudent.paper_total_entered || newTotal)) > 0.01;

    setSelectedStudent({
      ...selectedStudent,
      marks: updatedMarks,
      final_total_mark: Math.round(newTotal * 100) / 100,
      total_mismatch_flag: mismatch,
    });
    setHasUnsavedChanges(true);
  };

  // ── Action 1: Update marks only (Save Draft) ──────────────────────────────────
  const handleUpdateMarks = async () => {
    if (!selectedStudent || isUpdating || isVerifying) return;
    setIsUpdating(true);
    try {
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        actual_reg_number: selectedStudent.actual_reg_number,
        student_reg_number: selectedStudent.actual_reg_number,
        final_total_mark: selectedStudent.final_total_mark,
        marks: selectedStudent.marks,
      });
      
      Success("Student marks updated successfully!");
      setHasUnsavedChanges(false);
      await fetchResults();
    } catch (error: any) {
      console.error("Failed to update marks", error);
      Failure(error?.response?.data?.detail || "Failed to update student marks.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Action 2: Verify & lock only after the latest update is saved ─────────────
  const handleVerifyAndLock = async () => {
    if (!selectedStudent || isVerifying || isUpdating) return;
    if (hasUnsavedChanges) {
      Failure("Update the marks before verifying this student.");
      return;
    }
    setIsVerifying(true);
    try {
      await MarkExtractionService.verifyAndLockStudentMarks(selectedStudent.student_marks_id);
      
      Success("Student marks verified and locked successfully!");
      await fetchResults();
    } catch (error: any) {
      console.error("Failed to verify and lock marks", error);
      Failure(error?.response?.data?.detail || "Failed to verify & lock student marks.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Group marks by subsection (e.g. Part A, Part B)
  const groupedQuestions = useMemo(() => {
    if (!selectedStudent?.marks) return {};
    const groups: Record<string, QuestionMark[]> = {};
    for (const m of selectedStudent.marks) {
      const qNum = parseInt(m.question_key.replace(/\D/g, '') || '0', 10);
      const secName = m.section_name || (qNum <= 10 ? 'Part A' : 'Part B');
      if (!groups[secName]) groups[secName] = [];
      groups[secName].push(m);
    }
    return groups;
  }, [selectedStudent?.marks]);

  // Filter students based on active filter and search query
  const filteredStudents = useMemo(() => {
    if (!results?.students) return [];
    return results.students.filter(s => {
      // Status filter
      if (activeFilter === 'AUTO_MAPPED' && s.mapping_status !== 'AUTO_MAPPED') return false;
      if (activeFilter === 'NEEDS_REVIEW' && s.verification_status !== 'NEEDS_REVIEW' && s.mapping_status !== 'NEEDS_REVIEW') return false;
      if (activeFilter === 'UNMAPPED' && s.mapping_status !== 'UNMAPPED' && s.mapping_status !== 'NO_STUDENT_FOUND') return false;
      
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (s.student_name || '').toLowerCase().includes(query);
        const regMatch = (s.actual_reg_number || s.register_number || '').toLowerCase().includes(query);
        return nameMatch || regMatch;
      }
      return true;
    });
  }, [results?.students, activeFilter, searchQuery]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      
      {/* ── Top Header Control Bar ─────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-950/60 rounded-xl text-violet-600 dark:text-violet-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Mark Extraction & Verification
              {results?.course_code && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  {results.course_code}
                </span>
              )}
            </h2>
            {results?.summary && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Total: <strong className="text-gray-700 dark:text-gray-200">{results.summary.total_students}</strong> students • Verified: <strong className="text-emerald-600 font-bold">{results.summary.verified_count}</strong> • Needs Review: <strong className="text-amber-600 font-bold">{results.summary.needs_review_count}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
          {(['ALL', 'AUTO_MAPPED', 'NEEDS_REVIEW', 'UNMAPPED'] as const).map(filter => {
            const count = 
              filter === 'ALL' ? results?.summary?.total_students :
              filter === 'AUTO_MAPPED' ? results?.summary?.ready_to_verify_count :
              filter === 'NEEDS_REVIEW' ? results?.summary?.needs_review_count :
              results?.summary?.remaining_count;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeFilter === filter
                    ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{filter === 'ALL' ? 'All Students' : filter.replace('_', ' ')}</span>
                {count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeFilter === filter
                      ? 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main 3-Column / Split Layout ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* ── COLUMN 1: Student Small Cards Sidebar (1/4 width) ───────────── */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50/70 dark:bg-gray-900/50 flex-shrink-0">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or reg no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400">
              <span>Showing {filteredStudents.length} students</span>
              <button 
                onClick={fetchResults}
                title="Refresh list"
                className="hover:text-violet-600 flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Cards Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={fetchResults}
                  className="mt-2 font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}
            {isLoading && !results ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-2" />
                <span className="text-xs">Loading students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No students match your filter.
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = selectedStudent?.student_marks_id === student.student_marks_id;
                const isVerified = student.is_locked || student.verification_status === 'VERIFIED';
                const hasMismatch = student.total_mismatch_flag;

                return (
                  <button
                    type="button"
                    key={student.student_marks_id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setHasUnsavedChanges(false);
                      if (student.source_pages && student.source_pages.length > 0) {
                        setActivePage(student.source_pages[0]);
                      }
                    }}
                    className={`w-full p-3 rounded-xl cursor-pointer transition-all duration-150 border text-left relative ${
                      isSelected
                        ? 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-500 shadow-xs ring-1 ring-violet-500/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xs'
                    }`}
                  >
                    {/* Selected Active Bar Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-violet-600 rounded-r-md" />
                    )}

                    {/* Top Row: Avatar Initials + Name + Verified Badge / Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isVerified
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isSelected
                            ? 'bg-violet-200 dark:bg-violet-900 text-violet-800 dark:text-violet-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {student.student_name ? student.student_name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
                            {student.student_name || 'Unknown Student'}
                          </p>
                          <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                            {student.actual_reg_number || student.register_number || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      {/* Marks Score Pill */}
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md ${
                          hasMismatch
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            : isVerified
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {student.final_total_mark ?? 0}
                          <span className="text-[10px] font-normal text-gray-400">/{student.actual_max_mark ?? 50}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Extraction Badge + Status Icons */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[11px]">
                      {/* Mapping Status */}
                      <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${
                        student.mapping_status === 'AUTO_MAPPED'
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40'
                          : student.mapping_status === 'NEEDS_REVIEW'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                      }`}>
                        {student.mapping_status === 'AUTO_MAPPED' && <Sparkles className="h-2.5 w-2.5" />}
                        {student.mapping_status === 'NEEDS_REVIEW' && <AlertTriangle className="h-2.5 w-2.5" />}
                        {student.mapping_status?.replace(/_/g, ' ') || 'UNMAPPED'}
                      </span>

                      {/* Verification Status Flag */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Check className="h-3 w-3 stroke-[2.5]" /> Locked
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">
                          {student.source_pages?.length ? `${student.source_pages.length} Pages` : '1 Page'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── COLUMN 2: Answer Sheet Viewer Box (Correctly Fitted) ─────────── */}
        <div className="flex-1 bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col relative h-full overflow-hidden">
          
          {/* Viewer Floating Controls */}
          <div className="px-4 py-2.5 bg-gray-800/90 backdrop-blur-md border-b border-gray-700/80 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2.5">
              <FileText className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-white">Physical Answer Script</span>
              {selectedStudent && (
                <span className="text-[11px] text-gray-300 bg-gray-700/70 px-2 py-0.5 rounded font-mono">
                  {selectedStudent.actual_reg_number || 'Script View'}
                </span>
              )}
            </div>

            {/* Zoom / View controls */}
            <div className="flex items-center space-x-1.5 bg-gray-900/70 rounded-lg p-1 border border-gray-700/60">
              <button 
                onClick={() => { setFitToBox(false); setZoomLevel(z => Math.max(z - 0.15, 0.4)); }} 
                title="Zoom Out"
                className="p-1 hover:bg-gray-700 rounded text-gray-300 transition"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              
              <button 
                onClick={() => { setFitToBox(true); setZoomLevel(1); }}
                title="Fit to box without overflow"
                className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                  fitToBox && zoomLevel === 1 
                    ? 'bg-violet-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Fit Box
              </button>

              <button 
                onClick={() => { setFitToBox(false); setZoomLevel(z => Math.min(z + 0.15, 2.5)); }} 
                title="Zoom In"
                className="p-1 hover:bg-gray-700 rounded text-gray-300 transition"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <button 
                onClick={() => setRotation(r => (r + 90) % 360)} 
                title="Rotate 90°"
                className="p-1 hover:bg-gray-700 rounded text-gray-300 transition"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>

              <span className="text-[11px] font-mono text-gray-400 px-1.5 border-l border-gray-700">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>

          {/* Image Display Canvas - Strictly Fitted */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950/70 relative">
            {selectedStudent && results?.image_base_url ? (
              <div 
                className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={MarkExtractionService.resolvePageImageUrl(results.image_base_url, activePage)} 
                  alt="Scanned Answer Script" 
                  className={
                    fitToBox 
                      ? "h-full w-full max-h-full max-w-full object-contain bg-white rounded-lg shadow-2xl border border-gray-700 transition-all" 
                      : "max-w-none bg-white rounded-lg shadow-2xl border border-gray-700 transition-all"
                  }
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-document.svg'; 
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 py-16">
                <FileText className="h-12 w-12 mb-3 text-violet-400/40" />
                <p className="text-sm font-medium">Select a student card to inspect answer script</p>
                <p className="text-xs text-gray-500 mt-1">Answer scripts are streamed directly from object storage</p>
              </div>
            )}
          </div>

          {/* Bottom Page Tabs Bar */}
          {selectedStudent && selectedStudent.source_pages && selectedStudent.source_pages.length > 0 && (
            <div className="bg-gray-800/90 border-t border-gray-700/80 px-4 py-2 flex items-center justify-between z-10">
              <span className="text-xs text-gray-400">
                Script Pages ({selectedStudent.source_pages.length}):
              </span>
              <div className="flex items-center space-x-1.5">
                {selectedStudent.source_pages.map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setActivePage(pageNum)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      activePage === pageNum 
                        ? 'bg-violet-600 text-white shadow-sm' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Page {pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMN 3: Question Mark Entry & Separate Action Buttons ─────── */}
        <div className="w-[420px] flex flex-col bg-white dark:bg-gray-800 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
          {selectedStudent ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Student Header Summary */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {selectedStudent.student_name || 'Unknown Student'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-gray-200/80 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                        {selectedStudent.actual_reg_number}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedStudent.mapping_status === 'AUTO_MAPPED' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {selectedStudent.mapping_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Lock Indicator */}
                  {selectedStudent.is_locked ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                      Draft
                    </span>
                  )}
                </div>

                {/* Total Mismatch Alert Banner */}
                {selectedStudent.total_mismatch_flag && (
                  <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span>
                      Mismatch: Paper total entered ({selectedStudent.paper_total_entered}) does not match question sum ({selectedStudent.final_total_mark}).
                    </span>
                  </div>
                )}
              </div>

              {/* Questions List Grouped by Subsection */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {Object.keys(groupedQuestions).length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No questions mapped for this student.
                  </div>
                ) : (
                  Object.entries(groupedQuestions).map(([secName, marks]) => {
                    const secSum = marks.reduce((sum, m) => sum + (Number(m.final_mark) || 0), 0);
                    const secMax = marks.reduce((sum, m) => sum + (Number(m.max_marks_assigned) || 0), 0);

                    return (
                      <div key={secName} className="space-y-2">
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-gray-700/80 pb-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
                            {secName} ({marks.length} Questions)
                          </span>
                          <span className="text-[11px] font-semibold text-gray-500">
                            Subtotal: <strong className="text-gray-800 dark:text-gray-200">{secSum}</strong> / {secMax}M
                          </span>
                        </div>

                        {/* Questions inside this subsection */}
                        <div className="space-y-2">
                          {marks.map((mark) => (
                            <div 
                              key={mark.question_key}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700/60 hover:border-gray-300 transition"
                            >
                              {/* Left: Question Key & AI detected mark */}
                              <div className="w-1/3">
                                <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                                  {mark.question_key}
                                </span>
                                {mark.system_read !== undefined && (
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    AI read: {mark.system_read}M
                                  </p>
                                )}
                              </div>

                              {/* Middle: Mark input + Max Marks */}
                              <div className="w-1/3 flex items-center justify-center space-x-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={mark.max_marks_assigned}
                                  step={0.5}
                                  value={mark.final_mark ?? ''}
                                  onChange={(e) => handleMarkChange(mark.question_key, parseFloat(e.target.value))}
                                  disabled={selectedStudent.is_locked}
                                  className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-lg py-1 font-bold text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <span className="text-gray-400 font-medium">/</span>
                                <span className="text-xs font-bold text-gray-500 w-6 text-left">
                                  {mark.max_marks_assigned}
                                </span>
                              </div>

                              {/* Right: Status Icon */}
                              <div className="w-1/3 flex justify-end">
                                {mark.status === 'VERIFIED' ? (
                                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" title="Verified">
                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                  </span>
                                ) : mark.status === 'NEEDS_REVIEW' ? (
                                  <span className="p-1 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" title="Needs Review">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <span className="p-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700" title="Unreviewed">
                                    <Info className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Footer: Totals & SEPARATE Update / Verify Buttons ────────── */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-850">
                {/* Total Marks Banner */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      Total Calculated
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Paper entered: {selectedStudent.paper_total_entered}M
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-extrabold ${
                      selectedStudent.total_mismatch_flag 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {selectedStudent.final_total_mark}
                    </span>
                    <span className="text-sm font-semibold text-gray-400 ml-1">
                      / {selectedStudent.actual_max_mark}
                    </span>
                  </div>
                </div>

                {/* 2 Separate Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Button 1: Update Marks (Save Draft) */}
                  <button
                    type="button"
                    onClick={handleUpdateMarks}
                    disabled={selectedStudent.is_locked || isUpdating || isVerifying}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-semibold text-xs border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    ) : (
                      <Save className="h-4 w-4 text-violet-600" />
                    )}
                    <span>{isUpdating ? "Saving..." : "Update Marks"}</span>
                  </button>

                  {/* Button 2: Verify & Lock Student */}
                  <button
                    type="button"
                    onClick={handleVerifyAndLock}
                    disabled={selectedStudent.is_locked || hasUnsavedChanges || isVerifying || isUpdating}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-semibold text-xs text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedStudent.is_locked
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>{isVerifying ? "Verifying..." : selectedStudent.is_locked ? "Verified & Locked" : "Verify & Lock"}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <User className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium">No student selected</p>
              <p className="text-xs text-gray-400 mt-1">Select a student card from the left column to view and edit marks.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
