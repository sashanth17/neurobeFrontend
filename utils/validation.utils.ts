import moment from "moment";
import * as Yup from "yup";
import { PROPERTY_TYPE } from "./constant.utils";

export const login = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const forgotPassword = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
});

export const change_password = Yup.object().shape({
  new_password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("New Password is required"),

  confirm_password: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("new_password")], "Passwords must match"),

  current_password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Current Password is required"),
});

export const update_profile = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  username: Yup.string().required("Username is required"),
});

export const signin = Yup.object().shape({
  password: Yup.string().required("Password is required"),
  user_type: Yup.string().required("Role is required"),
  phone: Yup.string().required("Phone Number is required"),
  email: Yup.string().required("Email is required"),
  last_name: Yup.string().required("Last name is required"),
  first_name: Yup.string().required("First name is required"),
});

export const user = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const CreateInstituion = Yup.object().shape({
  institution_name: Yup.string().required("Institution name is required"),
  institution_code: Yup.string().required("Institution code is required"),
  institution_email: Yup.string()
    .email("Please enter a valid email address")
    .required("Institution email is required"),
  institution_phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Institution phone is required"),
  address: Yup.string().required("Address is required"),
});

export const CreateCollege = Yup.object().shape({
  institution: Yup.number().required("Institution is required"),
  short_name: Yup.string().required("Short name is required"),

  college_name: Yup.string().required("College name is required"),
  college_code: Yup.string().required("College code is required"),
  college_email: Yup.string()
    .email("Please enter a valid email address")
    .required("College email is required"),
  college_phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("College phone is required"),
  location_id: Yup.number().required("Location is required"),
  college_address: Yup.string().required("College address is required"),
  category: Yup.array()
    .min(1, "At least one category is required")
    .required("Category is required")
    .nullable(true),
});

export const CreateCollegeForm = Yup.object().shape({
  college_name: Yup.string().required("College name is required"),
  college_code: Yup.string().required("College code is required"),
  college_email: Yup.string()
    .email("Please enter a valid email address")
    .required("College email is required"),
  college_phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("College phone is required"),
  college_address: Yup.string().required("College address is required"),
});

export const CreateUser = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password_confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  role: Yup.string().required("Role is required"),
  gender: Yup.string().required("Gender is required"),
  education_qualification: Yup.string().required(
    "Education qualification is required"
  ),
  institution: Yup.number().when("role", {
    is: "institution_admin",
    then: (schema) => schema.required("Institution is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  college: Yup.number().when("role", {
    is: "hr",
    then: (schema) => schema.required("College is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  department: Yup.number().when("role", {
    is: "hod",
    then: (schema) => schema.required("Department is required"),
    otherwise: (schema) => schema.nullable(),
  }),
});

export const CreateInstitutionAdmin = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),

  password_confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  gender: Yup.string().required("Gender is required"),
  education_qualification: Yup.string().required(
    "Education qualification is required"
  ),
});

export const CreateHR = Yup.object().shape({
  hr_username: Yup.string().required("Username is required"),
  hr_email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  hr_password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  hr_password_confirm: Yup.string()
    .oneOf([Yup.ref("hr_password")], "Passwords must match")
    .required("Confirm password is required"),
  hr_phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  hr_gender: Yup.string().required("Gender is required"),
  hr_education_qualification: Yup.string().required(
    "Education qualification is required"
  ),
});

export const CreateHOD = Yup.object().shape({
  hod_username: Yup.string().required("Username is required"),
  hod_email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  hod_password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  hod_confirm_password: Yup.string()
    .oneOf([Yup.ref("hod_password")], "Passwords must match")
    .required("Confirm password is required"),
  hod_phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  hod_gender: Yup.string().required("Gender is required"),
  hod_qualification: Yup.string().required("Qualification is required"),
});

export const CreateDepartment = Yup.object().shape({
  department_name: Yup.string().required("Department name is required"),
  // department_code: Yup.string().required("Department code is required"),
});

export const CreateNewJob = Yup.object().shape({
  // title: Yup.string().required("Job title is required"),

  // location: Yup.array()
  //   .min(1, "At least one location is required")
  //   .required("Location is required"),
  // institution: Yup.mixed().required("Institution is required").nullable(false),

  college: Yup.mixed().required("College is required").nullable(false),
  department: Yup.array()
    .min(1, "At least one Department is required")
    .required("Department is required")
    .nullable(true),
  // salary: Yup.string().required("Salary range is required"),

  jobRole: Yup.string().required("Job role is required").nullable(true),

  priority: Yup.string().required("Job urgency is required"),
  immediateHiring: Yup.boolean(),
  // deadline: Yup.string().required("Deadline is required"),
  // startDate: Yup.string().required("Start date is required"),
  // endDate: Yup.string().required("End date is required"),

  experience: Yup.string().required("Experience is required"),
  qualification: Yup.mixed().required("Qualification is required"),
  // keyResponsibility: Yup.object()
  //   .test("has-blocks", "Key responsibilities are required", (value: any) => {
  //     if (
  //       !value ||
  //       !value.blocks ||
  //       !Array.isArray(value.blocks) ||
  //       value.blocks.length === 0
  //     ) {
  //       return false;
  //     }
  //     return value.blocks.some((block: any) => {
  //       if (
  //         block.type === "list" &&
  //         block.data &&
  //         block.data.items &&
  //         Array.isArray(block.data.items)
  //       ) {
  //         return block.data.items.some(
  //           (item: string) => item && item.trim().length > 0
  //         );
  //       }
  //       if (block.data && block.data.text) {
  //         return block.data.text.trim().length > 0;
  //       }
  //       return false;
  //     });
  //   })
  //   .required("Key responsibilities are required"),

  // description: Yup.string().required("Job description is required"),

  applyType: Yup.string().required("Apply type is required"),

  isCollegeEmail: Yup.boolean(),

  applyLink: Yup.string().when("applyType", {
    is: "external",
    then: (schema) =>
      schema.required("Apply link is required").url("Enter a valid URL"),
    otherwise: (schema) => schema.notRequired(),
  }),

  alternativeEmail: Yup.string().when(["applyType", "isCollegeEmail"], {
    is: (applyType: string, isCollegeEmail: boolean) =>
      applyType === "internal" && isCollegeEmail === false,
    then: (schema) =>
      schema
        .required("Alternative email is required")
        .email("Enter a valid email"),
    otherwise: (schema) => schema.notRequired(),
  }),

  // meta_title: Yup.string().required("Meta title is required"),
  // meta_description: Yup.string().required("Meta description is required"),
});

export const panel = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  phone: Yup.string()
    .trim()
    .matches(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number")
    .required("Phone is required"),
  designation: Yup.string().required("Designation is required"),
  department_id: Yup.string().required("Department is required"),
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
  filterCollege: Yup.string().required("College is required"),
});

export const interview = Yup.object().shape({
  selectedJobs: Yup.array()
    .min(1, "At least one job is required")
    .required("Job is required"),

  selectedDepartments: Yup.array()
    .min(1, "At least one department is required")
    .required("Department is required"),

  interviewSlot: Yup.string().required("Interview date is required"),

  panelMembers: Yup.array()
    .min(1, "At least one panel member is required")
    .required("Panel member is required"),

  selectedApplicants: Yup.array()
    .min(1, "At least one faculty is required")
    .required("Faculty is required"),

  roundName: Yup.string().required("Round name is required"),

  interviewStatus: Yup.string().required("Interview status is required"),
});

export const single_interview = Yup.object().shape({
  selectedJobs: Yup.array()
    .min(1, "At least one job is required")
    .required("Job is required"),

  // selectedDepartments: Yup.array()
  //   .min(1, "At least one department is required")
  //   .required("Department is required"),

  interviewSlot: Yup.string().required("Interview date is required"),
  selectedDepartments: Yup.string().required("Department is required"),

  panelMembers: Yup.array()
    .min(1, "At least one panel member is required")
    .required("Panel member is required"),

  selectedApplicants: Yup.array()
    .min(1, "At least one faculty is required")
    .required("Faculty is required"),

  roundName: Yup.string().required("Round name is required"),

  interviewStatus: Yup.string().required("Interview status is required"),
});

export const master_dept = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  short_name: Yup.string().required("Short name is required"),
  job_category_id: Yup.array()
    .min(1, "At least one category is required")
    .required("Category is required"),
});

export const master_job_role = Yup.object().shape({
  role_name: Yup.string().required("Name is required"),
});

export const user_interview = Yup.object().shape({
  interviewSlot: Yup.string().required("Interview date is required"),
  roundName: Yup.string().required("Round name is required"),
});

export const create_hr = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password_confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  gender: Yup.string().required("Gender is required"),
  profile_institution: Yup.string().required("Institution is required"),
});

export const update_hr = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  phone: Yup.string()
    .matches(/^[+]?[0-9]{10,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  gender: Yup.string().required("Gender is required"),
  profile_institution: Yup.string().required("Institution is required"),
});

// Course Offering Validations
export const CreateCourseOfferingForm = Yup.object().shape({
  academic_programme: Yup.string().required("Academic programme is required"),
  batch: Yup.string().required("Batch is required"),
  academic_year: Yup.string().required("Academic year is required"),
  academic_term: Yup.string().required("Academic term / semester is required"),
  course: Yup.string().required("Course is required"),
  course_coordinator: Yup.string().required("Course coordinator is required"),
  additional_instructors: Yup.array().min(0, "Select at least one additional instructor"),
});

// Academic Setup Validations
export const CreateDepartmentForm = Yup.object().shape({
  department_name: Yup.string()
    .required("Department name is required")
    .min(3, "Department name must be at least 3 characters"),
  short_name: Yup.string()
    .required("Short name / Code is required")
    .min(1, "Short name must be at least 1 character")
    .max(10, "Short name must not exceed 10 characters"),
  status: Yup.string().required("Status is required"),
});

export const CreateProgrammeForm = Yup.object().shape({
  programme_name: Yup.string()
    .required("Programme name is required")
    .min(3, "Programme name must be at least 3 characters"),
  short_name: Yup.string()
    .required("Short name is required")
    .min(1, "Short name must be at least 1 character")
    .max(10, "Short name must not exceed 10 characters"),
  associated_department: Yup.string().required("Associated department is required"),
  degree_level: Yup.string().required("Degree level is required"),
  status: Yup.string().required("Status is required"),
});

export const CreateBatchForm = Yup.object().shape({
  batch_year: Yup.string().required("Batch year is required"),
  associated_programme: Yup.string().required("Associated programme is required"),
  status: Yup.string().required("Status is required"),
});

export const CreateCourseForm = Yup.object().shape({
  course_code: Yup.string()
    .required("Course code is required")
    .min(1, "Course code must be at least 1 character"),
  course_title: Yup.string()
    .required("Course title is required")
    .min(3, "Course title must be at least 3 characters"),
  department: Yup.string().required("Department is required"),
  status: Yup.string().required("Status is required"),
  lecture_hours: Yup.number()
    .required("Lecture hours is required")
    .min(0, "Lecture hours must be non-negative"),
  tutorial_hours: Yup.number()
    .required("Tutorial hours is required")
    .min(0, "Tutorial hours must be non-negative"),
  practical_hours: Yup.number()
    .required("Practical hours is required")
    .min(0, "Practical hours must be non-negative"),
  credits: Yup.number()
    .required("Credits is required")
    .min(0, "Credits must be non-negative"),
  total_theory_hours: Yup.number()
    .required("Total theory hours is required")
    .min(0, "Total theory hours must be non-negative"),
  total_lab_hours: Yup.number()
    .required("Total lab hours is required")
    .min(0, "Total lab hours must be non-negative"),
});

export const CreatePSOForm = Yup.object().shape({
  pso_code: Yup.string()
    .required("PSO code is required")
    .min(1, "PSO code must be at least 1 character"),
  programme: Yup.string().required("Programme is required"),
  pso_statement: Yup.string()
    .required("PSO statement description is required")
    .min(10, "PSO statement must be at least 10 characters"),
  version: Yup.string().required("Version is required"),
  status: Yup.string().required("Status is required"),
});

// User Management Validations
export const CreateUserForm = Yup.object().shape({
  first_name: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  last_name: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  register_number: Yup.string()
    .required("Register / Employee number is required")
    .min(3, "Register number must be at least 3 characters"),
  role: Yup.string().required("Role is required"),
  department: Yup.string().required("Department is required"),
  programme: Yup.string().required("Programme is required"),
  batch: Yup.string().required("Batch is required"),
});
