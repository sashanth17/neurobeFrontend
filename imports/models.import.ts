import auth from "@/models/auth.model";
import department from "@/models/department.model";
import programmes from "@/models/program.model";
import batches from "@/models/batch.model";
import course from "@/models/course.model";
import test from "@/models/test.model";
import stats from "@/models/stat.models";
import users from "@/models/users.model";
import user_import from "@/models/user_import.models";
import course_import from "@/models/course_import.models";
import course_instance from "@/models/course_instance.model";
import course_instructor from "@/models/course_instructor.model";
import syllabus from "@/models/syllabus.model";
import job from "@/models/job.model";
import lession_plan from "@/models/lession_plan.model";
import learning_material from "@/models/learning_material.model";
import COPOMap from "@/models/copo_map.models";
import topics from "@/models/topics.models";
import pedagogy from "@/models/pedagogy.models";
import course_enrollment from "@/models/course_enrollment.model";
import faculty from "@/models/faculty.model";
import pso from "@/models/pso.model";
import application from "@/models/application.model";
import master from "@/models/master.model";
import notification from "@/models/notification.model";
import mcq from "@/models/mcq.model";
import cia_test from "@/models/cia_test.model";

export const Models: any = {
  test,
  auth,
  department,
  programme: programmes,
  programmes,
  batch: batches,
  batches,
  course,
  course_instance,
  course_enrollment,
  stats,
  users,
  user_import,
  course_import,
  course_instructor,
  faculty,
  faculties: faculty,
  syllabus,
  job,
  lession_plan,
  learning_material,
  COPOMap,
  topics,
  pedagogy,
  pso,
  psos: pso,
  application,
  master,
  notification,
  mcq,
  cia_test,
  ciaTest: cia_test,
};

export default Models;
