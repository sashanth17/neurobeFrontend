/**
 * Student Dashboard PDF Generator
 * Uses jsPDF and jspdf-autotable to build a single clean report.
 * Excludes heavy images (paper links only) and includes organization header on pages.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StudentDashboardResponse } from "./courseAnalyticsService";

export function generateStudentDashboardPdf(data: StudentDashboardResponse, courseTitle?: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 15;

  // 1. Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT COMPREHENSIVE PERFORMANCE DOSSIER", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`Course: ${courseTitle || "Course Performance Report"}`, 14, 18);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 14, 18, { align: "right" });

  currentY = 36;

  // 2. Student Profile Summary
  const { profile } = data;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Student Information", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2, textColor: [30, 41, 59] },
    body: [
      [
        { content: "Name:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.student_name,
        { content: "Register No:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.register_number,
      ],
      [
        { content: "Email:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.email || "N/A",
        { content: "Section / Instance:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.instance_name || `Section ${profile.instance_id}`,
      ],
      [
        { content: "Department:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.department || "N/A",
        { content: "Programme:", styles: { fontStyle: "bold", textColor: [100, 116, 139] } },
        profile.programme || "N/A",
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. CIA Assessments Table
  if (data.cia_assessments && data.cia_assessments.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Continuous Internal Assessment (CIA) Performance", 14, currentY);
    currentY += 4;

    const ciaRows = data.cia_assessments.map((cia) => [
      cia.test_name,
      cia.test_type || "CIA",
      `${cia.final_total_mark} / ${cia.actual_max_mark}`,
      `${cia.marks_obtained_percentage}%`,
      cia.paper_links && cia.paper_links.length > 0 ? "Attached (Digital Copy)" : "N/A",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Test Name", "Type", "Marks Obtained", "Percentage", "Answer Script"]],
      body: ciaRows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. MCQ Assessments Table
  if (data.mcq_assessments && data.mcq_assessments.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Multiple Choice Question (MCQ) Performance", 14, currentY);
    currentY += 4;

    const mcqRows = data.mcq_assessments.map((m) => [
      m.title || m.test_code || "MCQ Test",
      `${m.correct_count} / ${m.total_questions}`,
      `${m.score_pct}%`,
      m.passed ? "PASSED" : "FAILED",
      m.tab_switches > 0 ? `${m.tab_switches} switches` : "Clean",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Test Title", "Correct / Total", "Score %", "Result", "Proctoring Flags"]],
      body: mcqRows,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Viva Evaluation Section
  if (data.viva) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("AI Viva Voce Evaluation", 14, currentY);
    currentY += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    if (data.viva.viva_score !== null) {
      doc.text(`Viva Score: ${data.viva.viva_score}%`, 14, currentY);
      currentY += 5;
    }

    doc.text("Evaluation Summary:", 14, currentY);
    currentY += 4;

    const splitSummary = doc.splitTextToSize(data.viva.evaluation_summary || "No summary provided.", pageWidth - 28);
    doc.text(splitSummary, 14, currentY);
    currentY += splitSummary.length * 4 + 6;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} • Confidential Student Assessment Report`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Download PDF
  const filename = `${profile.register_number}_performance_report.pdf`;
  doc.save(filename);
}
