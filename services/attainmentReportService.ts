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
