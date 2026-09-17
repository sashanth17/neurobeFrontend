import { Settings2 } from "lucide-react";

const NeuroAIInfo = () => {
  return (
    <div className="panel mb-5 border-[0.5px] border-color2 px-6 py-4 dark:border-gray-700">
      <div className="mb-2 flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-color2" />
        <span className="text-sm font-bold  text-color2">NEURO AI</span>
      </div>
      <p className="text-sm text-[#000] dark:text-gray-300">
        AI will extract syllabus information including course details, L/T/P/C, course outcomes, knowledge levels, units, topics, hours, lab details, textbooks and reference books.
      </p>
      <p className="mt-2 text-sm font-medium text-color2 cursor-pointer hover:underline">
        You can review and edit the extracted information before approval.
      </p>
    </div>
  );
};

export default NeuroAIInfo;
