import React from "react";
import BookRowItem, { BookItem } from "./BookRowItem";

export interface TextbooksCardProps {
  title?: string;
  headerSubtitle?: string;
  textbooks?: BookItem[];
  className?: string;
}

const TextbooksCard: React.FC<TextbooksCardProps> = ({
  title = "TEXTBOOKS",
  headerSubtitle = "Approved Prescribed Literature",
  textbooks = [],
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-5 flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="text-md font-bold">{title}</span>

        </div>
        <span className="text-xs font-mono font-medium text-pri dark:text-pri">
          {headerSubtitle}
        </span>
      </div>

      {/* List of Textbooks using BookRowItem inner component */}
      <div className="space-y-2">
        {textbooks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No approved textbooks prescribed for this course.
          </div>
        ) : (
          textbooks.map((book, idx) => (
            <BookRowItem
              key={book.id || idx}
              index={idx + 1}
              title={book.title}
              authors={book.authors}
              publisher={book.publisher}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TextbooksCard;
