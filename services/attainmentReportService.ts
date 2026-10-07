import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
  direct_assessments?: any;
}

export interface DirectAssessmentCO {
  co_code: string;
  mark_obtained: number;
  max_mark: number;
}

export interface ComprehensiveExtractionResponse {
  course_id: number;
  course_code: string;
  course_name: string;
  students: ExtractionStudent[];
  direct_assessments?: DirectAssessmentCO[];
  external_exams?: DirectAssessmentCO[];
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
  // Direct assessments (assignments) per CO
  direct_assessments: DirectAssessmentCO[];
  // External exams (end semester) per CO
  external_exams: DirectAssessmentCO[];
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

// ── Weighted CO Attainment & PO Attainment Types ─────────────────────────────

export interface COPOMatrixEntry {
  id: number;
  course_outcome_id: number;
  po_id: number;
  co_code: string;
  po_code: string;
  matrix_value: number;
  justification?: string;
}

export interface COPOMatrixData {
  copo_id: number;
  matrix_entries: COPOMatrixEntry[];
}

export interface WeightedCOAttainment {
  co: string;
  internal_attainment: number;   // from CIA tests (attainment level)
  direct_assessment_attainment: number; // from direct_assessments (mark_obtained / max_mark * 3)
  external_attainment: number;   // from external_exams (mark_obtained / max_mark * 3)
  // Combined internal = avg of CIA internal_attainment and direct_assessment if both exist
  combined_internal: number;
  total_attainment: number;      // Wint * combined_internal + Wext * external_attainment
}

export interface POAttainmentResult {
  po_code: string;
  attainment_value: number;  // average of (CO attainment * mapping weight / 3) for mapped COs
  contributing_cos: { co: string; co_attainment: number; mapping_value: number }[];
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

  studentsRaw.forEach((student) => {
    if (!student.tests) student.tests = [];

    // Check if the assignment test already exists to avoid duplicates
    if (!student.tests.find(t => t.cia_test_id === 9999)) {
      const assignmentTest: ExtractionTest = {
        cia_test_id: 9999,
        cia_test_name: "Assignment / Mini Project /Tutorial / Seminar",
        final_total_mark: 0,
        actual_max_mark: 0,
        co_marks: {}
      };

      if (student.direct_assessments && Array.isArray(student.direct_assessments)) {
        student.direct_assessments.forEach((da: any) => {
          const coCode = da.co_code || da.co;
          if (coCode) {
            assignmentTest.co_marks![coCode] = {
              final_mark: da.mark_obtained ?? da.mark ?? da.final_mark ?? 0,
              max_marks_assigned: da.max_mark ?? da.max ?? da.max_marks_assigned ?? 10
            };
          }
        });
      } else if (student.direct_assessments && typeof student.direct_assessments === 'object') {
        Object.entries(student.direct_assessments).forEach(([coCode, da]: [string, any]) => {
          assignmentTest.co_marks![coCode] = {
            final_mark: da.mark_obtained ?? da.mark ?? da.final_mark ?? 0,
            max_marks_assigned: da.max_mark ?? da.max ?? da.max_marks_assigned ?? 10
          };
        });
      }

      student.tests.push(assignmentTest);
    }
  });

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

  // Ensure direct_assessments and external_exams COs are included in allCos
  (raw.direct_assessments || []).forEach((da) => {
    if (da.co_code && !allCos.includes(da.co_code)) allCos.push(da.co_code);
  });
  (raw.external_exams || []).forEach((ee) => {
    if (ee.co_code && !allCos.includes(ee.co_code)) allCos.push(ee.co_code);
  });
  allCos.sort();

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
    direct_assessments: raw.direct_assessments || [],
    external_exams: raw.external_exams || [],
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
 * Calculates weighted CO attainment combining internal (CIA + Direct Assessment) and external marks.
 * Internal attainment = CIA test attainment level (from % students above target)
 * Direct Assessment attainment = (mark_obtained / max_mark) * 3 (scaled to 0-3)
 * External attainment = (mark_obtained / max_mark) * 3 (scaled to 0-3)
 * Combined internal = average of CIA and Direct Assessment if both present
 * Total = Wint * combined_internal + Wext * external_attainment
 */
export const calculateWeightedCOAttainment = (
  data: NormalizedAttainmentData,
  ciaSummary: AttainmentCalculationSummary,
  weightInternal: number,
  weightExternal: number
): WeightedCOAttainment[] => {
  return data.cos.map((co) => {
    // CIA internal attainment level (0-3)
    const ciaLevel = ciaSummary.cos_summary[co]?.attainment_level || 0;

    // Direct assessment attainment (scaled 0-3)
    const da = data.direct_assessments.find((d) => d.co_code === co);
    const daAttainment = da && da.max_mark > 0
      ? Number(((da.mark_obtained / da.max_mark) * 3).toFixed(2))
      : 0;

    // External exam attainment (scaled 0-3)
    const ext = data.external_exams.find((e) => e.co_code === co);
    const extAttainment = ext && ext.max_mark > 0
      ? Number(((ext.mark_obtained / ext.max_mark) * 3).toFixed(2))
      : 0;

    // Combined internal: if both CIA and DA exist, average them; otherwise use whichever is available
    let combinedInternal = 0;
    const hasCia = ciaLevel > 0;
    const hasDa = da != null && da.max_mark > 0;
    if (hasCia && hasDa) {
      combinedInternal = Number(((ciaLevel + daAttainment) / 2).toFixed(2));
    } else if (hasCia) {
      combinedInternal = ciaLevel;
    } else if (hasDa) {
      combinedInternal = daAttainment;
    }

    // Total weighted attainment
    const total = Number(
      (weightInternal * combinedInternal + weightExternal * extAttainment).toFixed(2)
    );

    return {
      co,
      internal_attainment: ciaLevel,
      direct_assessment_attainment: daAttainment,
      external_attainment: extAttainment,
      combined_internal: combinedInternal,
      total_attainment: total,
    };
  });
};

/**
 * Calculates PO attainment from weighted CO attainment and the active CO-PO matrix.
 * For each PO: attainment = sum(CO_attainment * mapping_value) / sum(mapping_value)
 * Only COs with non-zero mapping values contribute.
 */
export const calculatePOAttainment = (
  weightedCOs: WeightedCOAttainment[],
  copoMatrix: COPOMatrixData | null
): POAttainmentResult[] => {
  if (!copoMatrix || !copoMatrix.matrix_entries || copoMatrix.matrix_entries.length === 0) {
    return [];
  }

  const entries = copoMatrix.matrix_entries;

  // Build CO attainment lookup
  const coAttainmentMap = new Map<string, number>();
  weightedCOs.forEach((w) => coAttainmentMap.set(w.co, w.total_attainment));

  // Group entries by PO
  const poGroupMap = new Map<string, { po_code: string; entries: COPOMatrixEntry[] }>();
  entries.forEach((e) => {
    const poKey = e.po_code || `PO${e.po_id}`;
    if (!poGroupMap.has(poKey)) {
      poGroupMap.set(poKey, { po_code: poKey, entries: [] });
    }
    poGroupMap.get(poKey)!.entries.push(e);
  });

  const results: POAttainmentResult[] = [];

  const sortedPOs = Array.from(poGroupMap.entries()).sort((a, b) => {
    const numA = parseInt(a[0].replace(/\D/g, '')) || 0;
    const numB = parseInt(b[0].replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  sortedPOs.forEach(([poKey, group]) => {
    const contributing: POAttainmentResult['contributing_cos'] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    group.entries.forEach((entry) => {
      const mappingVal = entry.matrix_value || 0;
      if (mappingVal === 0) return; // skip unmapped COs

      const coCode = entry.co_code || `CO${entry.course_outcome_id}`;
      const coAtt = coAttainmentMap.get(coCode) || 0;

      contributing.push({
        co: coCode,
        co_attainment: coAtt,
        mapping_value: mappingVal,
      });

      weightedSum += coAtt * mappingVal;
      totalWeight += mappingVal;
    });

    const attainmentValue = totalWeight > 0
      ? Number((weightedSum / totalWeight).toFixed(2))
      : 0;

    results.push({
      po_code: group.po_code,
      attainment_value: attainmentValue,
      contributing_cos: contributing,
    });
  });

  return results;
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
export const exportComprehensiveAttainmentToExcel = async (
  data: NormalizedAttainmentData,
  summary: AttainmentCalculationSummary,
  fileName?: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Internal Attainment');

  const setBorder = (cell: ExcelJS.Cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  };

  const setBasicStyle = (cell: ExcelJS.Cell, bold = true, size = 11) => {
    cell.font = { name: 'Times New Roman', size: size, bold: bold };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    setBorder(cell);
  };

  for (let i = 0; i < 5; i++) worksheet.addRow([]);

  worksheet.mergeCells('A1:AB1');
  const a1 = worksheet.getCell('A1');
  a1.value = 'KARPAGAM INSTITUTE OF TECHNOLOGY,';
  a1.font = { bold: true, size: 16, name: 'Times New Roman' };
  a1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:AB2');
  const a2 = worksheet.getCell('A2');
  a2.value = 'COIMBATORE - 641105';
  a2.font = { bold: true, size: 14, name: 'Times New Roman' };
  a2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:AB3');
  const a3 = worksheet.getCell('A3');
  a3.value = data.department_name.toUpperCase();
  a3.font = { bold: true, size: 14, name: 'Times New Roman' };
  a3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:AB4');
  const a4 = worksheet.getCell('A4');
  a4.value = data.academic_year.toUpperCase();
  a4.font = { bold: true, size: 12, name: 'Times New Roman' };
  a4.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A5:AB5');
  const a5 = worksheet.getCell('A5');
  a5.value = 'Internal Assessment - Attainment of Course Outcomes [Through Direct Assessment]';
  a5.font = { bold: true, size: 12, name: 'Times New Roman' };
  a5.alignment = { horizontal: 'center', vertical: 'middle' };
  setBorder(a5);

  let lastColIndex = 3;
  data.tests.forEach(test => { lastColIndex += test.cos.length; });
  lastColIndex += data.cos.length;

  const maxCol = Math.max(lastColIndex, 15);

  worksheet.addRow([]); // Row 6
  worksheet.mergeCells(6, 1, 6, 3); worksheet.getCell(6, 1).value = 'COURSE CODE';
  worksheet.mergeCells(6, 4, 6, 8); worksheet.getCell(6, 4).value = data.course_code;
  worksheet.mergeCells(6, 9, 6, 9); worksheet.getCell(6, 9).value = 'BATCH';
  worksheet.mergeCells(6, 10, 6, maxCol); worksheet.getCell(6, 10).value = '2021-2025';

  worksheet.addRow([]); // Row 7
  worksheet.mergeCells(7, 1, 7, 3); worksheet.getCell(7, 1).value = 'COURSE TITLE';
  worksheet.mergeCells(7, 4, 7, 8); worksheet.getCell(7, 4).value = data.course_name;
  worksheet.mergeCells(7, 9, 7, 9); worksheet.getCell(7, 9).value = 'YEAR/SEM/CLASS';
  worksheet.mergeCells(7, 10, 7, maxCol); worksheet.getCell(7, 10).value = data.year_sem;

  worksheet.addRow([]); // Row 8
  worksheet.mergeCells(8, 1, 8, 3); worksheet.getCell(8, 1).value = 'COURSE COORDINATOR';
  worksheet.mergeCells(8, 4, 8, 8); worksheet.getCell(8, 4).value = data.course_coordinator || '';
  worksheet.mergeCells(8, 9, 8, 9); worksheet.getCell(8, 9).value = 'TARGET(%)';
  worksheet.mergeCells(8, 10, 8, maxCol); worksheet.getCell(8, 10).value = summary.target_percentage;

  worksheet.addRow([]); // Row 9
  worksheet.mergeCells(9, 1, 9, 8);
  worksheet.mergeCells(9, 9, 9, 9); worksheet.getCell(9, 9).value = 'TOTAL STUDENTS';
  worksheet.mergeCells(9, 10, 9, maxCol); worksheet.getCell(9, 10).value = data.total_strength;

  for (let r = 6; r <= 9; r++) {
    for (let c = 1; c <= maxCol; c++) setBasicStyle(worksheet.getCell(r, c));
  }

  worksheet.addRow([]); // Row 10
  worksheet.mergeCells(10, 1, 13, 3);
  worksheet.getCell(10, 1).value = 'ATTAINMENT LEVEL';
  worksheet.getCell(10, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(10, 4, 10, 8); worksheet.getCell(10, 4).value = 'Level';
  worksheet.mergeCells(10, 9, 10, maxCol); worksheet.getCell(10, 9).value = 'Range';

  data.attainment_levels.forEach((lvl, idx) => {
    worksheet.addRow([]);
    let r = 11 + idx;
    worksheet.mergeCells(r, 4, r, 8); worksheet.getCell(r, 4).value = lvl.level;
    worksheet.mergeCells(r, 9, r, maxCol); worksheet.getCell(r, 9).value = lvl.range;
  });

  for (let r = 10; r <= 13; r++) {
    for (let c = 1; c <= maxCol; c++) setBasicStyle(worksheet.getCell(r, c));
  }

  worksheet.addRow([]); // 14
  worksheet.addRow([]); // 15
  worksheet.addRow([]); // 16

  worksheet.mergeCells(14, 1, 16, 1); worksheet.getCell(14, 1).value = 'S.NO';
  worksheet.mergeCells(14, 2, 16, 2); worksheet.getCell(14, 2).value = 'REG NO';
  worksheet.mergeCells(14, 3, 16, 3); worksheet.getCell(14, 3).value = 'NAME OF THE STUDENT';

  let currentCol = 4;
  data.tests.forEach(test => {
    let startCol = currentCol;
    let endCol = currentCol + test.cos.length - 1;
    worksheet.mergeCells(14, startCol, 14, endCol);
    worksheet.getCell(14, startCol).value = `${test.test_name.toUpperCase()} - MARKS ALLOTTED`;
    worksheet.getCell(14, startCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2FF' } };

    test.cos.forEach((co, idx) => {
      worksheet.getCell(15, startCol + idx).value = co.replace('CO', 'C');
      worksheet.getCell(16, startCol + idx).value = test.max_marks[co] ?? 0;
      worksheet.getCell(15, startCol + idx).font = { color: { argb: 'FF0070C0' }, bold: true };
      worksheet.getCell(16, startCol + idx).font = { color: { argb: 'FF0070C0' }, bold: true };
    });
    currentCol = endCol + 1;
  });

  let startCol = currentCol;
  let endCol = currentCol + data.cos.length - 1;
  worksheet.mergeCells(14, startCol, 14, endCol);
  worksheet.getCell(14, startCol).value = 'CO WISE MARKS SCORED';

  data.cos.forEach((co, idx) => {
    worksheet.getCell(15, startCol + idx).value = co.replace('CO', 'C');
    worksheet.getCell(16, startCol + idx).value = data.co_max_totals[co] ?? 0;
    worksheet.getCell(15, startCol + idx).font = { color: { argb: 'FF0070C0' }, bold: true };
    worksheet.getCell(16, startCol + idx).font = { color: { argb: 'FF0070C0' }, bold: true };
  });

  for (let r = 14; r <= 16; r++) {
    for (let c = 1; c <= endCol; c++) setBasicStyle(worksheet.getCell(r, c));
  }

  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 16;
  worksheet.getColumn(3).width = 30;
  for (let i = 4; i <= endCol; i++) worksheet.getColumn(i).width = 8;

  let startStudentRow = 17;
  data.students.forEach((st, idx) => {
    worksheet.addRow([]);
    let rIdx = startStudentRow + idx;
    worksheet.getCell(rIdx, 1).value = idx + 1;
    worksheet.getCell(rIdx, 2).value = st.register_no;
    worksheet.getCell(rIdx, 3).value = st.name;

    let cCol = 4;
    data.tests.forEach(test => {
      test.cos.forEach(co => {
        worksheet.getCell(rIdx, cCol++).value = st.test_marks[test.test_id]?.[co] ?? '';
      });
    });
    data.cos.forEach(co => {
      worksheet.getCell(rIdx, cCol++).value = st.co_totals[co] ?? 0;
    });

    for (let c = 1; c < cCol; c++) {
      let cell = worksheet.getCell(rIdx, c);
      setBorder(cell);
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      if (c > 3) cell.alignment = { horizontal: 'center' };
    }
  });

  let currentLastRow = startStudentRow + data.students.length;

  const summaryLabels = [
    { label: "CO's Target Value", field: 'target_value' },
    { label: "No. of Students scored above CO's Target Value", field: 'students_above_target_count' },
    { label: 'Percentage of Students scored above Target', field: 'percentage_above_target' },
    { label: 'CO Attainment', field: 'attainment_level' },
    { label: 'CO attainment Values to plot the Graph', field: 'attainment_level' }
  ];

  summaryLabels.forEach((item, idx) => {
    let rIdx = currentLastRow + idx;
    worksheet.addRow([]);
    worksheet.mergeCells(rIdx, 1, rIdx, startCol - 1);
    let cell = worksheet.getCell(rIdx, 1);
    cell.value = item.label;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    setBorder(cell);
    for (let c = 1; c < startCol; c++) setBorder(worksheet.getCell(rIdx, c));

    data.cos.forEach((co, coIdx) => {
      let vCell = worksheet.getCell(rIdx, startCol + coIdx);
      vCell.value = summary.cos_summary[co]?.[item.field] ?? 0;
      vCell.font = { name: 'Times New Roman', size: 11, bold: true };
      vCell.alignment = { horizontal: 'center' };
      setBorder(vCell);
    });
  });

  currentLastRow += summaryLabels.length;

  try {
    const labels = data.cos.map((co, idx) => (idx + 1).toString());
    const cData = data.cos.map(co => summary.cos_summary[co]?.attainment_level ?? 0);
    const xLabelString = `Course Outcomes (${data.cos.map(c => c.replace('CO', 'C')).join(',')})`;

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: cData,
          backgroundColor: '#4F81BD',
          borderColor: '#000000',
          borderWidth: 1
        }]
      },
      options: {
        title: {
          display: true,
          text: 'CO ATTAINMENT THROUGH INTERNAL',
          fontColor: '#808080',
          fontSize: 16,
          fontStyle: 'bold'
        },
        legend: { display: false },
        scales: {
          yAxes: [{
            ticks: { min: 0, max: 3, stepSize: 1 },
            scaleLabel: { display: true, labelString: 'Attainment Level', fontStyle: 'bold' }
          }],
          xAxes: [{
            scaleLabel: { display: true, labelString: xLabelString, fontStyle: 'bold' }
          }]
        },
        plugins: {
          datalabels: {
            display: true,
            align: 'end',
            anchor: 'end',
            font: { weight: 'bold', size: 14 }
          }
        }
      }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300&bkg=white`;
    const response = await fetch(chartUrl);
    const arrayBuffer = await response.arrayBuffer();

    const imageId = workbook.addImage({
      buffer: arrayBuffer,
      extension: 'png',
    });

    worksheet.addImage(imageId, {
      tl: { col: 1, row: currentLastRow + 2 },
      ext: { width: 500, height: 300 }
    });

    currentLastRow += 18;
  } catch (err) {
    console.error("Failed to generate chart image:", err);
  }

  // Add empty rows to create space for the chart image
  for (let i = 0; i < 20; i++) {
    worksheet.addRow([]);
  }

  let sigRow = worksheet.addRow([]);
  worksheet.mergeCells(sigRow.number, 1, sigRow.number, 6);
  worksheet.getCell(sigRow.number, 1).value = 'Faculty Incharge';
  worksheet.getCell(sigRow.number, 1).font = { bold: true, name: 'Times New Roman', size: 12 };

  worksheet.mergeCells(sigRow.number, startCol - 2, sigRow.number, endCol);
  worksheet.getCell(sigRow.number, startCol - 2).value = 'HoD';
  worksheet.getCell(sigRow.number, startCol - 2).font = { bold: true, name: 'Times New Roman', size: 12 };
  worksheet.getCell(sigRow.number, startCol - 2).alignment = { horizontal: 'right' };

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = (fileName || `${data.course_code}_CO_Attainment_Report.xlsx`).replace(/[^a-zA-Z0-9_.-]/g, '_');
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, safeName);
};
