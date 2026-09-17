import { useState, useEffect } from "react";
import { DataTable } from "mantine-datatable";
import IconLoader from "@/components/Icon/IconLoader";
import { ArrowLeft, ArrowRight, Forward } from "lucide-react";

interface TableComponentProps {
  records: any[];
  columns: any[];
  loading?: boolean;
  noRecordsText?: string;
  pageSize?: number;
  showPagination?: boolean;
  paginationLabel?: string;
}

const TableComponent = ({
  records,
  columns,
  loading,
  noRecordsText = "No records found",
  pageSize = 8,
  showPagination = false,
  paginationLabel = "records",
}: TableComponentProps) => {
  const [page, setPage] = useState(1);

  // reset to page 1 whenever records change (e.g. filter applied)
  useEffect(() => { setPage(1); }, [records]);

  const totalPages = Math.max(1, Math.ceil(records?.length / pageSize));
  const paginated  = showPagination
    ? records?.slice((page - 1) * pageSize, page * pageSize)
    : records;

  const goTo = (p: number) => { if (p >= 1 && p <= totalPages) setPage(p); };

  const from = records?.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, records?.length);

  return (
    <div>
      <DataTable
        noRecordsText={noRecordsText}
        highlightOnHover
        className="whitespace-nowrap table-style"
        records={paginated}
        columns={columns}
        fetching={loading}
        customLoader={
          <div className="flex items-center justify-center py-12">
            <IconLoader className="h-6 w-6 animate-spin text-color2" />
          </div>
        }
        minHeight={200}
      />

      {showPagination && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
          {/* count */}
          <p className="text-xs text-[#000]">
            Showing {from}–{to} of {records?.length} {paginationLabel}
          </p>

          {/* pages */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#000] hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-[#7c3aed] text-white"
                    : "border border-gray-200 text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#000] hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableComponent;
