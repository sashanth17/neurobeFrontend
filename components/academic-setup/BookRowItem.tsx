import React from "react";

export interface BookItem {
  id?: string | number;
  title: string;
  authors: string;
  publisher?: string;
}

export interface BookRowItemProps {
  index: number;
  title: string;
  authors: string;
  publisher?: string;
  className?: string;
}

const BookRowItem: React.FC<BookRowItemProps> = ({
  index,
  title,
  authors,
  publisher,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200/60 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-800/40 flex items-start gap-3.5 ${className}`}
    >
      <span className="font-bold text-color2 dark:text-purple-400 font-mono text-sm shrink-0 mt-0.5">
        {index}.
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[16verapx] font-bold text-[#000] dark:text-white leading-snug">
          {title}
        </h4>
        {authors && (
          <p className="text-md font-medium text-pri dark:text-gray-400 mt-1">
            {authors}
          </p>
        )}
        {publisher && (
          <p className="text-sm font-medium text-[#000] dark:text-pri mt-0.5">
            {publisher}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookRowItem;
