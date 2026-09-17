import { useEffect, useState } from "react";
import IconChevronLeft from "@/components/Icon/IconArrowLeft";
import IconChevronRight from "@/components/Icon/IconArrowForward";
import IconArrowBackward from "../Icon/IconArrowBackward";

const Pagination = (props) => {
  const { activeNumber, totalPage, currentPages, pageSize = 10 } = props;
  const totalPages = Math.ceil(totalPage / pageSize);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(currentPages);
  }, [currentPages]);

  const handlePrevClick = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      activeNumber(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      activeNumber(currentPage + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    activeNumber(pageNumber);
  };

  const renderPageNumbers = () => {
    let pageNumbers = [];
    const pageBuffer = 1;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push("...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1, "...");
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1, "...");
      for (let i = currentPage - pageBuffer; i <= currentPage + pageBuffer; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push("...", totalPages);
    }

    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalPage);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Records Info */}
      <div className="text-sm text-[#000] dark:text-[#000]">
        Showing <span className="font-medium text-[#000] dark:text-white">{startRecord}</span> to{" "}
        <span className="font-medium text-[#000] dark:text-white">{endRecord}</span> of{" "}
        <span className="font-medium text-[#000] dark:text-white">{totalPage}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevClick}
          disabled={currentPage === 1}
          className={`group flex items-center gap-2 rounded-xl px-3 py-1 text-sm font-medium transition-all duration-200 ${
            currentPage === 1
              ? "cursor-not-allowed bg-gray-100 text-[#000] dark:bg-gray-800 dark:text-[#000]"
              : "bg-white text-[#000] shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700"
          }`}
        >
          <IconArrowBackward className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center">
          {renderPageNumbers().map((pageNumber, index) => {
            if (pageNumber === "...") {
              return (
                <div
                  key={index}
                  className="flex h-10 w-10 items-center justify-center text-[#000] dark:text-[#000]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="3" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="17" cy="10" r="1.5" />
                  </svg>
                </div>
              );
            }

            const isActive = pageNumber === currentPage;
            return (
              <button
                key={index}
                onClick={() => handlePageClick(pageNumber)}
                className={`relative flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-dblue text-white shadow-lg "
                    : "text-[#000] hover:bg-gray-100 hover:text-[#000] dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-20"></div>
                )}
                <span className="relative z-10">{pageNumber}</span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextClick}
          disabled={currentPage === totalPages}
          className={`group flex items-center gap-2 rounded-xl px-3 py-1 text-sm font-medium transition-all duration-200 ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-gray-100 text-[#000] dark:bg-gray-800 dark:text-[#000]"
              : "bg-white text-[#000] shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
