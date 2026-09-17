import { BookMarked } from "lucide-react";

interface Book {
  id: number;
  title: string;
  authors: string[];
  publisher: string;
  edition: string;
  publication_year: number;
  syllabus_id?: number;
}

interface TextbooksSummaryProps {
  textbook?: Book[];
  reference?: Book[];
}

const BookCard = ({ book, type }: { book: Book; type: "textbook" | "reference" }) => (
  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="mb-3 flex items-center justify-between">
      <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold ${
        type === "textbook"
          ? "bg-purple-50 text-color2 dark:bg-purple-900/20"
          : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
      }`}>
        {type === "textbook" ? "Textbook" : "Reference"}
      </span>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        {book.publication_year}
      </span>
    </div>

    <p className="font-bold text-[#000] dark:text-white text-sm mb-1">{book.title}</p>

    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
      <p>
        <span className="font-semibold text-gray-700 dark:text-gray-200">Author(s):</span>{" "}
        {Array.isArray(book.authors) ? book.authors.join(", ") : book.authors}
      </p>
      <p>
        <span className="font-semibold text-gray-700 dark:text-gray-200">Publisher:</span>{" "}
        {book.publisher}
      </p>
      <p>
        <span className="font-semibold text-gray-700 dark:text-gray-200">Edition:</span>{" "}
        {book.edition}
      </p>
    </div>
  </div>
);

const TextbooksSummary = ({
  textbook = [],
  reference = [],
}: TextbooksSummaryProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
          <BookMarked className="text-color2 h-4.5 w-4.5" />
        </div>
        <h3 className="text-lg font-bold text-color dark:text-white">Textbooks & Reference Books</h3>
      </div>

      {/* Textbooks Section */}
      {textbook.length > 0 && (
        <>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-color2">
            Textbooks ({textbook.length})
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {textbook.map((b) => (
              <BookCard key={b.id} book={b} type="textbook" />
            ))}
          </div>
        </>
      )}

      {/* Reference Books Section */}
      {reference.length > 0 && (
        <>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Reference Books ({reference.length})
          </p>
          <div className="grid grid-cols-2 gap-3">
            {reference.map((b) => (
              <BookCard key={b.id} book={b} type="reference" />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {textbook.length === 0 && reference.length === 0 && (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          No textbooks or reference books available
        </p>
      )}
    </div>
  );
};

export default TextbooksSummary;
