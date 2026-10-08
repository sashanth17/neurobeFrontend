import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Sparkles,
  BookOpen,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  Building,
  Calendar,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Models from "@/imports/models.import";
import instance, { commonInstance } from "@/utils/axios.utils";
import { getOrganizationId, Success, Failure, getErrorMessage } from "@/utils/function.utils";

interface CoursePortfolioReportProps {
  courseId: string | number;
  portfolio?: any;
  courseMetadata?: any;
  onRefresh?: () => void;
}

/** Format hours decimal into strict hh:mm format */
export const formatHHMM = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "00:00";
  const h = Number(val);
  if (isNaN(h)) return "00:00";
  const totalMins = Math.round(h * 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const CoursePortfolioReport: React.FC<CoursePortfolioReportProps> = ({
  courseId,
  portfolio,
  courseMetadata,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [activeCopo, setActiveCopo] = useState<any>(null);
  const [activeExt, setActiveExt] = useState<any>(null);
  const [activeLp, setActiveLp] = useState<any>(null);
  const [activePed, setActivePed] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // ── 1. Fetch all required artifacts & organization details ────────────────
  const loadAllReportData = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      // 1. Organization Details
      try {
        const orgId = getOrganizationId();
        if (orgId) {
          const orgRes: any = await instance()
            .get(`organizations/${orgId}`)
            .then((r) => r.data)
            .catch(async () => {
              // Fallback to list
              const listRes: any = await instance().get(`organizations/?organization_id=${orgId}`).then((r) => r.data);
              return Array.isArray(listRes) ? listRes[0] : listRes;
            });
          if (orgRes) setOrgData(orgRes);
        }
      } catch (e) {
        console.warn("Org detail fetch error:", e);
      }

      // Fallback for user or stored organization name
      try {
        const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u?.organization_name || u?.organization?.organization_name) {
            setOrgData((prev: any) => ({
              ...prev,
              organization_name: prev?.organization_name || u.organization_name || u.organization?.organization_name,
              organization_address: prev?.organization_address || u.organization?.organization_address,
              website: prev?.website || u.organization?.website,
            }));
          }
        }
      } catch {}

      // 2. Active CO-PO
      try {
        const copoRes: any = await Models.copo.get_active(courseId);
        setActiveCopo(copoRes || null);
      } catch (e) {
        console.warn("Active copo fetch error:", e);
      }

      // 3. Active Extraction (for CO descriptions & units)
      try {
        const extRes: any = await Models.syllabus.get_active_extraction(courseId);
        setActiveExt(extRes || null);
      } catch (e) {
        console.warn("Active extraction fetch error:", e);
      }

      // 4. Active Lesson Plan
      try {
        const lpRes: any = await Models.lession_plan.get_active(courseId);
        setActiveLp(lpRes || null);
      } catch (e) {
        console.warn("Active lesson plan fetch error:", e);
      }

      // 5. Active Pedagogy
      try {
        const pedRes: any = await Models.pedagogy.get_active(courseId);
        setActivePed(pedRes || null);
      } catch (e) {
        console.warn("Active pedagogy fetch error:", e);
      }
    } catch (err: any) {
      console.error("Failed to load report data:", err);
      Failure(getErrorMessage(err, "Failed to load report data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReportData();
  }, [courseId]);

  // Derived Course Metadata
  const course = portfolio?.course || courseMetadata || {};
  const courseCode = course.course_code || "CRS";
  const courseTitle = course.course_title || "Course Portfolio";
  const deptName = course.department_name || "Department of Engineering";
  const progName = course.programme_name || "Bachelor of Technology";
  const semester = course.semester ? `Semester ${course.semester}` : "Semester IV";
  const academicYear = course.academic_year || "2025 - 2026";
  const coordinatorName =
    course.coordinator_name ||
    course.course_coordinator ||
    (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.name : "") ||
    "Course Coordinator";

  const orgName =
    orgData?.organization_name ||
    course.organization_name ||
    "Autonomous Engineering Institution";
  const orgAddress =
    orgData?.organization_address ||
    "Affiliated to Anna University • Approved by AICTE • Accredited by NAAC with 'A' Grade";

  // ── Map Topic ID to Top-3 Active Pedagogies ──────────────────────────────
  const topicPedagogyMap = useMemo(() => {
    const map = new Map<number, any>();
    const suggestions = activePed?.topic_suggestions || [];
    suggestions.forEach((sug: any) => {
      if (sug.topic_id) {
        map.set(sug.topic_id, sug);
      }
    });
    return map;
  }, [activePed]);

  // ── Prepare CO-PO Matrix Grid ─────────────────────────────────────────────
  const copoGrid = useMemo(() => {
    const entries = activeCopo?.matrix_entries || [];
    const outcomes = activeExt?.outcomes || [];

    // Distinct POs (1 to 12) and PSOs (1 to 3)
    const poSet = new Set<string>();
    const psoSet = new Set<string>();

    entries.forEach((e: any) => {
      const code = String(e.po_code || "").toUpperCase();
      if (code.startsWith("PSO")) {
        psoSet.add(code);
      } else if (code.startsWith("PO")) {
        poSet.add(code);
      }
    });

    // Default PO1-PO12 if empty
    if (poSet.size === 0) {
      for (let i = 1; i <= 12; i++) poSet.add(`PO${i}`);
    }
    if (psoSet.size === 0) {
      for (let i = 1; i <= 3; i++) psoSet.add(`PSO${i}`);
    }

    const posList = Array.from(poSet).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, "")) || 0;
      const nb = parseInt(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });

    const psosList = Array.from(psoSet).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, "")) || 0;
      const nb = parseInt(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });

    const allCols = [...posList, ...psosList];

    // Build CO list
    const coMap = new Map<string, { co_code: string; description: string; bloom_level?: string; id?: any }>();
    if (outcomes.length > 0) {
      outcomes.forEach((co: any) => {
        coMap.set(co.co_code, {
          co_code: co.co_code,
          description: co.description || "",
          bloom_level: co.knowledge_level || co.bloom_level || "K2",
          id: co.id,
        });
      });
    }

    // Also ingest from entries
    entries.forEach((e: any) => {
      const cCode = e.co_code || `CO${e.course_outcome_id}`;
      if (!coMap.has(cCode)) {
        coMap.set(cCode, {
          co_code: cCode,
          description: e.co_description || "Course Outcome description",
          id: e.course_outcome_id,
        });
      }
    });

    const cosList = Array.from(coMap.values()).sort((a, b) => {
      const na = parseInt(a.co_code.replace(/\D/g, "")) || 0;
      const nb = parseInt(b.co_code.replace(/\D/g, "")) || 0;
      return na - nb;
    });

    // Cell lookup
    const cellScoreMap = new Map<string, number>();
    entries.forEach((e: any) => {
      const cCode = e.co_code || `CO${e.course_outcome_id}`;
      const pCode = String(e.po_code || "").toUpperCase();
      cellScoreMap.set(`${cCode}_${pCode}`, Number(e.matrix_value) || 0);
    });

    // Calculate averages per CO (row)
    const rowAverages = new Map<string, string>();
    cosList.forEach((co) => {
      let sum = 0;
      let count = 0;
      allCols.forEach((col) => {
        const val = cellScoreMap.get(`${co.co_code}_${col}`) || 0;
        if (val > 0) {
          sum += val;
          count++;
        }
      });
      rowAverages.set(co.co_code, count > 0 ? (sum / count).toFixed(2) : "-");
    });

    // Calculate averages per PO/PSO (column)
    const colAverages = new Map<string, string>();
    allCols.forEach((col) => {
      let sum = 0;
      let count = 0;
      cosList.forEach((co) => {
        const val = cellScoreMap.get(`${co.co_code}_${col}`) || 0;
        if (val > 0) {
          sum += val;
          count++;
        }
      });
      colAverages.set(col, count > 0 ? (sum / count).toFixed(2) : "-");
    });

    return {
      posList,
      psosList,
      allCols,
      cosList,
      cellScoreMap,
      rowAverages,
      colAverages,
    };
  }, [activeCopo, activeExt]);

  // ── Prepare Lesson Plan Grouped by Unit ───────────────────────────────────
  const lessonPlanUnits = useMemo(() => {
    const slots = activeLp?.topic_slots || [];
    const groupsMap = new Map<string, { unitNumber: number; unitTitle: string; totalHours: number; slots: any[] }>();

    slots.forEach((slot: any, idx: number) => {
      const uId = slot.unit_id || 1;
      const uTitle = slot.unit_title || `Unit ${uId}`;
      const uKey = `unit_${uId}`;

      if (!groupsMap.has(uKey)) {
        groupsMap.set(uKey, {
          unitNumber: uId,
          unitTitle: uTitle,
          totalHours: 0,
          slots: [],
        });
      }

      const g = groupsMap.get(uKey)!;
      g.slots.push({
        ...slot,
        seq: idx + 1,
      });
      g.totalHours += Number(slot.time_allocated) || 0;
    });

    return Array.from(groupsMap.values()).sort((a, b) => a.unitNumber - b.unitNumber);
  }, [activeLp]);

  // Total course hours
  const totalLpHours = useMemo(() => {
    return lessonPlanUnits.reduce((acc, u) => acc + u.totalHours, 0);
  }, [lessonPlanUnits]);

  // ── 2. Client-side Single PDF Generator (jsPDF + autoTable) ───────────────
  const generateAndDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);

      // Create PDF in A4 Portrait mode (210mm x 297mm)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Header drawing utility repeated on top of each page
      const renderPageHeader = (pageTitle: string) => {
        // Institutional Box
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, margin, contentWidth, 24, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, margin, contentWidth, 24, "S");

        // Organization Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(orgName.toUpperCase(), pageWidth / 2, margin + 5.5, { align: "center" });

        // Department & Programme
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`${deptName.toUpperCase()}  |  ${progName.toUpperCase()}`, pageWidth / 2, margin + 10, {
          align: "center",
        });

        // Course & Session Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${courseCode} - ${courseTitle}  (${semester} • ${academicYear})`,
          pageWidth / 2,
          margin + 15,
          { align: "center" }
        );

        // Section Banner Title
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, margin + 19, contentWidth, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(pageTitle.toUpperCase(), pageWidth / 2, margin + 22.5, { align: "center" });
      };

      // Footer drawing utility
      const renderPageFooter = (pageNum: number, totalPagesStr: string) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Generated via Neurobe OBE Platform  •  Coordinator: ${coordinatorName}  •  Date: ${new Date().toLocaleDateString()}`,
          margin,
          pageHeight - margin
        );
        doc.text(`Page ${pageNum} of ${totalPagesStr}`, pageWidth - margin, pageHeight - margin, { align: "right" });
      };

      // ──────────────────────────────────────────────────────────────────────────
      // PAGE 1: Horizontal CO-PO & PSO Correlation Matrix
      // ──────────────────────────────────────────────────────────────────────────
      renderPageHeader("Course Outcome to Program Outcome (CO-PO / PSO) Correlation Matrix");

      const matrixHeadCols = [
        "CO",
        "Course Outcome Description",
        ...copoGrid.posList,
        ...copoGrid.psosList,
        "Avg",
      ];

      const matrixRows: any[] = [];

      copoGrid.cosList.forEach((co) => {
        const rowVals: any[] = [
          co.co_code,
          co.description || `Understand the fundamentals and applications of ${co.co_code}`,
        ];

        copoGrid.allCols.forEach((col) => {
          const val = copoGrid.cellScoreMap.get(`${co.co_code}_${col}`) || 0;
          rowVals.push(val > 0 ? String(val) : "-");
        });

        rowVals.push(copoGrid.rowAverages.get(co.co_code) || "-");
        matrixRows.push(rowVals);
      });

      // Bottom Average Summary Row
      const summaryRow: any[] = ["Avg", "Direct Correlation Average"];
      copoGrid.allCols.forEach((col) => {
        summaryRow.push(copoGrid.colAverages.get(col) || "-");
      });
      summaryRow.push("");
      matrixRows.push(summaryRow);

      // Width calculation for 190mm space
      const poColWidth = copoGrid.allCols.length > 0 ? (115 / (copoGrid.allCols.length + 1)) : 7;
      const colStylesMap: any = {
        0: { cellWidth: 12, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 63, halign: "left" },
      };

      for (let c = 2; c < matrixHeadCols.length; c++) {
        colStylesMap[c] = { cellWidth: poColWidth, halign: "center" };
      }

      autoTable(doc, {
        head: [matrixHeadCols],
        body: matrixRows,
        startY: margin + 27,
        theme: "grid",
        styles: {
          fontSize: 6.5,
          cellPadding: 1.2,
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
          textColor: [15, 23, 42],
          valign: "middle",
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 6.5,
        },
        columnStyles: colStylesMap,
        didParseCell: (data) => {
          // Highlight Average Row
          if (data.row.index === matrixRows.length - 1) {
            data.cell.styles.fillColor = [238, 242, 255];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [67, 56, 202];
          }
          // Highlight Score values
          if (data.section === "body" && data.column.index >= 2 && data.column.index < matrixHeadCols.length - 1) {
            const v = data.cell.raw;
            if (v === "3") {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = "bold";
            } else if (v === "2") {
              data.cell.styles.textColor = [2, 132, 199];
              data.cell.styles.fontStyle = "bold";
            } else if (v === "1") {
              data.cell.styles.textColor = [217, 119, 6];
            } else if (v === "-") {
              data.cell.styles.textColor = [148, 163, 184];
            }
          }
        },
        margin: { left: margin, right: margin },
      });

      // Bottom Legend on Page 1
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, finalY + 4, contentWidth, 20, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, finalY + 4, contentWidth, 20, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text("CORRELATION LEVELS & ACCREDITATION ATTAINMENT SCALE:", margin + 4, finalY + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(
        "• Level 3 (High / Substantial Correlation): Course Outcome directly contributes to 60%+ of the respective Program Outcome.\n" +
        "• Level 2 (Medium / Moderate Correlation): Course Outcome contributes to 40% - 59% of the respective Program Outcome.\n" +
        "• Level 1 (Low / Slight Correlation): Course Outcome provides introductory knowledge contributing to 1% - 39% of PO.",
        margin + 4,
        finalY + 13
      );

      // Signatures on Page 1
      const sigY = finalY + 34;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("____________________________", margin + 10, sigY);
      doc.text("Course Coordinator", margin + 14, sigY + 4);

      doc.text("____________________________", margin + 75, sigY);
      doc.text("Module Coordinator", margin + 80, sigY + 4);

      doc.text("____________________________", pageWidth - margin - 50, sigY);
      doc.text("Head of Department (HOD)", pageWidth - margin - 47, sigY + 4);

      // ──────────────────────────────────────────────────────────────────────────
      // PAGE 2+: Lesson Plan Grouped by Unit
      // ──────────────────────────────────────────────────────────────────────────
      doc.addPage();
      renderPageHeader("Course Lesson Plan & Topic-by-Topic Teaching Schedule");

      const lpHead = [
        "Slot",
        "Topic & Subtopics",
        "Time\n(hh:mm)",
        "Active Suggested Pedagogies (Top 3)\n& Prescribed Delivery Method",
        "Bloom\nLevel",
      ];

      const lpRows: any[] = [];

      lessonPlanUnits.forEach((unit) => {
        // Unit Divider Header Row
        lpRows.push([
          {
            content: `${unit.unitTitle.toUpperCase()}  (Allocated Time: ${formatHHMM(unit.totalHours)})`,
            colSpan: 5,
            styles: {
              fillColor: [238, 242, 255],
              textColor: [49, 46, 129],
              fontStyle: "bold",
              fontSize: 7.5,
              halign: "left",
            },
          },
        ]);

        unit.slots.forEach((slot: any, sIdx: number) => {
          const topicPed = topicPedagogyMap.get(slot.topic_id);

          // Subtopics list string
          const subs = (slot.subtopic_slots || [])
            .map((s: any) => `• ${s.subtopic_name || `Subtopic #${s.subtopic_id}`}`)
            .join("\n");

          const topicContent = slot.subtopic_name
            ? `${slot.topic_name || `Topic #${slot.topic_id}`}\n↳ ${slot.subtopic_name}`
            : subs
            ? `${slot.topic_name || `Topic #${slot.topic_id}`}\n${subs}`
            : slot.topic_name || `Topic #${slot.topic_id}`;

          // Construct top-3 pedagogies text
          const ped1 = topicPed?.pedagogy_suggested_1 || "Interactive Lecture";
          const ped2 = topicPed?.pedagogy_suggested_2 || "Collaborative Discussion";
          const ped3 = topicPed?.pedagogy_suggested_3 || "Case / Practical Study";
          const activity = slot.suggested_activity || "Concept explanation with illustrative examples";

          const pedagogiesContent =
            `1. [Primary]: ${ped1}\n` +
            `2. [Alt 1]: ${ped2}\n` +
            `3. [Alt 2]: ${ped3}\n` +
            `Activity: ${activity}`;

          lpRows.push([
            `#${sIdx + 1}`,
            topicContent,
            formatHHMM(slot.time_allocated || 1),
            pedagogiesContent,
            slot.bloom_level || topicPed?.bloom_level_1 || "K2",
          ]);
        });
      });

      autoTable(doc, {
        head: [lpHead],
        body: lpRows,
        startY: margin + 27,
        theme: "grid",
        styles: {
          fontSize: 6.5,
          cellPadding: 1.4,
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
          textColor: [15, 23, 42],
          valign: "top",
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 6.8,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 62, halign: "left" },
          2: { cellWidth: 16, halign: "center", fontStyle: "bold", textColor: [79, 70, 229] },
          3: { cellWidth: 88, halign: "left" },
          4: { cellWidth: 14, halign: "center", fontStyle: "bold" },
        },
        margin: { left: margin, right: margin, bottom: margin + 8 },
        didDrawPage: (data) => {
          // If autoTable generated a new page for overflow, render the page header
          if (data.pageNumber > 2) {
            renderPageHeader("Course Lesson Plan & Topic-by-Topic Teaching Schedule");
          }
        },
      });

      // Add Total Pages to all footers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        renderPageFooter(i, String(totalPages));
      }

      // Single PDF Download
      const safeFilename = `${courseCode.replace(/[^a-zA-Z0-9_-]/g, "_")}_Course_Portfolio_Report.pdf`;
      doc.save(safeFilename);
      Success("Single Course Report PDF generated and downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to generate PDF report:", err);
      Failure(getErrorMessage(err, "Failed to generate report PDF"));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Browser Print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Course Portfolio Comprehensive Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Institutional syllabus report: CO-PO matrix (P.1) & Lesson Plan with active pedagogies and hh:mm duration (P.2+)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/60 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={loadAllReportData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Refresh Report Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Browser Print Preview"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={generateAndDownloadPDF}
            disabled={downloadingPdf || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            title="Download unified PDF"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Single PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download Single PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Loading Spinner ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-900">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assembling Course Portfolio Report...</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregating organization details, CO-PO correlation matrix, and active lesson plan timeline...
          </p>
        </div>
      )}

      {/* ── Document Preview (A4 Visualized Canvas) ─────────────────────────── */}
      {!loading && (
        <div
          ref={printContainerRef}
          className="mx-auto flex flex-col items-center space-y-8 pb-12 transition-all duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          {/* ════════════════════════════════════════════════════════════════════
              PAGE 1: Organization Header & Horizontal CO-PO Correlation Matrix
             ════════════════════════════════════════════════════════════════════ */}
          <div className="relative w-full max-w-[850px] min-h-[1130px] rounded-lg border border-slate-300 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              {/* Header Box on Page 1 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                    {orgName}
                  </h2>
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {deptName} • {progName}
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <span>{courseCode} - {courseTitle}</span>
                  <span>•</span>
                  <span>{semester}</span>
                  <span>•</span>
                  <span>Academic Year: {academicYear}</span>
                </div>
              </div>

              {/* Page Section Banner */}
              <div className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                Course Outcome to Program Outcome (CO-PO / PSO) Correlation Matrix
              </div>

              {/* Horizontal CO-PO Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-left text-[11px] dark:border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-200">
                      <th className="border border-slate-200 px-2 py-1.5 text-center font-bold dark:border-slate-800 w-12">
                        CO
                      </th>
                      <th className="border border-slate-200 px-3 py-1.5 font-bold dark:border-slate-800 min-w-[180px]">
                        Course Outcome Description
                      </th>
                      {copoGrid.posList.map((po) => (
                        <th
                          key={po}
                          className="border border-slate-200 px-1 py-1.5 text-center font-bold dark:border-slate-800 w-7"
                        >
                          {po}
                        </th>
                      ))}
                      {copoGrid.psosList.map((pso) => (
                        <th
                          key={pso}
                          className="border border-slate-200 px-1 py-1.5 text-center font-bold bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 dark:border-slate-800 w-7"
                        >
                          {pso}
                        </th>
                      ))}
                      <th className="border border-slate-200 px-1.5 py-1.5 text-center font-bold bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 dark:border-slate-800 w-11">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {copoGrid.cosList.map((co, cIdx) => (
                      <tr
                        key={cIdx}
                        className={cIdx % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-900/40" : "bg-white dark:bg-slate-950"}
                      >
                        <td className="border border-slate-200 px-2 py-1 text-center font-bold text-indigo-600 dark:text-indigo-400 dark:border-slate-800">
                          {co.co_code}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-slate-700 dark:text-slate-300 leading-snug dark:border-slate-800">
                          {co.description || `Understand and apply concepts of ${co.co_code}`}
                          {co.bloom_level && (
                            <span className="ml-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {co.bloom_level}
                            </span>
                          )}
                        </td>
                        {copoGrid.posList.map((po) => {
                          const val = copoGrid.cellScoreMap.get(`${co.co_code}_${po}`) || 0;
                          return (
                            <td
                              key={po}
                              className={`border border-slate-200 px-1 py-1 text-center font-bold dark:border-slate-800 ${
                                val === 3
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : val === 2
                                  ? "text-sky-600 dark:text-sky-400"
                                  : val === 1
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            >
                              {val > 0 ? val : "-"}
                            </td>
                          );
                        })}
                        {copoGrid.psosList.map((pso) => {
                          const val = copoGrid.cellScoreMap.get(`${co.co_code}_${pso}`) || 0;
                          return (
                            <td
                              key={pso}
                              className={`border border-slate-200 px-1 py-1 text-center font-bold bg-indigo-50/20 dark:bg-indigo-950/20 dark:border-slate-800 ${
                                val === 3
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : val === 2
                                  ? "text-sky-600 dark:text-sky-400"
                                  : val === 1
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            >
                              {val > 0 ? val : "-"}
                            </td>
                          );
                        })}
                        <td className="border border-slate-200 px-1.5 py-1 text-center font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/30 dark:border-slate-800">
                          {copoGrid.rowAverages.get(co.co_code) || "-"}
                        </td>
                      </tr>
                    ))}

                    {/* Column Average Row */}
                    <tr className="bg-indigo-50/60 font-bold dark:bg-indigo-950/50">
                      <td colSpan={2} className="border border-slate-200 px-3 py-1.5 text-right text-indigo-900 dark:text-indigo-200 dark:border-slate-800">
                        Direct Correlation Average
                      </td>
                      {copoGrid.allCols.map((col) => (
                        <td
                          key={col}
                          className="border border-slate-200 px-1 py-1.5 text-center font-mono text-[10px] text-indigo-900 dark:text-indigo-200 dark:border-slate-800"
                        >
                          {copoGrid.colAverages.get(col) || "-"}
                        </td>
                      ))}
                      <td className="border border-slate-200 px-1 py-1.5 text-center dark:border-slate-800" />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Correlation Scale Legend */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Accreditation Mapping Scale & Definitions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>Level 3 (High):</strong> Substantial correlation (&gt;60% target)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-sky-500 shrink-0" />
                    <span><strong>Level 2 (Medium):</strong> Moderate correlation (40% - 59%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Level 1 (Low):</strong> Introductory correlation (1% - 39%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Sign-off on Page 1 */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 text-center text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-mono text-slate-400">________________________</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">Course Coordinator</p>
                <p className="text-[10px] text-slate-500">{coordinatorName}</p>
              </div>
              <div>
                <p className="font-mono text-slate-400">________________________</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">Module Coordinator</p>
                <p className="text-[10px] text-slate-500">Curriculum Committee</p>
              </div>
              <div>
                <p className="font-mono text-slate-400">________________________</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">Head of Department</p>
                <p className="text-[10px] text-slate-500">{deptName}</p>
              </div>
            </div>

            {/* Page 1 Footer */}
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
              <span>Neurobe OBE Accreditation Platform • Confidential</span>
              <span className="font-bold">Page 1 of {lessonPlanUnits.length > 0 ? "2+" : "1"}</span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              PAGE 2+: Lesson Plan Grouped by Unit with Active Pedagogies & hh:mm
             ════════════════════════════════════════════════════════════════════ */}
          <div className="relative w-full max-w-[850px] min-h-[1130px] rounded-lg border border-slate-300 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              {/* Institutional Header on Page 2 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                    {orgName}
                  </h2>
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {deptName} • {progName}
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <span>{courseCode} - {courseTitle}</span>
                  <span>•</span>
                  <span>{semester}</span>
                  <span>•</span>
                  <span>Total Allocated: {formatHHMM(totalLpHours)}</span>
                </div>
              </div>

              {/* Page Section Banner */}
              <div className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                Course Lesson Plan & Topic-by-Topic Teaching Schedule
              </div>

              {/* Lesson Plan Table */}
              <div className="mt-4 space-y-6">
                {lessonPlanUnits.map((unit, uIdx) => (
                  <div key={uIdx} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    {/* Unit Subheader */}
                    <div className="flex items-center justify-between bg-indigo-50/90 px-4 py-2 dark:bg-indigo-950/70 border-b border-indigo-100 dark:border-indigo-900">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        {unit.unitTitle.toUpperCase()}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-indigo-900/70 px-2 py-0.5 rounded">
                        Unit Time: {formatHHMM(unit.totalHours)}
                      </span>
                    </div>

                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100/70 text-slate-700 dark:bg-slate-850 dark:text-slate-300 text-[10.5px]">
                          <th className="px-2.5 py-1.5 font-bold w-12 text-center">Slot</th>
                          <th className="px-3 py-1.5 font-bold w-52">Topic & Subtopics</th>
                          <th className="px-2.5 py-1.5 font-bold w-20 text-center">Time (hh:mm)</th>
                          <th className="px-3 py-1.5 font-bold">Active Suggested Pedagogies (Top 3) & AI Activity</th>
                          <th className="px-2.5 py-1.5 font-bold w-16 text-center">Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-[11px]">
                        {unit.slots.map((slot: any, sIdx: number) => {
                          const topicPed = topicPedagogyMap.get(slot.topic_id);

                          return (
                            <tr
                              key={sIdx}
                              className={sIdx % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-900/30" : "bg-white dark:bg-slate-950"}
                            >
                              <td className="px-2.5 py-2 text-center font-bold font-mono text-slate-500">
                                #{sIdx + 1}
                              </td>

                              <td className="px-3 py-2 align-top">
                                <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                                  {slot.topic_name || `Topic #${slot.topic_id}`}
                                </p>
                                {slot.subtopic_name && (
                                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    ↳ {slot.subtopic_name}
                                  </p>
                                )}
                                {Array.isArray(slot.subtopic_slots) && slot.subtopic_slots.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {slot.subtopic_slots.map((sub: any, subIdx: number) => (
                                      <p key={subIdx} className="text-[10px] text-slate-500 dark:text-slate-400">
                                        • {sub.subtopic_name || `Subtopic #${sub.subtopic_id}`}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </td>

                              <td className="px-2.5 py-2 text-center align-top">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {formatHHMM(slot.time_allocated || 1)}
                                </span>
                              </td>

                              <td className="px-3 py-2 align-top space-y-1.5">
                                {/* Top 3 Pedagogies Pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                    <span className="text-[9px]">1.</span>
                                    {topicPed?.pedagogy_suggested_1 || "Interactive Lecture"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                                    <span className="text-[9px]">2.</span>
                                    {topicPed?.pedagogy_suggested_2 || "Collaborative Discussion"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200/60 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
                                    <span className="text-[9px]">3.</span>
                                    {topicPed?.pedagogy_suggested_3 || "Case / Practical Study"}
                                  </span>
                                </div>

                                {/* Suggested Activity */}
                                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 italic">
                                  <strong>Activity:</strong> {slot.suggested_activity || "Interactive lecture with hands-on discussion"}
                                </p>
                              </td>

                              <td className="px-2.5 py-2 text-center align-top">
                                <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {slot.bloom_level || topicPed?.bloom_level_1 || "K2"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

                {lessonPlanUnits.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    No active lesson plan topic slots found for this course.
                  </div>
                )}
              </div>
            </div>

            {/* Page 2 Footer */}
            <div className="mt-8 pt-2 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
              <span>Neurobe OBE Accreditation Platform • Lesson Plan Schedule</span>
              <span className="font-bold">Page 2 of 2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePortfolioReport;
