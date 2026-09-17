import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import type { EventData, Step } from "react-joyride";

export const TOUR_KEY = "faculty_tour_done";

export const STEPS_BY_ROUTE: Record<string, Step[]> = {
  "/faculty/ins_application": [
    
    {
      target: ".tour-myapp-stats",
      title: "Application Stats",
      content: "Institution-wide overview of total Applications, Applied, Selected, and Interview Scheduled counts across all colleges in your institution. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-filters",
      title: "Search & Filters",
      content: "Search applications by faculty name, filter by College or Department within your institution, or use the advanced Filter button for status and date range.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-table",
      title: "Application List",
      content: "View all faculty applications across your institution's colleges. Each row shows Faculty Name, Job Title, College, Department, and current Status.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-actions",
      title: "Row Actions",
      content: "Each application row has actions — 👁 View full application details,  Download resume,  View interview rounds,  Delete application.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/institution_job": [
   
    {
      target: ".tour-add-job",
      title: "Add New Job",
      content: "Click here to create a new job posting for your institution. HR managers under your institution will be able to manage and approve these postings.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-stats",
      title: "Job Stats",
      content: "Institution-wide overview of Total Jobs, Active (Approved) postings, and Inactive (Pending) postings across all colleges in your institution. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-filters",
      title: "Search & Filters",
      content: "Search jobs by title, filter by College or Department within your institution, or use the advanced Filter button for date range, salary, status, and academic responsibilities.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-table",
      title: "Jobs List",
      content: "View all job postings across your institution's colleges. See job title, department, college, approval status, urgency, and total applications per job.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-job-actions",
      title: "Row Actions",
      content: "Each job row has actions — 👁 View job details, Edit the job posting, Delete the job.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/admin_users": [
   
    {
      target: ".tour-users-add-btn",
      title: "Add New User",
      content: "Click here to create a new Institution Admin or HR user. Fill in their name, email, password, phone, gender, and assign them to an institution or college.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-users-tabs",
      title: "User Role Tabs",
      content: "Switch between user roles — Institution Admin and HR. Each tab shows users of that role with their relevant details.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-users-filters",
      title: "Search & Filters",
      content: "Search users by name, filter by Institution, College, or Department. Use the record type filter to view own or team records.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-users-table",
      title: "Users List",
      content: "View all users for the selected role. Each row shows name, institution, college, and key stats. Use the Edit or Delete actions to manage each user.",
      placement: "top",
      skipBeacon: true,
    },
  ],
  "/faculty/hr_user": [
    
    {
      target: ".tour-users-add-btn",
      title: "Add New HR",
      content: "Click here to create a new HR user for your institution. Assign them to one or more colleges they will manage.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-users-filters",
      title: "Search & Filters",
      content: "Search HR users by name, filter by College, or use the record type filter to view own or team records.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-users-table",
      title: "HR Users List",
      content: "View all HR users in your institution. Each row shows their name, assigned colleges, total jobs posted, total applications managed, and interviews scheduled. Click Edit to update or Delete to remove.",
      placement: "top",
      skipBeacon: true,
    },
  ],
  "/faculty/application_detail": [
    {
      target: ".tour-detail-applicant",
      title: "Applicant Information",
      content: "View the applicant's full details — name, email, phone, experience, applied date, departments, and cover letter.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-view-profile",
      title: "View Profile",
      content: "Click here to open the applicant's full faculty profile — including resume, experience, education, projects, publications, skills, and achievements.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-resume",
      title: "Download Resume",
      content: "Click here to download or view the applicant's uploaded resume in a new tab.",
      placement: "left",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-job",
      title: "Job Information",
      content: "Details of the job this applicant applied for — title, location, experience required, qualification, number of openings, job description, and application timeline.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-schedule",
      title: "Schedule Interview",
      content: "Click here to create a new interview round for this applicant. Select department, panel members, date/time, round name, and interview link.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-rounds-list",
      title: "Interview Rounds",
      content: "All scheduled interview rounds appear here. Expand each round to see panel members and their feedback. You can update the round status (Scheduled, Rescheduled, Completed) directly.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-detail-status",
      title: "Application Status",
      content: "View the current application status.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/admin_application": [
    
    {
      target: ".tour-myapp-stats",
      title: "Application Stats",
      content: "Platform-wide overview of total Applications, Applied, Selected, and Interview Scheduled counts. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-filters",
      title: "Search & Filters",
      content: "Search applications by faculty name, filter by Institution, College, Department, record type, or use the advanced Filter button for status and date range.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-table",
      title: "Application List",
      content: "View all faculty applications across the platform. Each row shows Faculty Name, Job Title, College, Department, and current Status.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-actions",
      title: "Row Actions",
      content: "Each application row has actions — 👁 View full application details,  Download resume,  View interview rounds,  Update application status,  Delete application.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/admin_job": [
    // {
    //   target: ".sidebar",
    //   title: "Sidebar Navigation",
    //   content: "Use the sidebar to navigate between all sections of the application.",
    //   placement: "right",
    //   skipBeacon: true,
    // },
    // {
    //   target: ".tour-profile",
    //   title: "Your Profile",
    //   content: "Click here to view your profile, account settings, or sign out.",
    //   placement: "bottom",
    //   skipBeacon: true,
    // },
    {
      target: ".tour-add-job",
      title: "Add New Job",
      content: "Click here to create a new job posting. As an admin you can post jobs across any institution and college.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-stats",
      title: "Job Stats",
      content: "Platform-wide overview of Total Jobs, Active (Approved) postings, and Inactive (Pending) postings across all institutions. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-filters",
      title: "Search & Filters",
      content: "Search jobs by title, filter by Institution, College, Department, record type, or use the advanced Filter button for date range, salary, status, and academic responsibilities.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-table",
      title: "Jobs List",
      content: "View all job postings across the platform. See job title, department, college, approval status, urgency, and total applications per job.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-job-actions",
      title: "Row Actions",
      content: "Each job row has actions — 👁 View job details,  Edit the job posting,  Delete the job.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/my_application": [
   
    {
      target: ".tour-myapp-stats",
      title: "Application Stats",
      content: "Quick overview of total Applications, Applied count, Selected count, and Interview Scheduled count. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-filters",
      title: "Search & Filters",
      content: "Search applications by faculty name, filter by College, Department, record type, or use the advanced Filter button for status and date range.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-table",
      title: "Application List",
      content: "View all faculty applications here. Each row shows Faculty Name, Job Title, College, Department, and current Status.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-myapp-actions",
      title: "Row Actions",
      content: "Each application row has actions \u2014 \ud83d\udc41 View full application details,  Download resume,  View interview rounds,  Update application status, Delete application.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/job_seekers": [
   
    {
      target: ".tour-seekers-filters",
      title: "Search & Filters",
      content: "Search faculty by name, filter by Education Qualification (PhD, NET, SET, SLET), Department, Experience level, and Academic Responsibilities.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-seekers-table",
      title: "Talents List",
      content: "Browse all active faculty job seekers. Each row shows their Name, Location, Experience, Current Position, Department, Publications, and Projects.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-seekers-actions",
      title: "Row Actions",
      content: "Each talent row has actions — 👁 View full profile,  Send Interest (invite them to apply),  View interest status,  Schedule Interview,  View Interview Rounds.",
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/faculty/hr_job": [
    // {
    //   target: ".sidebar",
    //   title: "Sidebar Navigation",
    //   content: "Use the sidebar to navigate between all sections of the application.",
    //   placement: "right",
    //   skipBeacon: true,
    // },
    // {
    //   target: ".tour-profile",
    //   title: "Your Profile",
    //   content: "Click here to view your profile, account settings, or sign out.",
    //   placement: "bottom",
    //   skipBeacon: true,
    // },
    {
      target: ".tour-add-job",
      title: "Click to Add New Job",
      content: "Click here to create a new job posting for your college.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-stats",
      title: "Job Stats",
      content:
        "Quick overview of Total Jobs, Active (Approved) job postings, and Inactive (Pending) job postings. Click any card to filter the list by that status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-filters",
      title: "Search & Filters",
      content:
        "Search jobs by title, filter by College, Department, or use the advanced Filter button for date range, salary, and status.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-job-table",
      title: "Jobs List",
      content:
        "View all job postings here. You can view details, approve/unapprove, edit, or delete each job. Click the application count to see applicants.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-job-actions",
      title: "Row Actions",
      content: (
        <>
          Each job row has 4 actions — 👁 View job details, Approve/Unapprove the job, Edit the job posting, Delete the job.
        </>
      ),
      placement: "left",
      skipBeacon: true,
    },
  ],
  "/": [
    {
      target: ".tour-profile",
      title: "Your Profile",
      content: "Click here to view your profile, account settings, or sign out.",
      placement: "bottom",
      skipBeacon: true,
    },
    // sidebar steps are injected dynamically per role at render time
    {
      target: ".tour-stat-cards",
      title: "Stats Overview",
      content:
        "Quick stats: Applications, Application Updates, Interviews Scheduled, and Job Postings. Click any card to filter the list by that stats.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: ".tour-filters",
      title: "Search & Filters",
      content:
        "Search applications and filter by Institution, College, and Department.",
      placement: "bottom",
      skipBeacon: true,
    },
    // {
    //   target: ".tour-app-table",
    //   title: "Application List",
    //   content:
    //     "View all applications here. Click a row to see full details, download resume, or manage interview rounds.",
    //   placement: "top",
    //   skipBeacon: true,
    // },
    {
      target: ".tour-overview-chart",
      title: "Overview Graph",
      content:
        "Visualize trends for Jobs, Applications, College Registrations, and Interviews over time.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-experience-chart",
      title: "Applications by Experience",
      content:
        "Donut chart showing the distribution of applicants by experience level.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-interview-chart",
      title: "Interviews Scheduled",
      content:
        "Bar chart tracking the number of interviews scheduled over the selected period.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-decision-chart",
      title: "Decisions",
      content:
        "Stacked bar chart showing Selected vs Rejected faculty decisions over time.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: ".tour-funnel-chart",
      title: "Application Funnel",
      content:
        "Funnel view of the application pipeline — from Applied to Selected/Rejected.",
      placement: "top",
      skipBeacon: true,
    },
  ],
};

const DEFAULT_STEPS: Step[] = [];

interface Props {
  run: boolean;
  onFinish: () => void;
}

export default function AppTour({ run, onFinish }: Props) {
  const router = useRouter();
  const [JoyrideLib, setJoyrideLib] = useState<any>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    import("react-joyride").then((mod) => {
      setJoyrideLib(() => mod.Joyride ?? mod.default);
    });
  }, []);

  const handleEvent = useCallback(
    (data: EventData) => {
      const { status, lifecycle } = data;
      // Lock scroll only when tooltip is shown, unlock on beacon/idle
      setTooltipVisible(lifecycle === "tooltip");
      if (status === "finished" || status === "skipped") {
        setTooltipVisible(false);
        localStorage.setItem(TOUR_KEY, "true");
        onFinish();
      }
    },
    [onFinish],
  );

  // Lock body scroll only while tooltip is actively displayed
  useEffect(() => {
    document.body.style.overflow = tooltipVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tooltipVisible]);

  // Always restore scroll when tour stops running
  useEffect(() => {
    if (!run) {
      setTooltipVisible(false);
      document.body.style.overflow = "";
    }
  }, [run]);

  // Restore scroll on route change
  useEffect(() => {
    setTooltipVisible(false);
    document.body.style.overflow = "";
  }, [router.pathname]);

  if (!JoyrideLib) return null;

  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  // Role-aware steps for application_detail
  const APP_DETAIL_STEPS_BY_ROLE: Record<string, Step[]> = {
    hr: [
      {
        target: ".tour-detail-applicant",
        title: "Applicant Information",
        content: "View the applicant's full details — name, email, phone, experience, applied date, departments, and cover letter.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-view-profile",
        title: "View Profile",
        content: "Click here to open the applicant's full faculty profile — resume, experience, education, projects, publications, skills, and achievements.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-resume",
        title: "Download Resume",
        content: "Click here to download or view the applicant's uploaded resume in a new tab.",
        placement: "left",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-job",
        title: "Job Information",
        content: "Details of the job this applicant applied for — title, location, experience required, qualification, number of openings, and job description.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-schedule",
        title: "Schedule Interview",
        content: "As HR, you can create a new interview round here. Select department, panel members, date/time, round name, and interview link.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-rounds-list",
        title: "Interview Rounds",
        content: "All scheduled interview rounds appear here. Expand each round to see panel members and their feedback. You can update the round status (Scheduled, Rescheduled, Completed) directly.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-status",
        title: "Application Status",
        content: "As HR, you can update the application status here — Shortlisted, Selected, Rejected, etc. Select a status and click Update Status to save.",
        placement: "left",
        skipBeacon: true,
      },
    ],
    super_admin: [
      {
        target: ".tour-detail-applicant",
        title: "Applicant Information",
        content: "Full applicant details — name, contact info, experience, applied date, departments, and cover letter. You can view their complete profile.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-view-profile",
        title: "View Profile",
        content: "Open the applicant's complete faculty profile including resume, experience, education, projects, publications, and skills.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-resume",
        title: "Download Resume",
        content: "Download or view the applicant's resume directly from here.",
        placement: "left",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-job",
        title: "Job Information",
        content: "Details of the job posting this application is for — across any institution or college on the platform.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-rounds-list",
        title: "Interview Rounds",
        content: "View all interview rounds conducted for this applicant. Expand each round to review panel member feedback and scores.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-status",
        title: "Application Status",
        content: "View the current application status. As Super Admin you have full visibility into the application pipeline across all institutions.",
        placement: "left",
        skipBeacon: true,
      },
    ],
    institution_admin: [
      {
        target: ".tour-detail-applicant",
        title: "Applicant Information",
        content: "Full applicant details — name, contact info, experience, applied date, departments, and cover letter for this application within your institution.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-view-profile",
        title: "View Profile",
        content: "Open the applicant's complete faculty profile to review their background before making decisions.",
        placement: "bottom",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-resume",
        title: "Download Resume",
        content: "Download or view the applicant's resume to review their qualifications.",
        placement: "left",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-job",
        title: "Job Information",
        content: "Details of the job posting within your institution that this applicant applied for.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-rounds-list",
        title: "Interview Rounds",
        content: "View all interview rounds for this applicant. Expand each round to see panel feedback. As Institution Admin you have read access to all rounds.",
        placement: "top",
        skipBeacon: true,
      },
      {
        target: ".tour-detail-status",
        title: "Application Status",
        content: "View the current application status across the pipeline. Monitor progress from Applied through to Selected or Rejected.",
        placement: "left",
        skipBeacon: true,
      },
    ],
  };

  const SIDEBAR_STEPS_BY_ROLE: Record<string, Step[]> = {
    super_admin: [
      {
        target: ".tour-sidebar-dashboard",
        title: "Dashboard",
        content: "Your central command. View live stats across all institutions — Applications, Interviews, Job Postings, and analytics charts.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-job-postings",
        title: "Click Here to Post a Job ",
        content: "Manage all job postings across every institution. Create, edit, or delete postings and monitor application counts.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-applications",
        title: "Applications",
        content: "View and manage all faculty applications across all institutions. Filter by status, college, or department.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-institutions",
        title: "Institutions",
        content: "Manage all registered institutions on the platform. Add, edit, or deactivate institutions.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-colleges---departments",
        title: "Colleges & Departments",
        content: "Manage colleges and their departments across all institutions. Assign departments to colleges and configure their details.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-users",
        title: "Users",
        content: "Manage all platform users — Institution Admins, HR managers, and HODs. Create, edit, or deactivate user accounts.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-master",
        title: "Master Settings",
        content: "Configure global master data: Departments, Panel Members, Experience levels, Job Roles, Salary Ranges, Application Statuses, College Types, NAAC, NIRF, and more.",
        placement: "right",
        skipBeacon: true,
      },
    ],
    institution_admin: [
      {
        target: ".tour-sidebar-dashboard",
        title: "Dashboard",
        content: "Your institution overview. Monitor Applications, Interviews, Job Postings, and analytics for your institution.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-job-postings",
        title: "Click Here to Post a Job ",
        content: "Manage job postings across all colleges in your institution.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-applications",
        title: "Applications",
        content: "View all faculty applications submitted across your institution's colleges. Filter and manage.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-colleges---departments",
        title: "Colleges & Departments",
        content: "Manage the colleges and departments under your institution. Add new colleges, assign departments, and configure their details.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-users",
        title: "Users",
        content: "Manage HR users within your institution. Create accounts, assign roles, and manage access.",
        placement: "right",
        skipBeacon: true,
      },
      {
        target: ".tour-sidebar-master",
        title: "Master Settings",
        content: "Configure master data for your institution: Panel Members, Academic Responsibilities, and other settings.",
        placement: "right",
        skipBeacon: true,
      },
    ],
    hr: [
      {
      target: ".tour-sidebar-job-postings",
      title: "Click Here to Post a Job ",
      content:
        "Create, manage, and track all job postings for your college. Approve or handle the postings job posting status",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: ".tour-sidebar-find-right-talents",
      title: "Find Right Talents",
      content:
        "Browse and discover qualified faculty candidates. Send interest requests and schedule interviews directly from here.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: ".tour-sidebar-applications",
      title: "Applications",
      content:
        "View and manage all faculty applications. Filter by status, college, or department. Update application status and schedule interview rounds.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: ".tour-sidebar-departments",
      title: "Departments",
      content:
        "View and manage the departments under your college. Each department can have its own job postings and applicant pool.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: ".tour-sidebar-master",
      title: "Master Settings",
      content:
        "Configure master data like Panel Members by assinging each member to any departments",
      placement: "right",
      skipBeacon: true,
    },
    ],
  };

  const sidebarSteps = SIDEBAR_STEPS_BY_ROLE[role] ?? SIDEBAR_STEPS_BY_ROLE['hr'];

  const baseSteps = STEPS_BY_ROUTE[router.pathname] ?? DEFAULT_STEPS;

  // For dashboard route, inject role-specific sidebar steps after profile step
  let steps: Step[];
  if (router.pathname === '/') {
    const profileStep = baseSteps.find(s => (s.target as string) === '.tour-profile');
    const restSteps = baseSteps.filter(s => (s.target as string) !== '.tour-profile' && !(s.target as string).startsWith('.tour-sidebar-'));
    steps = [
      ...(profileStep ? [profileStep] : []),
      ...sidebarSteps,
      ...restSteps,
    ];
  } else if (router.pathname === '/faculty/application_detail') {
    // Use role-specific steps for application detail
    steps = APP_DETAIL_STEPS_BY_ROLE[role] ?? APP_DETAIL_STEPS_BY_ROLE['hr'];
  } else {
    steps = baseSteps;
  }

  if (!steps.length) return null;

  return (
    <JoyrideLib
      key={router.pathname}
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
        scrollOffset: 80,
        overlayClickAction: false,
        zIndex: 10000,
        primaryColor: "#1E3786",
        overlayColor: "rgba(0,0,0,0.5)",
        spotlightRadius: 8,
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
      styles={{
        tooltip: {
          borderRadius: 10,
          padding: "16px 20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        },
        tooltipTitle: {
          fontSize: 15,
          fontWeight: 700,
          color: "#1E3786",
        },
        tooltipContent: {
          fontSize: 13,
          paddingTop: 6,
        },
        buttonPrimary: {
          backgroundColor: "#1E3786",
          borderRadius: 6,
          fontSize: 13,
        },
        buttonBack: {
          color: "#1E3786",
          fontSize: 13,
        },
        buttonSkip: {
          color: "#888",
          fontSize: 12,
        },
      }}
    />
  );
}
