interface StatTabCardProps {
  icon: React.ReactNode;
  label: string;
  subLabel: string;
  count: any;
  active?: boolean;
  onClick?: () => void;
}

const StatTabCard = ({
  icon,
  label,
  subLabel,
  count,
  active,
  onClick,
}: StatTabCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col   justify-between rounded-2xl border p-5 transition-all duration-200 ${onClick && 'cursor-pointer'} ${
        active
          ? "border-transparent bg-[#7c3aed] text-white shadow-lg"
          : "border-gray-200 bg-white text-[#000] hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      }`}
    >
      <div className="flex flex-row justify-between gap-1">
       
        <span
          className={`text-3xl font-bold ${
            active ? "text-white" : "text-[#000] dark:text-white"
          }`}
        >
          {count}
        </span>
         {icon && <div className={`${active ? "text-[#fff] font-bold p-2 h-fit rounded-md" : "text-color2 bg-color2-l p-2 h-fit rounded-md "}`}>
          {icon}
        </div>}
      </div>

      <p
        className={`mt-2 text-lg font-bold ${
          active ? "text-white" : "text-[#000] dark:text-white"
        }`}
      >
        {label}
      </p>
      <p className={`text-[12px] ${active ? "text-white/80" : "text-pri"}`}>
        {subLabel}
      </p>
    </div>
  );
};

export default StatTabCard;
