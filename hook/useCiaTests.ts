import { useState, useEffect, useCallback } from "react";
import Models from "@/imports/models.import";
import { CIATestItem } from "@/types/cia-test.types";
import { Success, Failure } from "@/utils/function.utils";

export const useCiaTests = (courseId: number | string) => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeTests, setActiveTests] = useState<CIATestItem[]>([]);
  const [archivedTests, setArchivedTests] = useState<CIATestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTests = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      // Fetch both active and archived in parallel for fast tab switching
      const [activeRes, archivedRes]: any = await Promise.all([
        Models.cia_test.listByCourse(courseId, { is_archived: false }).catch(() => []),
        Models.cia_test.listByCourse(courseId, { is_archived: true }).catch(() => []),
      ]);

      const parseList = (res: any): CIATestItem[] => {
        if (Array.isArray(res)) return res;
        if (res?.items && Array.isArray(res.items)) return res.items;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
      };

      setActiveTests(parseList(activeRes));
      setArchivedTests(parseList(archivedRes));
    } catch (err: any) {
      console.error("Failed to load CIA tests:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleArchive = async (testId: number) => {
    try {
      setActionLoadingId(testId);
      await Models.cia_test.archive(testId);
      Success("CIA test successfully moved to archive");
      await fetchTests();
    } catch (err: any) {
      Failure(err?.message || "Failed to archive CIA test");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnarchive = async (testId: number) => {
    try {
      setActionLoadingId(testId);
      await Models.cia_test.unarchive(testId);
      Success("CIA test restored to active assessments");
      await fetchTests();
    } catch (err: any) {
      Failure(err?.message || "Failed to restore CIA test");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (testId: number) => {
    try {
      setActionLoadingId(testId);
      await Models.cia_test.delete(testId);
      Success("CIA test deleted successfully");
      await fetchTests();
    } catch (err: any) {
      Failure(err?.message || "Failed to delete test");
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = activeTab === "active" ? activeTests : archivedTests;

  const filteredTests = currentList.filter((test) => {
    const matchesSearch =
      !search ||
      test.test_name?.toLowerCase().includes(search.toLowerCase()) ||
      test.test_code?.toLowerCase().includes(search.toLowerCase()) ||
      test.branch?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      test.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return {
    activeTab,
    setActiveTab,
    activeTests,
    archivedTests,
    filteredTests,
    loading,
    actionLoadingId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: fetchTests,
    handleArchive,
    handleUnarchive,
    handleDelete,
  };
};

export default useCiaTests;
