import { useState, useEffect } from "react";
import Models from "@/imports/models.import";
import { commonInstance } from "@/utils/axios.utils";

export interface COOption {
  value: string;
  label: string;
  description?: string;
}

export const DEFAULT_FALLBACK_COS: COOption[] = [
  { value: "CO1", label: "CO1" },
  { value: "CO2", label: "CO2" },
  { value: "CO3", label: "CO3" },
  { value: "CO4", label: "CO4" },
  { value: "CO5", label: "CO5" },
];

export const useCourseOutcomes = (courseId?: string | number) => {
  const [coOptions, setCoOptions] = useState<COOption[]>(DEFAULT_FALLBACK_COS);
  const [coCodes, setCoCodes] = useState<string[]>(["CO1", "CO2", "CO3", "CO4", "CO5"]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;
    setLoading(true);

    const fetchCOs = async () => {
      try {
        let outcomes: any[] = [];
        try {
          const res: any = await Models.COPOMap.get_active(courseId);
          outcomes = res?.course_outcomes || res?.matrix_entries || (Array.isArray(res) ? res : []);
        } catch {
          const res: any = await commonInstance().get(`course/copo?course_id=${courseId}`);
          const data = Array.isArray(res.data) ? res.data : [res.data];
          const active = data.find((d: any) => d?.is_active === true) || data[0];
          outcomes = active?.course_outcomes || active?.matrix_entries || [];
        }

        if (isMounted && Array.isArray(outcomes) && outcomes.length > 0) {
          const extractedCodes: string[] = [];
          const formattedOptions: COOption[] = [];

          outcomes.forEach((co: any) => {
            const code = (co.co_code || co.code || (co.course_outcome_id ? `CO${co.course_outcome_id}` : null) || "").trim();
            if (code && !extractedCodes.includes(code)) {
              extractedCodes.push(code);
              const desc = co.description || co.co_description || "";
              formattedOptions.push({
                value: code,
                label: desc ? `${code} — ${desc.length > 40 ? desc.slice(0, 40) + "..." : desc}` : code,
                description: desc,
              });
            }
          });

          if (extractedCodes.length > 0) {
            setCoCodes(extractedCodes);
            setCoOptions(formattedOptions);
          }
        }
      } catch (err) {
        console.warn("[useCourseOutcomes] Failed to fetch COs dynamically:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCOs();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  return { coOptions, coCodes, loading };
};

export default useCourseOutcomes;
