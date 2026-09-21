export const CLIENT_ID =
  "625052261407-4p8ihs05c67d778mr5d91lqjvnvpkd8k.apps.googleusercontent.com";

// export const BACKEND_URL = "http://31.97.206.165/api/";

// export const BACKEND_URL = "http://88.222.213.249/api/";
export const BACKEND_URL = "http://localhost:8080/";
export const FRONTEND_URL = "https://localhost:3000";

export const CALENDAR_CLIENT_ID =
  "130334216230-5ur5a79k0k203lu20eri4crgkic25j9q.apps.googleusercontent.com";

export const CAPTCHA_SITE_KEY = "6LeEe9gsAAAAAKddSPmwNUF4J-v7zaz8CgeKZ7n3";

export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  ERP_ADMIN: "ERP Admin",
  COURSE_COORDINATOR: "Course Coordinator",
  COURSE_INSTRUCTOR: "Course Instructor",
  STUDENT: "Student",
  FACULTY: "Faculty",
};

export const DROPDOWN_ROLES = [
  {
    value: ROLES.ERP_ADMIN,
    label: "ERP Admin",
  },
  {
    value: ROLES.FACULTY,
    label: "Faculty",
  },
  {
    value: ROLES.STUDENT,
    label: "Student",
  },
];

export const DROPDOWN_USER_ROLES = DROPDOWN_ROLES;

export const DROPDOWN_JOB_ROLES = [
  {
    value: ROLES.COURSE_COORDINATOR,
    label: "Course Coordinator",
  },
  {
    value: ROLES.COURSE_INSTRUCTOR,
    label: "Instructor",
  },
  {
    value: ROLES.STUDENT,
    label: "Student",
  },
];

export const DROPDOWN_INSTITUTION_ADMIN = [
  {
    value: ROLES.COURSE_COORDINATOR,
    label: "Course Coordinator",
  },
  {
    value: ROLES.COURSE_INSTRUCTOR,
    label: "Instructor",
  },
  {
    value: ROLES.STUDENT,
    label: "Student",
  },
];

export const OwnmenuConfig = {
  ERP_ADMIN: [
    {
      type: "heading",
      label: "CORE WORKSPACES",
    },
    {
      type: "link",
      icon: "IconMenuDashboard",
      label: "Academic Setup",
      href: "/neurobe/academic-setup",
    },
    {
      type: "link",
      icon: "IconMenuForms",
      label: "Course Offerings",
      href: "/neurobe/course-offering",
    },
    {
      type: "link",
      icon: "IconMenuUsers",
      label: "User Management",
      href: "/neurobe/user-list",
    },

    {
      type: "link",
      icon: "IconMenuTables",
      label: "Roles & Permissions",
      href: "/neurobe/roles-permissions",
      notifyKey: "new_application_count",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Bulk Import",
      href: "/neurobe/bulk-import",
    },

    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Audit Trial",
      href: "/neurobe/audit-trial",
    },

    {
      type: "submenu",
      icon: "IconMenuCharts",
      label: "Masters",
      key: "master",
      children: [
        {
          label: "Degree Level",
          href: "/faculty/master/hr_panel",
        },
        {
          label: "Batch",
          href: "/faculty/master/additional_academic_responsibilities",
        },
        {
          label: "Academic Term / Semester",
          href: "/faculty/master/additional_academic_responsibilities",
        },
        {
          label: "Entity",
          href: "/faculty/master/additional_academic_responsibilities",
        },
      ],
    },
  ],

  COURSE_COORDINATOR: [
    {
      type: "link",
      icon: "IconMenuDashboard",
      label: "My Assigned Courses",
      href: "/neurobe/my-assigned-courses",
      className: "pb-2",
    },
    {
      type: "heading",
      label: "INSTRUCTOR FUNCTIONS",
      className: "pb-2 pt-2",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Course Artifacts",
      href: "/neurobe/course-artifacts",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Student Enrollment",
      href: "/neurobe/student-enrollment",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "MCQ Test Execution",
      href: "/neurobe/mcq-test-execution",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Results & Analysis",
      href: "/neurobe/result-analysis",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Marks Extraction & Verification",
      href: "/neurobe/marks-extraction",
    },
    // {
    //   type: "submenu",
    //   icon: "IconMenuCharts",
    //   label: "Masters",
    //   key: "master",
    //   children: [
    //     {
    //       label: "Degree Level",
    //       href: "/faculty/master/hr_panel",
    //     },
    //     {
    //       label: "Batch",
    //       href: "/faculty/master/additional_academic_responsibilities",
    //     },
    //     {
    //       label: "Academic Term / Semester",
    //       href: "/faculty/master/additional_academic_responsibilities",
    //     },
    //     {
    //       label: "Entity",
    //       href: "/faculty/master/additional_academic_responsibilities",
    //     },
    //   ],
    // },
  ],
  COURSE_INSTRUCTOR: [
    {
      type: "heading",
      label: "INSTRUCTOR FUNCTIONS",
    },
    {
      type: "link",
      icon: "IconMenuDashboard",
      label: "My Assigned Courses",
      href: "/neurobe/my-assigned-courses",
    },
    {
      type: "link",
      icon: "IconMenuForms",
      label: "Course Artifacts",
      href: "/neurobe/ins-course-artifacts",
    },
    {
      type: "link",
      icon: "IconMenuUsers",
      label: "Student Enrollment",
      href: "/neurobe/ins-student-enrollment",
    },

    {
      type: "link",
      icon: "IconMenuTables",
      label: "MCQ Test Execution",
      href: "/neurobe/ins-mcq-test-execution",
      notifyKey: "new_application_count",
    },
    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Results & Analysis",
      href: "/neurobe/ins-result-analysis",
    },

    {
      type: "link",
      icon: "IconMenuNotes",
      label: "Marks Extraction & Verification",
      href: "/neurobe/ins-marks-extraction",
    },
  ],
};

OwnmenuConfig.FACULTY = [
  {
    type: "link",
    icon: "IconMenuDashboard",
    label: "My Assigned Courses",
    href: "/neurobe/my-assigned-courses",
    className: "pb-2",
  },
  {
    type: "heading",
    label: "INSTRUCTOR FUNCTIONS",
    className: "pb-2 pt-2",
  },
  {
    type: "link",
    icon: "IconMenuNotes",
    label: "Course Artifacts",
    href: "/neurobe/ins-course-artifacts",
  },
  {
    type: "link",
    icon: "IconMenuNotes",
    label: "Student Enrollment",
    href: "/neurobe/ins-student-enrollment",
  },
  {
    type: "link",
    icon: "IconMenuNotes",
    label: "MCQ Test Execution",
    href: "/neurobe/ins-mcq-test-execution",
  },
  {
    type: "link",
    icon: "IconMenuNotes",
    label: "Results & Analysis",
    href: "/neurobe/ins-result-analysis",
  },
  {
    type: "link",
    icon: "IconMenuNotes",
    label: "Marks Extraction & Verification",
    href: "/neurobe/ins-marks-extraction",
  },
];

// Aliases for role lookup consistency
OwnmenuConfig["ERP Admin"] = OwnmenuConfig.ERP_ADMIN;
OwnmenuConfig["Course Coordinator"] = OwnmenuConfig.COURSE_COORDINATOR;
OwnmenuConfig["Course Instructor"] = OwnmenuConfig.COURSE_INSTRUCTOR;
OwnmenuConfig["Faculty"] = OwnmenuConfig.FACULTY;
OwnmenuConfig["Super Admin"] = OwnmenuConfig.ERP_ADMIN;
OwnmenuConfig.erp = OwnmenuConfig.ERP_ADMIN;
OwnmenuConfig.hr = OwnmenuConfig.COURSE_COORDINATOR;
OwnmenuConfig.instructor = OwnmenuConfig.COURSE_INSTRUCTOR;
OwnmenuConfig.faculty = OwnmenuConfig.FACULTY;

/**
 * Returns the respective menu items based on the user's role
 */
export const getMenuByRole = (role) => {
  if (!role) return OwnmenuConfig.ERP_ADMIN;
  const normalized = String(role).trim().toUpperCase().replace(/\s+/g, "_");

  if (
    normalized === "ERP_ADMIN" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "ERP" ||
    normalized === "ADMIN"
  ) {
    return OwnmenuConfig.ERP_ADMIN;
  }
  if (
    normalized === "COURSE_COORDINATOR" ||
    normalized === "COORDINATOR" ||
    normalized === "HR"
  ) {
    return OwnmenuConfig.COURSE_COORDINATOR;
  }
  if (normalized === "FACULTY") {
    return OwnmenuConfig.FACULTY;
  }
  if (
    normalized === "COURSE_INSTRUCTOR" ||
    normalized === "INSTRUCTOR"
  ) {
    return OwnmenuConfig.COURSE_INSTRUCTOR;
  }

  return (
    OwnmenuConfig[role] || OwnmenuConfig[normalized] || OwnmenuConfig.ERP_ADMIN
  );
};

/**
 * Returns the default landing page for each user role
 */
export const getDefaultRouteByRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
    
  if (
    normalized === "FACULTY" ||
    normalized === "STUDENT" ||
    normalized === "COURSE_COORDINATOR" ||
    normalized === "COORDINATOR" ||
    normalized === "COURSE_INSTRUCTOR" ||
    normalized === "INSTRUCTOR"
  ) {
    return "/neurobe/my-assigned-courses";
  }

  // Default for ERP Admin and Super Admin
  return "/neurobe/academic-setup";
};

export const UNIT_TABS = [
  { key: "unit-1", label: "Unit 1", count: 4 },
  { key: "unit-2", label: "Unit 2", count: 3 },
  { key: "unit-3", label: "Unit 3", count: 4 },
  { key: "unit-4", label: "Unit 4", count: 3 },
  { key: "unit-5", label: "Unit 5", count: 3 },
];

export const MCQ_TABS = [
  { key: "unit-1", label: "All Tests", count: 4 },
  { key: "unit-2", label: "Needs Access Setup", count: 3 },
  { key: "unit-3", label: "Upcoming", count: 4 },
  { key: "unit-4", label: "Live", count: 3 },
  { key: "unit-5", label: "Completed", count: 3 },
];

export const QUS_TABS = [
  { key: "unit-1", label: "All", count: 18 },
  { key: "unit-2", label: "Approved", count: 12 },
  { key: "unit-3", label: "Reviewed", count: 3 },
  { key: "unit-4", label: "Draft", count: 3 },
];

export const UNIT_LIST = [
  {
    label: "Unit 1",
    title: "Physical Layer & Network Architecture",
    count: 5,
    topics: [
      {
        name: "Network Models & Layered Architecture",
        count: 2,
        subtopics: [
          { name: "OSI vs TCP/IP Model", count: 1 },
          { name: "Protocol Layering Concepts", count: 1 },
        ],
      },
      {
        name: "Physical Layer & Transmission Media",
        count: 1,
        subtopics: [{ name: "Guided & Unguided Media", count: 1 }],
      },
      {
        name: "Network Topologies & Switching Techniques",
        count: 1,
        subtopics: [{ name: "Circuit vs Packet Switching", count: 1 }],
      },
      {
        name: "Network Performance Metrics",
        count: 1,
        subtopics: [{ name: "Propagation vs Transmission Delay", count: 1 }],
      },
    ],
  },
  {
    label: "Unit 2",
    title: "Data Link Layer & MAC Protocols",
    count: 4,
    topics: [
      { name: "Framing & Error Control Mechanisms", count: 1 },
      { name: "Sliding Window Flow Control Protocols", count: 1 },
      { name: "Medium Access Control (MAC) Sublayer", count: 1 },
      { name: "Ethernet & Data Link Switching", count: 1 },
    ],
  },
  {
    label: "Unit 3",
    title: "Network Layer & Routing Protocols",
    count: 4,
    topics: [
      { name: "IPv4 Addressing & Subnet Design", count: 1 },
      { name: "IPv6 & Network Helper Protocols", count: 1 },
      { name: "Unicast Routing Algorithms", count: 1 },
      { name: "Hierarchical & Inter-Domain Routing", count: 1 },
    ],
  },
  {
    label: "Unit 4",
    title: "Transport Layer & Congestion Control",
    count: 3,
    topics: [
      { name: "Transport Layer Services & Port Addressing", count: 1 },
      { name: "TCP Connection Management & Handshake", count: 1 },
      { name: "TCP Reliable Data Transfer & Sliding Window", count: 0 },
      { name: "TCP Congestion Control Algorithms", count: 1 },
    ],
  },
];

export const propertyType = [
  { value: 1, label: "Sale" },
  { value: 2, label: "Rent" },
  { value: 3, label: "Lease" },

  { value: 4, label: "Plot" },
];

export const FURNISHING_TYPE = [
  { value: "furnished", label: "Furnished" },
  {
    value: "semi_furnished",
    label: "Semi-Furnished",
  },
  { value: "unfurnished", label: "Unfurnished" },
];

export const ListType = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
  { value: "lease", label: "Lease" },
];

export const commemrcialType = [
  { value: 1, label: "Buy" },
  { value: 2, label: "Lease" },
];

export const facingDirection = [
  { value: 1, label: "North" },
  { value: 2, label: "East" },
  { value: 3, label: "West" },
  { value: 4, label: "South" },
  { value: 5, label: "North-East" },
  { value: 6, label: "South-East" },
  { value: 7, label: "South-West" },
  { value: 8, label: "North-West" },
  { value: 9, label: "East-Facing Corner" },
  { value: 10, label: "West-Facing Corner" },
];

export const Furnishing = [
  { value: 1, label: "Furnished" },
  {
    value: 2,
    label: "Semi-Furnished",
  },
  { value: 3, label: "Unfurnished" },
];

export const FLOORPLANS_CATEGORY = [
  { value: "plots", label: "Plots" },
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
  { value: "3bhk", label: "3 BHK" },
  { value: "4bhk", label: "4 BHK" },
];

export const Property_status = [
  { value: "available", label: "Available" },
  {
    value: "sold",
    label: "Sold",
  },
  { value: "rented", label: "Rented" },
  { value: "off_market", label: "Off Market" },
  { value: "under_contract", label: "Under Contract" },
  { value: "pending", label: "pending" },
];

export const PROPERTY_TYPE = {
  COMMERCIAL: "Commercial",
  RESIDENTIAL: "Residential",
  INDUSTRY: "Industry",
  AGRICULTURAL: "Agricultural",
};

export const LISTING_TYPE = {
  SALE: "Sale",
  RENT: "Rent",
  LEASE: "Lease",
};

export const LISTING_TYPE_LIST = {
  LEASE: "lease",
  SALE: "sale",
  RENT: "rent",
};

export const roleList = [
  {
    value: "developer",
    label: "Developer",
  },
  {
    value: "agent",
    label: "Agent",
  },
  {
    value: "seller",
    label: "Seller",
  },
  {
    value: "buyer",
    label: "Buyer",
  },
];

export const PROPERTY_IMG = [
  "https://www.pexels.com/photo/sun-piercing-of-brown-concrete-house-near-sea-1732414/",
  "https://www.pexels.com/photo/high-angle-photography-of-village-280221/",
  "https://www.pexels.com/photo/white-and-gray-wooden-house-near-grass-field-and-trees-280222/",
  "https://www.pexels.com/photo/lighted-beige-house-1396132/",
];

export const LEAD_SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "cold_call", label: "Cold Call" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "walk_in", label: "Walk In" },
  // { value: "other", label: "Other" }
];

export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const FILTER_ROLES = [
  {
    value: "developer",
    label: "Developer",
  },
  {
    value: "agent",
    label: "Agent",
  },
  {
    value: "seller",
    label: "Seller",
  },
];

export const GENDER_OPTION = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const EXPERIENCE = [
  { value: "fresher", label: "Fresher" },
  { value: "0 – 1 Year", label: "0 – 1 Year" },
  { value: "1 – 3 Years", label: "1 – 3 Years" },
  { value: "3 – 5 Years", label: "3 – 5 Years" },
  { value: "5 – 10 Years", label: "5 – 10 Years" },
  { value: "10+ Years", label: "10+ Years" },
];

export const JOB_TYPE = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
];

export const STATUS_COLOR = {
  Applied: "bg-gray-100 text-[#000]",
  Shortlisted: "bg-indigo-100 text-indigo-800",
  "Interview Scheduled ": "bg-blue-100 text-blue-800",
  Selected: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

export const JOB_STATUS = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
];

export const RECORDS = [
  {
    value: 1,
    label: "All Records",
  },
  {
    value: 2,
    label: "Hr Records",
  },
  {
    value: 3,
    label: "Admin Records",
  },
];

export const RECORDS_FOR_INS_ADMIN = [
  {
    value: 1,
    label: "All Records",
  },
  {
    value: 2,
    label: "College Admin Records",
  },
  {
    value: 3,
    label: "Admin Records",
  },
];

export const PREFERENCES = [
  {
    value: 1,
    label: "PhD Completed",
  },
  {
    value: 2,
    label: "NET Cleared",
  },
  {
    value: 3,
    label: "SET Cleared",
  },
  {
    value: 4,
    label: "SLET Cleared",
  },
];

export const RECORDS_FOR_ADMIN = [
  {
    value: 1,
    label: "All Records",
  },
  {
    value: 2,
    label: "Own Records",
  },
  {
    value: 3,
    label: "Not Own Records",
  },
];

// ─── AI Generation Stage Status Constants ────────────────────────────────────
// Mirrors backend GenerationTaskStatusEnum (shared/models/course/enums.py)
export const AI_GENERATION_STATUS = {
  NOT_STARTED: "not_started",
  REDIS_QUEUED: "redis_queued",
  GENERATING: "generating",
  DRAFT: "draft",
  APPROVED: "approved",
  CANCELLED_BY_USER: "cancelled_by_user",
  CANCELLED_BY_SERVER: "cancelled_by_server",
  FAILED: "failed",
};

/** Statuses that mean a job is still running (should keep polling) */
export const AI_ACTIVE_STATUSES = [
  AI_GENERATION_STATUS.REDIS_QUEUED,
  AI_GENERATION_STATUS.GENERATING,
];

/** Statuses that mean generation completed and output is available for review */
export const AI_DONE_STATUSES = [
  AI_GENERATION_STATUS.DRAFT,
  AI_GENERATION_STATUS.APPROVED,
];

/** Statuses that mean something went wrong and the user can retry */
export const AI_ERROR_STATUSES = [
  AI_GENERATION_STATUS.FAILED,
  AI_GENERATION_STATUS.CANCELLED_BY_USER,
  AI_GENERATION_STATUS.CANCELLED_BY_SERVER,
];

/** Returns true if the given status represents an in-progress job */
export const isAIStatusActive = (status) =>
  AI_ACTIVE_STATUSES.includes(status);

/** Returns true if generation is complete and reviewable */
export const isAIStatusDone = (status) => AI_DONE_STATUSES.includes(status);

/** Returns true if the job failed or was cancelled */
export const isAIStatusError = (status) => AI_ERROR_STATUSES.includes(status);
