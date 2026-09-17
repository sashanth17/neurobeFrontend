interface StepHeaderProps {
  title: string;
  description: string;
  pill?: string;
  pill2?: string
}

const StepHeader = ({ title, description, pill, pill2 }: StepHeaderProps) => {
  return (
    <div className="panel mb-5 border border-gray-200 px-6 py-5 dark:border-gray-700">
      <div className='flex items-center gap-2'>
        <h2 className="section-ti dark:text-white">{title}</h2>
        {pill &&
          <p className="text-xs text-color2 bg-color2-l p-1 px-1.5 rounded-lg font-bold">{pill}</p>
        }
        {pill2 &&
          <p className="text-xs text-green-dark btn-green-l p-1 px-1.5 rounded-lg font-bold">{pill2}</p>
        }
      </div>
      <p className="pt-1 text-sm text-pri">{description}</p>
    </div>
  );
};

export default StepHeader;
