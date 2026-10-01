import React, { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { MarkExtractionService } from '@/services/markExtraction.service';
import * as XLSX from 'xlsx';

export default function ResultPageTab({ ciaTestId }: { ciaTestId: number }) {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVerifiedMarks();
  }, [ciaTestId]);

  const fetchVerifiedMarks = async () => {
    setIsLoading(true);
    try {
      const data = await MarkExtractionService.getVerifiedMarks(ciaTestId);
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch verified marks", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!results || !results.verified_students || results.verified_students.length === 0) {
      alert("No verified students available to download.");
      return;
    }

    const verifiedStudents = results.verified_students;

    // Prepare data rows for Excel
    const excelData = verifiedStudents.map((student: any) => {
      const rowData: any = {
        "Register Number": student.register_number,
        "Student Name": student.student_name,
      };

      // Add each question mark
      student.question_marks.forEach((mark: any) => {
        rowData[mark.q_no] = mark.mark;
      });

      // Add total
      rowData["Total Marks"] = student.total_mark;
      return rowData;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Marks");

    // Generate filename based on metadata
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CIA${ciaTestId}_VerifiedMarks_${dateStr}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, fileName);
  };

  // Filter students for UI display
  const verifiedStudents = results?.verified_students || [];
  
  // Extract dynamic question keys for the table header
  const questionKeys = verifiedStudents.length > 0 ? verifiedStudents[0].question_marks.map((m: any) => m.q_no) : [];

  return (
    <div className="h-full flex flex-col">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">
              Total Verified: {verifiedStudents.length}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleDownloadExcel}
          disabled={verifiedStudents.length === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition
            ${verifiedStudents.length > 0 
              ? 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : verifiedStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50">
            <CheckCircle className="h-12 w-12 mb-2 opacity-30" />
            <p>No verified students available for this test yet.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    Register Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    Student Name
                  </th>
                  {/* Dynamic Question Columns */}
                  {questionKeys.map((key) => (
                    <th key={key} className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      {key}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-extrabold text-primary uppercase tracking-wider whitespace-nowrap bg-primary/10 border-b border-gray-200 dark:border-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {verifiedStudents.map((student: any, index: number) => (
                  <tr key={student.register_number} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {student.register_number}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {student.student_name}
                    </td>
                    {/* Render Marks */}
                    {student.question_marks.map((mark: any, i: number) => (
                      <td key={i} className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {mark.mark}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-center whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50">
                      {student.total_mark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
