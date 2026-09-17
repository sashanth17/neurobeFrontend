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

export const Models = {
  test,
  auth,
  department,
  programme: programmes,
  programmes,
  batch: batches,
  batches,
  course,
  course_instance,
  stats,
  users,
  user_import,
  course_import,
  course_instructor,
  syllabus,
  job,
  lession_plan,
  learning_material,
  COPOMap,
  topics,
  pedagogy,
};

export default Models;
