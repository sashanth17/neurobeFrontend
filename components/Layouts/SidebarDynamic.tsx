import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { IRootState } from "../../store";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { toggleSidebar } from "../../store/themeConfigSlice";
import {
  clearApplicationCount,
  resetApplicationCount,
} from "../../store/notificationSlice";
import { OwnmenuConfig, getMenuByRole } from "@/utils/constant.utils";
import { setCourseView } from "@/store/courseViewSlice";

const Icons: Record<string, () => JSX.Element> = {
  "Academic Setup": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L2 8l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  "Course Instances": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  "User Management": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  "Roles & Permissions": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  "Bulk Import": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  "Audit Trial": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Masters: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  "My Assigned Courses": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Syllabus: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  "CO-PO Mapping": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Topics: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Pedagogy: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  "Lesson Plan": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  "Learning Materials": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  "Question Bank": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  "MCQ Test Preperation": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "CIA Question Paper": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  "Course Artifacts": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "Student Enrollment": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  MCQ: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
      <path d="M19 2v4M21 4h-4" />
    </svg>
  ),
  "MCQ Generation": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
      <path d="M19 2v4M21 4h-4" />
    </svg>
  ),
  "MCQ Test Execution": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  "Results & Analysis": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  "Marks Extraction & Verification": () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  ),
  "My Courses": () => (
   <svg width="28" height="28" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="M60 12h-2v34a3 3 0 0 1-3 3H42.72a17 17 0 0 0-7.6 1.8l-1.78.88A2.9 2.9 0 0 1 32 52a4.2 4.2 0 0 1-2-.65c-.27-.15-.59-.32-1-.51h-.1a17 17 0 0 0-7.6-1.8H9a3 3 0 0 1-3-3V12H4a1 1 0 0 0-1 1v40a1 1 0 0 0 1 1h56a1 1 0 0 0 1-1V13a1 1 0 0 0-1-1Z" />
  <path d="M30.67 10.22A21.1 21.1 0 0 0 22 8v23a1 1 0 0 1-1.55.83L18 30.2l-2.45 1.63A1 1 0 0 1 14 31V8H9a1 1 0 0 0-1 1v37a1 1 0 0 0 1 1h12.28a19 19 0 0 1 8.5 2c.52.22.9.43 1.22.6V10.38ZM55 8H42.72a21.1 21.1 0 0 0-9.39 2.22l-.33.16v39.24l1.22-.62a19 19 0 0 1 8.5-2H55a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1Z" />
  <path d="M38 26h8.13M38 34h8.13M38 40h12M38 32h12M38 24h12" />
</svg>
  ),
  "My Assigned Departments": () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 512 511"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        fillRule="nonzero"
        d="M216.984 377.945c0 21.504 17.512 39.016 39.016 39.016s39.016-17.512 39.016-39.016S277.504 338.93 256 338.93s-39.016 17.511-39.016 39.015M283.137 421.363c-2.254-.511-4.61-.101-6.555 1.332-6.144 4.301-13.004 6.555-20.379 6.555-7.371 0-14.23-2.152-20.375-6.555-1.945-1.332-4.2-1.843-6.555-1.332-24.882 5.836-42.906 28.57-42.906 54.067v5.222c0 4.508 3.586 8.707 8.09 8.707h123.188c4.503 0 8.09-4.199 8.09-8.707v-5.222c-.102-25.496-17.923-48.23-42.598-54.067M403.148 377.945c0 21.504 17.512 39.016 39.016 39.016s39.016-17.512 39.016-39.016-17.512-39.015-39.016-39.015-39.016 17.511-39.016 39.015M469.402 421.363c-2.254-.511-4.71-.101-6.656 1.332-6.144 4.301-13.004 6.555-20.379 6.555-7.37 0-14.234-2.152-20.375-6.555-1.945-1.332-4.199-1.843-6.453-1.332-24.883 5.836-42.805 28.57-42.805 54.067v5.222c0 4.508 3.38 8.707 7.887 8.707H503.81c4.503 0 8.191-4.199 8.191-8.707v-5.222c0-25.496-17.922-48.23-42.598-54.067M69.734 417.063c21.504 0 39.016-17.508 39.016-39.016 0-21.504-17.512-39.012-39.016-39.012s-39.015 17.406-39.015 38.91c0 21.606 17.511 39.118 39.015 39.118M96.77 421.363c-2.254-.511-4.61-.101-6.555 1.332-6.145 4.301-12.903 6.555-20.38 6.555-7.37 0-14.23-2.152-20.374-6.555-1.945-1.332-4.3-1.843-6.555-1.332C18.023 427.2 0 449.933 0 475.43v5.222c0 4.504 3.688 8.703 8.191 8.703H131.38c4.504 0 7.887-4.199 7.887-8.703v-5.222c0-25.496-17.82-48.23-42.496-54.067M63.488 317.121c4.504 0 8.192-3.687 8.192-8.191v-45.875h176.129v45.875c0 4.504 3.687 8.191 8.191 8.191 4.508 0 8.191-3.687 8.191-8.191v-45.875h176.13v45.875c0 4.504 3.687 8.191 8.19 8.191 4.509 0 8.192-3.687 8.192-8.191v-54.582c0-4.504-3.683-7.68-8.191-7.68h-184.32v-43.52c0-4.503-3.688-8.191-8.192-8.191-4.508 0-8.191 3.688-8.191 8.191v43.52H63.489c-4.505 0-8.192 3.176-8.192 7.68v54.582c0 4.605 3.687 8.191 8.191 8.191M256 88.973c24.371 0 44.238-19.864 44.238-44.235S280.371.5 256 .5s-44.238 19.867-44.238 44.238S231.629 88.973 256 88.973M184.012 172.941h143.87c4.509 0 7.888-3.789 7.888-8.293v-6.144c0-14.336-4.813-28.469-13.723-39.629-8.805-11.059-21.094-18.945-34.715-22.121-2.25-.512-4.605-.102-6.55 1.332-7.27 5.121-15.77 7.887-24.579 7.887-8.805 0-17.305-2.766-24.574-7.887-1.945-1.332-4.2-1.844-6.453-1.332-28.465 6.656-48.946 32.668-48.946 61.75v6.144c-.101 4.504 3.278 8.293 7.782 8.293m0 0"
      />
    </svg>
  ),

  "Classrooms": () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 512 512"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M484.119 343.741V48.195H88.187V159.89c30.976 11.39 53.132 41.189 53.132 76.068 0 20.254-7.489 38.781-19.82 53h95.968l86.5-42.555 13.243 26.919-81.283 39.988v22.65a67.38 67.38 0 0 1-11.537 37.781H512v-30Z" />
      <path d="M368.562 107.005v30H203.743v-30M177.861 200.574v-30h216.583v30" />
      <circle cx="60.305" cy="235.957" r="51.013" />
      <path d="M205.926 335.96v-17.003H60.305C27 318.957 0 345.957 0 379.262v84.543h120.611s-.021-89.704-.028-90.077h47.574c20.859 0 37.769-16.909 37.769-37.768Z" />
    </svg>
  ),
  Coordinator: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  Instructor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  "Question Banks": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  "MCQ-bank": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "CIA-bank": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  "CIQ-bank": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  "Instance management": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  "Live test monitoring": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  "MCQ Teaching Learning Effectiveness": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
      <path d="M19 2v4M21 4h-4" />
    </svg>
  ),
  "CIA Teaching Learning Effectiveness": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
      <path d="M3 20h18" />
    </svg>
  ),
  "Attainment": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-2 5l9-11h-7l2-5l-9 11h7z" />
    </svg>
  ),
  "Faculty & Class Performance": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  "Performance Analysis": () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
      <path d="M3 20h18" />
    </svg>
  ),
};

const FallbackIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ACTIVE_BG = "linear-gradient(to right, #e1f1fd, #c1e2f9)";

interface SidebarDynamicProps {
  onHoverChange?: (hovered: boolean) => void;
}

const SidebarDynamic = ({ onHoverChange }: SidebarDynamicProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [group, setGroup] = useState<string>("");
  const [userProfile, setUserProfile] = useState({
    name: "User",
    role: "ERP Admin",
    avatar: "U",
  });
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({
    coordinator: true,
    question_banks: true,
    instructor: true,
  });
  const [notifications, setNotifications] = useState<Record<string, number>>(
    {},
  );
  const semidark = useSelector(
    (state: IRootState) => state.themeConfig.semidark,
  );
  const activeView = useSelector(
    (state: IRootState) => state.courseView.activeView,
  );
  const applicationCountOverride = useSelector(
    (state: IRootState) => state.notification.applicationCount,
  );
  const scrollbarRef = useRef<any>(null);
  const pathnameRef = useRef(router.pathname);
  const isFirstMount = useRef(true);

  const COORDINATOR_DEFAULT = "/neurobe/syllabus";
  const INSTRUCTOR_DEFAULT = "/neurobe/course-artifacts";
  const APPLICATION_PAGES = [
    "/faculty/my_application",
    "/faculty/admin_application",
    "/faculty/ins_application",
  ];

  // on mobile always show labels; on desktop only when hovered
  const showLabels = isMobile || hovered;

  useEffect(() => {
    const role = localStorage.getItem("role") || localStorage.getItem("group") || "";
    setGroup(role);

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const fullName =
          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
          u?.email ||
          "User";
        setUserProfile({
          name: fullName,
          role: u?.role || role || "ERP Admin",
          avatar: (fullName || "U").charAt(0).toUpperCase(),
        });
      } else if (role) {
        setUserProfile((prev) => ({
          ...prev,
          role: role,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [router.pathname]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setHovered(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    onHoverChange?.(!isMobile && hovered);
  }, [hovered, isMobile, onHoverChange]);

  useEffect(() => {
    pathnameRef.current = router.pathname;
  }, [router.pathname]);

  useEffect(() => {
    router.prefetch(COORDINATOR_DEFAULT);
    router.prefetch(INSTRUCTOR_DEFAULT);
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const id =
      activeView === "coordinator"
        ? "sidebar-section-coordinator"
        : "sidebar-section-instructor";
    const target =
      activeView === "coordinator" ? COORDINATOR_DEFAULT : INSTRUCTOR_DEFAULT;

    const timer = setTimeout(() => {
      const heading = document.getElementById(id);
      if (!heading) return;
      const container: HTMLElement | null =
        scrollbarRef.current?._container ?? null;
      if (container) {
        container.scrollTo({ top: heading.offsetTop - 16, behavior: "smooth" });
      } else {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeView]);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      const path = url.split("?")[0];
      if (APPLICATION_PAGES.includes(path)) {
        setNotifications((prev) => ({ ...prev, new_applications: 0 }));
        dispatch(clearApplicationCount());
      }
    };
    const handleRouteChangeComplete = () => setActiveRoute();
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) dispatch(toggleSidebar());
    if (APPLICATION_PAGES.includes(router.pathname)) {
      setNotifications((prev) => ({ ...prev, new_applications: 0 }));
    } else {
      dispatch(resetApplicationCount());
    }
    setActiveRoute();
  }, [router.pathname]);

  const setActiveRoute = () => {
    const allLinks = document.querySelectorAll(".sidebar ul a.active");
    allLinks.forEach((el) => el.classList.remove("active"));
    const selector = document.querySelector(
      `.sidebar ul a[href="${window.location.pathname}"]`,
    );
    selector?.classList.add("active");
  };

  const getNotifyCount = (notifyKey: string) => {
    if (notifyKey === "new_applications" && applicationCountOverride === 0)
      return 0;
    return notifications[notifyKey] ?? 0;
  };

  let currentSection: "coordinator" | "instructor" | null = null;

  const isItemDisabled = () => {
    // All items remain active and accessible for staff members
    return false;
  };

  const getOwnMenu = () => {
    return getMenuByRole(group);
  };

  const menu = getOwnMenu() || [];

  const isActive = (href?: string) =>
    href
      ? router.pathname === href || router.pathname.startsWith(href + "/")
      : false;

  const isAnyDescendantActive = (item: any): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children && Array.isArray(item.children)) {
      return item.children.some((c: any) => isAnyDescendantActive(c));
    }
    return false;
  };

  const toggleKey = (key: string) => {
    setOpenKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isKeyOpen = (key: string) => Boolean(openKeys[key]);

  return (
    <div className={semidark ? "dark" : ""}>
      <nav
        className="sidebar bg-[#00319f]  fixed bottom-0 top-0 z-50 h-full overflow-hidden transition-[width] duration-300 ease-in-out lg:top-[72px] lg:max-h-[calc(100vh-72px)]"
        style={{ width: showLabels ? "270px" : "58px" }}
        onMouseEnter={() => {
          if (!isMobile) setHovered(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setHovered(false);
          }
        }}
      >
        {/* Mobile header: logo + close — only below lg */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/">
            <img src="/assets/images/neurobe/logo.png" alt="logo" className="h-[28px] w-auto" />
          </Link>
          <button
            type="button"
            className="flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.1)" }}
            onClick={() => dispatch(toggleSidebar())}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User card — top */}
        <div className="px-2 pb-3 pt-4">
          <div
            className="flex items-center overflow-hidden rounded-[12px] transition-all duration-300"
            style={{
              background: showLabels ? "#000E3B" : "transparent",
              border: showLabels ? "0.2px solid transparent" : "1px solid transparent",
              padding: showLabels ? "10px 12px" : "8px 0",
              justifyContent: showLabels ? "flex-start" : "center",
              minHeight: 56,
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-black"
              style={{
                width: 38,
                height: 38,
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            >
              {userProfile.avatar}
            </div>
            {showLabels && (
              <div className="ml-3 min-w-0">
                <p className="truncate text-[15px] font-bold text-[#fff]">
                  {userProfile.name}
                </p>
                <p className="truncate pt-1 text-[13px] text-white/80">
                  {userProfile.role}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu list */}
        <div
          className="sidebar-menu-scroll flex flex-col space-y-3 overflow-y-auto overflow-x-hidden py-4"
          style={{ maxHeight: "calc(100% - 100px)" }}
        >
          {menu.map((item: any, idx: number) => {
            if (item.type === "heading") {
              const label: string = item.label ?? "";
              if (label.includes("COURSE PREPARATION"))
                currentSection = "coordinator";
              else if (label.includes("INSTRUCTOR FUNCTIONS"))
                currentSection = "instructor";
              const disabled = isItemDisabled();
              const anchorId = label.includes("COURSE PREPARATION")
                ? "sidebar-section-coordinator"
                : label.includes("INSTRUCTOR FUNCTIONS")
                  ? "sidebar-section-instructor"
                  : undefined;

              if (showLabels) {
                return (
                  <p
                    key={idx}
                    id={anchorId}
                    className={`whitespace-nowrap px-[14px] pb-1 pt-4 text-[10px] uppercase tracking-[1.8px] ${disabled ? "select-none opacity-30" : ""
                      }`}
                    style={{ color: "rgba(191,208,244,0.6)" }}
                  >
                    {item.label}
                  </p>
                );
              }
              return (
                <div
                  key={idx}
                  id={anchorId}
                  className="mx-auto my-2"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              );
            }

            const disabled = isItemDisabled();
            const disabledClass = disabled
              ? "opacity-30 pointer-events-none select-none"
              : "";

            if (item.type === "link") {
              const Icon = Icons[item.label] || FallbackIcon;
              const active = isActive(item.href);
              return (
                <Link
                  key={idx}
                  href={disabled ? "#" : item.href || "#"}
                  className={`sidebar-nav-item mx-[8px] font-bold flex items-center transition-colors duration-150 ${disabledClass}`}
                  style={{
                    minHeight: 40,
                    borderRadius: "20px",
                    padding: showLabels ? "9px 14px" : "9px 0",
                    justifyContent: showLabels ? "flex-start" : "center",
                    background: active ? ACTIVE_BG : "transparent",
                    color: active ? "#000E3B" : "#fff",
                  }}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      return;
                    }
                    if (currentSection === "coordinator") {
                      dispatch(setCourseView("coordinator"));
                    } else if (currentSection === "instructor") {
                      dispatch(setCourseView("instructor"));
                    }
                    if (item.notifyKey === "new_applications") {
                      dispatch(clearApplicationCount());
                      setNotifications((prev) => ({
                        ...prev,
                        new_applications: 0,
                      }));
                    }
                  }}
                >
                  <span
                    className="flex shrink-0 items-center justify-center group-hover:!text-[#000E3B]"
                    style={{ width: 28 ,  color: active ? "#000E3B" : "#fff",}}
                  >
                    <Icon />
                  </span>
                  {showLabels && (
                    <span className="ml-3 whitespace-nowrap text-[14px] font-semibold leading-none group-hover:!text-[#000E3B]" style={{  color: active ? "#000E3B" : "#fff",}}>
                      {item.label}
                    </span>
                  )}
                  {showLabels &&
                    !disabled &&
                    item.notifyKey &&
                    (() => {
                      const count = getNotifyCount(item.notifyKey);
                      return count > 0 ? (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] text-white">
                          {count}
                        </span>
                      ) : null;
                    })()}
                </Link>
              );
            }

            if (item.type === "submenu") {
              const renderSubmenuItem = (subItem: any, level = 1, parentKey = "") => {
                const key = subItem.key || subItem.label || `${parentKey}_${level}`;
                const open = isKeyOpen(key);
                const anyChildActive = isAnyDescendantActive(subItem);
                const isHighlighted = anyChildActive || open;
                const Icon = Icons[subItem.label] || FallbackIcon;

                return (
                  <div key={key} className={level === 1 ? disabledClass : "w-full"}>
                    <button
                      type="button"
                      disabled={disabled}
                      className={`sidebar-nav-item flex items-center transition-colors duration-150 cursor-pointer ${
                        level === 1 ? "mx-[8px] rounded-full" : "rounded-full px-3 py-[7px] text-[13px]"
                      }`}
                      style={{
                        minHeight: level === 1 ? 40 : 34,
                        width: level === 1 ? "calc(100% - 16px)" : "100%",
                        borderRadius: "9999px",
                        padding: level === 1 ? (showLabels ? "9px 12px" : "9px 0") : "7px 10px",
                        justifyContent: showLabels ? "flex-start" : "center",
                        background: isHighlighted ? (level === 1 ? ACTIVE_BG : "rgba(255, 255, 255, 0.12)") : "transparent",
                        color: "#fff",
                      }}
                      onClick={() => {
                        if (!disabled && showLabels) toggleKey(key);
                      }}
                    >
                      <span
                        className="flex shrink-0 items-center justify-center"
                        style={{ width: level === 1 ? 28 : 20 }}
                      >
                        <Icon />
                      </span>
                      {showLabels && (
                        <>
                          <span
                            className={`flex-1 whitespace-nowrap text-left font-medium ${
                              level === 1 ? "ml-3 text-[14px]" : "ml-2 text-[13px]"
                            }`}
                          >
                            {subItem.label}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{
                              transform: open ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                              flexShrink: 0,
                              marginRight: 2,
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </>
                      )}
                    </button>

                    {showLabels && open && subItem.children && (
                      <div
                        className={`${
                          level === 1
                            ? "ml-[34px] mr-[8px] mt-[4px]"
                            : "ml-[18px] mr-[4px] mt-[2px]"
                        } flex flex-col gap-[3px]`}
                      >
                        {subItem.children.map((child: any, ci: number) => {
                          if (child.type === "submenu" || (child.children && child.children.length > 0)) {
                            return renderSubmenuItem(child, level + 1, key);
                          }
                          const ChildIcon = Icons[child.label] || FallbackIcon;
                          const active = isActive(child.href);
                          return (
                            <Link
                              key={ci}
                              href={child.href || "#"}
                              className="sidebar-nav-item flex items-center gap-2 rounded-full px-3 py-[7px] text-[13px] font-medium transition-colors duration-150"
                              style={{
                                color: "#fff",
                                background: active ? "rgba(255, 255, 255, 0.2)" : "transparent",
                              }}
                              onClick={() => {
                                if (key.includes("coordinator") || parentKey.includes("coordinator")) {
                                  dispatch(setCourseView("coordinator"));
                                } else if (key.includes("instructor") || parentKey.includes("instructor")) {
                                  dispatch(setCourseView("instructor"));
                                }
                              }}
                            >
                              <span className="flex shrink-0 items-center justify-center opacity-70" style={{ width: 14 }}>
                                <ChildIcon />
                              </span>
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              };

              return renderSubmenuItem(item, 1);
            }

            return null;
          })}
        </div>
      </nav>
    </div>
  );
};

export default SidebarDynamic;
