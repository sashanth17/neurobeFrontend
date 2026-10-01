import React, { useState, useEffect } from 'react';
import { FileText, ZoomIn, ZoomOut, Check, AlertTriangle, Save, Loader2, Info } from 'lucide-react';
import { MarkExtractionService, LatestExtractionResults, StudentMarks, QuestionMark } from '@/services/markExtraction.service';

export default function ExtractedViewTab({ ciaTestId }: { ciaTestId: number }) {
  const [results, setResults] = useState<LatestExtractionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'AUTO_MAPPED' | 'NEEDS_REVIEW' | 'UNMAPPED'>('AUTO_MAPPED');
  const [selectedStudent, setSelectedStudent] = useState<StudentMarks | null>(null);
  
  // Image Viewer State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    fetchResults();
  }, [ciaTestId]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const data = await MarkExtractionService.getLatestExtractionResults(ciaTestId);
      setResults(data);
      if (data.students && data.students.length > 0) {
        // Auto-select first student that matches the default filter
        const firstMatch = data.students.find(s => s.mapping_status === 'AUTO_MAPPED');
        setSelectedStudent(firstMatch || data.students[0]);
        if (firstMatch && firstMatch.source_pages.length > 0) {
           setActivePage(firstMatch.source_pages[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch extraction results", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (questionKey: string, newValue: number) => {
    if (!selectedStudent) return;
    
    const updatedMarks = selectedStudent.marks.map(m => 
      m.question_key === questionKey ? { ...m, final_mark: newValue, status: 'VERIFIED' } : m
    );
    
    // Auto-recalculate total
    const newTotal = updatedMarks.reduce((sum, m) => sum + (m.final_mark || 0), 0);
    
    setSelectedStudent({
      ...selectedStudent,
      marks: updatedMarks,
      final_total_mark: newTotal
    });
  };

  const saveStudentMarks = async () => {
    if (!selectedStudent) return;
    try {
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        actual_reg_number: selectedStudent.actual_reg_number,
        student_reg_number: selectedStudent.actual_reg_number,
        final_total_mark: selectedStudent.final_total_mark,
        marks: selectedStudent.marks
      });
      // Optionally lock it right away
      await MarkExtractionService.verifyAndLockStudentMarks(selectedStudent.student_marks_id);
      
      // Refresh list to update counts and statuses
      fetchResults();
    } catch (error) {
      console.error("Failed to save marks", error);
    }
  };

  // Filter students
  const filteredStudents = results?.students.filter(s => {
    if (activeFilter === 'AUTO_MAPPED') return s.mapping_status === 'AUTO_MAPPED';
    if (activeFilter === 'NEEDS_REVIEW') return s.verification_status === 'NEEDS_REVIEW' || s.mapping_status === 'NEEDS_REVIEW';
    if (activeFilter === 'UNMAPPED') return s.mapping_status === 'UNMAPPED' || s.mapping_status === 'NO_STUDENT_FOUND';
    return true;
  }) || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option>Latest Extraction Job</option>
          </select>
          {results && (
             <span className="text-sm text-gray-500">
               Total: {results.summary.total_students} | Verified: <span className="text-green-600 font-bold">{results.summary.verified_count}</span>
             </span>
          )}
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(['AUTO_MAPPED', 'NEEDS_REVIEW', 'UNMAPPED'] as const).map(filter => (
             <button 
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`px-4 py-1.5 text-sm font-medium rounded shadow-sm transition-colors
                 ${activeFilter === filter ? 'bg-white dark:bg-gray-700 text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'}
               `}
             >
               {filter.replace('_', ' ')}
               {/* Show counts if available */}
               {results && (
                 <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                   {filter === 'AUTO_MAPPED' ? results.summary.ready_to_verify_count :
                    filter === 'NEEDS_REVIEW' ? results.summary.needs_review_count : 
                    results.summary.remaining_count}
                 </span>
               )}
             </button>
          ))}
        </div>
      </div>

      <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex bg-white dark:bg-gray-800 min-h-0">
        
        {/* Left Side: Image Viewer */}
        <div className="w-1/2 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col relative">
          {/* Zoom & Page Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow backdrop-blur-sm">
            <button onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ZoomOut className="h-4 w-4" /></button>
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
            <div className="text-xs font-mono text-center">{Math.round(zoomLevel * 100)}%</div>
          </div>
          
          {selectedStudent && results?.image_base_url ? (
            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
               <div className="transition-transform origin-top" style={{ transform: `scale(${zoomLevel})` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${results.image_base_url}${activePage}`} 
                    alt="Answer Script" 
                    className="max-w-none bg-white shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-document.svg'; 
                    }}
                  />
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <FileText className="h-12 w-12 mb-2 opacity-50" />
               <p>Select a student to view script</p>
            </div>
          )}
          
          {/* Page Selector Footer */}
          {selectedStudent && selectedStudent.source_pages.length > 0 && (
             <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-center space-x-2">
               {selectedStudent.source_pages.map(pageNum => (
                 <button 
                   key={pageNum}
                   onClick={() => setActivePage(pageNum)}
                   className={`px-3 py-1 rounded text-sm font-medium ${activePage === pageNum ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                 >
                   Page {pageNum}
                 </button>
               ))}
             </div>
          )}
        </div>
        
        {/* Right Side: Mark Entry & List */}
        <div className="w-1/2 flex flex-col">
          {isLoading ? (
             <div className="flex-1 flex items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
             <div className="flex flex-1 overflow-hidden">
                {/* Student List Sidebar */}
                <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No students found.</div>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.map(student => (
                        <li 
                          key={student.student_marks_id}
                          onClick={() => { setSelectedStudent(student); setActivePage(student.source_pages[0] || 1); }}
                          className={`p-3 cursor-pointer transition-colors ${selectedStudent?.student_marks_id === student.student_marks_id ? 'bg-white dark:bg-gray-800 border-l-4 border-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'}`}
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{student.student_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 flex justify-between mt-1">
                             <span>{student.actual_reg_number}</span>
                             {student.verification_status === 'VERIFIED' && <Check className="h-3 w-3 text-green-500" />}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Mark Entry Form */}
                <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-white dark:bg-gray-800">
                  {selectedStudent ? (
                    <>
                      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.student_name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                           <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mr-3">{selectedStudent.actual_reg_number}</span>
                           <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedStudent.mapping_status === 'AUTO_MAPPED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                             {selectedStudent.mapping_status.replace('_', ' ')}
                           </span>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1">
                        {/* Questions List */}
                        {selectedStudent.marks.map((mark, idx) => (
                           <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                             <div className="w-1/4 font-semibold text-gray-700 dark:text-gray-300">
                               {mark.question_key}
                             </div>
                             
                             <div className="w-1/2 flex items-center justify-center space-x-2">
                               <input 
                                 type="number" 
                                 value={mark.final_mark ?? ''}
                                 onChange={(e) => handleMarkChange(mark.question_key, parseFloat(e.target.value))}
                                 className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded-md py-1.5 focus:ring-2 focus:ring-primary dark:bg-gray-800"
                               />
                               <span className="text-gray-400">/</span>
                               <span className="text-gray-600 dark:text-gray-400 w-8 text-center">{mark.max_marks_assigned}</span>
                             </div>

                             <div className="w-1/4 flex justify-end">
                               {mark.status === 'VERIFIED' ? (
                                 <div className="bg-green-100 text-green-600 p-1.5 rounded-full"><Check className="h-4 w-4" /></div>
                               ) : mark.status === 'NEEDS_REVIEW' ? (
                                 <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-full"><AlertTriangle className="h-4 w-4" /></div>
                               ) : (
                                 <div className="bg-red-100 text-red-600 p-1.5 rounded-full"><Info className="h-4 w-4" /></div>
                               )}
                             </div>
                           </div>
                        ))}
                      </div>

                      {/* Footer Totals */}
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                         <div className="flex justify-between items-center mb-4 px-2">
                           <span className="font-bold text-gray-700 dark:text-gray-300">Total Marks</span>
                           <div className="flex items-center font-bold text-lg">
                              <span className={selectedStudent.total_mismatch_flag ? "text-red-500" : "text-gray-900 dark:text-white"}>
                                {selectedStudent.final_total_mark}
                              </span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-gray-500">{selectedStudent.actual_max_mark}</span>
                           </div>
                         </div>
                         <button 
                           onClick={saveStudentMarks}
                           className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition"
                         >
                           <Save className="h-5 w-5" />
                           <span>Update & Verify Student</span>
                         </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Select a student from the list to view and verify marks.
                    </div>
                  )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
