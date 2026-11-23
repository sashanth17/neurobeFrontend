import React, { useEffect } from "react";
import { useRouter } from "next/router";
import MyAssignedCourses from "./my-assigned-courses";

const MyAssignedDepartments = () => {
  const router = useRouter();

  useEffect(() => {
    if (router.query.tab !== "departments") {
      router.replace("/neurobe/my-assigned-courses?tab=departments", undefined, { shallow: true });
    }
  }, [router]);

  return <MyAssignedCourses />;
};

export default MyAssignedDepartments;
