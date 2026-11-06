import { useEffect } from "react";
import { useRouter } from "next/router";
import PrivateRouter from "@/hook/privateRouter";
import { Loader2 } from "lucide-react";

const CIAQuestionPaperEditRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const courseId = router.query.course_id || router.query.courseId;
    if (courseId) {
      router.replace(`/neurobe/question-bank/${courseId}?tab=cia-tests`);
    } else {
      router.replace("/neurobe/my-assigned-courses");
    }
  }, [router.isReady, router.query, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Redirecting to CIA Assessments & Question Paper Templates...
      </p>
    </div>
  );
};

export default PrivateRouter(CIAQuestionPaperEditRedirect);
