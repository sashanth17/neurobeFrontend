import { useState, useEffect, useCallback, useRef } from 'react';
import Models from '@/imports/models.import';

export type StageStatus =
  | 'not_started'
  | 'redis_queued'
  | 'generating'
  | 'draft'
  | 'approved'
  | 'cancelled_by_user'
  | 'cancelled_by_server'
  | 'failed';

export interface StageWorkflowData {
  stage: string;
  status: StageStatus;
  active_version: number;
  job_id: string | null;
  total_versions: number;
  dependency: string | null;
  upstream_version_used?: number;
  can_generate: boolean;
}

export interface CourseWorkflow {
  step_1_syllabus_extraction: StageWorkflowData;
  step_2_copo_mapping: StageWorkflowData;
  step_3_topic_hierarchy: StageWorkflowData;
  step_4_pedagogy_generation: StageWorkflowData;
  step_5_lesson_plan_schedules: StageWorkflowData;
}

export interface WorkflowStatusResponse {
  course_id: number;
  syllabus_id: number;
  course_code: string;
  workflow: CourseWorkflow;
}

export function useCourseWorkflowStatus(courseId?: number | string | null, pollIntervalMs: number = 3000) {
  const [workflowStatus, setWorkflowStatus] = useState<CourseWorkflow | null>(null);
  const [courseDetails, setCourseDetails] = useState<{ course_id?: number; syllabus_id?: number; course_code?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      const res: any = await Models.syllabus.get_workflow_status(courseId);
      if (res) {
        setCourseDetails({
          course_id: res.course_id,
          syllabus_id: res.syllabus_id,
          course_code: res.course_code,
        });
        const wf = res.workflow || res;
        setWorkflowStatus(wf);
        setError(null);
        return wf;
      }
    } catch (err) {
      console.warn(`[useCourseWorkflowStatus] Failed for course ${courseId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      const wf = await fetchStatus();
      if (!isMounted) return;

      // Check if any stage is in-progress ('redis_queued' or 'generating')
      if (wf) {
        const stages = Object.values(wf) as StageWorkflowData[];
        const hasActiveJobs = stages.some(
          (s) => s?.status === 'redis_queued' || s?.status === 'generating'
        );

        if (hasActiveJobs) {
          timerRef.current = setTimeout(run, pollIntervalMs);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fetchStatus, pollIntervalMs]);

  return {
    workflowStatus,
    courseDetails,
    loading,
    error,
    refetch: fetchStatus,
  };
}
