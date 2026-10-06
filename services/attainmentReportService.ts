import * as XLSX from 'xlsx';
import { commonInstance } from '@/utils/axios.utils';

export interface AttainmentLevelConfig {
  level: number;
  range: string;
  min_percentage: number;
}

export interface ExtractionQuestionMark {
  question_key: string;
  section_name?: string;
  max_marks_assigned: number;
  system_read?: number;
  final_mark: number;
  confidence?: number;
  status?: string;
  target_co: string;
}

export interface ExtractionCOMark {
  final_mark: number;
  max_marks_assigned: number;
  percentage?: number;
}

export interface ExtractionTest {
  student_marks_id?: number;
  cia_test_id: number;
  cia_test_name: string;
  final_total_mark: number;
  actual_max_mark: number;
  marks?: ExtractionQuestionMark[];
  co_marks?: Record<string, ExtractionCOMark>;
}

export interface ExtractionStudent {
  student_id: string | number;
  register_number: string;
  student_name: string;
  tests: ExtractionTest[];
}

export interface ComprehensiveExtractionResponse {
  course_id: number;
  course_code: string;
  course_name: string;
  students: ExtractionStudent[];
}

// Normalized Data Structures for UI Presentation
export interface NormalizedTestInfo {
  test_id: number;
  test_name: string;
  cos: string[];
  max_marks: Record<string, number>;
}

export interface NormalizedStudentRow {
  student_id: string | number;
  register_no: string;
  name: string;
  // map: test_id -> { co -> mark }
  test_marks: Record<number, Record<string, number | null>>;
  // cumulative mark per CO across all tests
  co_totals: Record<string, number>;
  // question level breakdown if present
  test_details?: Record<number, ExtractionTest>;
}

export interface NormalizedAttainmentData {
  course_id: number;
  course_code: string;
  course_name: string;
  department_name: string;
  academic_year: string;
  year_sem: string;
  course_coordinator: string;
  target_percentage: number;
  total_strength: number;
  tests: NormalizedTestInfo[];
  cos: string[];
  co_max_totals: Record<string, number>;
  students: NormalizedStudentRow[];
  attainment_levels: AttainmentLevelConfig[];
}

export interface COCalculationResult {
  co: string;
  max_marks: number;
  target_value: number;
  students_above_target_count: number;
  percentage_above_target: number;
  attainment_level: number;
}

export interface AttainmentCalculationSummary {
  total_students: number;
  target_percentage: number;
  cos_summary: Record<string, COCalculationResult>;
}

export const DEFAULT_ATTAINMENT_LEVELS: AttainmentLevelConfig[] = [
  { level: 1, range: '60% of the students scored more than target', min_percentage: 60 },
  { level: 2, range: '70% of the students scored more than target', min_percentage: 70 },
  { level: 3, range: '80% of the students scored more than target', min_percentage: 80 },
];

/**
 * Normalizes raw comprehensive-extraction-results from backend into a structured attainment model
 */
export const normalizeComprehensiveExtractionData = (
  raw: ComprehensiveExtractionResponse,
  targetPercentage = 60,
  coordinatorName = ''
): NormalizedAttainmentData => {
  const studentsRaw = raw.students || [];
  const testMap = new Map<number, NormalizedTestInfo>();
  const allCosSet = new Set<string>();

  // Extract unique tests and their maximum marks per CO
  studentsRaw.forEach((student) => {
    (student.tests || []).forEach((test) => {
      const testId = test.cia_test_id;
      if (!testMap.has(testId)) {
        const testCos = Object.keys(test.co_marks || {});
        testCos.forEach((c) => allCosSet.add(c));
        const maxMarks: Record<string, number> = {};
        testCos.forEach((c) => {
          maxMarks[c] = test.co_marks?.[c]?.max_marks_assigned || 0;
        });

        testMap.set(testId, {
          test_id: testId,
          test_name: test.cia_test_name || `CIA ${testId}`,
          cos: testCos,
          max_marks: maxMarks,
        });
      } else {
        // Ensure max marks are captured if first student had 0
        const existing = testMap.get(testId)!;
        Object.entries(test.co_marks || {}).forEach(([coKey, coObj]) => {
          allCosSet.add(coKey);
          if (!existing.cos.includes(coKey)) existing.cos.push(coKey);
          if (coObj.max_marks_assigned && !existing.max_marks[coKey]) {
            existing.max_marks[coKey] = coObj.max_marks_assigned;
          }
        });
      }
    });
  });

  const testsList = Array.from(testMap.values());
  // Sort tests by test_id
  testsList.sort((a, b) => a.test_id - b.test_id);

  // If no COs found in co_marks, check question-level marks
  if (allCosSet.size === 0) {
    studentsRaw.forEach((s) => {
      s.tests?.forEach((t) => {
        t.marks?.forEach((m) => {
          if (m.target_co) allCosSet.add(m.target_co);
        });
      });
    });
  }

  const allCos = Array.from(allCosSet).sort();

  // Calculate total max marks across all tests for each CO
  const coMaxTotals: Record<string, number> = {};
  allCos.forEach((co) => {
    let tot = 0;
    testsList.forEach((t) => {
      tot += t.max_marks[co] || 0;
    });
    coMaxTotals[co] = tot;
  });

  // Build normalized student rows
  const studentsNormalized: NormalizedStudentRow[] = studentsRaw.map((s) => {
    const testMarksMap: Record<number, Record<string, number | null>> = {};
    const coTotals: Record<string, number> = {};
    const testDetailsMap: Record<number, ExtractionTest> = {};

    allCos.forEach((co) => {
      coTotals[co] = 0;
    });

    (s.tests || []).forEach((t) => {
      testDetailsMap[t.cia_test_id] = t;
      testMarksMap[t.cia_test_id] = {};

      allCos.forEach((co) => {
        let finalMark: number | null = null;
        if (t.co_marks?.[co] !== undefined) {
          finalMark = t.co_marks[co].final_mark;
        } else if (t.marks) {
          // Sum up question marks matching this CO
          const qMarks = t.marks.filter((m) => m.target_co === co);
          if (qMarks.length > 0) {
            finalMark = qMarks.reduce((sum, q) => sum + (q.final_mark || 0), 0);
          }
        }

        testMarksMap[t.cia_test_id][co] = finalMark;
        if (finalMark !== null) {
          coTotals[co] = Number((coTotals[co] + finalMark).toFixed(2));
        }
      });
    });

    return {
      student_id: s.student_id,
      register_no: s.register_number,
      name: s.student_name,
      test_marks: testMarksMap,
      co_totals: coTotals,
      test_details: testDetailsMap,
    };
  });

  return {
    course_id: raw.course_id || 1,
    course_code: raw.course_code || 'Ad3391',
    course_name: raw.course_name || 'Data Structures',
    department_name: 'Department of Computer Science and Engineering',
    academic_year: 'ACADEMIC YEAR: 2026 - 2027 (ODD SEMESTER)',
    year_sem: 'II / III',
    course_coordinator: coordinatorName,
    target_percentage: targetPercentage,
    total_strength: studentsNormalized.length,
    tests: testsList,
    cos: allCos,
    co_max_totals: coMaxTotals,
    students: studentsNormalized,
    attainment_levels: DEFAULT_ATTAINMENT_LEVELS,
  };
};

/**
 * Calculates Attainment Summary across COs for the given target %
 */
export const calculateComprehensiveAttainment = (
  data: NormalizedAttainmentData,
  targetPct = data.target_percentage || 60
): AttainmentCalculationSummary => {
  const totalStudents = data.students.length || 1;
  const cosSummary: Record<string, COCalculationResult> = {};

  data.cos.forEach((co) => {
    const maxMarks = data.co_max_totals[co] || 0;
    const targetVal = Number(((maxMarks * targetPct) / 100).toFixed(2));

    let aboveCount = 0;
    data.students.forEach((st) => {
      const scored = st.co_totals[co] || 0;
      if (scored >= targetVal - 0.001) {
        aboveCount++;
      }
    });

    const pctAbove = Number(((aboveCount / totalStudents) * 100).toFixed(2));

    // Determine attainment level
    let level = 0;
    const sortedLevels = [...data.attainment_levels].sort(
      (a, b) => b.min_percentage - a.min_percentage
    );

    for (const lvl of sortedLevels) {
      if (pctAbove >= lvl.min_percentage) {
        level = lvl.level;
        break;
      }
    }

    cosSummary[co] = {
      co,
      max_marks: maxMarks,
      target_value: targetVal,
      students_above_target_count: aboveCount,
      percentage_above_target: pctAbove,
      attainment_level: level,
    };
  });

  return {
    total_students: totalStudents,
    target_percentage: targetPct,
    cos_summary: cosSummary,
  };
};

/**
 * Fetches comprehensive extraction results from the backend API using commonInstance
 */
export const fetchComprehensiveExtractionResults = async (
  courseId?: string | number,
  courseInstanceId?: string | number | null
): Promise<ComprehensiveExtractionResponse> => {
  const targetId = courseId || 1;
  const instanceParam =
    courseInstanceId !== undefined && courseInstanceId !== null && courseInstanceId !== ""
      ? `?course_instance_id=${courseInstanceId}`
      : "";

  const endpointsToTry = [
    `course/api/v1/courses/${targetId}/comprehensive-extraction-results${instanceParam}`,
    `course/api/v1/courses/1/comprehensive-extraction-results${instanceParam}`,
  ];

  for (const endpoint of endpointsToTry) {
    try {
      const res = await commonInstance().get(endpoint);
      if (res?.data && res.data.students && Array.isArray(res.data.students)) {
        return res.data;
      }
    } catch (err: any) {
      console.warn(`[AttainmentService] Failed fetching from ${endpoint}:`, err?.message || err);
      if (err?.response?.status === 401) {
        throw err;
      }
    }
  }

  throw new Error('Failed to load comprehensive extraction results from backend');
};

/**
 * Exports the attainment report to Excel (.xlsx) matching the official Excel layout
 */
export const exportComprehensiveAttainmentToExcel = (
  data: NormalizedAttainmentData,
  summary: AttainmentCalculationSummary,
  fileName?: string
) => {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  // Institutional Header
  rows.push(['KARPAGAM INSTITUTE OF TECHNOLOGY, COIMBATORE - 641105']);
  rows.push([data.department_name]);
  rows.push([data.academic_year]);
  rows.push(['Internal Assessment - Attainment of Course Outcomes (Through Direct Assessment)']);
  rows.push([]);

  // Course Details Table
  rows.push([
    'COURSE CODE',
    null,
    data.course_code,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'YEAR/SEM/CLASS',
    null,
    null,
    null,
    data.year_sem,
  ]);
  rows.push([
    'COURSE TITLE',
    null,
    data.course_name,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'TARGET(%)',
    null,
    null,
    null,
    summary.target_percentage,
  ]);
  if (data.course_coordinator) {
    rows.push([
      'COURSE COORDINATOR',
      null,
      data.course_coordinator,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      'TOTAL STRENGTH',
      null,
      null,
      null,
      data.total_strength,
    ]);
  } else {
    rows.push([
      'TOTAL STRENGTH',
      null,
      data.total_strength,
    ]);
  }
  rows.push([]);

  // Attainment Level Reference
  rows.push(['ATTAINMENT LEVEL', null, 'Level', 'Range']);
  data.attainment_levels.forEach((lvl) => {
    rows.push([null, null, lvl.level, lvl.range]);
  });
  rows.push([]);

  // Table Headers - Row 1
  const headerRow1: any[] = ['S.NO', 'REG NO', 'NAME OF THE STUDENT'];
  data.tests.forEach((test) => {
    headerRow1.push(`${test.test_name.toUpperCase()} - MARKS ALLOTTED`);
    for (let i = 1; i < test.cos.length; i++) {
      headerRow1.push(null);
    }
  });
  headerRow1.push('CO WISE MARKS SCORED');
  for (let i = 1; i < data.cos.length; i++) {
    headerRow1.push(null);
  }
  rows.push(headerRow1);

  // Table Sub-headers - Row 2 (CO labels)
  const headerRow2: any[] = [null, null, null];
  data.tests.forEach((test) => {
    test.cos.forEach((co) => {
      headerRow2.push(co.replace('CO', 'C'));
    });
  });
  data.cos.forEach((co) => {
    headerRow2.push(co.replace('CO', 'C'));
  });
  rows.push(headerRow2);

  // Allotted Marks - Row 3
  const allottedRow: any[] = [null, null, 'MARKS ALLOTTED'];
  data.tests.forEach((test) => {
    test.cos.forEach((co) => {
      allottedRow.push(test.max_marks[co] ?? null);
    });
  });
  data.cos.forEach((co) => {
    allottedRow.push(data.co_max_totals[co] ?? null);
  });
  rows.push(allottedRow);

  // Student Rows
  data.students.forEach((st, idx) => {
    const studentRow: any[] = [idx + 1, st.register_no, st.name];
    data.tests.forEach((test) => {
      test.cos.forEach((co) => {
        studentRow.push(st.test_marks[test.test_id]?.[co] ?? null);
      });
    });
    data.cos.forEach((co) => {
      studentRow.push(st.co_totals[co] ?? 0);
    });
    rows.push(studentRow);
  });

  // Summary Rows
  const totalColCount = headerRow1.length;
  const coStartCol = totalColCount - data.cos.length;

  // CO's Target Value
  const targetRow: any[] = new Array(totalColCount).fill(null);
  targetRow[2] = "CO's Target  Value";
  data.cos.forEach((co, idx) => {
    targetRow[coStartCol + idx] = summary.cos_summary[co]?.target_value ?? 0;
  });
  rows.push(targetRow);

  // No. of Students scored above Target Value
  const countRow: any[] = new Array(totalColCount).fill(null);
  countRow[2] = "No. of Students scored above CO's  Target Value";
  data.cos.forEach((co, idx) => {
    countRow[coStartCol + idx] = summary.cos_summary[co]?.students_above_target_count ?? 0;
  });
  rows.push(countRow);

  // Percentage of Students scored above Target
  const pctRow: any[] = new Array(totalColCount).fill(null);
  pctRow[2] = 'Percentage of Students scored above Target';
  data.cos.forEach((co, idx) => {
    pctRow[coStartCol + idx] = summary.cos_summary[co]?.percentage_above_target ?? 0;
  });
  rows.push(pctRow);

  // CO Attainment
  const attainmentRow: any[] = new Array(totalColCount).fill(null);
  attainmentRow[2] = 'CO Attainment';
  data.cos.forEach((co, idx) => {
    attainmentRow[coStartCol + idx] = summary.cos_summary[co]?.attainment_level ?? 0;
  });
  rows.push(attainmentRow);

  // Graph values
  const graphRow: any[] = new Array(totalColCount).fill(null);
  graphRow[2] = 'CO attainment Values  to  plot the Graph';
  data.cos.forEach((co, idx) => {
    graphRow[coStartCol + idx] = summary.cos_summary[co]?.attainment_level ?? 0;
  });
  rows.push(graphRow);

  // Signature Block
  rows.push([]);
  rows.push([]);
  rows.push([
    'Faculty Incharge                                                                                                                                                                                                      HoD',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const cols = [{ wch: 6 }, { wch: 18 }, { wch: 28 }];
  for (let i = 3; i < totalColCount; i++) {
    cols.push({ wch: 8 });
  }
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, 'Internal Attainment');
  const safeName = (fileName || `${data.course_code}_CO_Attainment_Report.xlsx`).replace(
    /[^a-zA-Z0-9_.-]/g,
    '_'
  );
  XLSX.writeFile(wb, safeName);
};
